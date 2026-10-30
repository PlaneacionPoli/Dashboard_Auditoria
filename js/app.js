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
                // Sin servidor (HTML descargado) o archivo ausente: pedir el Excel al usuario
                this.showExcelPicker(dataManager.lastError);
                return;
            }
            console.log('✓ Datos cargados exitosamente');
            await this.startDashboard();
        } catch (error) {
            console.error('✗ ERROR AL INICIALIZAR:', error);
            this.showErrorMessage(error);
        }
    }

    /**
     * Pasos posteriores a la carga del Excel
     */
    async startDashboard() {
        try {
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
            // Recalcular gráficos cuando cargue Montserrat para que las etiquetas no se recorten
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => Object.values(dashboard.charts).forEach(chart => chart.update()));
            }

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
     * Mostrar aviso con selector de archivo cuando el Excel no se pudo leer automáticamente
     */
    showExcelPicker(error) {
        const isLocalFile = window.location.protocol === 'file:';
        const div = document.createElement('div');
        div.className = 'alert alert-warning m-3 excel-picker';
        div.role = 'alert';
        div.innerHTML = `
            <h5 class="alert-heading"><i class="fas fa-file-excel me-2"></i>Seleccione el archivo de hallazgos</h5>
            <p class="mb-2">${isLocalFile
                ? 'El dashboard se abrió directamente desde el equipo y el navegador no permite leer el Excel de forma automática.'
                : `No se pudo leer <strong>${dataManager.excelFile}</strong>${error ? ` (${this.escapeText(error.message)})` : ''}.`}</p>
            <p class="mb-3 small">Elija el archivo <strong>CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx</strong> (carpeta <strong>data</strong> del proyecto) para cargar el tablero.</p>
            <label class="btn btn-sm btn-primary mb-0">
                <i class="fas fa-folder-open me-1"></i> Seleccionar archivo Excel
                <input type="file" id="inputExcelLocal" accept=".xlsx,.xls" hidden>
            </label>
            <span class="small ms-2" id="excelPickerStatus"></span>
        `;
        const container = document.querySelector('.container-fluid.px-4') || document.body;
        container.insertBefore(div, container.firstChild);

        div.querySelector('#inputExcelLocal').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const status = div.querySelector('#excelPickerStatus');
            status.textContent = `Leyendo ${file.name}…`;
            const ok = await dataManager.loadFromFile(file);
            if (!ok) {
                status.textContent = `No se pudo leer el archivo: ${dataManager.lastError ? dataManager.lastError.message : 'formato no válido'}`;
                event.target.value = '';
                return;
            }
            div.remove();
            await this.startDashboard();
        });
    }

    escapeText(text) {
        const span = document.createElement('span');
        span.textContent = String(text || '');
        return span.innerHTML;
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
            } else {
                this.showNotification('No se pudo volver a leer el Excel. Recargue la página y selecciónelo de nuevo.', 'warning');
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
