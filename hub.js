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
}

dibujar();
document.addEventListener("visibilitychange", dibujar);   // se actualiza al volver a la página