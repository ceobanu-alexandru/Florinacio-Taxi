/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FFD600';
const tintColorDark = '#FFD600';

export const Colors = {
  light: {
    text: '#FFFFFF',
    background: '#0D0D0D',
    tint: tintColorLight,
    icon: '#888888',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorLight,
    card: '#1A1A1A',
    cardBorder: '#2A2A2A',
    accent: '#FFD600',
    subtle: '#999999',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0D0D0D',
    tint: tintColorDark,
    icon: '#888888',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
    card: '#1A1A1A',
    cardBorder: '#2A2A2A',
    accent: '#FFD600',
    subtle: '#999999',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
