import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux/dist/cjs/index.js';

import type { AppDispatch, RootState } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;