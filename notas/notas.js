// ============ 1. CUATRIMESTRES Y MATERIAS (salen de tu malla: ../carrera/malla.js) ============
const INICIO = { I: 0, II: 4, III: 8 };                    // mes en que empieza cada cuatrimestre (0 = enero)
const MESES = { I: "ene–abr", II: "may–ago", III: "sep–dic" };
const PERIODOS = PLAN_BASE.map((c, i) => ({ clave: `${c.p}-${c.a}`, nombre: `${c.p} ${c.a}`, meses: MESES[c.p], inicio: new Date(c.a, INICIO[c.p], 1), i }));
const NOMBRE = {};                                          // código → nombre de la materia
PLAN_BASE.forEach(c => c.m.forEach(x => { NOMBRE[x[0]] = x[1]; }));
const COLS = ["berry", "keen", "cherry", "moss"];
const META = 70;                                            // nota mínima para aprobar en ULACIT (cada materia la puede cambiar)

// El cuatrimestre que estás cursando ahora (el último que ya empezó)
function periodoEnCurso() {
  const hoy = new Date(), empezados = PERIODOS.filter(p => p.inicio <= hoy);
  return (empezados[empezados.length - 1] || PERIODOS[0]).clave;
}
const buscarPeriodo = clave => PERIODOS.find(p => p.clave === clave);

// ============ 2. UTILIDADES Y ESTADO (se guarda en el navegador) ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const leerJSON = clave => { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } };

// "85,5" o "85.5" → 85.5 · vacío → null · siempre entre 0 y 100
const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : Math.min(100, Math.max(0, n)); };
// 84.25 → "84,3" (un decimal, con coma)
const fmt = n => String(Math.round(n * 10) / 10).replace(".", ",");
// La misma materia tiene siempre el mismo color (igual que en Horarios)
const colorDe = nombre => COLS[[...nombre.toLowerCase()].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLS.length];

// db = { periodos: { "III-2026": { materias: [{ id, nombre, meta, evals: [{ id, nombre, peso, nota }] }] } } }
// peso y nota van de 0 a 100; nota = null significa "todavía no la tengo"
let db = leerJSON("notas-db");
if (!db || typeof db.periodos !== "object" || !db.periodos) db = { periodos: {} };

let actual = periodoEnCurso();   // cuatrimestre que estás viendo
let abierta = null;              // id de la materia abierta en la hoja

function datos(clave = actual) {
  const p = db.periodos[clave] || (db.periodos[clave] = { materias: [] });
  if (!Array.isArray(p.materias)) p.materias = [];
  return p;
}
const buscarMateria = id => datos().materias.find(m => m.id === id);

// ============ 3. CÁLCULOS ============
function calcular(m) {
  const conNota = m.evals.filter(e => e.nota !== null && e.peso);
  const evaluado = conNota.reduce((s, e) => s + e.peso, 0);               // % que ya me calificaron
  const puntos = conNota.reduce((s, e) => s + e.nota * e.peso / 100, 0);  // puntos que ya gané (de 100)
  const pesoTotal = m.evals.reduce((s, e) => s + (e.peso || 0), 0);       // deberían sumar 100
  const falta = Math.max(0, 100 - evaluado);                              // % que todavía no me califican
  const promedio = evaluado ? puntos / evaluado * 100 : null;             // cómo voy en lo evaluado
  const necesito = falta ? (m.meta - puntos) / falta * 100 : null;        // promedio que necesito en lo que falta
  const estado = !m.evals.length ? "vacia"
    : puntos >= m.meta ? "asegurada"          // aunque saque 0 en lo que falta, ya llego
    : !falta ? "perdida"                      // ya no queda nada por evaluar y no llegué
    : necesito > 100 ? "riesgo"               // ni con 100 en todo lo que falta llego
    : "en-curso";
  return { evaluado, puntos, pesoTotal, falta, promedio, necesito, estado };
}

function mensaje(m, r) {
  if (r.estado === "vacia") return "Toco aquí para agregar mis evaluaciones";
  if (r.estado === "asegurada") return r.falta ? `✓ Ya aseguré el ${fmt(m.meta)}, aunque falte el ${fmt(r.falta)} %` : `✓ Terminé con ${fmt(r.puntos)}: llegué a mi meta de ${fmt(m.meta)}`;
  if (r.estado === "perdida") return `⚠ Terminé con ${fmt(r.puntos)}: no llegué al ${fmt(m.meta)}`;
  if (r.estado === "riesgo") return `⚠ Necesitaría ${fmt(r.necesito)} en el ${fmt(r.falta)} % que falta: ya no alcanza para el ${fmt(m.meta)}`;
  return `Necesito un promedio de ${fmt(Math.max(0, r.necesito))} en el ${fmt(r.falta)} % que falta para llegar a ${fmt(m.meta)}`;
}

function resumen(clave) {
  const ms = datos(clave).materias, rs = ms.map(calcular);
  const conProm = rs.filter(r => r.promedio !== null);
  return {
    materias: ms.length,
    promedio: conProm.length ? Math.round(10 * conProm.reduce((s, r) => s + r.promedio, 0) / conProm.length) / 10 : null,
    aseguradas: rs.filter(r => r.estado === "asegurada").length,
    riesgo: rs.filter(r => r.estado === "riesgo" || r.estado === "perdida").length
  };
}

function guardar() {
  const clave = periodoEnCurso(), r = resumen(clave);
  try {
    localStorage.setItem("notas-db", JSON.stringify(db));
    // el Uni-Hub lee esto (siempre sobre el cuatrimestre en curso)
    localStorage.setItem("notas-resumen", JSON.stringify({ periodo: buscarPeriodo(clave).nombre, materias: r.materias, promedio: r.promedio, riesgo: r.riesgo }));
  } catch (e) {}
}

// Materias que te sugiero agregar: las de tu horario ★ (Horarios) y las de ese cuatrimestre en tu malla (Mi carrera)
function sugerencias() {
  const per = buscarPeriodo(actual), lista = [];
  const h = leerJSON("horarios-db"), ph = h && h.periodos && h.periodos[actual];
  const elegida = ph && Array.isArray(ph.opciones) && ph.opciones.find(o => o.id === ph.elegida);
  if (elegida && Array.isArray(elegida.clases)) elegida.clases.filter(c => c.estado !== "sincupo").forEach(c => lista.push(c.materia));
  let ids = PLAN_BASE[per.i].m.map(x => x[0]);
  const plan = leerJSON("carrera-plan"), c = Array.isArray(plan) && plan[per.i];
  if (c && c.p === PLAN_BASE[per.i].p && c.a === PLAN_BASE[per.i].a && Array.isArray(c.ids)) ids = c.ids;
  ids.forEach(id => lista.push(NOMBRE[id]));
  const ya = new Set(datos().materias.map(m => m.nombre.toLowerCase()));
  return [...new Set(lista)].filter(n => n && !ya.has(n.toLowerCase()));
}

// ============ 4. DIBUJAR ============
function dibujarPeriodos() {
  const hoy = periodoEnCurso();
  poner("periodo", PERIODOS.map(p => `<option value="${p.clave}" ${p.clave === actual ? "selected" : ""}>${p.nombre} · ${p.meses}${p.clave === hoy ? " (en curso)" : ""}</option>`).join(""));
  poner("catalogo", Object.values(NOMBRE).map(n => `<option value="${esc(n)}">`).join(""));
}

function dibujarResumen() {
  const r = resumen(actual);
  poner("stats", `
    <div class="stat"><b>${r.materias}</b><span>${r.materias === 1 ? "materia" : "materias"}</span></div>
    <div class="stat"><b>${r.promedio === null ? "—" : fmt(r.promedio)}</b><span>mi promedio actual</span></div>
    <div class="stat"><b>${r.aseguradas}</b><span>${r.aseguradas === 1 ? "asegurada" : "aseguradas"}</span></div>
    <div class="stat ${r.riesgo ? "alerta" : ""}"><b>${r.riesgo ? "⚠ " + r.riesgo : 0}</b><span>en riesgo</span></div>`);
}

function dibujarSugerencias() {
  const s = sugerencias();
  poner("sugerencias", s.length ? `<small>Sugerencias para el ${buscarPeriodo(actual).nombre} (de mi horario ★ y mi malla):</small>`
    + s.map(n => `<button class="sug" data-sugerencia="${esc(n)}">＋ ${esc(n)}</button>`).join("") : "");
}

function tarjeta(m) {
  const r = calcular(m), mal = r.estado === "riesgo" || r.estado === "perdida";
  return `<button class="materia c-${colorDe(m.nombre)} ${mal ? "riesgo" : ""}" data-materia="${m.id}">
    <span class="m-top"><b>${esc(m.nombre)}</b>
      <span class="m-nota"><strong>${r.promedio === null ? "—" : fmt(r.promedio)}</strong><small>promedio actual</small></span></span>
    <span class="barra"><i style="width:${Math.min(100, r.evaluado)}%"></i></span>
    <span class="m-info">Evaluado ${fmt(r.evaluado)} % · llevo ${fmt(r.puntos)} de 100 puntos · meta ${fmt(m.meta)}</span>
    <p class="m-msg">${mensaje(m, r)}</p>
  </button>`;
}

function dibujarMaterias() {
  const ms = datos().materias;
  poner("materias", `
    <div class="section-head"><h2>Mis materias del ${buscarPeriodo(actual).nombre}</h2><span>Toco una materia para ver y editar sus evaluaciones</span></div>
    ${ms.length ? `<div class="lista">${ms.map(tarjeta).join("")}</div>`
      : `<p class="pista">Todavía no tengo materias en este cuatrimestre. Las agrego arriba.</p>`}`);
}

function dibujar() { guardar(); dibujarResumen(); dibujarSugerencias(); dibujarMaterias(); }

// ============ 5. HOJA: EVALUACIONES DE UNA MATERIA ============
const fila = e => `
  <div class="fila" data-eval="${e.id}">
    <input data-campo="nombre" value="${esc(e.nombre)}" placeholder="Ej.: Parcial I" aria-label="Evaluación">
    <input class="n" data-campo="peso" value="${e.peso === null ? "" : fmt(e.peso)}" inputmode="decimal" placeholder="%" aria-label="Porcentaje">
    <input class="n" data-campo="nota" value="${e.nota === null ? "" : fmt(e.nota)}" inputmode="decimal" placeholder="—" aria-label="Mi nota">
    <button class="quitar" data-quitar="${e.id}" aria-label="Quitar evaluación">×</button>
  </div>`;

function abrirHoja(id) {
  const m = buscarMateria(id);
  if (!m) return;
  abierta = id;
  poner("hoja-contenido", `
    <h2>${esc(m.nombre)}</h2>
    <div class="campos">
      <label class="campo">Materia<input id="f-nombre" value="${esc(m.nombre)}"></label>
      <label class="campo">Mi meta<input id="f-meta" class="n" value="${fmt(m.meta)}" inputmode="decimal"></label>
    </div>
    <div class="evals">
      <div class="fila titulos"><span>Evaluación</span><span>%</span><span>Mi nota</span><span></span></div>
      <div class="evals" id="filas">${m.evals.map(fila).join("")}</div>
      <button class="btn" data-agregar-eval>＋ Agregar evaluación</button>
    </div>
    <div class="calc" id="calc"></div>
    <div class="botones">
      <button class="btn peligro" data-borrar-materia>Eliminar materia</button>
      <button class="btn verde" data-cerrar>Listo</button>
    </div>`);
  dibujarCalculo();
  $("hoja").hidden = false;
  document.body.classList.add("sin-scroll");
}

// Explicación de la cuenta (se actualiza mientras escribo)
function dibujarCalculo() {
  const m = buscarMateria(abierta), r = calcular(m);
  const aviso = m.evals.length && Math.abs(r.pesoTotal - 100) > 0.01
    ? `<br><span class="alerta">Mis porcentajes suman ${fmt(r.pesoTotal)} % (deberían sumar 100 %).</span>` : "";
  const clase = r.estado === "asegurada" ? "ok" : r.estado === "riesgo" || r.estado === "perdida" ? "alerta" : "";
  poner("calc", !m.evals.length ? "Agrego cada evaluación con su porcentaje. Si todavía no tengo la nota, la dejo vacía."
    : `Promedio en lo evaluado: <b>${r.promedio === null ? "—" : fmt(r.promedio)}</b> · Evaluado: <b>${fmt(r.evaluado)} %</b> · Puntos: <b>${fmt(r.puntos)} de 100</b><br>
       <span class="${clase}">${mensaje(m, r)}</span>${aviso}`);
}

function cerrarHoja() {
  abierta = null;
  $("hoja").hidden = true;
  document.body.classList.remove("sin-scroll");
  dibujar();
}

function agregarMateria(nombre) {
  nombre = nombre.trim();
  if (!nombre) return;
  const p = datos();
  if (p.materias.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())) return;
  p.materias.push({ id: nuevoId(), nombre, meta: META, evals: [] });
  dibujar();
}

// ============ 6. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);

  // --- hoja ---
  if (abierta) {
    const m = buscarMateria(abierta);
    if (en("[data-agregar-eval]")) {
      const e = { id: nuevoId(), nombre: "", peso: null, nota: null };
      m.evals.push(e);
      $("filas").insertAdjacentHTML("beforeend", fila(e));
      $("filas").lastElementChild.querySelector("input").focus();
      guardar(); dibujarCalculo();
    }
    else if (en("[data-quitar]")) {
      const id = en("[data-quitar]").dataset.quitar;
      m.evals = m.evals.filter(e => e.id !== id);
      en("[data-eval]").remove();
      guardar(); dibujarCalculo();
    }
    else if (en("[data-borrar-materia]")) {
      if (confirm(`¿Eliminar «${m.nombre}» y sus evaluaciones?`)) {
        datos().materias = datos().materias.filter(x => x.id !== m.id);
        cerrarHoja();
      }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarHoja();   // Listo o tocar fuera
    return;
  }

  // --- página ---
  if (en("[data-sugerencia]")) agregarMateria(en("[data-sugerencia]").dataset.sugerencia);
  else if (en("[data-materia]")) abrirHoja(en("[data-materia]").dataset.materia);
});

// Lo que escribo en la hoja se guarda al momento
document.addEventListener("input", ev => {
  const t = ev.target, m = abierta && buscarMateria(abierta);
  if (!m) return;
  if (t.id === "f-nombre") { if (t.value.trim()) m.nombre = t.value.trim(); }
  else if (t.id === "f-meta") { const n = num(t.value); if (n !== null) m.meta = n; }
  else if (t.dataset.campo) {
    const e = m.evals.find(x => x.id === t.closest("[data-eval]").dataset.eval);
    e[t.dataset.campo] = t.dataset.campo === "nombre" ? t.value : num(t.value);
  }
  guardar(); dibujarCalculo();
});

document.addEventListener("change", ev => {
  if (ev.target.id === "periodo") { actual = ev.target.value; dibujar(); }
});

$("agregar").addEventListener("submit", ev => {
  ev.preventDefault();
  agregarMateria($("nueva").value);
  $("nueva").value = "";
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && abierta) cerrarHoja(); });

// ============ 7. INICIO ============
dibujarPeriodos();
dibujar();
