import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { LogOut, User, Calendar, Clock, Activity, Plus, X, ChevronRight, Filter, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Patient {
  id: string;
  full_name: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  patient: {
    full_name: string;
    id: string;
  } | null;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patientCount, setPatientCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPatientCount();
    fetchPatients();
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          patient:patients!appointments_patient_id_fkey (
            full_name
          )
        `)
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: true })
        .returns<Appointment[]>();

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to fetch appointments. Please try again.');
    }
  };

  const fetchPatients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to fetch patients. Please try again.');
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setPatientCount(count || 0);
    } catch (error) {
      console.error('Error fetching patient count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleScheduleAppointment = () => {
    if (patients.length === 0) {
      Alert.alert('No Patients', 'Please add a patient first before scheduling an appointment.');
      return;
    }
    setShowPatientModal(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(false);
    setShowDatePicker(true);
  };

  const handleDateChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && selectedPatient) {
      setSelectedDate(selectedDate);
      try {
        console.log('Creating appointment with:', {
          doctor_id: user?.id,
          patient_id: selectedPatient.id,
          appointment_date: selectedDate.toISOString(),
          status: 'scheduled'
        });

        const { data, error } = await supabase
          .from('appointments')
          .insert([
            {
              doctor_id: user?.id,
              patient_id: selectedPatient.id,
              appointment_date: selectedDate.toISOString(),
              status: 'scheduled'
            }
          ])
          .select();

        if (error) {
          console.error('Appointment error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log('Appointment created successfully:', data);
        Alert.alert('Success', 'Appointment scheduled successfully!');
        setSelectedPatient(null);
      } catch (error: any) {
        console.error('Error scheduling appointment:', {
          error,
          message: error?.message,
          code: error?.code
        });
        Alert.alert(
          'Error',
          error?.message || 'Failed to schedule appointment. Please try again.'
        );
      }
    }
  };

  const handleAddPatient = () => {
    router.push('/register-patient');
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setIsCancelling(true);
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', selectedAppointment.id);

      if (error) throw error;
      
      Alert.alert('Success', 'Appointment cancelled successfully');
      setShowAppointmentModal(false);
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true;
    return appointment.status === filterStatus;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{firstName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <User size={24} color="#007AFF" />
          </View>
          <Text style={styles.statValue}>{patientCount}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Calendar size={24} color="#007AFF" />
          </View>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Activity size={24} color="#007AFF" />
          </View>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Scans Today</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleScheduleAppointment}>
            <Clock size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Schedule Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddPatient}>
            <Plus size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Add Patient</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.appointmentsSection}>
        <View style={styles.appointmentsHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <View style={styles.filterContainer}>
            <Filter size={20} color="#666666" />
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'scheduled' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('scheduled')}
            >
              <Text style={[styles.filterText, filterStatus === 'scheduled' && styles.filterTextActive]}>Scheduled</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('completed')}
            >
              <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No appointments found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filterStatus === 'all' 
                ? 'Schedule a new appointment to get started'
                : `No ${filterStatus} appointments`}
            </Text>
          </View>
        ) : (
          filteredAppointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment.id} 
              style={styles.appointmentCard}
              onPress={() => handleAppointmentPress(appointment)}
            >
              <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{appointment.patient?.full_name || 'Unknown Patient'}</Text>
                <Text style={styles.appointmentDate}>
                  {formatDate(appointment.appointment_date)}
                </Text>
                <Text style={[
                  styles.appointmentStatus,
                  appointment.status === 'scheduled' && styles.statusScheduled,
                  appointment.status === 'completed' && styles.statusCompleted,
                  appointment.status === 'cancelled' && styles.statusCancelled
                ]}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="datetime"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <Modal
        visible={showPatientModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Patient</Text>
              <TouchableOpacity onPress={() => setShowPatientModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.patientList}>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.patientItem}
                  onPress={() => handlePatientSelect(patient)}
                >
                  <Text style={styles.patientName}>{patient.full_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAppointmentModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setShowAppointmentModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedAppointment && (
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Patient:</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.patient?.full_name || 'Unknown Patient'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedAppointment.appointment_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    styles.statusText,
                    selectedAppointment.status === 'scheduled' && styles.statusScheduled,
                    selectedAppointment.status === 'completed' && styles.statusCompleted,
                    selectedAppointment.status === 'cancelled' && styles.statusCancelled
                  ]}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </Text>
                </View>

                {selectedAppointment.status === 'scheduled' && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelAppointment}
                    disabled={isCancelling}
                  >
                    <Trash2 size={20} color="#FF3B30" />
                    <Text style={styles.cancelButtonText}>
                      {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  nameText: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  patientList: {
    maxHeight: 300,
  },
  patientItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  patientName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
  },
  appointmentsSection: {
    padding: 20,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  appointmentStatus: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FF9500',
  },
  statusScheduled: {
    color: '#FF9500',
  },
  statusCompleted: {
    color: '#34C759',
  },
  statusCancelled: {
    color: '#FF3B30',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  appointmentDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FF3B30',
  },
}); 