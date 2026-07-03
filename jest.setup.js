import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-gesture-handler', () => {
	const React = require('react');
	const { View } = require('react-native');

	return {
		GestureHandlerRootView: ({children, ...props}) => React.createElement(View, props, children),
	};
});
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));