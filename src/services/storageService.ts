import { EstadoCronogramaTopo, EventoCronograma, JornadaPedagogica } from "@/types";
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

export function obtenerEstadoInicialSemilla(): EstadoCronogramaTopo {
  return {
    version: "3.0.0",
    ultimaActualizacion: new Date().toISOString(),
    hitos: HITOS_2027_SEED,
    jornadas: JORNADAS_2027_SEED,
    mallaCurricular: MALLA_CURRICULAR_SEED,
    talleristas: TALLERISTAS_SEED,
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
