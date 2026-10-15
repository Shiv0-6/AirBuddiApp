import { getAqiAlertLevel } from '../src/features/dashboard/dashboardUtils';

describe('AQI alert thresholds', () => {
  it('returns warning and danger levels from configured thresholds', () => {
    expect(getAqiAlertLevel(99, '100', '200')).toBeNull();
    expect(getAqiAlertLevel(100, '100', '200')).toBe('warning');
    expect(getAqiAlertLevel(200, '100', '200')).toBe('danger');
  });

  it('does not create alerts for missing or invalid thresholds', () => {
    expect(getAqiAlertLevel(null, '100', '200')).toBeNull();
    expect(getAqiAlertLevel(250, '200', '100')).toBeNull();
    expect(getAqiAlertLevel(250, '', '200')).toBeNull();
  });
});
