"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Download,
  BookOpen,
  Layers,
  Trash2,
  Copy,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Clock,
  UserCheck,
  Search,
  CalendarPlus,
  Pin,
  Gamepad2,
  Play,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  Wand2,
  PartyPopper,
  LayoutGrid,
} from "lucide-react";
import {
  BloqueClase,
  EventoCronograma,
  JornadaPedagogica,
  MallaComponente,
} from "@/types";
import {
  obtenerEstiloComponente,
  ddmmyyyyToISO,
  isoToFechaComunitaria,
  obtenerNombreDiaSemana,
} from "@/utils/festivosColombia";
import { obtenerTalleristasDeComponente } from "@/utils/seedData";
import { exportarJornadasAExcel } from "@/services/excelExporter";
import { TopoAvatar, FlorMuralSVG, SolMuralSVG, AbejitaMuralSVG } from "./TopoAvatar";

interface MatrizJornadasProps {
  jornadas: JornadaPedagogica[];
  mallaCurricular: MallaComponente[];
  hitos: EventoCronograma[];
  talleristas: string[];
  jornadaDestacadaId?: string | null;
  onActualizarJornada: (jornada: JornadaPedagogica) => void;
  onReemplazarJornadas: (nuevas: JornadaPedagogica[]) => void;
  onActualizarMalla: (nuevaMalla: MallaComponente[]) => void;
}

const COMPONENTES_LISTA = [
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

const FRANJAS_POR_DEFECTO = [
  "8:00 AM - 9:30 AM",
  "9:30 AM - 11:00 AM",
  "11:15 AM - 12:45 PM",
  "1:30 PM - 3:00 PM",
];

export function MatrizJornadas({
  jornadas,
  mallaCurricular,
  hitos,
  talleristas,
  jornadaDestacadaId,
  onActualizarJornada,
  onReemplazarJornadas,
  onActualizarMalla,
}: MatrizJornadasProps) {
  // Por defecto abrimos en el Modo Juego de Tarjetas para que sea súper claro e interactivo
  const [modoVisualizacion, setModoVisualizacion] = useState<"juego" | "matriz">("juego");
  const [juegoIniciado, setJuegoIniciado] = useState<boolean>(false);
  const [indiceTarjetaActual, setIndiceTarjetaActual] = useState<number>(0);
  const [animacionTarjeta, setAnimacionTarjeta] = useState<"entrando" | "aceptada" | "normal">("normal");
  const [filtroJuego, setFiltroJuego] = useState<"todas" | "clases" | "con_evento">("todas");

  const [mostrarMalla, setMostrarMalla] = useState<boolean>(false);
  const [filtroComponente, setFiltroComponente] = useState<string>("");
  const [filtroDia, setFiltroDia] = useState<"todos" | "sabados" | "otros" | "con_tarea">("todos");
  const [busquedaJornada, setBusquedaJornada] = useState<string>("");
  const [nuevaFechaISO, setNuevaFechaISO] = useState<string>("");

  const [dragOrigen, setDragOrigen] = useState<{
    tipo: "bloque" | "malla";
    jornadaId?: string;
    bloqueIdx?: number;
    componente?: string;
    tema?: string;
  } | null>(null);

  const contenedorScrollRef = useRef<HTMLDivElement | null>(null);

  // Ordenar siempre las jornadas cronológicamente y renumerarlas
  const jornadasOrdenadas = useMemo(() => {
    const copia = [...jornadas].sort((a, b) => {
      const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });
    return copia.map((j, idx) => ({
      ...j,
      numeroJornada: idx + 1,
      diaSemana: j.diaSemana || obtenerNombreDiaSemana(j.fechaISO || j.fecha) || "Sábado",
    }));
  }, [jornadas]);

  // Si viene una jornada destacada desde el Calendario, abrirla directo en el juego
  useEffect(() => {
    if (jornadaDestacadaId) {
      const idx = jornadasOrdenadas.findIndex((j) => j.id === jornadaDestacadaId);
      if (idx !== -1) {
        setFiltroJuego("todas");
        setIndiceTarjetaActual(idx);
        setJuegoIniciado(true);
      }
      if (contenedorScrollRef.current) {
        const el = document.getElementById(`col-${jornadaDestacadaId}`);
        el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [jornadaDestacadaId, jornadasOrdenadas]);

  const temasProgramadosSet = useMemo(() => {
    const set = new Set<string>();
    jornadas.forEach((j) => {
      j.bloques.forEach((b) => {
        if (b.temaDelDia?.trim()) {
          set.add(b.temaDelDia.trim().toLowerCase());
        }
      });
    });
    return set;
  }, [jornadas]);

  const asegurarCuatroBloques = (bloques: BloqueClase[], jornadaId: string): BloqueClase[] => {
    const copia = [...bloques];
    while (copia.length < 4) {
      const idx = copia.length;
      copia.push({
        id: `${jornadaId}-b${idx + 1}-${Date.now()}`,
        hora: FRANJAS_POR_DEFECTO[idx] || "1:30 PM - 3:00 PM",
        componente: "",
        temaDelDia: "",
        talleristas: "",
      });
    }
    return copia;
  };

  // Saber si una jornada ya está lista/revisada
  const esJornadaLista = (j: JornadaPedagogica) => {
    if (j.tipoJornada === "unificada") {
      return Boolean(j.descripcionUnificada?.trim() && j.encargadxDelDia?.trim());
    }
    return j.bloques.some((b) => Boolean(b.componente?.trim() || b.temaDelDia?.trim()));
  };

  // Mazo de tarjetas para el Modo Juego
  const mazoJuego = useMemo(() => {
    if (filtroJuego === "clases") {
      return jornadasOrdenadas.filter((j) => j.tipoJornada === "clases");
    }
    if (filtroJuego === "con_evento") {
      return jornadasOrdenadas.filter(
        (j) =>
          Boolean(j.comentarios?.trim()) ||
          Boolean(j.tareasDelDia?.trim()) ||
          j.tipoJornada === "unificada"
      );
    }
    return jornadasOrdenadas;
  }, [jornadasOrdenadas, filtroJuego]);

  const tarjetaActual = mazoJuego[indiceTarjetaActual] || mazoJuego[0];
  const tarjetaSiguiente = mazoJuego[indiceTarjetaActual + 1];

  // Buscar el primer evento o sábado que falta por llenar para el botón "¡Empezar!"
  const iniciarJuegoEnSiguientePorLlenar = () => {
    const idxPendiente = mazoJuego.findIndex((j) => !esJornadaLista(j));
    setIndiceTarjetaActual(idxPendiente !== -1 ? idxPendiente : 0);
    setJuegoIniciado(true);
  };

  // Animación al darle "¡Aceptar y Siguiente Tarjeta!"
  const aceptarYAvanzarTarjeta = () => {
    if (!tarjetaActual) return;
    // Si es unificada y no tenía encargado, le ponemos "Equipo El Topo" para marcarla lista
    if (tarjetaActual.tipoJornada === "unificada" && !tarjetaActual.encargadxDelDia?.trim()) {
      onActualizarJornada({
        ...tarjetaActual,
        encargadxDelDia: "Equipo El Topo",
      });
    }
    setAnimacionTarjeta("aceptada");
    setTimeout(() => {
      if (indiceTarjetaActual < mazoJuego.length - 1) {
        setIndiceTarjetaActual((prev) => prev + 1);
      }
      setAnimacionTarjeta("entrando");
      setTimeout(() => setAnimacionTarjeta("normal"), 220);
    }, 240);
  };

  /**
   * Al elegir un Componente en un bloque, autocompleta automáticamente:
   * 1. Los Talleristas que pertenecen a ese componente (según Cronograma 2026).
   * 2. La siguiente Sesión disponible de la Malla Curricular de ese componente que aún no se haya programado.
   */
  const seleccionarComponenteConAutocompletado = (
    jornada: JornadaPedagogica,
    bloqueIdx: number,
    nuevoComp: string
  ) => {
    const bloquesNorm = asegurarCuatroBloques(jornada.bloques, jornada.id);
    const bloqueActual = bloquesNorm[bloqueIdx];

    const filaMalla = mallaCurricular.find(
      (m) => m.componente.toUpperCase() === nuevoComp.trim().toUpperCase()
    );
    const talleristasDelComp =
      filaMalla?.talleristasBase || obtenerTalleristasDeComponente(nuevoComp);

    // Buscar la primera sesión de ese componente que no se haya programado aún
    let temaSugerido = bloqueActual.temaDelDia || "";
    if (!temaSugerido.trim() && filaMalla) {
      const primeraSesionLibre = filaMalla.sesiones.find(
        (s) => s.trim().length > 0 && !temasProgramadosSet.has(s.trim().toLowerCase())
      );
      if (primeraSesionLibre) {
        temaSugerido = primeraSesionLibre;
      } else if (filaMalla.sesiones[0]) {
        temaSugerido = filaMalla.sesiones[0];
      }
    }

    bloquesNorm[bloqueIdx] = {
      ...bloqueActual,
      componente: nuevoComp,
      talleristas:
        talleristasDelComp.length > 0
          ? talleristasDelComp.join(", ")
          : bloqueActual.talleristas,
      temaDelDia: temaSugerido,
    };

    onActualizarJornada({
      ...jornada,
      bloques: bloquesNorm,
    });
  };

  // Alternar un tallerista individual con clic en su chip
  const toggleTalleristaEnBloque = (
    jornada: JornadaPedagogica,
    bloqueIdx: number,
    nombreTallerista: string
  ) => {
    const bloquesNorm = asegurarCuatroBloques(jornada.bloques, jornada.id);
    const actualStr = bloquesNorm[bloqueIdx].talleristas || "";
    const actuales = actualStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const existe = actuales.some((n) => n.toLowerCase() === nombreTallerista.toLowerCase());
    const nuevos = existe
      ? actuales.filter((n) => n.toLowerCase() !== nombreTallerista.toLowerCase())
      : [...actuales, nombreTallerista];

    bloquesNorm[bloqueIdx] = {
      ...bloquesNorm[bloqueIdx],
      talleristas: nuevos.join(", "),
    };
    onActualizarJornada({ ...jornada, bloques: bloquesNorm });
  };

  // Filtrado para la Vista Matriz Clásica
  const jornadasVisibles = useMemo(() => {
    return jornadasOrdenadas.filter((j) => {
      if (filtroDia === "sabados" && j.diaSemana !== "Sábado") return false;
      if (filtroDia === "otros" && j.diaSemana === "Sábado") return false;
      if (
        filtroDia === "con_tarea" &&
        !j.comentarios?.trim() &&
        !j.tareasDelDia?.trim() &&
        !j.descripcionUnificada?.trim()
      ) {
        return false;
      }

      if (filtroComponente) {
        if (j.tipoJornada === "unificada") return false;
        const tieneComp = j.bloques.some(
          (b) => (b.componente || "").toUpperCase() === filtroComponente.toUpperCase()
        );
        if (!tieneComp) return false;
      }

      if (!busquedaJornada.trim()) return true;
      const q = busquedaJornada.toLowerCase();
      const matchCabecera =
        String(j.numeroJornada || "").toLowerCase().includes(q) ||
        (j.fecha || "").toLowerCase().includes(q) ||
        (j.diaSemana || "").toLowerCase().includes(q) ||
        (j.encargadxDelDia || "").toLowerCase().includes(q) ||
        (j.descripcionUnificada || "").toLowerCase().includes(q) ||
        (j.comentarios || "").toLowerCase().includes(q);
      if (matchCabecera) return true;
      return j.bloques.some(
        (b) =>
          (b.componente || "").toLowerCase().includes(q) ||
          (b.temaDelDia || "").toLowerCase().includes(q) ||
          (b.talleristas || "").toLowerCase().includes(q)
      );
    });
  }, [jornadasOrdenadas, filtroComponente, filtroDia, busquedaJornada]);

  const manejarDropEnBloque = (targetJornada: JornadaPedagogica, targetIdx: number) => {
    if (!dragOrigen) return;
    const bloquesTarget = asegurarCuatroBloques(targetJornada.bloques, targetJornada.id);

    if (dragOrigen.tipo === "malla") {
      const talls = obtenerTalleristasDeComponente(dragOrigen.componente);
      bloquesTarget[targetIdx] = {
        ...bloquesTarget[targetIdx],
        componente: dragOrigen.componente || bloquesTarget[targetIdx].componente,
        temaDelDia: dragOrigen.tema || bloquesTarget[targetIdx].temaDelDia,
        talleristas:
          !bloquesTarget[targetIdx].talleristas && talls.length > 0
            ? talls.join(", ")
            : bloquesTarget[targetIdx].talleristas,
      };
      onActualizarJornada({
        ...targetJornada,
        tipoJornada: "clases",
        bloques: bloquesTarget,
      });
      setDragOrigen(null);
      return;
    }

    if (
      dragOrigen.tipo === "bloque" &&
      dragOrigen.jornadaId !== undefined &&
      dragOrigen.bloqueIdx !== undefined
    ) {
      const sourceJornada = jornadas.find((j) => j.id === dragOrigen.jornadaId);
      if (!sourceJornada) return;
      const sourceIdx = dragOrigen.bloqueIdx;
      const bloquesSource = asegurarCuatroBloques(sourceJornada.bloques, sourceJornada.id);

      if (sourceJornada.id === targetJornada.id) {
        const temp = { ...bloquesSource[sourceIdx] };
        const horaOrigen = bloquesSource[sourceIdx].hora;
        const horaDestino = bloquesSource[targetIdx].hora;
        bloquesSource[sourceIdx] = { ...bloquesSource[targetIdx], hora: horaOrigen };
        bloquesSource[targetIdx] = { ...temp, hora: horaDestino };
        onActualizarJornada({ ...sourceJornada, bloques: bloquesSource });
      } else {
        const nuevasJornadas = jornadas.map((j) => {
          if (j.id === sourceJornada.id) {
            const copiaS = asegurarCuatroBloques(j.bloques, j.id);
            const horaS = copiaS[sourceIdx].hora;
            copiaS[sourceIdx] = {
              ...bloquesTarget[targetIdx],
              id: copiaS[sourceIdx].id,
              hora: horaS,
            };
            return { ...j, bloques: copiaS };
          }
          if (j.id === targetJornada.id) {
            const copiaT = asegurarCuatroBloques(j.bloques, j.id);
            const horaT = copiaT[targetIdx].hora;
            copiaT[targetIdx] = {
              ...bloquesSource[sourceIdx],
              id: copiaT[targetIdx].id,
              hora: horaT,
            };
            return { ...j, bloques: copiaT };
          }
          return j;
        });
        onReemplazarJornadas(nuevasJornadas);
      }
    }
    setDragOrigen(null);
  };

  const agregarDiaEspecifico = (isoParam?: string) => {
    const iso = isoParam || nuevaFechaISO;
    const nuevaId = `jornada-custom-${Date.now()}`;
    const diaSemana = iso ? obtenerNombreDiaSemana(iso) : "Por definir";
    const fechaTexto = iso ? isoToFechaComunitaria(iso) : "";

    const nueva: JornadaPedagogica = {
      id: nuevaId,
      numeroJornada: jornadas.length + 1,
      fechaISO: iso || undefined,
      fecha: fechaTexto,
      diaSemana,
      encargadxDelDia: "",
      horasJornada: "8:00 AM - 3:00 PM",
      tipoJornada: "clases",
      bloques: FRANJAS_POR_DEFECTO.map((hora, i) => ({
        id: `${nuevaId}-b${i + 1}`,
        hora,
        componente: "",
        temaDelDia: "",
        talleristas: "",
      })),
      comentarios: "",
    };

    const actualizadas = [...jornadas, nueva].sort((a, b) => {
      const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });

    onReemplazarJornadas(actualizadas);
    setNuevaFechaISO("");
  };

  const duplicarJornada = (jornada: JornadaPedagogica) => {
    const nuevaId = `jornada-${Date.now()}`;
    const copia: JornadaPedagogica = {
      ...jornada,
      id: nuevaId,
      bloques: jornada.bloques.map((b, i) => ({
        ...b,
        id: `${nuevaId}-b${i + 1}`,
      })),
    };
    const idx = jornadas.findIndex((j) => j.id === jornada.id);
    const nuevas = [...jornadas];
    nuevas.splice(idx + 1, 0, copia);
    onReemplazarJornadas(nuevas);
  };

  const eliminarJornada = (id: string, num?: number | string) => {
    if (window.confirm(`¿Eliminar la Jornada ${num ?? ""}?`)) {
      onReemplazarJornadas(jornadas.filter((j) => j.id !== id));
    }
  };

  const totalListas = jornadasOrdenadas.filter(esJornadaLista).length;
  const porcentajeProgreso = Math.round(
    (totalListas / Math.max(1, jornadasOrdenadas.length)) * 100
  );

  return (
    <div className="space-y-5">
      {/* BARRA SUPERIOR DE MODO: JUEGO DE TARJETAS vs VISTA SÁBANA / MATRIZ */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-topo-mustard/30 border-2 border-topo-mustard text-topo-dark">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-topo-dark">
                Programador de Clases y Jornadas 2027
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-topo-green text-xs font-black">
                {totalListas} / {jornadasOrdenadas.length} fechas listas ({porcentajeProgreso}%)
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Al elegir una materia, <strong>se llenan automáticamente sus talleristas</strong> y
              su siguiente sesión sugerida.
            </p>
          </div>
        </div>

        {/* Conmutador grande: Modo Juego de Tarjetas vs Vista Matriz Completa */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1.5 border-2 border-[#E2DCCE]">
            <button
              type="button"
              onClick={() => setModoVisualizacion("juego")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                modoVisualizacion === "juego"
                  ? "bg-topo-mustard text-topo-dark shadow-sm"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-topo-terracotta" />
              Modo Juego (Tarjetas Paso a Paso)
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacion("matriz")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                modoVisualizacion === "matriz"
                  ? "bg-matrix-header text-white shadow-sm"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Ver Sábana Completa ({jornadasOrdenadas.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarMalla((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 border-[#D5CBB8] bg-white hover:bg-[#F6F2E9] text-topo-dark font-extrabold text-xs transition"
          >
            <BookOpen className="w-4 h-4 text-topo-green" />
            {mostrarMalla ? "Ocultar Materias y Talleristas" : "Ver Materias y Talleristas"}
          </button>

          <button
            type="button"
            onClick={() => exportarJornadasAExcel(jornadasOrdenadas, mallaCurricular, hitos)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-topo-green hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition"
          >
            <Download className="w-4 h-4 text-amber-200" />
            Descargar Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* PANEL COLAPSABLE: TABLA DE COMPONENTES, TALLERISTAS Y SESIONES 1 A 11 */}
      {mostrarMalla && (
        <div className="rounded-3xl bg-white border-2 border-[#E2DCCE] shadow-warm overflow-hidden animate-fadeIn">
          <div className="px-5 py-3 bg-matrix-header text-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-black">
                Componentes, Talleristas por Materia y Banco de Sesiones (1 a 11)
              </h3>
            </div>
            <span className="text-xs text-amber-200 font-semibold">
              Todo lo que edites aquí se refleja en las tarjetas y en la parte superior del Excel
            </span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-matrix-sub text-white">
                <tr>
                  <th className="py-2.5 px-3 font-black sticky left-0 z-20 bg-matrix-header min-w-[210px] border-r border-slate-600">
                    COMPONENTE Y TALLERISTAS
                  </th>
                  {Array.from({ length: 11 }).map((_, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-2.5 font-extrabold text-center min-w-[175px] border-r border-slate-600/60"
                    >
                      SESIÓN {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mallaCurricular.map((fila, filaIdx) => {
                  const estilo = obtenerEstiloComponente(fila.componente);
                  const talls =
                    fila.talleristasBase || obtenerTalleristasDeComponente(fila.componente);
                  return (
                    <tr key={fila.id} className="border-b border-stone-200 hover:bg-amber-50/20">
                      <td
                        className={`py-2 px-3 sticky left-0 z-10 border-r border-stone-300 ${estilo.bg} ${estilo.text}`}
                      >
                        <div className="font-black text-xs">{fila.componente}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {talls.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded-md bg-white/90 border border-current/20 text-[10px] font-bold"
                            >
                              👤 {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      {Array.from({ length: 11 }).map((_, sesIdx) => {
                        const textoSesion = fila.sesiones[sesIdx] || "";
                        const yaProgramada =
                          textoSesion.trim().length > 0 &&
                          temasProgramadosSet.has(textoSesion.trim().toLowerCase());

                        return (
                          <td
                            key={sesIdx}
                            draggable={Boolean(textoSesion.trim())}
                            onDragStart={() =>
                              setDragOrigen({
                                tipo: "malla",
                                componente: fila.componente,
                                tema: textoSesion,
                              })
                            }
                            className={`p-1.5 align-top border-r border-stone-200 transition ${
                              textoSesion.trim()
                                ? "cursor-grab active:cursor-grabbing"
                                : ""
                            } ${yaProgramada ? "bg-emerald-50/80" : ""}`}
                          >
                            <div className="relative">
                              <textarea
                                rows={2}
                                value={textoSesion}
                                onChange={(e) => {
                                  const nuevaMalla = mallaCurricular.map((m, i) => {
                                    if (i !== filaIdx) return m;
                                    const nuevasSes = [...m.sesiones];
                                    nuevasSes[sesIdx] = e.target.value;
                                    return { ...m, sesiones: nuevasSes };
                                  });
                                  onActualizarMalla(nuevaMalla);
                                }}
                                placeholder={`Sesión ${sesIdx + 1}...`}
                                className="w-full rounded-lg border-transparent hover:border-stone-300 focus:border-topo-mustard bg-transparent p-1 text-[11px] leading-snug text-stone-800 resize-none"
                              />
                              {yaProgramada && (
                                <span
                                  title="Ya programada en una jornada"
                                  className="absolute bottom-1 right-1 text-topo-green"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
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

      {/* =====================================================================
          MODO 1: JUEGO INTERACTIVO DE TARJETAS PASO A PASO
         ===================================================================== */}
      {modoVisualizacion === "juego" && (
        <div className="space-y-4">
          {!juegoIniciado ? (
            /* PANTALLA DE BIENVENIDA DEL JUEGO CON BOTÓN "¡EMPEZAR!" */
            <div className="relative rounded-3xl bg-white border-4 border-topo-mustard p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-warm-lg overflow-hidden">
              <SolMuralSVG className="w-24 h-24 absolute top-4 right-6 opacity-90" />
              <AbejitaMuralSVG className="w-10 h-10 absolute top-10 left-10" />

              <TopoAvatar size="xl" variant="completo" className="mb-4" />

              <span className="px-4 py-1 rounded-full bg-amber-100 border-2 border-topo-mustard text-xs font-black uppercase tracking-wider text-topo-dark mb-3">
                🎲 Modo Juego • Armemos el Cronograma 2027
              </span>

              <h3 className="text-2xl sm:text-3xl font-black text-topo-dark max-w-2xl leading-tight">
                ¡Vamos a llenar las fechas y clases de 2027 tarjeta por tarjeta!
              </h3>
              <p className="text-sm sm:text-base text-stone-600 mt-3 max-w-xl leading-relaxed">
                En lugar de perderte en una tabla gigante, aquí irá apareciendo{" "}
                <strong>una tarjeta a la vez en orden cronológico</strong>. Eliges la materia con un
                clic (ya trae sus <strong>talleristas y temas listos</strong>), le das en{" "}
                <strong className="text-topo-green">¡Aceptar y Siguiente!</strong> y pasa a la
                próxima fecha.
              </p>

              {/* Resumen de tarjetas por tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-6">
                <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-left">
                  <span className="text-xs font-black uppercase text-amber-900">
                    📅 Total Fechas 2027
                  </span>
                  <p className="text-2xl font-black text-topo-dark mt-0.5">
                    {jornadasOrdenadas.length} tarjetas
                  </p>
                  <p className="text-[11px] text-stone-600">
                    52 sábados + 14 fechas con tareas
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-200 text-left">
                  <span className="text-xs font-black uppercase text-matrix-header">
                    🎓 Sábados de Clases
                  </span>
                  <p className="text-2xl font-black text-matrix-header mt-0.5">
                    {jornadasOrdenadas.filter((j) => j.tipoJornada === "clases").length} sábados
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Con 4 bloques listos para elegir materia
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-left">
                  <span className="text-xs font-black uppercase text-topo-green">
                    ★ Fechas con Tarea 2027
                  </span>
                  <p className="text-2xl font-black text-topo-green mt-0.5">
                    {
                      jornadasOrdenadas.filter(
                        (j) =>
                          Boolean(j.comentarios?.trim()) ||
                          Boolean(j.tareasDelDia?.trim()) ||
                          j.tipoJornada === "unificada"
                      ).length
                    }{" "}
                    hitos
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Convocatoria, reuniones, simulacros y salidas
                  </p>
                </div>
              </div>

              {/* Botones para Empezar el Juego */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setFiltroJuego("todas");
                    setIndiceTarjetaActual(0);
                    setJuegoIniciado(true);
                  }}
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-black text-base shadow-warm-lg hover:scale-[1.02] transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  ¡Empezar desde la Tarjeta #1!
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFiltroJuego("clases");
                    setIndiceTarjetaActual(0);
                    setJuegoIniciado(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-matrix-header hover:bg-matrix-sub text-white font-black text-sm shadow-warm transition"
                >
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  Ir directo a los Sábados de Clases (06 Feb)
                </button>
              </div>

              <div className="flex items-end justify-center gap-4 mt-8 opacity-90">
                <FlorMuralSVG className="w-9 h-9" />
                <FlorMuralSVG className="w-7 h-7" />
                <FlorMuralSVG className="w-10 h-10" />
                <FlorMuralSVG className="w-8 h-8" />
              </div>
            </div>
          ) : (
            /* TABLERO ACTIVO DEL JUEGO DE TARJETAS */
            <div className="space-y-4">
              {/* Barra de Progreso y Selector de Mazo */}
              <div className="bg-white p-4 rounded-3xl border-2 border-[#E2DCCE] shadow-warm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase text-stone-500">
                      ¿Qué tarjetas quieres recorrer?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroJuego("todas");
                        setIndiceTarjetaActual(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        filtroJuego === "todas"
                          ? "bg-topo-mustard text-topo-dark"
                          : "bg-[#F6F2E9] text-stone-600 hover:text-topo-dark"
                      }`}
                    >
                      Todas en orden ({jornadasOrdenadas.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroJuego("clases");
                        setIndiceTarjetaActual(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        filtroJuego === "clases"
                          ? "bg-matrix-header text-white"
                          : "bg-[#F6F2E9] text-stone-600 hover:text-topo-dark"
                      }`}
                    >
                      Solo Sábados de Clases (
                      {jornadasOrdenadas.filter((j) => j.tipoJornada === "clases").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroJuego("con_evento");
                        setIndiceTarjetaActual(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        filtroJuego === "con_evento"
                          ? "bg-topo-green text-white"
                          : "bg-[#F6F2E9] text-stone-600 hover:text-topo-dark"
                      }`}
                    >
                      Solo Fechas con Tarea 2027
                    </button>
                  </div>

                  {/* Vista previa de "Cuál es el siguiente evento" */}
                  {tarjetaSiguiente && (
                    <div
                      onClick={() => setIndiceTarjetaActual((i) => i + 1)}
                      className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs hover:bg-amber-100 transition"
                    >
                      <span className="font-black text-topo-terracotta uppercase">
                        Siguiente tarjeta 👉
                      </span>
                      <span className="font-extrabold text-topo-dark">
                        {tarjetaSiguiente.fecha} ({tarjetaSiguiente.diaSemana})
                      </span>
                    </div>
                  )}
                </div>

                {/* Tira de bolitas / pasos para saltar a cualquier tarjeta */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-1">
                  {mazoJuego.map((j, idx) => {
                    const activa = idx === indiceTarjetaActual;
                    const lista = esJornadaLista(j);
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setIndiceTarjetaActual(idx)}
                        title={`Jornada ${j.numeroJornada}: ${j.fecha} (${j.diaSemana})`}
                        className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-black transition flex items-center gap-1 ${
                          activa
                            ? "bg-topo-mustard text-topo-dark ring-2 ring-topo-dark scale-105"
                            : lista
                            ? "bg-emerald-100 text-topo-green border border-emerald-300"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {lista && <Check className="w-3 h-3" />}
                        <span>#{j.numeroJornada}</span>
                        <span className="hidden sm:inline text-[10px] font-bold opacity-85">
                          {j.fecha?.split(" de ")[0]} {j.fecha?.split(" de ")[1]?.slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TARJETA CENTRAL ANIMADA DEL JUEGO */}
              {tarjetaActual && (
                <div
                  className={`rounded-3xl bg-white border-4 shadow-warm-lg overflow-hidden transition-all duration-200 ${
                    animacionTarjeta === "aceptada"
                      ? "translate-x-10 -rotate-1 opacity-20 border-topo-green bg-emerald-50"
                      : animacionTarjeta === "entrando"
                      ? "-translate-x-6 opacity-60 border-topo-mustard"
                      : "translate-x-0 opacity-100 border-topo-mustard"
                  }`}
                >
                  {/* CABECERA COLORIDA DE LA TARJETA ACTUAL */}
                  <div className="bg-gradient-to-r from-matrix-header via-matrix-sub to-topo-green text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-topo-mustard text-topo-dark flex flex-col items-center justify-center font-black shadow-md shrink-0">
                        <span className="text-[10px] uppercase leading-none">TARJETA</span>
                        <span className="text-2xl leading-none mt-0.5">
                          #{tarjetaActual.numeroJornada}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-0.5 rounded-full bg-amber-300 text-topo-dark text-xs font-black uppercase">
                            📅 {tarjetaActual.diaSemana}
                          </span>
                          <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                            Paso {indiceTarjetaActual + 1} de {mazoJuego.length}
                          </span>
                          {esJornadaLista(tarjetaActual) && (
                            <span className="px-3 py-0.5 rounded-full bg-emerald-400 text-topo-dark text-xs font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ¡Tarjeta completada!
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black mt-1 capitalize">
                          {tarjetaActual.fecha}
                        </h3>
                      </div>
                    </div>

                    {/* Botón para cambiar si este día es Hito Unificado o Día de 4 Clases */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onActualizarJornada({
                            ...tarjetaActual,
                            tipoJornada:
                              tarjetaActual.tipoJornada === "unificada"
                                ? "clases"
                                : "unificada",
                            bloques: asegurarCuatroBloques(
                              tarjetaActual.bloques,
                              tarjetaActual.id
                            ),
                          })
                        }
                        className="px-3.5 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-amber-300" />
                        {tarjetaActual.tipoJornada === "unificada"
                          ? "Cambiar a Sábado de 4 Clases"
                          : "Cambiar a Evento / Hito Único"}
                      </button>
                    </div>
                  </div>

                  {/* CUERPO DE LA TARJETA: GUÍA PASO A PASO */}
                  <div className="p-5 sm:p-6 space-y-6 bg-[#FCFBF7]">
                    {/* Si este día tiene una tarea programada en con_tareas_2027, mostrarla grande y clara */}
                    {(tarjetaActual.comentarios?.trim() ||
                      tarjetaActual.tareasDelDia?.trim()) && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-topo-green/50 flex items-start gap-3">
                        <Pin className="w-5 h-5 text-topo-green shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-xs font-black uppercase tracking-wider text-topo-green block">
                            ★ Evento / Tarea 2027 ya agendada para esta fecha:
                          </span>
                          <p className="text-sm font-extrabold text-emerald-950 whitespace-pre-line mt-1">
                            {tarjetaActual.comentarios || tarjetaActual.tareasDelDia}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* PASO 1: ENCARGADX DEL DÍA Y HORARIO GENERAL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border-2 border-[#E2DCCE]">
                      <div>
                        <label className="block text-xs font-black uppercase text-topo-dark mb-1.5">
                          1️⃣ ¿Quién es el/la Encargadx general de este día?
                        </label>
                        <input
                          type="text"
                          list="lista-talleristas-topo"
                          value={tarjetaActual.encargadxDelDia || ""}
                          onChange={(e) =>
                            onActualizarJornada({
                              ...tarjetaActual,
                              encargadxDelDia: e.target.value,
                            })
                          }
                          placeholder="Escribe un nombre o elige de las píldoras abajo..."
                          className="w-full rounded-xl border-stone-300 text-sm font-bold text-topo-dark"
                        />
                        {/* Píldoras rápidas de encargadx */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {[
                            "Todos",
                            "Camilo Torres",
                            "Yarid",
                            "David Guáqueta",
                            "Lesley Cortés",
                            "Canela",
                            "Tati",
                            "Diego",
                            "Yeral",
                            "Alexa",
                            "Kevin Quevedo",
                          ].map((nom) => (
                            <button
                              key={nom}
                              type="button"
                              onClick={() =>
                                onActualizarJornada({
                                  ...tarjetaActual,
                                  encargadxDelDia: nom,
                                })
                              }
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                                tarjetaActual.encargadxDelDia === nom
                                  ? "bg-topo-mustard text-topo-dark border-topo-dark"
                                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-amber-50"
                              }`}
                            >
                              {nom}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-topo-dark mb-1.5">
                          ⏰ Horario de la jornada:
                        </label>
                        <input
                          type="text"
                          value={tarjetaActual.horasJornada || ""}
                          onChange={(e) =>
                            onActualizarJornada({
                              ...tarjetaActual,
                              horasJornada: e.target.value,
                            })
                          }
                          placeholder="8:00 AM - 3:00 PM"
                          className="w-full rounded-xl border-stone-300 text-sm font-bold text-topo-dark"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {["8:00 AM - 3:00 PM", "8:00 AM - 12:00 M", "8:00 AM - 1:00 PM", "Por definir"].map(
                            (h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() =>
                                  onActualizarJornada({
                                    ...tarjetaActual,
                                    horasJornada: h,
                                  })
                                }
                                className="px-2.5 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-[11px] font-bold text-stone-700"
                              >
                                {h}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PASO 2: SI ES EVENTO UNIFICADO vs SI ES SÁBADO DE 4 CLASES */}
                    {tarjetaActual.tipoJornada === "unificada" ? (
                      <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-black uppercase">
                            2️⃣ Actividad / Tarea Especial de esta Fecha
                          </span>
                          <FlorMuralSVG className="w-8 h-8" />
                        </div>
                        <p className="text-xs text-stone-600">
                          Revisa o ajusta los compromisos de este evento y dale en{" "}
                          <strong>¡Aceptar y Siguiente Tarjeta!</strong> abajo.
                        </p>
                        <textarea
                          rows={5}
                          value={tarjetaActual.descripcionUnificada || ""}
                          onChange={(e) =>
                            onActualizarJornada({
                              ...tarjetaActual,
                              descripcionUnificada: e.target.value,
                            })
                          }
                          placeholder="Describe la actividad, reunión, convocatoria o salida pedagógica de este día..."
                          className="w-full rounded-2xl border-amber-300 bg-white p-4 text-sm font-bold text-topo-dark leading-relaxed"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase text-topo-dark">
                            2️⃣ Elige las 4 Clases de este Sábado (haz clic en una materia y se
                            pondrán sus talleristas y tema):
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {asegurarCuatroBloques(
                            tarjetaActual.bloques,
                            tarjetaActual.id
                          )
                            .slice(0, 4)
                            .map((bloque, bIdx) => {
                              const estilo = obtenerEstiloComponente(bloque.componente);
                              const filaMallaComp = mallaCurricular.find(
                                (m) =>
                                  m.componente.toUpperCase() ===
                                  (bloque.componente || "").trim().toUpperCase()
                              );
                              const talleristasSugeridos =
                                filaMallaComp?.talleristasBase ||
                                obtenerTalleristasDeComponente(bloque.componente);

                              return (
                                <div
                                  key={bloque.id || bIdx}
                                  className={`rounded-3xl border-2 p-4 space-y-3 transition shadow-sm ${estilo.bg} ${estilo.border}`}
                                >
                                  {/* Cabecera del Bloque: Número + Horario */}
                                  <div className="flex items-center justify-between gap-2 bg-white/90 px-3 py-1.5 rounded-2xl border border-stone-200">
                                    <span className="px-2.5 py-0.5 rounded-lg bg-matrix-header text-white text-xs font-black">
                                      BLOQUE {bIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={bloque.hora || ""}
                                      onChange={(e) => {
                                        const nuevos = asegurarCuatroBloques(
                                          tarjetaActual.bloques,
                                          tarjetaActual.id
                                        );
                                        nuevos[bIdx] = { ...bloque, hora: e.target.value };
                                        onActualizarJornada({
                                          ...tarjetaActual,
                                          bloques: nuevos,
                                        });
                                      }}
                                      className="bg-transparent border-transparent focus:bg-white rounded px-2 py-0.5 text-xs font-black text-matrix-header text-right"
                                    />
                                  </div>

                                  {/* Botones de Colores Divertidos para elegir Componente con 1 clic */}
                                  <div>
                                    <span className="text-[11px] font-black uppercase text-stone-600 block mb-1.5">
                                      Elige el Componente / Materia:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {COMPONENTES_LISTA.map((comp) => {
                                        const estComp = obtenerEstiloComponente(comp);
                                        const activo =
                                          (bloque.componente || "").toUpperCase() === comp;
                                        return (
                                          <button
                                            key={comp}
                                            type="button"
                                            onClick={() =>
                                              seleccionarComponenteConAutocompletado(
                                                tarjetaActual,
                                                bIdx,
                                                comp
                                              )
                                            }
                                            className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase transition border ${
                                              activo
                                                ? `${estComp.badgeBg} border-topo-dark ring-2 ring-topo-dark/40 scale-105`
                                                : "bg-white/90 text-stone-700 border-stone-300 hover:scale-105"
                                            }`}
                                          >
                                            {comp}
                                          </button>
                                        );
                                      })}
                                      {bloque.componente && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nuevos = asegurarCuatroBloques(
                                              tarjetaActual.bloques,
                                              tarjetaActual.id
                                            );
                                            nuevos[bIdx] = {
                                              ...bloque,
                                              componente: "",
                                              temaDelDia: "",
                                              talleristas: "",
                                            };
                                            onActualizarJornada({
                                              ...tarjetaActual,
                                              bloques: nuevos,
                                            });
                                          }}
                                          className="px-2 py-1 rounded-xl text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100"
                                        >
                                          Limpiar
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Selector de Sesión / Tema del día */}
                                  <div>
                                    <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                                      📖 Tema de la Clase (Sesión):
                                    </label>
                                    {filaMallaComp && (
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (!e.target.value) return;
                                          const nuevos = asegurarCuatroBloques(
                                            tarjetaActual.bloques,
                                            tarjetaActual.id
                                          );
                                          nuevos[bIdx] = {
                                            ...bloque,
                                            temaDelDia: e.target.value,
                                          };
                                          onActualizarJornada({
                                            ...tarjetaActual,
                                            bloques: nuevos,
                                          });
                                        }}
                                        className="w-full mb-1.5 rounded-xl border-stone-300 bg-white text-xs font-bold text-matrix-header py-1.5"
                                      >
                                        <option value="">
                                          ✨ Cambiar por otra sesión de {filaMallaComp.componente}...
                                        </option>
                                        {filaMallaComp.sesiones
                                          .filter((s) => s.trim().length > 0)
                                          .map((s, idxS) => (
                                            <option key={idxS} value={s}>
                                              Sesión {idxS + 1}: {s}
                                            </option>
                                          ))}
                                      </select>
                                    )}
                                    <textarea
                                      rows={2}
                                      value={bloque.temaDelDia || ""}
                                      onChange={(e) => {
                                        const nuevos = asegurarCuatroBloques(
                                          tarjetaActual.bloques,
                                          tarjetaActual.id
                                        );
                                        nuevos[bIdx] = {
                                          ...bloque,
                                          temaDelDia: e.target.value,
                                        };
                                        onActualizarJornada({
                                          ...tarjetaActual,
                                          bloques: nuevos,
                                        });
                                      }}
                                      placeholder="Elige arriba una materia o escribe aquí el tema..."
                                      className="w-full rounded-xl border-stone-300 bg-white p-2 text-xs font-bold text-topo-dark"
                                    />
                                  </div>

                                  {/* Talleristas de este componente con chips clicables */}
                                  <div>
                                    <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                                      👥 Tallerista(s) de {bloque.componente || "este bloque"}:
                                    </label>
                                    {talleristasSugeridos.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                                        {talleristasSugeridos.map((nom) => {
                                          const seleccionado = (bloque.talleristas || "")
                                            .toLowerCase()
                                            .includes(nom.toLowerCase());
                                          return (
                                            <button
                                              key={nom}
                                              type="button"
                                              onClick={() =>
                                                toggleTalleristaEnBloque(
                                                  tarjetaActual,
                                                  bIdx,
                                                  nom
                                                )
                                              }
                                              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 border ${
                                                seleccionado
                                                  ? "bg-topo-green text-white border-topo-green shadow-sm"
                                                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                                              }`}
                                            >
                                              <Users className="w-3 h-3" />
                                              {nom}
                                              {seleccionado && <Check className="w-3 h-3" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      list="lista-talleristas-topo"
                                      value={bloque.talleristas || ""}
                                      onChange={(e) => {
                                        const nuevos = asegurarCuatroBloques(
                                          tarjetaActual.bloques,
                                          tarjetaActual.id
                                        );
                                        nuevos[bIdx] = {
                                          ...bloque,
                                          talleristas: e.target.value,
                                        };
                                        onActualizarJornada({
                                          ...tarjetaActual,
                                          bloques: nuevos,
                                        });
                                      }}
                                      placeholder="Nombres de talleristas..."
                                      className="w-full rounded-xl border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* PASO 3: COMENTARIOS / REUNIONES / SIMULACROS DE ESE DÍA */}
                    <div className="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-4">
                      <label className="block text-xs font-black uppercase text-topo-terracotta mb-1">
                        3️⃣ Comentarios / Reuniones / Simulacros adicionales en esta fecha (sale en
                        la fila COMENTARIOS del Excel):
                      </label>
                      <textarea
                        rows={2}
                        value={tarjetaActual.comentarios || ""}
                        onChange={(e) =>
                          onActualizarJornada({
                            ...tarjetaActual,
                            comentarios: e.target.value,
                          })
                        }
                        placeholder="Ej: Reunión de coordinación #02, Simulacro, entrega de material..."
                        className="w-full rounded-xl border-amber-300 bg-white p-2.5 text-xs font-bold text-stone-800"
                      />
                    </div>

                    {/* BARRA DE ACCIÓN DEL JUEGO: ANTERIOR | ¡ACEPTAR Y SIGUIENTE TARJETA! */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-[#E2DCCE]">
                      <button
                        type="button"
                        disabled={indiceTarjetaActual === 0}
                        onClick={() => setIndiceTarjetaActual((i) => Math.max(0, i - 1))}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#D5CBB8] bg-white hover:bg-[#F6F2E9] disabled:opacity-40 text-xs sm:text-sm font-black text-topo-dark transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Tarjeta Anterior
                      </button>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={iniciarJuegoEnSiguientePorLlenar}
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-topo-dark text-xs font-black transition"
                        >
                          <Wand2 className="w-4 h-4 text-topo-terracotta" />
                          Saltar a la próxima tarjeta vacía
                        </button>

                        <button
                          type="button"
                          onClick={aceptarYAvanzarTarjeta}
                          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-topo-green hover:bg-emerald-800 text-white font-black text-sm sm:text-base shadow-warm-lg hover:scale-[1.02] transition"
                        >
                          <PartyPopper className="w-5 h-5 text-amber-300" />
                          ¡Aceptar y Siguiente Tarjeta!
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DATALISTS GLOBALES */}
      <datalist id="lista-componentes-topo">
        {COMPONENTES_LISTA.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="lista-talleristas-topo">
        {talleristas.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {/* =====================================================================
          MODO 2: SÁBANA HORIZONTAL COMPLETA (66 COLUMNAS CRONOLÓGICAS)
         ===================================================================== */}
      {modoVisualizacion === "matriz" && (
        <div className="space-y-4">
          {/* Controles de filtrado y de insertar fecha en la sábana */}
          <div className="bg-white p-4 rounded-3xl border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-60">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaJornada}
                  onChange={(e) => setBusquedaJornada(e.target.value)}
                  placeholder="Buscar fecha, tarea, tema..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border-stone-300 text-xs"
                />
              </div>

              <select
                value={filtroDia}
                onChange={(e) =>
                  setFiltroDia(
                    e.target.value as "todos" | "sabados" | "otros" | "con_tarea"
                  )
                }
                className="rounded-xl border-stone-300 text-xs py-1.5 font-bold text-topo-dark bg-[#F6F2E9]"
              >
                <option value="todos">
                  Todas las fechas cronológicas ({jornadasOrdenadas.length})
                </option>
                <option value="sabados">Solo Sábados (52 sábados de 2027)</option>
                <option value="otros">Solo días entre semana / Domingos</option>
                <option value="con_tarea">Solo fechas que ya tienen Tarea 2027</option>
              </select>

              <select
                value={filtroComponente}
                onChange={(e) => setFiltroComponente(e.target.value)}
                className="rounded-xl border-stone-300 text-xs py-1.5 font-semibold text-stone-700"
              >
                <option value="">Todos los componentes</option>
                {COMPONENTES_LISTA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#F6F2E9] px-3 py-1.5 rounded-2xl border border-[#E2DCCE]">
              <CalendarPlus className="w-4 h-4 text-topo-terracotta shrink-0" />
              <span className="text-xs font-bold text-topo-dark">
                Agregar cualquier día:
              </span>
              <input
                type="date"
                value={nuevaFechaISO}
                onChange={(e) => setNuevaFechaISO(e.target.value)}
                className="rounded-xl border-stone-300 text-xs py-1 px-2 bg-white font-bold"
              />
              <button
                type="button"
                onClick={() => agregarDiaEspecifico()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-black text-xs shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Insertar en orden
              </button>
            </div>
          </div>

          <div
            ref={contenedorScrollRef}
            className="flex gap-4 overflow-x-auto pb-6 pt-1 px-1 snap-x"
          >
            {jornadasVisibles.map((jornada) => {
              const esDestacada = jornadaDestacadaId === jornada.id;
              const bloquesNormalizados = asegurarCuatroBloques(jornada.bloques, jornada.id);
              const esSabado = jornada.diaSemana === "Sábado";
              const tieneTarea2027 = Boolean(
                jornada.tareasDelDia?.trim() || jornada.comentarios?.trim()
              );

              return (
                <div
                  id={`col-${jornada.id}`}
                  key={jornada.id}
                  className={`w-[315px] shrink-0 rounded-3xl bg-white border-2 flex flex-col justify-between overflow-hidden shadow-warm transition snap-start ${
                    esDestacada
                      ? "border-topo-mustard ring-4 ring-topo-mustard/30"
                      : tieneTarea2027
                      ? "border-topo-green/60"
                      : "border-[#E2DCCE]"
                  }`}
                >
                  <div>
                    <div className="bg-matrix-header text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const idx = jornadasOrdenadas.findIndex((x) => x.id === jornada.id);
                          if (idx !== -1) {
                            setFiltroJuego("todas");
                            setIndiceTarjetaActual(idx);
                            setJuegoIniciado(true);
                            setModoVisualizacion("juego");
                          }
                        }}
                        title="Abrir esta columna en el Modo Juego de Tarjetas"
                        className="text-xs font-black uppercase tracking-wider text-amber-300 hover:underline flex items-center gap-1"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        JORNADA {jornada.numeroJornada}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onActualizarJornada({
                              ...jornada,
                              tipoJornada:
                                jornada.tipoJornada === "unificada" ? "clases" : "unificada",
                              bloques:
                                jornada.tipoJornada === "unificada"
                                  ? asegurarCuatroBloques(jornada.bloques, jornada.id)
                                  : jornada.bloques,
                            })
                          }
                          className="px-2 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 transition"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-amber-300" />
                          {jornada.tipoJornada === "unificada" ? "Unificada" : "4 Clases"}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicarJornada(jornada)}
                          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarJornada(jornada.id, jornada.numeroJornada)}
                          className="p-1 rounded-lg text-white/80 hover:text-rose-300 hover:bg-white/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-matrix-sub text-white px-3.5 py-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 w-14 shrink-0">
                        FECHA:
                      </span>
                      <input
                        type="text"
                        value={jornada.fecha || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const iso = ddmmyyyyToISO(val);
                          onActualizarJornada({
                            ...jornada,
                            fecha: val,
                            fechaISO: iso || jornada.fechaISO,
                            diaSemana: iso ? obtenerNombreDiaSemana(iso) : jornada.diaSemana,
                          });
                        }}
                        className="w-full rounded-lg bg-white/10 hover:bg-white/20 focus:bg-white focus:text-topo-dark border-transparent px-2 py-0.5 text-xs font-extrabold text-white"
                      />
                    </div>

                    <div
                      className={`px-3.5 py-1.5 border-b border-[#E2DCCE] flex items-center justify-between ${
                        esSabado
                          ? "bg-blue-50 text-matrix-header"
                          : "bg-amber-100/90 text-amber-950"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        DÍA DE LA SEMANA:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-white/80 border border-current/20">
                        {jornada.diaSemana || "Sábado"}
                      </span>
                    </div>

                    {jornada.tipoJornada === "clases" && jornada.comentarios?.trim() && (
                      <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 flex items-start gap-2">
                        <Pin className="w-3.5 h-3.5 text-topo-green shrink-0 mt-0.5" />
                        <div className="text-[11px] text-emerald-950 leading-snug">
                          <span className="font-black uppercase text-[10px] text-topo-green block">
                            Actividad 2027 programada este día:
                          </span>
                          <span className="font-bold whitespace-pre-line">
                            {jornada.comentarios}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#F6F2E9] px-3.5 py-1.5 border-b border-[#E2DCCE] flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-topo-green shrink-0" />
                      <span className="text-[10px] font-black uppercase text-stone-600 shrink-0">
                        ENCARGADX:
                      </span>
                      <input
                        type="text"
                        list="lista-talleristas-topo"
                        value={jornada.encargadxDelDia || ""}
                        onChange={(e) =>
                          onActualizarJornada({
                            ...jornada,
                            encargadxDelDia: e.target.value,
                          })
                        }
                        placeholder="Por llenar..."
                        className="w-full rounded-lg bg-white border-[#E2DCCE] px-2 py-0.5 text-xs font-bold text-topo-dark"
                      />
                    </div>

                    <div className="bg-stone-50 px-3.5 py-1 border-b border-[#E2DCCE] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase text-stone-500 shrink-0">
                        HORAS:
                      </span>
                      <input
                        type="text"
                        value={jornada.horasJornada || ""}
                        onChange={(e) =>
                          onActualizarJornada({
                            ...jornada,
                            horasJornada: e.target.value,
                          })
                        }
                        className="w-full rounded bg-transparent hover:bg-white focus:bg-white border-transparent px-1.5 py-0.5 text-[11px] font-semibold text-stone-700"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    {jornada.tipoJornada === "unificada" ? (
                      <div className="flex-1 p-4 bg-amber-50/50 flex flex-col justify-center items-center text-center min-h-[380px]">
                        <FlorMuralSVG className="w-8 h-8 mb-2" />
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-3">
                          Hito 2027 / Jornada Unificada
                        </span>
                        <textarea
                          rows={9}
                          value={jornada.descripcionUnificada || ""}
                          onChange={(e) =>
                            onActualizarJornada({
                              ...jornada,
                              descripcionUnificada: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border-amber-300 bg-white p-3 text-xs font-extrabold text-topo-dark text-center leading-relaxed shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="divide-y-2 divide-[#E2DCCE]">
                        {bloquesNormalizados.slice(0, 4).map((bloque, bIdx) => {
                          const estilo = obtenerEstiloComponente(bloque.componente);
                          const filaMallaComp = mallaCurricular.find(
                            (m) =>
                              m.componente.toUpperCase() ===
                              (bloque.componente || "").trim().toUpperCase()
                          );
                          const sesionesConTexto =
                            filaMallaComp?.sesiones.filter((s) => s.trim().length > 0) || [];

                          return (
                            <div
                              key={bloque.id || bIdx}
                              draggable
                              onDragStart={() =>
                                setDragOrigen({
                                  tipo: "bloque",
                                  jornadaId: jornada.id,
                                  bloqueIdx: bIdx,
                                })
                              }
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => manejarDropEnBloque(jornada, bIdx)}
                              className={`p-2.5 transition ${estilo.bg}`}
                            >
                              <div className="flex items-center justify-between gap-1 bg-matrix-light px-2.5 py-1 rounded-xl border border-blue-200/80 mb-1.5 cursor-grab active:cursor-grabbing">
                                <span className="text-[10px] font-black text-matrix-header">
                                  HORAS
                                </span>
                                <input
                                  type="text"
                                  value={bloque.hora || ""}
                                  onChange={(e) => {
                                    const nuevos = [...bloquesNormalizados];
                                    nuevos[bIdx] = { ...bloque, hora: e.target.value };
                                    onActualizarJornada({ ...jornada, bloques: nuevos });
                                  }}
                                  className="w-full bg-transparent border-transparent focus:bg-white rounded px-1 py-0 text-[11px] font-bold text-matrix-header text-center"
                                />
                              </div>

                              {/* Selector desplegable de Componente con autocompletado de talleristas */}
                              <div className="mb-1.5">
                                <select
                                  value={bloque.componente || ""}
                                  onChange={(e) =>
                                    seleccionarComponenteConAutocompletado(
                                      jornada,
                                      bIdx,
                                      e.target.value
                                    )
                                  }
                                  className={`w-full rounded-xl px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-center border ${estilo.border} ${estilo.badgeBg} focus:bg-white`}
                                >
                                  <option value="">+ ELEGIR COMPONENTE...</option>
                                  {COMPONENTES_LISTA.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="mb-1.5 space-y-1">
                                <textarea
                                  rows={2}
                                  value={bloque.temaDelDia || ""}
                                  onChange={(e) => {
                                    const nuevos = [...bloquesNormalizados];
                                    nuevos[bIdx] = { ...bloque, temaDelDia: e.target.value };
                                    onActualizarJornada({ ...jornada, bloques: nuevos });
                                  }}
                                  placeholder="TEMA DEL DÍA..."
                                  className="w-full rounded-xl border-stone-200/90 bg-white/95 focus:bg-white px-2 py-1 text-xs font-semibold text-stone-800 leading-snug resize-y"
                                />
                                {sesionesConTexto.length > 0 && (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      const nuevos = [...bloquesNormalizados];
                                      nuevos[bIdx] = { ...bloque, temaDelDia: e.target.value };
                                      onActualizarJornada({ ...jornada, bloques: nuevos });
                                    }}
                                    className="w-full rounded-lg border-stone-200 bg-white/85 py-0.5 px-1.5 text-[10px] font-bold text-matrix-header"
                                  >
                                    <option value="">
                                      ⚡ Cambiar sesión de {filaMallaComp?.componente}...
                                    </option>
                                    {sesionesConTexto.map((s, idxS) => (
                                      <option key={idxS} value={s}>
                                        Sesión {idxS + 1}: {s}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div>
                                <input
                                  type="text"
                                  list="lista-talleristas-topo"
                                  value={bloque.talleristas || ""}
                                  onChange={(e) => {
                                    const nuevos = [...bloquesNormalizados];
                                    nuevos[bIdx] = { ...bloque, talleristas: e.target.value };
                                    onActualizarJornada({ ...jornada, bloques: nuevos });
                                  }}
                                  placeholder="TALLERISTA(S)..."
                                  className="w-full rounded-xl border-transparent hover:border-stone-300 focus:border-topo-mustard bg-white/80 focus:bg-white px-2 py-1 text-[11px] font-bold text-stone-700 text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50/90 border-t-2 border-[#E2DCCE] p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-topo-terracotta mb-1">
                      <MessageSquare className="w-3 h-3" />
                      Comentarios / Reuniones / Simulacros del día
                    </div>
                    <textarea
                      rows={3}
                      value={jornada.comentarios || ""}
                      onChange={(e) =>
                        onActualizarJornada({
                          ...jornada,
                          comentarios: e.target.value,
                        })
                      }
                      placeholder="Reuniones, simulacros o tareas adicionales..."
                      className="w-full rounded-xl border-amber-200 bg-white focus:bg-white px-2.5 py-1.5 text-xs font-bold text-stone-800 resize-y"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
