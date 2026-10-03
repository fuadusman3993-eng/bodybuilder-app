import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function GlobalCallListener() {
  const { user } = useUserStore();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  const currentRouteRef = useRef(currentRoute);
  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  const [incomingCall, setIncomingCall] = useState<{
    callerUid: string;
    channelId: string;
    callerName: string;
    callerAvatar: string;
  } | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const ch = supabase.channel(`user_calls_${user.uid}`)
      .on('broadcast', { event: 'incoming_call' }, async ({ payload }) => {
        if (payload.callerUid === user.uid) return;
        if (currentRouteRef.current === 'voice-call') return;

        let callerName = 'User';
        let callerAvatar = '';
        try {
          const snap = await getDoc(doc(db, 'users', payload.callerUid));
          if (snap.exists()) {
            const d = snap.data();
            callerName = d.name || d.displayName || d.username || 'User';
            callerAvatar = d.avatar || d.photoURL || '';
          }
        } catch (_) {}

        setIncomingCall({
          callerUid: payload.callerUid,
          channelId: payload.channelId || payload.conversationId,
          callerName,
          callerAvatar,
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
    setIncomingCall(null);
    setTimeout(() => {
      router.push({
        pathname: '/voice-call',
        params: { channelId, otherUserUid: callerUid, isIncoming: 'true' },
      });
    }, 100);
  };

  const handleReject = () => {
    if (!incomingCall) return;
    const { channelId } = incomingCall;
    
    // Notify caller that we rejected by sending call_ended on the signaling channel
    const rejectCh = supabase.channel(`call_${channelId}`);
    rejectCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        rejectCh.send({
          type: 'broadcast',
          event: 'call_ended',
          payload: { from: user.uid }
        });
        setTimeout(() => supabase.removeChannel(rejectCh), 1000);
      }
    });

    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <Modal visible transparent={false} animationType="fade">
      <View style={styles.overlayFull}>
        <View style={styles.topSection}>
          <View style={styles.avatarWrapLarge}>
            {incomingCall.callerAvatar ? (
              <Image source={{ uri: incomingCall.callerAvatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{incomingCall.callerName[0]?.toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.callerNameLarge}>{incomingCall.callerName}</Text>
          <Text style={styles.subTitleLarge}>Incoming voice call...</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.actionBtnDecl} onPress={handleReject} activeOpacity={0.8}>
            <Ionicons name="close" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnAcc} onPress={handleAccept} activeOpacity={0.8}>
            <Ionicons name="call" size={32} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayFull: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', 
    justifyContent: 'space-between', 
    paddingVertical: 80, 
    alignItems: 'center' 
  },
  topSection: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  avatarWrapLarge: { 
    width: 160, height: 160, borderRadius: 80, 
    backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center', 
    borderWidth: 4, borderColor: '#00E676', marginBottom: 32, overflow: 'hidden',
    shadowColor: '#00E676', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: '#000', fontSize: 60, fontWeight: '800' },
  callerNameLarge: { color: '#FFF', fontSize: 36, fontWeight: '700', marginBottom: 12 },
  subTitleLarge: { color: '#00E676', fontSize: 18, fontWeight: '500', letterSpacing: 1 },
  bottomSection: { 
    flexDirection: 'row', gap: 70, marginBottom: 40 
  },
  actionBtnDecl: { 
    width: 76, height: 76, borderRadius: 38, 
    backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' 
  },
  actionBtnAcc: { 
    width: 76, height: 76, borderRadius: 38, 
    backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center' 
  },
});
