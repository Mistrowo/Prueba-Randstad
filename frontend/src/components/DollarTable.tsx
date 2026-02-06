import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, TablePagination, Typography, Box 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { useDollar } from '../context/DollarContext';
import type { DollarRate } from '../types/index';

export function DollarTable() {
  const { state, dispatch } = useDollar();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleDelete = (fecha: string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El registro se eliminará del estado local",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0052cc',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch({ type: 'DELETE_VALUE', payload: fecha });
        
        const newDataLength = state.data.length - 1;
        const maxPage = Math.max(0, Math.ceil(newDataLength / rowsPerPage) - 1);
        if (page > maxPage) {
          setPage(maxPage);
        }
        
        Swal.fire('¡Borrado!', 'El registro ha sido eliminado.', 'success');
      }
    });
  };

  const handleEdit = async (item: DollarRate) => {
    const { value: nuevoValor } = await Swal.fire({
      title: 'Editar Valor del Dólar',
      input: 'number',
      inputLabel: `Fecha: ${item.fecha}`,
      inputValue: item.valor.toString(),
      showCancelButton: true,
      confirmButtonColor: '#0052cc',
      inputAttributes: {
        step: '0.01'
      },
      inputValidator: (value) => {
        if (!value) return '¡Debes ingresar un valor!';
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return '¡Ingresa un valor numérico válido!';
        return null;
      }
    });

    if (nuevoValor) {
      const valorNumerico = parseFloat(nuevoValor);
      dispatch({ 
        type: 'UPDATE_VALUE', 
        payload: { 
          fecha: item.fecha,
          valor: valorNumerico 
        } 
      });
      Swal.fire('¡Actualizado!', 'El valor ha sido modificado.', 'success');
    }
  };

  const sortedData = [...state.data].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  if (sortedData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No hay datos</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TableContainer sx={{ flexGrow: 1, maxHeight: { xs: '400px', lg: '450px' } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.fecha} hover>
                  <TableCell>{row.fecha}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    ${row.valor.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEdit(row)} 
                      color="primary"
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(row.fecha)} 
                      color="error"
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Filas por página"
      />
    </Box>
  );
}