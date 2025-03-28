import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type EyeScan = Database['public']['Tables']['eye_scans']['Row'];

export default function ScansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [scans, setScans] = useState<EyeScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchScans() {
      try {
        const { data, error } = await supabase
          .from('eye_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setScans(data || []);
      } catch (error) {
        console.error('Error fetching scans:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchScans();
  }, [user]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal':
        return '#00B37E';
      case 'warning':
        return '#FF9500';
      case 'critical':
        return '#FF3B30';
      default:
        return '#666666';
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
        <Text style={styles.title}>Eye Scans</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading scans...</Text>
          </View>
        ) : scans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Eye size={48} color="#666666" />
            <Text style={styles.emptyTitle}>No Scans Yet</Text>
            <Text style={styles.emptySubtitle}>
              Take your first eye scan to start monitoring your eye health
            </Text>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => router.push('/scan')}
            >
              <Text style={styles.scanButtonText}>Take a Scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          scans.map((scan) => {
            const result = scan.analysis_result as any;
            const severity = result?.severity || 'pending';

            return (
              <TouchableOpacity 
                key={scan.id} 
                style={styles.scanCard}
                onPress={() => {}}
              >
                <Image
                  source={{ uri: scan.image_url }}
                  style={styles.scanImage}
                />
                
                <View style={styles.scanInfo}>
                  <View style={styles.scanHeader}>
                    <Text style={styles.scanDate}>
                      {new Date(scan.created_at).toLocaleDateString()}
                    </Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: `${getSeverityColor(severity)}15` }
                    ]}>
                      <Text style={[
                        styles.severityText,
                        { color: getSeverityColor(severity) }
                      ]}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {result?.conditions?.length > 0 && (
                    <View style={styles.conditions}>
                      {result.conditions.map((condition: string, index: number) => (
                        <View key={index} style={styles.condition}>
                          <AlertCircle size={16} color="#FF9500" />
                          <Text style={styles.conditionText}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity style={styles.viewDetails}>
                    <Text style={styles.viewDetailsText}>View Full Report</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  scanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  scanImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F2F2F7',
  },
  scanInfo: {
    padding: 16,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanDate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  conditions: {
    marginTop: 12,
  },
  condition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  conditionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginLeft: 8,
  },
  viewDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
});