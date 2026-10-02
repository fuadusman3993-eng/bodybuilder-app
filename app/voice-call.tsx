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
  const { channelId, otherUserUid } = useLocalSearchParams<{ channelId: string; otherUserUid: string }>();
  const { user } = useUserStore();

  const [otherName, setOtherName] = useState('...');
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [micMuted, setMicMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timer = useRef<any>(null);
  const channel = useRef<any>(null);

  useEffect(() => {
    // Fetch other user name
    if (otherUserUid) {
      getDoc(doc(db, 'users', otherUserUid)).then(snap => {
        if (snap.exists()) setOtherName(snap.data().name || 'User');
      });
    }

    if (Platform.OS === 'web') {
      initWebRTC();
    } else {
      // For native - show not supported yet
      Alert.alert('Voice Call', 'Voice calls are available on web. Native APK coming soon!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }

    return cleanup;
  }, []);

  const initWebRTC = async () => {
    try {
      // Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Play remote audio
      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
        setCallState('connected');
        timer.current = setInterval(() => setDuration(d => d + 1), 1000);
      };

      // Supabase Realtime as signaling server
      const sig = supabase.channel(`call_${channelId}`);
      channel.current = sig;

      sig.on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sig.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, from: user.uid } });
      });

      sig.on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      });

      sig.on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sig.send({ type: 'broadcast', event: 'ice', payload: { candidate: e.candidate, from: user.uid } });
        }
      };

      await sig.subscribe();

      // Create and send offer (caller)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sig.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, from: user.uid } });

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not start voice call');
      router.back();
    }
  };

  const cleanup = () => {
    clearInterval(timer.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (channel.current) supabase.removeChannel(channel.current);
  };

  const endCall = () => {
    cleanup();
    router.back();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicMuted(!track.enabled);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{otherName}</Text>
        <Text style={styles.status}>
          {callState === 'calling' ? 'Calling...' : callState === 'connected' ? fmt(duration) : 'Call Ended'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, micMuted && styles.btnActive]} onPress={toggleMic}>
          <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
          <Text style={styles.btnLabel}>{micMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.endBtn]} onPress={endCall}>
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
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: 26, fontWeight: '700', color: '#fff' },
  status: { fontSize: 16, color: '#888' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingBottom: 70 },
  btn: { alignItems: 'center', gap: 8, backgroundColor: '#262626', padding: 20, borderRadius: 50 },
  btnActive: { backgroundColor: '#3b82f6' },
  endBtn: { backgroundColor: '#ef4444' },
  btnLabel: { color: '#fff', fontSize: 12 },
});
