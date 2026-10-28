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
    desc: "Marca las materias que ya aprobaste y mira tu avance en Ingeniería Biomédica con un gráfico circular.",
    datos: () => { const r = leer("carrera-resumen"); return r ? `${r.n}/${r.total} materias · ${r.pct}% de la carrera` : "Aún sin materias marcadas"; } }
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
    </a>`).join("") + '<div class="mod vacio">＋ Aquí irá tu próximo módulo</div>';
}

dibujar();
document.addEventListener("visibilitychange", dibujar);   // se actualiza al volver a la página