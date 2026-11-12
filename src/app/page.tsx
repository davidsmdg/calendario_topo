"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  ListTodo,
  Layers,
  Database,
  Download,
  Coffee,
  CheckCircle2,
  CloudUpload,
} from "lucide-react";
import {
  EstadoCronogramaTopo,
  EventoCronograma,
  JornadaPedagogica,
  MallaComponente,
} from "@/types";
import {
  StorageService,
  obtenerEstadoInicialSemilla,
} from "@/services/storageService";
import { exportarJornadasAExcel } from "@/services/excelExporter";
import { usePausaActiva } from "@/hooks/usePausaActiva";
import {
  TopoAvatar,
  SolMuralSVG,
  AbejitaMuralSVG,
  FlorMuralSVG,
  JardinMuralBarra,
} from "@/components/TopoAvatar";
import { CalendarioAnual } from "@/components/CalendarioAnual";
import { CronogramaGeneral } from "@/components/CronogramaGeneral";
import { MatrizJornadas } from "@/components/MatrizJornadas";
import { ModalPausaActiva } from "@/components/ModalPausaActiva";
import { ModalConfigSheets } from "@/components/ModalConfigSheets";

type ModuloActivo = "calendario" | "cronograma" | "jornadas";

export default function HomePage() {
  const [estado, setEstado] = useState<EstadoCronogramaTopo>(() =>
    obtenerEstadoInicialSemilla()
  );
  const [hidratado, setHidratado] = useState(false);
  // Inicia directo en la pestaña de Jornadas/Juego para que sea inmediato darle en "¡Empezar!"
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>("jornadas");
  const [jornadaDestacadaId, setJornadaDestacadaId] = useState<string | null>(null);
  const [modalSheetsAbierto, setModalSheetsAbierto] = useState(false);
  const [guardadoReciente, setGuardadoReciente] = useState(false);
  const [tieneUrlSheets, setTieneUrlSheets] = useState(false);

  const pausaActiva = usePausaActiva();

  useEffect(() => {
    const cargado = StorageService.cargarLocal();
    setEstado(cargado);
    setTieneUrlSheets(Boolean(StorageService.obtenerUrlGoogleSheets()));
    setHidratado(true);
  }, []);

  const persistirCambio = useCallback((nuevoEstado: EstadoCronogramaTopo) => {
    setEstado(nuevoEstado);
    StorageService.guardarLocal(nuevoEstado);
    setGuardadoReciente(true);
    setTimeout(() => setGuardadoReciente(false), 1800);
  }, []);

  // Handlers de Hitos
  const handleActualizarHito = (hitoActualizado: EventoCronograma) => {
    persistirCambio({
      ...estado,
      hitos: estado.hitos.map((h) =>
        h.id === hitoActualizado.id ? hitoActualizado : h
      ),
    });
  };

  const handleCrearHito = (parcial?: Partial<EventoCronograma>) => {
    const nuevo: EventoCronograma = {
      id: `hito-${Date.now()}`,
      fecha: parcial?.fecha ?? "",
      diaSemana: parcial?.diaSemana ?? "",
      evento: parcial?.evento ?? "Nueva actividad",
      compromiso: parcial?.compromiso ?? "",
      personasEncargadas: parcial?.personasEncargadas ?? "",
      completado: false,
    };
    const nuevosHitos = [nuevo, ...estado.hitos].sort((a, b) => {
      if (!a.fecha) return -1;
      if (!b.fecha) return 1;
      const partsA = a.fecha.split("/");
      const partsB = b.fecha.split("/");
      const isoA =
        partsA.length === 3 ? `${partsA[2]}-${partsA[1]}-${partsA[0]}` : "9999-99-99";
      const isoB =
        partsB.length === 3 ? `${partsB[2]}-${partsB[1]}-${partsB[0]}` : "9999-99-99";
      return isoA.localeCompare(isoB);
    });
    persistirCambio({
      ...estado,
      hitos: nuevosHitos,
    });
  };

  const handleDuplicarHito = (id: string) => {
    const idx = estado.hitos.findIndex((h) => h.id === id);
    if (idx === -1) return;
    const orig = estado.hitos[idx];
    const copia: EventoCronograma = {
      ...orig,
      id: `hito-${Date.now()}`,
      evento: `${orig.evento || "Evento"} (Copia)`,
    };
    const nuevos = [...estado.hitos];
    nuevos.splice(idx + 1, 0, copia);
    persistirCambio({ ...estado, hitos: nuevos });
  };

  const handleEliminarHito = (id: string) => {
    persistirCambio({
      ...estado,
      hitos: estado.hitos.filter((h) => h.id !== id),
    });
  };

  const handleReordenarHitos = (nuevosHitos: EventoCronograma[]) => {
    persistirCambio({
      ...estado,
      hitos: nuevosHitos,
    });
  };

  // Handlers de Jornadas y Malla
  const handleActualizarJornada = (jornadaActualizada: JornadaPedagogica) => {
    persistirCambio({
      ...estado,
      jornadas: estado.jornadas.map((j) =>
        j.id === jornadaActualizada.id ? jornadaActualizada : j
      ),
    });
  };

  const handleReemplazarJornadas = (nuevasJornadas: JornadaPedagogica[]) => {
    persistirCambio({
      ...estado,
      jornadas: nuevasJornadas,
    });
  };

  const handleCrearJornadaEnFecha = (fechaComunitaria: string) => {
    // Si ya existe una columna de jornada en esa fecha, simplemente la abrimos y destacamos
    const existente = estado.jornadas.find(
      (j) => (j.fecha || "").toLowerCase() === fechaComunitaria.toLowerCase()
    );
    if (existente) {
      setJornadaDestacadaId(existente.id);
      setModuloActivo("jornadas");
      return;
    }

    const nuevaId = `jornada-${Date.now()}`;
    const nueva: JornadaPedagogica = {
      id: nuevaId,
      numeroJornada: estado.jornadas.length + 1,
      fecha: fechaComunitaria,
      encargadxDelDia: "",
      horasJornada: "8:00 AM - 3:00 PM",
      tipoJornada: "clases",
      bloques: [
        { id: `${nuevaId}-b1`, hora: "8:00 AM - 9:30 AM", componente: "", temaDelDia: "", talleristas: "" },
        { id: `${nuevaId}-b2`, hora: "9:30 AM - 11:00 AM", componente: "", temaDelDia: "", talleristas: "" },
        { id: `${nuevaId}-b3`, hora: "11:15 AM - 12:45 PM", componente: "", temaDelDia: "", talleristas: "" },
        { id: `${nuevaId}-b4`, hora: "1:30 PM - 3:00 PM", componente: "", temaDelDia: "", talleristas: "" },
      ],
      comentarios: "",
    };
    persistirCambio({
      ...estado,
      jornadas: [...estado.jornadas, nueva],
    });
    setJornadaDestacadaId(nuevaId);
    setModuloActivo("jornadas");
  };

  const handleActualizarMalla = (nuevaMalla: MallaComponente[]) => {
    persistirCambio({
      ...estado,
      mallaCurricular: nuevaMalla,
    });
  };

  const handleRestaurarSemilla = () => {
    const semilla = obtenerEstadoInicialSemilla();
    persistirCambio(semilla);
  };

  if (!hidratado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FCFBF7]">
        <TopoAvatar size="lg" variant="completo" />
        <p className="text-sm font-extrabold text-topo-dark animate-pulse">
          Cargando Escuela Popular El Topo 2027...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF7]">
      {/* CABECERA INSPIRADA DIRECTAMENTE EN EL MURAL DE LA ESCUELA POPULAR EL TOPO */}
      <header className="sticky top-0 z-30 bg-[#FCFBF7]/95 backdrop-blur border-b-2 border-[#E2DCCE] shadow-warm relative overflow-hidden">
        {/* Caminito punteado de abejas decorativo de fondo */}
        <svg
          viewBox="0 0 1200 90"
          fill="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          preserveAspectRatio="none"
        >
          <path
            d="M 180 70 C 320 10, 450 85, 620 25 C 790 -15, 920 80, 1150 20"
            stroke="#2B2623"
            strokeWidth="2.5"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
        </svg>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 relative z-10">
          {/* Logo Oficial en PNG + Sol y Flores del Mural */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-personaje.png"
              alt="El Topo"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
            />
            <div className="flex flex-col">
              <img
                src="/logo-texto.png"
                alt="Escuela Popular El Topo"
                className="h-11 sm:h-14 w-auto object-contain"
              />
              <span className="text-[11px] font-extrabold tracking-wide text-topo-green mt-0.5">
                ★ Calendario y Planificador Escolar 2027
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <SolMuralSVG className="w-11 h-11" />
              <AbejitaMuralSVG className="w-6 h-6 -mt-4" />
            </div>
          </div>

          {/* Navegación Central Clara y Escolar */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-[#F6F2E9] p-1.5 rounded-2xl border-2 border-[#E2DCCE]">
            <button
              type="button"
              onClick={() => setModuloActivo("calendario")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                moduloActivo === "calendario"
                  ? "bg-topo-mustard text-topo-dark shadow-sm"
                  : "text-stone-700 hover:bg-white/80"
              }`}
            >
              <Calendar className="w-4 h-4 text-topo-terracotta" />
              1. Calendario 2027
            </button>

            <button
              type="button"
              onClick={() => setModuloActivo("cronograma")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                moduloActivo === "cronograma"
                  ? "bg-topo-mustard text-topo-dark shadow-sm"
                  : "text-stone-700 hover:bg-white/80"
              }`}
            >
              <ListTodo className="w-4 h-4 text-topo-green" />
              2. Tareas 2027 ({estado.hitos.length})
            </button>

            <button
              type="button"
              onClick={() => setModuloActivo("jornadas")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                moduloActivo === "jornadas"
                  ? "bg-topo-mustard text-topo-dark shadow-sm"
                  : "text-stone-700 hover:bg-white/80"
              }`}
            >
              <Layers className="w-4 h-4 text-matrix-header" />
              3. Clases / Jornadas ({estado.jornadas.length})
            </button>
          </nav>

          {/* Utilidades Derecha */}
          <div className="flex items-center gap-2">
            <FlorMuralSVG className="hidden xl:block w-8 h-8 mr-1" />

            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-topo-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{guardadoReciente ? "¡Guardado!" : "Guardado automático"}</span>
            </div>

            <button
              type="button"
              onClick={pausaActiva.abrirManualmente}
              title="Recordatorio de Pausa Activa (30 min)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-black text-amber-950 transition"
            >
              <Coffee className="w-3.5 h-3.5 text-topo-terracotta" />
              <span className="font-mono">{pausaActiva.minutosFormateados}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                exportarJornadasAExcel(
                  estado.jornadas,
                  estado.mallaCurricular,
                  estado.hitos
                )
              }
              title="Descargar archivo Excel 2027 (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-topo-green hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden md:inline">Descargar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setModalSheetsAbierto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-[#D5CBB8] bg-white hover:bg-[#F6F2E9] text-xs font-extrabold text-stone-700 transition"
              title="Conectar Google Sheets o reiniciar lienzo 2027"
            >
              {tieneUrlSheets ? (
                <CloudUpload className="w-4 h-4 text-topo-green" />
              ) : (
                <Database className="w-4 h-4 text-topo-terracotta" />
              )}
              <span className="hidden lg:inline">Google Sheets</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
        {moduloActivo === "calendario" && (
          <CalendarioAnual
            hitos={estado.hitos}
            jornadas={estado.jornadas}
            onActualizarHito={handleActualizarHito}
            onCrearHito={handleCrearHito}
            onActualizarJornada={handleActualizarJornada}
            onCrearJornadaEnFecha={handleCrearJornadaEnFecha}
            onIrAJornada={(jId) => {
              setJornadaDestacadaId(jId);
              setModuloActivo("jornadas");
            }}
          />
        )}

        {moduloActivo === "cronograma" && (
          <CronogramaGeneral
            hitos={estado.hitos}
            talleristas={estado.talleristas}
            onReordenarHitos={handleReordenarHitos}
            onActualizarHito={handleActualizarHito}
            onCrearHito={handleCrearHito}
            onDuplicarHito={handleDuplicarHito}
            onEliminarHito={handleEliminarHito}
          />
        )}

        {moduloActivo === "jornadas" && (
          <MatrizJornadas
            jornadas={estado.jornadas}
            mallaCurricular={estado.mallaCurricular}
            hitos={estado.hitos}
            talleristas={estado.talleristas}
            jornadaDestacadaId={jornadaDestacadaId}
            onActualizarJornada={handleActualizarJornada}
            onReemplazarJornadas={handleReemplazarJornadas}
            onActualizarMalla={handleActualizarMalla}
          />
        )}
      </main>

      {/* JARDÍN DE FLORES Y ABEJAS DEL MURAL + PIE DE PÁGINA */}
      <footer className="mt-8 border-t-2 border-[#E2DCCE] bg-[#F6F2E9]/80">
        <JardinMuralBarra className="pt-2" />
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 border-t border-[#E2DCCE]/60">
          <div className="flex items-center gap-2 font-bold text-topo-dark">
            <img
              src="/logo-texto.png"
              alt="Escuela Popular El Topo"
              className="h-6 w-auto object-contain"
            />
            <span>• Planificador Pedagógico 2027</span>
          </div>
          <div className="font-semibold">
            Tareas 2027 precargadas • Clases listas para programar desde cero
          </div>
        </div>
      </footer>

      {/* MODAL DE PAUSA ACTIVA */}
      <ModalPausaActiva
        abierto={pausaActiva.mostrarModal}
        sugerencia={pausaActiva.sugerenciaActual}
        onPosponer={pausaActiva.posponerCincoMinutos}
        onReiniciar={pausaActiva.reiniciarTreintaMinutos}
        onOtraSugerencia={pausaActiva.siguienteSugerencia}
      />

      {/* MODAL DE CONFIGURACIÓN DE GOOGLE SHEETS */}
      <ModalConfigSheets
        abierto={modalSheetsAbierto}
        onCerrar={() => {
          setModalSheetsAbierto(false);
          setTieneUrlSheets(Boolean(StorageService.obtenerUrlGoogleSheets()));
        }}
        estadoActual={estado}
        onReemplazarEstado={(nuevo) => persistirCambio(nuevo)}
        onRestaurarSemilla={handleRestaurarSemilla}
      />
    </div>
  );
}
