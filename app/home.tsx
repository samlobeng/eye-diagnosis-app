import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, ArrowRight, Shield, Brain, Glasses } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const eyeConditions = [
  {
    title: 'Myopia',
    description: 'Nearsightedness affects distance vision',
    image: 'https://images.unsplash.com/photo-1580091441976-aaa13c31c414?w=400&h=300&auto=format&fit=crop',
  },
  {
    title: 'Hyperopia',
    description: 'Farsightedness affects near vision',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&auto=format&fit=crop',
  },
  {
    title: 'Astigmatism',
    description: 'Irregular cornea shape affects focus',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&auto=format&fit=crop',
  },
];

const features = [
  {
    icon: Eye,
    title: 'AI Analysis',
    description: 'Advanced eye scanning technology',
  },
  {
    icon: Shield,
    title: 'Early Detection',
    description: 'Identify issues before they worsen',
  },
  {
    icon: Brain,
    title: 'Smart Diagnosis',
    description: 'Accurate condition assessment',
  },
  {
    icon: Glasses,
    title: 'Vision Solutions',
    description: 'Personalized correction options',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#007AFF', '#00C6FB']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>OcuScan</Text>
          <Text style={styles.subtitle}>
            Advanced Eye Care with Artificial Intelligence
          </Text>
          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <feature.icon size={24} color="#007AFF" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Eye Conditions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.conditionsScroll}
          >
            {eyeConditions.map((condition, index) => (
              <TouchableOpacity key={index} style={styles.conditionCard}>
                <Image 
                  source={{ uri: condition.image }}
                  style={styles.conditionImage}
                />
                <View style={styles.conditionContent}>
                  <Text style={styles.conditionTitle}>{condition.title}</Text>
                  <Text style={styles.conditionDescription}>
                    {condition.description}
                  </Text>
                  <View style={styles.learnMore}>
                    <Text style={styles.learnMoreText}>Learn More</Text>
                    <ArrowRight size={16} color="#007AFF" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Us</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Accuracy Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>50K+</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    padding: 24,
  },
  title: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  signInButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  signUpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    lineHeight: 20,
  },
  conditionsScroll: {
    paddingRight: 24,
  },
  conditionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: 280,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  conditionImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F2F2F7',
  },
  conditionContent: {
    padding: 16,
  },
  conditionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  conditionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 12,
  },
  learnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  learnMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
});