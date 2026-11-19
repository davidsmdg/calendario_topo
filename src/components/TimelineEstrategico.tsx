"use client";

import React, { useMemo } from "react";
import {
  BloquePeriodoCalendario,
  FechaClaveExamen,
  ModalidadCiclo,
} from "@/types";
import { ddmmyyyyToISO, ESTILOS_BLOQUES_PERIODO, ESTILOS_EXAMENES_CLAVE } from "@/utils/festivosColombia";

interface TimelineEstrategicoProps {
  modalidadCiclo: ModalidadCiclo;
  nombreCiclo1?: string;
  nombreCiclo2?: string;
  periodos: BloquePeriodoCalendario[];
  examenes: FechaClaveExamen[];
  titulo?: string;
  subtitulo?: string;
  compacto?: boolean;
}

export function TimelineEstrategico({
  modalidadCiclo,
  nombreCiclo1 = "Ciclo I - 2027",
  nombreCiclo2 = "Ciclo II - 2027",
  periodos = [],
  examenes = [],
  titulo = "🗺️ Esquema Estratégico del Año (Línea de Tiempo 2027)",
  subtitulo = "Visualización cronológica interactiva de ciclos, bloques de clases, vacaciones y exámenes",
  compacto = false,
}: TimelineEstrategicoProps) {
  // Ordenar períodos cronológicamente
  const periodosOrdenados = useMemo(() => {
    return [...periodos].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  }, [periodos]);

  // Rango general de tiempo (Enero a Diciembre de 2027)
  const fechaMin = "2027-01-16";
  const fechaMax = "2027-11-30";
  const msMin = new Date(fechaMin).getTime();
  const msMax = new Date(fechaMax).getTime();
  const duracionTotalMs = Math.max(msMax - msMin, 1);

  // Calcular porcentaje en el eje X (0% a 100%)
  const calcularPosicionPorcentaje = (fechaISO: string) => {
    if (!fechaISO) return 0;
    const ms = new Date(fechaISO).getTime();
    const pct = ((ms - msMin) / duracionTotalMs) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // Posición de HOY
  const hoyISO = new Date().toISOString().split("T")[0];
  const pctHoy = calcularPosicionPorcentaje(hoyISO);
  const hoyEnRango = pctHoy > 0 && pctHoy < 100;

  // Corte de ciclos (1 de julio de 2027)
  const pctCorteCiclo = calcularPosicionPorcentaje("2027-07-01");

  return (
    <div className={`rounded-3xl border-2 border-[#E2DCCE] bg-white shadow-warm overflow-hidden ${compacto ? "p-4 space-y-3" : "p-6 space-y-5"}`}>
      {/* CABECERA DEL TIMELINE */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <h3 className={`font-black text-topo-dark flex items-center gap-2 ${compacto ? "text-sm" : "text-base"}`}>
            <span>{titulo}</span>
          </h3>
          {subtitulo && <p className="text-xs text-stone-500 mt-0.5">{subtitulo}</p>}
        </div>

        {/* LEYENDA RÁPIDA DE COLORES */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Clases
          </span>
          <span className="flex items-center gap-1 text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Vacaciones
          </span>
          <span className="flex items-center gap-1 text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            Coordinación
          </span>
          <span className="flex items-center gap-1 text-teal-900 bg-teal-100 px-2.5 py-0.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
            Salida Pedagógica
          </span>
          <span className="flex items-center gap-1 text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            Examen / Meta
          </span>
        </div>
      </div>

      {/* CONTENEDOR GRÁFICO DEL TIMELINE */}
      <div className="space-y-3 pt-1">
        {/* NIVEL 1: CICLOS (Biciclo Semestral o Ciclo Continuo) */}
        <div className="relative w-full h-8 rounded-2xl bg-stone-100 border border-stone-300 flex overflow-visible shadow-inner text-xs font-black select-none">
          {modalidadCiclo === "dos_ciclos" ? (
            <>
              <div
                className="group relative h-full bg-gradient-to-r from-blue-700 to-indigo-600 text-white flex items-center justify-center px-3 truncate transition-all duration-300 border-r-2 border-white shadow-xs cursor-pointer hover:brightness-110"
                style={{ width: `${pctCorteCiclo}%` }}
              >
                <span className="truncate">🌱 {nombreCiclo1}</span>

                {/* Tooltip detallado Ciclo 1 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-xs p-3 rounded-2xl whitespace-nowrap shadow-2xl z-50 border-2 border-blue-400 pointer-events-none animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-black text-blue-300 mb-1">
                    <span>🌱 {nombreCiclo1}</span>
                    <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-bold">SEMESTRE 1</span>
                  </div>
                  <div className="text-[11px] text-slate-200 space-y-0.5 text-center">
                    <p>📅 Enero a Junio 2027</p>
                    <p className="text-amber-300 font-bold">🎯 Meta Principal: Examen UNAL 2027-2</p>
                    <p className="text-stone-300 text-[10px]">Cohorte de estudiantes del primer semestre</p>
                  </div>
                </div>
              </div>

              <div
                className="group relative h-full bg-gradient-to-r from-amber-600 to-rose-600 text-white flex items-center justify-center px-3 truncate transition-all duration-300 shadow-xs cursor-pointer hover:brightness-110"
                style={{ width: `${100 - pctCorteCiclo}%` }}
              >
                <span className="truncate">🍂 {nombreCiclo2}</span>

                {/* Tooltip detallado Ciclo 2 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-xs p-3 rounded-2xl whitespace-nowrap shadow-2xl z-50 border-2 border-amber-400 pointer-events-none animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-black text-amber-300 mb-1">
                    <span>🍂 {nombreCiclo2}</span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full font-bold">SEMESTRE 2</span>
                  </div>
                  <div className="text-[11px] text-slate-200 space-y-0.5 text-center">
                    <p>📅 Julio a Noviembre 2027</p>
                    <p className="text-emerald-300 font-bold">🎯 Meta Principal: Saber 11 / UNAL 2028-1</p>
                    <p className="text-stone-300 text-[10px]">Segunda cohorte de estudiantes independientes</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="group relative w-full h-full bg-gradient-to-r from-[#1B365D] via-[#2A4D7D] to-topo-green text-white flex items-center justify-center px-4 shadow-xs cursor-pointer hover:brightness-110"
            >
              <span>🌟 Ciclo Único Anual Continuo (Febrero a Noviembre 2027)</span>

              {/* Tooltip detallado Ciclo Único */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-xs p-3 rounded-2xl whitespace-nowrap shadow-2xl z-50 border-2 border-emerald-400 pointer-events-none animate-fadeIn">
                <div className="flex items-center gap-1.5 font-black text-emerald-300 mb-1">
                  <span>🌟 Ciclo Único Anual Continuo</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">ANUAL</span>
                </div>
                <div className="text-[11px] text-slate-200 space-y-0.5 text-center">
                  <p>📅 Enero 16 a Noviembre 30 de 2027</p>
                  <p className="text-amber-300 font-bold">📚 Proceso formativo largo y consolidado</p>
                  <p className="text-stone-300 text-[10px]">Numeración corrida de jornadas y cohorte única continua</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NIVEL 2: CONTENEDOR DEL AÑO CON BLOQUES Y LÍNEAS / HITOS MORADOS SUPERPUESTOS */}
        <div className="relative w-full rounded-2xl bg-stone-50 border-2 border-stone-300 p-2 shadow-inner select-none">
          {/* Fila de Bloques Temporales (Gantt exacto según porcentaje en el año) */}
          <div className="relative w-full h-16 sm:h-20 bg-stone-100 rounded-xl overflow-visible border border-stone-200">
            {periodosOrdenados.map((p) => {
              const pctIni = calcularPosicionPorcentaje(p.fechaInicio);
              const pctFin = calcularPosicionPorcentaje(p.fechaFin);
              const anchoPct = Math.max(pctFin - pctIni, 1.5);

              const esVac = p.tipo === "vacaciones";
              const esCoord = p.tipo === "coordinacion";
              const esSalida = p.tipo === "salida";

              // Calcular duración en días
              const ms1 = new Date(p.fechaInicio).getTime();
              const ms2 = new Date(p.fechaFin).getTime();
              const diasDuracion = Math.max(1, Math.round((ms2 - ms1) / (1000 * 60 * 60 * 24)) + 1);

              return (
                <div
                  key={p.id}
                  style={{ left: `${pctIni}%`, width: `${anchoPct}%` }}
                  className={`absolute top-0 bottom-0 p-1.5 flex flex-col justify-between border-r border-white/50 transition-all hover:brightness-95 group cursor-pointer ${
                    esVac
                      ? "bg-amber-300/85 text-amber-950 hover:bg-amber-400"
                      : esCoord
                      ? "bg-indigo-300/85 text-indigo-950 hover:bg-indigo-400"
                      : esSalida
                      ? "bg-teal-400/90 text-teal-950 hover:bg-teal-500"
                      : "bg-emerald-400/85 text-emerald-950 hover:bg-emerald-500"
                  }`}
                >
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-[10px] font-black uppercase truncate leading-tight">
                      {esVac ? "🏖️" : esCoord ? "👥" : esSalida ? "🚌" : "📚"} {p.nombre}
                    </span>
                  </div>

                  <div className="text-[9px] font-mono font-bold opacity-90 truncate leading-none">
                    {p.fechaInicio.slice(5)} al {p.fechaFin.slice(5)}
                  </div>

                  {/* TOOLTIP FLOTANTE ULTRA DETALLADO AL PASAR EL MOUSE */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-xs p-3 rounded-2xl whitespace-nowrap shadow-2xl z-40 border-2 border-amber-300 pointer-events-none animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{esVac ? "🏖️" : esCoord ? "👥" : esSalida ? "🚌" : "📚"}</span>
                      <span className="font-black text-amber-300">{p.nombre}</span>
                      <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        {p.tipo.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-200 font-medium space-y-0.5 text-center">
                      <p>
                        📅 Desde: <strong className="text-white">{p.fechaInicio}</strong> hasta <strong className="text-white">{p.fechaFin}</strong>
                      </p>
                      <p className="text-emerald-300 font-bold">
                        ⏳ Duración: {diasDuracion} días ({Math.round(diasDuracion / 7)} semanas aprox.)
                      </p>
                      {p.descripcion && (
                        <p className="text-stone-300 italic pt-1 border-t border-white/20 max-w-xs whitespace-normal">
                          {p.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* LÍNEAS VERTICALES MORADAS O TEAL EXACTAS PARA CADA HITO / EXAMEN / SALIDA */}
            {examenes.map((ex) => {
              const iso = ddmmyyyyToISO(ex.fecha) || ex.fecha;
              const posPct = calcularPosicionPorcentaje(iso);
              const esSalida = ex.tipo === "salida";

              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              let diasFaltantes = 0;
              if (iso) {
                const [y, m, d] = iso.split("-").map(Number);
                const target = new Date(y, m - 1, d);
                diasFaltantes = Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
              }

              return (
                <div
                  key={`pin-line-${ex.id}`}
                  style={{ left: `${posPct}%` }}
                  className="absolute top-0 bottom-0 z-20 flex flex-col items-center -translate-x-1/2 pointer-events-auto group cursor-pointer"
                >
                  {/* Etiqueta flotante con el icono */}
                  <div className={`w-5 h-5 rounded-full ${esSalida ? "bg-teal-700" : "bg-purple-700"} text-white flex items-center justify-center text-[10px] shadow-md border-2 border-white -mt-1 group-hover:scale-125 transition-transform`}>
                    {esSalida ? "🚌" : "🎓"}
                  </div>
                  {/* Línea gruesa vertical atravesando el bloque */}
                  <div className={`w-1.5 flex-1 ${esSalida ? "bg-teal-600" : "bg-purple-700"} shadow-sm`} />
                  {/* Mini-marcador inferior */}
                  <div className={`w-3 h-1.5 ${esSalida ? "bg-teal-800" : "bg-purple-800"} rounded-full mb-0.5`} />

                  {/* Tooltip detallado sobre la línea */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex flex-col items-center ${esSalida ? "bg-teal-950 border-teal-400" : "bg-purple-950 border-purple-400"} text-white text-xs p-3 rounded-2xl whitespace-nowrap shadow-2xl z-50 border-2 pointer-events-none animate-fadeIn`}>
                    <div className="flex items-center gap-1.5 font-black text-amber-300 mb-1">
                      <span>{esSalida ? "🚌" : "🎓"} {ex.titulo}</span>
                      <span className={`text-[10px] ${esSalida ? "bg-teal-800 text-teal-200" : "bg-purple-800 text-purple-200"} px-2 py-0.5 rounded-full font-bold uppercase`}>{ex.tipo}</span>
                    </div>
                    <div className={`text-[11px] ${esSalida ? "text-teal-100" : "text-purple-100"} space-y-0.5 text-center`}>
                      <p>📅 Fecha: <strong className="text-white">{ex.fecha}</strong></p>
                      <p className={`font-bold ${diasFaltantes < 0 ? "text-stone-400" : diasFaltantes <= 60 ? "text-rose-400 animate-pulse" : "text-amber-300"}`}>
                        ⏳ {diasFaltantes < 0 ? "Actividad ya realizada" : diasFaltantes === 0 ? "¡Es HOY!" : `Faltan ${diasFaltantes} días (${Math.round(diasFaltantes / 7)} semanas)`}
                      </p>
                      {ex.descripcion && (
                        <p className={`italic text-[10px] pt-1 border-t ${esSalida ? "border-teal-800/60 text-teal-200" : "border-purple-800/60 text-purple-200"} max-w-xs whitespace-normal`}>
                          {ex.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* MARCADOR DE HOY (LÍNEA ROJA PULSANTE) */}
            {hoyEnRango && (
              <div
                style={{ left: `${pctHoy}%` }}
                className="absolute top-0 bottom-0 z-30 flex flex-col items-center -translate-x-1/2 pointer-events-auto group cursor-pointer"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow animate-pulse -mt-0.5" />
                <div className="w-1 flex-1 bg-rose-600 shadow-sm" />
                <div className="w-3 h-1 bg-rose-700 rounded-full mb-0.5" />

                {/* Tooltip de HOY */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex flex-col items-center bg-rose-950 text-white text-xs p-2.5 rounded-2xl whitespace-nowrap shadow-2xl z-50 border-2 border-rose-400 pointer-events-none animate-fadeIn">
                  <span className="font-black text-rose-300">📍 Fecha de Hoy en el Calendario</span>
                  <span className="text-white font-mono font-bold">{hoyISO}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NIVEL 3: HITOS DETERMINANTES / EXÁMENES Y SALIDAS (PINES CON CUENTA REGRESIVA Y TOOLTIP DETALLADO) */}
        <div className="relative w-full pt-1">
          <div className="text-[11px] font-black uppercase text-purple-900 flex items-center gap-1.5 mb-2">
            <span>🎓 Hitos, Exámenes Determinantes y Salidas Pedagógicas:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {examenes.map((e) => {
              const iso = ddmmyyyyToISO(e.fecha) || e.fecha;
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              let diasFaltantes = 0;
              if (iso) {
                const [y, m, d] = iso.split("-").map(Number);
                const target = new Date(y, m - 1, d);
                diasFaltantes = Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
              }

              const yaPaso = diasFaltantes < 0;
              const esHoy = diasFaltantes === 0;
              const esSalida = e.tipo === "salida";

              return (
                <div
                  key={e.id}
                  className={`group relative p-2.5 rounded-2xl ${
                    esSalida
                      ? "bg-teal-50 border-2 border-teal-300 text-teal-950 hover:bg-teal-100 hover:border-teal-400"
                      : "bg-purple-50 border-2 border-purple-300 text-purple-950 hover:bg-purple-100 hover:border-purple-400"
                  } flex items-center justify-between gap-2 shadow-xs cursor-pointer transition-colors`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{esSalida ? "🚌" : "🎓"} {e.titulo}</p>
                    <span className={`text-[10px] ${esSalida ? "text-teal-800" : "text-purple-800"} font-bold block`}>
                      {e.fecha}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    esHoy
                      ? "bg-amber-400 text-topo-dark animate-pulse"
                      : yaPaso
                      ? "bg-stone-200 text-stone-600"
                      : diasFaltantes <= 60
                      ? "bg-rose-500 text-white animate-pulse"
                      : esSalida
                      ? "bg-teal-700 text-white"
                      : "bg-purple-700 text-white"
                  }`}>
                    {esHoy ? "¡Hoy!" : yaPaso ? "Listo" : `${diasFaltantes}d`}
                  </span>

                  {/* Tooltip detallado al pasar el mouse por cada tarjeta de hito */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-xs p-3 rounded-2xl whitespace-nowrap shadow-2xl z-50 border-2 ${
                    esSalida ? "border-teal-400" : "border-purple-400"
                  } pointer-events-none animate-fadeIn`}>
                    <div className={`flex items-center gap-1.5 font-black ${esSalida ? "text-teal-300" : "text-purple-300"} mb-1`}>
                      <span>{esSalida ? "🚌" : "🎓"} {e.titulo}</span>
                      <span className={`text-[10px] ${esSalida ? "bg-teal-600/40 text-teal-200" : "bg-purple-600/40 text-purple-200"} px-2 py-0.5 rounded-full uppercase font-bold`}>{e.tipo}</span>
                    </div>
                    <div className="text-[11px] text-slate-200 space-y-0.5 text-center">
                      <p>📅 Fecha: <strong className="text-white">{e.fecha}</strong></p>
                      <p className={`font-bold ${yaPaso ? "text-stone-400" : diasFaltantes <= 60 ? "text-rose-400 animate-pulse" : "text-amber-300"}`}>
                        ⏳ {yaPaso ? "Actividad superada" : esHoy ? "¡Es HOY!" : `Faltan exactamente ${diasFaltantes} días (${Math.round(diasFaltantes / 7)} semanas)`}
                      </p>
                      {e.descripcion && (
                        <p className="text-stone-300 italic text-[10px] pt-1 border-t border-white/20 max-w-xs whitespace-normal">
                          {e.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INDICADOR VISUAL DE "HOY" SI ESTÁ EN RANGO */}
        {hoyEnRango && (
          <div className="flex items-center gap-2 pt-1 text-xs font-bold text-stone-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <span>Fecha actual del sistema: <strong>{hoyISO}</strong> (Ubicada en el calendario escolar).</span>
          </div>
        )}
      </div>
    </div>
  );
}
