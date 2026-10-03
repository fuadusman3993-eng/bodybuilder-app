import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
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

  const [otherName, setOtherName] = useState('...');
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const callStateRef = useRef<'calling' | 'connected' | 'ended'>('calling'); // fix stale closure
  const [micMuted, setMicMuted] = useState(false);
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
          setOtherName(d.name || d.displayName || d.username || 'User');
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
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{otherName}</Text>
        <Text style={styles.status}>
          {callState === 'calling'
            ? (incoming ? 'Connecting...' : 'Calling...')
            : callState === 'connected'
            ? fmt(duration)
            : 'Call Ended'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, micMuted && styles.btnMuted]} onPress={toggleMic}>
          <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
          <Text style={styles.btnLabel}>{micMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.endBtn]} onPress={() => endCall(false)}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.btnLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'space-between' },
  topSection: { alignItems: 'center', marginTop: 120, gap: 16 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 26, fontWeight: '700', color: '#fff' },
  status: { fontSize: 16, color: '#888' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingBottom: 70 },
  btn: { alignItems: 'center', gap: 8, backgroundColor: '#262626', padding: 20, borderRadius: 50 },
  btnMuted: { backgroundColor: '#3b82f6' },
  endBtn: { backgroundColor: '#ef4444' },
  btnLabel: { color: '#fff', fontSize: 12 },
});
