// ============ 1. CUATRIMESTRES Y MATERIAS (salen de tu malla: ../carrera/malla.js) ============
const INICIO = { I: 0, II: 4, III: 8 };                    // mes en que empieza cada cuatrimestre (0 = enero)
const MESES = { I: "ene–abr", II: "may–ago", III: "sep–dic" };
const PERIODOS = PLAN_BASE.map((c, i) => ({ clave: `${c.p}-${c.a}`, nombre: `${c.p} ${c.a}`, meses: MESES[c.p], inicio: new Date(c.a, INICIO[c.p], 1), i }));
const NOMBRE = {};                                          // código → nombre de la materia
PLAN_BASE.forEach(c => c.m.forEach(x => { NOMBRE[x[0]] = x[1]; }));

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ESTADOS = { confirmar: "Por confirmar", disponible: "Disponible", sincupo: "Sin cupo" };
const COLS = ["berry", "keen", "cherry", "moss"];
const ALTO = 56;                                            // píxeles por hora en la cuadrícula

// El siguiente cuatrimestre que todavía no ha empezado (si ya pasaron todos, el último)
function periodoSiguiente() {
  const hoy = new Date();
  return (PERIODOS.find(p => p.inicio > hoy) || PERIODOS[PERIODOS.length - 1]).clave;
}
const buscarPeriodo = clave => PERIODOS.find(p => p.clave === clave);

// Materias para el autocompletado: primero las de ese cuatrimestre (según tu orden en "Mi carrera"), después el resto
function materiasDe(clave) {
  const per = buscarPeriodo(clave);
  let ids = PLAN_BASE[per.i].m.map(x => x[0]);
  try {
    const plan = JSON.parse(localStorage.getItem("carrera-plan"));
    const c = Array.isArray(plan) && plan[per.i];
    if (c && c.p === PLAN_BASE[per.i].p && c.a === PLAN_BASE[per.i].a && Array.isArray(c.ids)) ids = c.ids.filter(id => NOMBRE[id]);
  } catch (e) {}
  const primero = ids.map(id => NOMBRE[id]);
  return primero.concat(Object.values(NOMBRE).filter(n => !primero.includes(n)));
}

// ============ 2. UTILIDADES Y ESTADO (se guarda en el navegador) ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const texto = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// minutos desde medianoche → "7:30 am"
const hora = min => { const h = Math.floor(min / 60); return `${(h + 11) % 12 + 1}:${String(min % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
const horaCorta = h => `${(h + 11) % 12 + 1} ${h < 12 ? "am" : "pm"}`;
// "7:00–8:50 am" (si las dos son am o las dos pm) o "11:00 am – 12:50 pm"
const rango = (a, b) => (a < 720) === (b < 720) ? hora(a).slice(0, -3) + "–" + hora(b) : hora(a) + " – " + hora(b);
// La misma materia tiene siempre el mismo color
const colorDe = nombre => COLS[[...nombre.toLowerCase()].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLS.length];

// db = { periodos: { "I-2027": { opciones: [{ id, nombre, clases: [...] }], elegida: id, activa: id } } }
// cada clase = { id, materia, profesor, modo: "presencial"|"virtual", aula, dias: [0..5], ini, fin (minutos), estado, notas }
let db = null;
try { db = JSON.parse(localStorage.getItem("horarios-db")); } catch (e) {}
if (!db || typeof db.periodos !== "object" || !db.periodos) db = { periodos: {} };

let actual = periodoSiguiente();   // cuatrimestre que estás viendo
let borrador = null;               // clase que se está editando en el formulario

function per() {                   // datos del cuatrimestre que estás viendo
  const p = db.periodos[actual] || (db.periodos[actual] = { opciones: [], elegida: null, activa: null });
  if (!Array.isArray(p.opciones)) p.opciones = [];
  return p;
}
function opcionActiva() { const p = per(); return p.opciones.find(o => o.id === p.activa) || p.opciones[0] || null; }

function guardar() {
  const sig = periodoSiguiente(), p = db.periodos[sig], el = p && p.opciones.find(o => o.id === p.elegida);
  try {
    localStorage.setItem("horarios-db", JSON.stringify(db));
    // el Uni-Hub lee esto (siempre sobre el próximo cuatrimestre)
    localStorage.setItem("horarios-resumen", JSON.stringify({ periodo: buscarPeriodo(sig).nombre, opciones: p ? p.opciones.length : 0, elegida: el ? el.nombre : null }));
  } catch (e) {}
}

// ============ 3. CÁLCULOS: CHOQUES, HORAS Y CARRILES ============
// Dos clases chocan si comparten un día y sus horas se cruzan
const seCruzan = (a, b) => a.dias.some(d => b.dias.includes(d)) && a.ini < b.fin && b.ini < a.fin;

function analizar(op) {
  const cuentan = op.clases.filter(c => c.estado !== "sincupo");   // las "sin cupo" no cuentan
  const enChoque = new Set();     // clases que chocan (para la lista)
  const diaChoque = new Set();    // "clase|día" que chocan (para pintar en rojo solo ese día en la cuadrícula)
  let choques = 0;
  cuentan.forEach((a, i) => cuentan.slice(i + 1).forEach(b => {
    if (!seCruzan(a, b)) return;
    choques++; enChoque.add(a.id); enChoque.add(b.id);
    a.dias.filter(d => b.dias.includes(d)).forEach(d => { diaChoque.add(a.id + "|" + d); diaChoque.add(b.id + "|" + d); });
  }));
  const minutos = cuentan.reduce((s, c) => s + (c.fin - c.ini) * c.dias.length, 0);
  return { clases: op.clases.length, horas: Math.round(minutos / 6) / 10, choques, enChoque, diaChoque, sinCupo: op.clases.length - cuentan.length };
}

// Reparte los bloques de un día en carriles (columnas) para que los que se solapan queden lado a lado.
// A cada bloque le pone: carril (0, 1, 2…) y n (cuántos carriles tiene su grupo).
function repartir(bloques) {
  bloques.sort((a, b) => a.ini - b.ini || b.fin - a.fin);
  let grupo = [], carriles = [], finGrupo = -1;
  const cerrar = () => { grupo.forEach(b => { b.n = carriles.length; }); grupo = []; carriles = []; finGrupo = -1; };
  bloques.forEach(b => {
    if (grupo.length && b.ini >= finGrupo) cerrar();          // ya no toca a nadie del grupo anterior
    let k = carriles.findIndex(fin => fin <= b.ini);          // primer carril libre
    if (k < 0) { k = carriles.length; carriles.push(0); }
    carriles[k] = b.fin; b.carril = k; grupo.push(b);
    finGrupo = Math.max(finGrupo, b.fin);
  });
  cerrar();
}

// ============ 4. DIBUJAR ============
function dibujarPeriodos() {
  const sig = periodoSiguiente();
  poner("periodo", PERIODOS.map(p => `<option value="${p.clave}" ${p.clave === actual ? "selected" : ""}>${p.nombre} · ${p.meses}${p.clave === sig ? " (próximo)" : ""}</option>`).join(""));
}

function dibujarOpciones(op) {
  const p = per();
  poner("opciones", p.opciones.map(o => `<button class="op ${op && o.id === op.id ? "activa" : ""}" data-op="${o.id}">${o.id === p.elegida ? "★ " : ""}${esc(o.nombre)}</button>`).join("")
    + `<button class="op nueva" data-nueva>＋ Nueva opción</button>`);
  const es = op && op.id === p.elegida;
  poner("acciones", !op ? "" : `
    <button class="btn verde" data-agregar>＋ Agregar clase</button>
    <button class="btn ${es ? "elegida" : ""}" data-elegir>${es ? "★ Es mi horario" : "☆ Elegir como mi horario"}</button>
    <button class="btn" data-renombrar>✎ Renombrar</button>
    <button class="btn" data-duplicar>⧉ Duplicar</button>
    <button class="btn peligro" data-eliminar>Eliminar opción</button>`);
}

function dibujarResumen(op, r) {
  poner("stats", !op ? "" : `
    <div class="stat"><b>${r.clases}</b><span>${r.clases === 1 ? "clase" : "clases"}</span></div>
    <div class="stat"><b>${String(r.horas).replace(".", ",")}</b><span>horas por semana</span></div>
    <div class="stat ${r.choques ? "alerta" : ""}"><b>${r.choques ? "⚠ " + r.choques : 0}</b><span>${r.choques === 1 ? "choque" : "choques"}</span></div>
    <div class="stat"><b>${r.sinCupo}</b><span>sin cupo</span></div>`);
}

function bloque(b, dia, desde, r) {
  const c = b.c, choque = r.diaChoque.has(c.id + "|" + dia);
  const estilo = `top:${(c.ini - desde * 60) / 60 * ALTO}px;height:${(c.fin - c.ini) / 60 * ALTO}px;left:${100 * b.carril / b.n}%;width:${100 / b.n}%`;
  return `<button class="bloque c-${colorDe(c.materia)} ${choque ? "choque" : ""} ${c.estado === "sincupo" ? "sincupo" : ""}" style="${estilo}" data-clase="${c.id}">
    <b>${choque ? "⚠ " : ""}${esc(c.materia)}</b>
    <small>${rango(c.ini, c.fin)}</small>
    <small>${c.modo === "virtual" ? "Virtual" : esc(c.aula || "Presencial")}</small>
  </button>`;
}

function dibujarCuadricula(op, r) {
  if (!op) {
    poner("cuadricula", `<div class="vacio">Todavía no tengo opciones para el ${buscarPeriodo(actual).nombre}.<button class="btn verde" data-nueva>＋ Crear Opción A</button></div>`);
    return;
  }
  // De qué hora a qué hora se dibuja: al menos de 7 am a 6 pm, y más si alguna clase se sale
  const desde = Math.min(7, ...op.clases.map(c => Math.floor(c.ini / 60)));
  const hasta = Math.max(18, ...op.clases.map(c => Math.ceil(c.fin / 60)));
  const horas = [];
  for (let h = desde; h < hasta; h++) horas.push(h);
  const dias = DIAS.map((d, i) => {
    const bloques = op.clases.filter(c => c.dias.includes(i)).map(c => ({ c, ini: c.ini, fin: c.fin }));
    repartir(bloques);
    return `<div class="g-dia">${bloques.map(b => bloque(b, i, desde, r)).join("")}</div>`;
  });
  poner("cuadricula", `
    <div class="g-scroll"><div class="grilla" style="--alto:${ALTO}px">
      <div></div>${DIAS.map(d => `<div class="g-tit">${d}</div>`).join("")}
      <div class="g-horas" style="height:${(hasta - desde) * ALTO}px">${horas.map(h => `<span style="top:${(h - desde) * ALTO}px">${horaCorta(h)}</span>`).join("")}</div>
      ${dias.join("")}
    </div></div>`);
}

function tarjetaClase(c, r) {
  const choque = r.enChoque.has(c.id);
  return `<button class="clase c-${colorDe(c.materia)} ${choque ? "choque" : ""} ${c.estado === "sincupo" ? "sincupo" : ""}" data-clase="${c.id}">
    <span class="cl-top"><b>${esc(c.materia)}</b><i class="estado">${ESTADOS[c.estado] || ""}</i></span>
    <span>${c.dias.map(d => DIAS[d]).join(" · ")} · ${rango(c.ini, c.fin)}</span>
    <span>${c.modo === "virtual" ? "💻 Virtual" : "🏫 " + esc(c.aula || "Aula por definir")}${c.profesor ? " · " + esc(c.profesor) : ""}</span>
    ${c.notas ? `<span class="notas">${esc(c.notas)}</span>` : ""}
    ${choque ? `<span class="aviso">⚠ Choca con otra clase</span>` : ""}
  </button>`;
}

function dibujarLista(op, r) {
  if (!op) { poner("clases", ""); return; }
  // ordenadas por el primer día y luego por hora
  const orden = [...op.clases].sort((a, b) => Math.min(...a.dias) - Math.min(...b.dias) || a.ini - b.ini);
  poner("clases", `
    <div class="section-head"><h2>Clases de «${esc(op.nombre)}»</h2><span>Toco una clase para editarla</span></div>
    ${orden.length ? `<div class="lista">${orden.map(c => tarjetaClase(c, r)).join("")}</div>`
      : `<p class="pista">Esta opción todavía no tiene clases. Toco «＋ Agregar clase» para empezar.</p>`}`);
}

function dibujar() {
  guardar();
  const op = opcionActiva(), r = op ? analizar(op) : null;
  dibujarOpciones(op); dibujarResumen(op, r); dibujarCuadricula(op, r); dibujarLista(op, r);
}

// ============ 5. FORMULARIO DE CLASE ============
const pildora = (campo, valor, txt) => `<button type="button" class="pil ${borrador[campo] === valor ? "on" : ""}" data-campo="${campo}" data-valor="${valor}">${txt}</button>`;

// Hora con dos <select> (hora y minutos): en iPad funcionan mejor que <input type="time">
function selectorHora(nombre, min) {
  const h = Math.floor(min / 60), m = min % 60;
  let horas = "", mins = "";
  for (let i = 6; i <= 22; i++) horas += `<option value="${i}" ${i === h ? "selected" : ""}>${horaCorta(i)}</option>`;
  for (let i = 0; i < 60; i += 5) mins += `<option value="${i}" ${i === m ? "selected" : ""}>:${String(i).padStart(2, "0")}</option>`;
  return `<div class="hora"><select id="f-${nombre}-h" aria-label="Hora">${horas}</select><select id="f-${nombre}-m" aria-label="Minutos">${mins}</select></div>`;
}
const leerHora = nombre => Number($(`f-${nombre}-h`).value) * 60 + Number($(`f-${nombre}-m`).value);
function ponerHora(nombre, min) { $(`f-${nombre}-h`).value = Math.floor(min / 60); $(`f-${nombre}-m`).value = min % 60; }

function abrirForm(clase) {
  borrador = clase ? JSON.parse(JSON.stringify(clase))
    : { id: null, materia: "", profesor: "", modo: "presencial", aula: "", dias: [], ini: 7 * 60, fin: 8 * 60 + 50, estado: "confirmar", notas: "" };
  const b = borrador;
  poner("materias", materiasDe(actual).map(n => `<option value="${esc(n)}">`).join(""));
  poner("form", `
    <h2>${b.id ? "Editar clase" : "Nueva clase"}</h2>
    <label class="campo ancho">Materia
      <input id="f-materia" list="materias" value="${esc(b.materia)}" placeholder="Escribo para buscar…" autocomplete="off"></label>
    <label class="campo ancho">Profesor(a)
      <input id="f-profesor" value="${esc(b.profesor)}" placeholder="Opcional"></label>
    <div class="campo ancho">Modalidad
      <div class="pildoras">${pildora("modo", "presencial", "🏫 Presencial")}${pildora("modo", "virtual", "💻 Virtual")}</div></div>
    <label class="campo ancho" id="f-aula-box" ${b.modo === "virtual" ? "hidden" : ""}>Aula
      <input id="f-aula" value="${esc(b.aula)}" placeholder="Ej.: A-204"></label>
    <div class="campo ancho">Días
      <div class="pildoras">${DIAS.map((d, i) => `<button type="button" class="pil ${b.dias.includes(i) ? "on" : ""}" data-dia="${i}">${d}</button>`).join("")}</div></div>
    <div class="campo">Empieza ${selectorHora("ini", b.ini)}</div>
    <div class="campo">Termina ${selectorHora("fin", b.fin)}</div>
    <div class="campo ancho">Disponibilidad
      <div class="pildoras">${Object.keys(ESTADOS).map(k => pildora("estado", k, ESTADOS[k])).join("")}</div></div>
    <label class="campo ancho">Notas
      <textarea id="f-notas" rows="2" placeholder="Opcional">${esc(b.notas)}</textarea></label>
    <p class="error ancho" id="f-error"></p>
    <div class="botones ancho">
      ${b.id ? `<button type="button" class="btn peligro" data-borrar-clase>Eliminar clase</button>` : ""}
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
  const b = borrador, op = opcionActiva();
  b.materia = $("f-materia").value.trim();
  b.profesor = $("f-profesor").value.trim();
  b.aula = $("f-aula").value.trim();
  b.notas = $("f-notas").value.trim();
  b.ini = leerHora("ini"); b.fin = leerHora("fin");
  const error = !b.materia ? "Me falta el nombre de la materia."
    : !b.dias.length ? "Me falta elegir al menos un día."
    : b.fin <= b.ini ? "La hora de fin tiene que ser después de la de inicio." : "";
  if (error) { texto("f-error", error); return; }
  b.dias.sort((x, y) => x - y);
  if (b.id) op.clases[op.clases.findIndex(c => c.id === b.id)] = b;
  else { b.id = nuevoId(); op.clases.push(b); }
  cerrarForm(); dibujar();
}

// "Opción A", "Opción B"… la primera letra que no esté usada
function nombreLibre(p) {
  for (const l of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") { const n = "Opción " + l; if (!p.opciones.some(o => o.nombre === n)) return n; }
  return "Opción " + (p.opciones.length + 1);
}

// ============ 6. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);
  const p = per(), op = opcionActiva();

  // --- formulario ---
  if (borrador) {
    if (en("[data-dia]")) {
      const d = Number(en("[data-dia]").dataset.dia), i = borrador.dias.indexOf(d);
      if (i >= 0) borrador.dias.splice(i, 1); else borrador.dias.push(d);
      en("[data-dia]").classList.toggle("on", i < 0);
    }
    else if (en("[data-campo]")) {
      const btn = en("[data-campo]"), campo = btn.dataset.campo;
      borrador[campo] = btn.dataset.valor;
      document.querySelectorAll(`[data-campo="${campo}"]`).forEach(x => x.classList.toggle("on", x === btn));
      if (campo === "modo") $("f-aula-box").hidden = borrador.modo === "virtual";
    }
    else if (en("[data-borrar-clase]")) {
      if (confirm(`¿Eliminar «${borrador.materia}» de esta opción?`)) { op.clases = op.clases.filter(c => c.id !== borrador.id); cerrarForm(); dibujar(); }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarForm();   // Cancelar o tocar fuera
    return;
  }

  // --- página ---
  if (en("[data-op]")) { p.activa = en("[data-op]").dataset.op; dibujar(); }
  else if (en("[data-nueva]")) {
    const o = { id: nuevoId(), nombre: nombreLibre(p), clases: [] };
    p.opciones.push(o); p.activa = o.id; dibujar();
  }
  else if (!op) return;
  else if (en("[data-agregar]")) abrirForm(null);
  else if (en("[data-clase]")) abrirForm(op.clases.find(c => c.id === en("[data-clase]").dataset.clase));
  else if (en("[data-elegir]")) { p.elegida = p.elegida === op.id ? null : op.id; dibujar(); }   // solo una elegida
  else if (en("[data-renombrar]")) {
    const n = prompt("Nuevo nombre para esta opción:", op.nombre);
    if (n && n.trim()) { op.nombre = n.trim().slice(0, 40); dibujar(); }
  }
  else if (en("[data-duplicar]")) {
    const copia = JSON.parse(JSON.stringify(op));
    copia.id = nuevoId(); copia.nombre = op.nombre + " (copia)";
    copia.clases.forEach(c => { c.id = nuevoId(); });
    p.opciones.splice(p.opciones.indexOf(op) + 1, 0, copia);
    p.activa = copia.id; dibujar();
  }
  else if (en("[data-eliminar]")) {
    const n = op.clases.length;
    if (confirm(`¿Eliminar «${op.nombre}»${n ? ` y sus ${n} ${n === 1 ? "clase" : "clases"}` : ""}?`)) {
      p.opciones = p.opciones.filter(o => o !== op);
      if (p.elegida === op.id) p.elegida = null;
      p.activa = p.opciones[0] ? p.opciones[0].id : null;
      dibujar();
    }
  }
});

document.addEventListener("change", ev => {
  if (ev.target.id === "periodo") { actual = ev.target.value; dibujar(); }
  // si cambias la hora de inicio y queda después del fin, el fin se mueve solo (+1 h 50 min)
  else if (/^f-ini-/.test(ev.target.id) && leerHora("fin") <= leerHora("ini")) ponerHora("fin", Math.min(leerHora("ini") + 110, 22 * 60 + 55));
});

$("form").addEventListener("submit", ev => { ev.preventDefault(); guardarForm(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && borrador) cerrarForm(); });

// ============ 7. INICIO ============
dibujarPeriodos();
dibujar();
