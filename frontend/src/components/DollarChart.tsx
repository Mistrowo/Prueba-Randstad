import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useDollar } from '../context/DollarContext';
import { Box, Typography } from '@mui/material';

export function DollarChart() {
  const { state } = useDollar();

  const sortedData = [...state.data]
    .filter(item => item && item.fecha && typeof item.valor === 'number' && !isNaN(item.valor))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  if (sortedData.length === 0) {
    return (
      <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No hay datos suficientes para el gráfico</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis 
          dataKey="fecha" 
          hide
        />
        <YAxis 
          domain={['auto', 'auto']} 
          orientation="right"
          tick={{ fontSize: 12, fill: '#999' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val: number) => `$${val}`}
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '10px', 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}
          labelStyle={{ fontWeight: 'bold', color: '#0052cc' }}
          formatter={(value: number | undefined) => {
            if (value === undefined) return ['-', 'Valor'];
            return [`$${value}`, 'Valor'];
          }}
        />
        <Line 
          type="monotone" 
          dataKey="valor" 
          stroke="#0052cc" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#0052cc', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }} 
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}