/**
 * DATA MANAGER - Gestión de datos Excel
 * Lectura, consolidación y transformación de datos
 */

class DataManager {
    constructor() {
        this.rawData = [];
        this.consolidatedData = [];
        this.excelFile = 'data/CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx';

        // Mapeo de columnas por hoja: clave_interna -> nombre_columna_Excel
        this.columnMapping = {
            'Base Hallazgos SIG': {
                'codigo': 'Código Hallazgo',
                'fecha_deteccion': 'Fecha de Detección',
                'auditoria': 'Auditoría',
                'proceso': 'Proceso',
                'subproceso': 'Subproceso',
                'responsable_proceso': 'Responsable del Proceso',
                'criterio_incumplido': 'Criterio Incumplido',
                'descripcion': 'Descripción del Hallazgo',
                'evidencia': 'Evidencia',
                'causa_raiz': 'Causa Raíz',
                'riesgos': 'Riesgos Asociados',
                'accion_correctiva': 'Acción Correctiva',
                'avance_raw': 'Avance',
                'tipo_accion': 'Tipo de Acción',
                'responsable_accion': 'Responsable de la Acción',
                'area_responsable': 'Área Responsable',
                'fecha_compromiso': 'Fecha Compromiso',
                'evidencia_esperada': 'Evidencia Esperada',
                'indicador_cumplimiento': 'Indicador de Cumplimiento',
                'avance_porcentaje': '% Avance',
                'fecha_ultimo_seguimiento': 'Fecha Último Seguimiento',
                'observaciones': 'Observaciones de Seguimiento',
                'escalado_direccion': 'Escalado a Dirección',
                'fecha_escalamiento': 'Fecha de Escalamiento',
                'fecha_implementacion': 'Fecha Implementación Real',
                'tipo_validacion': 'Tipo de Validación',
                'resultado_validacion': 'Resultado de Validación',
                'auditor_valida': 'Auditor que Valida',
                'fecha_cierre': 'Fecha Cierre Oficial',
                'reincidencia': 'Reincidencia',
                'impacto_mitigado': 'Impacto Mitigado',
                'comentarios_cierre': 'Comentarios de Cierre'
            },
            'Base Hallazgos Aseguramiento': {
                'codigo': 'Código Hallazgo',
                'fecha_deteccion': 'Fecha de Cierre',
                'auditoria': 'Auditoría',
                'proceso': 'Proceso',
                'subproceso': 'Subproceso',
                'responsable_proceso': 'Responsable del Proceso',
                'criticidad': 'Criticidad',
                'criterio_incumplido': 'Criterio Incumplido',
                'descripcion': 'Descripción del Hallazgo',
                'riesgos': 'Riesgos Asociados',
                'accion_correctiva': 'Acciones / Actividades',
                'tipo_accion': 'Tipo de Acción',
                'responsable_accion': 'Responsable de la Acción',
                'area_responsable': 'Área Responsable',
                'fecha_compromiso': 'Fecha Compromiso',
                'evidencia_esperada': 'Evidencia Esperada',
                'indicador_cumplimiento': 'Indicador de Cumplimiento',
                'avance_porcentaje': '% Avance',
                'fecha_ultimo_seguimiento': 'Fecha Último Seguimiento',
                'observaciones': 'Observaciones de Seguimiento',
                'escalado_direccion': 'Escalado a Dirección',
                'fecha_escalamiento': 'Fecha de Escalamiento',
                'fecha_implementacion': 'Fecha Implementación Real',
                'tipo_validacion': 'Tipo de Validación',
                'resultado_validacion': 'Resultado de Validación',
                'auditor_valida': 'Auditor que Valida',
                'fecha_cierre': 'Fecha Cierre Oficial',
                'reincidencia': 'Reincidencia',
                'impacto_mitigado': 'Impacto Mitigado',
                'comentarios_cierre': 'Comentarios de Cierre'
            }
        };

        // Columnas clave para determinar si una fila tiene datos reales
        this.keyColumns = ['codigo', 'auditoria', 'proceso', 'descripcion'];
    }

    createConsolidadoMapping(headers) {
        const findHeader = (...names) => names.find(name => headers.includes(name)) || '';
        return {
            'codigo': findHeader('Código Hallazgo', 'Código', 'ID', 'Id'),
            'fecha_deteccion': findHeader('FECHA DE DETECCIÓN', 'Fecha de Detección', 'Fecha Detección'),
            'lider': findHeader('LÍDER', 'Líder', 'Lider'),
            'responsable_proceso': findHeader('LÍDER', 'Líder', 'Lider', 'Responsable del Proceso'),
            'auditoria': findHeader('Auditoría', 'Auditoria'),
            'proceso': findHeader('PROCESO', 'Proceso'),
            'subproceso': findHeader('SUBPROCESO', 'Subproceso'),
            'unidad': findHeader('UNIDAD', 'Unidad'),
            'categoria': findHeader('CATEGORÍA', 'Categoría', 'Categoria'),
            'nombre': findHeader('NOMBRE', 'Nombre'),
            'descripcion': findHeader('DESCRIPCIÓN', 'Descripción del Hallazgo', 'Descripción'),
            'recomendaciones': findHeader('RECOMENDACIONES', 'Recomendaciones'),
            'criticidad': findHeader('Criticidad'),
            'estado': findHeader('Estado'),
            'fecha_compromiso': findHeader('Fecha Compromiso'),
            'avance_porcentaje': findHeader('% Avance', 'Avance')
        };
    }

    /**
     * Cargar datos desde Excel
     */
    async loadData() {
        try {
            // Cache-bust para forzar descarga fresca en GitHub Pages y evitar respuestas 304/500 cacheadas
            const url = this.excelFile + '?t=' + Date.now();
            console.log(`🔎 Intentando cargar archivo Excel: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText} al solicitar ${this.excelFile}`);
            }
            const buffer = await response.arrayBuffer();

            let workbook;
            try {
                workbook = XLSX.read(buffer, { type: 'array' });
            } catch (e) {
                console.error('✗ Error leyendo el workbook con SheetJS:', e);
                throw new Error('SheetJS no pudo leer el archivo: ' + (e.message || e));
            }

            console.log('📑 Hojas detectadas:', workbook.SheetNames);

            this.rawData = [];

            // La fuente oficial para el dashboard es exclusivamente la hoja CONSOLIDADO.
            const sheetsToProcess = ['CONSOLIDADO', 'Hoja1'].filter(
                name => workbook.SheetNames.includes(name)
            ).slice(0, 1);

            sheetsToProcess.forEach((sheetName, index) => {
                const exists = workbook.SheetNames.includes(sheetName);
                if (!exists) {
                    console.warn(`⚠ Hoja no encontrada: ${sheetName}`);
                    return;
                }

                const worksheet = workbook.Sheets[sheetName];
                const allData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                this.columnMapping[sheetName] = this.createConsolidadoMapping(
                    Object.keys(allData[0] || {})
                );
                console.log(`📄 Hoja '${sheetName}' - filas totales en Excel: ${allData.length}`);

                // Filtrar filas completamente vacías (sin datos en columnas clave)
                const data = allData.filter(row => {
                    return this.keyColumns.some(key => {
                        const mapping = this.columnMapping[sheetName];
                        const excelCol = mapping[key];
                        const val = row[excelCol];
                        return val !== undefined && val !== null && String(val).trim() !== '';
                    });
                });

                console.log(`📄 Hoja '${sheetName}' - filas con datos reales: ${data.length} (filtradas ${allData.length - data.length} vacías)`);

                if (data.length > 0) {
                    console.log('📌 Ejemplo fila:', JSON.stringify(data[0]).substring(0, 300));
                    console.log('🔤 Encabezados Excel:', Object.keys(data[0]));
                }

                // Procesar registros
                data.forEach((row, rowIndex) => {
                    const record = this.normalizeRecord(row, sheetName, index);

                    // Si no tiene código, generamos uno
                    if (!record.codigo || String(record.codigo).trim() === '') {
                        const shortSheet = sheetName.replace(/\s+/g, '').substring(0, 8);
                        record.codigo = `GEN-${shortSheet}-${index + 1}-${rowIndex + 1}`;
                        record._generatedCodigo = true;
                    }

                    record.origen = index === 0 ? 'SIG' : 'Aseguramiento';
                    this.rawData.push(record);
                });
            });

            // Consolidar y procesar datos
            this.consolidateData();
            console.log(`✓ Registros totales válidos: ${this.rawData.length}`);
            console.log(`✓ Datos consolidados: ${this.consolidatedData.length} registros`);
            return true;
        } catch (error) {
            console.error('✗ Error al cargar Excel:', error);
            alert('Error al cargar el archivo Excel. Verifica que esté en /data/CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx');
            return false;
        }
    }

    /**
     * Normalizar registro (mapear columnas)
     */
    normalizeRecord(row, sheetName, sheetIndex) {
        const mapping = this.columnMapping[sheetName];
        const normalized = {};

        Object.keys(mapping).forEach(key => {
            const excelColumnName = mapping[key];
            normalized[key] = excelColumnName && row[excelColumnName] !== undefined ? row[excelColumnName] : '';
        });

        ['unidad', 'proceso', 'subproceso', 'categoria', 'nombre', 'auditoria'].forEach(field => {
            if (typeof normalized[field] === 'string') normalized[field] = normalized[field].trim();
        });

        normalized.auditoria = normalized.auditoria || 'Auditoría Interna 2026';

        // Construir proceso combinando Proceso + Subproceso si ambos existen
        const proceso = String(normalized.proceso || '').trim();
        const subproceso = String(normalized.subproceso || '').trim();
        if (proceso && subproceso && proceso !== subproceso) {
            normalized.proceso_display = `${proceso} - ${subproceso}`;
        } else if (proceso) {
            normalized.proceso_display = proceso;
        } else if (subproceso) {
            normalized.proceso_display = subproceso;
        } else {
            normalized.proceso_display = '';
        }

        // La fuente no contiene criticidad; no inferirla desde avance o estado.
        normalized.criticidad = this.inferCriticidad(normalized, sheetName);

        // Avance: manejar tanto decimal (0.4) como porcentaje (40) como string ("40%")
        normalized.avance_porcentaje = this.parseAvance(normalized);

        // Estado: determinar lógicamente ya que las fórmulas de Excel no se evalúan
        normalized.estado = this.determineState(normalized);

        // Días vencidos
        normalized.dias_vencidos = this.calculateDaysOverdue(normalized.fecha_compromiso);

        // Semáforo
        normalized.semaforo = this.calculateTrafficLight(normalized);

        // Reincidencia
        normalized.es_reincidente = String(normalized.reincidencia || '').toLowerCase().includes('si') ||
                                   String(normalized.reincidencia || '').toLowerCase().includes('yes');

        return normalized;
    }

    /**
     * Inferir criticidad cuando no existe la columna
     * Para SIG no hay columna Criticidad; inferimos del Criterio Incumplido o默认 'Medio'
     */
    inferCriticidad(record, sheetName) {
        // Si ya tiene criticidad válida (ASEG la tiene)
        const crit = String(record.criticidad || '').trim();
        if (['Alto', 'Medio', 'Bajo'].includes(crit)) {
            return crit;
        }

        return 'No disponible';
    }

    /**
     * Parsear solo el valor de la columna "Avance" (decimal o porcentaje)
     */
    parseAvanceRawValue(val) {
        if (val === undefined || val === null || val === '') return 0;
        const str = String(val).replace('%', '').trim();
        const parsed = parseFloat(str);
        if (isNaN(parsed)) return 0;
        if (parsed >= 0 && parsed <= 1) return Math.round(parsed * 100);
        return Math.min(100, Math.max(0, Math.round(parsed)));
    }

    /**
     * Texto para columna N° de OM / Descrip de Actividad según tipo de acción.
     * Mejora → Acción Correctiva | Corrección/AC → Acciones / Actividades (mapeado en accion_correctiva)
     */
    getOmActividad(record, tipo) {
        const t = tipo || record.tipo_accion || '';

        if (t === 'Acción de Mejora') {
            if (record.mejora_descripcion) return String(record.mejora_descripcion).trim();
            return String(record.accion_correctiva || '').trim();
        }
        if (t === 'Corrección') {
            if (record.correccion_descripcion) return String(record.correccion_descripcion).trim();
            return String(record.accion_correctiva || '').trim();
        }
        if (t === 'Acción Correctiva') {
            return String(record.accion_correctiva || '').trim();
        }
        return '';
    }

    /**
     * % Avance para columna condicional según tipo de acción.
     * Mejora → columna Avance | Corrección/AC → columna % Avance
     */
    getOmAvance(record, tipo) {
        const t = tipo || record.tipo_accion || '';

        if (t === 'Acción de Mejora') {
            if (record.avance_porcentaje != null) return record.avance_porcentaje;
            return this.parseAvanceRawValue(record.avance_raw);
        }
        return record.avance_porcentaje ?? 0;
    }

    /**
     * Parsear avance desde múltiples formatos posibles
     * - Decimal: 0.4 -> 40%
     * - Porcentaje directo: 40 -> 40%
     * - String: "40%" -> 40%
     */
    parseAvance(record) {
        // Intentar con % Avance primero (si el campo está presente, incluso si es 0)
        let val = record.avance_porcentaje;
        if (val !== undefined && val !== null && val !== '') {
            return this.parsePercentage(val);
        }

        // Si % Avance está vacío, usar columna "Avance" (decimal)
        val = record.avance_raw;
        if (val === undefined || val === null || val === '') return 0;

        const str = String(val).replace('%', '').trim();
        const parsed = parseFloat(str);
        if (isNaN(parsed)) return 0;

        // Si el valor es decimal (0-1), convertir a porcentaje
        if (parsed >= 0 && parsed <= 1) {
            return Math.round(parsed * 100);
        }
        // Si ya es porcentaje (>1)
        return Math.min(100, Math.max(0, Math.round(parsed)));
    }

    /**
     * Consolidar y procesar datos
     */
    consolidateData() {
        this.consolidatedData = this.rawData.map(record => {
            this.refreshRecordDerivedFields(record);
            return record;
        });
    }

    /**
     * Recalcular campos derivados de un registro (estado, semáforo, prioridad)
     */
    refreshRecordDerivedFields(record) {
        record.dias_vencidos = this.calculateDaysOverdue(record.fecha_compromiso);
        record.estado = this.determineState(record);
        record.semaforo = this.calculateTrafficLight(record);
        record.score_prioridad = this.calculatePriorityScore(record);
    }

    /**
     * Sincronizar un registro en consolidatedData por código (tras guardar diligenciamiento)
     */
    syncRecordByCodigo(codigo, updates) {
        const record = this.consolidatedData.find(r => r.codigo === codigo);
        if (!record) return null;
        Object.assign(record, updates);
        this.refreshRecordDerivedFields(record);
        return record;
    }

    /**
     * Determinar estado basado en los datos disponibles
     */
    determineState(record) {
        // Si ya tiene un estado Automático válido
        const estado = String(record.estado_automatico || '').toLowerCase();
        if (estado.includes('cerrado')) return 'Cerrado';
        if (estado.includes('vencido')) return 'Vencido';
        if (estado.includes('ejecución') || estado.includes('execution')) return 'En ejecución';
        if (estado.includes('abierto')) return 'Abierto';

        // Determinar por lógica de negocio
        const avance = record.avance_porcentaje || 0;
        const diasVencidos = this.calculateDaysOverdue(record.fecha_compromiso);

        if (avance >= 100) return 'Cerrado';
        if (diasVencidos > 0) return 'Vencido';
        if (avance > 0) return 'En ejecución';
        return 'Abierto';
    }

    /**
     * Calcular semáforo de gestión
     */
    calculateTrafficLight(record) {
        if (record.estado === 'Cerrado') return 'Cerrado';
        const diasVencidos = this.calculateDaysOverdue(record.fecha_compromiso);
        if (diasVencidos > 0) return 'Vencido';
        if (diasVencidos > -5) return 'Próximo a vencer';
        return 'En término';
    }

    /**
     * Calcular días vencidos
     */
    calculateDaysOverdue(dateString) {
        if (!dateString) return 0;
        const date = this.parseDate(dateString);
        if (!date) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = today - date;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Parsear fecha (acepta múltiples formatos)
     */
    parseDate(dateString) {
        if (!dateString) return null;

        // Si es número (formato Excel serial)
        if (typeof dateString === 'number') {
            const excelDate = new Date((dateString - 25569) * 86400 * 1000);
            return excelDate;
        }

        // Si es Date
        if (dateString instanceof Date) {
            return isNaN(dateString.getTime()) ? null : dateString;
        }

        // String
        dateString = String(dateString).trim();
        if (!dateString) return null;

        const formats = [
            /(\d{4})-(\d{2})-(\d{2})/,  // YYYY-MM-DD
            /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{2})-(\d{2})-(\d{4})/,   // DD-MM-YYYY
            /(\d{4})\/(\d{2})\/(\d{2})/  // YYYY/MM/DD
        ];

        for (let format of formats) {
            const match = dateString.match(format);
            if (match) {
                let year, month, day;
                if (match[1].length === 4) {
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                } else {
                    day = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    year = parseInt(match[3]);
                }
                return new Date(year, month, day);
            }
        }

        return null;
    }

    /**
     * Parsear porcentaje
     */
    parsePercentage(value) {
        if (value === undefined || value === null || value === '') return 0;
        const str = String(value).replace('%', '').trim();
        const num = parseFloat(str);
        return isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
    }

    /**
     * Calcular score de prioridad
     */
    calculatePriorityScore(record) {
        const criticidadMap = { 'Alto': 3, 'Medio': 2, 'Bajo': 1 };
        const criticidad = criticidadMap[record.criticidad] || 1;
        const diasVencidos = Math.max(0, record.dias_vencidos + 1);
        const avanceRestante = 100 - record.avance_porcentaje;
        return criticidad * diasVencidos * avanceRestante;
    }

    /**
     * Valor de proceso para filtros (solo columna Proceso, sin concatenar subproceso)
     */
    getProcesoFiltro(record) {
        return String(record.proceso || '').trim();
    }

    /**
     * Valor de subproceso para filtros (solo columna Subproceso)
     */
    getSubprocesoFiltro(record) {
        return String(record.subproceso || '').trim();
    }

    /**
     * Obtener procesos únicos (solo nombres de proceso, sin subproceso)
     */
    getUniqueProcesos() {
        const procesos = new Set();
        this.consolidatedData.forEach(record => {
            const proc = this.getProcesoFiltro(record);
            if (proc) procesos.add(proc);
        });
        return Array.from(procesos).sort((a, b) => a.localeCompare(b, 'es'));
    }

    getUniqueUnidades() {
        return Array.from(new Set(
            this.consolidatedData.map(record => String(record.unidad || '').trim()).filter(Boolean)
        )).sort((a, b) => a.localeCompare(b, 'es'));
    }

    getProcesosFiltrados(unidad = '') {
        return Array.from(new Set(
            this.consolidatedData
                .filter(record => !unidad || String(record.unidad || '').trim() === unidad)
                .map(record => this.getProcesoFiltro(record)).filter(Boolean)
        )).sort((a, b) => a.localeCompare(b, 'es'));
    }

    /**
     * Obtener subprocesos filtrados por proceso seleccionado
     */
    getSubprocesosFiltrados(proceso = '', unidad = '') {
        const subprocesos = new Set();
        this.consolidatedData.forEach(record => {
            if (unidad && String(record.unidad || '').trim() !== unidad) return;
            if (proceso && this.getProcesoFiltro(record) !== proceso) return;
            const sub = this.getSubprocesoFiltro(record);
            if (sub) subprocesos.add(sub);
        });
        return Array.from(subprocesos).sort((a, b) => a.localeCompare(b, 'es'));
    }

    /**
     * Obtener auditorías únicas
     */
    getAuditorias() {
        const auditorias = new Set();
        this.consolidatedData.forEach(record => {
            if (record.auditoria) auditorias.add(record.auditoria);
        });
        return Array.from(auditorias).sort();
    }

    getCategorias() {
        return Array.from(new Set(
            this.consolidatedData.map(record => String(record.categoria || '').trim()).filter(Boolean)
        )).sort((a, b) => a.localeCompare(b, 'es'));
    }

    /**
    * Filtrar datos según criterios ejecutivos
     */
    filterData(filters) {
        return this.consolidatedData.filter(record => {
            if (filters.proceso && this.getProcesoFiltro(record) !== filters.proceso) return false;
            if (filters.subproceso && this.getSubprocesoFiltro(record) !== filters.subproceso) return false;
            if (filters.unidad && String(record.unidad || '').trim() !== filters.unidad) return false;
            if (filters.auditoria && record.auditoria !== filters.auditoria) return false;
            if (filters.categoria && record.categoria !== filters.categoria) return false;
            return true;
        });
    }

    /**
     * Búsqueda global
     */
    globalSearch(keyword, data = this.consolidatedData) {
        const kw = keyword.toLowerCase();
        return data.filter(record => {
            return JSON.stringify(record).toLowerCase().includes(kw);
        });
    }

    /**
     * Obtener datos consolidados
     */
    getData() {
        return this.consolidatedData;
    }

    /**
     * Obtener estadísticas
     */
    getStatistics(data = null) {
        const allRecords = data || this.consolidatedData;
        const uniqueValues = (field) => new Set(
            allRecords.map(record => String(record[field] || '').trim()).filter(Boolean)
        ).size;
        const stats = {
            total: allRecords.length,
            criticos: allRecords.filter(r => r.criticidad === 'Alto').length,
            medios: allRecords.filter(r => r.criticidad === 'Medio').length,
            bajos: allRecords.filter(r => r.criticidad === 'Bajo').length,
            cerrados: allRecords.filter(r => r.estado === 'Cerrado').length,
            vencidos: allRecords.filter(r => r.estado === 'Vencido').length,
            sin_avance: allRecords.filter(r => r.avance_porcentaje === 0).length,
            reincidentes: allRecords.filter(r => r.es_reincidente).length,
            categorias: uniqueValues('categoria'),
            procesos: uniqueValues('proceso'),
            subprocesos: uniqueValues('subproceso'),
            unidades: uniqueValues('unidad'),
            recomendaciones: allRecords.filter(r => String(r.recomendaciones || '').trim()).length,
            criticidad_disponible: allRecords.filter(r => ['Alto', 'Medio', 'Bajo'].includes(r.criticidad)).length,
            fechas_disponibles: allRecords.filter(r => r.fecha_deteccion instanceof Date || String(r.fecha_deteccion || '').trim()).length
        };

        stats.pct_cumplimiento = stats.total > 0 ? Math.round((stats.cerrados / stats.total) * 100) : 0;
        stats.avance_promedio = stats.total > 0 ? Math.round(allRecords.reduce((sum, r) => sum + r.avance_porcentaje, 0) / stats.total) : 0;
        stats.pct_reincidencia = stats.total > 0 ? Math.round((stats.reincidentes / stats.total) * 100) : 0;

        return stats;
    }

    getCategorySummary(data = null) {
        const records = data || this.consolidatedData;
        const total = records.length;
        const groups = this.getByCluster('categoria', records);
        return Object.entries(groups)
            .map(([categoria, items]) => ({
                categoria,
                total: items.length,
                porcentaje: total ? Math.round((items.length / total) * 100) : 0
            }))
            .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, 'es'));
    }

    /**
     * Obtener resumen por auditoría
     */
    getSummaryByAuditoria(data = null) {
        const records = data || this.consolidatedData;
        const summary = {};

        records.forEach(record => {
            const aud = record.auditoria || 'Sin Auditoría';
            if (!summary[aud]) {
                summary[aud] = {
                    auditoria: aud,
                    total: 0,
                    altos: 0,
                    medios: 0,
                    bajos: 0,
                    avance_sum: 0
                };
            }

            summary[aud].total++;
            if (record.criticidad === 'Alto') summary[aud].altos++;
            if (record.criticidad === 'Medio') summary[aud].medios++;
            if (record.criticidad === 'Bajo') summary[aud].bajos++;
            summary[aud].avance_sum += record.avance_porcentaje;
        });

        Object.values(summary).forEach(item => {
            item.avance_promedio = item.total > 0 ? Math.round(item.avance_sum / item.total) : 0;
        });

        return Object.values(summary).sort((a, b) => b.total - a.total);
    }

    /**
     * Obtener top N hallazgos críticos
     * Prioridad: SIG primero, luego Aseguramiento, luego por score
     */
    getTopCritical(n = 10, data = null) {
        const records = data || this.consolidatedData;
        return records
            .sort((a, b) => {
                // SIG tiene prioridad sobre Aseguramiento
                if (a.origen === 'SIG' && b.origen !== 'SIG') return -1;
                if (a.origen !== 'SIG' && b.origen === 'SIG') return 1;
                // Luego por score de prioridad
                return b.score_prioridad - a.score_prioridad;
            })
            .slice(0, n);
    }

    /**
     * Calcular nivel de riesgo del proceso
     */
    calculateProcessRisk(data = null) {
        const records = data || this.consolidatedData;
        if (records.length === 0) return 'Bajo';

        const criticos = records.filter(r => r.criticidad === 'Alto').length;
        const vencidos = records.filter(r => r.estado === 'Vencido').length;
        const reincidentes = records.filter(r => r.es_reincidente).length;
        const promedio_avance = records.reduce((sum, r) => sum + r.avance_porcentaje, 0) / records.length;

        const score = (criticos * 3) + (vencidos * 2) + (reincidentes * 1.5) - (promedio_avance * 0.01);
        const normalized_score = (score / records.length) * 10;

        if (normalized_score > 6) return 'Alto';
        if (normalized_score > 3) return 'Medio';
        return 'Bajo';
    }

    /**
     * Obtener datos agrupados por campo
     */
    getByCluster(groupBy, data = null) {
        const records = data || this.consolidatedData;
        const clusters = {};

        records.forEach(record => {
            const key = record[groupBy] || 'Sin especificar';
            if (!clusters[key]) clusters[key] = [];
            clusters[key].push(record);
        });

        return clusters;
    }

    /**
     * Obtener datos del semáforo de gestión
     */
    getSemaforoData(data = null) {
        const records = data || this.consolidatedData;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const vencidos = records.filter(r => r.estado === 'Vencido').length;

        const proximos = records.filter(r => {
            if (!r.fecha_compromiso) return false;
            const fecha = this.parseDate(r.fecha_compromiso);
            if (!fecha) return false;
            const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
            return diff > 0 && diff <= 15 && r.estado !== 'Cerrado';
        }).length;

        const enTermino = records.filter(r => {
            if (r.estado === 'Cerrado' || r.estado === 'Vencido') return false;
            if (!r.fecha_compromiso) return r.avance_porcentaje < 100;
            const fecha = this.parseDate(r.fecha_compromiso);
            if (!fecha) return r.avance_porcentaje < 100;
            const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
            return diff > 15 && r.avance_porcentaje < 100;
        }).length;

        const cerrados = records.filter(r => r.estado === 'Cerrado').length;

        const sinResponsable = records.filter(r =>
            (!r.responsable_accion || String(r.responsable_accion).trim() === '') &&
            (!r.responsable_proceso || String(r.responsable_proceso).trim() === '')
        ).length;

        const sinValidacion = records.filter(r =>
            !r.tipo_validacion || String(r.tipo_validacion).trim() === ''
        ).length;

        return { vencidos, proximos, enTermino, cerrados, sinResponsable, sinValidacion };
    }

    /**
     * Obtener datos de riesgo por proceso
     */
    getProcessRiskData(data = null) {
        const records = data || this.consolidatedData;
        const clusters = this.getByCluster('proceso', records);

        return Object.entries(clusters).map(([proceso, procRecords]) => {
            const total = procRecords.length;
            const criticos = procRecords.filter(r => r.criticidad === 'Alto').length;
            const vencidos = procRecords.filter(r => r.estado === 'Vencido').length;
            const reincidentes = procRecords.filter(r => r.es_reincidente).length;
            const avgAvance = total > 0 ? Math.round(procRecords.reduce((s, r) => s + r.avance_porcentaje, 0) / total) : 0;

            const score = ((criticos * 3) + (vencidos * 2) + (reincidentes * 1.5) - (avgAvance * 0.01)) / total * 10;
            let nivel = 'Bajo';
            if (score > 6) nivel = 'Alto';
            else if (score > 3) nivel = 'Medio';

            return { proceso, nivel, total, criticos, vencidos, reincidentes, avgAvance };
        }).sort((a, b) => {
            const order = { 'Alto': 0, 'Medio': 1, 'Bajo': 2 };
            return order[a.nivel] - order[b.nivel] || b.total - a.total;
        });
    }

    /**
     * Obtener alertas automáticas
     */
    getAlertasAutomaticas(data = null) {
        const records = data || this.consolidatedData;
        const alertas = [];

        const sinResponsable = records.filter(r =>
            (!r.responsable_accion || String(r.responsable_accion).trim() === '') &&
            (!r.responsable_proceso || String(r.responsable_proceso).trim() === '')
        );
        if (sinResponsable.length > 0) {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-user-slash',
                texto: `<strong>${sinResponsable.length} hallazgo(s) sin responsable asignado.</strong>`,
                detalle: 'Asignar responsable en la próxima mesa de trabajo.'
            });
        }

        const sinValidacion = records.filter(r =>
            !r.tipo_validacion || String(r.tipo_validacion).trim() === ''
        );
        if (sinValidacion.length > 0) {
            alertas.push({
                tipo: 'alerta',
                icono: 'fas fa-clipboard-check',
                texto: `<strong>${sinValidacion.length} hallazgo(s) sin tipo de validación definido.</strong>`,
                detalle: 'Definir estrategia de validación para seguimiento.'
            });
        }

        const vencidos = records.filter(r => r.estado === 'Vencido');
        if (vencidos.length > 0) {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-exclamation-triangle',
                texto: `<strong>${vencidos.length} hallazgo(s) vencidos.</strong>`,
                detalle: 'Revisar causas de incumplimiento y escalar si es necesario.'
            });
        }

        const criticos = records.filter(r => r.criticidad === 'Alto' && r.avance_porcentaje === 0);
        if (criticos.length > 0) {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-fire',
                texto: `<strong>${criticos.length} hallazgo(s) críticos sin avance.</strong>`,
                detalle: 'Requieren atención inmediata.'
            });
        }

        if (alertas.length === 0) {
            alertas.push({
                tipo: 'ok',
                icono: 'fas fa-check-circle',
                texto: '<strong>Sin alertas activas.</strong>',
                detalle: 'Todos los hallazgos están dentro de los parámetros esperados.'
            });
        }

        return alertas;
    }

    /**
     * Obtener datos de reincidentes por proceso
     */
    getReincidentData(data = null) {
        const records = data || this.consolidatedData;
        const total = records.length;
        const reincidentes = records.filter(r => r.es_reincidente);
        const totalReincidentes = reincidentes.length;
        const pct = total > 0 ? Math.round((totalReincidentes / total) * 100) : 0;

        const porProceso = {};
        reincidentes.forEach(r => {
            const proc = r.proceso_display || r.proceso || 'Sin especificar';
            porProceso[proc] = (porProceso[proc] || 0) + 1;
        });

        const procesosLista = Object.entries(porProceso)
            .sort((a, b) => b[1] - a[1])
            .map(([proc, count]) => `${proc} (${count})`);

        return { total, totalReincidentes, pct, procesos: procesosLista };
    }
}

// Exportar instancia global
const dataManager = new DataManager();
