"use client";

import React, { useState } from "react";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CalendarRange,
  Clock,
  Layers,
  Award,
  AlertCircle,
  X,
} from "lucide-react";
import {
  CalendarioCicloTopo,
  ModalidadCiclo,
  FechaClaveExamen,
  JornadaPedagogica,
  BloqueClase,
  EstructuraCalendarioConfig,
} from "@/types";
import { FRANJAS_DEFECTO_ESTRUCTURAL } from "@/services/storageService";
import { esFestivoColombia } from "@/utils/festivosColombia";

interface ModalCrearCalendarioProps {
  abierto: boolean;
  onCerrar: () => void;
  onCrearCalendario: (nuevoCal: CalendarioCicloTopo) => void;
}

export function ModalCrearCalendario({
  abierto,
  onCerrar,
  onCrearCalendario,
}: ModalCrearCalendarioProps) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1: Configuración básica
  const [nombre, setNombre] = useState("2027 - Ciclo Anual");
  const [codigo, setCodigo] = useState("2027");
  const [ano, setAno] = useState(2027);
  const [modalidad, setModalidad] = useState<ModalidadCiclo>("anual");
  const [nombreCiclo1, setNombreCiclo1] = useState("Ciclo I (Semestre 1)");
  const [nombreCiclo2, setNombreCiclo2] = useState("Ciclo II (Semestre 2)");

  // Paso 2: Fechas del ciclo de clases
  const [fechaPrimerSabado, setFechaPrimerSabado] = useState("2027-02-06");
  const [fechaUltimoSabado, setFechaUltimoSabado] = useState("2027-10-09");
  const [omitirPuentes, setOmitirPuentes] = useState(true);

  // Paso 3: Hitos iniciales
  const [fechaInauguracion, setFechaInauguracion] = useState("2027-01-30");
  const [fechaSaber11, setFechaSaber11] = useState("2027-08-08");
  const [fechaUnal1, setFechaUnal1] = useState("2027-04-18");
  const [fechaUnal2, setFechaUnal2] = useState("2027-09-19");
  const [fechaAsamblea, setFechaAsamblea] = useState("2027-11-13");

  if (!abierto) return null;

  // Generar sábados en el rango seleccionado
  const generarJornadasSabatinas = (): JornadaPedagogica[] => {
    const jornadas: JornadaPedagogica[] = [];
    if (!fechaPrimerSabado || !fechaUltimoSabado) return jornadas;

    let actual = new Date(`${fechaPrimerSabado}T00:00:00`);
    const fin = new Date(`${fechaUltimoSabado}T00:00:00`);

    // Asegurar que comience en sábado
    while (actual.getDay() !== 6 && actual <= fin) {
      actual.setDate(actual.getDate() + 1);
    }

    let contadorJornada = 1;

    // 1. Agregar Jornada de Inauguración si está configurada antes o el primer sábado
    if (fechaInauguracion) {
      const dInaug = new Date(`${fechaInauguracion}T00:00:00`);
      const isoInaug = dInaug.toISOString().split("T")[0];
      const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      const diaNum = dInaug.getDate();
      const mesNom = meses[dInaug.getMonth()];
      const anoNum = dInaug.getFullYear();

      jornadas.push({
        id: `cal-${codigo}-j-inauguracion`,
        numeroJornada: "0",
        fechaISO: isoInaug,
        fecha: `${diaNum} de ${mesNom} de ${anoNum}`,
        diaSemana: "Sábado",
        caracter: "coordinacion",
        tipoJornada: "unificada",
        descripcionUnificada: `INAUGURACIÓN Y BIENVENIDA A FAMILIAS Y ESTUDIANTES ${codigo}`,
        encargadxDelDia: "Coordinación General",
        horasJornada: "8:00 AM - 1:00 PM",
        bloques: [
          {
            id: `b-inaug-1`,
            hora: "8:00 AM - 1:00 PM",
            componente: `INAUGURACIÓN Y BIENVENIDA ${codigo}`,
            temaDelDia: "Apertura colectiva, presentación de talleristas y acuerdos comunitarios",
            talleristas: "Equipo de Coordinación",
          },
        ],
        comentarios: `Hito oficial de inicio del ciclo escolar ${codigo}`,
      });
    }

    // 2. Generar sábados regulares de clases
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    while (actual <= fin) {
      const iso = actual.toISOString().split("T")[0];
      const esFestivo = esFestivoColombia(iso);

      const diaNum = actual.getDate();
      const mesNom = meses[actual.getMonth()];
      const anoNum = actual.getFullYear();
      const fechaTexto = `${diaNum} de ${mesNom} de ${anoNum}`;

      const esRecesoPuente = omitirPuentes && esFestivo;

      const bloques: BloqueClase[] = FRANJAS_DEFECTO_ESTRUCTURAL.map((franja, bIdx) => ({
        id: `cal-${codigo}-j${contadorJornada}-b${bIdx + 1}`,
        hora: franja,
        componente: "",
        temaDelDia: "",
        talleristas: "",
      }));

      jornadas.push({
        id: `cal-${codigo}-j${contadorJornada}`,
        numeroJornada: String(contadorJornada),
        fechaISO: iso,
        fecha: fechaTexto,
        diaSemana: "Sábado",
        caracter: esRecesoPuente ? "vacaciones" : "clases",
        tipoJornada: esRecesoPuente ? "unificada" : "clases",
        descripcionUnificada: esRecesoPuente ? "Sábado de receso (Puente Festivo)" : undefined,
        encargadxDelDia: "",
        horasJornada: "8:00 AM - 3:00 PM",
        bloques: bloques,
        comentarios: esRecesoPuente ? "Sin clases por puente festivo" : "",
      });

      contadorJornada++;
      actual.setDate(actual.getDate() + 7);
    }

    return jornadas;
  };

  const handleFinalizar = () => {
    const jornadasGeneradas = generarJornadasSabatinas();

    const hitosGenerados: FechaClaveExamen[] = [];

    if (fechaInauguracion) {
      hitosGenerados.push({
        id: `hito-inaug-${codigo}`,
        titulo: `Inauguración y Bienvenida ${codigo}`,
        tipo: "inauguracion",
        fecha: fechaInauguracion,
        descripcion: `Bienvenida a estudiantes y familias para el ciclo ${codigo}`,
      });
    }

    if (fechaUnal1) {
      hitosGenerados.push({
        id: `hito-unal1-${codigo}`,
        titulo: `Examen Admisión UNAL ${codigo}-2`,
        tipo: "unal",
        fecha: fechaUnal1,
        descripcion: "Prueba oficial de admisión primer semestre",
      });
    }

    if (fechaSaber11) {
      hitosGenerados.push({
        id: `hito-saber11-${codigo}`,
        titulo: `Prueba Saber 11 / ICFES ${codigo}`,
        tipo: "icfes",
        fecha: fechaSaber11,
        descripcion: "Examen de Estado oficial",
      });
    }

    if (fechaUnal2) {
      hitosGenerados.push({
        id: `hito-unal2-${codigo}`,
        titulo: `Examen Admisión UNAL ${ano + 1}-1`,
        tipo: "unal",
        fecha: fechaUnal2,
        descripcion: "Prueba oficial de admisión segundo semestre",
      });
    }

    if (fechaAsamblea) {
      hitosGenerados.push({
        id: `hito-asamblea-${codigo}`,
        titulo: `Asamblea General Topo ${codigo}`,
        tipo: "asamblea",
        fecha: fechaAsamblea,
        descripcion: "Balance anual y decisiones del siguiente ciclo",
      });
    }

    const nuevaEstructura: EstructuraCalendarioConfig = {
      modalidadCiclo: modalidad,
      nombreCiclo1: modalidad === "dos_ciclos" ? nombreCiclo1 : `Ciclo Anual ${codigo}`,
      nombreCiclo2: modalidad === "dos_ciclos" ? nombreCiclo2 : undefined,
      horaInicioDefecto: "8:00 AM",
      duracionBloqueMinutos: 90,
      periodosTemporales: [
        {
          id: `per-lectivo-${codigo}`,
          nombre: `Período Lectivo ${codigo}`,
          tipo: "clases",
          fechaInicio: fechaPrimerSabado,
          fechaFin: fechaUltimoSabado,
          colorHex: "#10B981",
        },
      ],
      fechasClaveExamenes: hitosGenerados,
    };

    const nuevoCalendario: CalendarioCicloTopo = {
      id: `cal-${codigo.toLowerCase().replace(/\s+/g, "-")}`,
      nombre: nombre.trim(),
      codigo: codigo.trim(),
      ano: Number(ano) || 2027,
      estado: "activo",
      fechaInicio: fechaPrimerSabado,
      fechaFin: fechaUltimoSabado,
      descripcion: `Calendario formativo ${nombre} generado desde el Asistente Oficial.`,
      jornadas: jornadasGeneradas,
      hitos: [],
      mallaCurricular: [],
      estructuraCalendario: nuevaEstructura,
      estudiantes: [],
      talleristasAsignados: [],
    };

    onCrearCalendario(nuevoCalendario);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-6 bg-gradient-to-r from-topo-dark via-slate-900 to-[#1B365D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-900 flex items-center justify-center text-lg font-black shadow-md">
              📅
            </div>
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <span>Asistente de Nuevo Calendario</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Exclusivo Coordinación
                </span>
              </h2>
              <p className="text-xs text-stone-300">
                Paso {paso} de 3: {paso === 1 ? "Modalidad y Nombre" : paso === 2 ? "Rango de Clases y Sábados" : "Hitos y Exámenes"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Pasos */}
        <div className="flex items-center justify-between px-6 py-3 bg-stone-100 border-b border-stone-200 text-xs font-black">
          <div className={`flex items-center gap-2 ${paso >= 1 ? "text-topo-dark" : "text-stone-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso >= 1 ? "bg-amber-400 text-stone-900" : "bg-stone-300 text-white"}`}>1</span>
            <span>Estructura y Modalidad</span>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-300" />
          <div className={`flex items-center gap-2 ${paso >= 2 ? "text-topo-dark" : "text-stone-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso >= 2 ? "bg-amber-400 text-stone-900" : "bg-stone-300 text-white"}`}>2</span>
            <span>Fechas Sabatinas</span>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-300" />
          <div className={`flex items-center gap-2 ${paso >= 3 ? "text-topo-dark" : "text-stone-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso >= 3 ? "bg-amber-400 text-stone-900" : "bg-stone-300 text-white"}`}>3</span>
            <span>Hitos y Metas</span>
          </div>
        </div>

        {/* Contenido según el Paso */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* PASO 1 */}
          {paso === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
                  Nombre del Calendario
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej. 2027 - Ciclo Anual Continuo"
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-stone-200 font-black text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
                    Código Breve
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="ej. 2027 o 2027-1"
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
                    Año Calendario
                  </label>
                  <input
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Selector de Modalidad */}
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                  Modalidad del Ciclo Formativo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalidad("anual")}
                    className={`p-4 rounded-2xl border-2 text-left transition ${
                      modalidad === "anual"
                        ? "border-emerald-500 bg-emerald-50/70 shadow-xs"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-stone-900">🌟 Ciclo Único Anual</span>
                      {modalidad === "anual" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      Un solo proceso continuo de febrero a octubre/noviembre con numeración corrida de jornadas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalidad("dos_ciclos")}
                    className={`p-4 rounded-2xl border-2 text-left transition ${
                      modalidad === "dos_ciclos"
                        ? "border-blue-500 bg-blue-50/70 shadow-xs"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-stone-900">🍂 Dos Ciclos (Semestres)</span>
                      {modalidad === "dos_ciclos" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      Año partido en dos cohortes independientes con corte a mitad de año en julio.
                    </p>
                  </button>
                </div>
              </div>

              {modalidad === "dos_ciclos" && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 animate-fadeIn">
                  <span className="text-xs font-black text-blue-900 block">Nombres de los Semestres:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={nombreCiclo1}
                      onChange={(e) => setNombreCiclo1(e.target.value)}
                      placeholder="Semestre 1"
                      className="px-3 py-1.5 rounded-xl border border-blue-300 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={nombreCiclo2}
                      onChange={(e) => setNombreCiclo2(e.target.value)}
                      placeholder="Semestre 2"
                      className="px-3 py-1.5 rounded-xl border border-blue-300 text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
                💡 Indica el rango en que se llevarán a cabo las jornadas sabatinas. El sistema generará automáticamente la secuencia de sábados con sus 4 bloques estándar.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
                    Primer Sábado de Clases
                  </label>
                  <input
                    type="date"
                    value={fechaPrimerSabado}
                    onChange={(e) => setFechaPrimerSabado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
                    Último Sábado de Clases
                  </label>
                  <input
                    type="date"
                    value={fechaUltimoSabado}
                    onChange={(e) => setFechaUltimoSabado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-stone-900 block">Detectar Puentes Festivos de Colombia</span>
                  <span className="text-[11px] text-stone-500">Marcar automáticamente como sábados de receso sin clases</span>
                </div>
                <input
                  type="checkbox"
                  checked={omitirPuentes}
                  onChange={(e) => setOmitirPuentes(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 font-medium">
                🎓 Puedes ingresar las fechas tentativas o confirmadas de los hitos principales. Podrás modificarlas o añadir nuevas en cualquier momento a lo largo del año.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-black text-stone-700 mb-1">🌟 Inauguración Oficial:</label>
                  <input
                    type="date"
                    value={fechaInauguracion}
                    onChange={(e) => setFechaInauguracion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">🏛️ Admisión UNAL Semestre 1:</label>
                  <input
                    type="date"
                    value={fechaUnal1}
                    onChange={(e) => setFechaUnal1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">📄 Saber 11 / ICFES Oficial:</label>
                  <input
                    type="date"
                    value={fechaSaber11}
                    onChange={(e) => setFechaSaber11(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">🏛️ Admisión UNAL Semestre 2:</label>
                  <input
                    type="date"
                    value={fechaUnal2}
                    onChange={(e) => setFechaUnal2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-black text-stone-700 mb-1">🗳️ Asamblea General de Balance:</label>
                  <input
                    type="date"
                    value={fechaAsamblea}
                    onChange={(e) => setFechaAsamblea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Navegación Inferior del Modal */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          {paso > 1 ? (
            <button
              type="button"
              onClick={() => setPaso((paso - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 font-black text-xs hover:bg-stone-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {paso < 3 ? (
            <button
              type="button"
              onClick={() => setPaso((paso + 1) as any)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#1B365D] hover:bg-[#132847] text-white font-black text-xs shadow-md transition transform active:scale-95"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizar}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generar Calendario Oficial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
