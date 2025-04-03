import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, Image, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Check, X, Clock, CheckCircle, XCircle, Filter } from 'lucide-react-native';

type DocumentType = 'license' | 'passport' | 'selfie';
type UserStatus = 'all' | 'pending' | 'approved';

interface User {
  id: string;
  full_name: string;
  email: string;
  medical_license_number: string;
  verification_status: string;
  documents: {
    license: string | null;
    passport: string | null;
    selfie: string | null;
  };
}

export default function PendingUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('all');
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');

      console.log('Current session user ID:', session.user.id);

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError);
        throw adminError;
      }

      if (!adminData) {
        Alert.alert('Error', 'You do not have permission to view pending users');
        router.replace('/(tabs)');
        return;
      }

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      console.log('Profiles fetched:', profiles);

      // Fetch documents for each profile
      const usersWithDocs = await Promise.all(
        profiles.map(async (profile) => {
          const { data: documents, error: docsError } = await supabase
            .from('medical_documents')
            .select('document_type, file_url')
            .eq('user_id', profile.id);

          if (docsError) {
            console.error(`Error fetching documents for profile ${profile.id}:`, docsError);
            return null;
          }

          // Organize documents by type
          const docs = {
            license: documents?.find(d => d.document_type === 'license')?.file_url || null,
            passport: documents?.find(d => d.document_type === 'passport')?.file_url || null,
            selfie: documents?.find(d => d.document_type === 'selfie')?.file_url || null,
          };

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            medical_license_number: profile.medical_license_number,
            verification_status: profile.verification_status,
            documents: docs,
          };
        })
      );

      // Filter out any null entries and set the users
      setUsers(usersWithDocs.filter((user): user is User => user !== null));
      console.log('Final users list:', usersWithDocs);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', { user_id: userId });
      if (error) throw error;
      await fetchUsers(); // Refresh the list
      Alert.alert('Success', 'User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user. Please try again.');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', userId);
      if (error) throw error;
      await fetchUsers(); // Refresh the list
      Alert.alert('Success', 'User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      Alert.alert('Error', 'Failed to reject user. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => {
    if (selectedStatus === 'all') return true;
    return user.verification_status === selectedStatus;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterText, selectedStatus === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('pending')}
          >
            <Text style={[styles.filterText, selectedStatus === 'pending' && styles.filterTextActive]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'approved' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('approved')}
          >
            <Text style={[styles.filterText, selectedStatus === 'approved' && styles.filterTextActive]}>Approved</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.full_name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userLicense}>License: {user.medical_license_number}</Text>
              <Text style={[
                styles.statusText,
                user.verification_status === 'approved' && styles.statusApproved,
                user.verification_status === 'rejected' && styles.statusRejected
              ]}>
                Status: {user.verification_status.charAt(0).toUpperCase() + user.verification_status.slice(1)}
              </Text>
            </View>

            <View style={styles.documentsContainer}>
              <Text style={styles.documentsTitle}>Documents:</Text>
              <View style={styles.documentsGrid}>
                {user.documents.license && (
                  <View style={styles.documentItem}>
                    <Text style={styles.documentLabel}>License</Text>
                    <Image
                      source={{ uri: user.documents.license }}
                      style={styles.documentImage}
                    />
                  </View>
                )}
                {user.documents.passport && (
                  <View style={styles.documentItem}>
                    <Text style={styles.documentLabel}>Passport</Text>
                    <Image
                      source={{ uri: user.documents.passport }}
                      style={styles.documentImage}
                    />
                  </View>
                )}
                {user.documents.selfie && (
                  <View style={styles.documentItem}>
                    <Text style={styles.documentLabel}>Selfie</Text>
                    <Image
                      source={{ uri: user.documents.selfie }}
                      style={styles.documentImage}
                    />
                  </View>
                )}
              </View>
            </View>

            {user.verification_status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(user.id)}
                >
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(user.id)}
                >
                  <XCircle size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  userLicense: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FF9500',
  },
  statusApproved: {
    color: '#34C759',
  },
  statusRejected: {
    color: '#FF3B30',
  },
  documentsContainer: {
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  documentItem: {
    width: '45%',
  },
  documentLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
}); 