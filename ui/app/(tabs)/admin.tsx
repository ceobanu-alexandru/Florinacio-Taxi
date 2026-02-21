import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser, DriverStatus } from '@/contexts/user-context';
import { Redirect, useRouter } from 'expo-router';

const STATUS_CONFIG: Record<DriverStatus, { label: string; color: string }> = {
  liber: { label: 'Liber', color: '#00C853' },
  ocupat: { label: 'Ocupat', color: '#FF3B30' },
  indisponibil: { label: 'Nu lucrează azi', color: '#888888' },
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { 
    logout, 
    userMode, 
    driverStatus, 
    setDriverStatus,
    tarifZi,
    setTarifZi,
    tarifNoapte,
    setTarifNoapte,
    phoneNumber,
    setPhoneNumber
  } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleSave = () => {
    // Data is already saved in context when user changes it
    alert('Setările au fost salvate!');
  };

  // Redirect to login if not logged in or not admin
  if (!userMode || userMode !== 'admin') {
    return <Redirect href="/login" />;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0D0D0D' }}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>BrotaXI</Text>
            <Text style={styles.subtitle}>Panou Admin</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Deconectare</Text>
          </Pressable>
        </View>

      {/* Driver Photo */}
      <View style={styles.photoSection}>
        <Image
          source={require('../../assets/images/soferul tau a ajuns.png')}
          style={styles.driverPhoto}
          resizeMode="contain"
        />
        <Text style={styles.driverName}>Șofer Bro</Text>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Șofer</Text>
        <View style={styles.statusButtons}>
          {(Object.keys(STATUS_CONFIG) as DriverStatus[]).map((status) => (
            <Pressable
              key={status}
              style={[
                styles.statusButton,
                driverStatus === status && { borderColor: STATUS_CONFIG[status].color, borderWidth: 3 },
              ]}
              onPress={() => setDriverStatus(status)}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_CONFIG[status].color },
                ]}
              />
              <Text style={[styles.statusLabel, { color: STATUS_CONFIG[status].color }]}>
                {STATUS_CONFIG[status].label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tariffs Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarife (lei/km)</Text>
        
        <View style={styles.tariffRow}>
          <Text style={styles.tariffLabel}>Zi</Text>
          <TextInput
            style={styles.tariffInput}
            value={tarifZi}
            onChangeText={setTarifZi}
            keyboardType="decimal-pad"
            placeholder="3"
            placeholderTextColor="#666666"
          />
          <Text style={styles.tariffUnit}>lei/km</Text>
        </View>

        <View style={styles.tariffRow}>
          <Text style={styles.tariffLabel}>Noapte</Text>
          <TextInput
            style={styles.tariffInput}
            value={tarifNoapte}
            onChangeText={setTarifNoapte}
            keyboardType="decimal-pad"
            placeholder="4"
            placeholderTextColor="#666666"
          />
          <Text style={styles.tariffUnit}>lei/km</Text>
        </View>
      </View>

      {/* Phone Number Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Număr de telefon</Text>
        
        <View style={styles.tariffRow}>
          <Text style={styles.tariffLabel}>Telefon</Text>
          <TextInput
            style={[styles.tariffInput, { flex: 1 }]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="0755123456"
            placeholderTextColor="#666666"
          />
        </View>
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Salvează Modificările</Text>
      </Pressable>

      <View style={styles.accentLine} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD600',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '700',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  driverPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  tariffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tariffLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  tariffInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD600',
    width: 80,
    textAlign: 'center',
  },
  tariffUnit: {
    fontSize: 14,
    color: '#999999',
    marginLeft: 8,
    width: 60,
  },
  saveButton: {
    backgroundColor: '#FFD600',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 0.5,
  },
  accentLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD600',
    alignSelf: 'center',
  },
});
