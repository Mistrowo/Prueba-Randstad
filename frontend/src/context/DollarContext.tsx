import React, { createContext, useReducer, useContext, type ReactNode } from 'react';
import type { DollarRate, DollarState, Action } from '../types/index';

const initialState: DollarState = {
  data: [],
  loading: false,
};

const DollarContext = createContext<{
  state: DollarState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function dollarReducer(state: DollarState, action: Action): DollarState {
  switch (action.type) {
    case 'SET_DATA':
      return { 
        ...state, 
        data: action.payload.map(item => ({
          fecha: item.fecha,
          valor: typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor
        }))
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'DELETE_VALUE':
      return {
        ...state,
        data: state.data.filter((item) => item.fecha !== action.payload),
      };
    case 'UPDATE_VALUE':
      return {
        ...state,
        data: state.data.map((item) =>
          item.fecha === action.payload.fecha 
            ? { ...item, valor: action.payload.valor }
            : item
        ),
      };
    default:
      return state;
  }
}

export function DollarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dollarReducer, initialState);
  return (
    <DollarContext.Provider value={{ state, dispatch }}>
      {children}
    </DollarContext.Provider>
  );
}

export function useDollar() {
  const context = useContext(DollarContext);
  if (!context) throw new Error('useDollar debe usarse dentro de DollarProvider');
  return context;
}