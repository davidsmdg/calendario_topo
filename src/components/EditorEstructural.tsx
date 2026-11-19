"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  Save,
  CheckCircle2,
  ArrowUpDown,
  Sparkles,
  Layers,
  Settings2,
  Download,
  AlertCircle,
  Table as TableIcon,
  Search,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  ChevronDown,
  ChevronUp,
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
} from "@/utils/festivosColombia";
import { exportarJornadasAExcel } from "@/services/excelExporter";

interface EditorEstructuralProps {
  estado: EstadoCronogramaTopo;
  onActualizarEstado: (nuevo: EstadoCronogramaTopo) => void;
  onVolverAlMenu?: () => void;
}

export function EditorEstructural({
  estado,
  onActualizarEstado,
  onVolverAlMenu,
}: EditorEstructuralProps) {
  // Franjas horarias estructurales (base por defecto si no existen)
  const franjasIniciales = useMemo(() => {
    if (estado.franjasHorarias && estado.franjasHorarias.length > 0) {
      return [...estado.franjasHorarias];
    }
    return [
      "8:00 AM - 9:30 AM",
      "9:30 AM - 11:00 AM",
      "11:15 AM - 12:45 PM",
      "1:30 PM - 3:00 PM",
    ];
  }, [estado.franjasHorarias]);

  const [franjas, setFranjas] = useState<string[]>(franjasIniciales);
  const [nuevaFranjaTexto, setNuevaFranjaTexto] = useState("");
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Estados para la vista tipo Excel Interactiva
  const [busquedaExcel, setBusquedaExcel] = useState("");
  const [filtroTipoJornada, setFiltroTipoJornada] = useState<"todas" | "clases" | "unificada">("todas");
  const [celdaEditando, setCeldaEditando] = useState<{
    jornadaId: string;
    campo: string;
    bloqueIdx?: number;
  } | null>(null);

  // Fechas ordenadas para la vista Excel
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

  // Filtrado para la vista interactiva tipo Excel
  const jornadasFiltradasExcel = useMemo(() => {
    return jornadasOrdenadas.filter((j) => {
      if (filtroTipoJornada !== "todas" && j.tipoJornada !== filtroTipoJornada) {
        return false;
      }
      if (!busquedaExcel.trim()) return true;
      const q = busquedaExcel.toLowerCase();
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
  }, [jornadasOrdenadas, filtroTipoJornada, busquedaExcel]);

  // Modificar una franja horaria en la lista local
  const handleEditarFranja = (index: number, nuevoValor: string) => {
    const copia = [...franjas];
    copia[index] = nuevoValor;
    setFranjas(copia);
  };

  // Agregar una nueva franja horaria (creando automáticamente un bloque adicional a todas las clases)
  const handleAgregarFranja = () => {
    if (!nuevaFranjaTexto.trim()) return;
    setFranjas([...franjas, nuevaFranjaTexto.trim()]);
    setNuevaFranjaTexto("");
  };

  // Eliminar una franja horaria
  const handleEliminarFranja = (index: number) => {
    if (franjas.length <= 1) {
      alert("Debe existir al menos una franja horaria.");
      return;
    }
    const copia = franjas.filter((_, i) => i !== index);
    setFranjas(copia);
  };

  /**
   * Aplicar la nueva estructura horaria a TODO el calendario:
   * 1. Actualiza cada bloque de cada jornada existente con las nuevas horas de inicio/fin.
   * 2. Si se añadieron franjas, añade los nuevos bloques correspondientes a cada jornada.
   * 3. Si se redujeron franjas, ajusta la longitud.
   */
  const handleAplicarEstructuraATodoElCalendario = () => {
    const nuevasJornadas: JornadaPedagogica[] = estado.jornadas.map((jornada) => {
      if (jornada.tipoJornada === "unificada") {
        return jornada;
      }

      // Reconstruir los bloques de la jornada según las nuevas franjas estructurales
      const nuevosBloques: BloqueClase[] = franjas.map((horaFranja, idx) => {
        const bloquePrevio = jornada.bloques[idx];
        return {
          id: bloquePrevio?.id || `${jornada.id}-b${idx + 1}-${Date.now()}`,
          hora: horaFranja,
          componente: bloquePrevio?.componente || "",
          temaDelDia: bloquePrevio?.temaDelDia || "",
          talleristas: bloquePrevio?.talleristas || "",
        };
      });

      return {
        ...jornada,
        bloques: nuevosBloques,
      };
    });

    const nuevoEstado: EstadoCronogramaTopo = {
      ...estado,
      franjasHorarias: franjas,
      jornadas: nuevasJornadas,
    };

    onActualizarEstado(nuevoEstado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2500);
  };

  // Agregar una nueva fecha / jornada (columna en la sábana)
  const handleAgregarNuevaFecha = () => {
    const nuevaId = `jornada-${Date.now()}`;
    const nuevaJornada: JornadaPedagogica = {
      id: nuevaId,
      numeroJornada: estado.jornadas.length + 1,
      fecha: "Nueva Fecha 2027",
      diaSemana: "Sábado",
      tipoJornada: "clases",
      bloques: franjas.map((hora, idx) => ({
        id: `${nuevaId}-b${idx + 1}`,
        hora,
        componente: "",
        temaDelDia: "",
        talleristas: "",
      })),
      comentarios: "",
    };

    onActualizarEstado({
      ...estado,
      jornadas: [...estado.jornadas, nuevaJornada],
    });
  };

  // Actualizar directamente una celda de la vista tipo Excel
  const handleActualizarCeldaExcel = (
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

  // Actualizar un bloque específico desde la tabla Excel
  const handleActualizarBloqueExcel = (
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

  // Eliminar una fecha / jornada desde la tabla
  const handleEliminarJornada = (jornadaId: string, fecha: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la jornada del "${fecha}"?`)) {
      onActualizarEstado({
        ...estado,
        jornadas: estado.jornadas.filter((j) => j.id !== jornadaId),
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =========================================================================
          CABECERA HERO: EDICIÓN ESTRUCTURAL DEL CALENDARIO Y VISTA TIPO EXCEL
         ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1B365D] via-[#2A4D7D] to-[#12243E] text-white p-6 sm:p-8 shadow-warm-lg border-2 border-white/20 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E5A93B] text-[#2B2623] flex items-center justify-center font-black shadow-lg shrink-0">
              <Settings2 className="w-9 h-9" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Configuración de Estructura Maestra</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Editar Estructura del Calendario & Vista Tipo Excel
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Cambia las horas de inicio y fin de las clases para <strong>todo el año de forma automática</strong>,
                añade o remueve franjas horarias y edita todas las fechas en una cuadrícula tipo hoja de cálculo
                sincronizada en tiempo real con las tarjetas y el archivo Excel descargable.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => exportarJornadasAExcel(estado.jornadas, estado.mallaCurricular, estado.hitos, franjas)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-topo-green hover:bg-emerald-800 text-white font-black text-xs shadow-md transition"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Descargar Excel con esta estructura</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANEL 1: CONFIGURACIÓN ESTRUCTURAL DE FRANJAS HORARIAS (APLICA A TODO)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-topo-terracotta" />
              <h3 className="text-lg font-black text-topo-dark">
                Franjas Horarias de Clase (Estructura Global)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Si cambias una hora aquí (ej. iniciar a las 9:00 AM o clases de 2 horas), se aplicará a todas
              las {estado.jornadas.length} jornadas del año al pulsar "Guardar y Aplicar".
            </p>
          </div>

          <button
            type="button"
            onClick={handleAplicarEstructuraATodoElCalendario}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-black text-sm shadow-md transition transform active:scale-95"
          >
            <Save className="w-4 h-4 text-topo-dark" />
            <span>Guardar y Aplicar a Todo el Calendario</span>
          </button>
        </div>

        {guardadoExitoso && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-topo-green text-xs font-black flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Estructura horaria actualizada exitosamente en todas las jornadas y tarjetas!</span>
          </div>
        )}

        {/* Lista de Franjas Actuales Editables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {franjas.map((hora, idx) => (
            <div
              key={`franja-${idx}`}
              className="p-3.5 rounded-2xl bg-stone-50 border-2 border-stone-200 hover:border-topo-mustard transition flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-matrix-header">
                  Franja {idx + 1}
                </span>
                {franjas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleEliminarFranja(idx)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition"
                    title="Eliminar esta franja horaria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={hora}
                onChange={(e) => handleEditarFranja(idx, e.target.value)}
                placeholder="Ej: 8:00 AM - 9:30 AM"
                className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-black text-topo-dark focus:border-matrix-header bg-white"
              />
            </div>
          ))}
        </div>

        {/* Añadir Nueva Franja / Fila de Clase */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <input
            type="text"
            value={nuevaFranjaTexto}
            onChange={(e) => setNuevaFranjaTexto(e.target.value)}
            placeholder="Añadir nueva franja (ej. 3:15 PM - 4:45 PM)..."
            className="flex-1 max-w-sm px-3.5 py-2 rounded-2xl border-stone-300 text-xs font-bold"
          />
          <button
            type="button"
            onClick={handleAgregarFranja}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#2A4D7D] hover:bg-[#1B365D] text-white font-black text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Franja Horaria</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PANEL 2: VISTA INTERACTIVA TIPO EXCEL (MATRIZ COMPLETA EDITABLE)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-topo-green font-black">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-topo-dark">
                Vista de Edición Rápida Tipo Hoja de Cálculo
              </h3>
              <p className="text-xs text-stone-500">
                Haz doble clic o escribe en cualquier celda para modificar fechas, temas, componentes o notas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buscador de celdas */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaExcel}
                onChange={(e) => setBusquedaExcel(e.target.value)}
                placeholder="Buscar fecha, materia..."
                className="pl-9 pr-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold"
              />
            </div>

            {/* Filtro de tipo */}
            <select
              value={filtroTipoJornada}
              onChange={(e) => setFiltroTipoJornada(e.target.value as any)}
              className="rounded-xl border-stone-300 text-xs font-bold py-1.5 px-2.5 bg-stone-50"
            >
              <option value="todas">Todas las fechas ({jornadasOrdenadas.length})</option>
              <option value="clases">Solo Sábados de Clases</option>
              <option value="unificada">Solo Jornadas Unificadas</option>
            </select>

            {/* Añadir nueva columna / fecha */}
            <button
              type="button"
              onClick={handleAgregarNuevaFecha}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-topo-green hover:bg-emerald-800 text-white font-black text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Fecha (Columna)</span>
            </button>
          </div>
        </div>

        {/* Tabla Cuadrícula Tipo Excel */}
        <div className="overflow-x-auto border-2 border-stone-300 rounded-2xl max-h-[620px] shadow-inner bg-stone-50">
          <table className="w-full border-collapse text-xs select-none">
            {/* ENCABEZADOS DE COLUMNAS (1 Columna = 1 Fecha) */}
            <thead className="sticky top-0 z-20 bg-[#1B365D] text-white">
              <tr>
                <th className="sticky left-0 z-30 bg-[#1B365D] px-3 py-2.5 font-black text-center min-w-[190px] border-r-2 border-slate-600 shadow-sm">
                  CAMPO / ESTRUCTURA
                </th>
                {jornadasFiltradasExcel.map((jornada, idx) => (
                  <th
                    key={jornada.id}
                    className="px-3 py-2.5 font-black text-center min-w-[240px] border-r border-slate-600/80"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>JORNADA #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarJornada(jornada.id, jornada.fecha || "")}
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
              {/* FILA 1: FECHA */}
              <tr className="border-b border-stone-200 bg-white">
                <td className="sticky left-0 z-10 bg-[#2A4D7D] text-white font-black px-3 py-2 border-r-2 border-slate-600">
                  📅 FECHA
                </td>
                {jornadasFiltradasExcel.map((jornada) => (
                  <td key={`${jornada.id}-fecha`} className="p-1 border-r border-stone-200">
                    <input
                      type="text"
                      value={jornada.fecha || ""}
                      onChange={(e) => handleActualizarCeldaExcel(jornada.id, "fecha", e.target.value)}
                      placeholder="DD/MM/2027"
                      className="w-full px-2 py-1 text-xs font-bold rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                    />
                  </td>
                ))}
              </tr>

              {/* FILA 2: DÍA DE LA SEMANA */}
              <tr className="border-b border-stone-200 bg-stone-50">
                <td className="sticky left-0 z-10 bg-[#D9E2EC] text-[#1B365D] font-black px-3 py-2 border-r-2 border-slate-400">
                  🗓️ DÍA DE LA SEMANA
                </td>
                {jornadasFiltradasExcel.map((jornada) => (
                  <td key={`${jornada.id}-dia`} className="p-1 border-r border-stone-200">
                    <input
                      type="text"
                      value={jornada.diaSemana || ""}
                      onChange={(e) => handleActualizarCeldaExcel(jornada.id, "diaSemana", e.target.value)}
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
                {jornadasFiltradasExcel.map((jornada) => (
                  <td key={`${jornada.id}-encargado`} className="p-1 border-r border-stone-200">
                    <input
                      type="text"
                      value={jornada.encargadxDelDia || ""}
                      onChange={(e) => handleActualizarCeldaExcel(jornada.id, "encargado", e.target.value)}
                      placeholder="Nombre del responsable..."
                      className="w-full px-2 py-1 text-xs font-bold rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                    />
                  </td>
                ))}
              </tr>

              {/* FILAS DE CADA BLOQUE DE CLASE (DINÁMICAS SEGÚN FRANJAS) */}
              {franjas.map((horaFranja, bIdx) => (
                <React.Fragment key={`bloque-row-${bIdx}`}>
                  {/* Subfila: HORA DE LA FRANJA */}
                  <tr className="bg-[#EEF4FA] border-b border-stone-200">
                    <td className="sticky left-0 z-10 bg-[#D4E3F5] text-[#1B365D] font-black px-3 py-1.5 border-r-2 border-slate-400 text-[11px]">
                      ⏰ BLOQUE {bIdx + 1} ({horaFranja})
                    </td>
                    {jornadasFiltradasExcel.map((jornada) => (
                      <td key={`${jornada.id}-b${bIdx}-hora`} className="px-2 py-1 border-r border-stone-200 text-center font-bold text-stone-600 text-[10px]">
                        {jornada.tipoJornada === "unificada" ? "JORNADA UNIFICADA" : (jornada.bloques[bIdx]?.hora || horaFranja)}
                      </td>
                    ))}
                  </tr>

                  {/* Subfila: COMPONENTE / MATERIA */}
                  <tr className="bg-white border-b border-stone-200">
                    <td className="sticky left-0 z-10 bg-[#1B365D] text-white font-black px-3 py-1.5 border-r-2 border-slate-600 text-[11px]">
                      📚 Componente B{bIdx + 1}
                    </td>
                    {jornadasFiltradasExcel.map((jornada) => {
                      const bloque = jornada.bloques[bIdx];
                      const estilo = obtenerEstiloComponente(bloque?.componente);
                      return (
                        <td key={`${jornada.id}-b${bIdx}-comp`} className={`p-1 border-r border-stone-200 ${bloque?.componente ? estilo.bg : ""}`}>
                          {jornada.tipoJornada === "unificada" ? (
                            <span className="text-[11px] text-stone-400 italic px-2 block">Unificada</span>
                          ) : (
                            <input
                              type="text"
                              value={bloque?.componente || ""}
                              onChange={(e) => handleActualizarBloqueExcel(jornada.id, bIdx, "componente", e.target.value)}
                              placeholder="Ej: MATEMÁTICAS"
                              className="w-full px-2 py-1 text-xs font-black rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Subfila: TEMA DEL DÍA */}
                  <tr className="bg-white border-b border-stone-200">
                    <td className="sticky left-0 z-10 bg-stone-100 text-stone-800 font-bold px-3 py-1.5 border-r-2 border-slate-400 text-[11px]">
                      📝 Tema del Día B{bIdx + 1}
                    </td>
                    {jornadasFiltradasExcel.map((jornada) => {
                      const bloque = jornada.bloques[bIdx];
                      return (
                        <td key={`${jornada.id}-b${bIdx}-tema`} className="p-1 border-r border-stone-200">
                          {jornada.tipoJornada === "unificada" ? (
                            <input
                              type="text"
                              value={jornada.descripcionUnificada || ""}
                              onChange={(e) => handleActualizarCeldaExcel(jornada.id, "descripcionUnificada", e.target.value)}
                              placeholder="Descripción jornada unificada..."
                              className="w-full px-2 py-1 text-xs font-bold bg-amber-50 rounded"
                            />
                          ) : (
                            <input
                              type="text"
                              value={bloque?.temaDelDia || ""}
                              onChange={(e) => handleActualizarBloqueExcel(jornada.id, bIdx, "temaDelDia", e.target.value)}
                              placeholder="Tema o sesión..."
                              className="w-full px-2 py-1 text-xs font-medium rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Subfila: TALLERISTA */}
                  <tr className="bg-stone-50 border-b border-stone-300">
                    <td className="sticky left-0 z-10 bg-stone-200 text-stone-800 font-bold px-3 py-1.5 border-r-2 border-slate-400 text-[11px]">
                      👥 Tallerista B{bIdx + 1}
                    </td>
                    {jornadasFiltradasExcel.map((jornada) => {
                      const bloque = jornada.bloques[bIdx];
                      return (
                        <td key={`${jornada.id}-b${bIdx}-tall`} className="p-1 border-r border-stone-200">
                          <input
                            type="text"
                            value={bloque?.talleristas || ""}
                            onChange={(e) => handleActualizarBloqueExcel(jornada.id, bIdx, "talleristas", e.target.value)}
                            placeholder="Nombre tallerista..."
                            className="w-full px-2 py-1 text-xs font-bold text-stone-700 rounded border-transparent hover:border-stone-300 focus:border-matrix-header bg-transparent"
                          />
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
                {jornadasFiltradasExcel.map((jornada) => (
                  <td key={`${jornada.id}-com`} className="p-1 border-r border-stone-200">
                    <textarea
                      rows={2}
                      value={jornada.comentarios || ""}
                      onChange={(e) => handleActualizarCeldaExcel(jornada.id, "comentarios", e.target.value)}
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
