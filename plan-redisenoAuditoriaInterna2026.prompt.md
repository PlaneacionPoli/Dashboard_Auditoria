## Plan: Rediseño Ejecutivo Auditoría 2026

TL;DR: usar el consolidado 2026 como fuente única, perfilarlo antes de calcular métricas y construir una portada ejecutiva separada del seguimiento operativo. No se inferirá criticidad SIG ni se calcularán vencimientos, riesgo o tendencias sin datos oficiales.

**Pasos**

1. **Perfilado del consolidado**
   - Verificar hojas, registros, columnas, tipos, campos obligatorios y llave única.
   - Generar matriz de completitud, valores únicos, duplicados, inconsistencias y filas excluidas.
   - Confirmar disponibilidad real de categorías, procesos, áreas, criticidad y periodo.
   - Documentar limitaciones del archivo.

2. **Modelo y reglas de conteo**
   - Definir qué representa cada fila.
   - Contar hallazgos mediante la llave validada, evitando doble conteo.
   - Centralizar la normalización de columnas en `DataManager`.
   - Marcar criticidad SIG como `No disponible`.
   - Excluir métricas temporales, riesgo y cumplimiento si no existe fecha o estado oficial.

3. **Análisis ejecutivo**
   - Calcular únicamente KPIs sustentados por el consolidado.
   - Elaborar rankings por categoría, proceso y área, según disponibilidad.
   - Calcular participación y Pareto.
   - Identificar entre 5 y 8 insights con evidencia, relevancia e implicación.
   - Construir matriz volumen × criticidad solo para registros con criticidad válida.

4. **Diseño de la portada**
   - Crear la página `Auditoría Interna 2026 - Resultados ejecutivos`.
   - Incluir encabezado, fuente, fecha de actualización y advertencias metodológicas.
   - Priorizar KPIs, ranking/Pareto, distribución y 3 a 5 focos de atención.
   - Mantener la portada sintética y trasladar detalle, edición y seguimiento a vistas secundarias.
   - Evitar gráficos circulares si existen muchas categorías.

5. **Filtros e interacción**
   - Mantener filtros ejecutivos solo si aportan valor: categoría, proceso, área u origen.
   - Garantizar que filtros, KPIs, gráficos y exportaciones usen el mismo conjunto de datos.
   - Añadir tooltips, selección cruzada y navegación hacia detalle cuando sean viables.
   - No presentar filtros que la aplicación no implemente realmente.

6. **Integración y documentación**
   - Reutilizar Vanilla JS, Chart.js, SheetJS y estilos existentes.
   - Mantener la vista operativa y el seguimiento detallado separados.
   - Actualizar README, checklist y mensajes de carga para reflejar el consolidado como fuente oficial.
   - Documentar fórmulas, denominadores, filas excluidas y limitaciones.

7. **Validación**
   - Probar cálculos con fixtures controlados.
   - Comparar conteos del perfilador con KPIs y gráficos.
   - Ejecutar el dashboard mediante servidor local.
   - Revisar consola, filtros, exportaciones y navegación.
   - Validar responsive en escritorio, tablet y móvil.
   - Realizar prueba ejecutiva de lectura en menos de 60 segundos.

**Archivos relevantes**

- [data/CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx](data/CONSOLIDADO%20HALLAZGOS%20AUDITOR%C3%8DA%202026.xlsx): fuente oficial de la portada.
- [js/dataManager.js](js/dataManager.js#L1-L240): carga, normalización, reglas de conteo y agregaciones.
- [js/app.js](js/app.js#L1-L180): flujo de inicialización y conexión entre módulos.
- [js/filters.js](js/filters.js#L1-L190): filtros actuales, que deberán alinearse con la nueva portada.
- [js/dashboard.js](js/dashboard.js#L1-L360): KPIs, gráficos y tablas reutilizables.
- [index.html](index.html#L1-L280): estructura de navegación y vistas.
- [css/styles.css](css/styles.css): sistema visual, estados y responsive.
- [js/exports.js](js/exports.js): exportaciones y metadatos.
- [README.md](README.md#L1-L220) y [CHECKLIST_VALIDACION.txt](CHECKLIST_VALIDACION.txt#L1-L220): documentación a reconciliar.

**Decisiones**

- Fuente única: consolidado de Auditoría Interna 2026.
- La matriz de seguimiento no alimentará los KPIs ejecutivos.
- Criticidad SIG: `No disponible`; no se inferirá desde avance.
- El usuario indicó que los hallazgos no contienen fechas; no se calcularán vencimiento, riesgo temporal, cumplimiento ni tendencias sin otra fuente oficial.
- La portada será exclusivamente de resultados; seguimiento y edición permanecerán en páginas secundarias.
- No se inventarán categorías, porcentajes, conclusiones ni datos históricos.

**Verificación**

1. Perfilado reproducible del archivo consolidado.
2. Validación de llave única y reglas de conteo.
3. Pruebas determinísticas de agregaciones y porcentajes.
4. Comparación entre datos perfilados, KPIs, gráficos y exportaciones.
5. Validación visual y funcional en servidor local.
6. Prueba de lectura ejecutiva con las seis preguntas definidas.

El plan quedó persistido en `/memories/session/plan.md` y está listo para aprobación antes de pasar a implementación.