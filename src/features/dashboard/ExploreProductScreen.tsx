import React from 'react';
import { View, StyleSheet, Modal, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';

// Define the props for TypeScript
interface ExploreProductsProps {
  visible: boolean;
  onClose: () => void;
}

const ExploreProductsScreen: React.FC<ExploreProductsProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheetContainer}>
        {/* Header to allow the user to close the sheet */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        {/* The AirBuddi Shop WebView */}
        <WebView
          source={{ uri: 'https://www.airbuddi.in/shop' }}
          style={styles.webview}
          startInLoadingState={true}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sheetHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF', // Or use your Greenverse brand color
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});

export default ExploreProductsScreen;