import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { UserProvider } from '@/contexts/user-context';

SplashScreen.preventAutoHideAsync();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FlorinacioTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FFD600',
    background: '#0D0D0D',
    card: '#141414',
    text: '#FFFFFF',
    border: '#2A2A2A',
    notification: '#FFD600',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current; // start off-screen (bottom)

  useEffect(() => {
    // Hide the native splash immediately, we take over
    SplashScreen.hideAsync();

    // Slide the image up slowly over 3 seconds
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // After the slide-up finishes, wait a brief moment then dismiss
      setTimeout(() => setSplashDone(true), 400);
    });
  }, []);

  if (!splashDone) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.imageWrapper,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Image
            source={require('../assets/images/ada.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <UserProvider>
      <ThemeProvider value={FlorinacioTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="map" options={{ title: 'Your Location' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </UserProvider>
  );
}
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 350,
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '80%',
    height: '80%',
    borderRadius: 20,
  },
});
