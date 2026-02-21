import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/user-context';
import { useState } from 'react';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUserMode } = useUser();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLogin = () => {
    if (!phoneNumber.trim()) {
      return; // Don't proceed if input is empty
    }

    // Debug mode: if input is "admin", login as admin, otherwise login as passenger
    if (phoneNumber.toLowerCase() === 'admin') {
      setUserMode('admin');
    } else {
      setUserMode('pasager');
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Image
          source={require('../assets/images/ada.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>Bine ai venit la</Text>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>BrotaXI</Text>
          <Text style={styles.brandDot}>.</Text>
        </View>
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Număr de telefon</Text>
        <TextInput
          style={styles.phoneInput}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Introduce numărul de telefon"
          placeholderTextColor="#666666"
          keyboardType="phone-pad"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <Text style={styles.debugHint}>Debug: scrie "admin" pentru acces admin</Text>
      </View>

      {/* Login Button */}
      <Pressable
        style={[styles.loginButton, !phoneNumber.trim() && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={!phoneNumber.trim()}
      >
        <Text style={styles.loginButtonText}>Continuă</Text>
      </Pressable>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.accentLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD600',
  },
  inputSection: {
    gap: 12,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneInput: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    padding: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  debugHint: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FFD600',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#3A3A3A',
    shadowOpacity: 0,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 24,
    alignItems: 'center',
  },
  accentLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD600',
  },
});
