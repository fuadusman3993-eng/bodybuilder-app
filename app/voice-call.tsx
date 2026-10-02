import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { createAgoraRtcEngine, IRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { useUserStore } from '../store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const APP_ID = '413c591a2d4341b184a0a45909792cdc'; // Agora App ID

export default function VoiceCallScreen() {
  const router = useRouter();
  const { channelId, otherUserUid } = useLocalSearchParams<{ channelId: string; otherUserUid: string }>();
  const { user } = useUserStore();
  
  const [joined, setJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [otherUser, setOtherUser] = useState<{name: string}>({ name: 'Calling...' });
  const [callDuration, setCallDuration] = useState(0);

  const engine = useRef<IRtcEngine | null>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    // Get caller info
    if (otherUserUid) {
      getDoc(doc(db, 'users', otherUserUid)).then(snap => {
        if (snap.exists()) setOtherUser({ name: snap.data().name || 'User' });
      });
    }

    initAgora();

    return () => {
      clearInterval(timer.current);
      if (engine.current) {
        engine.current.leaveChannel();
        engine.current.release();
      }
    };
  }, []);

  const initAgora = async () => {
    try {
      // Request mic permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone is required for voice calls.');
        router.back();
        return;
      }

      engine.current = createAgoraRtcEngine();
      engine.current.initialize({ appId: APP_ID });

      engine.current.addListener('onJoinChannelSuccess', () => {
        setJoined(true);
        // Start duration timer
        timer.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      });

      engine.current.addListener('onUserJoined', (connection, uid) => {
        console.log('User Joined:', uid);
      });

      engine.current.addListener('onUserOffline', () => {
        Alert.alert('Call Ended', 'The other person left the call.', [{ text: 'OK', onPress: () => router.back() }]);
      });

      // Join channel
      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      engine.current.joinChannel('', channelId, Number(user.uid.replace(/\D/g, '').substring(0, 9)) || 1, {});

    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Failed to start call');
      router.back();
    }
  };

  const toggleMic = () => {
    setMicMuted(!micMuted);
    engine.current?.muteLocalAudioStream(!micMuted);
  };

  const toggleSpeaker = () => {
    setSpeaker(!speaker);
    engine.current?.setEnableSpeakerphone(!speaker);
  };

  const endCall = () => {
    engine.current?.leaveChannel();
    router.back();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Ionicons name="person-circle-outline" size={120} color="#fff" style={{ opacity: 0.8 }} />
        <Text style={styles.name}>{otherUser.name}</Text>
        <Text style={styles.status}>
          {joined ? formatTime(callDuration) : 'Connecting...'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, !micMuted && styles.controlBtnActive]} onPress={toggleMic}>
          <Ionicons name={micMuted ? "mic-off" : "mic"} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, speaker && styles.controlBtnActive]} onPress={toggleSpeaker}>
          <Ionicons name={speaker ? "volume-high" : "volume-medium"} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between' },
  topSection: { alignItems: 'center', marginTop: 100 },
  name: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 20 },
  status: { fontSize: 16, color: '#A8A8A8', marginTop: 10 },
  controls: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: 60, paddingHorizontal: 20 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  endCallBtn: { backgroundColor: '#ef4444' }
});
