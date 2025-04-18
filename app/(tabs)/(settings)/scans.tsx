import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Eye, ChevronRight, Calendar, User } from 'lucide-react-native';

interface Scan {
  id: string;
  created_at: string;
  diagnosis: string;
  patient: {
    full_name: string;
  } | null;
}

export default function ScansScreen() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('analysis_results')
        .select(`
          id,
          created_at,
          diagnosis,
          patient:patients(full_name)
        `)
        .eq('doctor_id', user?.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScans(data?.map(scan => ({
        ...scan,
        patient: scan.patient?.[0] || null
      })) || []);
    } catch (error) {
      console.error('Error fetching scans:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <Eye size={24} color="#000000" />
        <Text style={styles.title}>Eye Scans</Text>
      </View>
      <ScrollView style={styles.content}>
        {scans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No scans found</Text>
          </View>
        ) : (
          scans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={styles.scanCard}
              onPress={() => router.push(`/analysis-results/${scan.id}` as any)}
            >
              <View style={styles.scanInfo}>
                <View style={styles.patientInfo}>
                  <User size={20} color="#666666" />
                  <Text style={styles.patientName}>{scan.patient?.full_name || 'Unknown Patient'}</Text>
                </View>
                <View style={styles.dateInfo}>
                  <Calendar size={20} color="#666666" />
                  <Text style={styles.date}>{formatDate(scan.created_at)}</Text>
                </View>
                <Text style={styles.diagnosis}>Diagnosis: {scan.diagnosis}</Text>
              </View>
              <ChevronRight size={24} color="#666666" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scanInfo: {
    flex: 1,
    gap: 8,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  diagnosis: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
});