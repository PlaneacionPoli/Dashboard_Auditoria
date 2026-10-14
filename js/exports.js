/**
 * EXPORTS - Exportación de datos a Excel, PDF y CSV
 */

class ExportManager {
    constructor() {
        this.filename = `Dashboard_Auditoria_${new Date().toISOString().split('T')[0]}`;
    }

    /**
     * Inicializar botones de exportación
     */
    initExportButtons() {
        document.getElementById('btnExportExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('btnExportPdf').addEventListener('click', () => this.exportToPDF());
    }

    /**
     * Obtener dataset listo para exportar: recarga Supabase y fusiona sobre todos los registros.
     * Respeta filtros activos si los hay.
     */
    async getExportData() {
        await diligenciaService.loadAll();
        diligenciaService.mergeIntoRecords(dataManager.consolidatedData);
        dataManager.consolidatedData.forEach(r => dataManager.refreshRecordDerivedFields(r));

        return dataManager.filterData(filterManager.getCurrentFilters());
    }

    /**
     * Mapear un registro a fila Excel con campos base + diligenciamiento (Supabase)
     */
    buildExcelRow(record) {
        const diligencia = diligenciaService.get(record.codigo);
        const updatedAt = diligencia?.updated_at
            ? new Date(diligencia.updated_at).toLocaleString('es-ES')
            : '';

        const tipo = record.tipo_accion || '';
        return {
            'Código Hallazgo': record.codigo,
            'Auditoría': record.auditoria,
            'Proceso': record.proceso || '',
            'Subproceso': record.subproceso || '',
            'Criticidad': record.criticidad,
            'Estado': record.estado,
            'Descripción del Hallazgo': record.descripcion,
            'Responsable del Proceso': record.responsable_proceso || record.responsable_accion || '',
            'Tipo de Acción': tipo,
            'N° de OM / Descrip de Actividad': dataManager.getOmActividad(record, tipo),
            'Acción Correctiva (Excel)': record.accion_correctiva || '',
            'Descripción Corrección': record.correccion_descripcion || '',
            'Descripción Mejora': record.mejora_descripcion || '',
            '% Avance OM': dataManager.getOmAvance(record, tipo),
            '% Avance': record.avance_porcentaje ?? 0,
            'Tipo de Validación': record.tipo_validacion || '',
            'Resultado de Validación': record.resultado_validacion || '',
            'Fecha de Detección': this.formatDateForExport(record.fecha_deteccion),
            'Fecha Compromiso': this.formatDateForExport(record.fecha_compromiso),
            'Fecha Cierre': this.formatDateForExport(record.fecha_cierre),
            'Reincidencia': record.es_reincidente ? 'Sí' : 'No',
            'Días Vencidos': record.dias_vencidos ?? 0,
            'Origen': record.origen || '',
            'Última actualización diligenciamiento': updatedAt
        };
    }

    /**
     * Ajustar anchos de columnas en una hoja
     */
    applyColumnWidths(ws, widths) {
        ws['!cols'] = widths;
    }

    /**
     * Exportar a Excel con actualizaciones de diligenciamiento (Supabase).
     * Genera dos hojas: SIG y Aseguramiento, más una hoja consolidada.
     */
    async exportToExcel() {
        const btn = document.getElementById('btnExportExcel');
        const originalHtml = btn ? btn.innerHTML : '';

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
            }

            const data = await this.getExportData();
            if (data.length === 0) {
                alert('No hay datos para exportar');
                return;
            }

            const sigData = data.filter(r => r.origen === 'SIG').map(r => this.buildExcelRow(r));
            const asegData = data.filter(r => r.origen === 'Aseguramiento').map(r => this.buildExcelRow(r));
            const allData = data.map(r => this.buildExcelRow(r));

            const colWidths = [
                { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 12 },
                { wch: 14 }, { wch: 40 }, { wch: 22 }, { wch: 20 }, { wch: 35 },
                { wch: 35 }, { wch: 35 }, { wch: 10 }, { wch: 20 }, { wch: 22 },
                { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
                { wch: 16 }, { wch: 28 }
            ];

            const wb = XLSX.utils.book_new();

            const wsSig = XLSX.utils.json_to_sheet(sigData);
            this.applyColumnWidths(wsSig, colWidths);
            XLSX.utils.book_append_sheet(wb, wsSig, 'Base Hallazgos SIG');

            const wsAseg = XLSX.utils.json_to_sheet(asegData);
            this.applyColumnWidths(wsAseg, colWidths);
            XLSX.utils.book_append_sheet(wb, wsAseg, 'Base Hallazgos Aseguramiento');

            const wsAll = XLSX.utils.json_to_sheet(allData);
            this.applyColumnWidths(wsAll, colWidths);
            XLSX.utils.book_append_sheet(wb, wsAll, 'Consolidado');

            XLSX.writeFile(wb, `${this.filename}.xlsx`);

            const conDiligencia = data.filter(r => diligenciaService.get(r.codigo)).length;
            console.log(`✓ Excel exportado: ${data.length} registros (${conDiligencia} con diligenciamiento Supabase)`);
            this.showNotification(
                `Excel descargado: ${data.length} registros` +
                (conDiligencia ? ` (${conDiligencia} actualizados en línea)` : '')
            );

            // Refrescar vista del dashboard con los datos fusionados
            dashboard.updateDashboard(
                dataManager.filterData(filterManager.getCurrentFilters())
            );
        } catch (error) {
            console.error('✗ Error al exportar Excel:', error);
            alert('Error al exportar a Excel: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    }

    /**
     * Exportar a PDF
     */
    exportToPDF() {
        try {
            const data = dashboard.currentData;
            if (data.length === 0) {
                alert('No hay datos para exportar');
                return;
            }

            // Crear contenido HTML para PDF
            let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #0066cc; text-align: center; margin-bottom: 30px; }
                        .metadata { background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #0066cc; color: white; padding: 10px; text-align: left; font-weight: bold; }
                        td { padding: 8px; border-bottom: 1px solid #ddd; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .page-break { page-break-after: always; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; }
                    </style>
                </head>
                <body>
                    <h1>Auditoría Interna 2026 - Resultados ejecutivos</h1>
                    
                    <div class="metadata">
                        <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-ES')}</p>
                        <p><strong>Total de Registros:</strong> ${data.length}</p>
                        <p><strong>Filtros Aplicados:</strong> ${this.getAppliedFiltersText()}</p>
                    </div>

                    <h2>Resumen Ejecutivo</h2>
                    <table>
                        <tr>
                            <th>Métrica</th>
                            <th>Valor</th>
                        </tr>
            `;

            // Agregar KPIs
            const stats = dataManager.getStatistics(data);
            html += `
                        <tr><td>Total Hallazgos</td><td>${stats.total}</td></tr>
                        <tr><td>Hallazgos Críticos (Alto)</td><td>${stats.criticos}</td></tr>
                        <tr><td>Hallazgos Medios</td><td>${stats.medios}</td></tr>
                        <tr><td>Hallazgos Bajos</td><td>${stats.bajos}</td></tr>
                        <tr><td>Hallazgos Cerrados</td><td>${stats.cerrados}</td></tr>
                        <tr><td>Hallazgos Vencidos</td><td>${stats.vencidos}</td></tr>
                        <tr><td>% Cumplimiento Global</td><td>${stats.pct_cumplimiento}%</td></tr>
                        <tr><td>% Avance Promedio</td><td>${stats.avance_promedio}%</td></tr>
                    </table>

                    <div class="page-break"></div>

                    <h2>Detalle de Hallazgos</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Auditoría</th>
                                <th>Origen</th>
                                <th>Proceso</th>
                                <th>Criticidad</th>
                                <th>Estado</th>
                                <th>Avance %</th>
                                <th>Responsable</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            // Agregar registros
            data.slice(0, 100).forEach(record => {
                html += `
                            <tr>
                                <td>${this.escapeHtml(record.codigo)}</td>
                                <td>${this.escapeHtml(record.auditoria)}</td>
                                <td>${this.escapeHtml(record.origen)}</td>
                                <td>${this.escapeHtml(record.proceso_display || record.proceso).substring(0, 30)}</td>
                                <td>${this.escapeHtml(record.criticidad)}</td>
                                <td>${this.escapeHtml(record.estado)}</td>
                                <td>${record.avance_porcentaje}%</td>
                                <td>${this.escapeHtml(record.responsable_proceso)}</td>
                            </tr>
                `;
            });

            if (data.length > 100) {
                html += `<tr><td colspan="8" style="text-align: center; font-style: italic;">... y ${data.length - 100} registros más</td></tr>`;
            }

            html += `
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>Este documento fue generado automáticamente por el Dashboard de Auditoría</p>
                        <p>Politécnico Grancolombiano - ${new Date().getFullYear()}</p>
                    </div>
                </body>
                </html>
            `;

            // Usar html2pdf para generar PDF
            const element = document.createElement('div');
            element.innerHTML = html;

            const opt = {
                margin: 10,
                filename: `${this.filename}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
            };

            html2pdf().set(opt).from(element).save();
            console.log('✓ Datos exportados a PDF');
            this.showNotification('Archivo PDF descargado correctamente');
        } catch (error) {
            console.error('✗ Error al exportar PDF:', error);
            alert('Error al exportar a PDF: ' + error.message);
        }
    }

    /**
     * Exportar a CSV
     */
    exportToCSV() {
        try {
            const data = dashboard.currentData;
            if (data.length === 0) {
                alert('No hay datos para exportar');
                return;
            }

            // Preparar CSV
            const headers = [
                'Código',
                'Auditoría',
                'Origen',
                'Proceso',
                'Criticidad',
                'Estado',
                'Descripción',
                'Responsable',
                'Tipo Acción',
                'Avance %',
                'Fecha Detección',
                'Fecha Compromiso',
                'Validación',
                'Reincidente'
            ];

            let csv = headers.map(h => `"${h}"`).join(',') + '\n';

            data.forEach(record => {
                const row = [
                    this.escapeCSV(record.codigo),
                    this.escapeCSV(record.auditoria),
                    this.escapeCSV(record.origen),
                    this.escapeCSV(record.proceso_display || record.proceso),
                    this.escapeCSV(record.criticidad),
                    this.escapeCSV(record.estado),
                    this.escapeCSV(record.descripcion),
                    this.escapeCSV(record.responsable_proceso),
                    this.escapeCSV(record.tipo_accion),
                    record.avance_porcentaje,
                    this.formatDateForExport(record.fecha_deteccion),
                    this.formatDateForExport(record.fecha_compromiso),
                    this.escapeCSV(record.resultado_validacion),
                    record.es_reincidente ? 'Sí' : 'No'
                ];
                csv += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            // Descargar
            this.downloadFile(csv, `${this.filename}.csv`, 'text/csv');
            console.log('✓ Datos exportados a CSV');
            this.showNotification('Archivo CSV descargado correctamente');
        } catch (error) {
            console.error('✗ Error al exportar CSV:', error);
            alert('Error al exportar a CSV: ' + error.message);
        }
    }

    /**
     * Utilidades
     */
    formatDateForExport(dateInput) {
        if (!dateInput) return '';
        const date = dataManager.parseDate(dateInput);
        if (!date) return '';
        return date.toLocaleDateString('es-ES');
    }

    escapeCSV(str) {
        if (!str) return '';
        return String(str).replace(/"/g, '""');
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getAppliedFiltersText() {
        const filters = filterManager.getCurrentFilters();
        const parts = [];

        if (filters.unidad) parts.push(`Unidad: ${filters.unidad}`);
        if (filters.proceso) parts.push(`Proceso: ${filters.proceso}`);
        if (filters.subproceso) parts.push(`Subproceso: ${filters.subproceso}`);
        if (filters.categoria) parts.push(`Categoría: ${filters.categoria}`);
        if (filters.auditoria) parts.push(`Auditoría: ${filters.auditoria}`);

        return parts.length > 0 ? parts.join(' | ') : 'Ninguno';
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 m-3 alert alert-success alert-dismissible fade show';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Exportar instancia global
const exportManager = new ExportManager();
