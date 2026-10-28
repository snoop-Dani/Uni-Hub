// ============ 1. CUATRIMESTRES (salen de tu malla: ../carrera/malla.js) ============
const INICIO = { I: 0, II: 4, III: 8 };                    // mes en que empieza cada cuatrimestre (0 = enero)
const MESES_P = { I: "ene–abr", II: "may–ago", III: "sep–dic" };
const PERIODOS = PLAN_BASE.map(c => ({ clave: `${c.p}-${c.a}`, nombre: `${c.p} ${c.a}`, meses: MESES_P[c.p], inicio: new Date(c.a, INICIO[c.p], 1) }));
const DIAS_SEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const COLS = ["berry", "keen", "cherry", "moss"];

// El cuatrimestre que estás cursando ahora (el último que ya empezó)
function periodoEnCurso() {
  const hoy = new Date(), empezados = PERIODOS.filter(p => p.inicio <= hoy);
  return (empezados[empezados.length - 1] || PERIODOS[0]).clave;
}
const buscarPeriodo = clave => PERIODOS.find(p => p.clave === clave);

// ============ 2. UTILIDADES ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const texto = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const leerJSON = clave => { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } };
const dd = n => String(n).padStart(2, "0");

// ---------- Fechas (guardadas como "2026-11-05") ----------
const aISO = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
const deISO = s => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const hoyISO = () => aISO(new Date());
const diasHasta = iso => Math.round((deISO(iso) - deISO(hoyISO())) / 86400000);
const fechaCorta = iso => { const d = deISO(iso); return `${DIAS_SEM[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const fechaLarga = iso => `${fechaCorta(iso)} ${deISO(iso).getFullYear()}`;
// sumar meses sin pasarse de mes (31 ene + 1 mes = 28 feb)
function sumarMeses(iso, n) {
  const [a, m, d] = iso.split("-").map(Number), ultimo = new Date(a, m - 1 + n + 1, 0).getDate();
  return aISO(new Date(a, m - 1 + n, Math.min(d, ultimo)));
}
function cuando(iso) {
  const d = diasHasta(iso);
  if (d < 0) return `hace ${-d} ${d === -1 ? "día" : "días"}`;
  return d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`;
}

// ---------- Dinero ----------
// Entiende "150000", "150.000", "150 000", "1.250.000" y "25,50" (coma o punto para decimales)
function leerMonto(v) {
  const s = String(v).replace(/[^\d.,]/g, "");
  if (!s) return null;
  const ultimo = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  let n;
  if (ultimo >= 0 && s.length - ultimo - 1 <= 2) n = parseFloat(s.slice(0, ultimo).replace(/[.,]/g, "") + "." + s.slice(ultimo + 1));
  else n = parseFloat(s.replace(/[.,]/g, ""));
  return isNaN(n) ? null : n;
}
const dinero = n => db.moneda + (Math.round(n * 100) / 100).toLocaleString("es-CR", { maximumFractionDigits: 2 });
const montoTexto = n => n === null || n === undefined ? "" : (Math.round(n * 100) / 100).toLocaleString("es-CR", { maximumFractionDigits: 2 });

// ============ 3. ESTADO (se guarda en el navegador) ============
// db = { moneda: "₡" | "$", periodos: { "III-2026": {
//   conceptos: [{ id, nombre, tipo: "cargo" | "descuento", monto, porcentaje (solo descuentos: true = el monto es un %) }],
//   cuotas:    [{ id, nombre, fecha, monto, pagada, pagadaEn }],
//   fechas:    [{ id, nombre, fecha }] } } }
let db = leerJSON("pagos-db");
if (!db || typeof db.periodos !== "object" || !db.periodos) db = { moneda: "₡", periodos: {} };
if (db.moneda !== "$") db.moneda = "₡";

let actual = periodoEnCurso();   // cuatrimestre que estás viendo
let borrador = null;             // lo que se está editando en la hoja: { tipo: "concepto" | "cuota" | "fecha" | "dividir", ... }

function datos() {
  const p = db.periodos[actual] || (db.periodos[actual] = {});
  ["conceptos", "cuotas", "fechas"].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
  return p;
}
function guardar() { try { localStorage.setItem("pagos-db", JSON.stringify(db)); } catch (e) {} }

// ============ 4. CÁLCULOS ============
function calcular(p) {
  const cargos = p.conceptos.filter(c => c.tipo === "cargo").reduce((s, c) => s + (c.monto || 0), 0);
  const descuentos = p.conceptos.filter(c => c.tipo === "descuento").reduce((s, c) => s + (c.porcentaje ? cargos * (c.monto || 0) / 100 : (c.monto || 0)), 0);
  const enCuotas = p.cuotas.reduce((s, q) => s + (q.monto || 0), 0);
  const total = p.conceptos.length ? Math.max(0, cargos - descuentos) : enCuotas;   // sin costos anotados, el total sale de los pagos
  const pagado = p.cuotas.filter(q => q.pagada).reduce((s, q) => s + (q.monto || 0), 0);
  const pendientes = p.cuotas.filter(q => !q.pagada).sort((a, b) => a.fecha.localeCompare(b.fecha));
  return {
    cargos, descuentos, total, enCuotas, pagado,
    pendiente: Math.max(0, total - pagado),
    sinPlan: total - enCuotas,                                   // lo que todavía no está en ningún pago
    vencidas: pendientes.filter(q => diasHasta(q.fecha) < 0),
    proxima: pendientes.find(q => diasHasta(q.fecha) >= 0) || null
  };
}

// Materias de mi horario ★ de este cuatrimestre (para agregarlas como cargos)
function materiasHorario() {
  const h = leerJSON("horarios-db"), ph = h && h.periodos && h.periodos[actual];
  const el = ph && Array.isArray(ph.opciones) && ph.opciones.find(o => o.id === ph.elegida);
  const ya = new Set(datos().conceptos.map(c => c.nombre.toLowerCase()));
  return el && Array.isArray(el.clases) ? [...new Set(el.clases.filter(c => c.estado !== "sincupo").map(c => c.materia))].filter(n => !ya.has(n.toLowerCase())) : [];
}

// ============ 5. DIBUJAR ============
function dibujarPeriodos() {
  const hoy = periodoEnCurso();
  poner("periodo", PERIODOS.map(p => `<option value="${p.clave}" ${p.clave === actual ? "selected" : ""}>${p.nombre} · ${p.meses}${p.clave === hoy ? " (en curso)" : ""}</option>`).join(""));
}

function dibujarResumen(r) {
  const v = r.vencidas.length;
  const prox = v ? `<div class="stat alerta"><b>⚠ ${v} ${v === 1 ? "pago vencido" : "pagos vencidos"}</b><span>${dinero(r.vencidas.reduce((s, q) => s + q.monto, 0))} sin pagar</span></div>`
    : r.proxima ? `<div class="stat"><b>${dinero(r.proxima.monto)}</b><span>próximo pago: ${fechaCorta(r.proxima.fecha)} (${cuando(r.proxima.fecha)})</span></div>`
    : `<div class="stat"><b>—</b><span>no tengo pagos pendientes</span></div>`;
  poner("stats", `
    <div class="stat"><b>${dinero(r.total)}</b><span>total del cuatrimestre</span></div>
    <div class="stat"><b>${dinero(r.pagado)}</b><span>ya pagué</span></div>
    <div class="stat"><b>${dinero(r.pendiente)}</b><span>me falta pagar</span></div>
    ${prox}`);
}

function dibujarCostos(p, r) {
  const fila = c => {
    const desc = c.tipo === "descuento", vacio = !c.monto;
    const monto = desc ? (c.porcentaje ? `− ${montoTexto(c.monto)} % (${dinero(r.cargos * c.monto / 100)})` : `− ${dinero(c.monto)}`) : vacio ? "falta el monto" : dinero(c.monto);
    return `<li><button class="concepto ${desc ? "descuento" : ""} ${vacio ? "vacio" : ""}" data-concepto="${c.id}"><span>${desc ? "🎓 " : ""}${esc(c.nombre)}</span><span class="monto">${monto}</span></button></li>`;
  };
  const orden = [...p.conceptos.filter(c => c.tipo === "cargo"), ...p.conceptos.filter(c => c.tipo === "descuento")];
  const deHorario = materiasHorario();
  poner("costos", `
    <div class="p-head"><h2>💰 Costos de matrícula</h2>
      <span class="vista" aria-label="Moneda"><button class="r-vista ${db.moneda === "₡" ? "on" : ""}" data-moneda="₡">₡</button><button class="r-vista ${db.moneda === "$" ? "on" : ""}" data-moneda="$">$</button></span></div>
    ${orden.length ? `<ul class="conceptos">${orden.map(fila).join("")}</ul>
      <div class="totales">
        <div><span>Cargos</span><b>${dinero(r.cargos)}</b></div>
        ${r.descuentos ? `<div><span>Becas y descuentos</span><b>− ${dinero(r.descuentos)}</b></div>` : ""}
        <div class="grande"><span><b>Total a pagar</b></span><b>${dinero(r.total)}</b></div>
      </div>`
      : `<p class="pista">Anoto lo que cuesta este cuatrimestre: matrícula, cada materia, laboratorios, seguro… y mis becas o descuentos.</p>`}
    <div class="botonera">
      <button class="btn verde chico" data-nuevo-concepto="cargo">＋ Cargo</button>
      <button class="btn chico" data-nuevo-concepto="descuento">＋ Beca o descuento</button>
      ${deHorario.length ? `<button class="btn chico" data-materias-horario>＋ Materias de mi horario ★ (${deHorario.length})</button>` : ""}
    </div>`);
}

function dibujarFechas(p) {
  const orden = [...p.fechas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  poner("fechas", `
    <div class="p-head"><h2>📌 Fechas importantes</h2><button class="btn verde chico" data-nueva-fecha>＋ Fecha</button></div>
    ${orden.length ? orden.map(f => {
      const d = diasHasta(f.fecha);
      return `<button class="fecha ${d < 0 ? "pasada" : ""}" data-fecha="${f.id}"><b>${esc(f.nombre)}</b><small>${fechaLarga(f.fecha)}</small>
        <span class="cuando ${d >= 0 && d <= 7 ? "pronto" : ""}">${d < 0 ? "ya pasó" : cuando(f.fecha)}</span></button>`;
    }).join("") : `<p class="pista">Ej.: mi cita de matrícula, inclusiones y retiros, último día de pago sin recargo.</p>`}`);
}

function dibujarCuotas(p, r) {
  const orden = [...p.cuotas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const tarjeta = (q, i) => {
    const vencida = !q.pagada && diasHasta(q.fecha) < 0;
    const etiqueta = q.pagada ? "Pagado" : vencida ? `Venció ${cuando(q.fecha)}` : `Vence ${cuando(q.fecha)}`;
    return `<article class="cuota c-${COLS[i % COLS.length]} ${vencida ? "vencida" : ""} ${q.pagada ? "pagada" : ""}">
      <button class="check" data-pagar="${q.id}" aria-label="${q.pagada ? "Marcar como no pagado" : "Marcar como pagado"}"><span>${q.pagada ? "✓" : ""}</span></button>
      <button class="q-cuerpo" data-cuota="${q.id}">
        <span class="q-top"><b>${esc(q.nombre)}</b><i class="etiqueta">${etiqueta}</i></span>
        <span class="q-monto">${dinero(q.monto)}</span>
        <span class="q-info">${q.pagada && q.pagadaEn ? `Pagado el ${fechaCorta(q.pagadaEn)}` : `Fecha límite: ${fechaLarga(q.fecha)}`}</span>
      </button>
    </article>`;
  };
  // aviso si el plan de pagos no coincide con el total de costos
  const dif = Math.round(r.sinPlan * 100) / 100;
  const aviso = p.conceptos.length && p.cuotas.length && Math.abs(dif) >= 1
    ? `<p class="aviso">${dif > 0 ? `Mis pagos suman ${dinero(r.enCuotas)}: me faltan ${dinero(dif)} por agregar al plan.` : `Mis pagos suman ${dinero(r.enCuotas)}: son ${dinero(-dif)} más que el total.`}</p>` : "";
  poner("cuotas", `
    <div class="p-head"><h2>🧾 Plan de pagos</h2>
      <span class="p-acciones"><button class="btn chico" data-dividir>Dividir en cuotas</button><button class="btn verde chico" data-nueva-cuota>＋ Pago</button></span></div>
    ${aviso}
    ${orden.length ? `<div class="grupo">${orden.map(tarjeta).join("")}</div>`
      : `<p class="pista">Agrego cada pago con su fecha límite, o toco «Dividir en cuotas» para repartir el total.</p>`}`);
}

function dibujar() {
  guardar();
  const p = datos(), r = calcular(p);
  dibujarResumen(r); dibujarCostos(p, r); dibujarFechas(p); dibujarCuotas(p, r);
}

// ============ 6. FORMULARIOS ============
function abrirHoja(html) { poner("form", html); $("hoja").hidden = false; document.body.classList.add("sin-scroll"); }
function cerrarForm() { borrador = null; $("hoja").hidden = true; document.body.classList.remove("sin-scroll"); }
const botones = (borrar) => `<p class="error ancho" id="f-error"></p>
  <div class="botones ancho">
    ${borrar ? '<button type="button" class="btn peligro" data-borrar>Eliminar</button>' : ""}
    <button type="button" class="btn" data-cerrar>Cancelar</button>
    <button type="submit" class="btn verde">Guardar</button>
  </div>`;
const campoFecha = (titulo, iso) => `<div class="campo">${titulo}
  <div class="fecha-btn"><span id="f-fecha-txt">${fechaLarga(iso)}</span><input type="date" id="f-fecha" value="${iso}" aria-label="Fecha"></div></div>`;
function ponerFecha(iso) { borrador.fecha = iso; $("f-fecha").value = iso; texto("f-fecha-txt", fechaLarga(iso)); if (borrador.tipo === "dividir") previsualizar(); }

function abrirConcepto(c, tipo) {
  // en el borrador, "tipo" dice qué formulario es y "clase" si es cargo o descuento
  borrador = c ? Object.assign({}, c, { tipo: "concepto", clase: c.tipo }) : { tipo: "concepto", id: null, nombre: "", clase: tipo, monto: null, porcentaje: false };
  const b = borrador, desc = b.clase === "descuento";
  abrirHoja(`
    <h2>${b.id ? "Editar" : "Agregar"} ${desc ? "beca o descuento" : "cargo"}</h2>
    <label class="campo ancho">${desc ? "Nombre" : "Concepto"}
      <input id="f-nombre" value="${esc(b.nombre)}" placeholder="${desc ? "Ej.: Beca de excelencia" : "Ej.: Matrícula, Cálculo II, Laboratorio…"}"></label>
    <div class="campo ancho">${desc ? "Cuánto me descuentan" : "Monto"}
      <div class="con-unidad"><input id="f-monto" value="${montoTexto(b.monto)}" inputmode="decimal" placeholder="0">
        ${desc ? `<span class="vista"><button type="button" class="r-vista ${b.porcentaje ? "" : "on"}" data-unidad="monto">${db.moneda}</button><button type="button" class="r-vista ${b.porcentaje ? "on" : ""}" data-unidad="pct">%</button></span>` : ""}
      </div></div>
    ${botones(!!b.id)}`);
}

function abrirCuota(q) {
  const p = datos(), r = calcular(p);
  borrador = q ? Object.assign({ tipo: "cuota" }, q)
    : { tipo: "cuota", id: null, nombre: `Pago ${p.cuotas.length + 1}`, fecha: hoyISO(), monto: r.sinPlan > 0 ? r.sinPlan : null, pagada: false, pagadaEn: "" };
  const b = borrador;
  abrirHoja(`
    <h2>${b.id ? "Editar pago" : "Agregar un pago"}</h2>
    <label class="campo ancho">Nombre<input id="f-nombre" value="${esc(b.nombre)}" placeholder="Ej.: Cuota 1, Pago de contado…"></label>
    <label class="campo">Monto (${db.moneda})<input id="f-monto" value="${montoTexto(b.monto)}" inputmode="decimal" placeholder="0"></label>
    ${campoFecha("Fecha límite", b.fecha)}
    <div class="campo ancho">¿Ya lo pagué?
      <div class="pildoras"><button type="button" class="pil ${b.pagada ? "" : "on"}" data-pagada="no">Todavía no</button><button type="button" class="pil ${b.pagada ? "on" : ""}" data-pagada="si">✓ Ya lo pagué</button></div></div>
    ${botones(!!b.id)}`);
}

function abrirFecha(f) {
  borrador = f ? Object.assign({ tipo: "fecha" }, f) : { tipo: "fecha", id: null, nombre: "", fecha: hoyISO() };
  const b = borrador;
  abrirHoja(`
    <h2>${b.id ? "Editar fecha" : "Agregar una fecha importante"}</h2>
    <label class="campo ancho">¿Qué es?<input id="f-nombre" value="${esc(b.nombre)}" placeholder="Ej.: Mi cita de matrícula"></label>
    ${campoFecha("¿Cuándo?", b.fecha)}
    ${botones(!!b.id)}`);
}

function abrirDividir() {
  const r = calcular(datos()), base = r.sinPlan > 0 ? r.sinPlan : 0;
  if (!base) { alert(r.total ? "Mi plan de pagos ya cubre el total del cuatrimestre." : "Primero anoto los costos de matrícula para saber cuánto dividir."); return; }
  borrador = { tipo: "dividir", fecha: hoyISO(), base };
  let opc = "";
  for (let i = 1; i <= 8; i++) opc += `<option value="${i}" ${i === 3 ? "selected" : ""}>${i} ${i === 1 ? "pago" : "cuotas"}</option>`;
  abrirHoja(`
    <h2>Dividir en cuotas</h2>
    <p class="nota ancho">Voy a repartir <b>${dinero(base)}</b>${datos().cuotas.length ? " (lo que todavía no está en mi plan)" : ""} en cuotas mensuales.</p>
    <label class="campo">¿Cuántas cuotas?<select id="f-n">${opc}</select></label>
    ${campoFecha("Primera fecha límite", borrador.fecha)}
    <p class="nota ancho" id="f-vista"></p>
    ${botones(false)}`);
  previsualizar();
}

// reparte en partes iguales; la última se ajusta para que la suma sea exacta
function repartir(total, n) {
  const parte = Math.floor(total / n * 100) / 100, montos = Array(n).fill(parte);
  montos[n - 1] = Math.round((total - parte * (n - 1)) * 100) / 100;
  return montos;
}
function previsualizar() {
  const n = Number($("f-n").value), montos = repartir(borrador.base, n);
  poner("f-vista", montos.map((m, i) => `${i + 1}. <b>${dinero(m)}</b> · ${fechaCorta(sumarMeses(borrador.fecha, i))}`).join("<br>"));
}

function guardarForm() {
  const p = datos(), b = borrador;
  if (b.tipo === "dividir") {
    const n = Number($("f-n").value), inicio = p.cuotas.length;
    repartir(b.base, n).forEach((m, i) => p.cuotas.push({ id: nuevoId(), nombre: `Cuota ${inicio + i + 1}`, fecha: sumarMeses(b.fecha, i), monto: m, pagada: false, pagadaEn: "" }));
    cerrarForm(); dibujar(); return;
  }
  const nombre = $("f-nombre").value.trim();
  if (!nombre) { texto("f-error", b.tipo === "fecha" ? "Me falta qué es." : "Me falta el nombre."); return; }
  if (b.tipo === "fecha") {
    const f = { id: b.id || nuevoId(), nombre, fecha: b.fecha };
    const i = p.fechas.findIndex(x => x.id === f.id); if (i >= 0) p.fechas[i] = f; else p.fechas.push(f);
  } else {
    const monto = leerMonto($("f-monto").value);
    if (b.tipo === "cuota") {
      if (!monto) { texto("f-error", "Me falta el monto."); return; }
      const q = { id: b.id || nuevoId(), nombre, fecha: b.fecha, monto, pagada: !!b.pagada, pagadaEn: b.pagada ? (b.pagadaEn || hoyISO()) : "" };
      const i = p.cuotas.findIndex(x => x.id === q.id); if (i >= 0) p.cuotas[i] = q; else p.cuotas.push(q);
    } else {
      if (b.clase === "descuento" && !monto) { texto("f-error", "Me falta cuánto me descuentan."); return; }
      if (b.clase === "descuento" && b.porcentaje && monto > 100) { texto("f-error", "El porcentaje no puede ser más de 100 %."); return; }
      const c = { id: b.id || nuevoId(), nombre, tipo: b.clase, monto, porcentaje: b.clase === "descuento" && !!b.porcentaje };
      const i = p.conceptos.findIndex(x => x.id === c.id); if (i >= 0) p.conceptos[i] = c; else p.conceptos.push(c);
    }
  }
  cerrarForm(); dibujar();
}

// ============ 7. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s), p = datos();

  // --- formularios ---
  if (borrador) {
    if (en("[data-unidad]")) {
      borrador.porcentaje = en("[data-unidad]").dataset.unidad === "pct";
      document.querySelectorAll("[data-unidad]").forEach(x => x.classList.toggle("on", (x.dataset.unidad === "pct") === borrador.porcentaje));
    }
    else if (en("[data-pagada]")) {
      borrador.pagada = en("[data-pagada]").dataset.pagada === "si";
      document.querySelectorAll("[data-pagada]").forEach(x => x.classList.toggle("on", (x.dataset.pagada === "si") === borrador.pagada));
    }
    else if (en("[data-borrar]")) {
      const lista = { concepto: "conceptos", cuota: "cuotas", fecha: "fechas" }[borrador.tipo];
      if (confirm(`¿Eliminar «${borrador.nombre}»?`)) { p[lista] = p[lista].filter(x => x.id !== borrador.id); cerrarForm(); dibujar(); }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarForm();
    return;
  }

  // --- página ---
  if (en("[data-moneda]")) { db.moneda = en("[data-moneda]").dataset.moneda; dibujar(); }
  else if (en("[data-nuevo-concepto]")) abrirConcepto(null, en("[data-nuevo-concepto]").dataset.nuevoConcepto);
  else if (en("[data-concepto]")) abrirConcepto(p.conceptos.find(c => c.id === en("[data-concepto]").dataset.concepto));
  else if (en("[data-materias-horario]")) {
    materiasHorario().forEach(n => p.conceptos.push({ id: nuevoId(), nombre: n, tipo: "cargo", monto: null, porcentaje: false }));
    dibujar();
  }
  else if (en("[data-nueva-fecha]")) abrirFecha(null);
  else if (en("[data-fecha]")) abrirFecha(p.fechas.find(f => f.id === en("[data-fecha]").dataset.fecha));
  else if (en("[data-nueva-cuota]")) abrirCuota(null);
  else if (en("[data-cuota]")) abrirCuota(p.cuotas.find(q => q.id === en("[data-cuota]").dataset.cuota));
  else if (en("[data-dividir]")) abrirDividir();
  else if (en("[data-pagar]")) {
    const q = p.cuotas.find(x => x.id === en("[data-pagar]").dataset.pagar);
    q.pagada = !q.pagada; q.pagadaEn = q.pagada ? hoyISO() : "";
    dibujar();
  }
});

function alCambiar(ev) {
  const id = ev.target.id;
  if (id === "periodo") { actual = ev.target.value; dibujar(); }
  else if (id === "f-fecha") { if (ev.target.value) ponerFecha(ev.target.value); else ev.target.value = borrador.fecha; }   // si la borran, vuelve a la anterior
  else if (id === "f-n") previsualizar();
}
document.addEventListener("change", alCambiar);
document.addEventListener("input", ev => { if (ev.target.id === "f-fecha") alCambiar(ev); });   // el calendario del iPad a veces avisa con "input"
$("form").addEventListener("submit", ev => { ev.preventDefault(); guardarForm(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && borrador) cerrarForm(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden && !borrador) dibujar(); });   // si cambió el día

// ============ 8. INICIO ============
dibujarPeriodos();
dibujar();
