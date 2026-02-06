import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Button, TextField, 
  CircularProgress, Paper, CssBaseline, ThemeProvider, createTheme, useMediaQuery 
} from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';

// Importaciones de Contexto y Componentes
import { DollarProvider, useDollar } from './context/DollarContext';
import { DollarChart } from './components/DollarChart';
import { DollarTable } from './components/DollarTable';

const theme = createTheme({
  palette: {
    primary: { main: '#0052cc' },
    background: { default: '#f4f6f8' },
    text: { primary: '#172b4d' }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #eef0f2' }
      }
    }
  }
});

function Dashboard() {
  const { state, dispatch } = useDollar();
  
  const [start, setStart] = useState('2024-11-01');
  const [end, setEnd] = useState('2024-12-31');
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchData = async () => {
    if (new Date(start) > new Date(end)) {
      Swal.fire('Error', 'La fecha de inicio no puede ser mayor a la fin', 'error');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.get('/api/dolar-history', {
        params: { fecha_inicio: start, fecha_fin: end }
      });
      
      const data = response.data.data;
      dispatch({ type: 'SET_DATA', payload: data });

      if (data.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No se encontraron registros para este periodo',
          icon: 'info',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 5 } }}>
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 4, gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0052cc' }}>
            Monitoreo <span style={{ color: '#172b4d' }}>Dólar</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión y visualización de indicadores económicos
          </Typography>
        </Box>

        <Paper sx={{ p: 1.5, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', md: 'auto' } }}>
          <TextField 
            label="Desde" type="date" size="small" value={start}
            onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }}
          />
          <TextField 
            label="Hasta" type="date" size="small" value={end}
            onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }}
          />
          <Button 
            variant="contained" onClick={fetchData} disableElevation 
            sx={{ px: 4 }} disabled={state.loading}
          >
            {state.loading ? <CircularProgress size={24} color="inherit" /> : "Filtrar"}
          </Button>
        </Paper>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '7fr 3fr' }, 
        gap: 3,
        alignItems: 'start'
      }}>
        
        <Paper sx={{ p: 3, height: '550px', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Evolución del Valor</Typography>
          <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
            <DollarChart />
          </Box>
        </Paper>

        <Paper sx={{ 
          height: '550px', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Registros</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <DollarTable />
          </Box>
        </Paper>

      </Box>
    </Container>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <DollarProvider>
        <Dashboard />
      </DollarProvider>
    </ThemeProvider>
  );
}