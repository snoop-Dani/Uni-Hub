# Uni-Hub de Daniela

Sitio estático (HTML + CSS + JavaScript puro, sin frameworks ni build) para organizar la vida universitaria de Daniela (Ingeniería Biomédica, ULACIT, Costa Rica). Se publica en GitHub Pages (repositorio público). Lo usa sobre todo en un **iPad (Safari)** y también en laptop.

**Carpeta correcta:** `C:\Users\dsa16\Documentos\GitHub\Uni-Hub` (fuera de OneDrive, porque OneDrive puede dañar la carpeta `.git`). La copia en `OneDrive\Documentos\GitHub\Uni-Hub` es vieja: no trabajar ni hacer commits ahí.

## Cómo trabajar con ella
- Responde siempre en español.
- Está aprendiendo programación: explica en simple, paso a paso, con comentarios claros en el código.
- Antes de cambiar mucho, dile qué archivos vas a tocar. Prefiere cambios pequeños y que funcionen.
- No agregues librerías ni dependencias: todo debe abrirse con Live Server y funcionar en GitHub Pages.

## Estructura
- `index.html`, `hub.css`, `hub.js` → Uni-Hub (página de inicio con tarjetas de módulos; lista `MODULOS` en hub.js)
- `roadmap/` → roadmap de pasantía: `index.html`, `styles.css`, `script.js` (datos y lógica: ETAPAS, TAREAS, DETALLES, RANGOS, COLORES), `tracker.js` (pestaña Tracker), `courses.js` (pestaña Courses)
- `carrera/` → "Mi carrera": `index.html`, `carrera.css`, `malla.js` (lista `PLAN_BASE`: 16 cuatrimestres, 70 materias con laboratorios separados), `carrera.js` (gráfico circular, modo reordenar). Para agregar materias se cambia solo `malla.js`: `completarPlan()` en carrera.js las añade al orden guardado sin perderlo. Nunca cambiar ids existentes (son las claves de `carrera-aprobadas`). Materias sin código conocido usan ids en palabras (`biomecanica`, `lab-biomecanica`, `tcu`, `seminario-graduacion`).
- `horarios/` → "Horarios": `index.html`, `horarios.css`, `horarios.js` (opciones por cuatrimestre, cuadrícula semanal, choques). Carga `../carrera/malla.js` para los cuatrimestres y el autocompletado.
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
- `horarios-db` ({periodos: {"I-2027": {opciones, elegida, activa}}}), `horarios-resumen` ({periodo, opciones, elegida} del próximo cuatrimestre; lo lee el hub). Horarios también lee `carrera-plan` para sugerir primero las materias de ese cuatrimestre.
- El hub también lee `roadmap-hechas` y `roadmap-apps` para mostrar su avance.

## Lecciones aprendidas (errores que ya pasaron)
- Los JS cargados después de `script.js` (tracker.js, courses.js) comparten el ámbito global: no se puede redeclarar `const`/`let`, pero sí reemplazar funciones (tracker.js reemplaza `dibujarTracker` e `irAEmpresa`). Cada archivo debe definir sus propios ayudantes; `script.js` NO tiene `poner`/`escuchar`.
- Safari/iPad guarda en caché CSS y JS: al cambiar un archivo, subir el número `?v=N` en los `<script>` y `<link>`.
- Antes de decir "ya funciona", probar. En esta computadora no hay Node.js (ni jsdom), pero sí Edge: `msedge --headless=new --allow-file-access-from-files --dump-dom file:///…` carga la página real con un script de prueba que simula clics, y `--screenshot` (lanzado con `Start-Process … -Wait`) sirve para ver cómo se ve en tamaño iPad (`--window-size=820,1180`).
- `git` no está en el PATH; GitHub Desktop trae el suyo en `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe`. El push lo hace ella desde GitHub Desktop.
- El repositorio es público: no escribir datos personales (teléfonos, correos de contactos) dentro de los archivos. Los datos que ella escribe en la app se quedan en su navegador.

## Pendientes
(Hechos el 28 oct 2026: enlace "← Uni-Hub" en el roadmap, módulo `horarios/`, y se agregaron a la malla Elementos de biomecánica + lab (II 2028), TCU (III 2029) y Seminario de graduación (II 2030). Inglés I y II no: convalidados o no aplican.)
1. Cuando ella los tenga, poner los códigos reales de esas 4 materias como nota (no cambiar sus ids).
2. Idea: botones de exportar/importar respaldo de los datos (útil al cambiar de dispositivo o de dirección web).