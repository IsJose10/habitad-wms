# Script de Prueba de la API del Servidor WMS

$ErrorActionPreference = "Stop"

Write-Host "=== INICIANDO PRUEBAS DE API DE HABITAD WMS ===" -ForegroundColor Cyan

# 1. Registrar Producto
$prod = @{
    codigo = "TEST-01"
    descripcion = "Filtro Aire Premium"
    peso = 2.5
    valor_venta = 45000
    marca = "HABITAD"
    alto = 0.5
    largo = 0.4
    ancho = 0.4
}
$resProd = Invoke-RestMethod -Uri "http://localhost:3000/api/productos" -Method Post -Body ($prod | ConvertTo-Json) -ContentType "application/json"
Write-Host "1. Producto registrado:" $resProd.success -ForegroundColor Green

# 2. Registrar Cliente
$cli = @{
    nit = "900123456"
    nombre = "Transportes del Caribe"
    telefono = "3001234567"
    direccion = "Av. Circunvalar 45"
    correo = "operaciones@transcaribe.com"
}
$resCli = Invoke-RestMethod -Uri "http://localhost:3000/api/clientes" -Method Post -Body ($cli | ConvertTo-Json) -ContentType "application/json"
Write-Host "2. Cliente registrado:" $resCli.success -ForegroundColor Green

# 3. Registrar Proveedor
$prov = @{
    nit = "800987654"
    nombre = "Filtros y Autopartes del Norte"
    telefono = "3159876543"
    direccion = "Calle 80 #12-56"
    correo = "ventas@filtrosnorte.com"
}
$resProv = Invoke-RestMethod -Uri "http://localhost:3000/api/proveedores" -Method Post -Body ($prov | ConvertTo-Json) -ContentType "application/json"
Write-Host "3. Proveedor registrado:" $resProv.success -ForegroundColor Green

# 4. Registrar Orden de Compra (OC)
$oc = @{
    consecutivo = "OC-1001"
    fecha = "2026-05-22"
    proveedor_nit = "800987654"
    observaciones = "OC de prueba"
    descuento = 0
    iva = 19
    retencion = 0
    condiciones_envio = "A Bodega"
    forma_pago = "Credito"
    fecha_envio = "2026-05-22"
    items = @(
        @{
            item = "1"
            codigo = "TEST-01"
            descripcion = "Filtro Aire Premium"
            cantidad = 100
            v_unitario = 30000
        }
    )
}
$resOC = Invoke-RestMethod -Uri "http://localhost:3000/api/compras" -Method Post -Body ($oc | ConvertTo-Json) -ContentType "application/json"
Write-Host "4. Orden de Compra registrada:" $resOC.success -ForegroundColor Green

# 5. Registrar Movimiento de Ingreso (IN) de Inventario (recibo de 100 unidades en la ubicación A-05-1)
$mov = @{
    codigo_producto = "TEST-01"
    tipo = "IN"
    documento_referencia = "OC-1001"
    fecha = "2026-05-22"
    cantidad = 100
    ubicacion = "V010510"
}
$resMov = Invoke-RestMethod -Uri "http://localhost:3000/api/inventario/movimientos" -Method Post -Body ($mov | ConvertTo-Json) -ContentType "application/json"
Write-Host "5. Movimiento de ingreso (IN) registrado:" $resMov.success -ForegroundColor Green

# 6. Registrar Remisión de Venta
$venta = @{
    remision = "REM-2001"
    fecha = "2026-05-22"
    cliente_nit = "900123456"
    observaciones = "Venta de prueba"
    iva = 19
    items = @(
        @{
            item = "1"
            codigo = "TEST-01"
            descripcion = "Filtro Aire Premium"
            cantidad = 35
            v_unitario = 45000
        }
    )
    estado = "Pendiente"
}
$resVenta = Invoke-RestMethod -Uri "http://localhost:3000/api/ventas" -Method Post -Body ($venta | ConvertTo-Json) -ContentType "application/json"
Write-Host "6. Remisión de venta registrada:" $resVenta.success -ForegroundColor Green

# 7. Consultar Alistamiento de Picking (Pre-alistamiento)
$picking = Invoke-RestMethod -Uri "http://localhost:3000/api/ventas/picking?remision=REM-2001"
Write-Host "7. Pre-alistamiento consultado con éxito para remisión:" $picking.remision -ForegroundColor Green
Write-Host "   - Cliente:" $picking.cliente_nombre
Write-Host "   - Estado actual de remisión:" $picking.estado
Write-Host "   - Producto solicitado:" $picking.items[0].codigo
Write-Host "   - Cantidad solicitada:" $picking.items[0].cantidad_solicitada
Write-Host "   - Stock total disponible:" $picking.items[0].total_disponible
Write-Host "   - Ubicaciones sugeridas:" $picking.items[0].ubicaciones[0].ubicacion "(Stock:" $picking.items[0].ubicaciones[0].stock ")"

# 8. Confirmar Picking (Retirar 35 unidades de A-05-1)
$confirm = @{
    remision = "REM-2001"
    itemsDespachados = @(
        @{
            codigo = "TEST-01"
            cantidad = 35
            ubicacion = "V010510"
        }
    )
}
$resConfirm = Invoke-RestMethod -Uri "http://localhost:3000/api/ventas/confirmar-picking" -Method Post -Body ($confirm | ConvertTo-Json) -ContentType "application/json"
Write-Host "8. Picking y despacho confirmado:" $resConfirm.success -ForegroundColor Green

# 9. Consultar Stock Consolidado Final
$stock = Invoke-RestMethod -Uri "http://localhost:3000/api/inventario/stock"
Write-Host "9. Stock consolidado consultado. Stock total para TEST-01:" $stock[0].stock_total -ForegroundColor Green

# 10. Consultar Detalle de Ubicaciones para TEST-01
$stockDetalle = Invoke-RestMethod -Uri "http://localhost:3000/api/inventario/stock/detalle?codigo=TEST-01"
Write-Host "10. Stock por ubicación para TEST-01:" -ForegroundColor Green
Write-Host "    - Ubicación:" $stockDetalle[0].ubicacion "- Stock:" $stockDetalle[0].stock

Write-Host "=== TODAS LAS PRUEBAS DE API SE COMPLETARON EXITOSAMENTE ===" -ForegroundColor Cyan
