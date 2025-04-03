import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  medical_license_number: string;
  created_at: string;
  documents: {
    license: string;
    passport: string;
    selfie: string;
  };
}

export default function PendingUsersScreen() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      console.log('Fetching pending users...');
      
      // First check if we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      console.log('Current session:', session?.user?.id);

      if (!session?.user?.id) {
        Alert.alert('Error', 'You must be logged in to view pending users');
        return;
      }

      // Check if user is admin
      const { data: isAdminData, error: isAdminError } = await supabase
        .rpc('is_admin', { user_id: session.user.id });
      
      if (isAdminError) {
        console.error('Admin check error:', isAdminError);
        throw isAdminError;
      }
      console.log('Is admin:', isAdminData);

      if (!isAdminData) {
        Alert.alert('Error', 'You do not have permission to view pending users');
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending');

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }
      console.log('Found profiles:', profiles);

      if (!profiles || profiles.length === 0) {
        console.log('No pending users found');
        setPendingUsers([]);
        return;
      }

      // Fetch documents for each user
      const usersWithDocs = await Promise.all(
        profiles.map(async (profile) => {
          console.log('Fetching documents for profile:', profile.id);
          const { data: documents, error: docsError } = await supabase
            .from('medical_documents')
            .select('document_type, file_url')
            .eq('user_id', profile.id);

          if (docsError) {
            console.error('Documents error:', docsError);
            throw docsError;
          }
          console.log('Found documents:', documents);

          const docs = documents.reduce((acc, doc) => ({
            ...acc,
            [doc.document_type]: doc.file_url
          }), {});

          return {
            ...profile,
            documents: docs
          };
        })
      );

      console.log('Final users with docs:', usersWithDocs);
      setPendingUsers(usersWithDocs);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      Alert.alert(
        'Error', 
        error instanceof Error 
          ? `Failed to fetch pending users: ${error.message}`
          : 'Failed to fetch pending users'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', { user_id: userId });
      
      if (error) throw error;

      Alert.alert('Success', 'User approved successfully');
      fetchPendingUsers(); // Refresh the list
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const renderUser = ({ item }: { item: PendingUser }) => (
    <View style={styles.userCard}>
      <Text style={styles.userName}>{item.full_name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Text style={styles.userLicense}>License: {item.medical_license_number}</Text>
      <Text style={styles.userDate}>
        Registered: {new Date(item.created_at).toLocaleDateString()}
      </Text>
      
      <View style={styles.documentLinks}>
        <TouchableOpacity 
          style={styles.docButton}
          onPress={() => Linking.openURL(item.documents.license)}
        >
          <Text style={styles.docButtonText}>View License</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.docButton}
          onPress={() => Linking.openURL(item.documents.passport)}
        >
          <Text style={styles.docButtonText}>View Passport</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.docButton}
          onPress={() => Linking.openURL(item.documents.selfie)}
        >
          <Text style={styles.docButtonText}>View Selfie</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.approveButton}
        onPress={() => handleApprove(item.id)}
      >
        <Text style={styles.approveButtonText}>Approve User</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading pending users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending User Approvals</Text>
      <FlatList
        data={pendingUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 16,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userLicense: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  documentLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  docButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  docButtonText: {
    color: '#333',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 