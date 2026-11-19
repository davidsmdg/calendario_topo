"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  ListTodo,
  Layers,
  ArrowLeft,
  Gamepad2,
  Table as TableIcon,
  CheckCircle2,
  FileSpreadsheet,
  Settings2,
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
import { TopoAvatar, JardinMuralBarra } from "@/components/TopoAvatar";
import { CalendarioAnual } from "@/components/CalendarioAnual";
import { CronogramaGeneral } from "@/components/CronogramaGeneral";
import { MatrizJornadas } from "@/components/MatrizJornadas";
import { SeguimientoTalleristas } from "@/components/SeguimientoTalleristas";
import { EstructuraCalendario } from "@/components/EstructuraCalendario";
import { VistaHojaCalculo } from "@/components/VistaHojaCalculo";
import { BitacoraEncargadxView } from "@/components/BitacoraEncargadxView";
import { ModalPausaActiva } from "@/components/ModalPausaActiva";
import { ModalConfigSheets } from "@/components/ModalConfigSheets";
import { MenuInicial } from "@/components/MenuInicial";

type ModuloActivo =
  | "menu"
  | "juego"
  | "calendario"
  | "cronograma"
  | "matriz"
  | "talleristas"
  | "estructura"
  | "hoja_calculo"
  | "bitacora";

export default function HomePage() {
  const [estado, setEstado] = useState<EstadoCronogramaTopo>(() =>
    obtenerEstadoInicialSemilla()
  );
  const [hidratado, setHidratado] = useState(false);
  // Inicia en el Menú Inicial / Home
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>("menu");
  const [jornadaDestacadaId, setJornadaDestacadaId] = useState<string | null>(null);
  const [modalSheetsAbierto, setModalSheetsAbierto] = useState(false);
  const [guardadoReciente, setGuardadoReciente] = useState(false);
  const [tieneUrlSheets, setTieneUrlSheets] = useState(false);

  const pausaActiva = usePausaActiva();

  const timerDebounceBackup = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Al abrir o recargar la aplicación:
    // 1. Cargar lo que esté en LocalStorage como respuesta inmediata
    const local = StorageService.cargarLocal();
    setEstado(local);
    setTieneUrlSheets(Boolean(StorageService.obtenerUrlGoogleSheets()));

    // 2. Verificar y sincronizar con el disco duro del servidor (/api/backup)
    fetch("/api/backup")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.estado && Array.isArray(res.estado.jornadas) && res.estado.jornadas.length > 0) {
          // Si el disco tiene datos más recientes o iguales, sincronizar
          setEstado(res.estado);
          StorageService.guardarLocal(res.estado);
        } else if (local && local.jornadas && local.jornadas.length > 0) {
          // Si el disco estaba vacío pero en local había datos, respaldar al disco de inmediato
          fetch("/api/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(local),
          }).catch(console.warn);
        }
      })
      .catch((err) => console.warn("No se pudo contactar /api/backup:", err))
      .finally(() => {
        setHidratado(true);
      });
  }, []);

  const persistirCambio = useCallback((nuevoEstado: EstadoCronogramaTopo) => {
    // 1. Estado de React
    setEstado(nuevoEstado);

    // 2. LocalStorage en navegador (inmediato, 0ms)
    StorageService.guardarLocal(nuevoEstado);
    setGuardadoReciente(true);
    setTimeout(() => setGuardadoReciente(false), 2000);

    // 3. Respaldo a Disco en Excel + JSON (con debounce seguro de 800ms para evitar escrituras excesivas)
    if (timerDebounceBackup.current) {
      clearTimeout(timerDebounceBackup.current);
    }
    timerDebounceBackup.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevoEstado),
        }).catch((err) => console.warn("Error al respaldar en disco:", err));
      }
    }, 800);
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
    const nuevaId = `jornada-${Date.now()}`;
    const nueva: JornadaPedagogica = {
      id: nuevaId,
      numeroJornada: estado.jornadas.length + 1,
      fecha: fechaComunitaria,
      diaSemana: "Sábado",
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
    setModuloActivo("juego");
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

  const handleDescargarExcelGlobal = () => {
    exportarJornadasAExcel(
      estado.jornadas,
      estado.mallaCurricular,
      estado.hitos,
      estado.franjasHorarias,
      estado.directorioTalleristas,
      estado.estructuraCalendario
    );
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

  // Título e ícono dinámico para la barra limpia de vistas interiores
  const titulosSeccion: Record<ModuloActivo, { titulo: string; icono: React.ReactNode; color: string }> = {
    menu: { titulo: "Menú Principal", icono: null, color: "" },
    juego: {
      titulo: "Planificador Jornada a Jornada (Día por Día)",
      icono: <Calendar className="w-5 h-5 text-[#7A3EBE]" />,
      color: "bg-purple-100 text-[#5C23A3]",
    },
    calendario: {
      titulo: "Calendario Anual 2027",
      icono: <Calendar className="w-5 h-5 text-[#1368CE]" />,
      color: "bg-blue-100 text-[#1368CE]",
    },
    cronograma: {
      titulo: "Tareas y Cronograma General",
      icono: <ListTodo className="w-5 h-5 text-[#D83A56]" />,
      color: "bg-rose-100 text-[#B5253F]",
    },
    matriz: {
      titulo: "Sábana de Jornadas y Malla Curricular",
      icono: <TableIcon className="w-5 h-5 text-topo-green" />,
      color: "bg-emerald-100 text-topo-green",
    },
    hoja_calculo: {
      titulo: "Hoja de Cálculo General (Matriz en Vivo)",
      icono: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
      color: "bg-emerald-100 text-emerald-950",
    },
    talleristas: {
      titulo: "Directorio y Seguimiento de Talleristas",
      icono: <TableIcon className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-100 text-amber-950",
    },
    estructura: {
      titulo: "Estructura y Ciclos del Calendario",
      icono: <Settings2 className="w-5 h-5 text-amber-600" />,
      color: "bg-amber-100 text-amber-950",
    },
    bitacora: {
      titulo: "Bitácora del Encargadx del Día (Sede)",
      icono: <ListTodo className="w-5 h-5 text-purple-600" />,
      color: "bg-purple-100 text-purple-950",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF7]">
      {/* =========================================================================
          BARRA DE NAVEGACIÓN
          - En 'menu': Barra limpia con identidad del Topo
          - En módulos interiores: Barra ultra limpia enfocada con botón "← Volver al Menú"
         ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#FCFBF7]/95 backdrop-blur border-b-2 border-[#E2DCCE] shadow-warm relative">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {moduloActivo === "menu" ? (
            /* Header en el Menú Inicial */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-personaje.png"
                  alt="El Topo"
                  className="h-12 sm:h-14 w-auto object-contain drop-shadow-sm"
                />
                <div>
                  <img
                    src="/logo-texto.png"
                    alt="Escuela Popular El Topo"
                    className="h-7 sm:h-8 w-auto object-contain"
                  />
                  <span className="text-[11px] font-black text-topo-green block">
                    ★ Calendario y Planificador 2027
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {guardadoReciente && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-topo-green text-xs font-black animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ¡Guardado!
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Header Limpio e Inmersivo en Secciones Interiores */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Botón Destacado estilo Kahoot para Volver al Menú */}
                <button
                  type="button"
                  onClick={() => setModuloActivo("menu")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-[#F6F2E9] border-2 border-[#D5CBB8] text-topo-dark font-black text-xs sm:text-sm shadow-sm transition transform active:scale-95 group"
                >
                  <ArrowLeft className="w-4 h-4 text-topo-terracotta group-hover:-translate-x-1 transition-transform" />
                  <span>Volver al Menú</span>
                </button>

                {/* Título de la sección actual */}
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white border border-[#E2DCCE] shadow-xs hidden sm:block">
                    {titulosSeccion[moduloActivo].icono}
                  </div>
                  <h1 className="text-sm sm:text-base font-black text-topo-dark">
                    {titulosSeccion[moduloActivo].titulo}
                  </h1>
                </div>
              </div>

              {/* Conmutadores rápidos sutiles entre secciones */}
              <div className="flex items-center gap-1.5">
                {guardadoReciente && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-topo-green text-xs font-black">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Guardado
                  </span>
                )}
                
                <div className="hidden lg:flex items-center gap-1 bg-[#F6F2E9] p-1 rounded-2xl border border-[#E2DCCE]">
                  <button
                    type="button"
                    onClick={() => setModuloActivo("juego")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "juego"
                        ? "bg-[#7A3EBE] text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    🗓️ Día por Día
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("calendario")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "calendario"
                        ? "bg-[#1368CE] text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    📅 Calendario
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("cronograma")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "cronograma"
                        ? "bg-[#D83A56] text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    📋 Tareas
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("matriz")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "matriz"
                        ? "bg-topo-green text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    📑 Sábana
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("hoja_calculo")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "hoja_calculo"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    📊 Hoja Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("talleristas")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "talleristas"
                        ? "bg-amber-500 text-stone-900 shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    👥 Talleristas
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("bitacora")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "bitacora"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    📋 Bitácora Sede
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuloActivo("estructura")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      moduloActivo === "estructura"
                        ? "bg-[#1B365D] text-white shadow-xs"
                        : "text-stone-700 hover:bg-white"
                    }`}
                  >
                    ⚙️ Estructura
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          CONTENIDO DINÁMICO
         ========================================================================= */}
      <main className="flex-1 w-full mx-auto">
        {/* VISTA 1: MENÚ INICIAL / HOME */}
        {moduloActivo === "menu" && (
          <MenuInicial
            estado={estado}
            onSeleccionarModulo={(m) => setModuloActivo(m)}
            onIrAJornada={(jId) => {
              setJornadaDestacadaId(jId);
              setModuloActivo("juego");
            }}
            onDescargarExcel={handleDescargarExcelGlobal}
            onAbrirModalSheets={() => setModalSheetsAbierto(true)}
            onAbrirPausaActiva={pausaActiva.abrirManualmente}
            minutosPausa={pausaActiva.minutosFormateados}
            guardadoReciente={guardadoReciente}
            tieneUrlSheets={tieneUrlSheets}
          />
        )}

        {/* VISTAS INTERIORES LIMPIAS */}
        {moduloActivo !== "menu" && (
          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
            {moduloActivo === "calendario" && (
              <CalendarioAnual
                hitos={estado.hitos}
                jornadas={estado.jornadas}
                estructura={estado.estructuraCalendario}
                onActualizarHito={handleActualizarHito}
                onCrearHito={handleCrearHito}
                onActualizarJornada={handleActualizarJornada}
                onCrearJornadaEnFecha={handleCrearJornadaEnFecha}
                onIrAJornada={(jId) => {
                  setJornadaDestacadaId(jId);
                  setModuloActivo("juego");
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

            {(moduloActivo === "juego" || moduloActivo === "matriz") && (
              <MatrizJornadas
                key={moduloActivo}
                jornadas={estado.jornadas}
                mallaCurricular={estado.mallaCurricular}
                hitos={estado.hitos}
                talleristas={estado.talleristas}
                estructura={estado.estructuraCalendario}
                jornadaDestacadaId={jornadaDestacadaId}
                modoInicial={moduloActivo === "juego" ? "juego" : "matriz"}
                onActualizarJornada={handleActualizarJornada}
                onReemplazarJornadas={handleReemplazarJornadas}
                onActualizarMalla={handleActualizarMalla}
                onVolverAlMenu={() => setModuloActivo("menu")}
              />
            )}

            {moduloActivo === "hoja_calculo" && (
              <VistaHojaCalculo
                estado={estado}
                onActualizarEstado={(nuevo) => persistirCambio(nuevo)}
                onVolverAlMenu={() => setModuloActivo("menu")}
              />
            )}

            {moduloActivo === "talleristas" && (
              <SeguimientoTalleristas
                estado={estado}
                onActualizarEstado={(nuevo) => persistirCambio(nuevo)}
                onIrAJornada={(jId) => {
                  setJornadaDestacadaId(jId);
                  setModuloActivo("juego");
                }}
                onIrAHito={() => setModuloActivo("cronograma")}
              />
            )}

            {moduloActivo === "bitacora" && (
              <BitacoraEncargadxView
                estado={estado}
                jornadaIdInicial={jornadaDestacadaId}
                onActualizarEstado={(nuevo) => persistirCambio(nuevo)}
                onVolverAlMenu={() => setModuloActivo("menu")}
              />
            )}

            {moduloActivo === "estructura" && (
              <EstructuraCalendario
                estado={estado}
                onActualizarEstado={(nuevo) => persistirCambio(nuevo)}
                onVolverAlMenu={() => setModuloActivo("menu")}
              />
            )}
          </div>
        )}
      </main>

      {/* PIE DE PÁGINA ESCOLAR */}
      <footer className="mt-8 border-t-2 border-[#E2DCCE] bg-[#F6F2E9]/80">
        <JardinMuralBarra className="pt-2" />
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 border-t border-[#E2DCCE]/60">
          <div className="flex items-center gap-2 font-bold text-topo-dark">
            <img
              src="/logo-texto.png"
              alt="Escuela Popular El Topo"
              className="h-6 w-auto object-contain"
            />
            <span>• Planificador Pedagógico Comunitario 2027</span>
          </div>
          <div className="font-semibold text-stone-500">
            Escuela Popular El Topo • Educación Transformadora
          </div>
        </div>
      </footer>

      {/* MODALES */}
      <ModalPausaActiva
        abierto={pausaActiva.mostrarModal}
        sugerencia={pausaActiva.sugerenciaActual}
        onPosponer={pausaActiva.posponerCincoMinutos}
        onReiniciar={pausaActiva.reiniciarTreintaMinutos}
        onOtraSugerencia={pausaActiva.siguienteSugerencia}
      />

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
