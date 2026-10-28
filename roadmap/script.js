// ============ 1. DATOS (aquí editas tus etapas y tareas) ============
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_CORTOS = ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];

const ETAPAS = [
  { icono: "🧭", color: "berry", titulo: "Define my direction", fechas: "Oct–Nov 2026",
    objetivo: "Saber exactamente qué buscan las empresas antes de empezar a prepararme.",
    descripcion: "Reviso vacantes reales, comparo herramientas y busco los requisitos de ULACIT." },
  { icono: "📊", color: "dolphin", titulo: "Build my data skills", fechas: "Nov–Dic 2026",
    objetivo: "Tener una base sólida en análisis de datos.",
    descripcion: "Excel a nivel funcional y primeros pasos en R, con 2–3 horas por semana." },
  { icono: "🧬", color: "keen", titulo: "Biomedical foundations", fechas: "Dic 2026–Ene 2027",
    objetivo: "Conectar el análisis de datos con la ingeniería biomédica.",
    descripcion: "Curso de introducción a la ingeniería biomédica y práctica en R: importar, limpiar y graficar datos." },
  { icono: "🔬", color: "cherry", titulo: "Build my project", fechas: "Ene–Feb 2027", principal: true,
    objetivo: "Un proyecto que pueda enseñar en entrevistas.",
    descripcion: "Rehacer el análisis de lotes de catéteres en R, con informe de 1–2 páginas y código en GitHub." },
  { icono: "🫀", color: "blush", titulo: "Physiology + Technical English", fechas: "Feb–Mar 2027",
    objetivo: "Hablar el idioma de la industria.",
    descripcion: "Fisiología, signos vitales y lectura de ofertas y documentación de dispositivos en inglés." },
  { icono: "💼", color: "moss", titulo: "Build my professional profile", fechas: "Mar–Abr 2027",
    objetivo: "Verme lista para las empresas.",
    descripcion: "Actualizar CV y LinkedIn, armar mi lista de empresas y activar alertas de vacantes." },
  { icono: "🤝", color: "dolphin", titulo: "Networking + Interviews", fechas: "Abr–May 2027",
    objetivo: "Llegar a las entrevistas con contactos y práctica.",
    descripcion: "Conectar con alumni y profesionales, y preparar mi pitch de 2–3 minutos en inglés." },
  { icono: "🚀", color: "keen", titulo: "Application season", fechas: "Jun 2027",
    objetivo: "Postular a varias pasantías a la vez.",
    descripcion: "Personalizar el CV, registrar cada aplicación y dar seguimiento." }
];

// Tareas de cada etapa (mismo orden que ETAPAS)
const TAREAS = [
  ["Revisar 8–10 vacantes reales", "Comparar herramientas solicitadas", "Decidir entre R / Python", "Consultar requisitos de ULACIT", "Revisar fechas de práctica", "Evaluar vacante temporal de Medtronic"],
  ["Excel Skills for Business: Essentials", "Empezar R Programming", "Mantener 2–3 h/semana", "Llegar a nivel funcional de Excel"],
  ["Introduction to Biomedical Engineering", "Continuar R", "Importar datos", "Limpiar datos", "Crear gráficos", "Pruebas estadísticas básicas"],
  ["Rehacer análisis de lotes de catéteres en R", "Buscar datos propios/públicos", "Crear gráficos", "Sacar conclusiones", "Escribir informe de 1–2 páginas", "Subir código a GitHub"],
  ["Introductory Human Physiology", "Vital Signs", "Leer job descriptions en inglés", "Leer documentación de dispositivos", "Practicar vocabulario técnico"],
  ["Actualizar CV", "Añadir proyecto", "Añadir herramientas", "Actualizar LinkedIn", "Crear lista de 8–10 empresas", "Roche Talent Community", "Alertas de Medtronic", "Alertas de otras empresas"],
  ["Buscar alumni de ULACIT", "Conectar en LinkedIn", "Contactar profesionales", "Preparar pitch de 2–3 min", "Practicar entrevistas en inglés"],
  ["Aplicar a varias pasantías", "Personalizar CV cuando sea necesario", "Registrar cada aplicación", "Hacer seguimiento", "Preparar entrevistas"]
];

// Descripción y tiempo estimado de cada tarea (mismo orden que TAREAS)
const DETALLES = [
  [ ["Leo ofertas de Medtronic, Roche, Abbott y otras", "2 h"], ["Anoto cuántas piden Excel, R, Python o MATLAB", "1 h"], ["Elijo según lo que más aparece en las vacantes", "30 min"],
    ["Créditos mínimos y trámites de la práctica", "1 h"], ["Periodos en que se puede realizar", "30 min"], ["Horario, requisitos y si cuenta como práctica", "1 h"] ],
  [ ["Curso de Macquarie University en Coursera", "12 h"], ["Curso de Johns Hopkins en Coursera, modo auditoría", "20 h"], ["Hábito semanal de práctica", "continuo"], ["Fórmulas, tablas dinámicas y gráficos", "6 h"] ],
  [ ["Curso de UCL y San Petersburgo en Coursera", "15 h"], ["Profundizo en lo básico del lenguaje", "8 h"], ["Leer archivos CSV en R", "2 h"],
    ["Valores faltantes, tipos y formatos", "3 h"], ["Histogramas, cajas y dispersión", "3 h"], ["Comparar grupos y medias", "4 h"] ],
  [ ["Repito el caso de Estadística usando R", "6 h"], ["Un dataset adicional para ampliar el análisis", "3 h"], ["Visualizaciones claras con título y ejes", "3 h"],
    ["Qué dicen los datos y qué decisión sugieren", "2 h"], ["Resumen con formato profesional", "4 h"], ["Repositorio con README", "2 h"] ],
  [ ["Curso de Duke University en Coursera", "20 h"], ["Curso de University of Pennsylvania sobre signos vitales", "8 h"], ["Subrayo el vocabulario técnico", "2 h"],
    ["Fichas técnicas y manuales", "3 h"], ["Lista propia de términos", "2 h"] ],
  [ ["Una página, orientada a pasantías", "2 h"], ["Resultado y herramientas usadas", "1 h"], ["Excel, R y lo que haya aprendido", "30 min"], ["Foto, titular y resumen", "2 h"],
    ["Con enlace a su página de empleo", "2 h"], ["Registrarme para recibir vacantes", "30 min"], ["Activar notificaciones de pasantías", "30 min"], ["Abbott, Boston Scientific, Baxter", "30 min"] ],
  [ ["En LinkedIn, en empresas de mi lista", "2 h"], ["Con mensaje breve y personalizado", "2 h"], ["Pedir un consejo de 15 minutos", "3 h"],
    ["Quién soy y qué proyecto hice", "2 h"], ["Preguntas básicas en voz alta", "4 h"] ],
  [ ["Mínimo cinco en paralelo", "6 h"], ["Ajustar palabras clave por puesto", "3 h"], ["Anoto empresa, fecha y estado en el Tracker", "continuo"],
    ["A la semana o dos sin respuesta", "continuo"], ["Repasar proyecto y pitch", "3 h"] ]
];

// Rango de fechas de cada etapa (para pintar el calendario)
const RANGOS = [
  ["2026-10-01", "2026-11-30"], ["2026-11-01", "2026-12-31"], ["2026-12-01", "2027-01-31"], ["2027-01-01", "2027-02-28"],
  ["2027-02-01", "2027-03-31"], ["2027-03-01", "2027-04-30"], ["2027-04-01", "2027-05-31"], ["2027-06-01", "2027-06-30"]
];
const COLORES = ["berry", "keen", "cherry", "moss", "moss", "berry", "keen", "cherry"];  // color de cada tarjeta, por posición

// Estados posibles de cada empresa (punto de color + texto)
const ESTADOS = [
  { texto: "Investigando", color: "#E3B93B" },
  { texto: "Pendiente",    color: "#B5B5B5" },
  { texto: "Aplicado",     color: "#3E9B4F" },
  { texto: "Entrevista",   color: "#3D6FE0" },
  { texto: "Rechazado",    color: "#D9453C" }
];

// Tus empresas: "estado" es la posición en ESTADOS (0 = Investigando, 1 = Pendiente...)
const EMPRESAS = [
  { nombre: "Medtronic",         estado: 0 },
  { nombre: "Roche",             estado: 1 },
  { nombre: "Abbott",            estado: 1 },
  { nombre: "Boston Scientific", estado: 1 },
  { nombre: "Baxter",            estado: 1 }
];

// ============ 2. UTILIDADES Y ESTADO ============
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const hoyISO = () => { const h = new Date(); return iso(h.getFullYear(), h.getMonth(), h.getDate()); };
const fechaCorta = f => { const [, m, d] = f.split("-"); return `${Number(d)} ${MESES[Number(m) - 1]}`; };
const indiceMes = (y, m) => Math.min(8, Math.max(0, (y - 2026) * 12 + m - 9));   // 0 = oct 2026 ... 8 = jun 2027

let hechas = {};                                   // { "0-1": true, ... }
try { hechas = JSON.parse(localStorage.getItem("roadmap-hechas")) || {}; } catch (e) {}
let mesIdx = indiceMes(new Date().getFullYear(), new Date().getMonth());
                               

const hechasDe = i => TAREAS[i].filter((_, j) => hechas[`${i}-${j}`]).length;
const porcentajeDe = i => Math.round(100 * hechasDe(i) / TAREAS[i].length);
const etapaActual = () => ETAPAS.findIndex((_, i) => hechasDe(i) < TAREAS[i].length);

let fechas = {};                                   // { "0-1": "2026-10-17", ... }
try { fechas = JSON.parse(localStorage.getItem("roadmap-fechas")) || {}; } catch (e) {}
let recien = null;                                 // última tarea completada (para la animación)

function marcar(clave, valor) {
  hechas[clave] = valor;
  if (valor) fechas[clave] = hoyISO(); else delete fechas[clave];
  recien = valor ? clave : null;
  try {
    localStorage.setItem("roadmap-hechas", JSON.stringify(hechas));
    localStorage.setItem("roadmap-fechas", JSON.stringify(fechas));
  } catch (e) {}
  actualizarTodo();
}

// ============ 3. BARRA SUPERIOR ============
function dibujarFecha() {
  const h = new Date();
  $("fecha").textContent = `Hoy · ${h.getDate()} ${MESES[h.getMonth()]} ${h.getFullYear()}`;
}
function actualizarProgreso(listas = 0, total = 45) {
  const pct = Math.round(100 * listas / total);
  $("pct-general").textContent = pct;
  $("barra-general").style.width = pct + "%";
  $("anillo").textContent = `${listas}/${total}`;
}

// ============ 4. DASHBOARD ============
function dibujarEtapas() {
  const actual = etapaActual();
  $("stages").innerHTML = ETAPAS.map((e, i) => `
    <article class="stage c-${COLORES[i]} ${i === actual ? "actual" : ""}" data-i="${i}"><div class="stage-body">
      <div class="stage-top">
        <span>${pad(i + 1)}${i === actual ? " / IN PROGRESS" : ""}</span>
        <span class="stage-icon">${e.icono}</span>
      </div>
      <h3 class="l2">${e.titulo}</h3>
      <span class="stage-dates">${e.fechas}</span>
      ${e.principal ? '<span class="chip">⭐ PROYECTO PRINCIPAL</span>' : ""}
            <div class="stage-text">
        <p class="stage-objetivo">Objetivo: ${e.objetivo}</p>
        <p class="stage-desc">${e.descripcion}</p>
      </div>
      <div class="stage-foot">
        <div class="stage-meta"><span>${hechasDe(i)}/${TAREAS[i].length} tareas</span><span>${porcentajeDe(i)}%</span></div>
        <div class="stage-bar"><i style="width:${porcentajeDe(i)}%"></i></div>
      </div>
    </div></article>`).join("");
}

function dibujarCalendario() {
  const y = 2026 + Math.floor((9 + mesIdx) / 12), m = (9 + mesIdx) % 12;
  const nombre = new Date(y, m, 1).toLocaleDateString("es-CR", { month: "long" });
  const titulo = nombre.charAt(0).toUpperCase() + nombre.slice(1) + " " + y;
  const sel = etapaActual() === -1 ? ETAPAS.length - 1 : etapaActual();   // siempre la etapa actual
  const [desde, hasta] = RANGOS[sel];
  const vacios = (new Date(y, m, 1).getDay() + 6) % 7;                    // la semana empieza en lunes
  const diasMes = new Date(y, m + 1, 0).getDate();

  let celdas = "<span></span>".repeat(vacios);
  for (let d = 1; d <= diasMes; d++) {
    const f = iso(y, m, d), dentro = f >= desde && f <= hasta;
    celdas += `<span class="dia ${dentro ? "en-rango" : ""}">${f === hoyISO() ? `<em>${d}</em>` : d}</span>`;
  }

  $("calendario").className = `panel c-${COLORES[sel]}`;                  // el color de la etapa
  $("calendario").innerHTML = `
    <div class="cal-head">
      <h2>Calendar</h2>
      <div class="cal-nav">
        <button data-nav="-1" ${mesIdx === 0 ? "disabled" : ""} aria-label="Mes anterior">‹</button>
        <span>${titulo}</span>
        <button data-nav="1" ${mesIdx === 8 ? "disabled" : ""} aria-label="Mes siguiente">›</button>
      </div>
    </div>
    <span class="etapa-chip">ETAPA ${pad(sel + 1)} · ${ETAPAS[sel].fechas}</span>
    <div class="pills">${MESES_CORTOS.map((n, k) => `<button class="pill ${k === mesIdx ? "on" : ""}" data-mes="${k}">${n}</button>`).join("")}</div>
    <div class="dias">${["L", "M", "X", "J", "V", "S", "D"].map(l => `<b>${l}</b>`).join("")}${celdas}</div>`;
}

$("calendario").addEventListener("click", ev => {
  const nav = ev.target.closest("[data-nav]"), mes = ev.target.closest("[data-mes]");
  if (nav) mesIdx = Math.min(8, Math.max(0, mesIdx + Number(nav.dataset.nav)));
  else if (mes) mesIdx = Number(mes.dataset.mes);
  else return;
  dibujarCalendario();
});


function dibujarUpcoming() {
  const a = etapaActual();
  if (a === -1) {
    $("upcoming").innerHTML = `<div class="up-head"><h2>Upcoming</h2></div><p class="up-nota">¡Todo listo para aplicar! 🚀</p>`;
    return;
  }
  const j = TAREAS[a].findIndex((_, k) => !hechas[`${a}-${k}`]);
  const nota = hechasDe(a) === 0 ? "Empiezo con la primera tarea de esta etapa. ✨"
                                 : `Llevo ${hechasDe(a)} de ${TAREAS[a].length} tareas de esta etapa. ✨`;
  $("upcoming").innerHTML = `
    <div class="up-head"><h2>Upcoming</h2><span class="up-hasta">HASTA ${fechaCorta(RANGOS[a][1]).toUpperCase()} ↗</span></div>
    <p class="up-etapa">${pad(a + 1)} · ${ETAPAS[a].titulo} — ${porcentajeDe(a)}%</p>
    <label class="up-tarea"><input type="checkbox" data-clave="${a}-${j}"><span>${TAREAS[a][j]}</span></label>
    <p class="up-nota">${nota}</p>`;
}

// ============ 5. PESTAÑA ROADMAP ============
// ============ ROADMAP: LÍNEA DE TIEMPO ============
// La tarea actual es la primera sin completar, en orden
function tareaActual() {
  for (let i = 0; i < TAREAS.length; i++)
    for (let j = 0; j < TAREAS[i].length; j++)
      if (!hechas[`${i}-${j}`]) return [i, j];
  return null;
}
const estadoEtapa = (i, cur) => hechasDe(i) === TAREAS[i].length ? "completa" : (cur && cur[0] === i ? "actual" : "bloqueada");

function irASiguiente() {
  const cur = tareaActual();
  const el = cur && $(`tarea-${cur[0]}-${cur[1]}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function dibujarRoadmap() {
  const cur = tareaActual();

  $("tl-barra").innerHTML = `
    <span class="tl-sig">${cur ? `Mi siguiente tarea: <b>${TAREAS[cur[0]][cur[1]]}</b>` : "¡Todo listo para aplicar! 🚀"}</span>
    ${cur ? '<button class="tl-ir" data-ir>Ir</button>' : ""}
    <div class="tl-dots">${ETAPAS.map((_, i) => `<button class="tl-dot ${estadoEtapa(i, cur)}" data-etapa="${i}" aria-label="Etapa ${i + 1}">${pad(i + 1)}</button>`).join("")}</div>`;

  const etapas = ETAPAS.map((e, i) => {
    const est = estadoEtapa(i, cur), p = porcentajeDe(i);
    const tareas = TAREAS[i].map((t, j) => {
      const k = `${i}-${j}`, hecha = !!hechas[k], esActual = !!cur && cur[0] === i && cur[1] === j;
      const [desc, tiempo] = DETALLES[i][j];
      return `
        <li class="tarea ${hecha ? "hecha" : esActual ? "actual" : "bloqueada"} ${recien === k ? "recien" : ""}" id="tarea-${k}">
          <span class="nodo">${hecha ? "✓" : esActual ? "" : "🔒"}</span>
          <div class="tarea-cuerpo">
            <div class="tarea-fila">
              <span class="tarea-titulo">${t}</span>
              ${hecha && fechas[k] ? `<span class="tarea-fecha">${fechaCorta(fechas[k])}</span>` : ""}
            </div>
            ${esActual ? `<div class="tarea-panel">
              <p>${desc}</p>
              <p class="tiempo">⏱ Tiempo estimado: ${tiempo}</p>
              <button class="btn-completar" data-completar="${k}">Marcar como completada</button>
            </div>` : ""}
          </div>
          ${hecha ? `<button class="deshacer" data-deshacer="${k}" aria-label="Deshacer">↺</button>` : ""}
        </li>`;
    }).join("");

    return `
      <section class="tl-etapa c-${COLORES[i]} ${est}" id="etapa-${i}" style="--p:${est === "completa" ? 100 : p}%">
        <div class="tl-num">${pad(i + 1)}</div>
        <article class="tl-card">
          <header class="tl-cab">
            <div>
              <span class="tl-icono">${e.icono}</span><h3>${e.titulo}</h3>
              <span class="tl-fechas">${e.fechas}</span>
              ${e.principal ? '<span class="tl-chip">⭐ PROYECTO PRINCIPAL</span>' : ""}
            </div>
            <strong class="tl-pct">${p}%</strong>
          </header>
          <p class="tl-objetivo">Objetivo: ${e.objetivo}</p>
          <div class="tl-meta">${hechasDe(i)}/${TAREAS[i].length} tareas</div>
          <div class="stage-bar"><i style="width:${p}%"></i></div>
          <ol class="tl-tareas">${tareas}</ol>
          ${est === "completa" ? '<div class="tl-banner">Etapa completada 🎉</div>' : ""}
        </article>
      </section>`;
  }).join("");

  $("roadmap-lista").innerHTML = `
    <div class="tl-extremo"><span class="tl-punto"></span>Hoy · ${fechaCorta(hoyISO())}</div>
    ${etapas}
    <div class="tl-extremo"><span class="tl-punto fin">🚀</span>Lista para aplicar · Jun 2027</div>`;
  recien = null;
}

function actualizarTodo() {
  actualizarProgreso(ETAPAS.reduce((s, _, i) => s + hechasDe(i), 0), TAREAS.reduce((s, l) => s + l.length, 0));
  dibujarEtapas(); dibujarCalendario(); dibujarUpcoming(); dibujarRoadmap();
}

// ============ TRACKER (franja del dashboard) ============
function dibujarTracker() {
  $("tracker-mini").innerHTML = `
    <div class="tr-head">
      <h2>Internship Tracker</h2>
      <div class="tr-leyenda">${ESTADOS.map(e => `<span><i class="punto" style="--c:${e.color}"></i>${e.texto}</span>`).join("")}</div>
    </div>
    <div class="tr-lista">
      ${EMPRESAS.map((e, i) => `
        <button class="tr-empresa" data-empresa="${i}">
          <b>${e.nombre}</b>
          <span class="tr-estado"><i class="punto" style="--c:${ESTADOS[e.estado].color}"></i>${ESTADOS[e.estado].texto}</span>
        </button>`).join("")}
    </div>`;
}

function irAEmpresa(i) {
  const e = EMPRESAS[i];
  $("tracker-sel").textContent = `Empresa seleccionada: ${e.nombre} · ${ESTADOS[e.estado].texto}. Aquí irá su información (puesto, requisitos, contacto…).`;
  mostrarVista("tracker");
}

// ============ 6. PESTAÑAS Y EVENTOS ============
function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => { v.hidden = v.id !== `vista-${nombre}`; });
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.vista === nombre));
}
function irAEtapa(i) {
  mostrarVista("roadmap");
  const destino = $(`etapa-${i}`);
  destino.scrollIntoView({ behavior: "smooth", block: "start" });
  destino.classList.add("resaltada");
  setTimeout(() => destino.classList.remove("resaltada"), 1600);
}

document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", ev => {
  ev.preventDefault();
  mostrarVista(t.dataset.vista);
}));

$("stages").addEventListener("click", ev => {
  const tarjeta = ev.target.closest(".stage");
  if (tarjeta) irAEtapa(Number(tarjeta.dataset.i));
});

document.addEventListener("change", ev => {                  // checkbox de Upcoming
  const caja = ev.target.closest("input[data-clave]");
  if (caja) marcar(caja.dataset.clave, caja.checked);
});

$("tracker-mini").addEventListener("click", ev => {          // tocar una empresa del tracker
  const b = ev.target.closest("[data-empresa]");
  if (b) irAEmpresa(Number(b.dataset.empresa));
});

// Mensajito flotante: confirma que el toque se registró
function aviso(texto) {
  let el = $("aviso");
  if (!el) {
    el = document.createElement("div");
    el.id = "aviso";
    el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#2B640E;color:#fff;padding:10px 18px;border-radius:999px;font:700 14px 'DM Sans',sans-serif;z-index:50;pointer-events:none;transition:opacity .25s";
    document.body.appendChild(el);
  }
  el.textContent = texto;
  el.style.opacity = "1";
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => { el.style.opacity = "0"; }, 1600);
}

// Botones de la pestaña Roadmap (un solo escuchador para todos)
document.addEventListener("click", ev => {
  try {
    const t = ev.target.closest(".btn-completar, .deshacer, .tarea.hecha .nodo, .tl-ir, .tl-dot");
    if (!t) return;
    if (t.matches(".btn-completar")) { marcar(t.dataset.completar, true); aviso("¡Tarea completada! ✓"); setTimeout(irASiguiente, 250); }
    else if (t.matches(".deshacer")) { marcar(t.dataset.deshacer, false); aviso("Tarea deshecha ↺"); }
    else if (t.matches(".nodo")) { marcar(t.closest(".tarea").id.slice(6), false); aviso("Tarea deshecha ↺"); }   // id="tarea-0-1" → "0-1"
    else if (t.matches(".tl-ir")) irASiguiente();
    else if (t.matches(".tl-dot")) { const e = $(`etapa-${t.dataset.etapa}`); if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); }
  } catch (e) { alert("Error en el Roadmap: " + e.message); }
}, true);

// ============ 7. INICIO ============
dibujarFecha();
actualizarTodo();
dibujarTracker();
document.addEventListener("visibilitychange", () => { dibujarFecha(); dibujarCalendario(); });
setInterval(dibujarFecha, 60000);