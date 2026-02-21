import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUser, DriverStatus } from '@/contexts/user-context';

const STATUS_CONFIG: Record<DriverStatus, { label: string; color: string; description: string }> = {
  liber: {
    label: 'Liber',
    color: '#00C853',
    description: 'Șoferul este disponibil',
  },
  ocupat: {
    label: 'Ocupat',
    color: '#FF3B30',
    description: 'Șoferul este într-o cursă',
  },
  indisponibil: {
    label: 'Nu lucrează azi',
    color: '#888888',
    description: 'Șoferul nu este disponibil astăzi',
  },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode, driverStatus, tarifZi, tarifNoapte, phoneNumber } = useUser();
  const [remainingMinutes, setRemainingMinutes] = useState<number>(12);

  // Example ETA until current ride finishes (from backend in real app)
  useEffect(() => {
    setRemainingMinutes(12);
  }, []);

  // Countdown while driver is occupied
  useEffect(() => {
    if (driverStatus !== 'liber') return;

    const interval = setInterval(() => {
      setRemainingMinutes((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);

    return () => clearInterval(interval);
  }, [driverStatus]);

  // Redirect to login if not logged in
  if (!userMode) {
    return <Redirect href="/login" />;
  }

  const status = STATUS_CONFIG[driverStatus];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>BrotaXI</Text>
        <Text style={styles.logoDot}>.</Text>
      </View>

      {/* Driver status indicator */}
      <View style={[styles.statusBadge, { borderColor: status.color }]}> 
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        <View style={styles.statusInfoBlock}>
          <Text style={styles.statusDesc}>{status.description}</Text>
          {driverStatus === 'ocupat' && (
            <Text style={styles.statusEta}>Termină cursa în aprox. {remainingMinutes} min</Text>
          )}
        </View>
      </View>

      {/* Tarife */}
      <View style={styles.fareCard}>
        <Text style={styles.fareTitle}>Tarife</Text>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Zi</Text>
          <Text style={styles.fareValue}>{tarifZi} lei/km</Text>
        </View>
        <View style={styles.fareDivider} />
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Noapte</Text>
          <Text style={styles.fareValue}>{tarifNoapte} lei/km</Text>
        </View>
      </View>

      {/* Hero section */}
      <View style={[styles.hero]}>
        <Image
          source={require('../../assets/images/ada.png')}
          style={styles.heroLogo}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>Sună-l pe Bro</Text>
        <Text style={styles.heroSubtitle}>Curse premium, oricând</Text>
      </View>

      {/* CTA Button */}
      <Pressable
        style={styles.ctaButton}
        onPress={() => router.push({ pathname: '/map', params: { askDestination: '1' } })}
      >
        <Text style={styles.ctaText}>Solicită o cursă</Text>
      </Pressable>

      {/* Call Button */}
      <Pressable
        style={styles.callButton}
        onPress={() => Linking.openURL(`tel:${phoneNumber}`)}
      >
        <Image
          source={require('../../assets/images/buton apel.png')}
          style={styles.callButtonImage}
          resizeMode="contain"
        />
      </Pressable>

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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  logoDot: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD600',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 15,
  },
  heroLogo: {
    width: 100,
    height: 100,
    overflow: 'hidden',
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
  callButton: {
    alignItems: 'center',
    marginBottom: 36,
  },
  callButtonImage: {
    width: 80,
    height: 80,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusDesc: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  statusInfoBlock: {
    flex: 1,
    gap: 4,
  },
  statusEta: {
    fontSize: 12,
    color: '#FFD600',
    fontWeight: '700',
    textAlign: 'right',
  },
  fareCard: {
    alignSelf: 'stretch',
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 14,
    color: '#FFD600',
    fontWeight: '700',
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 8,
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
