"use client";

import React from "react";
import {
  Gamepad2,
  Calendar,
  ListTodo,
  Layers,
  Download,
  CloudUpload,
  Database,
  Coffee,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  Settings2,
  FileSpreadsheet,
  Clock,
  Compass,
  AlertCircle,
  GraduationCap,
  CalendarClock,
  Check,
  ClipboardList,
  Archive,
  UserCheck,
  Shield,
  KeyRound,
  CalendarCheck,
  UserPlus,
  RotateCcw,
} from "lucide-react";
import { TopoAvatar, SolMuralSVG, AbejitaMuralSVG, FlorMuralSVG } from "./TopoAvatar";
import { EstadoCronogramaTopo, JornadaPedagogica } from "@/types";
import { ddmmyyyyToISO, obtenerNombreDiaSemana } from "@/utils/festivosColombia";
import { TimelineEstrategico } from "./TimelineEstrategico";

interface MenuInicialProps {
  estado: EstadoCronogramaTopo;
  esCoordinador?: boolean;
  usuarioActualNombre?: string;
  onPostularEncargadx?: (jornadaId: string, nombreTallerista: string) => Promise<void>;
  onLiberarEncargadx?: (jornadaId: string) => Promise<void>;
  onSeleccionarModulo: (
    modulo: "juego" | "calendario" | "cronograma" | "matriz" | "talleristas" | "estructura" | "hoja_calculo" | "bitacora" | "ciclos_archivo"
  ) => void;
  onIrAJornada?: (jornadaId: string) => void;
  onAbrirAsistenteCalendario?: () => void;
  onDescargarExcel: () => void;
  onAbrirModalSheets: () => void;
  onAbrirPausaActiva: () => void;
  minutosPausa: string;
  guardadoReciente: boolean;
  tieneUrlSheets: boolean;
}

export function MenuInicial({
  estado,
  esCoordinador = false,
  usuarioActualNombre = "David Díaz",
  onPostularEncargadx,
  onLiberarEncargadx,
  onSeleccionarModulo,
  onIrAJornada,
  onAbrirAsistenteCalendario,
  onDescargarExcel,
  onAbrirModalSheets,
  onAbrirPausaActiva,
  minutosPausa,
  guardadoReciente,
  tieneUrlSheets,
}: MenuInicialProps) {
  // Estadísticas clave para mostrar en el menú
  const totalHitos = estado.hitos.length;
  const hitosCompletados = estado.hitos.filter((h) => h.completado).length;
  const totalJornadas = estado.jornadas.length;

  // Determinar si hay un ciclo activo oficial en este momento
  const hayCicloActivo = Boolean(estado.calendarioActivoId);
  const calActivoObj = (estado.calendarios || []).find((c) => c.id === estado.calendarioActivoId);

  // Clasificación detallada de jornadas por carácter y tipo
  const jornadasClases = estado.jornadas.filter((j) => (j.caracter || (j.tipoJornada === "clases" ? "clases" : "coordinacion")) === "clases").length;
  const jornadasVacaciones = estado.jornadas.filter((j) => j.caracter === "vacaciones").length;
  const jornadasCoordinacion = estado.jornadas.filter((j) => (j.caracter || (j.tipoJornada === "unificada" ? "coordinacion" : "clases")) === "coordinacion").length;
  const jornadasExamenes = estado.jornadas.filter((j) => j.caracter === "examen").length;

  // Días de semana
  const totalSabados = estado.jornadas.filter((j) => (j.diaSemana || "").toLowerCase().includes("sáb") || (j.diaSemana || "").toLowerCase().includes("sab")).length;
  const totalEntreSemana = totalJornadas - totalSabados;

  const jornadasListas = estado.jornadas.filter((j) =>
    j.tipoJornada === "unificada"
      ? Boolean(j.descripcionUnificada?.trim())
      : j.bloques.some((b) => Boolean(b.componente?.trim() || b.temaDelDia?.trim()))
  ).length;

  // Estadísticas por componente (Malla Curricular)
  const conteoClasesPorComponente = React.useMemo(() => {
    const conteo: Record<string, number> = {};
    estado.jornadas.forEach((j) => {
      const caracter = j.caracter || (j.tipoJornada === "clases" ? "clases" : "coordinacion");
      if (caracter === "clases") {
        j.bloques.forEach((b) => {
          if (b.componente?.trim()) {
            const c = b.componente.trim().toUpperCase();
            conteo[c] = (conteo[c] || 0) + 1;
          }
        });
      }
    });
    return conteo;
  }, [estado.jornadas]);

  // Total de horas pedagógicas reales de clase
  const duracionMin = estado.estructuraCalendario?.duracionBloqueMinutos || 90;
  const totalBloquesAsignados = estado.jornadas.reduce((acc, j) => {
    const caracter = j.caracter || (j.tipoJornada === "clases" ? "clases" : "coordinacion");
    if (caracter === "clases") {
      return acc + j.bloques.filter((b) => Boolean(b.componente?.trim())).length;
    }
    return acc;
  }, 0);
  const totalHorasPedagogicas = Math.round((totalBloquesAsignados * duracionMin) / 60);

  // Jornadas ordenadas cronológicamente para calcular la próxima jornada
  const jornadasOrdenadas = React.useMemo(() => {
    return [...estado.jornadas].sort((a, b) => {
      const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });
  }, [estado.jornadas]);

  // Calcular la próxima jornada en tiempo real respecto al presente
  const infoProximaJornada = React.useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyISO = hoy.toISOString().split("T")[0];

    // Buscar la primera jornada cuya fecha sea hoy o futura
    let encontrada = jornadasOrdenadas.find((j) => {
      const iso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
      return iso >= hoyISO;
    });

    // Si todas ya pasaron (o estamos probando en fecha posterior), tomar la primera para mostrar la dinámica
    if (!encontrada && jornadasOrdenadas.length > 0) {
      encontrada = jornadasOrdenadas[0];
    }

    if (!encontrada) return null;

    const iso = encontrada.fechaISO || ddmmyyyyToISO(encontrada.fecha) || "";
    let diasFaltantes = 0;
    if (iso) {
      const [y, m, d] = iso.split("-").map(Number);
      const target = new Date(y, m - 1, d);
      diasFaltantes = Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    }

    const caracter = encontrada.caracter || (encontrada.tipoJornada === "clases" ? "clases" : "coordinacion");

    return {
      jornada: encontrada,
      diasFaltantes,
      caracter,
      esHoy: diasFaltantes === 0,
      yaPaso: diasFaltantes < 0,
    };
  }, [jornadasOrdenadas]);

  // Calcular la cuenta regresiva para los exámenes clave
  const examenesConConteo = React.useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return (estado.estructuraCalendario?.fechasClaveExamenes || []).map((e) => {
      const iso = ddmmyyyyToISO(e.fecha) || "";
      let dias = 0;
      if (iso) {
        const [y, m, d] = iso.split("-").map(Number);
        const target = new Date(y, m - 1, d);
        dias = Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Contar cuántos sábados de clase quedan antes de este examen
      const sabadosDeClaseAntes = jornadasOrdenadas.filter((j) => {
        const jIso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
        const esClase = (j.caracter || (j.tipoJornada === "clases" ? "clases" : "coordinacion")) === "clases";
        const esSabado = (j.diaSemana || "").toLowerCase().includes("sáb") || (j.diaSemana || "").toLowerCase().includes("sab");
        return esClase && esSabado && jIso <= iso;
      }).length;

      return {
        ...e,
        iso,
        diasFaltantes: dias,
        sabadosDeClaseAntes,
      };
    });
  }, [estado.estructuraCalendario?.fechasClaveExamenes, jornadasOrdenadas]);

  // Lógica para Encargadx del Día
  const hoyRef = React.useMemo(() => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return h;
  }, []);
  const hoyISO = hoyRef.toISOString().split("T")[0];

  // Fechas libres (sin encargado asignado)
  const fechasLibres = React.useMemo(() => {
    return jornadasOrdenadas.filter((j) => !j.encargadxDelDia || !j.encargadxDelDia.trim());
  }, [jornadasOrdenadas]);

  // Próxima fecha libre (priorizando fechas futuras o de hoy, y si todas pasaron, la primera libre disponible)
  const proximaFechaLibre = React.useMemo(() => {
    const libreFutura = fechasLibres.find((j) => {
      const iso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
      return iso >= hoyISO;
    });
    return libreFutura || fechasLibres[0] || null;
  }, [fechasLibres, hoyISO]);

  // Turno del usuario actual
  const turnosUsuario = React.useMemo(() => {
    if (!usuarioActualNombre) return [];
    const nom = usuarioActualNombre.trim().toLowerCase();
    return jornadasOrdenadas.filter(
      (j) => j.encargadxDelDia && j.encargadxDelDia.trim().toLowerCase() === nom
    );
  }, [jornadasOrdenadas, usuarioActualNombre]);

  // Próximo turno del usuario actual (futuro o primero disponible)
  const miProximoTurno = React.useMemo(() => {
    const futuro = turnosUsuario.find((j) => {
      const iso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
      return iso >= hoyISO;
    });
    return futuro || turnosUsuario[0] || null;
  }, [turnosUsuario, hoyISO]);

  // Días faltantes para el turno del usuario actual
  const diasFaltantesMiTurno = React.useMemo(() => {
    if (!miProximoTurno) return null;
    const iso = miProximoTurno.fechaISO || ddmmyyyyToISO(miProximoTurno.fecha) || "";
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    return Math.round((target.getTime() - hoyRef.getTime()) / (1000 * 60 * 60 * 24));
  }, [miProximoTurno, hoyRef]);

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-fadeIn">
      {/* =========================================================================
          HERO CENTRAL: BIENVENIDA, TOPO Y ENERGÍA KAHOOT (COLORES VIVOS & AMIGABLES)
         ========================================================================= */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#46178F] via-[#5C23A3] to-[#2B0E68] text-white p-7 sm:p-12 shadow-2xl overflow-hidden border-4 border-white/20">
        {/* Decoraciones de fondo estilo Kahoot / Mural Topo */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <SolMuralSVG className="absolute top-4 right-6 w-24 sm:w-32 h-24 sm:h-32 opacity-30 pointer-events-none animate-spin-slow" />
        <AbejitaMuralSVG className="absolute top-8 left-8 w-10 sm:w-12 h-10 sm:h-12 opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10 text-center md:text-left">
          {/* Avatar del Topo en caja limpia y redondeada */}
          <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-xl shrink-0 hover:scale-105 transition-transform">
            <TopoAvatar size="xl" variant="completo" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400 text-[#2B2623] text-xs font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {estado.estructuraCalendario?.modalidadCiclo === "dos_ciclos"
                  ? "Biciclo Semestral (Ciclo I & Ciclo II)"
                  : "Ciclo Anual Continuo"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">
              Escuela Popular El Topo
            </h1>
            <p className="text-base sm:text-lg text-purple-100 font-medium max-w-2xl leading-relaxed">
              Planificador pedagógico y comunitario. Elige una sección para comenzar o gestiona las
              descargas y sincronizaciones desde aquí.
            </p>

            {/* Badges de resumen rápido */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              {hayCicloActivo ? (
                <>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/30 backdrop-blur border border-emerald-400 text-xs font-black text-emerald-200">
                    🟢 Activo: {calActivoObj?.nombre || "Ciclo Oficial"}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-xs font-bold text-white">
                    📅 {totalJornadas} Fechas
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-xs font-bold text-emerald-300">
                    📚 {jornadasClases} Sábados de Clases ({totalHorasPedagogicas} Horas)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-xs font-bold text-amber-300">
                    🏖️ {jornadasVacaciones} Recesos &bull; 👥 {jornadasCoordinacion} Coordinación
                  </span>
                </>
              ) : (
                <span className="px-4 py-1.5 rounded-xl bg-amber-400/20 backdrop-blur border border-amber-300/40 text-xs font-bold text-amber-200">
                  ⚠️ No hay un ciclo lectivo activo en este momento (período en receso o finalizado)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA INFORMATIVA DE ESTADO DEL CICLO: REDIRECCIÓN RÁPIDA */}
      <div className={`rounded-3xl p-4 sm:p-5 border-2 shadow-warm flex flex-wrap items-center justify-between gap-4 transition ${
        hayCicloActivo
          ? "bg-emerald-50/80 border-emerald-300"
          : "bg-amber-50/90 border-amber-300"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black ${
            hayCicloActivo ? "bg-emerald-200 text-emerald-950" : "bg-amber-200 text-amber-950"
          }`}>
            {hayCicloActivo ? "🟢" : "⏸️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-stone-900">
                {hayCicloActivo ? `Ciclo Lectivo Activo: ${calActivoObj?.nombre || "En curso"}` : "Sin ciclo lectivo activo"}
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                hayCicloActivo ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"
              }`}>
                {hayCicloActivo ? "En curso" : "Receso / Finalizado"}
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium">
              {hayCicloActivo
                ? "Todas las clases, asistencias y bitácoras del sistema giran en torno a este ciclo activo."
                : "No se registran clases actualmente. Puedes crear un nuevo ciclo o reactivar uno previo desde el archivo."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hayCicloActivo ? (
            <button
              type="button"
              onClick={() => onSeleccionarModulo("ciclos_archivo")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-emerald-300 text-emerald-900 font-black text-xs shadow-sm transition active:scale-95"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Gestionar / Desactivar Ciclo</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {esCoordinador && onAbrirAsistenteCalendario && (
                <button
                  type="button"
                  onClick={onAbrirAsistenteCalendario}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-xs shadow-sm transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Crear Nuevo Ciclo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSeleccionarModulo("ciclos_archivo")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-sm transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ver Archivo / Activar Ciclo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          PANEL DE ACCIONES GLOBALES / ADMINISTRATIVAS (EXCEL, SHEETS, PAUSA, ESTADO)
          - Ubicado estratégicamente justo debajo del banner principal
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-topo-dark flex items-center justify-center font-black">
            ⚙️
          </div>
          <div>
            <h3 className="text-sm font-black text-topo-dark">Herramientas Globales</h3>
            <p className="text-xs text-stone-500 font-bold">
              Descarga consolidada en Excel o sincronización en la nube
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indicador de sincronización en vivo con base de datos Supabase */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-black text-topo-green" title="Todos los cambios se guardan y leen en vivo desde la base de datos de Supabase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sincronizado con Base de Datos</span>
          </div>

          {/* Pausa Activa */}
          <button
            type="button"
            onClick={onAbrirPausaActiva}
            title="Recordatorio de Pausa Activa"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-xs font-black text-amber-950 transition active:scale-95"
          >
            <Coffee className="w-4 h-4 text-topo-terracotta" />
            <span>Pausa Activa:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-amber-200">
              {minutosPausa}
            </span>
          </button>

          {/* Google Sheets */}
          <button
            type="button"
            onClick={onAbrirModalSheets}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-[#D5CBB8] bg-[#F6F2E9] hover:bg-white text-xs font-black text-stone-800 transition active:scale-95"
          >
            {tieneUrlSheets ? (
              <CloudUpload className="w-4 h-4 text-topo-green" />
            ) : (
              <Database className="w-4 h-4 text-topo-terracotta" />
            )}
            <span>{tieneUrlSheets ? "Sincronizado con Sheets" : "Conectar Google Sheets"}</span>
          </button>

          {/* Descargar Excel (Destacado) */}
          <button
            type="button"
            onClick={onDescargarExcel}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-topo-green hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs shadow-md hover:shadow-lg transition transform active:scale-95"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Descargar Todo en Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          RADAR OPERATIVO: SOLO SE RENDERIZA SI HAY UN CICLO LECTIVO ACTIVO
         ========================================================================= */}
      <div className="space-y-5">
        {hayCicloActivo && (
          <>
            {/* FILA 1: RADAR DE LA PRÓXIMA JORNADA (ACCESO INMEDIATO) */}
            {infoProximaJornada && (
              <div className="rounded-3xl bg-gradient-to-r from-[#1B365D] via-[#2A4D7D] to-[#1B365D] text-white p-5 sm:p-6 border-4 border-amber-300 shadow-warm-lg flex flex-col md:flex-row items-center justify-between gap-5 animate-fadeIn">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 text-topo-dark flex flex-col items-center justify-center font-black shadow-md shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">JORNADA</span>
                    <span className="text-2xl leading-none mt-1">#{infoProximaJornada.jornada.numeroJornada}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-topo-dark shadow-sm">
                        {infoProximaJornada.esHoy
                          ? "🎯 ¡Es Hoy!"
                          : infoProximaJornada.yaPaso
                          ? `Pasó hace ${Math.abs(infoProximaJornada.diasFaltantes)} días`
                          : `⏳ Próxima en ${infoProximaJornada.diasFaltantes} días`}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        infoProximaJornada.caracter === "clases"
                          ? "bg-emerald-400 text-emerald-950"
                          : infoProximaJornada.caracter === "vacaciones"
                          ? "bg-amber-300 text-amber-950"
                          : infoProximaJornada.caracter === "coordinacion"
                          ? "bg-indigo-300 text-indigo-950"
                          : "bg-purple-300 text-purple-950"
                      }`}>
                        {infoProximaJornada.caracter === "clases"
                          ? "📚 Sábado de Clases"
                          : infoProximaJornada.caracter === "vacaciones"
                          ? "🏖️ Receso Escolar"
                          : infoProximaJornada.caracter === "coordinacion"
                          ? "👥 Coordinación"
                          : "🎓 Examen / Simulacro"}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {infoProximaJornada.jornada.diaSemana}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black capitalize text-white">
                      {infoProximaJornada.jornada.fecha}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium">
                      {infoProximaJornada.caracter === "clases" ? (
                        <>
                          <span className="font-bold text-amber-300">Encargadx: </span>
                          {infoProximaJornada.jornada.encargadxDelDia || "Por definir"} &bull;{" "}
                          <span className="font-bold text-emerald-300">Materias: </span>
                          {infoProximaJornada.jornada.bloques
                            .map((b) => b.componente || "Sin materia")
                            .join(" • ")}
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-amber-300">Actividad: </span>
                          {infoProximaJornada.jornada.descripcionUnificada || "Sin descripción de agenda"}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSeleccionarModulo("bitacora")}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-md transition hover:scale-105 active:scale-95"
                  >
                    <ClipboardList className="w-4 h-4 text-amber-300" />
                    <span>Abrir Bitácora del Día</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onIrAJornada) {
                        onIrAJornada(infoProximaJornada.jornada.id);
                      } else {
                        onSeleccionarModulo("juego");
                      }
                    }}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-topo-dark font-black text-xs sm:text-sm shadow-md transition hover:scale-105 active:scale-95"
                  >
                    <span>Planear Fecha</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* FILA 2: GRID DE BLOQUES EJECUTIVOS Y VISUALES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* TARJETA RESUMEN 1: ESTRUCTURA REAL Y BALANCE DEL CALENDARIO */}
              <div className="bg-white rounded-3xl p-5 border-2 border-[#E2DCCE] shadow-warm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-topo-dark flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs">📊</span>
                    Estructura del Calendario
                  </h3>
                  <span className="text-[10px] font-black uppercase text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    {totalJornadas} Días Totales
                  </span>
                </div>

                {/* Barra segmentada visual del año */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-stone-500">
                    <span>Distribución del Año Pedagógico</span>
                    <span>{totalHorasPedagogicas} hrs de clase</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-stone-100 flex overflow-hidden border border-stone-200">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(jornadasClases / (totalJornadas || 1)) * 100}%` }}
                      title={`Clases: ${jornadasClases} días (${Math.round((jornadasClases / (totalJornadas || 1)) * 100)}%)`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${(jornadasVacaciones / (totalJornadas || 1)) * 100}%` }}
                      title={`Vacaciones: ${jornadasVacaciones} días (${Math.round((jornadasVacaciones / (totalJornadas || 1)) * 100)}%)`}
                    />
                    <div
                      className="bg-indigo-400 h-full transition-all"
                      style={{ width: `${(jornadasCoordinacion / (totalJornadas || 1)) * 100}%` }}
                      title={`Coordinación: ${jornadasCoordinacion} días (${Math.round((jornadasCoordinacion / (totalJornadas || 1)) * 100)}%)`}
                    />
                    <div
                      className="bg-purple-500 h-full transition-all"
                      style={{ width: `${(jornadasExamenes / (totalJornadas || 1)) * 100}%` }}
                      title={`Exámenes: ${jornadasExamenes} días (${Math.round((jornadasExamenes / (totalJornadas || 1)) * 100)}%)`}
                    />
                  </div>
                </div>

                {/* Tarjeticas de métricas numéricas */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <span className="text-[10px] uppercase font-black text-emerald-700 block">📚 Clases</span>
                    <span className="text-xl font-black">{jornadasClases}</span>
                    <span className="text-[10px] text-emerald-800 font-bold block">
                      {Math.round((jornadasClases / (totalJornadas || 1)) * 100)}% del tiempo
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                    <span className="text-[10px] uppercase font-black text-amber-700 block">🏖️ Recesos</span>
                    <span className="text-xl font-black">{jornadasVacaciones}</span>
                    <span className="text-[10px] text-amber-800 font-bold block">
                      Vacaciones y festivos
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                    <span className="text-[10px] uppercase font-black text-indigo-700 block">👥 Coordinación</span>
                    <span className="text-xl font-black">{jornadasCoordinacion}</span>
                    <span className="text-[10px] text-indigo-800 font-bold block">
                      Inducción / Escuela
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950">
                    <span className="text-[10px] uppercase font-black text-purple-700 block">🎓 Exámenes</span>
                    <span className="text-xl font-black">{jornadasExamenes}</span>
                    <span className="text-[10px] text-purple-800 font-bold block">
                      Simulacros oficiales
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-600 font-bold">
                  <span>📅 {totalSabados} Sábados</span>
                  <span>⚡ {totalEntreSemana} Fechas entre semana</span>
                </div>
              </div>

              {/* MÓDULO INTEGRADO: GESTIÓN DE ENCARGADX DEL DÍA (COL-SPAN 2) */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#E2DCCE] shadow-warm flex flex-col justify-between gap-4">
                {/* Cabecera unificada */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg shadow-sm">
                      📋
                    </div>
                    <div>
                      <h3 className="font-black text-base text-topo-dark leading-tight flex items-center gap-2">
                        Gestión de Encargadx del Día
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Apertura de sede, logística y toma comunitaria de asistencia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      miProximoTurno ? "bg-purple-100 text-purple-800" : "bg-stone-100 text-stone-600"
                    }`}>
                      {miProximoTurno ? "Tu turno asignado" : "Sin asignar a ti"}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      fechasLibres.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {fechasLibres.length > 0 ? `${fechasLibres.length} Fechas Libres` : "100% Cubierto"}
                    </span>
                  </div>
                </div>

                {/* Cuerpo dividido en 2 columnas integradas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {/* LADO IZQUIERDO: Mi Turno Personal & Acceso a Bitácora */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/80 space-y-3">
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
                        👤 Mi Turno Personal
                      </span>

                      {miProximoTurno ? (
                        <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-sm space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-purple-900 text-sm">
                              Jornada #{miProximoTurno.numeroJornada}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                              diasFaltantesMiTurno === 0
                                ? "bg-amber-400 text-topo-dark animate-pulse"
                                : diasFaltantesMiTurno !== null && diasFaltantesMiTurno < 0
                                ? "bg-stone-200 text-stone-600"
                                : diasFaltantesMiTurno !== null && diasFaltantesMiTurno <= 7
                                ? "bg-rose-500 text-white animate-pulse"
                                : "bg-purple-700 text-white"
                            }`}>
                              {diasFaltantesMiTurno === 0
                                ? "¡Es Hoy!"
                                : diasFaltantesMiTurno !== null && diasFaltantesMiTurno < 0
                                ? "Turno anterior"
                                : `Faltan ${diasFaltantesMiTurno} días`}
                            </span>
                          </div>

                          <div className="text-purple-950 space-y-0.5">
                            <p className="font-black text-xs">📅 {miProximoTurno.fecha}</p>
                            <p className="text-[11px] text-purple-700 font-medium">
                              Horario: {miProximoTurno.horasJornada || "8:00 AM - 3:00 PM"}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-600">
                              Responsable: <strong className="text-purple-900">{miProximoTurno.encargadxDelDia}</strong>
                            </span>
                            {onLiberarEncargadx && (
                              <button
                                type="button"
                                onClick={() => onLiberarEncargadx(miProximoTurno.id)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline transition"
                              >
                                Liberar fecha
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white border border-stone-200 text-center space-y-1.5">
                          <div className="text-xl">🌱</div>
                          <p className="text-xs font-bold text-stone-700">
                            No tienes sábados asignados en este ciclo
                          </p>
                          <p className="text-[10px] text-stone-500">
                            Puedes postularte a las fechas disponibles en la lista contigua.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (miProximoTurno && onIrAJornada) {
                          onIrAJornada(miProximoTurno.id);
                        }
                        onSeleccionarModulo("bitacora");
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ClipboardList className="w-4 h-4 text-amber-300" />
                      <span>Acceder a Bitácora del Encargadx</span>
                    </button>
                  </div>

                  {/* LADO DERECHO: Próxima Libre & Lista de Postulaciones */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/80 space-y-2.5">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
                      ✋ Fechas y Postulación Comunitaria
                    </span>

                    {/* Próxima fecha libre destacada */}
                    {proximaFechaLibre ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 shrink-0">
                        <div>
                          <span className="text-[9px] font-black text-amber-800 uppercase block">Próxima libre</span>
                          <span className="text-xs font-black text-stone-900 block">
                            #{proximaFechaLibre.numeroJornada} - {proximaFechaLibre.fecha}
                          </span>
                        </div>
                        {onPostularEncargadx && (
                          <button
                            type="button"
                            onClick={() => onPostularEncargadx(proximaFechaLibre.id, usuarioActualNombre)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-topo-dark font-black text-[11px] shadow-sm transition hover:scale-105 active:scale-95"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Postularme</span>
                          </button>
                        )}
                      </div>
                    ) : null}

                    {/* Lista scrollable de fechas */}
                    <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1 text-xs flex-1">
                      {jornadasOrdenadas.map((j) => {
                        const tieneEncargado = Boolean(j.encargadxDelDia?.trim());
                        const soyYo = j.encargadxDelDia?.trim().toLowerCase() === (usuarioActualNombre || "").trim().toLowerCase();
                        const esLibre = !tieneEncargado;

                        return (
                          <div
                            key={j.id}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                              soyYo
                                ? "bg-purple-50/90 border-purple-200 text-purple-950 font-bold"
                                : esLibre
                                ? "bg-white border-amber-200/80 hover:bg-amber-50/40"
                                : "bg-white/80 border-stone-200 text-stone-600"
                            }`}
                          >
                            <div className="truncate min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-black text-stone-900">
                                  #{j.numeroJornada}
                                </span>
                                <span className="text-[11px] text-stone-700">
                                  {j.fecha}
                                </span>
                              </div>
                              <div className="text-[10px] truncate text-stone-500">
                                {soyYo ? "Tú eres encargadx ✨" : tieneEncargado ? `Encargadx: ${j.encargadxDelDia}` : "Sin encargadx asignadx"}
                              </div>
                            </div>

                            <div className="shrink-0">
                              {esLibre && onPostularEncargadx ? (
                                <button
                                  type="button"
                                  onClick={() => onPostularEncargadx(j.id, usuarioActualNombre)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-black transition"
                                >
                                  Postular
                                </button>
                              ) : soyYo && onLiberarEncargadx ? (
                                <button
                                  type="button"
                                  onClick={() => onLiberarEncargadx(j.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition"
                                >
                                  Liberar
                                </button>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  tieneEncargado ? "bg-stone-100 text-stone-600" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {tieneEncargado ? "Asignado" : "Libre"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ESQUEMA ESTRATÉGICO PANORÁMICO RESUMIDO (TIMELINE HORIZONTAL DEL AÑO) */}
        {hayCicloActivo && estado.estructuraCalendario && (estado.estructuraCalendario.periodosTemporales?.length > 0 || estado.estructuraCalendario.fechasClaveExamenes?.length > 0) ? (
          <TimelineEstrategico
            modalidadCiclo={estado.estructuraCalendario.modalidadCiclo}
            nombreCiclo1={estado.estructuraCalendario.nombreCiclo1}
            nombreCiclo2={estado.estructuraCalendario.nombreCiclo2}
            periodos={estado.estructuraCalendario.periodosTemporales || []}
            examenes={estado.estructuraCalendario.fechasClaveExamenes || []}
            titulo="🗺️ Esquema Cronológico de Ciclos, Tramos y Metas"
            subtitulo="Panorámica visual del año lectivo, cortes de receso y metas de admisión oficial"
            compacto={true}
          />
        ) : (
          /* ESPACIO PERMANENTE DEL CALENDARIO GRÁFICO CUANDO NO HAY UNO ACTIVO O ESTÁ VACÍO */
          <div className="rounded-3xl border-2 border-dashed border-[#D5CBB8] bg-white p-8 shadow-warm text-center space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-black text-topo-dark flex items-center gap-2">
                  <span>🗺️ Esquema Cronológico de Ciclos y Metas</span>
                </h3>
                <p className="text-xs text-stone-500 font-bold mt-0.5">
                  Visualización panorámica del año lectivo y exámenes
                </p>
              </div>
              <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Sin Ciclo Activo en Curso
              </span>
            </div>

            <div className="py-6 max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
                📅
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-topo-dark">
                  No hay un calendario o ciclo lectivo activo en este momento
                </p>
                <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
                  {esCoordinador
                    ? "El período anterior ha finalizado o se encuentra en receso. Como equipo de coordinación puedes iniciar el asistente para estructurar un nuevo ciclo o reactivar uno previo desde el archivo."
                    : "El período anterior ha finalizado. El equipo de coordinación publicará las fechas y el cronograma escolar una vez aprobado el nuevo ciclo lectivo."}
                </p>
              </div>

              {esCoordinador && (
                <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
                  {onAbrirAsistenteCalendario && (
                    <button
                      type="button"
                      onClick={onAbrirAsistenteCalendario}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-xs shadow-md transition transform active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Crear / Programar Nuevo Calendario</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSeleccionarModulo("ciclos_archivo")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-sm transition transform active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Ver Archivo / Reactivar Ciclo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          PARRILLA DE SELECCIÓN DE MÓDULOS (ESTILO TARJETAS KAHOOT)
         ========================================================================= */}
      <div className="space-y-6">
        {/* GRUPO A: VISTAS Y PLANIFICACIÓN */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xl font-black text-topo-dark flex items-center gap-2">
              <span>🎯 Vistas de Planificación y Clases</span>
            </h2>
            <span className="text-xs text-stone-500 font-semibold">
              Elige cómo deseas ver y programar las clases
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* TARJETA 1: PLANIFICADOR DÍA POR DÍA (JORNADA A JORNADA) */}
            <div
              onClick={() => onSeleccionarModulo("juego")}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-white border-4 border-[#7A3EBE] hover:border-[#5C23A3] p-5 shadow-warm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#7A3EBE] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5C23A3] text-[10px] font-black uppercase tracking-wider">
                    Día por Día
                  </span>
                </div>
                <h3 className="text-lg font-black text-topo-dark group-hover:text-[#5C23A3] transition-colors">
                  Planificador Jornada a Jornada
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Revisa cada fecha con su cuenta regresiva de días, define su carácter (clase, vacación o reunión) y gestiona sus bloques.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between">
                <span className="text-[11px] font-black text-purple-900">
                  {totalJornadas} jornadas
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7A3EBE] text-white font-black text-xs group-hover:bg-[#5C23A3] transition-colors">
                  <span>Planificar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* TARJETA 2: CALENDARIO ANUAL (AZUL VIBRANTE) */}
            <div
              onClick={() => onSeleccionarModulo("calendario")}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-white border-4 border-[#1368CE] hover:border-[#0E4E9B] p-5 shadow-warm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1368CE] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1368CE] text-[10px] font-black uppercase tracking-wider">
                    12 Meses
                  </span>
                </div>
                <h3 className="text-lg font-black text-topo-dark group-hover:text-[#1368CE] transition-colors">
                  Calendario Anual
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Vista mensual con festivos oficiales de Colombia y fechas de clase.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-50 flex items-center justify-between">
                <span className="text-[11px] font-black text-blue-900">
                  Todo el año
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1368CE] text-white font-black text-xs group-hover:bg-[#0E4E9B] transition-colors">
                  <span>Ver</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* TARJETA 3: CRONOGRAMA DE TAREAS (ROJO/TERRACOTA) */}
            <div
              onClick={() => onSeleccionarModulo("cronograma")}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-white border-4 border-[#D83A56] hover:border-[#B5253F] p-5 shadow-warm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#D83A56] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <ListTodo className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-[#B5253F] text-[10px] font-black uppercase tracking-wider">
                    {totalHitos} Hitos
                  </span>
                </div>
                <h3 className="text-lg font-black text-topo-dark group-hover:text-[#D83A56] transition-colors">
                  Tareas y Compromisos
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Listado claro de responsabilidades institucionales y encargados.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between">
                <span className="text-[11px] font-black text-rose-950">
                  {hitosCompletados}/{totalHitos} hechas
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D83A56] text-white font-black text-xs group-hover:bg-[#B5253F] transition-colors">
                  <span>Listado</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* TARJETA 4: HOJA DE CÁLCULO TIPO EXCEL (VISTA EN VIVO AUTÓNOMA) */}
            <div
              onClick={() => onSeleccionarModulo("hoja_calculo")}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-white border-4 border-emerald-500 hover:border-emerald-600 p-5 shadow-warm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    En Vivo
                  </span>
                </div>
                <h3 className="text-lg font-black text-topo-dark group-hover:text-emerald-700 transition-colors">
                  Hoja de Cálculo Excel
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Matriz horizontal completa en cuadrícula interactiva tipo hoja de cálculo.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-950">
                  {totalJornadas} fechas
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs group-hover:bg-emerald-600 transition-colors">
                  <span>Abrir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GRUPO B: ESTRUCTURA MAESTRA Y GESTIÓN INSTITUCIONAL */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xl font-black text-topo-dark flex items-center gap-2">
              <span>⚙️ Configuración y Estructura Maestra</span>
            </h2>
            <span className="text-xs text-stone-500 font-semibold">
              Ciclos del año, períodos temporales, exámenes y equipo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TARJETA 5: ASISTENTE DE PROGRAMACIÓN / NUEVO CALENDARIO (REEMPLAZA BOTÓN ESTRUCTURA) */}
            <div
              onClick={() => onAbrirAsistenteCalendario ? onAbrirAsistenteCalendario() : onSeleccionarModulo("estructura")}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-gradient-to-r from-[#1B365D] via-[#244673] to-[#0F233D] text-white border-4 border-amber-400 hover:border-amber-300 p-6 shadow-warm hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-black shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-8 h-8 text-amber-300" />
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-amber-400 text-[#1B365D] text-xs font-black uppercase tracking-wider">
                    Asistente Coordinación
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  Programar / Nuevo Calendario
                </h3>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                  Asistente paso a paso para abrir un nuevo ciclo (2027 o semestral), calcular sábados lectivos y programar hitos institucionales.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200">
                  Asistente Oficial • Nuevos Ciclos
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-[#1B365D] font-black text-xs group-hover:bg-amber-300 transition-colors shadow-sm">
                  <span>Abrir Asistente</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>

            {/* TARJETA 6: DIRECTORIO Y SEGUIMIENTO DE TALLERISTAS */}
            <div
              onClick={() => onSeleccionarModulo("talleristas")}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-gradient-to-r from-[#2B4C7E] via-[#355B94] to-[#1E3557] text-white border-4 border-emerald-400 hover:border-emerald-300 p-6 shadow-warm hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-400 text-[#1E3557] flex items-center justify-center font-black shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-400 text-[#1E3557] text-xs font-black uppercase tracking-wider">
                    {estado.talleristas.length} Talleristas
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  Directorio de Talleristas
                </h3>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                  Monitorea clases asignadas, días en escuela, compromisos y <strong>datos personales</strong>
                  (teléfono, WhatsApp, correo) con filtro de activos vs antiguos.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-200">
                  Cargas • Teléfonos • Activos
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 text-[#1E3557] font-black text-xs group-hover:bg-emerald-300 transition-colors shadow-sm">
                  <span>Directorio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>

            {/* TARJETA 7: ESTUDIANTES, ASISTENCIA Y PERMANENCIA */}
            <div
              onClick={() => onSeleccionarModulo("estudiantes" as any)}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-gradient-to-r from-[#0F3854] via-[#15527A] to-[#0A2639] text-white border-4 border-blue-400 hover:border-blue-300 p-6 shadow-warm hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-400 text-[#0F3854] flex items-center justify-center font-black shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                    🎒
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-blue-400 text-[#0F3854] text-xs font-black uppercase tracking-wider">
                    {(estado.estudiantes || []).length} Alumnos
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                  Estudiantes y Permanencia
                </h3>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                  Registro de asistencia por clases (0 a 4 bloques), control de <strong>lista de espera</strong>,
                  tasa de deserción y resultados Saber 11 vinculados al calendario.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-200">
                  Asistencia • Espera • Deserción
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-400 text-[#0F3854] font-black text-xs group-hover:bg-blue-300 transition-colors shadow-sm">
                  <span>Estudiantes</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GRUPO C: MEMORIA Y PERÍODOS ANTERIORES (ARCHIVADOR HISTÓRICO) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xl font-black text-topo-dark flex items-center gap-2">
              <Archive className="w-5 h-5 text-stone-600" />
              <span>📚 Períodos y Ciclos Anteriores (Histórico)</span>
            </h2>
            <span className="text-xs text-stone-500 font-semibold">
              Consulta balances, asistencia, estudiantes y talleristas de años pasados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* TARJETA ACCESO AL ARCHIVO GENERAL */}
            <div
              onClick={() => onSeleccionarModulo("ciclos_archivo" as any)}
              role="button"
              tabIndex={0}
              className="group relative rounded-3xl bg-stone-900 hover:bg-stone-950 text-white border-4 border-stone-700 hover:border-amber-400 p-6 shadow-warm hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <Archive className="w-6 h-6" />
                </div>
                <span className="px-3 py-0.5 rounded-full bg-stone-800 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-stone-700">
                  Archivo & Memoria
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  Archivo de Ciclos y Memoria
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Consulta balances, memorias de 2026, reactiva períodos anteriores o gestiona los calendarios lectivos de la Escuela Popular El Topo.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-200">
                  Ciclos Finalizados y Activos
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-black text-xs group-hover:bg-amber-300 transition-colors shadow-sm">
                  <span>Abrir Archivo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
