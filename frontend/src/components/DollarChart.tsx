import { Paper, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDollar } from '../context/DollarContext';

export const DollarChart = () => {
  const { state } = useDollar();

  return (
    <Paper sx={{ p: 3, height: 400, mb: 4 }} elevation={4}>
      <Typography variant="h6" color="primary" gutterBottom>Variación del Dólar</Typography>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={state.data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="fecha" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ borderRadius: '8px' }} />
          <Line type="monotone" dataKey="valor" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};