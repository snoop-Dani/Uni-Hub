// ============ 1. TU MALLA ============
// La lista de materias (PLAN_BASE) está en malla.js, que se carga antes que este archivo.
const COLS = ["berry", "keen", "cherry", "moss"];

// ============ 2. UTILIDADES Y ESTADO (se guarda en el navegador) ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const texto = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const CAT = {};                                       // id → { nombre, lab, nota }
PLAN_BASE.forEach(c => c.m.forEach(x => { CAT[x[0]] = { nombre: x[1], lab: !!x[2], nota: x[3] || "" }; }));
const total = Object.keys(CAT).length;
const clonarBase = () => PLAN_BASE.map(c => ({ p: c.p, a: c.a, ids: c.m.map(x => x[0]) }));

function planValido(p) {                              // cada materia debe estar exactamente una vez
  if (!Array.isArray(p) || !p.length) return false;
  const vistos = new Set();
  for (const c of p) {
    if (!c || !Array.isArray(c.ids)) return false;
    for (const id of c.ids) { if (!CAT[id] || vistos.has(id)) return false; vistos.add(id); }
  }
  return vistos.size === total;
}
// Si en malla.js se agregan materias nuevas, se añaden a tu orden guardado
// (en su cuatrimestre original) para no perder lo que ya reordenaste
function completarPlan(p) {
  if (!Array.isArray(p) || p.length !== PLAN_BASE.length || !p.every(c => c && Array.isArray(c.ids))) return;
  const tiene = new Set(p.flatMap(c => c.ids));
  PLAN_BASE.forEach((c, i) => c.m.forEach(x => { if (!tiene.has(x[0])) p[i].ids.push(x[0]); }));
}
let plan = null, aprobadas = {};
try { plan = JSON.parse(localStorage.getItem("carrera-plan")); } catch (e) {}
try { aprobadas = JSON.parse(localStorage.getItem("carrera-aprobadas")) || {}; } catch (e) {}
completarPlan(plan);
if (!planValido(plan)) plan = clonarBase();

let editando = false, sel = null, anterior = null;   // modo reordenar · materia elegida · plan antes del último cambio

const aprobadasN = () => Object.keys(CAT).filter(id => aprobadas[id]).length;
function guardar() {
  const n = aprobadasN(), pct = Math.round(100 * n / total);
  try {
    localStorage.setItem("carrera-plan", JSON.stringify(plan));
    localStorage.setItem("carrera-aprobadas", JSON.stringify(aprobadas));
    localStorage.setItem("carrera-resumen", JSON.stringify({ n, total, pct }));   // el Uni-Hub lee esto
  } catch (e) {}
}

// ============ 3. DIBUJAR ============
const RADIO = 54, CIRC = 2 * Math.PI * RADIO;

function dibujarResumen() {           // se dibuja una vez; después solo se actualizan los números
  poner("resumen", `
    <h2>Mi avance</h2>
    <div class="donut">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle class="pista" cx="70" cy="70" r="${RADIO}"/>
        <circle class="arco" id="arco" cx="70" cy="70" r="${RADIO}" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" transform="rotate(-90 70 70)"/>
      </svg>
      <div class="centro"><b id="pct">0%</b><span>de la carrera</span></div>
    </div>
    <ul class="leyenda">
      <li><i class="p aprob"></i><b id="n-ok">0</b> materias aprobadas</li>
      <li><i class="p falta"></i><b id="n-falta">0</b> por cursar</li>
    </ul>
    <p class="meta" id="hito"></p>
    <div class="acciones">
      <button class="btn grande" id="b-editar" data-editar>✏️ Reordenar materias</button>
      <button class="btn" id="b-deshacer" data-deshacer disabled>↶ Deshacer</button>
      <button class="btn" data-restaurar>Orden original</button>
      <button class="btn ancho" data-reiniciar>Borrar mis marcas</button>
    </div>`);
}

function actualizarResumen() {
  const n = aprobadasN(), pct = Math.round(100 * n / total), mitad = Math.ceil(total / 2);
  const arco = $("arco");
  if (arco) { arco.style.strokeDashoffset = CIRC * (1 - n / total); arco.style.opacity = n ? 1 : 0; }
  texto("pct", pct + "%"); texto("n-ok", n); texto("n-falta", total - n);
  texto("hito", n === total ? "🎉 ¡Completé todas las materias! Ahora reviso los requisitos de graduación: inglés B2, 150 h de TCU y sellos verdes."
    : n >= mitad ? "✓ Ya pasé el 50 %: puedo matricular Experiencia profesional I y el Trabajo comunal universitario."
    : `Me faltan ${mitad - n} materias para el 50 %, requisito para matricular Experiencia profesional I y el Trabajo comunal universitario.`);
  const be = $("b-editar"); if (be) { be.textContent = editando ? "✓ Terminar de reordenar" : "✏️ Reordenar materias"; be.classList.toggle("verde", editando); }
  const bd = $("b-deshacer"); if (bd) bd.disabled = !anterior;
  texto("ayuda", !editando ? "Toco una materia para marcarla como aprobada"
    : sel ? `Moviendo «${CAT[sel].nombre}»: toco otra materia (para ponerla antes) o “＋ Poner aquí” en un cuatrimestre`
    : "Modo reordenar: toco la materia que quiero mover");
}

const codigo = id => /^\d\d-\d{4}$/.test(id) ? id : "";
function materia(id) {
  const m = CAT[id], ok = !!aprobadas[id];
  return `<li><button class="materia ${ok ? "ok" : ""} ${m.lab ? "lab" : ""} ${sel === id ? "sel" : ""}" data-id="${id}" aria-pressed="${ok}">
    <span class="check">${ok ? "✓" : ""}</span>
    <span class="txt"><b>${m.lab ? '<i class="tag">LAB</i>' : ""}${esc(m.nombre)}</b>${m.nota || codigo(id) ? `<small>${[codigo(id), m.nota].filter(Boolean).map(esc).join(" · ")}</small>` : ""}</span>
  </button></li>`;
}

function tarjeta(c, i) {
  const hechas = c.ids.filter(id => aprobadas[id]).length, todas = c.ids.length > 0 && hechas === c.ids.length, poner_ = editando && sel;
  return `
  <article class="cuatri c-${COLS[i % 4]} ${todas ? "completo" : ""}">
    <header ${poner_ ? `data-destino="${i}"` : ""}>
      <h3>${c.p} Cuatrimestre ${c.a}</h3>
      ${editando ? "" : `<button class="todo" data-todo="${i}">${todas ? "Desmarcar todo" : "Marcar todo"}</button>`}
    </header>
    <div class="barra"><i style="width:${c.ids.length ? 100 * hechas / c.ids.length : 0}%"></i></div>
    <p class="cuenta">${hechas}/${c.ids.length} materias</p>
    <ul>${c.ids.map(materia).join("")}${poner_ ? `<li><button class="destino" data-destino="${i}">＋ Poner aquí</button></li>` : ""}</ul>
  </article>`;
}

function dibujarCuatris() {
  const g = $("cuatris");
  if (g) g.parentElement.classList.toggle("editando", editando);
  poner("cuatris", plan.map(tarjeta).join(""));
}

function dibujar() { guardar(); dibujarCuatris(); actualizarResumen(); }

// ============ 4. REORDENAR ============
function mover(id, colDestino, antesDe) {
  anterior = JSON.stringify(plan);
  plan.forEach(c => { c.ids = c.ids.filter(x => x !== id); });
  if (antesDe) { const c = plan.find(c => c.ids.includes(antesDe)); c.ids.splice(c.ids.indexOf(antesDe), 0, id); }
  else plan[colDestino].ids.push(id);
  sel = null;
  dibujar();
}

// ============ 5. EVENTOS ============
document.addEventListener("click", ev => {
  const c = ev.target.closest("[data-id]"), d = ev.target.closest("[data-destino]");
  if (ev.target.closest("[data-editar]")) { editando = !editando; sel = null; dibujar(); }
  else if (ev.target.closest("[data-deshacer]")) { if (anterior) { plan = JSON.parse(anterior); anterior = null; sel = null; dibujar(); } }
  else if (ev.target.closest("[data-restaurar]")) {
    if (confirm("¿Volver al orden original de mi malla? (mis materias aprobadas no cambian)")) { anterior = JSON.stringify(plan); plan = clonarBase(); sel = null; dibujar(); }
  }
  else if (ev.target.closest("[data-reiniciar]")) { if (confirm("¿Borrar todas mis marcas de materias aprobadas?")) { aprobadas = {}; dibujar(); } }
  else if (!editando && ev.target.closest("[data-todo]")) {
    const lista = plan[Number(ev.target.closest("[data-todo]").dataset.todo)].ids, todas = lista.length > 0 && lista.every(id => aprobadas[id]);
    lista.forEach(id => { if (todas) delete aprobadas[id]; else aprobadas[id] = true; });
    dibujar();
  }
  else if (editando && d && sel) mover(sel, Number(d.dataset.destino), null);
  else if (editando && c) {
    const id = c.dataset.id;
    if (!sel) sel = id; else if (sel === id) sel = null; else { mover(sel, null, id); return; }
    dibujarCuatris(); actualizarResumen();
  }
  else if (!editando && c) { const id = c.dataset.id; if (aprobadas[id]) delete aprobadas[id]; else aprobadas[id] = true; dibujar(); }
});

// ============ 6. INICIO ============
dibujarResumen();
dibujar();
