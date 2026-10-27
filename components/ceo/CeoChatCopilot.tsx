import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  CopilotMessage,
  CopilotQuickAction,
  CopilotContextData,
  generateCategoryBriefing,
  processCeoQuery,
} from '../../lib/ceoCopilotService';

interface CeoChatCopilotProps {
  category: 'errors' | 'users' | 'finance' | 'health';
  contextData: CopilotContextData;
  onResolveAllErrors?: () => void;
  onInspectUser?: (user: any) => void;
  onOpenReconcileModal?: () => void;
  onGrantCoinsModal?: (user?: any) => void;
  onToggleMaintenance?: () => void;
  onToggleVoice?: () => void;
  onSwitchCategory?: (cat: 'errors' | 'users' | 'finance' | 'health') => void;
}

export default function CeoChatCopilot({
  category,
  contextData,
  onResolveAllErrors,
  onInspectUser,
  onOpenReconcileModal,
  onGrantCoinsModal,
  onToggleMaintenance,
  onToggleVoice,
  onSwitchCategory,
}: CeoChatCopilotProps) {
  const [language, setLanguage] = useState<'am' | 'en'>('am');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Initialize or re-brief when category or language changes
  useEffect(() => {
    const briefing = generateCategoryBriefing(category, language, contextData);
    setMessages([briefing]);
  }, [category, language]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, [messages, isTyping]);

  // Handle sending a user query
  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: CopilotMessage = {
      id: `ceo_${Date.now()}`,
      sender: 'ceo',
      text: query,
      timestamp: now,
      category,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate fast intelligent response (350ms)
    setTimeout(() => {
      const reply = processCeoQuery(query, category, language, contextData);
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);

      // Handle direct actions if generated
      if (reply.actionableType === 'resolve_all' && onResolveAllErrors) {
        onResolveAllErrors();
      }
    }, 350);
  };

  // Handle Quick Action Chip Click
  const handleQuickAction = (action: CopilotQuickAction) => {
    if (action.actionId === 'switch_users' && onSwitchCategory) {
      onSwitchCategory('users');
      return;
    }
    if (action.actionId === 'switch_finance' && onSwitchCategory) {
      onSwitchCategory('finance');
      return;
    }
    if (action.actionId === 'switch_errors' && onSwitchCategory) {
      onSwitchCategory('errors');
      return;
    }
    if (action.actionId === 'switch_health' && onSwitchCategory) {
      onSwitchCategory('health');
      return;
    }
    if (action.actionId === 'resolve_all_errors' && onResolveAllErrors) {
      onResolveAllErrors();
    }
    if (action.actionId === 'reconcile_modal' && onOpenReconcileModal) {
      onOpenReconcileModal();
      return;
    }
    if (action.actionId === 'grant_coins_modal' && onGrantCoinsModal) {
      onGrantCoinsModal();
      return;
    }
    if (action.actionId === 'inspect_bilal' && onInspectUser) {
      const bilal = contextData.users.find(
        (u) => u.email?.includes('bilalkediro') || u.name?.toLowerCase().includes('bilal')
      );
      if (bilal) {
        onInspectUser(bilal);
        return;
      }
    }
    if (action.actionId === 'toggle_maintenance' && onToggleMaintenance) {
      onToggleMaintenance();
    }
    if (action.actionId === 'toggle_voice' && onToggleVoice) {
      onToggleVoice();
    }

    // Send action as prompt in conversation
    handleSend(action.label);
  };

  // Clear and restart conversation
  const handleResetConversation = () => {
    const briefing = generateCategoryBriefing(category, language, contextData);
    setMessages([briefing]);
  };

  // Get active quick action chips (from latest copilot message)
  const latestCopilotMsg = [...messages].reverse().find((m) => m.sender === 'copilot');
  const activeChips = latestCopilotMsg?.quickActions || [];

  return (
    <View style={styles.container}>
      {/* Copilot Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#10B981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {language === 'am' ? 'የ AI ረዳት ኮፓይለት' : 'Executive AI Copilot'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {category === 'errors' && (language === 'am' ? '🚨 የስህተቶች ራዳር' : '🚨 Active Error Radar')}
              {category === 'users' && (language === 'am' ? '👥 የተጠቃሚዎች እና ቦት ራዳር' : '👥 User & Bot Intelligence')}
              {category === 'finance' && (language === 'am' ? '💳 የክፍያ እና ገቢ ራዳር' : '💳 Payment Telemetry')}
              {category === 'health' && (language === 'am' ? '⚡ የሰርቨር ጤና ራዳር' : '⚡ Server Health & Bottlenecks')}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Language Toggle */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLanguage(language === 'am' ? 'en' : 'am')}
          >
            <Ionicons name="globe-outline" size={13} color="#94A3B8" />
            <Text style={styles.langText}>
              {language === 'am' ? '🇪🇹 አማርኛ' : '🇺🇸 English'}
            </Text>
          </TouchableOpacity>

          {/* Reset Chat */}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetConversation}
            accessibilityLabel={language === 'am' ? 'ውይይት አድስ' : 'Reset Chat'}
          >
            <Ionicons name="refresh-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Feed */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isCeo = item.sender === 'ceo';
          return (
            <View
              style={[
                styles.messageRow,
                isCeo ? styles.messageRowCeo : styles.messageRowCopilot,
              ]}
            >
              {!isCeo && (
                <View style={styles.copilotAvatar}>
                  <Ionicons name="hardware-chip" size={14} color="#10B981" />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isCeo ? styles.bubbleCeo : styles.bubbleCopilot,
                ]}
              >
                {!isCeo && (
                  <View style={styles.bubbleHeader}>
                    <Text style={styles.bubbleAuthor}>FitPulse AI Copilot</Text>
                    <Text style={styles.bubbleTime}>{item.timestamp}</Text>
                  </View>
                )}

                <Text style={isCeo ? styles.textCeo : styles.textCopilot}>
                  {item.text}
                </Text>

                {/* Optional Syntax Highlighted Code Box */}
                {item.codeSnippet && (
                  <View style={styles.codeSnippetBox}>
                    <View style={styles.codeSnippetHeader}>
                      <Ionicons name="code-slash" size={12} color="#10B981" />
                      <Text style={styles.codeSnippetTitle}>Code Patch</Text>
                    </View>
                    <Text style={styles.codeSnippetText}>{item.codeSnippet}</Text>
                  </View>
                )}

                {/* Optional Action Buttons Inside Bubble */}
                {item.actionableType === 'inspect_user' && item.actionPayload && (
                  <TouchableOpacity
                    style={styles.actionBtnInBubble}
                    onPress={() => onInspectUser && onInspectUser(item.actionPayload)}
                  >
                    <Ionicons name="person-circle-outline" size={15} color="#10B981" />
                    <Text style={styles.actionBtnInBubbleText}>
                      {language === 'am' ? 'የተጠቃሚውን ዶስዬ ክፈት' : 'Open User Dossier'}
                    </Text>
                  </TouchableOpacity>
                )}

                {isCeo && (
                  <Text style={styles.ceoTimestamp}>{item.timestamp}</Text>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.messageRow, styles.messageRowCopilot]}>
              <View style={styles.copilotAvatar}>
                <Ionicons name="hardware-chip" size={14} color="#10B981" />
              </View>
              <View style={[styles.messageBubble, styles.bubbleCopilot, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.typingText}>
                  {language === 'am' ? 'እያሰበ ነው...' : 'Analyzing live data...'}
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick Action Chips Bar */}
      {activeChips.length > 0 && (
        <View style={styles.chipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {activeChips.map((chip, idx) => (
              <TouchableOpacity
                key={`${chip.actionId}_${idx}`}
                style={styles.chipPill}
                onPress={() => handleQuickAction(chip)}
              >
                <Text style={styles.chipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Action Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={
            language === 'am'
              ? 'ለ AI ረዳቱ ጥያቄ ይጠይቁ (ለምሳሌ፦ ችግሩ ለምን ተፈጠረ?)...'
              : 'Ask Copilot (e.g., Why did this error happen?)...'
          }
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />

        {inputText.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setInputText('')}
          >
            <Ionicons name="close-circle" size={16} color="#64748B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.sendBtn,
            inputText.trim().length > 0 ? styles.sendBtnActive : styles.sendBtnDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={inputText.trim().length === 0}
        >
          <Ionicons
            name="paper-plane"
            size={16}
            color={inputText.trim().length > 0 ? '#FFFFFF' : '#475569'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    minHeight: 520,
    maxHeight: 750,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  resetBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  messageRowCeo: {
    justifyContent: 'flex-end',
  },
  messageRowCopilot: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  copilotAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: Platform.OS === 'web' ? '82%' : '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleCeo: {
    backgroundColor: '#059669',
    borderTopRightRadius: 4,
  },
  bubbleCopilot: {
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#24334D',
    borderTopLeftRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    gap: 12,
  },
  bubbleAuthor: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  bubbleTime: {
    color: '#64748B',
    fontSize: 10,
  },
  textCeo: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  textCopilot: {
    color: '#F1F5F9',
    fontSize: 13.5,
    lineHeight: 21,
  },
  ceoTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9.5,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  codeSnippetBox: {
    marginTop: 10,
    backgroundColor: '#0B111E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
  },
  codeSnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  codeSnippetTitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  codeSnippetText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#A7F3D0',
    fontSize: 11.5,
    lineHeight: 18,
  },
  actionBtnInBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionBtnInBubbleText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  chipsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0A0F1D',
  },
  chipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chipPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearBtn: {
    position: 'absolute',
    right: 58,
    padding: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#10B981',
  },
  sendBtnDisabled: {
    backgroundColor: '#1E293B',
  },
});
