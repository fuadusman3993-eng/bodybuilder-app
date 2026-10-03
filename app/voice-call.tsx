import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';

export default function VoiceCallScreen() {
  const router = useRouter();
  const { channelId, otherUserUid, isIncoming } = useLocalSearchParams<{
    channelId: string;
    otherUserUid: string;
    isIncoming?: string;
  }>();
  const { user } = useUserStore();
  const incoming = isIncoming === 'true';

  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string; isCoach?: boolean }>({ name: '...', avatar: '' });
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const callStateRef = useRef<'calling' | 'connected' | 'ended'>('calling'); // fix stale closure
  const [micMuted, setMicMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const endCallCalledRef = useRef(false); // prevent double endCall

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const setCallConnected = () => {
    callStateRef.current = 'connected';
    setCallState('connected');
    // Start timer immediately on connection
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(d => d + 1);
    }, 1000);
  };

  useEffect(() => {
    if (otherUserUid) {
      getDoc(doc(db, 'users', otherUserUid)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setOtherUser({ 
            name: d.name || d.displayName || d.username || 'User',
            avatar: d.avatar || d.photoURL || '',
            isCoach: d.role === 'coach'
          });
        }
      }).catch(() => {});
    }

    if (Platform.OS === 'web') {
      initWebRTC();
    } else {
      Alert.alert('Voice Call', 'Voice calls work in the web app. APK support coming soon!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }

    return () => { silentCleanup(); };
  }, []);

  const initWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Play remote audio if WebRTC peer actually connects
      pc.ontrack = (event) => {
        try {
          const audio = new window.Audio();
          audio.srcObject = event.streams[0];
          audio.play().catch(() => {});
        } catch (_) {}
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice',
            payload: { candidate: e.candidate, from: user.uid }
          });
        }
      };

      const sig = supabase.channel(`call_${channelId}`);
      channelRef.current = sig;

      // RECEIVER: gets offer → sends answer → start timer immediately
      sig.on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sig.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, from: user.uid } });
          // Connected! Start timer on receiver side
          setCallConnected();
        } catch (_) {}
      });

      // CALLER: gets answer → start timer immediately
      sig.on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          // Connected! Start timer on caller side
          setCallConnected();
        } catch (_) {}
      });

      sig.on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (_) {}
      });

      sig.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        if (payload.from === user.uid) return;
        endCall(true);
      });

      await sig.subscribe();

      if (!incoming) {
        // CALLER: send offer then ring the other person
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sig.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, from: user.uid } });

        // Ring the receiver (wait until SUBSCRIBED)
        const ringCh = supabase.channel(`user_calls_${otherUserUid}_${Date.now()}`);
        ringCh.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            ringCh.send({
              type: 'broadcast',
              event: 'incoming_call',
              payload: { callerUid: user.uid, channelId, conversationId: channelId }
            });
            setTimeout(() => supabase.removeChannel(ringCh), 5000);
          }
        });
      }
      // RECEIVER: already subscribed above, waiting for offer

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not start voice call');
      router.back();
    }
  };

  // Silent cleanup on unmount (no notify, no log)
  const silentCleanup = () => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  };

  const endCall = async (fromRemote = false) => {
    if (endCallCalledRef.current) return;
    endCallCalledRef.current = true;

    const finalDuration = durationRef.current;
    const finalState = callStateRef.current;

    // Notify the other side we hung up
    if (!fromRemote && channelRef.current) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'call_ended',
          payload: { from: user.uid }
        });
      } catch (_) {}
    }

    silentCleanup();

    // Save call log to chat database — ONLY CALLER logs (to prevent duplicate messages)
    if (channelId && !incoming) {
      try {
        if (finalDuration > 0) {
          const callLog = `📞 Voice call (${fmt(finalDuration)})`;
          await supabase.from('messages').insert({
            conversation_id: channelId,
            sender_uid: user.uid,
            text: callLog,
            is_read: false,
            type: 'text',
          });
          await supabase.from('conversations')
            .update({ last_message: callLog, last_message_at: new Date().toISOString() })
            .eq('id', channelId);
        } else if (finalState === 'calling') {
          // Caller logs missed call (receiver didn't pick up)
          const missedLog = `📞 Missed voice call`;
          await supabase.from('messages').insert({
            conversation_id: channelId,
            sender_uid: user.uid,
            text: missedLog,
            is_read: false,
            type: 'text',
          });
          await supabase.from('conversations')
            .update({ last_message: missedLog, last_message_at: new Date().toISOString() })
            .eq('id', channelId);
        }
      } catch (e: any) {
        console.warn('Call log error:', e.message);
      }
    }

    router.back();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicMuted(!track.enabled);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background overlay (Mock shows dark gym bg, we use dark green gradient approx) */}
      <View style={styles.bgOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => endCall(false)}>
            <Ionicons name="chevron-down" size={32} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Ionicons name="shield-checkmark" size={18} color="#00E676" />
            <Text style={styles.headerTitle}>Video Call</Text>
          </View>
          {callState === 'connected' && (
            <Text style={styles.headerTime}>{fmt(duration)}</Text>
          )}
        </View>

        {/* Center Content */}
        <View style={styles.centerSection}>
          <View style={styles.avatarRing}>
            {otherUser.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={60} color="#333" />
              </View>
            )}
            <View style={styles.logoBadge}>
               <Text style={styles.logoBadgeText}>F</Text>
            </View>
          </View>

          <Text style={styles.name}>{otherUser.name}</Text>
          <Text style={styles.status}>
            {callState === 'calling'
              ? (incoming ? 'Connecting...' : 'Calling...')
              : callState === 'connected'
              ? 'Connected'
              : 'Call Ended'}
          </Text>

          <View style={styles.badgesRow}>
            {otherUser.isCoach && (
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={12} color="#FBBF24" />
                <Text style={styles.badgeText}>Coach</Text>
              </View>
            )}
            <View style={styles.badge}>
              <View style={styles.onlineDot} />
              <Text style={styles.badgeText}>Online</Text>
            </View>
            {otherUser.isCoach && (
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={styles.badgeText}>Certified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controlsArea}>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleMic}>
              <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={26} color="#FFF" />
              <Text style={styles.iconLabel}>{micMuted ? 'Muted' : 'Mic'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => setSpeakerOn(!speakerOn)}>
              <Ionicons name={speakerOn ? 'volume-high' : 'volume-medium'} size={26} color="#FFF" />
              <Text style={styles.iconLabel}>Speaker</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="videocam" size={26} color="#FFF" />
              <Text style={styles.iconLabel}>Camera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.endCallBtn} onPress={() => endCall(false)}>
            <Ionicons name="call" size={32} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <Text style={styles.footerText}>Better Coaching. Better You.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050a07' },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1a10',
    opacity: 0.6,
  },
  safeArea: { flex: 1, justifyContent: 'space-between' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  headerTime: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  centerSection: { alignItems: 'center', marginTop: 40 },
  avatarRing: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 3, borderColor: '#00E676',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, position: 'relative'
  },
  avatar: { width: 140, height: 140, borderRadius: 70 },
  logoBadge: {
    position: 'absolute', top: -10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#050a07'
  },
  logoBadgeText: { color: '#000', fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
  
  name: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  status: { fontSize: 18, color: '#A0A0A0', marginBottom: 20 },

  badgesRow: { flexDirection: 'row', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#E2E8F0', fontSize: 12, fontWeight: '500' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676' },

  controlsArea: { alignItems: 'center', paddingBottom: 30 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 40, paddingHorizontal: 20 },
  iconBtn: { alignItems: 'center', gap: 10 },
  iconLabel: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  
  endCallBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 40,
    elevation: 5, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8
  },

  footerText: { color: '#F59E0B', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
});
