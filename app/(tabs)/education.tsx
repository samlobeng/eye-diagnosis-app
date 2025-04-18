import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Book, Eye, AlertTriangle, Info, ExternalLink } from 'lucide-react-native';

interface EducationCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  link?: string;
}

const EducationCard: React.FC<EducationCardProps> = ({ title, content, icon, link }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {icon}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardContent}>{content}</Text>
    {link && (
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => Linking.openURL(link)}
      >
        <Text style={styles.linkText}>Learn More</Text>
        <ExternalLink size={16} color="#007AFF" />
      </TouchableOpacity>
    )}
  </View>
);

export default function EducationScreen() {
  const educationContent = [
    {
      title: 'Common Eye Conditions',
      content: 'Learn about common eye conditions like cataracts, glaucoma, diabetic retinopathy, and age-related macular degeneration. Early detection and treatment are crucial for maintaining eye health.',
      icon: <Eye size={24} color="#007AFF" />,
      link: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases'
    },
    {
      title: 'Eye Health Tips',
      content: 'Discover essential tips for maintaining good eye health, including proper nutrition, regular eye exams, protecting your eyes from UV rays, and managing screen time.',
      icon: <Info size={24} color="#007AFF" />,
      link: 'https://www.aao.org/eye-health/tips-prevention'
    },
    {
      title: 'Warning Signs',
      content: 'Recognize the warning signs of eye problems: sudden vision changes, eye pain, flashes of light, floaters, or redness. Seek immediate medical attention if you experience any of these symptoms.',
      icon: <AlertTriangle size={24} color="#007AFF" />,
    },
    {
      title: 'Digital Eye Strain',
      content: 'Learn how to prevent and manage digital eye strain caused by prolonged screen use. Tips include the 20-20-20 rule, proper lighting, and screen settings adjustments.',
      icon: <Eye size={24} color="#007AFF" />,
      link: 'https://www.aao.org/eye-health/tips-prevention/digital-devices-your-eyes'
    },
    {
      title: 'Children\'s Eye Health',
      content: 'Important information about children\'s eye health, including signs of vision problems, the importance of regular eye exams, and tips for protecting young eyes.',
      icon: <Info size={24} color="#007AFF" />,
      link: 'https://www.aao.org/eye-health/tips-prevention/children-eye-health'
    },
    {
      title: 'Nutrition for Eye Health',
      content: 'Discover the essential nutrients for eye health, including vitamins A, C, and E, omega-3 fatty acids, and lutein. Learn which foods can help maintain good vision.',
      icon: <Info size={24} color="#007AFF" />,
      link: 'https://www.aao.org/eye-health/tips-prevention/diet-nutrition'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Book size={24} color="#000000" />
        <Text style={styles.title}>Eye Health Education</Text>
      </View>
      <ScrollView style={styles.content}>
        {educationContent.map((item, index) => (
          <EducationCard
            key={index}
            title={item.title}
            content={item.content}
            icon={item.icon}
            link={item.link}
          />
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
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  cardContent: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
}); 