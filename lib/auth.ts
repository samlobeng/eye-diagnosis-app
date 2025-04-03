import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({
  scheme: 'your-scheme', // Replace with your app's scheme
  path: 'auth/callback',
});

export async function signIn(email: string, password: string) {
  try {
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    // Check if user is approved
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', user?.id)
      .single();

    if (profileError) throw profileError;

    if (profile.verification_status !== 'approved') {
      // Sign out the user if not approved
      await supabase.auth.signOut();
      throw new Error('Your account is pending approval. Please wait for administrator approval.');
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) throw signUpError;

    // Create profile with pending status
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user?.id,
        full_name: fullName,
        verification_status: 'pending',
      });

    if (profileError) throw profileError;

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return data;
  } else {
    throw new Error('Google sign-in is not supported on this platform');
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return { user: { ...user, ...profile }, error: null };
    }

    return { user: null, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}