const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const projectRoot = __dirname;

const config = {
  resolver: {
    blockList: [
      new RegExp(`${escapePath(path.join(projectRoot, 'android', 'app', 'build'))}\\/.*`),
      new RegExp(`${escapePath(path.join(projectRoot, 'android', 'app', '.cxx'))}\\/.*`),
      new RegExp(`${escapePath(path.join(projectRoot, 'android', 'build'))}\\/.*`),
      new RegExp(`${escapePath(path.join(projectRoot, 'android', '.gradle'))}\\/.*`),
      new RegExp(`${escapePath(path.join(projectRoot, 'old_app'))}\\/.*`),
    ],
  },
  watchFolders: [path.join(projectRoot, 'src')],
};

function escapePath(value) {
  return value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
