import React, { useCallback, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Image,
  Switch,
  Linking,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import { Camera, CameraType } from 'react-native-camera-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../dashboard/dashboardTheme';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  setProfile,
  setNotifications,
  setPreferences,
  addDevice as addDeviceAction,
  updateDevice,
  removeDevice,
  setSelectedDeviceId,
  resetSettings,
  HomeDevice,
} from './settingsSlice';
import { fetchLatestTelemetry } from '../../services/awsIot/awsTelemetryApiClient';
import { LegalScreen } from './LegalScreen';

type SheetId = 'account' | 'devices' | 'notification-settings' | 'preferences' | 'support' | 'profile' | 'add-device' | 'edit-device' | 'about' | 'linked-accounts' | 'notifications' | 'alert-thresholds' | 'appearance' | 'units' | 'data-privacy' | 'help' | 'contact-support' | 'legal' | null;

const PROFILE_STORAGE_KEY = '@airbuddi_profile';
const DEVICES_STORAGE_KEY = '@airbuddi_devices';
const NOTIFICATIONS_STORAGE_KEY = '@airbuddi_notifications';
const PREFERENCES_STORAGE_KEY = '@airbuddi_preferences';

export function SettingsScreen({ onSignOut, onExplorePress, modalsOnly = false }: { onSignOut: () => void; onExplorePress: () => void; modalsOnly?: boolean }) {
  const dispatch = useAppDispatch();
  const { profile, notifications, preferences, devices } = useAppSelector(state => state.settings);

  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Local state for profile form
  const [editProfileName, setEditProfileName] = useState(profile.name);
  const [editProfileEmail, setEditProfileEmail] = useState(profile.email);
  const [editProfilePhone, setEditProfilePhone] = useState(profile.phone);
  const [editProfileLocation, setEditProfileLocation] = useState(profile.location);
  const [editAvatarUri, setEditAvatarUri] = useState(profile.avatarUri);
  const [profileNameError, setProfileNameError] = useState('');
  const [profileEmailError, setProfileEmailError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for add device form
  const [addDeviceMode, setAddDeviceMode] = useState<'qr' | 'manual'>('qr');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceRoom, setNewDeviceRoom] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [addDeviceError, setAddDeviceError] = useState('');
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  // Local state for edit device form
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');
  const [editingDeviceRoom, setEditingDeviceRoom] = useState('');
  const [editDeviceError, setEditDeviceError] = useState('');

  // Sync profile local state when modal opens
  useEffect(() => {
    if (activeSheet === 'profile') {
      setEditProfileName(profile.name);
      setEditProfileEmail(profile.email);
      setEditProfilePhone(profile.phone);
      setEditProfileLocation(profile.location);
      setEditAvatarUri(profile.avatarUri);
    }
  }, [activeSheet, profile]);

  // Persistence triggers
  useEffect(() => {
    AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile)).catch(console.error);
  }, [profile]);

  useEffect(() => {
    AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices)).catch(console.error);
  }, [devices]);

  useEffect(() => {
    AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications)).catch(console.error);
  }, [notifications]);

  useEffect(() => {
    AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences)).catch(console.error);
  }, [preferences]);

  const handleSignOut = useCallback(() => {
    setActiveSheet(null);
    setTimeout(() => {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out? All local data will be cleared.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              dispatch(resetSettings());
              AsyncStorage.multiRemove([
                PROFILE_STORAGE_KEY,
                DEVICES_STORAGE_KEY,
                NOTIFICATIONS_STORAGE_KEY,
                PREFERENCES_STORAGE_KEY,
              ]).then(() => onSignOut());
            },
          },
        ],
      );
    }, 100);
  }, [dispatch, onSignOut]);

  const pickProfileImage = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 1 },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error('[AirBuddi] Image picker error:', response.errorMessage);
          return;
        }
        const uri = response.assets?.[0]?.uri;
        if (uri) setEditAvatarUri(uri);
      },
    );
  }, []);

  const saveProfileHandler = useCallback(async () => {
    const name = editProfileName.trim();
    const email = editProfileEmail.trim();
    const phone = editProfilePhone.trim();
    const location = editProfileLocation.trim();
    let hasError = false;

    if (!name) {
      setProfileNameError('Please enter your name.');
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setProfileEmailError('Please enter your email.');
      hasError = true;
    } else if (!emailRegex.test(email)) {
      setProfileEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (hasError) return;
    setIsSavingProfile(true);
    try {
      dispatch(setProfile({ name, email, phone, location, avatarUri: editAvatarUri }));
      setActiveSheet(null);
    } catch (error) {
      console.error('[AirBuddi] Failed to save profile:', error);
    } finally {
      setIsSavingProfile(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }, [editProfileName, editProfileEmail, editProfilePhone, editProfileLocation, editAvatarUri, dispatch]);

  const clearProfileData = useCallback(() => {
    Alert.alert(
      'Reset Profile',
      'Are you sure you want to reset your profile to default? This will clear your name and photo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch(setProfile({
              name: 'AirBuddi Member',
              email: 'member@airbuddi.app',
              phone: '',
              location: '',
              avatarUri: null,
            }));
            setEditProfileName('AirBuddi Member');
            setEditProfileEmail('member@airbuddi.app');
            setEditProfilePhone('');
            setEditProfileLocation('');
            setEditAvatarUri(null);
            setProfileNameError('');
            setProfileEmailError('');
          },
        },
      ],
    );
  }, [dispatch]);

  const applyScannedQrValue = useCallback((value: string) => {
    const scannedValue = value.trim();
    const macMatch = scannedValue.match(/(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}/i);
    const scannedMac = macMatch?.[0].replace(/-/g, ':').toUpperCase() ?? '';

    let extractedId = scannedMac;
    if (!extractedId && (scannedValue.startsWith('http') || scannedValue.includes('/'))) {
      try {
        const urlMatch = scannedValue.match(/[?&](?:id|mac)=([^&]+)/i) || scannedValue.match(/\/([^/?#]+)$/);
        if (urlMatch) extractedId = urlMatch[1].toUpperCase();
      } catch (e) {}
    }
    if (!extractedId && scannedValue.length > 0) extractedId = scannedValue.toUpperCase();

    setIsQrScannerVisible(false);
    setIsScanningQr(false);

    if (extractedId) {
      setAddDeviceError('');
      setNewDeviceId(extractedId);
      setNewDeviceName('AirBuddi Purifier');
      setNewDeviceRoom('Living Room');
    } else {
      setAddDeviceError('The QR code was read, but it appears to be empty or invalid.');
    }
  }, []);

  const handleScanQr = useCallback(async () => {
    setAddDeviceError('');
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setAddDeviceError('Camera permission is required to scan QR codes.');
          return;
        }
      } catch (err) {
        setAddDeviceError('Failed to request camera permission.');
        return;
      }
    }
    setIsScanningQr(true);
    setIsQrScannerVisible(true);
  }, []);

  const handlePickQrFromLibrary = useCallback(async () => {
    setIsScanningQr(true);
    setAddDeviceError('');
    try {
      const response = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (response.didCancel) {
        setIsScanningQr(false);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        if (!imageUri) {
          setAddDeviceError('The selected image could not be read.');
          return;
        }
        const barcodes = await BarcodeScanning.scan(imageUri);
        const scannedValue = barcodes.find(barcode => barcode.value)?.value;
        if (scannedValue) applyScannedQrValue(scannedValue);
        else setAddDeviceError('No QR code was found in the selected image.');
      }
    } catch (err) {
      setAddDeviceError(err instanceof Error ? err.message : 'Failed to decode the selected image.');
    } finally {
      setIsScanningQr(false);
    }
  }, [applyScannedQrValue]);

  const addDeviceHandler = useCallback(async () => {
    const name = newDeviceName.trim() || 'AirBuddi Device';
    const room = newDeviceRoom.trim() || 'New Room';
    const id = newDeviceId.trim().toUpperCase();

    if (devices.some(item => item.id.toLowerCase() === id.toLowerCase())) {
      setAddDeviceError('This device has already been added.');
      return;
    }
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(id)) {
      setAddDeviceError('Enter the device MAC address, for example F4:65:0B:49:12:60.');
      return;
    }

    setIsAddingDevice(true);
    setAddDeviceError('');
    try {
      const telemetry = await fetchLatestTelemetry(id);
      const nextConnection = telemetry.esp32?.connection ?? telemetry.connection ?? 'offline';
      const isOnline = nextConnection === 'connected';

      const nextDevice: HomeDevice = {
        id,
        name,
        room,
        status: isOnline ? 'Online' : 'Offline',
        aqi: isOnline ? (telemetry.esp32?.aqi ?? telemetry.aqi ?? null) : null,
        icon: 'air-filter',
      };
      dispatch(addDeviceAction(nextDevice));
      setNewDeviceName('');
      setNewDeviceRoom('');
      setNewDeviceId('');
      setActiveSheet(null);
    } catch (error) {
      setAddDeviceError(error instanceof Error ? error.message : 'Unable to connect to this device.');
    } finally {
      setIsAddingDevice(false);
    }
  }, [devices, newDeviceId, newDeviceName, newDeviceRoom, dispatch]);

  const beginEditingDevice = useCallback((item: HomeDevice) => {
    setEditingDeviceId(item.id);
    setEditingDeviceName(item.name);
    setEditingDeviceRoom(item.room);
    setEditDeviceError('');
    setActiveSheet('edit-device');
  }, []);

  const saveEditedDevice = useCallback(() => {
    const name = editingDeviceName.trim();
    const room = editingDeviceRoom.trim();
    if (!editingDeviceId) {
      setActiveSheet(null);
      return;
    }
    if (!name || !room) {
      setEditDeviceError('Device name and room are required.');
      return;
    }
    const device = devices.find(d => d.id === editingDeviceId);
    if (device) {
      dispatch(updateDevice({ ...device, name, room }));
    }
    setEditingDeviceId(null);
    setActiveSheet(null);
  }, [editingDeviceId, editingDeviceName, editingDeviceRoom, devices, dispatch]);

  const removeEditedDevice = useCallback(() => {
    if (editingDeviceId) {
      dispatch(removeDevice(editingDeviceId));
    }
    setEditingDeviceId(null);
    setActiveSheet(null);
  }, [editingDeviceId, dispatch]);

  const renderProfilePage = () => (
    <View style={styles.fullPageContainer}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => { if (modalsOnly) { dispatch(setActiveSheet(null)); } else { setActiveSheet(null); } }} style={styles.pageBackButton}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={dashboardTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.pageHeaderPlaceholder} />
      </View>

      <ScrollView style={styles.pageContent} contentContainerStyle={styles.pageContentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageIntroSection}>
          <Text style={styles.pageSectionTitle}>Personal Info</Text>
          <Text style={styles.pageSectionSubtitle}>Update your photo and personal details here.</Text>
        </View>

        <TouchableOpacity style={styles.profileIdentityFull} activeOpacity={0.8} onPress={pickProfileImage}>
          <View style={styles.premiumAvatarContainerLarge}>
            <View style={styles.avatarGlowLarge} />
            <View style={styles.profileAvatarLarge}>
              {editAvatarUri ? (
                <Image source={{ uri: editAvatarUri }} style={styles.profileAvatarPhotoLarge} />
              ) : (
                <Text style={styles.profileAvatarTextLarge}>{getInitials(editProfileName)}</Text>
              )}
            </View>
            <View style={styles.cameraBadgeLarge}>
              <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.profileNameFull}>{editProfileName || 'Add your name'}</Text>
          <Text style={styles.profileActionLinkFull}>Change profile photo</Text>
        </TouchableOpacity>

        <View style={styles.formSectionCardRefined}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabelRefined}>DISPLAY NAME</Text>
            <View style={styles.inputWithIconRefined}>
              <MaterialCommunityIcons name="account-outline" size={20} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
              <TextInput value={editProfileName} onChangeText={v => { setEditProfileName(v); setProfileNameError(''); }} style={styles.textInputWithIcon} placeholder="Your name" placeholderTextColor={dashboardTheme.colors.textMuted} />
            </View>
            {!!profileNameError && <Text style={styles.inputError}>{profileNameError}</Text>}

            <View style={styles.inputSpacer} />

            <Text style={styles.inputLabelRefined}>EMAIL ADDRESS</Text>
            <View style={styles.inputWithIconRefined}>
              <MaterialCommunityIcons name="email-outline" size={20} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
              <TextInput value={editProfileEmail} onChangeText={v => { setEditProfileEmail(v); setProfileEmailError(''); }} style={styles.textInputWithIcon} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={dashboardTheme.colors.textMuted} />
            </View>
            {!!profileEmailError && <Text style={styles.inputError}>{profileEmailError}</Text>}

            <View style={styles.inputSpacer} />

            <Text style={styles.inputLabelRefined}>PHONE</Text>
            <View style={styles.inputWithIconRefined}>
              <MaterialCommunityIcons name="phone-outline" size={18} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
              <TextInput value={editProfilePhone} onChangeText={setEditProfilePhone} style={styles.textInputWithIcon} keyboardType="phone-pad" placeholder="+91..." placeholderTextColor={dashboardTheme.colors.textMuted} />
            </View>

            <View style={styles.inputSpacer} />

            <Text style={styles.inputLabelRefined}>LOCATION</Text>
            <View style={styles.inputWithIconRefined}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
              <TextInput value={editProfileLocation} onChangeText={setEditProfileLocation} style={styles.textInputWithIcon} placeholder="City, IN" placeholderTextColor={dashboardTheme.colors.textMuted} />
            </View>
          </View>
        </View>

        {saveSuccess && (
          <View style={styles.successMessage}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
            <Text style={styles.successMessageText}>Profile saved successfully!</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.primarySheetButtonRefined, isSavingProfile && styles.primarySheetButtonDisabled]} disabled={isSavingProfile} onPress={saveProfileHandler}>
          <Text style={styles.primarySheetButtonText}>{isSavingProfile ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostSheetButton} onPress={clearProfileData}>
          <MaterialCommunityIcons name="restore" size={18} color={dashboardTheme.colors.textMuted} />
          <Text style={styles.ghostSheetButtonText}>Reset to Default</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpaceLarge} />
      </ScrollView>
    </View>
  );

  const renderSettingsPage = (id: SheetId) => {
    if (id === 'profile') return renderProfilePage();
    return (
      <View style={styles.fullPageContainer}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => {
            if (id === 'settings-main' || !modalsOnly) {
              if (modalsOnly) { dispatch(setActiveSheet(null)); } else { setActiveSheet(null); }
            } else {
              dispatch(setActiveSheet('settings-main'));
            }
          }} style={styles.pageBackButton}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={dashboardTheme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{
            id === 'settings-main' ? 'Settings' :
            id === 'account' ? 'Account' :
            id === 'notification-settings' ? 'Notifications' :
            id === 'preferences' ? 'Preferences' :
            id === 'support' ? 'Support' :
            id === 'devices' ? 'Devices' :
            id === 'add-device' ? 'Add Device' :
            id === 'edit-device' ? 'Edit Device' :
            id === 'legal' ? 'Legal' :
            id === 'about' ? 'About' : 'Settings'
          }</Text>
          <View style={styles.pageHeaderPlaceholder} />
        </View>

        <ScrollView style={styles.pageContent} contentContainerStyle={styles.pageContentScroll} showsVerticalScrollIndicator={false}>
          {id === 'settings-main' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Settings</Text>
                <Text style={styles.pageSectionSubtitle}>Manage your account and AirBuddi home.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsCategoryRow icon="account-circle-outline" title="Account" subtitle="Profile and linked accounts" onPress={() => dispatch(setActiveSheet('account'))} />
                <SettingsCategoryRow icon="air-filter" title="Devices" subtitle="Manage your AirBuddi devices" onPress={() => dispatch(setActiveSheet('devices'))} />
                <SettingsCategoryRow icon="bell-outline" title="Notifications" subtitle="Alerts and notification preferences" onPress={() => dispatch(setActiveSheet('notification-settings'))} />
                <SettingsCategoryRow icon="tune-variant" title="Preferences" subtitle="Appearance, units, and privacy" onPress={() => dispatch(setActiveSheet('preferences'))} />
                <SettingsCategoryRow icon="help-circle-outline" title="Support" subtitle="Help, contact, and app information" onPress={() => dispatch(setActiveSheet('support'))} />
                <SettingsCategoryRow icon="leaf-circle-outline" title="Explore Products" subtitle="Explore other products" onPress={onExplorePress} />
                <SettingsCategoryRow icon="logout" title="Sign Out" subtitle="Sign out of your account" onPress={handleSignOut} last />
              </View>
            </>
          )}

          {id === 'account' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Account</Text>
                <Text style={styles.pageSectionSubtitle}>Manage your personal details and sign-in connections.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="account-circle-outline" title="Profile" subtitle={profile.name || 'Add your name'} onPress={() => dispatch(setActiveSheet('profile'))} />
                <SettingsRow icon="link-variant" title="Linked Accounts" subtitle="Google, Apple" onPress={() => dispatch(setActiveSheet('linked-accounts'))} last />
              </View>
            </>
          )}

          {id === 'devices' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Devices</Text>
                <Text style={styles.pageSectionSubtitle}>Manage the AirBuddi devices connected to your home.</Text>
              </View>
              <View style={styles.settingsCard}>
                {devices.map((device, idx) => (
                  <SettingsRow
                    key={device.id}
                    icon="air-filter"
                    title={device.room}
                    subtitle={device.name}
                    onPress={() => beginEditingDevice(device)}
                    last={idx === devices.length - 1}
                  />
                ))}
                <SettingsRow icon="plus-circle-outline" title="Add New Device" subtitle="Pair a new AirBuddi" onPress={() => setActiveSheet('add-device')} last={devices.length === 0} />
              </View>
            </>
          )}

          {id === 'notification-settings' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Notifications</Text>
                <Text style={styles.pageSectionSubtitle}>Manage alerts and notification preferences.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="bell-outline" title="Notification Preferences" subtitle="Choose which alerts you receive" onPress={() => dispatch(setActiveSheet('notifications'))} />
                <SettingsRow icon="alert-circle-outline" title="Alert Thresholds" subtitle="Set AQI warning levels" onPress={() => dispatch(setActiveSheet('alert-thresholds'))} last />
              </View>
              <Text style={styles.settingsSectionLabel}>UPDATES</Text>
              <View style={styles.settingsCard}>
                <ToggleRow label="App Updates" sub="Notify about new app versions" value={notifications.appUpdates} onChange={v => dispatch(setNotifications({ appUpdates: v }))} />
                <ToggleRow label="Device Updates" sub="Notify about device software updates" value={notifications.deviceUpdates} onChange={v => dispatch(setNotifications({ deviceUpdates: v }))} last />
              </View>
            </>
          )}

          {id === 'preferences' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Preferences</Text>
                <Text style={styles.pageSectionSubtitle}>Personalize your AirBuddi experience.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="palette-outline" title="Appearance" subtitle={`Theme: ${preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1)}`} onPress={() => dispatch(setActiveSheet('appearance'))} />
                <SettingsRow icon="earth" title="Units & Language" subtitle={`${preferences.tempUnit === 'celsius' ? '°C' : '°F'} · ${preferences.language === 'en' ? 'EN' : 'HI'}`} onPress={() => dispatch(setActiveSheet('units'))} />
                <SettingsRow icon="shield-lock-outline" title="Data & Privacy" subtitle="Manage your data" onPress={() => dispatch(setActiveSheet('data-privacy'))} last />
              </View>
            </>
          )}

          {id === 'support' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Support</Text>
                <Text style={styles.pageSectionSubtitle}>Find answers or get in touch with the AirBuddi team.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="help-circle-outline" title="Help & Troubleshooting" subtitle="FAQs and setup guides" onPress={() => dispatch(setActiveSheet('help'))} />
                <SettingsRow icon="headphones" title="Contact Support" subtitle="Email, phone, or chat" onPress={() => dispatch(setActiveSheet('contact-support'))} />
                <SettingsRow icon="information-outline" title="About AirBuddi" subtitle="App version and legal" onPress={() => dispatch(setActiveSheet('about'))} last />
              </View>
            </>
          )}

          {id === 'notifications' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Alerts</Text>
                <Text style={styles.pageSectionSubtitle}>Choose which alerts you'd like to receive.</Text>
              </View>
              <ToggleRow label="Push Notifications" sub="Enable all notifications" value={notifications.push} onChange={v => dispatch(setNotifications({ push: v }))} />
              <ToggleRow label="AQI Alerts" sub="Warn when air quality drops" value={notifications.aqiAlerts} onChange={v => dispatch(setNotifications({ aqiAlerts: v }))} />
              <ToggleRow label="Device Offline" sub="Alert when device goes offline" value={notifications.deviceOffline} onChange={v => dispatch(setNotifications({ deviceOffline: v }))} />
              <ToggleRow label="Filter Replacement" sub="Remind when filter needs replacing" value={notifications.filterReminder} onChange={v => dispatch(setNotifications({ filterReminder: v }))} last />
            </>
          )}

          {id === 'alert-thresholds' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Thresholds</Text>
                <Text style={styles.pageSectionSubtitle}>Set the AQI levels at which you want to be alerted.</Text>
              </View>
              <Text style={styles.inputLabel}>WARNING LEVEL (AQI)</Text>
              <TextInput value={preferences.aqiWarningThreshold} onChangeText={v => dispatch(setPreferences({ aqiWarningThreshold: v }))} style={styles.textInput} keyboardType="numeric" />
              <Text style={styles.inputLabel}>DANGER LEVEL (AQI)</Text>
              <TextInput value={preferences.aqiDangerThreshold} onChangeText={v => dispatch(setPreferences({ aqiDangerThreshold: v }))} style={styles.textInput} keyboardType="numeric" />
            </>
          )}

          {id === 'appearance' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Theme</Text>
                <Text style={styles.pageSectionSubtitle}>Customize how AirBuddi looks.</Text>
              </View>
              <Text style={styles.inputLabel}>THEME</Text>
              <View style={styles.optionRow}>
                {(['light', 'dark', 'system'] as const).map(opt => (
                  <TouchableOpacity key={opt} style={[styles.optionChip, preferences.theme === opt && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ theme: opt }))}>
                    <Text style={[styles.optionChipText, preferences.theme === opt && styles.optionChipTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {id === 'units' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Units</Text>
                <Text style={styles.pageSectionSubtitle}>Choose your preferred measurement units and language.</Text>
              </View>

              <Text style={styles.inputLabel}>LANGUAGE</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, preferences.language === 'en' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ language: 'en' }))}>
                  <Text style={[styles.optionChipText, preferences.language === 'en' && styles.optionChipTextActive]}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, preferences.language === 'hi' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ language: 'hi' }))}>
                  <Text style={[styles.optionChipText, preferences.language === 'hi' && styles.optionChipTextActive]}>हिन्दी (Hindi)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>TEMPERATURE</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, preferences.tempUnit === 'celsius' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ tempUnit: 'celsius' }))}><Text style={[styles.optionChipText, preferences.tempUnit === 'celsius' && styles.optionChipTextActive]}>°C Celsius</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, preferences.tempUnit === 'fahrenheit' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ tempUnit: 'fahrenheit' }))}><Text style={[styles.optionChipText, preferences.tempUnit === 'fahrenheit' && styles.optionChipTextActive]}>°F Fahrenheit</Text></TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>AQI STANDARD</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, preferences.aqiStandard === 'us' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ aqiStandard: 'us' }))}><Text style={[styles.optionChipText, preferences.aqiStandard === 'us' && styles.optionChipTextActive]}>US EPA</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, preferences.aqiStandard === 'india' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ aqiStandard: 'india' }))}><Text style={[styles.optionChipText, preferences.aqiStandard === 'india' && styles.optionChipTextActive]}>India NAQI</Text></TouchableOpacity>
              </View>
            </>
          )}

          {id === 'legal' && <LegalScreen onClose={() => { if (modalsOnly) { dispatch(setActiveSheet(null)); } else { setActiveSheet(null); } }} />}

          {id === 'linked-accounts' && <>
            <View style={styles.pageIntroSection}>
              <Text style={styles.pageSectionTitle}>Linked Accounts</Text>
              <Text style={styles.pageSectionSubtitle}>Connect third-party accounts for faster sign-in.</Text>
            </View>
            <View style={styles.contactOption}>
              <View style={styles.contactIconWrap}><MaterialCommunityIcons name="google" size={22} color={dashboardTheme.colors.primaryDark} /></View>
              <View style={styles.contactInfo}><Text style={styles.contactLabel}>Google</Text><Text style={styles.contactSub}>Coming soon</Text></View>
            </View>
            <View style={[styles.contactOption, styles.contactOptionLast]}>
              <View style={styles.contactIconWrap}><MaterialCommunityIcons name="apple" size={22} color={dashboardTheme.colors.primaryDark} /></View>
              <View style={styles.contactInfo}><Text style={styles.contactLabel}>Apple</Text><Text style={styles.contactSub}>Coming soon</Text></View>
            </View>
          </>}

          {id === 'data-privacy' && <>
            <View style={styles.pageIntroSection}>
              <Text style={styles.pageSectionTitle}>Data & Privacy</Text>
              <Text style={styles.pageSectionSubtitle}>Manage your personal information.</Text>
            </View>
            <Text style={[styles.aboutCopy, { marginBottom: 20 }]}>Your data stays on your device. AirBuddi connects to your purifier locally and doesn't share personal information with third parties.</Text>
            <TouchableOpacity style={styles.primarySheetButtonRefined} onPress={async () => {
              try {
                await AsyncStorage.multiRemove(['@airbuddi_devices', '@airbuddi_notifications', '@airbuddi_preferences', '@airbuddi_profile']);
                dispatch(resetSettings());
                Alert.alert('Cache Cleared', 'Local app cache has been cleared successfully.');
              } catch (e) {
                console.error('[AirBuddi] Failed to clear cache:', e);
              }
            }}><Text style={styles.primarySheetButtonText}>Clear App Cache</Text></TouchableOpacity>
            <TouchableOpacity style={styles.ghostSheetButton} onPress={() => Alert.alert('Delete Account', 'This feature is not available in demo mode.', [{ text: 'OK' }])}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
              <Text style={[styles.ghostSheetButtonText, { color: '#DC2626' }]}>Delete Account</Text>
            </TouchableOpacity>
          </>}

          {id === 'help' && <>
            <View style={styles.pageIntroSection}>
              <Text style={styles.pageSectionTitle}>Help Center</Text>
              <Text style={styles.pageSectionSubtitle}>Find answers to common questions.</Text>
            </View>
            {[
              { q: 'How do I add a device?', a: 'Go to the Home tab and tap "Add a device." Enter your AirBuddi\'s MAC address found on the device label.' },
              { q: 'My device shows as offline', a: 'Make sure your AirBuddi is powered on and connected to Wi-Fi. Try pulling down to refresh the device list.' },
              { q: 'How do I reset my device?', a: 'Press and hold the reset button on the back of your AirBuddi for 10 seconds until the LED flashes rapidly.' },
              { q: 'Can I control multiple devices?', a: 'Yes! Add multiple devices from the Home tab. Tap any device card to select and control it.' },
              { q: 'How accurate are the sensors?', a: 'AirBuddi uses industrial-grade PM2.5, temperature, and humidity sensors with ±5% accuracy.' },
            ].map((faq, index, arr) => (
              <TouchableOpacity key={index} style={[styles.faqItem, index === arr.length - 1 && styles.faqItemLast]} activeOpacity={0.7} onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                <View style={styles.faqQuestion}>
                  <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  <MaterialCommunityIcons name={expandedFaq === index ? 'chevron-up' : 'chevron-down'} size={22} color={dashboardTheme.colors.textMuted} />
                </View>
                {expandedFaq === index && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            ))}
          </>}

          {id === 'contact-support' && <>
            <View style={styles.pageIntroSection}>
              <Text style={styles.pageSectionTitle}>Contact Us</Text>
              <Text style={styles.pageSectionSubtitle}>We're here to help. Reach us through any channel.</Text>
            </View>
            <TouchableOpacity style={styles.contactOption} activeOpacity={0.7} onPress={() => Linking.openURL('mailto:support@greenverse.in')}>
              <View style={styles.contactIconWrap}><MaterialCommunityIcons name="email-outline" size={22} color={dashboardTheme.colors.primaryDark} /></View>
              <View style={styles.contactInfo}><Text style={styles.contactLabel}>Email</Text><Text style={styles.contactSub}>support@greenverse.in</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactOption} activeOpacity={0.7} onPress={() => Linking.openURL('tel:+911234567890')}>
              <View style={styles.contactIconWrap}><MaterialCommunityIcons name="phone-outline" size={22} color={dashboardTheme.colors.primaryDark} /></View>
              <View style={styles.contactInfo}><Text style={styles.contactLabel}>Phone</Text><Text style={styles.contactSub}>+91 12345 67890</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactOption, styles.contactOptionLast]} activeOpacity={0.7} onPress={() => Alert.alert('Live Chat', 'Live chat is not available in demo mode.')}>
              <View style={styles.contactIconWrap}><MaterialCommunityIcons name="chat-outline" size={22} color={dashboardTheme.colors.primaryDark} /></View>
              <View style={styles.contactInfo}><Text style={styles.contactLabel}>Live Chat</Text><Text style={styles.contactSub}>Available 9 AM – 6 PM IST</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
          </>}

          {id === 'about' && <>
            <View style={styles.aboutHero}>
              <View style={styles.aboutIcon}><MaterialCommunityIcons name="leaf" size={34} color="#FFFFFF" /></View>
              <Text style={styles.pageSectionTitle}>About AirBuddi</Text>
            </View>
            <Text style={styles.aboutCopy}>AirBuddi helps you understand and improve the air in every room you call home. Monitor your devices, manage comfort settings, and stay connected to healthier spaces.</Text>
            <Text style={styles.aboutVersion}>AirBuddi app · Version 1.0</Text>
          </>}

          {id === 'add-device' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Pair Device</Text>
                <Text style={styles.pageSectionSubtitle}>Choose how you want to pair your AirBuddi.</Text>
              </View>
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity style={[styles.modeToggleButton, addDeviceMode === 'qr' && styles.modeToggleButtonActive]} onPress={() => setAddDeviceMode('qr')}>
                  <MaterialCommunityIcons name="qrcode-scan" size={18} color={addDeviceMode === 'qr' ? '#FFFFFF' : dashboardTheme.colors.textSecondary} />
                  <Text style={[styles.modeToggleText, addDeviceMode === 'qr' && styles.modeToggleTextActive]}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeToggleButton, addDeviceMode === 'manual' && styles.modeToggleButtonActive]} onPress={() => setAddDeviceMode('manual')}>
                  <MaterialCommunityIcons name="keyboard-outline" size={18} color={addDeviceMode === 'manual' ? '#FFFFFF' : dashboardTheme.colors.textSecondary} />
                  <Text style={[styles.modeToggleText, addDeviceMode === 'manual' && styles.modeToggleTextActive]}>Manual</Text>
                </TouchableOpacity>
              </View>

              {addDeviceMode === 'qr' ? (
                <View style={styles.qrContainer}>
                  <TouchableOpacity style={styles.qrScanBtn} onPress={handleScanQr}>
                    <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.qrScanBtnText}>Open Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.qrScanSecondaryBtn} onPress={handlePickQrFromLibrary}>
                    <Text style={styles.qrScanSecondaryBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput value={newDeviceId} onChangeText={setNewDeviceId} style={styles.textInput} placeholder="MAC Address" />
              )}

              <TextInput value={newDeviceName} onChangeText={setNewDeviceName} style={[styles.textInput, { marginTop: 12 }]} placeholder="Device Name" />
              <TextInput value={newDeviceRoom} onChangeText={setNewDeviceRoom} style={[styles.textInput, { marginTop: 12 }]} placeholder="Room" />

              {!!addDeviceError && <Text style={styles.inputError}>{addDeviceError}</Text>}
              <TouchableOpacity style={[styles.primarySheetButtonRefined, (isAddingDevice || !newDeviceId) && styles.primarySheetButtonDisabled]} disabled={isAddingDevice || !newDeviceId} onPress={addDeviceHandler}>
                <Text style={styles.primarySheetButtonText}>{isAddingDevice ? 'Connecting…' : 'Add device'}</Text>
              </TouchableOpacity>
            </>
          )}

          {id === 'edit-device' && (
            <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Edit Device</Text>
                <Text style={styles.pageSectionSubtitle}>Update your device details.</Text>
              </View>
              <Text style={styles.inputLabel}>DEVICE MAC ADDRESS</Text>
              <View style={styles.readOnlyDeviceId}>
                <MaterialCommunityIcons name="bluetooth-connect" size={18} color={dashboardTheme.colors.textSecondary} />
                <Text style={styles.readOnlyDeviceIdText}>{editingDeviceId}</Text>
              </View>
              <TextInput value={editingDeviceName} onChangeText={setEditingDeviceName} style={styles.textInput} placeholder="Device Name" />
              <TextInput value={editingDeviceRoom} onChangeText={setEditingDeviceRoom} style={[styles.textInput, { marginTop: 12 }]} placeholder="Room" />
              <TouchableOpacity style={styles.primarySheetButtonRefined} onPress={saveEditedDevice}><Text style={styles.primarySheetButtonText}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ghostSheetButton} onPress={removeEditedDevice}><Text style={[styles.ghostSheetButtonText, { color: '#DC2626' }]}>Remove Device</Text></TouchableOpacity>
            </>
          )}
          <View style={styles.bottomSpaceLarge} />
        </ScrollView>
      </View>
    );
  };

  if (modalsOnly) {
    return (
      <Modal animationType="slide" visible={activeSheet !== null && activeSheet !== 'menu'} onRequestClose={() => dispatch(setActiveSheet(null))}>
        {renderSettingsPage(activeSheet)}
      </Modal>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabPad}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text style={styles.sectionSubtitle}>
          Manage your account and AirBuddi home.
        </Text>

        <Text style={styles.settingsSectionLabel}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          <SettingsCategoryRow icon="account-circle-outline" title="Account" subtitle="Profile and linked accounts" onPress={() => setActiveSheet('account')} />
          <SettingsCategoryRow icon="air-filter" title="Devices" subtitle="Manage your AirBuddi devices" onPress={() => setActiveSheet('devices')} />
          <SettingsCategoryRow icon="bell-outline" title="Notifications" subtitle="Alerts and notification preferences" onPress={() => setActiveSheet('notification-settings')} />
          <SettingsCategoryRow icon="tune-variant" title="Preferences" subtitle="Appearance, units, and privacy" onPress={() => setActiveSheet('preferences')} />
          <SettingsCategoryRow icon="help-circle-outline" title="Support" subtitle="Help, contact, and app information" onPress={() => setActiveSheet('support')} />
          <SettingsCategoryRow icon="gavel" title="Legal" subtitle="Privacy Policy and Terms of Service" onPress={() => setActiveSheet('legal')} />
          <SettingsCategoryRow icon="leaf-circle-outline" title="Explore Products" subtitle="Explore other products" onPress={onExplorePress} />
          <SettingsCategoryRow icon="logout" title="Sign Out" subtitle="Sign out of your account" onPress={handleSignOut} last />
        </View>
      </View>

      <Modal animationType="slide" visible={activeSheet !== null && activeSheet !== 'menu'} onRequestClose={() => setActiveSheet(null)}>
        {renderSettingsPage(activeSheet)}
      </Modal>
    </View>
  );
}

function SettingsRow({ icon, title, subtitle, onPress, last = false }: any) {
  return (
    <TouchableOpacity style={[styles.settingsRow, last && styles.settingsRowLast]} onPress={onPress}>
      <View style={styles.settingsIcon}><MaterialCommunityIcons name={icon} size={20} color={dashboardTheme.colors.primaryDark} /></View>
      <View style={styles.settingsCopy}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.settingsSubtitle}>{subtitle}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function SettingsCategoryRow({ icon, title, subtitle, onPress, last = false }: any) {
  return (
    <TouchableOpacity style={[styles.settingsCategoryRow, last && styles.settingsRowLast]} onPress={onPress}>
      <View style={styles.settingsCategoryIcon}><MaterialCommunityIcons name={icon} size={22} color={dashboardTheme.colors.primaryDark} /></View>
      <View style={styles.settingsCopy}><Text style={styles.settingsCategoryTitle}>{title}</Text><Text style={styles.settingsSubtitle}>{subtitle}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={dashboardTheme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function ToggleRow({ label, sub, value, onChange, last }: any) {
  return (
    <View style={[styles.settingsToggleRow, last && styles.settingsToggleRowLast]}>
      <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>{label}</Text><Text style={styles.settingsToggleSublabel}>{sub}</Text></View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={value ? '#22C55E' : '#F4F4F4'} />
    </View>
  );
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}

const styles = StyleSheet.create({
  tabContent: { width: '100%' },
  tabPad: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: dashboardTheme.colors.textPrimary, letterSpacing: -0.5 },
  sectionSubtitle: { marginTop: 5, fontSize: 14, color: dashboardTheme.colors.textSecondary, fontWeight: '500' },
  settingsSectionLabel: { marginTop: 14, marginBottom: 8, paddingHorizontal: 4, color: dashboardTheme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  settingsCard: { borderRadius: 18, backgroundColor: dashboardTheme.colors.surface, borderWidth: 1, borderColor: dashboardTheme.colors.border, overflow: 'hidden', ...dashboardTheme.shadows.soft },
  settingsCategoryRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  settingsCategoryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: dashboardTheme.colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  settingsCategoryTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  settingsSubtitle: { color: dashboardTheme.colors.textMuted, fontSize: 13, marginTop: 3, fontWeight: '500' },
  profileBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13, 40, 24, 0.55)' },
  profileSheet: { backgroundColor: dashboardTheme.colors.surface, borderTopLeftRadius: dashboardTheme.radii.xl, borderTopRightRadius: dashboardTheme.radii.xl, padding: 20, paddingBottom: 44 },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: dashboardTheme.colors.border, marginBottom: 22 },
  sheetTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 23, fontWeight: '800' },
  sheetIntro: { marginTop: 7, marginBottom: 22, color: dashboardTheme.colors.textSecondary, fontSize: 14 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: dashboardTheme.colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  settingsCopy: { flex: 1 },
  settingsTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 15, fontWeight: '800' },
  secondarySheetButton: { marginTop: 24, height: 48, borderRadius: 14, backgroundColor: dashboardTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  secondarySheetButtonText: { color: dashboardTheme.colors.primaryDark, fontWeight: '800', fontSize: 15 },
  profileIdentity: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 28 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primarySoft, overflow: 'hidden' },
  profileAvatarPhoto: { width: 52, height: 52, borderRadius: 26 },
  profileAvatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  profileName: { color: dashboardTheme.colors.textPrimary, fontSize: 17, fontWeight: '800' },
  profileEmail: { color: dashboardTheme.colors.textMuted, fontSize: 13, marginTop: 2 },
  inputLabel: { color: dashboardTheme.colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 7, marginTop: 14 },
  textInput: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 13, color: dashboardTheme.colors.textPrimary, fontSize: 15 },
  readOnlyDeviceId: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  readOnlyDeviceIdText: { color: dashboardTheme.colors.textSecondary, fontSize: 15, fontWeight: '600', letterSpacing: 0.4 },
  inputError: { marginTop: 8, color: '#DC2626', fontSize: 13, fontWeight: '500' },
  primarySheetButton: { marginTop: 24, height: 50, borderRadius: 14, backgroundColor: dashboardTheme.colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  primarySheetButtonDisabled: { opacity: 0.6 },
  primarySheetButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  settingsToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  settingsToggleRowLast: { borderBottomWidth: 0 },
  toggleTextWrap: { flex: 1, marginRight: 12 },
  settingsToggleLabel: { color: dashboardTheme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
  settingsToggleSublabel: { color: dashboardTheme.colors.textMuted, fontSize: 12 },
  optionRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  optionChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surface },
  optionChipActive: { borderColor: dashboardTheme.colors.primary, backgroundColor: dashboardTheme.colors.primarySoft },
  optionChipText: { fontSize: 14, fontWeight: '600', color: dashboardTheme.colors.textSecondary },
  optionChipTextActive: { color: dashboardTheme.colors.primaryDark, fontWeight: '700' },
  modeToggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 16, gap: 4 },
  modeToggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
  modeToggleButtonActive: { backgroundColor: dashboardTheme.colors.primary },
  modeToggleText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.colors.textSecondary },
  modeToggleTextActive: { color: '#FFFFFF' },
  qrContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#F8FAFC', borderRadius: 18, marginBottom: 16, gap: 12 },
  qrScanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: dashboardTheme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  qrScanBtnText: { color: '#FFFFFF', fontWeight: '700' },
  qrScanSecondaryBtn: { paddingVertical: 8 },
  qrScanSecondaryBtnText: { color: dashboardTheme.colors.primaryDark, fontWeight: '600' },
  qrScannerScreen: { flex: 1, backgroundColor: '#000' },
  qrScannerCloseButton: { position: 'absolute', bottom: 48, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)' },
  qrScannerCloseText: { color: '#FFFFFF', fontWeight: '700' },
  dangerSheetButton: { marginTop: 12, height: 50, borderRadius: 14, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dangerSheetButtonText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },
  premiumAvatarContainer: { position: 'relative', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: dashboardTheme.colors.primarySoft, opacity: 0.3 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: dashboardTheme.colors.primary, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  successMessage: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', padding: 10, borderRadius: 10, marginTop: 12 },
  successMessageText: { color: '#15803D', fontSize: 13, fontWeight: '600' },
  fullPageContainer: { flex: 1, backgroundColor: dashboardTheme.colors.background },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16, backgroundColor: dashboardTheme.colors.surface, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  pageBackButton: { padding: 8, marginLeft: -8 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: dashboardTheme.colors.textPrimary },
  pageHeaderPlaceholder: { width: 42 },
  pageContent: { flex: 1 },
  pageContentScroll: { padding: 20 },
  pageIntroSection: { marginBottom: 24 },
  pageSectionTitle: { fontSize: 24, fontWeight: '800', color: dashboardTheme.colors.textPrimary, letterSpacing: -0.5 },
  pageSectionSubtitle: { fontSize: 14, color: dashboardTheme.colors.textSecondary, marginTop: 4, fontWeight: '500' },
  profileIdentityFull: { alignItems: 'center', marginBottom: 32 },
  premiumAvatarContainerLarge: { position: 'relative', width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  avatarGlowLarge: { position: 'absolute', width: 116, height: 116, borderRadius: 58, backgroundColor: dashboardTheme.colors.primarySoft, opacity: 0.25 },
  profileAvatarLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primarySoft, overflow: 'hidden', borderWidth: 3, borderColor: '#FFFFFF' },
  profileAvatarPhotoLarge: { width: 100, height: 100, borderRadius: 50 },
  profileAvatarTextLarge: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  cameraBadgeLarge: { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: dashboardTheme.colors.primary, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...dashboardTheme.shadows.soft },
  profileNameFull: { fontSize: 22, fontWeight: '800', color: dashboardTheme.colors.textPrimary, marginTop: 16 },
  profileActionLinkFull: { fontSize: 14, fontWeight: '700', color: dashboardTheme.colors.primary, marginTop: 6 },
  formSectionCardRefined: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', ...dashboardTheme.shadows.soft },
  bottomSpaceLarge: { height: 60 },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 12, marginTop: 4 },
  inputIcon: { marginRight: 10 },
  textInputWithIcon: { flex: 1, color: dashboardTheme.colors.textPrimary, fontSize: 15, padding: 0 },
  inputRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  inputHalf: { flex: 1 },
  sheetHeaderWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  profileIdentityRefined: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, padding: 4 },
  sectionLabelRefined: { fontSize: 11, fontWeight: '800', color: dashboardTheme.colors.textMuted, letterSpacing: 1.2, marginBottom: 16 },
  inputGroup: { gap: 0 },
  inputLabelRefined: { fontSize: 10, fontWeight: '700', color: dashboardTheme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  inputWithIconRefined: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  inputSpacer: { height: 16 },
  primarySheetButtonRefined: { marginTop: 8, height: 54, borderRadius: 16, backgroundColor: dashboardTheme.colors.primaryDark, alignItems: 'center', justifyContent: 'center', shadowColor: dashboardTheme.colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  ghostSheetButton: { marginTop: 16, height: 50, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  ghostSheetButtonText: { color: dashboardTheme.colors.textMuted, fontWeight: '700', fontSize: 14 },
  sheetScroll: { maxHeight: 500 },
  bottomSheetGap: { height: 20 },
  aboutHero: { alignItems: 'center', marginBottom: 24 },
  aboutIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primaryDark, marginBottom: 16 },
  aboutCopy: { fontSize: 14, color: dashboardTheme.colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  aboutVersion: { fontSize: 12, color: dashboardTheme.colors.textMuted, textAlign: 'center', fontWeight: '600' },
  contactOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  contactOptionLast: { marginBottom: 0 },
  contactIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: dashboardTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 15, fontWeight: '700', color: dashboardTheme.colors.textPrimary },
  contactSub: { fontSize: 12, color: dashboardTheme.colors.textMuted, marginTop: 2 },
  faqItem: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  faqItemLast: { marginBottom: 0 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestionText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.colors.textPrimary, flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 14, color: dashboardTheme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
});
