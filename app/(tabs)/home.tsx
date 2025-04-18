import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { LogOut, User, Activity, Plus } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

interface DiseaseStat {
  name: string;
  count: number;
  color: string;
}

interface Stats {
  profile: {
    full_name: string;
  } | null;
  patientCount: number;
  diseaseStats: DiseaseStat[];
  monthlyStats: { month: string; count: number }[];
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    profile: null,
    patientCount: 0,
    diseaseStats: [],
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileData, patientCountData, diseaseStatsData, monthlyStatsData] = await Promise.all([
        fetchProfile(),
        fetchPatientCount(),
        fetchDiseaseStats(),
        fetchMonthlyStats()
      ]);
      setStats({
        profile: profileData || null,
        patientCount: patientCountData || 0,
        diseaseStats: diseaseStatsData || [],
        monthlyStats: monthlyStatsData || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchDiseaseStats = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching disease stats for doctor:', user.user.id);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('diagnosis, created_at')
        .eq('doctor_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching disease stats:', error);
        throw error;
      }

      console.log('Fetched disease stats:', data);

      // Count occurrences of each diagnosis
      const diagnosisCounts = data?.reduce((acc: { [key: string]: number }, item) => {
        acc[item.diagnosis] = (acc[item.diagnosis] || 0) + 1;
        return acc;
      }, {});

      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
      const stats = Object.entries(diagnosisCounts || {}).map(([name, count], index) => ({
        name,
        count,
        color: colors[index % colors.length]
      }));

      console.log('Processed disease stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error in fetchDiseaseStats:', error);
      Alert.alert('Error', 'Failed to fetch disease statistics. Please try again.');
      return [];
    }
  };

  const fetchMonthlyStats = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching monthly stats for doctor:', user.user.id);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('created_at')
        .eq('doctor_id', user.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching monthly stats:', error);
        throw error;
      }

      console.log('Fetched monthly stats:', data);

      const monthlyData = data?.reduce((acc: { [key: string]: number }, item) => {
        const month = new Date(item.created_at).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const stats = Object.entries(monthlyData || {}).map(([month, count]) => ({
        month,
        count
      }));

      console.log('Processed monthly stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error in fetchMonthlyStats:', error);
      Alert.alert('Error', 'Failed to fetch monthly statistics. Please try again.');
      return [];
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchPatientCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching patient count:', error);
      return 0;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddPatient = () => {
    router.push('/register-patient');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={24} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Loading...</Text>
              <Text style={styles.userName}>Please wait</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  const firstName = stats.profile?.full_name?.split(' ')[0] || 'User';
  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {firstName}</Text>
          <Text style={styles.subtitle}>Your Eye Diagnosis Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <User size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{stats.patientCount}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Activity size={24} color="#007AFF" />
          <Text style={styles.statNumber}>
            {stats.diseaseStats.reduce((sum, stat) => sum + stat.count, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Diagnoses</Text>
        </View>
      </View>

      {stats.monthlyStats.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Diagnoses</Text>
          <LineChart
            data={{
              labels: stats.monthlyStats.map(stat => stat.month),
              datasets: [{
                data: stats.monthlyStats.map(stat => stat.count)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Diagnoses</Text>
          <Text style={styles.noDataText}>No diagnosis data available</Text>
        </View>
      )}

      {stats.diseaseStats.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Disease Distribution</Text>
          <PieChart
            data={stats.diseaseStats}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Disease Distribution</Text>
          <Text style={styles.noDataText}>No disease distribution data available</Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddPatient}>
        <Plus size={24} color="#ffffff" />
        <Text style={styles.addButtonText}>Add New Patient</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  chartContainer: {
    marginTop: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginVertical: 32,
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 