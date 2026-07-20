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

  it('shows three professional light zones for command testing', () => {
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <LightControlPanel
          lights={[
            { id: 'zone-1', label: 'Ambient', icon: 'lamp', isOn: false },
            { id: 'zone-2', label: 'Task', icon: 'desk-lamp', isOn: true },
            { id: 'zone-3', label: 'Accent', icon: 'spotlight', isOn: false },
          ]}
          onToggleLight={() => {}}
        />,
      );
    });

    const textContent = tree!.root.findAllByType(Text).map(node => node.props.children);
    const flattenedText = textContent.flat().join(' ');

    expect(flattenedText).toContain('Light Control');
    expect(flattenedText).toContain('Ambient');
    expect(flattenedText).toContain('Task');
    expect(flattenedText).toContain('Accent');
    expect(flattenedText).toContain('Zone 1');
    expect(flattenedText).toContain('Zone 2');
    expect(flattenedText).toContain('Zone 3');
  });
});
