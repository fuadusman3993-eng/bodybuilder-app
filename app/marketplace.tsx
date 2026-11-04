import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import BackButton from '../components/ui/BackButton';
import {
  PRODUCTS_CATALOG,
  MARKETPLACE_CATEGORIES,
  FEATURED_PROMOS,
  MarketplaceProduct,
  MarketplaceCategory,
} from '../lib/marketplaceData';
import {
  queryMarketingAi,
  getInitialAiGreeting,
  AiConsultationMessage,
} from '../lib/marketplaceAiService';
import {
  useSupermarketCartStore,
  FREE_DELIVERY_THRESHOLD_ETB,
} from '../store/supermarketCartStore';
import SupermarketCartModal from '../components/marketplace/SupermarketCartModal';

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useUserStore();

  const isWide = width >= 768;

  // Cart store
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    getItemQuantity,
    getTotalItemsCount,
    getTotalPriceEtb,
    isFreeDeliveryEligible,
  } = useSupermarketCartStore();

  const cartTotalCount = getTotalItemsCount();
  const cartTotalEtb = getTotalPriceEtb();
  const isFreeDelivery = isFreeDeliveryEligible();
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_ETB - cartTotalEtb);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('all');

  // Modals
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedProductForAi, setSelectedProductForAi] = useState<MarketplaceProduct | null>(null);
  const [orderSuccessSummary, setOrderSuccessSummary] = useState<{
    itemsCount: number;
    totalEtb: number;
    paymentMethod: string;
  } | null>(null);

  // Marketing AI state
  const [aiChatMessages, setAiChatMessages] = useState<AiConsultationMessage[]>([]);
  const [aiInputText, setAiInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatScrollRef = useRef<ScrollView>(null);

  // Weekly Offers (Image 2 style)
  const weeklyOffers = useMemo(() => {
    return PRODUCTS_CATALOG.filter((p) => p.isWeeklyOffer);
  }, []);

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
    const greeting = getInitialAiGreeting(product);
    setAiChatMessages([
      {
        id: 'msg-init',
        sender: 'ai',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendAiMessage = async () => {
    if (!aiInputText.trim() || !selectedProductForAi || aiLoading) return;

    const userText = aiInputText.trim();
    setAiInputText('');

    const newMsg: AiConsultationMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...aiChatMessages, newMsg];
    setAiChatMessages(updated);
    setAiLoading(true);

    setTimeout(() => {
      aiChatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await queryMarketingAi(selectedProductForAi, updated, userText);
      const aiReply: AiConsultationMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiChatMessages((prev) => [...prev, aiReply]);
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'ይቅርታ፣ ጥያቄዎን በማስተናገድ ላይ ጊዜ ወስዷል። እባክዎ እንደገና ይሞክሩ።',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        aiChatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <StatusBar style="light" />

      {/* ── 1. TOP HEADER BAR ── */}
      <View style={styles.header}>
        <BackButton fallbackRoute="/(tabs)" />

        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="basket" size={19} color="#00E676" />
            <Text style={styles.headerTitle}>FitPulse Supermarket</Text>
          </View>
          <Text style={styles.headerSubtitle}>Fresh High-Protein Groceries & Sports Fuel</Text>
        </View>

        {/* Right Action Icons: Coins + Basket */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.coinBadge}
            onPress={() => router.push('/wallet')}
            activeOpacity={0.8}
          >
            <Text style={styles.coinBadgeText}>🪙 {user.coinsBalance || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartHeaderBtn}
            onPress={() => setShowCartModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Shopping Cart"
          >
            <Ionicons name="cart" size={22} color="#FFFFFF" />
            {cartTotalCount > 0 && (
              <View style={styles.cartHeaderBadge}>
                <Text style={styles.cartHeaderBadgeText}>{cartTotalCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
      >
        {/* ── 2. SEARCH BAR ── */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#8A95A5" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chicken breasts, eggs, oats, fruits, whey..."
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

        {/* ── 3. TOP PROMOTIONAL BANNER (Image 2 Inspired) ── */}
        <View style={styles.heroPromoBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroPromoOverlay} />

          <View style={styles.heroPromoContent}>
            <View style={styles.heroTagBadge}>
              <Text style={styles.heroTagText}>🛒 MEGA FITNESS GROCERY WEEK</Text>
            </View>

            <Text style={styles.heroPromoTitle}>Fresh Protein & Clean Foods</Text>
            <Text style={styles.heroPromoSubtitle}>
              Chicken Breasts, Farm Eggs, Rolled Oats & Blueberries up to 30% OFF
            </Text>

            <TouchableOpacity
              style={styles.shopNowBtn}
              activeOpacity={0.85}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={styles.shopNowBtnText}>Shop Now ▸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. SECTION: % WEEKLY OFFERS (100% REPLICA OF IMAGE 2!) ── */}
        <View style={styles.weeklyOffersSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.percentIconCircle}>
                <Text style={styles.percentIconText}>%</Text>
              </View>
              <Text style={styles.sectionTitle}>Weekly Offers</Text>
            </View>

            <TouchableOpacity
              style={styles.goBtn}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={styles.goBtnText}>GO &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Offers Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weeklyOffersScroll}
          >
            {weeklyOffers.map((product) => {
              const qty = getItemQuantity(product.id);
              return (
                <View key={product.id} style={styles.weeklyCard}>
                  {/* Top Discount Badge */}
                  {product.discountPercent && (
                    <View style={styles.offerDiscountBadge}>
                      <Text style={styles.offerDiscountText}>{product.discountPercent}% off</Text>
                    </View>
                  )}

                  {/* Product Image */}
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.weeklyImage}
                    contentFit="cover"
                    transition={150}
                  />

                  {/* Add / Stepper Button (Corner button matching Image 2) */}
                  <View style={styles.cardCornerAddWrap}>
                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.quickAddCircleBtn}
                        onPress={() => addItem(product, 1)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="add" size={18} color="#000000" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.cardMiniStepper}>
                        <TouchableOpacity
                          style={styles.cardStepperBtn}
                          onPress={() => updateQuantity(product.id, qty - 1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.cardStepperQty}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.cardStepperBtn, { backgroundColor: '#00E676' }]}
                          onPress={() => updateQuantity(product.id, qty + 1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={13} color="#000000" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Prices Row */}
                  <View style={styles.weeklyPriceRow}>
                    <Text style={styles.weeklySalePrice}>{product.priceEtb} ETB</Text>
                    {product.originalPriceEtb && (
                      <Text style={styles.weeklyOriginalPrice}>{product.originalPriceEtb}</Text>
                    )}
                  </View>

                  {/* Title & Weight */}
                  <Text style={styles.weeklyTitle} numberOfLines={2}>
                    {product.title}
                  </Text>
                  {product.weight && (
                    <Text style={styles.weeklyWeightText}>{product.weight}</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 5. DEPARTMENT AISLES (CIRCULAR ICONS MATCHING IMAGE 2) ── */}
        <View style={styles.departmentsSection}>
          <Text style={styles.departmentsTitle}>Fresh &amp; Aisles</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.aislesScroll}
          >
            {MARKETPLACE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.aisleItem}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.aisleIconCircle, isActive && styles.aisleIconCircleActive]}>
                    <Text style={styles.aisleEmoji}>{cat.emoji}</Text>
                  </View>
                  <Text
                    style={[styles.aisleLabel, isActive && styles.aisleLabelActive]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 6. ALL AISLE PRODUCTS GRID ── */}
        <View style={styles.gridSectionHeader}>
          <Text style={styles.gridSectionTitle}>
            {selectedCategory === 'all'
              ? 'All Supermarket Items'
              : MARKETPLACE_CATEGORIES.find((c) => c.key === selectedCategory)?.label}
          </Text>
          <Text style={styles.gridSectionCount}>{filteredProducts.length} items</Text>
        </View>

        <View style={[styles.productsGrid, isWide && { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {filteredProducts.map((product) => {
            const qty = getItemQuantity(product.id);
            return (
              <View
                key={product.id}
                style={[
                  styles.productCard,
                  isWide && { width: '31.5%', marginHorizontal: '0.9%', marginBottom: 16 },
                ]}
              >
                {/* Product Image & Badges */}
                <View style={styles.cardImageWrap}>
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} contentFit="cover" />

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

                {/* Product Body */}
                <View style={styles.cardBody}>
                  {/* Category & Weight */}
                  <View style={styles.cardHeaderMeta}>
                    <Text style={styles.brandText}>{product.brand.toUpperCase()}</Text>
                    {product.weight && <Text style={styles.weightBadge}>{product.weight}</Text>}
                  </View>

                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.title}
                  </Text>

                  {/* Fitness Macro Hero Badge */}
                  {product.proteinGrams && (
                    <View style={styles.macroPill}>
                      <Text style={styles.macroPillText}>
                        ⚡ {product.proteinGrams}g Protein
                        {product.caloriesPerServing ? ` • ${product.caloriesPerServing} kcal` : ''}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.productShortDesc} numberOfLines={2}>
                    {product.shortDescription}
                  </Text>

                  {/* Price */}
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
                      <Text style={styles.priceCoinText}>🪙 {product.priceCoins}</Text>
                    </View>
                  </View>

                  {/* Action Buttons: Add to Basket Stepper + Ask AI */}
                  <View style={styles.cardActionRow}>
                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addBasketBtn}
                        onPress={() => addItem(product, 1)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={17} color="#000000" />
                        <Text style={styles.addBasketBtnText}>Add to Basket</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.gridStepper}>
                        <TouchableOpacity
                          style={styles.gridStepperBtn}
                          onPress={() => updateQuantity(product.id, qty - 1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.gridStepperQty}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.gridStepperBtn, { backgroundColor: '#00E676' }]}
                          onPress={() => updateQuantity(product.id, qty + 1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={16} color="#000000" />
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.askAiMiniBtn}
                      onPress={() => handleOpenAiConsultation(product)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="sparkles" size={14} color="#00E676" />
                      <Text style={styles.askAiMiniText}>AI</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── 7. FLOATING SUPERMARKET DELIVERY BAR (IMAGE 2 REPLICA) ── */}
      <View style={[styles.floatingDeliveryContainer, { bottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={styles.floatingDeliveryPill}
          activeOpacity={0.9}
          onPress={() => setShowCartModal(true)}
        >
          {/* Left: Free delivery status */}
          <View style={styles.floatingLeft}>
            <View style={styles.floatingBagIconWrap}>
              <Ionicons name="bag-handle" size={16} color="#00E676" />
            </View>
            <Text style={styles.floatingDeliveryText}>
              {isFreeDelivery
                ? 'FREE Delivery Unlocked!'
                : `Free delivery at 1,500 ETB`}
            </Text>
          </View>

          {/* Right: Cart Summary Pill */}
          <View style={styles.floatingRightPill}>
            <Text style={styles.floatingCartSummary}>
              {cartTotalCount > 0
                ? `${cartTotalCount} items • ${cartTotalEtb.toLocaleString()} ETB`
                : 'View Basket'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#000000" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 8. SUPERMARKET CART MODAL ── */}
      <SupermarketCartModal
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        onOpenWallet={() => router.push('/wallet')}
        onOrderSuccess={(summary) => {
          setOrderSuccessSummary(summary);
        }}
      />

      {/* ── 9. MARKETING AI MODAL ── */}
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
            <View style={styles.aiModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={18} color="#00E676" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiModalTitle}>FitPulse Nutrition AI</Text>
                  <Text style={styles.aiModalSub} numberOfLines={1}>
                    Nutrition &amp; Diet Advisor for {selectedProductForAi?.title}
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

            {/* Pinned Product Preview */}
            {selectedProductForAi && (
              <View style={styles.pinnedProductBar}>
                <Image
                  source={{ uri: selectedProductForAi.imageUrl }}
                  style={styles.pinnedProductImg}
                  contentFit="cover"
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
                  style={styles.pinnedAddBtn}
                  onPress={() => {
                    addItem(selectedProductForAi, 1);
                    setSelectedProductForAi(null);
                    setShowCartModal(true);
                  }}
                >
                  <Text style={styles.pinnedAddBtnText}>Add +</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Chat Body */}
            <ScrollView
              ref={aiChatScrollRef}
              style={styles.aiChatBody}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {aiChatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.aiChatBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}
                >
                  <Text style={styles.aiChatText}>{msg.text}</Text>
                  <Text style={styles.aiChatTime}>{msg.timestamp}</Text>
                </View>
              ))}
              {aiLoading && (
                <View style={[styles.aiChatBubble, styles.aiBubble, { flexDirection: 'row', gap: 6 }]}>
                  <ActivityIndicator size="small" color="#00E676" />
                  <Text style={styles.aiChatText}>Analyzing nutritional macros...</Text>
                </View>
              )}
            </ScrollView>

            {/* Chat Input */}
            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiTextInput}
                placeholder="Ask about protein content, calories, prep..."
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

      {/* ── 10. ORDER SUCCESS CELEBRATION MODAL ── */}
      <Modal visible={!!orderSuccessSummary} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={40} color="#00E676" />
            </View>
            <Text style={styles.successTitle}>Supermarket Order Placed! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Your fresh high-protein groceries ({orderSuccessSummary?.itemsCount} items) have been confirmed.
            </Text>

            <View style={styles.successDetailsBox}>
              <Text style={styles.successDetailText}>
                💵 Paid: <Text style={{ color: '#00E676', fontWeight: '800' }}>{orderSuccessSummary?.totalEtb.toLocaleString()} ETB</Text>
              </Text>
              <Text style={styles.successDetailText}>
                💳 Method: {orderSuccessSummary?.paymentMethod}
              </Text>
              <Text style={styles.successDetailText}>
                🚚 Delivery: Fast courier dispatch to Addis Ababa
              </Text>
            </View>

            <TouchableOpacity
              style={styles.successCloseBtn}
              onPress={() => setOrderSuccessSummary(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.successCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#070D14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2533',
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8A95A5',
    fontSize: 11,
    marginTop: 1,
  },
  coinBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#EAB308',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  coinBadgeText: {
    color: '#FACC15',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cartHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#131D28',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  cartHeaderBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#00E676',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartHeaderBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    paddingTop: 10,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1822',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#1E2B3A',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },

  // Hero Banner (Image 2 Inspired)
  heroPromoBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 155,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  heroPromoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 12, 20, 0.72)',
  },
  heroPromoContent: {
    padding: 14,
  },
  heroTagBadge: {
    backgroundColor: '#00E676',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroTagText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroPromoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroPromoSubtitle: {
    color: '#CBD5E1',
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 8,
  },
  shopNowBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  shopNowBtnText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '900',
  },

  // % Weekly Offers (Image 2 Replica)
  weeklyOffersSection: {
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  percentIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentIconText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  goBtn: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goBtnText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
  },
  weeklyOffersScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  weeklyCard: {
    width: 140,
    backgroundColor: '#0F1822',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  offerDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  offerDiscountText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  weeklyImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: '#0B131C',
    marginBottom: 6,
  },
  cardCornerAddWrap: {
    position: 'absolute',
    top: 76,
    right: 8,
    zIndex: 3,
  },
  quickAddCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMiniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 2,
    gap: 4,
  },
  cardStepperBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStepperQty: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  weeklyPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  weeklySalePrice: {
    color: '#EF4444',
    fontSize: 13.5,
    fontWeight: '900',
  },
  weeklyOriginalPrice: {
    color: '#64748B',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  weeklyTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    lineHeight: 15,
  },
  weeklyWeightText: {
    color: '#8A95A5',
    fontSize: 10.5,
    marginTop: 2,
  },

  // Department Aisles (Circular Icons)
  departmentsSection: {
    marginTop: 20,
  },
  departmentsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  aislesScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  aisleItem: {
    alignItems: 'center',
    width: 68,
  },
  aisleIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F1822',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 5,
  },
  aisleIconCircleActive: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  aisleEmoji: {
    fontSize: 22,
  },
  aisleLabel: {
    color: '#8A95A5',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  aisleLabelActive: {
    color: '#00E676',
    fontWeight: '800',
  },

  // Grid Section
  gridSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  gridSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  gridSectionCount: {
    color: '#8A95A5',
    fontSize: 12,
  },
  productsGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },
  productCard: {
    backgroundColor: '#0F1822',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardImageWrap: {
    height: 150,
    backgroundColor: '#0B131C',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cardTopPills: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  discountPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: 12,
  },
  cardHeaderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    color: '#00E676',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weightBadge: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  macroPill: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 5,
  },
  macroPillText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
  },
  productShortDesc: {
    color: '#8A95A5',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceEtbText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  originalPriceText: {
    color: '#64748B',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  priceCoinPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceCoinText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBasketBtn: {
    flex: 1,
    backgroundColor: '#00E676',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addBasketBtnText: {
    color: '#000000',
    fontSize: 12.5,
    fontWeight: '900',
  },
  gridStepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
  },
  gridStepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridStepperQty: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  askAiMiniBtn: {
    backgroundColor: '#131D28',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  askAiMiniText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '800',
  },

  // Floating Delivery & Cart Bar (Image 2 Replica)
  floatingDeliveryContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  floatingDeliveryPill: {
    backgroundColor: '#0F1822',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  floatingBagIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingDeliveryText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingRightPill: {
    backgroundColor: '#00E676',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingCartSummary: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },

  // AI Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  aiModalContainer: {
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    borderWidth: 1,
    borderColor: '#1E293B',
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
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  aiModalSub: {
    color: '#8A95A5',
    fontSize: 11.5,
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
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  pinnedProductImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1F2937',
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
  pinnedAddBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pinnedAddBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  aiChatBody: {
    flex: 1,
  },
  aiChatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    borderTopRightRadius: 4,
  },
  aiChatText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  aiChatTime: {
    color: '#64748B',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    gap: 10,
  },
  aiTextInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
  },
  aiSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Success Celebration Box
  successBox: {
    backgroundColor: '#0F1822',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    color: '#8A95A5',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  successDetailsBox: {
    backgroundColor: '#131D28',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    gap: 6,
  },
  successDetailText: {
    color: '#E2E8F0',
    fontSize: 12.5,
  },
  successCloseBtn: {
    backgroundColor: '#00E676',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  successCloseBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
