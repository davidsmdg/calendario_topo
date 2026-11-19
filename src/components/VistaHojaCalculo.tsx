"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Plus,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import {
  EstadoCronogramaTopo,
  JornadaPedagogica,
  BloqueClase,
  MallaComponente,
} from "@/types";
import {
  obtenerEstiloComponente,
  obtenerNombreDiaSemana,
  ddmmyyyyToISO,
  isoToDDMMYYYY,
  isoToFechaComunitaria,
  ESTILOS_BLOQUES_PERIODO,
  ESTILOS_EXAMENES_CLAVE,
} from "@/utils/festivosColombia";
import { TALLERISTAS_POR_COMPONENTE, obtenerTalleristasDeComponente } from "@/utils/seedData";
import { exportarJornadasAExcel } from "@/services/excelExporter";

interface VistaHojaCalculoProps {
  estado: EstadoCronogramaTopo;
  onActualizarEstado: (nuevo: EstadoCronogramaTopo) => void;
  onVolverAlMenu?: () => void;
}

export function VistaHojaCalculo({
  estado,
  onActualizarEstado,
  onVolverAlMenu,
}: VistaHojaCalculoProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todas" | "clases" | "unificada">("todas");
  const [filtroCiclo, setFiltroCiclo] = useState<"todos" | "ciclo1" | "ciclo2">("todos");
  const [nuevaFechaDateInput, setNuevaFechaDateInput] = useState<string>("");
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  // Lista de materias estándar de la escuela
  const componentesDisponibles = useMemo(() => {
    if (estado.mallaCurricular && estado.mallaCurricular.length > 0) {
      return estado.mallaCurricular.map((m) => m.componente);
    }
    return [
      "ORIENTACIÓN VOCACIONAL",
      "CONTEXTO",
      "MATEMÁTICAS",
      "LENGUAJE",
      "BIOLOGÍA",
      "INGLÉS",
      "QUÍMICA",
      "ANÁLISIS DE LA IMAGEN",
      "FILOSOFÍA",
      "FÍSICA",
    ];
  }, [estado.mallaCurricular]);

  const franjas = useMemo(() => {
    return estado.franjasHorarias && estado.franjasHorarias.length > 0
      ? estado.franjasHorarias
      : ["8:00 AM - 9:30 AM", "9:30 AM - 11:00 AM", "11:15 AM - 12:45 PM", "1:30 PM - 3:00 PM"];
  }, [estado.franjasHorarias]);

  // Jornadas ordenadas cronológicamente
  const jornadasOrdenadas = useMemo(() => {
    const copia = [...estado.jornadas].sort((a, b) => {
      const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });
    return copia.map((j, idx) => ({
      ...j,
      numeroJornada: idx + 1,
      diaSemana: j.diaSemana || obtenerNombreDiaSemana(j.fechaISO || j.fecha) || "Sábado",
    }));
  }, [estado.jornadas]);

  // Filtrado reactivo de columnas
  const jornadasFiltradas = useMemo(() => {
    return jornadasOrdenadas.filter((j) => {
      const iso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
      if (filtroCiclo === "ciclo1" && iso >= "2027-07-01") return false;
      if (filtroCiclo === "ciclo2" && iso < "2027-07-01") return false;

      if (filtroTipo !== "todas" && j.tipoJornada !== filtroTipo) {
        return false;
      }
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const matchBasico =
        (j.fecha || "").toLowerCase().includes(q) ||
        (j.diaSemana || "").toLowerCase().includes(q) ||
        (j.encargadxDelDia || "").toLowerCase().includes(q) ||
        (j.descripcionUnificada || "").toLowerCase().includes(q) ||
        (j.comentarios || "").toLowerCase().includes(q);
      if (matchBasico) return true;
      return j.bloques.some(
        (b) =>
          (b.componente || "").toLowerCase().includes(q) ||
          (b.temaDelDia || "").toLowerCase().includes(q) ||
          (b.talleristas || "").toLowerCase().includes(q)
      );
    });
  }, [jornadasOrdenadas, filtroTipo, filtroCiclo, busqueda]);

  const notificar = (msg: string) => {
    setMensajeFeedback(msg);
    setTimeout(() => setMensajeFeedback(null), 2500);
  };

  // Añadir una nueva fecha / jornada con fecha específica (sábado, entre semana o domingo)
  const handleAgregarColumnaFecha = (fechaISOParam?: string) => {
    const nuevaId = `jornada-${Date.now()}`;
    const iso = fechaISOParam || nuevaFechaDateInput || new Date().toISOString().split("T")[0];
    const fechaTexto = isoToFechaComunitaria(iso);
    const diaCalculado = obtenerNombreDiaSemana(iso) || "Sábado";

    const nuevaJornada: JornadaPedagogica = {
      id: nuevaId,
      numeroJornada: estado.jornadas.length + 1,
      fechaISO: iso,
      fecha: fechaTexto,
      diaSemana: diaCalculado,
      tipoJornada: diaCalculado === "Sábado" ? "clases" : "unificada",
      descripcionUnificada: diaCalculado === "Sábado" ? "" : `REUNIÓN / HITO (${diaCalculado.toUpperCase()})`,
      bloques: franjas.map((hora, idx) => ({
        id: `${nuevaId}-b${idx + 1}`,
        hora,
        componente: "",
        temaDelDia: "",
        talleristas: "",
      })),
      comentarios: "",
    };

    // Insertar y ordenar cronológicamente
    const nuevasJornadas = [...estado.jornadas, nuevaJornada].sort((a, b) => {
      const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });

    onActualizarEstado({
      ...estado,
      jornadas: nuevasJornadas,
    });
    setNuevaFechaDateInput("");
    notificar(`¡Fecha "${fechaTexto}" (${diaCalculado}) agregada en orden cronológico!`);
  };

  // Eliminar fecha / jornada
  const handleEliminarColumna = (jornadaId: string, fecha: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la fecha "${fecha}" de la matriz?`)) {
      onActualizarEstado({
        ...estado,
        jornadas: estado.jornadas.filter((j) => j.id !== jornadaId),
      });
      notificar("Fecha eliminada.");
    }
  };

  // Actualizar celda de nivel superior
  const handleActualizarCelda = (
    jornadaId: string,
    campo: "fecha" | "diaSemana" | "encargado" | "comentarios" | "descripcionUnificada",
    valor: string
  ) => {
    const actualizadas = estado.jornadas.map((j) => {
      if (j.id !== jornadaId) return j;
      if (campo === "fecha") {
        return {
          ...j,
          fecha: valor,
          diaSemana: obtenerNombreDiaSemana(valor) || j.diaSemana,
        };
      }
      if (campo === "diaSemana") return { ...j, diaSemana: valor };
      if (campo === "encargado") return { ...j, encargadxDelDia: valor };
      if (campo === "comentarios") return { ...j, comentarios: valor };
      if (campo === "descripcionUnificada") return { ...j, descripcionUnificada: valor };
      return j;
    });

    onActualizarEstado({
      ...estado,
      jornadas: actualizadas,
    });
  };

  // Actualizar bloque de clase en la tabla
  const handleActualizarBloque = (
    jornadaId: string,
    bloqueIdx: number,
    subcampo: "componente" | "temaDelDia" | "talleristas",
    valor: string
  ) => {
    const actualizadas = estado.jornadas.map((j) => {
      if (j.id !== jornadaId) return j;
      const bloquesCopia = [...j.bloques];
      if (!bloquesCopia[bloqueIdx]) {
        bloquesCopia[bloqueIdx] = {
          id: `${j.id}-b${bloqueIdx + 1}`,
          hora: franjas[bloqueIdx] || "8:00 AM - 9:30 AM",
        };
      }
      bloquesCopia[bloqueIdx] = {
        ...bloquesCopia[bloqueIdx],
        [subcampo]: valor,
      };
      return {
        ...j,
        bloques: bloquesCopia,
      };
    });

    onActualizarEstado({
      ...estado,
      jornadas: actualizadas,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO: HOJA DE CÁLCULO GENERAL EN VIVO
         ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1B365D] via-[#2A4D7D] to-[#12243E] text-white p-6 sm:p-8 shadow-warm-lg border-2 border-white/20 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-400 text-[#1B365D] flex items-center justify-center font-black shadow-lg shrink-0">
              <FileSpreadsheet className="w-9 h-9" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Vista Tabular Global</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Hoja de Cálculo General (Matriz en Vivo)
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Visualiza y edita todas las fechas y clases del año en formato de tabla completa.
                Cualquier cambio que realices aquí se sincroniza automáticamente con el Juego de Tarjetas,
                el Calendario y el archivo Excel descargable.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                exportarJornadasAExcel(
                  estado.jornadas,
                  estado.mallaCurricular,
                  estado.hitos,
                  estado.franjasHorarias,
                  estado.directorioTalleristas || []
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-topo-green hover:bg-emerald-800 text-white font-black text-xs shadow-md transition"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Descargar este Excel</span>
            </button>
          </div>
        </div>
      </div>

      {mensajeFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-topo-green text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {/* =========================================================================
          BARRA DE CONTROLES, BÚSQUEDA Y AÑADIR FECHAS
         ========================================================================= */}
      <div className="bg-white p-4 rounded-3xl border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por fecha, materia, tema, tallerista o comentario..."
            className="w-full pl-10 pr-3 py-2 rounded-2xl border-stone-300 focus:border-matrix-header text-xs font-bold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Ciclo (Ciclo 1 vs Ciclo 2) */}
          {estado.estructuraCalendario?.modalidadCiclo === "dos_ciclos" && (
            <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1 border border-[#E2DCCE]">
              <button
                type="button"
                onClick={() => setFiltroCiclo("todos")}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  filtroCiclo === "todos"
                    ? "bg-[#1B365D] text-white shadow-xs"
                    : "text-stone-700 hover:bg-white"
                }`}
              >
                Todo el Año
              </button>
              <button
                type="button"
                onClick={() => setFiltroCiclo("ciclo1")}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  filtroCiclo === "ciclo1"
                    ? "bg-[#1B365D] text-white shadow-xs"
                    : "text-stone-700 hover:bg-white"
                }`}
              >
                {estado.estructuraCalendario.nombreCiclo1 || "Ciclo I (Feb - Jun)"}
              </button>
              <button
                type="button"
                onClick={() => setFiltroCiclo("ciclo2")}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  filtroCiclo === "ciclo2"
                    ? "bg-[#1B365D] text-white shadow-xs"
                    : "text-stone-700 hover:bg-white"
                }`}
              >
                {estado.estructuraCalendario.nombreCiclo2 || "Ciclo II (Jul - Nov)"}
              </button>
            </div>
          )}

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="rounded-2xl border-stone-300 text-xs font-bold py-2 px-3 bg-[#F6F2E9]"
          >
            <option value="todas">Todas las Fechas ({jornadasFiltradas.length})</option>
            <option value="clases">Solo Sábados de Clases</option>
            <option value="unificada">Solo Jornadas Unificadas</option>
          </select>

          {/* Selector visual para añadir cualquier fecha intermedia o sábado */}
          <div className="flex items-center gap-1.5 bg-[#F6F2E9] px-2.5 py-1 rounded-2xl border border-[#E2DCCE]">
            <input
              type="date"
              value={nuevaFechaDateInput}
              onChange={(e) => setNuevaFechaDateInput(e.target.value)}
              className="text-xs py-1 px-2 rounded-xl border-stone-300 bg-white font-bold"
            />
            <button
              type="button"
              onClick={() => handleAgregarColumnaFecha()}
              disabled={!nuevaFechaDateInput}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-topo-green hover:bg-emerald-800 disabled:opacity-40 text-white font-black text-xs shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Fecha</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABLA TIPO EXCEL COMPLETA
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-4 sm:p-5">
        <div className="overflow-x-auto border-2 border-stone-300 rounded-2xl max-h-[680px] shadow-inner bg-stone-50">
          <table className="w-full border-collapse text-xs select-none">
            {/* CABECERAS DE COLUMNAS */}
            <thead className="sticky top-0 z-20 bg-[#1B365D] text-white">
              <tr>
                <th className="sticky left-0 z-30 bg-[#1B365D] px-3 py-2.5 font-black text-center min-w-[190px] border-r-2 border-slate-600 shadow-sm">
                  CAMPO / ESTRUCTURA
                </th>
                {jornadasFiltradas.map((jornada, idx) => (
                  <th
                    key={jornada.id}
                    className="px-3 py-2.5 font-black text-center min-w-[240px] border-r border-slate-600/80"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>JORNADA #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarColumna(jornada.id, jornada.fecha || "")}
                        className="text-rose-300 hover:text-white p-0.5 rounded transition"
                        title="Eliminar esta fecha"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* FILA 0: CARÁCTER Y PERÍODO DE LA JORNADA (EDITABLE CON 1 CLIC) */}
              <tr className="border-b-2 border-slate-600 bg-slate-900 text-white">
                <td className="sticky left-0 z-10 bg-[#0F172A] text-amber-300 font-black px-3 py-2 border-r-2 border-slate-600 text-xs">
                  📌 CARÁCTER DEL DÍA
                </td>
                {jornadasFiltradas.map((jornada) => {
                  const iso = jornada.fechaISO || ddmmyyyyToISO(jornada.fecha);
                  const periodoDef = estado.estructuraCalendario?.periodosTemporales.find(
                    (p) => iso && iso >= p.fechaInicio && iso <= p.fechaFin
                  );
                  const examenDef = estado.estructuraCalendario?.fechasClaveExamenes.find((e) => {
                    const eIso = ddmmyyyyToISO(e.fecha);
                    return eIso === iso;
                  });

                  // Carácter efectivo de este día
                  const caracterActual =
                    jornada.caracter ||
                    (examenDef
                      ? "examen"
                      : periodoDef
                      ? (periodoDef.tipo as any)
                      : jornada.tipoJornada === "unificada"
                      ? "coordinacion"
                      : "clases");

                  return (
                    <td
                      key={`${jornada.id}-periodo`}
                      className={`p-1.5 border-r border-slate-700 text-center font-black text-xs ${
                        caracterActual === "examen"
                          ? "bg-purple-900 text-purple-200"
                          : caracterActual === "vacaciones"
                          ? "bg-amber-900/80 text-amber-200"
                          : caracterActual === "coordinacion"
                          ? "bg-indigo-900/80 text-indigo-200"
                          : "bg-emerald-950 text-emerald-200"
                      }`}
                    >
                      <select
                        value={caracterActual}
                        onChange={(e) => {
                          const nuevoCar = e.target.value as any;
                          const esUnificada = nuevoCar !== "clases";
                          const actualizadas: JornadaPedagogica[] = estado.jornadas.map((x) =>
                            x.id === jornada.id
                              ? {
                                  ...x,
                                  caracter: nuevoCar,
                                  tipoJornada: (esUnificada ? "unificada" : "clases") as "unificada" | "clases",
                                  descripcionUnificada:
                                    x.descripcionUnificada ||
                                    (nuevoCar === "vacaciones"
                                      ? "RECESO ESCOLAR / VACACIONES"
                                      : nuevoCar === "coordinacion"
                                      ? "REUNIÓN DE COORDINACIÓN / FORMACIÓN PEDAGÓGICA"
                                      : nuevoCar === "examen"
                                      ? "JORNADA DE EVALUACIÓN / EXAMEN OFICIAL"
                                      : ""),
                                }
                              : x
                          );
                          onActualizarEstado({ ...estado, jornadas: actualizadas });
                          notificar(`Jornada convertida a "${nuevoCar.toUpperCase()}"`);
                        }}
                        className="w-full text-center px-1.5 py-1 text-xs font-black rounded-lg bg-black/40 border border-white/20 text-white cursor-pointer hover:bg-black/60 focus:outline-none"
                      >
                        <option value="clases" className="bg-emerald-900 text-white">📚 Clases (4 Bloques)</option>
                        <option value="vacaciones" className="bg-amber-900 text-white">🏖️ Receso / Vacaciones</option>
                        <option value="coordinacion" className="bg-indigo-900 text-white">👥 Coordinación / Hito</option>
                        <option value="examen" className="bg-purple-900 text-white">🎓 Examen / Simulacro</option>
                      </select>
                    </td>
                  );
                })}
              </tr>

              {/* FILA 1: FECHA CON SELECTOR RÁPIDO */}
              <tr className="border-b border-stone-200 bg-white">
                <td className="sticky left-0 z-10 bg-[#2A4D7D] text-white font-black px-3 py-2 border-r-2 border-slate-600">
                  📅 FECHA
                </td>
                {jornadasFiltradas.map((jornada) => {
                  const currentISO = jornada.fechaISO || ddmmyyyyToISO(jornada.fecha) || "";
                  return (
                    <td key={`${jornada.id}-fecha`} className="p-1 border-r border-stone-200">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={jornada.fecha || ""}
                          onChange={(e) => handleActualizarCelda(jornada.id, "fecha", e.target.value)}
                          placeholder="DD/MM/2027"
                          className="flex-1 px-1.5 py-1 text-xs font-bold rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                        />
                        {/* Selector de calendario nativo */}
                        <input
                          type="date"
                          value={currentISO}
                          onChange={(e) => {
                            if (e.target.value) {
                              const texto = isoToFechaComunitaria(e.target.value);
                              const dia = obtenerNombreDiaSemana(e.target.value);
                              const actualizadas = estado.jornadas.map((x) =>
                                x.id === jornada.id
                                  ? {
                                      ...x,
                                      fechaISO: e.target.value,
                                      fecha: texto,
                                      diaSemana: dia,
                                    }
                                  : x
                              );
                              onActualizarEstado({ ...estado, jornadas: actualizadas });
                            }
                          }}
                          className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer p-0 border-0 bg-transparent"
                          title="Cambiar fecha desde mini-calendario"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* FILA 2: DÍA DE LA SEMANA */}
              <tr className="border-b border-stone-200 bg-stone-50">
                <td className="sticky left-0 z-10 bg-[#D9E2EC] text-[#1B365D] font-black px-3 py-2 border-r-2 border-slate-400">
                  🗓️ DÍA DE LA SEMANA
                </td>
                {jornadasFiltradas.map((jornada) => (
                  <td key={`${jornada.id}-dia`} className="p-1 border-r border-stone-200">
                    <input
                      type="text"
                      value={jornada.diaSemana || ""}
                      onChange={(e) => handleActualizarCelda(jornada.id, "diaSemana", e.target.value)}
                      className="w-full px-2 py-1 text-xs font-black rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent text-center"
                    />
                  </td>
                ))}
              </tr>

              {/* FILA 3: ENCARGADX DEL DÍA */}
              <tr className="border-b border-stone-200 bg-white">
                <td className="sticky left-0 z-10 bg-[#EAF0F6] text-[#1B365D] font-black px-3 py-2 border-r-2 border-slate-400">
                  👤 ENCARGADX DEL DÍA
                </td>
                {jornadasFiltradas.map((jornada) => (
                  <td key={`${jornada.id}-encargado`} className="p-1 border-r border-stone-200">
                    <input
                      type="text"
                      value={jornada.encargadxDelDia || ""}
                      onChange={(e) => handleActualizarCelda(jornada.id, "encargado", e.target.value)}
                      placeholder="Nombre del responsable..."
                      className="w-full px-2 py-1 text-xs font-bold rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                    />
                  </td>
                ))}
              </tr>

              {/* FILAS DE CADA BLOQUE DE CLASE */}
              {franjas.map((horaFranja, bIdx) => (
                <React.Fragment key={`bloque-calc-${bIdx}`}>
                  {/* HORA */}
                  <tr className="bg-[#EEF4FA] border-b border-stone-200">
                    <td className="sticky left-0 z-10 bg-[#D4E3F5] text-[#1B365D] font-black px-3 py-1.5 border-r-2 border-slate-400 text-[11px]">
                      ⏰ BLOQUE {bIdx + 1} ({horaFranja})
                    </td>
                    {jornadasFiltradas.map((jornada) => (
                      <td key={`${jornada.id}-b${bIdx}-h`} className="px-2 py-1 border-r border-stone-200 text-center font-bold text-stone-600 text-[10px]">
                        {jornada.tipoJornada === "unificada" ? "JORNADA UNIFICADA" : (jornada.bloques[bIdx]?.hora || horaFranja)}
                      </td>
                    ))}
                  </tr>

                  {/* COMPONENTE CON SELECTOR DROPDOWN O INDICADOR DE CARÁCTER */}
                  <tr className="bg-white border-b border-stone-200">
                    <td className="sticky left-0 z-10 bg-[#1B365D] text-white font-black px-3 py-1.5 border-r-2 border-slate-600 text-[11px]">
                      📚 Componente B{bIdx + 1}
                    </td>
                    {jornadasFiltradas.map((jornada) => {
                      const bloque = jornada.bloques[bIdx];
                      const estilo = obtenerEstiloComponente(bloque?.componente);
                      const esNoClase = jornada.tipoJornada === "unificada";

                      if (esNoClase) {
                        return (
                          <td
                            key={`${jornada.id}-b${bIdx}-comp`}
                            className={`p-1 border-r border-stone-200 text-center ${
                              jornada.caracter === "vacaciones"
                                ? "bg-amber-100/60 text-amber-900"
                                : jornada.caracter === "coordinacion"
                                ? "bg-indigo-100/60 text-indigo-900"
                                : "bg-purple-100/60 text-purple-900"
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase">
                              {jornada.caracter === "vacaciones"
                                ? "🏖️ Receso Escolar"
                                : jornada.caracter === "coordinacion"
                                ? "👥 Coordinación"
                                : "🎓 Jornada Evaluación"}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={`${jornada.id}-b${bIdx}-comp`} className={`p-1 border-r border-stone-200 ${bloque?.componente ? estilo.bg : ""}`}>
                          <select
                            value={bloque?.componente || ""}
                            onChange={(e) => handleActualizarBloque(jornada.id, bIdx, "componente", e.target.value)}
                            className="w-full px-1.5 py-1 text-xs font-black rounded border-stone-300 focus:border-matrix-header bg-white text-topo-dark cursor-pointer"
                          >
                            <option value="">— Elegir Componente —</option>
                            {componentesDisponibles.map((comp) => (
                              <option key={comp} value={comp}>
                                {comp}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>

                  {/* TEMA DEL DÍA CON SELECTOR RÁPIDO DE SESIÓN DE LA MALLA O TEXTO LIBRE */}
                  <tr className="bg-white border-b border-stone-200">
                    <td className="sticky left-0 z-10 bg-stone-100 text-stone-800 font-bold px-3 py-1.5 border-r-2 border-slate-400 text-[11px]">
                      📝 Tema del Día B{bIdx + 1}
                    </td>
                    {jornadasFiltradas.map((jornada) => {
                      const bloque = jornada.bloques[bIdx];
                      // Obtener temas oficiales (sesiones 1 a 11) de este componente desde la Malla Curricular
                      const filaMalla = estado.mallaCurricular.find(
                        (m) => m.componente.toUpperCase() === (bloque?.componente || "").toUpperCase()
                      );
                      const sesionesMalla = (filaMalla?.sesiones || []).filter((s) => Boolean(s?.trim()));

                      return (
                        <td key={`${jornada.id}-b${bIdx}-tema`} className="p-1 border-r border-stone-200">
                          {jornada.tipoJornada === "unificada" ? (
                            <input
                              type="text"
                              value={jornada.descripcionUnificada || ""}
                              onChange={(e) => handleActualizarCelda(jornada.id, "descripcionUnificada", e.target.value)}
                              placeholder="Descripción jornada unificada..."
                              className="w-full px-2 py-1 text-xs font-bold bg-amber-50 rounded"
                            />
                          ) : (
                            <div className="space-y-1">
                              <input
                                type="text"
                                list={`lista-temas-${jornada.id}-${bIdx}`}
                                value={bloque?.temaDelDia || ""}
                                onChange={(e) => handleActualizarBloque(jornada.id, bIdx, "temaDelDia", e.target.value)}
                                placeholder={
                                  bloque?.componente
                                    ? `Sesión o tema de ${bloque.componente}...`
                                    : "Elige componente primero..."
                                }
                                className="w-full px-2 py-1 text-xs font-medium rounded border border-stone-200 hover:border-stone-400 focus:border-matrix-header bg-white"
                              />
                              {sesionesMalla.length > 0 && (
                                <datalist id={`lista-temas-${jornada.id}-${bIdx}`}>
                                  {sesionesMalla.map((ses, sIdx) => (
                                    <option key={`${ses}-${sIdx}`} value={`Sesión ${sIdx + 1}: ${ses}`} />
                                  ))}
                                </datalist>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* TALLERISTA EXCLUSIVO DEL COMPONENTE SELECCIONADO */}
                  <tr className="bg-stone-50 border-b border-stone-300">
                    <td className="sticky left-0 z-10 bg-stone-200 text-stone-800 font-bold px-3 py-1.5 border-r-2 border-slate-400 text-[11px]">
                      👥 Tallerista B{bIdx + 1}
                    </td>
                    {jornadasFiltradas.map((jornada) => {
                      const bloque = jornada.bloques[bIdx];
                      const compNormalizado = (bloque?.componente || "").trim().toUpperCase();

                      // Talleristas filtrados EXCLUSIVAMENTE para este componente
                      const talleristasDelComponente: string[] = (() => {
                        if (!compNormalizado) return [];
                        // 1. Del directorio personalizado
                        const delDirectorio = (estado.directorioTalleristas || [])
                          .filter((t) =>
                            t.componentes?.some((c) => c.toUpperCase() === compNormalizado)
                          )
                          .map((t) => t.nombre);

                        // 2. De la Malla Curricular base
                        const deMalla =
                          estado.mallaCurricular.find(
                            (m) => m.componente.toUpperCase() === compNormalizado
                          )?.talleristasBase || [];

                        // 3. Del mapeo semilla oficial
                        const deSeed = TALLERISTAS_POR_COMPONENTE[compNormalizado] || [];

                        const union = Array.from(new Set([...delDirectorio, ...deMalla, ...deSeed]));
                        return union;
                      })();

                      return (
                        <td key={`${jornada.id}-b${bIdx}-tall`} className="p-1 border-r border-stone-200">
                          {jornada.tipoJornada === "unificada" ? (
                            <span className="text-[10px] text-stone-400 italic px-2 block">Unificada</span>
                          ) : (
                            <div className="space-y-1">
                              {/* Selector dropdown directo con los talleristas de ese componente */}
                              <select
                                value={bloque?.talleristas || ""}
                                onChange={(e) => handleActualizarBloque(jornada.id, bIdx, "talleristas", e.target.value)}
                                className={`w-full px-1.5 py-1 text-xs font-bold rounded border cursor-pointer ${
                                  bloque?.talleristas
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                    : "bg-white text-stone-600 border-stone-300"
                                }`}
                              >
                                <option value="">
                                  {compNormalizado
                                    ? talleristasDelComponente.length > 0
                                      ? `— Elegir Tallerista (${talleristasDelComponente.length} disponibles) —`
                                      : "— Sin talleristas registrados para esta materia —"
                                    : "— Primero elige el componente —"}
                                </option>
                                {talleristasDelComponente.map((nom) => (
                                  <option key={nom} value={nom}>
                                    👤 {nom}
                                  </option>
                                ))}
                                <option value="__otro__">✍️ Escribir otro nombre...</option>
                              </select>

                              {/* Input secundario solo si eligió otro nombre personalizado */}
                              {(bloque?.talleristas === "__otro__" ||
                                (bloque?.talleristas &&
                                  !talleristasDelComponente.includes(bloque.talleristas))) && (
                                <input
                                  type="text"
                                  value={bloque?.talleristas === "__otro__" ? "" : bloque?.talleristas || ""}
                                  onChange={(e) => handleActualizarBloque(jornada.id, bIdx, "talleristas", e.target.value)}
                                  placeholder="Escribe el nombre del tallerista..."
                                  className="w-full px-2 py-0.5 text-xs font-bold border-amber-400 bg-amber-50 rounded"
                                  autoFocus
                                />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}

              {/* FILA FINAL: COMENTARIOS */}
              <tr className="bg-amber-50/60">
                <td className="sticky left-0 z-10 bg-[#1B365D] text-white font-black px-3 py-2 border-r-2 border-slate-600">
                  💬 COMENTARIOS
                </td>
                {jornadasFiltradas.map((jornada) => (
                  <td key={`${jornada.id}-com`} className="p-1 border-r border-stone-200">
                    <textarea
                      rows={2}
                      value={jornada.comentarios || ""}
                      onChange={(e) => handleActualizarCelda(jornada.id, "comentarios", e.target.value)}
                      placeholder="Tareas, simulacros, acuerdos..."
                      className="w-full px-2 py-1 text-xs rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent resize-y"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
