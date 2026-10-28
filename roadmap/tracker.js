// ============ tracker.js — pestaña Tracker (se carga DESPUÉS de script.js) ============
// Ayudantes propios (así este archivo no depende de funciones que script.js no tiene)
const tkPoner = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const tkEscuchar = (id, tipo, fn) => { const el = $(id); if (el) el.addEventListener(tipo, fn); };

const EST = ESTADOS.concat([{ texto: "Oferta", color: "#1F8A70" }]);   // los 5 estados de siempre + "Oferta"

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
// Seguimiento "vencido": la fecha ya llegó y el estado es Aplicado (2) o Entrevista (3)
const vence = a => !!a.seguimiento && a.seguimiento <= hoyISO() && (a.estado === 2 || a.estado === 3);

// Fechas: se muestran como "21 oct 2026" (el selector nativo queda invisible encima)
const fmtF = f => f ? `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(0, 4)}` : "Elegir fecha";
function ponerFecha(fila, campo, valor) {
  const inp = fila.querySelector(`[data-campo="${campo}"]`), lab = inp.parentElement;
  inp.value = valor || "";
  lab.querySelector(".fv").textContent = fmtF(valor);
  lab.classList.toggle("vacia", !valor);
}

// ---------- Datos (se guardan en el navegador) ----------
const SEMILLA = [
  { empresa: "Medtronic", puesto: "Apoyo de investigación (temporal)", estado: 0 },
  { empresa: "Roche", estado: 1 }, { empresa: "Abbott", estado: 1 },
  { empresa: "Boston Scientific", estado: 1 }, { empresa: "Baxter", estado: 1 }
];
let apps = null;
try { apps = JSON.parse(localStorage.getItem("roadmap-apps")); } catch (e) {}
if (!Array.isArray(apps)) apps = SEMILLA.map(a => ({ id: uid(), puesto: "", enlace: "", aplicado: "", seguimiento: "", requisitos: "", contacto: "", notas: "", ...a }));
apps.forEach(a => { if (!EST[a.estado]) a.estado = 0; });
const abiertos = new Set();                 // filas con "Detalles" abiertos

function persistir() {
  try { localStorage.setItem("roadmap-apps", JSON.stringify(apps)); } catch (e) {}
  dibujarResumen();
  dibujarTracker();                          // actualiza la franja del dashboard
}

// ---------- Franja del dashboard (reemplaza la de script.js) ----------
function dibujarTracker() {
  tkPoner("tracker-mini", `
    <div class="tr-head"><h2>Internship Tracker</h2>
      <div class="tr-leyenda">${EST.map(e => `<span><i class="punto" style="--c:${e.color}"></i>${e.texto}</span>`).join("")}</div></div>
    <div class="tr-lista">${apps.length ? apps.map((a, i) => `
      <button class="tr-empresa" data-empresa="${i}"><b>${esc(a.empresa) || "Sin nombre"}</b>
        <span class="tr-estado"><i class="punto" style="--c:${EST[a.estado].color}"></i>${EST[a.estado].texto}${vence(a) ? " ⏰" : ""}</span></button>`).join("")
      : '<span class="tr-vacio">Aún no hay empresas. Añádelas en la pestaña Tracker.</span>'}</div>`);
}

// ---------- Resumen (tarjetas de arriba) ----------
function dibujarResumen() {
  const n = e => apps.filter(a => a.estado === e).length, pend = apps.filter(vence).length;
  tkPoner("tk-stats", [["Total", apps.length], ["Aplicadas", n(2)], ["Entrevistas", n(3)], ["Ofertas", n(5)], ["Seguimientos por hacer", pend]]
    .map(([l, v]) => `<div class="tk-stat ${l.startsWith("Seg") && v > 0 ? "alerta" : ""}"><b>${v}</b><span>${l}</span></div>`).join(""));
}

// ---------- Tabla ----------
function filaHTML(a) {
  const e = EST[a.estado];
  return `
  <div class="tk-fila ${abiertos.has(a.id) ? "abierto" : ""}" data-id="${a.id}">
    <label class="tk-c" data-l="Empresa"><input data-campo="empresa" value="${esc(a.empresa)}" placeholder="Empresa"></label>
    <label class="tk-c" data-l="Puesto"><input data-campo="puesto" value="${esc(a.puesto)}" placeholder="Puesto"></label>
    <div class="tk-c tk-link" data-l="Enlace"><input data-campo="enlace" type="url" value="${esc(a.enlace)}" placeholder="https://…">
      <a class="tk-abrir" target="_blank" rel="noopener" ${a.enlace ? `href="${esc(a.enlace)}"` : ""} aria-label="Abrir enlace">↗</a></div>
    <div class="tk-c" data-l="Aplicado"><label class="tk-fecha ${a.aplicado ? "" : "vacia"}"><span class="fv">${fmtF(a.aplicado)}</span><input data-campo="aplicado" type="date" value="${esc(a.aplicado)}"></label></div>
    <label class="tk-c" data-l="Estado"><span class="tk-estado" style="--c:${e.color}"><i class="punto"></i>
      <select data-campo="estado" autocomplete="off">${EST.map((x, k) => `<option value="${k}" ${k === a.estado ? "selected" : ""}>${x.texto}</option>`).join("")}</select></span></label>
    <div class="tk-c" data-l="Seguimiento"><label class="tk-fecha ${a.seguimiento ? "" : "vacia"} ${vence(a) ? "vence" : ""}"><span class="fv">${fmtF(a.seguimiento)}</span><input data-campo="seguimiento" type="date" value="${esc(a.seguimiento)}"></label></div>
    <label class="tk-c" data-l="Notas"><input data-campo="notas" value="${esc(a.notas)}" placeholder="Notas"></label>
    <div class="tk-acc"><button class="tk-ico" data-detalles aria-label="Detalles">▾</button><button class="tk-ico" data-quitar aria-label="Quitar">✕</button></div>
    <div class="tk-det">
      <label>Requisitos<textarea data-campo="requisitos" rows="3" placeholder="Qué piden: carrera, créditos, inglés, herramientas…">${esc(a.requisitos)}</textarea></label>
      <label>Contacto<textarea data-campo="contacto" rows="3" placeholder="Nombre, correo o teléfono de la persona de contacto">${esc(a.contacto)}</textarea></label>
    </div>
  </div>`;
}
function dibujarTabla() {
  tkPoner("tk-filas", apps.length ? apps.map(filaHTML).join("") : '<p class="tk-vacio">Aún no hay empresas. Toca “+ Añadir empresa”.</p>');
  dibujarResumen();
}

// ---------- Ir a una empresa desde el dashboard (reemplaza la de script.js) ----------
function irAEmpresa(i) {
  mostrarVista("tracker");
  const a = apps[i], fila = a && document.querySelector(`.tk-fila[data-id="${a.id}"]`);
  if (!fila) return;
  abiertos.add(a.id);
  fila.classList.add("abierto", "resaltada");
  fila.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => fila.classList.remove("resaltada"), 1800);
}

// ---------- Eventos ----------
tkEscuchar("vista-tracker", "click", ev => {
  const fila = ev.target.closest(".tk-fila"), id = fila && fila.dataset.id;
  if (ev.target.closest("[data-agregar]")) {
    apps.push({ id: uid(), empresa: "", puesto: "", enlace: "", aplicado: "", estado: 0, seguimiento: "", requisitos: "", contacto: "", notas: "" });
    dibujarTabla(); persistir();
    const nueva = document.querySelector(".tk-fila:last-child [data-campo='empresa']");
    if (nueva) { nueva.focus(); nueva.scrollIntoView({ block: "center" }); }
  } else if (ev.target.closest("[data-borrar-todo]")) {
    if (apps.length && confirm("¿Borrar TODAS las empresas del tracker?")) { apps = []; abiertos.clear(); dibujarTabla(); persistir(); }
  } else if (id && ev.target.closest("[data-quitar]")) {
    if (confirm("¿Quitar esta empresa del tracker?")) { apps = apps.filter(a => a.id !== id); abiertos.delete(id); dibujarTabla(); persistir(); }
  } else if (id && ev.target.closest("[data-detalles]")) {
    fila.classList.toggle("abierto");
    fila.classList.contains("abierto") ? abiertos.add(id) : abiertos.delete(id);
  }
});

tkEscuchar("vista-tracker", "change", ev => {
  const campo = ev.target.dataset.campo, fila = ev.target.closest(".tk-fila");
  const a = fila && apps.find(x => x.id === fila.dataset.id);
  if (!campo || !a) return;
  let v = ev.target.value.trim();
  if (campo === "estado") v = Number(v);
  if (campo === "enlace" && v && !/^https?:\/\//i.test(v)) { v = "https://" + v; ev.target.value = v; }
  a[campo] = v;
  if (ev.target.type === "date") ponerFecha(fila, campo, v);

  if (campo === "estado") {
    fila.querySelector(".tk-estado").style.setProperty("--c", EST[a.estado].color);
    if (a.estado === 2 && !a.aplicado) {      // al pasar a "Aplicado": fecha de hoy y seguimiento a 7 días
      const d = new Date(); d.setDate(d.getDate() + 7);
      a.aplicado = hoyISO();
      if (!a.seguimiento) a.seguimiento = iso(d.getFullYear(), d.getMonth(), d.getDate());
      ponerFecha(fila, "aplicado", a.aplicado);
      ponerFecha(fila, "seguimiento", a.seguimiento);
    }
  }
  if (campo === "enlace") {
    const l = fila.querySelector(".tk-abrir");
    a.enlace ? l.setAttribute("href", a.enlace) : l.removeAttribute("href");
  }
  fila.querySelector('[data-campo="seguimiento"]').parentElement.classList.toggle("vence", vence(a));
  persistir();
});

// ---------- Estilos de las fechas (van aquí para que siempre se carguen junto con este archivo) ----------
const estiloFechas = document.createElement("style");
estiloFechas.textContent = `
  @media (min-width:1100px) { .tk-cols, .tk-fila { grid-template-columns:1.2fr 1.2fr 1.1fr 124px 150px 124px 1.5fr 76px; } }
  .tk-fecha { position:relative; display:flex; align-items:center; min-height:38px; padding:0 12px; border-radius:12px; background:var(--bg); font-size:14px; overflow:hidden; cursor:pointer; }
  .tk-fecha .fv { white-space:nowrap; pointer-events:none; }
  .tk-fecha.vacia .fv { color:#9a9a9a; }
  .tk-fecha input { position:absolute; inset:0; width:100%; height:100%; min-width:0; min-height:0; padding:0; opacity:0; cursor:pointer; -webkit-appearance:none; appearance:none; }
  .tk-fecha.vence { background:#f6d9de; color:var(--berry); font-weight:700; }`;
document.head.appendChild(estiloFechas);

// ---------- Inicio ----------
dibujarTabla();
dibujarTracker();