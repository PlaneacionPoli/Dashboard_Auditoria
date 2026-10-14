/**
 * APP - Inicializador Principal
 * Coordina la inicialización de todos los módulos
 */

class Application {
    constructor() {
        this.isLoading = true;
    }

    /**
     * Inicializar aplicación
     * Secuencia: Excel → Supabase diligenciamiento → merge → filtros → dashboard → exportaciones
     */
    async init() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  DASHBOARD DE AUDITORÍA - INICIALIZANDO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            // Paso 1: Cargar datos desde Excel
            console.log('📂 Cargando datos...');
            const dataLoaded = await dataManager.loadData();
            
            if (!dataLoaded) {
                throw new Error('No se pudieron cargar los datos del Excel');
            }
            console.log('✓ Datos cargados exitosamente');

            // Paso 2: Inicializar servicio de diligenciamiento y cargar datos guardados
            console.log('🔗 Conectando diligenciamiento...');
            diligenciaService.init();
            await diligenciaService.loadAll();

            // Paso 3: Fusionar diligenciamiento guardado sobre los registros del Excel
            diligenciaService.mergeIntoRecords(dataManager.consolidatedData);
            console.log('✓ Diligenciamiento fusionado en registros');

            // Paso 4: Inicializar filtros
            console.log('🔧 Inicializando filtros...');
            filterManager.initFilters();

            // Paso 5: Inicializar dashboard
            console.log('📊 Inicializando dashboard...');
            dashboard.init();

            // Paso 6: Inicializar exportaciones
            console.log('💾 Inicializando exportaciones...');
            exportManager.initExportButtons();

            // Paso 7: Configurar eventos globales
            this.setupGlobalEvents();

            this.isLoading = false;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ APLICACIÓN INICIALIZADA CORRECTAMENTE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const stats = dataManager.getStatistics();
            console.log(`📊 Total de registros (válidos): ${stats.total} — raw: ${dataManager.getData().length}`);
            console.log(`🗂️  Hoja fuente: CONSOLIDADO del consolidado 2026`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            this.showStartupMessage();

        } catch (error) {
            console.error('✗ ERROR AL INICIALIZAR:', error);
            this.showErrorMessage(error);
        }
    }

    /**
     * Configurar eventos globales
     */
    setupGlobalEvents() {
        // Botón Actualizar: recarga Excel + re-merge desde Supabase
        document.getElementById('btnRefresh').addEventListener('click', async () => {
            console.log('🔄 Actualizando datos...');
            const dataLoaded = await dataManager.loadData();
            if (dataLoaded) {
                await diligenciaService.loadAll();
                diligenciaService.mergeIntoRecords(dataManager.consolidatedData);
                filterManager.clearFilters();
                this.showNotification('Datos actualizados correctamente');
            }
        });

        // Persistir filtros antes de cerrar
        window.addEventListener('beforeunload', () => {
            filterManager.saveFilters();
        });

        // Capturar errores no manejados
        window.addEventListener('error', (event) => {
            console.error('⚠️  Error global:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('⚠️  Promesa rechazada:', event.reason);
        });
    }

    /**
     * Mostrar estadísticas en consola al iniciar
     */
    showStartupMessage() {
        const stats = dataManager.getStatistics();
        console.log('📊 ESTADÍSTICAS GLOBALES:');
        console.log(`   • Total Hallazgos: ${stats.total}`);
        console.log(`   • Críticos: ${stats.criticos} | Medios: ${stats.medios} | Bajos: ${stats.bajos}`);
        console.log(`   • Cerrados: ${stats.cerrados} | Vencidos: ${stats.vencidos}`);
        console.log(`   • Cumplimiento Global: ${stats.pct_cumplimiento}%`);
        console.log(`   • Avance Promedio: ${stats.avance_promedio}%`);
        console.log(`   • Reincidentes: ${stats.reincidentes} (${stats.pct_reincidencia}%)`);
    }

    /**
     * Mostrar mensaje de error al cargar
     */
    showErrorMessage(error) {
        const div = document.createElement('div');
        div.className = 'alert alert-danger alert-dismissible fade show m-3';
        div.role = 'alert';
        div.innerHTML = `
            <h4 class="alert-heading">Error de Carga</h4>
            <p>${error.message}</p>
            <hr>
            <p class="mb-0">
                Por favor verifica que:
                <ul>
                    <li>El archivo <strong>CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx</strong> esté en la carpeta <strong>/data</strong></li>
                    <li>El archivo no esté bloqueado ni abierto en otra aplicación</li>
                    <li>Las hojas se llamen exactamente: <strong>Base Hallazgos SIG</strong> y <strong>Base Hallazgos Aseguramiento</strong></li>
                </ul>
            </p>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        container.insertBefore(div, container.firstChild);
    }

    /**
     * Mostrar notificación flotante
     */
    showNotification(message, type = 'success') {
        const alertClass = {
            'success': 'alert-success',
            'info': 'alert-info',
            'warning': 'alert-warning',
            'error': 'alert-danger'
        }[type] || 'alert-success';

        const div = document.createElement('div');
        div.className = `position-fixed alert ${alertClass} alert-dismissible fade show m-3`;
        div.style.zIndex = '9999';
        div.style.top = '80px';
        div.style.right = '0';
        div.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }
}

// Crear instancia global
const app = new Application();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Para debugging en consola
window.DEBUG = {
    dataManager,
    filterManager,
    dashboard,
    exportManager,
    diligenciaService,
    app,

    showStats() {
        console.table(dataManager.getStatistics());
    },
    showData(limit = 5) {
        console.table(dataManager.getData().slice(0, limit));
    },
    exportCurrentView() {
        exportManager.exportToExcel();
    },
    clearFiltersDebug() {
        filterManager.clearFilters();
    },
    getFilteredCount() {
        return dashboard.currentData.length;
    },
    showDiligencia(codigo) {
        console.table(diligenciaService.get(codigo));
    }
};

console.log('💡 Tip: Usa window.DEBUG para acceder a funciones de debugging en la consola');
