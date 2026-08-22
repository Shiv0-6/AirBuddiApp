import React from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

const ExploreProductsScreen = () => {
  // Optional: Show a loading spinner while the page loads
  const renderLoading = () => (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#00ff00" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://www.airbuddi.in/shop/' }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={renderLoading}
        // Optional: Ensure the page scales correctly on mobile devices
        scalesPageToFit={true} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});

export default ExploreProductsScreen;