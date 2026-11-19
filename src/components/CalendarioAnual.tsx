"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Maximize2,
  Minimize2,
  Plus,
  Flag,
  BookOpen,
  Sparkles,
  X,
  GripVertical,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { EventoCronograma, JornadaPedagogica, EstructuraCalendarioConfig } from "@/types";
import {
  FESTIVOS_COLOMBIA_2027,
  MESES_NOMBRES,
  DIAS_SEMANA_CORTOS,
  obtenerFestivoPorFechaISO,
  ddmmyyyyToISO,
  isoToDDMMYYYY,
  isoToFechaComunitaria,
  ESTILOS_BLOQUES_PERIODO,
  ESTILOS_EXAMENES_CLAVE,
} from "@/utils/festivosColombia";
import { FlorMuralSVG, AbejitaMuralSVG } from "./TopoAvatar";

interface CalendarioAnualProps {
  hitos: EventoCronograma[];
  jornadas: JornadaPedagogica[];
  estructura?: EstructuraCalendarioConfig;
  onActualizarHito: (hito: EventoCronograma) => void;
  onCrearHito: (nuevo: Partial<EventoCronograma>) => void;
  onActualizarJornada: (jornada: JornadaPedagogica) => void;
  onCrearJornadaEnFecha: (fechaComunitaria: string) => void;
  onIrAJornada?: (jornadaId: string) => void;
}

export function CalendarioAnual({
  hitos,
  jornadas,
  estructura,
  onActualizarHito,
  onCrearHito,
  onActualizarJornada,
  onCrearJornadaEnFecha,
  onIrAJornada,
}: CalendarioAnualProps) {
  const [modoVista, setModoVista] = useState<"anual" | "mensual">("anual");
  const [mesExpandido, setMesExpandido] = useState<number>(0); // 0 = Enero
  const [fechaSeleccionadaISO, setFechaSeleccionadaISO] = useState<string | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [nuevoEventoTitulo, setNuevoEventoTitulo] = useState("");
  const [nuevoEventoCompromiso, setNuevoEventoCompromiso] = useState("");
  const [nuevoEventoEncargados, setNuevoEventoEncargados] = useState("");
  const [hitoArrastradoId, setHitoArrastradoId] = useState<string | null>(null);
  const [mostrarPanelSinFecha, setMostrarPanelSinFecha] = useState<boolean>(true);

  // Mapear período temporal por fecha ISO
  const obtenerPeriodoFecha = (iso: string) => {
    if (!estructura?.periodosTemporales) return null;
    return estructura.periodosTemporales.find(
      (p) => iso >= p.fechaInicio && iso <= p.fechaFin
    );
  };

  // Mapear examen clave por fecha ISO
  const obtenerExamenFecha = (iso: string) => {
    if (!estructura?.fechasClaveExamenes) return null;
    return estructura.fechasClaveExamenes.find((e) => {
      const eIso = ddmmyyyyToISO(e.fecha);
      return eIso === iso;
    });
  };

  const hitosPorISO = useMemo(() => {
    const map: Record<string, EventoCronograma[]> = {};
    hitos.forEach((h) => {
      const iso = ddmmyyyyToISO(h.fecha);
      if (iso) {
        if (!map[iso]) map[iso] = [];
        map[iso].push(h);
      }
    });
    return map;
  }, [hitos]);

  const jornadasPorISO = useMemo(() => {
    const map: Record<string, JornadaPedagogica[]> = {};
    jornadas.forEach((j) => {
      const iso = ddmmyyyyToISO(j.fecha);
      if (iso) {
        if (!map[iso]) map[iso] = [];
        map[iso].push(j);
      }
    });
    return map;
  }, [jornadas]);

  const hitosSinFechaExacta = useMemo(() => {
    return hitos.filter((h) => !ddmmyyyyToISO(h.fecha));
  }, [hitos]);

  const generarDiasMes2027 = (mesIdx: number) => {
    const primerDia = new Date(2027, mesIdx, 1);
    const ultimoDia = new Date(2027, mesIdx + 1, 0);
    const totalDias = ultimoDia.getDate();
    const offsetLunes = (primerDia.getDay() + 6) % 7;

    const celdas: Array<{ dia: number | null; iso: string | null; diaSemana: number }> = [];
    for (let i = 0; i < offsetLunes; i++) {
      celdas.push({ dia: null, iso: null, diaSemana: i });
    }
    for (let d = 1; d <= totalDias; d++) {
      const diaSemana = (offsetLunes + d - 1) % 7;
      const iso = `2027-${String(mesIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      celdas.push({ dia: d, iso, diaSemana });
    }
    return celdas;
  };

  const manejarDropEnFecha = (iso: string) => {
    if (!hitoArrastradoId) return;
    const hito = hitos.find((h) => h.id === hitoArrastradoId);
    if (hito) {
      onActualizarHito({
        ...hito,
        fecha: isoToDDMMYYYY(iso),
      });
    }
    setHitoArrastradoId(null);
  };

  const renderMesCard = (mesIdx: number, expandido: boolean) => {
    const celdas = generarDiasMes2027(mesIdx);
    const festivosDelMes = FESTIVOS_COLOMBIA_2027.filter((f) =>
      f.fecha.startsWith(`2027-${String(mesIdx + 1).padStart(2, "0")}`)
    );

    return (
      <div
        key={mesIdx}
        className={`rounded-3xl bg-white border-2 border-[#E2DCCE] shadow-warm flex flex-col overflow-hidden transition ${
          expandido ? "p-5" : "p-3.5"
        }`}
      >
        {/* Cabecera del Mes */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#E2DCCE]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-xl bg-topo-mustard text-topo-dark text-xs font-black">
              {mesIdx + 1}
            </span>
            <h3 className={`font-black text-topo-dark ${expandido ? "text-xl" : "text-base"}`}>
              {MESES_NOMBRES[mesIdx]} <span className="text-stone-400 font-bold">2027</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (modoVista === "anual") {
                setMesExpandido(mesIdx);
                setModoVista("mensual");
              } else {
                setModoVista("anual");
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-stone-600 hover:text-topo-dark hover:bg-[#F6F2E9] transition"
            title={expandido ? "Volver a vista anual" : "Expandir este mes"}
          >
            {expandido ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Vista Anual
              </>
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-1 text-center">
          {DIAS_SEMANA_CORTOS.map((diaNom, i) => {
            const esFinDeSemana = i >= 5;
            return (
              <div
                key={diaNom}
                className={`text-[11px] font-extrabold py-1 rounded-lg ${
                  esFinDeSemana
                    ? "bg-amber-100/90 text-amber-950"
                    : "text-stone-500"
                }`}
              >
                {diaNom}
              </div>
            );
          })}
        </div>

        {/* Cuadrícula de días */}
        <div className={`grid grid-cols-7 ${expandido ? "gap-2" : "gap-1"} flex-1`}>
          {celdas.map((celda, idx) => {
            if (!celda.dia || !celda.iso) {
              return <div key={`empty-${idx}`} className="rounded-lg bg-transparent" />;
            }

            const festivo = obtenerFestivoPorFechaISO(celda.iso);
            const hitosDia = hitosPorISO[celda.iso] || [];
            const jornadasDia = jornadasPorISO[celda.iso] || [];
            const esFinDeSemana = celda.diaSemana >= 5;
            const tieneActividad = hitosDia.length > 0 || jornadasDia.length > 0;
            const periodo = celda.iso ? obtenerPeriodoFecha(celda.iso) : null;
            const examen = celda.iso ? obtenerExamenFecha(celda.iso) : null;
            const estiloPeriodo = periodo ? ESTILOS_BLOQUES_PERIODO[periodo.tipo] : null;
            const estiloExamen = examen ? ESTILOS_EXAMENES_CLAVE[examen.tipo] : null;

            // Determinar estilo dinámico de fondo y borde según Bloque y Examen
            let claseFondoBorde = "bg-white border-stone-200/80 hover:border-topo-green";
            if (examen) {
              claseFondoBorde = `bg-purple-100/90 border-purple-500 ring-2 ring-purple-400 hover:ring-purple-600 shadow-md`;
            } else if (festivo) {
              claseFondoBorde = "bg-orange-50/90 border-topo-terracotta/50 hover:border-topo-terracotta";
            } else if (estiloPeriodo) {
              claseFondoBorde = `${estiloPeriodo.bgLight} ${estiloPeriodo.border} hover:brightness-95`;
            } else if (esFinDeSemana) {
              claseFondoBorde = "bg-amber-50/75 border-amber-200/90 hover:border-topo-mustard";
            }

            return (
              <div
                key={celda.iso}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => manejarDropEnFecha(celda.iso!)}
                onClick={() => setFechaSeleccionadaISO(celda.iso)}
                className={`group relative rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  expandido ? "min-h-[105px] p-2" : "min-h-[46px] p-1"
                } ${claseFondoBorde} ${
                  tieneActividad && !examen ? "ring-2 ring-topo-green/40 shadow-sm" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-black leading-none ${
                      examen
                        ? "text-purple-950 underline decoration-purple-600 decoration-2"
                        : festivo
                        ? "text-topo-terracotta"
                        : estiloPeriodo
                        ? estiloPeriodo.text
                        : esFinDeSemana
                        ? "text-amber-950"
                        : "text-stone-700"
                    }`}
                  >
                    {celda.dia}
                  </span>

                  <div className="flex items-center gap-0.5">
                    {examen && (
                      <span
                        className="px-1 py-0.2 rounded bg-purple-700 text-white text-[9px] font-black leading-tight animate-pulse"
                        title={`★ EXAMEN CLAVE: ${examen.titulo}`}
                      >
                        🎓
                      </span>
                    )}
                    {periodo && !examen && (
                      <span
                        className="text-[10px]"
                        title={`Bloque: ${periodo.nombre} (${periodo.tipo})`}
                      >
                        {estiloPeriodo?.icon || "📌"}
                      </span>
                    )}
                    {festivo && (
                      <span
                        className="w-2 h-2 rounded-full bg-topo-terracotta"
                        title={`Festivo: ${festivo.nombre}`}
                      />
                    )}
                    {jornadasDia.length > 0 && (
                      <span
                        className="px-1 py-0.2 rounded bg-matrix-header text-white text-[9px] font-extrabold leading-tight"
                        title={`Clase / Jornada ${jornadasDia.map((j) => j.numeroJornada).join(", ")}`}
                      >
                        J{jornadasDia[0].numeroJornada}
                      </span>
                    )}
                    {hitosDia.length > 0 && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-topo-green"
                        title={`${hitosDia.length} tarea(s) 2027`}
                      />
                    )}
                  </div>
                </div>

                {expandido ? (
                  <div className="mt-1.5 space-y-1 overflow-hidden">
                    {examen && (
                      <div className="text-[10px] font-black text-white bg-purple-700 px-1.5 py-0.5 rounded truncate shadow-xs">
                        🎓 {examen.titulo}
                      </div>
                    )}
                    {periodo && !examen && (
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${estiloPeriodo?.badgeBg || "bg-stone-200"}`}>
                        {estiloPeriodo?.icon} {periodo.nombre}
                      </div>
                    )}
                    {festivo && (
                      <div className="text-[10px] font-bold text-topo-terracotta bg-orange-100/90 px-1.5 py-0.5 rounded truncate">
                        🇨🇴 {festivo.nombre}
                      </div>
                    )}
                    {jornadasDia.map((j) => (
                      <div
                        key={j.id}
                        className="text-[10px] font-bold text-white bg-matrix-header px-1.5 py-0.5 rounded truncate"
                      >
                        📚 Jornada {j.numeroJornada}
                      </div>
                    ))}
                    {hitosDia.map((h) => (
                      <div
                        key={h.id}
                        className="text-[10px] font-bold text-emerald-950 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded truncate"
                      >
                        ★ {h.evento}
                      </div>
                    ))}
                  </div>
                ) : (
                  (examen || periodo || hitosDia.length > 0 || jornadasDia.length > 0 || festivo) && (
                    <div className="mt-0.5 truncate text-[9px] leading-tight font-extrabold">
                      {examen ? (
                        <span className="text-purple-900 bg-purple-200/80 px-1 py-0.2 rounded font-black">
                          🎓 {examen.titulo}
                        </span>
                      ) : jornadasDia[0] ? (
                        <span className="text-stone-700">Jornada {jornadasDia[0].numeroJornada}</span>
                      ) : periodo ? (
                        <span className={`${estiloPeriodo?.text || "text-stone-700"}`}>
                          {estiloPeriodo?.icon} {periodo.nombre}
                        </span>
                      ) : (
                        <span className="text-stone-700">{hitosDia[0]?.evento || festivo?.nombre}</span>
                      )}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Pie de festivos del mes */}
        {festivosDelMes.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
            {festivosDelMes.map((f) => (
              <span
                key={f.fecha}
                onClick={() => setFechaSeleccionadaISO(f.fecha)}
                className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-topo-terracotta border border-orange-200 hover:bg-orange-100"
              >
                <Flag className="w-2.5 h-2.5" />
                {f.fecha.slice(-2)}: {f.nombre}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const festivoModal = fechaSeleccionadaISO
    ? obtenerFestivoPorFechaISO(fechaSeleccionadaISO)
    : undefined;
  const hitosModal = fechaSeleccionadaISO ? hitosPorISO[fechaSeleccionadaISO] || [] : [];
  const jornadasModal = fechaSeleccionadaISO ? jornadasPorISO[fechaSeleccionadaISO] || [] : [];

  return (
    <div className="space-y-5">
      {/* Barra de controles superior del Calendario */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-3xl border-2 border-[#E2DCCE] shadow-warm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-300 text-topo-dark">
            <CalendarIcon className="w-6 h-6 text-topo-terracotta" />
          </div>
          <div>
            <h2 className="text-lg font-black text-topo-dark">
              Calendario Escolar 2027 • Tareas y Programación de Clases
            </h2>
            <p className="text-xs text-stone-600">
              Ya tiene cargadas únicamente las tareas oficiales 2027 •{" "}
              <strong>Haz clic en cualquier día para programar una Jornada de Clases desde 0</strong>.
            </p>
          </div>
        </div>

        {/* Leyenda y Switch de Vista */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden xl:flex items-center gap-2.5 text-xs font-bold text-stone-600 mr-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-900 text-[11px]">
              📚 Clases
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-400 text-amber-900 text-[11px]">
              🏖️ Vacaciones / Receso
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-100 border border-indigo-400 text-indigo-900 text-[11px]">
              👥 Coordinación
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 border border-purple-500 text-purple-900 text-[11px]">
              🎓 Examen UNAL / ICFES
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100 border border-topo-terracotta/50 text-topo-terracotta text-[11px]">
              🇨🇴 Festivo
            </span>
          </div>

          <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1 border border-[#E2DCCE]">
            <button
              type="button"
              onClick={() => setModoVista("anual")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                modoVista === "anual"
                  ? "bg-topo-mustard text-topo-dark shadow-sm"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              12 Meses (2027)
            </button>
            <button
              type="button"
              onClick={() => setModoVista("mensual")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                modoVista === "mensual"
                  ? "bg-topo-mustard text-topo-dark shadow-sm"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              Mes Grande
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarPanelSinFecha((v) => !v)}
            className="px-3 py-2 rounded-2xl border-2 border-[#D5CBB8] bg-white hover:bg-[#F6F2E9] text-xs font-bold text-stone-700 transition"
          >
            {mostrarPanelSinFecha ? "Ocultar lateral" : "Ver lateral"}
          </button>
        </div>
      </div>

      {/* Contenedor Principal: Calendario + Panel Lateral */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 w-full">
          {modoVista === "anual" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MESES_NOMBRES.map((_, idx) => renderMesCard(idx, false))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border-2 border-[#E2DCCE]">
                <button
                  type="button"
                  onClick={() => setMesExpandido((m) => (m + 11) % 12)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-topo-dark px-3 py-1.5 rounded-xl hover:bg-[#F6F2E9]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {MESES_NOMBRES[(mesExpandido + 11) % 12]}
                </button>
                <div className="flex flex-wrap gap-1 justify-center">
                  {MESES_NOMBRES.map((nom, i) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setMesExpandido(i)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition ${
                        mesExpandido === i
                          ? "bg-topo-mustard text-topo-dark"
                          : "text-stone-600 hover:bg-[#F6F2E9]"
                      }`}
                    >
                      {nom.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMesExpandido((m) => (m + 1) % 12)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-topo-dark px-3 py-1.5 rounded-xl hover:bg-[#F6F2E9]"
                >
                  {MESES_NOMBRES[(mesExpandido + 1) % 12]}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {renderMesCard(mesExpandido, true)}
            </div>
          )}
        </div>

        {/* Panel Lateral Arrastrable */}
        {mostrarPanelSinFecha && (
          <aside className="w-full lg:w-80 shrink-0 rounded-3xl bg-[#F6F2E9] border-2 border-[#E2DCCE] p-4 shadow-warm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-topo-dark flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-topo-mustard" />
                Bandeja de Tareas
              </h3>
              <AbejitaMuralSVG className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-600">
              Arrastra cualquier tarjeta hacia un día del calendario 2027 para cambiar o asignarle
              fecha.
            </p>

            {/* Eventos de Nov/Dic 2026 (inicio de convocatoria 2027) */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                Apertura Ciclo 2027 (Nov/Dic 2026)
              </span>
              {hitos
                .filter((h) => h.fecha?.endsWith("/2026"))
                .map((h) => (
                  <div
                    key={h.id}
                    draggable
                    onDragStart={() => setHitoArrastradoId(h.id)}
                    className="p-2.5 rounded-2xl bg-white border border-[#E2DCCE] shadow-sm cursor-grab active:cursor-grabbing hover:border-topo-mustard transition"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 mb-1">
                          {h.fecha}
                        </span>
                        <p className="text-xs font-bold text-stone-800 leading-snug">{h.evento}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Eventos sin fecha exacta */}
            <div className="space-y-2 pt-2 border-t border-[#E2DCCE]">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                Tareas sin fecha fija ({hitosSinFechaExacta.length})
              </span>
              {hitosSinFechaExacta.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-2">
                  Todas las tareas de 2027 están ubicadas en su fecha del calendario.
                </p>
              ) : (
                hitosSinFechaExacta.map((h) => (
                  <div
                    key={h.id}
                    draggable
                    onDragStart={() => setHitoArrastradoId(h.id)}
                    className="p-2.5 rounded-2xl bg-white border-2 border-dashed border-[#D5CBB8] shadow-sm cursor-grab active:cursor-grabbing hover:border-topo-terracotta transition"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 mb-1">
                          {h.fecha || "Sin fecha"}
                        </span>
                        <p className="text-xs font-bold text-stone-800 leading-snug">
                          {h.evento || "(Evento sin título)"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() =>
                  onCrearHito({
                    fecha: "",
                    evento: "Nueva tarea por programar",
                    compromiso: "",
                    personasEncargadas: "",
                  })
                }
                className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-[#D5CBB8] hover:border-topo-dark text-xs font-extrabold text-topo-dark hover:bg-white transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar tarea sin fecha
              </button>
            </div>

            <div className="flex justify-center pt-2">
              <FlorMuralSVG className="w-8 h-8" />
            </div>
          </aside>
        )}
      </div>

      {/* Modal al hacer clic en cualquier día del Calendario */}
      {fechaSeleccionadaISO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#FCFBF7] border-2 border-[#E2DCCE] shadow-warm-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#F6F2E9] border-b-2 border-[#E2DCCE] text-topo-dark">
              <div>
                <span className="text-xs uppercase tracking-wider text-topo-terracotta font-black">
                  Día seleccionado • {isoToDDMMYYYY(fechaSeleccionadaISO)}
                </span>
                <h3 className="text-lg font-black capitalize">
                  {isoToFechaComunitaria(fechaSeleccionadaISO)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFechaSeleccionadaISO(null)}
                className="p-1.5 rounded-xl text-stone-600 hover:text-topo-dark hover:bg-stone-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
              {/* Resaltado de Examen Clave si aplica */}
              {fechaSeleccionadaISO && obtenerExamenFecha(fechaSeleccionadaISO) && (
                <div className="p-3.5 rounded-2xl bg-purple-700 text-white flex items-center gap-3 shadow-md">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
                      Hito Institucional / Examen
                    </span>
                    <h4 className="text-sm font-black">
                      {obtenerExamenFecha(fechaSeleccionadaISO)!.titulo}
                    </h4>
                    {obtenerExamenFecha(fechaSeleccionadaISO)!.descripcion && (
                      <p className="text-xs text-purple-100 font-medium mt-0.5">
                        {obtenerExamenFecha(fechaSeleccionadaISO)!.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resaltado de Bloque / Período del Calendario si aplica */}
              {fechaSeleccionadaISO && obtenerPeriodoFecha(fechaSeleccionadaISO) && (
                <div className={`p-3 rounded-2xl border-2 flex items-center gap-3 ${
                  ESTILOS_BLOQUES_PERIODO[obtenerPeriodoFecha(fechaSeleccionadaISO)!.tipo]?.bgLight || "bg-stone-100"
                } ${
                  ESTILOS_BLOQUES_PERIODO[obtenerPeriodoFecha(fechaSeleccionadaISO)!.tipo]?.border || "border-stone-300"
                }`}>
                  <span className="text-2xl">
                    {ESTILOS_BLOQUES_PERIODO[obtenerPeriodoFecha(fechaSeleccionadaISO)!.tipo]?.icon || "📌"}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-stone-600 block">
                      Bloque: {obtenerPeriodoFecha(fechaSeleccionadaISO)!.tipo.toUpperCase()}
                    </span>
                    <h5 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                      {obtenerPeriodoFecha(fechaSeleccionadaISO)!.nombre}
                    </h5>
                    {obtenerPeriodoFecha(fechaSeleccionadaISO)!.descripcion && (
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        {obtenerPeriodoFecha(fechaSeleccionadaISO)!.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {festivoModal && (
                <div className="p-3 rounded-2xl bg-orange-50 border border-topo-terracotta/40 text-topo-terracotta flex items-center gap-2.5 font-extrabold">
                  <Flag className="w-5 h-5 shrink-0" />
                  <span>Festivo Oficial en Colombia: {festivoModal.nombre}</span>
                </div>
              )}

              {/* Acción Principal: Programar una Jornada de Clases en este día */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-dashed border-topo-mustard space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wider text-topo-dark flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-topo-terracotta" />
                    Clases / Jornadas en este día ({jornadasModal.length})
                  </h4>
                </div>

                {jornadasModal.map((j) => (
                  <div
                    key={j.id}
                    className="p-3 rounded-xl bg-white border border-[#E2DCCE] flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <span className="text-xs font-black text-matrix-header">
                        JORNADA {j.numeroJornada} • {j.horasJornada}
                      </span>
                      <p className="text-xs text-stone-700 font-semibold mt-0.5">
                        Encargadx: {j.encargadxDelDia || "Sin asignar"}
                      </p>
                    </div>
                    {onIrAJornada && (
                      <button
                        type="button"
                        onClick={() => {
                          setFechaSeleccionadaISO(null);
                          onIrAJornada(j.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-matrix-header text-white text-xs font-bold hover:bg-matrix-sub transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Editar Clases
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    onCrearJornadaEnFecha(isoToFechaComunitaria(fechaSeleccionadaISO));
                    setFechaSeleccionadaISO(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-black text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />+ Crear Jornada de Clases en este día y abrir horario
                </button>

                {jornadas.length > 0 && (
                  <div className="pt-1">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const j = jornadas.find((item) => item.id === e.target.value);
                        if (j) {
                          onActualizarJornada({
                            ...j,
                            fecha: isoToFechaComunitaria(fechaSeleccionadaISO),
                          });
                          e.target.value = "";
                        }
                      }}
                      className="w-full rounded-xl border-stone-300 text-xs py-1.5 bg-white"
                    >
                      <option value="">O mover una jornada existente a este día...</option>
                      {jornadas.map((j) => (
                        <option key={j.id} value={j.id}>
                          Jornada {j.numeroJornada} ({j.fecha || "Sin fecha"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Hitos del Cronograma General 2027 en este día */}
              <div className="space-y-2 pt-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-stone-600">
                  Tareas del Cronograma 2027 en esta fecha ({hitosModal.length})
                </h4>
                {hitosModal.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">
                    No hay tareas generales registradas en este día.
                  </p>
                ) : (
                  hitosModal.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-2xl bg-white border border-[#E2DCCE] space-y-1 shadow-sm"
                    >
                      <div className="font-extrabold text-topo-dark">{h.evento}</div>
                      {h.compromiso && (
                        <p className="text-xs text-stone-600 whitespace-pre-line">
                          {h.compromiso}
                        </p>
                      )}
                      {h.personasEncargadas && (
                        <p className="text-[11px] font-bold text-topo-green">
                          Responsables: {h.personasEncargadas}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Formulario rápido para agregar un nuevo Evento/Tarea en esta fecha */}
              <div className="pt-3 border-t border-[#E2DCCE] space-y-2.5">
                <h4 className="font-black text-xs uppercase tracking-wider text-topo-dark">
                  + Agregar Nueva Tarea / Evento en este día
                </h4>
                <input
                  type="text"
                  value={nuevoEventoTitulo}
                  onChange={(e) => setNuevoEventoTitulo(e.target.value)}
                  placeholder="Nombre del evento o tarea..."
                  className="w-full rounded-xl border-stone-300 text-xs bg-white"
                />
                <textarea
                  rows={2}
                  value={nuevoEventoCompromiso}
                  onChange={(e) => setNuevoEventoCompromiso(e.target.value)}
                  placeholder="Compromisos o lista de tareas (opcional)"
                  className="w-full rounded-xl border-stone-300 text-xs bg-white"
                />
                <input
                  type="text"
                  value={nuevoEventoEncargados}
                  onChange={(e) => setNuevoEventoEncargados(e.target.value)}
                  placeholder="Personas encargadas (opcional)"
                  className="w-full rounded-xl border-stone-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    onCrearHito({
                      fecha: isoToDDMMYYYY(fechaSeleccionadaISO),
                      evento: nuevoEventoTitulo.trim() || "Nueva actividad 2027",
                      compromiso: nuevoEventoCompromiso.trim(),
                      personasEncargadas: nuevoEventoEncargados.trim(),
                    });
                    setNuevoEventoTitulo("");
                    setNuevoEventoCompromiso("");
                    setNuevoEventoEncargados("");
                  }}
                  className="w-full py-2.5 rounded-xl bg-topo-green hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Guardar Tarea en el {isoToDDMMYYYY(fechaSeleccionadaISO)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
