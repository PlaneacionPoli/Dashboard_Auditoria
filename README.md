# Auditoría Interna 2026 - Resultados ejecutivos

**Versión 1.1** | Politécnico Grancolombiano | 2026

## 📋 Descripción

Dashboard web interactivo para el resumen ejecutivo de resultados de Auditoría Interna 2026 y el seguimiento posterior de sus registros.

### Características Principales

✅ **Lectura automática de Excel** - Sin servidor ni instalaciones  
✅ **Consolidación de datos** - Integra 2 hojas (SIG + Aseguramiento) en una única vista  
✅ **Filtros globales** - 6 filtros dinámicos e interdependientes  
✅ **Visualizaciones** - Gráficos interactivos (Donut, Bar, Stacked)  
✅ **KPIs ejecutivos** - 8 métricas clave en tiempo real  
✅ **Análisis avanzado** - Priorización, riesgo, reincidencia  
✅ **Exportaciones** - Excel, PDF, CSV respetando filtros  
✅ **Responsive** - Desktop, tablet y mobile  
✅ **LocalStorage** - Persistencia de filtros entre sesiones  

---

## 🚀 Inicio Rápido

### 1. **Requisitos**
- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Archivo Excel: `CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx` en carpeta `/data`

### 2. **Instalación**
```bash
# No se requiere instalación. Solo abre el archivo:
index.html
```

### 3. **Uso**
1. Abre `index.html` en tu navegador
2. El dashboard cargará automáticamente los datos del Excel
3. Usa los filtros para analizar hallazgos
4. Exporta los resultados en Excel, PDF o CSV

---

## 📁 Estructura de Carpetas

```plaintext
Dashboard_Auditoria/
│
├── index.html              # Página principal (único HTML)
│
├── css/
│   └── styles.css          # Estilos corporativos
│
├── js/
│   ├── app.js              # Inicializador principal
│   ├── dataManager.js      # Gestión de datos Excel
│   ├── dashboard.js        # Renderización (gráficos, KPIs, tablas)
│   ├── filters.js          # Lógica de filtros globales
│   └── exports.js          # Exportación (Excel, PDF, CSV)
│
├── assets/
│   ├── icons/              # Iconografía (futura expansión)
│   └── images/             # Imágenes (futura expansión)
│
├── data/
│   ├── CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx  # Fuente oficial
│   └── README.txt          # (Este archivo)
│
└── README.md               # Documentación
```

---

## 📊 Vistas y Funcionalidades

### **Vista 1: Resumen Ejecutivo**

#### KPIs Principales
- **Total Hallazgos** - Registros de la Hoja1 del consolidado 2026
- **Hallazgos Críticos** - Clasificación "Alto"
- **Hallazgos Medios** - Clasificación "Medio"
- **Hallazgos Bajos** - Clasificación "Bajo"
- **Hallazgos Cerrados** - Estado completado
- **Hallazgos Vencidos** - Pasada fecha compromiso
- **% Cumplimiento Global** - (Cerrados / Total) × 100
- **% Avance Promedio** - Promedio de % Avance

#### Gráficos
1. **Criticidad (Donut)** - Distribución por Alto/Medio/Bajo
2. **Procesos (Bar Horizontal)** - Hallazgos por proceso
3. **Estados (Stacked Bar)** - Abierto/Ejecución/Cerrado/Vencido

#### Tabla Sumaria
- Resumen por auditoría
- Total y por criticidad
- Avance promedio por auditoría

### **Vista 2: Seguimiento Detallado**

DataTable interactivo con:
- 11 columnas de información completa
- Búsqueda y filtrado en tiempo real
- Ordenamiento multicampo
- Paginación configurable
- Panel de detalle (Offcanvas) al seleccionar

### **Vista 3: Alertas y Priorización**

- **Panel de Riesgo** - Nivel de riesgo global del proceso
- **Hallazgos Reincidentes** - Cantidad y porcentaje
- **Sin Avance** - Hallazgos con 0% progreso
- **Vencidos** - Alertas críticas
- **Top 10 Críticos** - Ranking de atención inmediata

---

## 🎯 Filtros Globales

| Filtro | Tipo | Comportamiento |
|--------|------|---|
| **Proceso** | Dropdown | Dinámico, basado en datos |
| **Subproceso** | Dropdown | Dependiente de Proceso |
| **Auditoría** | Dropdown | Dinámico, múltiple selección |
| **Criticidad** | Dropdown | Alto / Medio / Bajo |
| **Estado** | Dropdown | Abierto / Ejecución / Cerrado / Vencido |
| **Origen** | Dropdown | SIG / Aseguramiento |
| **Búsqueda** | Text input | Búsqueda global en todos los campos |

**Persistencia:** Los filtros se guardan en localStorage

---

## 💾 Exportaciones

### **Excel**
- Formato xlsx
- Todas las columnas relevantes
- Ancho de columnas ajustado
- Encabezados formateados
- Respeta filtros aplicados

### **PDF**
- Resumen ejecutivo
- Tabla completa de hallazgos
- Metadatos (fecha, filtros)
- Orientación landscape
- Formato A4

### **CSV**
- Compatible con Excel/Google Sheets
- Separador: coma
- Encoding: UTF-8
- Respeta filtros

---

## ⚙️ Estructura del Archivo Excel Esperado

### **Hoja 1: Base Hallazgos SIG**
32 columnas:
- Código Hallazgo
- Fecha de Detección
- Auditoría
- Proceso / Subproceso Auditado
- Criticidad (Alto/Medio/Bajo)
- Estado (Abierto/Ejecución/Cerrado/Vencido)
- Descripción del Hallazgo
- Responsable del Proceso
- Tipo de Acción
- % Avance
- [+27 columnas más]

### **Hoja 2: Base Hallazgos Aseguramiento**
30 columnas (similar a SIG)
- Misma estructura de datos
- Compatible en consolidación

**Nota:** Ambas hojas se fusionan en una única vista con columna "Origen" agregada automáticamente.

---

## 🔧 Características Técnicas

### **Tecnologías**
- **HTML5** - Estructura semántica
- **CSS3** - Diseño responsivo y animaciones
- **JavaScript Vanilla** - Sin frameworks, máxima compatibilidad
- **Bootstrap 5** - Framework CSS
- **Chart.js** - Visualizaciones
- **DataTables** - Tablas interactivas
- **SheetJS** - Lectura de Excel (.xlsx)
- **jsPDF** - Generación de PDF
- **html2canvas** - Conversión HTML a imagen

### **Performance**
- Optimizado para 500+ registros
- Carga diferida de gráficos
- Caché de datos en memoria
- Sin conexión a servidor

### **Compatibilidad**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

---

## 🎨 Diseño y UX

### **Paleta de Colores Corporativa**
- 🔵 Azul Primario: `#0066CC`
- ⚫ Gris Oscuro: `#2c3e50`
- ⚪ Blanco: `#FFFFFF`
- 🟢 Verde: `#28a745`
- 🟡 Amarillo: `#ffc107`
- 🔴 Rojo: `#dc3545`

### **Componentes Visuales**
- Tarjetas KPI con gradientes
- Paneles oscuros para métricas
- Sombras suaves
- Bordes redondeados
- Iconografía Font Awesome
- Diseño tipo Power BI Premium

---

## 📈 Cálculos Especiales

### **Semáforo de Gestión**
- 🔴 **Vencido** - Pasada fecha compromiso
- 🟡 **Próximo a vencer** - Menos de 5 días
- 🟢 **En término** - Dentro de plazo

### **Nivel de Riesgo del Proceso**
```
Score = (Críticos × 3) + (Vencidos × 2) + (Reincidentes × 1.5) - (Avance × 0.01)

Alto:   > 6
Medio:  3-6
Bajo:   < 3
```

### **Score de Prioridad**
```
Score = Criticidad × Días_Vencidos × (100 - % Avance)

Criticidad: Alto=3, Medio=2, Bajo=1
```

---

## 🐛 Debugging y Consola

El dashboard incluye herramientas de debugging en la consola del navegador:

```javascript
// Acceso desde consola (F12)
window.DEBUG.showStats()              // Mostrar estadísticas
window.DEBUG.showData(5)              // Mostrar primeros 5 registros
window.DEBUG.exportCurrentView()      // Exportar vista actual
window.DEBUG.getFilteredCount()       // Contar registros filtrados
window.DEBUG.clearFiltersDebug()      // Limpiar filtros
```

---

## ⚠️ Solución de Problemas

### **"Error al cargar el archivo Excel"**
✅ Verifica que el archivo esté en `/data/CONSOLIDADO HALLAZGOS AUDITORÍA 2026.xlsx`
✅ El archivo no debe estar abierto en Excel  
✅ Verifica los nombres exactos de las hojas: "Base Hallazgos SIG" y "Base Hallazgos Aseguramiento"  

### **"No aparecen datos en las tablas"**
✅ Abre la consola (F12) para ver errores  
✅ Verifica que el Excel tenga datos en las celdas  
✅ Comprueba la codificación del archivo (UTF-8 recomendado)  

### **"Los gráficos no se muestran"**
✅ Actualiza la página  
✅ Limpia localStorage: `localStorage.clear()`  
✅ Verifica que haya datos que mostrar (no todos los filtros unidos)  

### **"Los filtros no funcionan"**
✅ Abre consola y ejecuta: `window.DEBUG.clearFiltersDebug()`  
✅ Verifica nombres exactos de campos en Excel  

---

## 📝 Notas de Uso

1. **Primera carga**: El dashboard tardará 2-3 segundos en cargar y procesar datos
2. **LocalStorage**: Los filtros se guardan automáticamente
3. **Exportaciones**: Respetan el estado actual de filtros
4. **Mobile**: El dashboard es responsive, pero recomendamos desktop para análisis profundo
5. **Privacidad**: Todos los datos se procesan localmente, sin envío a servidores

---

## 🔐 Seguridad

- ✅ Sin conexión a internet requerida
- ✅ Datos procesados localmente en el navegador
- ✅ No se envía información a servidores externos
- ✅ Validación de entrada en todos los filtros

---

## 📞 Soporte

Para reportar problemas o sugerencias:
- Abre la consola (F12) y copia los errores
- Verifica la estructura del Excel
- Prueba en otro navegador

---

## 📜 Licencia

Desarrollado para Politécnico Grancolombiano
Año 2026

---

## ✨ Versiones Futuras

- 📱 App móvil nativa
- 🔔 Notificaciones en tiempo real
- 📧 Envío de reportes por email
- 🔐 Autenticación de usuarios
- ☁️ Sincronización en la nube
- 📊 Más tipos de visualizaciones

---

**Última actualización:** 4 de junio de 2026  
**Desarrollado por:** Politécnico Grancolombiano
