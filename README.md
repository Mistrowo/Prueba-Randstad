

**Proyecto:** PRUEBA TECNICA MONITOREO DOLAR  
**Fecha:** Febrero 2026  


## 1. INTRODUCCION

### 1.1 Proposito del Documento

Este documento describe la arquitectura, patrones de diseno, decisiones tecnicas y cumplimiento de requerimientos de la prueba tecnica asociada. 

### 1.2 Alcance del Sistema

Sistema full-stack compuesto por:
- API REST en Laravel para consumo y almacenamiento de datos
- Dashboard en React para visualizacion y manipulacion
- Base de datos MySQL para persistencia

### 1.3 Stack Tecnologico

| Componente | Tecnologia | Version |
|------------|------------|---------|
| Backend Framework | Laravel | 10.x |
| Base de Datos | MySQL | 5.7+ |
| Frontend Framework | React | 18.x |
| Lenguaje Frontend | TypeScript | 5.x |
| Design System | Material-UI (MUI) | 5.x |
| Libreria de Graficos | Recharts | 2.x |
| Cliente HTTP | Axios | 1.x |
| Notificaciones | SweetAlert2 | 11.x |
| Build Tool | Vite | 5.x |

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Arquitectura General

El sistema sigue una arquitectura cliente-servidor de tres capas:

```
+---------------------+
|   CAPA EXTERNA      |
|   Mindicador.cl     |
|   API Publica       |
+----------+----------+
           |
           | HTTPS GET
           v
+----------+----------+
|   CAPA BACKEND      |
|   Laravel API       |
|   Puerto: 8000      |
+----------+----------+
           |
           | SQL
           v
+----------+----------+
|   CAPA DATOS        |
|   MySQL             |
|   db_dolar_monitor  |
+----------+----------+
           ^
           | REST API (solo lectura)
           |
+----------+----------+
|   CAPA FRONTEND     |
|   React SPA         |
|   Puerto: 5173      |
+---------------------+
```

### 2.2 Comunicacion entre Componentes

| Origen | Destino | Protocolo | Puerto | Operaciones |
|--------|---------|-----------|--------|-------------|
| Laravel | Mindicador.cl | HTTPS | 443 | GET |
| Laravel | MySQL | TCP | 3306 | SELECT, INSERT, UPDATE |
| React | Laravel | HTTP/HTTPS | 8000 | GET (solo lectura) |

### 2.3 IMPORTANTE: Persistencia de Datos

**Las operaciones de EDICION y ELIMINACION se realizan UNICAMENTE a nivel de FRONTEND (estado de React/Context API). NO se persisten en la base de datos.**

Esto significa:
- Los datos originales en `db_dolar_monitor` **permanecen intactos**
- Al recargar la pagina, se restauran los valores originales desde el backend
- Al cambiar el rango de fechas, se consultan los datos originales
- La base de datos sirve como **fuente de verdad inmutable**

Esta decision se tomo segun el requerimiento que especifica: *"eliminar el registro completo del estado de la aplicacion"*.

---

## 3. BASE DE DATOS

### 3.1 Configuracion

| Parametro | Valor |
|-----------|-------|
| Motor | MySQL 5.7+ / MariaDB 10.3+ |
| Nombre de Base de Datos | db_dolar_monitor |
| Charset | utf8mb4 |
| Collation | utf8mb4_unicode_ci |

### 3.2 Creacion de la Base de Datos

```sql
CREATE DATABASE db_dolar_monitor
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 3.3 Configuracion en Laravel (.env)

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_dolar_monitor
DB_USERNAME=root
DB_PASSWORD=tu_password
```

### 3.4 Modelo de Datos

#### Tabla: dollar_values

| Campo | Tipo | Restricciones | Descripcion |
|-------|------|---------------|-------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Identificador interno |
| fecha | DATE | NOT NULL, UNIQUE | Fecha del valor del dolar |
| valor | DECIMAL(10,2) | NOT NULL | Valor del dolar en CLP |
| created_at | TIMESTAMP | NULLABLE | Fecha de creacion del registro |
| updated_at | TIMESTAMP | NULLABLE | Fecha de ultima actualizacion |

#### Indices

| Nombre | Campos | Tipo |
|--------|--------|------|
| PRIMARY | id | PRIMARY KEY |
| dollar_values_fecha_unique | fecha | UNIQUE |

#### Migracion Laravel

```php
Schema::create('dollar_values', function (Blueprint $table) {
    $table->id();
    $table->date('fecha')->unique();
    $table->decimal('valor', 10, 2);
    $table->timestamps();
    
    $table->index('fecha');
});
```

### 3.5 Diagrama Entidad-Relacion

```
+---------------------------+
|      dollar_values        |
+---------------------------+
| PK | id: BIGINT           |
|    | fecha: DATE (UNIQUE) |
|    | valor: DECIMAL(10,2) |
|    | created_at: TIMESTAMP|
|    | updated_at: TIMESTAMP|
+---------------------------+
```

---

## 4. BACKEND - LARAVEL

### 4.1 Estructura de Directorios

```
backend/
├── app/
│   ├── Console/
│   │   ├── Commands/
│   │   │   └── SyncDollarValues.php
│   │   └── Kernel.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── DollarController.php
│   │   ├── Requests/
│   │   │   └── GetDollarHistoryRequest.php
│   │   └── Resources/
│   │       └── DollarValueResource.php
│   ├── Jobs/
│   │   └── SyncDollarJob.php
│   ├── Models/
│   │   └── DollarValue.php
│   └── Services/
│       └── MindicadorService.php
├── config/
│   └── cors.php
├── database/
│   └── migrations/
│       └── xxxx_xx_xx_create_dollar_values_table.php
└── routes/
    └── api.php
```

### 4.2 Patrones de Diseno Implementados

#### 4.2.1 Service Pattern

**Ubicacion:** `app/Services/MindicadorService.php`

**Proposito:** Encapsular la logica de consumo de la API externa de Mindicador.cl, separando esta responsabilidad de los controladores y comandos.

**Implementacion:**

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MindicadorService
{
    private string $baseUrl = 'https://mindicador.cl/api/dolar';

    public function getDollarValuesByYear(int $year): array
    {
        $response = Http::timeout(30)->get("{$this->baseUrl}/{$year}");
        
        if ($response->failed()) {
            throw new \Exception("Error al obtener datos de Mindicador.cl");
        }
        
        return $response->json('serie', []);
    }
}
```

**Beneficios:**
- Principio de Responsabilidad Unica (SRP)
- Facilita testing mediante mocks
- Reutilizacion en comandos y jobs
- Desacoplamiento de la fuente de datos externa

#### 4.2.2 Command Pattern (Artisan)

**Ubicacion:** `app/Console/Commands/SyncDollarValues.php`

**Proposito:** Permitir la ejecucion on-demand de la sincronizacion de datos mediante linea de comandos.

**Implementacion:**

```php
<?php

namespace App\Console\Commands;

use App\Services\MindicadorService;
use App\Models\DollarValue;
use Illuminate\Console\Command;

class SyncDollarValues extends Command
{
    protected $signature = 'dolar:sync {--years=2024,2025}';
    protected $description = 'Sincroniza valores del dolar desde Mindicador.cl';

    public function handle(MindicadorService $service): int
    {
        $years = explode(',', $this->option('years'));
        
        foreach ($years as $year) {
            $this->info("Sincronizando año {$year}...");
            
            $data = $service->getDollarValuesByYear((int) $year);
            
            foreach ($data as $item) {
                DollarValue::updateOrCreate(
                    ['fecha' => date('Y-m-d', strtotime($item['fecha']))],
                    ['valor' => $item['valor']]
                );
            }
            
            $this->info("Año {$year} sincronizado: " . count($data) . " registros");
        }
        
        return Command::SUCCESS;
    }
}
```

**Uso:**
```bash
php artisan dolar:sync

php artisan dolar:sync --years=2023,2024,2025
```

#### 4.2.3 Job Pattern (Queue)

**Ubicacion:** `app/Jobs/SyncDollarJob.php`

**Proposito:** Procesamiento asincrono de la sincronizacion para no bloquear el hilo principal.

**Implementacion:**

```php
<?php

namespace App\Jobs;

use App\Services\MindicadorService;
use App\Models\DollarValue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncDollarJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private int $year
    ) {}

    public function handle(MindicadorService $service): void
    {
        $data = $service->getDollarValuesByYear($this->year);
        
        foreach ($data as $item) {
            DollarValue::updateOrCreate(
                ['fecha' => date('Y-m-d', strtotime($item['fecha']))],
                ['valor' => $item['valor']]
            );
        }
    }
}
```

#### 4.2.4 Scheduler Pattern

**Ubicacion:** `app/Console/Kernel.php`

**Proposito:** Automatizar la ejecucion de la sincronizacion cada hora.

**Implementacion:**

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('dolar:sync')->hourly();
    }
}
```

**Configuracion Cron:**
Esto unicamente para un servidor si es que se necesita mas adelante, es paso opcional pero igualmente se dejo :)
```bash
* * * * * cd /ruta/al/proyecto && php artisan schedule:run >> /dev/null 2>&1
```

#### 4.2.5 Form Request Validation

**Ubicacion:** `app/Http/Requests/GetDollarHistoryRequest.php`

**Proposito:** Validar y sanitizar los parametros de entrada del endpoint.

**Implementacion:**

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GetDollarHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fecha_inicio' => 'required|date|date_format:Y-m-d',
            'fecha_fin' => 'required|date|date_format:Y-m-d|after_or_equal:fecha_inicio',
        ];
    }

    public function messages(): array
    {
        return [
            'fecha_inicio.required' => 'La fecha de inicio es requerida',
            'fecha_fin.required' => 'La fecha de fin es requerida',
            'fecha_fin.after_or_equal' => 'La fecha fin debe ser igual o posterior a la fecha inicio',
        ];
    }
}
```

#### 4.2.6 API Resource Pattern

**Ubicacion:** `app/Http/Resources/DollarValueResource.php`

**Proposito:** Transformar el modelo Eloquent a una estructura JSON controlada.

**Implementacion:**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DollarValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'fecha' => $this->fecha,
            'valor' => (float) $this->valor,
        ];
    }
}
```

### 4.3 API REST

#### Endpoint: Obtener Historial del Dolar

| Atributo | Valor |
|----------|-------|
| URL | `/api/dolar-history` |
| Metodo | GET |
| Autenticacion | No requerida |

**Parametros de Consulta:**

| Parametro | Tipo | Requerido | Formato | Descripcion |
|-----------|------|-----------|---------|-------------|
| fecha_inicio | string | Si | Y-m-d | Fecha inicial del rango |
| fecha_fin | string | Si | Y-m-d | Fecha final del rango |

**Ejemplo de Solicitud:**

```http
GET /api/dolar-history?fecha_inicio=2024-01-01&fecha_fin=2024-01-31 HTTP/1.1
Host: localhost:8000
Accept: application/json
```

**Respuesta Exitosa (200 OK):**

```json
{
    "data": [
        {
            "fecha": "2024-01-02",
            "valor": 877.45
        },
        {
            "fecha": "2024-01-03",
            "valor": 880.12
        },
        {
            "fecha": "2024-01-04",
            "valor": 878.90
        }
    ]
}
```

**Respuesta de Error (422 Unprocessable Entity):**

```json
{
    "message": "The fecha fin field must be a date after or equal to fecha inicio.",
    "errors": {
        "fecha_fin": [
            "La fecha fin debe ser igual o posterior a la fecha inicio"
        ]
    }
}
```

### 4.4 Controlador

**Ubicacion:** `app/Http/Controllers/Api/DollarController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetDollarHistoryRequest;
use App\Http\Resources\DollarValueResource;
use App\Models\DollarValue;

class DollarController extends Controller
{
    public function history(GetDollarHistoryRequest $request)
    {
        $validated = $request->validated();
        
        $values = DollarValue::whereBetween('fecha', [
            $validated['fecha_inicio'],
            $validated['fecha_fin']
        ])
        ->orderBy('fecha', 'asc')
        ->get();
        
        return DollarValueResource::collection($values);
    }
}
```

### 4.5 Rutas

**Ubicacion:** `routes/api.php`

```php
<?php

use App\Http\Controllers\Api\DollarController;
use Illuminate\Support\Facades\Route;

Route::get('/dolar-history', [DollarController::class, 'history']);
```

---

## 5. FRONTEND - REACT

### 5.1 Estructura de Directorios

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── DateFilter.tsx
│   │   ├── DollarChart.tsx
│   │   └── DollarTable.tsx
│   ├── context/
│   │   └── DollarContext.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── dollar.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 5.2 Patrones de Diseno Implementados

#### 5.2.1 Context API + useReducer (Flux Pattern)

**Ubicacion:** `src/context/DollarContext.tsx`

**Proposito:** Gestion de estado global siguiendo el patron Flux/Redux de manera simplificada sin dependencias externas.

**Definicion de Tipos:**

```typescript
// src/types/dollar.ts

export interface DollarRate {
    fecha: string;   // Formato YYYY-MM-DD, usado como identificador unico
    valor: number;   // Valor del dolar en CLP
}

export interface DollarState {
    data: DollarRate[];
    loading: boolean;
}

export type DollarAction =
    | { type: 'SET_DATA'; payload: DollarRate[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'UPDATE_VALUE'; payload: { fecha: string; valor: number } }
    | { type: 'DELETE_VALUE'; payload: string };
```

**Implementacion del Reducer:**

```typescript
// src/context/DollarContext.tsx

const initialState: DollarState = {
    data: [],
    loading: false
};

function dollarReducer(state: DollarState, action: DollarAction): DollarState {
    switch (action.type) {
        case 'SET_DATA':
            return { 
                ...state, 
                data: action.payload 
            };
            
        case 'SET_LOADING':
            return { 
                ...state, 
                loading: action.payload 
            };
            
        case 'UPDATE_VALUE':
            // NOTA: Solo modifica el estado local, NO la base de datos
            return {
                ...state,
                data: state.data.map(item =>
                    item.fecha === action.payload.fecha
                        ? { ...item, valor: action.payload.valor }
                        : item
                )
            };
            
        case 'DELETE_VALUE':
            // NOTA: Solo elimina del estado local, NO de la base de datos
            return {
                ...state,
                data: state.data.filter(item => item.fecha !== action.payload)
            };
            
        default:
            return state;
    }
}
```

#### 5.2.2 Provider Pattern

**Proposito:** Proveer el estado y dispatch a todo el arbol de componentes.

**Implementacion:**

```typescript
interface DollarContextType {
    state: DollarState;
    dispatch: React.Dispatch<DollarAction>;
}

const DollarContext = createContext<DollarContextType | undefined>(undefined);

export const DollarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(dollarReducer, initialState);
    
    return (
        <DollarContext.Provider value={{ state, dispatch }}>
            {children}
        </DollarContext.Provider>
    );
};
```

#### 5.2.3 Custom Hook Pattern

**Proposito:** Encapsular el acceso al contexto con validacion.

**Implementacion:**

```typescript
export const useDollar = (): DollarContextType => {
    const context = useContext(DollarContext);
    
    if (context === undefined) {
        throw new Error('useDollar debe usarse dentro de un DollarProvider');
    }
    
    return context;
};
```

#### 5.2.4 Container/Presentational Pattern

| Componente | Tipo | Responsabilidad |
|------------|------|-----------------|
| App.tsx | Container | Layout, orquestacion, fetch inicial |
| DollarChart.tsx | Presentational | Renderizado del grafico |
| DollarTable.tsx | Mixed | Tabla con logica de edicion/eliminacion |
| DateFilter.tsx | Presentational | Controles de seleccion de fechas |

### 5.3 Componentes

#### 5.3.1 DollarChart

**Ubicacion:** `src/components/DollarChart.tsx`

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDollar } from '../context/DollarContext';

const DollarChart: React.FC = () => {
    const { state } = useDollar();
    
    const formatTooltip = (value: number) => {
        return `$${value.toLocaleString('es-CL')}`;
    };
    
    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={state.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip formatter={formatTooltip} />
                <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};
```

#### 5.3.2 DollarTable

**Ubicacion:** `src/components/DollarTable.tsx`

**IMPORTANTE - SOLO FRONTEND:** Las operaciones de edicion y eliminacion **NO modifican la base de datos**. Solo afectan el estado local de React.

```typescript
import { Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useDollar } from '../context/DollarContext';

const DollarTable: React.FC = () => {
    const { state, dispatch } = useDollar();
    
    // IMPORTANTE: Solo modifica el estado de React, NO la base de datos
    const handleEdit = async (fecha: string, currentValue: number) => {
        const { value: newValue } = await Swal.fire({
            title: 'Editar Valor',
            input: 'number',
            inputValue: currentValue,
            showCancelButton: true,
        });
        
        if (newValue) {
            dispatch({
                type: 'UPDATE_VALUE',
                payload: { fecha, valor: parseFloat(newValue) }
            });
            // NO hay llamada HTTP al backend
        }
    };
    
    // IMPORTANTE: Solo elimina del estado de React, NO de la base de datos
    const handleDelete = async (fecha: string) => {
        const result = await Swal.fire({
            title: 'Confirmar eliminacion',
            icon: 'warning',
            showCancelButton: true,
        });
        
        if (result.isConfirmed) {
            dispatch({ type: 'DELETE_VALUE', payload: fecha });
            // NO hay llamada HTTP al backend
        }
    };
    
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Acciones</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {state.data.map((row) => (
                    <TableRow key={row.fecha}>
                        <TableCell>{row.fecha}</TableCell>
                        <TableCell>${row.valor.toLocaleString('es-CL')}</TableCell>
                        <TableCell>
                            <IconButton onClick={() => handleEdit(row.fecha, row.valor)}>
                                <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(row.fecha)}>
                                <Delete />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
```

### 5.4 Servicio API

**Ubicacion:** `src/services/api.ts`

**Nota:** Solo existe operacion de lectura (GET). No hay endpoints PUT o DELETE.

```typescript
import axios from 'axios';
import { DollarRate } from '../types/dollar';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Unica operacion: LECTURA de datos
export const getDollarHistory = async (
    fechaInicio: string, 
    fechaFin: string
): Promise<DollarRate[]> => {
    const response = await api.get('/dolar-history', {
        params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        }
    });
    return response.data.data;
};

export default api;
```

### 5.5 Configuracion de Vite

**Ubicacion:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            }
        }
    }
});
```

---

## 6. CUMPLIMIENTO DE REQUERIMIENTOS

### 6.1 Requerimientos Backend

| ID | Requerimiento | Estado | Implementacion |
|----|---------------|--------|----------------|
| BE-01 | Consumir API Mindicador.cl `https://mindicador.cl/api/dolar/{yyyy}` | CUMPLIDO | `MindicadorService.php` realiza peticiones HTTP GET |
| BE-02 | Almacenar valores del periodo 2024-2025 | CUMPLIDO | Comando `dolar:sync` sincroniza ambos años en `db_dolar_monitor` |
| BE-03 | Ejecucion automatica cada hora | CUMPLIDO | `Kernel.php` configura `$schedule->command('dolar:sync')->hourly()` |
| BE-04 | Ejecucion on-demand via Artisan | CUMPLIDO | Comando `php artisan dolar:sync` con opcion `--years` |
| BE-05 | Endpoint con rango de fechas en JSON | CUMPLIDO | `GET /api/dolar-history?fecha_inicio=X&fecha_fin=Y` |

### 6.2 Requerimientos Frontend

| ID | Requerimiento | Estado | Implementacion |
|----|---------------|--------|----------------|
| FE-01 | Consumir endpoint del backend | CUMPLIDO | `api.ts` usa Axios para `/api/dolar-history` |
| FE-02 | Estado con Context o Redux | CUMPLIDO | `DollarContext.tsx` con Context API + useReducer |
| FE-03 | Mostrar ultimos 30 dias por defecto | CUMPLIDO | `DateFilter.tsx` inicializa con fecha actual menos 30 dias |
| FE-04 | Filtro de fechas modificable | CUMPLIDO | DatePicker de MUI permite seleccion de rango |
| FE-05 | Grafico de fluctuacion | CUMPLIDO | `DollarChart.tsx` con LineChart de Recharts |
| FE-06 | Tabla con columnas Fecha y Valor | CUMPLIDO | `DollarTable.tsx` con tabla MUI |
| FE-07 | Modificar valor de fila | CUMPLIDO | Edicion via SweetAlert2 + dispatch `UPDATE_VALUE` **(solo estado frontend)** |
| FE-08 | Eliminar registro del estado | CUMPLIDO | Eliminacion + dispatch `DELETE_VALUE` **(solo estado frontend)** |
| FE-09 | Actualizar grafico y tabla al cambiar estado | CUMPLIDO | Ambos componentes consumen el mismo Context |
| FE-10 | Usar Design System (MUI) | CUMPLIDO | Material-UI v5 |

### 6.3 IMPORTANTE: Edicion y Eliminacion Solo en Frontend

El requerimiento original especifica:

> *"modificar el valor del dolar de una fecha especifica o eliminar el registro completo **del estado de la aplicacion**"*

**Implementacion:**

Las operaciones de **editar** y **eliminar** fueron implementadas **UNICAMENTE a nivel de estado del frontend (Context API de React)**:

| Operacion | Afecta Estado React | Afecta Base de Datos |
|-----------|---------------------|----------------------|
| Editar valor | SI | **NO** |
| Eliminar registro | SI | **NO** |
| Cargar datos | SI | Solo lectura (SELECT) |

**Comportamiento:**

1. Usuario edita un valor → Estado se actualiza → UI refleja el cambio
2. Usuario elimina un registro → Estado se actualiza → UI refleja el cambio
3. Usuario recarga la pagina → **Se cargan datos originales** desde backend
4. Usuario cambia filtro de fechas → **Se consultan datos originales**

**Justificacion:**
- Cumple con el requerimiento literal ("del estado de la aplicacion")
- Mantiene integridad de datos historicos oficiales
- No requiere endpoints PUT/DELETE
- Demuestra manejo de estado reactivo en React

---

## 7. DECISIONES TECNICAS

### 7.1 Fecha como Identificador Unico

**Decision:** Usar `fecha` como identificador en lugar de `id`.

**Justificacion:** Una fecha solo puede tener un valor del dolar. Simplifica operaciones y evita sincronizacion de IDs.

### 7.2 Context API vs Redux

**Decision:** Usar Context API con useReducer.

**Justificacion:** Menor complejidad, sin dependencias adicionales, patron similar a Redux.

### 7.3 Operaciones CRUD Solo en Estado Frontend

**Decision:** Editar y eliminar solo modifican el estado de React, no la base de datos.

**Justificacion:** El requerimiento especifica "del estado de la aplicacion". Mantiene integridad de datos historicos.

---

## 8. DIAGRAMAS

### 8.1 Flujo de Edicion/Eliminacion (Solo Frontend)

```
+------------------------------------------------------------------------+
|                    FLUJO DE EDICION/ELIMINACION                        |
|                    (SOLO AFECTA ESTADO FRONTEND)                       |
+------------------------------------------------------------------------+
|                                                                        |
|   Usuario                DollarTable              Context              |
|      |                       |                       |                 |
|      | Click Edit/Delete     |                       |                 |
|      |---------------------->|                       |                 |
|      |                       |                       |                 |
|      |                       | dispatch(UPDATE/DELETE)                 |
|      |                       |---------------------->|                 |
|      |                       |                       |                 |
|      |                       |                  Reducer                |
|      |                       |                  actualiza              |
|      |                       |                  state.data             |
|      |                       |                       |                 |
|      |                       |<----------------------|                 |
|      |                       |   Re-render           |                 |
|      |<----------------------|                       |                 |
|      |   UI Actualizada      |                       |                 |
|      |                       |                       |                 |
|      |   +--------------------------------------------------+          |
|      |   | NOTA: NO hay comunicacion con Backend/BD         |          |
|      |   | Los datos en db_dolar_monitor NO se modifican    |          |
|      |   +--------------------------------------------------+          |
|                                                                        |
+------------------------------------------------------------------------+
```

### 8.2 Diagrama de Componentes

```
                          +------------------------+
                          |        main.tsx        |
                          +-----------+------------+
                                      |
                                      v
                          +-----------+------------+
                          |    DollarProvider      |
                          |   (Context + Reducer)  |
                          +-----------+------------+
                                      |
                                      v
                          +-----------+------------+
                          |        App.tsx         |
                          +-----------+------------+
                                      |
              +-----------------------+-----------------------+
              |                       |                       |
              v                       v                       v
    +---------+--------+    +---------+--------+    +---------+--------+
    |   DateFilter     |    |   DollarChart    |    |   DollarTable    |
    +------------------+    +------------------+    +------------------+
```

---

## 9. ANEXOS

### 9.1 Variables de Entorno Backend (.env)

```env
APP_NAME=DolarMonitor
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_dolar_monitor
DB_USERNAME=root
DB_PASSWORD=

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

### 9.2 Comandos Utiles

| Comando | Descripcion |
|---------|-------------|
| `composer install` | Instalar dependencias backend |
| `php artisan migrate` | Ejecutar migraciones |
| `php artisan dolar:sync` | Sincronizar datos |
| `php artisan serve` | Iniciar backend (puerto 8000) |
| `npm install` | Instalar dependencias frontend |
| `npm run dev` | Iniciar frontend (puerto 5173) |

---

## 10. RESUMEN

- **Backend:** Laravel 10 + MySQL (`db_dolar_monitor`)
- **Frontend:** React 18 + TypeScript + MUI + Recharts
- **Sincronizacion:** Automatica (cada hora) y manual via Artisan
- **Edicion/Eliminacion:** **Solo a nivel de estado frontend, NO modifica la base de datos**

---

