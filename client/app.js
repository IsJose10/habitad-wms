import { state } from './js/state.js';
import { fetchAPI } from './js/api.js';
import { imprimirDocumento } from './js/print.js';
import { 
    formatoMoneda, 
    initDateInputs,
    esZonaMontacarguista,
    populateProductosSelect,
    populateClientesSelect,
    populateProveedoresSelect
} from './js/utils.js';

// Import views to run and register their window functions
import './js/views/montacarguista.js';
import './js/views/picking.js';
import './js/views/compras.js';
import './js/views/ventas.js';
import './js/views/catalogo.js';
import './js/views/recibo.js';
import './js/views/despacho.js';
import './js/views/dashboard.js';
import './js/views/inventario.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDateInputs();
    loadCatalogos();
    if (window.loadDashboardStats) {
        window.loadDashboardStats();
    }
    configFormObservers();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            showView(viewName);

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

export function showView(viewName) {
    state.currentView = viewName;

    document.querySelectorAll('.view-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    const activePane = document.getElementById(`view-${viewName}`);
    if (activePane) {
        activePane.classList.add('active');
    }

    const viewTitles = {
        dashboard: 'Dashboard',
        montacarguista: 'Consolidado Diario - Montacarguista',
        picking: 'Alistamiento de Picking - Auxiliar',
        inventario: 'Inventario (Ubicaciones y Stock)',
        entradas: 'Recibo de Mercancía (IN)',
        salidas: 'Despacho de Mercancía (OUT)',
        compras: 'Órdenes de Compra (OC)',
        ventas: 'Ventas y Remisiones',
        productos: 'Catálogo de Productos',
        clientes: 'Gestión de Clientes',
        proveedores: 'Gestión de Proveedores'
    };

    const titleEl = document.getElementById('viewTitle');
    if (titleEl) {
        titleEl.textContent = viewTitles[viewName] || 'HABITAD WMS';
    }

    if (viewName === 'dashboard' && window.loadDashboardStats) {
        window.loadDashboardStats();
    } else if (viewName === 'inventario' && window.switchInvTab) {
        window.switchInvTab('consulta');
    } else if (viewName === 'productos' && window.loadProductos) {
        window.loadProductos();
    } else if (viewName === 'clientes' && window.loadClientes) {
        window.loadClientes();
    } else if (viewName === 'proveedores' && window.loadProveedores) {
        window.loadProveedores();
    } else if (viewName === 'salidas') {
        if (window.loadMovimientosRecientes) window.loadMovimientosRecientes();
        populateProductosSelect('out-producto');
    } else if (viewName === 'entradas' && window.limpiarFormRecibo) {
        window.limpiarFormRecibo();
    } else if (viewName === 'compras') {
        if (window.limpiarFormOC) window.limpiarFormOC();
        populateProveedoresSelect('oc-proveedor');
    } else if (viewName === 'ventas') {
        if (window.limpiarFormVenta) window.limpiarFormVenta();
        populateClientesSelect('venta-cliente');
    } else if (viewName === 'montacarguista') {
        const inputFecha = document.getElementById('monta-fecha');
        if (inputFecha && !inputFecha.value) {
            inputFecha.value = new Date().toISOString().split('T')[0];
        }
        if (window.loadMontacarguistaConsolidado) window.loadMontacarguistaConsolidado();
    }
}

function configFormObservers() {
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('inv-details-panel');
        if (e.target === modal && window.closeInvDetails) {
            window.closeInvDetails();
        }
    });
}

async function loadCatalogos() {
    try {
        state.clientes = await fetchAPI('/clientes') || [];
        state.proveedores = await fetchAPI('/proveedores') || [];
        state.productos = await fetchAPI('/productos') || [];
        state.stockPorUbicacion = await fetchAPI('/inventario/stock/ubicaciones') || [];
    } catch (err) {
        console.warn('No se pudieron cargar algunos catálogos iniciales.');
    }
}

// Bind main orchestrator methods to window for HTML accessibility
window.showView = showView;
window.imprimirDocumento = imprimirDocumento;
window.fetchAPI = fetchAPI;
window.loadCatalogos = loadCatalogos;
