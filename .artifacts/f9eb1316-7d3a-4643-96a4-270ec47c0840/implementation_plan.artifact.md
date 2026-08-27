# Implementation Plan - Fix QR Scan Functionality

The QR scanning functionality in the AirBuddi app is currently reported as "not working properly". Based on code analysis, the primary issues are likely a too-strict validation regex for device IDs and missing runtime camera permission requests on Android.

## Proposed Changes

### [Dashboard Component]

#### [MODIFY] [DashboardScreen.tsx](file:///E:/AirBuddiApp/src/features/dashboard/DashboardScreen.tsx)

- **Improve QR Parsing Logic**:
    - Update the regex in `applyScannedQrValue` to be more flexible. It will now support:
        - Standard MAC addresses (e.g., `AA:BB:CC:DD:EE:FF` or `AA-BB-CC-DD-EE-FF`).
        - Raw hexadecimal MAC addresses (e.g., `AABBCCDDEEFF`).
        - General device IDs that follow the project's naming conventions (e.g., `GPS_GPRS` or `airbuddi-pure-x`).
        - URLs containing a device ID or MAC address as a query parameter or path segment.
- **Implement Runtime Permissions**:
    - Add a check for `CAMERA` permission using `PermissionsAndroid` (for Android) and `Alert` the user if it's denied.
    - Wrap the `handleScanQr` function to ensure permissions are granted before showing the scanner modal.
- **Robustify Event Handling**:
    - Add safety checks to the `onReadCode` and `onError` callbacks of the `<Camera />` component to handle unexpected event structures or empty values.
- **Enhance UI Feedback**:
    - Update error messages to be more descriptive (e.g., distinguishing between "Camera failed to open" and "QR code content not recognized").

## Verification Plan

### Automated Tests
- I will verify the new regex logic by creating a small test script to ensure it matches various valid and invalid formats.
- I will check the TypeScript types to ensure no regressions are introduced.

### Manual Verification
- Since I cannot run the app directly, I will rely on code analysis to ensure the logic follows React Native and `react-native-camera-kit` best practices.
- I will verify that `PermissionsAndroid` is correctly imported and used.
- I will verify that the regex matches the example IDs found in `dashboardMockData.ts` and `ARCHITECTURE.md`.
