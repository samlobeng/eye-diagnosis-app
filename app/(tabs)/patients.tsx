import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { UserPlus, Eye, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Patient {
  id: string;
  full_name: string;
  record_number: string;
  notes: string;
}

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, record_number, notes')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchPatients();
    }, [])
  );

  const handlePatientPress = (patient: Patient) => {
    Alert.alert(
      'Patient Options',
      'What would you like to do?',
      [
        {
          text: 'View Details',
          onPress: () => router.push(`/patient-details/${patient.id}`),
        },
        {
          text: 'New Scan',
          onPress: () => router.push({
            pathname: '/scan',
            params: { patientId: patient.id },
          }),
        },
        {
          text: 'View Reports',
          onPress: () => router.push({
            pathname: '/analysis-results',
            params: { patientId: patient.id },
          }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/register-patient')}
        >
          <UserPlus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {patients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() => handlePatientPress(patient)}
            >
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.full_name}</Text>
                <Text style={styles.patientDetails}>
                  Record #: {patient.record_number}
                </Text>
                {patient.notes && (
                  <Text style={styles.patientNotes} numberOfLines={2}>
                    {patient.notes}
                  </Text>
                )}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({
                    pathname: '/scan',
                    params: { patientId: patient.id },
                  })}
                >
                  <Eye size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({
                    pathname: '/analysis-results',
                    params: { patientId: patient.id },
                  })}
                >
                  <FileText size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  patientCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  patientNotes: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
}); 