import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>FLORINACIO</Text>
        <Text style={styles.logoDot}>.</Text>
      </View>

      {/* Hero section */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🚖</Text>
        <Text style={styles.heroTitle}>Call Florinacio</Text>
        <Text style={styles.heroSubtitle}>Premium rides, anytime</Text>
      </View>

      {/* CTA Button */}
      <Pressable style={styles.ctaButton} onPress={() => router.push('/map')}>
        <Text style={styles.ctaText}>Request a Ride</Text>
      </Pressable>

      {/* Info cards */}
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>⚡</Text>
          <Text style={styles.cardTitle}>Fast</Text>
          <Text style={styles.cardDesc}>3 min avg pickup</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>🛡️</Text>
          <Text style={styles.cardTitle}>Safe</Text>
          <Text style={styles.cardDesc}>Verified drivers</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>💰</Text>
          <Text style={styles.cardTitle}>Fair</Text>
          <Text style={styles.cardDesc}>No surge pricing</Text>
        </View>
      </View>

      {/* Taxi flags accent */}
      <View style={styles.flagsRow}>
        <Text style={styles.flag}>🏁</Text>
        <Text style={styles.flag}>🚕</Text>
        <Text style={styles.flag}>🏁</Text>
        <Text style={styles.flag}>🚕</Text>
        <Text style={styles.flag}>🏁</Text>
      </View>

      {/* Bottom accent line */}
      <View style={styles.accentLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  logo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  logoDot: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD600',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  ctaButton: {
    backgroundColor: '#FFD600',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 50,
    marginBottom: 36,
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D0D0D',
    letterSpacing: 0.5,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  flag: {
    fontSize: 28,
  },
  accentLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD600',
    marginTop: 'auto',
    marginBottom: 16,
  },
});
