import { FestivoColombia } from "@/types";

export const FESTIVOS_COLOMBIA_2027: FestivoColombia[] = [
  { fecha: "2027-01-01", fechaCorta: "01/01/2027", nombre: "Año Nuevo", tipo: "fijo" },
  { fecha: "2027-01-11", fechaCorta: "11/01/2027", nombre: "Reyes Magos (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-03-22", fechaCorta: "22/03/2027", nombre: "Día de San José (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-03-25", fechaCorta: "25/03/2027", nombre: "Jueves Santo", tipo: "pascua" },
  { fecha: "2027-03-26", fechaCorta: "26/03/2027", nombre: "Viernes Santo", tipo: "pascua" },
  { fecha: "2027-03-28", fechaCorta: "28/03/2027", nombre: "Domingo de Pascua", tipo: "pascua" },
  { fecha: "2027-05-01", fechaCorta: "01/05/2027", nombre: "Día del Trabajo", tipo: "fijo" },
  { fecha: "2027-05-10", fechaCorta: "10/05/2027", nombre: "Día de la Ascensión (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-05-31", fechaCorta: "31/05/2027", nombre: "Corpus Christi (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-06-07", fechaCorta: "07/06/2027", nombre: "Sagrado Corazón de Jesús (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-07-05", fechaCorta: "05/07/2027", nombre: "San Pedro y San Pablo (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-07-20", fechaCorta: "20/07/2027", nombre: "Día de la Independencia de Colombia", tipo: "fijo" },
  { fecha: "2027-08-07", fechaCorta: "07/08/2027", nombre: "Batalla de Boyacá", tipo: "fijo" },
  { fecha: "2027-08-16", fechaCorta: "16/08/2027", nombre: "Asunción de la Virgen (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-10-18", fechaCorta: "18/10/2027", nombre: "Día de la Raza / Diversidad Cultural (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-11-01", fechaCorta: "01/11/2027", nombre: "Día de Todos los Santos (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-11-15", fechaCorta: "15/11/2027", nombre: "Independencia de Cartagena (Ley Emiliani)", tipo: "emiliani" },
  { fecha: "2027-12-08", fechaCorta: "08/12/2027", nombre: "Inmaculada Concepción", tipo: "fijo" },
  { fecha: "2027-12-25", fechaCorta: "25/12/2027", nombre: "Navidad", tipo: "fijo" },
];

export const MESES_NOMBRES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const DIAS_SEMANA_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DIAS_SEMANA_LARGOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function obtenerFestivoPorFechaISO(fechaISO: string): FestivoColombia | undefined {
  return FESTIVOS_COLOMBIA_2027.find((f) => f.fecha === fechaISO);
}

/**
 * Convierte "DD/MM/YYYY" o "23 de enero de 2027" a "YYYY-MM-DD"
 */
export function ddmmyyyyToISO(fechaStr?: string): string | null {
  if (!fechaStr) return null;
  const limpio = fechaStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    return limpio;
  }

  const match = limpio.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const d = match[1].padStart(2, "0");
    const m = match[2].padStart(2, "0");
    const y = match[3];
    return `${y}-${m}-${d}`;
  }

  const mesesMin = MESES_NOMBRES.map((m) => m.toLowerCase());
  const matchLargo = limpio
    .toLowerCase()
    .match(/^(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?$/i);
  if (matchLargo) {
    const d = matchLargo[1].padStart(2, "0");
    const mesIdx = mesesMin.indexOf(matchLargo[2].toLowerCase());
    const y = matchLargo[3] || "2027";
    if (mesIdx !== -1) {
      const m = String(mesIdx + 1).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

/**
 * Obtiene el nombre del día de la semana ("Sábado", "Martes", etc.) a partir de un string de fecha o ISO
 */
export function obtenerNombreDiaSemana(fechaStrOrISO?: string): string {
  const iso = ddmmyyyyToISO(fechaStrOrISO);
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return "";
  return DIAS_SEMANA_LARGOS[dateObj.getDay()] || "";
}

/**
 * Convierte "YYYY-MM-DD" a "DD/MM/YYYY"
 */
export function isoToDDMMYYYY(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Convierte "YYYY-MM-DD" a formato comunitario largo: "23 de enero de 2027"
 */
export function isoToFechaComunitaria(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso;
  return `${String(day).padStart(2, "0")} de ${MESES_NOMBRES[monthIdx].toLowerCase()} de ${year}`;
}

/**
 * Colores distintivos para cada componente pedagógico
 */
export const COLORES_COMPONENTES: Record<
  string,
  { bg: string; text: string; border: string; badgeBg: string; excelHex: string }
> = {
  "ORIENTACIÓN VOCACIONAL": {
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-300",
    badgeBg: "bg-amber-200/80 text-amber-950",
    excelHex: "FEF3C7",
  },
  CONTEXTO: {
    bg: "bg-orange-50",
    text: "text-orange-900",
    border: "border-orange-300",
    badgeBg: "bg-orange-200/80 text-orange-950",
    excelHex: "FFEDD5",
  },
  MATEMÁTICAS: {
    bg: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-300",
    badgeBg: "bg-blue-200/80 text-blue-950",
    excelHex: "DBEAFE",
  },
  LENGUAJE: {
    bg: "bg-rose-50",
    text: "text-rose-900",
    border: "border-rose-300",
    badgeBg: "bg-rose-200/80 text-rose-950",
    excelHex: "FFE4E6",
  },
  BIOLOGÍA: {
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-200/80 text-emerald-950",
    excelHex: "D1FAE5",
  },
  INGLÉS: {
    bg: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-300",
    badgeBg: "bg-purple-200/80 text-purple-950",
    excelHex: "F3E8FF",
  },
  QUÍMICA: {
    bg: "bg-teal-50",
    text: "text-teal-900",
    border: "border-teal-300",
    badgeBg: "bg-teal-200/80 text-teal-950",
    excelHex: "CCFBF1",
  },
  "ANÁLISIS DE LA IMAGEN": {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-900",
    border: "border-fuchsia-300",
    badgeBg: "bg-fuchsia-200/80 text-fuchsia-950",
    excelHex: "FAE8FF",
  },
  FILOSOFÍA: {
    bg: "bg-indigo-50",
    text: "text-indigo-900",
    border: "border-indigo-300",
    badgeBg: "bg-indigo-200/80 text-indigo-950",
    excelHex: "E0E7FF",
  },
  FÍSICA: {
    bg: "bg-cyan-50",
    text: "text-cyan-900",
    border: "border-cyan-300",
    badgeBg: "bg-cyan-200/80 text-cyan-950",
    excelHex: "CFFAFE",
  },
};

export function obtenerEstiloComponente(componente?: string) {
  if (!componente) {
    return {
      bg: "bg-stone-50/70",
      text: "text-stone-700",
      border: "border-stone-200",
      badgeBg: "bg-stone-100 text-stone-700",
      excelHex: "FFFFFF",
    };
  }
  const key = componente.trim().toUpperCase();
  if (COLORES_COMPONENTES[key]) return COLORES_COMPONENTES[key];
  for (const [k, val] of Object.entries(COLORES_COMPONENTES)) {
    if (key.includes(k) || k.includes(key)) return val;
  }
  return {
    bg: "bg-amber-50/50",
    text: "text-stone-800",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-900",
    excelHex: "FEF3C7",
  };
}
