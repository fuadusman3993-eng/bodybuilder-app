import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Audio } from 'expo-av';

export default function GlobalCallListener() {
  const { user } = useUserStore();
  const router = useRouter();
  
  const [incomingCall, setIncomingCall] = useState<{
    callerUid: string;
    channelId: string;
    callerName: string;
  } | null>(null);

  const ringtoneRef = React.useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!user.uid) return;

    // Listen to ALL calls matching this user's uid as recipient
    const channel = supabase.channel(`user_calls_${user.uid}`)
      .on('broadcast', { event: 'incoming_call' }, async ({ payload }) => {
        // Someone is calling ME!
        const callerName = await fetchCallerName(payload.callerUid);
        setIncomingCall({
          callerUid: payload.callerUid,
          channelId: payload.channelId,
          callerName
        });
        playRingtone();
      })
      .on('broadcast', { event: 'cancel_call' }, ({ payload }) => {
        // Caller hung up before we answered
        if (incomingCall?.callerUid === payload.callerUid) {
          stopRingtone();
          setIncomingCall(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRingtone();
    };
  }, [user.uid, incomingCall]);

  const fetchCallerName = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) return snap.data().name || 'User';
    } catch (_) {}
    return 'Someone';
  };

  const playRingtone = async () => {
    // Basic beep for ringtone (you can add a real mp3 later)
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    } catch(e) {}
  };

  const stopRingtone = async () => {
    // stop sound if we had one
  };

  const handleAccept = () => {
    stopRingtone();
    const callData = incomingCall;
    setIncomingCall(null);
    if (callData) {
      router.push({
        pathname: '/voice-call',
        params: { channelId: callData.channelId, otherUserUid: callData.callerUid, isIncoming: 'true' }
      });
    }
  };

  const handleReject = () => {
    stopRingtone();
    setIncomingCall(null);
    // Could send a 'call_rejected' broadcast back if we want
  };

  if (!incomingCall) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Incoming Call</Text>
          <Text style={styles.name}>{incomingCall.callerName}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
              <Ionicons name="call" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80
  },
  card: {
    backgroundColor: '#1E293B', width: '85%', borderRadius: 24,
    padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000',
    shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  title: { color: '#94A3B8', fontSize: 14, marginBottom: 4 },
  name: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 30 },
  actions: { flexDirection: 'row', gap: 40 },
  btn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { backgroundColor: '#ef4444' },
  acceptBtn: { backgroundColor: '#10b981' }
});
