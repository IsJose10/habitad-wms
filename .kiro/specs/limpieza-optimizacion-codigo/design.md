# Documento de Diseño Técnico: Limpieza y Optimización del Código WMS

## 1. Introducción

Este documento define el diseño técnico para la limpieza, optimización y refactorización del sistema WMS habitad-wms. El objetivo es preparar el código para producción eliminando redundancias, consolidando funcionalidad duplicada, removiendo componentes obsoletos y mejorando la mantenibilidad del código, mientras se preserva completamente el flujo crítico operativo (Montacarguista → Auxiliar para picking).

### 1.1 Contexto del Sistema

El sistema habitad-wms es una aplicación web local construida con:
- **Backend**: Node.js con servidor HTTP nativo, SQLite para persistencia
- **Frontend**: JavaScript Vanilla, HTML5, CSS3
- **Arquitectura**: Cliente-Servidor con API REST

### 1.2 Objetivos del Diseño

1. Eliminar código obsoleto y funcionalidad removida (servicios)
2. Consolidar funciones duplicadas en módulos reutilizables
3. Simplificar la interfaz eliminando pantallas redundantes
4. Refactorizar código del servidor y cliente para mejorar legibilidad
5. Optimizar consultas y operaciones de base de datos
6. Preservar intacto el flujo crítico de operaciones
7. Preparar el código para repositorio Git

## 2. Arquitectura del Sistema

### 2.1 Arquitectura Actual

```
habitad-wms/
├── server.js           # Servidor HTTP y rutas API REST
├── db.js              # Capa de acceso a datos y lógica de negocio
├── db.sqlite          # Base de datos SQLite (excluir de repo)
├── package.json       # Dependencias del proyecto
└── client/            # Aplicación frontend
    ├── index.html     # Punto de entrada
    ├── index.css      # Estilos globales
    ├── app.js         # Controlador principal y navegación
    └── js/
        ├── api.js     # Cliente HTTP para API REST
        ├── state.js   # Gestión de estado global
        ├── utils.js   # Funciones utilitarias
        └── views/     # Vistas de la aplicación
            ├── dashboard.js
            ├── montacarguista.js  # CRÍTICO
            ├── picking.js         # CRÍTICO
            ├── inventario.js      # CRÍTICO
            ├── catalogo.js
            ├── compras.js
            ├── ventas.js
            ├── recibo.js
            └── despacho.js
```


### 2.2 Arquitectura Objetivo

La arquitectura objetivo mantiene la misma estructura general pero con código optimizado:

```
habitad-wms/
├── server.js           # Refactorizado: endpoints organizados, middleware de errores
├── db.js              # Optimizado: consultas consolidadas, sin código de servicios
├── .gitignore         # Nuevo: excluye db.sqlite, node_modules, archivos temp
├── README.md          # Actualizado: documenta estructura y uso
├── package.json       
└── client/
    ├── index.html     
    ├── index.css      
    ├── app.js         # Limpio: sin imports de vistas eliminadas
    └── js/
        ├── api.js     # Sin cambios significativos
        ├── state.js   # Sin cambios significativos
        ├── utils.js   # Expandido: funciones consolidadas de todas las vistas
        └── views/     # Solo vistas activas y no redundantes
            ├── dashboard.js
            ├── montacarguista.js  # PRESERVADO
            ├── picking.js         # PRESERVADO
            └── inventario.js      # PRESERVADO
```

### 2.3 Flujo Crítico Preservado

El flujo operativo crítico que debe mantenerse intacto:

```
1. Montacarguista consulta consolidado diario
   ↓
2. Montacarguista identifica productos en rack alto (pos >= 20)
   ↓
3. Montacarguista ejecuta descenso a zona de picking (pos 10-19)
   ↓
4. Auxiliar recibe hoja de picking
   ↓
5. Auxiliar alista productos desde zona auxiliar
   ↓
6. Auxiliar confirma picking
   ↓
7. Sistema actualiza inventario y estado de venta
```

## 3. Componentes del Sistema

### 3.1 Módulo Servidor (server.js)

#### 3.1.1 Diseño Actual

El servidor actual tiene endpoints REST organizados linealmente sin agrupación lógica clara.

#### 3.1.2 Diseño Propuesto

**Organización de Endpoints por Dominio:**

```javascript
// === ENDPOINTS DE CATÁLOGOS ===
// GET  /api/clientes
// POST /api/clientes
// GET  /api/proveedores
// POST /api/proveedores
// GET  /api/productos
// POST /api/productos

// === ENDPOINTS DE OPERACIONES COMERCIALES ===
// GET  /api/compras
// POST /api/compras
// GET  /api/ventas
// POST /api/ventas

// === ENDPOINTS DE INVENTARIO ===
// GET  /api/inventario/movimientos
// POST /api/inventario/movimientos
// GET  /api/inventario/stock
// GET  /api/inventario/stock/ubicaciones
// GET  /api/inventario/stock/detalle
// GET  /api/inventario/stock/auxiliar
// POST /api/inventario/inventario-general
// POST /api/inventario/descenso

// === ENDPOINTS DE PICKING (FLUJO CRÍTICO) ===
// GET  /api/ventas/consolidado
// GET  /api/ventas/picking
// POST /api/ventas/confirmar-picking
// GET  /api/inventario/movimientos/referencia
```


**Middleware de Manejo de Errores:**

```javascript
function handleError(res, error, context = '') {
    console.error(`Error en ${context}:`, error);
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    sendJSON(res, status, { error: message });
}
```

**Funciones Auxiliares Consolidadas:**

```javascript
// Validación de parámetros de query
function validateQueryParam(param, paramName) {
    if (!param) {
        const error = new Error(`Falta el parámetro: ${paramName}`);
        error.status = 400;
        throw error;
    }
    return param;
}

// Procesamiento de body de peticiones
async function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(new Error('JSON inválido en el body de la petición'));
            }
        });
    });
}

// Respuesta JSON estandarizada
function sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
```

#### 3.1.3 Eliminación de Código Obsoleto

**Endpoints a Eliminar:**
- `/api/servicios` (GET y POST)

**Código a Remover:**
- Todas las referencias a "servicios" en el enrutamiento
- Manejo de peticiones relacionadas con órdenes de servicio

### 3.2 Módulo de Acceso a Datos (db.js)

#### 3.2.1 Diseño Actual

El módulo db.js contiene:
- Inicialización de tablas (incluyendo tabla obsoleta ordenes_servicio)
- Funciones CRUD para cada entidad
- Lógica de negocio de volumetría
- Funciones específicas para picking y montacarguista

#### 3.2.2 Diseño Propuesto

**Estructura del Módulo:**

```javascript
// === INICIALIZACIÓN DE BASE DE DATOS ===
// - Crear tablas (sin ordenes_servicio)
// - Aplicar migraciones de columnas
// - Sembrar datos de ejemplo

// === FUNCIONES DE CATÁLOGOS ===
// getClientes(), createCliente()
// getProveedores(), createProveedor()
// getProductos(), createProducto()

// === FUNCIONES DE OPERACIONES COMERCIALES ===
// getCompras(), createCompra()
// getVentas(), createVenta()

// === FUNCIONES DE INVENTARIO ===
// getMovimientos(), createMovimiento()
// getStockGlobal(), getStockUbicaciones(), getStockDetalle()
// getStockAuxiliar()

// === FUNCIONES DE PICKING (FLUJO CRÍTICO) ===
// getConsolidado()
// getPicking()
// confirmarPicking()
// getMovimientosReferencia()

// === FUNCIONES DE MONTACARGUISTA (FLUJO CRÍTICO) ===
// ejecutarDescenso()
// saveInventarioGeneral()

// === FUNCIONES DE VOLUMETRÍA ===
// getVolumeOcupado()
// validarDimensionesYVolumen()
```


**Optimización de Consultas:**

1. **Consolidar consultas de stock:**
```javascript
// Antes: múltiples consultas similares
// Después: función parametrizada
function getStock(filters = {}) {
    let query = `
        SELECT codigo_producto, ubicacion, 
               SUM(CASE WHEN tipo = 'IN' THEN cantidad ELSE -cantidad END) as stock
        FROM inventario_movimientos
    `;
    
    const conditions = [];
    const params = [];
    
    if (filters.codigo) {
        conditions.push('codigo_producto = ?');
        params.push(filters.codigo);
    }
    
    if (filters.ubicacion) {
        conditions.push('ubicacion = ?');
        params.push(filters.ubicacion);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY codigo_producto, ubicacion HAVING stock > 0';
    
    return db.prepare(query).all(...params);
}
```

2. **Índices de Base de Datos:**
```sql
CREATE INDEX IF NOT EXISTS idx_movimientos_producto 
    ON inventario_movimientos(codigo_producto);
    
CREATE INDEX IF NOT EXISTS idx_movimientos_ubicacion 
    ON inventario_movimientos(ubicacion);
    
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia 
    ON inventario_movimientos(documento_referencia);
```

#### 3.2.3 Eliminación de Código Obsoleto

**Tablas a Eliminar:**
- `ordenes_servicio`

**Funciones a Eliminar:**
- `getServicios()`
- `createServicio()`
- Cualquier función relacionada con órdenes de servicio

### 3.3 Módulo Cliente (client/)

#### 3.3.1 Controlador Principal (app.js)

**Diseño Propuesto:**

```javascript
// === IMPORTS ===
import { state } from './js/state.js';
import { fetchAPI } from './js/api.js';
import { 
    formatoMoneda, 
    initDateInputs,
    esZonaMontacarguista,
    populateProductosSelect,
    populateClientesSelect,
    populateProveedoresSelect
} from './js/utils.js';

// Imports de vistas activas (sin servicios.js)
import './js/views/montacarguista.js';  // CRÍTICO
import './js/views/picking.js';         // CRÍTICO
import './js/views/dashboard.js';
import './js/views/inventario.js';

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDateInputs();
    loadCatalogos();
    if (window.loadDashboardStats) {
        window.loadDashboardStats();
    }
});

// === NAVEGACIÓN ===
function initNavigation() {
    // Gestión de navegación entre vistas
}

export function showView(viewName) {
    // Cambio de vista activa
}

// === CARGA DE CATÁLOGOS ===
async function loadCatalogos() {
    // Carga inicial de datos maestros
}

// === FUNCIONES DE IMPRESIÓN ===
export function imprimirDocumento(tipoDoc) {
    // Generación de documentos imprimibles
}
```


#### 3.3.2 Módulo de Utilidades (utils.js)

**Funciones Consolidadas:**

```javascript
// === FORMATEO ===
/**
 * Formatea un número como moneda colombiana (COP)
 * @param {number} valor - Valor numérico a formatear
 * @returns {string} Valor formateado como moneda
 */
export function formatoMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor || 0);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} valor - Valor numérico a formatear
 * @returns {string} Valor formateado con separadores
 */
export function formatoNumero(valor) {
    return new Intl.NumberFormat('es-CO').format(valor || 0);
}

// === VALIDACIÓN ===
/**
 * Valida si una ubicación corresponde a zona de montacarguista (rack alto)
 * @param {string} ubicacion - Código de ubicación (formato: VXXYYPP)
 * @returns {boolean} true si la posición es >= 20 (rack alto)
 */
export function esZonaMontacarguista(ubicacion) {
    if (!ubicacion || ubicacion.length < 7) return false;
    const pos = parseInt(ubicacion.substring(5, 7), 10);
    return pos >= 20;
}

/**
 * Valida si una ubicación corresponde a zona auxiliar (picking)
 * @param {string} ubicacion - Código de ubicación
 * @returns {boolean} true si la posición es 10 o 14
 */
export function esZonaAuxiliar(ubicacion) {
    if (!ubicacion || ubicacion.length < 7) return false;
    const pos = ubicacion.substring(5, 7);
    return pos === '10' || pos === '14';
}

/**
 * Valida formato de código de ubicación
 * @param {string} ubicacion - Código a validar
 * @returns {boolean} true si el formato es válido (VXXYYPP)
 */
export function validarFormatoUbicacion(ubicacion) {
    const regex = /^V\d{2}\d{2}\d{2}$/;
    return regex.test(ubicacion);
}

// === MANIPULACIÓN DEL DOM ===
/**
 * Inicializa inputs de fecha con la fecha actual
 */
export function initDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

/**
 * Puebla un select con opciones de productos
 * @param {string} selectId - ID del elemento select
 */
export function populateProductosSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleccione Producto --</option>';
    state.productos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.codigo;
        option.textContent = `${p.codigo} - ${p.descripcion}`;
        select.appendChild(option);
    });
}

/**
 * Puebla un select con opciones de clientes
 * @param {string} selectId - ID del elemento select
 */
export function populateClientesSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleccione Cliente --</option>';
    state.clientes.forEach(c => {
        const option = document.createElement('option');
        option.value = c.nit;
        option.textContent = `${c.nit} - ${c.nombre}`;
        select.appendChild(option);
    });
}

/**
 * Puebla un select con opciones de proveedores
 * @param {string} selectId - ID del elemento select
 */
export function populateProveedoresSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleccione Proveedor --</option>';
    state.proveedores.forEach(p => {
        const option = document.createElement('option');
        option.value = p.nit;
        option.textContent = `${p.nit} - ${p.nombre}`;
        select.appendChild(option);
    });
}

// === CÁLCULOS ===
/**
 * Calcula el total de una línea de detalle (cantidad * precio unitario)
 * @param {number} cantidad - Cantidad de unidades
 * @param {number} precioUnitario - Precio por unidad
 * @returns {number} Total calculado
 */
export function calcularTotalLinea(cantidad, precioUnitario) {
    return (cantidad || 0) * (precioUnitario || 0);
}

/**
 * Calcula el subtotal de un array de items
 * @param {Array} items - Array de objetos con propiedades cantidad y precio
 * @returns {number} Subtotal calculado
 */
export function calcularSubtotal(items) {
    return items.reduce((sum, item) => {
        return sum + calcularTotalLinea(item.cantidad, item.precio || item.valor_venta);
    }, 0);
}

/**
 * Calcula el IVA sobre un monto base
 * @param {number} base - Monto base
 * @param {number} porcentaje - Porcentaje de IVA
 * @returns {number} Valor del IVA
 */
export function calcularIVA(base, porcentaje) {
    return (base || 0) * ((porcentaje || 0) / 100);
}
```


#### 3.3.3 Vistas a Mantener

**Vistas Críticas (Preservar Intactas):**

1. **montacarguista.js**
   - Consolidado diario de ventas
   - Identificación de productos en rack alto
   - Generación de hojas de descenso
   - Función: `window.loadMontacarguistaConsolidado()`

2. **picking.js**
   - Detalle de alistamiento por remisión
   - Asignación de ubicaciones y cantidades
   - Confirmación de picking
   - Funciones: `window.loadPickingDetalle()`, `window.confirmarPickingCompleto()`

3. **inventario.js**
   - Consulta de stock global
   - Consulta de stock por ubicación
   - Carga masiva de inventario
   - Descenso de montacargas
   - Funciones: `window.switchInvTab()`, `window.loadStockGlobal()`, etc.

4. **dashboard.js**
   - Resumen de operaciones
   - Estadísticas del día
   - Función: `window.loadDashboardStats()`

#### 3.3.4 Vistas a Evaluar para Eliminación

**Criterios de Evaluación:**
1. ¿Es redundante con otra vista?
2. ¿Es crítica para operaciones diarias?
3. ¿Puede su funcionalidad integrarse en otra vista?

**Vistas Candidatas:**

1. **catalogo.js** - Gestión de productos
   - Evaluación: Funcionalidad administrativa, no crítica para operaciones diarias
   - Decisión: MANTENER (gestión de maestros necesaria)

2. **compras.js** - Órdenes de compra
   - Evaluación: Funcionalidad administrativa, no crítica para picking
   - Decisión: MANTENER (necesaria para recepción de mercancía)

3. **ventas.js** - Remisiones de venta
   - Evaluación: Funcionalidad administrativa, genera remisiones para picking
   - Decisión: MANTENER (alimenta el flujo de picking)

4. **recibo.js** - Recibo de mercancía (IN)
   - Evaluación: Funcionalidad crítica para ingresos de inventario
   - Decisión: MANTENER (parte del flujo de inventario)

5. **despacho.js** - Despacho de mercancía (OUT)
   - Evaluación: Puede ser redundante con picking
   - Decisión: EVALUAR - Si solo registra salidas manuales, puede consolidarse

**Decisión Final de Vistas:**
- **MANTENER**: dashboard, montacarguista, picking, inventario, catalogo, compras, ventas, recibo
- **EVALUAR**: despacho (puede consolidarse con picking si es redundante)

### 3.4 Gestión de Estado (state.js)

**Diseño Propuesto:**

```javascript
export const state = {
    // Catálogos cargados en memoria
    clientes: [],
    proveedores: [],
    productos: [],
    stockPorUbicacion: [],
    
    // Estado de navegación
    currentView: 'dashboard',
    
    // Estado de picking (flujo crítico)
    currentPickingData: null,
    
    // Configuración
    config: {
        maxVolumeCelda: 5760000, // 5.76 m³ en cm³
        maxDimensiones: {
            alto: 200,  // cm
            largo: 240, // cm
            ancho: 120  // cm
        }
    }
};
```

### 3.5 Cliente API (api.js)

**Diseño Propuesto:**

```javascript
/**
 * Realiza una petición a la API REST
 * @param {string} endpoint - Ruta del endpoint (ej: '/productos')
 * @param {Object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise<any>} Respuesta parseada como JSON
 */
export async function fetchAPI(endpoint, options = {}) {
    const baseURL = 'http://localhost:3000/api';
    const url = `${baseURL}${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    if (finalOptions.body && typeof finalOptions.body === 'object') {
        finalOptions.body = JSON.stringify(finalOptions.body);
    }
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error en fetchAPI (${endpoint}):`, error);
        throw error;
    }
}
```


## 4. Modelo de Datos

### 4.1 Esquema de Base de Datos

**Tablas a Mantener:**

```sql
-- Catálogos
CREATE TABLE clientes (
    nit TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    correo TEXT
);

CREATE TABLE proveedores (
    nit TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    correo TEXT
);

CREATE TABLE productos (
    codigo TEXT PRIMARY KEY,
    descripcion TEXT NOT NULL,
    peso REAL,
    valor_venta REAL,
    marca TEXT,
    alto REAL,
    largo REAL,
    ancho REAL,
    unidad_compra TEXT DEFAULT 'Und',
    unidad_consumo TEXT DEFAULT 'Und'
);

-- Operaciones Comerciales
CREATE TABLE ordenes_compra (
    consecutivo TEXT PRIMARY KEY,
    fecha TEXT NOT NULL,
    proveedor_nit TEXT,
    observaciones TEXT,
    descuento REAL DEFAULT 0,
    iva REAL DEFAULT 0,
    retencion REAL DEFAULT 0,
    condiciones_envio TEXT,
    forma_pago TEXT,
    fecha_envio TEXT,
    items TEXT NOT NULL,
    FOREIGN KEY(proveedor_nit) REFERENCES proveedores(nit)
);

CREATE TABLE ventas (
    remision TEXT PRIMARY KEY,
    fecha TEXT NOT NULL,
    cliente_nit TEXT,
    observaciones TEXT,
    iva REAL DEFAULT 0,
    items TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente',
    auxiliar TEXT,
    FOREIGN KEY(cliente_nit) REFERENCES clientes(nit)
);

-- Inventario (CRÍTICO)
CREATE TABLE inventario_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_producto TEXT NOT NULL,
    tipo TEXT NOT NULL,
    documento_referencia TEXT,
    fecha TEXT NOT NULL,
    cantidad REAL NOT NULL,
    ubicacion TEXT NOT NULL,
    FOREIGN KEY(codigo_producto) REFERENCES productos(codigo)
);

-- Índices para optimización
CREATE INDEX idx_movimientos_producto 
    ON inventario_movimientos(codigo_producto);
    
CREATE INDEX idx_movimientos_ubicacion 
    ON inventario_movimientos(ubicacion);
    
CREATE INDEX idx_movimientos_referencia 
    ON inventario_movimientos(documento_referencia);
```

**Tabla a Eliminar:**
```sql
-- ordenes_servicio (OBSOLETA)
```

### 4.2 Reglas de Negocio de Volumetría

**Constantes:**
- Volumen máximo por celda: 5.76 m³ (5,760,000 cm³)
- Dimensiones máximas por producto:
  - Alto: 200 cm (2.0 m)
  - Largo: 240 cm (2.4 m)
  - Ancho: 120 cm (1.2 m)

**Validaciones:**
1. Antes de registrar un movimiento IN, validar que el producto no exceda dimensiones máximas
2. Antes de registrar un movimiento IN, validar que el volumen total de la ubicación no exceda el máximo
3. Cálculo de volumen: `cantidad × alto × largo × ancho`

## 5. Interfaces y Contratos

### 5.1 API REST

**Formato de Respuesta Estándar:**

```javascript
// Éxito
{
    "success": true,
    "data": { ... }
}

// Error
{
    "error": "Mensaje descriptivo del error"
}
```

**Endpoints Críticos (Flujo de Picking):**

```
GET /api/ventas/consolidado?fecha=YYYY-MM-DD
Response: [
    {
        remision: string,
        fecha: string,
        estado: string,
        cliente_nombre: string,
        total_items: number,
        total_unidades: number
    }
]

GET /api/ventas/picking?remision=XXX
Response: {
    remision: string,
    fecha: string,
    cliente_nombre: string,
    estado: string,
    auxiliar: string,
    items: [
        {
            codigo: string,
            descripcion: string,
            cantidad_solicitada: number,
            total_disponible: number,
            stock_auxiliar: number,
            stock_alta: number,
            ubicaciones: [
                { ubicacion: string, stock: number }
            ]
        }
    ]
}

POST /api/ventas/confirmar-picking
Body: {
    remision: string,
    auxiliar: string,
    itemsDespachados: [
        {
            codigo: string,
            ubicacion: string,
            cantidad: number
        }
    ]
}
Response: { success: true }

POST /api/inventario/descenso
Body: {
    codigo: string,
    cantidad: number
}
Response: {
    success: true,
    movimientos: [
        {
            codigo_producto: string,
            tipo: string,
            documento_referencia: string,
            fecha: string,
            cantidad: number,
            ubicacion: string
        }
    ]
}
```


## 6. Manejo de Errores

### 6.1 Estrategia de Manejo de Errores

**Servidor (server.js):**

```javascript
// Middleware centralizado de errores
function handleError(res, error, context = '') {
    console.error(`Error en ${context}:`, error);
    
    // Determinar código de estado
    const status = error.status || 500;
    
    // Mensaje de error
    const message = error.message || 'Error interno del servidor';
    
    // Responder con formato estándar
    sendJSON(res, status, { error: message });
}

// Uso en endpoints
try {
    const result = db.someOperation();
    sendJSON(res, 200, result);
} catch (err) {
    handleError(res, err, 'someOperation');
}
```

**Base de Datos (db.js):**

```javascript
// Errores de negocio con contexto
function validarDimensionesYVolumen(codigo_producto, cantidad, ubicacion) {
    const prod = db.prepare('SELECT * FROM productos WHERE codigo = ?').get(codigo_producto);
    
    if (!prod) {
        const error = new Error(
            `El producto con código "${codigo_producto}" no existe en el catálogo.`
        );
        error.status = 404;
        throw error;
    }
    
    if (prod.alto > 200 || prod.largo > 240 || prod.ancho > 120) {
        const error = new Error(
            `El producto "${codigo_producto}" excede las dimensiones máximas permitidas ` +
            `(alto: 2.0m, largo: 2.4m, ancho: 1.2m). ` +
            `Dimensiones del producto: alto ${prod.alto/100}m, largo ${prod.largo/100}m, ancho ${prod.ancho/100}m.`
        );
        error.status = 400;
        throw error;
    }
    
    // ... validación de volumen
}
```

**Cliente (api.js):**

```javascript
export async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error en fetchAPI (${endpoint}):`, error);
        
        // Mostrar error al usuario
        alert(`Error: ${error.message}`);
        
        throw error;
    }
}
```

### 6.2 Tipos de Errores

**Errores de Validación (400):**
- Parámetros faltantes o inválidos
- Datos que no cumplen reglas de negocio
- Formato de datos incorrecto

**Errores de Recurso No Encontrado (404):**
- Producto no existe
- Cliente no existe
- Remisión no encontrada

**Errores de Servidor (500):**
- Errores de base de datos
- Errores inesperados de lógica
- Errores de sistema

## 7. Seguridad

### 7.1 Medidas de Seguridad

**Prevención de Directory Traversal:**

```javascript
// En server.js
const publicDir = path.join(__dirname, 'client');
let filePath = path.join(publicDir, reqPath === '/' ? 'index.html' : reqPath);

// Validar que el path no escape del directorio público
if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
}
```

**Validación de Entrada:**

```javascript
// Validar formato de ubicación
function validarFormatoUbicacion(ubicacion) {
    const regex = /^V\d{2}\d{2}\d{2}$/;
    if (!regex.test(ubicacion)) {
        throw new Error('Formato de ubicación inválido. Debe ser VXXYYPP');
    }
}

// Validar tipos de datos
function validarMovimiento(body) {
    if (!body.codigo_producto || typeof body.codigo_producto !== 'string') {
        throw new Error('Código de producto inválido');
    }
    
    if (!body.cantidad || typeof body.cantidad !== 'number' || body.cantidad <= 0) {
        throw new Error('Cantidad inválida');
    }
    
    if (!['IN', 'OUT'].includes(body.tipo)) {
        throw new Error('Tipo de movimiento inválido');
    }
}
```

**CORS:**

```javascript
// Headers CORS para desarrollo local
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 7.2 Exclusiones de Repositorio

**Archivo .gitignore:**

```
# Dependencias
node_modules/

# Base de datos
db.sqlite
*.db

# Archivos temporales
*.tmp
*.log
.DS_Store
Thumbs.db

# Archivos de IDE
.vscode/
.idea/
*.swp
*.swo

# Archivos de sistema
*.bak
*~
```


## 8. Estrategia de Refactorización

### 8.1 Fases de Refactorización

**Fase 1: Eliminación de Código Obsoleto**
1. Eliminar archivo `client/js/views/servicios.js`
2. Remover imports de servicios en `app.js`
3. Eliminar referencias a vista "servicios" en navegación
4. Remover endpoint `/api/servicios` de `server.js`
5. Eliminar funciones de servicios en `db.js`
6. Remover tabla `ordenes_servicio` del script de inicialización
7. Verificar que el sistema arranca sin errores

**Fase 2: Consolidación de Funciones Duplicadas**
1. Identificar funciones duplicadas mediante análisis de código
2. Crear funciones consolidadas en `utils.js`:
   - `formatoMoneda()`
   - `formatoNumero()`
   - `esZonaMontacarguista()`
   - `esZonaAuxiliar()`
   - `validarFormatoUbicacion()`
   - `calcularTotalLinea()`
   - `calcularSubtotal()`
   - `calcularIVA()`
3. Reemplazar llamadas a funciones duplicadas con llamadas a funciones consolidadas
4. Eliminar funciones duplicadas de archivos individuales
5. Verificar que todas las vistas funcionan correctamente

**Fase 3: Evaluación y Limpieza de Vistas**
1. Analizar uso de cada vista
2. Identificar vistas redundantes
3. Decidir qué vistas mantener/eliminar
4. Actualizar menú de navegación
5. Remover imports de vistas eliminadas
6. Verificar navegación funcional

**Fase 4: Refactorización del Servidor**
1. Organizar endpoints en grupos lógicos con comentarios
2. Crear middleware de manejo de errores
3. Consolidar funciones auxiliares (`validateQueryParam`, etc.)
4. Eliminar código comentado obsoleto
5. Agregar comentarios descriptivos en lógica compleja
6. Verificar que todos los endpoints responden correctamente

**Fase 5: Refactorización de Base de Datos**
1. Eliminar tabla `ordenes_servicio`
2. Crear índices de optimización
3. Consolidar consultas de stock en función parametrizada
4. Agregar comentarios JSDoc en funciones públicas
5. Verificar que todas las operaciones de BD funcionan

**Fase 6: Optimización del Cliente**
1. Consolidar funciones de manipulación del DOM en `utils.js`
2. Eliminar variables globales innecesarias
3. Consolidar event listeners duplicados
4. Extraer validaciones de formularios en funciones reutilizables
5. Eliminar código muerto
6. Verificar que la UI funciona correctamente

**Fase 7: Validación del Flujo Crítico**
1. Probar vista montacarguista completa
2. Probar vista picking completa
3. Probar integración montacarguista → picking
4. Probar descenso de mercancía
5. Probar alistamiento en zona auxiliar
6. Probar confirmación de picking
7. Verificar actualización de inventario

**Fase 8: Preparación para Repositorio**
1. Crear archivo `.gitignore`
2. Actualizar `README.md` con estructura del proyecto
3. Eliminar archivos temporales
4. Verificar que solo archivos necesarios están incluidos
5. Realizar commit inicial

### 8.2 Criterios de Aceptación por Fase

**Fase 1 - Eliminación de Código Obsoleto:**
- ✓ Archivo servicios.js no existe
- ✓ No hay imports de servicios en app.js
- ✓ No hay referencias a "servicios" en navegación
- ✓ No hay endpoint /api/servicios en server.js
- ✓ No hay funciones de servicios en db.js
- ✓ No se crea tabla ordenes_servicio
- ✓ Sistema arranca sin errores

**Fase 2 - Consolidación de Funciones:**
- ✓ Funciones consolidadas existen en utils.js
- ✓ Funciones consolidadas tienen JSDoc
- ✓ No hay funciones duplicadas en vistas
- ✓ Todas las vistas usan funciones consolidadas
- ✓ Todas las vistas funcionan correctamente

**Fase 3 - Limpieza de Vistas:**
- ✓ Solo vistas activas están en el proyecto
- ✓ Menú de navegación refleja vistas activas
- ✓ No hay imports de vistas eliminadas
- ✓ Navegación funciona sin errores

**Fase 4 - Refactorización del Servidor:**
- ✓ Endpoints organizados con comentarios
- ✓ Middleware de errores implementado
- ✓ Funciones auxiliares consolidadas
- ✓ Sin código comentado obsoleto
- ✓ Todos los endpoints responden correctamente

**Fase 5 - Refactorización de BD:**
- ✓ Tabla ordenes_servicio eliminada
- ✓ Índices creados
- ✓ Consultas consolidadas
- ✓ Funciones documentadas con JSDoc
- ✓ Todas las operaciones funcionan

**Fase 6 - Optimización del Cliente:**
- ✓ Funciones DOM consolidadas
- ✓ Sin variables globales innecesarias
- ✓ Event listeners consolidados
- ✓ Validaciones centralizadas
- ✓ Sin código muerto
- ✓ UI funciona correctamente

**Fase 7 - Validación del Flujo Crítico:**
- ✓ Vista montacarguista funciona
- ✓ Vista picking funciona
- ✓ Integración montacarguista → picking funciona
- ✓ Descenso de mercancía funciona
- ✓ Alistamiento funciona
- ✓ Confirmación de picking funciona
- ✓ Inventario se actualiza correctamente

**Fase 8 - Preparación para Repositorio:**
- ✓ .gitignore existe y es correcto
- ✓ README.md actualizado
- ✓ Sin archivos temporales
- ✓ Solo archivos necesarios incluidos
- ✓ Commit inicial realizado


## 9. Consideraciones de Implementación

### 9.1 Lenguaje de Implementación

**JavaScript (ES6+)** para todo el proyecto:
- **Backend**: Node.js con módulos nativos (http, fs, path)
- **Frontend**: JavaScript Vanilla con módulos ES6
- **Base de Datos**: SQLite con node:sqlite (DatabaseSync)

### 9.2 Dependencias

**Dependencias de Producción:**
```json
{
  "dependencies": {
    // Node.js nativo - sin dependencias externas
  }
}
```

El sistema utiliza únicamente módulos nativos de Node.js, sin dependencias externas de npm.

### 9.3 Compatibilidad

**Navegadores Soportados:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Node.js:**
- Versión mínima: 18.x (para soporte de DatabaseSync)

### 9.4 Estructura de Archivos Resultante

```
habitad-wms/
├── .gitignore                    # Nuevo
├── README.md                     # Actualizado
├── package.json                  
├── server.js                     # Refactorizado
├── db.js                         # Refactorizado y optimizado
└── client/
    ├── index.html                
    ├── index.css                 
    ├── app.js                    # Limpio, sin servicios
    └── js/
        ├── api.js                # Sin cambios mayores
        ├── state.js              # Sin cambios mayores
        ├── utils.js              # Expandido con funciones consolidadas
        └── views/
            ├── dashboard.js      # Mantenido
            ├── montacarguista.js # PRESERVADO (crítico)
            ├── picking.js        # PRESERVADO (crítico)
            ├── inventario.js     # PRESERVADO (crítico)
            ├── catalogo.js       # Mantenido
            ├── compras.js        # Mantenido
            ├── ventas.js         # Mantenido
            └── recibo.js         # Mantenido
```

### 9.5 Documentación del Código

**Estándar JSDoc para Funciones Públicas:**

```javascript
/**
 * Descripción breve de la función
 * 
 * @param {tipo} nombreParam - Descripción del parámetro
 * @returns {tipo} Descripción del valor de retorno
 * @throws {Error} Descripción de cuándo se lanza error
 * 
 * @example
 * const resultado = miFuncion(param1, param2);
 */
```

**Comentarios en Lógica Compleja:**

```javascript
// === SECCIÓN PRINCIPAL ===
// Descripción de qué hace esta sección

// Paso 1: Descripción del paso
const resultado1 = operacion1();

// Paso 2: Descripción del paso
const resultado2 = operacion2(resultado1);
```

### 9.6 Convenciones de Código

**Nombres:**
- Variables y funciones: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Clases: `PascalCase`
- Archivos: `kebab-case.js`

**Formato:**
- Indentación: 4 espacios
- Comillas: simples para strings
- Punto y coma: obligatorio
- Longitud de línea: máximo 100 caracteres (recomendado)

**Organización de Imports:**
```javascript
// 1. Módulos nativos de Node.js
const http = require('http');
const fs = require('fs');

// 2. Módulos locales
const db = require('./db.js');

// 3. Imports ES6 (frontend)
import { state } from './js/state.js';
import { fetchAPI } from './js/api.js';
```


## 10. Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema—esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquinas.*

### Reflexión sobre Propiedades

Después de analizar los criterios de aceptación, se identificaron las siguientes propiedades testeables mediante property-based testing:

**Propiedades Identificadas Inicialmente:**
1. Equivalencia funcional de funciones consolidadas (Req 2.8)
2. Regresión del servidor después de refactorización (Req 4.7)
3. Regresión del cliente después de refactorización (Req 5.7)
4. Equivalencia de consultas optimizadas (Req 6.6)

**Análisis de Redundancia:**

- **Propiedad 2 y 3** (regresión de servidor y cliente) son esencialmente la misma propiedad aplicada a diferentes capas: "el comportamiento del sistema debe ser idéntico antes y después de la refactorización". Estas pueden consolidarse en una propiedad más general de **regresión del sistema completo**.

- **Propiedad 1** (equivalencia de funciones consolidadas) es un caso específico de la propiedad de regresión, pero es valiosa mantenerla separada porque permite testing unitario más granular de las funciones utilitarias.

- **Propiedad 4** (equivalencia de consultas) también es un caso específico de regresión, pero a nivel de base de datos. Es valiosa mantenerla separada para testing de la capa de datos.

**Decisión Final:**
Mantener las 4 propiedades, ya que cada una proporciona valor único:
- Propiedad 1: Testing unitario de utilidades
- Propiedad 2: Testing de regresión de API/servidor
- Propiedad 3: Testing de regresión de UI/cliente
- Propiedad 4: Testing de regresión de consultas de BD

### Propiedad 1: Equivalencia Funcional de Funciones Consolidadas

*Para cualquier* función consolidada en utils.js y cualquier conjunto de inputs válidos, el resultado de la función consolidada debe ser idéntico al resultado de las funciones originales duplicadas que reemplaza.

**Valida: Requisitos 2.8**

**Ejemplos de Funciones a Validar:**
- `formatoMoneda(valor)` debe producir el mismo formato que las implementaciones originales
- `calcularTotalLinea(cantidad, precio)` debe producir el mismo cálculo
- `calcularSubtotal(items)` debe producir el mismo total
- `esZonaMontacarguista(ubicacion)` debe clasificar ubicaciones igual que antes
- `validarFormatoUbicacion(ubicacion)` debe validar con los mismos criterios

### Propiedad 2: Regresión del Servidor Después de Refactorización

*Para cualquier* petición HTTP válida (GET o POST) a cualquier endpoint activo del servidor, la respuesta del servidor refactorizado debe ser funcionalmente equivalente a la respuesta del servidor original (mismo código de estado, misma estructura de datos, mismos valores).

**Valida: Requisitos 4.7**

**Endpoints Críticos a Validar:**
- GET /api/clientes
- GET /api/productos
- GET /api/inventario/stock
- GET /api/ventas/consolidado?fecha=X
- GET /api/ventas/picking?remision=X
- POST /api/ventas/confirmar-picking
- POST /api/inventario/descenso

### Propiedad 3: Regresión del Cliente Después de Refactorización

*Para cualquier* interacción válida del usuario con la interfaz (navegación entre vistas, envío de formularios, clicks en botones), el comportamiento observable del cliente refactorizado debe ser idéntico al comportamiento del cliente original (mismas vistas cargadas, mismos datos mostrados, mismas validaciones aplicadas).

**Valida: Requisitos 5.7**

**Interacciones Críticas a Validar:**
- Navegación entre vistas activas
- Carga de datos en tablas
- Envío de formularios
- Validaciones de campos
- Cálculos de totales en tiempo real
- Población de selects con datos

### Propiedad 4: Equivalencia de Consultas Optimizadas

*Para cualquier* consulta SQL optimizada en db.js y cualquier conjunto de parámetros válidos, el conjunto de resultados retornado por la consulta optimizada debe ser idéntico (mismo número de filas, mismos valores en cada columna) al conjunto de resultados de la consulta original.

**Valida: Requisitos 6.6**

**Consultas Críticas a Validar:**
- Consultas de stock por producto
- Consultas de stock por ubicación
- Consultas de movimientos por referencia
- Consultas de consolidado diario
- Consultas de picking por remisión


## 11. Estrategia de Testing

### 11.1 Tipos de Tests

**Property-Based Tests (PBT):**
- Validar propiedades universales con inputs generados aleatoriamente
- Mínimo 100 iteraciones por propiedad
- Enfoque en equivalencia funcional antes/después de refactorización

**Integration Tests:**
- Validar flujo crítico completo (montacarguista → picking)
- Validar endpoints REST con datos reales
- Validar navegación entre vistas

**Smoke Tests:**
- Validar que el servidor arranca sin errores
- Validar que todas las vistas cargan sin errores de consola
- Validar conexión a base de datos

**Example-Based Unit Tests:**
- Validar casos específicos de validación
- Validar casos de error conocidos
- Validar edge cases de lógica de negocio

### 11.2 Estrategia de Testing por Fase

**Fase 1 - Eliminación de Código Obsoleto:**
- Smoke test: servidor arranca sin errores
- Example test: archivo servicios.js no existe
- Example test: no hay referencias a servicios en código

**Fase 2 - Consolidación de Funciones:**
- Property test: equivalencia funcional de funciones consolidadas
- Example test: funciones duplicadas eliminadas
- Integration test: todas las vistas funcionan

**Fase 3 - Limpieza de Vistas:**
- Example test: solo vistas activas existen
- Integration test: navegación funciona
- Smoke test: todas las vistas cargan sin errores

**Fase 4 - Refactorización del Servidor:**
- Property test: regresión del servidor
- Integration test: todos los endpoints responden
- Example test: middleware de errores funciona

**Fase 5 - Refactorización de BD:**
- Property test: equivalencia de consultas
- Example test: índices creados
- Integration test: operaciones de BD funcionan

**Fase 6 - Optimización del Cliente:**
- Property test: regresión del cliente
- Example test: código muerto eliminado
- Integration test: UI funciona correctamente

**Fase 7 - Validación del Flujo Crítico:**
- Integration test: flujo completo montacarguista → picking
- Integration test: descenso de mercancía
- Integration test: confirmación de picking

**Fase 8 - Preparación para Repositorio:**
- Example test: .gitignore existe y es correcto
- Example test: README.md actualizado
- Example test: solo archivos necesarios incluidos

### 11.3 Configuración de Property-Based Testing

**Generadores de Datos:**

```javascript
// Generador de valores monetarios
function genMoneda() {
    return Math.random() * 1000000;
}

// Generador de cantidades
function genCantidad() {
    return Math.floor(Math.random() * 1000) + 1;
}

// Generador de códigos de ubicación
function genUbicacion() {
    const vano = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
    const nivel = String(Math.floor(Math.random() * 40) + 1).padStart(2, '0');
    const pos = String(Math.floor(Math.random() * 50) + 10).padStart(2, '0');
    return `V${vano}${nivel}${pos}`;
}

// Generador de items de venta
function genItems() {
    const numItems = Math.floor(Math.random() * 10) + 1;
    return Array.from({ length: numItems }, () => ({
        codigo: `PROD${Math.floor(Math.random() * 1000)}`,
        cantidad: genCantidad(),
        precio: genMoneda()
    }));
}
```

**Ejemplo de Property Test:**

```javascript
// Test de equivalencia de formatoMoneda
for (let i = 0; i < 100; i++) {
    const valor = genMoneda();
    const resultadoNuevo = formatoMoneda(valor);
    const resultadoOriginal = formatoMonedaOriginal(valor);
    
    assert.strictEqual(
        resultadoNuevo, 
        resultadoOriginal,
        `formatoMoneda(${valor}) debe producir el mismo resultado`
    );
}
```

### 11.4 Criterios de Éxito de Testing

**Criterios Mínimos:**
- ✓ Todos los smoke tests pasan
- ✓ Todos los property tests pasan (100 iteraciones cada uno)
- ✓ Todos los integration tests del flujo crítico pasan
- ✓ No hay errores de consola en navegador
- ✓ No hay errores de consola en servidor

**Criterios Deseables:**
- ✓ Cobertura de código > 80% en funciones críticas
- ✓ Todos los endpoints REST validados
- ✓ Todas las vistas validadas
- ✓ Documentación de tests actualizada


## 12. Plan de Rollback

### 12.1 Estrategia de Rollback

En caso de que la refactorización introduzca errores críticos que no puedan resolverse rápidamente:

**Paso 1: Identificar el Problema**
- Determinar qué fase de refactorización causó el problema
- Documentar el error específico y cómo reproducirlo

**Paso 2: Rollback por Fase**
- Usar Git para revertir a un commit anterior estable
- Cada fase debe tener su propio commit para facilitar rollback granular

**Paso 3: Análisis Post-Rollback**
- Analizar qué salió mal
- Ajustar el diseño o implementación
- Reintentar la fase problemática

### 12.2 Commits por Fase

```bash
# Fase 1
git commit -m "Fase 1: Eliminar código obsoleto de servicios"

# Fase 2
git commit -m "Fase 2: Consolidar funciones duplicadas en utils.js"

# Fase 3
git commit -m "Fase 3: Limpiar vistas redundantes"

# Fase 4
git commit -m "Fase 4: Refactorizar servidor con middleware de errores"

# Fase 5
git commit -m "Fase 5: Optimizar consultas de base de datos"

# Fase 6
git commit -m "Fase 6: Optimizar código del cliente"

# Fase 7
git commit -m "Fase 7: Validar flujo crítico completo"

# Fase 8
git commit -m "Fase 8: Preparar para repositorio con .gitignore y README"
```

### 12.3 Backup de Base de Datos

Antes de iniciar la refactorización:

```bash
# Crear backup de la base de datos
cp db.sqlite db.sqlite.backup

# Después de validar que todo funciona, el backup puede eliminarse
```

## 13. Métricas de Éxito

### 13.1 Métricas Cuantitativas

**Reducción de Código:**
- Líneas de código eliminadas: objetivo > 500 líneas
- Funciones duplicadas eliminadas: objetivo > 10 funciones
- Archivos eliminados: objetivo > 2 archivos

**Consolidación:**
- Funciones consolidadas en utils.js: objetivo > 8 funciones
- Vistas activas: objetivo ≤ 8 vistas

**Calidad:**
- Errores de consola: 0
- Warnings de consola: 0
- Tests pasando: 100%

### 13.2 Métricas Cualitativas

**Mantenibilidad:**
- ✓ Código más fácil de entender
- ✓ Funciones bien documentadas con JSDoc
- ✓ Estructura de archivos clara
- ✓ Separación de responsabilidades mejorada

**Funcionalidad:**
- ✓ Flujo crítico funciona perfectamente
- ✓ Todas las operaciones de inventario funcionan
- ✓ Todas las vistas cargan correctamente
- ✓ No hay regresiones funcionales

**Preparación para Producción:**
- ✓ Código listo para repositorio
- ✓ Documentación actualizada
- ✓ Sin archivos innecesarios
- ✓ .gitignore configurado correctamente

## 14. Riesgos y Mitigaciones

### 14.1 Riesgos Identificados

**Riesgo 1: Romper el Flujo Crítico**
- **Probabilidad**: Media
- **Impacto**: Alto
- **Mitigación**: 
  - Validar flujo crítico después de cada fase
  - Mantener tests de integración del flujo completo
  - Hacer commits granulares para facilitar rollback

**Riesgo 2: Introducir Regresiones Funcionales**
- **Probabilidad**: Media
- **Impacto**: Medio
- **Mitigación**:
  - Usar property-based testing para validar equivalencia
  - Ejecutar suite completa de tests después de cada fase
  - Validar manualmente operaciones críticas

**Riesgo 3: Eliminar Código Necesario**
- **Probabilidad**: Baja
- **Impacto**: Medio
- **Mitigación**:
  - Analizar dependencias antes de eliminar código
  - Buscar referencias en todo el proyecto
  - Mantener backup antes de eliminar

**Riesgo 4: Problemas de Performance**
- **Probabilidad**: Baja
- **Impacto**: Bajo
- **Mitigación**:
  - Medir tiempos de respuesta antes y después
  - Optimizar consultas con índices
  - Validar que operaciones críticas son rápidas

### 14.2 Plan de Contingencia

Si se detecta un problema crítico:

1. **Detener la refactorización inmediatamente**
2. **Evaluar la severidad del problema**
3. **Si es crítico**: hacer rollback al último commit estable
4. **Si es menor**: documentar y continuar, resolver después
5. **Analizar causa raíz**
6. **Ajustar diseño si es necesario**
7. **Reintentar con precaución**

## 15. Conclusiones

Este diseño técnico proporciona una guía completa para la limpieza y optimización del código del sistema WMS habitad-wms. La estrategia de refactorización por fases permite un progreso incremental y seguro, con validación continua del flujo crítico de operaciones.

**Puntos Clave:**

1. **Preservación del Flujo Crítico**: El flujo montacarguista → picking se mantiene intacto y se valida después de cada fase.

2. **Consolidación Inteligente**: Las funciones duplicadas se consolidan en módulos reutilizables sin cambiar su comportamiento.

3. **Eliminación Segura**: El código obsoleto se elimina de forma sistemática con validación en cada paso.

4. **Optimización Medida**: Las optimizaciones de base de datos y servidor se validan mediante property-based testing.

5. **Preparación para Producción**: El código resultante está listo para repositorio con documentación actualizada y estructura clara.

**Próximos Pasos:**

1. Revisar y aprobar este diseño
2. Crear backup de la base de datos
3. Iniciar Fase 1: Eliminación de código obsoleto
4. Proceder fase por fase con validación continua
5. Realizar commit final y push al repositorio

