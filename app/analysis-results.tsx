import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Activity, Download } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface AnalysisResult {
  id: string;
  patient_id: string;
  image_url: string;
  diagnosis: string;
  confidence: number;
  notes: string;
  created_at: string;
}

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
}

export default function AnalysisResultsScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, patientResponse] = await Promise.all([
        supabase
          .from('analysis_results')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single(),
      ]);

      if (resultsResponse.error) throw resultsResponse.error;
      if (patientResponse.error) throw patientResponse.error;

      setResults(resultsResponse.data || []);
      setPatient(patientResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeNew = () => {
    router.push({
      pathname: '/scan',
      params: { patientId },
    });
  };

  const generatePDF = async () => {
    if (!patient || results.length === 0) return;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .patient-info { margin-bottom: 20px; }
            .result { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
            .diagnosis { font-weight: bold; color: #007AFF; }
            .confidence { color: #666; }
            .notes { margin-top: 10px; }
            .timestamp { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Retina Analysis Report</h1>
            <h2>${patient.full_name}</h2>
          </div>
          
          <div class="patient-info">
            <p>Email: ${patient.email}</p>
            <p>Phone: ${patient.phone_number}</p>
            <p>Date of Birth: ${new Date(patient.date_of_birth).toLocaleDateString()}</p>
            <p>Gender: ${patient.gender}</p>
          </div>

          ${results.map((result, index) => `
            <div class="result">
              <h3>Analysis #${index + 1}</h3>
              <p class="diagnosis">Diagnosis: ${result.diagnosis}</p>
              <p class="confidence">Confidence: ${(result.confidence * 100).toFixed(2)}%</p>
              ${result.notes ? `<p class="notes">${result.notes}</p>` : ''}
              <p class="timestamp">Date: ${new Date(result.created_at).toLocaleString()}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Retina Analysis Report',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
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
        <Text style={styles.title}>Analysis Results</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAnalyzeNew}
          >
            <Activity size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={generatePDF}
          >
            <Download size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {results.map((result) => (
          <View key={result.id} style={styles.resultCard}>
            <Image
              source={{ uri: result.image_url }}
              style={styles.resultImage}
            />
            <View style={styles.resultDetails}>
              <Text style={styles.diagnosis}>{result.diagnosis}</Text>
              <Text style={styles.confidence}>
                Confidence: {(result.confidence * 100).toFixed(2)}%
              </Text>
              {result.notes && (
                <Text style={styles.notes}>{result.notes}</Text>
              )}
              <View style={styles.timestamp}>
                <Clock size={16} color="#666666" />
                <Text style={styles.timestampText}>
                  {new Date(result.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  resultDetails: {
    padding: 16,
  },
  diagnosis: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 8,
  },
  timestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timestampText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginLeft: 4,
  },
}); 