// ============ TU MALLA, EN EL ORDEN EN QUE LA LLEVARÁS ============
// La usan "Mi carrera" (carrera.js) y "Horarios" (autocompletado de materias).
// Se carga ANTES que esos archivos, así que no redeclares PLAN_BASE en ellos.
// Cada materia: [código, nombre, ¿es laboratorio? (1 = sí), nota opcional]
// Si una materia no tiene código conocido, usa un id en palabras (ej. "tcu"): no se muestra como código.
// Al agregar materias, "Mi carrera" las añade sola a tu orden guardado; NO cambies los códigos que ya existen.
// p = cuatrimestre (I, II, III) · a = año
const PLAN_BASE = [
  { p: "II", a: 2025, m: [["05-0006", "Química general I"], ["05-9015", "Laboratorio de Química general I", 1], ["03-9020", "Freshman seminar: relaciones humanas"]] },
  { p: "III", a: 2025, m: [["17-8005", "Inglés III"], ["64-9018", "Introducción a la ingeniería biomédica"], ["18-9005", "Precálculo"]] },
  { p: "I", a: 2026, m: [["05-1009", "Química general II"], ["05-9016", "Laboratorio de Química general II", 1], ["18-9006", "Cálculo I"], ["03-9021", "Salud, deporte y bienestar"]] },
  { p: "II", a: 2026, m: [["18-9007", "Matemáticas discretas"], ["17-8006", "Inglés IV"], ["05-0016", "Biología general I"], ["05-9019", "Física general I"]] },
  { p: "III", a: 2026, m: [["18-9008", "Cálculo II"], ["18-9009", "Elementos de probabilidad y estadística"], ["05-9020", "Física general II"]] },
  { p: "I", a: 2027, m: [["05-2025", "Química orgánica"], ["05-9027", "Laboratorio de Química orgánica", 1], ["18-9010", "Álgebra lineal"], ["18-9011", "Probabilidad y estadística avanzada"]] },
  { p: "II", a: 2027, m: [["44-9023", "Termodinámica"], ["05-9028", "Laboratorio de Termodinámica", 1], ["18-9012", "Ecuaciones diferenciales"], ["15-9012", "Ingeniería económica"]] },
  { p: "III", a: 2027, m: [["18-9013", "Análisis numérico para ingenieros"], ["03-9022", "Argumentación y retórica (inglés)"], ["16-9013", "Fundamentos de tecnologías de la información"], ["64-9020", "Regulaciones y certificaciones biomédicas"]] },
  { p: "I", a: 2028, m: [["03-9024", "Expresiones del espíritu humano"], ["05-9023", "Mecánica"], ["64-9021", "Fisiología de los sistemas celular y molecular"], ["64-9031", "Laboratorio de Fisiología de los sistemas celular y molecular", 1]] },
  { p: "II", a: 2028, m: [["14-9017", "Circuitos de corriente continua"], ["05-9024", "Electromagnetismo"], ["14-9018", "Microprocesadores"], ["03-9026", "Razonamiento moral y decisiones éticas"], ["biomecanica", "Elementos de biomecánica"], ["lab-biomecanica", "Laboratorio de Elementos de biomecánica", 1]] },
  { p: "III", a: 2028, m: [["64-9022", "Fisiología cuantitativa I"], ["64-9032", "Laboratorio de Fisiología cuantitativa I", 1], ["14-9019", "Electrónica analógica"], ["14-9020", "Electrónica digital"], ["03-9028", "Globalización, ambiente y desarrollo humano"]] },
  { p: "I", a: 2029, m: [["14-9022", "Sistemas de control"], ["14-9023", "Laboratorio de Sistemas de control", 1], ["14-9021", "Circuitos integrados analógicos"], ["03-9030", "Seminario de investigación: Costa Rica y el mundo"]] },
  { p: "II", a: 2029, m: [["64-9024", "Fisiología cuantitativa II"], ["64-9033", "Laboratorio de Fisiología cuantitativa II", 1], ["64-9023", "Bioelectricidad"], ["64-9015", "Modelamiento de sistemas biomédicos"], ["64-9025", "Señales y sistemas en ingeniería biomédica"]] },
  { p: "III", a: 2029, m: [["64-9026", "Biotransporte"], ["13-0098", "Electiva de gestión", 0, "Elige: Recursos humanos · Estratégica · Innovación"], ["28-9046", "Experiencia profesional I: estudio de casos", 0, "Requiere 50 % de materias"], ["64-9027", "Biomateriales"], ["tcu", "Trabajo comunal universitario (TCU)", 0, "150 horas · requiere 50 % de materias"]] },
  { p: "I", a: 2030, m: [["64-9013", "Electiva de bioelectromedicina", 0, "Elige: Neurológica · Imágenes médicas"], ["lab-64-9013", "Laboratorio de Electiva de bioelectromedicina", 1], ["64-9014", "Electiva de bioinformática", 0, "Elige: Datos y bioinformática · Genomas"], ["lab-64-9014", "Laboratorio de Electiva de bioinformática", 1], ["64-9012", "Electiva de biomecánica", 0, "Elige: Tejidos · Cardiovascular"], ["lab-64-9012", "Laboratorio de Electiva de biomecánica", 1], ["28-9047", "Experiencia profesional II: administración de proyectos"]] },
  { p: "II", a: 2030, m: [["03-9031", "Creación de empresas"], ["64-9028", "Diseño biomédico"], ["28-9048", "Experiencia profesional III: portafolio de experiencias"], ["64-9029", "Instrumentación biomédica"], ["seminario-graduacion", "Seminario de graduación"]] }
];
