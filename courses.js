// ============ courses.js — pestaña Courses (se carga DESPUÉS de script.js y tracker.js) ============
// Datos tomados de la página de cada curso en Coursera (verifícalos al inscribirte: horas, precio y modo oyente pueden cambiar)
const CURSOS = [
  { titulo: "Excel Skills for Business: Essentials", inst: "Macquarie University", plataforma: "Coursera",
    url: "https://www.coursera.org/learn/excel-essentials",
    etapa: 1, tarea: [1, 0], tipo: "Herramienta",
    desc: "El primer curso de la especialización de Excel de Macquarie. Parte desde cero y te lleva a usar Excel con soltura para resolver problemas reales de negocio.",
    aprenderas: ["Interfaz, fórmulas y funciones", "Dar formato profesional a una hoja", "Crear y personalizar gráficos"],
    horas: "~26 h", ritmo: "3 semanas · 10 h por semana", nivel: "Principiante", idioma: "Inglés",
    costo: "Gratis en modo oyente (si aparece al inscribirte) · certificado de pago",
    valoracion: "98% lo recomienda · más de 1.1 M de inscritos",
    util: "Base para registros, control de calidad y seguimiento de datos en cualquier área." },
  { titulo: "R Programming", inst: "Johns Hopkins University", plataforma: "Coursera",
    url: "https://www.coursera.org/learn/r-programming",
    etapa: 1, tarea: [1, 1], tipo: "Herramienta",
    desc: "Parte de la especialización de Ciencia de Datos de Johns Hopkins. Enseña el lenguaje R desde sus conceptos de programación hasta herramientas para depurar y medir el rendimiento del código.",
    aprenderas: ["Conceptos del lenguaje R", "Instalar y configurar R", "Funciones de ciclo y depuración"],
    horas: "~57 h", ritmo: "6 semanas · 10 h por semana", nivel: "Intermedio", idioma: "Inglés",
    costo: "Gratis en modo oyente (si aparece al inscribirte) · certificado de pago",
    valoracion: "94% lo recomienda · unos 750 mil inscritos",
    util: "El más pesado de la lista: empieza temprano. Es la base de tu proyecto con datos." },
  { titulo: "Introduction to Biomedical Engineering", inst: "Peter the Great St. Petersburg Polytechnic University (con apoyo de UCL)", plataforma: "Coursera",
    url: "https://www.coursera.org/learn/bioengineering",
    etapa: 2, tarea: [2, 0], tipo: "Fundamentos biomédicos",
    desc: "Curso práctico de ingeniería biomédica: cómo se capturan y procesan señales del cuerpo y cómo se diseñan sistemas como las prótesis biónicas. Pide solo matemáticas y física de nivel universitario.",
    aprenderas: ["Electrónica: amplificadores y filtros", "Teoría de control", "Arduino y MATLAB"],
    horas: "~18–40 h", ritmo: "4 semanas · 5 a 10 h por semana", nivel: "Principiante", idioma: "Inglés (con subtítulos en español)",
    costo: "Gratis en modo oyente (si aparece al inscribirte) · certificado de pago",
    valoracion: "Impartido por Dr. Kirill Aristovich",
    util: "Incluye prácticas con MATLAB: al inscribirte, revisa qué necesitas para hacerlas." },
  { titulo: "Introductory Human Physiology", inst: "Duke University", plataforma: "Coursera",
    url: "https://www.coursera.org/learn/physiology",
    etapa: 4, tarea: [4, 0], tipo: "Fundamentos biomédicos",
    desc: "Recorre cómo funcionan los principales sistemas del cuerpo humano y cómo se integran para mantener la vida. No requiere experiencia previa.",
    aprenderas: ["Homeostasis y sistema endocrino", "Sistema nervioso y muscular", "Cardiovascular, respiratorio y digestivo"],
    horas: "~34 h", ritmo: "3 semanas · 10 h por semana · 10 módulos", nivel: "Principiante", idioma: "Inglés",
    costo: "Gratis en modo oyente (si aparece al inscribirte) · certificado de pago",
    valoracion: "97% lo recomienda · unos 600 mil inscritos",
    util: "Te da el lenguaje del cuerpo para entender lo que mide cualquier dispositivo médico." },
  { titulo: "Vital Signs: Understanding What the Body Is Telling Us", inst: "University of Pennsylvania", plataforma: "Coursera",
    url: "https://www.coursera.org/learn/vital-signs",
    etapa: 4, tarea: [4, 1], tipo: "Fundamentos biomédicos",
    desc: "Explica la anatomía y la fisiología detrás de los signos vitales, qué es normal y cómo se miden correctamente.",
    aprenderas: ["Pulso y presión arterial", "Temperatura y respiración", "Rangos normales y técnica de medición"],
    horas: "~13 h", ritmo: "1 semana · 10 h por semana · 6 módulos", nivel: "Introductorio", idioma: "Inglés",
    costo: "Gratis en modo oyente (si aparece al inscribirte) · certificado de pago",
    valoracion: "97% lo recomienda · unos 440 mil inscritos",
    util: "Muy aplicado a equipos de monitoreo clínico." }
];

// Mantiene el Roadmap coherente: el "tiempo estimado" de cada tarea sale de aquí
CURSOS.forEach(c => { if (typeof DETALLES !== "undefined" && DETALLES[c.tarea[0]] && DETALLES[c.tarea[0]][c.tarea[1]]) DETALLES[c.tarea[0]][c.tarea[1]][1] = c.horas; });
if (typeof dibujarRoadmap === "function") dibujarRoadmap();

const crEsc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const crPoner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const crNum = t => { const m = String(t).match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(",", ".")) : 0; };   // primer número de "~18–40 h"
const crId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const CR_COLORES = ["berry", "keen", "cherry", "moss"];

// ---------- Cursos que tú añades (se guardan en este dispositivo) ----------
let extras = [];
try { extras = JSON.parse(localStorage.getItem("roadmap-cursos-extra")) || []; } catch (e) {}
if (!Array.isArray(extras)) extras = [];
const crGuardar = () => { try { localStorage.setItem("roadmap-cursos-extra", JSON.stringify(extras)); } catch (e) {} };
let editando = null;                         // id del curso que se está editando (null = curso nuevo)

// ---------- Estado de los cursos del Roadmap (sale de sus tareas) ----------
function crEstado(c) {
  if (hechas[`${c.tarea[0]}-${c.tarea[1]}`]) return ["hecho", "✓ Completado"];
  const cur = typeof tareaActual === "function" ? tareaActual() : null;
  if (cur && cur[0] === c.tarea[0] && cur[1] === c.tarea[1]) return ["actual", "● En curso"];
  return ["pendiente", "Por hacer"];
}

// ---------- Tarjetas ----------
function crTarjeta(c) {
  const [est, txt] = crEstado(c), col = (typeof COLORES !== "undefined" && COLORES[c.etapa]) || "keen";
  return `
  <article class="cr-card cr-${col} ${est}">
    <div class="cr-top"><span class="cr-etapa">ETAPA ${String(c.etapa + 1).padStart(2, "0")} · ${crEsc(ETAPAS[c.etapa].titulo)}</span><span class="cr-badge">${txt}</span></div>
    <h3>${crEsc(c.titulo)}</h3>
    <p class="cr-inst">🎓 ${crEsc(c.inst)} · <b>${crEsc(c.plataforma)}</b></p>
    <p class="cr-desc">${crEsc(c.desc)}</p>
    <ul class="cr-lista">${c.aprenderas.map(a => `<li>${crEsc(a)}</li>`).join("")}</ul>
    <dl class="cr-datos">
      <div><dt>Duración</dt><dd>${crEsc(c.horas)}</dd><small>${crEsc(c.ritmo)}</small></div>
      <div><dt>Nivel</dt><dd>${crEsc(c.nivel)}</dd><small>${crEsc(c.tipo)}</small></div>
      <div><dt>Idioma</dt><dd>${crEsc(c.idioma)}</dd></div>
      <div><dt>Costo</dt><dd>${crEsc(c.costo)}</dd></div>
    </dl>
    <p class="cr-val">${crEsc(c.valoracion)}</p>
    <p class="cr-util">💡 ${crEsc(c.util)}</p>
    <div class="cr-acc">
      <a class="cr-btn" href="${crEsc(c.url)}" target="_blank" rel="noopener">Ir al curso ↗</a>
      <button class="cr-btn suave" data-etapa-ir="${c.etapa}">Ver en Roadmap</button>
    </div>
  </article>`;
}

function crTarjetaExtra(c, i) {
  const col = c.etapa >= 0 && typeof COLORES !== "undefined" ? COLORES[c.etapa] : CR_COLORES[i % 4];
  const est = ["pendiente", "actual", "hecho"][c.estado] || "pendiente", txt = ["Por hacer", "● En curso", "✓ Completado"][c.estado] || "Por hacer";
  return `
  <article class="cr-card cr-${col} ${est}">
    <div class="cr-top"><span class="cr-etapa">${c.etapa >= 0 ? `ETAPA ${String(c.etapa + 1).padStart(2, "0")} · ${crEsc(ETAPAS[c.etapa].titulo)}` : "CURSO EXTRA"}</span>
      <button class="cr-badge" data-estado-curso="${c.id}" title="Toca para cambiar el estado">${txt}</button></div>
    <h3>${crEsc(c.titulo)}</h3>
    <p class="cr-inst">🎓 ${crEsc(c.inst || "—")} · <b>${crEsc(c.plataforma)}</b></p>
    ${c.desc ? `<p class="cr-desc">${crEsc(c.desc)}</p>` : ""}
    <dl class="cr-datos">
      <div><dt>Duración</dt><dd>${crEsc(c.horas)}</dd></div>
      <div><dt>Nivel</dt><dd>${crEsc(c.nivel)}</dd></div>
      <div><dt>Idioma</dt><dd>${crEsc(c.idioma)}</dd></div>
      <div><dt>Costo</dt><dd>${crEsc(c.costo)}</dd></div>
    </dl>
    ${c.notas ? `<p class="cr-util">💡 ${crEsc(c.notas)}</p>` : ""}
    <div class="cr-acc">
      ${c.url ? `<a class="cr-btn" href="${crEsc(c.url)}" target="_blank" rel="noopener">Ir al curso ↗</a>` : ""}
      <button class="cr-btn suave" data-editar-curso="${c.id}">Editar</button>
      <button class="cr-btn suave" data-borrar-curso="${c.id}">Quitar</button>
    </div>
  </article>`;
}

function dibujarCursos() {
  const hechos = CURSOS.filter(c => crEstado(c)[0] === "hecho").length + extras.filter(c => c.estado === 2).length;
  const horas = Math.round(CURSOS.reduce((s, c) => s + crNum(c.horas), 0) + extras.reduce((s, c) => s + crNum(c.horas), 0));
  crPoner("cr-stats", [["Cursos", CURSOS.length + extras.length], ["Completados", hechos], ["Horas aprox.", "~" + horas]]
    .map(([l, v]) => `<div class="cr-stat"><b>${v}</b><span>${l}</span></div>`).join(""));
  crPoner("cr-grid", CURSOS.map(crTarjeta).join("") + extras.map(crTarjetaExtra).join("") +
    '<button class="cr-nueva" data-agregar-curso>＋ Añadir otro curso</button>');
}

// ---------- Formulario para añadir / editar ----------
function crForm(c) {
  const v = k => crEsc(c[k] ?? ""), sel = (a, b) => a === b ? "selected" : "";
  return `
  <div class="cr-form">
    <h3>${c.id ? "Editar curso" : "Añadir un curso"}</h3>
    <div class="cr-campos">
      <label class="ancho">Nombre del curso *<input data-f="titulo" value="${v("titulo")}" placeholder="Ej.: Python for Everybody"></label>
      <label>Institución<input data-f="inst" value="${v("inst")}" placeholder="Ej.: University of Michigan"></label>
      <label>Plataforma<input data-f="plataforma" list="cr-plataformas" value="${c.plataforma && c.plataforma !== "—" ? v("plataforma") : ""}" placeholder="Coursera, edX, Udemy…"></label>
      <label class="ancho">Enlace<input data-f="url" type="url" value="${v("url")}" placeholder="https://…"></label>
      <label class="ancho">Descripción<textarea data-f="desc" rows="2" placeholder="De qué trata el curso">${v("desc")}</textarea></label>
      <label>Duración<input data-f="horas" value="${c.horas && c.horas !== "—" ? v("horas") : ""}" placeholder="Ej.: 20 h"></label>
      <label>Nivel<select data-f="nivel">${["Principiante", "Intermedio", "Avanzado"].map(n => `<option ${sel(c.nivel, n)}>${n}</option>`).join("")}</select></label>
      <label>Idioma<input data-f="idioma" value="${c.idioma && c.idioma !== "—" ? v("idioma") : ""}" placeholder="Ej.: Inglés"></label>
      <label>Costo<input data-f="costo" value="${c.costo && c.costo !== "—" ? v("costo") : ""}" placeholder="Ej.: Gratis en modo oyente"></label>
      <label>Etapa del Roadmap<select data-f="etapa"><option value="-1">Sin etapa (extra)</option>${ETAPAS.map((e, i) => `<option value="${i}" ${sel(c.etapa, i)}>${String(i + 1).padStart(2, "0")} · ${crEsc(e.titulo)}</option>`).join("")}</select></label>
      <label>Estado<select data-f="estado">${["Por hacer", "En curso", "Completado"].map((n, i) => `<option value="${i}" ${sel(c.estado ?? 0, i)}>${n}</option>`).join("")}</select></label>
      <label class="ancho">Notas (por qué lo quieres, qué esperas)<textarea data-f="notas" rows="2">${v("notas")}</textarea></label>
    </div>
    <p class="cr-error" id="cr-error"></p>
    <div class="cr-acc"><button class="cr-btn verde" data-guardar-curso>Guardar curso</button><button class="cr-btn gris" data-cancelar-curso>Cancelar</button></div>
    <datalist id="cr-plataformas"><option value="Coursera"><option value="edX"><option value="Udemy"><option value="Alison"><option value="Khan Academy"><option value="YouTube"></datalist>
  </div>`;
}
function crAbrirForm(c) {
  editando = c ? c.id : null;
  crPoner("cr-form", crForm(c || {}));
  const f = $("cr-form");
  if (f) { f.scrollIntoView({ behavior: "smooth", block: "start" }); const p = f.querySelector("[data-f=titulo]"); if (p) p.focus(); }
}
function crCerrarForm() { editando = null; crPoner("cr-form", ""); }
function crGuardarForm() {
  const f = k => { const el = document.querySelector(`#cr-form [data-f="${k}"]`); return el ? el.value.trim() : ""; };
  if (!f("titulo")) { const er = $("cr-error"); if (er) er.textContent = "Escribe el nombre del curso."; return; }
  let url = f("url");
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
  const datos = { titulo: f("titulo"), inst: f("inst"), plataforma: f("plataforma") || "—", url, desc: f("desc"), horas: f("horas") || "—",
    nivel: f("nivel"), idioma: f("idioma") || "—", costo: f("costo") || "—", etapa: Number(f("etapa")), estado: Number(f("estado")), notas: f("notas") };
  const previo = editando && extras.find(x => x.id === editando);
  if (previo) Object.assign(previo, datos); else extras.push({ id: crId(), ...datos });
  crGuardar(); crCerrarForm(); dibujarCursos();
}

// ---------- Estilos (van aquí para que siempre se carguen junto con este archivo) ----------
const crEstilos = document.createElement("style");
crEstilos.textContent = `
  .cr-head h2 { margin:0 0 4px; font-size:clamp(22px,2.4vw,28px); color:var(--keen-green); }
  .cr-head p { margin:0 0 14px; font-size:13px; color:#6b6b6b; max-width:70ch; }
  .cr-barra { margin-bottom:12px; }
  .cr-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
  .cr-stat { background:#fff; border-radius:var(--r,22px); padding:12px 16px; display:flex; flex-direction:column; gap:4px; }
  .cr-stat b { font-size:28px; line-height:1; color:var(--keen-green); }
  .cr-stat span { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#6b6b6b; }
  .cr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:12px; padding-bottom:16px; }
  .cr-card { color:#fff; border-radius:var(--r,22px); padding:20px 22px; display:flex; flex-direction:column; gap:10px; }
  .cr-berry { background:var(--berry); } .cr-keen { background:var(--keen-green); }
  .cr-cherry { background:var(--cherry); } .cr-moss { background:var(--moss); }
  .cr-top { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:11px; font-weight:700; }
  .cr-etapa { opacity:.9; text-transform:uppercase; letter-spacing:.03em; }
  .cr-badge { flex:none; background:rgba(255,255,255,.22); border-radius:999px; padding:3px 10px; }
  button.cr-badge { border:0; font:inherit; font-size:11px; font-weight:700; color:inherit; cursor:pointer; touch-action:manipulation; min-height:28px; }
  .cr-card.hecho .cr-badge { background:var(--dolphin); color:var(--berry); }
  .cr-card h3 { margin:0; font-size:clamp(18px,1.8vw,22px); line-height:1.2; }
  .cr-card p { margin:0; }
  .cr-inst { font-size:13px; opacity:.95; }
  .cr-desc { font-size:14px; line-height:1.4; opacity:.95; }
  .cr-lista { margin:0; padding-left:18px; font-size:13px; line-height:1.5; }
  .cr-datos { margin:0; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .cr-datos div { background:rgba(255,255,255,.16); border-radius:14px; padding:8px 12px; min-width:0; }
  .cr-datos dt { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; opacity:.85; }
  .cr-datos dd { margin:2px 0 0; font-size:13px; font-weight:700; line-height:1.25; }
  .cr-datos small { display:block; font-size:11px; opacity:.85; margin-top:2px; }
  .cr-val { font-size:12px; opacity:.9; }
  .cr-util { font-size:13px; background:rgba(255,255,255,.16); border-radius:14px; padding:8px 12px; }
  .cr-acc { margin-top:auto; display:flex; gap:8px; flex-wrap:wrap; padding-top:4px; }
  .cr-btn { border:0; border-radius:999px; background:#fff; color:#262626; font:inherit; font-size:14px; font-weight:700; min-height:40px; padding:0 18px; display:inline-flex; align-items:center; text-decoration:none; cursor:pointer; touch-action:manipulation; }
  .cr-btn.suave { background:rgba(255,255,255,.22); color:#fff; }
  .cr-btn.verde { background:var(--keen-green); color:#fff; }
  .cr-btn.gris { background:#eee; color:#6b6b6b; }
  .cr-nueva { min-height:120px; border:2px dashed var(--moss); border-radius:var(--r,22px); background:transparent; color:var(--keen-green); font:inherit; font-size:16px; font-weight:700; cursor:pointer; touch-action:manipulation; }
  .cr-form { background:#fff; color:#262626; border-radius:var(--r,22px); padding:18px 20px; margin-bottom:14px; }
  .cr-form h3 { margin:0 0 12px; font-size:20px; color:var(--keen-green); }
  .cr-campos { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px 12px; margin-bottom:10px; }
  .cr-campos .ancho { grid-column:1 / -1; }
  .cr-campos label { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#6b6b6b; }
  .cr-campos input, .cr-campos select, .cr-campos textarea { display:block; width:100%; margin-top:4px; border:0; border-radius:12px; background:var(--bg); color:#262626; font:inherit; font-size:14px; font-weight:400; letter-spacing:0; text-transform:none; padding:8px 10px; min-height:38px; }
  .cr-campos input:focus, .cr-campos select:focus, .cr-campos textarea:focus { outline:2px solid var(--moss); }
  .cr-error { min-height:18px; margin:0 0 6px; font-size:13px; font-weight:700; color:var(--berry); }
  @media (max-width:700px) { .cr-stats { grid-template-columns:1fr; } }`;
document.head.appendChild(crEstilos);

// ---------- Botón "Añadir curso" y espacio del formulario (se crean aquí, no hace falta tocar el HTML) ----------
const crVista = $("vista-courses"), crStatsEl = $("cr-stats");
if (crStatsEl && !$("cr-form")) {
  const barra = document.createElement("div");
  barra.className = "cr-barra";
  barra.innerHTML = '<button class="cr-btn verde" data-agregar-curso>+ Añadir curso</button>';
  const form = document.createElement("div");
  form.id = "cr-form";
  crStatsEl.parentElement.insertBefore(barra, crStatsEl);
  crStatsEl.parentElement.insertBefore(form, crStatsEl);
}

// ---------- Eventos ----------
if (crVista) crVista.addEventListener("click", ev => {
  const t = ev.target;
  let b;
  if ((b = t.closest("[data-etapa-ir]"))) irAEtapa(Number(b.dataset.etapaIr));
  else if (t.closest("[data-agregar-curso]")) crAbrirForm();
  else if (t.closest("[data-cancelar-curso]")) crCerrarForm();
  else if (t.closest("[data-guardar-curso]")) crGuardarForm();
  else if ((b = t.closest("[data-editar-curso]"))) crAbrirForm(extras.find(x => x.id === b.dataset.editarCurso));
  else if ((b = t.closest("[data-borrar-curso]"))) {
    if (confirm("¿Quitar este curso de la lista?")) { extras = extras.filter(x => x.id !== b.dataset.borrarCurso); crGuardar(); dibujarCursos(); }
  } else if ((b = t.closest("[data-estado-curso]"))) {
    const c = extras.find(x => x.id === b.dataset.estadoCurso);
    if (c) { c.estado = ((c.estado || 0) + 1) % 3; crGuardar(); dibujarCursos(); }
  }
});
document.querySelectorAll('.tab[data-vista="courses"]').forEach(t => t.addEventListener("click", dibujarCursos));   // se actualiza al abrir la pestaña

// ---------- Inicio ----------
dibujarCursos();