import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) return;

      try {
        // Check if user is admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (adminError && adminError.code !== 'PGRST116') {
          console.error('Admin check error:', adminError);
          throw adminError;
        }

        // If user is admin, allow access
        if (adminData) {
          setIsVerified(true);
          return;
        }

        // For regular users, check verification status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile check error:', profileError);
          throw profileError;
        }

        if (!profileData) {
          throw new Error('Profile not found');
        }

        setIsVerified(profileData.verification_status === 'approved');
      } catch (error) {
        console.error('Verification check error:', error);
        setIsVerified(false);
      }
    };

    checkVerificationStatus();
  }, [user]);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Your existing scan handling code here
      // ...

    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to process scan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking verification
  if (isVerified === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect unverified users to home screen
  if (!isVerified) {
    Alert.alert(
      'Access Denied',
      'Your account needs to be approved before you can use this feature.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
    );
    return null;
  }

  // Rest of your existing component code...
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
}); 