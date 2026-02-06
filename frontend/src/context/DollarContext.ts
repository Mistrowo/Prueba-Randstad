import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { DollarState, Action } from '../types';

const initialState: DollarState = { data: [], loading: false };

function dollarReducer(state: DollarState, action: Action): DollarState {
  switch (action.type) {
    case 'SET_DATA': 
      return { ...state, data: action.payload, loading: false };
    case 'SET_LOADING': 
      return { ...state, loading: action.payload };
    case 'UPDATE_VALUE':
      return {
        ...state,
        data: state.data.map(i => 
          i.fecha === action.payload.fecha ? { ...i, valor: action.payload.valor } : i
        )
      };
    case 'DELETE_VALUE':
      return { 
        ...state, 
        data: state.data.filter(i => i.fecha !== action.payload) 
      };
    default: 
      return state;
  }
}

interface DollarContextType {
  state: DollarState;
  dispatch: React.Dispatch<Action>;
}

const DollarContext = createContext<DollarContextType | undefined>(undefined);

// Cambiamos la definición para que sea compatible con erasableSyntaxOnly
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
  if (!context) {
    throw new Error('useDollar debe ser utilizado dentro de un DollarProvider');
  }
  return context;
}