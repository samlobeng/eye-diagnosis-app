import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Linking } from 'react-native';
import { Eye, EyeOff, ArrowLeft, UserPlus, Upload, Camera } from 'lucide-react-native';
import { useRouter, Redirect } from 'expo-router';
import { signInWithGoogle } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { decode } from 'base64-arraybuffer';

type DocumentType = 'license' | 'passport' | 'selfie';

export default function RegisterScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medicalLicense, setMedicalLicense] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Record<DocumentType, string | null>>({
    license: null,
    passport: null,
    selfie: null,
  });
  const router = useRouter();

  // If user is already authenticated, redirect to tabs
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleDocumentUpload = async (type: DocumentType) => {
    try {
      if (type === 'selfie') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your camera to take a selfie.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          await uploadDocument(type, result.assets[0].base64, 'image/jpeg');
        }
      } else {
        Alert.alert(
          'Select Document',
          'How would you like to upload your document?',
          [
            {
              text: 'Choose from Library',
              onPress: async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                
                if (!permissionResult.granted) {
                  Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: 'images',
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  base64: true,
                });

                if (!result.canceled && result.assets[0].base64) {
                  await uploadDocument(type, result.assets[0].base64, 'image/jpeg');
                }
              }
            },
            {
              text: 'Take Photo',
              onPress: async () => {
                const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                
                if (!permissionResult.granted) {
                  Alert.alert('Permission Required', 'Please allow access to your camera to take a photo.');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: 'images',
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  base64: true,
                });

                if (!result.canceled && result.assets[0].base64) {
                  await uploadDocument(type, result.assets[0].base64, 'image/jpeg');
                }
              }
            },
            {
              text: 'Choose from File System',
              onPress: async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'application/pdf'],
                    copyToCacheDirectory: true,
                  });

                  if (result.assets && result.assets[0]) {
                    const asset = result.assets[0];
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    
                    reader.onload = async () => {
                      const base64Data = reader.result as string;
                      // Remove the data URL prefix
                      const base64Content = base64Data.split(',')[1];
                      // Determine content type based on file extension
                      const contentType = asset.mimeType || 'application/pdf';
                      await uploadDocument(type, base64Content, contentType);
                    };
                    
                    reader.readAsDataURL(blob);
                  }
                } catch (error) {
                  console.error('File picker error:', error);
                  Alert.alert('Error', 'Failed to pick file. Please try again.');
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  const uploadDocument = async (type: DocumentType, base64Data: string, contentType: string) => {
    setLoading(true);
    try {
      // Generate a unique filename using timestamp and type
      const timestamp = Date.now();
      const fileExtension = contentType === 'application/pdf' ? 'pdf' : 'jpg';
      const fileName = `temp/${type}/${timestamp}.${fileExtension}`;
      const fileData = decode(base64Data);

      // Upload the file directly
      const { data, error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(fileName, fileData, {
          contentType: contentType,
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name
        });
        
        if (uploadError.message.includes('not found')) {
          Alert.alert(
            'Error',
            'Storage bucket not found. Please contact support to set up the required storage bucket.',
            [
              {
                text: 'OK',
                onPress: () => {
                  Linking.openURL('mailto:support@example.com');
                }
              }
            ]
          );
        } else if (uploadError.message.includes('duplicate')) {
          Alert.alert('Error', 'A file with this name already exists. Please try again.');
        } else {
          Alert.alert('Error', `Upload failed: ${uploadError.message}`);
        }
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      // Update the documents state
      setDocuments(prev => ({
        ...prev,
        [type]: publicUrl,
      }));

      Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        error instanceof Error 
          ? `Failed to upload document: ${error.message}`
          : 'Failed to upload document. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !medicalLicense) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (!documents.license || !documents.passport || !documents.selfie) {
      Alert.alert('Error', 'Please upload all required documents');
      return;
    }

    setLoading(true);
    try {
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            medical_license_number: medicalLicense,
          },
        },
      });

      if (authError) throw authError;

      // Create a profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          full_name: name,
          medical_license_number: medicalLicense,
          verification_status: 'pending',
        });

      if (profileError) throw profileError;

      // Wait for a moment to ensure the session is established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Failed to establish user session');
      }

      // Now move the documents from temp to user's folder
      const movePromises = Object.entries(documents).map(async ([type, url]) => {
        // Extract the filename from the URL
        const fileName = url?.split('/').pop();
        const newFileName = `${session.user.id}/${type}/${fileName}`;
        
        // Copy the file to the new location
        const { error: copyError } = await supabase.storage
          .from('medical-documents')
          .copy(`temp/${type}/${fileName}`, newFileName);

        if (copyError) throw copyError;

        // Delete the temporary file
        await supabase.storage
          .from('medical-documents')
          .remove([`temp/${type}/${fileName}`]);

        // Insert the document record
        return supabase.from('medical_documents').insert({
          user_id: session.user.id,
          document_type: type,
          file_url: url?.replace(`temp/${type}/`, `${session.user.id}/${type}/`),
        });
      });

      await Promise.all(movePromises);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Error',
        error instanceof Error 
          ? `Registration failed: ${error.message}`
          : 'Failed to sign up. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your medical license number"
              value={medicalLicense}
              onChangeText={setMedicalLicense}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666666" />
                ) : (
                  <Eye size={20} color="#666666" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>
              Password must be at least 8 characters
            </Text>
          </View>

          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            
            <View style={styles.documentGroup}>
              <Text style={styles.label}>Medical License</Text>
              <TouchableOpacity
                style={styles.documentButton}
                onPress={() => handleDocumentUpload('license')}
                disabled={loading}
              >
                {documents.license ? (
                  <Image
                    source={{ uri: documents.license }}
                    style={styles.documentPreview}
                  />
                ) : (
                  <View style={styles.documentPlaceholder}>
                    <Upload size={24} color="#666666" />
                    <Text style={styles.documentPlaceholderText}>Upload License</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.documentGroup}>
              <Text style={styles.label}>Passport</Text>
              <TouchableOpacity
                style={styles.documentButton}
                onPress={() => handleDocumentUpload('passport')}
                disabled={loading}
              >
                {documents.passport ? (
                  <Image
                    source={{ uri: documents.passport }}
                    style={styles.documentPreview}
                  />
                ) : (
                  <View style={styles.documentPlaceholder}>
                    <Upload size={24} color="#666666" />
                    <Text style={styles.documentPlaceholderText}>Upload Passport</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.documentGroup}>
              <Text style={styles.label}>Selfie</Text>
              <TouchableOpacity
                style={styles.documentButton}
                onPress={() => handleDocumentUpload('selfie')}
                disabled={loading}
              >
                {documents.selfie ? (
                  <Image
                    source={{ uri: documents.selfie }}
                    style={styles.documentPreview}
                  />
                ) : (
                  <View style={styles.documentPlaceholder}>
                    <Camera size={24} color="#666666" />
                    <Text style={styles.documentPlaceholderText}>Take Selfie</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <UserPlus size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
  },
  passwordToggle: {
    padding: 12,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  documentsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  documentGroup: {
    gap: 8,
  },
  documentButton: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  documentPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  documentPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
    fontFamily: 'Inter-Regular',
  },
  googleButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
});