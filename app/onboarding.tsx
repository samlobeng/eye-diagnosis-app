import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Platform, Image } from 'react-native';
import { Eye, Camera, FileText, ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const features = [
  {
    Icon: Camera,
    title: 'AI Eye Scanning',
    description: 'Use your camera to scan your eyes and get instant health insights powered by advanced AI technology.',
  },
  {
    Icon: FileText,
    title: 'Detailed Reports',
    description: 'Receive comprehensive reports about your eye health with personalized recommendations.',
  },
  {
    Icon: ShoppingBag,
    title: 'Eye Care Products',
    description: 'Shop for recommended eye care products directly through our integrated store.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/home');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/home');
  };

  const CurrentIcon = features[currentStep].Icon;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#007AFF', '#00C6FB']}
        style={styles.gradientBackground}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Eye size={48} color="#ffffff" />
          <Text style={styles.appName}>OcuScan</Text>
          <Text style={styles.tagline}>
            Your personal eye health assistant
          </Text>
        </View>

        <View style={styles.featureContainer}>
          <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            key={currentStep}
            style={styles.feature}
          >
            <View style={styles.featureIcon}>
              <CurrentIcon size={32} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>{features[currentStep].title}</Text>
            <Text style={styles.featureDescription}>
              {features[currentStep].description}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.stepsContainer}>
          {features.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {currentStep === features.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {currentStep < features.length - 1 && (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    marginTop: 16,
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#ffffff',
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  featureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  feature: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
  },
});