/**
 * DILIGENCIA SERVICE - Persistencia de diligenciamiento en Supabase
 * Maneja la lectura y escritura de campos diligenciados por el usuario:
 *   tipo_accion, accion_correctiva, correccion_descripcion,
 *   mejora_descripcion, avance_porcentaje, tipo_validacion, resultado_validacion
 */

class DiligenciaService {
    constructor() {
        this.client = null;
        this.cache = {};   // { [codigo_hallazgo]: { ...campos } }
        this.enabled = false;
    }

    /**
     * Inicializar cliente Supabase.
     * Requiere que window.APP_CONFIG esté definido (desde js/config.js).
     */
    init() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.SUPABASE_URL || window.APP_CONFIG.SUPABASE_URL.includes('TU_PROYECTO')) {
            console.warn('⚠ DiligenciaService: config.js no configurado. El diligenciamiento solo se guardará en localStorage.');
            this.enabled = false;
            return;
        }

        try {
            const { createClient } = window.supabase;
            this.client = createClient(
                window.APP_CONFIG.SUPABASE_URL,
                window.APP_CONFIG.SUPABASE_ANON_KEY
            );
            this.enabled = true;
            console.log('✓ DiligenciaService: Supabase conectado');
        } catch (e) {
            console.error('✗ DiligenciaService: error al inicializar Supabase:', e);
            this.enabled = false;
        }
    }

    /**
     * Cargar todos los registros de diligenciamiento desde Supabase.
     * Llena el cache interno para merge posterior.
     * @returns {Promise<boolean>}
     */
    async loadAll() {
        if (!this.enabled) {
            console.log('ℹ DiligenciaService: modo offline, cargando desde localStorage');
            this._loadFromLocalStorage();
            return true;
        }

        try {
            const { data, error } = await this.client
                .from('hallazgos_diligencia')
                .select('*');

            if (error) throw error;

            this.cache = {};
            (data || []).forEach(row => {
                this.cache[row.codigo_hallazgo] = row;
            });

            console.log(`✓ DiligenciaService: ${Object.keys(this.cache).length} registros de diligenciamiento cargados`);
            return true;
        } catch (e) {
            console.error('✗ DiligenciaService: error al cargar desde Supabase:', e);
            // Fallback a localStorage
            this._loadFromLocalStorage();
            return true;
        }
    }

    /**
     * Guardar o actualizar el diligenciamiento de un hallazgo.
     * @param {string} codigo - Código del hallazgo (PK)
     * @param {Object} payload - Campos a guardar
     * @returns {Promise<boolean>}
     */
    async save(codigo, payload) {
        if (!codigo) return false;

        // Los campos que este guardado no trae conservan lo ya registrado:
        // el proceso y auditoría guardan en momentos distintos sobre el mismo hallazgo
        const previo = this.cache[codigo] || {};
        const valor = (campo) => payload[campo] !== undefined ? payload[campo] : (previo[campo] ?? null);
        const avance = valor('avance_porcentaje');
        const record = {
            codigo_hallazgo: codigo,
            tipo_accion:            valor('tipo_accion'),
            accion_correctiva:      valor('accion_correctiva'),
            correccion_descripcion: valor('correccion_descripcion'),
            mejora_descripcion:     valor('mejora_descripcion'),
            avance_porcentaje:      avance != null ? parseInt(avance, 10) : null,
            tipo_validacion:        valor('tipo_validacion'),
            resultado_validacion:   valor('resultado_validacion')
        };

        // Actualizar cache local siempre
        this.cache[codigo] = { ...this.cache[codigo], ...record };

        // Persistir en localStorage como fallback
        this._saveToLocalStorage(codigo, record);

        if (!this.enabled) return true;

        try {
            const { error } = await this.client
                .from('hallazgos_diligencia')
                .upsert(record, { onConflict: 'codigo_hallazgo' });

            if (error) throw error;
            console.log(`✓ DiligenciaService: guardado hallazgo ${codigo}`);
            return true;
        } catch (e) {
            console.error(`✗ DiligenciaService: error al guardar ${codigo}:`, e);
            return false;
        }
    }

    /**
     * Guardar la validación de auditoría (eficacia de la acción).
     * En Supabase va en el mismo registro del hallazgo.
     */
    async saveValidacion(codigo, payload) {
        return this.save(codigo, {
            tipo_validacion: payload.tipo_validacion ?? null,
            resultado_validacion: payload.resultado_validacion ?? null
        });
    }

    /**
     * Qué puede registrar quien está viendo el tablero.
     * true = puede, false = no puede, null = no se sabe (se deja intentar).
     */
    async permisos() {
        return { proceso: null, auditoria: null };
    }

    /**
     * Fusionar los datos de diligenciamiento sobre el array de registros del dashboard.
     * Aplica los valores del cache (Supabase o localStorage) sobre cada record del Excel.
     * @param {Array} records - Array de registros consolidados de dataManager
     */
    mergeIntoRecords(records) {
        records.forEach(record => {
            const saved = this.cache[record.codigo];
            if (!saved) return;

            if (saved.tipo_accion           != null) record.tipo_accion            = saved.tipo_accion;
            if (saved.accion_correctiva     != null) record.accion_correctiva      = saved.accion_correctiva;
            if (saved.correccion_descripcion != null) record.correccion_descripcion = saved.correccion_descripcion;
            if (saved.mejora_descripcion    != null) record.mejora_descripcion     = saved.mejora_descripcion;
            if (saved.avance_porcentaje     != null) record.avance_porcentaje      = saved.avance_porcentaje;
            if (saved.tipo_validacion       != null) record.tipo_validacion        = saved.tipo_validacion;
            if (saved.resultado_validacion  != null) record.resultado_validacion   = saved.resultado_validacion;
        });
    }

    /**
     * Obtener diligenciamiento cacheado de un hallazgo.
     * @param {string} codigo
     * @returns {Object|null}
     */
    get(codigo) {
        return this.cache[codigo] || null;
    }

    // ─── Helpers localStorage (fallback offline) ──────────────────────────────

    _localStorageKey(codigo) {
        return `diligencia_${codigo}`;
    }

    _saveToLocalStorage(codigo, record) {
        try {
            localStorage.setItem(this._localStorageKey(codigo), JSON.stringify(record));
        } catch (e) { /* cuota llena, ignorar */ }
    }

    _loadFromLocalStorage() {
        const prefix = 'diligencia_';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const codigo = key.slice(prefix.length);
                    const record = JSON.parse(localStorage.getItem(key));
                    this.cache[codigo] = record;
                } catch (e) { /* ignorar entradas corruptas */ }
            }
        }
        console.log(`ℹ DiligenciaService: ${Object.keys(this.cache).length} registros cargados desde localStorage`);
    }
}

// Instancia global
const diligenciaService = new DiligenciaService();
