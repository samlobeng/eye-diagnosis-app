import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Upload, Bell } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);

  const handleUploadImage = async () => {
    let selectedImages: string[] = [];

    Alert.alert(
      'Select Source',
      'Choose where to pick images from',
      [
        {
          text: 'Photos',
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              alert('Permission denied!');
              return;
            }

            const imagePickerResult = await ImagePicker.launchImageLibraryAsync(
              {
                mediaTypes: 'images', // Corrected for expo-image-picker
                allowsMultipleSelection: true,
                quality: 1,
              }
            );

            if (!imagePickerResult.canceled) {
              selectedImages = imagePickerResult.assets.map(
                (asset) => asset.uri
              );
              navigateToScan(selectedImages);
            }
          },
        },
        {
          text: 'Files',
          onPress: async () => {
            const documentPickerResult = await DocumentPicker.getDocumentAsync({
              type: 'image/*',
              multiple: true,
            });

            if (!documentPickerResult.canceled && documentPickerResult.assets) {
              const documentUris = documentPickerResult.assets.map(
                (asset) => asset.uri
              );
              selectedImages.push(...documentUris);
              navigateToScan(selectedImages);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleOpenCamera = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required!');
      return;
    }
  
    let capturedImages: string[] = [];
  
    // Open camera to capture an image
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, 
      quality: 1,
    });
  
    if (!result.canceled) {
      capturedImages.push(result.assets[0].uri);
    }
  
    // Send captured images to ScanScreen
    if (capturedImages.length > 0) {
      router.push({
        pathname: '/scan',
        params: { imageUris: JSON.stringify(capturedImages) },
      });
    }
  };

  const navigateToScan = (images: string[]) => {
    if (images.length > 0) {
      router.push({
        pathname: '/scan',
        params: { imageUris: JSON.stringify(images) },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello,{' '}
            {loading || !profile?.full_name
              ? 'there'
              : profile.full_name.split(' ')[0]}
          </Text>
          <Text style={styles.subtitle}>
            Let's check your eye health and suggest possible diagnosis
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleOpenCamera}
        >
          <Camera size={32} color="#ffffff" />
          <Text style={styles.mainButtonText}>Scan Your Eye</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadImage}
        >
          <Upload size={24} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  actionButtons: { padding: 20, gap: 16 },
  mainButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mainButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  uploadButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  uploadButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
