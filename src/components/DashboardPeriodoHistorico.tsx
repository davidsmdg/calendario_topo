"use client";

import React, { useState, useMemo } from "react";
import {
  Archive,
  ArrowLeft,
  Calendar,
  Users,
  Award,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Search,
  ExternalLink,
} from "lucide-react";
import { TimelineEstrategico } from "./TimelineEstrategico";
import { CALENDARIO_2026_SEED } from "@/utils/seedData2026";
import { EstudianteTopo, JornadaPedagogica } from "@/types";

interface DashboardPeriodoHistoricoProps {
  anoSeleccionado?: number;
  onVolverAlMenu: () => void;
}

export function DashboardPeriodoHistorico({
  anoSeleccionado = 2026,
  onVolverAlMenu,
}: DashboardPeriodoHistoricoProps) {
  const [tabActiva, setTabActiva] = useState<
    "resumen" | "estudiantes" | "asistencia" | "talleristas" | "cronograma" | "sabana_academica"
  >("resumen");
  const [busqueda, setBusqueda] = useState("");

  const calData = CALENDARIO_2026_SEED;
  const estudiantes: EstudianteTopo[] = calData.estudiantes || [];
  const jornadas: JornadaPedagogica[] = calData.jornadas || [];

  // Jornadas ordenadas
  const jornadasOrdenadas = useMemo(() => {
    return [...jornadas].sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || ""));
  }, [jornadas]);

  // Estadísticas del año 2026
  const estadisticas = useMemo(() => {
    const totalEstudiantes = estudiantes.length;
    const retirados = estudiantes.filter((e) => e.estado === "retirado").length;
    const activosFinal = totalEstudiantes - retirados;
    const tasaDesercion = totalEstudiantes > 0 ? ((retirados / totalEstudiantes) * 100).toFixed(1) : "0";
    const tasaPermanencia = totalEstudiantes > 0 ? (100 - Number(tasaDesercion)).toFixed(1) : "100";

    let sumaClases = 0;
    let sumaSaber = 0;
    let cantSaber = 0;

    estudiantes.forEach((e) => {
      sumaClases += e.totalClasesAsistidas || 0;
      if (e.puntajeSaber11) {
        sumaSaber += e.puntajeSaber11;
        cantSaber++;
      }
    });

    const promedioClasesPorAlumno = totalEstudiantes > 0 ? (sumaClases / totalEstudiantes).toFixed(1) : "0";
    const promedioJornadasPorAlumno = (Number(promedioClasesPorAlumno) / 4).toFixed(1);
    const promedioSaber11 = cantSaber > 0 ? Math.round(sumaSaber / cantSaber) : null;

    // Conteo de jornadas por carácter
    const totalJornadas = jornadas.length;
    const jornadasClases = jornadas.filter((j) => j.caracter === "clases").length;
    const jornadasCoord = jornadas.filter((j) => j.caracter === "coordinacion" || j.tipoJornada === "unificada").length;
    const jornadasVac = jornadas.filter((j) => j.caracter === "vacaciones").length;

    return {
      totalEstudiantes,
      activosFinal,
      retirados,
      tasaDesercion,
      tasaPermanencia,
      promedioClasesPorAlumno,
      promedioJornadasPorAlumno,
      promedioSaber11,
      cantSaber,
      totalJornadas,
      jornadasClases,
      jornadasCoord,
      jornadasVac,
    };
  }, [estudiantes, jornadas]);

  // Talleristas y asistencia en 2026
  const talleristasStats = useMemo(() => {
    const map = new Map<string, { nombre: string; clasesDictadas: number; fechas: string[] }>();
    jornadas.forEach((j) => {
      j.bloques.forEach((b) => {
        if (b.talleristas) {
          b.talleristas.split(/[,;&•\n]+/).forEach((t) => {
            const nom = t.trim();
            if (nom && nom.length > 2 && !nom.toLowerCase().includes("sesión") && !nom.toLowerCase().includes("descanso")) {
              if (!map.has(nom)) {
                map.set(nom, { nombre: nom, clasesDictadas: 0, fechas: [] });
              }
              const reg = map.get(nom)!;
              reg.clasesDictadas++;
              if (j.fecha && !reg.fechas.includes(j.fecha)) {
                reg.fechas.push(j.fecha);
              }
            }
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.clasesDictadas - a.clasesDictadas);
  }, [jornadas]);

  // Filtrado de estudiantes
  const estudiantesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return estudiantes.filter((e) => {
      if (!q) return true;
      return (
        e.nombres.toLowerCase().includes(q) ||
        (e.apellidos && e.apellidos.toLowerCase().includes(q))
      );
    });
  }, [estudiantes, busqueda]);

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* BANNER HISTÓRICO */}
      <div className="relative rounded-3xl bg-gradient-to-r from-stone-800 via-stone-900 to-slate-950 text-white p-6 sm:p-8 shadow-warm-lg border-2 border-stone-700 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onVolverAlMenu}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition transform active:scale-95 shrink-0"
              title="Volver al Home"
            >
              <ArrowLeft className="w-5 h-5 text-amber-300" />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-400 text-stone-900 text-xs font-black uppercase tracking-wider mb-1">
                <Archive className="w-3.5 h-3.5" />
                <span>Archivo Histórico Escolar</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                <span>Memoria y Balance: Ciclo {anoSeleccionado}</span>
                <span className="text-xs bg-stone-700/80 text-stone-300 px-3 py-1 rounded-full font-mono font-bold border border-stone-600">
                  🔒 Período Cerrado
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-3xl leading-relaxed">
                Visualización consolidada de resultados, asistencia de estudiantes (por clases), fechas de coordinación y participación de talleristas del año {anoSeleccionado}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onVolverAlMenu}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-md transition"
          >
            <span>← Volver al Planificador 2027</span>
          </button>
        </div>
      </div>

      {/* METRICAS RESUMEN (TARJETAS AUDITORÍA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border-2 border-stone-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-stone-400 block">Matrícula {anoSeleccionado}</span>
          <span className="text-2xl font-black text-stone-800">{estadisticas.totalEstudiantes}</span>
          <span className="text-[10px] text-stone-500 font-bold block mt-0.5">Estudiantes inscritos</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-800 block">Permanencia Final</span>
          <span className="text-2xl font-black text-emerald-700">{estadisticas.tasaPermanencia}%</span>
          <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">{estadisticas.activosFinal} culminaron el ciclo</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-rose-800 block">Tasa Deserción</span>
          <span className="text-2xl font-black text-rose-700">{estadisticas.tasaDesercion}%</span>
          <span className="text-[10px] text-rose-800 font-bold block mt-0.5">{estadisticas.retirados} abandonos</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-blue-800 block">Promedio de Clases</span>
          <span className="text-2xl font-black text-blue-700">{estadisticas.promedioClasesPorAlumno}</span>
          <span className="text-[10px] text-blue-800 font-bold block mt-0.5">≈ {estadisticas.promedioJornadasPorAlumno} sábados</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-purple-800 block">Promedio Saber 11</span>
          <span className="text-2xl font-black text-purple-700">{estadisticas.promedioSaber11 ? `${estadisticas.promedioSaber11} pts` : "—"}</span>
          <span className="text-[10px] text-purple-700 font-bold block mt-0.5">{estadisticas.cantSaber} evaluados</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-amber-800 block">Jornadas Totales</span>
          <span className="text-2xl font-black text-amber-800">{estadisticas.totalJornadas}</span>
          <span className="text-[10px] text-amber-800 font-bold block mt-0.5">{estadisticas.jornadasCoord} de coordinación</span>
        </div>
      </div>

      {/* TIMELINE GRÁFICO HISTÓRICO DE 2026 */}
      <TimelineEstrategico
        modalidadCiclo="anual"
        nombreCiclo1={`Ciclo Anual Histórico (${anoSeleccionado})`}
        anoReferencia={Number(anoSeleccionado) || 2026}
        periodos={calData.estructuraCalendario.periodosTemporales}
        examenes={calData.estructuraCalendario.fechasClaveExamenes}
        titulo={`🗺️ Esquema Cronológico Ejecutado en ${anoSeleccionado}`}
        subtitulo="Línea de tiempo histórica del año con tramos de clases, vacaciones y exámenes presentados"
        compacto={false}
      />

      {/* SELECTOR DE PESTAÑAS DEL DASHBOARD HISTÓRICO */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTabActiva("resumen")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              tabActiva === "resumen" ? "bg-stone-900 text-white shadow-xs" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            📋 Resumen Ejecutivo
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("estudiantes")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              tabActiva === "estudiantes" ? "bg-stone-900 text-white shadow-xs" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            🎒 Estudiantes ({estudiantes.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("asistencia")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              tabActiva === "asistencia" ? "bg-stone-900 text-white shadow-xs" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            📊 Sábana de Asistencia Sabatina
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("talleristas")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              tabActiva === "talleristas" ? "bg-stone-900 text-white shadow-xs" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            👥 Talleristas Participantes ({talleristasStats.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("cronograma")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              tabActiva === "cronograma" ? "bg-stone-900 text-white shadow-xs" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            🤝 Coordinaciones e Hitos ({estadisticas.jornadasCoord})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("sabana_academica")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              tabActiva === "sabana_academica" ? "bg-stone-900 text-white shadow-xs" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            📑 Sábana Académica 2026 (Horarios y Clases)
          </button>
        </div>

        {(tabActiva === "estudiantes" || tabActiva === "asistencia") && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold"
            />
          </div>
        )}
      </div>

      {/* CONTENIDO DE CADA PESTAÑA */}

      {/* 1. RESUMEN EJECUTIVO */}
      {tabActiva === "resumen" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-warm space-y-4">
            <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Balance de Asistencia y Deserción</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              En el año 2026, la escuela inició con <strong>42 estudiantes inscritos</strong>. La tasa final de permanencia fue del <strong>{estadisticas.tasaPermanencia}%</strong>, con un promedio de <strong>{estadisticas.promedioClasesPorAlumno} clases recibidas</strong> por estudiante a lo largo de 32 sábados lectivos.
            </p>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Permanencia:</span>
                <span className="text-emerald-700 font-black">{estadisticas.tasaPermanencia}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${estadisticas.tasaPermanencia}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-warm space-y-4">
            <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Equipo de Talleristas 2026</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Durante el año participaron <strong>{talleristasStats.length} talleristas distintos</strong> dictando clases y acompañando los espacios formativos.
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {talleristasStats.slice(0, 6).map((t, idx) => (
                <div key={t.nombre} className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs font-bold">
                  <span className="truncate">{idx + 1}. {t.nombre}</span>
                  <span className="text-amber-900 font-black bg-amber-200 px-2 py-0.5 rounded-full text-[10px] shrink-0">
                    {t.clasesDictadas} clases
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-warm space-y-4">
            <h3 className="text-sm font-black text-topo-dark flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Resultados Saber 11 / 2026</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              El promedio global registrado para la cohorte 2026 fue de <strong>{estadisticas.promedioSaber11} puntos</strong> sobre 500, con {estadisticas.cantSaber} estudiantes que presentaron la prueba oficial o simulacro final.
            </p>
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 font-bold space-y-1">
              <span className="block font-black text-sm">🏛️ Admisión Universitaria</span>
              <span>Preparación orientada a la Universidad Nacional y examen de Estado.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DIRECTORIO DE ESTUDIANTES */}
      {tabActiva === "estudiantes" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-900 text-white text-[11px] font-black uppercase">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-3.5 text-center">Estado Final</th>
                <th className="py-3 px-3.5 text-center">Clases Asistidas</th>
                <th className="py-3 px-3.5 text-center whitespace-normal leading-tight">
                  Sábados<br />Equivalentes
                </th>
                <th className="py-3 px-3.5 text-center">Puntaje Saber 11</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {estudiantesFiltrados.map((e, idx) => (
                <tr key={e.id} className="hover:bg-amber-50/40">
                  <td className="py-2.5 px-3.5 font-bold text-stone-400 text-center">{e.num || idx + 1}</td>
                  <td className="py-2.5 px-4 font-black text-topo-dark">{e.nombres} {e.apellidos}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      e.estado === "activo" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {e.estado === "activo" ? "Completó" : "Retirado"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-black text-blue-900">{e.totalClasesAsistidas} clases</td>
                  <td className="py-2.5 px-3.5 text-center font-bold text-stone-600">{((e.totalClasesAsistidas || 0) / 4).toFixed(1)}</td>
                  <td className="py-2.5 px-3.5 text-center font-black text-purple-900">{e.puntajeSaber11 ? `${e.puntajeSaber11} pts` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. SÁBANA SABATINA POR CLASES */}
      {tabActiva === "asistencia" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm p-4 space-y-4">
          <div className="overflow-x-auto max-h-[600px] border border-stone-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-stone-900 text-white z-10 text-[10px] font-black uppercase">
                <tr>
                  <th className="py-2 px-3 sticky left-0 bg-stone-900 z-20 w-48">Estudiante</th>
                  <th className="py-2 px-2 text-center border-r border-stone-700 w-16">Total</th>
                  {jornadasOrdenadas.map((j) => (
                    <th key={j.id} className="py-2 px-2 text-center border-r border-stone-700 whitespace-nowrap min-w-[65px]">
                      <span>{j.numeroJornada ? `J#${j.numeroJornada}` : ""}</span>
                      <span className="block text-[8px] opacity-75 font-mono">{j.fechaISO?.slice(5)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {estudiantesFiltrados.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50">
                    <td className="py-2 px-3 font-bold text-topo-dark sticky left-0 bg-white border-r border-stone-200 z-10 truncate max-w-[190px]">
                      {e.nombres} {e.apellidos}
                    </td>
                    <td className="py-2 px-2 text-center font-black text-blue-900 border-r border-stone-200 bg-blue-50/50">
                      {e.totalClasesAsistidas}
                    </td>
                    {jornadasOrdenadas.map((j) => {
                      const iso = j.fechaISO || "";
                      const val = e.asistenciasPorJornada?.[iso] ?? 0;
                      return (
                        <td
                          key={`c-${e.id}-${j.id}`}
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
                          {val > 0 ? `${val}c` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TALLERISTAS QUE PARTICIPARON */}
      {tabActiva === "talleristas" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm p-6 space-y-4">
          <h3 className="text-sm font-black text-topo-dark">Listado de Talleristas y Clases Dictadas en 2026</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {talleristasStats.map((t, idx) => (
              <div key={t.nombre} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-topo-dark block">{t.nombre}</span>
                  <span className="text-[10px] text-stone-500 font-bold">{t.fechas.length} sábados en sede</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-900 font-black text-xs">
                  {t.clasesDictadas} cl
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FECHAS DE COORDINACIÓN E HITOS */}
      {tabActiva === "cronograma" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm p-6 space-y-4">
          <h3 className="text-sm font-black text-topo-dark">Reuniones de Coordinación, Inducción y Cierres en 2026</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jornadas
              .filter((j) => j.caracter === "coordinacion" || j.tipoJornada === "unificada")
              .map((j) => (
                <div key={j.id} className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950">🤝 {j.fecha}</span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                      Coordinación
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 font-bold">
                    {j.descripcionUnificada || j.bloques[0]?.componente || "Reunión de balance y acuerdos"}
                  </p>
                  <span className="text-[10px] text-stone-500 block">Encargado: {j.encargadxDelDia || "Equipo colectivo"}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 6. SÁBANA ACADÉMICA EXACTA COMO EN EL EXCEL */}
      {tabActiva === "sabana_academica" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-warm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-topo-dark">
                Sábana de Horarios, Componentes, Temas y Talleristas 2026
              </h3>
              <p className="text-xs text-stone-500">
                Estructura sabatina idéntica al archivo oficial de cronograma 2026
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-xl">
              36 Jornadas
            </span>
          </div>

          <div className="overflow-x-auto max-h-[650px] border border-stone-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#1B365D] text-white z-20 text-[10px] font-black uppercase">
                <tr>
                  <th className="py-2.5 px-3 sticky left-0 bg-[#1B365D] z-30 min-w-[140px] border-r border-blue-900">
                    CAMPO / BLOQUE
                  </th>
                  {jornadasOrdenadas.map((j) => (
                    <th
                      key={`th-j-${j.id}`}
                      className="py-2.5 px-3 text-center border-r border-blue-900 min-w-[170px] max-w-[210px]"
                    >
                      Jornada {j.numeroJornada}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-[11px]">
                {/* FILA FECHA */}
                <tr className="bg-blue-50/70 font-black">
                  <td className="py-2 px-3 sticky left-0 bg-blue-100 border-r border-stone-300 text-blue-950 uppercase text-[10px]">
                    FECHA
                  </td>
                  {jornadasOrdenadas.map((j) => (
                    <td key={`f-${j.id}`} className="py-2 px-3 text-center border-r border-stone-200 text-stone-800">
                      {j.fecha}
                    </td>
                  ))}
                </tr>

                {/* FILA ENCARGADX DEL DÍA */}
                <tr className="bg-amber-50/70 font-bold">
                  <td className="py-2 px-3 sticky left-0 bg-amber-100 border-r border-stone-300 text-amber-950 uppercase text-[10px]">
                    ENCARGADX DEL DÍA
                  </td>
                  {jornadasOrdenadas.map((j) => (
                    <td key={`enc-${j.id}`} className="py-2 px-3 text-center border-r border-stone-200 text-amber-900 font-black">
                      {j.encargadxDelDia || "—"}
                    </td>
                  ))}
                </tr>

                {/* BLOQUES 1 A 4 */}
                {[0, 1, 2, 3].map((bIdx) => {
                  const titulosBloque = [
                    "BLOQUE 1 (8:00 - 9:30 AM)",
                    "BLOQUE 2 (9:30 - 11:00 AM)",
                    "BLOQUE 3 (11:15 AM - 12:45 PM)",
                    "BLOQUE 4 (1:30 - 3:00 PM)",
                  ];

                  return (
                    <React.Fragment key={`bloque-row-${bIdx}`}>
                      {/* HORAS / ENCABEZADO BLOQUE */}
                      <tr className="bg-stone-100 font-black text-[10px]">
                        <td className="py-1.5 px-3 sticky left-0 bg-stone-200 border-r border-stone-300 text-stone-700 uppercase">
                          {titulosBloque[bIdx]}
                        </td>
                        {jornadasOrdenadas.map((j) => {
                          const b = j.bloques[bIdx];
                          return (
                            <td key={`h-${j.id}-${bIdx}`} className="py-1.5 px-3 text-center border-r border-stone-200 text-stone-600 font-mono text-[10px]">
                              {b?.hora || "—"}
                            </td>
                          );
                        })}
                      </tr>

                      {/* COMPONENTE */}
                      <tr className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 sticky left-0 bg-white border-r border-stone-200 font-bold text-stone-600 text-[10px] uppercase">
                          Componente
                        </td>
                        {jornadasOrdenadas.map((j) => {
                          const b = j.bloques[bIdx];
                          const comp = b?.componente || "";
                          const esUnif = j.tipoJornada === "unificada" && bIdx === 0;

                          return (
                            <td
                              key={`c-${j.id}-${bIdx}`}
                              className={`py-2 px-3 text-center border-r border-stone-200 font-black ${
                                esUnif
                                  ? "bg-purple-50 text-purple-900"
                                  : comp
                                  ? "text-topo-dark"
                                  : "text-stone-300"
                              }`}
                            >
                              {comp ? (
                                <span className="line-clamp-2">{comp}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* TEMA DEL DÍA */}
                      <tr className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 sticky left-0 bg-white border-r border-stone-200 font-bold text-stone-600 text-[10px] uppercase">
                          Tema del Día
                        </td>
                        {jornadasOrdenadas.map((j) => {
                          const b = j.bloques[bIdx];
                          return (
                            <td
                              key={`t-${j.id}-${bIdx}`}
                              className="py-2 px-3 text-center border-r border-stone-200 text-stone-700 text-[10px] leading-tight"
                            >
                              {b?.temaDelDia ? (
                                <span className="line-clamp-3">{b.temaDelDia}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* TALLERISTA */}
                      <tr className="hover:bg-amber-50/30 border-b-2 border-stone-300">
                        <td className="py-2 px-3 sticky left-0 bg-amber-50/80 border-r border-stone-200 font-black text-amber-950 text-[10px] uppercase">
                          Tallerista
                        </td>
                        {jornadasOrdenadas.map((j) => {
                          const b = j.bloques[bIdx];
                          return (
                            <td
                              key={`tal-${j.id}-${bIdx}`}
                              className="py-2 px-3 text-center border-r border-stone-200 font-black text-emerald-800 text-[11px]"
                            >
                              {b?.talleristas ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 inline-block">
                                  {b.talleristas}
                                </span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* FILA COMENTARIOS / NOTAS */}
                <tr className="bg-stone-50 font-bold">
                  <td className="py-2.5 px-3 sticky left-0 bg-stone-100 border-r border-stone-300 text-stone-800 uppercase text-[10px]">
                    COMENTARIOS
                  </td>
                  {jornadasOrdenadas.map((j) => (
                    <td key={`com-${j.id}`} className="py-2 px-3 text-center border-r border-stone-200 text-[10px] text-stone-600 italic leading-tight">
                      {j.comentarios || "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
