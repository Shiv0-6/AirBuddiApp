/* global jest */

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('react-native-gesture-handler', () => {
	const React = require('react');
	const { View } = require('react-native');

	return {
		GestureHandlerRootView: ({children, ...props}) => React.createElement(View, props, children),
	};
});
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
	const React = require('react');
	const { Text } = require('react-native');

	return ({name, ...props}) => React.createElement(Text, props, name);
});
jest.mock('react-native-reanimated', () => {
	const React = require('react');
	const { View } = require('react-native');
	const Animated = {
		View: View,
		createAnimatedComponent: Component => Component,
	};

	return {
		__esModule: true,
		default: Animated,
		useSharedValue: initialValue => ({value: initialValue}),
		useAnimatedStyle: styleFactory => styleFactory(),
		withTiming: value => value,
		withRepeat: value => value,
		Easing: { linear: 'linear' },
		useAnimatedProps: updater => updater(),
		createAnimatedComponent: Animated.createAnimatedComponent,
	};
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({ assets: [] })),
  launchCamera: jest.fn(() => Promise.resolve({ assets: [] })),
}));

jest.mock('@react-native-ml-kit/barcode-scanning', () => ({
	scan: jest.fn(() => Promise.resolve([])),
}));

jest.mock('react-native-camera-kit', () => {
	const React = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: props => React.createElement(View, props),
		CameraType: { Back: 'back', Front: 'front' },
	};
});

jest.mock('react-native-webview', () => {
	const React = require('react');
	const { View } = require('react-native');

	return {
		WebView: props => React.createElement(View, props),
	};
});