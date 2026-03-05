import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {login, isLoading} = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.detail || 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.logo}>🔒</Text>
        <Text style={styles.title}>Smart Lock Deployment</Text>
        <Text style={styles.subtitle}>Technician Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 24},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4},
  logo: {fontSize: 40, textAlign: 'center', marginBottom: 8},
  title: {fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#1C1C1E'},
  subtitle: {fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 24},
  input: {borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, backgroundColor: '#F9F9F9'},
  button: {backgroundColor: '#007AFF', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8},
  buttonDisabled: {backgroundColor: '#99C0FF'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
