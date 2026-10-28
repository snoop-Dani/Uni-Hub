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

// ---------- Formatos ----------
// 75 → "1 h 15 min"
const fmtMin = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };
// 390 minutos → "6,5" (horas con un decimal)
const fmtHoras = m => String(Math.round(m / 6) / 10).replace(".", ",");
// milisegundos → "24:59"
const fmtReloj = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${dd(Math.floor(s / 60))}:${dd(s % 60)}`; };

// ============ 3. ESTADO (se guarda en el navegador) ============
// db = { sesiones: [{ id, materia, fecha: "2026-11-05", hora: "14:30" o "", minutos }], ajustes: { enfoque, descanso, meta (h/semana), materia } }
let db = leerJSON("estudio-db");
if (!db || !Array.isArray(db.sesiones)) db = { sesiones: [] };
db.ajustes = Object.assign({ enfoque: 25, descanso: 5, meta: 10, materia: "" }, db.ajustes);

// activa = el temporizador que está corriendo (se guarda aparte para que sobreviva si cierro la app)
// { modo: "enfoque" | "descanso", materia, duracion (ms), fin (hora en ms en que termina; null si está en pausa), restante (ms, solo en pausa) }
let activa = leerJSON("estudio-activa");
if (activa && (!activa.modo || (activa.fin && Date.now() - activa.fin > 12 * 3600e3))) activa = null;   // si quedó de hace más de 12 h, lo olvido
let aviso = "";           // mensaje que aparece debajo del reloj
let borrador = null;      // sesión que se está anotando a mano

function guardar() {
  try {
    localStorage.setItem("estudio-db", JSON.stringify(db));
    if (activa) localStorage.setItem("estudio-activa", JSON.stringify(activa));
    else localStorage.removeItem("estudio-activa");
  } catch (e) {}
}

function registrar(materia, minutos, inicio = new Date()) {
  db.sesiones.push({ id: nuevoId(), materia, fecha: aISO(inicio), hora: `${dd(inicio.getHours())}:${dd(inicio.getMinutes())}`, minutos });
}

// Materias para el autocompletado: las de Mis notas y mi horario ★ de este cuatrimestre, las que ya estudié y mi malla
function materiasSugeridas() {
  const p = periodoEnCurso(), lista = [];
  const n = leerJSON("notas-db"), pn = n && n.periodos && n.periodos[p];
  if (pn && Array.isArray(pn.materias)) pn.materias.forEach(m => lista.push(m.nombre));
  const h = leerJSON("horarios-db"), ph = h && h.periodos && h.periodos[p];
  const el = ph && Array.isArray(ph.opciones) && ph.opciones.find(o => o.id === ph.elegida);
  if (el && Array.isArray(el.clases)) el.clases.forEach(c => lista.push(c.materia));
  [...db.sesiones].reverse().forEach(s => lista.push(s.materia));
  return [...new Set(lista.concat(Object.values(NOMBRE)).filter(Boolean))];
}

// ============ 4. TEMPORIZADOR ============
// El reloj NO cuenta segundos: guarda a qué hora termina y compara con la hora actual.
// Así, aunque el iPad se bloquee o cierre la página, al volver el tiempo está bien.
const ahora = () => Date.now();
const restante = () => activa.fin ? activa.fin - ahora() : activa.restante;

function empezar() {
  const materia = $("t-materia").value.trim();
  if (!materia) { aviso = "Me falta elegir qué voy a estudiar."; dibujarReloj(); return; }
  db.ajustes.materia = materia;
  desbloquearSonido();
  const dur = db.ajustes.enfoque * 60000;
  activa = { modo: "enfoque", materia, duracion: dur, fin: ahora() + dur, restante: null };
  aviso = "";
  dibujar();
}
function pausar() { activa.restante = activa.fin - ahora(); activa.fin = null; dibujar(); }
function seguir() { activa.fin = ahora() + activa.restante; activa.restante = null; desbloquearSonido(); dibujar(); }

function terminar() {   // termino antes de tiempo
  if (activa.modo === "enfoque") {
    const hecho = activa.duracion - restante();
    if (hecho >= 60000) {
      const min = Math.round(hecho / 60000);
      registrar(activa.materia, min, new Date(ahora() - hecho));
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
      registrar(activa.materia, min, new Date(activa.fin - activa.duracion));
      aviso = `✓ ¡Pomodoro completo! Anoté ${fmtMin(min)} de ${activa.materia}. Ahora toca descansar.`;
      const dur = db.ajustes.descanso * 60000;
      activa = { modo: "descanso", materia: activa.materia, duracion: dur, fin: activa.fin + dur, restante: null };   // el descanso empieza cuando terminó el enfoque
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
    poner("reloj", `
      <span class="r-modo">Lista para estudiar</span>
      <strong class="r-tiempo">${dd(db.ajustes.enfoque)}:00</strong>
      <label class="r-materia">¿Qué voy a estudiar?
        <input id="t-materia" list="materias" value="${esc(db.ajustes.materia)}" placeholder="Escribo una materia…" autocomplete="off"></label>
      <div class="r-opc">Enfoque <div class="r-pils">${pils("enfoque", OPC_ENFOQUE, db.ajustes.enfoque)}</div></div>
      <div class="r-opc">Descanso <div class="r-pils">${pils("descanso", OPC_DESCANSO, db.ajustes.descanso)}</div></div>
      <div class="r-botones"><button class="r-btn" data-empezar>▶ Empezar</button></div>
      <p class="r-aviso">${esc(aviso)}</p>`);
    document.title = "Sesiones de estudio · Uni-Hub";
    return;
  }
  const enfoque = activa.modo === "enfoque", pausado = !activa.fin;
  poner("reloj", `
    <span class="r-modo">${enfoque ? `🎯 Enfoque · ${esc(activa.materia)}` : "☕ Descanso"}${pausado ? " · en pausa" : ""}</span>
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

function dibujarHistorial() {
  const desde = sumarDias(hoyISO(), -6);
  const recientes = db.sesiones.filter(s => s.fecha >= desde).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const dias = [...new Set(recientes.map(s => s.fecha))];
  const titulo = f => f === hoyISO() ? "Hoy" : f === sumarDias(hoyISO(), -1) ? "Ayer" : fechaCorta(f);
  poner("historial", `
    <div class="p-head"><h2>Mis sesiones (últimos 7 días)</h2><button class="btn verde chico" data-anotar>＋ Anotar sesión</button></div>
    ${dias.length ? dias.map(f => {
      const del = recientes.filter(s => s.fecha === f);
      return `<div class="dia"><h3>${titulo(f)}<span>${fmtMin(minutosDe(del))}</span></h3>
        ${del.map(s => `<div class="sesion c-${colorDe(s.materia)}"><span class="punto"></span>
          <span>${esc(s.materia)}${s.hora ? `<small>${s.hora}</small>` : ""}</span>
          <span class="min">${fmtMin(s.minutos)}</span>
          <button class="quitar" data-quitar="${s.id}" aria-label="Borrar sesión">×</button></div>`).join("")}</div>`;
    }).join("") : '<p class="pista">Todavía no hay sesiones. Uso el temporizador o toco «＋ Anotar sesión» si estudié sin él.</p>'}`);
}

function dibujar() {
  guardar(); dibujarResumen(); dibujarReloj(); dibujarSemana(); dibujarHistorial();
  poner("materias", materiasSugeridas().map(n => `<option value="${esc(n)}">`).join(""));
}

// ============ 7. ANOTAR UNA SESIÓN A MANO ============
function ponerFecha(iso) { borrador.fecha = iso; $("f-fecha").value = iso; texto("f-fecha-txt", fechaLarga(iso)); }

function abrirForm() {
  borrador = { fecha: hoyISO() };
  let horas = "", mins = "";
  for (let i = 0; i <= 8; i++) horas += `<option value="${i}" ${i === 1 ? "selected" : ""}>${i} h</option>`;
  for (let i = 0; i < 60; i += 5) mins += `<option value="${i}">${i} min</option>`;
  poner("form", `
    <h2>Anotar una sesión</h2>
    <label class="campo ancho">¿Qué estudié?
      <input id="f-materia" list="materias" value="${esc(db.ajustes.materia)}" placeholder="Escribo una materia…" autocomplete="off"></label>
    <div class="campo">¿Cuándo?
      <div class="fecha-btn"><span id="f-fecha-txt">${fechaLarga(borrador.fecha)}</span><input type="date" id="f-fecha" value="${borrador.fecha}" aria-label="Fecha"></div>
      <div class="rapidos"><button type="button" class="btn chico" data-rapido="0">Hoy</button><button type="button" class="btn chico" data-rapido="-1">Ayer</button></div></div>
    <div class="campo">¿Cuánto tiempo?
      <div class="dur"><select id="f-horas" aria-label="Horas">${horas}</select><select id="f-mins" aria-label="Minutos">${mins}</select></div></div>
    <p class="error ancho" id="f-error"></p>
    <div class="botones ancho">
      <button type="button" class="btn" data-cerrar>Cancelar</button>
      <button type="submit" class="btn verde">Guardar</button>
    </div>`);
  $("hoja").hidden = false;
  document.body.classList.add("sin-scroll");
}

function cerrarForm() { borrador = null; $("hoja").hidden = true; document.body.classList.remove("sin-scroll"); }

function guardarForm() {
  const materia = $("f-materia").value.trim(), minutos = Number($("f-horas").value) * 60 + Number($("f-mins").value);
  if (!materia) { texto("f-error", "Me falta qué estudié."); return; }
  if (!minutos) { texto("f-error", "Me falta cuánto tiempo estudié."); return; }
  db.sesiones.push({ id: nuevoId(), materia, fecha: borrador.fecha, hora: "", minutos });
  db.ajustes.materia = materia;
  cerrarForm(); dibujar();
}

// ============ 8. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);

  // --- formulario ---
  if (borrador) {
    if (en("[data-rapido]")) ponerFecha(sumarDias(hoyISO(), Number(en("[data-rapido]").dataset.rapido)));
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
    db.ajustes[tipo] = Number(b.dataset[tipo]);
    dibujar();
  }
  // --- semana e historial ---
  else if (en("[data-meta]")) {
    const r = prompt("¿Cuántas horas quiero estudiar por semana?", fmtHoras(db.ajustes.meta * 60));
    const n = r === null ? null : parseFloat(String(r).replace(",", "."));
    if (n > 0 && n <= 100) { db.ajustes.meta = n; dibujar(); }
  }
  else if (en("[data-anotar]")) abrirForm();
  else if (en("[data-quitar]")) {
    const s = db.sesiones.find(x => x.id === en("[data-quitar]").dataset.quitar);
    if (s && confirm(`¿Borrar la sesión de ${s.materia} (${fmtMin(s.minutos)})?`)) { db.sesiones = db.sesiones.filter(x => x !== s); dibujar(); }
  }
});

function alCambiar(ev) {
  if (ev.target.id === "f-fecha") { if (ev.target.value) ponerFecha(ev.target.value); else ev.target.value = borrador.fecha; }
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
