import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import BrandLogo from '../components/ui/BrandLogo';

let RTCView: any = null;
let mediaDevices: any = null;
let RTCPeerConnectionNative: any = null;
let RTCSessionDescriptionNative: any = null;
let RTCIceCandidateNative: any = null;

if (Platform.OS !== 'web') {
  try {
    const webrtc = require('react-native-webrtc');
    RTCView = webrtc.RTCView;
    mediaDevices = webrtc.mediaDevices;
    RTCPeerConnectionNative = webrtc.RTCPeerConnection;
    RTCSessionDescriptionNative = webrtc.RTCSessionDescription;
    RTCIceCandidateNative = webrtc.RTCIceCandidate;
  } catch (e) {
    console.log("react-native-webrtc not installed natively yet");
  }
}

// --- Agora Web SDK (Only loads on Web, prevents APK crashes) ---
let AgoraRTC: any = null;
if (Platform.OS === 'web') {
  try {
    AgoraRTC = require('agora-rtc-sdk-ng').default || require('agora-rtc-sdk-ng');
  } catch (e) {
    console.log("Agora SDK not available");
  }
}
const AGORA_APP_ID = '511e8cc7f06a4bd89ba9e4aad921c158';

export default function VoiceCallScreen() {
  const router = useRouter();
  const { channelId, otherUserUid, isIncoming } = useLocalSearchParams<{
    channelId: string;
    otherUserUid: string;
    isIncoming?: string;
  }>();
  const { user } = useUserStore();
  const incoming = isIncoming === 'true';

  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string }>({ name: 'User', avatar: '' });
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const callStateRef = useRef<'calling' | 'connected' | 'ended'>('calling');
  
  const [micMuted, setMicMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false); // Default to voice first
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);

  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  
  // Streams for UI rendering
  const [localStreamObj, setLocalStreamObj] = useState<any>(null);
  const [remoteStreamObj, setRemoteStreamObj] = useState<any>(null);

  const timerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  
  // HTML Video Refs for Web
  const webLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const webRemoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const endCallCalledRef = useRef(false);

  // Agora Refs
  const agoraClientRef = useRef<any>(null);
  const agoraLocalAudioTrackRef = useRef<any>(null);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const setCallConnected = () => {
    callStateRef.current = 'connected';
    setCallState('connected');
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
          });
        }
      }).catch(() => {});
    }

    initWebRTC();

    return () => { silentCleanup(); };
  }, []);



  const initWebRTC = async () => {
    // ────────────── AGORA IMPLEMENTATION FOR WEB ──────────────
    if (Platform.OS === 'web' && AgoraRTC) {
      try {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        agoraClientRef.current = client;

        client.on('user-published', async (remoteUser: any, mediaType: any) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === 'audio') {
            remoteUser.audioTrack.play();
          }
        });

        client.on('user-joined', () => {
          setCallConnected();
        });

        // Fetch a secure token from our Vercel serverless API
        let agoraToken: string | null = null;
        let agoraUid: number = 0;
        try {
          const tokenRes = await fetch(`/api/agora-token?channel=${channelId}&uid=0`);
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            agoraToken = tokenData.token;
            agoraUid = tokenData.uid || 0;
          }
        } catch (tokenErr) {
          console.warn('Token fetch failed, trying without token:', tokenErr);
        }

        // Join with token (or null for testing mode)
        await client.join(AGORA_APP_ID, channelId, agoraToken, agoraUid);

        // Create and publish local audio track
        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "speech_high_quality",
          AEC: true, // Echo cancellation
          ANS: true, // Noise suppression
          AGC: true  // Auto gain control
        });
        
        agoraLocalAudioTrackRef.current = localAudioTrack;
        await client.publish([localAudioTrack]);

        // If the other user is already in the channel, connect immediately
        if (client.remoteUsers.length > 0) {
          setCallConnected();
        }

        // We use Supabase signaling just for ringing/rejecting logic across apps
        const sig = supabase.channel(`call_${channelId}`);
        channelRef.current = sig;
        
        sig.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
          if (payload.from === user.uid) return;
          endCall(true);
        });

        sig.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            if (!incoming) {
              const ringCh = supabase.channel(`user_calls_${otherUserUid}`);
              ringCh.subscribe((rStatus) => {
                if (rStatus === 'SUBSCRIBED') {
                  ringCh.send({
                    type: 'broadcast',
                    event: 'incoming_call',
                    payload: { callerUid: user.uid, channelId, conversationId: channelId }
                  });
                  setTimeout(() => supabase.removeChannel(ringCh), 3000);
                }
              });
            }
          }
        });

      } catch (e: any) {
        console.error("Agora Web Error:", e);
        const errorMsg = e?.message || e?.name || JSON.stringify(e);
        
        if (typeof window !== 'undefined') {
          window.alert(`Agora Connection Failed:\n\n${errorMsg}\n\n(If it says INVALID_TOKEN or DYNAMIC_KEY_TIMEOUT, go to Agora Console and create a new project in TESTING MODE (App ID only), then update the APP ID in the code.)`);
        } else {
          Alert.alert('Call Error', `Agora Error: ${errorMsg}`);
        }
        
        router.back();
      }
      return;
    }

    // ────────────── EXISTING WEBRTC FOR NATIVE ──────────────
    const md = Platform.OS === 'web' ? navigator.mediaDevices : mediaDevices;
    if (!md) {
      Alert.alert('Update Required', 'To use calling on mobile, please build a new APK.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    try {
      const audioConstraints: any = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      };

      const stream = await md.getUserMedia({
        audio: audioConstraints,
        video: true,
      });
      localStreamRef.current = stream;
      setLocalStreamObj(stream);

      // Disable video by default to start as voice call
      stream.getVideoTracks().forEach((t: any) => t.enabled = false);

      const PeerConnection = Platform.OS === 'web' ? window.RTCPeerConnection : RTCPeerConnectionNative;
      const SessionDesc = Platform.OS === 'web' ? window.RTCSessionDescription : RTCSessionDescriptionNative;
      const IceCandidate = Platform.OS === 'web' ? window.RTCIceCandidate : RTCIceCandidateNative;

      const pc = new PeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:turn.cloudflare.com:3478',
            username: 'user',
            credential: 'user',
          },
          {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'e9a5cf73b2c9e09c2f3a8d1a',
            credential: 'NQjEQ0yJxVmGNxK+',
          },
          {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'e9a5cf73b2c9e09c2f3a8d1a',
            credential: 'NQjEQ0yJxVmGNxK+',
          },
          {
            urls: 'turn:a.relay.metered.ca:443?transport=tcp',
            username: 'e9a5cf73b2c9e09c2f3a8d1a',
            credential: 'NQjEQ0yJxVmGNxK+',
          },
          {
            urls: 'turns:a.relay.metered.ca:443?transport=tcp',
            username: 'e9a5cf73b2c9e09c2f3a8d1a',
            credential: 'NQjEQ0yJxVmGNxK+',
          },
          {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh',
          },
        ],
        iceTransportPolicy: 'all',
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      pc.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStreamObj(event.streams[0]);
        }
      };

      pc.onicecandidate = (e: any) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice',
            payload: { candidate: e.candidate, from: user.uid }
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('WebRTC connection state:', state);
        if (state === 'connected') setCallConnected();
      };

      const sig = supabase.channel(`call_${channelId}`);
      channelRef.current = sig;

      const iceCandidateBuffer: any[] = [];
      let remoteDescSet = false;

      const drainIceBuffer = async () => {
        while (iceCandidateBuffer.length > 0) {
          const candidate = iceCandidateBuffer.shift();
          try { await pc.addIceCandidate(new IceCandidate(candidate)); } catch (_) {}
        }
      };

      const setRemoteAndDrain = async (sdp: any) => {
        await pc.setRemoteDescription(new SessionDesc(sdp));
        remoteDescSet = true;
        await drainIceBuffer();
      };

      sig.on('broadcast', { event: 'receiver_ready' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sig.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, from: user.uid } });
        } catch (_) {}
      });

      sig.on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try {
          await setRemoteAndDrain(payload.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sig.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, from: user.uid } });
          setCallConnected();
        } catch (_) {}
      });

      sig.on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        try {
          await setRemoteAndDrain(payload.sdp);
          setCallConnected();
        } catch (_) {}
      });

      sig.on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.from === user.uid) return;
        if (!remoteDescSet) {
          iceCandidateBuffer.push(payload.candidate);
        } else {
          try { await pc.addIceCandidate(new IceCandidate(payload.candidate)); } catch (_) {}
        }
      });

      sig.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        if (payload.from === user.uid) return;
        endCall(true);
      });

      sig.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (!incoming) {
            const ringCh = supabase.channel(`user_calls_${otherUserUid}`);
            ringCh.subscribe((rStatus) => {
              if (rStatus === 'SUBSCRIBED') {
                ringCh.send({
                  type: 'broadcast',
                  event: 'incoming_call',
                  payload: { callerUid: user.uid, channelId, conversationId: channelId }
                });
                setTimeout(() => supabase.removeChannel(ringCh), 3000);
              }
            });
          } else {
            await sig.send({ type: 'broadcast', event: 'receiver_ready', payload: { from: user.uid } });
          }
        }
      });

    } catch (e: any) {
      Alert.alert('Camera Error', 'Could not access camera/mic');
      router.back();
    }
  };


  const silentCleanup = () => {
    clearInterval(timerRef.current);
    
    // Agora Cleanup
    if (agoraLocalAudioTrackRef.current) {
      agoraLocalAudioTrackRef.current.close();
      agoraLocalAudioTrackRef.current = null;
    }
    if (agoraClientRef.current) {
      agoraClientRef.current.leave();
      agoraClientRef.current = null;
    }

    // WebRTC Cleanup
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    pcRef.current?.close();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    setLocalStreamObj(null);
    setRemoteStreamObj(null);
  };

  const endCall = async (fromRemote = false) => {
    if (endCallCalledRef.current) return;
    endCallCalledRef.current = true;
    const finalDuration = durationRef.current;
    const finalState = callStateRef.current;

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

    if (channelId && !incoming) {
      try {
        if (finalDuration > 0) {
          const callLog = `📞 Voice/Video call (${fmt(finalDuration)})`;
          await supabase.from('messages').insert({
            conversation_id: channelId, sender_uid: user.uid,
            text: callLog, is_read: false, type: 'text',
          });
          await supabase.from('conversations').update({ last_message: callLog, last_message_at: new Date().toISOString() }).eq('id', channelId);
        } else if (finalState === 'calling') {
          const missedLog = `📞 Missed call`;
          await supabase.from('messages').insert({
            conversation_id: channelId, sender_uid: user.uid,
            text: missedLog, is_read: false, type: 'text',
          });
          await supabase.from('conversations').update({ last_message: missedLog, last_message_at: new Date().toISOString() }).eq('id', channelId);
        }
      } catch (e: any) { console.warn('Call log error:', e.message); }
    }
    router.back();
  };

  const toggleMic = () => {
    if (agoraLocalAudioTrackRef.current) {
      agoraLocalAudioTrackRef.current.setEnabled(micMuted);
      setMicMuted(!micMuted);
      return;
    }

    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    // Agora Video not yet implemented here, voice only for now
    if (agoraClientRef.current) return;

    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoOn(track.enabled);
    }
  };

  // Rendering Web Video or Native RTCView
  const renderVideoNode = (streamObj: any, isLocal: boolean) => {
    if (!streamObj) return null;
    
    if (Platform.OS === 'web') {
      return (
        <video
          autoPlay
          playsInline
          muted={isLocal}
          ref={(el) => {
            if (isLocal) webLocalVideoRef.current = el;
            else webRemoteVideoRef.current = el;
            
            if (el && streamObj) {
              el.srcObject = streamObj;
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      );
    } else if (RTCView) {
      return (
        <RTCView 
          streamURL={streamObj.toURL()} 
          style={{ width: '100%', height: '100%' }} 
          objectFit="cover" 
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Background: Remote Video (if on) or Dark Gradient */}
      <View style={styles.bgOverlay}>
        {remoteStreamObj ? renderVideoNode(remoteStreamObj, false) : (
          <View style={styles.darkBg} />
        )}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <BrandLogo size="small" />
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="settings-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="expand-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Content */}
        <View style={styles.centerSection}>
          {/* Main Avatar / Local Video Ring */}
          <View style={styles.avatarRingWrap}>
            <View style={styles.avatarRingInner}>
               {videoOn ? (
                 <View style={styles.localVideoWrap}>
                   {renderVideoNode(localStreamObj, true)}
                 </View>
               ) : otherUser.avatar ? (
                 <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
               ) : (
                 <View style={[styles.avatar, { backgroundColor: '#1A1D21', justifyContent: 'center', alignItems: 'center' }]}>
                   <Ionicons name="person" size={60} color="#333" />
                 </View>
               )}
            </View>
          </View>

          <Text style={styles.name}>{otherUser.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, callState === 'connected' ? { backgroundColor: '#00E676' } : { backgroundColor: '#FBBF24' }]} />
            <Text style={styles.statusText}>
              {callState === 'calling'
                ? (incoming ? 'Connecting...' : 'Calling...')
                : callState === 'connected'
                ? (duration > 0 ? fmt(duration) : 'Connected')
                : 'Ended'}
            </Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.roundBtn, videoOn && styles.roundBtnActive]} onPress={toggleVideo}>
            <Ionicons name={videoOn ? "videocam" : "videocam-outline"} size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.roundBtn, !micMuted && styles.roundBtnActive]} onPress={toggleMic}>
            <Ionicons name={micMuted ? "mic-off-outline" : "mic"} size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.roundBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.endCallBtn} onPress={() => endCall(false)}>
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030508' }, // Deep dark background
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  darkBg: {
    flex: 1,
    backgroundColor: '#030508',
  },
  safeArea: { flex: 1, justifyContent: 'space-between', zIndex: 1 },

  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 24, paddingTop: 16 
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoIcon: { color: '#00E676', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  logoText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  
  headerRight: { flexDirection: 'row', gap: 12 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },

  // Center
  centerSection: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  
  avatarRingWrap: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24
  },
  avatarRingInner: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 3, borderColor: '#00E676',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#00E676', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 10
  },
  avatar: { width: '100%', height: '100%' },
  localVideoWrap: { width: '100%', height: '100%', backgroundColor: '#000' },

  name: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 16, color: '#A0A0A0' },

  // Bottom Controls
  controlsRow: { 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, 
    paddingBottom: 40 
  },
  roundBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.4)'
  },
  roundBtnActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676'
  },
  endCallBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    elevation: 5
  },
});
