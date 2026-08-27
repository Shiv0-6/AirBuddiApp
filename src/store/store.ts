import { configureStore } from '../vendor/reduxToolkit';

import { dashboardReducer } from '../features/dashboard/dashboardSlice';
import { settingsReducer } from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
