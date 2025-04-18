import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Settings, Bell, Shield, CreditCard, CircleHelp, LogOut, Package, Eye, Lock, HelpCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const menuItems = [
  {
    icon: Package,
    title: 'Orders',
    subtitle: 'View your order history',
    route: '/(tabs)/(settings)/orders',
  },
  {
    icon: Eye,
    title: 'Eye Scans',
    subtitle: 'View your scan history',
    route: '/(tabs)/(settings)/scans',
  },
  {
    icon: Settings,
    title: 'Account Settings',
    subtitle: 'Manage your account details',
    route: '/(tabs)/(settings)/settings',
  },
  {
    icon: Bell,
    title: 'Notifications',
    subtitle: 'Customize your notifications',
    route: '/(tabs)/(settings)/notifications',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    subtitle: 'Control your privacy settings',
    route: '/(tabs)/(settings)/privacy',
  },
  {
    icon: CreditCard,
    title: 'Payment Methods',
    subtitle: 'Manage your payment options',
    route: '/(tabs)/(settings)/settings',
  },
  {
    icon: CircleHelp,
    title: 'Help & Support',
    subtitle: 'Get help with the app',
    route: '/(tabs)/(settings)/help/faqs',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (user?.user?.id) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMenuItemPress = (route: string) => {
    router.push(route as any);
  };

  const settingsItems = [
    {
      title: 'Account Settings',
      icon: <Settings size={24} color="#007AFF" />,
      onPress: () => router.push('/(tabs)/(settings)/settings'),
    },
    {
      title: 'Eye Scans',
      icon: <Eye size={24} color="#007AFF" />,
      onPress: () => router.push('/(tabs)/(settings)/scans'),
    },
    {
      title: 'Notifications',
      icon: <Bell size={24} color="#007AFF" />,
      onPress: () => router.push('/(tabs)/(settings)/notifications'),
    },
    {
      title: 'Privacy',
      icon: <Lock size={24} color="#007AFF" />,
      onPress: () => router.push('/(tabs)/(settings)/privacy'),
    },
    {
      title: 'Help & Support',
      icon: <HelpCircle size={24} color="#007AFF" />,
      onPress: () => router.push('/(tabs)/(settings)/help/faqs' as any),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Settings size={24} color="#000000" />
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <Image
              source={{ 
                uri: user?.user.user_metadata?.avatar_url || 
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop' 
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name || 'Anonymous User'}</Text>
              <Text style={styles.profileEmail}>{user?.user.email}</Text>
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
          </View>

          <View style={styles.menuSection}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.menuItem,
                  index === settingsItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>
                  {item.icon}
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, styles.lastMenuItem]}
            onPress={handleLogout}
          >
            <LogOut size={24} color="#FF3B30" />
            <Text style={[styles.logoutText, styles.lastMenuItemText]}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
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
  contentContainer: {
    paddingBottom: 24,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2F2F7',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    marginTop: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 16,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginTop: 32,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF3B30',
  },
  lastMenuItemText: {
    marginLeft: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});