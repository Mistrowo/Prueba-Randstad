export interface DollarRate {
  fecha: string;
  valor: number;
}

export interface DollarState {
  data: DollarRate[];
  loading: boolean;
}

export type Action =
  | { type: 'SET_DATA'; payload: DollarRate[] }
  | { type: 'UPDATE_VALUE'; payload: { fecha: string; valor: number } }
  | { type: 'DELETE_VALUE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };