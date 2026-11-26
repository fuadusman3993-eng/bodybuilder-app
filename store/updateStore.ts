import { create } from 'zustand';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

export interface UpdateFeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface UpdateStoreState {
  status: UpdateStatus;
  progress: number; // 0 to 100
  isModalVisible: boolean;
  versionName: string;
  changelog: UpdateFeatureItem[];
  errorMessage?: string;

  // Actions
  setStatus: (status: UpdateStatus) => void;
  setProgress: (progress: number) => void;
  setModalVisible: (visible: boolean) => void;
  setUpdateAvailable: (features?: UpdateFeatureItem[], version?: string) => void;
  setDownloading: () => void;
  setReady: () => void;
  setError: (msg?: string) => void;
  reset: () => void;
}

const DEFAULT_CHANGELOG: UpdateFeatureItem[] = [
  {
    id: '1',
    icon: 'images-outline',
    title: 'Cinematic Banners & Framing',
    description: 'Recalibrated 16:9 ratio and softened vignette so athlete photos shine.',
  },
  {
    id: '2',
    icon: 'server-outline',
    title: 'Telegram-Style Smart Disk Cache',
    description: 'Instant 0ms offline loading for Marketplace products and workout media.',
  },
  {
    id: '3',
    icon: 'sparkles-outline',
    title: 'Smooth Neon Glow Buttons',
    description: 'Enhanced touch-bounce animation and seamless radiant green glow.',
  },
  {
    id: '4',
    icon: 'arrow-forward-circle-outline',
    title: 'Clean Navigation Arrows',
    description: 'Crisp vector icon arrows across all Home & Challenge hubs.',
  },
];

export const useUpdateStore = create<UpdateStoreState>((set) => ({
  status: 'idle',
  progress: 0,
  isModalVisible: false,
  versionName: 'Feature Update',
  changelog: DEFAULT_CHANGELOG,
  errorMessage: undefined,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setModalVisible: (isModalVisible) => set({ isModalVisible }),

  setUpdateAvailable: (features, version) =>
    set({
      status: 'available',
      isModalVisible: true,
      progress: 0,
      changelog: features && features.length > 0 ? features : DEFAULT_CHANGELOG,
      versionName: version || 'Feature Update',
      errorMessage: undefined,
    }),

  setDownloading: () =>
    set({
      status: 'downloading',
      progress: 10,
    }),

  setReady: () =>
    set({
      status: 'ready',
      progress: 100,
    }),

  setError: (msg) =>
    set({
      status: 'error',
      errorMessage: msg || 'Unable to complete update. You can try again later.',
    }),

  reset: () =>
    set({
      status: 'idle',
      progress: 0,
      isModalVisible: false,
      errorMessage: undefined,
    }),
}));
