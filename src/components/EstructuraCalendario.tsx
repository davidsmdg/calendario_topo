"use client";

import React, { useState, useMemo } from "react";
import {
  Settings2,
  Calendar,
  Clock,
  Sparkles,
  Award,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Sun,
  Users,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";
import {
  EstadoCronogramaTopo,
  EstructuraCalendarioConfig,
  BloquePeriodoCalendario,
  FechaClaveExamen,
  ModalidadCiclo,
  TipoBloqueCalendario,
  TipoHitoExamen,
  JornadaPedagogica,
  BloqueClase,
} from "@/types";
import { ESTRUCTURA_CALENDARIO_DEFECTO } from "@/services/storageService";
import { TimelineEstrategico } from "./TimelineEstrategico";
import { ddmmyyyyToISO, isoToFechaComunitaria, obtenerNombreDiaSemana } from "@/utils/festivosColombia";

interface EstructuraCalendarioProps {
  estado: EstadoCronogramaTopo;
  onActualizarEstado: (nuevo: EstadoCronogramaTopo) => void;
  onVolverAlMenu?: () => void;
}

export function EstructuraCalendario({
  estado,
  onActualizarEstado,
  onVolverAlMenu,
}: EstructuraCalendarioProps) {
  // Configuración estructural actual (o semilla si no existe)
  const config = useMemo(() => {
    return estado.estructuraCalendario || ESTRUCTURA_CALENDARIO_DEFECTO;
  }, [estado.estructuraCalendario]);

  // Estados locales editables
  const [modalidadCiclo, setModalidadCiclo] = useState<ModalidadCiclo>(config.modalidadCiclo);
  const [nombreCiclo1, setNombreCiclo1] = useState(config.nombreCiclo1 || "Ciclo I - 2027 (Feb - Jun)");
  const [nombreCiclo2, setNombreCiclo2] = useState(config.nombreCiclo2 || "Ciclo II - 2027 (Jul - Nov)");

  // Períodos temporales (Vacaciones, Clases, Coordinación)
  const [periodos, setPeriodos] = useState<BloquePeriodoCalendario[]>(config.periodosTemporales);
  const [nuevoPeriodoNombre, setNuevoPeriodoNombre] = useState("");
  const [nuevoPeriodoTipo, setNuevoPeriodoTipo] = useState<TipoBloqueCalendario>("vacaciones");
  const [nuevoPeriodoIni, setNuevoPeriodoIni] = useState("");
  const [nuevoPeriodoFin, setNuevoPeriodoFin] = useState("");

  // Fechas Clave / Exámenes (UNAL, ICFES, Simulacros)
  const [examenes, setExamenes] = useState<FechaClaveExamen[]>(config.fechasClaveExamenes);
  const [nuevoExamenTitulo, setNuevoExamenTitulo] = useState("");
  const [nuevoExamenTipo, setNuevoExamenTipo] = useState<TipoHitoExamen>("unal");
  const [nuevoExamenFecha, setNuevoExamenFecha] = useState("");
  const [nuevoExamenDesc, setNuevoExamenDesc] = useState("");

  // Franjas horarias maestras de clases
  const [franjas, setFranjas] = useState<string[]>(
    estado.franjasHorarias || [
      "8:00 AM - 9:30 AM",
      "9:30 AM - 11:00 AM",
      "11:15 AM - 12:45 PM",
      "1:30 PM - 3:00 PM",
    ]
  );
  const [nuevaFranja, setNuevaFranja] = useState("");
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  // Estado para el modal de conflicto de fechas
  const [conflictoFecha, setConflictoFecha] = useState<{
    fechaISO: string;
    accionPendiente: () => void;
    jornadaExistente: JornadaPedagogica;
    nuevoHitoNombre: string;
  } | null>(null);

  const notificar = (msg: string) => {
    setMensajeFeedback(msg);
    setTimeout(() => setMensajeFeedback(null), 3000);
  };

  // Guardar configuración completa y propagar
  const handleGuardarConfiguracion = (
    nuevasFranjas?: string[],
    nuevosPeriodos?: BloquePeriodoCalendario[],
    nuevosExamenes?: FechaClaveExamen[],
    nuevaModalidad?: ModalidadCiclo
  ) => {
    const fActual = nuevasFranjas || franjas;
    const pActual = nuevosPeriodos || periodos;
    const eActual = nuevosExamenes || examenes;
    const mActual = nuevaModalidad || modalidadCiclo;

    // Actualizar las jornadas con las nuevas franjas horarias estructurales
    const jornadasActualizadas: JornadaPedagogica[] = estado.jornadas.map((j) => {
      if (j.tipoJornada === "unificada") return j;
      const bloquesNuevos: BloqueClase[] = fActual.map((horaFranja, idx) => {
        const previo = j.bloques[idx];
        return {
          id: previo?.id || `${j.id}-b${idx + 1}-${Date.now()}`,
          hora: horaFranja,
          componente: previo?.componente || "",
          temaDelDia: previo?.temaDelDia || "",
          talleristas: previo?.talleristas || "",
        };
      });
      return {
        ...j,
        bloques: bloquesNuevos,
      };
    });

    const nuevaEstructura: EstructuraCalendarioConfig = {
      modalidadCiclo: mActual,
      nombreCiclo1,
      nombreCiclo2,
      horaInicioDefecto: fActual[0]?.split("-")[0]?.trim() || "8:00 AM",
      duracionBloqueMinutos: 90,
      periodosTemporales: pActual,
      fechasClaveExamenes: eActual,
    };

    onActualizarEstado({
      ...estado,
      franjasHorarias: fActual,
      jornadas: jornadasActualizadas,
      estructuraCalendario: nuevaEstructura,
    });

    notificar("¡Estructura del calendario actualizada y sincronizada en todo el sistema!");
  };

  // Handlers de Franjas
  const handleEditarFranja = (idx: number, valor: string) => {
    const copia = [...franjas];
    copia[idx] = valor;
    setFranjas(copia);
  };

  const handleAgregarFranja = () => {
    if (!nuevaFranja.trim()) return;
    const actual = [...franjas, nuevaFranja.trim()];
    setFranjas(actual);
    setNuevaFranja("");
    handleGuardarConfiguracion(actual);
  };

  const handleEliminarFranja = (idx: number) => {
    if (franjas.length <= 1) {
      alert("Debe haber al menos 1 franja horaria.");
      return;
    }
    const actual = franjas.filter((_, i) => i !== idx);
    setFranjas(actual);
    handleGuardarConfiguracion(actual);
  };

  // Handlers de Períodos
  const handleAgregarPeriodo = () => {
    if (!nuevoPeriodoNombre.trim() || !nuevoPeriodoIni || !nuevoPeriodoFin) {
      alert("Por favor completa el nombre y las fechas de inicio y fin del período.");
      return;
    }
    const colorPorTipo: Record<TipoBloqueCalendario, string> = {
      vacaciones: "#F59E0B",
      clases: "#10B981",
      coordinacion: "#3B82F6",
      evaluacion: "#8B5CF6",
      salida: "#0D9488",
    };
    const nuevo: BloquePeriodoCalendario = {
      id: `per-${Date.now()}`,
      nombre: nuevoPeriodoNombre.trim(),
      tipo: nuevoPeriodoTipo,
      fechaInicio: nuevoPeriodoIni,
      fechaFin: nuevoPeriodoFin,
      colorHex: colorPorTipo[nuevoPeriodoTipo],
    };
    const lista = [...periodos, nuevo];
    setPeriodos(lista);
    setNuevoPeriodoNombre("");
    setNuevoPeriodoIni("");
    setNuevoPeriodoFin("");
    handleGuardarConfiguracion(undefined, lista);
  };

  const handleEliminarPeriodo = (id: string) => {
    const lista = periodos.filter((p) => p.id !== id);
    setPeriodos(lista);
    handleGuardarConfiguracion(undefined, lista);
  };

  const handleActualizarPeriodoDirecto = (id: string, updates: Partial<BloquePeriodoCalendario>) => {
    const lista = periodos.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPeriodos(lista);
    handleGuardarConfiguracion(undefined, lista);
  };

  const handleActualizarExamenDirecto = (id: string, updates: Partial<FechaClaveExamen>) => {
    const lista = examenes.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setExamenes(lista);
    handleGuardarConfiguracion(undefined, undefined, lista);
  };

  // Handlers de Exámenes con detección de conflictos
  const handleAgregarExamen = () => {
    if (!nuevoExamenTitulo.trim() || !nuevoExamenFecha) {
      alert("Por favor indica el título y la fecha del examen / hito clave.");
      return;
    }

    const isoFecha = ddmmyyyyToISO(nuevoExamenFecha) || nuevoExamenFecha;
    const jornadaChocante = estado.jornadas.find((j) => {
      const jIso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
      return jIso === isoFecha && j.tipoJornada === "clases";
    });

    const procederAgregar = () => {
      const nuevo: FechaClaveExamen = {
        id: `ex-${Date.now()}`,
        titulo: nuevoExamenTitulo.trim(),
        tipo: nuevoExamenTipo,
        fecha: nuevoExamenFecha,
        descripcion: nuevoExamenDesc.trim(),
      };
      const lista = [...examenes, nuevo];
      setExamenes(lista);
      setNuevoExamenTitulo("");
      setNuevoExamenFecha("");
      setNuevoExamenDesc("");
      handleGuardarConfiguracion(undefined, undefined, lista);
    };

    if (jornadaChocante) {
      setConflictoFecha({
        fechaISO: isoFecha,
        nuevoHitoNombre: nuevoExamenTitulo.trim(),
        jornadaExistente: jornadaChocante,
        accionPendiente: procederAgregar,
      });
      return;
    }

    procederAgregar();
  };

  // Resolución del conflicto de fechas
  const resolverConflicto = (opcion: "reemplazar" | "correr" | "cancelar") => {
    if (!conflictoFecha) return;

    if (opcion === "cancelar") {
      setConflictoFecha(null);
      return;
    }

    if (opcion === "reemplazar") {
      // Convertir la jornada existente en examen/hito oficial
      const jornadasActualizadas = estado.jornadas.map((j) =>
        j.id === conflictoFecha.jornadaExistente.id
          ? {
              ...j,
              caracter: "examen" as const,
              tipoJornada: "unificada" as const,
              descripcionUnificada: `🎓 ${conflictoFecha.nuevoHitoNombre.toUpperCase()}`,
            }
          : j
      );
      onActualizarEstado({
        ...estado,
        jornadas: jornadasActualizadas,
      });
      conflictoFecha.accionPendiente();
      setConflictoFecha(null);
      notificar(`Jornada del ${conflictoFecha.jornadaExistente.fecha} convertida a examen oficial.`);
      return;
    }

    if (opcion === "correr") {
      // Correr 7 días hacia adelante esa jornada y todas las posteriores
      const isoChocante = conflictoFecha.fechaISO;
      const jornadasActualizadas = estado.jornadas.map((j) => {
        const jIso = j.fechaISO || ddmmyyyyToISO(j.fecha) || "";
        if (jIso >= isoChocante) {
          const [y, m, d] = jIso.split("-").map(Number);
          const fechaObj = new Date(y, m - 1, d);
          fechaObj.setDate(fechaObj.getDate() + 7); // Mover 1 semana adelante
          const nuevoISO = fechaObj.toISOString().split("T")[0];
          return {
            ...j,
            fechaISO: nuevoISO,
            fecha: isoToFechaComunitaria(nuevoISO),
            diaSemana: obtenerNombreDiaSemana(nuevoISO) || j.diaSemana,
          };
        }
        return j;
      }).sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || ""));

      onActualizarEstado({
        ...estado,
        jornadas: jornadasActualizadas,
      });
      conflictoFecha.accionPendiente();
      setConflictoFecha(null);
      notificar("¡Todas las clases a partir de esa fecha se corrieron 1 sábado hacia adelante!");
    }
  };

  const handleEliminarExamen = (id: string) => {
    const lista = examenes.filter((e) => e.id !== id);
    setExamenes(lista);
    handleGuardarConfiguracion(undefined, undefined, lista);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO KAHOOT STYLE
         ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2B4C7E] via-[#355B94] to-[#1E3557] text-white p-6 sm:p-8 shadow-warm-lg border-2 border-white/20 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-[#2B2623] flex items-center justify-center font-black shadow-lg shrink-0">
              <Settings2 className="w-9 h-9" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Estructura Estratégica del Año</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Configuración y Estructura del Calendario
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Define el régimen de ciclos (anual o semestral), delimita los bloques de clases,
                vacaciones y coordinación, programa exámenes clave (UNAL e ICFES) y ajusta las
                horas maestras de clase.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGuardarConfiguracion()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-xs shadow-md transition transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Estructura</span>
          </button>
        </div>
      </div>

      {mensajeFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-topo-green text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {/* =========================================================================
          SECCIÓN 1: MODALIDAD DE CICLOS ACADÉMICOS
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-6 space-y-4">
        <div>
          <h3 className="text-base font-black text-topo-dark flex items-center gap-2">
            <Layers className="w-5 h-5 text-topo-terracotta" />
            <span>1. Régimen de Ciclos Académicos</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Selecciona si el año opera como un solo ciclo continuo o dividido en dos semestres independientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* OPCIÓN A: CICLO ÚNICO */}
          <div
            onClick={() => {
              setModalidadCiclo("anual");
              handleGuardarConfiguracion(undefined, undefined, undefined, "anual");
            }}
            className={`p-5 rounded-2xl border-3 cursor-pointer transition flex items-start gap-4 ${
              modalidadCiclo === "anual"
                ? "bg-purple-50/70 border-[#7A3EBE] shadow-warm"
                : "bg-stone-50 border-stone-200 hover:border-stone-300"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                modalidadCiclo === "anual" ? "bg-[#7A3EBE] text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              1
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-topo-dark">Ciclo Único Anual (Continuo)</h4>
                {modalidadCiclo === "anual" && (
                  <span className="px-2 py-0.5 rounded-md bg-[#7A3EBE] text-white text-[10px] font-black">
                    ACTIVO
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                El proceso formativo se extiende a lo largo de todo el año calendario (Febrero a Noviembre),
                con numeración corrida de jornadas y una sola cohorte de estudiantes.
              </p>
            </div>
          </div>

          {/* OPCIÓN B: DOS CICLOS SEMESTRALES */}
          <div
            onClick={() => {
              setModalidadCiclo("dos_ciclos");
              handleGuardarConfiguracion(undefined, undefined, undefined, "dos_ciclos");
            }}
            className={`p-5 rounded-2xl border-3 cursor-pointer transition flex items-start gap-4 ${
              modalidadCiclo === "dos_ciclos"
                ? "bg-blue-50/70 border-matrix-header shadow-warm"
                : "bg-stone-50 border-stone-200 hover:border-stone-300"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                modalidadCiclo === "dos_ciclos"
                  ? "bg-matrix-header text-white"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              2
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-topo-dark">Dos Ciclos en el Año (Semestral)</h4>
                {modalidadCiclo === "dos_ciclos" && (
                  <span className="px-2 py-0.5 rounded-md bg-matrix-header text-white text-[10px] font-black">
                    ACTIVO
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                El año se divide en dos ciclos independientes: <strong>Ciclo I</strong> (para exámenes del
                primer semestre) y <strong>Ciclo II</strong> (segundo semestre con nueva cohorte).
              </p>
            </div>
          </div>
        </div>

        {modalidadCiclo === "dos_ciclos" && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
            <div>
              <label className="text-[11px] font-black uppercase text-matrix-header block mb-1">
                Nombre del Ciclo I
              </label>
              <input
                type="text"
                value={nombreCiclo1}
                onChange={(e) => setNombreCiclo1(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase text-matrix-header block mb-1">
                Nombre del Ciclo II
              </label>
              <input
                type="text"
                value={nombreCiclo2}
                onChange={(e) => setNombreCiclo2(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECCIÓN 2: BLOQUES DEL CALENDARIO (VACACIONES, CLASES, COORDINACIÓN)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-6 space-y-5">
        <div>
          <h3 className="text-base font-black text-topo-dark flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <span>2. Bloques Temporales: Vacaciones, Clases y Coordinación</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Delimita los períodos de descanso escolar, semanas de planeación docente y tramos lectivos.
          </p>
        </div>

        {/* Lista de Períodos Existentes (Directamente Editables en Vivo) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {periodos.map((p) => {
            const iconos: Record<TipoBloqueCalendario, string> = {
              vacaciones: "🏖️",
              clases: "🎓",
              coordinacion: "🤝",
              evaluacion: "📊",
              salida: "🚌",
            };
            const labelsTipo: Record<TipoBloqueCalendario, string> = {
              vacaciones: "Vacaciones / Receso",
              clases: "Clases Regulares",
              coordinacion: "Coordinación y Planeación",
              evaluacion: "Evaluación y Cierre",
              salida: "Salida Pedagógica",
            };

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl border-2 border-stone-200 bg-white hover:border-amber-400 transition flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={p.tipo}
                      onChange={(e) => handleActualizarPeriodoDirecto(p.id, { tipo: e.target.value as any })}
                      className="text-xs font-black uppercase px-2 py-1 rounded-lg bg-stone-100 border border-stone-300 cursor-pointer"
                    >
                      <option value="vacaciones">🏖️ Vacaciones</option>
                      <option value="clases">🎓 Clases</option>
                      <option value="coordinacion">🤝 Coordinación</option>
                      <option value="evaluacion">📊 Evaluación</option>
                      <option value="salida">🚌 Salida Pedagógica</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleEliminarPeriodo(p.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded transition"
                      title="Eliminar este período"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={p.nombre}
                      onChange={(e) => handleActualizarPeriodoDirecto(p.id, { nombre: e.target.value })}
                      placeholder="Nombre del período..."
                      className="w-full px-2.5 py-1 text-xs font-black text-topo-dark rounded-lg border border-stone-200 hover:border-amber-400 bg-stone-50/50"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 text-xs font-bold text-stone-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-stone-500 block">Rango de Fechas:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={p.fechaInicio}
                      onChange={(e) => handleActualizarPeriodoDirecto(p.id, { fechaInicio: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs font-bold bg-stone-50 cursor-pointer"
                      title="Fecha Inicio"
                    />
                    <input
                      type="date"
                      value={p.fechaFin}
                      onChange={(e) => handleActualizarPeriodoDirecto(p.id, { fechaFin: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs font-bold bg-stone-50 cursor-pointer"
                      title="Fecha Fin"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Añadir Nuevo Bloque Temporal */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Nuevo Período al Calendario</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={nuevoPeriodoNombre}
              onChange={(e) => setNuevoPeriodoNombre(e.target.value)}
              placeholder="Nombre (ej. Receso de Semana Santa)..."
              className="sm:col-span-2 px-3 py-2 rounded-xl border-stone-300 text-xs font-bold bg-white"
            />
            <select
              value={nuevoPeriodoTipo}
              onChange={(e) => setNuevoPeriodoTipo(e.target.value as any)}
              className="px-3 py-2 rounded-xl border-stone-300 text-xs font-bold bg-white"
            >
              <option value="vacaciones">🏖️ Vacaciones / Receso</option>
              <option value="clases">🎓 Período de Clases</option>
              <option value="coordinacion">🤝 Coordinación Docente</option>
              <option value="evaluacion">📊 Evaluación y Cierre</option>
              <option value="salida">🚌 Salida Pedagógica</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={nuevoPeriodoIni}
                onChange={(e) => setNuevoPeriodoIni(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
                title="Fecha Inicio"
              />
              <input
                type="date"
                value={nuevoPeriodoFin}
                onChange={(e) => setNuevoPeriodoFin(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
                title="Fecha Fin"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAgregarPeriodo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Guardar Período</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECCIÓN 3: FECHAS CLAVE (EXÁMENES UNAL, ICFES Y SIMULACROS)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-6 space-y-5">
        <div>
          <h3 className="text-base font-black text-topo-dark flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D83A56]" />
            <span>3. Fechas Clave: Exámenes UNAL, ICFES, Simulacros y Salidas Pedagógicas</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Registra los hitos evaluativos y salidas pedagógicas institucionales hacia los cuales se orienta la preparación comunitaria.
          </p>
        </div>

        {/* Lista de Exámenes e Hitos (Directamente Editables en Vivo) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {examenes.map((ex) => {
            const estilos: Record<TipoHitoExamen, { bg: string; text: string; label: string }> = {
              unal: { bg: "bg-emerald-100", text: "text-emerald-900", label: "🏛️ UNAL" },
              icfes: { bg: "bg-blue-100", text: "text-blue-900", label: "📄 ICFES" },
              simulacro: { bg: "bg-purple-100", text: "text-purple-900", label: "✍️ SIMULACRO" },
              salida: { bg: "bg-teal-100", text: "text-teal-900", label: "🚌 SALIDA" },
              cierre: { bg: "bg-amber-100", text: "text-amber-900", label: "🎉 CIERRE" },
            };
            const est = estilos[ex.tipo] || estilos.unal;

            return (
              <div
                key={ex.id}
                className="p-4 rounded-2xl border-2 border-stone-200 bg-white hover:border-purple-400 transition flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={ex.tipo}
                      onChange={(e) => handleActualizarExamenDirecto(ex.id, { tipo: e.target.value as any })}
                      className="text-xs font-black uppercase px-2 py-1 rounded-lg bg-stone-100 border border-stone-300 cursor-pointer"
                    >
                      <option value="unal">🏛️ Admisión UNAL</option>
                      <option value="icfes">📄 Saber 11 ICFES</option>
                      <option value="simulacro">✍️ Simulacro</option>
                      <option value="salida">🚌 Salida Pedagógica</option>
                      <option value="cierre">🎉 Cierre</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleEliminarExamen(ex.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded transition"
                      title="Eliminar este examen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={ex.titulo}
                      onChange={(e) => handleActualizarExamenDirecto(ex.id, { titulo: e.target.value })}
                      placeholder="Nombre del examen..."
                      className="w-full px-2.5 py-1 text-xs font-black text-topo-dark rounded-lg border border-stone-200 hover:border-purple-400 bg-stone-50/50"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 text-xs font-bold text-[#D83A56] space-y-1">
                  <span className="text-[10px] font-black uppercase text-stone-500 block">Fecha Oficial:</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                    <input
                      type="date"
                      value={ddmmyyyyToISO(ex.fecha) || ex.fecha}
                      onChange={(e) => {
                        const nuevaFecha = e.target.value;
                        if (nuevaFecha) {
                          handleActualizarExamenDirecto(ex.id, { fecha: nuevaFecha });
                        }
                      }}
                      className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs font-black bg-stone-50 text-purple-950 cursor-pointer"
                      title="Cambiar fecha del examen"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Añadir Nueva Fecha de Examen o Salida */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-rose-950 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Fecha de Examen, Hito o Salida Pedagógica</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={nuevoExamenTitulo}
              onChange={(e) => setNuevoExamenTitulo(e.target.value)}
              placeholder="Nombre del hito (ej. Admisión UNAL, Salida a Monserrate)..."
              className="sm:col-span-2 px-3 py-2 rounded-xl border-stone-300 text-xs font-bold bg-white"
            />
            <select
              value={nuevoExamenTipo}
              onChange={(e) => setNuevoExamenTipo(e.target.value as any)}
              className="px-3 py-2 rounded-xl border-stone-300 text-xs font-bold bg-white"
            >
              <option value="unal">🏛️ Admisión UNAL</option>
              <option value="icfes">📄 Prueba Saber 11 / ICFES</option>
              <option value="simulacro">✍️ Simulacro Institucional</option>
              <option value="salida">🚌 Salida Pedagógica</option>
              <option value="cierre">🎉 Evento de Cierre</option>
            </select>
            <input
              type="date"
              value={nuevoExamenFecha}
              onChange={(e) => setNuevoExamenFecha(e.target.value)}
              className="px-3 py-2 rounded-xl border-stone-300 text-xs font-bold bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleAgregarExamen}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D83A56] hover:bg-rose-700 text-white font-black text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Guardar Hito / Salida</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECCIÓN 4: HORAS MAESTRAS DE CLASE (FRANJAS HORARIAS)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] shadow-warm p-6 space-y-5">
        <div>
          <h3 className="text-base font-black text-topo-dark flex items-center gap-2">
            <Clock className="w-5 h-5 text-topo-green" />
            <span>4. Horas Maestras de Clase y Franjas Horarias</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Configura la hora de inicio y fin de cada bloque de clase para todas las jornadas del año.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {franjas.map((hora, idx) => (
            <div
              key={`franja-m-${idx}`}
              className="p-3.5 rounded-2xl bg-stone-50 border-2 border-stone-200 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-matrix-header">
                  Bloque {idx + 1}
                </span>
                {franjas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleEliminarFranja(idx)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition"
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
                className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-black text-topo-dark bg-white"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <input
            type="text"
            value={nuevaFranja}
            onChange={(e) => setNuevaFranja(e.target.value)}
            placeholder="Añadir nueva franja (ej. 3:15 PM - 4:45 PM)..."
            className="flex-1 max-w-sm px-3.5 py-2 rounded-2xl border-stone-300 text-xs font-bold"
          />
          <button
            type="button"
            onClick={handleAgregarFranja}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#2A4D7D] hover:bg-[#1B365D] text-white font-black text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Franja</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECCIÓN 5: ESQUEMA VISUAL PANORÁMICO (TIMELINE HORIZONTAL DEL AÑO)
         ========================================================================= */}
      <TimelineEstrategico
        modalidadCiclo={modalidadCiclo}
        nombreCiclo1={nombreCiclo1}
        nombreCiclo2={nombreCiclo2}
        periodos={periodos}
        examenes={examenes}
        titulo="🗺️ Línea de Tiempo y Esquema Panorámico 2027"
        subtitulo="Esquema vivo reactivo: se actualiza automáticamente al cambiar ciclos, agregar períodos o fijar exámenes"
        compacto={false}
      />

      {/* =========================================================================
          MODAL DE RESOLUCIÓN DE CONFLICTO DE FECHAS
         ========================================================================= */}
      {conflictoFecha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border-4 border-amber-400 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-900">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black">Conflicto de Fechas Detectado</h3>
                <p className="text-xs text-stone-600">
                  Ya existe una jornada de clases programada para el <strong>{conflictoFecha.jornadaExistente.fecha}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
              <p className="font-bold text-stone-700">
                Estás programando: <span className="font-black text-purple-700">🎓 {conflictoFecha.nuevoHitoNombre}</span>
              </p>
              <p className="text-stone-500">
                ¿Cómo deseas ajustar el cronograma para no perder ni desorganizar las clases existentes?
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => resolverConflicto("correr")}
                className="w-full p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-between transition shadow-md"
              >
                <span>➡️ Correr todo 1 sábado hacia la derecha</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => resolverConflicto("reemplazar")}
                className="w-full p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-between transition shadow-md"
              >
                <span>🔄 Reemplazar esa fecha por el examen</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Sobrescribir</span>
              </button>

              <button
                type="button"
                onClick={() => resolverConflicto("cancelar")}
                className="w-full p-2.5 rounded-2xl border-2 border-stone-200 hover:bg-stone-100 text-stone-700 font-black text-xs transition"
              >
                Cancelar y mantener fecha anterior
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
