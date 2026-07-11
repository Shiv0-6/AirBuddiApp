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