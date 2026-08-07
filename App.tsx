import 'react-native-url-polyfill/auto';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// 1. Import SafeAreaView along with SafeAreaProvider
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DashboardScreen } from './src/features/dashboard/DashboardScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  return (
    // 2. Change your root View here to a SafeAreaView.
    // 3. Use edges={['top']} so padding is applied *only* to the top area 
    // where your status bar/battery icons sit, leaving the bottom unaffected.
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    // 4. Match the background color to your app layout (#F4F9F5 or white) 
    // so the safe padding area blends seamlessly with your dashboard header.
    backgroundColor: '#F4F9F5', 
  },
});

export default App;