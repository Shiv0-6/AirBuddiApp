export interface PayloadAction<T = unknown> {
  type: string;
  payload: T;
}

type CaseReducer<State, Action extends PayloadAction = PayloadAction> = (
  state: State,
  action: Action,
) => void | State;

type SliceReducers<State> = Record<string, CaseReducer<State, PayloadAction<any>>>;

type SliceDefinition<State, Reducers extends SliceReducers<State>> = {
  name: string;
  initialState: State;
  reducers: Reducers;
};

type ActionCreators<Reducers extends SliceReducers<any>> = {
  [Key in keyof Reducers]: Reducers[Key] extends CaseReducer<any, PayloadAction<infer Payload>>
    ? (payload: Payload) => PayloadAction<Payload>
    : never;
};

function cloneState<State>(state: State): State {
  if (typeof structuredClone === 'function') {
    return structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state)) as State;
}

export function createSlice<State, Reducers extends SliceReducers<State>>(
  definition: SliceDefinition<State, Reducers>,
) {
  const actionCreators = Object.entries(definition.reducers).reduce(
    (accumulator, [key]) => {
      const actionType = `${definition.name}/${key}`;

      accumulator[key as keyof Reducers] = ((payload: unknown) => ({
        type: actionType,
        payload,
      })) as ActionCreators<Reducers>[keyof Reducers];

      return accumulator;
    },
    {} as ActionCreators<Reducers>,
  );

  const reducer = (state = definition.initialState, action: PayloadAction) => {
    const prefix = `${definition.name}/`;

    if (!action.type.startsWith(prefix)) {
      return state;
    }

    const reducerKey = action.type.slice(prefix.length) as keyof Reducers;
    const caseReducer = definition.reducers[reducerKey];

    if (!caseReducer) {
      return state;
    }

    const nextState = cloneState(state);
    const result = caseReducer(nextState, action);

    return (result ?? nextState) as State;
  };

  return {
    name: definition.name,
    reducer,
    actions: actionCreators,
  };
}

type Reducer<State = unknown> = (state: State | undefined, action: PayloadAction) => State;
type ReducerMap = Record<string, Reducer<any>>;

export function configureStore<ReducerMapObject extends ReducerMap>(options: {
  reducer: ReducerMapObject;
}) {
  const reducers = options.reducer;
  const reducerKeys = Object.keys(reducers) as Array<keyof ReducerMapObject>;
  let currentState = reducerKeys.reduce((accumulator, key) => {
    accumulator[key as string] = reducers[key](undefined, { type: '@@INIT', payload: undefined });
    return accumulator;
  }, {} as Record<string, unknown>);

  const listeners = new Set<() => void>();

  return {
    dispatch(action: PayloadAction) {
      const nextState = { ...currentState };

      for (const key of reducerKeys) {
        nextState[key as string] = reducers[key](nextState[key as string], action);
      }

      currentState = nextState;
      listeners.forEach(listener => listener());

      return action;
    },
    getState() {
      return currentState as {
        [Key in keyof ReducerMapObject]: ReturnType<ReducerMapObject[Key]>;
      };
    },
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
