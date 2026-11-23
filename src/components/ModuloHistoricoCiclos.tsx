"use client";

import React, { useState } from "react";
import {
  Archive,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Power,
  RotateCcw,
  BookOpen,
  Users,
} from "lucide-react";
import { CalendarioCicloTopo } from "@/types";

interface ModuloHistoricoCiclosProps {
  calendarios: CalendarioCicloTopo[];
  calendarioActivoId: string | null;
  esCoordinador: boolean;
  onSeleccionarCalendario: (calId: string) => void;
  onCambiarEstadoCalendario: (calId: string, nuevoEstado: "activo" | "finalizado" | "historico") => Promise<void>;
  onAbrirAsistenteNuevo: () => void;
  onVerDashboard2026: () => void;
}

export function ModuloHistoricoCiclos({
  calendarios,
  calendarioActivoId,
  esCoordinador,
  onSeleccionarCalendario,
  onCambiarEstadoCalendario,
  onAbrirAsistenteNuevo,
  onVerDashboard2026,
}: ModuloHistoricoCiclosProps) {
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const handleToggleEstado = async (cal: CalendarioCicloTopo) => {
    if (!esCoordinador) return;
    const esActivo = cal.estado === "activo";
    const nuevoEstado = esActivo ? "finalizado" : "activo";
    
    if (
      !window.confirm(
        esActivo
          ? `¿Estás seguro de marcar "${cal.nombre}" como finalizado? Pasará a archivo histórico.`
          : `¿Deseas activar "${cal.nombre}" como el calendario oficial en curso para todos los talleristas?`
      )
    ) {
      return;
    }

    setProcesandoId(cal.id);
    try {
      await onCambiarEstadoCalendario(cal.id, nuevoEstado);
    } finally {
      setProcesandoId(null);
    }
  };

  const cal2026Real = calendarios.find((c) => c.codigo === "2026" || c.id === "cal-2026-anual");
  const es2026Activo = cal2026Real ? cal2026Real.estado === "activo" : false;

  const calActivos = calendarios.filter((c) => c.estado === "activo");
  const calHistoricos = calendarios.filter((c) => c.estado !== "activo");

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-topo-dark flex items-center justify-center font-black">
            <Archive className="w-6 h-6 text-amber-800" />
          </div>
          <div>
            <h2 className="text-xl font-black text-topo-dark">
              Archivo Histórico de Ciclos y Memoria
            </h2>
            <p className="text-xs text-stone-500 font-bold">
              Gestión comunitaria de períodos académicos anteriores y activos en la Escuela Popular El Topo
            </p>
          </div>
        </div>

        {esCoordinador && (
          <button
            type="button"
            onClick={onAbrirAsistenteNuevo}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-xs shadow-md transition transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Crear Nuevo Calendario / Ciclo</span>
          </button>
        )}
      </div>

      {/* SECCIÓN 1: CALENDARIO(S) ACTIVO(S) EN CURSO */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Período Lectivo Oficial en Curso</span>
        </h3>

        {calActivos.length === 0 ? (
          <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-3xl p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 text-amber-500 mx-auto" />
            <div>
              <p className="text-base font-black text-amber-950">
                No hay ningún ciclo lectivo activo en este momento
              </p>
              <p className="text-xs text-amber-800 max-w-md mx-auto mt-1">
                El período anterior ha finalizado o se encuentra en receso intersemestral.
                {esCoordinador
                  ? " Como coordinación puedes crear el ciclo para el nuevo año o reactivar un período previo."
                  : " Coordinación publicará el cronograma tan pronto inicie el ciclo pedagógico."}
              </p>
            </div>
            {esCoordinador && (
              <button
                type="button"
                onClick={onAbrirAsistenteNuevo}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-xs shadow-md transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Programar Calendario Activo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calActivos.map((cal) => (
              <div
                key={cal.id}
                className="bg-white rounded-3xl p-5 border-2 border-emerald-300 shadow-warm relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white font-black text-[10px] rounded-bl-2xl uppercase tracking-wider">
                  En Curso (Activo)
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ciclo Año {cal.ano}</span>
                  </div>
                  <h4 className="text-lg font-black text-topo-dark leading-snug">
                    {cal.nombre}
                  </h4>
                  {cal.descripcion && (
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {cal.descripcion}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-bold text-stone-500">
                    <span className="bg-stone-100 px-2.5 py-1 rounded-xl">
                      📅 {cal.jornadas?.length || 0} Sábados Programados
                    </span>
                    <span className="bg-stone-100 px-2.5 py-1 rounded-xl">
                      🎓 {cal.hitos?.length || 0} Hitos / Exámenes
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSeleccionarCalendario(cal.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-topo-dark hover:bg-stone-800 text-white font-black text-xs transition"
                  >
                    <span>Abrir Cronograma</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {esCoordinador && (
                    <button
                      type="button"
                      disabled={procesandoId === cal.id}
                      onClick={() => handleToggleEstado(cal)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs transition disabled:opacity-50"
                      title="Finalizar este ciclo y pasarlo al histórico"
                    >
                      <Power className="w-3.5 h-3.5 text-amber-600" />
                      <span>Marcar como Finalizado</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: HISTÓRICO DE CICLOS FINALIZADOS / MEMORIA INSTITUCIONAL */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-black text-stone-600 flex items-center gap-2">
          <Archive className="w-4 h-4 text-stone-500" />
          <span>Períodos Finalizados y Memoria Histórica</span>
        </h3>

        {calHistoricos.length === 0 && !(!es2026Activo && cal2026Real) ? (
          <div className="bg-stone-50 rounded-3xl p-6 border-2 border-stone-200 text-center text-xs text-stone-500 font-bold">
            No hay ciclos archivados actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tarjeta 2026 en Histórico: SOLO se muestra si NO está activo */}
            {!es2026Activo && (
              <div className="bg-[#1C1917] rounded-3xl p-5 text-white shadow-xl border-2 border-stone-800 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-900 flex items-center justify-center font-black">
                      <Archive className="w-5 h-5 text-stone-900" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-stone-800 text-amber-400 px-2.5 py-0.5 rounded-full border border-stone-700">
                      Cerrado • 2026
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white leading-snug">
                      Año 2026: Balance y Memoria
                    </h4>
                    <p className="text-xs text-stone-300 leading-relaxed mt-1">
                      Registro histórico consolidado: 42 estudiantes, 36 jornadas sabatinas, 27 talleristas y sábana de notas.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-2 text-[11px] font-bold text-stone-400">
                    <span>42 alumnos</span>
                    <span>•</span>
                    <span>36 sábados</span>
                    <span>•</span>
                    <span>27 talleristas</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onVerDashboard2026}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-black text-xs transition border border-stone-700"
                  >
                    <span>Ver Memoria</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {esCoordinador && (
                    <button
                      type="button"
                      disabled={procesandoId === "cal-2026-anual"}
                      onClick={() => {
                        const cal2026 = cal2026Real || {
                          id: "cal-2026-anual",
                          nombre: "Año 2026",
                          estado: "finalizado",
                        };
                        handleToggleEstado(cal2026 as any);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-black text-xs transition transform active:scale-95 shadow-sm disabled:opacity-50 bg-amber-400 hover:bg-amber-300 text-stone-950"
                      title="Reactivar el año 2026 como ciclo lectivo oficial"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Activar Ciclo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Otros calendarios finalizados */}
            {calHistoricos
              .filter((c) => c.codigo !== "2026" && c.id !== "cal-2026-anual")
              .map((cal) => (
                <div
                  key={cal.id}
                  className="bg-white rounded-3xl p-5 border-2 border-stone-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-400 uppercase">
                        Año {cal.ano}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                        Finalizado
                      </span>
                    </div>
                    <h4 className="text-base font-black text-topo-dark leading-snug">
                      {cal.nombre}
                    </h4>
                    {cal.descripcion && (
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                        {cal.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSeleccionarCalendario(cal.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition"
                    >
                      <span>Inspeccionar</span>
                    </button>

                    {esCoordinador && (
                      <button
                        type="button"
                        disabled={procesandoId === cal.id}
                        onClick={() => handleToggleEstado(cal)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs transition disabled:opacity-50"
                        title="Reactivar este calendario como oficial"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reactivar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
