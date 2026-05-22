// URL Base para la API (Mismo host ya que el servidor sirve los archivos estáticos)
const API_URL = '/api';

// ESTADO GLOBAL DE LA APLICACIÓN
const state = {
    currentView: 'dashboard',
    clientes: [],
    proveedores: [],
    productos: [],
    movimientosRecientes: []
};

// ============================================================
// MÓDULO DE NOMENCLATURA DE UBICACIONES
// Formato: V[VV][NN][PP]
//   VV = Vano/Zona  : 01 a 03
//   NN = Nivel      : 01 a 40
//   PP = Posición   : 10, 14, 20, 24, 30, 34, 40, 44, 50, 54, 60, 64
// Ejemplo: V011010 = Vano 01 - Nivel 10 - Posición 10
// ============================================================
const UBICACION = {
    vanos: Array.from({ length: 3 },  (_, i) => String(i + 1).padStart(2, '0')),  // 01-03
    niveles: Array.from({ length: 40 }, (_, i) => String(i + 1).padStart(2, '0')), // 01-40
    posiciones: ['10', '14', '20', '24', '30', '34', '40', '44', '50', '54', '60', '64']
};

/**
 * Genera el HTML para un selector de ubicación de 3 partes.
 * @param {string} prefix - Prefijo único para distinguir los selects (ej: 'in-0', 'out')
 * @param {string} currentVal - Valor actual de la ubicación para preseleccionar (ej: 'V011010')
 */
function ubicacionSelectorHTML(prefix, currentVal = '') {
    // Descomponer valor actual si existe: V011010 → vano=01, nivel=10, pos=10
    let selVano = '01', selNivel = '01', selPos = '10';
    if (currentVal && currentVal.length === 7 && currentVal.startsWith('V')) {
        selVano  = currentVal.substring(1, 3);
        selNivel = currentVal.substring(3, 5);
        selPos   = currentVal.substring(5, 7);
    }

    const vanoOpts  = UBICACION.vanos.map(v    => `<option value="${v}" ${v === selVano ? 'selected' : ''}>V${v}</option>`).join('');
    const nivelOpts = UBICACION.niveles.map(n   => `<option value="${n}" ${n === selNivel ? 'selected' : ''}>${n}</option>`).join('');
    const posOpts   = UBICACION.posiciones.map(p => `<option value="${p}" ${p === selPos ? 'selected' : ''}>${p}</option>`).join('');

    return `
        <div class="ubicacion-selector" id="ubi-wrap-${prefix}">
            <select class="ubi-vano" data-ubi-prefix="${prefix}" onchange="actualizarCodigoUbicacion('${prefix}')">${vanoOpts}</select>
            <select class="ubi-nivel" data-ubi-prefix="${prefix}" onchange="actualizarCodigoUbicacion('${prefix}')">${nivelOpts}</select>
            <select class="ubi-pos"  data-ubi-prefix="${prefix}" onchange="actualizarCodigoUbicacion('${prefix}')">${posOpts}</select>
            <span class="ubi-code-preview" id="ubi-code-${prefix}">V${selVano}${selNivel}${selPos}</span>
        </div>
    `;
}

/** Recalcula y muestra el código compuesto cada vez que cambia un select */
function actualizarCodigoUbicacion(prefix) {
    const wrap  = document.getElementById(`ubi-wrap-${prefix}`);
    const vano  = wrap.querySelector('.ubi-vano').value;
    const nivel = wrap.querySelector('.ubi-nivel').value;
    const pos   = wrap.querySelector('.ubi-pos').value;
    document.getElementById(`ubi-code-${prefix}`).textContent = `V${vano}${nivel}${pos}`;
}

/** Lee el código final de un selector de ubicación */
function getUbicacionCode(prefix) {
    const el = document.getElementById(`ubi-code-${prefix}`);
    return el ? el.textContent.trim() : '';
}

/** Valida que un código tenga el formato correcto (V + 6 dígitos) */
function validarUbicacion(code) {
    if (!/^V\d{6}$/.test(code)) return false;
    const vano  = code.substring(1, 3);
    const nivel = code.substring(3, 5);
    const pos   = code.substring(5, 7);
    return UBICACION.vanos.includes(vano) &&
           UBICACION.niveles.includes(nivel) &&
           UBICACION.posiciones.includes(pos);
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDateInputs();
    
    // Cargar catálogos iniciales
    loadCatalogos();
    
    // Cargar datos iniciales del Dashboard
    loadDashboardStats();
    
    // Configurar observadores de formularios
    configFormObservers();
});

// --- NAVEGACIÓN Y VISTAS ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            showView(viewName);
            
            // Actualizar clase activa
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showView(viewName) {
    state.currentView = viewName;
    
    // Ocultar todas las vistas
    document.querySelectorAll('.view-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Mostrar vista seleccionada
    const activePane = document.getElementById(`view-${viewName}`);
    if (activePane) {
        activePane.classList.add('active');
    }
    
    // Actualizar título en encabezado
    const viewTitles = {
        dashboard: 'Dashboard',
        montacarguista: 'Consolidado Diario - Montacarguista',
        picking: 'Alistamiento de Picking - Auxiliar',
        inventario: 'Inventario (Ubicaciones y Stock)',
        entradas: 'Recibo de Mercancía (IN)',
        salidas: 'Despacho de Mercancía (OUT)',
        compras: 'Órdenes de Compra (OC)',
        servicios: 'Órdenes de Servicio (OS)',
        ventas: 'Ventas y Remisiones',
        productos: 'Catálogo de Productos',
        clientes: 'Gestión de Clientes',
        proveedores: 'Gestión de Proveedores'
    };
    
    document.getElementById('viewTitle').textContent = viewTitles[viewName] || 'HABITAD WMS';
    
    // Acciones al cargar vistas específicas
    if (viewName === 'dashboard') {
        loadDashboardStats();
    } else if (viewName === 'inventario') {
        loadStockGlobal();
    } else if (viewName === 'productos') {
        loadProductos();
    } else if (viewName === 'clientes') {
        loadClientes();
    } else if (viewName === 'proveedores') {
        loadProveedores();
    } else if (viewName === 'salidas') {
        loadMovimientosRecientes();
        populateProductosSelect('out-producto');
    } else if (viewName === 'entradas') {
        limpiarFormRecibo();
    } else if (viewName === 'compras') {
        limpiarFormOC();
        populateProveedoresSelect('oc-proveedor');
    } else if (viewName === 'servicios') {
        limpiarFormOS();
        populateProveedoresSelect('os-proveedor');
    } else if (viewName === 'ventas') {
        limpiarFormVenta();
        populateClientesSelect('venta-cliente');
    } else if (viewName === 'montacarguista') {
        // Poner fecha de hoy si está vacío
        const inputFecha = document.getElementById('monta-fecha');
        if (!inputFecha.value) {
            inputFecha.value = new Date().toISOString().split('T')[0];
        }
        loadMontacarguistaConsolidado();
    }
}

function initDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['oc-fecha', 'oc-fecha-envio', 'os-fecha', 'os-fecha-envio', 'venta-fecha', 'in-fecha', 'out-fecha', 'monta-fecha'];
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });
}

function configFormObservers() {
    // Al cerrar modales haciendo clic afuera
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('inv-details-panel');
        if (e.target === modal) {
            closeInvDetails();
        }
    });
}

// --- CONEXIÓN CON BACKEND (APIS) ---
async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const res = await fetch(`${API_URL}${endpoint}`, options);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `Error HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error('Error de API:', err);
        alert(`Error: ${err.message}`);
        throw err;
    }
}

// Cargar Catálogos Generales en Memoria
async function loadCatalogos() {
    try {
        state.clientes = await fetchAPI('/clientes') || [];
        state.proveedores = await fetchAPI('/proveedores') || [];
        state.productos = await fetchAPI('/productos') || [];
    } catch (err) {
        console.warn('No se pudieron cargar algunos catálogos iniciales.');
    }
}

// --- VISTA: DASHBOARD ---
async function loadDashboardStats() {
    try {
        const productos = await fetchAPI('/productos') || [];
        const stock = await fetchAPI('/inventario/stock') || [];
        const movimientos = await fetchAPI('/inventario/movimientos') || [];
        const ventas = await fetchAPI('/ventas') || [];
        
        const todayStr = new Date().toISOString().split('T')[0];
        const ventasHoy = ventas.filter(v => v.fecha === todayStr);
        const pickingPendientes = ventas.filter(v => v.estado === 'Pendiente' || v.estado === 'Pre-alistado');
        
        document.getElementById('dash-total-productos').textContent = productos.length;
        document.getElementById('dash-ventas-hoy').textContent = ventasHoy.length;
        document.getElementById('dash-picking-pendiente').textContent = pickingPendientes.length;
        document.getElementById('dash-total-movimientos').textContent = movimientos.length;
        
        // Cargar Remisiones Recientes
        const recentBody = document.getElementById('dash-ventas-recent');
        recentBody.innerHTML = '';
        if (ventas.length === 0) {
            recentBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay remisiones registradas</td></tr>';
        } else {
            ventas.slice(0, 5).forEach(v => {
                const badgeClass = v.estado === 'Completado' ? 'badge-completed' : 'badge-pending';
                recentBody.innerHTML += `
                    <tr>
                        <td><strong>${v.remision}</strong></td>
                        <td>${v.fecha}</td>
                        <td>${v.cliente_nombre || v.cliente_nit}</td>
                        <td><span class="badge ${badgeClass}">${v.estado}</span></td>
                    </tr>
                `;
            });
        }
        
        // Cargar Resumen de Stock
        const stockBody = document.getElementById('dash-stock-summary');
        stockBody.innerHTML = '';
        if (stock.length === 0) {
            stockBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay stock registrado</td></tr>';
        } else {
            stock.slice(0, 5).forEach(s => {
                stockBody.innerHTML += `
                    <tr>
                        <td><strong>${s.codigo}</strong></td>
                        <td>${s.descripcion}</td>
                        <td class="text-center"><span class="badge ${s.stock_total > 0 ? 'badge-completed' : 'badge-danger'}">${s.stock_total}</span></td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error('Error al cargar estadísticas del Dashboard', err);
    }
}

// --- VISTA: MONTACARGUISTA (CONSOLIDADO DIARIO) ---
async function loadMontacarguistaConsolidado() {
    const fecha = document.getElementById('monta-fecha').value;
    if (!fecha) {
        alert('Por favor ingrese una fecha válida.');
        return;
    }
    
    try {
        const datos = await fetchAPI(`/ventas/consolidado?fecha=${fecha}`);
        const tbody = document.getElementById('monta-consolidado-body');
        document.getElementById('monta-fecha-title').textContent = `Consolidado de Facturas (${fecha})`;
        document.getElementById('monta-total-facturas').textContent = `${datos.length} Remisión(es)`;
        
        tbody.innerHTML = '';
        if (datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay facturas/remisiones registradas para este día.</td></tr>';
            return;
        }
        
        datos.forEach(row => {
            let badgeClass = 'badge-pending';
            if (row.estado === 'Completado') badgeClass = 'badge-completed';
            else if (row.estado === 'Pre-alistado') badgeClass = 'badge-pre-alistado';
            
            const btnPicking = row.estado !== 'Completado' 
                ? `<button class="btn btn-primary btn-sm" onclick="iniciarPickingDesdeMonta('${row.remision}')">📋 Alistar Picking</button>`
                : `<span class="badge badge-completed">Completado ✔️</span>`;
                
            tbody.innerHTML += `
                <tr>
                    <td><strong>${row.remision}</strong></td>
                    <td>${row.cliente_nombre || 'Cliente Genérico'}</td>
                    <td class="text-center">${row.total_items}</td>
                    <td class="text-center">${row.total_unidades}</td>
                    <td><span class="badge ${badgeClass}">${row.estado}</span></td>
                    <td>${btnPicking}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

function iniciarPickingDesdeMonta(remision) {
    document.getElementById('pick-remision-input').value = remision;
    showView('picking');
    consultarPickingFactura();
}

// --- VISTA: AUXILIAR DE PICKING (PRE-ALISTAMIENTO) ---
let currentPickingData = null;

async function consultarPickingFactura() {
    const remision = document.getElementById('pick-remision-input').value.trim();
    if (!remision) {
        alert('Por favor ingrese el número de remisión.');
        return;
    }
    
    try {
        const picking = await fetchAPI(`/ventas/picking?remision=${remision}`);
        currentPickingData = picking;
        
        document.getElementById('pick-rem-id').textContent = picking.remision;
        document.getElementById('pick-rem-cliente').textContent = picking.cliente_nombre || 'No asignado';
        document.getElementById('pick-rem-fecha').textContent = picking.fecha;
        
        const badge = document.getElementById('pick-rem-estado');
        badge.textContent = picking.estado;
        badge.className = 'badge ' + (picking.estado === 'Completado' ? 'badge-completed' : 'badge-pending');
        
        const tbody = document.getElementById('picking-items-body');
        tbody.innerHTML = '';
        
        const btnConfirmar = document.getElementById('btnConfirmarPicking');
        if (picking.estado === 'Completado') {
            btnConfirmar.style.display = 'none';
        } else {
            btnConfirmar.style.display = 'inline-flex';
        }
        
        picking.items.forEach((item, index) => {
            // Analizar estado del stock
            let stockStatus = '';
            let rowClass = '';
            if (item.total_disponible >= item.cantidad_solicitada) {
                stockStatus = '<span class="badge badge-completed">Disponible</span>';
            } else if (item.total_disponible > 0) {
                stockStatus = '<span class="badge badge-pending">Stock Parcial</span>';
                rowClass = 'picking-row-warning';
            } else {
                stockStatus = '<span class="badge badge-danger">Sin Stock</span>';
                rowClass = 'picking-row-danger';
            }
            
            // Ubicaciones recomendadas
            let ubicacionesHTML = '';
            if (item.ubicaciones.length === 0) {
                ubicacionesHTML = '<span class="text-danger">Ninguna ubicación con stock</span>';
            } else {
                item.ubicaciones.forEach(u => {
                    ubicacionesHTML += `<span class="location-badge-item">📍 ${u.ubicacion} (${u.stock})</span>`;
                });
            }
            
            // Input de Asignación de Picking
            let asignacionHTML = '';
            if (picking.estado === 'Completado') {
                asignacionHTML = '<span class="text-muted">Ya despachado</span>';
            } else if (item.ubicaciones.length === 0) {
                asignacionHTML = '<span class="text-danger">Imposible alistar</span>';
            } else {
                // Sugerir la primera ubicación con suficiente stock
                let ubicacionSugerida = item.ubicaciones[0].ubicacion;
                let cantSugerida = Math.min(item.cantidad_solicitada, item.ubicaciones[0].stock);
                
                asignacionHTML = `
                    <div class="flex-row gap-1 align-items-center">
                        <select class="form-control form-control-sm w-auto pick-select-ubicacion" data-index="${index}" style="padding:4px 8px; font-size:0.85rem;">
                            ${item.ubicaciones.map(u => `<option value="${u.ubicacion}" ${u.ubicacion === ubicacionSugerida ? 'selected' : ''}>${u.ubicacion} (disp: ${u.stock})</option>`).join('')}
                        </select>
                        <input type="number" class="form-control form-control-sm w-auto pick-input-cantidad" data-index="${index}" 
                               value="${cantSugerida}" max="${item.total_disponible}" min="0" style="padding:4px 8px; font-size:0.85rem; width:80px;">
                    </div>
                `;
            }
            
            tbody.innerHTML += `
                <tr class="${rowClass}">
                    <td>
                        <strong>${item.codigo}</strong><br>
                        <span class="text-muted" style="font-size:0.85rem;">${item.descripcion}</span>
                    </td>
                    <td class="text-center font-bold">${item.cantidad_solicitada}</td>
                    <td class="text-center">${item.total_disponible}</td>
                    <td class="text-center">${stockStatus}</td>
                    <td>${ubicacionesHTML}</td>
                    <td>${asignacionHTML}</td>
                </tr>
            `;
        });
        
        document.getElementById('picking-detail-panel').style.display = 'block';
    } catch (err) {
        console.error(err);
    }
}

function cancelarPicking() {
    document.getElementById('picking-detail-panel').style.display = 'none';
    currentPickingData = null;
}

async function confirmarAlistamientoVenta() {
    if (!currentPickingData) return;
    
    const confirmacion = confirm(`¿Confirmar despacho y registrar egreso (OUT) de inventario para la Remisión #${currentPickingData.remision}?`);
    if (!confirmacion) return;
    
    // Recopilar datos de picking ingresados
    const itemsDespachados = [];
    const selectUbicaciones = document.querySelectorAll('.pick-select-ubicacion');
    const inputCantidades = document.querySelectorAll('.pick-input-cantidad');
    
    let valid = true;
    
    selectUbicaciones.forEach(select => {
        const index = select.getAttribute('data-index');
        const ubicacion = select.value;
        const inputCant = document.querySelector(`.pick-input-cantidad[data-index="${index}"]`);
        const cantidad = Number(inputCant.value);
        const itemInfo = currentPickingData.items[index];
        
        if (cantidad > 0) {
            // Validar stock de esa ubicación específica
            const ubicacionObj = itemInfo.ubicaciones.find(u => u.ubicacion === ubicacion);
            if (!ubicacionObj || cantidad > ubicacionObj.stock) {
                alert(`Error: La cantidad de picking (${cantidad}) ingresada para el producto ${itemInfo.codigo} supera el stock de la ubicación ${ubicacion} (${ubicacionObj ? ubicacionObj.stock : 0}).`);
                valid = false;
                return;
            }
            
            itemsDespachados.push({
                codigo: itemInfo.codigo,
                cantidad: cantidad,
                ubicacion: ubicacion
            });
        }
    });
    
    if (!valid) return;
    
    if (itemsDespachados.length === 0) {
        alert('No se ha asignado ninguna cantidad de picking válida.');
        return;
    }
    
    try {
        await fetchAPI('/ventas/confirmar-picking', 'POST', {
            remision: currentPickingData.remision,
            itemsDespachados
        });
        alert('Picking completado con éxito. Se registraron los egresos correspondientes en inventario.');
        
        // Recargar vista o volver
        cancelarPicking();
        showView('montacarguista');
    } catch (err) {
        console.error(err);
    }
}

// --- VISTA: INVENTARIO (STOCK GLOBAL Y DETALLE UBICACIÓN) ---
let stockGlobalData = [];

async function loadStockGlobal() {
    try {
        stockGlobalData = await fetchAPI('/inventario/stock') || [];
        renderStockTable(stockGlobalData);
    } catch (err) {
        console.error(err);
    }
}

function renderStockTable(data) {
    const tbody = document.getElementById('inv-stock-body');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay productos en inventario</td></tr>';
        return;
    }
    
    data.forEach(p => {
        const badgeClass = p.stock_total > 0 ? 'badge-completed' : 'badge-danger';
        tbody.innerHTML += `
            <tr>
                <td><strong>${p.codigo}</strong></td>
                <td>${p.descripcion}</td>
                <td>${p.marca || '-'}</td>
                <td>${p.peso ? p.peso + ' Kg' : '-'}</td>
                <td class="text-center"><span class="badge ${badgeClass}">${p.stock_total}</span></td>
                <td class="text-center">
                    <button class="btn btn-secondary btn-sm" onclick="showStockLocations('${p.codigo}', '${p.descripcion.replace(/'/g, "\\'")}')">📍 Ver Ubicaciones</button>
                </td>
            </tr>
        `;
    });
}

function filterStockGlobal() {
    const search = document.getElementById('inv-search-input').value.toLowerCase().trim();
    if (!search) {
        renderStockTable(stockGlobalData);
        return;
    }
    
    const filtered = stockGlobalData.filter(p => 
        p.codigo.toLowerCase().includes(search) || 
        p.descripcion.toLowerCase().includes(search) ||
        (p.marca && p.marca.toLowerCase().includes(search))
    );
    renderStockTable(filtered);
}

async function showStockLocations(codigo, descripcion) {
    try {
        const data = await fetchAPI(`/inventario/stock/detalle?codigo=${encodeURIComponent(codigo)}`);
        document.getElementById('inv-det-prod-code').textContent = codigo;
        document.getElementById('inv-det-prod-desc').textContent = descripcion;
        
        const tbody = document.getElementById('inv-det-ubicaciones-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No se encuentra en ninguna ubicación física</td></tr>';
        } else {
            data.forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>📍 ${row.ubicacion}</strong></td>
                        <td class="text-center font-bold">${row.stock}</td>
                    </tr>
                `;
            });
        }
        
        document.getElementById('inv-details-panel').style.display = 'flex';
    } catch (err) {
        console.error(err);
    }
}

function closeInvDetails() {
    document.getElementById('inv-details-panel').style.display = 'none';
}

// --- VISTA: ENTRADAS (IN - RECIBO DE MERCANCÍA) ---
let activeReceiptOC = null;

async function cargarOCParaRecibo() {
    const ocId = document.getElementById('in-oc-input').value.trim();
    if (!ocId) {
        alert('Por favor ingrese el número de Orden de Compra.');
        return;
    }
    
    try {
        const ocs = await fetchAPI('/compras') || [];
        const oc = ocs.find(o => o.consecutivo === ocId);
        
        if (!oc) {
            alert(`No se encontró la Orden de Compra #${ocId}`);
            return;
        }
        
        activeReceiptOC = oc;
        document.getElementById('in-oc-id').textContent = oc.consecutivo;
        
        const tbody = document.getElementById('in-items-body');
        tbody.innerHTML = '';
        
        oc.items.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td class="text-center">${item.item}</td>
                    <td><strong>${item.codigo}</strong></td>
                    <td>${item.descripcion}</td>
                    <td class="text-center font-bold">${item.cantidad}</td>
                    <td class="text-center">
                        <input type="number" class="form-control form-control-sm in-qty" data-index="${index}" value="${item.cantidad}" style="width:100px;" min="0" step="any">
                    </td>
                    <td class="in-location-cell" data-index="${index}">
                        ${ubicacionSelectorHTML('in-' + index)}
                    </td>
                </tr>
            `;
        });
        
        document.getElementById('in-recibo-panel').style.display = 'block';
    } catch (err) {
        console.error(err);
    }
}

function limpiarFormRecibo() {
    document.getElementById('in-recibo-panel').style.display = 'none';
    document.getElementById('in-oc-input').value = '';
    document.getElementById('in-factura').value = '';
    activeReceiptOC = null;
}

async function guardarReciboIN() {
    if (!activeReceiptOC) return;
    
    const fecha = document.getElementById('in-fecha').value;
    const factura = document.getElementById('in-factura').value.trim();
    
    if (!fecha) {
        alert('Por favor seleccione la fecha del recibo.');
        return;
    }
    
    const qtyInputs = document.querySelectorAll('.in-qty');
    const movimientos = [];
    
    let valid = true;
    qtyInputs.forEach(input => {
        const index = input.getAttribute('data-index');
        const cantidad = Number(input.value);
        const ubicacion = getUbicacionCode('in-' + index);
        const itemInfo = activeReceiptOC.items[index];
        
        if (cantidad > 0) {
            if (!validarUbicacion(ubicacion)) {
                alert(`Ubicación inválida para el producto ${itemInfo.codigo}.\nVerifique que la combinación seleccionada sea correcta.`);
                valid = false;
                return;
            }
            
            movimientos.push({
                codigo_producto: itemInfo.codigo,
                tipo: 'IN',
                documento_referencia: activeReceiptOC.consecutivo + (factura ? ` / FAC: ${factura}` : ''),
                fecha: fecha,
                cantidad: cantidad,
                ubicacion: ubicacion
            });
        }
    });
    
    if (!valid) return;
    if (movimientos.length === 0) {
        alert('Debe ingresar cantidad recibida mayor a 0 para al menos un producto.');
        return;
    }
    
    try {
        // Enviar cada movimiento secuencialmente
        for (const mov of movimientos) {
            await fetchAPI('/inventario/movimientos', 'POST', mov);
        }
        
        alert('Ingreso a inventario guardado correctamente.');
        limpiarFormRecibo();
        showView('inventario');
    } catch (err) {
        console.error(err);
    }
}

// --- VISTA: SALIDAS (OUT - DESPACHO MANUAL) ---
async function loadMovimientosRecientes() {
    try {
        const data = await fetchAPI('/inventario/movimientos') || [];
        const tbody = document.getElementById('movimientos-history-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay movimientos recientes registrados</td></tr>';
            return;
        }
        
        data.forEach(m => {
            const badgeClass = m.tipo === 'IN' ? 'badge-completed' : 'badge-danger';
            tbody.innerHTML += `
                <tr>
                    <td>${m.id}</td>
                    <td>${m.fecha}</td>
                    <td><strong>${m.codigo_producto}</strong></td>
                    <td><span class="badge ${badgeClass}">${m.tipo}</span></td>
                    <td>📍 ${m.ubicacion}</td>
                    <td class="text-right font-bold">${m.cantidad}</td>
                    <td>${m.documento_referencia || '-'}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

async function actualizarUbicacionesSalidaManual() {
    const prodCodigo = document.getElementById('out-producto').value;
    const selectUbicacion = document.getElementById('out-ubicacion');
    
    selectUbicacion.innerHTML = '<option value="">Cargando stock...</option>';
    
    if (!prodCodigo) {
        selectUbicacion.innerHTML = '<option value="">Seleccione un producto</option>';
        return;
    }
    
    try {
        const ubicaciones = await fetchAPI(`/inventario/stock/detalle?codigo=${encodeURIComponent(prodCodigo)}`);
        selectUbicacion.innerHTML = '';
        
        if (ubicaciones.length === 0) {
            selectUbicacion.innerHTML = '<option value="">Sin stock en bodega</option>';
            return;
        }
        
        ubicaciones.forEach(u => {
            selectUbicacion.innerHTML += `<option value="${u.ubicacion}">${u.ubicacion} (Stock: ${u.stock})</option>`;
        });
    } catch (err) {
        console.error(err);
    }
}

async function guardarSalidaManualOUT() {
    const fecha = document.getElementById('out-fecha').value;
    const ref = document.getElementById('out-referencia').value.trim();
    const codigo_producto = document.getElementById('out-producto').value;
    const ubicacion = document.getElementById('out-ubicacion').value;
    const cantidad = Number(document.getElementById('out-cantidad').value);
    
    if (!fecha || !codigo_producto || !ubicacion || isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor rellene todos los campos con valores válidos.');
        return;
    }
    
    // Obtener detalles de stock de la ubicación seleccionada para validar
    try {
        const stockUbi = await fetchAPI(`/inventario/stock/detalle?codigo=${encodeURIComponent(codigo_producto)}`);
        const itemUbi = stockUbi.find(u => u.ubicacion === ubicacion);
        
        if (!itemUbi || cantidad > itemUbi.stock) {
            alert(`Stock insuficiente en la ubicación ${ubicacion}. Máximo disponible: ${itemUbi ? itemUbi.stock : 0}`);
            return;
        }
        
        const confirmacion = confirm(`¿Confirmar salida manual de ${cantidad} unidad(es) de ${codigo_producto} desde la ubicación ${ubicacion}?`);
        if (!confirmacion) return;
        
        await fetchAPI('/inventario/movimientos', 'POST', {
            codigo_producto,
            tipo: 'OUT',
            documento_referencia: ref || 'Salida Manual',
            fecha,
            cantidad,
            ubicacion
        });
        
        alert('Salida registrada correctamente.');
        document.getElementById('out-cantidad').value = '';
        loadMovimientosRecientes();
        actualizarUbicacionesSalidaManual();
    } catch (err) {
        console.error(err);
    }
}

// --- VISTAS FORMULARIOS: ÓRDENES DE COMPRA (OC) ---
let ocItemCount = 0;

function agregarFilaItemOC(item = null) {
    ocItemCount++;
    const tbody = document.getElementById('oc-items-table-body');
    const tr = document.createElement('tr');
    tr.id = `oc-row-${ocItemCount}`;
    
    tr.innerHTML = `
        <td class="text-center oc-row-item-num">${tbody.children.length + 1}</td>
        <td>
            <select class="form-control oc-item-select" onchange="seleccionarProductoFilaOC(${ocItemCount})" style="padding:4px 8px;">
                <option value="">Seleccione...</option>
                ${state.productos.map(p => `<option value="${p.codigo}" ${item && item.codigo === p.codigo ? 'selected' : ''}>${p.codigo}</option>`).join('')}
            </select>
        </td>
        <td>
            <input type="text" class="form-control oc-item-desc" value="${item ? item.descripcion : ''}" style="padding:4px 8px;">
        </td>
        <td>
            <input type="number" class="form-control oc-item-qty text-center" value="${item ? item.cantidad : '1'}" oninput="calcularTotalesOC()" style="padding:4px 8px;" min="1" step="any">
        </td>
        <td>
            <input type="number" class="form-control oc-item-unit text-right" value="${item ? item.v_unitario : '0'}" oninput="calcularTotalesOC()" style="padding:4px 8px;" min="0" step="any">
        </td>
        <td class="text-right font-bold oc-item-total">$0.00</td>
        <td class="text-center">
            <button class="btn btn-danger btn-sm" onclick="eliminarFilaItemOC(${ocItemCount})" style="padding:4px 8px;">✕</button>
        </td>
    `;
    tbody.appendChild(tr);
    calcularTotalesOC();
}

function eliminarFilaItemOC(rowId) {
    const row = document.getElementById(`oc-row-${rowId}`);
    if (row) {
        row.remove();
        // Renumerar
        const rows = document.querySelectorAll('.oc-row-item-num');
        rows.forEach((td, index) => {
            td.textContent = index + 1;
        });
        calcularTotalesOC();
    }
}

function seleccionarProductoFilaOC(rowId) {
    const row = document.getElementById(`oc-row-${rowId}`);
    const code = row.querySelector('.oc-item-select').value;
    const prod = state.productos.find(p => p.codigo === code);
    
    if (prod) {
        row.querySelector('.oc-item-desc').value = prod.descripcion;
        row.querySelector('.oc-item-unit').value = prod.valor_venta || 0;
    } else {
        row.querySelector('.oc-item-desc').value = '';
        row.querySelector('.oc-item-unit').value = 0;
    }
    calcularTotalesOC();
}

function cargarDatosProveedorOC() {
    const nit = document.getElementById('oc-proveedor').value;
    const p = state.proveedores.find(x => x.nit === nit);
    const detailDiv = document.getElementById('oc-proveedor-detalles');
    
    if (p) {
        detailDiv.innerHTML = `
            <div class="flex-1"><strong>Nombre:</strong> ${p.nombre}</div>
            <div class="flex-1"><strong>Teléfono:</strong> ${p.telefono || 'N/A'}</div>
            <div class="flex-1"><strong>Dirección:</strong> ${p.direccion || 'N/A'}</div>
            <div class="flex-1"><strong>Correo:</strong> ${p.correo || 'N/A'}</div>
        `;
    } else {
        detailDiv.innerHTML = '';
    }
}

function calcularTotalesOC() {
    const rows = document.querySelectorAll('#oc-items-table-body tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qty = Number(row.querySelector('.oc-item-qty').value) || 0;
        const unit = Number(row.querySelector('.oc-item-unit').value) || 0;
        const total = qty * unit;
        subtotal += total;
        
        row.querySelector('.oc-item-total').textContent = formatoMoneda(total);
    });
    
    const descuento = Number(document.getElementById('oc-descuento').value) || 0;
    const ivaPct = Number(document.getElementById('oc-iva').value) || 0;
    const retPct = Number(document.getElementById('oc-retencion').value) || 0;
    
    const baseIVA = Math.max(0, subtotal - descuento);
    const valorIVA = baseIVA * (ivaPct / 100);
    const valorRet = baseIVA * (retPct / 100);
    const totalGeneral = baseIVA + valorIVA - valorRet;
    
    document.getElementById('oc-total-general').textContent = formatoMoneda(totalGeneral);
}

function limpiarFormOC() {
    document.getElementById('oc-consecutivo').value = '';
    document.getElementById('oc-observaciones').value = '';
    document.getElementById('oc-descuento').value = '0';
    document.getElementById('oc-iva').value = '19';
    document.getElementById('oc-retencion').value = '0';
    document.getElementById('oc-total-general').textContent = '$0.00';
    document.getElementById('oc-items-table-body').innerHTML = '';
    document.getElementById('oc-proveedor-detalles').innerHTML = '';
    initDateInputs();
    
    // Añadir una fila vacía inicial
    agregarFilaItemOC();
}

async function guardarOC() {
    const consecutivo = document.getElementById('oc-consecutivo').value.trim();
    const fecha = document.getElementById('oc-fecha').value;
    const proveedor_nit = document.getElementById('oc-proveedor').value;
    const observaciones = document.getElementById('oc-observaciones').value;
    const descuento = Number(document.getElementById('oc-descuento').value);
    const iva = Number(document.getElementById('oc-iva').value);
    const retencion = Number(document.getElementById('oc-retencion').value);
    const condiciones_envio = document.getElementById('oc-condiciones').value;
    const forma_pago = document.getElementById('oc-forma-pago').value;
    const fecha_envio = document.getElementById('oc-fecha-envio').value;
    
    if (!consecutivo || !fecha || !proveedor_nit) {
        alert('Por favor complete Consecutivo, Fecha y Proveedor.');
        return;
    }
    
    const rows = document.querySelectorAll('#oc-items-table-body tr');
    const items = [];
    
    rows.forEach(row => {
        const num = row.querySelector('.oc-row-item-num').textContent;
        const codigo = row.querySelector('.oc-item-select').value;
        const descripcion = row.querySelector('.oc-item-desc').value;
        const cantidad = Number(row.querySelector('.oc-item-qty').value);
        const v_unitario = Number(row.querySelector('.oc-item-unit').value);
        
        if (codigo) {
            items.push({ item: num, codigo, descripcion, cantidad, v_unitario });
        }
    });
    
    if (items.length === 0) {
        alert('Debe agregar al menos un ítem válido.');
        return;
    }
    
    try {
        await fetchAPI('/compras', 'POST', {
            consecutivo, fecha, proveedor_nit, observaciones, descuento, iva, retencion, condiciones_envio, forma_pago, fecha_envio, items
        });
        alert('Orden de Compra guardada con éxito.');
        limpiarFormOC();
    } catch (err) {
        console.error(err);
    }
}

async function consultarOCForm() {
    const docId = document.getElementById('consultar-oc-id').value.trim();
    if (!docId) {
        alert('Ingrese el consecutivo de la OC a buscar.');
        return;
    }
    
    try {
        const ocs = await fetchAPI('/compras') || [];
        const oc = ocs.find(o => o.consecutivo === docId);
        
        if (!oc) {
            alert(`No se encontró la OC #${docId}`);
            return;
        }
        
        // Rellenar formulario
        document.getElementById('oc-consecutivo').value = oc.consecutivo;
        document.getElementById('oc-fecha').value = oc.fecha;
        document.getElementById('oc-fecha-envio').value = oc.fecha_envio;
        document.getElementById('oc-proveedor').value = oc.proveedor_nit;
        cargarDatosProveedorOC();
        
        document.getElementById('oc-condiciones').value = oc.condiciones_envio || '';
        document.getElementById('oc-forma-pago').value = oc.forma_pago || '';
        document.getElementById('oc-observaciones').value = oc.observaciones || '';
        document.getElementById('oc-descuento').value = oc.descuento;
        document.getElementById('oc-iva').value = oc.iva;
        document.getElementById('oc-retencion').value = oc.retencion;
        
        const tbody = document.getElementById('oc-items-table-body');
        tbody.innerHTML = '';
        oc.items.forEach(item => {
            agregarFilaItemOC(item);
        });
        
        alert('Orden de Compra cargada.');
    } catch (err) {
        console.error(err);
    }
}

// --- VISTAS FORMULARIOS: ÓRDENES DE SERVICIO (OS) ---
let osItemCount = 0;

function agregarFilaItemOS(item = null) {
    osItemCount++;
    const tbody = document.getElementById('os-items-table-body');
    const tr = document.createElement('tr');
    tr.id = `os-row-${osItemCount}`;
    
    tr.innerHTML = `
        <td class="text-center os-row-item-num">${tbody.children.length + 1}</td>
        <td>
            <input type="text" class="form-control os-item-code" value="${item ? item.codigo : ''}" placeholder="Código" style="padding:4px 8px;">
        </td>
        <td>
            <input type="text" class="form-control os-item-desc" value="${item ? item.descripcion : ''}" placeholder="Detalle del servicio..." style="padding:4px 8px;">
        </td>
        <td>
            <input type="number" class="form-control os-item-qty text-center" value="${item ? item.cantidad : '1'}" oninput="calcularTotalesOS()" style="padding:4px 8px;" min="1" step="any">
        </td>
        <td>
            <input type="number" class="form-control os-item-unit text-right" value="${item ? item.v_unitario : '0'}" oninput="calcularTotalesOS()" style="padding:4px 8px;" min="0" step="any">
        </td>
        <td class="text-right font-bold os-item-total">$0.00</td>
        <td class="text-center">
            <button class="btn btn-danger btn-sm" onclick="eliminarFilaItemOS(${osItemCount})" style="padding:4px 8px;">✕</button>
        </td>
    `;
    tbody.appendChild(tr);
    calcularTotalesOS();
}

function eliminarFilaItemOS(rowId) {
    const row = document.getElementById(`os-row-${rowId}`);
    if (row) {
        row.remove();
        const rows = document.querySelectorAll('.os-row-item-num');
        rows.forEach((td, index) => {
            td.textContent = index + 1;
        });
        calcularTotalesOS();
    }
}

function cargarDatosProveedorOS() {
    const nit = document.getElementById('os-proveedor').value;
    const p = state.proveedores.find(x => x.nit === nit);
    const detailDiv = document.getElementById('os-proveedor-detalles');
    
    if (p) {
        detailDiv.innerHTML = `
            <div class="flex-1"><strong>Nombre:</strong> ${p.nombre}</div>
            <div class="flex-1"><strong>Teléfono:</strong> ${p.telefono || 'N/A'}</div>
            <div class="flex-1"><strong>Dirección:</strong> ${p.direccion || 'N/A'}</div>
            <div class="flex-1"><strong>Correo:</strong> ${p.correo || 'N/A'}</div>
        `;
    } else {
        detailDiv.innerHTML = '';
    }
}

function calcularTotalesOS() {
    const rows = document.querySelectorAll('#os-items-table-body tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qty = Number(row.querySelector('.os-item-qty').value) || 0;
        const unit = Number(row.querySelector('.os-item-unit').value) || 0;
        const total = qty * unit;
        subtotal += total;
        
        row.querySelector('.os-item-total').textContent = formatoMoneda(total);
    });
    
    const descuento = Number(document.getElementById('os-descuento').value) || 0;
    const ivaPct = Number(document.getElementById('os-iva').value) || 0;
    const retPct = Number(document.getElementById('os-retencion').value) || 0;
    
    const baseIVA = Math.max(0, subtotal - descuento);
    const valorIVA = baseIVA * (ivaPct / 100);
    const valorRet = baseIVA * (retPct / 100);
    const totalGeneral = baseIVA + valorIVA - valorRet;
    
    document.getElementById('os-total-general').textContent = formatoMoneda(totalGeneral);
}

function limpiarFormOS() {
    document.getElementById('os-consecutivo').value = '';
    document.getElementById('os-observaciones').value = '';
    document.getElementById('os-descuento').value = '0';
    document.getElementById('os-iva').value = '0';
    document.getElementById('os-retencion').value = '6';
    document.getElementById('os-total-general').textContent = '$0.00';
    document.getElementById('os-items-table-body').innerHTML = '';
    document.getElementById('os-proveedor-detalles').innerHTML = '';
    initDateInputs();
    
    agregarFilaItemOS();
}

async function guardarOS() {
    const consecutivo = document.getElementById('os-consecutivo').value.trim();
    const fecha = document.getElementById('os-fecha').value;
    const proveedor_nit = document.getElementById('os-proveedor').value;
    const observaciones = document.getElementById('os-observaciones').value;
    const descuento = Number(document.getElementById('os-descuento').value);
    const iva = Number(document.getElementById('os-iva').value);
    const retencion = Number(document.getElementById('os-retencion').value);
    const condiciones_envio = document.getElementById('os-condiciones').value;
    const forma_pago = document.getElementById('os-forma-pago').value;
    const fecha_envio = document.getElementById('os-fecha-envio').value;
    
    if (!consecutivo || !fecha || !proveedor_nit) {
        alert('Por favor complete Consecutivo, Fecha y Proveedor.');
        return;
    }
    
    const rows = document.querySelectorAll('#os-items-table-body tr');
    const items = [];
    
    rows.forEach(row => {
        const num = row.querySelector('.os-row-item-num').textContent;
        const codigo = row.querySelector('.os-item-code').value;
        const descripcion = row.querySelector('.os-item-desc').value;
        const cantidad = Number(row.querySelector('.os-item-qty').value);
        const v_unitario = Number(row.querySelector('.os-item-unit').value);
        
        if (descripcion) {
            items.push({ item: num, codigo: codigo || 'SER-GEN', descripcion, cantidad, v_unitario });
        }
    });
    
    if (items.length === 0) {
        alert('Debe agregar al menos un servicio válido.');
        return;
    }
    
    try {
        await fetchAPI('/servicios', 'POST', {
            consecutivo, fecha, proveedor_nit, observaciones, descuento, iva, retencion, condiciones_envio, forma_pago, fecha_envio, items
        });
        alert('Orden de Servicio guardada con éxito.');
        limpiarFormOS();
    } catch (err) {
        console.error(err);
    }
}

async function consultarOSForm() {
    const docId = document.getElementById('consultar-os-id').value.trim();
    if (!docId) {
        alert('Ingrese el consecutivo de la OS a buscar.');
        return;
    }
    
    try {
        const oss = await fetchAPI('/servicios') || [];
        const os = oss.find(o => o.consecutivo === docId);
        
        if (!os) {
            alert(`No se encontró la OS #${docId}`);
            return;
        }
        
        document.getElementById('os-consecutivo').value = os.consecutivo;
        document.getElementById('os-fecha').value = os.fecha;
        document.getElementById('os-fecha-envio').value = os.fecha_envio;
        document.getElementById('os-proveedor').value = os.proveedor_nit;
        cargarDatosProveedorOS();
        
        document.getElementById('os-condiciones').value = os.condiciones_envio || '';
        document.getElementById('os-forma-pago').value = os.forma_pago || '';
        document.getElementById('os-observaciones').value = os.observaciones || '';
        document.getElementById('os-descuento').value = os.descuento;
        document.getElementById('os-iva').value = os.iva;
        document.getElementById('os-retencion').value = os.retencion;
        
        const tbody = document.getElementById('os-items-table-body');
        tbody.innerHTML = '';
        os.items.forEach(item => {
            agregarFilaItemOS(item);
        });
        
        alert('Orden de Servicio cargada.');
    } catch (err) {
        console.error(err);
    }
}

// --- VISTAS FORMULARIOS: VENTAS / REMISIÓN ---
let ventaItemCount = 0;

function agregarFilaItemVenta(item = null) {
    ventaItemCount++;
    const tbody = document.getElementById('venta-items-table-body');
    const tr = document.createElement('tr');
    tr.id = `venta-row-${ventaItemCount}`;
    
    tr.innerHTML = `
        <td class="text-center venta-row-item-num">${tbody.children.length + 1}</td>
        <td>
            <select class="form-control venta-item-select" onchange="seleccionarProductoFilaVenta(${ventaItemCount})" style="padding:4px 8px;">
                <option value="">Seleccione...</option>
                ${state.productos.map(p => `<option value="${p.codigo}" ${item && item.codigo === p.codigo ? 'selected' : ''}>${p.codigo}</option>`).join('')}
            </select>
        </td>
        <td>
            <input type="text" class="form-control venta-item-desc" value="${item ? item.descripcion : ''}" style="padding:4px 8px;">
        </td>
        <td>
            <input type="number" class="form-control venta-item-qty text-center" value="${item ? item.cantidad : '1'}" oninput="calcularTotalesVenta()" style="padding:4px 8px;" min="1" step="any">
        </td>
        <td>
            <input type="number" class="form-control venta-item-unit text-right" value="${item ? item.v_unitario : '0'}" oninput="calcularTotalesVenta()" style="padding:4px 8px;" min="0" step="any">
        </td>
        <td class="text-right font-bold venta-item-total">$0.00</td>
        <td class="text-center">
            <button class="btn btn-danger btn-sm" onclick="eliminarFilaItemVenta(${ventaItemCount})" style="padding:4px 8px;">✕</button>
        </td>
    `;
    tbody.appendChild(tr);
    calcularTotalesVenta();
}

function eliminarFilaItemVenta(rowId) {
    const row = document.getElementById(`venta-row-${rowId}`);
    if (row) {
        row.remove();
        const rows = document.querySelectorAll('.venta-row-item-num');
        rows.forEach((td, index) => {
            td.textContent = index + 1;
        });
        calcularTotalesVenta();
    }
}

function seleccionarProductoFilaVenta(rowId) {
    const row = document.getElementById(`venta-row-${rowId}`);
    const code = row.querySelector('.venta-item-select').value;
    const prod = state.productos.find(p => p.codigo === code);
    
    if (prod) {
        row.querySelector('.venta-item-desc').value = prod.descripcion;
        row.querySelector('.venta-item-unit').value = prod.valor_venta || 0;
    } else {
        row.querySelector('.venta-item-desc').value = '';
        row.querySelector('.venta-item-unit').value = 0;
    }
    calcularTotalesVenta();
}

function cargarDatosClienteVenta() {
    const nit = document.getElementById('venta-cliente').value;
    const c = state.clientes.find(x => x.nit === nit);
    const detailDiv = document.getElementById('venta-cliente-detalles');
    
    if (c) {
        detailDiv.innerHTML = `
            <div class="flex-1"><strong>Nombre:</strong> ${c.nombre}</div>
            <div class="flex-1"><strong>Teléfono:</strong> ${c.telefono || 'N/A'}</div>
            <div class="flex-1"><strong>Dirección:</strong> ${c.direccion || 'N/A'}</div>
            <div class="flex-1"><strong>Correo:</strong> ${c.correo || 'N/A'}</div>
        `;
    } else {
        detailDiv.innerHTML = '';
    }
}

function calcularTotalesVenta() {
    const rows = document.querySelectorAll('#venta-items-table-body tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qty = Number(row.querySelector('.venta-item-qty').value) || 0;
        const unit = Number(row.querySelector('.venta-item-unit').value) || 0;
        const total = qty * unit;
        subtotal += total;
        
        row.querySelector('.venta-item-total').textContent = formatoMoneda(total);
    });
    
    const ivaPct = Number(document.getElementById('venta-iva').value) || 0;
    const valorIVA = subtotal * (ivaPct / 100);
    const totalGeneral = subtotal + valorIVA;
    
    document.getElementById('venta-total-general').textContent = formatoMoneda(totalGeneral);
}

function limpiarFormVenta() {
    document.getElementById('venta-remision').value = '';
    document.getElementById('venta-observaciones').value = '';
    document.getElementById('venta-iva').value = '19';
    document.getElementById('venta-total-general').textContent = '$0.00';
    document.getElementById('venta-items-table-body').innerHTML = '';
    document.getElementById('venta-cliente-detalles').innerHTML = '';
    initDateInputs();
    
    agregarFilaItemVenta();
}

async function guardarVenta() {
    const remision = document.getElementById('venta-remision').value.trim();
    const fecha = document.getElementById('venta-fecha').value;
    const cliente_nit = document.getElementById('venta-cliente').value;
    const observaciones = document.getElementById('venta-observaciones').value;
    const iva = Number(document.getElementById('venta-iva').value);
    
    if (!remision || !fecha || !cliente_nit) {
        alert('Por favor complete No. Remisión, Fecha y Cliente.');
        return;
    }
    
    const rows = document.querySelectorAll('#venta-items-table-body tr');
    const items = [];
    
    rows.forEach(row => {
        const num = row.querySelector('.venta-row-item-num').textContent;
        const codigo = row.querySelector('.venta-item-select').value;
        const descripcion = row.querySelector('.venta-item-desc').value;
        const cantidad = Number(row.querySelector('.venta-item-qty').value);
        const v_unitario = Number(row.querySelector('.venta-item-unit').value);
        
        if (codigo) {
            items.push({ item: num, codigo, descripcion, cantidad, v_unitario });
        }
    });
    
    if (items.length === 0) {
        alert('Debe agregar al menos un producto válido.');
        return;
    }
    
    try {
        await fetchAPI('/ventas', 'POST', {
            remision, fecha, cliente_nit, observaciones, iva, items, estado: 'Pendiente'
        });
        alert('Remisión / Factura de Venta guardada con éxito.');
        limpiarFormVenta();
    } catch (err) {
        console.error(err);
    }
}

async function consultarVentaForm() {
    const docId = document.getElementById('consultar-venta-id').value.trim();
    if (!docId) {
        alert('Ingrese el número de la remisión a buscar.');
        return;
    }
    
    try {
        const ventas = await fetchAPI('/ventas') || [];
        const v = ventas.find(x => x.remision === docId);
        
        if (!v) {
            alert(`No se encontró la Remisión #${docId}`);
            return;
        }
        
        document.getElementById('venta-remision').value = v.remision;
        document.getElementById('venta-fecha').value = v.fecha;
        document.getElementById('venta-cliente').value = v.cliente_nit;
        cargarDatosClienteVenta();
        
        document.getElementById('venta-observaciones').value = v.observaciones || '';
        document.getElementById('venta-iva').value = v.iva;
        
        const tbody = document.getElementById('venta-items-table-body');
        tbody.innerHTML = '';
        v.items.forEach(item => {
            agregarFilaItemVenta(item);
        });
        
        alert('Remisión / Factura de Venta cargada.');
    } catch (err) {
        console.error(err);
    }
}


// --- FORMULARIOS: CATÁLOGO PRODUCTOS ---
async function loadProductos() {
    try {
        const data = await fetchAPI('/productos') || [];
        state.productos = data; // actualizar en memoria
        const tbody = document.getElementById('productos-list-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay productos registrados</td></tr>';
            return;
        }
        
        data.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.codigo}</strong></td>
                    <td>${p.descripcion}</td>
                    <td>${p.marca || '-'}</td>
                    <td>${p.peso ? p.peso + ' Kg' : '-'}</td>
                    <td>${formatoMoneda(p.valor_venta)}</td>
                    <td>${p.alto || 0}m x ${p.largo || 0}m x ${p.ancho || 0}m</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editarProducto('${p.codigo}')">✏️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

function limpiarFormProducto() {
    document.getElementById('prod-codigo').value = '';
    document.getElementById('prod-descripcion').value = '';
    document.getElementById('prod-peso').value = '';
    document.getElementById('prod-valor').value = '';
    document.getElementById('prod-marca').value = '';
    document.getElementById('prod-alto').value = '';
    document.getElementById('prod-largo').value = '';
    document.getElementById('prod-ancho').value = '';
    document.getElementById('prod-codigo').disabled = false;
}

async function guardarProducto() {
    const codigo = document.getElementById('prod-codigo').value.trim();
    const descripcion = document.getElementById('prod-descripcion').value.trim();
    const peso = Number(document.getElementById('prod-peso').value) || 0;
    const valor_venta = Number(document.getElementById('prod-valor').value) || 0;
    const marca = document.getElementById('prod-marca').value.trim();
    const alto = Number(document.getElementById('prod-alto').value) || 0;
    const largo = Number(document.getElementById('prod-largo').value) || 0;
    const ancho = Number(document.getElementById('prod-ancho').value) || 0;
    
    if (!codigo || !descripcion) {
        alert('Código y Descripción son obligatorios.');
        return;
    }
    
    try {
        await fetchAPI('/productos', 'POST', {
            codigo, descripcion, peso, valor_venta, marca, alto, largo, ancho
        });
        alert('Producto guardado correctamente.');
        limpiarFormProducto();
        loadProductos();
        loadCatalogos(); // recargar catálogo global en memoria
    } catch (err) {
        console.error(err);
    }
}

function editarProducto(codigo) {
    const p = state.productos.find(x => x.codigo === codigo);
    if (p) {
        document.getElementById('prod-codigo').value = p.codigo;
        document.getElementById('prod-codigo').disabled = true; // no permitir cambiar llave primaria
        document.getElementById('prod-descripcion').value = p.descripcion;
        document.getElementById('prod-peso').value = p.peso || '';
        document.getElementById('prod-valor').value = p.valor_venta || '';
        document.getElementById('prod-marca').value = p.marca || '';
        document.getElementById('prod-alto').value = p.alto || '';
        document.getElementById('prod-largo').value = p.largo || '';
        document.getElementById('prod-ancho').value = p.ancho || '';
    }
}

// --- FORMULARIOS: CLIENTES ---
async function loadClientes() {
    try {
        const data = await fetchAPI('/clientes') || [];
        state.clientes = data;
        const tbody = document.getElementById('clientes-list-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay clientes registrados</td></tr>';
            return;
        }
        
        data.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${c.nit}</strong></td>
                    <td>${c.nombre}</td>
                    <td>${c.telefono || '-'}</td>
                    <td>${c.direccion || '-'}</td>
                    <td>${c.correo || '-'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editarCliente('${c.nit}')">✏️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

function limpiarFormCliente() {
    document.getElementById('cli-nit').value = '';
    document.getElementById('cli-nit').disabled = false;
    document.getElementById('cli-nombre').value = '';
    document.getElementById('cli-telefono').value = '';
    document.getElementById('cli-direccion').value = '';
    document.getElementById('cli-correo').value = '';
}

async function guardarCliente() {
    const nit = document.getElementById('cli-nit').value.trim();
    const nombre = document.getElementById('cli-nombre').value.trim();
    const telefono = document.getElementById('cli-telefono').value.trim();
    const direccion = document.getElementById('cli-direccion').value.trim();
    const correo = document.getElementById('cli-correo').value.trim();
    
    if (!nit || !nombre) {
        alert('Cédula/NIT y Nombre son obligatorios.');
        return;
    }
    
    try {
        await fetchAPI('/clientes', 'POST', { nit, nombre, telefono, direccion, correo });
        alert('Cliente guardado correctamente.');
        limpiarFormCliente();
        loadClientes();
        loadCatalogos();
    } catch (err) {
        console.error(err);
    }
}

function editarCliente(nit) {
    const c = state.clientes.find(x => x.nit === nit);
    if (c) {
        document.getElementById('cli-nit').value = c.nit;
        document.getElementById('cli-nit').disabled = true;
        document.getElementById('cli-nombre').value = c.nombre;
        document.getElementById('cli-telefono').value = c.telefono || '';
        document.getElementById('cli-direccion').value = c.direccion || '';
        document.getElementById('cli-correo').value = c.correo || '';
    }
}

// --- FORMULARIOS: PROVEEDORES ---
async function loadProveedores() {
    try {
        const data = await fetchAPI('/proveedores') || [];
        state.proveedores = data;
        const tbody = document.getElementById('proveedores-list-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay proveedores registrados</td></tr>';
            return;
        }
        
        data.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.nit}</strong></td>
                    <td>${p.nombre}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${p.direccion || '-'}</td>
                    <td>${p.correo || '-'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editarProveedor('${p.nit}')">✏️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

function limpiarFormProveedor() {
    document.getElementById('prov-nit').value = '';
    document.getElementById('prov-nit').disabled = false;
    document.getElementById('prov-nombre').value = '';
    document.getElementById('prov-telefono').value = '';
    document.getElementById('prov-direccion').value = '';
    document.getElementById('prov-correo').value = '';
}

async function guardarProveedor() {
    const nit = document.getElementById('prov-nit').value.trim();
    const nombre = document.getElementById('prov-nombre').value.trim();
    const telefono = document.getElementById('prov-telefono').value.trim();
    const direccion = document.getElementById('prov-direccion').value.trim();
    const correo = document.getElementById('prov-correo').value.trim();
    
    if (!nit || !nombre) {
        alert('Cédula/NIT y Nombre son obligatorios.');
        return;
    }
    
    try {
        await fetchAPI('/proveedores', 'POST', { nit, nombre, telefono, direccion, correo });
        alert('Proveedor guardado correctamente.');
        limpiarFormProveedor();
        loadProveedores();
        loadCatalogos();
    } catch (err) {
        console.error(err);
    }
}

function editarProveedor(nit) {
    const p = state.proveedores.find(x => x.nit === nit);
    if (p) {
        document.getElementById('prov-nit').value = p.nit;
        document.getElementById('prov-nit').disabled = true;
        document.getElementById('prov-nombre').value = p.nombre;
        document.getElementById('prov-telefono').value = p.telefono || '';
        document.getElementById('prov-direccion').value = p.direccion || '';
        document.getElementById('prov-correo').value = p.correo || '';
    }
}


// --- UTILIDADES DEL SISTEMA ---
function formatoMoneda(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor || 0);
}

function populateProductosSelect(selectId) {
    const select = document.getElementById(selectId);
    if (select) {
        select.innerHTML = '<option value="">Seleccione producto...</option>' + 
            state.productos.map(p => `<option value="${p.codigo}">${p.codigo} - ${p.descripcion}</option>`).join('');
    }
}

function populateClientesSelect(selectId) {
    const select = document.getElementById(selectId);
    if (select) {
        select.innerHTML = '<option value="">Seleccione cliente...</option>' + 
            state.clientes.map(c => `<option value="${c.nit}">${c.nombre}</option>`).join('');
    }
}

function populateProveedoresSelect(selectId) {
    const select = document.getElementById(selectId);
    if (select) {
        select.innerHTML = '<option value="">Seleccione proveedor...</option>' + 
            state.proveedores.map(p => `<option value="${p.nit}">${p.nombre}</option>`).join('');
    }
}


// --- IMPRESIÓN Y EXPORTACIÓN PDF ---
function imprimirDocumento(tipoDoc) {
    const printContainer = document.getElementById('printContainer');
    printContainer.innerHTML = ''; // Limpiar previo
    
    let htmlContent = '';
    
    if (tipoDoc === 'OC') {
        const consecutivo = document.getElementById('oc-consecutivo').value.trim();
        const fecha = document.getElementById('oc-fecha').value;
        const provNit = document.getElementById('oc-proveedor').value;
        const provObj = state.proveedores.find(p => p.nit === provNit);
        const cond = document.getElementById('oc-condiciones').value;
        const pago = document.getElementById('oc-forma-pago').value;
        const envio = document.getElementById('oc-fecha-envio').value;
        const obs = document.getElementById('oc-observaciones').value;
        
        const rows = document.querySelectorAll('#oc-items-table-body tr');
        let subtotal = 0;
        let tableRowsHTML = '';
        
        rows.forEach(row => {
            const num = row.querySelector('.oc-row-item-num').textContent;
            const code = row.querySelector('.oc-item-select').value;
            const desc = row.querySelector('.oc-item-desc').value;
            const qty = Number(row.querySelector('.oc-item-qty').value) || 0;
            const unit = Number(row.querySelector('.oc-item-unit').value) || 0;
            const total = qty * unit;
            subtotal += total;
            
            if (code) {
                tableRowsHTML += `
                    <tr>
                        <td style="text-align:center;">${num}</td>
                        <td>${code}</td>
                        <td>${desc}</td>
                        <td style="text-align:center;">${qty}</td>
                        <td style="text-align:right;">${formatoMoneda(unit)}</td>
                        <td style="text-align:right;">${formatoMoneda(total)}</td>
                    </tr>
                `;
            }
        });
        
        const descVal = Number(document.getElementById('oc-descuento').value) || 0;
        const ivaPct = Number(document.getElementById('oc-iva').value) || 0;
        const retPct = Number(document.getElementById('oc-retencion').value) || 0;
        const baseIVA = Math.max(0, subtotal - descVal);
        const ivaVal = baseIVA * (ivaPct / 100);
        const retVal = baseIVA * (retPct / 100);
        const totalGen = baseIVA + ivaVal - retVal;
        
        htmlContent = `
            <div class="print-invoice">
                <div class="print-header">
                    <div class="print-logo-section">
                        <h1>HABITAD WMS</h1>
                        <p style="font-size: 8pt; margin: 2px 0;">Nit: 123.456.789-0</p>
                        <p style="font-size: 8pt; margin: 2px 0;">Dirección: Zona Industrial Bodega 10</p>
                    </div>
                    <div class="print-doc-info">
                        <h2>ORDEN DE COMPRA</h2>
                        <p style="font-size: 11pt; font-weight: bold; margin: 5px 0;">Nº Consecutivo: ${consecutivo || 'TEMP-OC'}</p>
                        <p style="font-size: 8pt; margin: 2px 0;">Fecha Emisión: ${fecha}</p>
                        <p style="font-size: 8pt; margin: 2px 0;">Fecha Envío: ${envio || '-'}</p>
                    </div>
                </div>
                
                <div class="print-details-grid">
                    <div class="print-details-block">
                        <h3>Detalle Proveedor</h3>
                        <p><strong>Razón Social:</strong> ${provObj ? provObj.nombre : 'No especificado'}</p>
                        <p><strong>NIT:</strong> ${provNit}</p>
                        <p><strong>Teléfono:</strong> ${provObj ? (provObj.telefono || '-') : '-'}</p>
                        <p><strong>Dirección:</strong> ${provObj ? (provObj.direccion || '-') : '-'}</p>
                    </div>
                    <div class="print-details-block">
                        <h3>Condiciones Comerciales</h3>
                        <p><strong>Condiciones de Envío:</strong> ${cond || 'N/A'}</p>
                        <p><strong>Forma de Pago:</strong> ${pago || 'N/A'}</p>
                    </div>
                </div>
                
                <table class="print-table">
                    <thead>
                        <tr>
                            <th style="width:5%; text-align:center;">Item</th>
                            <th style="width:20%;">Código</th>
                            <th style="width:40%;">Descripción</th>
                            <th style="width:10%; text-align:center;">Cantidad</th>
                            <th style="width:12%; text-align:right;">V. Unitario</th>
                            <th style="width:13%; text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHTML || '<tr><td colspan="6" style="text-align:center;">No hay ítems registrados</td></tr>'}
                    </tbody>
                </table>
                
                <div class="print-summary-section">
                    <div class="print-observaciones">
                        <strong>Observaciones:</strong><br>
                        <p>${obs || 'Sin observaciones adicionales.'}</p>
                    </div>
                    <div class="print-totales">
                        <table>
                            <tr>
                                <td>Subtotal:</td>
                                <td>${formatoMoneda(subtotal)}</td>
                            </tr>
                            <tr>
                                <td>Descuento:</td>
                                <td>-${formatoMoneda(descVal)}</td>
                            </tr>
                            <tr>
                                <td>IVA (${ivaPct}%):</td>
                                <td>${formatoMoneda(ivaVal)}</td>
                            </tr>
                            <tr>
                                <td>Retención (${retPct}%):</td>
                                <td>-${formatoMoneda(retVal)}</td>
                            </tr>
                            <tr class="grand-total">
                                <td>Total General:</td>
                                <td>${formatoMoneda(totalGen)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="print-signatures">
                    <div class="print-signature-line">Elaborado por</div>
                    <div class="print-signature-line">Aprobado Proveedor</div>
                </div>
            </div>
        `;
    } 
    else if (tipoDoc === 'OS') {
        const consecutivo = document.getElementById('os-consecutivo').value.trim();
        const fecha = document.getElementById('os-fecha').value;
        const provNit = document.getElementById('os-proveedor').value;
        const provObj = state.proveedores.find(p => p.nit === provNit);
        const cond = document.getElementById('os-condiciones').value;
        const pago = document.getElementById('os-forma-pago').value;
        const envio = document.getElementById('os-fecha-envio').value;
        const obs = document.getElementById('os-observaciones').value;
        
        const rows = document.querySelectorAll('#os-items-table-body tr');
        let subtotal = 0;
        let tableRowsHTML = '';
        
        rows.forEach(row => {
            const num = row.querySelector('.os-row-item-num').textContent;
            const code = row.querySelector('.os-item-code').value;
            const desc = row.querySelector('.os-item-desc').value;
            const qty = Number(row.querySelector('.os-item-qty').value) || 0;
            const unit = Number(row.querySelector('.os-item-unit').value) || 0;
            const total = qty * unit;
            subtotal += total;
            
            if (desc) {
                tableRowsHTML += `
                    <tr>
                        <td style="text-align:center;">${num}</td>
                        <td>${code || 'SER-GEN'}</td>
                        <td>${desc}</td>
                        <td style="text-align:center;">${qty}</td>
                        <td style="text-align:right;">${formatoMoneda(unit)}</td>
                        <td style="text-align:right;">${formatoMoneda(total)}</td>
                    </tr>
                `;
            }
        });
        
        const descVal = Number(document.getElementById('os-descuento').value) || 0;
        const ivaPct = Number(document.getElementById('os-iva').value) || 0;
        const retPct = Number(document.getElementById('os-retencion').value) || 0;
        const baseIVA = Math.max(0, subtotal - descVal);
        const ivaVal = baseIVA * (ivaPct / 100);
        const retVal = baseIVA * (retPct / 100);
        const totalGen = baseIVA + ivaVal - retVal;
        
        htmlContent = `
            <div class="print-invoice">
                <div class="print-header">
                    <div class="print-logo-section">
                        <h1>HABITAD WMS</h1>
                        <p style="font-size: 8pt; margin: 2px 0;">Nit: 123.456.789-0</p>
                    </div>
                    <div class="print-doc-info">
                        <h2>ORDEN DE SERVICIO</h2>
                        <p style="font-size: 11pt; font-weight: bold; margin: 5px 0;">Nº Consecutivo: ${consecutivo || 'TEMP-OS'}</p>
                        <p style="font-size: 8pt; margin: 2px 0;">Fecha Emisión: ${fecha}</p>
                        <p style="font-size: 8pt; margin: 2px 0;">Fecha Envío: ${envio || '-'}</p>
                    </div>
                </div>
                
                <div class="print-details-grid">
                    <div class="print-details-block">
                        <h3>Detalle Prestador</h3>
                        <p><strong>Razón Social:</strong> ${provObj ? provObj.nombre : 'No especificado'}</p>
                        <p><strong>NIT:</strong> ${provNit}</p>
                        <p><strong>Teléfono:</strong> ${provObj ? (provObj.telefono || '-') : '-'}</p>
                        <p><strong>Dirección:</strong> ${provObj ? (provObj.direccion || '-') : '-'}</p>
                    </div>
                    <div class="print-details-block">
                        <h3>Condiciones Servicio</h3>
                        <p><strong>Condiciones del Servicio:</strong> ${cond || 'N/A'}</p>
                        <p><strong>Forma de Pago:</strong> ${pago || 'N/A'}</p>
                    </div>
                </div>
                
                <table class="print-table">
                    <thead>
                        <tr>
                            <th style="width:5%; text-align:center;">Item</th>
                            <th style="width:20%;">Código</th>
                            <th style="width:40%;">Descripción Servicio</th>
                            <th style="width:10%; text-align:center;">Cantidad</th>
                            <th style="width:12%; text-align:right;">V. Unitario</th>
                            <th style="width:13%; text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHTML || '<tr><td colspan="6" style="text-align:center;">No hay ítems registrados</td></tr>'}
                    </tbody>
                </table>
                
                <div class="print-summary-section">
                    <div class="print-observaciones">
                        <strong>Observaciones:</strong><br>
                        <p>${obs || 'Sin observaciones adicionales.'}</p>
                    </div>
                    <div class="print-totales">
                        <table>
                            <tr>
                                <td>Subtotal:</td>
                                <td>${formatoMoneda(subtotal)}</td>
                            </tr>
                            <tr>
                                <td>Descuento:</td>
                                <td>-${formatoMoneda(descVal)}</td>
                            </tr>
                            <tr>
                                <td>IVA (${ivaPct}%):</td>
                                <td>${formatoMoneda(ivaVal)}</td>
                            </tr>
                            <tr>
                                <td>Retención (${retPct}%):</td>
                                <td>-${formatoMoneda(retVal)}</td>
                            </tr>
                            <tr class="grand-total">
                                <td>Total General:</td>
                                <td>${formatoMoneda(totalGen)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="print-signatures">
                    <div class="print-signature-line">Supervisor Encargado</div>
                    <div class="print-signature-line">Firma de Conformidad Prestador</div>
                </div>
            </div>
        `;
    }
    else if (tipoDoc === 'VENTA') {
        const remision = document.getElementById('venta-remision').value.trim();
        const fecha = document.getElementById('venta-fecha').value;
        const cliNit = document.getElementById('venta-cliente').value;
        const cliObj = state.clientes.find(c => c.nit === cliNit);
        const obs = document.getElementById('venta-observaciones').value;
        
        const rows = document.querySelectorAll('#venta-items-table-body tr');
        let subtotal = 0;
        let tableRowsHTML = '';
        
        rows.forEach(row => {
            const num = row.querySelector('.venta-row-item-num').textContent;
            const code = row.querySelector('.venta-item-select').value;
            const desc = row.querySelector('.venta-item-desc').value;
            const qty = Number(row.querySelector('.venta-item-qty').value) || 0;
            const unit = Number(row.querySelector('.venta-item-unit').value) || 0;
            const total = qty * unit;
            subtotal += total;
            
            if (code) {
                tableRowsHTML += `
                    <tr>
                        <td style="text-align:center;">${num}</td>
                        <td>${code}</td>
                        <td>${desc}</td>
                        <td style="text-align:center;">${qty}</td>
                        <td style="text-align:right;">${formatoMoneda(unit)}</td>
                        <td style="text-align:right;">${formatoMoneda(total)}</td>
                    </tr>
                `;
            }
        });
        
        const ivaPct = Number(document.getElementById('venta-iva').value) || 0;
        const ivaVal = subtotal * (ivaPct / 100);
        const totalGen = subtotal + ivaVal;
        
        htmlContent = `
            <div class="print-invoice">
                <div class="print-header">
                    <div class="print-logo-section">
                        <h1>HABITAD WMS</h1>
                        <p style="font-size: 8pt; margin: 2px 0;">Nit: 123.456.789-0</p>
                    </div>
                    <div class="print-doc-info">
                        <h2>REMISIÓN DE VENTA</h2>
                        <p style="font-size: 11pt; font-weight: bold; margin: 5px 0;">Nº Remisión: ${remision || 'TEMP-REM'}</p>
                        <p style="font-size: 8pt; margin: 2px 0;">Fecha: ${fecha}</p>
                    </div>
                </div>
                
                <div class="print-details-grid">
                    <div class="print-details-block" style="grid-column: span 2;">
                        <h3>Detalle Cliente</h3>
                        <p><strong>Nombre / Razón Social:</strong> ${cliObj ? cliObj.nombre : 'No especificado'}</p>
                        <p><strong>Cédula / NIT:</strong> ${cliNit}</p>
                        <p><strong>Teléfono:</strong> ${cliObj ? (cliObj.telefono || '-') : '-'}</p>
                        <p><strong>Dirección:</strong> ${cliObj ? (cliObj.direccion || '-') : '-'}</p>
                        <p><strong>Correo Electrónico:</strong> ${cliObj ? (cliObj.correo || '-') : '-'}</p>
                    </div>
                </div>
                
                <table class="print-table">
                    <thead>
                        <tr>
                            <th style="width:5%; text-align:center;">Item</th>
                            <th style="width:20%;">Código</th>
                            <th style="width:40%;">Descripción Producto</th>
                            <th style="width:10%; text-align:center;">Cantidad</th>
                            <th style="width:12%; text-align:right;">V. Unitario</th>
                            <th style="width:13%; text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHTML || '<tr><td colspan="6" style="text-align:center;">No hay ítems registrados</td></tr>'}
                    </tbody>
                </table>
                
                <div class="print-summary-section">
                    <div class="print-observaciones">
                        <strong>Condiciones / Observaciones:</strong><br>
                        <p>${obs || 'Esta remisión sirve como constancia de despacho físico de mercancía en bodega.'}</p>
                    </div>
                    <div class="print-totales">
                        <table>
                            <tr>
                                <td>Subtotal:</td>
                                <td>${formatoMoneda(subtotal)}</td>
                            </tr>
                            <tr>
                                <td>IVA (${ivaPct}%):</td>
                                <td>${formatoMoneda(ivaVal)}</td>
                            </tr>
                            <tr class="grand-total">
                                <td>Total General:</td>
                                <td>${formatoMoneda(totalGen)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="print-signatures">
                    <div class="print-signature-line">Despachado por (Bodega)</div>
                    <div class="print-signature-line">Recibido Conforme (Cliente)</div>
                </div>
            </div>
        `;
    }
    
    printContainer.innerHTML = htmlContent;
    
    // Disparar la impresión nativa del navegador
    setTimeout(() => {
        window.print();
    }, 150);
}
