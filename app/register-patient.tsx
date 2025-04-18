import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';

interface Patient {
  id?: string;
  full_name: string;
  record_number: string;
  notes: string;
  disclaimer_accepted: boolean;
}

export default function RegisterPatientScreen() {
  const [patient, setPatient] = useState<Patient>({
    full_name: '',
    record_number: '',
    notes: '',
    disclaimer_accepted: false,
  });
  const [loading, setLoading] = useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      Alert.alert('Error', 'Failed to fetch patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!patient.full_name || !patient.record_number || !patient.disclaimer_accepted) {
      Alert.alert('Error', 'Please fill in all required fields and accept the disclaimer');
      return;
    }

    try {
      setLoading(true);
      let error;

      if (id) {
        const { error: updateError } = await supabase
          .from('patients')
          .update(patient)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('patients')
          .insert([patient]);
        error = insertError;
      }

      if (error) throw error;

      Alert.alert(
        'Success',
        id ? 'Patient updated successfully' : 'Patient registered successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', id ? 'Failed to update patient' : 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const showDisclaimerInfo = () => {
    Alert.alert(
      'Data Privacy Disclaimer',
      'By accepting this disclaimer, you acknowledge that the patient\'s information will be stored securely and used only for medical purposes. The data will be protected according to healthcare privacy regulations.',
      [{ text: 'OK' }]
    );
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
        <Text style={styles.title}>{id ? 'Edit Patient' : 'Register Patient'}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={patient.full_name}
            onChangeText={(text) => setPatient({ ...patient, full_name: text })}
            placeholder="Enter full name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Record Number *</Text>
          <TextInput
            style={styles.input}
            value={patient.record_number}
            onChangeText={(text) => setPatient({ ...patient, record_number: text })}
            placeholder="Enter record/folder number"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={patient.notes}
            onChangeText={(text) => setPatient({ ...patient, notes: text })}
            placeholder="Enter any additional notes"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.disclaimerContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPatient({ ...patient, disclaimer_accepted: !patient.disclaimer_accepted })}
          >
            <View style={[styles.checkbox, patient.disclaimer_accepted && styles.checkboxChecked]}>
              {patient.disclaimer_accepted && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.disclaimerText}>
              I accept the data privacy disclaimer *
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={showDisclaimerInfo} style={styles.infoButton}>
            <Info size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : id ? 'Update Patient' : 'Register Patient'}
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
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 