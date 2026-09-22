import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  TextInput, KeyboardAvoidingView, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import { Colors } from '../constants/colors';

// Custom stacked input for Coach onboarding
const CoachInput = ({ 
  icon, label, placeholder, value, onChangeText, required = false, isDropdown = false, isTextArea = false, maxLength 
}: any) => {
  return (
    <View style={[styles.inputCard, isTextArea && styles.textAreaCard]}>
      <View style={styles.inputIconContainer}>
        <Ionicons name={icon} size={24} color="#888" />
      </View>
      <View style={styles.inputContent}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
        </Text>
        {isDropdown ? (
          <View style={styles.dropdownValue}>
            <Text style={[styles.inputText, !value && { color: '#666' }]}>
              {value || placeholder}
            </Text>
          </View>
        ) : (
          <TextInput
            style={[styles.inputText, isTextArea && styles.textAreaInput]}
            placeholder={placeholder}
            placeholderTextColor="#666"
            value={value}
            onChangeText={onChangeText}
            multiline={isTextArea}
            maxLength={maxLength}
            textAlignVertical={isTextArea ? 'top' : 'center'}
          />
        )}
      </View>
      {isDropdown && (
        <Ionicons name="chevron-down" size={20} color="#666" style={{ marginRight: 16 }} />
      )}
      {isTextArea && maxLength && (
        <Text style={styles.charCount}>{value?.length || 0}/{maxLength}</Text>
      )}
    </View>
  );
};

export default function CoachOnboardingScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    specialization: '',
    experienceLevel: '',
    yearsExp: '',
    about: '',
  });

  const handleContinue = () => {
    // Save to Firestore here later
    router.replace('/(coach-tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Logo size="small" />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.circle, styles.circleActive]}>
                <Text style={styles.circleTextActive}>1</Text>
              </View>
              <Text style={styles.stepLabel}>Account Type</Text>
            </View>
            
            <View style={[styles.progressLine, styles.lineActive]} />
            
            <View style={styles.progressStep}>
              <View style={[styles.circle, styles.circleActive]}>
                <Text style={styles.circleTextActive}>2</Text>
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>Professional Info</Text>
            </View>
            
            <View style={styles.progressLine} />
            
            <View style={styles.progressStep}>
              <View style={styles.circle}>
                <Text style={styles.circleText}>3</Text>
              </View>
              <Text style={styles.stepLabel}>Complete Profile</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleIcon}>
              <Ionicons name="person-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.title}>
              Coach <Text style={{ color: Colors.primary }}>Information</Text>
            </Text>
            <Text style={styles.subtitle}>
              Tell us about your coaching background and experience. This helps us verify your profile and connect you with the right clients.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <CoachInput 
              icon="person-outline" label="Full Name" placeholder="Enter your full name" required
              value={form.fullName} onChangeText={(text: string) => setForm({...form, fullName: text})}
            />
            
            <CoachInput 
              icon="call-outline" label="Phone Number" placeholder="+251 9XX XXX XXX" required
              value={form.phone} onChangeText={(text: string) => setForm({...form, phone: text})}
            />
            
            <TouchableOpacity activeOpacity={0.7}>
              <CoachInput 
                icon="barbell-outline" label="Specialization" placeholder="Select your main specialization" required isDropdown
                value={form.specialization}
              />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <CoachInput 
                icon="ribbon-outline" label="Experience Level" placeholder="Select your experience level" required isDropdown
                value={form.experienceLevel}
              />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <CoachInput 
                icon="calendar-outline" label="Years of Experience" placeholder="e.g. 3 years" required isDropdown
                value={form.yearsExp}
              />
            </TouchableOpacity>

            <CoachInput 
              icon="document-text-outline" label="About You" 
              placeholder="Tell us about your training style, certifications, and what makes you unique..." required 
              isTextArea maxLength={500}
              value={form.about} onChangeText={(text: string) => setForm({...form, about: text})}
            />
          </View>

          {/* Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Upload Your Credentials</Text>
            <Text style={styles.uploadSubtitle}>Add your certifications, licenses or proof of experience{'\n'}(optional but recommended).</Text>
            
            <TouchableOpacity style={styles.uploadCard} activeOpacity={0.8}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload-outline" size={28} color="#AAA" />
              </View>
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTextTitle}>Upload Files</Text>
                <Text style={styles.uploadTextDesc}>PDF, JPG, PNG • Max 10MB</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.continueBtn} activeOpacity={0.8} onPress={handleContinue}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomBackBtn} onPress={() => router.back()}>
              <Text style={styles.bottomBackText}>Back</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, maxWidth: 500, alignSelf: 'center', width: '100%' },
  
  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginVertical: 32 },
  progressStep: { alignItems: 'center', flex: 1 },
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: '#000' },
  circleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  circleText: { color: '#666', fontSize: 14, fontWeight: '700' },
  circleTextActive: { color: '#000', fontSize: 14, fontWeight: '700' },
  stepLabel: { color: '#666', fontSize: 11, textAlign: 'center' },
  stepLabelActive: { color: '#FFF', fontWeight: '600' },
  progressLine: { flex: 1.5, height: 2, backgroundColor: '#333', marginTop: 15 },
  lineActive: { backgroundColor: Colors.primary },

  // Title
  titleSection: { marginBottom: 32 },
  titleIcon: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 14, lineHeight: 22 },

  // Inputs
  formContainer: { gap: 16, marginBottom: 40 },
  inputCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, borderWidth: 1, borderColor: '#222', minHeight: 76, paddingRight: 16 },
  textAreaCard: { alignItems: 'flex-start', paddingBottom: 24 },
  inputIconContainer: { width: 64, justifyContent: 'center', alignItems: 'center', paddingTop: 26 },
  inputContent: { flex: 1, paddingTop: 16, paddingBottom: 12 },
  inputLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  inputText: { color: '#FFF', fontSize: 15, padding: 0, margin: 0 },
  dropdownValue: { height: 20, justifyContent: 'center' },
  textAreaInput: { minHeight: 80 },
  charCount: { position: 'absolute', bottom: 12, right: 16, color: '#555', fontSize: 11 },

  // Upload
  uploadSection: { marginBottom: 40 },
  uploadTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  uploadSubtitle: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, borderWidth: 1, borderColor: '#222', padding: 16 },
  uploadIconContainer: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  uploadContent: { flex: 1 },
  uploadTextTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  uploadTextDesc: { color: '#888', fontSize: 12 },

  // Bottom Actions
  actionsContainer: { gap: 20, alignItems: 'center' },
  continueBtn: { width: '100%', height: 56, backgroundColor: Colors.primary, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  continueBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  bottomBackBtn: { padding: 8 },
  bottomBackText: { color: '#888', fontSize: 15 },
});
