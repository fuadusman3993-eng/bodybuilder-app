import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveGeminiKey, saveGeminiKey } from '../../lib/geminiRealtimeService';

interface CeoAiConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CeoAiConfigModal({ visible, onClose }: CeoAiConfigModalProps) {
  const [apiKey, setApiKey] = useState(getActiveGeminiKey());
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSave = () => {
    saveGeminiKey(apiKey);
    setStatusMessage({ text: 'API Key saved successfully! ✅', isError: false });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setStatusMessage({ text: 'Please enter a Gemini API Key', isError: true });
      return;
    }
    setTesting(true);
    setStatusMessage(null);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello, confirm you are online.' }] }],
        }),
      });

      if (res.ok) {
        setStatusMessage({ text: 'Connected to Gemini 1.5 Flash in Real-Time! 🟢', isError: false });
        saveGeminiKey(apiKey);
      } else {
        const err = await res.json();
        setStatusMessage({ text: `Google API Error: ${err.error?.message || 'Check key format'}`, isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: `Ping failed: ${e.message || 'Network error'}`, isError: true });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color="#10B981" />
              </View>
              <Text style={styles.modalTitle}>Real-Time Gemini AI Setup</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            Directly connect the CEO Operations Messenger to Google's real-time Gemini language model.
          </Text>

          {/* API Key Input */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>GOOGLE GEMINI API KEY</Text>
            <TextInput
              style={styles.keyInput}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Paste Gemini API Key here (AQ.Ab8RN6...)"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Status Feedback */}
          {statusMessage && (
            <View style={[styles.statusBox, statusMessage.isError ? styles.statusBoxError : styles.statusBoxSuccess]}>
              <Ionicons
                name={statusMessage.isError ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={statusMessage.isError ? '#EF4444' : '#10B981'}
              />
              <Text style={[styles.statusText, statusMessage.isError ? styles.statusTextError : styles.statusTextSuccess]}>
                {statusMessage.text}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestKey}
              disabled={testing}
              activeOpacity={0.8}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={16} color="#10B981" />
                  <Text style={styles.testBtnText}>Test Key</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={16} color="#000" />
              <Text style={styles.saveBtnText}>Save & Activate</Text>
            </TouchableOpacity>
          </View>

          {/* Help Info */}
          <View style={styles.helpFooter}>
            <Ionicons name="information-circle-outline" size={14} color="#64748B" />
            <Text style={styles.helpFooterText}>
              Your API key is stored securely in your browser and used only for CEO operations briefings.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  inputWrap: {
    gap: 6,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  keyInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  statusBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statusTextSuccess: {
    color: '#10B981',
  },
  statusTextError: {
    color: '#EF4444',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 11,
    borderRadius: 10,
  },
  testBtnText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 11,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  helpFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  helpFooterText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
});
