const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Configuración de la Base de Datos SQLite
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new DatabaseSync(dbPath);

// Inicializar tablas
db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
        nit TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        telefono TEXT,
        direccion TEXT,
        correo TEXT
    );

    CREATE TABLE IF NOT EXISTS proveedores (
        nit TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        telefono TEXT,
        direccion TEXT,
        correo TEXT
    );

    CREATE TABLE IF NOT EXISTS productos (
        codigo TEXT PRIMARY KEY,
        descripcion TEXT NOT NULL,
        peso REAL,
        valor_venta REAL,
        marca TEXT,
        alto REAL,
        largo REAL,
        ancho REAL
    );

    CREATE TABLE IF NOT EXISTS ordenes_compra (
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

    CREATE TABLE IF NOT EXISTS ordenes_servicio (
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

    CREATE TABLE IF NOT EXISTS ventas (
        remision TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        cliente_nit TEXT,
        observaciones TEXT,
        iva REAL DEFAULT 0,
        items TEXT NOT NULL,
        estado TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Pre-alistado', 'Completado'
        FOREIGN KEY(cliente_nit) REFERENCES clientes(nit)
    );

    CREATE TABLE IF NOT EXISTS inventario_movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_producto TEXT NOT NULL,
        tipo TEXT NOT NULL, -- 'IN' o 'OUT'
        documento_referencia TEXT,
        fecha TEXT NOT NULL,
        cantidad REAL NOT NULL,
        ubicacion TEXT NOT NULL,
        FOREIGN KEY(codigo_producto) REFERENCES productos(codigo)
    );
`);

console.log('Base de datos SQLite inicializada correctamente en: ' + dbPath);

// Utilidades del servidor
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
    });
}

function sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Servidor HTTP
const server = http.createServer(async (req, res) => {
    // Manejo de CORS para desarrollo y local
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // --- API REST ENDPOINTS ---

    // CLIENTES
    if (pathname === '/api/clientes') {
        if (req.method === 'GET') {
            try {
                const stmt = db.prepare('SELECT * FROM clientes ORDER BY nombre');
                const rows = stmt.all();
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const stmt = db.prepare('INSERT OR REPLACE INTO clientes (nit, nombre, telefono, direccion, correo) VALUES (?, ?, ?, ?, ?)');
                stmt.run(body.nit, body.nombre, body.telefono, body.direccion, body.correo);
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // PROVEEDORES
    if (pathname === '/api/proveedores') {
        if (req.method === 'GET') {
            try {
                const stmt = db.prepare('SELECT * FROM proveedores ORDER BY nombre');
                const rows = stmt.all();
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const stmt = db.prepare('INSERT OR REPLACE INTO proveedores (nit, nombre, telefono, direccion, correo) VALUES (?, ?, ?, ?, ?)');
                stmt.run(body.nit, body.nombre, body.telefono, body.direccion, body.correo);
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // PRODUCTOS
    if (pathname === '/api/productos') {
        if (req.method === 'GET') {
            try {
                const stmt = db.prepare('SELECT * FROM productos ORDER BY codigo');
                const rows = stmt.all();
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const stmt = db.prepare('INSERT OR REPLACE INTO productos (codigo, descripcion, peso, valor_venta, marca, alto, largo, ancho) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                stmt.run(body.codigo, body.descripcion, body.peso, body.valor_venta, body.marca, body.alto, body.largo, body.ancho);
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // ÓRDENES DE COMPRA
    if (pathname === '/api/compras') {
        if (req.method === 'GET') {
            try {
                const query = `
                    SELECT oc.*, p.nombre as proveedor_nombre 
                    FROM ordenes_compra oc
                    LEFT JOIN proveedores p ON oc.proveedor_nit = p.nit
                    ORDER BY oc.fecha DESC
                `;
                const stmt = db.prepare(query);
                const rows = stmt.all();
                // Parse items JSON
                rows.forEach(row => {
                    row.items = JSON.parse(row.items);
                });
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO ordenes_compra 
                    (consecutivo, fecha, proveedor_nit, observaciones, descuento, iva, retencion, condiciones_envio, forma_pago, fecha_envio, items) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                stmt.run(
                    body.consecutivo,
                    body.fecha,
                    body.proveedor_nit,
                    body.observaciones,
                    body.descuento || 0,
                    body.iva || 0,
                    body.retencion || 0,
                    body.condiciones_envio,
                    body.forma_pago,
                    body.fecha_envio,
                    JSON.stringify(body.items)
                );
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // ÓRDENES DE SERVICIO
    if (pathname === '/api/servicios') {
        if (req.method === 'GET') {
            try {
                const query = `
                    SELECT os.*, p.nombre as proveedor_nombre 
                    FROM ordenes_servicio os
                    LEFT JOIN proveedores p ON os.proveedor_nit = p.nit
                    ORDER BY os.fecha DESC
                `;
                const stmt = db.prepare(query);
                const rows = stmt.all();
                rows.forEach(row => {
                    row.items = JSON.parse(row.items);
                });
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO ordenes_servicio 
                    (consecutivo, fecha, proveedor_nit, observaciones, descuento, iva, retencion, condiciones_envio, forma_pago, fecha_envio, items) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                stmt.run(
                    body.consecutivo,
                    body.fecha,
                    body.proveedor_nit,
                    body.observaciones,
                    body.descuento || 0,
                    body.iva || 0,
                    body.retencion || 0,
                    body.condiciones_envio,
                    body.forma_pago,
                    body.fecha_envio,
                    JSON.stringify(body.items)
                );
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // VENTAS (REMISIÓN / FACTURA)
    if (pathname === '/api/ventas') {
        if (req.method === 'GET') {
            try {
                const query = `
                    SELECT v.*, c.nombre as cliente_nombre 
                    FROM ventas v
                    LEFT JOIN clientes c ON v.cliente_nit = c.nit
                    ORDER BY v.fecha DESC
                `;
                const stmt = db.prepare(query);
                const rows = stmt.all();
                rows.forEach(row => {
                    row.items = JSON.parse(row.items);
                });
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO ventas 
                    (remision, fecha, cliente_nit, observaciones, iva, items, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                stmt.run(
                    body.remision,
                    body.fecha,
                    body.cliente_nit,
                    body.observaciones,
                    body.iva || 0,
                    JSON.stringify(body.items),
                    body.estado || 'Pendiente'
                );
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // CONSOLIDADO DIARIO DE VENTAS (Para Montacarguista)
    if (pathname === '/api/ventas/consolidado') {
        if (req.method === 'GET') {
            try {
                const fecha = parsedUrl.searchParams.get('fecha');
                if (!fecha) {
                    return sendJSON(res, 400, { error: 'Falta el parámetro de fecha' });
                }
                const query = `
                    SELECT v.remision, v.fecha, v.estado, c.nombre as cliente_nombre, v.items
                    FROM ventas v
                    LEFT JOIN clientes c ON v.cliente_nit = c.nit
                    WHERE v.fecha = ?
                    ORDER BY v.remision ASC
                `;
                const stmt = db.prepare(query);
                const rows = stmt.all(fecha);
                
                // Procesar total items y total de unidades solicitadas
                const consolidado = rows.map(row => {
                    const items = JSON.parse(row.items);
                    const totalUnidades = items.reduce((sum, item) => sum + Number(item.cantidad), 0);
                    return {
                        remision: row.remision,
                        fecha: row.fecha,
                        estado: row.estado,
                        cliente_nombre: row.cliente_nombre,
                        total_items: items.length,
                        total_unidades: totalUnidades
                    };
                });

                return sendJSON(res, 200, consolidado);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
    }

    // PRE-ALISTAMIENTO DE PICKING POR FACTURA
    if (pathname === '/api/ventas/picking') {
        if (req.method === 'GET') {
            try {
                const remision = parsedUrl.searchParams.get('remision');
                if (!remision) {
                    return sendJSON(res, 400, { error: 'Falta el parámetro de remision' });
                }

                // Obtener detalles de la remisión
                const stmtVenta = db.prepare(`
                    SELECT v.*, c.nombre as cliente_nombre 
                    FROM ventas v 
                    LEFT JOIN clientes c ON v.cliente_nit = c.nit
                    WHERE v.remision = ?
                `);
                const venta = stmtVenta.all(remision)[0];
                if (!venta) {
                    return sendJSON(res, 404, { error: 'No se encontró la factura/remisión especificada.' });
                }

                const items = JSON.parse(venta.items);
                const pickingDetails = [];

                // Para cada ítem, consultar stock actual por ubicación
                for (const item of items) {
                    const queryStock = `
                        SELECT ubicacion, SUM(CASE WHEN tipo = 'IN' THEN cantidad ELSE -cantidad END) as stock
                        FROM inventario_movimientos
                        WHERE codigo_producto = ?
                        GROUP BY ubicacion
                        HAVING stock > 0
                    `;
                    const stmtStock = db.prepare(queryStock);
                    const stockUbicaciones = stmtStock.all(item.codigo);

                    const totalDisponible = stockUbicaciones.reduce((sum, u) => sum + u.stock, 0);

                    pickingDetails.push({
                        codigo: item.codigo,
                        descripcion: item.descripcion,
                        cantidad_solicitada: item.cantidad,
                        total_disponible: totalDisponible,
                        ubicaciones: stockUbicaciones.map(u => ({
                            ubicacion: u.ubicacion,
                            stock: u.stock
                        }))
                    });
                }

                return sendJSON(res, 200, {
                    remision: venta.remision,
                    fecha: venta.fecha,
                    cliente_nombre: venta.cliente_nombre,
                    estado: venta.estado,
                    items: pickingDetails
                });
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
    }

    // CONFIRMAR ALISTAMIENTO / PICKING (Generar egresos en inventario)
    if (pathname === '/api/ventas/confirmar-picking') {
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const { remision, itemsDespachados } = body;

                if (!remision || !itemsDespachados || !Array.isArray(itemsDespachados)) {
                    return sendJSON(res, 400, { error: 'Datos de picking inválidos.' });
                }

                // Iniciar transacciones registrando cada egreso
                const stmtInsertMov = db.prepare(`
                    INSERT INTO inventario_movimientos (codigo_producto, tipo, documento_referencia, fecha, cantidad, ubicacion)
                    VALUES (?, 'OUT', ?, ?, ?, ?)
                `);

                const fechaActual = new Date().toISOString().split('T')[0];

                for (const item of itemsDespachados) {
                    // item: { codigo, cantidad, ubicacion }
                    if (item.cantidad > 0) {
                        stmtInsertMov.run(
                            item.codigo,
                            remision,
                            fechaActual,
                            item.cantidad,
                            item.ubicacion
                        );
                    }
                }

                // Actualizar estado de la venta
                const stmtUpdateVenta = db.prepare(`
                    UPDATE ventas SET estado = 'Completado' WHERE remision = ?
                `);
                stmtUpdateVenta.run(remision);

                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
    }

    // MOVIMIENTOS DE INVENTARIO (RECIBO - IN)
    if (pathname === '/api/inventario/movimientos') {
        if (req.method === 'GET') {
            try {
                const stmt = db.prepare('SELECT * FROM inventario_movimientos ORDER BY id DESC LIMIT 500');
                const rows = stmt.all();
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
        if (req.method === 'POST') {
            try {
                const body = await getRequestBody(req);
                // body: { codigo_producto, tipo, documento_referencia, fecha, cantidad, ubicacion }
                const stmt = db.prepare(`
                    INSERT INTO inventario_movimientos 
                    (codigo_producto, tipo, documento_referencia, fecha, cantidad, ubicacion) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                stmt.run(
                    body.codigo_producto,
                    body.tipo, // 'IN' o 'OUT'
                    body.documento_referencia,
                    body.fecha,
                    body.cantidad,
                    body.ubicacion
                );

                // Si es un ingreso (IN) de una OC, podemos marcar/hacer verificaciones si es necesario.
                return sendJSON(res, 200, { success: true });
            } catch (err) {
                return sendJSON(res, 400, { error: err.message });
            }
        }
    }

    // STOCK GLOBAL CONSOLIDADO DE INVENTARIO
    if (pathname === '/api/inventario/stock') {
        if (req.method === 'GET') {
            try {
                const query = `
                    SELECT p.codigo, p.descripcion, p.marca, p.peso,
                           SUM(CASE WHEN m.tipo = 'IN' THEN m.cantidad ELSE -m.cantidad END) as stock_total
                    FROM productos p
                    LEFT JOIN inventario_movimientos m ON p.codigo = m.codigo_producto
                    GROUP BY p.codigo
                `;
                const stmt = db.prepare(query);
                const rows = stmt.all();
                // Filtrar nulos si el producto nunca ha tenido movimientos (stock_total = null -> stock_total = 0)
                rows.forEach(row => {
                    row.stock_total = row.stock_total || 0;
                });
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
    }

    // STOCK DETALLADO POR UBICACIÓN DE UN PRODUCTO
    if (pathname === '/api/inventario/stock/detalle') {
        if (req.method === 'GET') {
            try {
                const codigo = parsedUrl.searchParams.get('codigo');
                if (!codigo) {
                    return sendJSON(res, 400, { error: 'Falta el código del producto' });
                }
                const query = `
                    SELECT ubicacion, SUM(CASE WHEN tipo = 'IN' THEN cantidad ELSE -cantidad END) as stock
                    FROM inventario_movimientos
                    WHERE codigo_producto = ?
                    GROUP BY ubicacion
                    HAVING stock > 0
                    ORDER BY ubicacion ASC
                `;
                const stmt = db.prepare(query);
                const rows = stmt.all(codigo);
                return sendJSON(res, 200, rows);
            } catch (err) {
                return sendJSON(res, 500, { error: err.message });
            }
        }
    }

    // --- MANEJO DE ARCHIVOS ESTÁTICOS (FRONTEND) ---
    const reqPath = pathname;
    const publicDir = path.join(__dirname, 'client');
    let filePath = path.join(publicDir, reqPath === '/' ? 'index.html' : reqPath);

    // Evitar Traversal Directory
    if (!filePath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end('Acceso denegado');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Archivo no encontrado');
            } else {
                res.writeHead(500);
                res.end('Error interno de servidor: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  HABITAD WMS SERVER CORRIENDO LOCALMENTE`);
    console.log(`  URL de la aplicación: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
