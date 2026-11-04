import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storage from './storage';
import { MarketplaceProduct } from '../lib/marketplaceData';

export interface CartItem {
  product: MarketplaceProduct;
  quantity: number;
}

export const FREE_DELIVERY_THRESHOLD_ETB = 1500;
export const STANDARD_DELIVERY_FEE_ETB = 100;

interface SupermarketCartState {
  items: Record<string, CartItem>;
  deliveryAddress: string;

  // Actions
  addItem: (product: MarketplaceProduct, count?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryAddress: (address: string) => void;

  // Getters / Selectors
  getItemQuantity: (productId: string) => number;
  getTotalItemsCount: () => number;
  getTotalPriceEtb: () => number;
  getTotalPriceCoins: () => number;
  getDeliveryFee: () => number;
  isFreeDeliveryEligible: () => boolean;
}

export const useSupermarketCartStore = create<SupermarketCartState>()(
  persist(
    (set, get) => ({
      items: {},
      deliveryAddress: 'Addis Ababa, Bole (Near Edna Mall)',

      addItem: (product, count = 1) => {
        set((state) => {
          const current = state.items[product.id];
          const newQty = (current ? current.quantity : 0) + count;
          return {
            items: {
              ...state.items,
              [product.id]: {
                product,
                quantity: newQty,
              },
            },
          };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const next = { ...state.items };
          delete next[productId];
          return { items: next };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const next = { ...state.items };
            delete next[productId];
            return { items: next };
          }
          const existing = state.items[productId];
          if (!existing) return state;
          return {
            items: {
              ...state.items,
              [productId]: {
                ...existing,
                quantity,
              },
            },
          };
        });
      },

      clearCart: () => set({ items: {} }),

      setDeliveryAddress: (address) => set({ deliveryAddress: address }),

      getItemQuantity: (productId) => {
        return get().items[productId]?.quantity || 0;
      },

      getTotalItemsCount: () => {
        return Object.values(get().items).reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPriceEtb: () => {
        return Object.values(get().items).reduce(
          (sum, item) => sum + item.product.priceEtb * item.quantity,
          0
        );
      },

      getTotalPriceCoins: () => {
        return Object.values(get().items).reduce(
          (sum, item) => sum + item.product.priceCoins * item.quantity,
          0
        );
      },

      getDeliveryFee: () => {
        const total = get().getTotalPriceEtb();
        if (total === 0 || total >= FREE_DELIVERY_THRESHOLD_ETB) return 0;
        return STANDARD_DELIVERY_FEE_ETB;
      },

      isFreeDeliveryEligible: () => {
        return get().getTotalPriceEtb() >= FREE_DELIVERY_THRESHOLD_ETB;
      },
    }),
    {
      name: 'fitpulse_supermarket_cart',
      storage: createJSONStorage(() => storage),
    }
  )
);
