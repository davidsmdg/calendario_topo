import { EventoCronograma, JornadaPedagogica, MallaComponente } from "@/types";
import {
  ddmmyyyyToISO,
  isoToFechaComunitaria,
  obtenerNombreDiaSemana,
} from "./festivosColombia";

export const TALLERISTAS_SEED: string[] = [
  "Todos",
  "Camilo Torres",
  "Yarid",
  "David Guáqueta",
  "Juan Pablo Vargas",
  "Lesley Cortés",
  "David Díaz",
  "Sebastián Vélez",
  "Diego",
  "Yeral",
  "Alexa",
  "Kevin Quevedo",
  "Canela",
  "Tati",
  "Daniela",
  "Catalina",
  "Johan Mejia",
  "Nicolás Velásquez",
  "Miguel Ruiz",
  "Miguel Fuerte",
  "Paula Ávila",
  "Jairo",
  "Lore",
  "Aleja",
  "Karen",
  "Mao",
  "Óscar",
  "Kenny",
];

/**
 * Mapeo oficial de talleristas por Componente / Materia (guiado por los nombres de Cronograma 2026)
 */
export const TALLERISTAS_POR_COMPONENTE: Record<string, string[]> = {
  "ORIENTACIÓN VOCACIONAL": ["Aleja", "David G.", "Tati", "Karen"],
  CONTEXTO: ["Camilo Torres", "Alexa", "Yeral", "Canela"],
  MATEMÁTICAS: ["Óscar", "Yarid", "Kenny"],
  LENGUAJE: ["Camilo Torres", "Miguel Fuerte", "Juan Pablo Vargas"],
  BIOLOGÍA: ["Sebas", "Johan", "Nicolás", "Lesley"],
  INGLÉS: ["Kevin Quevedo", "Paula Ávila", "Miguel Fuerte"],
  QUÍMICA: ["Jairo", "Lore"],
  "ANÁLISIS DE LA IMAGEN": ["Mao", "David Díaz"],
  FILOSOFÍA: ["Canela", "Catalina", "David"],
  FÍSICA: ["Diego", "Miguel Ruiz"],
};

export function obtenerTalleristasDeComponente(componente?: string): string[] {
  if (!componente) return [];
  const key = componente.trim().toUpperCase();
  return TALLERISTAS_POR_COMPONENTE[key] || [];
}

/**
 * Malla Curricular de Componentes (Sesiones 1 a 11) LLENA con los contenidos fijos
 * y con los talleristas correspondientes a cada materia.
 */
export const MALLA_CURRICULAR_SEED: MallaComponente[] = [
  {
    id: "malla-ov",
    componente: "ORIENTACIÓN VOCACIONAL",
    talleristasBase: ["Aleja", "David G.", "Tati", "Karen"],
    sesiones: [
      "Sesión de bienvenida",
      "Formación Post secundaria",
      "Métodos de estudio y aprendizaje",
      "Preparación para los exámenes",
      "Entrevista",
      "Tips para la vida universitaria",
      "Manejo de emociones",
      "Habilidades socioemocionales (SABER ICFES)",
      "OV 9",
      "",
      "",
    ],
  },
  {
    id: "malla-ctx",
    componente: "CONTEXTO",
    talleristasBase: ["Camilo Torres", "Alexa", "Yeral", "Canela"],
    sesiones: [
      "Introducción: ¿Para qué las Ciencias Sociales y cómo pensarnos desde ella?",
      "Pensamiento histórico",
      "Historia universal",
      "Análisis geográfico",
      "Conceptos de geografía",
      "Análisis Político",
      "Estructura del Estado",
      "Análisis Económico",
      "Historia de Colombia (Enfoque económico)",
      "",
      "",
    ],
  },
  {
    id: "malla-mat",
    componente: "MATEMÁTICAS",
    talleristasBase: ["Óscar", "Yarid", "Kenny"],
    sesiones: [
      "Qué es matemáticas. Operaciones y propiedades. Jerarquía",
      "Regla de 3 (relacionar magnitudes). Fracciones y números racionales",
      "Clase de ejercicios (fracciones)",
      "Fundamentos de álgebra",
      "Funciones",
      "Geometría",
      "Trigonometría",
      "Probabilidad y estadística",
      "¿Financieras?",
      "",
      "",
    ],
  },
  {
    id: "malla-len",
    componente: "LENGUAJE",
    talleristasBase: ["Camilo Torres", "Miguel Fuerte", "Juan Pablo Vargas"],
    sesiones: [
      "La importancia de la lectura. La lectura como proceso",
      "¿Cómo leemos? Momentos y tipos de lectura",
      "Panorama general de la lectura. Lectura como proceso creativo",
      "Lectura literal: ¿cómo entendemos lo que está allí?",
      "Lectura inferencial (i): ¿qué es inferir en la lectura?",
      "Lectura inferencial (ii)",
      "Lectura crítico intertextual (i)",
      "Lectura crítico intertextual (ii)",
      "Club de lectura",
      "",
      "",
    ],
  },
  {
    id: "malla-bio",
    componente: "BIOLOGÍA",
    talleristasBase: ["Sebas", "Johan", "Nicolás", "Lesley"],
    sesiones: [
      "Sesión 1. Lo vivo & la vida - Biomoléculas",
      "Sesión 2. Biología molecular",
      "Sesión 3. Membranas",
      "Sesión 4. Genética mendeliana",
      "Sesión 5. Genética molecular",
      "Sesión 6. Evolución - Torneo Pokémon",
      "Sesión 7. Ecosistemas & ecología",
      "Sesión compartida. Energía - Fotosíntesis",
      "Sesión 9. Biotecnología",
      "",
      "",
    ],
  },
  {
    id: "malla-ing",
    componente: "INGLÉS",
    talleristasBase: ["Kevin Quevedo", "Paula Ávila", "Miguel Fuerte"],
    sesiones: [
      "El inglés en la prueba Saber 11 - Introducción al inglés como lengua franca y 'universal'",
      "What do I look like? What am I like? Physical description and personality",
      "What's in the house? Housing vocabulary and prepositions of place",
      "Present (simple and progressive), introduction to past simple and prepositions (place and time)",
      "Past tenses (progressive and simple), prepositions of time, and possessives.",
      "Future Simple / Going to / Progressive: What will we do in vacations?",
      "Comparatives and superlatives. Wild cards",
      "Modal Verbs (advice, necessity, and obligation)",
      "Conditionals (0, and 1)",
      "Second Conditional / Karaoke",
      "Wasted Time - Sing Me Something New",
    ],
  },
  {
    id: "malla-qui",
    componente: "QUÍMICA",
    talleristasBase: ["Jairo", "Lore"],
    sesiones: [
      "Introducción: Estados de la materia, propiedades fisicoquímicas y diagramas",
      "Estructuras atómicas, moleculares, enlaces, mol.",
      "Tabla periódica",
      "Reacciones químicas, estequiometría.",
      "Soluciones, molaridad, reacciones ácido-base.",
      "Gases ideales",
      "Química orgánica, nomenclatura, hidrocarburos y compuestos",
      "Sesión compartida. Energía - Fotosíntesis",
      "QM 9 (Solución de problemas complejos)",
      "",
      "",
    ],
  },
  {
    id: "malla-aim",
    componente: "ANÁLISIS DE LA IMAGEN",
    talleristasBase: ["Mao", "David Díaz"],
    sesiones: [
      "Introducción geometría y Gestalt",
      "Isométricos",
      "Isométricos parte 2",
      "Isométricos parte 3",
      "AIM 5",
      "Estructura organizativa y repaso",
      "AIM 7",
      "AIM 8",
      "AIM 9",
      "",
      "",
    ],
  },
  {
    id: "malla-fil",
    componente: "FILOSOFÍA",
    talleristasBase: ["Canela", "Catalina", "David"],
    sesiones: [
      "¿Cómo leer textos desde la filosofía?",
      "Conceptos básicos de lógica y argumentación",
      "Lógica y argumentación aplicada",
      "Lectura crítica y análisis de argumentos",
      "¿Cómo abordar la historia del pensamiento y la filosofía? Antigua parte 1",
      "Antigua parte 2 (Clásicos, sofistas y helenística)",
      "Modernidad (S. XV - XIX)",
      "Modernidad / Posmodernidad (S. XX - XXI)",
      "Pensamiento latinoamericano (desde Abya Yala)",
      "Refuerzo: Lógica y argumentación",
      "Refuerzo: Lógica y argumentación",
    ],
  },
  {
    id: "malla-fis",
    componente: "FÍSICA",
    talleristasBase: ["Diego", "Miguel Ruiz"],
    sesiones: [
      "Introducción: Fenómenos físicos, variables físicas y sistemas de unidades.",
      "Factores de conversión, notación científica y escalas",
      "Magnitudes Escalares y Vectoriales - Introducción Cinemática",
      "Cinemática: MRU MRUA",
      "Dinámica: Leyes de Newton",
      "Ejercicios Cinemática y Dinámica",
      "Energía mecánica y trabajo",
      "Sesión compartida. Energía - Fotosíntesis",
      "Electromagnetismo",
      "Ondas",
      "Refuerzos",
    ],
  },
];

/**
 * Los 32 Hitos / Tareas de 2027 extraídos de con_tareas_2027.csv y todo_2027.xlsx,
 * ordenados cronológicamente y con su día de la semana calculado.
 */
const HITOS_RAW: Omit<EventoCronograma, "diaSemana">[] = [
  {
    id: "hito-2027-1",
    fecha: "21/11/2026",
    evento: "Inicio convocatoria talleristas",
    compromiso:
      "1. Diseño y difusión de piezas gráficas.\n2. Videos difusión de convocatoria (15 dic.).\n3. Recolección de datos aspirantes (crear y enviar formulario)\n4. Entrevistas por componentes",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-2",
    fecha: "15/12/2026",
    evento: "Apertura de formulario de inscripción estudiantes",
    compromiso: "Crear, ajustar y empezar a difundir en colegios",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-3",
    fecha: "10/01/2027",
    evento: "Cierre de inscripciones de estudiantes",
    compromiso: "Cierre de formulario",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-4",
    fecha: "11/01/2027",
    evento: "Inicio evaluación de formularios de inscripción de nuevos alumnos",
    compromiso:
      "Consolidación del grupo aspirante (Excel).\nFiltrado automático de criterios excluyentes.\nActualizar porcentajes.\nAsignación de puntajes para el formulario.\nAsignación de entrevistas (tope de 8 por tallerista)",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-5",
    fecha: "13/01/2027",
    evento: "Fin de evaluación de formularios de inscripción de nuevos alumnos",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-6",
    fecha: "14/01/2027",
    evento: "Inicio citación y desarrollo de entrevistas",
    compromiso:
      "Comunicación directa por whatsapp, correo o teléfono.\nRealización de entrevistas vía telefónica o meet.\nPuntuación de cada entrevista (en paralelo durante las entrevistas).",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-7",
    fecha: "19/01/2027",
    evento: "Fin citación y desarrollo de entrevistas",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-8",
    fecha: "21/01/2027",
    evento: "Fin convocatoria talleristas",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-9",
    fecha: "22/01/2027",
    evento: "Inducción de manejo de recursos físicos y digitales de El Topo",
    compromiso:
      "Uso Drive.\nOrganigrama al interior del colectivo.\nSocialización de acuerdos de funcionamiento (protocolos, responsabilidades, relatorías escuela de formación).",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-10",
    fecha: "22/01/2027",
    evento: "Organización de resultados",
    compromiso:
      "Organizar excel según puntaje y definir personas seleccionadas, en espera y no seleccionadas.\nRevisión de casos particulares.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-11",
    fecha: "23/01/2027",
    evento: "Reunión de coordinación #01 y escuela de formación #01",
    compromiso:
      "1. Inducción del proceso (enfoque pedagógico, organización del equipo, funciones, cronograma general).\n2. Escuela de formación sobre educación popular y la historia del Topo (2 horas).\n3. Escuela de formación sobre trabajo en equipo y comunicación.\n4. Construcción de cronograma (traer una propuesta previa) de temas y actividades por madrigueras y componentes, al igual que temas para las escuelas de formación.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-12",
    fecha: "24/01/2027",
    evento: "Publicación de resultados",
    compromiso: "Publicación para personas seleccionadas, en espera y no seleccionadas.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-13",
    fecha: "25/01/2027",
    evento: "Publicación de resultados",
    compromiso: "Publicación para personas seleccionadas, en espera y no seleccionadas.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-14",
    fecha: "30/01/2027",
    evento: "Revisión de simulacros",
    compromiso: "1. Revisar simulacros\n2. Crear tercer formulario",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-15",
    fecha: "30/01/2027",
    evento: "Inauguración",
    compromiso:
      "1. Solicitud de espacio.\n2. Planeación y desarrollo de la inauguración.\nUsar la estructura del año pasado como base.\nAsistencia de todo el equipo de talleristas.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-16",
    fecha: "06/02/2027",
    evento: "Inicio de clases",
    compromiso: "Planeación sesión inicial\nAsistencia de todo el equipo de talleristas.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-17",
    fecha: "06/03/2027",
    evento: "Reunión de coordinación #02 y escuela de formación #02",
    compromiso:
      "Planeación de la reunión.\nSeguimiento al proceso y espacio de autocuidado.\nResultados simulacro 1.\nDefinir cómo manejar recursos con relación a la figura jurídica.\nPlanear y desarrollar escuela de formadores",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-18",
    fecha: "21/03/2027",
    evento: "Salida pedagógica #1",
    compromiso: "Planear y desarrollar salida pedagógica\nDistribución por énfasis (?)",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-19",
    fecha: "28/03/2027",
    evento: "Semana Santa",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-20",
    fecha: "17/04/2027",
    evento: "Reunión de coordinación #03 y escuela de formación #03",
    compromiso:
      "Planeación de la reunión.\nPlanear y desarrollar escuela de formadores\nSeguimiento al proceso y espacio de autocuidado.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-21",
    fecha: "24/04/2027",
    evento: "Simulacro #02",
    compromiso: "Envío del segundo simulacro.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-22",
    fecha: "29/05/2027",
    evento: "Reunión de coordinación #04",
    compromiso: "Planeación de la reunión.\nSeguimiento al proceso y espacio de autocuidado.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-23",
    fecha: "26/06/2027",
    evento: "Vacaciones Topo",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-24",
    fecha: "10/07/2027",
    evento: "Reunión de coordinación #05",
    compromiso: "Planeación de la reunión.\nSeguimiento al proceso y espacio de autocuidado.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-25",
    fecha: "24/07/2027",
    evento: "Salida pedagógica #02",
    compromiso: "Planear y desarrollar salida pedagógica\nDistribución por énfasis (?)",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-26",
    fecha: "21/08/2027",
    evento: "Simulacro #03",
    compromiso: "Envío del tercer simulacro.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-27",
    fecha: "21/08/2027",
    evento: "Reunión de coordinación #06",
    compromiso: "Planeación de la reunión.\nSeguimiento al proceso y espacio de autocuidado.",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-28",
    fecha: "25/09/2027",
    evento: "Final de sesiones de componentes (fecha estimada, depende del examen de la Unal)",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-29",
    fecha: "02/10/2027",
    evento:
      "Opción sin asistentes: Cierre de proceso (fecha estimada, depende del examen de la Unal); Opción con asistentes: 1ra sesión de talleres complementarios (sexualidad y género y similares)",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-30",
    fecha: "09/10/2027",
    evento: "Cierre del proceso (opción con asistentes)",
    compromiso: "",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-31",
    fecha: "16/10/2027",
    evento: "Escuela de formación #04",
    compromiso: "Planear y desarrollar escuela de formadores",
    personasEncargadas: "",
    completado: false,
  },
  {
    id: "hito-2027-32",
    fecha: "01/11/2027",
    evento: "Asamblea general de talleristas",
    compromiso: "Evaluación 2027\nProyección 2027\nPresupuesto 2027",
    personasEncargadas: "",
    completado: false,
  },
];

export const HITOS_2027_SEED: EventoCronograma[] = HITOS_RAW.map((h) => ({
  ...h,
  diaSemana: obtenerNombreDiaSemana(h.fecha),
}));

const FRANJAS_VACIAS = [
  "8:00 AM - 9:30 AM",
  "9:30 AM - 11:00 AM",
  "11:15 AM - 12:45 PM",
  "1:30 PM - 3:00 PM",
];

/**
 * Construye TODAS las columnas cronológicas del año 2027:
 * 1. Incluye TODOS los 52 sábados del año 2027 (02/01/2027 al 25/12/2027).
 * 2. Incluye también las fechas específicas de los archivos 2027 que NO caen sábado
 *    (ej. 21/11/2026, 15/12/2026, 10/01/2027, 11/01/2027, 13/01/2027, 14/01/2027, 19/01/2027,
 *    21/01/2027, 22/01/2027, 24/01/2027, 25/01/2027, 21/03/2027, 28/03/2027, 01/11/2027).
 * 3. Ordena todas las fechas cronológicamente e indica en `diaSemana` qué día de la semana cae.
 * 4. Para los sábados de clases que tienen reuniones/simulacros en con_tareas_2027, deja sus
 *    4 bloques de clase listos por llenar y pone el evento/tarea en `comentarios` (y `tareasDelDia`).
 * 5. Para fechas que son hitos logísticos/convocatoria/inauguración/salidas/vacaciones,
 *    precarga el evento y sus tareas para que nada aparezca vacío.
 */
export function generarJornadas2027Cronologicas(
  hitos: EventoCronograma[] = HITOS_2027_SEED
): JornadaPedagogica[] {
  const fechasISOSet = new Set<string>();

  // 1. Agregar todos los sábados de 2027 (del 2 de enero al 25 de diciembre de 2027)
  const cursor = new Date(2027, 0, 2); // 2 de enero de 2027 es Sábado
  while (cursor.getFullYear() === 2027) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    fechasISOSet.add(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 7);
  }

  // 2. Agregar todas las fechas específicas que aparecen en los archivos 2027 (hitos)
  const hitosPorISO: Record<string, EventoCronograma[]> = {};
  hitos.forEach((h) => {
    const iso = ddmmyyyyToISO(h.fecha);
    if (iso) {
      fechasISOSet.add(iso);
      if (!hitosPorISO[iso]) hitosPorISO[iso] = [];
      hitosPorISO[iso].push(h);
    }
  });

  // 3. Ordenar todas las fechas cronológicamente
  const fechasOrdenadas = Array.from(fechasISOSet).sort();

  // Fechas que sabemos que son eventos unificados (sin las 4 clases regulares ese día)
  const esFechaUnificada = (iso: string, diaSemana: string, eventosDia: EventoCronograma[]) => {
    // Si no es sábado (ej. martes, miércoles, jueves, viernes, lunes, domingo), es una fecha específica de hito/tarea
    if (diaSemana !== "Sábado") return true;
    // Sábados previos al inicio de clases del 06/02/2027 (ej. 23/01 Reunión #1, 30/01 Inauguración, o sábados de enero)
    if (iso < "2027-02-06") {
      return eventosDia.length > 0;
    }
    // Sábados especiales como Vacaciones Topo, Salida Pedagógica, Cierre, Escuela #04
    const textoEventos = eventosDia.map((e) => (e.evento || "").toLowerCase()).join(" ");
    if (
      textoEventos.includes("vacaciones") ||
      textoEventos.includes("salida pedagógica") ||
      textoEventos.includes("semana santa") ||
      textoEventos.includes("cierre del proceso") ||
      textoEventos.includes("asamblea")
    ) {
      return true;
    }
    return false;
  };

  return fechasOrdenadas.map((iso, index) => {
    const numJornada = index + 1;
    const id = `jornada-2027-${iso}`;
    const diaSemana = obtenerNombreDiaSemana(iso);
    const fechaLegible = isoToFechaComunitaria(iso);
    const eventosDia = hitosPorISO[iso] || [];

    // Resumen de eventos y compromisos de ese día en con_tareas_2027
    const titulosEventos = eventosDia
      .map((e) => e.evento?.trim())
      .filter(Boolean)
      .join(" / ");

    const detalleCompromisos = eventosDia
      .map((e) => {
        if (e.compromiso?.trim()) {
          return `${e.evento}: ${e.compromiso.trim()}`;
        }
        return e.evento || "";
      })
      .filter(Boolean)
      .join("\n\n");

    const comentarioTexto = eventosDia
      .map((e) => {
        if (e.compromiso?.trim()) {
          return `${e.evento}\n${e.compromiso.trim()}`;
        }
        return e.evento || "";
      })
      .filter(Boolean)
      .join("\n---\n");

    const unificada = esFechaUnificada(iso, diaSemana, eventosDia);

    return {
      id,
      numeroJornada: numJornada,
      fechaISO: iso,
      fecha: fechaLegible,
      diaSemana,
      encargadxDelDia: "", // Por llenar
      horasJornada: diaSemana === "Sábado" ? "8:00 AM - 3:00 PM" : "Por definir",
      tipoJornada: unificada ? "unificada" : "clases",
      descripcionUnificada: unificada
        ? detalleCompromisos || titulosEventos || "JORNADA ESPECIAL"
        : "",
      bloques: FRANJAS_VACIAS.map((hora, bIdx) => ({
        id: `${id}-b${bIdx + 1}`,
        hora,
        componente: "", // Por llenar
        temaDelDia: "", // Por llenar
        talleristas: "", // Por llenar
      })),
      // Si es sábado de clases y tiene tareas en con_tareas_2027 (ej. Reunión #02, Simulacro #02, Inicio de clases),
      // va en COMENTARIOS para el Excel y en tareasDelDia para mostrarlo destacado en la plataforma.
      comentarios: !unificada ? comentarioTexto : "",
      tareasDelDia: comentarioTexto,
    };
  });
}

export const JORNADAS_2027_SEED: JornadaPedagogica[] =
  generarJornadas2027Cronologicas(HITOS_2027_SEED);
