# Documento de Requisitos: Limpieza y Optimización del Código WMS

## Introducción

Este documento define los requisitos para la limpieza, optimización y refactorización del código del sistema WMS habitad-wms. El sistema es una aplicación web local construida con Node.js/Express, SQLite y JavaScript Vanilla, diseñada para gestionar inventarios, picking y pre-alistamiento de mercancías en un almacén.

El objetivo principal es preparar el código para un push al repositorio, eliminando redundancias, consolidando funciones duplicadas, removiendo pantallas obsoletas, y manteniendo un balance entre código compacto y legible. El flujo crítico del sistema (Montacarguista → Auxiliar para picking) debe preservarse intacto.

## Glosario

- **Sistema_WMS**: El sistema completo de gestión de almacén habitad-wms
- **Módulo_Servidor**: El componente backend implementado en server.js y db.js
- **Módulo_Cliente**: El componente frontend implementado en la carpeta client/
- **Vista**: Archivo JavaScript en client/js/views/ que implementa una pantalla funcional
- **Función_Duplicada**: Función con lógica idéntica o muy similar presente en múltiples archivos
- **Pantalla_Redundante**: Vista que replica funcionalidad existente en otra vista
- **Flujo_Crítico**: Secuencia operativa Montacarguista → Auxiliar (picking) esencial para operaciones
- **Código_Muerto**: Código que no se ejecuta o no tiene referencias activas
- **Validación_Básica**: Verificación de sintaxis correcta y capacidad de arranque del servidor
- **Repositorio**: Sistema de control de versiones Git donde se almacenará el código limpio

## Requisitos

### Requisito 1: Eliminación de Funcionalidad Obsoleta

**User Story:** Como desarrollador del sistema, quiero eliminar completamente la funcionalidad de "orden de servicio" que ya fue removida, para que el código no contenga referencias ni archivos relacionados con esta funcionalidad obsoleta.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL eliminar el archivo servicios.js de la carpeta client/js/views/
2. THE Sistema_WMS SHALL remover todas las importaciones de servicios.js en app.js
3. THE Sistema_WMS SHALL eliminar todas las referencias a la vista "servicios" en el código de navegación
4. THE Sistema_WMS SHALL remover el endpoint /api/servicios del archivo server.js
5. THE Sistema_WMS SHALL eliminar las funciones relacionadas con servicios en db.js
6. THE Sistema_WMS SHALL remover la tabla ordenes_servicio de la inicialización de base de datos
7. WHEN el Sistema_WMS arranca, THE Sistema_WMS SHALL iniciar sin errores relacionados con servicios

### Requisito 2: Consolidación de Funciones Duplicadas

**User Story:** Como desarrollador del sistema, quiero consolidar funciones duplicadas en módulos reutilizables, para que el código sea más mantenible y no existan implementaciones redundantes de la misma lógica.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL identificar todas las funciones con lógica idéntica o similar en múltiples archivos
2. THE Sistema_WMS SHALL crear funciones utilitarias centralizadas en utils.js para lógica compartida
3. THE Sistema_WMS SHALL reemplazar todas las instancias de funciones duplicadas con llamadas a las funciones centralizadas
4. THE Sistema_WMS SHALL consolidar funciones de formateo de moneda en una única implementación
5. THE Sistema_WMS SHALL consolidar funciones de validación de ubicaciones en una única implementación
6. THE Sistema_WMS SHALL consolidar funciones de cálculo de totales en módulos de compras y ventas
7. THE Sistema_WMS SHALL consolidar funciones de manejo de fechas en una única implementación
8. WHEN una función consolidada es invocada, THE Sistema_WMS SHALL producir el mismo resultado que las funciones originales duplicadas

### Requisito 3: Eliminación de Pantallas Redundantes

**User Story:** Como usuario del sistema, quiero que se eliminen pantallas redundantes o poco usadas, para que la interfaz sea más simple y enfocada en las operaciones críticas del almacén.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL mantener las vistas críticas: montacarguista, picking, inventario, dashboard
2. THE Sistema_WMS SHALL evaluar el uso y redundancia de las vistas: catalogo, compras, ventas, recibo, despacho
3. IF una Vista es redundante con otra funcionalidad, THEN THE Sistema_WMS SHALL eliminar la Vista redundante
4. IF una Vista es poco usada y no crítica, THEN THE Sistema_WMS SHALL documentar la razón de su eliminación
5. THE Sistema_WMS SHALL actualizar el menú de navegación para reflejar solo las vistas activas
6. THE Sistema_WMS SHALL remover todas las importaciones de vistas eliminadas en app.js
7. WHEN el usuario navega por el sistema, THE Sistema_WMS SHALL mostrar solo las pantallas funcionales y no redundantes

### Requisito 4: Refactorización de Código del Servidor

**User Story:** Como desarrollador del sistema, quiero refactorizar el código del servidor para mejorar su estructura y legibilidad, manteniendo un balance entre compacto y legible.

#### Acceptance Criteria

1. THE Módulo_Servidor SHALL organizar los endpoints REST en grupos lógicos con comentarios descriptivos
2. THE Módulo_Servidor SHALL extraer funciones auxiliares repetidas en funciones reutilizables
3. THE Módulo_Servidor SHALL consolidar la lógica de manejo de errores en un middleware centralizado
4. THE Módulo_Servidor SHALL mantener nombres de variables y funciones descriptivos y consistentes
5. THE Módulo_Servidor SHALL eliminar código comentado que no aporta valor
6. THE Módulo_Servidor SHALL mantener comentarios útiles que expliquen lógica compleja
7. WHEN el Módulo_Servidor procesa una petición, THE Módulo_Servidor SHALL mantener la misma funcionalidad que antes de la refactorización

### Requisito 5: Refactorización de Código del Cliente

**User Story:** Como desarrollador del sistema, quiero refactorizar el código del cliente para mejorar su estructura y eliminar redundancias, manteniendo la funcionalidad existente.

#### Acceptance Criteria

1. THE Módulo_Cliente SHALL consolidar funciones de manipulación del DOM repetidas en utils.js
2. THE Módulo_Cliente SHALL eliminar variables globales innecesarias
3. THE Módulo_Cliente SHALL consolidar event listeners duplicados
4. THE Módulo_Cliente SHALL extraer lógica de validación de formularios en funciones reutilizables
5. THE Módulo_Cliente SHALL mantener la separación de responsabilidades entre vistas
6. THE Módulo_Cliente SHALL eliminar código muerto y funciones no utilizadas
7. WHEN el usuario interactúa con la interfaz, THE Módulo_Cliente SHALL mantener el mismo comportamiento que antes de la refactorización

### Requisito 6: Optimización de Consultas y Operaciones de Base de Datos

**User Story:** Como desarrollador del sistema, quiero optimizar las consultas y operaciones de base de datos, para que el sistema sea más eficiente sin cambiar la funcionalidad.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL identificar consultas SQL repetidas en db.js
2. THE Sistema_WMS SHALL consolidar consultas similares en funciones parametrizadas
3. THE Sistema_WMS SHALL mantener índices apropiados en las tablas de base de datos
4. THE Sistema_WMS SHALL eliminar consultas redundantes que obtienen los mismos datos
5. THE Sistema_WMS SHALL optimizar consultas con múltiples JOINs cuando sea posible
6. WHEN el Sistema_WMS ejecuta una consulta optimizada, THE Sistema_WMS SHALL retornar los mismos datos que la consulta original
7. WHEN el Sistema_WMS ejecuta operaciones de base de datos, THE Sistema_WMS SHALL completar las operaciones en tiempo razonable

### Requisito 7: Preservación del Flujo Crítico

**User Story:** Como operador del almacén, quiero que el flujo crítico de Montacarguista → Auxiliar (picking) se mantenga completamente funcional después de la limpieza, para que las operaciones diarias no se vean afectadas.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL mantener intacta la funcionalidad de la vista montacarguista
2. THE Sistema_WMS SHALL mantener intacta la funcionalidad de la vista picking
3. THE Sistema_WMS SHALL preservar la integración entre montacarguista y picking
4. THE Sistema_WMS SHALL mantener la funcionalidad de descenso de mercancía desde rack alto
5. THE Sistema_WMS SHALL mantener la funcionalidad de alistamiento en zona auxiliar
6. THE Sistema_WMS SHALL mantener la funcionalidad de confirmación de picking
7. WHEN un usuario ejecuta el Flujo_Crítico completo, THE Sistema_WMS SHALL completar todas las operaciones sin errores

### Requisito 8: Validación y Pruebas Básicas

**User Story:** Como desarrollador del sistema, quiero validar que el código limpio funciona correctamente mediante pruebas básicas, para asegurar que no se introdujeron errores durante la refactorización.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL arrancar sin errores de sintaxis
2. THE Sistema_WMS SHALL cargar todas las vistas activas sin errores de consola
3. THE Sistema_WMS SHALL conectar exitosamente a la base de datos SQLite
4. THE Sistema_WMS SHALL responder correctamente a peticiones GET en todos los endpoints activos
5. THE Sistema_WMS SHALL responder correctamente a peticiones POST en todos los endpoints activos
6. WHEN el Sistema_WMS arranca, THE Sistema_WMS SHALL mostrar el mensaje de confirmación en consola
7. WHEN un usuario navega entre vistas, THE Sistema_WMS SHALL cargar cada vista sin errores

### Requisito 9: Documentación del Código Limpio

**User Story:** Como desarrollador futuro del sistema, quiero que el código limpio esté adecuadamente documentado, para que pueda entender rápidamente la estructura y funcionalidad del sistema.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL incluir comentarios descriptivos en funciones complejas
2. THE Sistema_WMS SHALL mantener el archivo README.md actualizado con la estructura del proyecto
3. THE Sistema_WMS SHALL documentar las funciones utilitarias en utils.js con JSDoc
4. THE Sistema_WMS SHALL documentar los endpoints REST en server.js con comentarios
5. THE Sistema_WMS SHALL incluir comentarios explicativos en la lógica de negocio de db.js
6. THE Sistema_WMS SHALL eliminar comentarios obsoletos o engañosos
7. WHEN un desarrollador lee el código, THE Sistema_WMS SHALL proporcionar suficiente contexto para entender la funcionalidad

### Requisito 10: Preparación para Repositorio

**User Story:** Como administrador del proyecto, quiero que el código esté preparado para ser subido al repositorio, para que cumpla con estándares de calidad y no incluya archivos innecesarios.

#### Acceptance Criteria

1. THE Sistema_WMS SHALL incluir un archivo .gitignore apropiado
2. THE Sistema_WMS SHALL excluir el archivo db.sqlite del repositorio
3. THE Sistema_WMS SHALL excluir la carpeta node_modules del repositorio
4. THE Sistema_WMS SHALL incluir solo archivos de código fuente necesarios
5. THE Sistema_WMS SHALL mantener una estructura de carpetas clara y organizada
6. THE Sistema_WMS SHALL eliminar archivos temporales o de prueba
7. WHEN el código se sube al Repositorio, THE Sistema_WMS SHALL incluir solo archivos relevantes y necesarios
