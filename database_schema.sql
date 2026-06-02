-- ==========================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS WMS (POSTGRESQL)
-- Para ejecutar en el Query Tool de pgAdmin 4
-- ==========================================

-- 1. Crear Tablas Principales
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
    ancho REAL,
    unidad_compra TEXT DEFAULT 'Und',
    unidad_consumo TEXT DEFAULT 'Und'
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
    CONSTRAINT fk_proveedor FOREIGN KEY(proveedor_nit) REFERENCES proveedores(nit)
);

CREATE TABLE IF NOT EXISTS ventas (
    remision TEXT PRIMARY KEY,
    fecha TEXT NOT NULL,
    cliente_nit TEXT,
    observaciones TEXT,
    iva REAL DEFAULT 0,
    items TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente',
    auxiliar TEXT,
    CONSTRAINT fk_cliente FOREIGN KEY(cliente_nit) REFERENCES clientes(nit)
);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
    id SERIAL PRIMARY KEY,
    codigo_producto TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'IN' o 'OUT'
    documento_referencia TEXT,
    fecha TEXT NOT NULL,
    cantidad REAL NOT NULL,
    ubicacion TEXT NOT NULL,
    CONSTRAINT fk_producto FOREIGN KEY(codigo_producto) REFERENCES productos(codigo)
);

-- 2. Crear Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON inventario_movimientos(codigo_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_ubicacion ON inventario_movimientos(ubicacion);
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia ON inventario_movimientos(documento_referencia);
