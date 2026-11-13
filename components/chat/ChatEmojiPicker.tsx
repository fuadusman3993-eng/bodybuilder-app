import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';

const { width } = Dimensions.get('window');

type PickerTab = 'emoji' | 'gif' | 'sticker';

interface ChatEmojiPickerProps {
  visible: boolean;
  onSelectEmoji: (emoji: string) => void;
  onBackspace: () => void;
  onSelectGif?: (url: string) => void;
  onSelectSticker?: (url: string) => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys & People',
    icon: 'happy-outline',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
      '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
      '💪', '🦾', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
      '🤝', '🙏', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',
    ],
  },
  {
    id: 'activity',
    name: 'Activity & Gym',
    icon: 'football-outline',
    emojis: [
      '🏋️‍♂️', '🏋️‍♀️', '🏃‍♂️', '🏃‍♀️', '🤸‍♂️', '🤸‍♀️', '🚴‍♂️', '🚴‍♀️', '🧗‍♂️', '🧗‍♀️',
      '🥊', '🥋', '🏊‍♂️', '🏊‍♀️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓',
      '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿',
      '🎯', '🎮', '🎲', '🧩', '🎳', '🛹', '🛼', '🎽', '🛷', '🎿',
    ],
  },
  {
    id: 'food',
    name: 'Food & Nutrition',
    icon: 'cafe-outline',
    emojis: [
      '🥑', '🥩', '🍗', '🥗', '🍌', '🍎', '🥦', '🥚', '🥛', '🥤',
      '☕', '🍵', '🍇', '🍈', '🍉', '🍊', '🍋', '🍍', '🥭', '🍑',
      '🍒', '🍓', '🥝', '🍅', '🥥', '🥒', '🌽', '🥕', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🍖', '🥓', '🍔', '🍟',
      '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🍳', '🍲', '🥣', '🍿',
    ],
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    icon: 'paw-outline',
    emojis: [
      '🦁', '🐯', '🐻', '🐼', '🐨', '🦍', '🦧', '🐵', '🐶', '🐺',
      '🦊', '🐱', '🐆', '🐅', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂',
      '🐃', '🐄', '🐷', '🐗', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙',
      '🦒', '🐘', '🦏', '🦛', '🐁', '🐀', '🐹', '🐰', '🐿️', '🦔',
      '🦅', '🦉', '🦜', '🦢', '🦩', '🕊️', '🌿', '🌱', '🌴', '🌲',
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: 'car-sport-outline',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '✈️', '🛫',
      '🛬', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛳️', '⛴️', '🚢',
      '🏖️', '🏝️', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '⛺', '🏠', '🏟️',
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Tech',
    icon: 'bulb-outline',
    emojis: [
      '📱', '💻', '⌚', '🎧', '💡', '🔋', '🔑', '📦', '📷', '📹',
      '🎙️', '📻', '⏰', '⏱️', '⏲️', '⏳', '📡', '🔌', '🧲', '💎',
      '⚖️', '🛠️', '🔨', '🔩', '⚙️', '🧱', '💊', '🩹', '🩺', '🧴',
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols & Hearts',
    icon: 'heart-outline',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⚡',
      '💥', '🔥', '💯', '💢', '💨', '💫', '✅', '❌', '⭕', '🛑',
      '⭐', '🌟', '⚠️', '🔔', '🔕', '💬', '💭', '♠️', '♣️', '♥️',
    ],
  },
];

const FITNESS_GIFS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&q=80',
];

const FITNESS_STICKERS = [
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&q=80',
  'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=200&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&q=80',
];

export default function ChatEmojiPicker({
  visible,
  onSelectEmoji,
  onBackspace,
  onSelectGif,
  onSelectSticker,
}: ChatEmojiPickerProps) {
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<PickerTab>('emoji');
  const [activeCategory, setActiveCategory] = useState<string>('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  if (!visible) return null;

  const currentCategoryData =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  // Filter emojis if search is active
  const displayedEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((_, idx) => idx % 2 === 0)
    : currentCategoryData.emojis;

  return (
    <View style={[styles.container, { backgroundColor: '#131920', borderTopColor: colors.border }]}>
      {/* ── 1. Top Search & Mode Bar (Image 1 match!) ── */}
      <View style={styles.topBar}>
        {/* Search Icon */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons
            name="search-outline"
            size={22}
            color={showSearch ? colors.primary : '#9CA3AF'}
          />
        </TouchableOpacity>

        {/* Center Pill Selector: [ ☺ Emoji ] [ GIF ] [ Stickers ] */}
        <View style={styles.pillSelector}>
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'emoji' && styles.pillBtnActive]}
            onPress={() => {
              setActiveTab('emoji');
              setShowSearch(false);
            }}
          >
            <Ionicons
              name="happy"
              size={18}
              color={activeTab === 'emoji' ? '#000000' : '#9CA3AF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'gif' && styles.pillBtnActive]}
            onPress={() => {
              setActiveTab('gif');
              setShowSearch(false);
            }}
          >
            <Text
              style={[
                styles.gifText,
                { color: activeTab === 'gif' ? '#000000' : '#9CA3AF' },
              ]}
            >
              GIF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'sticker' && styles.pillBtnActive]}
            onPress={() => {
              setActiveTab('sticker');
              setShowSearch(false);
            }}
          >
            <Ionicons
              name="copy-outline"
              size={18}
              color={activeTab === 'sticker' ? '#000000' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {/* Backspace Delete Button */}
        <TouchableOpacity style={styles.iconBtn} onPress={onBackspace}>
          <Ionicons name="backspace-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Optional Search Input */}
      {showSearch && (
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search emoji..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* ── 2. Content Body (Emoji Grid / GIF / Sticker) ── */}
      {activeTab === 'emoji' ? (
        <View style={styles.bodyWrap}>
          {/* Category Title */}
          {!showSearch && (
            <Text style={styles.categoryHeading}>{currentCategoryData.name}</Text>
          )}

          {/* Emoji Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.emojiGridScroll}
          >
            <View style={styles.emojiGrid}>
              {displayedEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiBtn}
                  activeOpacity={0.6}
                  onPress={() => onSelectEmoji(emoji)}
                >
                  <Text style={styles.emojiChar}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* ── 3. Bottom Category Navigation Strip (Image 1 match!) ── */}
          <View style={styles.categoryStrip}>
            {EMOJI_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catStripBtn,
                  activeCategory === cat.id && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => {
                  setActiveCategory(cat.id);
                  setShowSearch(false);
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={activeCategory === cat.id ? colors.primary : '#6B7280'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : activeTab === 'gif' ? (
        /* ── GIF Section ── */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gifScroll}
        >
          {FITNESS_GIFS.map((url, i) => (
            <TouchableOpacity
              key={i}
              style={styles.gifCard}
              activeOpacity={0.8}
              onPress={() => onSelectGif?.(url)}
            >
              <Image source={{ uri: url }} style={styles.gifImg} />
              <View style={styles.gifBadge}>
                <Text style={styles.gifBadgeText}>FITNESS GIF</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        /* ── Stickers Section ── */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gifScroll}
        >
          {FITNESS_STICKERS.map((url, i) => (
            <TouchableOpacity
              key={i}
              style={styles.stickerCard}
              activeOpacity={0.8}
              onPress={() => onSelectSticker?.(url)}
            >
              <Image source={{ uri: url }} style={styles.stickerImg} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 310,
    width: '100%',
    borderTopWidth: 1,
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelector: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#9CA3AF',
  },
  gifText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginHorizontal: 14,
    marginVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    height: 34,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },

  bodyWrap: {
    flex: 1,
  },
  categoryHeading: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  emojiGridScroll: {
    paddingBottom: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  emojiBtn: {
    width: (width - 16) / 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiChar: {
    fontSize: 27,
  },

  // Bottom Category Strip
  categoryStrip: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#101418',
  },
  catStripBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // GIF & Stickers
  gifScroll: {
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  gifCard: {
    width: 140,
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    position: 'relative',
  },
  gifImg: {
    width: '100%',
    height: '100%',
  },
  gifBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  stickerCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    padding: 10,
  },
  stickerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
