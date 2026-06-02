# Plan de Implementación: Limpieza y Optimización del Código WMS

## Descripción General

Este plan de implementación detalla las tareas necesarias para limpiar, optimizar y refactorizar el código del sistema WMS habitad-wms. El objetivo es preparar el código para producción eliminando redundancias, consolidando funcionalidad duplicada, removiendo componentes obsoletos y mejorando la mantenibilidad, mientras se preserva completamente el flujo crítico operativo (Montacarguista → Auxiliar para picking).

El sistema está construido con **JavaScript (Node.js)** en el backend y **JavaScript Vanilla** en el frontend, utilizando SQLite como base de datos.

## Tareas

### Fase 1: Eliminación de Código Obsoleto

- [x] 1. Eliminar funcionalidad obsoleta de servicios
  - [x] 1.1 Eliminar archivo de vista de servicios
    - Eliminar el archivo `client/js/views/servicios.js`
    - _Requisitos: 1.1_
  
  - [x] 1.2 Remover imports y referencias de servicios en el cliente
    - Eliminar import de `servicios.js` en `client/app.js`
    - Eliminar referencias a la vista "servicios" en el código de navegación
    - Actualizar el menú de navegación en `client/index.html` si existe referencia
    - _Requisitos: 1.2, 1.3_
  
  - [x] 1.3 Eliminar endpoint de servicios en el servidor
    - Remover endpoint `/api/servicios` (GET y POST) de `server.js`
    - Eliminar todo el código de manejo de peticiones relacionadas con servicios
    - _Requisitos: 1.4_
  
  - [x] 1.4 Eliminar funciones de servicios en la capa de datos
    - Eliminar funciones `getServicios()` y `createServicio()` de `db.js`
    - Eliminar cualquier otra función relacionada con órdenes de servicio
    - _Requisitos: 1.5_
  
  - [x] 1.5 Remover tabla obsoleta de base de datos
    - Eliminar la creación de tabla `ordenes_servicio` del script de inicialización en `db.js`
    - Verificar que no hay referencias a esta tabla en consultas
    - _Requisitos: 1.6_
  
  - [ ] 1.6 Verificar arranque del sistema sin errores
    - Ejecutar `node server.js` y verificar que arranca correctamente
    - Verificar que no hay errores relacionados con servicios en la consola
    - Abrir el cliente en navegador y verificar que carga sin errores
    - _Requisitos: 1.7_

### Fase 2: Consolidación de Funciones Duplicadas

- [x] 2. Crear módulo de utilidades consolidado
  - [x] 2.1 Identificar y documentar funciones duplicadas
    - Analizar archivos en `client/js/views/` para identificar funciones con lógica idéntica o similar
    - Crear lista de funciones a consolidar: formateo, validación, cálculos, manipulación DOM
    - _Requisitos: 2.1_
  
  - [x] 2.2 Implementar funciones de formateo consolidadas en utils.js
    - Implementar `formatoMoneda(valor)` con JSDoc
    - Implementar `formatoNumero(valor)` con JSDoc
    - Asegurar compatibilidad con formato colombiano (COP)
    - _Requisitos: 2.4_
  
  - [x] 2.3 Implementar funciones de validación consolidadas en utils.js
    - Implementar `esZonaMontacarguista(ubicacion)` con JSDoc
    - Implementar `esZonaAuxiliar(ubicacion)` con JSDoc
    - Implementar `validarFormatoUbicacion(ubicacion)` con JSDoc
    - _Requisitos: 2.5_
  
  - [x] 2.4 Implementar funciones de cálculo consolidadas en utils.js
    - Implementar `calcularTotalLinea(cantidad, precioUnitario)` con JSDoc
    - Implementar `calcularSubtotal(items)` con JSDoc
    - Implementar `calcularIVA(base, porcentaje)` con JSDoc
    - _Requisitos: 2.6_
  
  - [x] 2.5 Implementar funciones de manipulación DOM consolidadas en utils.js
    - Implementar `initDateInputs()` con JSDoc
    - Implementar `populateProductosSelect(selectId)` con JSDoc
    - Implementar `populateClientesSelect(selectId)` con JSDoc
    - Implementar `populateProveedoresSelect(selectId)` con JSDoc
    - _Requisitos: 2.7_
  
  - [x] 2.6 Refactorizar vistas para usar funciones consolidadas
    - Actualizar `dashboard.js` para importar y usar funciones de utils.js
    - Actualizar `catalogo.js` para importar y usar funciones de utils.js
    - Actualizar `compras.js` para importar y usar funciones de utils.js
    - Actualizar `ventas.js` para importar y usar funciones de utils.js
    - Actualizar `recibo.js` para importar y usar funciones de utils.js
    - Actualizar `despacho.js` para importar y usar funciones de utils.js
    - _Requisitos: 2.3_
  
  - [x] 2.7 Eliminar funciones duplicadas de archivos individuales
    - Remover implementaciones duplicadas de funciones ahora consolidadas
    - Verificar que no quedan funciones duplicadas en las vistas
    - _Requisitos: 2.3_
  
  - [ ] 2.8 Verificar funcionamiento de todas las vistas
    - Probar cada vista en el navegador
    - Verificar que formateo, validaciones y cálculos funcionan correctamente
  
  - [x] 2.8 Verificar funcionamiento de todas las vistas
    - Probar cada vista en el navegador
    - Verificar que formateo, validaciones y cálculos funcionan correctamente
    - Verificar que no hay errores de consola
    - _Requisitos: 2.8_

- [x] 3. Checkpoint - Validar consolidación de funciones
  - Asegurar que todas las vistas funcionan correctamente con las funciones consolidadas
  - Verificar que no hay regresiones funcionales
  - Preguntar al usuario si hay dudas o problemas

### Fase 3: Evaluación y Limpieza de Vistas

- [-] 4. Analizar y decidir sobre vistas redundantes
  - [x] 4.1 Evaluar vista despacho.js
    - Analizar si la funcionalidad de despacho es redundante con picking
    - Determinar si solo registra salidas manuales que pueden consolidarse
    - Documentar decisión de mantener o eliminar
    - _Requisitos: 3.2, 3.3_
  
  - [x] 4.2 Eliminar vistas redundantes (si aplica)
    - Si despacho.js es redundante, eliminar el archivo
    - Remover imports de vistas eliminadas en `app.js`
    - Actualizar menú de navegación en `index.html`
    - _Requisitos: 3.3, 3.5, 3.6_
  
  - [-] 4.3 Verificar navegación funcional
    - Probar navegación entre todas las vistas activas
    - Verificar que el menú refleja solo vistas disponibles
    - Verificar que no hay errores al cambiar de vista
    - _Requisitos: 3.7_

### Fase 4: Refactorización del Servidor

- [ ] 5. Organizar y optimizar código del servidor
  - [~] 5.1 Organizar endpoints REST en grupos lógicos
    - Agregar comentarios de sección para agrupar endpoints por dominio
    - Secciones: Catálogos, Operaciones Comerciales, Inventario, Picking (Flujo Crítico)
    - Mantener orden lógico y consistente
    - _Requisitos: 4.1_
  
  - [~] 5.2 Implementar funciones auxiliares consolidadas
    - Crear función `validateQueryParam(param, paramName)` para validación de parámetros
    - Crear función `getRequestBody(req)` para procesamiento de body
    - Crear función `sendJSON(res, status, data)` para respuestas estandarizadas
    - _Requisitos: 4.2_
  
  - [~] 5.3 Implementar middleware de manejo de errores
    - Crear función `handleError(res, error, context)` centralizada
    - Refactorizar todos los bloques try-catch para usar el middleware
    - Asegurar mensajes de error descriptivos y códigos de estado apropiados
    - _Requisitos: 4.3_
  
  - [~] 5.4 Limpiar código comentado y agregar documentación
    - Eliminar código comentado obsoleto que no aporta valor
    - Agregar comentarios descriptivos en lógica compleja
    - Mantener nombres de variables y funciones descriptivos
    - _Requisitos: 4.5, 4.6_
  
  - [~] 5.5 Verificar funcionamiento de todos los endpoints
    - Probar endpoints GET de catálogos (clientes, proveedores, productos)
    - Probar endpoints POST de catálogos
    - Probar endpoints de inventario (stock, movimientos)
    - Probar endpoints críticos de picking (consolidado, picking, confirmar-picking)
    - Verificar que todos responden con formato correcto
    - _Requisitos: 4.7_

### Fase 5: Refactorización de Base de Datos

- [ ] 6. Optimizar capa de acceso a datos
  - [~] 6.1 Crear índices de optimización
    - Crear índice `idx_movimientos_producto` en `inventario_movimientos(codigo_producto)`
    - Crear índice `idx_movimientos_ubicacion` en `inventario_movimientos(ubicacion)`
    - Crear índice `idx_movimientos_referencia` en `inventario_movimientos(documento_referencia)`
    - _Requisitos: 6.3_
  
  - [~] 6.2 Consolidar consultas de stock en función parametrizada
    - Implementar función `getStock(filters)` que acepta filtros opcionales
    - Consolidar `getStockGlobal()`, `getStockUbicaciones()`, `getStockDetalle()` usando la función parametrizada
    - Mantener compatibilidad con código existente
    - _Requisitos: 6.2, 6.4_
  
  - [~] 6.3 Agregar documentación JSDoc a funciones públicas
    - Documentar funciones de catálogos (getClientes, createCliente, etc.)
    - Documentar funciones de inventario (getMovimientos, createMovimiento, etc.)
    - Documentar funciones críticas de picking (getConsolidado, getPicking, confirmarPicking)
    - Documentar funciones de montacarguista (ejecutarDescenso, saveInventarioGeneral)
    - _Requisitos: 9.3_
  
  - [~] 6.4 Verificar operaciones de base de datos
    - Probar consultas de stock con diferentes filtros
    - Probar creación de movimientos de inventario
    - Probar operaciones de picking completo
    - Verificar que los índices mejoran el rendimiento
    - _Requisitos: 6.6, 6.7_

- [~] 7. Checkpoint - Validar optimizaciones de base de datos
  - Asegurar que todas las consultas retornan los mismos datos que antes
  - Verificar que no hay regresiones en operaciones de inventario
  - Preguntar al usuario si hay dudas o problemas

### Fase 6: Optimización del Cliente

- [ ] 8. Refactorizar código del cliente
  - [~] 8.1 Consolidar event listeners duplicados
    - Identificar event listeners repetidos en vistas
    - Extraer lógica común en funciones reutilizables
    - Actualizar vistas para usar event listeners consolidados
    - _Requisitos: 5.3_
  
  - [~] 8.2 Extraer validaciones de formularios en funciones reutilizables
    - Identificar validaciones repetidas en formularios
    - Crear funciones de validación genéricas en utils.js
    - Actualizar formularios para usar validaciones consolidadas
    - _Requisitos: 5.4_
  
  - [~] 8.3 Eliminar variables globales innecesarias
    - Identificar variables globales que pueden ser locales o estar en state.js
    - Refactorizar código para eliminar dependencias de variables globales
    - Mantener solo variables globales necesarias para funciones window.*
    - _Requisitos: 5.2_
  
  - [~] 8.4 Eliminar código muerto y funciones no utilizadas
    - Buscar funciones que no tienen referencias en el código
    - Eliminar código comentado obsoleto
    - Eliminar imports no utilizados
    - _Requisitos: 5.6_
  
  - [~] 8.5 Verificar funcionamiento de la interfaz
    - Probar todas las vistas activas en el navegador
    - Verificar que formularios validan correctamente
    - Verificar que event listeners funcionan
    - Verificar que no hay errores de consola
    - _Requisitos: 5.7_

### Fase 7: Validación del Flujo Crítico

- [ ] 9. Validar flujo operativo completo (CRÍTICO)
  - [~] 9.1 Probar vista montacarguista completa
    - Cargar consolidado diario de ventas con fecha específica
    - Verificar que identifica productos en rack alto (pos >= 20)
    - Generar hoja de descenso para productos identificados
    - Verificar que la función `window.loadMontacarguistaConsolidado()` funciona
    - _Requisitos: 7.1_
  
  - [~] 9.2 Probar operación de descenso de montacargas
    - Ejecutar descenso de producto desde rack alto a zona de picking
    - Verificar que se crean movimientos OUT de ubicación alta
    - Verificar que se crean movimientos IN a ubicación de picking (pos 10-19)
    - Verificar que el inventario se actualiza correctamente
    - _Requisitos: 7.4_
  
  - [~] 9.3 Probar vista picking completa
    - Cargar detalle de alistamiento por remisión
    - Verificar que muestra stock disponible por ubicación
    - Asignar ubicaciones y cantidades para cada producto
    - Verificar que las funciones `window.loadPickingDetalle()` y `window.confirmarPickingCompleto()` funcionan
    - _Requisitos: 7.2_
  
  - [~] 9.4 Probar confirmación de picking
    - Confirmar picking con auxiliar asignado
    - Verificar que se crean movimientos OUT de ubicaciones de picking
    - Verificar que el estado de la venta cambia a "Completado"
    - Verificar que el inventario se actualiza correctamente
    - _Requisitos: 7.6_
  
  - [~] 9.5 Probar integración montacarguista → picking
    - Ejecutar flujo completo: consolidado → descenso → picking → confirmación
    - Verificar que los productos descendidos están disponibles para picking
    - Verificar que el auxiliar puede alistar desde zona auxiliar
    - Verificar que todo el flujo funciona sin errores
    - _Requisitos: 7.3, 7.5, 7.7_
  
  - [~] 9.6 Probar vista inventario
    - Probar consulta de stock global
    - Probar consulta de stock por ubicación
    - Probar carga masiva de inventario general
    - Verificar que las funciones `window.switchInvTab()` y `window.loadStockGlobal()` funcionan
    - _Requisitos: 7.1_

- [~] 10. Checkpoint - Validar flujo crítico completo
  - Asegurar que el flujo montacarguista → picking funciona perfectamente
  - Verificar que no hay regresiones en operaciones críticas
  - Preguntar al usuario si hay dudas o problemas

### Fase 8: Preparación para Repositorio

- [ ] 11. Preparar código para repositorio Git
  - [~] 11.1 Crear archivo .gitignore
    - Crear `.gitignore` en la raíz del proyecto
    - Excluir `node_modules/`
    - Excluir `db.sqlite` y `*.db`
    - Excluir archivos temporales (*.tmp, *.log, .DS_Store, Thumbs.db)
    - Excluir archivos de IDE (.vscode/, .idea/, *.swp, *.swo)
    - Excluir archivos de sistema (*.bak, *~)
    - _Requisitos: 10.1, 10.2, 10.3_
  
  - [~] 11.2 Actualizar documentación README.md
    - Actualizar descripción del proyecto
    - Documentar estructura de carpetas y archivos
    - Documentar cómo ejecutar el proyecto
    - Documentar dependencias y requisitos (Node.js 18+)
    - Documentar flujo crítico de operaciones
    - _Requisitos: 9.2, 10.5_
  
  - [~] 11.3 Eliminar archivos temporales y de prueba
    - Identificar y eliminar archivos temporales (*.tmp, *.bak)
    - Eliminar archivos de prueba que no son necesarios
    - Verificar que solo archivos de código fuente están presentes
    - _Requisitos: 10.4, 10.6_
  
  - [~] 11.4 Verificar estructura final del proyecto
    - Verificar que la estructura de carpetas es clara y organizada
    - Verificar que todos los archivos necesarios están presentes
    - Verificar que no hay archivos innecesarios
    - Crear backup de `db.sqlite` antes de excluirlo del repo
    - _Requisitos: 10.5, 10.7_

### Fase 9: Validación Final y Documentación

- [ ] 12. Realizar validación final del sistema
  - [~] 12.1 Ejecutar suite completa de pruebas básicas
    - Verificar que el servidor arranca sin errores (smoke test)
    - Verificar que todas las vistas cargan sin errores de consola
    - Verificar conexión exitosa a base de datos SQLite
    - _Requisitos: 8.1, 8.2, 8.3_
  
  - [~] 12.2 Probar todos los endpoints REST activos
    - Probar todos los endpoints GET con peticiones válidas
    - Probar todos los endpoints POST con datos válidos
    - Verificar que responden con formato JSON correcto
    - Verificar que códigos de estado HTTP son apropiados
    - _Requisitos: 8.4, 8.5_
  
  - [~] 12.3 Probar navegación completa de la interfaz
    - Navegar entre todas las vistas activas
    - Verificar que cada vista carga correctamente
    - Verificar que no hay errores de consola al navegar
    - _Requisitos: 8.7_
  
  - [~] 12.4 Verificar documentación del código
    - Verificar que funciones complejas tienen comentarios descriptivos
    - Verificar que funciones utilitarias tienen JSDoc completo
    - Verificar que endpoints REST tienen comentarios de sección
    - Verificar que lógica de negocio en db.js está comentada
    - Verificar que no hay comentarios obsoletos o engañosos
    - _Requisitos: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [~] 12.5 Generar reporte de métricas de éxito
    - Contar líneas de código eliminadas
    - Contar funciones duplicadas eliminadas
    - Contar archivos eliminados
    - Contar funciones consolidadas en utils.js
    - Contar vistas activas finales
    - Verificar que no hay errores ni warnings de consola
    - _Requisitos: 8.6_

- [~] 13. Checkpoint final - Confirmar que el sistema está listo para producción
  - Asegurar que todas las pruebas pasan
  - Verificar que la documentación está completa
  - Confirmar que el código está listo para repositorio
  - Preguntar al usuario si desea proceder con el commit inicial

## Notas

- **Flujo Crítico Preservado**: Las vistas `montacarguista.js`, `picking.js` e `inventario.js` son críticas y deben mantenerse completamente funcionales durante toda la refactorización.

- **Validación Continua**: Después de cada fase, se debe verificar que el sistema arranca correctamente y que no hay regresiones funcionales.

- **Commits Granulares**: Se recomienda hacer un commit de Git después de completar cada fase para facilitar rollback si es necesario.

- **Backup de Base de Datos**: Antes de iniciar la refactorización, crear un backup de `db.sqlite` con el comando: `cp db.sqlite db.sqlite.backup`

- **Lenguaje de Implementación**: Todo el código está en **JavaScript (ES6+)** - Node.js para backend y JavaScript Vanilla para frontend.

- **Sin Dependencias Externas**: El proyecto utiliza únicamente módulos nativos de Node.js, sin dependencias de npm.

- **Testing**: Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido. Sin embargo, se recomienda ejecutar al menos las pruebas básicas del flujo crítico.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5"] },
    { "id": 4, "tasks": ["2.6"] },
    { "id": 5, "tasks": ["2.7", "2.8"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2", "4.3"] },
    { "id": 8, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 9, "tasks": ["5.4", "5.5"] },
    { "id": 10, "tasks": ["6.1", "6.2"] },
    { "id": 11, "tasks": ["6.3", "6.4"] },
    { "id": 12, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 13, "tasks": ["8.4", "8.5"] },
    { "id": 14, "tasks": ["9.1", "9.6"] },
    { "id": 15, "tasks": ["9.2"] },
    { "id": 16, "tasks": ["9.3"] },
    { "id": 17, "tasks": ["9.4"] },
    { "id": 18, "tasks": ["9.5"] },
    { "id": 19, "tasks": ["11.1", "11.3"] },
    { "id": 20, "tasks": ["11.2", "11.4"] },
    { "id": 21, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 22, "tasks": ["12.4", "12.5"] }
  ]
}
```
