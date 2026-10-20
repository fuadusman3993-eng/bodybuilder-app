import storage from '../store/storage';

export interface SavedAccount {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'coach';
  authProvider?: 'google' | 'password';
  savedAt: number;
}

const SAVED_ACCOUNT_KEY = 'fitpulse_last_saved_account';

/**
 * Save user account details on the device so it can be suggested
 * when the user logs out or accesses the app as a guest.
 */
export async function saveLastAccount(account: Omit<SavedAccount, 'savedAt'>): Promise<void> {
  try {
    const payload: SavedAccount = {
      ...account,
      savedAt: Date.now(),
    };
    await storage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not save account details to storage:', e);
  }
}

/**
 * Retrieve the previously saved account from the device.
 */
export async function getLastSavedAccount(): Promise<SavedAccount | null> {
  try {
    const raw = await storage.getItem(SAVED_ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedAccount;
  } catch (e) {
    console.warn('Could not read saved account from storage:', e);
    return null;
  }
}

/**
 * Remove the saved account from the device.
 */
export async function removeSavedAccount(): Promise<void> {
  try {
    await storage.removeItem(SAVED_ACCOUNT_KEY);
  } catch (e) {
    console.warn('Could not remove saved account:', e);
  }
}
