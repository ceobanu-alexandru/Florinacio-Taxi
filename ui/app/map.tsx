import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
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

const PRICE_PER_KM = 3; // lei per km

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

/** Reverse-geocode coordinates into a short address via Google Geocoding API */
async function reverseGeocode(coords: LocationCoords): Promise<string> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${coords.latitude},${coords.longitude}` +
      `&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results?.length) {
      return data.results[0].formatted_address;
    }
  } catch (_) {}
  return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Taxi → user route (shown while user hasn't picked a destination yet)
  const [taxiRoute, setTaxiRoute] = useState<RouteInfo | null>(null);

  // Destination pin & route
  const [destination, setDestination] = useState<LocationCoords | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string | null>(null);
  const [destRoute, setDestRoute] = useState<RouteInfo | null>(null);
  const [computingRoute, setComputingRoute] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permisiunea de locație a fost refuzată. Activează-o din setări.');
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

  // Fetch taxi → user route
  useEffect(() => {
    if (!location) return;
    fetchRoute(TAXI_LOCATION, location).then((info) => {
      setTaxiRoute(info);
      if (mapRef.current && !destination) {
        const coords = info?.polylineCoords ?? [location, TAXI_LOCATION];
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
          animated: true,
        });
      }
    });
  }, [location]);

  // Fetch user → destination route whenever destination changes
  useEffect(() => {
    if (!location || !destination) return;
    setComputingRoute(true);
    Promise.all([
      fetchRoute(location, destination),
      reverseGeocode(destination),
    ]).then(([info, address]) => {
      setDestRoute(info);
      setDestinationAddress(address);
      setComputingRoute(false);

      if (mapRef.current && info?.polylineCoords) {
        mapRef.current.fitToCoordinates(info.polylineCoords, {
          edgePadding: { top: 80, right: 80, bottom: 280, left: 80 },
          animated: true,
        });
      }
    });
  }, [destination]);

  /** Handle tapping on the map to set (or move) destination */
  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setDestination({ latitude, longitude });
    setDestRoute(null); // clear old while computing
  };

  /** Clear the destination pin */
  const clearDestination = () => {
    setDestination(null);
    setDestRoute(null);
    setDestinationAddress(null);
    // Re-fit to taxi route
    if (mapRef.current && location) {
      const coords = taxiRoute?.polylineCoords ?? [location, TAXI_LOCATION];
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
        animated: true,
      });
    }
  };

  const price = destRoute ? destRoute.distanceKm * PRICE_PER_KM : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cursa ta',
          headerStyle: { backgroundColor: '#141414' },
          headerTintColor: '#FFD600',
          headerTitleStyle: { fontWeight: '700', color: '#FFFFFF' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <PulsingLogo message="Se caută locația ta..." />
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
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton
            onPress={handleMapPress}
          >
            {/* User marker */}
            <Marker
              coordinate={location}
              title="Ești aici"
              description="Punct de ridicare"
              pinColor="#FFD600"
            />

            {/* Taxi cab marker */}
            <Marker
              coordinate={TAXI_LOCATION}
              title="Bro Taxi"
              description="Locația taxiului"
            >
              <Text style={styles.taxiMarkerText}>🚖</Text>
            </Marker>

            {/* Destination marker */}
            {destination && (
              <Marker
                coordinate={destination}
                title="Destinație"
                description={destinationAddress ?? 'Destinația ta'}
                pinColor="#FF3B30"
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setDestination({ latitude, longitude });
                }}
              />
            )}

            {/* Taxi → user route (dimmed when destination is set) */}
            {taxiRoute?.polylineCoords && (
              <Polyline
                coordinates={taxiRoute.polylineCoords}
                strokeColor={destination ? '#888888' : '#FFD600'}
                strokeWidth={destination ? 3 : 4}
              />
            )}

            {/* User → destination route */}
            {destRoute?.polylineCoords && (
              <Polyline
                coordinates={destRoute.polylineCoords}
                strokeColor="#00C853"
                strokeWidth={5}
              />
            )}
          </MapView>
        ) : null}

        {/* Hint banner — shown when no destination is set yet */}
        {location && !loading && !destination && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>📍 Atinge harta pentru a seta destinația</Text>
          </View>
        )}

        {/* Computing route spinner */}
        {computingRoute && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>⏳ Se calculează ruta...</Text>
          </View>
        )}

        {/* Bottom info bar — taxi ETA (always visible when loaded) */}
        {location && !loading && taxiRoute && (
          <View style={[styles.bottomBar, destination && destRoute ? styles.bottomBarTall : undefined]}>
            {/* Taxi info row */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomEmoji}>🚖</Text>
              <View style={styles.bottomInfo}>
                <Text style={styles.bottomTitle}>Bro este pe drum</Text>
                <Text style={styles.bottomSubtitle}>
                  Taxi sosește în: {taxiRoute.trafficText} ({taxiRoute.distanceKm.toFixed(1)} km)
                </Text>
              </View>
            </View>

            {/* Destination info — only when a destination route is computed */}
            {destination && destRoute && (
              <>
                <View style={styles.divider} />
                <View style={styles.bottomRow}>
                  <Text style={styles.bottomEmoji}>📍</Text>
                  <View style={styles.bottomInfo}>
                    <Text style={styles.bottomTitle} numberOfLines={1}>
                      {destinationAddress ?? 'Destinație'}
                    </Text>
                    <Text style={styles.bottomSubtitle}>
                      Distanță: {destRoute.distanceKm.toFixed(1)} km · Durată: {destRoute.trafficText}
                    </Text>
                    <Text style={styles.priceText}>
                      Preț: {price!.toFixed(2)} lei
                    </Text>
                  </View>
                </View>

                {/* Clear destination button */}
                <Pressable style={styles.clearButton} onPress={clearDestination}>
                  <Text style={styles.clearButtonText}>✕ Schimbă destinația</Text>
                </Pressable>
              </>
            )}
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
    width: 180,
    height: 180,
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
  hintBanner: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
  },
  bottomBarTall: {
    paddingBottom: 40,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bottomEmoji: {
    fontSize: 36,
  },
  bottomInfo: {
    flex: 1,
    gap: 3,
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
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00C853',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 4,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  taxiMarkerText: {
    fontSize: 22,
    textAlign: 'center',
  },
});
