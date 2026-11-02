// ============ 1. DATOS (aquí editas tu meta, tus fases y tus tareas) ============
const META = "Aplicar a finales de 2028";       // si cambia la meta, cámbiala aquí (y en la tarjeta de hub.js)
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Cada fase guarda sus propias tareas.
// "id" es el nombre fijo de la tarea: tu progreso se guarda con él, así puedes reordenarlas o cambiarles el texto sin perderlo.
// "desde" es cuándo se considera "en curso"; "fechas" es solo un rango aproximado (no hay fechas límite).
const FASES = [
  { icono: "🔬", color: "berry", titulo: "Construir experiencia", fechas: "Ahora → finales de 2027", desde: "2026-01-01",
    objetivo: "Tener experiencia real que mostrar cuando aplique.",
    tareas: [
      { id: "investigacion", titulo: "Buscar asistencia de investigación con profesores de ULACIT" },
      { id: "voluntariado", titulo: "Voluntariado en ingeniería clínica de un hospital" },
      { id: "medtronic-students", titulo: "Preguntar en ULACIT por el Medtronic Student Program" },
      { id: "forage", titulo: "Simulaciones virtuales gratuitas (Forage)" },
      { id: "capitulo", titulo: "Unirme a un capítulo estudiantil o competencia (IEEE EMBS, hackathons)" }
    ] },
  { icono: "🛠️", color: "moss", titulo: "Habilidades clave", fechas: "Ahora → finales de 2027 · en paralelo", desde: "2026-01-01",
    objetivo: "Tener las herramientas que piden las empresas.",
    tareas: [
      { id: "ingles-b2", titulo: "Inglés B2 certificado" },
      { id: "excel", titulo: "Excel avanzado" },
      { id: "minitab-r", titulo: "Minitab o R" },
      { id: "power-bi", titulo: "Power BI" },
      { id: "yellow-belt", titulo: "Lean Six Sigma Yellow Belt" },
      { id: "iso-gmp", titulo: "Nociones de ISO 13485 y GMP" }
    ] },
  { icono: "🚀", color: "cherry", titulo: "Preparar aplicación", fechas: "I cuatrimestre 2028 → finales de 2028", desde: "2028-01-01",
    objetivo: "Llegar lista a aplicar cuando cumpla el 50 %.",
    tareas: [
      { id: "cv-ingles", titulo: "CV en inglés de una página" },
      { id: "egresados", titulo: "Contactar egresados de ULACIT en empresas de Coyol por LinkedIn" },
      { id: "alertas", titulo: "Crear alertas en los portales de Medtronic, Abbott, Roche y Boston Scientific" },
      { id: "aplicar", titulo: "Aplicar al cumplir el 50% (finales de 2028)" }
    ] }
];

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

// El calendario va de octubre de 2026 (0) a diciembre de 2028 (26)
const ULTIMO_MES = 26;
const indiceMes = (y, m) => Math.min(ULTIMO_MES, Math.max(0, (y - 2026) * 12 + m - 9));
let mesIdx = indiceMes(new Date().getFullYear(), new Date().getMonth());

// Progreso: { "excel": true, ... }. Es una clave nueva: "roadmap-hechas" (el roadmap anterior) queda guardada sin tocarse.
let hechas = {};
try { hechas = JSON.parse(localStorage.getItem("roadmap-fases-hechas")) || {}; } catch (e) {}

const hechasDe = f => f.tareas.filter(t => hechas[t.id]).length;
const porcentajeDe = f => Math.round(100 * hechasDe(f) / f.tareas.length);
const completa = f => hechasDe(f) === f.tareas.length;
const enCurso = f => !completa(f) && hoyISO() >= f.desde;           // las fases 1 y 2 pueden estar en curso a la vez

function marcar(id, valor) {
  hechas[id] = valor;
  try { localStorage.setItem("roadmap-fases-hechas", JSON.stringify(hechas)); } catch (e) {}
  actualizarTodo();
}

// ============ 3. BARRA SUPERIOR ============
function dibujarFecha() {
  const h = new Date();
  $("fecha").textContent = `Hoy · ${h.getDate()} ${MESES[h.getMonth()]} ${h.getFullYear()}`;
}
// El progreso se calcula contando las tareas de todas las fases: si agregas una, el total cambia solo
function actualizarProgreso() {
  const listas = FASES.reduce((s, f) => s + hechasDe(f), 0), total = FASES.reduce((s, f) => s + f.tareas.length, 0);
  const pct = Math.round(100 * listas / total);
  $("pct-general").textContent = pct;
  $("barra-general").style.width = pct + "%";
  $("anillo").textContent = `${listas}/${total}`;
}

// ============ 4. DASHBOARD ============
const etiquetaFase = f => completa(f) ? "✓ LISTA" : enCurso(f) ? "EN CURSO" : "MÁS ADELANTE";

function dibujarEtapas() {
  $("stages").innerHTML = FASES.map((f, i) => `
    <article class="stage c-${f.color} ${enCurso(f) ? "actual" : ""}" data-i="${i}"><div class="stage-body">
      <div class="stage-top">
        <span>${pad(i + 1)} / ${etiquetaFase(f)}</span>
        <span class="stage-icon">${f.icono}</span>
      </div>
      <h3 class="l2">${f.titulo}</h3>
      <span class="stage-dates">${f.fechas}</span>
      <div class="stage-text"><p class="stage-objetivo">${f.objetivo}</p></div>
      <div class="stage-foot">
        <div class="stage-meta"><span>${hechasDe(f)}/${f.tareas.length} tareas</span><span>${porcentajeDe(f)}%</span></div>
        <div class="stage-bar"><i style="width:${porcentajeDe(f)}%"></i></div>
      </div>
    </div></article>`).join("");
}

function dibujarCalendario() {
  const y = 2026 + Math.floor((9 + mesIdx) / 12), m = (9 + mesIdx) % 12;
  const nombre = new Date(y, m, 1).toLocaleDateString("es-CR", { month: "long" });
  const titulo = nombre.charAt(0).toUpperCase() + nombre.slice(1) + " " + y;
  const color = (FASES.find(enCurso) || FASES[FASES.length - 1]).color;   // el color de la primera fase en curso
  const vacios = (new Date(y, m, 1).getDay() + 6) % 7;                    // la semana empieza en lunes
  const diasMes = new Date(y, m + 1, 0).getDate();

  let celdas = "<span></span>".repeat(vacios);
  for (let d = 1; d <= diasMes; d++) {
    celdas += `<span class="dia">${iso(y, m, d) === hoyISO() ? `<em>${d}</em>` : d}</span>`;
  }

  $("calendario").className = `panel c-${color}`;
  $("calendario").innerHTML = `
    <div class="cal-head">
      <h2>Calendar</h2>
      <div class="cal-nav">
        <button data-nav="-1" ${mesIdx === 0 ? "disabled" : ""} aria-label="Mes anterior">‹</button>
        <span>${titulo}</span>
        <button data-nav="1" ${mesIdx === ULTIMO_MES ? "disabled" : ""} aria-label="Mes siguiente">›</button>
      </div>
    </div>
    <span class="etapa-chip">🎯 ${META}</span>
    <div class="dias">${["L", "M", "X", "J", "V", "S", "D"].map(l => `<b>${l}</b>`).join("")}${celdas}</div>`;
}

$("calendario").addEventListener("click", ev => {
  const nav = ev.target.closest("[data-nav]");
  if (!nav) return;
  mesIdx = Math.min(ULTIMO_MES, Math.max(0, mesIdx + Number(nav.dataset.nav)));
  dibujarCalendario();
});

// Upcoming: la primera tarea pendiente, empezando por las fases que están en curso
function dibujarUpcoming() {
  const f = FASES.find(x => enCurso(x)) || FASES.find(x => !completa(x));
  if (!f) {
    $("upcoming").innerHTML = `<div class="up-head"><h2>Upcoming</h2></div><p class="up-nota">¡Todo listo para aplicar! 🚀</p>`;
    return;
  }
  const t = f.tareas.find(x => !hechas[x.id]);
  $("upcoming").innerHTML = `
    <div class="up-head"><h2>Upcoming</h2></div>
    <p class="up-etapa">${pad(FASES.indexOf(f) + 1)} · ${f.titulo} — ${porcentajeDe(f)}%</p>
    <label class="up-tarea"><input type="checkbox" data-clave="${t.id}"><span>${t.titulo}</span></label>
    <p class="up-nota">Llevo ${hechasDe(f)} de ${f.tareas.length} tareas de esta fase. ✨</p>`;
}

// ============ 5. PESTAÑA ROADMAP: 3 COLUMNAS ============
function dibujarRoadmap() {
  $("tl-barra").innerHTML = `<span class="tl-sig">🎯 Mi meta: <b>${META}</b></span>
    <span class="tl-nota">Toco una tarea para marcarla como hecha o no. Sin fechas límite.</span>`;

  $("roadmap-lista").innerHTML = FASES.map((f, i) => `
    <section class="fase c-${f.color}" id="etapa-${i}">
      <header class="fase-cab">
        <div><span class="fase-num">FASE ${i + 1}</span><h3>${f.icono} ${f.titulo}</h3><span class="fase-fechas">${f.fechas}</span></div>
        <strong class="fase-pct">${porcentajeDe(f)}%</strong>
      </header>
      <div class="stage-bar"><i style="width:${porcentajeDe(f)}%"></i></div>
      <ul class="tareas">${f.tareas.map(t => `
        <li><button class="tarea ${hechas[t.id] ? "hecha" : ""}" data-tarea="${t.id}" aria-pressed="${!!hechas[t.id]}">
          <span class="nodo">${hechas[t.id] ? "✓" : ""}</span><span class="tarea-titulo">${t.titulo}</span>
        </button></li>`).join("")}</ul>
    </section>`).join("");
}

function actualizarTodo() {
  actualizarProgreso();
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
function irAEtapa(i) {            // abre la pestaña Roadmap y resalta esa fase un momento
  mostrarVista("roadmap");
  const destino = $(`etapa-${i}`);
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

$("roadmap-lista").addEventListener("click", ev => {         // tocar una tarea la marca o la desmarca
  const b = ev.target.closest("[data-tarea]");
  if (b) marcar(b.dataset.tarea, !hechas[b.dataset.tarea]);
});

// ============ 7. INICIO ============
dibujarFecha();
actualizarTodo();
dibujarTracker();
document.addEventListener("visibilitychange", () => { dibujarFecha(); actualizarTodo(); });
setInterval(dibujarFecha, 60000);
