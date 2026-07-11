import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { QuickControls } from '../src/components/dashboard/QuickControls';

describe('QuickControls UI', () => {
  it('shows modern focus presets for a polished experience', () => {
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <QuickControls
          isPoweredOn={true}
          isAutoMode={true}
          isSleepMode={false}
          isUvc={true}
          fanSpeed="2"
          onTogglePower={() => {}}
          onToggleAutoMode={() => {}}
          onToggleSleepMode={() => {}}
          onToggleUvc={() => {}}
          onSelectFanSpeed={() => {}}
        />,
      );
    });

    const textContent = tree!.root.findAllByType(Text).map(node => node.props.children);
    const flattenedText = textContent.flat().join(' ');

    expect(flattenedText).toContain('Focus presets');
    expect(flattenedText).toContain('Fresh Air');
  });
});
