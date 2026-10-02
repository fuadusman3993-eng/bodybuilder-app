import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function GlobalCallListener() {
  const { user } = useUserStore();
  const router = useRouter();

  const [incomingCall, setIncomingCall] = useState<{
    callerUid: string;
    channelId: string;
    callerName: string;
  } | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const ch = supabase.channel(`user_calls_${user.uid}`)
      .on('broadcast', { event: 'incoming_call' }, async ({ payload }) => {
        // Fetch caller name from Firebase
        let callerName = 'Unknown';
        try {
          const snap = await getDoc(doc(db, 'users', payload.callerUid));
          if (snap.exists()) {
            const d = snap.data();
            callerName = d.name || d.displayName || d.username || 'User';
          }
        } catch (_) {}

        setIncomingCall({
          callerUid: payload.callerUid,
          channelId: payload.channelId || payload.conversationId,
          callerName,
        });
      })
      .on('broadcast', { event: 'cancel_call' }, ({ payload }) => {
        setIncomingCall(prev =>
          prev?.callerUid === payload.callerUid ? null : prev
        );
      })
      .on('broadcast', { event: 'call_ended' }, () => {
        setIncomingCall(null);
      })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [user?.uid]);

  const handleAccept = () => {
    if (!incomingCall) return;
    const { channelId, callerUid } = incomingCall;
    setIncomingCall(null); // close modal FIRST
    setTimeout(() => {
      router.push({
        pathname: '/voice-call',
        params: { channelId, otherUserUid: callerUid, isIncoming: 'true' },
      });
    }, 50);
  };

  const handleReject = () => {
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.subTitle}>Incoming Call</Text>
          <Text style={styles.callerName}>{incomingCall.callerName}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
              <Ionicons name="close" size={32} color="#fff" />
              <Text style={styles.btnLabel}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
              <Ionicons name="call" size={32} color="#fff" />
              <Text style={styles.btnLabel}>Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: '#1E293B', width: '80%', borderRadius: 24,
    padding: 32, alignItems: 'center',
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  subTitle: { color: '#94A3B8', fontSize: 14, marginBottom: 4 },
  callerName: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 36 },
  actions: { flexDirection: 'row', gap: 36 },
  btn: { alignItems: 'center', gap: 6, padding: 16, borderRadius: 50, minWidth: 70 },
  rejectBtn: { backgroundColor: '#ef4444' },
  acceptBtn: { backgroundColor: '#10b981' },
  btnLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
