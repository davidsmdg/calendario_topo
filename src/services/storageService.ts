import {
  EstadoCronogramaTopo,
  EventoCronograma,
  JornadaPedagogica,
  EstructuraCalendarioConfig,
} from "@/types";
import {
  HITOS_2027_SEED,
  JORNADAS_2027_SEED,
  MALLA_CURRICULAR_SEED,
  TALLERISTAS_SEED,
} from "@/utils/seedData";

// Nueva clave v3 para cargar inmediatamente las 66 jornadas cronológicas de 2027 (52 sábados + fechas específicas con tareas) y la Malla llena
const STORAGE_KEY = "el_topo_cronograma_2027_v4";
const OLD_KEYS = [
  "el_topo_cronograma_2027",
  "el_topo_cronograma_2027_v2",
  "el_topo_cronograma_2027_v3",
];
const SHEETS_URL_KEY = "el_topo_sheets_webapp_url";

export const FRANJAS_DEFECTO_ESTRUCTURAL: string[] = [
  "8:00 AM - 9:30 AM",
  "9:30 AM - 11:00 AM",
  "11:15 AM - 12:45 PM",
  "1:30 PM - 3:00 PM",
];

export const ESTRUCTURA_CALENDARIO_DEFECTO: EstructuraCalendarioConfig = {
  modalidadCiclo: "anual",
  nombreCiclo1: "Ciclo I - 2027 (Feb - Jun)",
  nombreCiclo2: "Ciclo II - 2027 (Jul - Nov)",
  horaInicioDefecto: "8:00 AM",
  duracionBloqueMinutos: 90,
  periodosTemporales: [
    {
      id: "per-coord-ini",
      nombre: "Semana de Coordinación e Inducción Pedagógica",
      tipo: "coordinacion",
      fechaInicio: "2027-01-16",
      fechaFin: "2027-01-23",
      colorHex: "#3B82F6",
      descripcion: "Reuniones de talleristas, planeación curricular e inauguración",
    },
    {
      id: "per-clases-sem1",
      nombre: "Primer Tramo de Clases 2027",
      tipo: "clases",
      fechaInicio: "2027-01-30",
      fechaFin: "2027-03-20",
      colorHex: "#10B981",
      descripcion: "Clases regulares sabatinas por componentes",
    },
    {
      id: "per-semana-santa",
      nombre: "Receso de Semana Santa",
      tipo: "vacaciones",
      fechaInicio: "2027-03-22",
      fechaFin: "2027-03-28",
      colorHex: "#F59E0B",
      descripcion: "Semana Santa - Sin actividades sabatinas",
    },
    {
      id: "per-vacaciones-mitad",
      nombre: "Vacaciones de Mitad de Año",
      tipo: "vacaciones",
      fechaInicio: "2027-06-21",
      fechaFin: "2027-07-11",
      colorHex: "#F59E0B",
      descripcion: "Receso de mitad de año para estudiantes y talleristas",
    },
    {
      id: "per-receso-octubre",
      nombre: "Semana de Receso Escolar",
      tipo: "vacaciones",
      fechaInicio: "2027-10-11",
      fechaFin: "2027-10-17",
      colorHex: "#F59E0B",
      descripcion: "Receso escolar de octubre",
    },
  ],
  fechasClaveExamenes: [
    {
      id: "ex-unal-1",
      titulo: "Examen de Admisión UNAL 2027-2",
      tipo: "unal",
      fecha: "2027-04-18",
      descripcion: "Prueba oficial de admisión a la Universidad Nacional",
    },
    {
      id: "ex-icfes",
      titulo: "Examen Saber 11 / ICFES 2027",
      tipo: "icfes",
      fecha: "2027-08-08",
      descripcion: "Prueba de Estado Saber 11 calendario A",
    },
    {
      id: "ex-unal-2",
      titulo: "Examen de Admisión UNAL 2028-1",
      tipo: "unal",
      fecha: "2027-09-19",
      descripcion: "Prueba oficial de admisión a la Universidad Nacional (Segundo período)",
    },
    {
      id: "ex-sim-1",
      titulo: "Primer Simulacro Tipo ICFES / UNAL",
      tipo: "simulacro",
      fecha: "2027-03-13",
      descripcion: "Simulacro diagnóstico general para estudiantes",
    },
  ],
};

export function obtenerEstadoInicialSemilla(): EstadoCronogramaTopo {
  return {
    version: "3.0.0",
    ultimaActualizacion: new Date().toISOString(),
    hitos: HITOS_2027_SEED,
    jornadas: JORNADAS_2027_SEED,
    mallaCurricular: MALLA_CURRICULAR_SEED,
    talleristas: TALLERISTAS_SEED,
    franjasHorarias: FRANJAS_DEFECTO_ESTRUCTURAL,
    estructuraCalendario: ESTRUCTURA_CALENDARIO_DEFECTO,
  };
}

export const StorageService = {
  obtenerUrlGoogleSheets(): string {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem(SHEETS_URL_KEY) ||
      process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL ||
      ""
    );
  },

  guardarUrlGoogleSheets(url: string): void {
    if (typeof window === "undefined") return;
    const limpia = url.trim();
    if (limpia) {
      localStorage.setItem(SHEETS_URL_KEY, limpia);
    } else {
      localStorage.removeItem(SHEETS_URL_KEY);
    }
  },

  cargarLocal(): EstadoCronogramaTopo {
    if (typeof window === "undefined") return obtenerEstadoInicialSemilla();
    try {
      OLD_KEYS.forEach((k) => {
        if (localStorage.getItem(k)) localStorage.removeItem(k);
      });

      const guardado = localStorage.getItem(STORAGE_KEY);
      if (!guardado) {
        const inicial = obtenerEstadoInicialSemilla();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
        return inicial;
      }
      const parsed = JSON.parse(guardado) as Partial<EstadoCronogramaTopo>;
      return {
        version: parsed.version || "3.0.0",
        ultimaActualizacion: parsed.ultimaActualizacion || new Date().toISOString(),
        hitos:
          Array.isArray(parsed.hitos) && parsed.hitos.length > 0
            ? parsed.hitos
            : HITOS_2027_SEED,
        jornadas:
          Array.isArray(parsed.jornadas) && parsed.jornadas.length > 0
            ? parsed.jornadas
            : JORNADAS_2027_SEED,
        mallaCurricular:
          Array.isArray(parsed.mallaCurricular) && parsed.mallaCurricular.length > 0
            ? parsed.mallaCurricular
            : MALLA_CURRICULAR_SEED,
        talleristas: Array.isArray(parsed.talleristas) ? parsed.talleristas : TALLERISTAS_SEED,
        directorioTalleristas: Array.isArray(parsed.directorioTalleristas) ? parsed.directorioTalleristas : [],
        franjasHorarias:
          Array.isArray(parsed.franjasHorarias) && parsed.franjasHorarias.length > 0
            ? parsed.franjasHorarias
            : FRANJAS_DEFECTO_ESTRUCTURAL,
        estructuraCalendario: parsed.estructuraCalendario || ESTRUCTURA_CALENDARIO_DEFECTO,
      };
    } catch (e) {
      console.error("Error leyendo localStorage, usando datos semilla 2027:", e);
      return obtenerEstadoInicialSemilla();
    }
  },

  guardarLocal(estado: EstadoCronogramaTopo): void {
    if (typeof window === "undefined") return;
    try {
      const actualizado: EstadoCronogramaTopo = {
        ...estado,
        ultimaActualizacion: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizado));
    } catch (e) {
      console.error("Error guardando en localStorage:", e);
    }
  },

  async sincronizarHaciaGoogleSheets(
    estado: EstadoCronogramaTopo
  ): Promise<{ ok: boolean; mensaje: string }> {
    const url = this.obtenerUrlGoogleSheets();
    if (!url) {
      return { ok: false, mensaje: "No hay URL de Google Apps Script configurada." };
    }

    try {
      const hitosConTareas: string[][] = [
        ["Fecha", "Día", "Evento", "Compromiso", "Personas encargadas", "Estado"],
        ...estado.hitos.map((h: EventoCronograma) => [
          h.fecha || "",
          h.diaSemana || "",
          h.evento || "",
          h.compromiso || "",
          h.personasEncargadas || "",
          h.completado ? "Completado" : "Pendiente",
        ]),
      ];

      const hitosSinTareas: string[][] = [
        ["Fecha", "Día", "Evento"],
        ...estado.hitos.map((h: EventoCronograma) => [
          h.fecha || "",
          h.diaSemana || "",
          h.evento || "",
        ]),
      ];

      const jornadasTabla: string[][] = [
        [
          "Jornada",
          "Fecha",
          "Día de la semana",
          "Encargadx",
          "Horas",
          "Tipo",
          "Detalle / Bloques",
          "Comentarios",
        ],
        ...estado.jornadas.map((j: JornadaPedagogica, idx: number) => [
          String(j.numeroJornada ?? idx + 1),
          j.fecha || "",
          j.diaSemana || "",
          j.encargadxDelDia || "",
          j.horasJornada || "",
          j.tipoJornada || "clases",
          j.tipoJornada === "unificada"
            ? j.descripcionUnificada || ""
            : j.bloques
                .map(
                  (b) =>
                    `[${b.hora || ""}] ${b.componente || ""}: ${b.temaDelDia || ""} (${
                      b.talleristas || ""
                    })`
                )
                .join(" | "),
          j.comentarios || "",
        ]),
      ];

      const payload = {
        stateJson: JSON.stringify(estado),
        hitosConTareas,
        hitosSinTareas,
        jornadasTabla,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.status === "saved" || data.status === "success") {
        return { ok: true, mensaje: "Sincronizado con Google Sheets correctamente." };
      }
      return { ok: false, mensaje: data.message || "Respuesta inesperada del servidor." };
    } catch (error) {
      console.error("Error sincronizando con Google Sheets:", error);
      return {
        ok: false,
        mensaje:
          "No se pudo conectar con Google Sheets. Tus cambios siguen seguros en este navegador.",
      };
    }
  },

  async descargarDesdeGoogleSheets(): Promise<{
    ok: boolean;
    estado?: EstadoCronogramaTopo;
    mensaje: string;
  }> {
    const url = this.obtenerUrlGoogleSheets();
    if (!url) {
      return { ok: false, mensaje: "Configura primero la URL de Google Apps Script." };
    }

    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.status === "success" && data.state) {
        const estadoRemoto = data.state as EstadoCronogramaTopo;
        this.guardarLocal(estadoRemoto);
        return {
          ok: true,
          estado: estadoRemoto,
          mensaje: "Datos descargados desde Google Sheets exitosamente.",
        };
      }
      return {
        ok: false,
        mensaje: "La hoja de Google Sheets aún no tiene datos guardados desde la app.",
      };
    } catch (error) {
      console.error("Error descargando de Google Sheets:", error);
      return {
        ok: false,
        mensaje:
          "Error al leer desde Google Sheets. Verifica que el script tenga acceso para 'Cualquier persona'.",
      };
    }
  },
};
