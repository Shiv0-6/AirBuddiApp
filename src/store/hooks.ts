import { useSyncExternalStore } from 'react';

import { store, type AppDispatch, type RootState } from './store';

export const useAppDispatch = () => store.dispatch as AppDispatch;

export function useAppSelector<TSelected>(selector: (state: RootState) => TSelected) {
	return useSyncExternalStore(
		store.subscribe,
		() => selector(store.getState()),
		() => selector(store.getState()),
	);
}