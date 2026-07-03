import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-gesture-handler', () => require('react-native-gesture-handler/jest/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));