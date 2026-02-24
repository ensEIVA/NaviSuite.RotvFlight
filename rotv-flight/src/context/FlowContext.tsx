import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface SystemEntry {
  id: string;
  name: string;
  type: string;
  ip: string;
  firmware: string;
  signal: number; // dBm, e.g. -62
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface FlowState {
  step1Complete: boolean;
  step2Complete: boolean;
  selectedSystems: SystemEntry[];
  connectedSystems: SystemEntry[];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type FlowAction =
  | { type: 'CONNECT_SYSTEM';    payload: SystemEntry }
  | { type: 'DISCONNECT_SYSTEM'; payload: { id: string } }
  | { type: 'SELECT_SYSTEM';     payload: SystemEntry }
  | { type: 'DESELECT_SYSTEM';   payload: { id: string } }
  | { type: 'COMPLETE_STEP1' }
  | { type: 'COMPLETE_STEP2' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'CONNECT_SYSTEM': {
      const alreadyConnected = state.connectedSystems.some(
        (s) => s.id === action.payload.id,
      );
      if (alreadyConnected) return state;
      return {
        ...state,
        connectedSystems: [...state.connectedSystems, action.payload],
      };
    }

    case 'DISCONNECT_SYSTEM': {
      return {
        ...state,
        connectedSystems: state.connectedSystems.filter(
          (s) => s.id !== action.payload.id,
        ),
        // Also deselect — a disconnected system cannot remain selected
        selectedSystems: state.selectedSystems.filter(
          (s) => s.id !== action.payload.id,
        ),
      };
    }

    case 'SELECT_SYSTEM': {
      const alreadySelected = state.selectedSystems.some(
        (s) => s.id === action.payload.id,
      );
      if (alreadySelected) return state;
      return {
        ...state,
        selectedSystems: [...state.selectedSystems, action.payload],
      };
    }

    case 'DESELECT_SYSTEM': {
      return {
        ...state,
        selectedSystems: state.selectedSystems.filter(
          (s) => s.id !== action.payload.id,
        ),
      };
    }

    case 'COMPLETE_STEP1':
      return { ...state, step1Complete: true };

    case 'COMPLETE_STEP2':
      return { ...state, step2Complete: true };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context value shape (state + actions)
// ---------------------------------------------------------------------------

interface FlowContextValue extends FlowState {
  connectSystem:    (system: SystemEntry) => void;
  disconnectSystem: (id: string) => void;
  selectSystem:     (system: SystemEntry) => void;
  deselectSystem:   (id: string) => void;
  completeStep1:    () => void;
  completeStep2:    () => void;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------

const FlowContext = createContext<FlowContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const INITIAL_STATE: FlowState = {
  step1Complete: false,
  step2Complete: false,
  selectedSystems: [],
  connectedSystems: [],
};

interface FlowProviderProps {
  children: ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  const [state, dispatch] = useReducer(flowReducer, INITIAL_STATE);

  const value: FlowContextValue = {
    ...state,

    connectSystem(system: SystemEntry) {
      dispatch({ type: 'CONNECT_SYSTEM', payload: system });
    },
    disconnectSystem(id: string) {
      dispatch({ type: 'DISCONNECT_SYSTEM', payload: { id } });
    },
    selectSystem(system: SystemEntry) {
      dispatch({ type: 'SELECT_SYSTEM', payload: system });
    },
    deselectSystem(id: string) {
      dispatch({ type: 'DESELECT_SYSTEM', payload: { id } });
    },
    completeStep1() {
      dispatch({ type: 'COMPLETE_STEP1' });
    },
    completeStep2() {
      dispatch({ type: 'COMPLETE_STEP2' });
    },
  };

  return <FlowContext value={value}>{children}</FlowContext>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) {
    throw new Error('useFlow must be used inside <FlowProvider>');
  }
  return ctx;
}
