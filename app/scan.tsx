import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { Search } from 'lucide-react-native';

export default function ScanScreen() {
  const router = useRouter();
  const { imageUris } = useLocalSearchParams();

  const images = imageUris
    ? JSON.parse(decodeURIComponent(imageUris as string))
    : [];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <X size={24} color="#ffffff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.imageContainer}>
        {images.length > 0 ? (
          images.map((uri: string, index: number) => (
            <Image key={index} source={{ uri }} style={styles.imagePreview} />
          ))
        ) : (
          <Text style={{ color: 'white' }}>No Images Selected</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.analysisButton}
        onPress={() => console.log('Analyze Images', images)}
      >
        <Search size={24} color="white" />
        <Text style={{ color: 'white', fontSize: 20, marginLeft: 10 }}>
          Analyze
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    marginTop: Platform.OS === 'ios' ? 100 : 80,
    gap: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  analysisButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginBottom: 40,
  },
});
