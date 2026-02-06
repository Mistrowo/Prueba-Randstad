# Frontend - Dashboard Dólar Chile

Aplicación web desarrollada en React + TypeScript para visualizar y gestionar el historial del valor del dólar en Chile. Incluye gráficos interactivos y una tabla con opciones de edición y eliminación.

## Requisitos del Sistema

- Node.js >= 18.x
- npm >= 9.x o yarn >= 1.22

## Tecnologías Utilizadas

- React 18
- TypeScript
- Vite (bundler)
- Material UI (MUI)
- Recharts (gráficos)
- Axios (peticiones HTTP)
- SweetAlert2 (alertas y modales)

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd frontend
```

### 2. Instalar dependencias

Con npm:

```bash
npm install
```

Con yarn:

```bash
yarn install
```

### 3. Configurar la URL del backend

Por defecto, la aplicación espera que el backend esté disponible en la misma URL base. Para desarrollo local, puedes configurar un proxy en `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

## Ejecución

### Modo desarrollo

```bash
npm run dev
```

O con yarn:

```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:5173`

### Compilar para producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`

### Previsualizar build de producción

```bash
npm run preview
```

## Funcionalidades

### Dashboard Principal

- Filtrado por rango de fechas
- Visualización responsiva (adaptable a móviles y escritorio)

### Gráfico de Evolución

- Gráfico de líneas interactivo
- Tooltip con información detallada al pasar el cursor
- Ordenamiento cronológico automático

### Tabla de Registros

- Listado paginado de todos los registros
- Ordenamiento por fecha (más reciente primero)
- Edición de valores individuales
- Eliminación de registros
- Confirmación mediante modales

## Estructura del Proyecto

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── DollarChart.tsx      # Componente del gráfico
│   │   └── DollarTable.tsx      # Componente de la tabla
│   ├── context/
│   │   └── DollarContext.tsx    # Estado global con Context API
│   ├── types/
│   │   └── index.ts             # Definiciones de TypeScript
│   ├── App.tsx                  # Componente principal
│   ├── App.css                  # Estilos del componente principal
│   ├── index.css                # Estilos globales
│   └── main.tsx                 # Punto de entrada
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Arquitectura de Estado

La aplicación utiliza React Context API con useReducer para el manejo del estado global.

### Estado (DollarState)

```typescript
interface DollarState {
  data: DollarRate[];    // Array de registros
  loading: boolean;      // Estado de carga
}
```

### Acciones disponibles

| Acción        | Descripción                              |
|---------------|------------------------------------------|
| SET_DATA      | Establece los datos del historial        |
| SET_LOADING   | Cambia el estado de carga                |
| UPDATE_VALUE  | Actualiza el valor de un registro        |
| DELETE_VALUE  | Elimina un registro por fecha            |

### Uso del contexto

```typescript
import { useDollar } from './context/DollarContext';

function MiComponente() {
  const { state, dispatch } = useDollar();
  
  // Acceder a los datos
  console.log(state.data);
  
  // Despachar acciones
  dispatch({ type: 'SET_LOADING', payload: true });
}
```

## Tipos de Datos

```typescript
// Registro individual del dólar
interface DollarRate {
  fecha: string;   // Formato: "YYYY-MM-DD"
  valor: number;   // Valor en pesos chilenos
}

// Acciones del reducer
type Action =
  | { type: 'SET_DATA'; payload: DollarRate[] }
  | { type: 'UPDATE_VALUE'; payload: { fecha: string; valor: number } }
  | { type: 'DELETE_VALUE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };
```



### Configuración del gráfico

Los colores y estilos del gráfico se pueden ajustar en `DollarChart.tsx`:

```typescript
<Line 
  stroke="#0052cc"       // Color de la línea
  strokeWidth={3}        // Grosor
  dot={{ r: 4 }}         // Tamaño de los puntos
/>
```

## Scripts Disponibles

| Script          | Descripción                                    |
|-----------------|------------------------------------------------|
| `npm run dev`   | Inicia el servidor de desarrollo               |
| `npm run build` | Compila la aplicación para producción          |
| `npm run preview` | Previsualiza el build de producción          |
| `npm run lint`  | Ejecuta el linter (ESLint)                     |


## Solución de Problemas

### Error de CORS

Si encuentras errores de CORS, asegúrate de que:
1. El backend tenga configurado correctamente CORS
2. El proxy de Vite esté configurado (en desarrollo)



## Licencia

MIT