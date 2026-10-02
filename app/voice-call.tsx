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
  const [micMuted, setMicMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0); // live ref so endCall can read it

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
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

    return () => cleanup(false);
  }, []);

  const initWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // When remote audio arrives → start timer
      pc.ontrack = (event) => {
        const audio = new window.Audio();
        audio.srcObject = event.streams[0];
        audio.play().catch(() => {});
        setCallState('connected');
        startTimer();
      };

      // ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice',
            payload: { candidate: e.candidate, from: user.uid }
          });
        }
      };

      // Subscribe first, THEN send offer or wait
      const sig = supabase.channel(`call_${channelId}`);
      channelRef.current = sig;

      sig.on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sig.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, from: user.uid } });
        // Receiver: once answer is sent, consider connected and start timer
        setCallState('connected');
        startTimer();
      });

      sig.on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        // Caller: connected
        setCallState('connected');
        startTimer();
      });

      sig.on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (_) {}
      });

      sig.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        if (payload.from === user.uid) return;
        // Other side hung up
        endCall(true);
      });

      await sig.subscribe();

      if (!incoming) {
        // CALLER: send offer + ring receiver
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sig.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, from: user.uid } });

        // Ring the other user globally
        const ringChannel = supabase.channel(`user_calls_${otherUserUid}_${Date.now()}`);
        await ringChannel.subscribe();
        ringChannel.send({
          type: 'broadcast',
          event: 'incoming_call',
          payload: { callerUid: user.uid, channelId, conversationId: channelId }
        });
        setTimeout(() => supabase.removeChannel(ringChannel), 3000);
      }
      // RECEIVER: just wait for offer (subscribed above)

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not start voice call');
      router.back();
    }
  };

  const cleanup = (notify: boolean) => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (notify && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_ended',
        payload: { from: user.uid }
      });
    }
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  };

  const endCall = async (fromRemote = false) => {
    const finalDuration = durationRef.current;
    cleanup(!fromRemote);

    if (channelId) {
      if (finalDuration > 0) {
        const callLog = `📞 Voice call (${fmt(finalDuration)})`;
        await supabase.from('messages').insert({
          conversation_id: channelId,
          sender_uid: user.uid,
          text: callLog,
          is_read: false,
          type: 'text',
        }).catch(() => {});
        await supabase.from('conversations')
          .update({ last_message: callLog, last_message_at: new Date().toISOString() })
          .eq('id', channelId).catch(() => {});
      } else if (!incoming && callState === 'calling') {
        // Only caller logs missed call
        const missedLog = `📞 Missed voice call`;
        await supabase.from('messages').insert({
          conversation_id: channelId,
          sender_uid: user.uid,
          text: missedLog,
          is_read: false,
          type: 'text',
        }).catch(() => {});
        await supabase.from('conversations')
          .update({ last_message: missedLog, last_message_at: new Date().toISOString() })
          .eq('id', channelId).catch(() => {});
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
            ? (incoming ? 'Connected' : 'Calling...')
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
