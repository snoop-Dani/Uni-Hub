// ============ 1. DATOS FIJOS ============
const COLS = ["berry", "keen", "cherry", "moss"];
// Frases con las que empieza (las puedo editar, borrar o agregar las mías)
const FRASES_INICIO = [
  "No tengo que poder con todo hoy: solo con el siguiente paso.",
  "Ya superé momentos difíciles antes, y este también va a pasar.",
  "Un mal examen no define quién soy ni lo que puedo lograr.",
  "Descansar también es parte de avanzar.",
  "Pedir ayuda es de valientes, no de débiles.",
  "Estoy construyendo la vida que quiero, una materia a la vez."
];
// Respiración "en caja": 4 s cada paso, 4 vueltas ≈ 1 minuto
const PASOS = [["Inhalo…", true], ["Sostengo…", true], ["Exhalo…", false], ["Sostengo…", false]];
const SEG = 4, VUELTAS = 4;
const FOTO_MAX = 900, FOTO_CALIDAD = 0.75;   // las fotos se achican a 900 px para que quepan en el iPad

// ============ 2. UTILIDADES ============
const $ = id => document.getElementById(id);
const poner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const texto = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const leerJSON = clave => { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } };
const fmtH = min => String(Math.round(min / 6) / 10).replace(".", ",");   // minutos → "12,5" horas
// elige uno al azar, intentando que no sea el mismo de la vez anterior
const alAzar = (lista, anterior) => {
  if (!lista.length) return null;
  const otros = lista.length > 1 ? lista.filter(x => x !== anterior) : lista;
  return otros[Math.floor(Math.random() * otros.length)];
};

// ============ 3. ESTADO (se guarda en el navegador) ============
// db = { personas: [{ id, nombre, mensaje, fotoId }], metas: [{ id, texto, cuando, logrado }],
//        razones: [{ id, texto }], frases: [{ id, texto }] }
// fotos = { fotoId: "data:image/jpeg;base64,..." } (aparte, porque pesan más)
let db = leerJSON("razones-db");
if (!db || typeof db !== "object") db = { frases: FRASES_INICIO.map(t => ({ id: nuevoId(), texto: t })) };
["personas", "metas", "razones", "frases"].forEach(k => { if (!Array.isArray(db[k])) db[k] = []; });
let fotos = leerJSON("razones-fotos") || {};

let borrador = null;       // lo que se está editando en la hoja
let vista = null;          // lo que está mostrando la pantalla de ánimo: { persona, razon, frase }
let respirando = null;     // temporizador de la respiración

function guardar() { localStorage.setItem("razones-db", JSON.stringify(db)); }
const LISTAS = { meta: "metas", razon: "razones", frase: "frases" };

// ============ 4. MIS LOGROS (salen de los otros módulos) ============
function logros() {
  const out = [];
  const c = leerJSON("carrera-resumen");
  if (c && c.n) out.push(`🎓 Ya aprobé ${c.n} de ${c.total} materias de mi carrera (${c.pct} %).`);
  const e = leerJSON("estudio-db"), min = e && Array.isArray(e.sesiones) ? e.sesiones.reduce((s, x) => s + (x.minutos || 0), 0) : 0;
  if (min >= 30) out.push(`⏱️ He estudiado ${fmtH(min)} horas con mis sesiones de estudio.`);
  const en = leerJSON("entregas-db"), hechas = en && Array.isArray(en.items) ? en.items.filter(x => x.hecha).length : 0;
  if (hechas) out.push(`📅 Ya entregué ${hechas} ${hechas === 1 ? "tarea o examen" : "tareas y exámenes"}.`);
  const g = leerJSON("graduacion-db"), tcu = g && g.tcu && Array.isArray(g.tcu.horas) ? g.tcu.horas.reduce((s, x) => s + (x.horas || 0), 0) : 0;
  if (tcu) out.push(`🤝 Llevo ${String(Math.round(tcu * 10) / 10).replace(".", ",")} horas de TCU.`);
  const r = leerJSON("roadmap-hechas"), tareas = r ? Object.values(r).filter(Boolean).length : 0;
  if (tareas) out.push(`🧭 Completé ${tareas} ${tareas === 1 ? "tarea" : "tareas"} de mi roadmap de pasantía.`);
  const metas = db.metas.filter(m => m.logrado).length;
  if (metas) out.push(`🎯 Ya cumplí ${metas} de mis metas.`);
  return out;
}

// ============ 5. DIBUJAR ============
function dibujarPersonas() {
  poner("personas", `
    <div class="p-head"><h2>📸 Por quién lo hago</h2><button class="btn verde chico" data-nueva-persona>＋ Agregar persona</button></div>
    ${db.personas.length ? `<div class="personas">${db.personas.map((p, i) => `
      <button class="persona c-${COLS[i % COLS.length]}" data-persona="${p.id}">
        ${fotos[p.fotoId] ? `<img class="foto" src="${fotos[p.fotoId]}" alt="">` : '<span class="sin-foto">💛</span>'}
        <span class="p-txt"><b>${esc(p.nombre)}</b>${p.mensaje ? `<span>${esc(p.mensaje)}</span>` : ""}</span>
      </button>`).join("")}</div>`
      : '<p class="pista">Agrego a mi familia y a las personas por las que estudio, con una foto y lo que quiero recordar cuando me cueste.</p>'}
    <p class="espacio">🔒 Mis fotos y mensajes se guardan solo en este dispositivo (y en mi respaldo).</p>`);
}

function lista(id, titulo, tipo, items, vacio, conCheck) {
  poner(id, `
    <div class="p-head"><h2>${titulo}</h2><button class="btn verde chico" data-nuevo="${tipo}">＋ Agregar</button></div>
    ${items.length ? `<ul class="lista">${items.map(x => `
      <li class="item ${conCheck ? "" : "sin-check"} ${x.logrado ? "logrado" : ""}">
        ${conCheck ? `<button class="ok" data-logrado="${x.id}" aria-label="${x.logrado ? "Marcar como pendiente" : "Marcar como cumplida"}">${x.logrado ? "✓" : ""}</button>` : ""}
        <button class="item-txt" data-editar="${tipo}" data-id="${x.id}">${esc(x.texto)}${x.cuando ? `<small>${esc(x.cuando)}</small>` : ""}</button>
      </li>`).join("")}</ul>` : `<p class="pista">${vacio}</p>`}`);
}

function dibujarLogros() {
  const ls = logros();
  poner("logros", `
    <div class="p-head"><h2>🌟 Lo que ya logré</h2></div>
    ${ls.length ? `<ul class="logros">${ls.map(l => `<li>${esc(l)}</li>`).join("")}</ul>`
      : '<p class="pista">Aquí van a aparecer solos mis avances de los otros módulos: materias aprobadas, horas de estudio, entregas…</p>'}`);
}

function dibujar() {
  dibujarPersonas();
  // metas: primero las pendientes
  lista("metas", "🎯 Mis metas", "meta", [...db.metas].sort((a, b) => a.logrado - b.logrado), "Ej.: Hacer mi pasantía en una empresa de dispositivos médicos.", true);
  lista("razones", "💪 Mis razones para seguir", "razon", db.razones, "Ej.: Quiero ayudar a crear tecnología que salve vidas.", false);
  lista("frases", "💬 Frases que me ayudan", "frase", db.frases, "Agrego frases que me den fuerza.", false);
  dibujarLogros();
}

// ============ 6. PANTALLA DE ÁNIMO ============
function elegir() {
  const ant = vista || {};
  vista = {
    persona: alAzar(db.personas, ant.persona),
    razon: alAzar([...db.razones, ...db.metas.filter(m => !m.logrado)], ant.razon),
    frase: alAzar(db.frases, ant.frase)
  };
}

function dibujarAnimo() {
  pararRespiracion();
  const p = vista.persona, ls = logros();
  poner("animo", `<div class="an-caja">
    <div class="an-top"><span>💛 RESPIRO. ESTOY AQUÍ POR UNA RAZÓN.</span><button class="an-cerrar" data-cerrar-animo>Cerrar</button></div>
    ${p ? `${fotos[p.fotoId] ? `<img class="an-foto" src="${fotos[p.fotoId]}" alt="">` : '<span class="an-sin-foto">💛</span>'}
      <p class="an-quien">Lo hago por ${esc(p.nombre)}</p>${p.mensaje ? `<p class="an-mensaje">${esc(p.mensaje)}</p>` : ""}`
      : `<span class="an-sin-foto">💛</span><p class="an-quien">Puedo con esto, paso a paso.</p>`}
    ${vista.razon ? `<div class="an-tarjeta"><h3>${vista.razon.cuando !== undefined ? "🎯 MI META" : "💪 MI RAZÓN"}</h3><p>${esc(vista.razon.texto)}</p></div>` : ""}
    ${vista.frase ? `<div class="an-tarjeta"><h3>💬 PARA HOY</h3><p>${esc(vista.frase.texto)}</p></div>` : ""}
    ${ls.length ? `<div class="an-tarjeta"><h3>🌟 MIRA TODO LO QUE YA LOGRÉ</h3><ul>${ls.map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
    <div class="an-botones">
      <button class="an-btn" data-respirar>🌬️ Respirar 1 minuto</button>
      <button class="an-btn suave" data-otra>↻ Otra</button>
    </div>
  </div>`);
}

function abrirAnimo() {
  elegir(); dibujarAnimo();
  $("animo").hidden = false; $("animo").scrollTop = 0;
  document.body.classList.add("sin-scroll");
}
function cerrarAnimo() { pararRespiracion(); $("animo").hidden = true; document.body.classList.remove("sin-scroll"); }

// ---------- Respiración ----------
function respirar() {
  pararRespiracion();
  poner("animo", `<div class="an-caja">
    <div class="an-top"><span>🌬️ RESPIRO CONMIGO</span><button class="an-cerrar" data-volver-animo>Volver</button></div>
    <div class="respira"><div class="circulo" id="circulo"></div><p class="respira-txt" id="respira-txt">Inhalo…</p><p class="respira-cuenta" id="respira-cuenta"></p></div>
    <p class="an-mensaje">Sigo el círculo: inhalo por la nariz cuando crece, exhalo despacio cuando se achica.</p>
  </div>`);
  let paso = 0;
  const siguiente = () => {
    if (paso >= PASOS.length * VUELTAS) {
      texto("respira-txt", "Muy bien 💛"); texto("respira-cuenta", "Puedo repetirlo cuando quiera.");
      $("circulo").classList.remove("grande"); respirando = null; return;
    }
    const [frase, grande] = PASOS[paso % PASOS.length];
    texto("respira-txt", frase);
    texto("respira-cuenta", `Vuelta ${Math.floor(paso / PASOS.length) + 1} de ${VUELTAS}`);
    $("circulo").classList.toggle("grande", grande);
    paso++;
    respirando = setTimeout(siguiente, SEG * 1000);
  };
  respirando = setTimeout(siguiente, 50);
}
function pararRespiracion() { if (respirando) { clearTimeout(respirando); respirando = null; } }

// ============ 7. FORMULARIOS ============
function abrirHoja(html) { poner("form", html); $("hoja").hidden = false; document.body.classList.add("sin-scroll"); }
function cerrarForm() { borrador = null; $("hoja").hidden = true; document.body.classList.remove("sin-scroll"); }
const botones = borrar => `<p class="error" id="f-error"></p>
  <div class="botones">
    ${borrar ? '<button type="button" class="btn peligro" data-borrar>Eliminar</button>' : ""}
    <button type="button" class="btn" data-cerrar>Cancelar</button>
    <button type="submit" class="btn verde">Guardar</button>
  </div>`;

function vistaFoto() {   // la foto dentro del formulario
  const src = borrador.foto !== undefined ? borrador.foto : fotos[borrador.fotoId];
  poner("f-foto", `${src ? `<img src="${src}" alt="">` : '<span class="vacia">💛</span>'}
    <span class="f-foto-btns"><button type="button" class="btn chico" data-elegir-foto>📷 ${src ? "Cambiar foto" : "Elegir foto"}</button>
      ${src ? '<button type="button" class="btn chico peligro" data-quitar-foto>Quitar foto</button>' : ""}</span>`);
}

function abrirPersona(p) {
  // foto: undefined = no la toqué · "" = la quité · "data:..." = foto nueva
  borrador = p ? Object.assign({ tipo: "persona", foto: undefined }, p) : { tipo: "persona", id: null, nombre: "", mensaje: "", fotoId: "", foto: undefined };
  const b = borrador;
  abrirHoja(`
    <h2>${b.id ? "Editar" : "Agregar a alguien que me inspira"}</h2>
    <div class="f-foto" id="f-foto"></div>
    <label class="campo">¿Quién es?<input id="f-nombre" value="${esc(b.nombre)}" placeholder="Ej.: Mamá, mi abuela, mi hermanito…"></label>
    <label class="campo">¿Qué quiero recordar cuando me cueste?
      <textarea id="f-mensaje" rows="3" placeholder="Ej.: Ella trabajó muchísimo para que yo pudiera estudiar. Quiero que se sienta orgullosa.">${esc(b.mensaje)}</textarea></label>
    ${botones(!!b.id)}`);
  vistaFoto();
}

function abrirItem(tipo, x) {
  borrador = x ? Object.assign({ tipo }, x) : { tipo, id: null, texto: "", cuando: "", logrado: false };
  const b = borrador;
  const titulo = { meta: "mi meta", razon: "mi razón", frase: "una frase" }[tipo];
  const ejemplo = { meta: "Ej.: Graduarme con honores", razon: "Ej.: Quiero ser la primera ingeniera de mi familia", frase: "Ej.: Lo difícil no es imposible" }[tipo];
  abrirHoja(`
    <h2>${b.id ? "Editar" : "Agregar"} ${titulo}</h2>
    <label class="campo">${tipo === "meta" ? "¿Qué quiero lograr?" : tipo === "razon" ? "¿Por qué sigo?" : "Frase"}
      <textarea id="f-texto" rows="3" placeholder="${ejemplo}">${esc(b.texto)}</textarea></label>
    ${tipo === "meta" ? `<label class="campo">¿Para cuándo? (opcional)<input id="f-cuando" value="${esc(b.cuando || "")}" placeholder="Ej.: Junio 2027, antes de graduarme…"></label>` : ""}
    ${botones(!!b.id)}`);
}

// Achica la foto con un <canvas> y la devuelve como texto "data:image/jpeg;base64,..."
function comprimir(archivo) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo), img = new Image();
    img.onload = () => {
      const escala = Math.min(1, FOTO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * escala); c.height = Math.round(img.naturalHeight * escala);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", FOTO_CALIDAD));
    };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error("No pude abrir esa imagen.")); };
    img.src = url;
  });
}

function guardarForm() {
  const b = borrador;
  if (b.tipo === "persona") {
    const nombre = $("f-nombre").value.trim();
    if (!nombre) { texto("f-error", "Me falta quién es."); return; }
    const p = { id: b.id || nuevoId(), nombre, mensaje: $("f-mensaje").value.trim(), fotoId: b.fotoId || "" };
    const copia = Object.assign({}, fotos);              // por si no cabe, para dejar todo como estaba
    if (b.foto) { p.fotoId = p.fotoId || nuevoId(); fotos[p.fotoId] = b.foto; }
    else if (b.foto === "" && p.fotoId) { delete fotos[p.fotoId]; p.fotoId = ""; }
    try { localStorage.setItem("razones-fotos", JSON.stringify(fotos)); }
    catch (e) { fotos = copia; texto("f-error", "Ya no cabe otra foto en este dispositivo. Puedo quitar alguna foto vieja e intentarlo otra vez."); return; }
    const i = db.personas.findIndex(x => x.id === p.id);
    if (i >= 0) db.personas[i] = p; else db.personas.push(p);
  } else {
    const t = $("f-texto").value.trim();
    if (!t) { texto("f-error", "Me falta escribirla."); return; }
    const x = { id: b.id || nuevoId(), texto: t };
    if (b.tipo === "meta") { x.cuando = $("f-cuando").value.trim(); x.logrado = !!b.logrado; }
    const l = db[LISTAS[b.tipo]], i = l.findIndex(y => y.id === x.id);
    if (i >= 0) l[i] = x; else l.push(x);
  }
  guardar(); cerrarForm(); dibujar();
}

// ============ 8. EVENTOS ============
document.addEventListener("click", ev => {
  const t = ev.target, en = s => t.closest(s);

  // --- pantalla de ánimo ---
  if (!$("animo").hidden) {
    if (en("[data-cerrar-animo]")) cerrarAnimo();
    else if (en("[data-otra]")) { elegir(); dibujarAnimo(); $("animo").scrollTop = 0; }
    else if (en("[data-respirar]")) respirar();
    else if (en("[data-volver-animo]")) dibujarAnimo();
    return;
  }

  // --- formularios ---
  if (borrador) {
    if (en("[data-elegir-foto]")) $("f-archivo").click();
    else if (en("[data-quitar-foto]")) { borrador.foto = ""; vistaFoto(); }
    else if (en("[data-borrar]")) {
      const nombre = borrador.tipo === "persona" ? borrador.nombre : "esto";
      if (confirm(`¿Eliminar ${borrador.tipo === "persona" ? "a " + nombre : nombre}?`)) {
        if (borrador.tipo === "persona") {
          if (borrador.fotoId) { delete fotos[borrador.fotoId]; localStorage.setItem("razones-fotos", JSON.stringify(fotos)); }
          db.personas = db.personas.filter(x => x.id !== borrador.id);
        } else db[LISTAS[borrador.tipo]] = db[LISTAS[borrador.tipo]].filter(x => x.id !== borrador.id);
        guardar(); cerrarForm(); dibujar();
      }
    }
    else if (en("[data-cerrar]") || t.id === "hoja") cerrarForm();
    return;
  }

  // --- página ---
  if (en("[data-animo]")) abrirAnimo();
  else if (en("[data-nueva-persona]")) abrirPersona(null);
  else if (en("[data-persona]")) abrirPersona(db.personas.find(p => p.id === en("[data-persona]").dataset.persona));
  else if (en("[data-nuevo]")) abrirItem(en("[data-nuevo]").dataset.nuevo, null);
  else if (en("[data-editar]")) {
    const b = en("[data-editar]"), tipo = b.dataset.editar;
    abrirItem(tipo, db[LISTAS[tipo]].find(x => x.id === b.dataset.id));
  }
  else if (en("[data-logrado]")) {
    const m = db.metas.find(x => x.id === en("[data-logrado]").dataset.logrado);
    m.logrado = !m.logrado; guardar(); dibujar();
  }
});

$("f-archivo").addEventListener("change", async ev => {
  const archivo = ev.target.files[0];
  ev.target.value = "";                      // para poder elegir la misma foto otra vez
  if (!archivo || !borrador) return;
  texto("f-error", "");
  try { borrador.foto = await comprimir(archivo); vistaFoto(); }
  catch (e) { texto("f-error", e.message); }
});
$("form").addEventListener("submit", ev => { ev.preventDefault(); guardarForm(); });
document.addEventListener("keydown", ev => {
  if (ev.key !== "Escape") return;
  if (!$("animo").hidden) cerrarAnimo(); else if (borrador) cerrarForm();
});

// ============ 9. INICIO ============
try { guardar(); } catch (e) {}   // guarda las frases de inicio la primera vez
dibujar();
