import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';

const BG = '#0D7A8C';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Text style={styles.hamburger}>{'\u2261'}</Text>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.title}>Lock Deployment</Text>
        <Text style={styles.welcome}>Welcome!</Text>
        <Text style={styles.subtitle}>
          This deployment application will help you ensure correct lock-to-unit association.
        </Text>

        <Text style={styles.loginLabel}>LOGIN</Text>

        <Text style={styles.fieldLabel}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={BG} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},
  scroll: {flexGrow: 1, paddingBottom: 48},
  topBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16},
  hamburger: {fontSize: 26, color: '#fff', width: 36},
  logo: {flex: 1, height: 72},
  topBarSpacer: {width: 36},
  title: {fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 24, paddingHorizontal: 24},
  welcome: {fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8, paddingHorizontal: 24},
  subtitle: {fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 21, marginBottom: 32, paddingHorizontal: 24},
  loginLabel: {fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 2, textAlign: 'center', marginBottom: 20},
  fieldLabel: {fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 6, paddingHorizontal: 24},
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1C1C1E',
  },
  buttonRow: {alignItems: 'center', marginTop: 16},
  button: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 56},
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: BG, fontSize: 16, fontWeight: '700'},
});
