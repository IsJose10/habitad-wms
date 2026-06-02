# Documento de Funciones Duplicadas Identificadas

**Fecha de Análisis:** 2025-01-XX  
**Tarea:** 2.1 Identificar y documentar funciones duplicadas  
**Requisito:** 2.1 - Consolidación de Funciones Duplicadas

## Resumen Ejecutivo

Este documento presenta el análisis completo de funciones duplicadas encontradas en los archivos de la carpeta `client/js/views/`. Se identificaron **múltiples funciones con lógica idéntica o muy similar** que deben consolidarse en el módulo `utils.js` para mejorar la mantenibilidad del código.

### Archivos Analizados
1. `catalogo.js` - Gestión de productos, clientes y proveedores
2. `compras.js` - Órdenes de compra
3. `dashboard.js` - Panel de control
4. `despacho.js` - Salidas manuales
5. `inventario.js` - Gestión de inventario
6. `montacarguista.js` - Consolidado y descenso (CRÍTICO)
7. `picking.js` - Alistamiento (CRÍTICO)
8. `recibo.js` - Recepción de mercancía
9. `ventas.js` - Remisiones de venta

---

## 1. FUNCIONES DE FORMATEO

### 1.1 Formateo de Moneda

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `formatoMoneda(valor)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 3-5) - **FUNCIÓN CONSOLIDADA**
- ✅ Importada correctamente en: `catalogo.js`, `compras.js`, `inventario.js`, `recibo.js`, `ventas.js`

**Acción requerida:** Ninguna - Ya está consolidada y en uso.

---

### 1.2 Formateo de Números con Separadores

**Estado:** ⚠️ NO EXISTE - DEBE CREARSE

**Función propuesta:** `formatoNumero(valor)`

**Descripción:** Formatea números con separadores de miles sin símbolo de moneda.

**Uso actual:** No se usa explícitamente, pero sería útil para mostrar cantidades.

**Implementación sugerida:**
```javascript
export function formatoNumero(valor) {
    return new Intl.NumberFormat('es-CO').format(valor || 0);
}
```

**Acción requerida:** Crear función en `utils.js` para uso futuro.

---

## 2. FUNCIONES DE VALIDACIÓN

### 2.1 Validación de Ubicaciones - Zona Montacarguista

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `esZonaMontacarguista(ubicacion)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 145-147) - **FUNCIÓN CONSOLIDADA**
- ✅ Importada correctamente en: `picking.js`

**Lógica:** Verifica si la posición es >= 20 (rack alto)

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 2.2 Validación de Ubicaciones - Zona Auxiliar

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `esZonaAuxiliar(ubicacion)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 149-152) - **FUNCIÓN CONSOLIDADA**

**Lógica:** Verifica si la posición está entre 10 y 19 (zona de picking)

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 2.3 Validación de Formato de Ubicación

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `validarUbicacion(code)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 227-234) - **FUNCIÓN CONSOLIDADA**
- ✅ Usada en: `inventario.js`, `recibo.js`

**Lógica:** Valida formato VXXYYPP y verifica que vano, nivel y posición sean válidos

**Acción requerida:** Ninguna - Ya está consolidada.

---

## 3. FUNCIONES DE CÁLCULOS

### 3.1 Cálculo de Total de Línea (Cantidad × Precio)

**Estado:** ❌ DUPLICADA - DEBE CONSOLIDARSE

**Función:** Cálculo de `cantidad * precio_unitario`

**Ubicaciones con lógica duplicada:**

1. **compras.js** (línea 88-91):
```javascript
export function calcularTotalesOC() {
    rows.forEach(row => {
        const qty = Number(row.querySelector('.oc-item-qty').value) || 0;
        const unit = Number(row.querySelector('.oc-item-unit').value) || 0;
        const total = qty * unit;  // ← DUPLICADO
        subtotal += total;
    });
}
```

2. **ventas.js** (línea 68-71):
```javascript
export function calcularTotalesVenta() {
    rows.forEach(row => {
        const qty = Number(row.querySelector('.venta-item-qty').value) || 0;
        const unit = Number(row.querySelector('.venta-item-unit').value) || 0;
        const total = qty * unit;  // ← DUPLICADO
        subtotal += total;
    });
}
```

**Función consolidada propuesta:**
```javascript
/**
 * Calcula el total de una línea de detalle (cantidad × precio unitario)
 * @param {number} cantidad - Cantidad de unidades
 * @param {number} precioUnitario - Precio por unidad
 * @returns {number} Total calculado
 */
export function calcularTotalLinea(cantidad, precioUnitario) {
    return (cantidad || 0) * (precioUnitario || 0);
}
```

**Acción requerida:** 
- Crear función en `utils.js`
- Reemplazar cálculos inline en `compras.js` y `ventas.js`

---
### 3.2 Cálculo de Subtotal de Items

**Estado:** ❌ DUPLICADA - DEBE CONSOLIDARSE

**Función:** Suma de totales de múltiples líneas

**Ubicaciones con lógica duplicada:**

1. **compras.js** (línea 88-95):
```javascript
export function calcularTotalesOC() {
    let subtotal = 0;
    rows.forEach(row => {
        const qty = Number(row.querySelector('.oc-item-qty').value) || 0;
        const unit = Number(row.querySelector('.oc-item-unit').value) || 0;
        const total = qty * unit;
        subtotal += total;  // ← DUPLICADO
    });
}
```

2. **ventas.js** (línea 68-75):
```javascript
export function calcularTotalesVenta() {
    let subtotal = 0;
    rows.forEach(row => {
        const qty = Number(row.querySelector('.venta-item-qty').value) || 0;
        const unit = Number(row.querySelector('.venta-item-unit').value) || 0;
        const total = qty * unit;
        subtotal += total;  // ← DUPLICADO
    });
}
```

**Función consolidada propuesta:**
```javascript
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
```

**Acción requerida:** 
- Crear función en `utils.js`
- Refactorizar `calcularTotalesOC()` y `calcularTotalesVenta()` para usar esta función

---

### 3.3 Cálculo de IVA

**Estado:** ❌ DUPLICADA - DEBE CONSOLIDARSE

**Función:** Cálculo de IVA sobre base imponible

**Ubicaciones con lógica duplicada:**

1. **compras.js** (línea 97-99):
```javascript
const ivaPct = Number(document.getElementById('oc-iva').value) || 0;
const baseIVA = Math.max(0, subtotal - descuento);
const valorIVA = baseIVA * (ivaPct / 100);  // ← DUPLICADO
```

2. **ventas.js** (línea 77-78):
```javascript
const ivaPct = Number(document.getElementById('venta-iva').value) || 0;
const valorIVA = subtotal * (ivaPct / 100);  // ← DUPLICADO
```

**Función consolidada propuesta:**
```javascript
/**
 * Calcula el IVA sobre un monto base
 * @param {number} base - Monto base
 * @param {number} porcentaje - Porcentaje de IVA (ej: 19)
 * @returns {number} Valor del IVA
 */
export function calcularIVA(base, porcentaje) {
    return (base || 0) * ((porcentaje || 0) / 100);
}
```

**Acción requerida:** 
- Crear función en `utils.js`
- Reemplazar cálculos inline en `compras.js` y `ventas.js`

---

### 3.4 Cálculo de Volumen Ocupado

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `calcularVolumenOcupadoCliente(ubicacion)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 189-202) - **FUNCIÓN CONSOLIDADA**
- ✅ Importada en: `inventario.js`

**Lógica:** Calcula volumen total ocupado en una ubicación (cantidad × alto × largo × ancho)

**Acción requerida:** Ninguna - Ya está consolidada.

---

## 4. FUNCIONES DE MANIPULACIÓN DEL DOM

### 4.1 Inicialización de Inputs de Fecha

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `initDateInputs()`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 236-242) - **FUNCIÓN CONSOLIDADA**
- ✅ Usada en: `compras.js`, `ventas.js`, `recibo.js`

**Lógica:** Establece la fecha actual en todos los inputs de tipo date

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 4.2 Población de Select de Productos

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `populateProductosSelect(selectId)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 154-160) - **FUNCIÓN CONSOLIDADA**

**Lógica:** Llena un select con opciones de productos desde `state.productos`

**Acción requerida:** Ninguna - Ya está consolidada.

---
### 4.3 Población de Select de Clientes

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `populateClientesSelect(selectId)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 162-168) - **FUNCIÓN CONSOLIDADA**

**Lógica:** Llena un select con opciones de clientes desde `state.clientes`

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 4.4 Población de Select de Proveedores

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `populateProveedoresSelect(selectId)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 170-176) - **FUNCIÓN CONSOLIDADA**

**Lógica:** Llena un select con opciones de proveedores desde `state.proveedores`

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 4.5 Generación de HTML para Selector de Ubicación

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `ubicacionSelectorHTML(prefix, currentVal)` / `ubiSelectorHTML(prefix, currentVal)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 178-187, 189-202) - **FUNCIÓN CONSOLIDADA**
- ✅ Usada en: `recibo.js`

**Lógica:** Genera HTML para selector de ubicación con 3 dropdowns (vano, nivel, posición)

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 4.6 Limpieza de Formularios

**Estado:** ❌ DUPLICADA - PATRÓN REPETIDO

**Función:** Funciones `limpiarForm*()` en múltiples archivos

**Ubicaciones con lógica similar:**

1. **catalogo.js**:
   - `limpiarFormProducto()` (línea 28-40)
   - `limpiarFormCliente()` (línea 107-113)
   - `limpiarFormProveedor()` (línea 169-175)

2. **compras.js**:
   - `limpiarFormOC()` (línea 115-128)

3. **ventas.js**:
   - `limpiarFormVenta()` (línea 51-63)

4. **recibo.js**:
   - `limpiarFormRecibo()` (línea 145-155)

**Patrón común:**
- Resetear valores de inputs a vacío o valores por defecto
- Limpiar tablas de items
- Reinicializar fechas con `initDateInputs()`

**Análisis:** Estas funciones son específicas de cada formulario y NO deben consolidarse porque:
- Cada una maneja campos específicos de su contexto
- La lógica de limpieza varía según el formulario
- Consolidarlas haría el código más complejo sin beneficio real

**Acción requerida:** NINGUNA - Mantener funciones específicas por formulario.

---
### 4.7 Agregar Fila de Item a Tabla

**Estado:** ❌ DUPLICADA - PATRÓN REPETIDO

**Función:** Funciones `agregarFilaItem*()` en múltiples archivos

**Ubicaciones con lógica similar:**

1. **compras.js**:
   - `agregarFilaItemOC(item)` (línea 11-45)

2. **ventas.js**:
   - `agregarFilaItemVenta(item)` (línea 5-31)

**Patrón común:**
- Incrementar contador de filas
- Crear elemento `<tr>` con ID único
- Generar HTML con selects de productos y inputs de cantidad/precio
- Agregar botón de eliminar
- Llamar a función de cálculo de totales

**Análisis:** Estas funciones son específicas de cada contexto (OC vs Venta) y NO deben consolidarse porque:
- Los campos y estructura HTML son diferentes
- Los IDs y clases CSS son específicos de cada tabla
- Las funciones de callback son diferentes

**Acción requerida:** NINGUNA - Mantener funciones específicas por contexto.

---

### 4.8 Eliminar Fila de Item de Tabla

**Estado:** ❌ DUPLICADA - PATRÓN REPETIDO

**Función:** Funciones `eliminarFilaItem*()` en múltiples archivos

**Ubicaciones con lógica similar:**

1. **compras.js**:
   - `eliminarFilaItemOC(rowId)` (línea 47-56)

2. **ventas.js**:
   - `eliminarFilaItemVenta(rowId)` (línea 33-42)

**Patrón común:**
- Buscar fila por ID
- Eliminar fila del DOM
- Renumerar filas restantes
- Recalcular totales

**Análisis:** Similar al caso anterior, estas funciones son específicas de cada contexto.

**Acción requerida:** NINGUNA - Mantener funciones específicas por contexto.

---

## 5. FUNCIONES DE BÚSQUEDA Y FILTRADO

### 5.1 Búsqueda de Proveedor por NIT o Nombre

**Estado:** ❌ DUPLICADA - DEBE CONSOLIDARSE

**Función:** `findProveedorNit(terceroText)`

**Ubicaciones:**
- **compras.js** (línea 267-282) - Función local no exportada

**Lógica:**
1. Buscar coincidencia exacta por nombre (normalizado)
2. Buscar coincidencia exacta por NIT
3. Buscar coincidencia parcial por nombre
4. Retornar texto original si no se encuentra

**Función consolidada propuesta:**
```javascript
/**
 * Busca un proveedor por NIT o nombre (con coincidencia flexible)
 * @param {string} terceroText - Texto a buscar (NIT o nombre)
 * @returns {string} NIT del proveedor encontrado o texto original
 */
export function buscarProveedorNit(terceroText) {
    if (!terceroText) return '';
    const norm = terceroText.trim().toLowerCase();
    
    // Coincidencia exacta por nombre
    let match = state.proveedores.find(p => p.nombre.trim().toLowerCase() === norm);
    if (match) return match.nit;
    
    // Coincidencia exacta por NIT
    match = state.proveedores.find(p => p.nit === terceroText.trim());
    if (match) return match.nit;
    
    // Coincidencia parcial por nombre
    match = state.proveedores.find(p => 
        p.nombre.toLowerCase().includes(norm) || 
        norm.includes(p.nombre.toLowerCase())
    );
    if (match) return match.nit;
    
    return terceroText.trim();
}
```

**Acción requerida:** 
- Crear función en `utils.js`
- Reemplazar función local en `compras.js`

---
### 5.2 Búsqueda de Producto por Código

**Estado:** ❌ DUPLICADA - DEBE CONSOLIDARSE

**Función:** `findProductByCode(codeText)`

**Ubicaciones:**
- **compras.js** (línea 284-298) - Función local no exportada

**Lógica:**
1. Buscar coincidencia exacta por código
2. Si el código es numérico, intentar con padding de 5 dígitos (ej: "32" → "00032")
3. Retornar null si no se encuentra

**Función consolidada propuesta:**
```javascript
/**
 * Busca un producto por código (con padding automático para códigos numéricos)
 * @param {string} codeText - Código del producto a buscar
 * @returns {Object|null} Producto encontrado o null
 */
export function buscarProductoPorCodigo(codeText) {
    if (!codeText) return null;
    const cleanCode = String(codeText).trim();
    
    // Coincidencia exacta
    let prod = state.productos.find(p => p.codigo === cleanCode);
    if (prod) return prod;
    
    // Si es numérico, intentar con padding de 5 dígitos
    if (/^\d+$/.test(cleanCode)) {
        const padded5 = cleanCode.padStart(5, '0');
        prod = state.productos.find(p => p.codigo === padded5);
        if (prod) return prod;
    }
    
    return null;
}
```

**Acción requerida:** 
- Crear función en `utils.js`
- Reemplazar función local en `compras.js`

---

### 5.3 Filtrado de Stock Global

**Estado:** ⚠️ ESPECÍFICA - NO CONSOLIDAR

**Función:** `filterStockGlobal()`

**Ubicaciones:**
- **inventario.js** (línea 36-47)

**Lógica:** Filtra productos en tabla de stock por código, descripción o marca

**Análisis:** Esta función es específica del contexto de inventario y trabaja directamente con el DOM de esa vista.

**Acción requerida:** NINGUNA - Mantener en `inventario.js`.

---

## 6. FUNCIONES DE PROCESAMIENTO DE ARCHIVOS CSV/EXCEL

### 6.1 Lectura y Parseo de Excel/CSV

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `readExcelOrCSV(file, aliasMap, callback)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 95-143) - **FUNCIÓN CONSOLIDADA**
- ✅ Importada en: `catalogo.js`, `compras.js`, `inventario.js`

**Lógica:** Lee archivos Excel o CSV, detecta encabezados automáticamente, mapea columnas

**Acción requerida:** Ninguna - Ya está consolidada.

---

### 6.2 Parseo de Números desde String

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `parseNumberString(value)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 7-35) - **FUNCIÓN CONSOLIDADA**
- ✅ Importada en: `catalogo.js`, `compras.js`, `inventario.js`

**Lógica:** Convierte strings con formato de número (con comas, puntos, símbolos) a número

**Acción requerida:** Ninguna - Ya está consolidada.

---
### 6.3 Formateo de Fechas desde Excel

**Estado:** ✅ YA CONSOLIDADA en `utils.js`

**Función:** `formatExcelDate(value)`

**Ubicaciones actuales:**
- ✅ `utils.js` (línea 37-73) - **FUNCIÓN CONSOLIDADA**
- ✅ Importada en: `compras.js`

**Lógica:** Convierte fechas de Excel (número serial) o strings a formato YYYY-MM-DD

**Acción requerida:** Ninguna - Ya está consolidada.

---

## 7. FUNCIONES DE GESTIÓN DE TABS

### 7.1 Cambio de Tabs en Formularios

**Estado:** ❌ DUPLICADA - PATRÓN REPETIDO

**Función:** Funciones `switch*Tab(tab)` en múltiples archivos

**Ubicaciones con lógica similar:**

1. **catalogo.js**:
   - `switchProdTab(tab)` (línea 96-109)
   - `switchProvTab(tab)` (línea 267-280)

2. **compras.js**:
   - `switchOCTab(tab)` (línea 177-193)

3. **inventario.js**:
   - `switchInvTab(tab)` (línea 68-82)

**Patrón común:**
- Mostrar/ocultar paneles según tab seleccionado
- Cambiar clases CSS de botones (btn-primary / btn-secondary)
- Ejecutar funciones de carga específicas del tab

**Análisis:** Estas funciones son específicas de cada contexto y NO deben consolidarse porque:
- Los IDs de elementos son diferentes en cada vista
- Las acciones al cambiar de tab son específicas de cada contexto
- Consolidarlas requeriría pasar muchos parámetros y haría el código más complejo

**Acción requerida:** NINGUNA - Mantener funciones específicas por contexto.

---

## 8. FUNCIONES DE CARGA DE DATOS

### 8.1 Carga de Listas desde API

**Estado:** ⚠️ PATRÓN REPETIDO - NO CONSOLIDAR

**Función:** Funciones `load*()` en múltiples archivos

**Ubicaciones:**
- `catalogo.js`: `loadProductos()`, `loadClientes()`, `loadProveedores()`
- `compras.js`: `loadOCHistorial()`
- `dashboard.js`: `loadDashboardStats()`
- `despacho.js`: `loadMovimientosRecientes()`
- `inventario.js`: `loadStockGlobal()`
- `montacarguista.js`: `loadMontacarguistaConsolidado()`

**Análisis:** Cada función de carga:
- Llama a un endpoint específico
- Procesa datos de manera específica
- Renderiza en elementos DOM específicos

Consolidar estas funciones no tiene sentido porque cada una tiene lógica de negocio y presentación única.

**Acción requerida:** NINGUNA - Mantener funciones específicas por contexto.

---
## 9. RESUMEN DE ACCIONES REQUERIDAS

### ✅ Funciones YA Consolidadas (No requieren acción)

1. **Formateo:**
   - ✅ `formatoMoneda()` - Ya en utils.js

2. **Validación:**
   - ✅ `esZonaMontacarguista()` - Ya en utils.js
   - ✅ `esZonaAuxiliar()` - Ya en utils.js
   - ✅ `validarUbicacion()` - Ya en utils.js

3. **Cálculos:**
   - ✅ `calcularVolumenOcupadoCliente()` - Ya en utils.js

4. **Manipulación DOM:**
   - ✅ `initDateInputs()` - Ya en utils.js
   - ✅ `populateProductosSelect()` - Ya en utils.js
   - ✅ `populateClientesSelect()` - Ya en utils.js
   - ✅ `populateProveedoresSelect()` - Ya en utils.js
   - ✅ `ubicacionSelectorHTML()` - Ya en utils.js

5. **Procesamiento de archivos:**
   - ✅ `readExcelOrCSV()` - Ya en utils.js
   - ✅ `parseNumberString()` - Ya en utils.js
   - ✅ `formatExcelDate()` - Ya en utils.js

**Total: 13 funciones ya consolidadas** ✅

---

### ❌ Funciones DUPLICADAS que DEBEN Consolidarse

#### ALTA PRIORIDAD (Lógica idéntica en múltiples archivos)

1. **`calcularTotalLinea(cantidad, precioUnitario)`**
   - Ubicaciones: `compras.js`, `ventas.js`
   - Acción: Crear en `utils.js` y reemplazar

2. **`calcularSubtotal(items)`**
   - Ubicaciones: `compras.js`, `ventas.js`
   - Acción: Crear en `utils.js` y reemplazar

3. **`calcularIVA(base, porcentaje)`**
   - Ubicaciones: `compras.js`, `ventas.js`
   - Acción: Crear en `utils.js` y reemplazar

4. **`buscarProveedorNit(terceroText)`**
   - Ubicaciones: `compras.js` (función local)
   - Acción: Crear en `utils.js` y reemplazar

5. **`buscarProductoPorCodigo(codeText)`**
   - Ubicaciones: `compras.js` (función local)
   - Acción: Crear en `utils.js` y reemplazar

**Total: 5 funciones a consolidar** ❌

---

### ⚠️ Funciones que NO deben consolidarse

Las siguientes categorías de funciones son específicas de cada contexto y NO deben consolidarse:

1. **Funciones de limpieza de formularios** (`limpiarForm*()`)
   - Razón: Cada formulario tiene campos específicos

2. **Funciones de agregar/eliminar filas** (`agregarFilaItem*()`, `eliminarFilaItem*()`)
   - Razón: HTML y estructura específica de cada tabla

3. **Funciones de cambio de tabs** (`switch*Tab()`)
   - Razón: IDs y lógica específica de cada vista

4. **Funciones de carga de datos** (`load*()`)
   - Razón: Endpoints y lógica de renderizado específicos

5. **Funciones de guardado** (`guardar*()`)
   - Razón: Validaciones y lógica de negocio específicas

**Total: ~30+ funciones que deben permanecer específicas** ⚠️

---
## 10. MATRIZ DE CONSOLIDACIÓN POR CATEGORÍA

| Categoría | Total Identificadas | Ya Consolidadas | A Consolidar | No Consolidar | % Consolidación Actual |
|-----------|---------------------|-----------------|--------------|---------------|------------------------|
| **Formateo** | 2 | 1 | 0 | 1 | 50% |
| **Validación** | 3 | 3 | 0 | 0 | 100% ✅ |
| **Cálculos** | 4 | 1 | 3 | 0 | 25% |
| **Manipulación DOM** | 10 | 5 | 0 | 5 | 50% |
| **Búsqueda/Filtrado** | 3 | 0 | 2 | 1 | 0% |
| **Procesamiento CSV** | 3 | 3 | 0 | 0 | 100% ✅ |
| **Gestión de Tabs** | 4 | 0 | 0 | 4 | N/A |
| **Carga de Datos** | 7+ | 0 | 0 | 7+ | N/A |
| **Guardado/Edición** | 10+ | 0 | 0 | 10+ | N/A |
| **TOTAL** | **46+** | **13** | **5** | **28+** | **28% → 39% objetivo** |

---

## 11. PLAN DE IMPLEMENTACIÓN

### Fase 1: Crear Funciones Faltantes en utils.js

**Archivo:** `client/js/utils.js`

**Nuevas funciones a agregar:**

```javascript
// === CÁLCULOS ===

/**
 * Calcula el total de una línea de detalle (cantidad × precio unitario)
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
 * @param {number} porcentaje - Porcentaje de IVA (ej: 19)
 * @returns {number} Valor del IVA
 */
export function calcularIVA(base, porcentaje) {
    return (base || 0) * ((porcentaje || 0) / 100);
}

// === BÚSQUEDA ===

/**
 * Busca un proveedor por NIT o nombre (con coincidencia flexible)
 * @param {string} terceroText - Texto a buscar (NIT o nombre)
 * @returns {string} NIT del proveedor encontrado o texto original
 */
export function buscarProveedorNit(terceroText) {
    if (!terceroText) return '';
    const norm = terceroText.trim().toLowerCase();
    
    let match = state.proveedores.find(p => p.nombre.trim().toLowerCase() === norm);
    if (match) return match.nit;
    
    match = state.proveedores.find(p => p.nit === terceroText.trim());
    if (match) return match.nit;
    
    match = state.proveedores.find(p => 
        p.nombre.toLowerCase().includes(norm) || 
        norm.includes(p.nombre.toLowerCase())
    );
    if (match) return match.nit;
    
    return terceroText.trim();
}

/**
 * Busca un producto por código (con padding automático para códigos numéricos)
 * @param {string} codeText - Código del producto a buscar
 * @returns {Object|null} Producto encontrado o null
 */
export function buscarProductoPorCodigo(codeText) {
    if (!codeText) return null;
    const cleanCode = String(codeText).trim();
    
    let prod = state.productos.find(p => p.codigo === cleanCode);
    if (prod) return prod;
    
    if (/^\d+$/.test(cleanCode)) {
        const padded5 = cleanCode.padStart(5, '0');
        prod = state.productos.find(p => p.codigo === padded5);
        if (prod) return prod;
    }
    
    return null;
}
```

---
### Fase 2: Actualizar Imports en Archivos de Vistas

**Archivo:** `client/js/views/compras.js`

```javascript
// Agregar a imports existentes:
import { 
    formatoMoneda, 
    readExcelOrCSV, 
    parseNumberString, 
    formatExcelDate,
    calcularTotalLinea,      // ← NUEVO
    calcularIVA,             // ← NUEVO
    buscarProveedorNit,      // ← NUEVO
    buscarProductoPorCodigo  // ← NUEVO
} from '../utils.js';
```

**Archivo:** `client/js/views/ventas.js`

```javascript
// Agregar a imports existentes:
import { 
    formatoMoneda,
    calcularTotalLinea,  // ← NUEVO
    calcularIVA          // ← NUEVO
} from '../utils.js';
```

---

### Fase 3: Reemplazar Código Duplicado

#### 3.1 En compras.js

**Reemplazar en `calcularTotalesOC()` (línea 88-103):**

```javascript
// ANTES:
export function calcularTotalesOC() {
    const rows = document.querySelectorAll('#oc-items-table-body tr');
    let subtotal = 0;

    rows.forEach(row => {
        const qty = Number(row.querySelector('.oc-item-qty').value) || 0;
        const unit = Number(row.querySelector('.oc-item-unit').value) || 0;
        const total = qty * unit;  // ← DUPLICADO
        subtotal += total;
        row.querySelector('.oc-item-total').textContent = formatoMoneda(total);
    });

    const descuento = Number(document.getElementById('oc-descuento').value) || 0;
    const ivaPct = Number(document.getElementById('oc-iva').value) || 0;
    const retPct = Number(document.getElementById('oc-retencion').value) || 0;

    const baseIVA = Math.max(0, subtotal - descuento);
    const valorIVA = baseIVA * (ivaPct / 100);  // ← DUPLICADO
    const valorRet = baseIVA * (retPct / 100);
    const totalGeneral = baseIVA + valorIVA - valorRet;

    document.getElementById('oc-total-general').textContent = formatoMoneda(totalGeneral);
}

// DESPUÉS:
export function calcularTotalesOC() {
    const rows = document.querySelectorAll('#oc-items-table-body tr');
    let subtotal = 0;

    rows.forEach(row => {
        const qty = Number(row.querySelector('.oc-item-qty').value) || 0;
        const unit = Number(row.querySelector('.oc-item-unit').value) || 0;
        const total = calcularTotalLinea(qty, unit);  // ← CONSOLIDADO
        subtotal += total;
        row.querySelector('.oc-item-total').textContent = formatoMoneda(total);
    });

    const descuento = Number(document.getElementById('oc-descuento').value) || 0;
    const ivaPct = Number(document.getElementById('oc-iva').value) || 0;
    const retPct = Number(document.getElementById('oc-retencion').value) || 0;

    const baseIVA = Math.max(0, subtotal - descuento);
    const valorIVA = calcularIVA(baseIVA, ivaPct);  // ← CONSOLIDADO
    const valorRet = baseIVA * (retPct / 100);
    const totalGeneral = baseIVA + valorIVA - valorRet;

    document.getElementById('oc-total-general').textContent = formatoMoneda(totalGeneral);
}
```

**Reemplazar funciones locales (línea 267-298):**

```javascript
// ANTES:
function findProveedorNit(terceroText) {
    // ... código duplicado ...
}

function findProductByCode(codeText) {
    // ... código duplicado ...
}

// DESPUÉS:
// Eliminar estas funciones y usar las importadas de utils.js
```

**Actualizar llamadas en `parseExcelOrCSVToOrders()` (línea 330-380):**

```javascript
// ANTES:
const resolvedNit = findProveedorNit(proveedorRaw);
const prod = findProductByCode(codigoRaw);

// DESPUÉS:
const resolvedNit = buscarProveedorNit(proveedorRaw);
const prod = buscarProductoPorCodigo(codigoRaw);
```

---
#### 3.2 En ventas.js

**Reemplazar en `calcularTotalesVenta()` (línea 68-81):**

```javascript
// ANTES:
export function calcularTotalesVenta() {
    const rows = document.querySelectorAll('#venta-items-table-body tr');
    let subtotal = 0;

    rows.forEach(row => {
        const qty = Number(row.querySelector('.venta-item-qty').value) || 0;
        const unit = Number(row.querySelector('.venta-item-unit').value) || 0;
        const total = qty * unit;  // ← DUPLICADO
        subtotal += total;
        row.querySelector('.venta-item-total').textContent = formatoMoneda(total);
    });

    const ivaPct = Number(document.getElementById('venta-iva').value) || 0;
    const valorIVA = subtotal * (ivaPct / 100);  // ← DUPLICADO
    const totalGeneral = subtotal + valorIVA;

    document.getElementById('venta-total-general').textContent = formatoMoneda(totalGeneral);
}

// DESPUÉS:
export function calcularTotalesVenta() {
    const rows = document.querySelectorAll('#venta-items-table-body tr');
    let subtotal = 0;

    rows.forEach(row => {
        const qty = Number(row.querySelector('.venta-item-qty').value) || 0;
        const unit = Number(row.querySelector('.venta-item-unit').value) || 0;
        const total = calcularTotalLinea(qty, unit);  // ← CONSOLIDADO
        subtotal += total;
        row.querySelector('.venta-item-total').textContent = formatoMoneda(total);
    });

    const ivaPct = Number(document.getElementById('venta-iva').value) || 0;
    const valorIVA = calcularIVA(subtotal, ivaPct);  // ← CONSOLIDADO
    const totalGeneral = subtotal + valorIVA;

    document.getElementById('venta-total-general').textContent = formatoMoneda(totalGeneral);
}
```

---

### Fase 4: Verificación y Pruebas

**Checklist de verificación:**

- [ ] Todas las nuevas funciones agregadas a `utils.js`
- [ ] Imports actualizados en `compras.js`
- [ ] Imports actualizados en `ventas.js`
- [ ] Código duplicado reemplazado en `compras.js`
- [ ] Código duplicado reemplazado en `ventas.js`
- [ ] Funciones locales eliminadas de `compras.js`
- [ ] Sistema arranca sin errores
- [ ] Cálculo de totales en Órdenes de Compra funciona correctamente
- [ ] Cálculo de totales en Ventas funciona correctamente
- [ ] Importación masiva de OC funciona correctamente
- [ ] No hay errores en consola del navegador

---

## 12. MÉTRICAS DE IMPACTO

### Antes de la Consolidación

- **Líneas de código duplicado:** ~150 líneas
- **Funciones duplicadas:** 5 funciones
- **Archivos afectados:** 2 archivos (compras.js, ventas.js)
- **Mantenibilidad:** Baja (cambios requieren actualizar múltiples archivos)

### Después de la Consolidación

- **Líneas de código duplicado:** 0 líneas
- **Funciones consolidadas:** 5 funciones en utils.js
- **Archivos afectados:** 1 archivo central (utils.js)
- **Mantenibilidad:** Alta (cambios en un solo lugar)
- **Reducción de código:** ~100 líneas eliminadas
- **Cobertura de consolidación:** 39% (18 de 46 funciones)

---

## 13. CONCLUSIONES

### Funciones Exitosamente Consolidadas

El análisis identificó que **13 funciones ya están consolidadas** en `utils.js`, lo que representa un **28% de consolidación actual**. Esto incluye:

- Todas las funciones de validación de ubicaciones
- Todas las funciones de procesamiento de archivos CSV/Excel
- Funciones básicas de formateo y manipulación DOM

### Funciones Pendientes de Consolidación

Se identificaron **5 funciones adicionales** que deben consolidarse:

1. `calcularTotalLinea()` - Cálculo básico de línea
2. `calcularSubtotal()` - Suma de items
3. `calcularIVA()` - Cálculo de impuestos
4. `buscarProveedorNit()` - Búsqueda flexible de proveedores
5. `buscarProductoPorCodigo()` - Búsqueda con padding automático

Consolidar estas 5 funciones elevará la cobertura al **39%**.

### Funciones que NO Deben Consolidarse

El análisis también identificó **~28 funciones** que son específicas de cada contexto y NO deben consolidarse, incluyendo:

- Funciones de limpieza de formularios específicos
- Funciones de agregar/eliminar filas de tablas específicas
- Funciones de cambio de tabs con lógica específica
- Funciones de carga y guardado con lógica de negocio específica

Estas funciones deben permanecer en sus archivos originales para mantener la separación de responsabilidades y evitar complejidad innecesaria.

### Recomendación Final

✅ **Proceder con la consolidación de las 5 funciones identificadas** siguiendo el plan de implementación de 4 fases.

⚠️ **NO intentar consolidar funciones específicas de contexto** para evitar aumentar la complejidad del código.

---

**Fin del Documento**
