import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, Upload, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
}

export default function ScanScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setSelectedPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      Alert.alert('Error', 'Failed to fetch patient details');
    }
  };

  const handleCameraPress = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUris([...imageUris, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  const handleUploadPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUris([...imageUris, ...result.assets.map(asset => asset.uri)]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to access photo library');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient first');
      return;
    }

    if (imageUris.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setAnalyzing(true);
    try {
      // TODO: Implement actual analysis logic here
      // For now, we'll simulate a delay and show a success message
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save analysis results
      const { error: saveError } = await supabase
        .from('analysis_results')
        .insert([
          {
            patient_id: selectedPatient.id,
            image_url: imageUris[0], // For now, just save the first image
            diagnosis: 'Normal', // Placeholder diagnosis
            confidence: 0.95, // Placeholder confidence
            notes: 'No abnormalities detected' // Placeholder notes
          }
        ]);

      if (saveError) throw saveError;

      Alert.alert('Success', 'Analysis completed successfully');
      router.push({
        pathname: '/analysis-results',
        params: { patientId: selectedPatient.id }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze images');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>New Scan</Text>
      </View>

      <ScrollView style={styles.content}>
        {selectedPatient ? (
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{selectedPatient.full_name}</Text>
            <Text style={styles.patientDetails}>
              {selectedPatient.email} • {selectedPatient.phone_number}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.selectPatientButton}
            onPress={() => router.push('/(tabs)/patients')}
          >
            <Text style={styles.selectPatientText}>Select Patient</Text>
          </TouchableOpacity>
        )}

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Retina Images</Text>
          <View style={styles.imageGrid}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {imageUris.length < 4 && (
              <>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleCameraPress}
                >
                  <Camera size={24} color="#007AFF" />
                  <Text style={styles.addButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleUploadPress}
                >
                  <Upload size={24} color="#007AFF" />
                  <Text style={styles.addButtonText}>Upload</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.analyzeButton, (!selectedPatient || imageUris.length === 0) && styles.buttonDisabled]}
          onPress={handleAnalyze}
          disabled={!selectedPatient || imageUris.length === 0 || analyzing}
        >
          <Text style={styles.analyzeButtonText}>
            {analyzing ? 'Analyzing...' : 'Analyze Images'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  patientInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  patientName: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  selectPatientButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  selectPatientText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
