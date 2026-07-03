import { configureStore } from '../../../node_modules/@reduxjs/toolkit/dist/cjs/index.js';

import { dashboardReducer } from '../features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
