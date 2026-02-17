import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';

type LocationCoords = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable it in settings.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Your Location',
          headerStyle: { backgroundColor: '#141414' },
          headerTintColor: '#FFD600',
          headerTitleStyle: { fontWeight: '700', color: '#FFFFFF' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD600" />
            <Text style={styles.loadingText}>Finding your location...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorEmoji}>📍</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : location ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={location}
              title="You are here"
              description="Florinacio will pick you up"
              pinColor="#FFD600"
            />
          </MapView>
        ) : null}

        {/* Bottom info bar */}
        {location && !loading && (
          <View style={styles.bottomBar}>
            <Text style={styles.bottomEmoji}>🚖</Text>
            <View style={styles.bottomInfo}>
              <Text style={styles.bottomTitle}>Florinacio is on the way</Text>
              <Text style={styles.bottomSubtitle}>Estimated arrival: 3 min</Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 16,
  },
  bottomEmoji: {
    fontSize: 36,
  },
  bottomInfo: {
    gap: 4,
  },
  bottomTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSubtitle: {
    fontSize: 14,
    color: '#FFD600',
    fontWeight: '600',
  },
});
