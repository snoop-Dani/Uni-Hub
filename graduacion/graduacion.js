// ============ 1. DATOS FIJOS ============
const COLS = ["berry", "keen", "cherry", "moss"];
const ESTADOS = { pendiente: "Pendiente", proceso: "En proceso", aprobado: "✓ Cumplido" };
const AVANCE = { pendiente: 0, proceso: 0.5, aprobado: 1 };          // cuánto cuenta cada estado en el avance general
const ICONOS = ["📌", "🗣️", "🌱", "📄", "💳", "📝", "⭐", "🏅"];
const DIAS_SEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// ============ 2. UTILIDADES ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const texto = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const leerJSON = clave => { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } };
const dd = n => String(n).padStart(2, "0");
// 37.5 → "37,5"
const fmtH = h => String(Math.round(h * 100) / 100).replace(".", ",");

// ---------- Fechas (guardadas como "2026-11-05") ----------
const aISO = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
const deISO = s => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const hoyISO = () => aISO(new Date());
const sumarDias = (iso, n) => { const d = deISO(iso); d.setDate(d.getDate() + n); return aISO(d); };
const fechaCorta = iso => { const d = deISO(iso); return `${DIAS_SEM[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };

// ============ 3. ESTADO (se guarda en el navegador) ============
// db = {
//   requisitos: [{ id, tipo: "materias" | "tcu" | "check" | "contador", icono, nombre, fijo, estado (check), lleva y meta (contador), notas }],
//   tcu: { meta: 150, proyecto: "", horas: [{ id, fecha, actividad, horas }] }
// }
// "materias" y "tcu" son fijos (no se pueden borrar). Los demás los puedo editar o borrar.
function porDefecto() {
  return {
    requisitos: [
      { id: "materias", tipo: "materias", icono: "🎓", nombre: "Aprobar todas las materias de mi malla", fijo: true },
      { id: "tcu", tipo: "tcu", icono: "🤝", nombre: "Trabajo comunal universitario (TCU)", fijo: true },
      { id: "ingles", tipo: "check", icono: "🗣️", nombre: "Inglés nivel B2", estado: "pendiente", notas: "" },
      { id: "sellos", tipo: "contador", icono: "🌱", nombre: "Sellos verdes", lleva: 0, meta: null, notas: "" }
    ],
    tcu: { meta: 150, proyecto: "", horas: [] }
  };
}
let db = leerJSON("graduacion-db");
if (!db || !Array.isArray(db.requisitos)) db = porDefecto();
db.tcu = Object.assign({ meta: 150, proyecto: "", horas: [] }, db.tcu);
if (!Array.isArray(db.tcu.horas)) db.tcu.horas = [];

let borrador = null;   // lo que se está editando en la hoja: { tipo: "horas" | "requisito", ... }

function guardar() { try { localStorage.setItem("graduacion-db", JSON.stringify(db)); } catch (e) {} }
const buscar = id => db.requisitos.find(r => r.id === id);
// Lo que guarda "Mi carrera": { n: aprobadas, total, pct }
const carrera = () => { const r = leerJSON("carrera-resumen"); return r && r.total ? r : null; };
const horasTCU = () => db.tcu.horas.reduce((s, h) => s + (h.horas || 0), 0);

// ============ 4. CÁLCULOS ============
// Para cada requisito: frac (de 0 a 1, o null si todavía no sé la meta), texto y si ya lo cumplí
function progreso(r) {
  if (r.tipo === "materias") {
    const c = carrera();
    return c ? { frac: Math.min(1, c.n / c.total), texto: `${c.n} de ${c.total} materias · ${c.pct} %` }
      : { frac: 0, texto: "Todavía no he marcado materias en Mi carrera" };
  }
  if (r.tipo === "tcu") {
    const h = horasTCU(), meta = db.tcu.meta;
    return { frac: meta ? Math.min(1, h / meta) : 0, texto: `${fmtH(h)} de ${fmtH(meta)} horas` };
  }
  if (r.tipo === "check") return { frac: AVANCE[r.estado] || 0, texto: ESTADOS[r.estado] || ESTADOS.pendiente };
  // contador
  return r.meta ? { frac: Math.min(1, (r.lleva || 0) / r.meta), texto: `${r.lleva || 0} de ${r.meta}` }
    : { frac: null, texto: `Llevo ${r.lleva || 0} · ¿cuántos necesito?` };
}
const cumplido = r => progreso(r).frac === 1;

function general() {
  const ps = db.requisitos.map(progreso).filter(p => p.frac !== null);
  return {
    pct: ps.length ? Math.round(100 * ps.reduce((s, p) => s + p.frac, 0) / ps.length) : 0,
    cumplidos: db.requisitos.filter(cumplido).length, total: db.requisitos.length
  };
}

// ============ 5. DIBUJAR ============
function dibujarGeneral() {
  const g = general();
  poner("general", `
    <div class="g-top"><h2>Voy hacia mi graduación 🎓</h2><span class="g-pct">${g.pct} %</span></div>
    <div class="g-barra"><i style="width:${g.pct}%"></i></div>
    <p class="g-txt">${g.cumplidos === g.total ? "🎉 <b>¡Cumplí todos mis requisitos de graduación!</b>"
      : `Llevo <b>${g.cumplidos} de ${g.total}</b> requisitos cumplidos.`}</p>`);
}

function pie(r) {   // botones de abajo de cada tarjeta
  if (r.tipo === "materias") return `<a class="req-btn" href="../carrera/">Ir a Mi carrera →</a>`;
  if (r.tipo === "tcu") {
    const c = carrera(), aviso = c && c.pct < 50 ? `<span class="req-pista">Puedo matricular el TCU cuando llegue al 50 % de materias (voy en ${c.pct} %).</span>` : "";
    return `<button class="req-btn" data-anotar-horas>＋ Anotar horas</button>${aviso}`;
  }
  if (r.tipo === "check") return Object.keys(ESTADOS).map(k => `<button class="req-btn ${r.estado === k ? "on" : ""}" data-estado="${k}" data-id="${r.id}">${ESTADOS[k]}</button>`).join("");
  return `<button class="req-btn redondo" data-menos="${r.id}" aria-label="Uno menos">−</button>
    <button class="req-btn redondo" data-mas="${r.id}" aria-label="Uno más">＋</button>
    ${r.meta ? "" : `<button class="req-btn" data-req="${r.id}">¿Cuántos necesito? ✎</button>`}`;
}

function dibujarRequisitos() {
  poner("requisitos", `
    <div class="reqs">${db.requisitos.map((r, i) => {
      const p = progreso(r), ok = p.frac === 1;
      const etiqueta = ok ? "✓ Cumplido" : r.tipo === "check" ? ESTADOS[r.estado] : p.frac === null ? "Sin meta" : `${Math.round(100 * p.frac)} %`;
      return `<article class="req c-${COLS[i % COLS.length]} ${ok ? "cumplido" : ""}">
        <button class="req-cuerpo" data-req="${r.id}">
          <span class="req-top"><span class="icono">${r.icono}</span><i class="etiqueta">${etiqueta}</i></span>
          <b>${esc(r.nombre)}</b>
          <span class="barra"><i style="width:${100 * (p.frac || 0)}%"></i></span>
          <span class="req-txt">${esc(p.texto)}</span>
          ${r.notas ? `<span class="req-notas">${esc(r.notas)}</span>` : ""}
        </button>
        <div class="req-pie">${pie(r)}</div>
      </article>`;
    }).join("")}</div>
    <div class="nuevo-req"><button class="btn verde" data-nuevo-req>＋ Agregar requisito</button></div>`);
}

function dibujarTCU() {
  const h = horasTCU(), orden = [...db.tcu.horas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  poner("tcu", `
    <div class="p-head"><h2>🤝 Mi TCU</h2>
      <span class="p-acciones"><button class="btn chico" data-meta-tcu>Meta: ${fmtH(db.tcu.meta)} h ✎</button><button class="btn verde chico" data-anotar-horas>＋ Anotar horas</button></span></div>
    <div class="tcu-datos">
      <label>Mi proyecto / institución<input class="texto" id="tcu-proyecto" value="${esc(db.tcu.proyecto)}" placeholder="Ej.: Proyecto de salud comunitaria"></label>
      <span class="g-txt"><b>${fmtH(h)} h</b> de ${fmtH(db.tcu.meta)} h${h >= db.tcu.meta ? " · 🎉 ¡Completé mi TCU!" : ` · me faltan ${fmtH(db.tcu.meta - h)} h`}</span>
    </div>
    ${orden.length ? orden.map(x => `<div class="registro"><span>${esc(x.actividad || "Horas de TCU")}<small>${fechaCorta(x.fecha)}</small></span>
        <span class="h">${fmtH(x.horas)} h</span><button class="quitar" data-quitar="${x.id}" aria-label="Borrar registro">×</button></div>`).join("")
      : '<p class="pista">Cada vez que haga horas de TCU, las anoto aquí con la fecha y lo que hice.</p>'}`);
}

function dibujar() { guardar(); dibujarGeneral(); dibujarRequisitos(); dibujarTCU(); }

// ============ 6. FORMULARIOS ============
function abrirHoja(html) { poner("form", html); $("hoja").hidden = false; document.body.classList.add("sin-scroll"); }
function cerrarForm() { borrador = null; $("hoja").hidden = true; document.body.classList.remove("sin-scroll"); }
function ponerFecha(iso) { borrador.fecha = iso; $("f-fecha").value = iso; texto("f-fecha-txt", fechaCorta(iso)); }
const pie_botones = borrar => `<p class="error ancho" id="f-error"></p>
  <div class="botones ancho">
    ${borrar ? '<button type="button" class="btn peligro" data-borrar>Eliminar</button>' : ""}
    <button type="button" class="btn" data-cerrar>Cancelar</button>
    <button type="submit" class="btn verde">Guardar</button>
  </div>`;

function abrirHoras() {
  borrador = { tipo: "horas", fecha: hoyISO() };
  let horas = "", mins = "";
  for (let i = 0; i <= 12; i++) horas += `<option value="${i}" ${i === 2 ? "selected" : ""}>${i} h</option>`;
  [0, 15, 30, 45].forEach(i => { mins += `<option value="${i}">${i} min</option>`; });
  abrirHoja(`
    <h2>Anotar horas de TCU</h2>
    <label class="campo ancho">¿Qué hice?<input id="f-actividad" placeholder="Ej.: Taller de primeros auxilios"></label>
    <div class="campo">¿Cuándo?
      <div class="fecha-btn"><span id="f-fecha-txt">${fechaCorta(borrador.fecha)}</span><input type="date" id="f-fecha" value="${borrador.fecha}" aria-label="Fecha"></div>
      <div class="rapidos"><button type="button" class="btn chico" data-rapido="0">Hoy</button><button type="button" class="btn chico" data-rapido="-1">Ayer</button></div></div>
    <div class="campo">¿Cuántas horas?<div class="dur"><select id="f-horas" aria-label="Horas">${horas}</select><select id="f-mins" aria-label="Minutos">${mins}</select></div></div>
    ${pie_botones(false)}`);
}

function abrirRequisito(r) {
  if (r && r.tipo === "materias") { location.href = "../carrera/"; return; }       // se marca en Mi carrera
  if (r && r.tipo === "tcu") { $("tcu").scrollIntoView({ behavior: "smooth" }); return; }
  borrador = r ? Object.assign({}, r, { tipo: "requisito", clase: r.tipo })
    : { tipo: "requisito", id: null, clase: "check", icono: "📌", nombre: "", estado: "pendiente", lleva: 0, meta: null, notas: "" };
  const b = borrador;
  abrirHoja(`
    <h2>${b.id ? "Editar requisito" : "Agregar un requisito"}</h2>
    <label class="campo ancho">¿Qué necesito?<input id="f-nombre" value="${esc(b.nombre)}" placeholder="Ej.: Paz y salvo financiero"></label>
    <div class="campo ancho">Ícono<div class="pildoras">${ICONOS.map(i => `<button type="button" class="pil emoji ${b.icono === i ? "on" : ""}" data-icono="${i}">${i}</button>`).join("")}</div></div>
    ${b.id ? "" : `<div class="campo ancho">Tipo<div class="pildoras">
      <button type="button" class="pil ${b.clase === "check" ? "on" : ""}" data-clase="check">✓ Sí / no</button>
      <button type="button" class="pil ${b.clase === "contador" ? "on" : ""}" data-clase="contador">🔢 Contador (llevo X de Y)</button></div></div>`}
    <div class="campo ancho" id="f-estado-box" ${b.clase === "check" ? "" : "hidden"}>Estado<div class="pildoras">
      ${Object.keys(ESTADOS).map(k => `<button type="button" class="pil ${b.estado === k ? "on" : ""}" data-f-estado="${k}">${ESTADOS[k]}</button>`).join("")}</div></div>
    <label class="campo" id="f-lleva-box" ${b.clase === "contador" ? "" : "hidden"}>Llevo<input id="f-lleva" value="${b.lleva || 0}" inputmode="numeric"></label>
    <label class="campo" id="f-meta-box" ${b.clase === "contador" ? "" : "hidden"}>Necesito<input id="f-meta" value="${b.meta || ""}" inputmode="numeric" placeholder="¿Cuántos?"></label>
    <label class="campo ancho">Notas<textarea id="f-notas" rows="2" placeholder="Opcional: dónde se tramita, qué documento piden…">${esc(b.notas || "")}</textarea></label>
    ${pie_botones(!!b.id)}`);
}

function guardarForm() {
  const b = borrador;
  if (b.tipo === "horas") {
    const horas = Number($("f-horas").value) + Number($("f-mins").value) / 60;
    if (!horas) { texto("f-error", "Me faltan las horas."); return; }
    db.tcu.horas.push({ id: nuevoId(), fecha: b.fecha, actividad: $("f-actividad").value.trim(), horas });
  } else {
    const nombre = $("f-nombre").value.trim();
    if (!nombre) { texto("f-error", "Me falta qué necesito."); return; }
    const entero = v => { const n = parseInt(String(v).replace(/\D/g, ""), 10); return isNaN(n) ? null : n; };
    const r = { id: b.id || nuevoId(), tipo: b.clase, icono: b.icono, nombre, notas: $("f-notas").value.trim() };
    if (b.clase === "check") r.estado = b.estado || "pendiente";
    else { r.lleva = entero($("f-lleva").value) || 0; r.meta = entero($("f-meta").value) || null; }
    const i = db.requisitos.findIndex(x => x.id === r.id);
    if (i >= 0) db.requisitos[i] = r; else db.requisitos.push(r);
  }
  cerrarForm(); dibujar();
}

// marca la opción elegida dentro de un grupo de pastillas
const marcar = (atributo, valor) => document.querySelectorAll(`[${atributo}]`).forEach(x => x.classList.toggle("on", x.getAttribute(atributo) === valor));

// ============ 7. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);

  // --- formularios ---
  if (borrador) {
    if (en("[data-rapido]")) ponerFecha(sumarDias(hoyISO(), Number(en("[data-rapido]").dataset.rapido)));
    else if (en("[data-icono]")) { borrador.icono = en("[data-icono]").dataset.icono; marcar("data-icono", borrador.icono); }
    else if (en("[data-clase]")) {
      borrador.clase = en("[data-clase]").dataset.clase; marcar("data-clase", borrador.clase);
      $("f-estado-box").hidden = borrador.clase !== "check";
      $("f-lleva-box").hidden = $("f-meta-box").hidden = borrador.clase !== "contador";
    }
    else if (en("[data-f-estado]")) { borrador.estado = en("[data-f-estado]").dataset.fEstado; marcar("data-f-estado", borrador.estado); }
    else if (en("[data-borrar]")) {
      if (confirm(`¿Eliminar el requisito «${borrador.nombre}»?`)) { db.requisitos = db.requisitos.filter(x => x.id !== borrador.id); cerrarForm(); dibujar(); }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarForm();
    return;
  }

  // --- página ---
  if (en("[data-estado]")) { buscar(en("[data-estado]").dataset.id).estado = en("[data-estado]").dataset.estado; dibujar(); }
  else if (en("[data-mas]")) { const r = buscar(en("[data-mas]").dataset.mas); r.lleva = (r.lleva || 0) + 1; dibujar(); }
  else if (en("[data-menos]")) { const r = buscar(en("[data-menos]").dataset.menos); r.lleva = Math.max(0, (r.lleva || 0) - 1); dibujar(); }
  else if (en("[data-anotar-horas]")) abrirHoras();
  else if (en("[data-nuevo-req]")) abrirRequisito(null);
  else if (en("[data-req]")) abrirRequisito(buscar(en("[data-req]").dataset.req));
  else if (en("[data-meta-tcu]")) {
    const v = prompt("¿Cuántas horas de TCU necesito?", fmtH(db.tcu.meta));
    const n = v === null ? null : parseFloat(String(v).replace(",", "."));
    if (n > 0 && n <= 1000) { db.tcu.meta = n; dibujar(); }
  }
  else if (en("[data-quitar]")) {
    const x = db.tcu.horas.find(h => h.id === en("[data-quitar]").dataset.quitar);
    if (x && confirm(`¿Borrar ${fmtH(x.horas)} h del ${fechaCorta(x.fecha)}?`)) { db.tcu.horas = db.tcu.horas.filter(h => h !== x); dibujar(); }
  }
});

document.addEventListener("input", ev => {
  if (ev.target.id === "tcu-proyecto") { db.tcu.proyecto = ev.target.value; guardar(); }   // se guarda mientras escribo
  else if (ev.target.id === "f-fecha" && ev.target.value) ponerFecha(ev.target.value);     // el calendario del iPad a veces avisa con "input"
});
document.addEventListener("change", ev => {
  if (ev.target.id === "f-fecha") { if (ev.target.value) ponerFecha(ev.target.value); else ev.target.value = borrador.fecha; }
});
$("form").addEventListener("submit", ev => { ev.preventDefault(); guardarForm(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && borrador) cerrarForm(); });
// al volver de "Mi carrera", el avance de materias se actualiza
document.addEventListener("visibilitychange", () => { if (!document.hidden && !borrador) dibujar(); });

// ============ 8. INICIO ============
dibujar();
