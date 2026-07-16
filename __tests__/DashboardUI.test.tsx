import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { QuickControls } from '../src/components/dashboard/QuickControls';
import { LightControlPanel } from '../src/components/dashboard/LightControlPanel';

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
    expect(flattenedText).toContain('Auto');
    expect(flattenedText).toContain('Manual');
    expect(flattenedText).toContain('Off');
    expect(flattenedText).toContain('Low');
    expect(flattenedText).toContain('Medium');
    expect(flattenedText).toContain('High');
  });

  it('shows on and off buttons for the light control', () => {
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <LightControlPanel
          isLightOn={false}
          onTurnOn={() => {}}
          onTurnOff={() => {}}
        />,
      );
    });

    const textContent = tree!.root.findAllByType(Text).map(node => node.props.children);
    const flattenedText = textContent.flat().join(' ');

    expect(flattenedText).toContain('Light Control');
    expect(flattenedText).toContain('Light On');
    expect(flattenedText).toContain('Light Off');
  });
});
