import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type RouteInfo = {
  distanceKm: number;
  durationMinutes: number;
  polylineCoords: LocationCoords[];
  trafficText: string;
};

const TAXI_LOCATION: LocationCoords = {
  latitude: 44.478640,
  longitude: 26.124965,
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyB029m41iU1JyyfI5ph_FnxugfiVMmXj20';

/** Decode a Google-encoded polyline string into an array of coordinates */
function decodePolyline(encoded: string): LocationCoords[] {
  const coords: LocationCoords[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

/** Fetch directions from Google Maps Directions API with real-time traffic */
async function fetchRoute(
  origin: LocationCoords,
  destination: LocationCoords,
): Promise<RouteInfo | null> {
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${origin.latitude},${origin.longitude}` +
    `&destination=${destination.latitude},${destination.longitude}` +
    `&departure_time=now` +
    `&traffic_model=best_guess` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.routes?.length) {
      console.warn('Directions API error:', data.status, data.error_message);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // duration_in_traffic is only present when departure_time=now
    const durationSeconds =
      leg.duration_in_traffic?.value ?? leg.duration.value;
    const distanceMeters = leg.distance.value;
    const trafficText =
      leg.duration_in_traffic?.text ?? leg.duration.text;

    const polylineCoords = decodePolyline(
      route.overview_polyline.points,
    );

    return {
      distanceKm: distanceMeters / 1000,
      durationMinutes: durationSeconds / 60,
      polylineCoords,
      trafficText,
    };
  } catch (err) {
    console.error('Failed to fetch route:', err);
    return null;
  }
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const mapRef = useRef<MapView>(null);

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

  // Fetch real route once we have the user's location
  useEffect(() => {
    if (!location) return;
    fetchRoute(location, TAXI_LOCATION).then((info) => {
      setRouteInfo(info);
      // Fit the route polyline (or both markers) into view
      if (mapRef.current) {
        const coords = info?.polylineCoords ?? [location, TAXI_LOCATION];
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
          animated: true,
        });
      }
    });
  }, [location]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Your Ride',
          headerStyle: { backgroundColor: '#141414' },
          headerTintColor: '#FFD600',
          headerTitleStyle: { fontWeight: '700', color: '#FFFFFF' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <PulsingLogo message="Finding your location..." />
        ) : errorMsg ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorEmoji}>📍</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: (location.latitude + TAXI_LOCATION.latitude) / 2,
              longitude: (location.longitude + TAXI_LOCATION.longitude) / 2,
              latitudeDelta:
                Math.abs(location.latitude - TAXI_LOCATION.latitude) * 1.6 + 0.01,
              longitudeDelta:
                Math.abs(location.longitude - TAXI_LOCATION.longitude) * 1.6 + 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {/* User marker */}
            <Marker
              coordinate={location}
              title="You are here"
              description="Pickup point"
              pinColor="#FFD600"
            />

            {/* Taxi cab marker – yellow car seen from above */}
            <Marker
              coordinate={TAXI_LOCATION}
              title="Florinacio Taxi"
              description="Taxi cab location"
            >
              <Text style={styles.taxiMarkerText}>🚖</Text>
            </Marker>

            {/* Road route line */}
            {routeInfo?.polylineCoords && (
              <Polyline
                coordinates={routeInfo.polylineCoords}
                strokeColor="#FFD600"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : null}

        {/* Bottom info bar */}
        {location && !loading && routeInfo && (
          <View style={styles.bottomBar}>
            <Text style={styles.bottomEmoji}>🚖</Text>
            <View style={styles.bottomInfo}>
              <Text style={styles.bottomTitle}>Florinacio is on the way</Text>
              <Text style={styles.bottomSubtitle}>
                Distance: {routeInfo.distanceKm.toFixed(1)} km
              </Text>
              <Text style={styles.bottomSubtitle}>
                ETA (with traffic): {routeInfo.trafficText}
              </Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

/** Pulsing logo loading indicator */
function PulsingLogo({ message }: { message: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image
          source={require('../assets/images/ada.png')}
          style={styles.pulsingLogo}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.loadingText}>{message}</Text>
    </View>
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
  pulsingLogo: {
    width: 120,
    height: 120,
    borderRadius: 20,
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
  taxiMarkerText: {
    fontSize: 22,
    textAlign: 'center',
  },
});
