import {
  CalendarioCicloTopo,
  EstudianteTopo,
  JornadaPedagogica,
  MallaComponente,
} from "@/types";
import estudiantes2026Raw from "../../estudiantes_2026_procesados.json";
import jornadas2026Raw from "../../jornadas_2026_extraidas.json";

export const ESTUDIANTES_2026_SEED: EstudianteTopo[] = estudiantes2026Raw as EstudianteTopo[];
export const JORNADAS_2026_SEED: JornadaPedagogica[] = jornadas2026Raw as JornadaPedagogica[];

export const CALENDARIO_2026_SEED: CalendarioCicloTopo = {
  id: "cal-2026-anual",
  nombre: "2026 - Ciclo Anual (Histórico)",
  codigo: "2026",
  ano: 2026,
  estado: "historico",
  fechaInicio: "2026-01-24",
  fechaFin: "2026-10-10",
  descripcion: "Ciclo formativo histórico ejecutado en 2026. 42 estudiantes, 36 jornadas sabatinas y registro completo de asistencia.",
  jornadas: JORNADAS_2026_SEED,
  hitos: [],
  mallaCurricular: [],
  estructuraCalendario: {
    modalidadCiclo: "anual",
    nombreCiclo1: "Ciclo Único 2026",
    horaInicioDefecto: "8:00 AM",
    duracionBloqueMinutos: 90,
    periodosTemporales: [
      {
        id: "per-clases-2026",
        nombre: "Período Lectivo 2026",
        tipo: "clases",
        fechaInicio: "2026-02-07",
        fechaFin: "2026-09-26",
        colorHex: "#10B981",
      },
      {
        id: "per-vac-mitad-2026",
        nombre: "Vacaciones de Mitad de Año (1 Sábado - Puente San Pedro)",
        tipo: "vacaciones",
        fechaInicio: "2026-06-27",
        fechaFin: "2026-06-27",
        colorHex: "#F59E0B",
      },
    ],
    fechasClaveExamenes: [
      {
        id: "coord-01-2026",
        titulo: "Reunión de Coordinación #01 y Escuela de Formación #01",
        tipo: "coordinacion",
        fecha: "2026-01-24",
      },
      {
        id: "inauguracion-2026",
        titulo: "Inauguración y Bienvenida Ciclo 2026",
        tipo: "inauguracion",
        fecha: "2026-01-31",
      },
      {
        id: "formacion-01-2026",
        titulo: "Escuela de Formadores #01 (David y Karen - Comunicación Asertiva)",
        tipo: "formacion",
        fecha: "2026-02-28",
      },
      {
        id: "coord-02-2026",
        titulo: "Reunión de Coordinación #02",
        tipo: "coordinacion",
        fecha: "2026-03-07",
      },
      {
        id: "salida-pedagogica-1-2026",
        titulo: "1ª Salida Pedagógica (Museos)",
        tipo: "salida",
        fecha: "2026-03-28",
      },
      {
        id: "coord-03-2026",
        titulo: "Reunión de Coordinación #03",
        tipo: "coordinacion",
        fecha: "2026-04-18",
      },
      {
        id: "coord-04-2026",
        titulo: "Reunión de Coordinación #04 (Elecciones y Gestión)",
        tipo: "coordinacion",
        fecha: "2026-05-30",
      },
      {
        id: "formacion-02-2026",
        titulo: "Escuela de Formación #02 (Didáctica y Manejo de Grupo - Yeral y Camilo)",
        tipo: "formacion",
        fecha: "2026-06-20",
      },
      {
        id: "coord-05-2026",
        titulo: "Reunión de Coordinación #05",
        tipo: "coordinacion",
        fecha: "2026-07-11",
      },
      {
        id: "salida-pedagogica-2-2026",
        titulo: "2ª Salida Pedagógica (Taller Cuerpo y Memoria)",
        tipo: "salida",
        fecha: "2026-07-25",
      },
      {
        id: "ex-saber11-2026",
        titulo: "Prueba Saber 11 / ICFES 2026",
        tipo: "icfes",
        fecha: "2026-07-26",
      },
      {
        id: "simulacro-3-2026",
        titulo: "Tercer Simulacro Presencial y Coordinación #06",
        tipo: "simulacro",
        fecha: "2026-08-22",
      },
      {
        id: "ex-unal-2026",
        titulo: "Examen Admisión UNAL 2026",
        tipo: "unal",
        fecha: "2026-09-20",
      },
      {
        id: "cierre-proceso-2026",
        titulo: "Cierre del Proceso Formativo 2026",
        tipo: "cierre",
        fecha: "2026-09-26",
      },
      {
        id: "asamblea-general-2026",
        titulo: "Asamblea General Topo 2026 (Balance y Proyecciones 2027)",
        tipo: "asamblea",
        fecha: "2026-11-14",
        fechaFin: "2026-11-15",
        descripcion: "Asamblea general de cierre anual de 2 días seguidos (14 y 15 de noviembre de 2026). Análisis de resultados y toma de decisiones para el siguiente ciclo.",
      },
    ],
  },
  estudiantes: ESTUDIANTES_2026_SEED,
};
