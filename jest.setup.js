/* global jest */

import 'react-native-gesture-handler/jestSetup';

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
	const Animated = {
		createAnimatedComponent: Component => Component,
	};

	return {
		__esModule: true,
		default: Animated,
		useSharedValue: initialValue => ({value: initialValue}),
		withTiming: value => value,
		useAnimatedProps: updater => updater(),
		createAnimatedComponent: Animated.createAnimatedComponent,
	};
});