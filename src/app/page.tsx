"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Menu as MenuIcon,
  X,
  User,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
  Archive,
  KeyRound,
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
import { ModuloEstudiantes } from "@/components/ModuloEstudiantes";
import { DashboardPeriodoHistorico } from "@/components/DashboardPeriodoHistorico";
import { ModalCrearCalendario } from "@/components/ModalCrearCalendario";
import { ModuloHistoricoCiclos } from "@/components/ModuloHistoricoCiclos";
import { PantallaLogin } from "@/components/PantallaLogin";
import { ModalDefinirPassword } from "@/components/ModalDefinirPassword";
import { supabase } from "@/lib/supabaseClient";

type ModuloActivo =
  | "menu"
  | "juego"
  | "calendario"
  | "cronograma"
  | "matriz"
  | "talleristas"
  | "estudiantes"
  | "estructura"
  | "hoja_calculo"
  | "bitacora"
  | "historico_2026"
  | "ciclos_archivo";

export default function HomePage() {
  const [estado, setEstado] = useState<EstadoCronogramaTopo>(() =>
    obtenerEstadoInicialSemilla()
  );
  const [hidratado, setHidratado] = useState(false);
  // Inicia en el Menú Inicial / Home
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>("menu");
  const [jornadaDestacadaId, setJornadaDestacadaId] = useState<string | null>(null);
  const [modalSheetsAbierto, setModalSheetsAbierto] = useState(false);
  const [modalCrearCalendarioAbierto, setModalCrearCalendarioAbierto] = useState(false);
  const [guardadoReciente, setGuardadoReciente] = useState(false);
  const [tieneUrlSheets, setTieneUrlSheets] = useState(false);

  // Estados para Sesión y Autenticación Supabase
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<any>(null);
  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [esInvitacionReciente, setEsInvitacionReciente] = useState(false);

  // Estados para Menú Hamburguesa y Perfil de Usuario
  const [menuHamburguesaAbierto, setMenuHamburguesaAbierto] = useState(false);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [talleristaSesion, setTalleristaSesion] = useState<{
    nombre: string;
    rol: string;
    avatarLetra: string;
    email?: string;
  }>({
    nombre: "Coordinación General",
    rol: "Administrador Pedagógico",
    avatarLetra: "C",
  });

  const pausaActiva = usePausaActiva();

  const timerDebounceBackup = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Al abrir o recargar la aplicación:
    // 1. Cargar lo que esté en LocalStorage como respuesta inmediata
    const local = StorageService.cargarLocal();
    setEstado(local);
    setTieneUrlSheets(Boolean(StorageService.obtenerUrlGoogleSheets()));

    // 2. Conectar y sincronizar DIRECTAMENTE con la Base de Datos PostgreSQL de Supabase
    fetch("/api/calendarios")
      .then((res) => res.json())
      .then((dbData) => {
        if (dbData && Array.isArray(dbData.calendarios)) {
          const calActivo = dbData.calendarioActivo;
          const nuevoEstado: EstadoCronogramaTopo = {
            ...local,
            calendarios: dbData.calendarios,
            calendarioActivoId: calActivo ? calActivo.id : null,
            jornadas: calActivo ? dbData.jornadas || [] : [],
            hitos: calActivo ? dbData.hitos || [] : [],
            estudiantes: calActivo ? dbData.estudiantes || [] : [],
            talleristas: dbData.talleristas?.length ? dbData.talleristas : local.talleristas,
            directorioTalleristas: dbData.directorioTalleristas?.length
              ? dbData.directorioTalleristas
              : local.directorioTalleristas,
            estructuraCalendario: calActivo?.configuracion_json
              ? typeof calActivo.configuracion_json === "string"
                ? JSON.parse(calActivo.configuracion_json)
                : calActivo.configuracion_json
              : calActivo?.estructura_config
              ? typeof calActivo.estructura_config === "string"
                ? JSON.parse(calActivo.estructura_config)
                : calActivo.estructura_config
              : undefined,
          };
          setEstado(nuevoEstado);
          StorageService.guardarLocal(nuevoEstado);
        }
      })
      .catch((err) => console.warn("No se pudo sincronizar con Supabase /api/calendarios:", err))
      .finally(() => {
        setHidratado(true);
      });
    // Detección de invitación o recuperación en la URL (#access_token=...&type=invite o type=recovery)
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.includes("type=invite") || hash.includes("type=recovery")) {
        setEsInvitacionReciente(true);
        setModalPasswordAbierto(true);
      }
    }

    // 3. Verificar estado de autenticación en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuarioAutenticado(session.user);
        const meta = session.user.user_metadata || {};
        const nom = meta.nombre || session.user.email?.split("@")[0] || "Tallerista";
        const rol = meta.rol === "coordinador" ? "Coordinación General" : "Tallerista Pedagógicx";
        setTalleristaSesion({
          nombre: nom,
          rol: rol,
          avatarLetra: nom.charAt(0).toUpperCase(),
          email: session.user.email,
        });
      } else {
        setUsuarioAutenticado(null);
      }
      setComprobandoSesion(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setEsInvitacionReciente(false);
        setModalPasswordAbierto(true);
      }

      if (session?.user) {
        setUsuarioAutenticado(session.user);
        const meta = session.user.user_metadata || {};
        const nom = meta.nombre || session.user.email?.split("@")[0] || "Tallerista";
        const rol = meta.rol === "coordinador" ? "Coordinación General" : "Tallerista Pedagógicx";
        setTalleristaSesion({
          nombre: nom,
          rol: rol,
          avatarLetra: nom.charAt(0).toUpperCase(),
          email: session.user.email,
        });
      } else {
        setUsuarioAutenticado(null);
      }
      setComprobandoSesion(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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
    // Detección de invitación o recuperación en la URL (#access_token=...&type=invite o type=recovery)
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.includes("type=invite") || hash.includes("type=recovery")) {
        setEsInvitacionReciente(true);
        setModalPasswordAbierto(true);
      }
    }

    // 3. Verificar estado de autenticación en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuarioAutenticado(session.user);
        const meta = session.user.user_metadata || {};
        const nom = meta.nombre || session.user.email?.split("@")[0] || "Tallerista";
        const rol = meta.rol === "coordinador" ? "Coordinación General" : "Tallerista Pedagógicx";
        setTalleristaSesion({
          nombre: nom,
          rol: rol,
          avatarLetra: nom.charAt(0).toUpperCase(),
          email: session.user.email,
        });
      } else {
        setUsuarioAutenticado(null);
      }
      setComprobandoSesion(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setEsInvitacionReciente(false);
        setModalPasswordAbierto(true);
      }

      if (session?.user) {
        setUsuarioAutenticado(session.user);
        const meta = session.user.user_metadata || {};
        const nom = meta.nombre || session.user.email?.split("@")[0] || "Tallerista";
        const rol = meta.rol === "coordinador" ? "Coordinación General" : "Tallerista Pedagógicx";
        setTalleristaSesion({
          nombre: nom,
          rol: rol,
          avatarLetra: nom.charAt(0).toUpperCase(),
          email: session.user.email,
        });
      } else {
        setUsuarioAutenticado(null);
      }
      setComprobandoSesion(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handler para cambiar de calendario activo (ej. "2027 - Ciclo Anual" vs "2026 - Histórico")
  const handleCambiarCalendario = (calId: string) => {
    const calSeleccionado = (estado.calendarios || []).find((c) => c.id === calId);
    if (!calSeleccionado) return;

    // Guardar el estado actual dentro del calendario antes de cambiar
    const calendariosActualizados = (estado.calendarios || []).map((c) => {
      if (c.id === (estado.calendarioActivoId || "cal-2027-anual")) {
        return {
          ...c,
          jornadas: estado.jornadas,
          hitos: estado.hitos,
          mallaCurricular: estado.mallaCurricular,
          estudiantes: estado.estudiantes || [],
          estructuraCalendario: estado.estructuraCalendario || c.estructuraCalendario,
        };
      }
      return c;
    });

    const nuevoEstado: EstadoCronogramaTopo = {
      ...estado,
      calendarioActivoId: calSeleccionado.id,
      calendarios: calendariosActualizados,
      jornadas: calSeleccionado.jornadas || [],
      hitos: calSeleccionado.hitos || [],
      mallaCurricular: calSeleccionado.mallaCurricular || [],
      estudiantes: calSeleccionado.estudiantes || [],
      estructuraCalendario: calSeleccionado.estructuraCalendario,
    };

    persistirCambio(nuevoEstado);
  };

  const calActual = useMemo(() => {
    return (
      (estado.calendarios || []).find((c) => c.id === estado.calendarioActivoId) ||
      (estado.calendarios || [])[0]
    );
  }, [estado.calendarios, estado.calendarioActivoId]);

  const esHistorico = calActual?.estado === "historico";

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

  const handlePostularEncargadx = async (jornadaId: string, nombreTallerista: string) => {
    try {
      await fetch("/api/calendarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "actualizar_encargadx",
          jornadaId,
          encargadxNombre: nombreTallerista,
        }),
      });
      const nuevasJornadas = estado.jornadas.map((j) =>
        j.id === jornadaId ? { ...j, encargadxDelDia: nombreTallerista } : j
      );
      persistirCambio({ ...estado, jornadas: nuevasJornadas });
    } catch (e) {
      console.error("Error al postular encargado:", e);
    }
  };

  const handleLiberarEncargadx = async (jornadaId: string) => {
    try {
      await fetch("/api/calendarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "actualizar_encargadx",
          jornadaId,
          encargadxNombre: "",
        }),
      });
      const nuevasJornadas = estado.jornadas.map((j) =>
        j.id === jornadaId ? { ...j, encargadxDelDia: "" } : j
      );
      persistirCambio({ ...estado, jornadas: nuevasJornadas });
    } catch (e) {
      console.error("Error al liberar fecha de encargado:", e);
    }
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

  if (!hidratado || comprobandoSesion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FCFBF7]">
        <TopoAvatar size="lg" variant="completo" />
        <p className="text-sm font-extrabold text-topo-dark animate-pulse">
          Cargando Escuela Popular El Topo 2027...
        </p>
      </div>
    );
  }

  // SI NO HAY SESIÓN INICIADA, MOSTRAR LA PANTALLA DE LOGIN
  if (!usuarioAutenticado) {
    return (
      <PantallaLogin
        onLoginExitoso={(user) => {
          setUsuarioAutenticado(user);
          const meta = user.user_metadata || {};
          const nom = meta.nombre || user.email?.split("@")[0] || "Tallerista";
          const rol = meta.rol === "coordinador" ? "Coordinación General" : "Tallerista Pedagógicx";
          setTalleristaSesion({
            nombre: nom,
            rol: rol,
            avatarLetra: nom.charAt(0).toUpperCase(),
            email: user.email,
          });
        }}
      />
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
    estudiantes: {
      titulo: "Directorio de Estudiantes y Permanencia",
      icono: <TableIcon className="w-5 h-5 text-blue-600" />,
      color: "bg-blue-100 text-blue-950",
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
    historico_2026: {
      titulo: "Archivo y Balance: Año 2026",
      icono: <TableIcon className="w-5 h-5 text-amber-600" />,
      color: "bg-stone-800 text-amber-300",
    },
    ciclos_archivo: {
      titulo: "Archivo Histórico de Ciclos y Memoria",
      icono: <Archive className="w-5 h-5 text-amber-600" />,
      color: "bg-amber-100 text-amber-950",
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

                {/* BOTÓN PERFIL EN HOME */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuPerfilAbierto(!menuPerfilAbierto);
                      setMenuHamburguesaAbierto(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-stone-50 border-2 border-[#D5CBB8] text-topo-dark font-black text-xs shadow-xs transition transform active:scale-95"
                    title="Perfil y Rol"
                  >
                    <div className="w-6 h-6 rounded-xl bg-[#7A3EBE] text-white flex items-center justify-center font-black text-xs">
                      {talleristaSesion.avatarLetra}
                    </div>
                    <span className="hidden md:inline text-xs font-black text-stone-800">
                      {talleristaSesion.nombre}
                    </span>
                    <Shield className="w-3.5 h-3.5 text-topo-terracotta" />
                  </button>

                  {/* Popover Menú Perfil */}
                  {menuPerfilAbierto && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuPerfilAbierto(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border-2 border-stone-200 p-4 z-50 animate-fadeIn">
                        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                          <div className="w-10 h-10 rounded-2xl bg-[#7A3EBE] text-white flex items-center justify-center font-black text-base shadow-sm">
                            {talleristaSesion.avatarLetra}
                          </div>
                          <div>
                            <div className="font-black text-stone-900 text-sm">{talleristaSesion.nombre}</div>
                            <div className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-500" />
                              {talleristaSesion.rol}
                            </div>
                          </div>
                        </div>

                        <div className="py-2.5 text-xs text-stone-600 leading-relaxed border-b border-stone-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-stone-500">Correo:</span>
                            <span className="text-stone-900 font-mono">{talleristaSesion.email || "Sin correo"}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-stone-500">Permisos:</span>
                            <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                              talleristaSesion.rol.includes("Coordinaci")
                                ? "bg-amber-100 text-amber-900"
                                : "bg-purple-100 text-purple-900"
                            }`}>
                              {talleristaSesion.rol.includes("Coordinaci") ? "Coordinación Total" : "Tallerista (Lectura y Aulas)"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuPerfilAbierto(false);
                              setEsInvitacionReciente(false);
                              setModalPasswordAbierto(true);
                            }}
                            className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 font-black text-[11px] transition"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                            <span>Cambiar mi contraseña</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={async () => {
                              await supabase.auth.signOut();
                              setUsuarioAutenticado(null);
                              setMenuPerfilAbierto(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-xs transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Cerrar Sesión</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenuPerfilAbierto(false)}
                            className="font-bold text-stone-500 hover:text-stone-800 text-xs"
                          >
                            Ocultar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
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

              {/* Acciones de Cabecera: Perfil y Menú Hamburguesa */}
              <div className="flex items-center gap-2">
                {guardadoReciente && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-topo-green text-xs font-black">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Guardado
                  </span>
                )}

                {/* BOTÓN PERFIL EN SECCIÓN INTERIOR */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuPerfilAbierto(!menuPerfilAbierto);
                      setMenuHamburguesaAbierto(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-stone-50 border-2 border-[#D5CBB8] text-topo-dark font-black text-xs shadow-xs transition transform active:scale-95"
                    title="Perfil y Rol"
                  >
                    <div className="w-6 h-6 rounded-xl bg-[#7A3EBE] text-white flex items-center justify-center font-black text-xs">
                      {talleristaSesion.avatarLetra}
                    </div>
                    <span className="hidden sm:inline text-xs font-black text-stone-800">
                      {talleristaSesion.nombre}
                    </span>
                    <Shield className="w-3.5 h-3.5 text-topo-terracotta" />
                  </button>

                  {/* Popover Menú Perfil */}
                  {menuPerfilAbierto && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuPerfilAbierto(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border-2 border-stone-200 p-4 z-50 animate-fadeIn">
                        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                          <div className="w-10 h-10 rounded-2xl bg-[#7A3EBE] text-white flex items-center justify-center font-black text-base shadow-sm">
                            {talleristaSesion.avatarLetra}
                          </div>
                          <div>
                            <div className="font-black text-stone-900 text-sm">{talleristaSesion.nombre}</div>
                            <div className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-500" />
                              {talleristaSesion.rol}
                            </div>
                          </div>
                        </div>

                        <div className="py-2.5 text-xs text-stone-600 leading-relaxed border-b border-stone-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-stone-500">Correo:</span>
                            <span className="text-stone-900 font-mono">{talleristaSesion.email || "Sin correo"}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-stone-500">Permisos:</span>
                            <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                              talleristaSesion.rol.includes("Coordinaci")
                                ? "bg-amber-100 text-amber-900"
                                : "bg-purple-100 text-purple-900"
                            }`}>
                              {talleristaSesion.rol.includes("Coordinaci") ? "Coordinación Total" : "Tallerista (Lectura y Aulas)"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuPerfilAbierto(false);
                              setEsInvitacionReciente(false);
                              setModalPasswordAbierto(true);
                            }}
                            className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 font-black text-[11px] transition"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                            <span>Cambiar mi contraseña</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={async () => {
                              await supabase.auth.signOut();
                              setUsuarioAutenticado(null);
                              setMenuPerfilAbierto(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-xs transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Cerrar Sesión</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenuPerfilAbierto(false)}
                            className="font-bold text-stone-500 hover:text-stone-800 text-xs"
                          >
                            Ocultar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* BOTÓN MENÚ HAMBURGUESA */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuHamburguesaAbierto(!menuHamburguesaAbierto);
                      setMenuPerfilAbierto(false);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1B365D] hover:bg-[#132847] text-white font-black text-xs shadow-md transition transform active:scale-95"
                    title="Navegación de Módulos"
                  >
                    <MenuIcon className="w-4 h-4 text-amber-300" />
                    <span className="hidden sm:inline">Módulos</span>
                  </button>

                  {/* Dropdown del Menú Hamburguesa */}
                  {menuHamburguesaAbierto && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-xs"
                        onClick={() => setMenuHamburguesaAbierto(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border-2 border-stone-200 p-3 z-50 animate-fadeIn divide-y divide-stone-100">
                        <div className="px-3 py-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-stone-700">
                            Navegación Rápida
                          </span>
                          <button
                            type="button"
                            onClick={() => setMenuHamburguesaAbierto(false)}
                            className="p-1 rounded-lg text-stone-600 hover:bg-stone-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="py-2 grid grid-cols-1 gap-1 max-h-[70vh] overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("juego");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "juego"
                                ? "bg-[#7A3EBE] text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">🗓️</span>
                              <div>
                                <div>Día por Día</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "juego" ? "text-purple-100" : "text-stone-600"}`}>
                                  Secuencia interactiva y bitácora
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("calendario");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "calendario"
                                ? "bg-[#1368CE] text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">📅</span>
                              <div>
                                <div>Calendario Anual</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "calendario" ? "text-blue-100" : "text-stone-600"}`}>
                                  Vista de meses y hitos UNAL/ICFES
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("cronograma");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "cronograma"
                                ? "bg-[#D83A56] text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">📋</span>
                              <div>
                                <div>Lista de Tareas y Fechas</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "cronograma" ? "text-rose-100" : "text-stone-600"}`}>
                                  Cronograma completo y filtros
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("matriz");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "matriz"
                                ? "bg-topo-green text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">📑</span>
                              <div>
                                <div>Sábana Pedagógica</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "matriz" ? "text-emerald-100" : "text-stone-600"}`}>
                                  Malla 4 bloques x 4 componentes
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("hoja_calculo");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "hoja_calculo"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">📊</span>
                              <div>
                                <div>Hoja Excel Integrada</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "hoja_calculo" ? "text-emerald-100" : "text-stone-600"}`}>
                                  Edición ágil de celdas
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("talleristas");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "talleristas"
                                ? "bg-amber-500 text-stone-900 shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">👥</span>
                              <div>
                                <div>Directorio de Talleristas</div>
                                <div className="text-[10px] font-normal text-stone-600">
                                  Activos vs. antiguos y carga docente
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("estudiantes");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "estudiantes"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">🎒</span>
                              <div>
                                <div>Estudiantes y Asistencia</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "estudiantes" ? "text-blue-100" : "text-stone-600"}`}>
                                  Permanencia, deserción y clases 0 a 4
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("bitacora");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "bitacora"
                                ? "bg-purple-600 text-white shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">📋</span>
                              <div>
                                <div>Bitácora del Encargadx</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "bitacora" ? "text-purple-100" : "text-stone-600"}`}>
                                  Apertura de sede y toma de asistencia
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("ciclos_archivo");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition ${
                              moduloActivo === "ciclos_archivo"
                                ? "bg-stone-800 text-amber-300 shadow-sm"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">📂</span>
                              <div>
                                <div>Archivo de Ciclos y Memoria</div>
                                <div className={`text-[10px] font-normal ${moduloActivo === "ciclos_archivo" ? "text-amber-200" : "text-stone-600"}`}>
                                  Histórico 2026, ciclos activos y finalizados
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModalCrearCalendarioAbierto(true);
                              setMenuHamburguesaAbierto(false);
                            }}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-left transition bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">✨</span>
                              <div>
                                <div>Nuevo Calendario / Ciclo</div>
                                <div className="text-[10px] font-normal text-amber-800">
                                  Asistente oficial para programar fechas
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-600" />
                          </button>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModuloActivo("menu");
                              setMenuHamburguesaAbierto(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-black transition"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 text-topo-terracotta" />
                            Ir al Menú Principal
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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
            esCoordinador={Boolean(
              talleristaSesion.rol?.toLowerCase().includes("coordinaci") ||
              talleristaSesion.rol?.toLowerCase().includes("administrador")
            )}
            usuarioActualNombre={talleristaSesion.nombre}
            onPostularEncargadx={handlePostularEncargadx}
            onLiberarEncargadx={handleLiberarEncargadx}
            onSeleccionarModulo={(m) => setModuloActivo(m)}
            onIrAJornada={(jId) => {
              setJornadaDestacadaId(jId);
              setModuloActivo("juego");
            }}
            onAbrirAsistenteCalendario={() => setModalCrearCalendarioAbierto(true)}
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

            {moduloActivo === "estudiantes" && (
              <ModuloEstudiantes
                estudiantes={estado.estudiantes || []}
                jornadas={estado.jornadas || []}
                esHistorico={esHistorico}
                nombreCalendario={calActual?.nombre || "Calendario Actual"}
                onActualizarEstudiantes={(nuevos) => {
                  const nuevosCalendarios = (estado.calendarios || []).map((c) =>
                    c.id === (estado.calendarioActivoId || "cal-2027-anual")
                      ? { ...c, estudiantes: nuevos }
                      : c
                  );
                  persistirCambio({
                    ...estado,
                    estudiantes: nuevos,
                    calendarios: nuevosCalendarios,
                  });
                }}
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

            {moduloActivo === "historico_2026" && (
              <DashboardPeriodoHistorico
                anoSeleccionado={2026}
                onVolverAlMenu={() => setModuloActivo("ciclos_archivo")}
              />
            )}

            {moduloActivo === "ciclos_archivo" && (
              <ModuloHistoricoCiclos
                calendarios={estado.calendarios || []}
                calendarioActivoId={estado.calendarioActivoId || null}
                esCoordinador={talleristaSesion.rol.toLowerCase().includes("coordinaci") || talleristaSesion.rol.toLowerCase().includes("administrador")}
                onSeleccionarCalendario={(calId) => {
                  handleCambiarCalendario(calId);
                  setModuloActivo("calendario");
                }}
                onCambiarEstadoCalendario={async (calId, nuevoEstado) => {
                  try {
                    const res = await fetch("/api/calendarios", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "cambiar_estado_calendario",
                        calId,
                        nuevoEstado,
                      }),
                    });
                    if (res.ok) {
                      // Recargar desde base de datos con cache-busting
                      const dbRes = await fetch(`/api/calendarios?t=${Date.now()}`);
                      const dbData = await dbRes.json();
                      if (dbData && Array.isArray(dbData.calendarios)) {
                        const calActivo = dbData.calendarioActivo;
                        persistirCambio({
                          ...estado,
                          calendarios: dbData.calendarios,
                          calendarioActivoId: calActivo ? calActivo.id : null,
                          jornadas: calActivo ? dbData.jornadas || [] : [],
                          hitos: calActivo ? dbData.hitos || [] : [],
                          estudiantes: calActivo ? dbData.estudiantes || [] : [],
                          estructuraCalendario: calActivo?.configuracion_json
                            ? typeof calActivo.configuracion_json === "string"
                              ? JSON.parse(calActivo.configuracion_json)
                              : calActivo.configuracion_json
                            : calActivo?.estructura_config
                            ? typeof calActivo.estructura_config === "string"
                              ? JSON.parse(calActivo.estructura_config)
                              : calActivo.estructura_config
                            : undefined,
                        });
                      }
                    }
                  } catch (e) {
                    console.error("Error cambiando estado:", e);
                  }
                }}
                onAbrirAsistenteNuevo={() => setModalCrearCalendarioAbierto(true)}
                onVerDashboard2026={() => setModuloActivo("historico_2026")}
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

      {/* ASISTENTE COORDINACIÓN: CREAR NUEVO CALENDARIO / CICLO */}
      <ModalCrearCalendario
        abierto={modalCrearCalendarioAbierto}
        onCerrar={() => setModalCrearCalendarioAbierto(false)}
        onCrearCalendario={async (nuevoCal) => {
          // 1. Guardar en Base de Datos de Supabase para que todos los talleristas lo vean
          try {
            await fetch("/api/calendarios", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "crear_calendario",
                nuevoCal: nuevoCal,
                jornadas: nuevoCal.jornadas || [],
                hitos: nuevoCal.hitos || [],
              }),
            });
          } catch (err) {
            console.error("Error guardando nuevo calendario en Supabase:", err);
          }

          // 2. Actualizar estado local inmediato
          const nuevosCalendarios = [
            nuevoCal,
            ...(estado.calendarios || []).filter((c) => c.id !== nuevoCal.id),
          ];
          const nuevoEstado: EstadoCronogramaTopo = {
            ...estado,
            calendarioActivoId: nuevoCal.id,
            calendarios: nuevosCalendarios,
            jornadas: nuevoCal.jornadas || [],
            hitos: nuevoCal.hitos || [],
            mallaCurricular: nuevoCal.mallaCurricular || [],
            estructuraCalendario: nuevoCal.estructuraCalendario,
          };
          persistirCambio(nuevoEstado);
          setModalCrearCalendarioAbierto(false);
          setModuloActivo("calendario");
        }}
      />

      {/* MODAL CONFIGURAR / CAMBIAR CONTRASEÑA */}
      {modalPasswordAbierto && (
        <ModalDefinirPassword
          esInvitacionInicial={esInvitacionReciente}
          onCompletado={() => {
            setModalPasswordAbierto(false);
            setEsInvitacionReciente(false);
            if (typeof window !== "undefined" && window.location.hash) {
              window.history.replaceState(null, "", window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
}
