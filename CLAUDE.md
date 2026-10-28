# Uni-Hub de Daniela

Sitio estático (HTML + CSS + JavaScript puro, sin frameworks ni build) para organizar la vida universitaria de Daniela (Ingeniería Biomédica, ULACIT, Costa Rica). Se publica en GitHub Pages (repositorio público). Lo usa sobre todo en un **iPad (Safari)** y también en laptop.

## Cómo trabajar con ella
- Responde siempre en español.
- Está aprendiendo programación: explica en simple, paso a paso, con comentarios claros en el código.
- Antes de cambiar mucho, dile qué archivos vas a tocar. Prefiere cambios pequeños y que funcionen.
- No agregues librerías ni dependencias: todo debe abrirse con Live Server y funcionar en GitHub Pages.

## Estructura
- `index.html`, `hub.css`, `hub.js` → Uni-Hub (página de inicio con tarjetas de módulos; lista `MODULOS` en hub.js)
- `roadmap/` → roadmap de pasantía: `index.html`, `styles.css`, `script.js` (datos y lógica: ETAPAS, TAREAS, DETALLES, RANGOS, COLORES), `tracker.js` (pestaña Tracker), `courses.js` (pestaña Courses)
- `carrera/` → "Mi carrera": `index.html`, `carrera.css`, `carrera.js` (malla de 66 materias con laboratorios separados, gráfico circular, modo reordenar)
- Íconos en la raíz: `favicon.png`, `icon.png` (ícono de iPad / apple-touch-icon). Desde las subcarpetas se enlazan con `../`.

## Diseño (mantenerlo igual en todo módulo)
- Paleta: Keen Green #2B640E, Swamp Moss #6B843A, Amazon River Dolphin #E9B0BB (rosa claro), Shimmering Blush #D98695, Ripe Cherry #C25474, Berry Rossi #941B43. Fondo #F8F1F2. Rojo solo para alertas (#D9453C).
- Fuente DM Sans. Bordes muy redondeados (22–32 px), botones tipo píldora.
- Tarjetas de color con TODO el texto en blanco (por eso no se usan Dolphin ni Blush como fondo de tarjeta).
- Cabecera verde con enlace "← Uni-Hub" arriba a la izquierda (clase `.volver`).
- Zonas táctiles de al menos 40–44 px (iPad).
- Fechas y horas: no usar `<input type="date|time">` dentro de cuadrículas (en iPad se desbordan). Usar texto + selector invisible encima, o `<select>` de hora y minuto.

## Datos (localStorage)
El navegador guarda por sitio web, no por carpeta, y cada módulo usa su propio prefijo. **No renombrar claves existentes** (se perderían los datos de Daniela):
- `roadmap-hechas`, `roadmap-fechas`, `roadmap-apps` (tracker), `roadmap-cursos-extra`
- `carrera-aprobadas`, `carrera-plan`, `carrera-resumen` (el hub lee este último)
- El hub también lee `roadmap-hechas` y `roadmap-apps` para mostrar su avance.

## Lecciones aprendidas (errores que ya pasaron)
- Los JS cargados después de `script.js` (tracker.js, courses.js) comparten el ámbito global: no se puede redeclarar `const`/`let`, pero sí reemplazar funciones (tracker.js reemplaza `dibujarTracker` e `irAEmpresa`). Cada archivo debe definir sus propios ayudantes; `script.js` NO tiene `poner`/`escuchar`.
- Safari/iPad guarda en caché CSS y JS: al cambiar un archivo, subir el número `?v=N` en los `<script>` y `<link>`.
- Antes de decir "ya funciona", probar. Una prueba rápida con jsdom (simular el DOM y los clics) sirve para comprobar la lógica.
- El repositorio es público: no escribir datos personales (teléfonos, correos de contactos) dentro de los archivos. Los datos que ella escribe en la app se quedan en su navegador.

## Pendientes
1. Agregar el enlace "← Uni-Hub" en `roadmap/index.html`: cambiar el `<span class="app-title">` por `<span class="app-title"><a class="volver" href="../">← Uni-Hub</a> · MY INTERNSHIP ROADMAP — 2026/2027</span>` y añadir en `roadmap/styles.css` la regla `.volver { color:#fff; text-decoration:none; border-bottom:1px solid rgba(255,255,255,.55); padding:6px 2px; }`.
2. **Módulo `horarios/`** (index.html, horarios.css, horarios.js) para armar horarios por cuatrimestre:
   - Selector de los 16 cuatrimestres de su malla (II 2025 … II 2030); por defecto, el siguiente cuatrimestre a empezar (I = ene–abr, II = may–ago, III = sep–dic).
   - Varias **opciones** por cuatrimestre (Opción A, B, C…), con pestañas, renombrar, duplicar, eliminar y ★ "elegir como mi horario" (solo una elegida por cuatrimestre).
   - Cada **clase**: materia (con autocompletado), profesor, presencial con aula o virtual, días (Lun–Sáb), hora de inicio y fin, estado de disponibilidad (por confirmar / disponible / sin cupo) y notas.
   - Cuadrícula semanal con los bloques posicionados por hora; clases solapadas se reparten en carriles; **detección de choques** (se marcan en rojo; las "sin cupo" no cuentan). Resumen por opción: nº de clases, horas por semana, choques, sin cupo.
   - Datos en `horarios-db`; resumen en `horarios-resumen` ({periodo, opciones, elegida}) para el hub.
   - Agregar su tarjeta en `MODULOS` de `hub.js`.
3. Preguntarle si faltan en su malla estas materias del PDF: Elementos de biomecánica (+ laboratorio), Trabajo comunal universitario, Seminario de graduación, Inglés I e Inglés II (quizá convalidadas).
4. Idea: botones de exportar/importar respaldo de los datos (útil al cambiar de dispositivo o de dirección web).