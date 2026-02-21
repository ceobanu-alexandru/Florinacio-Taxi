import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Redirect, Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/user-context';

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

type GoogleAutocompleteSuggestion = {
  placeId: string;
  description: string;
};

const TAXI_LOCATION: LocationCoords = {
  latitude: 47.446463006875895,
  longitude: 26.901535213917253,
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyB029m41iU1JyyfI5ph_FnxugfiVMmXj20';

async function fetchPlaceAutocomplete(query: string): Promise<GoogleAutocompleteSuggestion[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&types=geocode` +
    `&components=country:ro` +
    `&language=ro` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'ZERO_RESULTS') return [];

  if (data.status !== 'OK' || !Array.isArray(data.predictions)) {
    throw new Error(data.error_message || `Places autocomplete error: ${data.status}`);
  }

  return data.predictions.map((prediction: { place_id: string; description: string }) => ({
    placeId: prediction.place_id,
    description: prediction.description,
  }));
}

async function fetchPlaceDetails(placeId: string): Promise<{ coords: LocationCoords; label: string } | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=name,formatted_address,geometry` +
    `&language=ro` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    return null;
  }

  const { lat, lng } = data.result.geometry.location;
  return {
    coords: { latitude: lat, longitude: lng },
    label: data.result.formatted_address ?? data.result.name ?? 'Destinație',
  };
}

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
  const { askDestination } = useLocalSearchParams<{ askDestination?: string }>();
  const { userMode, tarifZi, tarifNoapte } = useUser();

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
  const [mapCenter, setMapCenter] = useState<LocationCoords | null>(null);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [showDestinationPrompt, setShowDestinationPrompt] = useState(askDestination === '1');
  const [isSearchMode, setIsSearchMode] = useState(askDestination === '1');
  const [selectedSuggestionLabel, setSelectedSuggestionLabel] = useState<string | null>(null);
  const [pendingDestination, setPendingDestination] = useState<LocationCoords | null>(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<GoogleAutocompleteSuggestion[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const isUserPanningRef = useRef(false);
  const placeSearchRequestIdRef = useRef(0);
  const pinLiftAnim = useRef(new Animated.Value(0)).current;

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
      setMapCenter({
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

  const animatePin = (lifted: boolean) => {
    Animated.spring(pinLiftAnim, {
      toValue: lifted ? 1 : 0,
      speed: 22,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePanDrag = () => {
    if (!isSearchMode) return;
    if (isUserPanningRef.current) return;
    isUserPanningRef.current = true;
    setIsSelectingOnMap(true);
    animatePin(true);
  };

  const handleRegionChange = (region: Region) => {
    setMapCenter({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  const handleRegionChangeComplete = (region: Region) => {
    const center = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    setMapCenter(center);

    if (!isUserPanningRef.current) return;

    isUserPanningRef.current = false;
    setIsSelectingOnMap(false);
    animatePin(false);

    if (!isSearchMode) return;

    setPendingDestination(center);
    setDestination(null);
    setDestRoute(null);
    setDestinationAddress(null);
  };

  const confirmDestination = () => {
    if (!pendingDestination) return;
    setDestination(pendingDestination);
    setPendingDestination(null);
    setIsSearchMode(false);
  };

  /** Clear the destination pin */
  const clearDestination = () => {
    const previousDestination = destination ?? pendingDestination;

    isUserPanningRef.current = false;
    setDestination(null);
    setPendingDestination(null);
    setDestRoute(null);
    setDestinationAddress(null);
    setShowDestinationPrompt(true);
    setIsSearchMode(true);
    setIsSelectingOnMap(false);
    setDestinationQuery('');
    setGoogleSuggestions([]);
    setPlaceSearchError(null);
    animatePin(false);

    if (previousDestination && mapRef.current) {
      setMapCenter(previousDestination);
      mapRef.current.animateToRegion(
        {
          latitude: previousDestination.latitude,
          longitude: previousDestination.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        350,
      );
    }
  };

  // Calculate price based on time of day (6:00-22:00 = day, 22:00-6:00 = night)
  const price = useMemo(() => {
    if (!destRoute) return null;
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 22;
    const pricePerKm = parseFloat(isDaytime ? tarifZi : tarifNoapte);
    return destRoute.distanceKm * pricePerKm;
  }, [destRoute, tarifZi, tarifNoapte]);

  useEffect(() => {
    if (!showDestinationPrompt) return;

    const query = destinationQuery.trim();
    const requestId = ++placeSearchRequestIdRef.current;

    if (query.length < 2) {
      setGoogleSuggestions([]);
      setSearchingPlaces(false);
      setPlaceSearchError(null);
      return;
    }

    setSearchingPlaces(true);
    setPlaceSearchError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await fetchPlaceAutocomplete(query);
        if (requestId !== placeSearchRequestIdRef.current) return;
        setGoogleSuggestions(suggestions);
      } catch (_) {
        if (requestId !== placeSearchRequestIdRef.current) return;
        setGoogleSuggestions([]);
        setPlaceSearchError('Nu s-au putut încărca sugestiile Google.');
      } finally {
        if (requestId === placeSearchRequestIdRef.current) {
          setSearchingPlaces(false);
        }
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [destinationQuery, showDestinationPrompt]);

  const handleSuggestionPress = async (place: GoogleAutocompleteSuggestion) => {
    const details = await fetchPlaceDetails(place.placeId);
    if (!details) {
      setPlaceSearchError('Nu s-a putut obține locația exactă pentru această adresă.');
      return;
    }

    setShowDestinationPrompt(false);
    setIsSearchMode(true);
    setSelectedSuggestionLabel(details.label);
    setDestinationQuery(details.label);
    setDestination(null);
    setPendingDestination(null);
    setDestRoute(null);
    setDestinationAddress(null);
    setMapCenter(details.coords);
    setGoogleSuggestions([]);
    setPlaceSearchError(null);

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: details.coords.latitude,
          longitude: details.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        700,
      );
    }
  };

  // Redirect to login if not logged in
  if (!userMode) {
    return <Redirect href="/login" />;
  }

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
          <>
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
              onPanDrag={handlePanDrag}
              onRegionChange={handleRegionChange}
              onRegionChangeComplete={handleRegionChangeComplete}
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
                <Image
                  source={require('../assets/images/Taxi.png')}
                  style={styles.driverMarkerImage}
                  resizeMode="contain"
                />
              </Marker>

              {/* Shadow marker during selection */}
              {isSelectingOnMap && mapCenter && (
                <Marker
                  coordinate={mapCenter}
                  anchor={{ x: 0.14, y: 0.5 }}
                >
                  <View style={styles.shadowDot} />
                </Marker>
              )}

              {/* Selected destination pin (solid) */}
              {(pendingDestination || destination) && !isSelectingOnMap && (
                <Marker
                  coordinate={pendingDestination ?? destination!}
                  title="Destinație"
                  description={pendingDestination ? 'Confirmă destinația' : (destinationAddress ?? 'Destinația ta')}
                  anchor={{ x: 0.14, y: 0.5 }}
                >
                  <View style={styles.destinationDot} />
                </Marker>
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

            {isSearchMode && (isSelectingOnMap || !destination) && (
              <View style={styles.centerPinContainer} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.pinInner,
                    {
                      transform: [
                        {
                          translateY: pinLiftAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -18],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Image source={require('../assets/images/pin.png')} style={styles.centerPin} resizeMode="contain" />
                </Animated.View>
              </View>
            )}
          </>
        ) : null}

        {/* Destination suggestions */}
        {location && !loading && showDestinationPrompt && (
          <View style={styles.destinationPromptCard}>
            <Text style={styles.destinationPromptTitle}>Unde vrei să mergi?</Text>
            <Text style={styles.destinationPromptSubtitle}>Scrie destinația și alege din sugestiile Google.</Text>
            <TextInput
              value={destinationQuery}
              onChangeText={setDestinationQuery}
              placeholder="Scrie destinația"
              placeholderTextColor="#777777"
              style={styles.destinationInput}
              autoCorrect={false}
              autoCapitalize="words"
            />

            {destinationQuery.trim().length > 0 && (
              <View style={styles.suggestionsWrap}>
                {searchingPlaces ? (
                  <Text style={styles.searchStatusText}>Se caută adrese cu Google...</Text>
                ) : placeSearchError ? (
                  <Text style={styles.noSuggestionText}>{placeSearchError}</Text>
                ) : googleSuggestions.length > 0 ? (
                  googleSuggestions.map((place) => (
                    <Pressable key={place.placeId} style={styles.suggestionChip} onPress={() => void handleSuggestionPress(place)}>
                      <Text style={styles.suggestionChipText}>{place.description}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.noSuggestionText}>Nu există adrese găsite.</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Hint banner — shown when no destination is set yet */}
        {location && !loading && isSearchMode && !showDestinationPrompt && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>
              📍 {selectedSuggestionLabel ? `Ajustează punctul exact în zona ${selectedSuggestionLabel}` : 'Glisează harta și eliberează pentru a seta locația'}
            </Text>
          </View>
        )}

        {/* Confirm destination before computing route */}
        {location && !loading && pendingDestination && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmText}>Confirmi această destinație?</Text>
            <View style={styles.confirmButtonsRow}>
              <Pressable style={styles.confirmButton} onPress={confirmDestination}>
                <Text style={styles.confirmButtonText}>Confirmă destinația</Text>
              </Pressable>
              <Pressable style={styles.secondaryConfirmButton} onPress={clearDestination}>
                <Text style={styles.secondaryConfirmButtonText}>Schimbă destinația</Text>
              </Pressable>
            </View>
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
              <Image
                source={require('../assets/images/soferul tau a ajuns.png')}
                style={styles.bottomDriverImage}
                resizeMode="contain"
              />
              <View style={styles.bottomInfo}>
                <Text style={styles.bottomTitle}>
                  Bro este la {(() => {
                    const totalMinutes = Math.round(taxiRoute.durationMinutes);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    if (hours > 0) {
                      const hourText = hours === 1 ? 'oră' : 'ore';
                      const minuteText = minutes === 1 ? 'minut' : 'minute';
                      return minutes > 0 ? `${hours} ${hourText} și ${minutes} ${minuteText}` : `${hours} ${hourText}`;
                    }
                    const minuteText = minutes === 1 ? 'minut' : 'minute';
                    return `${minutes} ${minuteText}`;
                  })()} de tine
                </Text>
                <Text style={styles.bottomSubtitle}>
                  {taxiRoute.distanceKm.toFixed(1)} km
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
                      {destRoute.distanceKm.toFixed(1)} km
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
  destinationPromptCard: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 10,
  },
  destinationPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  destinationPromptSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
  },
  destinationInput: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#2A2A2A',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionChipText: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '700',
  },
  noSuggestionText: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '500',
  },
  searchStatusText: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 170,
    backgroundColor: 'rgba(20, 20, 20, 0.96)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  confirmButton: {
    backgroundColor: '#FFD600',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  confirmButtonText: {
    color: '#0D0D0D',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryConfirmButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  secondaryConfirmButtonText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '700',
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
  bottomDriverImage: {
    width: 80,
    height: 80,
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
  driverMarkerImage: {
    width: 30,
    height: 30,// problema
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -92,
    zIndex: 20,
  },
  pinInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPin: {
    width: 86,
    height: 86,
  },
  destinationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shadowDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});
