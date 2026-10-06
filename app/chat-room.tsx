import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { usePresenceStore } from '../store/presenceStore';
import { Colors } from '../constants/colors';

// expo-av only imported on native
let Audio: any = null;
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio;
}

import * as ImagePicker from 'expo-image-picker';

const BG = '#0A0F1A';

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtSecs(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

import { useCachedState } from '../lib/useCachedState';

export default function ChatRoom() {
  const router = useRouter();
  const { conversationId, otherUserUid } = useLocalSearchParams<{ conversationId: string; otherUserUid: string }>();
  const { user } = useUserStore();

  const [messages, setMessages, cacheLoaded] = useCachedState<any[]>(conversationId ? `msgs_${conversationId}` : '', []);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Hide loading spinner if cache loaded and has items
  if (cacheLoaded && messages.length > 0 && loading) {
    setLoading(false);
  }

  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string; isCoach?: boolean }>({ name: '...', avatar: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const isOnline = usePresenceStore(s => s.onlineUsers[otherUserUid]) || false;

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const recDotAnim = useRef(new Animated.Value(1)).current;
  // Animated waveform bars for recording UI
  const waveAnims = useRef(Array.from({ length: 28 }, () => new Animated.Value(8))).current;

  // Native: expo-av
  const nativeRecordingRef = useRef<any>(null);
  // Web: MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1); // <--- Speed toggle
  const nativeSoundRef = useRef<any>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  const flatRef = useRef<FlatList>(null);
  const webImageInputRef = useRef<any>(null);
  const webVideoInputRef = useRef<any>(null);

  // Fetch other user info
  useEffect(() => {
    if (!otherUserUid) return;
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
  }, [otherUserUid]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (error || !data) {
      setLoading(false);
      return; // Keep cached messages intact if offline/error
    }
    
    setMessages(data);
    setLoading(false);
    if (user.uid) {
      supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_uid', user.uid).then();
    }
  }, [conversationId, user.uid]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`messages_${conversationId}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => {
          // If we already have this exact ID, skip
          if (prev.some(m => m.id === payload.new.id)) return prev;
          // Remove any optimistic (temp) message with same sender+type+text to avoid duplicates
          const withoutOptimistic = prev.filter(m => {
            if (!m.isUploading) return true;
            const sameType = m.type === payload.new.type;
            const sameSender = m.sender_uid === payload.new.sender_uid;
            return !(sameType && sameSender);
          });
          return [...withoutOptimistic, payload.new];
        });
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        if (payload.new.sender_uid !== user.uid) {
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading]);

  // Keep sendMedia accessible in DOM event handlers without stale closure
  const sendMediaRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const imgInput = document.createElement('input');
    imgInput.type = 'file';
    imgInput.accept = 'image/*';
    imgInput.style.display = 'none';
    imgInput.addEventListener('change', async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          await sendMediaRef.current(URL.createObjectURL(file), 'image', file.type || 'image/jpeg', file);
        } catch (err: any) {
          window.alert('Upload error: ' + (err.message || 'Unknown error'));
        }
      }
      imgInput.value = '';
    });
    document.body.appendChild(imgInput);
    webImageInputRef.current = imgInput;

    const vidInput = document.createElement('input');
    vidInput.type = 'file';
    vidInput.accept = 'video/*';
    vidInput.style.display = 'none';
    vidInput.addEventListener('change', async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          await sendMediaRef.current(URL.createObjectURL(file), 'video', file.type || 'video/mp4', file);
        } catch (err: any) {
          window.alert('Upload error: ' + (err.message || 'Unknown error'));
        }
      }
      vidInput.value = '';
    });
    document.body.appendChild(vidInput);
    webVideoInputRef.current = vidInput;

    return () => { imgInput.remove(); vidInput.remove(); };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const animations = waveAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 6 + Math.abs(Math.sin(i * 0.8)) * 22,
              duration: 280 + (i % 5) * 60,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 4,
              duration: 280 + (i % 5) * 60,
              useNativeDriver: false,
            }),
          ])
        )
      );
      Animated.parallel(animations).start();
    } else {
      waveAnims.forEach(a => { a.stopAnimation(); a.setValue(8); });
      recDotAnim.stopAnimation();
      recDotAnim.setValue(1);
    }
  }, [isRecording]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversationId) return;
    setSending(true);
    setText('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_uid: user.uid,
      text: trimmed,
      is_read: false,
      type: 'text',
    });
    if (error) {
      Alert.alert('Send Error', error.message);
    } else {
      await supabase.from('conversations')
        .update({ last_message: trimmed, last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }
    setSending(false);
  };

  const startRecordingWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      Alert.alert('Error', 'Microphone access denied');
    }
  };

  const stopAndSendWeb = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    clearInterval(recordingTimerRef.current);
    const dur = recordingSecs;
    setIsRecording(false);

    const recordedMime = mr.mimeType || 'audio/webm';
    const ext = recordedMime.includes('ogg') ? 'ogg' : 'webm';

    mr.onstop = async () => {
      const tempId = `temp_${Date.now()}`;
      try {
        const blob = new Blob(audioChunksRef.current, { type: recordedMime });
        const localUrl = URL.createObjectURL(blob);

        const optimisticMsg: any = {
          id: tempId,
          conversation_id: conversationId,
          sender_uid: user.uid,
          text: '🎤 Voice message',
          audio_url: localUrl,
          audio_duration: dur,
          type: 'audio',
          is_read: false,
          created_at: new Date().toISOString(),
          isUploading: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

        const fileName = `voice_${user.uid}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('voice-messages')
          .upload(fileName, blob, { contentType: recordedMime, upsert: true });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(fileName);

        const { data: insertedMsg, error: insertErr } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_uid: user.uid,
          text: '🎤 Voice message',
          audio_url: urlData.publicUrl,
          audio_duration: dur,
          is_read: false,
          type: 'audio',
        }).select().single();

        if (insertErr) throw insertErr;

        setMessages(prev => prev.map(m => m.id === tempId ? insertedMsg : m));

        await supabase.from('conversations')
          .update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      } catch (e: any) {
        Alert.alert('Upload Error', JSON.stringify(e) + (e.message ? ' - ' + e.message : ''));
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    };

    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
  };

  const cancelRecordingWeb = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    clearInterval(recordingTimerRef.current);
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSecs(0);
  };

  const startRecordingNative = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      nativeRecordingRef.current = recording;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      Alert.alert('Error', 'Microphone access denied');
    }
  };

  const stopAndSendNative = async () => {
    const rec = nativeRecordingRef.current;
    if (!rec) return;
    clearInterval(recordingTimerRef.current);
    const dur = recordingSecs;
    setIsRecording(false);
    
    let tempId: string | null = null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      nativeRecordingRef.current = null;
      if (!uri) throw new Error('No audio URI');
      
      tempId = `temp_${Date.now()}`;
      const optimisticMsg: any = {
        id: tempId,
        conversation_id: conversationId,
        sender_uid: user.uid,
        text: '🎤 Voice message',
        audio_url: uri,
        audio_duration: dur,
        type: 'audio',
        is_read: false,
        created_at: new Date().toISOString(),
        isUploading: true,
      };
      setMessages(prev => [...prev, optimisticMsg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `voice_${user.uid}_${Date.now()}.m4a`;
      const { error: upErr } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, blob, { contentType: 'audio/m4a', upsert: true });
      if (upErr) throw upErr;
      
      const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(fileName);
      
      const { data: insertedMsg, error: insertErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_uid: user.uid,
        text: '🎤 Voice message',
        audio_url: urlData.publicUrl,
        audio_duration: dur,
        is_read: false,
        type: 'audio',
      }).select().single();
      
      if (insertErr) throw insertErr;

      setMessages(prev => prev.map(m => m.id === tempId ? insertedMsg : m));
      
      await supabase.from('conversations')
        .update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send');
      if (tempId) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
  };

  const cancelRecordingNative = async () => {
    const rec = nativeRecordingRef.current;
    if (!rec) return;
    clearInterval(recordingTimerRef.current);
    await rec.stopAndUnloadAsync().catch(() => {});
    nativeRecordingRef.current = null;
    setIsRecording(false);
    setRecordingSecs(0);
  };

  const startRecording = Platform.OS === 'web' ? startRecordingWeb : startRecordingNative;
  const stopAndSend = Platform.OS === 'web' ? stopAndSendWeb : stopAndSendNative;
  const cancelRecording = Platform.OS === 'web' ? cancelRecordingWeb : cancelRecordingNative;

  // ─── Media Upload ───────────────────────────────────────────
  const sendMedia = async (uri: string, type: 'image' | 'video', mimeType: string) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: any = {
      id: tempId,
      conversation_id: conversationId,
      sender_uid: user.uid,
      text: type === 'image' ? '📷 Photo' : '🎥 Video',
      media_url: uri,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
      isUploading: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const ext = mimeType.split('/')[1]?.split(';')[0] || (type === 'image' ? 'jpg' : 'mp4');
      const fileName = `media_${user.uid}_${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const blobToUpload = await response.blob();

      const { error: upErr } = await supabase.storage
        .from('chat-media')
        .upload(fileName, blobToUpload, { contentType: mimeType, upsert: true });
      if (upErr) throw upErr;
      
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

      const { data: insertedMsg, error: insertErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_uid: user.uid,
        text: type === 'image' ? '📷 Photo' : '🎥 Video',
        media_url: urlData.publicUrl,
        is_read: false,
        type,
      }).select().single();

      if (insertErr) throw insertErr;

      setMessages(prev => prev.map(m => m.id === tempId ? insertedMsg : m));

      await supabase.from('conversations')
        .update({ last_message: type === 'image' ? '📷 Photo' : '🎥 Video', last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (e: any) {
      console.error('Upload Error:', e);
      if (Platform.OS === 'web') {
        window.alert('ERROR DETECTED: ' + (e.message || JSON.stringify(e)));
      } else {
        Alert.alert('Upload Error', e.message || 'Could not upload file');
      }
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };
  // Always keep ref in sync with latest sendMedia (avoids stale closure in DOM handlers)
  sendMediaRef.current = sendMedia;

  const pickMedia = (type: 'image' | 'video') => {
    setShowAttachMenu(false);
    // Wait for modal to close, then trigger the always-mounted hidden input
    setTimeout(() => {
      if (Platform.OS === 'web') {
        if (type === 'image') webImageInputRef.current?.click();
        else webVideoInputRef.current?.click();
        return;
      }
      // Native: use ImagePicker
      (async () => {
        try {
          if (!ImagePicker) throw new Error('ImagePicker not loaded');
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
            quality: 0.8,
            allowsEditing: false,
          });
          if (result.canceled || !result.assets?.[0]) return;
          const asset = result.assets[0];
          const mimeType = asset.mimeType || (type === 'image' ? 'image/jpeg' : 'video/mp4');
          await sendMedia(asset.uri, type, mimeType, (asset as any).file ?? undefined);
        } catch (e: any) {
          console.error('Picker error:', e);
          Alert.alert('Error', e.message || 'Could not pick media');
        }
      })();
    }, 150);
  };

  const pickImage = () => pickMedia('image');
  const pickVideo = () => pickMedia('video');
  // ────────────────────────────────────────────────────────────

  const togglePlaybackRate = () => {
    const next: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(next);
    if (webAudioRef.current) webAudioRef.current.playbackRate = next;
    if (nativeSoundRef.current) nativeSoundRef.current.setRateAsync?.(next, true);
  };

  const togglePlay = async (id: string, audioUrl: string) => {
    if (Platform.OS === 'web') {
      if (playingId === id) {
        webAudioRef.current?.pause();
        webAudioRef.current = null;
        setPlayingId(null);
        setPlaybackPosition(0);
        return;
      }
      webAudioRef.current?.pause();
      const audio = new window.Audio(audioUrl);
      audio.playbackRate = playbackRate;
      webAudioRef.current = audio;
      setPlayingId(id);
      setPlaybackPosition(0);
      audio.play();
      
      // Update timer live
      audio.ontimeupdate = () => {
        setPlaybackPosition(audio.currentTime);
      };
      
      audio.onended = () => { 
        setPlayingId(null); 
        setPlaybackPosition(0);
        webAudioRef.current = null; 
      };
    } else {
      if (playingId === id) {
        await nativeSoundRef.current?.stopAsync();
        await nativeSoundRef.current?.unloadAsync();
        nativeSoundRef.current = null;
        setPlayingId(null);
        setPlaybackPosition(0);
        return;
      }
      if (nativeSoundRef.current) {
        await nativeSoundRef.current.stopAsync();
        await nativeSoundRef.current.unloadAsync();
        nativeSoundRef.current = null;
      }
      setPlayingId(id);
      setPlaybackPosition(0);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true, progressUpdateIntervalMillis: 100 });
      nativeSoundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setPlayingId(null);
            setPlaybackPosition(0);
            sound.unloadAsync();
            nativeSoundRef.current = null;
          }
        }
      });
    }
  };

  const handleDeleteConversation = () => {
    Alert.alert('Delete Conversation', 'Permanently delete all messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setShowSettings(false);
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
        await supabase.from('conversations').delete().eq('id', conversationId);
        router.back();
      }},
    ]);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_uid === user.uid;
    const isAudio = item.type === 'audio' && item.audio_url;
    const isImage = item.type === 'image' && item.media_url;
    const isVideo = item.type === 'video' && item.media_url;
    const isPlaying = playingId === item.id;
    const displayDuration = isPlaying ? Math.floor(playbackPosition) : (item.audio_duration || 0);
    const progressRatio = isPlaying && item.audio_duration ? playbackPosition / item.audio_duration : 0;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={styles.avatarSmall}>
            {otherUser.avatar
              ? <Image source={{ uri: otherUser.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarInitial}>{otherUser.name[0]?.toUpperCase()}</Text>}
          </View>
        )}
        <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            {isAudio ? (
              <View style={[item.isUploading && { opacity: 0.6 }]}>
                <View style={styles.audioRow}>
                  {item.isUploading ? (
                    <View style={styles.playIconWrap}>
                      <ActivityIndicator size="small" color="#00E676" />
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.playIconWrap} onPress={() => togglePlay(item.id, item.audio_url)}>
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#000" />
                    </TouchableOpacity>
                  )}
                  <View style={styles.audioWave}>
                    {[...Array(20)].map((_, i) => {
                      const isPlayed = (i / 20) <= progressRatio;
                      return (
                        <View
                          key={i}
                          style={[styles.audioBar, {
                            height: 6 + Math.abs(Math.sin(i * 0.9 + 1) * 12),
                            backgroundColor: isPlayed ? (isMe ? '#FFF' : '#00E676') : (isMe ? 'rgba(255,255,255,0.3)' : 'rgba(0,230,118,0.3)')
                          }]}
                        />
                      );
                    })}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={styles.audioDurMe}>{fmtSecs(displayDuration)}</Text>
                  {isPlaying && (
                    <TouchableOpacity onPress={togglePlaybackRate} style={styles.speedBtn}>
                      <Text style={styles.speedBtnText}>{playbackRate}x</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : isImage ? (
              <TouchableOpacity onPress={() => item.isUploading ? null : setFullscreenImg(item.media_url)} activeOpacity={0.9} style={{ position: 'relative' }}>
                <Image
                  source={{ uri: item.media_url }}
                  style={[styles.mediaBubble, item.isUploading && { opacity: 0.5 }]}
                  resizeMode="cover"
                />
                {item.isUploading && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#00E676" />
                  </View>
                )}
              </TouchableOpacity>
            ) : isVideo ? (
              <View style={[styles.videoBubbleWrap, item.isUploading && { opacity: 0.5 }]}>
                {item.isUploading ? (
                   <ActivityIndicator size="large" color="#00E676" />
                ) : (
                   <Ionicons name="play-circle" size={52} color="#00E676" />
                )}
                <Text style={{ color: '#A0A0A0', fontSize: 12, marginTop: 4 }}>{item.isUploading ? 'Uploading...' : 'Video'}</Text>
              </View>
            ) : (
              <Text style={styles.bubbleText}>
                {item.text}
              </Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.timeLabel}>{timeStr(item.created_at)}</Text>
            {isMe && (
              item.isUploading ? (
                <ActivityIndicator size={12} color="#00E676" style={{ marginLeft: 4 }} />
              ) : (
                <Text style={[styles.seenTick, item.is_read ? styles.seenRead : styles.seenSent]}>
                  {item.is_read ? '✓✓' : '✓'}
                </Text>
              )
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => router.push({ pathname: '/user-profile', params: { uid: otherUserUid } })}
          activeOpacity={0.8}
        >
          <View style={styles.headerAvatarWrap}>
            {otherUser.avatar
              ? <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
              : <View style={styles.headerAvatarPlaceholder}><Text style={styles.headerInitial}>{otherUser.name[0]?.toUpperCase()}</Text></View>}
          </View>
          <View style={styles.headerNameCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.headerName}>{otherUser.name}</Text>
              {otherUser.isCoach && <Ionicons name="checkmark-circle" size={14} color="#00E676" />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#00E676' : '#666' }]} />
              <Text style={[styles.onlineText, { color: isOnline ? '#00E676' : '#A0A0A0' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push({ pathname: '/voice-call', params: { channelId: conversationId, otherUserUid } })}
          >
            <Ionicons name="call" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="videocam" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSettings(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00E676" style={{ marginTop: 60 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color="#333" />
                <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
              </View>
            }
          />

          {/* Input / Recording Bar */}
          {isRecording ? (
            <View style={styles.recBar}>
              <TouchableOpacity onPress={cancelRecording} style={styles.recTrashBtn}>
                <Ionicons name="trash-outline" size={22} color="#A0A0A0" />
              </TouchableOpacity>

              <View style={styles.recCenter}>
                <Text style={styles.recTimerInline}>{fmtSecs(recordingSecs)}</Text>
                <View style={styles.recWaveInline}>
                  {waveAnims.map((anim, i) => (
                    <Animated.View
                      key={i}
                      style={[styles.recWaveBar, { height: anim }]}
                    />
                  ))}
                </View>
                <Text style={styles.slideCancelText}>Slide to cancel ◄</Text>
              </View>

              <TouchableOpacity onPress={stopAndSend} style={styles.recSendBigBtn} disabled={sending}>
                {sending
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Ionicons name="arrow-up" size={22} color="#000" />}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.emojiBtn}>
                <Ionicons name="happy-outline" size={26} color="#808080" />
              </TouchableOpacity>
              
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="Message"
                  placeholderTextColor="#808080"
                  multiline
                />
                <TouchableOpacity style={styles.attachBtnInside} onPress={() => setShowAttachMenu(true)}>
                  <Ionicons name="attach-outline" size={24} color="#808080" />
                </TouchableOpacity>
              </View>

              {text.trim() ? (
                <TouchableOpacity style={styles.blueActionBtn} onPress={handleSend} disabled={sending}>
                  {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 2 }} />}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.blueActionBtn} onPress={startRecording}>
                  <Ionicons name="mic" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.modalOption} onPress={() => { setShowSettings(false); router.push({ pathname: '/user-profile', params: { uid: otherUserUid } }); }}>
              <Ionicons name="person-outline" size={22} color="#FFF" />
              <Text style={styles.modalOptionText}>View Profile</Text>
            </TouchableOpacity>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.modalOption} onPress={handleDeleteConversation}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.modalOptionText, { color: '#ef4444' }]}>Delete Conversation</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Attach Menu Modal */}
      <Modal visible={showAttachMenu} transparent animationType="fade" onRequestClose={() => setShowAttachMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAttachMenu(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalOptionText, { fontSize: 14, color: '#A0A0A0', paddingBottom: 8 }]}>Attach</Text>
            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <View style={[styles.attachIconWrap, { backgroundColor: '#00E676' }]}>
                <Ionicons name="image-outline" size={22} color="#000" />
              </View>
              <Text style={styles.modalOptionText}>Photo</Text>
            </TouchableOpacity>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.modalOption} onPress={pickVideo}>
              <View style={[styles.attachIconWrap, { backgroundColor: '#7C3AED' }]}>
                <Ionicons name="videocam-outline" size={22} color="#FFF" />
              </View>
              <Text style={styles.modalOptionText}>Video</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fullscreen Image Viewer */}
      <Modal visible={!!fullscreenImg} transparent={false} animationType="fade" onRequestClose={() => setFullscreenImg(null)}>
        <View style={styles.fullscreenBg}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenImg(null)}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {fullscreenImg && (
            <Image source={{ uri: fullscreenImg }} style={styles.fullscreenImg} resizeMode="contain" />
          )}
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  headerBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingLeft: 4 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  headerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  headerInitial: { color: '#000', fontWeight: '800', fontSize: 18 },
  headerNameCol: { justifyContent: 'center' },
  headerName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676' },
  onlineText: { color: '#00E676', fontSize: 12, fontWeight: '500' },

  headerActions: { flexDirection: 'row', gap: 2 },

  messagesList: { padding: 12, paddingRight: 18, paddingBottom: 24, flexGrow: 1 }, // Added paddingRight to fix overflow

  msgRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', width: '100%' },
  msgRowRight: { justifyContent: 'flex-end', paddingRight: 4 },
  msgRowLeft: { justifyContent: 'flex-start' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarImg: { width: 28, height: 28, borderRadius: 14 },
  avatarInitial: { color: '#000', fontWeight: '700', fontSize: 12 },

  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleMe: { backgroundColor: '#0a1f12', borderWidth: 1, borderColor: '#00E676', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#1C1C1E', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: '#FFF' },

  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 180, marginBottom: 8 },
  playIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  audioWave: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  audioBar: { width: 2.5, borderRadius: 2 },
  audioDurMe: { fontSize: 11, fontWeight: '600', color: '#A0A0A0', alignSelf: 'flex-end' },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  timeLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  seenTick: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  seenSent: { color: '#666' },
  seenRead: { color: '#00E676' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#666', fontSize: 15 },

  // Input Row
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: '#0a0a0a',
  },
  emojiBtn: { 
    paddingBottom: 10, paddingLeft: 4
  },
  inputWrap: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24,
    minHeight: 44, flexDirection: 'row', alignItems: 'flex-end',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    color: '#FFF', fontSize: 16, maxHeight: 120,
  },
  attachBtnInside: {
    padding: 10, paddingRight: 14,
  },
  blueActionBtn: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center',
    marginBottom: 2
  },

  // Inline Recording Bar (Telegram-style)
  recBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  recTrashBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  recCenter: {
    flex: 1, alignItems: 'center', gap: 2,
  },
  recTimerInline: {
    color: '#FFF', fontSize: 18, fontWeight: '700',
  },
  recWaveInline: {
    flexDirection: 'row', alignItems: 'center', gap: 3, height: 36,
  },
  recWaveBar: {
    width: 2.5, borderRadius: 2, backgroundColor: '#00E676',
  },
  slideCancelText: { color: '#A0A0A0', fontSize: 12 },
  recSendBigBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center',
  },

  // Speed button (1x / 1.5x / 2x)
  speedBtn: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  speedBtnText: {
    color: '#FFF', fontSize: 12, fontWeight: '700',
  },

  // Media bubbles
  mediaBubble: {
    width: 220, height: 200, borderRadius: 16,
  },
  videoBubbleWrap: {
    width: 160, height: 100, borderRadius: 16,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
  },

  // Attach icon
  attachIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },

  // Fullscreen image viewer
  fullscreenBg: {
    flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center',
  },
  fullscreenClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 8,
  },
  fullscreenImg: {
    width: '100%', height: '80%',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#121212', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 24 },
  modalOption: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  modalOptionText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
});
