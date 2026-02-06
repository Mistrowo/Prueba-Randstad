# Backend - API Dólar Chile

API REST desarrollada en Laravel para consultar y gestionar el historial del valor del dólar en Chile. Los datos se obtienen automáticamente desde la API de Mindicador.cl.

## Requisitos del Sistema

- PHP >= 8.1
- Composer
- MySQL 5.7+ o MariaDB 10.3+


## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd backend
```

### 2. Instalar dependencias

```bash
composer install
```

### 3. Configurar el entorno

Copiar el archivo de configuración de ejemplo:

```bash
cp .env.example .env
```

Editar el archivo `.env` con los datos de tu base de datos:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nombre_base_datos
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
```

### 4. Generar clave de aplicación

```bash
php artisan key:generate
```

### 5. Ejecutar migraciones

```bash
php artisan migrate
```

### 6. Sincronizar datos iniciales

Para cargar los valores del dólar desde Mindicador.cl:

```bash
php artisan dolar:sync
```

Para sincronizar años específicos:

```bash
php artisan dolar:sync --years=2023,2024,2025
```

## Ejecución

### Servidor de desarrollo

```bash
php artisan serve
```

El servidor estará disponible en `http://localhost:8000`

### Procesamiento de colas (opcional)

Si configuras un driver de colas diferente a `sync`:

```bash
php artisan queue:work
```

## Endpoints de la API

### Obtener historial del dólar

```
GET /api/dolar-history
```

Parámetros de consulta (query params):

| Parámetro     | Tipo   | Requerido | Descripción                     |
|---------------|--------|-----------|----------------------------------|
| fecha_inicio  | string | Sí        | Fecha inicial (formato: Y-m-d)  |
| fecha_fin     | string | Sí        | Fecha final (formato: Y-m-d)    |

Ejemplo de solicitud:

```bash
curl "http://localhost:8000/api/dolar-history?fecha_inicio=2024-01-01&fecha_fin=2024-12-31"
```

Ejemplo de respuesta:

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
    }
  ]
}
```

## Comandos Artisan

| Comando                          | Descripción                                      |
|----------------------------------|--------------------------------------------------|
| `php artisan dolar:sync`         | Sincroniza valores del dólar (años 2024 y 2025) |
| `php artisan dolar:sync --years=2023,2024` | Sincroniza años específicos            |

## Tareas Programadas

El sistema está configurado para sincronizar automáticamente los valores del dólar cada hora, sin embargo se necesita (si se esta ocupando un servidor) activar el crontab igualmente se dejo estipulado el schedule

## Estructura del Proyecto

```
backend/
├── app/
│   ├── Console/Commands/
│   │   └── SyncDollarValues.php    # Comando para sincronizar datos
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   └── DollarController.php # Controlador de la API
│   │   ├── Requests/
│   │   │   └── GetDollarHistoryRequest.php # Validación de requests
│   │   └── Resources/
│   │       └── DollarValueResource.php # Transformación de respuestas
│   ├── Jobs/
│   │   └── SyncDollarJob.php       # Job para sincronización
│   ├── Models/
│   │   └── DollarValue.php         # Modelo de valores del dólar
│   └── Services/
│       └── MindicadorService.php   # Servicio de consumo de API externa
├── database/
│   └── migrations/                 # Migraciones de base de datos
├── routes/
│   └── api.php                     # Definición de rutas API
└── config/                         # Archivos de configuración
```

## Configuración de CORS

El archivo `config/cors.php` está configurado para permitir peticiones desde cualquier origen. Para producción, se recomienda restringir los orígenes permitidos:
