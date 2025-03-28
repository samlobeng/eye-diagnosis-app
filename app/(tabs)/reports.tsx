import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { FileText, TrendingUp, CircleAlert, ChevronRight, Filter } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type EyeScan = Database['public']['Tables']['eye_scans']['Row'];

type FilterStatus = 'all' | 'normal' | 'warning' | 'critical';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [scans, setScans] = useState<EyeScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const fetchScans = async () => {
    if (!user) return;

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchScans();
  };

  const getHealthScore = () => {
    if (scans.length === 0) return 0;
    
    const completedScans = scans.filter(scan => scan.status === 'completed');
    if (completedScans.length === 0) return 0;

    const totalScore = completedScans.reduce((acc, scan) => {
      const result = scan.analysis_result as any;
      return acc + (result.health_score || 0);
    }, 0);

    return Math.round((totalScore / completedScans.length) * 100);
  };

  const getWarningsCount = () => {
    return scans.filter(scan => {
      const result = scan.analysis_result as any;
      return result.severity === 'warning' || result.severity === 'critical';
    }).length;
  };

  const getFilteredScans = () => {
    if (filterStatus === 'all') return scans;

    return scans.filter(scan => {
      const result = scan.analysis_result as any;
      switch (filterStatus) {
        case 'normal':
          return result.severity === 'normal';
        case 'warning':
          return result.severity === 'warning';
        case 'critical':
          return result.severity === 'critical';
        default:
          return true;
      }
    });
  };

  const getStatusColor = (severity: string) => {
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

  const FilterButton = ({ status, label }: { status: FilterStatus; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive
      ]}
      onPress={() => setFilterStatus(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filterStatus === status && styles.filterButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>View your eye health history</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#007AFF" />
            <Text style={styles.statValue}>{getHealthScore()}%</Text>
            <Text style={styles.statLabel}>Eye Health</Text>
          </View>
          <View style={styles.statCard}>
            <CircleAlert size={24} color="#FF9500" />
            <Text style={styles.statValue}>{getWarningsCount()}</Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Filter size={20} color="#666666" />
            <Text style={styles.filterTitle}>Filter by Status</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtons}
          >
            <FilterButton status="all" label="All" />
            <FilterButton status="normal" label="Normal" />
            <FilterButton status="warning" label="Warning" />
            <FilterButton status="critical" label="Critical" />
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Recent Reports</Text>
        
        {getFilteredScans().map((scan) => {
          const result = scan.analysis_result as any;
          const severity = result.severity || 'pending';
          const statusColor = getStatusColor(severity);

          return (
            <TouchableOpacity key={scan.id} style={styles.reportCard}>
              <View style={styles.reportIcon}>
                <FileText size={24} color="#007AFF" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>Eye Scan Report</Text>
                <Text style={styles.reportDate}>
                  {new Date(scan.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.reportStatus, { backgroundColor: `${statusColor}15` }]}>
                <Text style={[styles.reportStatusText, { color: statusColor }]}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          );
        })}

        {getFilteredScans().length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No reports found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filterStatus === 'all'
                ? 'Get started by scanning your eyes'
                : 'Try changing the filter'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reportIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 16,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  reportDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 2,
  },
  reportStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  reportStatusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
  },
});