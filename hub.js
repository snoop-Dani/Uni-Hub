const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const TOTAL_ROADMAP = 45;   // si cambias cuántas tareas tiene el roadmap, cámbialo aquí

// Lee lo que guarda el roadmap (es el mismo sitio web, así que comparten almacenamiento)
function leer(clave) { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } }
function resumenRoadmap() {
  const hechas = leer("roadmap-hechas") || {};
  const apps = leer("roadmap-apps");
  const n = Object.values(hechas).filter(Boolean).length;
  return { n, pct: Math.round(100 * n / TOTAL_ROADMAP), empresas: Array.isArray(apps) ? apps.length : 0 };
}

// Lee lo que guarda Entregas: pendientes atrasadas, de esta semana y la próxima
function resumenEntregas() {
  const db = leer("entregas-db"), items = db && Array.isArray(db.items) ? db.items.filter(e => !e.hecha && e.fecha) : [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dias = f => { const [a, m, d] = f.split("-").map(Number); return Math.round((new Date(a, m - 1, d) - hoy) / 86400000); };
  const finSemana = (7 - hoy.getDay()) % 7;   // días que faltan para el domingo
  const prox = items.filter(e => dias(e.fecha) >= 0).sort((a, b) => (a.fecha + (a.hora || "99")).localeCompare(b.fecha + (b.hora || "99")))[0];
  return {
    total: items.length,
    atrasadas: items.filter(e => dias(e.fecha) < 0).length,
    semana: items.filter(e => dias(e.fecha) >= 0 && dias(e.fecha) <= finSemana).length,
    prox, enDias: prox ? dias(prox.fecha) : null
  };
}

// Lee lo que guarda Sesiones de estudio: minutos de hoy y de esta semana (lunes a domingo)
function resumenEstudio() {
  const db = leer("estudio-db"), s = db && Array.isArray(db.sesiones) ? db.sesiones : [];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const h = new Date(), lunes = new Date(h); lunes.setDate(h.getDate() - (h.getDay() + 6) % 7);
  const hoy = iso(h), desde = iso(lunes);
  const suma = lista => lista.reduce((t, x) => t + (x.minutos || 0), 0);
  const activa = leer("estudio-activa");
  return {
    total: s.length,
    hoy: suma(s.filter(x => x.fecha === hoy)),
    semana: suma(s.filter(x => x.fecha >= desde && x.fecha <= hoy)),
    meta: (db && db.ajustes && db.ajustes.meta) || 10,
    temasHoy: db && Array.isArray(db.temas) ? db.temas.filter(t => !t.hecho && t.fecha === hoy).length : 0,   // de mi plan de estudio
    activa: activa && (activa.fin === null || activa.fin > Date.now()) ? activa : null   // solo si sigue corriendo o en pausa
  };
}
const fmtMin = m => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };

// Lee lo que guarda Matrícula y pagos: pagos vencidos, el próximo y fechas importantes cercanas (de todos los cuatrimestres)
function resumenPagos() {
  const db = leer("pagos-db"), periodos = db && db.periodos ? Object.values(db.periodos) : [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dias = f => { const [a, m, d] = f.split("-").map(Number); return Math.round((new Date(a, m - 1, d) - hoy) / 86400000); };
  const cuotas = [], fechas = [];
  periodos.forEach(p => {
    if (Array.isArray(p.cuotas)) p.cuotas.filter(q => !q.pagada && q.fecha).forEach(q => cuotas.push(q));
    if (Array.isArray(p.fechas)) p.fechas.filter(f => f.fecha && dias(f.fecha) >= 0 && dias(f.fecha) <= 14).forEach(f => fechas.push(f));
  });
  const orden = (a, b) => a.fecha.localeCompare(b.fecha);
  return {
    moneda: (db && db.moneda) || "₡", hayDatos: periodos.some(p => (p.cuotas || []).length || (p.conceptos || []).length || (p.fechas || []).length),
    vencidas: cuotas.filter(q => dias(q.fecha) < 0).length,
    prox: cuotas.filter(q => dias(q.fecha) >= 0).sort(orden)[0], fecha: fechas.sort(orden)[0], dias
  };
}
const enDias = d => d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`;

// Lee lo que guarda Graduación (y el avance de Mi carrera): % general, horas de TCU y requisitos cumplidos
function resumenGraduacion() {
  const db = leer("graduacion-db"), c = leer("carrera-resumen");
  if (!db || !Array.isArray(db.requisitos)) return null;
  const tcu = db.tcu || {}, horas = (tcu.horas || []).reduce((s, h) => s + (h.horas || 0), 0), meta = tcu.meta || 150;
  const frac = r => r.tipo === "materias" ? (c && c.total ? Math.min(1, c.n / c.total) : 0)   // misma cuenta que graduacion.js
    : r.tipo === "tcu" ? Math.min(1, horas / meta)
    : r.tipo === "check" ? ({ pendiente: 0, proceso: 0.5, aprobado: 1 }[r.estado] || 0)
    : r.meta ? Math.min(1, (r.lleva || 0) / r.meta) : null;
  const fs = db.requisitos.map(frac), conMeta = fs.filter(f => f !== null);
  return { pct: conMeta.length ? Math.round(100 * conMeta.reduce((s, f) => s + f, 0) / conMeta.length) : 0,
    cumplidos: fs.filter(f => f === 1).length, total: fs.length, horas, meta };
}

// ---------- Tus módulos ----------
// Para añadir otro: copia un bloque, cambia los textos y pon la carpeta en "url" (por ejemplo "notas/")
const MODULOS = [
  { icono: "🧭", titulo: "Roadmap de pasantía", color: "keen", url: "roadmap/",
    desc: "Etapas, tareas, calendario, tracker de empresas y cursos para llegar a junio de 2027.",
    datos: () => { const r = resumenRoadmap(); return `${r.n}/${TOTAL_ROADMAP} tareas · ${r.pct}% · ${r.empresas} empresas`; } },
  { icono: "🎓", titulo: "Mi carrera", color: "berry", url: "carrera/",
    desc: "Marco las materias que ya aprobé y veo mi avance en Ingeniería Biomédica con un gráfico circular.",
    datos: () => { const r = leer("carrera-resumen"); return r ? `${r.n}/${r.total} materias · ${r.pct}% de la carrera` : "Aún sin materias marcadas"; } },
  { icono: "🗓️", titulo: "Horarios", color: "cherry", url: "horarios/",
    desc: "Armo varias opciones de horario por cuatrimestre, veo los choques y elijo la mía.",
    datos: () => {
      const r = leer("horarios-resumen");
      if (!r || !r.opciones) return r ? `Próximo: ${r.periodo} · aún sin opciones` : "Aún sin horarios";
      return `${r.periodo} · ${r.opciones} ${r.opciones === 1 ? "opción" : "opciones"} · ${r.elegida ? "★ " + r.elegida : "sin elegir"}`;
    } },
  { icono: "📊", titulo: "Mis notas", color: "moss", url: "notas/",
    desc: "Llevo mis evaluaciones de cada materia y sé cuánto necesito en lo que falta para aprobar.",
    datos: () => {
      const r = leer("notas-resumen");
      if (!r || !r.materias) return r ? `${r.periodo} · aún sin materias` : "Aún sin notas";
      const prom = r.promedio === null ? "sin notas aún" : `promedio ${String(r.promedio).replace(".", ",")}`;
      return `${r.periodo} · ${r.materias} ${r.materias === 1 ? "materia" : "materias"} · ${prom}${r.riesgo ? ` · ⚠ ${r.riesgo} en riesgo` : ""}`;
    } },
  { icono: "📅", titulo: "Entregas y exámenes", color: "berry", url: "entregas/",
    desc: "Anoto tareas, reportes, quices y exámenes, y veo qué vence hoy, mañana y esta semana.",
    datos: () => {
      const r = resumenEntregas();
      if (!r.total) return "Nada pendiente ✓";
      const partes = [];
      if (r.atrasadas) partes.push(`⚠ ${r.atrasadas} ${r.atrasadas === 1 ? "atrasada" : "atrasadas"}`);
      partes.push(`${r.semana} esta semana`);
      if (r.prox) partes.push(`próxima: ${r.prox.titulo} (${r.enDias === 0 ? "hoy" : r.enDias === 1 ? "mañana" : `en ${r.enDias} días`})`);
      return partes.join(" · ");
    } },
  { icono: "⏱️", titulo: "Sesiones de estudio", color: "cherry", url: "estudio/",
    desc: "Planeo los temas que voy a estudiar, los estudio con pomodoros y sigo mi meta semanal.",
    datos: () => {
      const r = resumenEstudio();
      if (!r.total && !r.activa && !r.temasHoy) return "Aún sin sesiones";
      const partes = [];
      if (r.activa) partes.push(r.activa.modo === "enfoque" ? `⏱ Estudiando ${r.activa.materia}` : "☕ En descanso");
      partes.push(`hoy ${fmtMin(r.hoy)}`, `semana ${String(Math.round(r.semana / 6) / 10).replace(".", ",")} de ${String(r.meta).replace(".", ",")} h`);
      if (r.temasHoy) partes.push(`📚 ${r.temasHoy} ${r.temasHoy === 1 ? "tema" : "temas"} para hoy`);
      return partes.join(" · ");
    } },
  { icono: "💳", titulo: "Matrícula y pagos", color: "moss", url: "pagos/",
    desc: "Anoto los costos de cada cuatrimestre, mis becas y mis pagos, y no se me pasa ninguna fecha.",
    datos: () => {
      const r = resumenPagos();
      if (!r.hayDatos) return "Aún sin pagos";
      const partes = [];
      if (r.vencidas) partes.push(`⚠ ${r.vencidas} ${r.vencidas === 1 ? "pago vencido" : "pagos vencidos"}`);
      partes.push(r.prox ? `próximo: ${r.moneda}${r.prox.monto.toLocaleString("es-CR", { maximumFractionDigits: 2 })} (${enDias(r.dias(r.prox.fecha))})` : "sin pagos pendientes ✓");
      if (r.fecha) partes.push(`📌 ${r.fecha.nombre} ${enDias(r.dias(r.fecha.fecha))}`);
      return partes.join(" · ");
    } },
  { icono: "🎓", titulo: "Graduación", color: "keen", url: "graduacion/",
    desc: "Sigo mis requisitos para graduarme: materias, horas de TCU, inglés B2, sellos verdes y más.",
    datos: () => {
      const r = resumenGraduacion();
      if (!r) return "Aún sin revisar mis requisitos";
      const h = String(Math.round(r.horas * 100) / 100).replace(".", ",");
      return `Voy ${r.pct} % · TCU ${h} de ${String(r.meta).replace(".", ",")} h · ${r.cumplidos} de ${r.total} requisitos cumplidos`;
    } }
];

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function dibujar() {
  const h = new Date();
  document.getElementById("fecha-hub").textContent = `Hoy · ${h.getDate()} ${MESES[h.getMonth()]} ${h.getFullYear()}`;
  document.getElementById("cuenta").textContent = `${MODULOS.length} ${MODULOS.length === 1 ? "módulo" : "módulos"}`;
  document.getElementById("modulos").innerHTML = MODULOS.map(m => `
    <a class="mod mod-${m.color}" href="${esc(m.url)}">
      <span class="icono">${m.icono}</span>
      <h3>${esc(m.titulo)}</h3>
      <p class="desc">${esc(m.desc)}</p>
      ${m.datos ? `<p class="datos">${esc(m.datos())}</p>` : ""}
      <span class="abrir">Abrir →</span>
    </a>`).join("") + '<div class="mod vacio">＋ Aquí irá mi próximo módulo</div>';
  dibujarRespaldo();
}

// ---------- Respaldo de mis datos ----------
// Todo lo que guardan los módulos vive en este navegador. Aquí lo descargo en un archivo .json y lo puedo recuperar.
const PREFIJOS = ["roadmap-", "carrera-", "horarios-", "notas-", "entregas-", "estudio-", "pagos-", "graduacion-"];   // si agregas un módulo, pon aquí su prefijo
const ULTIMO = "unihub-ultimo-respaldo";                             // fecha del último respaldo descargado
const ANTES = "unihub-antes-de-restaurar";                           // copia de seguridad para "Deshacer"
const esMio = clave => PREFIJOS.some(p => clave.startsWith(p));
const dosDigitos = n => String(n).padStart(2, "0");
const fechaBonita = d => `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${d.getHours()}:${dosDigitos(d.getMinutes())}`;

function misClaves() {
  const claves = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (esMio(k)) claves.push(k); }
  return claves.sort();
}
function copiaActual() { const copia = {}; misClaves().forEach(k => { copia[k] = localStorage.getItem(k); }); return copia; }
function reemplazarCon(datos) {            // borra mis datos y pone los nuevos
  misClaves().forEach(k => localStorage.removeItem(k));
  Object.keys(datos).forEach(k => localStorage.setItem(k, datos[k]));
}

function descargarRespaldo() {
  const h = new Date();
  const contenido = JSON.stringify({ app: "uni-hub", version: 1, fecha: h.toISOString(), datos: copiaActual() }, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contenido], { type: "application/json" }));
  a.download = `uni-hub-respaldo-${h.getFullYear()}-${dosDigitos(h.getMonth() + 1)}-${dosDigitos(h.getDate())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  try { localStorage.setItem(ULTIMO, h.toISOString()); } catch (e) {}
  dibujarRespaldo();
}

function restaurarRespaldo(archivo) {
  const lector = new FileReader();
  lector.onload = () => {
    let r = null;
    try { r = JSON.parse(lector.result); } catch (e) {}
    if (!r || r.app !== "uni-hub" || !r.datos || typeof r.datos !== "object") { alert("Ese archivo no es un respaldo del Uni-Hub."); return; }
    // solo acepto claves de mis módulos con datos válidos
    const datos = {};
    Object.keys(r.datos).forEach(k => {
      if (!esMio(k) || typeof r.datos[k] !== "string") return;
      try { JSON.parse(r.datos[k]); datos[k] = r.datos[k]; } catch (e) {}
    });
    const cuando = r.fecha && !isNaN(new Date(r.fecha)) ? fechaBonita(new Date(r.fecha)) : "fecha desconocida";
    if (!confirm(`¿Restaurar el respaldo del ${cuando}?\n\nEsto reemplaza los datos de todos mis módulos (Roadmap, Mi carrera, Horarios, Mis notas, Entregas…) en este dispositivo. Si me equivoco, puedo deshacerlo.`)) return;
    try {
      localStorage.setItem(ANTES, JSON.stringify(copiaActual()));
      reemplazarCon(datos);
      alert("✓ Listo: restauré mis datos del respaldo.");
    } catch (e) { alert("No se pudo restaurar: " + e.message); }
    dibujar();
  };
  lector.readAsText(archivo);
}

function deshacerRestauracion() {
  let copia = null;
  try { copia = JSON.parse(localStorage.getItem(ANTES)); } catch (e) {}
  if (!copia || !confirm("¿Volver a los datos que tenía antes de restaurar el respaldo?")) return;
  try { reemplazarCon(copia); localStorage.removeItem(ANTES); } catch (e) { alert("No se pudo deshacer: " + e.message); }
  dibujar();
}

function dibujarRespaldo() {
  let ultimo = null, hayCopia = false;
  try { ultimo = localStorage.getItem(ULTIMO); hayCopia = !!localStorage.getItem(ANTES); } catch (e) {}
  const dias = ultimo ? Math.floor((Date.now() - new Date(ultimo)) / 86400000) : null;
  const el = document.getElementById("respaldo-estado");
  el.textContent = dias === null ? "Todavía no he descargado ningún respaldo."
    : dias === 0 ? "Último respaldo: hoy ✓"
    : `Último respaldo: hace ${dias} ${dias === 1 ? "día" : "días"}${dias >= 14 ? " · toca hacer uno nuevo" : ""}`;
  el.classList.toggle("pendiente", dias === null || dias >= 14);   // recordatorio cada 2 semanas
  document.getElementById("b-deshacer").hidden = !hayCopia;
}

document.getElementById("b-descargar").addEventListener("click", descargarRespaldo);
document.getElementById("b-restaurar").addEventListener("click", () => document.getElementById("archivo").click());
document.getElementById("b-deshacer").addEventListener("click", deshacerRestauracion);
document.getElementById("archivo").addEventListener("change", ev => {
  const f = ev.target.files[0];
  ev.target.value = "";                    // para poder elegir el mismo archivo otra vez
  if (f) restaurarRespaldo(f);
});

dibujar();
document.addEventListener("visibilitychange", dibujar);   // se actualiza al volver a la página