import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { user } = useAuth();

  // If user is authenticated, redirect to tabs
  if (user) {
    return <Redirect href="/(tabs)/patients" />;
  }

  // If not authenticated, redirect to onboarding
  return <Redirect href="/onboarding" />;
}