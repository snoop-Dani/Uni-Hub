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
- `notas/` → "Mis notas": `index.html`, `notas.css`, `notas.js`. Por cuatrimestre (por defecto el que está en curso): materias con evaluaciones (nombre, %, nota; nota vacía = pendiente), promedio actual y cuánto necesita en lo que falta para su meta (70 por defecto, nota mínima de ULACIT). Sugiere materias de su horario ★ (`horarios-db`) y de su malla (`carrera-plan`). También carga `../carrera/malla.js`.
- `entregas/` → "Entregas y exámenes": `index.html`, `entregas.css`, `entregas.js`. Lista agrupada (Atrasadas en rojo, Hoy, Mañana, Esta semana hasta el domingo, Más adelante, Hechas plegable), ✓ para marcar hecha, filtro por materia. Fecha con texto + `<input type="date">` invisible encima; hora con `<select>` ("Sin hora" o hora/minuto, incluye :59). Fechas guardadas como "AAAA-MM-DD" (sin zona horaria).
- `estudio/` → "Sesiones de estudio": `index.html`, `estudio.css`, `estudio.js`. Pomodoro (enfoque 25/45/50, descanso 5/10/15) que guarda la HORA DE FIN, no cuenta segundos: así funciona aunque el iPad se bloquee o se cierre la página (`revisar()` avanza enfoque → descanso → listo y anota lo completado). Pausar/seguir/terminar antes (anota si ≥ 1 min). "Anotar sesión" a mano. Resumen: hoy, semana (lunes–domingo) vs meta semanal, racha, horas por materia, historial de 7 días. **Mi plan de estudio**: ella agrega temas a mano (materia, tema, tiempo que quiere dedicarle, día opcional); vista "Por día" (Atrasados en rojo, Hoy, próximos 6 días, Más adelante, Sin día) o "Por materia"; ▶ Estudiar arranca el pomodoro con ese tema; las sesiones (del reloj o a mano) guardan `temaId` y suman a la barra del tema; ✓ lo pasa a Terminados. Sonido con WebAudio (el iPad lo permite solo después de tocar un botón).
- `pagos/` → "Matrícula y pagos": `index.html`, `pagos.css`, `pagos.js`. Por cuatrimestre (por defecto el que está en curso): costos (cargos y becas/descuentos en monto o %; botón para agregar las materias del horario ★), plan de pagos (cuotas con fecha límite y ✓ pagado, vencidas en rojo, "Dividir en cuotas" mensual con la última cuota ajustada para que la suma sea exacta, aviso si el plan no coincide con el total), fechas importantes con cuenta regresiva. Moneda ₡ o $. `leerMonto()` entiende "150.000", "150 000" y "25,50".
- Íconos en la raíz: `favicon.png`, `icon.png` (ícono de iPad / apple-touch-icon). Desde las subcarpetas se enlazan con `../`.

## Diseño (mantenerlo igual en todo módulo)
- Paleta: Keen Green #2B640E, Swamp Moss #6B843A, Amazon River Dolphin #E9B0BB (rosa claro), Shimmering Blush #D98695, Ripe Cherry #C25474, Berry Rossi #941B43. Fondo #F8F1F2. Rojo solo para alertas (#D9453C).
- Fuente DM Sans. Bordes muy redondeados (22–32 px), botones tipo píldora.
- Tarjetas de color con TODO el texto en blanco (por eso no se usan Dolphin ni Blush como fondo de tarjeta).
- Cabecera (`.banner`) SIEMPRE en Swamp Moss #6B843A en todos los módulos, y `<meta name="theme-color" content="#6B843A">` en cada página. Enlace "← Uni-Hub" arriba a la izquierda (clase `.volver`). Ojo: en `roadmap/styles.css` la variable `--keen-green` vale #839958 (no es la de la paleta), así que ahí usar `var(--moss)`.
- Zonas táctiles de al menos 40–44 px (iPad).
- Textos en pantalla en **primera persona**, como si ella hablara: "Mis módulos", "Mi avance", "Me faltan 12 materias", "Toco una materia para…", errores tipo "Me falta el nombre de la materia." Los títulos en inglés usan "my". Excepción: el saludo "Hola Daniela". Los comentarios del código sí le hablan a ella (segunda persona).
- Fechas y horas: no usar `<input type="date|time">` dentro de cuadrículas (en iPad se desbordan). Usar texto + selector invisible encima, o `<select>` de hora y minuto.

## Datos (localStorage)
El navegador guarda por sitio web, no por carpeta, y cada módulo usa su propio prefijo. **No renombrar claves existentes** (se perderían los datos de Daniela):
- `roadmap-hechas`, `roadmap-fechas`, `roadmap-apps` (tracker), `roadmap-cursos-extra`
- `carrera-aprobadas`, `carrera-plan`, `carrera-resumen` (el hub lee este último)
- `horarios-db` ({periodos: {"I-2027": {opciones, elegida, activa}}}), `horarios-resumen` ({periodo, opciones, elegida} del próximo cuatrimestre; lo lee el hub). Horarios también lee `carrera-plan` para sugerir primero las materias de ese cuatrimestre.
- `notas-db` ({periodos: {"III-2026": {materias: [{id, nombre, meta, evals: [{id, nombre, peso, nota}]}]}}}), `notas-resumen` ({periodo, materias, promedio, riesgo} del cuatrimestre en curso; lo lee el hub).
- `entregas-db` ({items: [{id, titulo, materia, tipo, fecha, hora, notas, hecha, hechaEn}]}). Sin archivo de resumen: el hub calcula directo de `entregas-db` (atrasadas, esta semana, próxima) para que no quede desactualizado al cambiar el día.
- `estudio-db` ({sesiones: [{id, materia, temaId, fecha, hora, minutos}], temas: [{id, materia, nombre, minutos, fecha, hecho}], ajustes: {enfoque, descanso, meta, materia, tema, vistaPlan}}; `temas` y `temaId` se agregaron después: el código los crea si faltan), `estudio-activa` (temporizador en marcha: {modo, materia, temaId, duracion, fin, restante}; se borra al terminar; se ignora si tiene más de 12 h). El hub calcula su tarjeta directo de estas dos claves.
- `pagos-db` ({moneda, periodos: {"III-2026": {conceptos: [{id, nombre, tipo: "cargo"|"descuento", monto, porcentaje}], cuotas: [{id, nombre, fecha, monto, pagada, pagadaEn}], fechas: [{id, nombre, fecha}]}}}). El hub calcula su tarjeta directo de aquí (pagos vencidos, próximo pago y fechas importantes de los próximos 14 días, de todos los cuatrimestres).
- El hub también lee `roadmap-hechas` y `roadmap-apps` para mostrar su avance.
- **Respaldo** (sección "Mis datos" en el hub, `hub.js`): descarga/restaura todas las claves cuyo prefijo está en `PREFIJOS` (`roadmap-`, `carrera-`, `horarios-`, `notas-`, `entregas-`, `estudio-`, `pagos-`). **Al crear un módulo nuevo, agregar su prefijo a `PREFIJOS`** o sus datos no entrarán en el respaldo. Claves propias del respaldo (no se respaldan): `unihub-ultimo-respaldo` (fecha, recordatorio a los 14 días) y `unihub-antes-de-restaurar` (copia para "Deshacer la restauración").
- En localStorage, borrar los datos de Safari borra todo: recordarle descargar respaldo.

## Lecciones aprendidas (errores que ya pasaron)
- Los JS cargados después de `script.js` (tracker.js, courses.js) comparten el ámbito global: no se puede redeclarar `const`/`let`, pero sí reemplazar funciones (tracker.js reemplaza `dibujarTracker` e `irAEmpresa`). Cada archivo debe definir sus propios ayudantes; `script.js` NO tiene `poner`/`escuchar`.
- Safari/iPad guarda en caché CSS y JS: al cambiar un archivo, subir el número `?v=N` en los `<script>` y `<link>`.
- Antes de decir "ya funciona", probar. En esta computadora no hay Node.js (ni jsdom), pero sí Edge: `msedge --headless=new --allow-file-access-from-files --dump-dom file:///…` carga la página real con un script de prueba que simula clics, y `--screenshot` (lanzado con `Start-Process … -Wait`) sirve para ver cómo se ve en tamaño iPad (`--window-size=820,1180`).
- `git` no está en el PATH; GitHub Desktop trae el suyo en `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe`. El push lo hace ella desde GitHub Desktop.
- El repositorio es público: no escribir datos personales (teléfonos, correos de contactos) dentro de los archivos. Los datos que ella escribe en la app se quedan en su navegador.

## Pendientes
(Hechos el 28 oct 2026: enlace "← Uni-Hub" en el roadmap, módulo `horarios/`, y se agregaron a la malla Elementos de biomecánica + lab (II 2028), TCU (III 2029) y Seminario de graduación (II 2030). Inglés I y II no: convalidados o no aplican.)
(También hechos: módulos `notas/`, `entregas/`, `estudio/` (con plan de estudio) y `pagos/`, y respaldo exportar/importar en el hub.)
1. Cuando ella los tenga, poner los códigos reales de esas 4 materias como nota (no cambiar sus ids).
2. Ideas de módulos que le propuse: Requisitos de graduación (checklist + horas de TCU), Portafolio de proyectos. La lectura automática de las guías de horario de ULACIT se descartó (la página tiene protección de Cloudflare).