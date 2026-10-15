import { setNotifications, settingsReducer } from '../src/features/settings/settingsSlice';

describe('settings notifications', () => {
  it('starts with every notification preference disabled', () => {
    const state = settingsReducer(undefined, { type: '@@INIT', payload: undefined });

    expect(state.notifications).toEqual({
      push: false,
      aqiAlerts: false,
      deviceOffline: false,
      filterReminder: false,
      appUpdates: false,
      deviceUpdates: false,
    });
  });

  it('updates an individual notification preference without changing the others', () => {
    const initialState = settingsReducer(undefined, { type: '@@INIT', payload: undefined });
    const nextState = settingsReducer(initialState, setNotifications({ deviceOffline: true }));

    expect(nextState.notifications.deviceOffline).toBe(true);
    expect(nextState.notifications.push).toBe(false);
    expect(nextState.notifications.appUpdates).toBe(false);
  });
});
