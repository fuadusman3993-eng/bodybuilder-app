import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import { loginWithGoogle, firebaseErrorMessage } from '../../lib/authService';
import { getLastSavedAccount, saveLastAccount, removeSavedAccount, SavedAccount } from '../../lib/savedAccountService';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TikTokAuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

// Authentic Google Multi-Color "G" Icon Replica
function GoogleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function TikTokAuthModal({
  visible,
  onClose,
  initialMode = 'login',
}: TikTokAuthModalProps) {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [savedAccount, setSavedAccount] = useState<SavedAccount | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Sync mode when prop changes
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      loadSavedAccount();
    }
  }, [visible, initialMode]);

  const loadSavedAccount = async () => {
    const acc = await getLastSavedAccount();
    setSavedAccount(acc);
  };

  const handleHelpPress = () => {
    Alert.alert(
      'FitPulse Support',
      'Need help logging in? Contact support at support@fitpulse.et or choose "Use phone/email/username" to reset your password.',
      [{ text: 'OK' }]
    );
  };

  const handleUseEmail = () => {
    onClose();
    if (mode === 'signup') {
      router.push('/role-selection');
    } else {
      router.push('/login');
    }
  };

  const saveAndCheckUser = async (uid: string, name: string, email: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      let isProfileComplete = false;
      let existingProfileData: any = null;

      if (snap.exists()) {
        isProfileComplete = !!snap.data().country;
      }

      if (email) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', email));
          const querySnap = await getDocs(q);
          querySnap.forEach((d) => {
            const data = d.data();
            if (data && (data.country || data.username || data.role || data.city)) {
              existingProfileData = data;
              isProfileComplete = true;
            }
          });
        } catch (_) {}
      }

      const dataToSave: any = {
        name: existingProfileData?.name || name,
        email,
        updatedAt: serverTimestamp(),
      };

      if (!snap.exists()) {
        dataToSave.createdAt = serverTimestamp();
        dataToSave.role = existingProfileData?.role || 'user';
      }

      await setDoc(docRef, dataToSave, { merge: true });
      return isProfileComplete;
    } catch (_) {
      return false;
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      const name = user.displayName || user.email?.split('@')[0] || 'User';
      const email = user.email || '';
      const avatar = user.photoURL || undefined;

      // Save account for next time
      await saveLastAccount({
        uid: user.uid,
        name,
        email,
        avatar,
        authProvider: 'google',
      });

      const isComplete = await saveAndCheckUser(user.uid, name, email);
      setUser({ uid: user.uid, tier: UserTier.FREE, name, avatar });

      onClose();
      if (!isComplete) {
        router.replace('/create-profile');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        const msg = firebaseErrorMessage(err?.code || '');
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Google Sign-In', msg);
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleContinueAsSaved = async () => {
    if (!savedAccount) return;
    if (savedAccount.authProvider === 'google') {
      await handleGoogleAuth();
    } else {
      onClose();
      router.push({
        pathname: '/login',
        params: { prefillEmail: savedAccount.email },
      });
    }
  };

  const handleForgetSavedAccount = async () => {
    await removeSavedAccount();
    setSavedAccount(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Top Handle */}
              <View style={styles.handle} />

              {/* Top Action Row: Help (?) & Close (X) */}
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.circleIconBtn}
                  onPress={handleHelpPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle-outline" size={24} color="#A0A0A0" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleIconBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>

              {/* Title (Matching Image 2: "Log in to FitPulse" / "Sign up for FitPulse") */}
              <Text style={styles.sheetTitle}>
                {mode === 'login' ? 'Log in to FitPulse' : 'Sign up for FitPulse'}
              </Text>

              {/* SAVED ACCOUNT ONE-TAP CARD (Matching Image 3 Google One Tap Style) */}
              {savedAccount && mode === 'login' && (
                <View style={styles.savedAccountContainer}>
                  <TouchableOpacity
                    style={styles.savedAccountCard}
                    activeOpacity={0.82}
                    onPress={handleContinueAsSaved}
                  >
                    {/* User Avatar */}
                    {savedAccount.avatar ? (
                      <Image
                        source={{ uri: savedAccount.avatar }}
                        style={styles.savedAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.savedAvatarFallback}>
                        <Text style={styles.savedAvatarInitial}>
                          {(savedAccount.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* User Info */}
                    <View style={styles.savedAccountTextWrap}>
                      <Text style={styles.savedAccountName} numberOfLines={1}>
                        Continue as {savedAccount.name}
                      </Text>
                      <Text style={styles.savedAccountEmail} numberOfLines={1}>
                        {savedAccount.email}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.forgetAccountBtn}
                    onPress={handleForgetSavedAccount}
                  >
                    <Text style={styles.forgetAccountText}>Remove saved account</Text>
                  </TouchableOpacity>

                  <View style={styles.orDividerRow}>
                    <View style={styles.orDividerLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.orDividerLine} />
                  </View>
                </View>
              )}

              {/* ACTION BUTTON 1: Use phone/email/username */}
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.85}
                onPress={handleUseEmail}
              >
                <View style={styles.actionIconLeft}>
                  <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnText}>Use phone / email / username</Text>
                <View style={styles.actionIconSpacer} />
              </TouchableOpacity>

              {/* ACTION BUTTON 2: Continue with Google */}
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.85}
                onPress={handleGoogleAuth}
                disabled={isGoogleLoading}
              >
                <View style={styles.actionIconLeft}>
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <GoogleIcon />
                  )}
                </View>
                <Text style={styles.actionBtnText}>Continue with Google</Text>
                <View style={styles.actionIconSpacer} />
              </TouchableOpacity>

              {/* Disclaimer matching Image 2 */}
              <Text style={styles.disclaimerText}>
                By continuing with an account located in Ethiopia, you agree to our{' '}
                <Text style={styles.disclaimerLink}>Terms of Service</Text> and acknowledge
                that you have read our{' '}
                <Text style={styles.disclaimerLink}>Privacy Policy</Text>.
              </Text>

              {/* Bottom Sticky Toggle Footer (Matching Image 2) */}
              <View style={styles.footerRow}>
                {mode === 'login' ? (
                  <View style={styles.footerInline}>
                    <Text style={styles.footerPrompt}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => setMode('signup')} activeOpacity={0.7}>
                      <Text style={styles.footerHighlight}>Sign up</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.footerInline}>
                    <Text style={styles.footerPrompt}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => setMode('login')} activeOpacity={0.7}>
                      <Text style={styles.footerHighlight}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 24,
  },

  // ── Saved Account Suggestion Card (Image 3) ──
  savedAccountContainer: {
    marginBottom: 16,
  },
  savedAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    gap: 12,
  },
  savedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  savedAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  savedAvatarInitial: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  savedAccountTextWrap: {
    flex: 1,
  },
  savedAccountName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  savedAccountEmail: {
    color: '#A0A0A0',
    fontSize: 12.5,
    marginTop: 2,
  },
  forgetAccountBtn: {
    alignSelf: 'flex-end',
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  forgetAccountText: {
    color: '#707070',
    fontSize: 11.5,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222222',
  },
  orText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Action Buttons matching Image 2 ──
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181818',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242424',
  },
  actionIconLeft: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionIconSpacer: {
    width: 24,
  },

  // ── Terms & Disclaimer ──
  disclaimerText: {
    color: '#7E8896',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  disclaimerLink: {
    color: '#A0A0A0',
    fontWeight: '600',
  },

  // ── Footer Row ──
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrompt: {
    color: '#8A8A8A',
    fontSize: 14.5,
  },
  footerHighlight: {
    color: Colors.primary,
    fontSize: 14.5,
    fontWeight: '700',
  },
});
