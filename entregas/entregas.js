// ============ 1. DATOS FIJOS ============
const TIPOS = {
  tarea: ["📝", "Tarea"], reporte: ["🧪", "Reporte de lab"], quiz: ["❓", "Quiz"], examen: ["📚", "Examen"],
  proyecto: ["🛠️", "Proyecto"], presentacion: ["🎤", "Presentación"], otro: ["📌", "Otro"]
};
const DIAS_SEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const COLS = ["berry", "keen", "cherry", "moss"];
const GRUPOS = [["atrasadas", "⚠ Atrasadas"], ["hoy", "Hoy"], ["manana", "Mañana"], ["semana", "Esta semana"], ["despues", "Más adelante"]];

// Cuatrimestres (salen de tu malla: ../carrera/malla.js), para saber cuál estás cursando
const INICIO = { I: 0, II: 4, III: 8 };
const PERIODOS = PLAN_BASE.map(c => ({ clave: `${c.p}-${c.a}`, inicio: new Date(c.a, INICIO[c.p], 1) }));
const NOMBRE = {};
PLAN_BASE.forEach(c => c.m.forEach(x => { NOMBRE[x[0]] = x[1]; }));
function periodoEnCurso() {
  const hoy = new Date(), empezados = PERIODOS.filter(p => p.inicio <= hoy);
  return (empezados[empezados.length - 1] || PERIODOS[0]).clave;
}

// ============ 2. UTILIDADES ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const texto = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const leerJSON = clave => { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } };
const dd = n => String(n).padStart(2, "0");
// La misma materia tiene siempre el mismo color (igual que en Horarios y Mis notas)
const colorDe = nombre => COLS[[...String(nombre).toLowerCase()].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLS.length];

// ---------- Fechas ----------
// Guardo las fechas como texto "2026-11-05" (sin hora) para no tener líos de zona horaria
const aISO = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
const deISO = s => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const hoyISO = () => aISO(new Date());
const sumarDias = (iso, n) => { const d = deISO(iso); d.setDate(d.getDate() + n); return aISO(d); };
const diasHasta = iso => Math.round((deISO(iso) - deISO(hoyISO())) / 86400000);
const hastaDomingo = () => (7 - new Date().getDay()) % 7;          // días que faltan para el domingo (0 si hoy es domingo)
const fechaCorta = iso => { const d = deISO(iso); return `${DIAS_SEM[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const fechaLarga = iso => `${fechaCorta(iso)} ${deISO(iso).getFullYear()}`;
// "23:59" → "11:59 pm"
const horaTxt = h => { if (!h) return ""; const [hh, mm] = h.split(":").map(Number); return `${(hh + 11) % 12 + 1}:${dd(mm)} ${hh < 12 ? "am" : "pm"}`; };

function cuando(e) {
  const d = diasHasta(e.fecha);
  if (d < 0) return `Atrasada ${-d} ${d === -1 ? "día" : "días"}`;
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  if (d < 7) return `En ${d} días`;
  return fechaCorta(e.fecha);
}
function grupoDe(e) {                       // en qué grupo de la lista va cada entrega
  if (e.hecha) return "hechas";
  const d = diasHasta(e.fecha);
  return d < 0 ? "atrasadas" : d === 0 ? "hoy" : d === 1 ? "manana" : d <= hastaDomingo() ? "semana" : "despues";
}
// por fecha y hora (sin hora = al final del día)
const ordenar = lista => lista.sort((a, b) => (a.fecha + (a.hora || "99")).localeCompare(b.fecha + (b.hora || "99")));

// ============ 3. ESTADO (se guarda en el navegador) ============
// db = { items: [{ id, titulo, materia, tipo, fecha: "2026-11-05", hora: "23:59" o "", notas, hecha, hechaEn }] }
let db = leerJSON("entregas-db");
if (!db || !Array.isArray(db.items)) db = { items: [] };
let filtro = null;        // materia elegida en el filtro (null = todas)
let verHechas = false;    // mostrar la lista de hechas
let borrador = null;      // entrega que se está editando en el formulario

function guardar() { try { localStorage.setItem("entregas-db", JSON.stringify(db)); } catch (e) {} }
const buscar = id => db.items.find(e => e.id === id);

// Materias para el autocompletado: las de Mis notas y mi horario ★ de este cuatrimestre, las que ya usé y mi malla
function materiasSugeridas() {
  const p = periodoEnCurso(), lista = [];
  const n = leerJSON("notas-db"), pn = n && n.periodos && n.periodos[p];
  if (pn && Array.isArray(pn.materias)) pn.materias.forEach(m => lista.push(m.nombre));
  const h = leerJSON("horarios-db"), ph = h && h.periodos && h.periodos[p];
  const el = ph && Array.isArray(ph.opciones) && ph.opciones.find(o => o.id === ph.elegida);
  if (el && Array.isArray(el.clases)) el.clases.forEach(c => lista.push(c.materia));
  db.items.forEach(e => lista.push(e.materia));
  return [...new Set(lista.concat(Object.values(NOMBRE)).filter(Boolean))];
}

// ============ 4. DIBUJAR ============
function dibujarResumen() {
  const pend = db.items.filter(e => !e.hecha), d = e => diasHasta(e.fecha);
  const atrasadas = pend.filter(e => d(e) < 0).length;
  const hm = pend.filter(e => d(e) === 0 || d(e) === 1).length;
  const semana = pend.filter(e => d(e) >= 0 && d(e) <= hastaDomingo()).length;
  const hechas = db.items.length - pend.length;
  poner("stats", `
    <div class="stat ${atrasadas ? "alerta" : ""}"><b>${atrasadas ? "⚠ " + atrasadas : 0}</b><span>${atrasadas === 1 ? "atrasada" : "atrasadas"}</span></div>
    <div class="stat"><b>${hm}</b><span>para hoy y mañana</span></div>
    <div class="stat"><b>${semana}</b><span>esta semana</span></div>
    <div class="stat"><b>${hechas}</b><span>${hechas === 1 ? "hecha" : "hechas"}</span></div>`);
}

function dibujarFiltros() {
  const materias = [...new Set(db.items.map(e => e.materia).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (filtro && !materias.includes(filtro)) filtro = null;
  poner("filtros", materias.length < 2 ? "" : `<button class="fil ${filtro ? "" : "on"}" data-filtro="">Todas</button>`
    + materias.map(m => `<button class="fil ${filtro === m ? "on" : ""}" data-filtro="${esc(m)}">${esc(m)}</button>`).join(""));
}

function tarjeta(e) {
  const atrasada = !e.hecha && diasHasta(e.fecha) < 0, [emoji, tipo] = TIPOS[e.tipo] || TIPOS.otro;
  const info = [e.materia && esc(e.materia), tipo, fechaCorta(e.fecha) + (e.hora ? " · " + horaTxt(e.hora) : "")].filter(Boolean).join(" · ");
  return `<article class="entrega c-${colorDe(e.materia || e.titulo)} ${atrasada ? "atrasada" : ""} ${e.hecha ? "hecha" : ""}">
    <button class="check" data-check="${e.id}" aria-label="${e.hecha ? "Marcar como pendiente" : "Marcar como hecha"}"><span>${e.hecha ? "✓" : ""}</span></button>
    <button class="e-cuerpo" data-editar="${e.id}">
      <span class="e-top"><b>${emoji} ${esc(e.titulo)}</b><i class="cuando">${e.hecha ? "Hecha" : cuando(e)}</i></span>
      <span class="e-info">${info}</span>
      ${e.notas ? `<span class="e-notas">${esc(e.notas)}</span>` : ""}
    </button>
  </article>`;
}

function dibujarLista() {
  const items = db.items.filter(e => !filtro || e.materia === filtro);
  let html = "";
  GRUPOS.forEach(([g, titulo]) => {
    const del = ordenar(items.filter(e => grupoDe(e) === g));
    if (del.length) html += `<div class="section-head ${g === "atrasadas" ? "alerta" : ""}"><h2>${titulo}</h2><span>${del.length}</span></div>
      <div class="grupo">${del.map(tarjeta).join("")}</div>`;
  });
  if (!db.items.length) html = `<p class="pista">Todavía no tengo entregas. Toco «＋ Agregar entrega» arriba para empezar.</p>`;
  else if (!html) html = `<p class="pista">✓ No tengo nada pendiente${filtro ? " en " + esc(filtro) : ""}.</p>`;
  // las hechas, de la más reciente a la más vieja
  const hechas = items.filter(e => e.hecha).sort((a, b) => (b.hechaEn || b.fecha).localeCompare(a.hechaEn || a.fecha));
  if (hechas.length) html += `<div class="section-head"><h2>✓ Hechas</h2>
      <span><button class="btn chico" data-ver-hechas>${verHechas ? "Ocultar" : `Ver las ${hechas.length}`}</button>
      ${verHechas ? '<button class="btn chico peligro" data-borrar-hechas>Borrar hechas</button>' : ""}</span></div>
    ${verHechas ? `<div class="grupo">${hechas.map(tarjeta).join("")}</div>` : ""}`;
  poner("lista", html);
}

function dibujar() { guardar(); dibujarResumen(); dibujarFiltros(); dibujarLista(); }

// ============ 5. FORMULARIO ============
// Hora con dos <select>: "Sin hora" o la hora (en iPad funcionan mejor que <input type="time">)
function selectorHora(hora) {
  const [h, m] = hora ? hora.split(":").map(Number) : [null, 59];
  let horas = `<option value="" ${h === null ? "selected" : ""}>Sin hora</option>`, mins = "";
  for (let i = 6; i <= 23; i++) horas += `<option value="${i}" ${i === h ? "selected" : ""}>${(i + 11) % 12 + 1} ${i < 12 ? "am" : "pm"}</option>`;
  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].forEach(i => { mins += `<option value="${i}" ${i === m ? "selected" : ""}>:${dd(i)}</option>`; });
  return `<div class="hora"><select id="f-hora-h" aria-label="Hora">${horas}</select><select id="f-hora-m" aria-label="Minutos" ${h === null ? "disabled" : ""}>${mins}</select></div>`;
}
const leerHora = () => $("f-hora-h").value === "" ? "" : `${dd($("f-hora-h").value)}:${dd($("f-hora-m").value)}`;

function ponerFecha(iso) { borrador.fecha = iso; $("f-fecha").value = iso; texto("f-fecha-txt", fechaLarga(iso)); }

function abrirForm(e) {
  borrador = e ? JSON.parse(JSON.stringify(e))
    : { id: null, titulo: "", materia: filtro || "", tipo: "tarea", fecha: sumarDias(hoyISO(), 1), hora: "", notas: "", hecha: false };
  const b = borrador;
  poner("materias", materiasSugeridas().map(n => `<option value="${esc(n)}">`).join(""));
  poner("form", `
    <h2>${b.id ? "Editar entrega" : "Nueva entrega"}</h2>
    <label class="campo ancho">¿Qué tengo que entregar?
      <input id="f-titulo" value="${esc(b.titulo)}" placeholder="Ej.: Reporte de laboratorio 3"></label>
    <label class="campo ancho">Materia
      <input id="f-materia" list="materias" value="${esc(b.materia)}" placeholder="Escribo para buscar…" autocomplete="off"></label>
    <div class="campo ancho">Tipo
      <div class="pildoras">${Object.keys(TIPOS).map(k => `<button type="button" class="pil ${b.tipo === k ? "on" : ""}" data-tipo="${k}">${TIPOS[k].join(" ")}</button>`).join("")}</div></div>
    <div class="campo">Fecha
      <div class="fecha-btn"><span id="f-fecha-txt">${fechaLarga(b.fecha)}</span><input type="date" id="f-fecha" value="${b.fecha}" aria-label="Fecha"></div>
      <div class="rapidos">
        <button type="button" class="btn chico" data-rapido="0">Hoy</button>
        <button type="button" class="btn chico" data-rapido="1">Mañana</button>
        <button type="button" class="btn chico" data-rapido="7">En 1 semana</button>
      </div></div>
    <div class="campo">Hora (opcional) ${selectorHora(b.hora)}</div>
    <label class="campo ancho">Notas
      <textarea id="f-notas" rows="2" placeholder="Opcional: qué incluye, en qué formato, dónde se sube…">${esc(b.notas)}</textarea></label>
    <p class="error ancho" id="f-error"></p>
    <div class="botones ancho">
      ${b.id ? '<button type="button" class="btn peligro" data-borrar>Eliminar</button>' : ""}
      <button type="button" class="btn" data-cerrar>Cancelar</button>
      <button type="submit" class="btn verde">Guardar</button>
    </div>`);
  $("hoja").hidden = false;
  document.body.classList.add("sin-scroll");
}

function cerrarForm() {
  borrador = null;
  $("hoja").hidden = true;
  document.body.classList.remove("sin-scroll");
}

function guardarForm() {
  const b = borrador;
  b.titulo = $("f-titulo").value.trim();
  b.materia = $("f-materia").value.trim();
  b.notas = $("f-notas").value.trim();
  b.hora = leerHora();
  if (!b.titulo) { texto("f-error", "Me falta qué tengo que entregar."); return; }
  if (b.id) db.items[db.items.findIndex(e => e.id === b.id)] = b;
  else { b.id = nuevoId(); db.items.push(b); }
  cerrarForm(); dibujar();
}

// ============ 6. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);

  // --- formulario ---
  if (borrador) {
    if (en("[data-tipo]")) {
      borrador.tipo = en("[data-tipo]").dataset.tipo;
      document.querySelectorAll("[data-tipo]").forEach(x => x.classList.toggle("on", x.dataset.tipo === borrador.tipo));
    }
    else if (en("[data-rapido]")) ponerFecha(sumarDias(hoyISO(), Number(en("[data-rapido]").dataset.rapido)));
    else if (en("[data-borrar]")) {
      if (confirm(`¿Eliminar «${borrador.titulo}»?`)) { db.items = db.items.filter(e => e.id !== borrador.id); cerrarForm(); dibujar(); }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarForm();   // Cancelar o tocar fuera
    return;
  }

  // --- página ---
  if (en("[data-nueva]")) abrirForm(null);
  else if (en("[data-check]")) {
    const e = buscar(en("[data-check]").dataset.check);
    e.hecha = !e.hecha;
    e.hechaEn = e.hecha ? hoyISO() : "";
    dibujar();
  }
  else if (en("[data-editar]")) abrirForm(buscar(en("[data-editar]").dataset.editar));
  else if (en("[data-filtro]")) { filtro = en("[data-filtro]").dataset.filtro || null; dibujar(); }
  else if (en("[data-ver-hechas]")) { verHechas = !verHechas; dibujar(); }
  else if (en("[data-borrar-hechas]")) {
    const n = db.items.filter(e => e.hecha && (!filtro || e.materia === filtro)).length;
    if (confirm(`¿Borrar ${n === 1 ? "la entrega hecha" : `las ${n} entregas hechas`}${filtro ? " de " + filtro : ""}?`)) {
      db.items = db.items.filter(e => !(e.hecha && (!filtro || e.materia === filtro)));
      verHechas = false; dibujar();
    }
  }
});

function alCambiar(ev) {
  const id = ev.target.id;
  if (id === "f-fecha") { if (ev.target.value) ponerFecha(ev.target.value); else ev.target.value = borrador.fecha; }   // si la borran, vuelve a la anterior
  else if (id === "f-hora-h") $("f-hora-m").disabled = ev.target.value === "";
}
document.addEventListener("change", alCambiar);
document.addEventListener("input", alCambiar);   // el calendario del iPad a veces avisa con "input" y no con "change"

$("form").addEventListener("submit", ev => { ev.preventDefault(); guardarForm(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && borrador) cerrarForm(); });
// si dejo la página abierta y cambia el día, se reacomoda al volver
document.addEventListener("visibilitychange", () => { if (!document.hidden && !borrador) dibujar(); });

// ============ 7. INICIO ============
dibujar();
