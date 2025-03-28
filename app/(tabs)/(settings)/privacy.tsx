import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Eye, Lock, Share2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const privacySettings = [
  {
    title: 'Security',
    icon: Lock,
    items: [
      { label: 'Two-Factor Authentication', key: 'two_factor_auth', description: 'Add an extra layer of security to your account' },
      { label: 'Biometric Lock', key: 'biometric_lock', description: Platform.OS === 'web' ? 'Use WebAuthn for secure authentication' : 'Use fingerprint or face recognition to unlock the app' },
      { label: 'App Lock', key: 'app_lock', description: 'Require authentication every time you open the app' },
    ],
  },
  {
    title: 'Data Privacy',
    icon: Shield,
    items: [
      { label: 'Data Collection', key: 'data_collection', description: 'Allow us to collect usage data to improve our services' },
      { label: 'Analytics', key: 'analytics', description: 'Help us understand how you use the app' },
      { label: 'Personalized Content', key: 'personalization', description: 'Receive personalized recommendations and content' },
    ],
  },
  {
    title: 'Sharing',
    icon: Share2,
    items: [
      { label: 'Share Health Data', key: 'share_health_data', description: 'Share your health data with healthcare providers' },
      { label: 'Share with Doctors', key: 'share_with_doctors', description: 'Allow doctors to access your eye scan results' },
      { label: 'Anonymous Data Contribution', key: 'anonymous_data', description: 'Contribute anonymized data to improve AI accuracy' },
    ],
  },
];

const defaultSettings = {
  two_factor_auth: false,
  biometric_lock: false,
  app_lock: false,
  data_collection: true,
  analytics: true,
  personalization: true,
  share_health_data: false,
  share_with_doctors: true,
  anonymous_data: true,
};

export default function PrivacyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, boolean>>(defaultSettings);

  useEffect(() => {
    if (!user) return;
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      let { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const { data: newData, error: insertError } = await supabase
            .from('privacy_settings')
            .insert([{ user_id: user?.id, ...defaultSettings }])
            .select()
            .single();

          if (insertError) throw insertError;
          data = newData;
        } else {
          throw error;
        }
      }
      
      if (data) {
        const { id, user_id, created_at, updated_at, ...preferences } = data;
        setSettings(preferences);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupWebAuthn = async () => {
    if (!window.PublicKeyCredential) {
      Alert.alert(
        'Not Supported',
        'Your browser does not support biometric authentication. Please use a modern browser that supports WebAuthn.'
      );
      return false;
    }

    try {
      // Check if biometric authentication is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        Alert.alert(
          'Not Available',
          'Biometric authentication is not available on your device.'
        );
        return false;
      }

      // Create biometric credentials
      const publicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: {
          name: 'EyeHealth AI',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: user?.email || '',
          displayName: user?.email || '',
        },
        pubKeyCredParams: [{
          type: 'public-key',
          alg: -7
        }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      return true;
    } catch (error) {
      console.error('WebAuthn setup error:', error);
      Alert.alert(
        'Setup Failed',
        'Failed to set up biometric authentication. Please try again.'
      );
      return false;
    }
  };

  const handleToggle = async (key: string) => {
    if (!user || saving) return;

    // Special handling for biometric lock on web
    if (key === 'biometric_lock' && Platform.OS === 'web' && !settings[key]) {
      const success = await setupWebAuthn();
      if (!success) return;
    }

    const newValue = !settings[key];
    setSaving(true);

    try {
      const { error } = await supabase
        .from('privacy_settings')
        .update({ [key]: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: newValue,
      }));
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.admin.deleteUser(user!.id);
              if (error) throw error;
              router.replace('/onboarding');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Control how your data is collected, used, and shared. We prioritize your privacy and security.
        </Text>

        {privacySettings.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <section.icon size={20} color="#666666" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    value={settings[item.key] ?? false}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    ios_backgroundColor="#E5E5EA"
                    disabled={saving}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 24,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 40,
  },
});