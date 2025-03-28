import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Eye, ShoppingBag } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const notificationSettings = [
  {
    title: 'Eye Health',
    icon: Eye,
    items: [
      { label: 'Scan Reminders', key: 'scan_reminders' },
      { label: 'Health Reports', key: 'health_reports' },
      { label: 'Condition Alerts', key: 'condition_alerts' },
    ],
  },
  {
    title: 'Orders & Shopping',
    icon: ShoppingBag,
    items: [
      { label: 'Order Updates', key: 'order_updates' },
      { label: 'Delivery Status', key: 'delivery_status' },
      { label: 'Product Recommendations', key: 'recommendations' },
    ],
  },
  {
    title: 'General',
    icon: Bell,
    items: [
      { label: 'App Updates', key: 'app_updates' },
      { label: 'News & Tips', key: 'news' },
      { label: 'Special Offers', key: 'offers' },
    ],
  },
];

const defaultSettings = {
  scan_reminders: true,
  health_reports: true,
  condition_alerts: true,
  order_updates: true,
  delivery_status: true,
  recommendations: false,
  app_updates: true,
  news: false,
  offers: false,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, boolean>>(defaultSettings);

  useEffect(() => {
    if (!user) return;
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      let { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const { data: newData, error: insertError } = await supabase
            .from('notification_settings')
            .insert([{ user_id: user?.id, ...defaultSettings }])
            .select()
            .single();

          if (insertError) throw insertError;
          data = newData;
        } else {
          throw error;
        }
      }
      
      if (data) {
        const { id, user_id, created_at, updated_at, ...preferences } = data;
        setSettings(preferences);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string) => {
    if (!user || saving) return;

    const newValue = !settings[key];
    setSaving(true);

    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ [key]: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: newValue,
      }));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setSaving(false);
    }
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {notificationSettings.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <section.icon size={20} color="#666666" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                >
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Switch
                    value={settings[item.key] ?? false}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    ios_backgroundColor="#E5E5EA"
                    disabled={saving}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
  },
  bottomSpacer: {
    height: 40,
  },
});