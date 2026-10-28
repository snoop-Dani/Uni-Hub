// ============ 1. DATOS FIJOS ============
const OPC_ENFOQUE = [25, 45, 50];        // minutos de enfoque que puedo elegir
const OPC_DESCANSO = [5, 10, 15];        // minutos de descanso
const DIAS_SEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const COLS = ["berry", "keen", "cherry", "moss"];

// Cuatrimestres (salen de tu malla: ../carrera/malla.js), para sugerir las materias que estás llevando
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
const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
// La misma materia tiene siempre el mismo color (igual que en los otros módulos)
const colorDe = nombre => COLS[[...String(nombre).toLowerCase()].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLS.length];

// ---------- Fechas (guardadas como "2026-11-05") ----------
const aISO = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
const deISO = s => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const hoyISO = () => aISO(new Date());
const sumarDias = (iso, n) => { const d = deISO(iso); d.setDate(d.getDate() + n); return aISO(d); };
const lunesDe = iso => sumarDias(iso, -((deISO(iso).getDay() + 6) % 7));   // la semana va de lunes a domingo
const fechaCorta = iso => { const d = deISO(iso); return `${DIAS_SEM[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const fechaLarga = iso => `${fechaCorta(iso)} ${deISO(iso).getFullYear()}`;
const nombreDia = iso => iso === hoyISO() ? "Hoy" : iso === sumarDias(hoyISO(), 1) ? "Mañana" : iso === sumarDias(hoyISO(), -1) ? "Ayer" : fechaCorta(iso);

// ---------- Formatos ----------
// 75 → "1 h 15 min"
const fmtMin = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };
// 390 minutos → "6,5" (horas con un decimal)
const fmtHoras = m => String(Math.round(m / 6) / 10).replace(".", ",");
// milisegundos → "24:59"
const fmtReloj = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${dd(Math.floor(s / 60))}:${dd(s % 60)}`; };

// ============ 3. ESTADO (se guarda en el navegador) ============
// db = {
//   sesiones: [{ id, materia, temaId (o ""), fecha: "2026-11-05", hora: "14:30" o "", minutos }],
//   temas:    [{ id, materia, nombre, minutos (tiempo que quiero dedicarle), fecha (día planeado o ""), hecho }],
//   ajustes:  { enfoque, descanso, meta (h/semana), materia, tema, vistaPlan: "dia" | "materia" }
// }
let db = leerJSON("estudio-db");
if (!db || !Array.isArray(db.sesiones)) db = { sesiones: [] };
if (!Array.isArray(db.temas)) db.temas = [];
db.ajustes = Object.assign({ enfoque: 25, descanso: 5, meta: 10, materia: "", tema: "", vistaPlan: "dia" }, db.ajustes);

// activa = el temporizador que está corriendo (se guarda aparte para que sobreviva si cierro la app)
// { modo: "enfoque" | "descanso", materia, temaId, duracion (ms), fin (hora en ms en que termina; null si está en pausa), restante (ms, solo en pausa) }
let activa = leerJSON("estudio-activa");
if (activa && (!activa.modo || (activa.fin && Date.now() - activa.fin > 12 * 3600e3))) activa = null;   // si quedó de hace más de 12 h, lo olvido
let aviso = "";             // mensaje que aparece debajo del reloj
let borrador = null;        // lo que se está editando en la hoja: { tipo: "sesion" | "tema", ... }
let verTemasHechos = false; // mostrar los temas que ya terminé

function guardar() {
  try {
    localStorage.setItem("estudio-db", JSON.stringify(db));
    if (activa) localStorage.setItem("estudio-activa", JSON.stringify(activa));
    else localStorage.removeItem("estudio-activa");
  } catch (e) {}
}

function registrar(materia, minutos, inicio = new Date(), temaId = "") {
  db.sesiones.push({ id: nuevoId(), materia, temaId: temaId || "", fecha: aISO(inicio), hora: `${dd(inicio.getHours())}:${dd(inicio.getMinutes())}`, minutos });
}

const buscarTema = id => id ? db.temas.find(t => t.id === id) : null;
// temas pendientes de una materia (para elegir en el temporizador o al anotar)
const temasDe = materia => db.temas.filter(t => !t.hecho && igual(t.materia, materia));
// <option> de un <select> de temas
const opcionesTema = (materia, elegido) => `<option value="">Sin tema</option>`
  + temasDe(materia).map(t => `<option value="${t.id}" ${t.id === elegido ? "selected" : ""}>${esc(t.nombre)}</option>`).join("");

// Materias para el autocompletado: las de Mis notas y mi horario ★ de este cuatrimestre, las que ya usé aquí y mi malla
function materiasSugeridas() {
  const p = periodoEnCurso(), lista = [];
  const n = leerJSON("notas-db"), pn = n && n.periodos && n.periodos[p];
  if (pn && Array.isArray(pn.materias)) pn.materias.forEach(m => lista.push(m.nombre));
  const h = leerJSON("horarios-db"), ph = h && h.periodos && h.periodos[p];
  const el = ph && Array.isArray(ph.opciones) && ph.opciones.find(o => o.id === ph.elegida);
  if (el && Array.isArray(el.clases)) el.clases.forEach(c => lista.push(c.materia));
  db.temas.forEach(t => lista.push(t.materia));
  [...db.sesiones].reverse().forEach(s => lista.push(s.materia));
  return [...new Set(lista.concat(Object.values(NOMBRE)).filter(Boolean))];
}

// ============ 4. TEMPORIZADOR ============
// El reloj NO cuenta segundos: guarda a qué hora termina y compara con la hora actual.
// Así, aunque el iPad se bloquee o cierre la página, al volver el tiempo está bien.
const ahora = () => Date.now();
const restante = () => activa.fin ? activa.fin - ahora() : activa.restante;

function arrancar(materia, temaId) {
  db.ajustes.materia = materia; db.ajustes.tema = temaId || "";
  desbloquearSonido();
  const dur = db.ajustes.enfoque * 60000;
  activa = { modo: "enfoque", materia, temaId: temaId || "", duracion: dur, fin: ahora() + dur, restante: null };
  aviso = "";
  dibujar();
}
function empezar() {
  const materia = $("t-materia").value.trim();
  if (!materia) { aviso = "Me falta elegir qué voy a estudiar."; dibujarReloj(); return; }
  arrancar(materia, $("t-tema").value);
}
function pausar() { activa.restante = activa.fin - ahora(); activa.fin = null; dibujar(); }
function seguir() { activa.fin = ahora() + activa.restante; activa.restante = null; desbloquearSonido(); dibujar(); }

function terminar() {   // termino antes de tiempo
  if (activa.modo === "enfoque") {
    const hecho = activa.duracion - restante();
    if (hecho >= 60000) {
      const min = Math.round(hecho / 60000);
      registrar(activa.materia, min, new Date(ahora() - hecho), activa.temaId);
      aviso = `✓ Anoté ${fmtMin(min)} de ${activa.materia}.`;
    } else aviso = "No anoté nada (fue menos de 1 minuto).";
  } else aviso = "";
  activa = null;
  dibujar();
}

// Se llama cada segundo y al volver a la página: si ya pasó la hora de fin, avanza
function revisar() {
  if (!activa || !activa.fin || ahora() < activa.fin) return false;
  while (activa && activa.fin && ahora() >= activa.fin) {
    if (activa.modo === "enfoque") {
      const min = Math.round(activa.duracion / 60000);
      registrar(activa.materia, min, new Date(activa.fin - activa.duracion), activa.temaId);
      aviso = `✓ ¡Pomodoro completo! Anoté ${fmtMin(min)} de ${activa.materia}. Ahora toca descansar.`;
      const dur = db.ajustes.descanso * 60000;
      activa = { modo: "descanso", materia: activa.materia, temaId: activa.temaId, duracion: dur, fin: activa.fin + dur, restante: null };   // el descanso empieza cuando terminó el enfoque
    } else {
      aviso = "☕ Terminó el descanso. ¿Otro pomodoro?";
      activa = null;
    }
  }
  sonar();
  dibujar();
  return true;
}

// ---------- Sonido (el iPad solo deja sonar si antes toqué un botón) ----------
let audio = null;
function desbloquearSonido() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) {}
}
function sonar() {
  if (!audio || document.hidden) return;
  try {
    [0, 0.35, 0.7].forEach(t => {                       // tres "bips" cortos
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + t;
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      o.connect(g); g.connect(audio.destination);
      o.start(t0); o.stop(t0 + 0.3);
    });
  } catch (e) {}
}

// ============ 5. CÁLCULOS ============
const minutosDe = lista => lista.reduce((s, x) => s + x.minutos, 0);
const estudiadoDe = t => minutosDe(db.sesiones.filter(s => s.temaId === t.id));   // minutos que ya le dediqué a un tema
function racha() {             // días seguidos con estudio, contando hasta hoy (o hasta ayer si hoy todavía no estudio)
  const dias = new Set(db.sesiones.map(s => s.fecha));
  let d = dias.has(hoyISO()) ? hoyISO() : sumarDias(hoyISO(), -1), n = 0;
  while (dias.has(d)) { n++; d = sumarDias(d, -1); }
  return n;
}
const deLaSemana = () => { const l = lunesDe(hoyISO()); return db.sesiones.filter(s => s.fecha >= l && s.fecha <= sumarDias(l, 6)); };

// ============ 6. DIBUJAR ============
function dibujarResumen() {
  const hoy = db.sesiones.filter(s => s.fecha === hoyISO()), sem = deLaSemana(), r = racha();
  poner("stats", `
    <div class="stat"><b>${fmtMin(minutosDe(hoy))}</b><span>estudié hoy</span></div>
    <div class="stat"><b>${fmtHoras(minutosDe(sem))} h</b><span>esta semana (meta ${fmtHoras(db.ajustes.meta * 60)} h)</span></div>
    <div class="stat"><b>${r} ${r === 1 ? "día" : "días"}</b><span>de racha</span></div>
    <div class="stat"><b>${sem.length}</b><span>${sem.length === 1 ? "sesión" : "sesiones"} esta semana</span></div>`);
}

const pils = (tipo, opciones, actual) => opciones.map(n => `<button class="r-pil ${n === actual ? "on" : ""}" data-${tipo}="${n}">${n} min</button>`).join("");

function dibujarReloj() {
  const el = $("reloj");
  el.classList.toggle("descanso", !!activa && activa.modo === "descanso");
  if (!activa) {
    const hayTemas = temasDe(db.ajustes.materia).length > 0;
    poner("reloj", `
      <span class="r-modo">Lista para estudiar</span>
      <strong class="r-tiempo">${dd(db.ajustes.enfoque)}:00</strong>
      <label class="r-materia">¿Qué voy a estudiar?
        <input id="t-materia" list="materias" value="${esc(db.ajustes.materia)}" placeholder="Escribo una materia…" autocomplete="off"></label>
      <label class="r-materia" id="t-tema-box" ${hayTemas ? "" : "hidden"}>Tema (de mi plan)
        <select id="t-tema">${opcionesTema(db.ajustes.materia, db.ajustes.tema)}</select></label>
      <div class="r-opc">Enfoque <div class="r-pils">${pils("enfoque", OPC_ENFOQUE, db.ajustes.enfoque)}</div></div>
      <div class="r-opc">Descanso <div class="r-pils">${pils("descanso", OPC_DESCANSO, db.ajustes.descanso)}</div></div>
      <div class="r-botones"><button class="r-btn" data-empezar>▶ Empezar</button></div>
      <p class="r-aviso">${esc(aviso)}</p>`);
    document.title = "Sesiones de estudio · Uni-Hub";
    return;
  }
  const enfoque = activa.modo === "enfoque", pausado = !activa.fin, tema = buscarTema(activa.temaId);
  poner("reloj", `
    <span class="r-modo">${enfoque ? `🎯 Enfoque · ${esc(activa.materia)}${tema ? ` · ${esc(tema.nombre)}` : ""}` : "☕ Descanso"}${pausado ? " · en pausa" : ""}</span>
    <strong class="r-tiempo" id="r-tiempo">${fmtReloj(restante())}</strong>
    <div class="barra"><i id="r-barra"></i></div>
    <div class="r-botones">
      ${pausado ? '<button class="r-btn" data-seguir>▶ Seguir</button>' : '<button class="r-btn" data-pausar>⏸ Pausar</button>'}
      ${enfoque ? '<button class="r-btn suave" data-terminar>■ Terminar y anotar</button>' : '<button class="r-btn suave" data-terminar>⏭ Saltar descanso</button>'}
    </div>
    <p class="r-aviso">${esc(aviso)}</p>`);
  actualizarReloj();
}

function actualizarReloj() {   // solo el tiempo y la barra (cada segundo)
  if (!activa) return;
  const r = restante();
  texto("r-tiempo", fmtReloj(r));
  const b = $("r-barra"); if (b) b.style.width = `${100 * (1 - r / activa.duracion)}%`;
  document.title = `${fmtReloj(r)} · ${activa.modo === "enfoque" ? "Enfoque" : "Descanso"}`;
}

// Cuando escribo otra materia, el <select> de temas muestra los de esa materia
function actualizarTemas(idMateria, idSelect, idCaja) {
  const materia = $(idMateria).value;
  poner(idSelect, opcionesTema(materia, ""));
  if (idCaja) $(idCaja).hidden = temasDe(materia).length === 0;
}

function dibujarSemana() {
  const sem = deLaSemana(), total = minutosDe(sem), meta = db.ajustes.meta * 60, pct = meta ? Math.min(100, 100 * total / meta) : 0;
  const porMateria = {};
  sem.forEach(s => { porMateria[s.materia] = (porMateria[s.materia] || 0) + s.minutos; });
  const filas = Object.entries(porMateria).sort((a, b) => b[1] - a[1]), max = filas.length ? filas[0][1] : 1;
  poner("semana", `
    <div class="p-head"><h2>Esta semana</h2><button class="btn chico" data-meta>Meta: ${fmtHoras(meta)} h ✎</button></div>
    <div class="meta-barra"><i style="width:${pct}%"></i></div>
    <p class="meta-txt"><b>${fmtHoras(total)} h</b> de ${fmtHoras(meta)} h (${Math.round(pct)} %)
      ${total >= meta ? " · 🎉 ¡Cumplí mi meta!" : ` · me faltan ${fmtHoras(meta - total)} h`}</p>
    ${filas.length ? `<ul class="por-materia">${filas.map(([m, min]) => `
      <li><span class="nombre">${esc(m)}</span><span class="min">${fmtMin(min)}</span>
        <span class="b c-${colorDe(m)}"><i style="width:${100 * min / max}%"></i></span></li>`).join("")}</ul>`
      : '<p class="pista">Esta semana todavía no he estudiado. ¡A empezar! 💪</p>'}`);
}

// ---------- Mi plan de estudio ----------
function tarjetaTema(t, conFecha) {
  const hecho = estudiadoDe(t), pct = t.minutos ? Math.min(100, 100 * hecho / t.minutos) : 0;
  const atrasado = !t.hecho && t.fecha && t.fecha < hoyISO();
  const detalle = [esc(t.materia), conFecha && t.fecha ? nombreDia(t.fecha) : ""].filter(Boolean).join(" · ");
  return `<article class="tema c-${colorDe(t.materia)} ${atrasado ? "atrasado" : ""} ${t.hecho ? "hecho" : ""}">
    <button class="check" data-tema-check="${t.id}" aria-label="${t.hecho ? "Marcar como pendiente" : "Marcar como terminado"}"><span>${t.hecho ? "✓" : ""}</span></button>
    <div class="t-cuerpo">
      <button class="t-info" data-tema-editar="${t.id}"><b>${esc(t.nombre)}</b><small>${detalle}</small></button>
      <span class="barra"><i style="width:${pct}%"></i></span>
      <span class="t-pie"><span>${fmtMin(hecho)} de ${fmtMin(t.minutos)}${hecho >= t.minutos ? " ✓" : ""}</span>
        ${t.hecho ? "" : `<button class="t-estudiar" data-tema-estudiar="${t.id}">▶ Estudiar</button>`}</span>
    </div>
  </article>`;
}

const falta = lista => lista.reduce((s, t) => s + Math.max(0, t.minutos - estudiadoDe(t)), 0);   // tiempo planeado que me queda
const ordenTemas = lista => lista.sort((a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999") || a.materia.localeCompare(b.materia));

function grupoPlan(titulo, lista, extra, conFecha, alerta) {
  return lista.length ? `<div class="plan-dia ${alerta ? "alerta" : ""}"><h3>${titulo}<span>${extra}</span></h3>
    <div class="temas">${lista.map(t => tarjetaTema(t, conFecha)).join("")}</div></div>` : "";
}

function dibujarPlan() {
  const vista = db.ajustes.vistaPlan, pend = db.temas.filter(t => !t.hecho), hechos = db.temas.filter(t => t.hecho);
  let html = "";
  if (vista === "dia") {
    // como un horario: atrasados, hoy, los próximos 6 días, más adelante y sin día
    const hoy = hoyISO(), hasta = sumarDias(hoy, 6);
    const atrasados = ordenTemas(pend.filter(t => t.fecha && t.fecha < hoy));
    html += grupoPlan("⚠ Atrasados", atrasados, `me faltan ${fmtMin(falta(atrasados))}`, true, true);
    for (let i = 0; i <= 6; i++) {
      const f = sumarDias(hoy, i), del = ordenTemas(pend.filter(t => t.fecha === f));
      html += grupoPlan(nombreDia(f), del, `${fmtMin(falta(del))} por estudiar`, false);
    }
    const despues = ordenTemas(pend.filter(t => t.fecha && t.fecha > hasta));
    html += grupoPlan("Más adelante", despues, `${fmtMin(falta(despues))} por estudiar`, true);
    const sinDia = ordenTemas(pend.filter(t => !t.fecha));
    html += grupoPlan("Sin día", sinDia, `${fmtMin(falta(sinDia))} por estudiar`, false);
  } else {
    // por materia: cuánto llevo del total planeado
    const materias = [...new Set(pend.map(t => t.materia))].sort((a, b) => a.localeCompare(b));
    materias.forEach(m => {
      const del = ordenTemas(pend.filter(t => t.materia === m));
      const plan = del.reduce((s, t) => s + t.minutos, 0), llevo = del.reduce((s, t) => s + Math.min(t.minutos, estudiadoDe(t)), 0);
      html += grupoPlan(esc(m), del, `${fmtMin(llevo)} de ${fmtMin(plan)}`, true);
    });
  }
  if (!db.temas.length) html = `<p class="pista">Agrego los temas que voy a estudiar, cuánto tiempo quiero dedicarle a cada uno y qué día. Después los estudio con ▶ y veo mi avance.</p>`;
  else if (!pend.length) html = `<p class="pista">🎉 Terminé todos los temas de mi plan.</p>`;
  if (hechos.length) html += `<div class="plan-dia"><h3>✓ Terminados<span><button class="btn chico" data-ver-temas-hechos>${verTemasHechos ? "Ocultar" : `Ver los ${hechos.length}`}</button></span></h3>
    ${verTemasHechos ? `<div class="temas">${hechos.map(t => tarjetaTema(t, true)).join("")}</div>` : ""}</div>`;
  poner("plan", `
    <div class="p-head"><h2>📚 Mi plan de estudio</h2>
      <span class="p-acciones">
        <span class="vista"><button class="r-vista ${vista === "dia" ? "on" : ""}" data-vista="dia">Por día</button><button class="r-vista ${vista === "materia" ? "on" : ""}" data-vista="materia">Por materia</button></span>
        <button class="btn verde chico" data-nuevo-tema>＋ Agregar tema</button>
      </span></div>
    ${html}`);
}

function dibujarHistorial() {
  const desde = sumarDias(hoyISO(), -6);
  const recientes = db.sesiones.filter(s => s.fecha >= desde).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const dias = [...new Set(recientes.map(s => s.fecha))];
  poner("historial", `
    <div class="p-head"><h2>Mis sesiones (últimos 7 días)</h2><button class="btn verde chico" data-anotar>＋ Anotar sesión</button></div>
    ${dias.length ? dias.map(f => {
      const del = recientes.filter(s => s.fecha === f);
      return `<div class="dia"><h3>${nombreDia(f)}<span>${fmtMin(minutosDe(del))}</span></h3>
        ${del.map(s => { const t = buscarTema(s.temaId); return `<div class="sesion c-${colorDe(s.materia)}"><span class="punto"></span>
          <span>${esc(s.materia)}${t ? ` · ${esc(t.nombre)}` : ""}${s.hora ? `<small>${s.hora}</small>` : ""}</span>
          <span class="min">${fmtMin(s.minutos)}</span>
          <button class="quitar" data-quitar="${s.id}" aria-label="Borrar sesión">×</button></div>`; }).join("")}</div>`;
    }).join("") : '<p class="pista">Todavía no hay sesiones. Uso el temporizador o toco «＋ Anotar sesión» si estudié sin él.</p>'}`);
}

function dibujar() {
  guardar(); dibujarResumen(); dibujarReloj(); dibujarSemana(); dibujarPlan(); dibujarHistorial();
  poner("materias", materiasSugeridas().map(n => `<option value="${esc(n)}">`).join(""));
}

// ============ 7. HOJAS: ANOTAR SESIÓN Y AGREGAR TEMA ============
function ponerFecha(iso) { borrador.fecha = iso; $("f-fecha").value = iso || ""; texto("f-fecha-txt", iso ? fechaLarga(iso) : "Sin día"); }

// duración con dos <select> (horas y minutos)
function selectorDuracion(min) {
  const h = Math.floor(min / 60), m = min % 60;
  let horas = "", mins = "";
  for (let i = 0; i <= 12; i++) horas += `<option value="${i}" ${i === h ? "selected" : ""}>${i} h</option>`;
  for (let i = 0; i < 60; i += 5) mins += `<option value="${i}" ${i === m ? "selected" : ""}>${i} min</option>`;
  return `<div class="dur"><select id="f-horas" aria-label="Horas">${horas}</select><select id="f-mins" aria-label="Minutos">${mins}</select></div>`;
}
const leerDuracion = () => Number($("f-horas").value) * 60 + Number($("f-mins").value);

function abrirHoja(html) { poner("form", html); $("hoja").hidden = false; document.body.classList.add("sin-scroll"); }
function cerrarForm() { borrador = null; $("hoja").hidden = true; document.body.classList.remove("sin-scroll"); }

function abrirSesion() {
  borrador = { tipo: "sesion", fecha: hoyISO() };
  const materia = db.ajustes.materia, hayTemas = temasDe(materia).length > 0;
  abrirHoja(`
    <h2>Anotar una sesión</h2>
    <label class="campo ancho">¿Qué estudié?
      <input id="f-materia" list="materias" value="${esc(materia)}" placeholder="Escribo una materia…" autocomplete="off"></label>
    <label class="campo ancho" id="f-tema-box" ${hayTemas ? "" : "hidden"}>Tema (de mi plan)
      <select id="f-tema" class="sel">${opcionesTema(materia, "")}</select></label>
    <div class="campo">¿Cuándo?
      <div class="fecha-btn"><span id="f-fecha-txt">${fechaLarga(borrador.fecha)}</span><input type="date" id="f-fecha" value="${borrador.fecha}" aria-label="Fecha"></div>
      <div class="rapidos"><button type="button" class="btn chico" data-rapido="0">Hoy</button><button type="button" class="btn chico" data-rapido="-1">Ayer</button></div></div>
    <div class="campo">¿Cuánto tiempo? ${selectorDuracion(60)}</div>
    <p class="error ancho" id="f-error"></p>
    <div class="botones ancho">
      <button type="button" class="btn" data-cerrar>Cancelar</button>
      <button type="submit" class="btn verde">Guardar</button>
    </div>`);
}

function abrirTema(t) {
  borrador = t ? Object.assign({ tipo: "tema" }, t)
    : { tipo: "tema", id: null, materia: db.ajustes.materia, nombre: "", minutos: 60, fecha: hoyISO(), hecho: false };
  const b = borrador;
  abrirHoja(`
    <h2>${b.id ? "Editar tema" : "Agregar un tema a mi plan"}</h2>
    <label class="campo ancho">Materia
      <input id="f-materia" list="materias" value="${esc(b.materia)}" placeholder="Escribo una materia…" autocomplete="off"></label>
    <label class="campo ancho">Tema
      <input id="f-nombre" value="${esc(b.nombre)}" placeholder="Ej.: Integrales por partes"></label>
    <div class="campo">¿Cuánto tiempo le quiero dedicar? ${selectorDuracion(b.minutos)}</div>
    <div class="campo">¿Qué día lo estudio?
      <div class="fecha-btn"><span id="f-fecha-txt">${b.fecha ? fechaLarga(b.fecha) : "Sin día"}</span><input type="date" id="f-fecha" value="${b.fecha}" aria-label="Fecha"></div>
      <div class="rapidos">
        <button type="button" class="btn chico" data-rapido="0">Hoy</button>
        <button type="button" class="btn chico" data-rapido="1">Mañana</button>
        <button type="button" class="btn chico" data-sin-dia>Sin día</button>
      </div></div>
    ${b.id ? `<p class="nota ancho">Llevo ${fmtMin(estudiadoDe(b))} estudiados en este tema.</p>` : ""}
    <p class="error ancho" id="f-error"></p>
    <div class="botones ancho">
      ${b.id ? '<button type="button" class="btn peligro" data-borrar-tema>Eliminar</button>' : ""}
      <button type="button" class="btn" data-cerrar>Cancelar</button>
      <button type="submit" class="btn verde">Guardar</button>
    </div>`);
}

function guardarForm() {
  const materia = $("f-materia").value.trim(), minutos = leerDuracion();
  if (borrador.tipo === "sesion") {
    if (!materia) { texto("f-error", "Me falta qué estudié."); return; }
    if (!minutos) { texto("f-error", "Me falta cuánto tiempo estudié."); return; }
    db.sesiones.push({ id: nuevoId(), materia, temaId: $("f-tema").value, fecha: borrador.fecha, hora: "", minutos });
  } else {
    const nombre = $("f-nombre").value.trim();
    if (!materia) { texto("f-error", "Me falta la materia."); return; }
    if (!nombre) { texto("f-error", "Me falta el nombre del tema."); return; }
    if (!minutos) { texto("f-error", "Me falta cuánto tiempo le quiero dedicar."); return; }
    const t = { id: borrador.id || nuevoId(), materia, nombre, minutos, fecha: borrador.fecha || "", hecho: !!borrador.hecho };
    const i = db.temas.findIndex(x => x.id === t.id);
    if (i >= 0) db.temas[i] = t; else db.temas.push(t);
  }
  db.ajustes.materia = materia;
  cerrarForm(); dibujar();
}

// ============ 8. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);

  // --- hojas ---
  if (borrador) {
    if (en("[data-rapido]")) ponerFecha(sumarDias(hoyISO(), Number(en("[data-rapido]").dataset.rapido)));
    else if (en("[data-sin-dia]")) ponerFecha("");
    else if (en("[data-borrar-tema]")) {
      if (confirm(`¿Eliminar el tema «${borrador.nombre}» de mi plan? (las sesiones que ya anoté se quedan)`)) {
        db.temas = db.temas.filter(x => x.id !== borrador.id); cerrarForm(); dibujar();
      }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarForm();
    return;
  }

  // --- temporizador ---
  if (en("[data-empezar]")) empezar();
  else if (en("[data-pausar]")) pausar();
  else if (en("[data-seguir]")) seguir();
  else if (en("[data-terminar]")) terminar();
  else if (en("[data-enfoque]") || en("[data-descanso]")) {
    const b = en("[data-enfoque]") || en("[data-descanso]"), tipo = b.dataset.enfoque ? "enfoque" : "descanso";
    db.ajustes.materia = $("t-materia").value.trim();     // para no perder lo que escribí
    db.ajustes.tema = $("t-tema").value;
    db.ajustes[tipo] = Number(b.dataset[tipo]);
    dibujar();
  }
  // --- plan de estudio ---
  else if (en("[data-nuevo-tema]")) abrirTema(null);
  else if (en("[data-tema-editar]")) abrirTema(buscarTema(en("[data-tema-editar]").dataset.temaEditar));
  else if (en("[data-tema-check]")) { const tm = buscarTema(en("[data-tema-check]").dataset.temaCheck); tm.hecho = !tm.hecho; dibujar(); }
  else if (en("[data-tema-estudiar]")) {
    const tm = buscarTema(en("[data-tema-estudiar]").dataset.temaEstudiar);
    if (activa) { alert("Ya tengo un pomodoro en marcha. Lo termino primero."); return; }
    arrancar(tm.materia, tm.id);
    $("reloj").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  else if (en("[data-vista]")) { db.ajustes.vistaPlan = en("[data-vista]").dataset.vista; dibujar(); }
  else if (en("[data-ver-temas-hechos]")) { verTemasHechos = !verTemasHechos; dibujarPlan(); }
  // --- semana e historial ---
  else if (en("[data-meta]")) {
    const r = prompt("¿Cuántas horas quiero estudiar por semana?", fmtHoras(db.ajustes.meta * 60));
    const n = r === null ? null : parseFloat(String(r).replace(",", "."));
    if (n > 0 && n <= 100) { db.ajustes.meta = n; dibujar(); }
  }
  else if (en("[data-anotar]")) abrirSesion();
  else if (en("[data-quitar]")) {
    const s = db.sesiones.find(x => x.id === en("[data-quitar]").dataset.quitar);
    if (s && confirm(`¿Borrar la sesión de ${s.materia} (${fmtMin(s.minutos)})?`)) { db.sesiones = db.sesiones.filter(x => x !== s); dibujar(); }
  }
});

function alCambiar(ev) {
  const id = ev.target.id;
  if (id === "f-fecha") { if (ev.target.value) ponerFecha(ev.target.value); else ev.target.value = borrador.fecha; }   // si lo borran, vuelve al anterior
  else if (id === "t-materia") actualizarTemas("t-materia", "t-tema", "t-tema-box");
  else if (id === "f-materia" && $("f-tema")) actualizarTemas("f-materia", "f-tema", "f-tema-box");
}
document.addEventListener("change", alCambiar);
document.addEventListener("input", alCambiar);   // el calendario del iPad a veces avisa con "input"
$("form").addEventListener("submit", ev => { ev.preventDefault(); guardarForm(); });
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && borrador) cerrarForm();
  else if (ev.key === "Enter" && ev.target.id === "t-materia") empezar();
});
// al volver a la página (por ejemplo después de bloquear el iPad), pongo el reloj al día
document.addEventListener("visibilitychange", () => { if (!document.hidden && !revisar() && !borrador) dibujar(); });
setInterval(() => { if (activa && !revisar()) actualizarReloj(); }, 1000);

// ============ 9. INICIO ============
if (!revisar()) dibujar();
