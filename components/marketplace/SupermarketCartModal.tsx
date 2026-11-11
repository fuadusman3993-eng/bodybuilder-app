import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../store/themeStore';
import {
  useSupermarketCartStore,
  FREE_DELIVERY_THRESHOLD_ETB,
} from '../../store/supermarketCartStore';

interface SupermarketCartModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderSuccess: (orderSummary: { itemsCount: number; totalEtb: number; paymentMethod: string }) => void;
  onOpenWallet: () => void;
}

export default function SupermarketCartModal({
  visible,
  onClose,
  onOrderSuccess,
  onOpenWallet,
}: SupermarketCartModalProps) {
  const { colors } = useTheme();
  const { user, updateCoins } = useUserStore();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryAddress,
    setDeliveryAddress,
    getTotalItemsCount,
    getTotalPriceEtb,
    getTotalPriceCoins,
    getDeliveryFee,
    isFreeDeliveryEligible,
  } = useSupermarketCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'coins'>('telebirr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(deliveryAddress);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItemsList = Object.values(items);
  const totalCount = getTotalItemsCount();
  const subtotalEtb = getTotalPriceEtb();
  const totalCoins = getTotalPriceCoins();
  const deliveryFee = getDeliveryFee();
  const grandTotalEtb = subtotalEtb + deliveryFee;
  const isFreeDelivery = isFreeDeliveryEligible();
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_ETB - subtotalEtb);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotalEtb / FREE_DELIVERY_THRESHOLD_ETB) * 100));

  const handleCheckout = () => {
    if (cartItemsList.length === 0) return;

    if (paymentMethod === 'coins') {
      const userCoins = user.coinsBalance || 0;
      if (userCoins < totalCoins) {
        Alert.alert(
          'Insufficient Coins (ያልበቃ የኮይን ሂሳብ)',
          `ይህን ትዕዛዝ ለመፈጸም ${totalCoins} Coins ያስፈልጎታል። የእርስዎ ቀሪ ሂሳብ ${userCoins} Coins ነው። እባክዎ ኮይን ይጨምሩ።`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Coins 🪙',
              onPress: () => {
                onClose();
                onOpenWallet();
              },
            },
          ]
        );
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        updateCoins(userCoins - totalCoins);
        clearCart();
        setIsSubmitting(false);
        onClose();
        onOrderSuccess({
          itemsCount: totalCount,
          totalEtb: grandTotalEtb,
          paymentMethod: 'FitPulse Coins 🪙',
        });
      }, 1200);
    } else {
      // Telebirr / Chapa Instant Order
      setIsSubmitting(true);
      setTimeout(() => {
        clearCart();
        setIsSubmitting(false);
        onClose();
        onOrderSuccess({
          itemsCount: totalCount,
          totalEtb: grandTotalEtb,
          paymentMethod: 'Telebirr / CBE (Chapa)',
        });
      }, 1500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          {/* Sheet Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.headerIconCircle, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="basket" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Supermarket Basket</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>{totalCount} healthy items selected</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Free Delivery Meter */}
          <View style={[styles.deliveryProgressCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <View style={styles.deliveryProgressHeader}>
              <Ionicons
                name={isFreeDelivery ? 'checkmark-circle' : 'bicycle'}
                size={16}
                color={isFreeDelivery ? colors.primary : '#60A5FA'}
              />
              <Text style={[styles.deliveryProgressTitle, { color: colors.textPrimary }]}>
                {isFreeDelivery
                  ? '🎉 You unlocked FREE Supermarket Delivery!'
                  : `Add ${amountToFreeDelivery.toLocaleString()} ETB more for FREE Delivery`}
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${freeDeliveryProgress}%` },
                  isFreeDelivery ? { backgroundColor: colors.primary } : { backgroundColor: '#38BDF8' },
                ]}
              />
            </View>
          </View>

          {/* Cart Items List */}
          {cartItemsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🧺</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your basket is empty</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Add chicken breasts, farm eggs, fresh fruits, or oats to fuel your workouts!
              </Text>
              <TouchableOpacity style={[styles.startShoppingBtn, { backgroundColor: colors.primary }]} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.startShoppingBtnText}>Browse Supermarket ➔</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.itemsScroll}>
              <View style={styles.itemsList}>
                {cartItemsList.map(({ product, quantity }) => (
                  <View key={product.id} style={[styles.cartItemRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                    {/* Thumbnail */}
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                      transition={150}
                    />

                    {/* Details */}
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {product.title}
                      </Text>
                      <View style={styles.itemMetaRow}>
                        {product.weight && <Text style={[styles.itemWeightPill, { backgroundColor: colors.surface, color: colors.textSecondary }]}>{product.weight}</Text>}
                        {product.proteinGrams && (
                          <Text style={[styles.itemProteinBadge, { color: colors.primary }]}>⚡ {product.proteinGrams}g Protein</Text>
                        )}
                      </View>
                      <Text style={[styles.itemPriceText, { color: colors.textPrimary }]}>
                        {(product.priceEtb * quantity).toLocaleString()} ETB
                        <Text style={styles.itemCoinsSub}> • 🪙 {product.priceCoins * quantity}</Text>
                      </Text>
                    </View>

                    {/* Stepper */}
                    <View style={[styles.stepperContainer, { backgroundColor: colors.surface }]}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(product.id, quantity - 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={quantity === 1 ? 'trash-outline' : 'remove'}
                          size={15}
                          color={quantity === 1 ? '#EF4444' : '#FFFFFF'}
                        />
                      </TouchableOpacity>

                      <Text style={[styles.stepperQtyText, { color: colors.textPrimary }]}>{quantity}</Text>

                      <TouchableOpacity
                        style={[styles.stepperBtn, styles.stepperBtnAdd, { backgroundColor: colors.primary }]}
                        onPress={() => updateQuantity(product.id, quantity + 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={15} color="#000000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Delivery Address Section */}
              <View style={[styles.addressCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <View style={styles.addressHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <Text style={[styles.addressHeaderTitle, { color: colors.textPrimary }]}>Delivery Destination</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (isEditingAddress) {
                        setDeliveryAddress(tempAddress);
                        setIsEditingAddress(false);
                      } else {
                        setIsEditingAddress(true);
                      }
                    }}
                  >
                    <Text style={[styles.addressEditBtnText, { color: colors.primary }]}>
                      {isEditingAddress ? 'Save' : 'Change'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isEditingAddress ? (
                  <TextInput
                    style={[styles.addressInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={tempAddress}
                    onChangeText={setTempAddress}
                    placeholder="Enter delivery address in Addis Ababa..."
                    placeholderTextColor={colors.textMuted}
                  />
                ) : (
                  <Text style={[styles.addressText, { color: colors.textPrimary }]}>{deliveryAddress}</Text>
                )}
              </View>

              {/* Payment Method Selector */}
              <View style={styles.paymentSection}>
                <Text style={[styles.paymentSectionTitle, { color: colors.textPrimary }]}>Payment Method</Text>

                <View style={styles.paymentOptionsRow}>
                  {/* Telebirr / Chapa */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionCard,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                      paymentMethod === 'telebirr' && { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
                    ]}
                    onPress={() => setPaymentMethod('telebirr')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionHeader}>
                      <Ionicons
                        name="phone-portrait"
                        size={18}
                        color={paymentMethod === 'telebirr' ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.paymentOptionTitle,
                          { color: colors.textPrimary },
                          paymentMethod === 'telebirr' && { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        Telebirr / CBE
                      </Text>
                    </View>
                    <Text style={[styles.paymentOptionSub, { color: colors.textMuted }]}>Instant Chapa mobile payment</Text>
                  </TouchableOpacity>

                  {/* FitPulse Coins */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionCard,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                      paymentMethod === 'coins' && { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
                    ]}
                    onPress={() => setPaymentMethod('coins')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentOptionHeader}>
                      <Text style={{ fontSize: 16 }}>🪙</Text>
                      <Text
                        style={[
                          styles.paymentOptionTitle,
                          { color: colors.textPrimary },
                          paymentMethod === 'coins' && { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        Coins ({user.coinsBalance || 0})
                      </Text>
                    </View>
                    <Text style={[styles.paymentOptionSub, { color: colors.textMuted }]}>Pay {totalCoins} FitPulse Coins</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Breakdown */}
              <View style={[styles.billCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textMuted }]}>Groceries Subtotal</Text>
                  <Text style={[styles.billValue, { color: colors.textPrimary }]}>{subtotalEtb.toLocaleString()} ETB</Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textMuted }]}>Supermarket Delivery</Text>
                  <Text
                    style={[
                      styles.billValue,
                      { color: colors.textPrimary },
                      deliveryFee === 0 && { color: colors.primary, fontWeight: '800' },
                    ]}
                  >
                    {deliveryFee === 0 ? 'FREE' : `${deliveryFee} ETB`}
                  </Text>
                </View>

                <View style={[styles.billRow, styles.grandTotalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.grandTotalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.grandTotalValue, { color: colors.primary }]}>{grandTotalEtb.toLocaleString()} ETB</Text>
                    <Text style={styles.grandTotalCoinsSub}>or 🪙 {totalCoins} Coins</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Checkout Action Footer */}
          {cartItemsList.length > 0 && (
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.checkoutBtn, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCheckout}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="bag-check" size={20} color="#000000" />
                      <Text style={styles.checkoutBtnText}>Place Supermarket Order</Text>
                    </View>
                    <Text style={styles.checkoutBtnAmount}>{grandTotalEtb.toLocaleString()} ETB</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0A0F14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    color: '#8A95A5',
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryProgressCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#131B24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  deliveryProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  deliveryProgressTitle: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  itemsScroll: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  itemsList: {
    gap: 10,
    paddingVertical: 6,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B24',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0F172A',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  itemWeightPill: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemProteinBadge: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
  },
  itemPriceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  itemCoinsSub: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 3,
    gap: 6,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: '#00E676',
  },
  stepperQtyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: '#131B24',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressHeaderTitle: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  addressEditBtnText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },
  addressText: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
  },
  addressInput: {
    backgroundColor: '#0A0F14',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  paymentSection: {
    marginTop: 14,
  },
  paymentSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOptionCard: {
    flex: 1,
    backgroundColor: '#131B24',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  paymentOptionCardActive: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  paymentOptionTitle: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  paymentOptionTitleActive: {
    color: '#FFFFFF',
  },
  paymentOptionSub: {
    color: '#64748B',
    fontSize: 11,
  },
  billCard: {
    backgroundColor: '#131B24',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    color: '#94A3B8',
    fontSize: 12.5,
  },
  billValue: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    marginTop: 2,
  },
  grandTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  grandTotalValue: {
    color: '#00E676',
    fontSize: 17,
    fontWeight: '900',
  },
  grandTotalCoinsSub: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  checkoutBtn: {
    backgroundColor: '#00E676',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  checkoutBtnAmount: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#8A95A5',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  startShoppingBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startShoppingBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
});
