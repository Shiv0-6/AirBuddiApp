import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { dashboardTheme } from '../dashboard/dashboardTheme';

export function LegalScreen({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={dashboardTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.text}>
            Your privacy is important to us. This Privacy Policy explains how AirBuddi collects, uses, and protects your information when you use our app and services.
          </Text>
          <Text style={styles.text}>
            [Placeholder: Detailed Privacy Policy content goes here...]
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms of Service</Text>
          <Text style={styles.text}>
            By using AirBuddi, you agree to comply with and be bound by the following terms and conditions of use.
          </Text>
          <Text style={styles.text}>
            [Placeholder: Detailed Terms of Service content goes here...]
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: dashboardTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: 12,
  },
});
