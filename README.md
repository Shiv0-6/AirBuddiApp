6565This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# AirBuddi Live Data Setup

AirBuddi now includes a live AWS IoT Core MQTT layer. The dashboard still renders the same reusable UI, but the data source can switch from mock state to real telemetry without changing the cards.

## Files to review first

- [src/config/awsIotConfig.ts](src/config/awsIotConfig.ts)
- [src/services/awsIot/awsIotClient.ts](src/services/awsIot/awsIotClient.ts)
- [src/features/dashboard/dashboardSlice.ts](src/features/dashboard/dashboardSlice.ts)
- [src/features/dashboard/useDashboardRealtimeBridge.ts](src/features/dashboard/useDashboardRealtimeBridge.ts)
- [src/features/dashboard/DashboardScreen.tsx](src/features/dashboard/DashboardScreen.tsx)

## How the live path works

1. `App.tsx` wraps the app in a Redux provider.
2. `DashboardScreen` reads the dashboard state from Redux.
3. `useDashboardRealtimeBridge` opens an MQTT connection when live mode is enabled.
4. Incoming telemetry updates the Redux slice.
5. Quick control actions publish JSON commands back to AWS IoT Core.

## Enable AWS IoT Core

Open [src/config/awsIotConfig.ts](src/config/awsIotConfig.ts) and set:

- `enabled: true`
- `endpoint` to your AWS IoT ATS endpoint
- `region` to the AWS region where IoT Core lives
- `clientId` to a stable device-specific value
- `credentialsProvider` to return temporary AWS credentials

### Example config shape

```ts
export const awsIotConfig = {
	enabled: true,
	endpoint: 'your-endpoint-ats.iot.us-east-1.amazonaws.com',
	region: 'us-east-1',
	clientId: 'airbuddi-pure-x',
	deviceId: 'airbuddi-pure-x',
	topics: {
		telemetry: 'airbuddi/airbuddi-pure-x/telemetry',
		status: 'airbuddi/airbuddi-pure-x/status',
		command: 'airbuddi/airbuddi-pure-x/command',
		connection: 'airbuddi/airbuddi-pure-x/connection',
	},
	credentialsProvider: async () => ({
		accessKeyId: 'TEMP_ACCESS_KEY',
		secretAccessKey: 'TEMP_SECRET_KEY',
		sessionToken: 'TEMP_SESSION_TOKEN',
	}),
};
```

## Recommended auth approach

Do not hardcode long-lived AWS keys in the app. Use temporary credentials from one of these flows:

- Cognito Identity Pool
- A secure backend that issues short-lived IAM credentials
- Amplify or a custom auth service that can provide a credentials provider

## MQTT topic contract

The dashboard expects telemetry in JSON form. A good starting payload looks like this:

```json
{
	"aqi": 46,
	"connection": "connected",
	"device": {
		"name": "AirBuddi Pure X",
		"status": "Online",
		"mode": "auto",
		"power": "on",
		"lastUpdated": "2026-07-03T09:30:00Z"
	},
	"filterHealth": 78,
	"remainingLifeDays": 42,
	"sensors": [
		{ "id": "temp", "value": 24.6, "unit": "°C", "status": "good" },
		{ "id": "humidity", "value": 52, "unit": "%", "status": "good" }
	]
}
```

Topic usage in the app:

- `telemetry` publishes full sensor snapshots.
- `status` can carry device online/offline updates.
- `connection` can carry heartbeat or connectivity messages.
- `command` is used by the app to publish power, mode, and fan control commands.

## Quick control commands

The quick controls publish command messages like this:

```json
{ "type": "power", "value": "on", "timestamp": "2026-07-03T09:30:00Z" }
```

## Run after setup

```sh
npm install
npm start
npm run android
```

If AWS IoT Core is configured correctly, the dashboard will move into connected mode and start showing live telemetry updates in real time.
