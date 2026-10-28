import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/profileService';
import { useUserStore } from '../store/userStore';
import { usePresenceStore } from '../store/presenceStore';
import { Colors } from '../constants/colors';
import { safeBack } from '../lib/navigation';
import FitPulseConfirmModal from '../components/ui/FitPulseConfirmModal';

// expo-av only imported on native
let Audio: any = null;
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio;
}

import * as ImagePicker from 'expo-image-picker';

const BG = Colors.background;

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtSecs(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

import { useCachedState } from '../lib/useCachedState';
import Skeleton from '../components/ui/Skeleton';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
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

  // Playback & Instant Cache Pool
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1); // <--- Speed toggle
  const nativeSoundRef = useRef<any>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const webAudioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const nativeSoundCacheRef = useRef<Map<string, any>>(new Map());

  const flatRef = useRef<FlatList>(null);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const webImageInputRef = useRef<any>(null);
  const webVideoInputRef = useRef<any>(null);

  // Inverted list: newest message is index 0 (rendered at visual bottom)
  // No setTimeout, no scrollToEnd, no opacity hacks needed — this is the WhatsApp/Telegram approach
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const scrollToNewest = useCallback((animated = true) => {
    try {
      flatRef.current?.scrollToOffset({ offset: 0, animated });
      if (Platform.OS === 'web') {
        const domNode = (flatRef.current as any)?.getScrollableNode?.();
        if (domNode) {
          domNode.scrollTop = 0;
        }
        const responder = (flatRef.current as any)?.getScrollResponder?.();
        responder?.scrollTo?.({ y: 0, animated });
      }
    } catch (_) {}
  }, []);

  // Fetch other user info directly from Supabase Unified Profiles
  useEffect(() => {
    if (!otherUserUid) return;
    async function loadOtherUser() {
      const profile = await getProfile(otherUserUid);
      const name = profile?.name || profile?.username || 'Athlete';
      const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00E676&color=000&size=120`;
      setOtherUser({
        name,
        avatar,
        isCoach: profile?.role === 'coach',
      });
    }
    loadOtherUser();
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
        setMessages((prev: any[]) => {
          // If we already have this exact ID, skip
          if (prev.some((m: any) => m.id === payload.new.id)) return prev;
          // Remove any optimistic (temp) message with same sender+type+text to avoid duplicates
          const withoutOptimistic = prev.filter((m: any) => {
            if (!m.isUploading) return true;
            const sameType = m.type === payload.new.type;
            const sameSender = m.sender_uid === payload.new.sender_uid;
            return !(sameType && sameSender);
          });
          return [...withoutOptimistic, payload.new];
        });
        // In inverted list, new messages always appear at top (visual bottom) — no scroll needed
        // But scroll to top (offset 0) if user is viewing history (btn visible)
        if (!showScrollDownBtn) {
          flatRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
        if (payload.new.sender_uid !== user.uid) {
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages((prev: any[]) => prev.map((m: any) => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

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
      // Inverted list: scroll to offset 0 = newest message (visual bottom)
      scrollToNewest(true);
      setShowScrollDownBtn(false);
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
        setMessages((prev: any[]) => [...prev, optimisticMsg]);
        scrollToNewest(true);
        setShowScrollDownBtn(false);

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

        setMessages((prev: any[]) => prev.map((m: any) => m.id === tempId ? insertedMsg : m));

        await supabase.from('conversations')
          .update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      } catch (e: any) {
        Alert.alert('Upload Error', JSON.stringify(e) + (e.message ? ' - ' + e.message : ''));
        setMessages((prev: any[]) => prev.filter((m: any) => m.id !== tempId));
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
      setMessages((prev: any[]) => [...prev, optimisticMsg]);
      scrollToNewest(true);
      setShowScrollDownBtn(false);

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

      setMessages((prev: any[]) => prev.map((m: any) => m.id === tempId ? insertedMsg : m));
      
      await supabase.from('conversations')
        .update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send');
      if (tempId) {
        setMessages((prev: any[]) => prev.filter((m: any) => m.id !== tempId));
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

    setMessages((prev: any[]) => [...prev, optimisticMsg]);
    scrollToNewest(true);
    setShowScrollDownBtn(false);

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

      setMessages((prev: any[]) => prev.map((m: any) => m.id === tempId ? insertedMsg : m));

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
      setMessages((prev: any[]) => prev.filter((m: any) => m.id !== tempId));
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
          await sendMedia(asset.uri, type, mimeType);
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

  const configureAudioForPlayback = async () => {
    if (Platform.OS !== 'web' && Audio) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (_) {}
    }
  };

  useEffect(() => {
    return () => {
      if (webAudioRef.current) {
        try { webAudioRef.current.pause(); } catch (_) {}
      }
      if (nativeSoundRef.current) {
        nativeSoundRef.current.stopAsync().catch(() => {});
      }
      nativeSoundCacheRef.current.forEach((snd) => {
        snd?.unloadAsync?.().catch(() => {});
      });
      nativeSoundCacheRef.current.clear();
      webAudioCacheRef.current.clear();
    };
  }, []);

  const togglePlaybackRate = () => {
    const next: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(next);
    if (webAudioRef.current) webAudioRef.current.playbackRate = next;
    webAudioCacheRef.current.forEach((audio) => {
      audio.playbackRate = next;
    });
    if (nativeSoundRef.current) nativeSoundRef.current.setRateAsync?.(next, true);
  };

  const togglePlay = async (id: string, audioUrl: string) => {
    if (!audioUrl || !audioUrl.trim()) {
      Alert.alert('Audio Notice', 'Audio message source is not accessible.');
      return;
    }

    if (Platform.OS === 'web') {
      // 1. If currently playing this audio -> pause it
      if (playingId === id) {
        if (webAudioRef.current) {
          webAudioRef.current.pause();
        }
        setPlayingId(null);
        setLoadingAudioId(null);
        return;
      }

      // 2. Pause any other audio currently playing
      if (webAudioRef.current) {
        try { webAudioRef.current.pause(); } catch (_) {}
      }

      // 3. Check if this audioUrl is already in the in-memory cache!
      let audio = webAudioCacheRef.current.get(audioUrl);

      if (!audio) {
        setLoadingAudioId(id);
        const newAudio = new window.Audio(audioUrl);
        newAudio.preload = 'auto';
        webAudioCacheRef.current.set(audioUrl, newAudio);
        audio = newAudio;

        newAudio.onerror = (e) => {
          console.warn('HTML5 Audio playback error for URL:', audioUrl, e);
          setPlayingId(null);
          setLoadingAudioId(null);
          setPlaybackPosition(0);
          webAudioCacheRef.current.delete(audioUrl);
        };

        newAudio.ontimeupdate = () => {
          setPlaybackPosition(newAudio.currentTime);
        };

        newAudio.onended = () => {
          setPlayingId(null);
          setLoadingAudioId(null);
          setPlaybackPosition(0);
          // Keep in cache for instant replay!
        };
      } else {
        // Fast replay from start if finished
        if (audio.ended || Math.abs(audio.currentTime - audio.duration) < 0.2) {
          audio.currentTime = 0;
        }
      }

      audio.playbackRate = playbackRate;
      webAudioRef.current = audio;

      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setLoadingAudioId(null);
              setPlayingId(id);
            })
            .catch((err) => {
              if (err.name !== 'AbortError') {
                console.warn('audio.play() exception:', err);
              }
              setLoadingAudioId(null);
              setPlayingId(null);
            });
        } else {
          setLoadingAudioId(null);
          setPlayingId(id);
        }
      } catch (err) {
        console.warn('Web Audio play call error:', err);
        setLoadingAudioId(null);
        setPlayingId(null);
      }
    } else {
      // ── NATIVE (iOS & Android) ──
      // 1. If currently playing this audio -> pause it
      if (playingId === id) {
        if (nativeSoundRef.current) {
          await nativeSoundRef.current.pauseAsync().catch(() => {});
        }
        setPlayingId(null);
        setLoadingAudioId(null);
        return;
      }

      // 2. Pause any currently playing native sound
      if (nativeSoundRef.current) {
        await nativeSoundRef.current.pauseAsync().catch(() => {});
      }

      // 3. Ensure speaker audio session is active
      await configureAudioForPlayback();

      // 4. Check if sound instance already cached
      let sound = nativeSoundCacheRef.current.get(audioUrl);

      if (sound) {
        // 0ms instant replay from cache!
        try {
          nativeSoundRef.current = sound;
          await sound.setPositionAsync(0);
          await sound.setRateAsync(playbackRate, true).catch(() => {});
          await sound.playAsync();
          setPlayingId(id);
          setLoadingAudioId(null);
          return;
        } catch (_) {
          nativeSoundCacheRef.current.delete(audioUrl);
        }
      }

      // 5. If not cached, load and cache it
      setLoadingAudioId(id);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 100 }
        );
        nativeSoundRef.current = newSound;
        nativeSoundCacheRef.current.set(audioUrl, newSound);
        await newSound.setRateAsync(playbackRate, true).catch(() => {});
        setPlayingId(id);
        setLoadingAudioId(null);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis / 1000);
            if (status.didJustFinish) {
              setPlayingId(null);
              setLoadingAudioId(null);
              setPlaybackPosition(0);
              newSound.setPositionAsync(0).catch(() => {});
              // Keep loaded in cache for instant replay!
            }
          } else if (status.error) {
            setPlayingId(null);
            setLoadingAudioId(null);
            setPlaybackPosition(0);
            nativeSoundCacheRef.current.delete(audioUrl);
          }
        });
      } catch (e: any) {
        console.warn('Native Audio play error:', e);
        setPlayingId(null);
        setLoadingAudioId(null);
        setPlaybackPosition(0);
      }
    }
  };

  const handleDeleteConversation = () => {
    setShowSettings(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteChat = async () => {
    try {
      setIsDeletingChat(true);
      await supabase.from('messages').delete().eq('conversation_id', conversationId);
      await supabase.from('conversations').delete().eq('id', conversationId);
      setShowDeleteModal(false);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not delete conversation.');
    } finally {
      setIsDeletingChat(false);
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.sender_uid === user.uid;
    const isAudio = item.type === 'audio' && item.audio_url;
    const isImage = item.type === 'image' && item.media_url;
    const isSharedPost = isImage && typeof item.text === 'string' && item.text.includes('Shared a post');
    const isVideo = item.type === 'video' && item.media_url;
    const isCall = item.type === 'call' || (typeof item.text === 'string' && (item.text.startsWith('📞') || item.text.includes('Missed call') || item.text.includes('Voice/Video call')));
    const isMissed = isCall && item.text?.toLowerCase().includes('missed');
    const isPlaying = playingId === item.id;
    const displayDuration = isPlaying ? Math.floor(playbackPosition) : (item.audio_duration || 0);
    const progressRatio = isPlaying && item.audio_duration ? playbackPosition / item.audio_duration : 0;

    // In inverted list, index 0 = newest. index+1 is the OLDER message (visually above current)
    // "last in group" means no older sibling from same sender above this bubble
    const olderMsg = reversedMessages[index + 1];
    const isSameSenderAsOlder = olderMsg && olderMsg.sender_uid === item.sender_uid;
    const isLastInGroup = !isSameSenderAsOlder;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft, { marginBottom: isLastInGroup ? 12 : 3 }]}>
        <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            {isAudio ? (
              <View style={[item.isUploading && { opacity: 0.6 }]}>
                <View style={styles.audioRow}>
                  {item.isUploading || loadingAudioId === item.id ? (
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
            ) : isSharedPost ? (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/community')}
                activeOpacity={0.88}
                style={styles.sharedPostCard}
              >
                <View style={styles.sharedPostHeader}>
                  <View style={styles.sharedPostBadge}>
                    <Ionicons name="paper-plane" size={11} color="#000" />
                  </View>
                  <Text style={styles.sharedPostAuthor} numberOfLines={1}>
                    {item.text.split(':')[0]?.replace('📷 ', '') || 'Shared Post'}
                  </Text>
                </View>

                {item.media_url ? (
                  <Image
                    source={{ uri: item.media_url }}
                    style={styles.sharedPostPhoto}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.sharedPostFooter}>
                  <Text style={styles.sharedPostCaption} numberOfLines={2}>
                    {item.text.includes(':') ? item.text.split(':').slice(1).join(':').replace(/["']/g, '').trim() : ''}
                  </Text>
                  <View style={styles.sharedPostLinkRow}>
                    <Text style={styles.sharedPostLinkText}>View in Community</Text>
                    <Ionicons name="arrow-forward-circle" size={16} color="#00E676" />
                  </View>
                </View>
              </TouchableOpacity>
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
            ) : isCall ? (
              <View style={styles.callCard}>
                <View style={styles.callCardHeader}>
                  <View style={[styles.callIconBadge, isMissed ? styles.callBadgeMissed : styles.callBadgeSuccess]}>
                    <Ionicons
                      name={isMissed ? 'call-outline' : 'call'}
                      size={18}
                      color={isMissed ? '#EF4444' : '#00E676'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.callTitle, isMissed && styles.callTitleMissed]}>
                      {isMissed ? 'Missed Call' : item.text?.replace(/[📞]/g, '').trim()}
                    </Text>
                    <Text style={styles.callSubtitle}>
                      {isMissed ? (isMe ? 'Outgoing missed call' : 'Incoming missed call') : 'Call finished'}
                    </Text>
                  </View>
                </View>
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
        <TouchableOpacity onPress={() => safeBack('/(tabs)/chat')} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
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
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1} ellipsizeMode="tail">
                {otherUser.name}
              </Text>
              {otherUser.isCoach && (
                <Ionicons name="checkmark-circle" size={14} color="#00E676" style={{ flexShrink: 0 }} />
              )}
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#00E676' : '#666' }]} />
              <Text style={[styles.onlineText, { color: isOnline ? '#00E676' : '#A0A0A0' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push({ pathname: '/voice-call', params: { channelId: conversationId, otherUserUid } })}
          >
            <Ionicons name="call" size={19} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="videocam" size={21} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowSettings(true)}>
            <Ionicons name="ellipsis-vertical" size={19} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, padding: 16, justifyContent: 'flex-end', gap: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'flex-end' }}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={200} height={50} borderRadius={16} style={{ marginLeft: 8 }} />
          </View>
          <View style={{ alignSelf: 'flex-end' }}>
            <Skeleton width={160} height={44} borderRadius={16} />
          </View>
          <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'flex-end' }}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={240} height={70} borderRadius={16} style={{ marginLeft: 8 }} />
          </View>
          <View style={{ alignSelf: 'flex-end' }}>
            <Skeleton width={120} height={44} borderRadius={16} />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            ref={flatRef}
            data={reversedMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            inverted
            onScroll={(e) => {
              // In inverted list: offset.y == 0 means AT the newest message (bottom)
              // offset.y > 0 means user has scrolled up into history
              const offsetY = e.nativeEvent.contentOffset.y;
              setShowScrollDownBtn(offsetY > 100);
            }}
            scrollEventThrottle={32}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color="#333" />
                <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
              </View>
            }
          />

          {/* Floating Scroll-to-Bottom Button (Hidden while recording) */}
          {showScrollDownBtn && !isRecording && (
            <TouchableOpacity
              style={styles.floatingScrollDownBtn}
              activeOpacity={0.8}
              onPress={() => {
                // In inverted list, offset 0 = newest message at visual bottom
                scrollToNewest(true);
                setShowScrollDownBtn(false);
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#00E676" />
            </TouchableOpacity>
          )}

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

      {/* ── DELETE CHAT CONFIRM MODAL (FITPULSE CARD) ── */}
      <FitPulseConfirmModal
        visible={showDeleteModal}
        title="Delete Conversation?"
        message="Permanently delete all messages in this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={isDeletingChat}
        onConfirm={handleConfirmDeleteChat}
        onCancel={() => setShowDeleteModal(false)}
      />

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
    paddingHorizontal: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0a0a0a',
  },
  headerBackBtn: { padding: 6, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  headerUser: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    flex: 1, 
    minWidth: 0, 
    paddingHorizontal: 4,
    marginRight: 4,
  },
  headerAvatarWrap: { position: 'relative', flexShrink: 0 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  headerInitial: { color: '#000', fontWeight: '800', fontSize: 16 },
  headerNameCol: { justifyContent: 'center', flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
  headerName: { color: '#FFF', fontSize: 15.5, fontWeight: '700', flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#00E676' },
  onlineText: { color: '#00E676', fontSize: 11.5, fontWeight: '500' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 1, flexShrink: 0 },
  headerActionBtn: { padding: 7, justifyContent: 'center', alignItems: 'center' },

  messagesList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24, flexGrow: 1 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', width: '100%' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#0a1f12', borderWidth: 1, borderColor: '#00E676', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#1C1C1E', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: '#FFF' },

  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 180, marginBottom: 8 },
  playIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  audioWave: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  audioBar: { width: 2.5, borderRadius: 2 },
  audioDurMe: { fontSize: 11, fontWeight: '600', color: '#A0A0A0', alignSelf: 'flex-end' },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingHorizontal: 4 },
  timeLabel: { fontSize: 10.5, color: '#71717A', fontWeight: '500' },
  seenTick: { fontSize: 10.5, fontWeight: '700', marginLeft: 3 },
  seenSent: { color: '#71717A' },
  seenRead: { color: '#00E676' },

  floatingScrollDownBtn: {
    position: 'absolute',
    right: 16,
    bottom: 68,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#121F2B',
    borderWidth: 1.5,
    borderColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },

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
  sharedPostCard: {
    width: 230,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sharedPostBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedPostAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  sharedPostPhoto: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surface,
  },
  sharedPostFooter: {
    padding: 8,
    gap: 6,
  },
  sharedPostCaption: {
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 16,
  },
  sharedPostLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  sharedPostLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
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

  // Call Card styles
  callCard: {
    minWidth: 210,
    maxWidth: 270,
    padding: 6,
    gap: 10,
  },
  callCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBadgeMissed: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  callBadgeSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.18)',
  },
  callTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callTitleMissed: {
    color: '#EF4444',
  },
  callSubtitle: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  callBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E676',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    gap: 6,
  },
  callBackBtnText: {
    color: '#000',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
