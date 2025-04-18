import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit2 } from 'lucide-react-native';

interface Patient {
  id: string;
  full_name: string;
  record_number: string;
  notes: string;
  created_at: string;
}

export default function PatientDetailsScreen() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, record_number, notes, created_at')
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

  if (loading || !patient) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
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
        <Text style={styles.title}>Patient Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/register-patient?id=${id}`)}
        >
          <Edit2 size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoGroup}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{patient.full_name}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.label}>Record Number</Text>
            <Text style={styles.value}>{patient.record_number}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.infoGroup}>
            <Text style={styles.value}>{patient.notes || 'No notes available'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Date</Text>
          <View style={styles.infoGroup}>
            <Text style={styles.value}>
              {new Date(patient.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  infoGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1A1A1A',
  },
}); 