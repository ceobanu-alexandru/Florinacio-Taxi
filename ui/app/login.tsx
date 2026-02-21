import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/user-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUserMode } = useUser();

  const handleModeSelect = (mode: 'pasager' | 'admin') => {
    setUserMode(mode);
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

      {/* Mode Selection */}
      <View style={styles.modeSection}>
        <Text style={styles.modeTitle}>Selectează modul de utilizare</Text>

        <Pressable
          style={styles.modeButton}
          onPress={() => handleModeSelect('pasager')}
        >
          <View style={styles.modeIconContainer}>
            <Text style={styles.modeIcon}>👤</Text>
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeLabel}>Pasager</Text>
            <Text style={styles.modeDescription}>Comandă și urmărește curse</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.modeButton}
          onPress={() => handleModeSelect('admin')}
        >
          <View style={styles.modeIconContainer}>
            <Text style={styles.modeIcon}>🚖</Text>
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeLabel}>Admin (Șofer)</Text>
            <Text style={styles.modeDescription}>Gestionează status și tarife</Text>
          </View>
        </Pressable>
      </View>

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
  modeSection: {
    gap: 16,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    padding: 20,
    gap: 16,
  },
  modeIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIcon: {
    fontSize: 32,
  },
  modeInfo: {
    flex: 1,
    gap: 4,
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeDescription: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
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
