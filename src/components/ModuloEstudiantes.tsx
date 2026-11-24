"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  TrendingDown,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  TrendingUp,
} from "lucide-react";
import { EstudianteTopo, EstadoEstudiante, JornadaPedagogica } from "@/types";

interface ModuloEstudiantesProps {
  estudiantes: EstudianteTopo[];
  jornadas: JornadaPedagogica[];
  esHistorico?: boolean;
  esCoordinador?: boolean;
  nombreCalendario?: string;
  onActualizarEstudiantes: (nuevos: EstudianteTopo[]) => void;
}

export function ModuloEstudiantes({
  estudiantes = [],
  jornadas = [],
  esHistorico = false,
  esCoordinador = false,
  nombreCalendario = "Ciclo Actual",
  onActualizarEstudiantes,
}: ModuloEstudiantesProps) {
  const [pestana, setPestana] = useState<"resumen" | "directorio" | "asistencia_sabados">("resumen");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  // Modal para agregar estudiante nuevo o mover a lista de espera
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoNombres, setNuevoNombres] = useState("");
  const [nuevoApellidos, setNuevoApellidos] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<EstadoEstudiante>("activo");
  const [nuevoObservacion, setNuevoObservacion] = useState("");

  // Jornadas ordenadas que cuentan para asistencia (con fechaISO)
  const jornadasClase = useMemo(() => {
    return [...jornadas]
      .filter((j) => j.fechaISO)
      .sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || ""));
  }, [jornadas]);

  // Métricas y estadísticas consolidadas
  const estadisticas = useMemo(() => {
    const total = estudiantes.length;
    const activos = estudiantes.filter((e) => e.estado === "activo").length;
    const espera = estudiantes.filter((e) => e.estado === "espera").length;
    const retirados = estudiantes.filter((e) => e.estado === "retirado").length;

    const maxJornadas = Math.max(jornadasClase.length, 1);

    // Sumatoria de asistencias en clases y jornadas equivalentes
    let sumaJornadasAsistidas = 0;
    let sumaClasesAsistidas = 0;
    let estudiantesConSaber = 0;
    let sumaPuntajesSaber = 0;

    estudiantes.forEach((e) => {
      let clases = e.totalClasesAsistidas || 0;
      if (!clases && e.asistenciasPorJornada) {
        clases = Object.values(e.asistenciasPorJornada).reduce((acc, val) => acc + val, 0);
      }
      sumaClasesAsistidas += clases;
      sumaJornadasAsistidas += clases / 4;

      if (e.puntajeSaber11 && e.puntajeSaber11 > 0) {
        estudiantesConSaber++;
        sumaPuntajesSaber += e.puntajeSaber11;
      }
    });

    const promedioJornadasPorEstudiante = total > 0 ? (sumaJornadasAsistidas / total) : 0;
    const promedioClasesPorEstudiante = total > 0 ? (sumaClasesAsistidas / total) : 0;

    // Estimación porcentual de deserción matemática del Excel: 1 - (Promedio / Total) o (Retirados / Total)
    const tasaDesercionCalculada = total > 0 ? ((retirados / total) * 100) : 0;
    const porcentajePermanencia = 100 - tasaDesercionCalculada;

    const promedioSaber11 = estudiantesConSaber > 0 ? Math.round(sumaPuntajesSaber / estudiantesConSaber) : null;

    return {
      total,
      activos,
      espera,
      retirados,
      promedioJornadasPorEstudiante: promedioJornadasPorEstudiante.toFixed(1),
      promedioClasesPorEstudiante: promedioClasesPorEstudiante.toFixed(1),
      tasaDesercionCalculada: tasaDesercionCalculada.toFixed(1),
      porcentajePermanencia: porcentajePermanencia.toFixed(1),
      promedioSaber11,
      estudiantesConSaber,
    };
  }, [estudiantes, jornadasClase]);

  // Filtrado de la lista
  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((e) => {
      const cumpleEstado = filtroEstado === "todos" || e.estado === filtroEstado;
      const term = busqueda.toLowerCase().trim();
      const cumpleBusqueda =
        !term ||
        e.nombres.toLowerCase().includes(term) ||
        (e.apellidos && e.apellidos.toLowerCase().includes(term));
      return cumpleEstado && cumpleBusqueda;
    });
  }, [estudiantes, filtroEstado, busqueda]);

  // Handlers para agregar y cambiar estado
  const handleGuardarNuevoEstudiante = () => {
    if (!nuevoNombres.trim()) {
      alert("Por favor ingresa al menos los nombres del estudiante.");
      return;
    }

    const nuevo: EstudianteTopo = {
      id: `est-${Date.now()}`,
      num: estudiantes.length + 1,
      nombres: nuevoNombres.trim(),
      apellidos: nuevoApellidos.trim(),
      estado: nuevoEstado,
      calendarioId: "actual",
      fechaIngreso: new Date().toISOString().split("T")[0],
      observaciones: nuevoObservacion.trim() || undefined,
      totalClasesAsistidas: 0,
      totalJornadasAsistidas: 0,
      asistenciasPorJornada: {},
    };

    onActualizarEstudiantes([...estudiantes, nuevo]);
    setNuevoNombres("");
    setNuevoApellidos("");
    setNuevoObservacion("");
    setMostrarModalNuevo(false);
  };

  const handleCambiarEstadoEstudiante = (id: string, nuevoEstado: EstadoEstudiante) => {
    if (esHistorico) return;
    const actualizados = estudiantes.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          estado: nuevoEstado,
          fechaRetiro: nuevoEstado === "retirado" ? new Date().toISOString().split("T")[0] : e.fechaRetiro,
        };
      }
      return e;
    });
    onActualizarEstudiantes(actualizados);
  };

  const handleCambiarClasesJornada = (estudianteId: string, fechaISO: string, clases: number) => {
    if (esHistorico) return;
    const actualizados = estudiantes.map((e) => {
      if (e.id === estudianteId) {
        const mapa = { ...(e.asistenciasPorJornada || {}) };
        mapa[fechaISO] = clases;
        const totalClases = Object.values(mapa).reduce((a, b) => a + b, 0);
        return {
          ...e,
          asistenciasPorJornada: mapa,
          totalClasesAsistidas: totalClases,
          totalJornadasAsistidas: totalClases / 4,
        };
      }
      return e;
    });
    onActualizarEstudiantes(actualizados);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* CABECERA DEL MÓDULO */}
      <div className="bg-gradient-to-r from-[#1B365D] via-[#2A4D7D] to-topo-green text-white p-6 rounded-3xl shadow-warm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-topo-dark text-xs font-black uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Cohorte y Asistencia Estudiantil</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <span>Directorio de Estudiantes y Permanencia</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 mt-1 max-w-2xl">
            Seguimiento sabatino de asistencia clase a clase (0 a 4 bloques), gestión de listas de espera y análisis de permanencia vinculado a: <strong>{nombreCalendario}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!esHistorico && esCoordinador && (
            <button
              type="button"
              onClick={() => setMostrarModalNuevo(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-topo-dark font-black text-xs shadow-md transition hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Estudiante / Lista de Espera</span>
            </button>
          )}

          {esHistorico && (
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white text-xs font-black border border-white/30 flex items-center gap-1.5">
              <span>🔒 Ciclo Histórico (Solo Lectura)</span>
            </div>
          )}
        </div>
      </div>

      {/* TARJETAS DE INDICADORES ESTADÍSTICOS EN VIVO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Estudiantes */}
        <div className="p-4 rounded-2xl bg-white border-2 border-stone-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-stone-500">Matrícula Total</span>
          <div className="my-1">
            <span className="text-2xl font-black text-[#1B365D]">{estadisticas.total}</span>
          </div>
          <span className="text-[10px] text-stone-400 font-bold">Inscritos en cohorte</span>
        </div>

        {/* Activos */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-emerald-900 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Activos</span>
          </span>
          <div className="my-1">
            <span className="text-2xl font-black text-emerald-700">{estadisticas.activos}</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-bold">En aula regular</span>
        </div>

        {/* Lista de Espera */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Lista de Espera</span>
          </span>
          <div className="my-1">
            <span className="text-2xl font-black text-amber-700">{estadisticas.espera}</span>
          </div>
          <span className="text-[10px] text-amber-800 font-bold">Listos para ingresar</span>
        </div>

        {/* Retirados */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border-2 border-rose-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-rose-900 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>Retirados</span>
          </span>
          <div className="my-1">
            <span className="text-2xl font-black text-rose-700">{estadisticas.retirados}</span>
          </div>
          <span className="text-[10px] text-rose-800 font-bold">Deserción: {estadisticas.tasaDesercionCalculada}%</span>
        </div>

        {/* Promedio Clases */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-blue-900">Promedio Clases</span>
          <div className="my-1">
            <span className="text-2xl font-black text-blue-700">{estadisticas.promedioClasesPorEstudiante}</span>
          </div>
          <span className="text-[10px] text-blue-800 font-bold">≈ {estadisticas.promedioJornadasPorEstudiante} sábados completos</span>
        </div>

        {/* Resultados Saber 11 */}
        <div className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-purple-900 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>Saber 11</span>
          </span>
          <div className="my-1">
            <span className="text-2xl font-black text-purple-800">
              {estadisticas.promedioSaber11 ? `${estadisticas.promedioSaber11} pts` : "—"}
            </span>
          </div>
          <span className="text-[10px] text-purple-700 font-bold">
            {estadisticas.estudiantesConSaber > 0 ? `${estadisticas.estudiantesConSaber} con puntaje` : "Por presentar"}
          </span>
        </div>
      </div>

      {/* SELECTOR DE PESTAÑAS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPestana("resumen")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
              pestana === "resumen"
                ? "bg-[#1B365D] text-white shadow-xs"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Panel de Permanencia y Resumen</span>
          </button>

          <button
            type="button"
            onClick={() => setPestana("directorio")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
              pestana === "directorio"
                ? "bg-[#1B365D] text-white shadow-xs"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directorio de Estudiantes ({estudiantes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setPestana("asistencia_sabados")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
              pestana === "asistencia_sabados"
                ? "bg-[#1B365D] text-white shadow-xs"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sábana de Asistencia Sabatina</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o apellido..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold bg-white"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold bg-white cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activo">Solo Activos</option>
            <option value="espera">En Lista de Espera</option>
            <option value="retirado">Retirados</option>
          </select>
        </div>
      </div>

      {/* PESTAÑA 1: RESUMEN DE PERMANENCIA */}
      {pestana === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-warm space-y-4">
            <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Diagnóstico de Asistencia y Permanencia Escolar</span>
            </h3>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-700">Tasa de Permanencia Activa:</span>
                <span className="text-emerald-700 font-black">{estadisticas.porcentajePermanencia}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${estadisticas.porcentajePermanencia}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Estudiantes en Aula</span>
                  <span className="text-sm font-black text-emerald-700">{estadisticas.activos} estudiantes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">En Lista de Espera</span>
                  <span className="text-sm font-black text-amber-700">{estadisticas.espera} esperando cupo</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Deserción Registrada</span>
                  <span className="text-sm font-black text-rose-700">{estadisticas.retirados} retirados</span>
                </div>
              </div>
            </div>

            {/* Reglas de asistencia comunitaria */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <span className="font-black flex items-center gap-1.5">
                <span>📏 Regla de Asistencia por Clases del Día (4 bloques):</span>
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                En la plataforma la asistencia no se reduce a binario ("vino o no vino"). Se registra si asistió a <strong>4 clases</strong> (jornada completa), <strong>3 clases</strong>, <strong>2 clases</strong>, <strong>1 clase</strong> o <strong>0 clases</strong>, calculando el acumulado exacto de formación pedagógica recibida.
              </p>
            </div>
          </div>

          {/* Cuadro de estudiantes en lista de espera y reemplazos */}
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-warm space-y-4">
            <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Lista de Espera y Nuevos Ingresos ({estadisticas.espera})</span>
            </h3>

            {estudiantes.filter((e) => e.estado === "espera").length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 font-bold bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                No hay estudiantes en lista de espera actualmente.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {estudiantes
                  .filter((e) => e.estado === "espera")
                  .map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-amber-950 truncate">
                          {e.nombres} {e.apellidos}
                        </p>
                        <span className="text-[10px] text-amber-800 font-bold block">
                          Ingreso pendiente {e.fechaIngreso ? `(${e.fechaIngreso})` : ""}
                        </span>
                      </div>

                      {!esHistorico && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstadoEstudiante(e.id, "activo")}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] shadow-xs shrink-0 transition"
                          title="Pasar a lista activa en reemplazo de un cupo disponible"
                        >
                          + Ingresar al Aula
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DIRECTORIO DE ESTUDIANTES */}
      {pestana === "directorio" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1B365D] text-white text-[11px] font-black uppercase">
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-3.5 text-center">Estado</th>
                  <th className="py-3 px-3.5 text-center">Clases Asistidas</th>
                  <th className="py-3 px-3.5 text-center whitespace-normal leading-tight">
                    Sábados<br />Equivalentes
                  </th>
                  <th className="py-3 px-3.5 text-center">Puntaje Saber 11</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {estudiantesFiltrados.map((e, idx) => {
                  const clases = e.totalClasesAsistidas || (e.asistenciasPorJornada ? Object.values(e.asistenciasPorJornada).reduce((a, b) => a + b, 0) : 0);
                  const jornadasEquiv = (clases / 4).toFixed(1);

                  return (
                    <tr key={e.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-2.5 px-3.5 font-bold text-stone-400 text-center">{e.num || idx + 1}</td>
                      <td className="py-2.5 px-4 font-black text-topo-dark">
                        <span className="block">{e.nombres} {e.apellidos}</span>
                        {e.observaciones && <span className="text-[10px] text-stone-500 italic block">{e.observaciones}</span>}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          e.estado === "activo"
                            ? "bg-emerald-100 text-emerald-800"
                            : e.estado === "espera"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {e.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-black text-blue-900">
                        {clases} clases
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-stone-600">
                        {jornadasEquiv}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-black text-purple-900">
                        {e.puntajeSaber11 ? `${e.puntajeSaber11} pts` : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {!esHistorico && esCoordinador && (
                          <div className="flex items-center justify-center gap-1.5">
                            {e.estado !== "activo" && (
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoEstudiante(e.id, "activo")}
                                className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition"
                              >
                                Activar
                              </button>
                            )}
                            {e.estado !== "retirado" && (
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoEstudiante(e.id, "retirado")}
                                className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition"
                              >
                                Retirar
                              </button>
                            )}
                            {e.estado !== "espera" && (
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoEstudiante(e.id, "espera")}
                                className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold transition"
                              >
                                Espera
                              </button>
                            )}
                          </div>
                        )}
                        {(!esCoordinador || esHistorico) && (
                          <span className="text-[10px] text-stone-400 font-bold">
                            {esHistorico ? "Cerrado" : e.estado}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: SÁBANA COMPLETA DE ASISTENCIA SABATINA (CLASES 0 A 4) */}
      {pestana === "asistencia_sabados" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-topo-green" />
                <span>Matriz de Asistencia Sabatina por Clases (0 a 4)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Pasa el mouse o haz clic sobre cada celda para ver o editar cuántas clases del día presenció cada estudiante.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] border border-stone-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#1B365D] text-white z-10 text-[10px] font-black uppercase">
                <tr>
                  <th className="py-2 px-3 border-r border-blue-900 sticky left-0 bg-[#1B365D] z-20 w-44">
                    Estudiante
                  </th>
                  <th className="py-2 px-2 text-center border-r border-blue-900 w-16">Total Clases</th>
                  {jornadasClase.map((j) => (
                    <th key={j.id} className="py-2 px-2 text-center border-r border-blue-900 whitespace-nowrap min-w-[70px]">
                      <span>{j.numeroJornada ? `J#${j.numeroJornada}` : ""}</span>
                      <span className="block text-[8px] opacity-75 font-mono">{j.fechaISO?.slice(5)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {estudiantesFiltrados.map((e) => {
                  const clasesTotal = e.totalClasesAsistidas || (e.asistenciasPorJornada ? Object.values(e.asistenciasPorJornada).reduce((a, b) => a + b, 0) : 0);

                  return (
                    <tr key={`row-asis-${e.id}`} className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-bold text-topo-dark sticky left-0 bg-white border-r border-stone-200 z-10 truncate max-w-[180px]">
                        <span>{e.nombres} {e.apellidos}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-black text-blue-900 border-r border-stone-200 bg-blue-50/50">
                        {clasesTotal}
                      </td>
                      {jornadasClase.map((j) => {
                        const iso = j.fechaISO || "";
                        const val = e.asistenciasPorJornada?.[iso] ?? 0;

                        return (
                          <td
                            key={`cell-${e.id}-${j.id}`}
                            className={`py-1.5 px-1 text-center border-r border-stone-100 font-black text-[11px] ${
                              val === 4
                                ? "bg-emerald-100 text-emerald-900"
                                : val === 3
                                ? "bg-emerald-50 text-emerald-800"
                                : val === 2
                                ? "bg-amber-100 text-amber-900"
                                : val === 1
                                ? "bg-amber-50 text-amber-800"
                                : "bg-stone-50/50 text-stone-300"
                            }`}
                          >
                            {!esHistorico ? (
                              <select
                                value={val}
                                onChange={(evt) =>
                                  handleCambiarClasesJornada(e.id, iso, Number(evt.target.value))
                                }
                                className="bg-transparent font-black text-center cursor-pointer text-[10px] w-full"
                              >
                                <option value={0}>0 cl</option>
                                <option value={1}>1 cl</option>
                                <option value={2}>2 cl</option>
                                <option value={3}>3 cl</option>
                                <option value={4}>4 cl (Todo)</option>
                              </select>
                            ) : (
                              <span>{val > 0 ? `${val} cl` : "—"}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA AÑADIR NUEVO ESTUDIANTE / LISTA DE ESPERA */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border-4 border-amber-400 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-900">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black">Añadir Estudiante a la Cohorte</h3>
                <p className="text-xs text-stone-600">Registra un nuevo alumno activo o en lista de espera.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Nombres *</label>
                <input
                  type="text"
                  value={nuevoNombres}
                  onChange={(e) => setNuevoNombres(e.target.value)}
                  placeholder="Ej. Juan Andrés"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Apellidos</label>
                <input
                  type="text"
                  value={nuevoApellidos}
                  onChange={(e) => setNuevoApellidos(e.target.value)}
                  placeholder="Ej. Gómez Pérez"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Estado de Ingreso</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as EstadoEstudiante)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                >
                  <option value="activo">En Aula (Activo)</option>
                  <option value="espera">Lista de Espera (Esperando cupo)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={nuevoObservacion}
                  onChange={(e) => setNuevoObservacion(e.target.value)}
                  placeholder="Motivo, teléfono, o notas pedagógicas..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleGuardarNuevoEstudiante}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition"
              >
                Guardar Estudiante
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="py-2.5 px-4 rounded-2xl border border-stone-300 text-stone-600 font-black text-xs hover:bg-stone-100 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
