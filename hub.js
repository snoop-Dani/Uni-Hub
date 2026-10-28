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
const PREFIJOS = ["roadmap-", "carrera-", "horarios-", "notas-"];   // si agregas un módulo, pon aquí su prefijo
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
    if (!confirm(`¿Restaurar el respaldo del ${cuando}?\n\nEsto reemplaza los datos de Roadmap, Mi carrera, Horarios y Mis notas en este dispositivo. Si me equivoco, puedo deshacerlo.`)) return;
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