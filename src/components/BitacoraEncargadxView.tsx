"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Users,
  Sparkles,
  Check,
  X,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building,
  Coffee,
  HeartHandshake,
  Key,
  DoorClosed,
} from "lucide-react";
import {
  EstadoCronogramaTopo,
  JornadaPedagogica,
  BitacoraEncargadx,
  RegistroEjecucionBloque,
  EstadoEjecucionBloque,
} from "@/types";
import { ddmmyyyyToISO, isoToFechaComunitaria, obtenerNombreDiaSemana, obtenerEstiloComponente } from "@/utils/festivosColombia";
import { TALLERISTAS_POR_COMPONENTE } from "@/utils/seedData";

interface BitacoraEncargadxViewProps {
  estado: EstadoCronogramaTopo;
  jornadaIdInicial?: string | null;
  onActualizarEstado: (nuevo: EstadoCronogramaTopo) => void;
  onVolverAlMenu?: () => void;
}

export function BitacoraEncargadxView({
  estado,
  jornadaIdInicial = null,
  onActualizarEstado,
  onVolverAlMenu,
}: BitacoraEncargadxViewProps) {
  // Ordenar jornadas
  const jornadasOrdenadas = useMemo(() => {
    return [...estado.jornadas].sort((a, b) => {
      const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });
  }, [estado.jornadas]);

  // Selección de la jornada a registrar
  const [jornadaSeleccionadaId, setJornadaSeleccionadaId] = useState<string>(() => {
    if (jornadaIdInicial) return jornadaIdInicial;
    const hoy = new Date().toISOString().split("T")[0];
    const proxima = jornadasOrdenadas.find((j) => (j.fechaISO || ddmmyyyyToISO(j.fecha) || "") >= hoy);
    return proxima ? proxima.id : (jornadasOrdenadas[0]?.id || "");
  });

  const [mensajeCopiado, setMensajeCopiado] = useState(false);

  // Jornada actual
  const jornada = useMemo(() => {
    return jornadasOrdenadas.find((j) => j.id === jornadaSeleccionadaId) || jornadasOrdenadas[0];
  }, [jornadasOrdenadas, jornadaSeleccionadaId]);

  if (!jornada) {
    return (
      <div className="p-8 text-center text-stone-500 font-bold">
        No hay jornadas disponibles para gestionar.
      </div>
    );
  }

  // Bitácora actual (o inicial por defecto)
  const bitacora: BitacoraEncargadx = jornada.bitacora || {
    encargadxConfirmadx: jornada.encargadxDelDia || "",
    aperturaLlaves: false,
    refrigerioEntregado: false,
    circuloPalabraRealizado: false,
    aseoSalonesVerificado: false,
    cierreSedeRealizado: false,
    estudiantesPresentes: undefined,
    observacionesGenerales: "",
    acuerdosDelDia: "",
    ejecucionBloques: jornada.bloques.map((b) => ({
      bloqueId: b.id,
      estado: "pendiente",
      talleristaEfectivo: b.talleristas || "",
      temaDictado: b.temaDelDia || "",
    })),
    jornadaFinalizada: false,
  };

  // Función para persistir cambios en la bitácora
  const guardarBitacora = (nuevaBitacora: BitacoraEncargadx) => {
    const jornadasActualizadas = estado.jornadas.map((j) =>
      j.id === jornada.id
        ? {
            ...j,
            bitacora: nuevaBitacora,
          }
        : j
    );
    onActualizarEstado({
      ...estado,
      jornadas: jornadasActualizadas,
    });
  };

  // Cambiar estado de checklist
  const toggleCheck = (campo: keyof BitacoraEncargadx) => {
    guardarBitacora({
      ...bitacora,
      [campo]: !bitacora[campo],
    });
  };

  // Actualizar ejecución de un bloque
  const actualizarBloque = (bloqueId: string, updates: Partial<RegistroEjecucionBloque>) => {
    const ejecucionesActuales = bitacora.ejecucionBloques || [];
    const existe = ejecucionesActuales.find((e) => e.bloqueId === bloqueId);

    let nuevasEjecuciones: RegistroEjecucionBloque[];
    if (existe) {
      nuevasEjecuciones = ejecucionesActuales.map((e) =>
        e.bloqueId === bloqueId ? { ...e, ...updates } : e
      );
    } else {
      nuevasEjecuciones = [...ejecucionesActuales, { bloqueId, estado: "pendiente", ...updates }];
    }

    guardarBitacora({
      ...bitacora,
      ejecucionBloques: nuevasEjecuciones,
    });
  };

  // Generar texto para WhatsApp
  const generarReporteWhatsApp = () => {
    const encargadx = bitacora.encargadxConfirmadx || jornada.encargadxDelDia || "Por definir";
    const lineas = [
      `📢 *REPORTE DEL DÍA - ESCUELA POPULAR EL TOPO*`,
      `📅 *Fecha:* ${jornada.fecha} (${jornada.diaSemana})`,
      `👤 *Encargadx:* ${encargadx}`,
      `👥 *Estudiantes presentes:* ${bitacora.estudiantesPresentes ?? "Sin registrar"}`,
      ``,
      `📚 *ESTADO DE LAS CLASES:*`,
    ];

    jornada.bloques.forEach((b, idx) => {
      const reg = (bitacora.ejecucionBloques || []).find((r) => r.bloqueId === b.id);
      const estadoIcono =
        reg?.estado === "dictada"
          ? "✅ Dictada"
          : reg?.estado === "reemplazo"
          ? `🔄 Reemplazo (${reg.talleristaEfectivo})`
          : reg?.estado === "cancelada"
          ? "❌ Cancelada"
          : "⏳ Pendiente";

      const tallerista = reg?.talleristaEfectivo || b.talleristas || "Por definir";
      lineas.push(`• *B${idx + 1} (${b.componente || "Sin materia"}):* ${estadoIcono} | Tall: ${tallerista}`);
      if (reg?.temaDictado || b.temaDelDia) {
        lineas.push(`   _Tema:_ ${reg?.temaDictado || b.temaDelDia}`);
      }
    });

    lineas.push(``);
    lineas.push(`🏢 *OPERACIÓN DE SEDE:*`);
    lineas.push(`• Apertura y llaves: ${bitacora.aperturaLlaves ? "✅ Sí" : "❌ No"}`);
    lineas.push(`• Refrigerio comunitario: ${bitacora.refrigerioEntregado ? "✅ Sí" : "❌ No"}`);
    lineas.push(`• Círculo de la palabra: ${bitacora.circuloPalabraRealizado ? "✅ Sí" : "❌ No"}`);
    lineas.push(`• Aseo y salones limpios: ${bitacora.aseoSalonesVerificado ? "✅ Sí" : "❌ No"}`);
    lineas.push(`• Cierre de sede: ${bitacora.cierreSedeRealizado ? "✅ Sí" : "❌ No"}`);

    if ((bitacora.asistentesEscuelaFormacion || []).length > 0) {
      lineas.push(``);
      lineas.push(`📖 *Escuela de Formación (${bitacora.asistentesEscuelaFormacion?.length} asistentes):*`);
      lineas.push(`   ${bitacora.asistentesEscuelaFormacion?.join(", ")}`);
    }

    if ((bitacora.asistentesCoordinacion || []).length > 0) {
      lineas.push(``);
      lineas.push(`👥 *Reunión de Coordinación (${bitacora.asistentesCoordinacion?.length} asistentes):*`);
      lineas.push(`   ${bitacora.asistentesCoordinacion?.join(", ")}`);
    }

    if ((bitacora.asistentesSalidaPedagogica || []).length > 0 || bitacora.lugarSalidaPedagogica) {
      lineas.push(``);
      lineas.push(`🚌 *Salida Pedagógica ${bitacora.lugarSalidaPedagogica ? `(${bitacora.lugarSalidaPedagogica})` : ""}:*`);
      lineas.push(`   Talleristas participantes: ${bitacora.asistentesSalidaPedagogica?.join(", ") || "Todos convocados"}`);
    }

    if (bitacora.observacionesGenerales?.trim()) {
      lineas.push(``);
      lineas.push(`📝 *Observaciones:*`);
      lineas.push(bitacora.observacionesGenerales);
    }

    return lineas.join("\n");
  };

  const handleCopiarWhatsApp = () => {
    const texto = generarReporteWhatsApp();
    navigator.clipboard.writeText(texto);
    setMensajeCopiado(true);
    setTimeout(() => setMensajeCopiado(false), 3000);
  };

  const indiceActual = jornadasOrdenadas.findIndex((j) => j.id === jornada.id);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* CABECERA PRINCIPAL: SELECTOR DE JORNADA */}
      <div className="bg-gradient-to-r from-[#1B365D] via-[#2A4D7D] to-[#1B365D] text-white p-6 rounded-3xl shadow-warm-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-topo-dark text-xs font-black uppercase tracking-wider mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Módulo Operativo en Sede</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Bitácora del Encargadx del Día</h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1">
            Chulea los eventos del día, confirma la asistencia de talleristas y reporta la jornada al instante.
          </p>
        </div>

        {/* Navegación entre jornadas */}
        <div className="flex items-center gap-2 bg-black/30 p-2 rounded-2xl border border-white/20">
          <button
            type="button"
            disabled={indiceActual <= 0}
            onClick={() => setJornadaSeleccionadaId(jornadasOrdenadas[indiceActual - 1].id)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-30 transition"
            title="Jornada anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <select
            value={jornada.id}
            onChange={(e) => setJornadaSeleccionadaId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white text-topo-dark text-xs font-black cursor-pointer shadow-sm max-w-[220px]"
          >
            {jornadasOrdenadas.map((j) => (
              <option key={j.id} value={j.id}>
                #{j.numeroJornada} - {j.fecha}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={indiceActual >= jornadasOrdenadas.length - 1}
            onClick={() => setJornadaSeleccionadaId(jornadasOrdenadas[indiceActual + 1].id)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-30 transition"
            title="Siguiente jornada"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* INFORMACIÓN BÁSICA DE LA FECHA */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-topo-dark flex items-center justify-center font-black text-xl shadow-xs">
            #{jornada.numeroJornada}
          </div>
          <div>
            <h3 className="text-lg font-black text-topo-dark capitalize">{jornada.fecha}</h3>
            <span className="text-xs font-bold text-stone-500">
              {jornada.diaSemana} &bull; Horario: {jornada.horasJornada || "8:00 AM - 3:00 PM"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="text-[11px] font-black uppercase text-stone-500 block">
              👤 Encargadx del Día:
            </label>
            <input
              type="text"
              value={bitacora.encargadxConfirmadx ?? jornada.encargadxDelDia ?? ""}
              onChange={(e) =>
                guardarBitacora({
                  ...bitacora,
                  encargadxConfirmadx: e.target.value,
                })
              }
              placeholder="Nombre de quien asume hoy..."
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-black bg-stone-50 text-topo-dark"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-stone-500 block">
              👥 Estudiantes:
            </label>
            <input
              type="number"
              min="0"
              value={bitacora.estudiantesPresentes ?? ""}
              onChange={(e) =>
                guardarBitacora({
                  ...bitacora,
                  estudiantesPresentes: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Total..."
              className="w-24 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-black bg-stone-50 text-topo-dark text-center"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: CONTROL Y ASISTENCIA DE CLASES / BLOQUES */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#E2DCCE] shadow-warm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 font-black text-sm">📚</span>
            <div>
              <h3 className="text-base font-black text-topo-dark">Control de Clases y Talleristas en Aula</h3>
              <p className="text-xs text-stone-500">
                Confirma si el tallerista asistió, si hubo reemplazo o si la clase debió cancelarse.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jornada.bloques.map((b, idx) => {
            const reg = (bitacora.ejecucionBloques || []).find((r) => r.bloqueId === b.id);
            const estadoActual: EstadoEjecucionBloque = reg?.estado || "pendiente";
            const estilo = obtenerEstiloComponente(b.componente);

            return (
              <div
                key={b.id || idx}
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  estadoActual === "dictada"
                    ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200"
                    : estadoActual === "reemplazo"
                    ? "bg-amber-50/80 border-amber-300"
                    : estadoActual === "cancelada"
                    ? "bg-rose-50/80 border-rose-300 opacity-75"
                    : "bg-stone-50/70 border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-stone-600">
                    ⏰ BLOQUE {idx + 1} ({b.hora || "8:00 AM - 9:30 AM"})
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    estadoActual === "dictada"
                      ? "bg-emerald-600 text-white"
                      : estadoActual === "reemplazo"
                      ? "bg-amber-500 text-topo-dark"
                      : estadoActual === "cancelada"
                      ? "bg-rose-600 text-white"
                      : "bg-stone-200 text-stone-700"
                  }`}>
                    {estadoActual === "dictada"
                      ? "✅ Dictada"
                      : estadoActual === "reemplazo"
                      ? "🔄 Con Reemplazo"
                      : estadoActual === "cancelada"
                      ? "❌ Cancelada"
                      : "⏳ Pendiente"}
                  </span>
                </div>

                <div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${estilo.bg} ${estilo.text} inline-block`}>
                    {b.componente || "Sin componente asignado"}
                  </span>
                  <p className="text-xs font-bold text-stone-800 mt-1">
                    {b.temaDelDia ? `Tema: ${b.temaDelDia}` : "Sin tema registrado"}
                  </p>
                </div>

                {/* Botones de acción rápida: Dictada | Reemplazo | Cancelada */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      actualizarBloque(b.id, {
                        estado: "dictada",
                        talleristaEfectivo: reg?.talleristaEfectivo || b.talleristas,
                      })
                    }
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      estadoActual === "dictada"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Se Dictó</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      actualizarBloque(b.id, {
                        estado: "reemplazo",
                      })
                    }
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      estadoActual === "reemplazo"
                        ? "bg-amber-500 text-topo-dark shadow-xs"
                        : "bg-white hover:bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    <span>🔄 Reemplazo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      actualizarBloque(b.id, {
                        estado: "cancelada",
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      estadoActual === "cancelada"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white hover:bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                    title="Marcar clase cancelada"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Selector práctico e interactivo de talleristas según el componente (Permite Selección Múltiple / Co-docencia) */}
                {(() => {
                  const compUpper = (b.componente || "").trim().toUpperCase();
                  // Talleristas del componente
                  const delDirectorio = (estado.directorioTalleristas || [])
                    .filter((t) => t.componentes?.some((c) => c.toUpperCase() === compUpper))
                    .map((t) => t.nombre);
                  const deMalla =
                    estado.mallaCurricular.find((m) => m.componente.toUpperCase() === compUpper)
                      ?.talleristasBase || [];
                  const deSeed = TALLERISTAS_POR_COMPONENTE[compUpper] || [];
                  const talleristasMateria = Array.from(new Set([...delDirectorio, ...deMalla, ...deSeed]));

                  // Asistentes seleccionados actualmente (array)
                  const listaSeleccionada: string[] = (() => {
                    if (reg?.talleristasEfectivos && reg.talleristasEfectivos.length > 0) {
                      return reg.talleristasEfectivos;
                    }
                    if (reg?.talleristaEfectivo) {
                      return reg.talleristaEfectivo.split(/[,;/]+/).map((s) => s.trim()).filter(Boolean);
                    }
                    if (b.talleristas) {
                      return b.talleristas.split(/[,;/]+/).map((s) => s.trim()).filter(Boolean);
                    }
                    return [];
                  })();

                  // Toggle para añadir o quitar un tallerista a esta clase (co-docencia)
                  const toggleTalleristaEnClase = (nombreT: string) => {
                    const yaEsta = listaSeleccionada.some((n) => n.toLowerCase() === nombreT.toLowerCase());
                    const nuevaLista = yaEsta
                      ? listaSeleccionada.filter((n) => n.toLowerCase() !== nombreT.toLowerCase())
                      : [...listaSeleccionada, nombreT];

                    actualizarBloque(b.id, {
                      talleristasEfectivos: nuevaLista,
                      talleristaEfectivo: nuevaLista.join(", "),
                      estado: estadoActual === "cancelada" ? "dictada" : estadoActual,
                    });
                  };

                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-stone-500 block">
                          👥 Talleristas en aula (toca para sumar/quitar):
                        </label>
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                          {listaSeleccionada.length} en clase
                        </span>
                      </div>

                      {/* Chips directos de la materia con selección múltiple */}
                      {talleristasMateria.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {talleristasMateria.map((tNom) => {
                            const seleccionado = listaSeleccionada.some(
                              (n) => n.toLowerCase() === tNom.toLowerCase()
                            );
                            return (
                              <button
                                key={tNom}
                                type="button"
                                onClick={() => toggleTalleristaEnClase(tNom)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                                  seleccionado
                                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 scale-105"
                                    : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                                }`}
                              >
                                {seleccionado && <Check className="w-3 h-3" />}
                                <span>{tNom}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Menú desplegable para sumar un tallerista adicional de apoyo o reemplazo */}
                      <div className="flex items-center gap-1">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              toggleTalleristaEnClase(e.target.value);
                            }
                          }}
                          className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white cursor-pointer"
                        >
                          <option value="">
                            + Sumar otro tallerista de apoyo / reemplazo...
                          </option>
                          {estado.talleristas.map((tNom) => (
                            <option key={tNom} value={tNom}>
                              {listaSeleccionada.some((n) => n.toLowerCase() === tNom.toLowerCase())
                                ? `✓ ${tNom} (Asignado)`
                                : `+ ${tNom}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Resumen visible de quiénes quedaron asignados si son más de uno */}
                      {listaSeleccionada.length > 0 && (
                        <p className="text-[11px] text-emerald-950 font-bold bg-emerald-50/90 border border-emerald-200 px-2.5 py-1 rounded-xl mt-1">
                          Dictan: <span className="font-black text-emerald-800">{listaSeleccionada.join(" • ")}</span> (ambos suman clase dictada)
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: ACTIVIDADES COMUNITARIAS POST-CLASE Y SALIDAS */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#E2DCCE] shadow-warm space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-stone-100 pb-3">
          <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800 font-black text-sm">🤝</span>
          <div>
            <h3 className="text-base font-black text-topo-dark">
              Encuentros Comunitarios y Asistencia del Equipo
            </h3>
            <p className="text-xs text-stone-500">
              Registra qué talleristas se quedaron a la Escuela de Formación, Reunión de Coordinación o Salida Pedagógica con 1 toque.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bloque A: Escuela de Formación Política/Pedagógica */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border-2 border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                <span>📖 Escuela de Formación</span>
              </span>
              <span className="text-[10px] font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                {(bitacora.asistentesEscuelaFormacion || []).length} asistentes
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium">
              Toca para marcar quiénes participaron en el espacio formativo:
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {estado.talleristas.map((tNom) => {
                const asistio = (bitacora.asistentesEscuelaFormacion || []).some(
                  (a) => a.toLowerCase() === tNom.toLowerCase()
                );
                return (
                  <button
                    key={`formacion-${tNom}`}
                    type="button"
                    onClick={() => {
                      const actuales = bitacora.asistentesEscuelaFormacion || [];
                      const nuevos = asistio
                        ? actuales.filter((a) => a.toLowerCase() !== tNom.toLowerCase())
                        : [...actuales, tNom];
                      guardarBitacora({
                        ...bitacora,
                        asistentesEscuelaFormacion: nuevos,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                      asistio
                        ? "bg-amber-600 text-white shadow-xs scale-105"
                        : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                    }`}
                  >
                    {asistio && <Check className="w-3 h-3" />}
                    <span>{tNom}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloque B: Reunión de Coordinación General */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border-2 border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                <span>👥 Reunión de Coordinación</span>
              </span>
              <span className="text-[10px] font-black text-indigo-800 bg-indigo-200/80 px-2 py-0.5 rounded-full">
                {(bitacora.asistentesCoordinacion || []).length} asistentes
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium">
              Toca para marcar quiénes participaron en la reunión de balance:
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {estado.talleristas.map((tNom) => {
                const asistio = (bitacora.asistentesCoordinacion || []).some(
                  (a) => a.toLowerCase() === tNom.toLowerCase()
                );
                return (
                  <button
                    key={`coord-${tNom}`}
                    type="button"
                    onClick={() => {
                      const actuales = bitacora.asistentesCoordinacion || [];
                      const nuevos = asistio
                        ? actuales.filter((a) => a.toLowerCase() !== tNom.toLowerCase())
                        : [...actuales, tNom];
                      guardarBitacora({
                        ...bitacora,
                        asistentesCoordinacion: nuevos,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                      asistio
                        ? "bg-indigo-600 text-white shadow-xs scale-105"
                        : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                    }`}
                  >
                    {asistio && <Check className="w-3 h-3" />}
                    <span>{tNom}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloque C: Salidas Pedagógicas Institucionales */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border-2 border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-teal-900 flex items-center gap-1.5">
                <span>🚌 Salida Pedagógica</span>
              </span>
              <span className="text-[10px] font-black text-teal-800 bg-teal-200/80 px-2 py-0.5 rounded-full">
                {(bitacora.asistentesSalidaPedagogica || []).length} talleristas
              </span>
            </div>

            <div>
              <input
                type="text"
                value={bitacora.lugarSalidaPedagogica || ""}
                onChange={(e) =>
                  guardarBitacora({
                    ...bitacora,
                    lugarSalidaPedagogica: e.target.value,
                  })
                }
                placeholder="Lugar de la salida (ej. Jardín Botánico, Páramo)..."
                className="w-full px-2.5 py-1 rounded-xl border border-teal-300 text-xs font-bold bg-white text-teal-950 placeholder:text-teal-700/60"
              />
            </div>

            <p className="text-[11px] text-stone-600 font-medium">
              Todos los talleristas están invitados. Marca quiénes asistieron:
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {estado.talleristas.map((tNom) => {
                const asistio = (bitacora.asistentesSalidaPedagogica || []).some(
                  (a) => a.toLowerCase() === tNom.toLowerCase()
                );
                return (
                  <button
                    key={`salida-${tNom}`}
                    type="button"
                    onClick={() => {
                      const actuales = bitacora.asistentesSalidaPedagogica || [];
                      const nuevos = asistio
                        ? actuales.filter((a) => a.toLowerCase() !== tNom.toLowerCase())
                        : [...actuales, tNom];
                      guardarBitacora({
                        ...bitacora,
                        asistentesSalidaPedagogica: nuevos,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                      asistio
                        ? "bg-teal-600 text-white shadow-xs scale-105"
                        : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                    }`}
                  >
                    {asistio && <Check className="w-3 h-3" />}
                    <span>{tNom}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-6 border-2 border-[#E2DCCE] shadow-warm space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-stone-100 pb-3">
          <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-black text-sm">🏢</span>
          <div>
            <h3 className="text-base font-black text-topo-dark">Lista de Chequeo Operativa de la Sede</h3>
            <p className="text-xs text-stone-500">
              Marca cada hito logístico que se complete durante el sábado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Item 1: Llaves */}
          <div
            onClick={() => toggleCheck("aperturaLlaves")}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 select-none ${
              bitacora.aperturaLlaves
                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-black"
                : "bg-stone-50 border-stone-200 text-stone-600 font-bold hover:bg-amber-50"
            }`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              bitacora.aperturaLlaves ? "bg-emerald-600 text-white" : "border-2 border-stone-300 bg-white"
            }`}>
              {bitacora.aperturaLlaves && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <span className="block font-black">🔑 Apertura de sede y salones</span>
              <span className="text-[10px] opacity-75">Llegada y deschave a tiempo</span>
            </div>
          </div>

          {/* Item 2: Refrigerio */}
          <div
            onClick={() => toggleCheck("refrigerioEntregado")}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 select-none ${
              bitacora.refrigerioEntregado
                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-black"
                : "bg-stone-50 border-stone-200 text-stone-600 font-bold hover:bg-amber-50"
            }`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              bitacora.refrigerioEntregado ? "bg-emerald-600 text-white" : "border-2 border-stone-300 bg-white"
            }`}>
              {bitacora.refrigerioEntregado && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <span className="block font-black">☕ Refrigerio Comunitario</span>
              <span className="text-[10px] opacity-75">Repartido en el descanso</span>
            </div>
          </div>

          {/* Item 3: Círculo de la palabra */}
          <div
            onClick={() => toggleCheck("circuloPalabraRealizado")}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 select-none ${
              bitacora.circuloPalabraRealizado
                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-black"
                : "bg-stone-50 border-stone-200 text-stone-600 font-bold hover:bg-amber-50"
            }`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              bitacora.circuloPalabraRealizado ? "bg-emerald-600 text-white" : "border-2 border-stone-300 bg-white"
            }`}>
              {bitacora.circuloPalabraRealizado && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <span className="block font-black">🗣️ Círculo de la palabra</span>
              <span className="text-[10px] opacity-75">Información general / acuerdos</span>
            </div>
          </div>

          {/* Item 4: Aseo */}
          <div
            onClick={() => toggleCheck("aseoSalonesVerificado")}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 select-none ${
              bitacora.aseoSalonesVerificado
                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-black"
                : "bg-stone-50 border-stone-200 text-stone-600 font-bold hover:bg-amber-50"
            }`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              bitacora.aseoSalonesVerificado ? "bg-emerald-600 text-white" : "border-2 border-stone-300 bg-white"
            }`}>
              {bitacora.aseoSalonesVerificado && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <span className="block font-black">🧹 Aseo y entrega de salones</span>
              <span className="text-[10px] opacity-75">Basura recogida y tableros limpios</span>
            </div>
          </div>

          {/* Item 5: Cierre */}
          <div
            onClick={() => toggleCheck("cierreSedeRealizado")}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 select-none ${
              bitacora.cierreSedeRealizado
                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-black"
                : "bg-stone-50 border-stone-200 text-stone-600 font-bold hover:bg-amber-50"
            }`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              bitacora.cierreSedeRealizado ? "bg-emerald-600 text-white" : "border-2 border-stone-300 bg-white"
            }`}>
              {bitacora.cierreSedeRealizado && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <span className="block font-black">🔒 Cierre y candados</span>
              <span className="text-[10px] opacity-75">Puertas aseguradas y luces apagadas</span>
            </div>
          </div>
        </div>

        {/* Observaciones Generales */}
        <div className="pt-2">
          <label className="text-xs font-black uppercase text-stone-600 block mb-1">
            📝 Observaciones, Incidentes y Acuerdos del Día:
          </label>
          <textarea
            rows={3}
            value={bitacora.observacionesGenerales || ""}
            onChange={(e) =>
              guardarBitacora({
                ...bitacora,
                observacionesGenerales: e.target.value,
              })
            }
            placeholder="Anota cualquier novedad de los estudiantes, ausencias, temas que quedaron pendientes o acuerdos logrados..."
            className="w-full p-3 rounded-2xl border border-stone-300 text-xs font-bold text-topo-dark bg-stone-50 focus:bg-white resize-y"
          />
        </div>
      </div>

      {/* BARRA DE CIERRE Y BOTÓN DE WHATSAPP */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-topo-dark flex items-center gap-2">
            <span>📢 Reporte para el Grupo de Coordinación</span>
          </h4>
          <p className="text-xs text-stone-600">
            Copia el resumen formateado con emojis para enviarlo al grupo de WhatsApp con 1 solo clic.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopiarWhatsApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition hover:scale-105 active:scale-95"
          >
            {mensajeCopiado ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>¡Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Reporte para WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
