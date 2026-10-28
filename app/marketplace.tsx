import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import {
  PRODUCTS_CATALOG,
  MARKETPLACE_CATEGORIES,
  FEATURED_PROMOS,
  MarketplaceProduct,
} from '../lib/marketplaceData';
import {
  queryMarketingAi,
  getInitialAiGreeting,
  AiConsultationMessage,
} from '../lib/marketplaceAiService';

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, updateCoins } = useUserStore();

  const isWide = width >= 768;
  const numColumns = isWide ? 3 : width >= 500 ? 2 : 1;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItemsCount, setCartItemsCount] = useState(0);

  // Modals state
  const [selectedProductForAi, setSelectedProductForAi] = useState<MarketplaceProduct | null>(null);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<MarketplaceProduct | null>(null);

  // Marketing AI state
  const [aiChatMessages, setAiChatMessages] = useState<AiConsultationMessage[]>([]);
  const [aiInputText, setAiInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatScrollRef = useRef<ScrollView>(null);

  // Checkout state
  const [paymentMethod, setPaymentMethod] = useState<'coins' | 'chapa'>('coins');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('Addis Ababa, Bole');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState(false);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return PRODUCTS_CATALOG.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Open Marketing AI modal with selected product
  const handleOpenAiConsultation = (product: MarketplaceProduct) => {
    setSelectedProductForAi(product);
    const initialGreeting = getInitialAiGreeting(product);
    setAiChatMessages([
      {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: initialGreeting,
        timestamp: 'Just now',
      },
    ]);
  };

  // Send message to Marketing AI
  const handleSendAiMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || aiInputText.trim();
    if (!textToSend || !selectedProductForAi || aiLoading) return;

    const userMsg: AiConsultationMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now',
    };

    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiInputText('');
    setAiLoading(true);

    setTimeout(() => {
      aiChatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await queryMarketingAi(selectedProductForAi, aiChatMessages, textToSend);
      const aiMsg: AiConsultationMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response,
        timestamp: 'Just now',
      };
      setAiChatMessages((prev) => [...prev, aiMsg]);
    } catch (_) {
      const fallbackMsg: AiConsultationMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: 'ይቅርታ፣ ጥያቄዎን ለማስተናገድ ችግር ገጥሞኛል። እባክዎ እንደገና ይሞክሩ።',
        timestamp: 'Just now',
      };
      setAiChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        aiChatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Execute purchase
  const handleConfirmPurchase = () => {
    if (!selectedProductForCheckout) return;

    if (paymentMethod === 'coins') {
      const userCoins = user.coinsBalance || 0;
      if (userCoins < selectedProductForCheckout.priceCoins) {
        Alert.alert(
          'Insufficient Coins (ያልበቃ የኮይን ሂሳብ)',
          `ይህን እቃ ለመግዛት ${selectedProductForCheckout.priceCoins} Coins ያስፈልጎታል። የእርስዎ ቀሪ ሂሳብ ${userCoins} Coins ነው። እባክዎ ኮይን ይጨምሩ።`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Coins', onPress: () => router.push('/coins') },
          ]
        );
        return;
      }

      setIsProcessingOrder(true);
      setTimeout(() => {
        updateCoins(userCoins - selectedProductForCheckout.priceCoins);
        setIsProcessingOrder(false);
        setSelectedProductForCheckout(null);
        setOrderSuccessModal(true);
      }, 1200);
    } else {
      // Chapa ETB payment
      setIsProcessingOrder(true);
      setTimeout(() => {
        setIsProcessingOrder(false);
        setSelectedProductForCheckout(null);
        setOrderSuccessModal(true);
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="cart" size={20} color={Colors.primary} />
            <Text style={styles.headerTitle}>FitPulse Market</Text>
          </View>
          <Text style={styles.headerSubtitle}>Verified Supplements, Gear & Nutrition</Text>
        </View>

        {/* User Coin Balance Badge */}
        <TouchableOpacity
          style={styles.coinBadge}
          onPress={() => router.push('/coins')}
          activeOpacity={0.8}
        >
          <Text style={styles.coinBadgeText}>🪙 {user.coinsBalance || 0}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
      >
        {/* ── SEARCH BAR ── */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#8A95A5" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplements, belts, plans, gear..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8A95A5" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FEATURED DEALS CAROUSEL ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promosScroll}
        >
          {FEATURED_PROMOS.map((promo) => (
            <View key={promo.id} style={[styles.promoCard, { backgroundColor: promo.bgColor }]}>
              <Image source={{ uri: promo.imageUrl }} style={styles.promoImage} />
              <View style={styles.promoOverlay}>
                <View style={[styles.promoTagBadge, { backgroundColor: promo.accentColor }]}>
                  <Text style={styles.promoTagText}>{promo.tag}</Text>
                </View>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoSub} numberOfLines={2}>{promo.subtitle}</Text>
                <TouchableOpacity
                  style={[styles.promoActionBtn, { backgroundColor: promo.accentColor }]}
                  onPress={() => {
                    const prod = PRODUCTS_CATALOG.find((p) => p.id === promo.productId);
                    if (prod) handleOpenAiConsultation(prod);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.promoActionBtnText}>Consult AI & Buy →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── CATEGORY PILLS BAR ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {MARKETPLACE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── SECTION HEADER ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all'
              ? 'Trending Sports Goods'
              : MARKETPLACE_CATEGORIES.find((c) => c.key === selectedCategory)?.label}
          </Text>
          <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
        </View>

        {/* ── PRODUCTS GRID ── */}
        <View style={[styles.productsGrid, isWide && { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {filteredProducts.map((product) => (
            <View
              key={product.id}
              style={[
                styles.productCard,
                isWide && { width: '31.5%', marginHorizontal: '0.9%', marginBottom: 16 },
              ]}
            >
              {/* Image & Badges */}
              <View style={styles.cardImageWrap}>
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                <View style={styles.cardTopPills}>
                  {product.badge && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{product.badge}</Text>
                    </View>
                  )}
                  {product.discountPercent && (
                    <View style={styles.discountPill}>
                      <Text style={styles.discountPillText}>-{product.discountPercent}%</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.cardBody}>
                <View style={styles.ratingRow}>
                  <Text style={styles.brandText}>{product.brand.toUpperCase()}</Text>
                  <View style={styles.starsWrap}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {product.rating} ({product.reviewsCount})
                    </Text>
                  </View>
                </View>

                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                <Text style={styles.productShortDesc} numberOfLines={2}>
                  {product.shortDescription}
                </Text>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceEtbText}>{product.priceEtb.toLocaleString()} ETB</Text>
                    {product.originalPriceEtb && (
                      <Text style={styles.originalPriceText}>
                        {product.originalPriceEtb.toLocaleString()} ETB
                      </Text>
                    )}
                  </View>
                  <View style={styles.priceCoinPill}>
                    <Text style={styles.priceCoinText}>🪙 {product.priceCoins} Coins</Text>
                  </View>
                </View>

                {/* Dual Action Buttons */}
                <View style={styles.cardActionButtonsRow}>
                  {/* Button 1: Ask Marketing AI */}
                  <TouchableOpacity
                    style={styles.askAiBtn}
                    onPress={() => handleOpenAiConsultation(product)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubbles" size={15} color={Colors.primary} />
                    <Text style={styles.askAiBtnText}>Ask AI</Text>
                  </TouchableOpacity>

                  {/* Button 2: Buy Now */}
                  <TouchableOpacity
                    style={styles.buyNowBtn}
                    onPress={() => setSelectedProductForCheckout(product)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="flash" size={15} color="#000" />
                    <Text style={styles.buyNowBtnText}>Buy Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: MARKETING AI CONSULTATION CHAT ──               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedProductForAi}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProductForAi(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.aiModalContainer}>
            {/* Modal Header */}
            <View style={styles.aiModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={18} color="#00E676" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiModalTitle}>FitPulse Marketing AI</Text>
                  <Text style={styles.aiModalSub} numberOfLines={1}>
                    Advisor for {selectedProductForAi?.title}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedProductForAi(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Pinned Product Preview Bar */}
            {selectedProductForAi && (
              <View style={styles.pinnedProductBar}>
                <Image
                  source={{ uri: selectedProductForAi.imageUrl }}
                  style={styles.pinnedProductImg}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinnedProductTitle} numberOfLines={1}>
                    {selectedProductForAi.title}
                  </Text>
                  <Text style={styles.pinnedProductPrice}>
                    {selectedProductForAi.priceEtb.toLocaleString()} ETB • 🪙 {selectedProductForAi.priceCoins} Coins
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.pinnedBuyBtn}
                  onPress={() => {
                    const prod = selectedProductForAi;
                    setSelectedProductForAi(null);
                    setSelectedProductForCheckout(prod);
                  }}
                >
                  <Text style={styles.pinnedBuyBtnText}>Buy ⚡</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Chat Messages */}
            <ScrollView
              ref={aiChatScrollRef}
              style={styles.aiChatBody}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {aiChatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[styles.aiChatBubble, isUser ? styles.aiBubbleUser : styles.aiBubbleModel]}
                  >
                    {!isUser && (
                      <View style={styles.aiBubbleSenderRow}>
                        <Ionicons name="sparkles" size={12} color="#00E676" />
                        <Text style={styles.aiSenderLabel}>FitPulse Advisor</Text>
                      </View>
                    )}
                    <Text style={[styles.aiBubbleText, isUser && { color: '#FFF' }]}>{msg.text}</Text>
                  </View>
                );
              })}

              {aiLoading && (
                <View style={styles.aiLoadingRow}>
                  <ActivityIndicator size="small" color="#00E676" />
                  <Text style={styles.aiLoadingText}>AI እያሰበ ነው... (Consulting Advisor)</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Prompt Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickChipsBar}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            >
              {[
                'ይህ ምርት እንዴት ይወሰዳል?',
                'ምን ያህል ጊዜ ውስጥ ውጤት አያለሁ?',
                'ከምን ጋር አብሬ ልውሰደው?',
                'How do I take this?',
                'Is this safe for beginners?',
              ].map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => handleSendAiMessage(chip)}
                  disabled={aiLoading}
                >
                  <Text style={styles.quickChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiTextInput}
                placeholder="Ask about dosage, results, ingredients..."
                placeholderTextColor="#64748B"
                value={aiInputText}
                onChangeText={setAiInputText}
                onSubmitEditing={() => handleSendAiMessage()}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.aiSendBtn, (!aiInputText.trim() || aiLoading) && { opacity: 0.5 }]}
                onPress={() => handleSendAiMessage()}
                disabled={!aiInputText.trim() || aiLoading}
              >
                <Ionicons name="arrow-up" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: INSTANT CHECKOUT MODAL ──                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedProductForCheckout}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProductForCheckout(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutContainer}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>Checkout Confirmation</Text>
              <TouchableOpacity onPress={() => setSelectedProductForCheckout(null)}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {selectedProductForCheckout && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                {/* Item Summary */}
                <View style={styles.checkoutItemBox}>
                  <Image
                    source={{ uri: selectedProductForCheckout.imageUrl }}
                    style={styles.checkoutItemImg}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkoutItemTitle}>{selectedProductForCheckout.title}</Text>
                    <Text style={styles.checkoutItemBrand}>{selectedProductForCheckout.brand}</Text>
                    <Text style={styles.checkoutItemPrice}>
                      {selectedProductForCheckout.priceEtb.toLocaleString()} ETB or 🪙{' '}
                      {selectedProductForCheckout.priceCoins} Coins
                    </Text>
                  </View>
                </View>

                {/* Payment Method Selector */}
                <Text style={styles.checkoutSectionLabel}>SELECT PAYMENT METHOD</Text>
                <View style={styles.paymentMethodRow}>
                  {/* Option 1: FitPulse Coins */}
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodCard,
                      paymentMethod === 'coins' && styles.paymentMethodCardActive,
                    ]}
                    onPress={() => setPaymentMethod('coins')}
                  >
                    <Text style={styles.payIcon}>🪙</Text>
                    <Text style={styles.payTitle}>FitPulse Coins</Text>
                    <Text style={styles.paySub}>
                      Cost: {selectedProductForCheckout.priceCoins} Coins
                    </Text>
                    <Text style={styles.payBalance}>
                      Balance: {user.coinsBalance || 0} Coins
                    </Text>
                  </TouchableOpacity>

                  {/* Option 2: Chapa / Telebirr */}
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodCard,
                      paymentMethod === 'chapa' && styles.paymentMethodCardActive,
                    ]}
                    onPress={() => setPaymentMethod('chapa')}
                  >
                    <Text style={styles.payIcon}>💳</Text>
                    <Text style={styles.payTitle}>Chapa / Telebirr</Text>
                    <Text style={styles.paySub}>
                      {selectedProductForCheckout.priceEtb.toLocaleString()} ETB
                    </Text>
                    <Text style={styles.payBalance}>Instant Mobile Pay</Text>
                  </TouchableOpacity>
                </View>

                {/* Delivery Information */}
                <Text style={styles.checkoutSectionLabel}>DELIVERY & CONTACT DETAILS</Text>
                <TextInput
                  style={styles.checkoutInput}
                  placeholder="Phone Number (e.g. 0911223344)"
                  placeholderTextColor="#64748B"
                  value={deliveryPhone}
                  onChangeText={setDeliveryPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.checkoutInput}
                  placeholder="Delivery Address (e.g. Addis Ababa, Bole)"
                  placeholderTextColor="#64748B"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />

                {/* Submit Order Button */}
                <TouchableOpacity
                  style={[styles.confirmOrderBtn, isProcessingOrder && { opacity: 0.6 }]}
                  onPress={handleConfirmPurchase}
                  disabled={isProcessingOrder}
                >
                  {isProcessingOrder ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#000" />
                      <Text style={styles.confirmOrderBtnText}>
                        {paymentMethod === 'coins'
                          ? `Pay 🪙 ${selectedProductForCheckout.priceCoins} Coins Now`
                          : `Pay ${selectedProductForCheckout.priceEtb.toLocaleString()} ETB Now`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: ORDER SUCCESS CELEBRATION ──                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal visible={orderSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-done-circle" size={64} color="#00E676" />
            <Text style={styles.successTitle}>ትዕዛዝዎ ተጠናቋል! ✅</Text>
            <Text style={styles.successSubtitle}>
              Order placed successfully! Our delivery agent and FitPulse team will contact you shortly.
            </Text>
            <TouchableOpacity
              style={styles.successCloseBtn}
              onPress={() => setOrderSuccessModal(false)}
            >
              <Text style={styles.successCloseBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#8A95A5',
    fontSize: 11.5,
    marginTop: 1,
  },
  coinBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#EAB308',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  coinBadgeText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 12,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13.5,
  },
  promosScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  promoCard: {
    width: 290,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  promoImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  promoOverlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  promoTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  promoTagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  promoSub: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
  },
  promoActionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoActionBtnText: {
    color: '#000',
    fontSize: 11.5,
    fontWeight: '700',
  },
  categoryBar: {
    marginVertical: 6,
    flexGrow: 0,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#00E676',
  },
  categoryPillText: {
    color: '#8A95A5',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#64748B',
    fontSize: 12,
  },
  productsGrid: {
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: '100%',
    height: 190,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardTopPills: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  discountPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountPillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  starsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '600',
  },
  productTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  productShortDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  priceEtbText: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: '800',
  },
  originalPriceText: {
    color: '#64748B',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  priceCoinPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  priceCoinText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  askAiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  askAiBtnText: {
    color: '#00E676',
    fontSize: 12.5,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00E676',
    borderRadius: 10,
    paddingVertical: 10,
  },
  buyNowBtnText: {
    color: '#000',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // ── MODAL STYLES ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  aiModalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '65%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  aiModalSub: {
    color: '#8A95A5',
    fontSize: 11,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedProductBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  pinnedProductImg: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  pinnedProductTitle: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  pinnedProductPrice: {
    color: '#00E676',
    fontSize: 11.5,
    fontWeight: '600',
  },
  pinnedBuyBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pinnedBuyBtnText: {
    color: '#000',
    fontSize: 11.5,
    fontWeight: '800',
  },
  aiChatBody: {
    flex: 1,
  },
  aiChatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
  },
  aiBubbleModel: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#00E676',
    borderTopRightRadius: 4,
  },
  aiBubbleSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiSenderLabel: {
    color: '#00E676',
    fontSize: 10.5,
    fontWeight: '700',
  },
  aiBubbleText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  aiLoadingText: {
    color: '#8A95A5',
    fontSize: 12,
  },
  quickChipsBar: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexGrow: 0,
  },
  quickChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickChipText: {
    color: '#CBD5E1',
    fontSize: 11.5,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 10,
  },
  aiTextInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 42,
    color: '#FFF',
    fontSize: 13,
  },
  aiSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── CHECKOUT MODAL ──
  checkoutContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkoutTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  checkoutItemBox: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  checkoutItemImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  checkoutItemTitle: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  checkoutItemBrand: {
    color: '#8A95A5',
    fontSize: 11,
    marginTop: 2,
  },
  checkoutItemPrice: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  checkoutSectionLabel: {
    color: '#8A95A5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodCardActive: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  payIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  payTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paySub: {
    color: '#00E676',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  payBalance: {
    color: '#8A95A5',
    fontSize: 10,
    marginTop: 4,
  },
  checkoutInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFF',
    fontSize: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E676',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  confirmOrderBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── SUCCESS MODAL ──
  successBox: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00E676',
    gap: 12,
  },
  successTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
  },
  successSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  successCloseBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  successCloseBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
});
