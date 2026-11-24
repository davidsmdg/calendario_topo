"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Filter,
  UserCheck,
  Award,
  ChevronDown,
  ChevronUp,
  User,
  AlertCircle,
  Tag,
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  UserPlus,
  Settings,
  Send,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import {
  EstadoCronogramaTopo,
  EventoCronograma,
  JornadaPedagogica,
  MallaComponente,
} from "@/types";
import { TALLERISTAS_POR_COMPONENTE } from "@/utils/seedData";
import { obtenerEstiloComponente } from "@/utils/festivosColombia";
import { TopoAvatar } from "./TopoAvatar";

interface SeguimientoTalleristasProps {
  estado: EstadoCronogramaTopo;
  talleristaSeleccionadoInicial?: string | null;
  esCoordinador?: boolean;
  onActualizarEstado?: (nuevo: EstadoCronogramaTopo) => void;
  onIrAJornada?: (jornadaId: string) => void;
  onIrAHito?: () => void;
}

interface AsignacionClase {
  jornadaId: string;
  numeroJornada?: number | string;
  fecha: string;
  diaSemana: string;
  hora: string;
  componente: string;
  temaDelDia: string;
  tipoAsignacion: "directa" | "por_materia"; // Directa con su nombre o implícita por ser de ese componente
  estadoEjecucion?: "pendiente" | "dictada" | "reemplazo" | "cancelada";
  talleristaEfectivo?: string;
  observaciones?: string;
}

interface AsignacionTarea {
  hitoId: string;
  fecha: string;
  diaSemana: string;
  evento: string;
  compromiso: string;
  completado: boolean;
}

interface PerfilTallerista {
  nombre: string;
  materiasBase: string[];
  totalClases: number;
  clasesProgramadas: number;
  clasesDictadas: number;
  encuentrosComunitarios: number;
  participacionTotal: number;
  totalTareas: number;
  tareasCompletadas: number;
  totalDiasUnicos: number;
  fechasAsignadas: string[];
  clases: AsignacionClase[];
  tareas: AsignacionTarea[];
  proximaFecha?: string;
  rolPrincipal: string;
}

// Normaliza nombres para comparación flexible
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function coincideNombre(nombreTallerista: string, textoABuscar: string): boolean {
  if (!textoABuscar || !nombreTallerista) return false;
  const nNorm = normalizarTexto(nombreTallerista);
  const tNorm = normalizarTexto(textoABuscar);

  if (nNorm === tNorm) return true;
  const palabrasTallerista = nNorm.split(/\s+/);
  const primerNombre = palabrasTallerista[0];

  if (tNorm.includes(nNorm)) return true;
  if (
    palabrasTallerista.length > 1 &&
    tNorm.includes(primerNombre) &&
    palabrasTallerista.some((p) => tNorm.includes(p))
  ) {
    return true;
  }
  return false;
}

export function SeguimientoTalleristas({
  estado,
  talleristaSeleccionadoInicial = null,
  esCoordinador = false,
  onActualizarEstado,
  onIrAJornada,
  onIrAHito,
}: SeguimientoTalleristasProps) {
  const [talleristaActivo, setTalleristaActivo] = useState<string | null>(
    talleristaSeleccionadoInicial
  );
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroMateria, setFiltroMateria] = useState<string>("todas");
  const [filtroCarga, setFiltroCarga] = useState<"todos" | "con_asignacion" | "sin_asignacion">("todos");
  const [filtroVigencia, setFiltroVigencia] = useState<"todos" | "activos" | "antiguos">("todos");
  const [vistaTabDetalle, setVistaTabDetalle] = useState<"todas" | "clases" | "tareas">("todas");

  // Estado para la modal o sección de Gestión / Edición de Talleristas
  const [modoGestionAbierto, setModoGestionAbierto] = useState<boolean>(false);
  const [talleristaEditando, setTalleristaEditando] = useState<string | null>(null);
  const [nombreEdicion, setNombreEdicion] = useState<string>("");
  const [telefonoEdicion, setTelefonoEdicion] = useState<string>("");
  const [correoEdicion, setCorreoEdicion] = useState<string>("");
  const [notasEdicion, setNotasEdicion] = useState<string>("");
  const [materiasEdicion, setMateriasEdicion] = useState<string[]>([]);

  const [nuevoTalleristaNombre, setNuevoTalleristaNombre] = useState<string>("");
  const [nuevoTalleristaTelefono, setNuevoTalleristaTelefono] = useState<string>("");
  const [nuevoTalleristaCorreo, setNuevoTalleristaCorreo] = useState<string>("");
  const [nuevoTalleristaRol, setNuevoTalleristaRol] = useState<"tallerista" | "coordinador">("tallerista");
  const [nuevoTalleristaMaterias, setNuevoTalleristaMaterias] = useState<string[]>([]);
  const [rolEdicion, setRolEdicion] = useState<"tallerista" | "coordinador">("tallerista");
  const [enviandoInvitacion, setEnviandoInvitacion] = useState<boolean>(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  // Lista de todos los componentes / materias disponibles en el sistema
  const componentesDisponibles = useMemo(() => {
    const setComp = new Set<string>();
    Object.keys(TALLERISTAS_POR_COMPONENTE).forEach((c) => setComp.add(c));
    estado.mallaCurricular.forEach((m) => {
      if (m.componente?.trim()) setComp.add(m.componente.trim().toUpperCase());
    });
    return Array.from(setComp);
  }, [estado.mallaCurricular]);

  // Mapa reactivo de talleristas a sus componentes asignados en la Malla
  const mapaMateriasPorTallerista = useMemo(() => {
    const mapa = new Map<string, Set<string>>();

    // 1. Del seed inicial
    Object.entries(TALLERISTAS_POR_COMPONENTE).forEach(([materia, lista]) => {
      lista.forEach((t) => {
        const key = t.trim();
        if (!mapa.has(key)) mapa.set(key, new Set());
        mapa.get(key)!.add(materia);
      });
    });

    // 2. De la Malla Curricular del estado (que es persistida)
    estado.mallaCurricular.forEach((m) => {
      if (m.talleristasBase && m.componente) {
        m.talleristasBase.forEach((t) => {
          const key = t.trim();
          if (!mapa.has(key)) mapa.set(key, new Set());
          mapa.get(key)!.add(m.componente.trim().toUpperCase());
        });
      }
    });

    return mapa;
  }, [estado.mallaCurricular]);

  // Lista completa de nombres únicos de talleristas
  const todosLosTalleristas = useMemo(() => {
    const setNombres = new Set<string>();

    // De la lista de talleristas del estado
    estado.talleristas.forEach((t) => {
      if (t && t !== "Todos" && t.trim()) setNombres.add(t.trim());
    });

    // Del mapa de componentes
    mapaMateriasPorTallerista.forEach((_, t) => {
      if (t && t !== "Todos" && t.trim()) setNombres.add(t.trim());
    });

    // De los bloques de jornadas
    estado.jornadas.forEach((j) => {
      j.bloques.forEach((b) => {
        if (b.talleristas) {
          b.talleristas.split(/[,;/]+/).forEach((sub) => {
            const limpio = sub.trim();
            if (limpio.length > 2 && limpio.toLowerCase() !== "todos") {
              setNombres.add(limpio);
            }
          });
        }
      });
      if (j.encargadxDelDia) {
        j.encargadxDelDia.split(/[,;/]+/).forEach((sub) => {
          const limpio = sub.trim();
          if (limpio.length > 2 && limpio.toLowerCase() !== "todos") {
            setNombres.add(limpio);
          }
        });
      }
    });

    // De los hitos
    estado.hitos.forEach((h) => {
      if (h.personasEncargadas) {
        h.personasEncargadas.split(/[,;/]+/).forEach((sub) => {
          const limpio = sub.trim();
          if (limpio.length > 2 && limpio.toLowerCase() !== "todos") {
            setNombres.add(limpio);
          }
        });
      }
    });

    return Array.from(setNombres).sort((a, b) => a.localeCompare(b));
  }, [estado, mapaMateriasPorTallerista]);

  // Construir perfiles calculados de cada tallerista
  const perfilesMap = useMemo(() => {
    const mapa = new Map<string, PerfilTallerista>();

    todosLosTalleristas.forEach((tallerista) => {
      const clases: AsignacionClase[] = [];
      const tareas: AsignacionTarea[] = [];
      const diasSet = new Set<string>();

      // Materias base según el mapa reactivo
      const materiasBase = Array.from(mapaMateriasPorTallerista.get(tallerista) || []);

      // Buscar clases asignadas (explícitas o proyectadas por pertenecer al componente)
      estado.jornadas.forEach((j) => {
        let diaTieneAsignacion = false;
        const bitacora = j.bitacora;

        j.bloques.forEach((b) => {
          const compUpper = (b.componente || "").trim().toUpperCase();
          const esDeEstaMateria = compUpper && materiasBase.some((m) => m.toUpperCase() === compUpper);
          const tieneNombreExplicito = b.talleristas && coincideNombre(tallerista, b.talleristas);

          // Si el nombre está explícito, o si la clase ya tiene materia asignada y el tallerista pertenece a esa materia
          if (tieneNombreExplicito || esDeEstaMateria) {
            // Verificar registro de bitácora
            const regEjecucion = bitacora?.ejecucionBloques?.find((r) => r.bloqueId === b.id);
            const estadoEjecucion = regEjecucion?.estado || "pendiente";
            
            // Comprobar si el tallerista está entre los asistentes efectivos (individual o múltiple)
            const asistentesEfectivos = regEjecucion?.talleristasEfectivos || (regEjecucion?.talleristaEfectivo ? [regEjecucion.talleristaEfectivo] : (b.talleristas ? b.talleristas.split(/[,;/]+/).map((s) => s.trim()) : []));
            const asistioEfectivamente = asistentesEfectivos.some((a) => coincideNombre(tallerista, a));
            const talleristaEfectivoTexto = asistentesEfectivos.join(", ");

            clases.push({
              jornadaId: j.id,
              numeroJornada: j.numeroJornada,
              fecha: j.fecha || "Fecha por definir",
              diaSemana: j.diaSemana || "Sábado",
              hora: b.hora || "8:00 AM - 9:30 AM",
              componente: b.componente || "Sin componente",
              temaDelDia: regEjecucion?.temaDictado || b.temaDelDia || "Tema por definir",
              tipoAsignacion: tieneNombreExplicito ? "directa" : "por_materia",
              estadoEjecucion: asistioEfectivamente && estadoEjecucion === "dictada" ? "dictada" : estadoEjecucion,
              talleristaEfectivo: talleristaEfectivoTexto,
              observaciones: regEjecucion?.observaciones,
            });
            diaTieneAsignacion = true;
          }
        });

        if (j.encargadxDelDia && coincideNombre(tallerista, j.encargadxDelDia)) {
          clases.push({
            jornadaId: j.id,
            numeroJornada: j.numeroJornada,
            fecha: j.fecha || "Fecha por definir",
            diaSemana: j.diaSemana || "Sábado",
            hora: j.horasJornada || "Jornada Completa",
            componente: "ENCARGADX DEL DÍA",
            temaDelDia: j.descripcionUnificada || "Coordinación de jornada y bitácora",
            tipoAsignacion: "directa",
            estadoEjecucion: bitacora?.jornadaFinalizada ? "dictada" : "pendiente",
          });
          diaTieneAsignacion = true;
        }

        if (diaTieneAsignacion && j.fecha) {
          diasSet.add(j.fecha);
        }
      });

      // Contar clases programadas vs clases dictadas
      const clasesProgramadas = clases.length;
      const clasesDictadas = clases.filter((c) => c.estadoEjecucion === "dictada" || (c.tipoAsignacion === "directa" && c.estadoEjecucion !== "cancelada" && c.jornadaId && c.fecha < "2027-01-01")).length;

      // Contar participación en encuentros comunitarios (Escuelas de Formación, Coordinaciones y Salidas)
      let encuentrosComunitarios = 0;
      estado.jornadas.forEach((j) => {
        const b = j.bitacora;
        if (b) {
          if (b.asistentesCoordinacion?.some((a) => coincideNombre(tallerista, a))) {
            encuentrosComunitarios++;
            if (j.fecha) diasSet.add(j.fecha);
          }
          if (b.asistentesEscuelaFormacion?.some((a) => coincideNombre(tallerista, a))) {
            encuentrosComunitarios++;
            if (j.fecha) diasSet.add(j.fecha);
          }
          if (b.asistentesSalidaPedagogica?.some((a) => coincideNombre(tallerista, a))) {
            encuentrosComunitarios++;
            if (j.fecha) diasSet.add(j.fecha);
          }
        }
      });

      // Participaciones totales en el proceso de El Topo
      const participacionTotal = clasesDictadas + encuentrosComunitarios;

      // Buscar tareas asignadas
      estado.hitos.forEach((h) => {
        if (h.personasEncargadas && coincideNombre(tallerista, h.personasEncargadas)) {
          tareas.push({
            hitoId: h.id,
            fecha: h.fecha || "Sin fecha",
            diaSemana: h.diaSemana || "Por definir",
            evento: h.evento || "Tarea institucional",
            compromiso: h.compromiso || "",
            completado: Boolean(h.completado),
          });
          if (h.fecha) {
            diasSet.add(h.fecha);
          }
        }
      });

      let rolPrincipal = "Tallerista Pedagógico";
      if (materiasBase.length > 0) {
        rolPrincipal = `Tallerista de ${materiasBase.join(" y ")}`;
      } else if (clases.some((c) => c.componente === "JORNADA UNIFICADA")) {
        rolPrincipal = "Coordinador / Tallerista Comunitario";
      }

      const fechasOrdenadas = Array.from(diasSet);

      mapa.set(tallerista, {
        nombre: tallerista,
        materiasBase,
        totalClases: clases.length,
        clasesProgramadas,
        clasesDictadas,
        encuentrosComunitarios,
        participacionTotal,
        totalTareas: tareas.length,
        tareasCompletadas: tareas.filter((t) => t.completado).length,
        totalDiasUnicos: diasSet.size,
        fechasAsignadas: fechasOrdenadas,
        clases,
        tareas,
        proximaFecha: fechasOrdenadas[0],
        rolPrincipal,
      });
    });

    return mapa;
  }, [todosLosTalleristas, estado, mapaMateriasPorTallerista]);

  // Filtrado de talleristas para la lista de selección
  const talleristasFiltrados = useMemo(() => {
    return todosLosTalleristas.filter((t) => {
      const perfil = perfilesMap.get(t);
      if (!perfil) return false;

      // Filtro de búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincide =
          perfil.nombre.toLowerCase().includes(q) ||
          perfil.rolPrincipal.toLowerCase().includes(q) ||
          perfil.materiasBase.some((m) => m.toLowerCase().includes(q));
        if (!coincide) return false;
      }

      // Filtro por materia
      if (filtroMateria !== "todas") {
        const tieneMateria =
          perfil.materiasBase.includes(filtroMateria) ||
          perfil.clases.some((c) => c.componente === filtroMateria);
        if (!tieneMateria) return false;
      }

      // Filtro por carga de trabajo
      const cargaTotal = perfil.totalClases + perfil.totalTareas;
      if (filtroCarga === "con_asignacion" && cargaTotal === 0) return false;
      if (filtroCarga === "sin_asignacion" && cargaTotal > 0) return false;

      // Filtro por vigencia (Activos en este ciclo vs Antiguos)
      const tieneActividadEnCiclo = cargaTotal > 0 || perfil.materiasBase.length > 0;
      if (filtroVigencia === "activos" && !tieneActividadEnCiclo) return false;
      if (filtroVigencia === "antiguos" && tieneActividadEnCiclo) return false;

      return true;
    });
  }, [todosLosTalleristas, perfilesMap, busqueda, filtroMateria, filtroCarga, filtroVigencia]);

  // Perfil activo
  const perfilActivo = useMemo(() => {
    if (talleristaActivo && perfilesMap.has(talleristaActivo)) {
      return perfilesMap.get(talleristaActivo)!;
    }
    if (talleristasFiltrados.length > 0) {
      return perfilesMap.get(talleristasFiltrados[0])!;
    }
    return null;
  }, [talleristaActivo, perfilesMap, talleristasFiltrados]);

  // =========================================================================
  // HANDLERS DE EDICIÓN, CREACIÓN Y ELIMINACIÓN DE TALLERISTAS
  // =========================================================================

  const notificarFeedback = (msg: string) => {
    setMensajeFeedback(msg);
    setTimeout(() => setMensajeFeedback(null), 3500);
  };

  // Enviar invitación de Supabase Auth
  const handleEnviarInvitacionEmail = async (email: string, nombre: string, rol: string, componentes: string[]) => {
    if (!email || !email.includes("@")) {
      alert("Por favor ingresa un correo electrónico válido para enviar la invitación.");
      return;
    }
    setEnviandoInvitacion(true);
    try {
      const res = await fetch("/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nombre: nombre.trim(),
          rol,
          componentes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar la invitación.");
      }
      notificarFeedback(`📩 ¡Invitación de Supabase enviada con éxito a ${email}!`);
    } catch (err: any) {
      alert(`No se pudo enviar la invitación: ${err.message}`);
    } finally {
      setEnviandoInvitacion(false);
    }
  };

  // Crear un nuevo tallerista y vincularlo a sus componentes en la Malla
  const handleCrearNuevoTallerista = () => {
    const nombre = nuevoTalleristaNombre.trim();
    if (!nombre) {
      alert("Por favor ingresa el nombre del tallerista.");
      return;
    }

    if (todosLosTalleristas.some((t) => t.toLowerCase() === nombre.toLowerCase())) {
      alert("Ya existe un tallerista con ese nombre.");
      return;
    }

    // 1. Agregar a la lista de talleristas
    const nuevosTalleristas = Array.from(new Set([...estado.talleristas, nombre]));

    // 2. Actualizar la Malla Curricular asociándolo a los componentes elegidos
    let nuevaMalla = [...estado.mallaCurricular];
    nuevoTalleristaMaterias.forEach((materia) => {
      const idx = nuevaMalla.findIndex(
        (m) => m.componente.toUpperCase() === materia.toUpperCase()
      );
      if (idx !== -1) {
        const base = nuevaMalla[idx].talleristasBase || [];
        if (!base.includes(nombre)) {
          nuevaMalla[idx] = {
            ...nuevaMalla[idx],
            talleristasBase: [...base, nombre],
          };
        }
      } else {
        // Crear fila si no existe
        nuevaMalla.push({
          id: `malla-${Date.now()}`,
          componente: materia,
          talleristasBase: [nombre],
          sesiones: Array(11).fill(""),
        });
      }
    });

    // 3. Guardar en el directorio de contacto
    const directorioPrevio = estado.directorioTalleristas || [];
    const nuevoRegistro = {
      nombre,
      telefono: nuevoTalleristaTelefono.trim(),
      correo: nuevoTalleristaCorreo.trim(),
      rol: nuevoTalleristaRol,
      componentes: nuevoTalleristaMaterias,
    };
    const nuevoDirectorio = [...directorioPrevio.filter((d) => d.nombre !== nombre), nuevoRegistro];

    if (onActualizarEstado) {
      onActualizarEstado({
        ...estado,
        talleristas: nuevosTalleristas,
        mallaCurricular: nuevaMalla,
        directorioTalleristas: nuevoDirectorio,
      });
    }

    // Si tiene correo ingresado, preguntar o enviar invitación automáticamente
    if (nuevoTalleristaCorreo.trim()) {
      handleEnviarInvitacionEmail(
        nuevoTalleristaCorreo.trim(),
        nombre,
        nuevoTalleristaRol,
        nuevoTalleristaMaterias
      );
    }

    setNuevoTalleristaNombre("");
    setNuevoTalleristaTelefono("");
    setNuevoTalleristaCorreo("");
    setNuevoTalleristaMaterias([]);
    setTalleristaActivo(nombre);
    notificarFeedback(`¡Tallerista "${nombre}" creado y registrado en directorio!`);
  };

  // Iniciar edición de un tallerista
  const handleIniciarEdicion = (nombre: string) => {
    const perfil = perfilesMap.get(nombre);
    const infoContacto = (estado.directorioTalleristas || []).find(
      (d) => d.nombre.toLowerCase() === nombre.toLowerCase()
    );
    setTalleristaEditando(nombre);
    setNombreEdicion(nombre);
    setTelefonoEdicion(infoContacto?.telefono || "");
    setCorreoEdicion(infoContacto?.correo || "");
    setNotasEdicion(infoContacto?.notas || "");
    setRolEdicion(((infoContacto as any)?.rol as "tallerista" | "coordinador") || "tallerista");
    setMateriasEdicion(perfil ? [...perfil.materiasBase] : []);
  };

  // Guardar cambios de edición (nombre, contacto y materias asignadas)
  const handleGuardarEdicionTallerista = () => {
    if (!talleristaEditando) return;
    const nombreAnterior = talleristaEditando;
    const nombreNuevo = nombreEdicion.trim();

    if (!nombreNuevo) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    // 1. Actualizar lista de talleristas
    const nuevosTalleristas = estado.talleristas.map((t) =>
      t === nombreAnterior ? nombreNuevo : t
    );
    if (!nuevosTalleristas.includes(nombreNuevo)) {
      nuevosTalleristas.push(nombreNuevo);
    }

    // 2. Actualizar la Malla Curricular con las nuevas materias elegidas
    const nuevaMalla = estado.mallaCurricular.map((m) => {
      let base = (m.talleristasBase || []).filter((t) => t !== nombreAnterior && t !== nombreNuevo);
      if (materiasEdicion.includes(m.componente.toUpperCase())) {
        base.push(nombreNuevo);
      }
      return {
        ...m,
        talleristasBase: base,
      };
    });

    // 3. Actualizar Directorio de Contacto (teléfono, correo, notas, rol)
    const directorioPrevio = estado.directorioTalleristas || [];
    const registroActualizado = {
      nombre: nombreNuevo,
      telefono: telefonoEdicion.trim(),
      correo: correoEdicion.trim(),
      rol: rolEdicion,
      notas: notasEdicion.trim(),
      componentes: materiasEdicion,
    };
    const nuevoDirectorio = [
      ...directorioPrevio.filter(
        (d) => d.nombre.toLowerCase() !== nombreAnterior.toLowerCase() && d.nombre.toLowerCase() !== nombreNuevo.toLowerCase()
      ),
      registroActualizado,
    ];

    // 4. Reemplazar el nombre en los bloques de jornadas existentes si cambió el nombre
    let nuevasJornadas = estado.jornadas;
    if (nombreAnterior !== nombreNuevo) {
      nuevasJornadas = estado.jornadas.map((j) => ({
        ...j,
        encargadxDelDia: j.encargadxDelDia
          ? j.encargadxDelDia.replace(new RegExp(`\\b${nombreAnterior}\\b`, "g"), nombreNuevo)
          : j.encargadxDelDia,
        bloques: j.bloques.map((b) => ({
          ...b,
          talleristas: b.talleristas
            ? b.talleristas.replace(new RegExp(`\\b${nombreAnterior}\\b`, "g"), nombreNuevo)
            : b.talleristas,
        })),
      }));
    }

    if (onActualizarEstado) {
      onActualizarEstado({
        ...estado,
        talleristas: nuevosTalleristas,
        mallaCurricular: nuevaMalla,
        jornadas: nuevasJornadas,
        directorioTalleristas: nuevoDirectorio,
      });
    }

    setTalleristaEditando(null);
    setTalleristaActivo(nombreNuevo);
    notificarFeedback(`¡Información y contacto de "${nombreNuevo}" guardados exitosamente!`);
  };

  // Eliminar tallerista de la lista y de los componentes
  const handleEliminarTallerista = (nombreAEliminar: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar a "${nombreAEliminar}" del equipo pedagógico?`)) {
      return;
    }

    const nuevosTalleristas = estado.talleristas.filter((t) => t !== nombreAEliminar);

    const nuevaMalla = estado.mallaCurricular.map((m) => ({
      ...m,
      talleristasBase: (m.talleristasBase || []).filter((t) => t !== nombreAEliminar),
    }));

    if (onActualizarEstado) {
      onActualizarEstado({
        ...estado,
        talleristas: nuevosTalleristas,
        mallaCurricular: nuevaMalla,
      });
    }

    if (talleristaActivo === nombreAEliminar) {
      setTalleristaActivo(null);
    }
    notificarFeedback(`Tallerista "${nombreAEliminar}" eliminado.`);
  };

  // Alternar selección de materia en edición
  const toggleMateriaEdicion = (materia: string) => {
    setMateriasEdicion((prev) =>
      prev.includes(materia) ? prev.filter((m) => m !== materia) : [...prev, materia]
    );
  };

  const toggleMateriaNuevo = (materia: string) => {
    setNuevoTalleristaMaterias((prev) =>
      prev.includes(materia) ? prev.filter((m) => m !== materia) : [...prev, materia]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO KAHOOT STYLE: SEGUIMIENTO DE TALLERISTAS & GESTIÓN
         ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2B4C7E] via-[#3B629B] to-[#1E3557] text-white p-6 sm:p-8 shadow-warm-lg border-2 border-white/20 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-[#2B2623] flex items-center justify-center font-black shadow-lg shrink-0">
              <Users className="w-9 h-9" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Equipo Pedagógico 2027</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Seguimiento y Gestión de Talleristas
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
                Monitorea cargas de trabajo, asigna componentes/materias, edita nombres y agrega o
                quita integrantes del equipo en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModoGestionAbierto(!modoGestionAbierto)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition transform active:scale-95 ${
                modoGestionAbierto
                  ? "bg-amber-400 text-stone-900"
                  : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{modoGestionAbierto ? "Cerrar Panel de Edición" : "⚙️ Administrar Equipo"}</span>
            </button>

            <div className="bg-white/10 backdrop-blur px-3.5 py-2.5 rounded-2xl border border-white/20 text-xs font-black flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>{todosLosTalleristas.length} Registrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK TEMPORAL */}
      {mensajeFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-topo-green text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {/* =========================================================================
          PANEL DE ADMINISTRACIÓN: AGREGAR Y EDITAR TALLERISTAS POR COMPONENTE
         ========================================================================= */}
      {modoGestionAbierto && (
        <div className="bg-white rounded-3xl border-3 border-amber-400 p-6 shadow-warm-lg space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-950 flex items-center justify-center font-black">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-topo-dark">
                  Panel de Administración: Asignación de Componentes y Creación
                </h3>
                <p className="text-xs text-stone-500">
                  Agrega nuevos integrantes, modifica su nombre o define a qué materias pertenecen
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModoGestionAbierto(false)}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FORMULARIO: AGREGAR NUEVO TALLERISTA */}
            <div className="p-5 rounded-2xl bg-[#FCFBF7] border-2 border-[#E2DCCE] space-y-4">
              <h4 className="text-sm font-black text-topo-dark flex items-center gap-2">
                <Plus className="w-4 h-4 text-topo-green" />
                <span>Crear Nuevo Tallerista</span>
              </h4>

              <div>
                <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nuevoTalleristaNombre}
                  onChange={(e) => setNuevoTalleristaNombre(e.target.value)}
                  placeholder="Ej: Andrés Morales..."
                  className="w-full px-3 py-2 rounded-xl border-stone-300 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                    📱 Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={nuevoTalleristaTelefono}
                    onChange={(e) => setNuevoTalleristaTelefono(e.target.value)}
                    placeholder="Ej: +57 312 4567890"
                    className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                    ✉️ Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={nuevoTalleristaCorreo}
                    onChange={(e) => setNuevoTalleristaCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>

              {esCoordinador && (
                <div>
                  <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                    Rol y Permisos del Sistema:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoTalleristaRol("tallerista")}
                      className={`p-2.5 rounded-xl border-2 text-left transition ${
                        nuevoTalleristaRol === "tallerista"
                          ? "border-[#7A3EBE] bg-purple-50 text-purple-950 font-black shadow-xs"
                          : "border-stone-200 bg-white text-stone-600 font-bold"
                      }`}
                    >
                      <span className="block text-xs">👤 Tallerista</span>
                      <span className="block text-[10px] text-stone-500 font-medium">
                        Ver clases, postularse como encargadx y bitácora
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNuevoTalleristaRol("coordinador")}
                      className={`p-2.5 rounded-xl border-2 text-left transition ${
                        nuevoTalleristaRol === "coordinador"
                          ? "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs"
                          : "border-stone-200 bg-white text-stone-600 font-bold"
                      }`}
                    >
                      <span className="block text-xs">👑 Coordinador/a</span>
                      <span className="block text-[10px] text-stone-500 font-medium">
                        Crear calendarios, editar estructura y roles
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                  Componentes / Materias en las que participa:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                  {componentesDisponibles.map((comp) => {
                    const sel = nuevoTalleristaMaterias.includes(comp);
                    const estilo = obtenerEstiloComponente(comp);
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => toggleMateriaNuevo(comp)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition border ${
                          sel
                            ? `${estilo.bg} ${estilo.text} border-current shadow-xs scale-105`
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {sel ? "✓ " : "+ "}
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCrearNuevoTallerista}
                className="w-full py-2.5 rounded-xl bg-topo-green hover:bg-emerald-800 text-white font-black text-xs shadow-md transition"
              >
                + Registrar Tallerista en el Equipo
              </button>
            </div>

            {/* FORMULARIO: EDITAR TALLERISTA SELECCIONADO */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200 space-y-4">
              <h4 className="text-sm font-black text-topo-dark flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-topo-terracotta" />
                  <span>Editar Información de Tallerista</span>
                </span>
                {talleristaEditando && (
                  <button
                    type="button"
                    onClick={() => setTalleristaEditando(null)}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-bold"
                  >
                    Cancelar
                  </button>
                )}
              </h4>

              {talleristaEditando ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                      Nombre (se actualizará en las clases y tareas)
                    </label>
                    <input
                      type="text"
                      value={nombreEdicion}
                      onChange={(e) => setNombreEdicion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-stone-300 text-xs font-black bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                        📱 Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={telefonoEdicion}
                        onChange={(e) => setTelefonoEdicion(e.target.value)}
                        placeholder="Ej: +57 312 4567890"
                        className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                        ✉️ Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={correoEdicion}
                        onChange={(e) => setCorreoEdicion(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-bold bg-white"
                      />
                    </div>
                  </div>

                  {esCoordinador && (
                    <div>
                      <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                        Rol y Permisos del Sistema:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRolEdicion("tallerista")}
                          className={`p-2.5 rounded-xl border-2 text-left transition ${
                            rolEdicion === "tallerista"
                              ? "border-[#7A3EBE] bg-purple-50 text-purple-950 font-black shadow-xs"
                              : "border-stone-200 bg-white text-stone-600 font-bold"
                          }`}
                        >
                          <span className="block text-xs">👤 Tallerista</span>
                          <span className="block text-[10px] text-stone-500 font-medium">
                            Rol pedagógico regular
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRolEdicion("coordinador")}
                          className={`p-2.5 rounded-xl border-2 text-left transition ${
                            rolEdicion === "coordinador"
                              ? "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs"
                              : "border-stone-200 bg-white text-stone-600 font-bold"
                          }`}
                        >
                          <span className="block text-xs">👑 Coordinador/a</span>
                          <span className="block text-[10px] text-stone-500 font-medium">
                            Permiso de crear calendarios
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {correoEdicion && esCoordinador && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="w-4 h-4 text-purple-700 shrink-0" />
                        <span className="font-bold text-purple-950 truncate">{correoEdicion}</span>
                      </div>
                      <button
                        type="button"
                        disabled={enviandoInvitacion}
                        onClick={() =>
                          handleEnviarInvitacionEmail(
                            correoEdicion,
                            nombreEdicion,
                            rolEdicion,
                            materiasEdicion
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#7A3EBE] hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                      >
                        {enviandoInvitacion ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Reenviar Invitación</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                      📝 Notas / Observaciones
                    </label>
                    <input
                      type="text"
                      value={notasEdicion}
                      onChange={(e) => setNotasEdicion(e.target.value)}
                      placeholder="Ej: Disponibilidad los sábados en la mañana..."
                      className="w-full px-3 py-1.5 rounded-xl border-stone-300 text-xs font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                      Componentes / Materias asignadas:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                      {componentesDisponibles.map((comp) => {
                        const sel = materiasEdicion.includes(comp);
                        const estilo = obtenerEstiloComponente(comp);
                        return (
                          <button
                            key={comp}
                            type="button"
                            onClick={() => toggleMateriaEdicion(comp)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition border ${
                              sel
                                ? `${estilo.bg} ${estilo.text} border-current shadow-xs scale-105`
                                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {sel ? "✓ " : "+ "}
                            {comp}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGuardarEdicionTallerista}
                      className="flex-1 py-2.5 rounded-xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-black text-xs shadow-md transition"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarTallerista(talleristaEditando)}
                      className="px-3 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-xs transition"
                      title="Eliminar este tallerista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500 space-y-2">
                  <User className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs font-bold">
                    Haz clic en el botón de lápiz ✏️ de cualquier tallerista en la lista inferior
                    para editar sus componentes o su nombre.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FILTROS Y BUSCADOR (INCLUYE VISUALIZACIÓN POR COMPONENTE)
         ========================================================================= */}
      <div className="bg-white p-4 rounded-3xl border-2 border-[#E2DCCE] shadow-warm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tallerista por nombre o materia..."
            className="w-full pl-10 pr-3 py-2 rounded-2xl border-stone-300 focus:border-topo-mustard text-xs font-bold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Visualizar por Componente */}
          <div className="flex items-center gap-1.5 bg-[#F6F2E9] px-2.5 py-1 rounded-2xl border border-[#E2DCCE]">
            <BookOpen className="w-3.5 h-3.5 text-topo-terracotta" />
            <select
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
              className="border-none text-xs font-black bg-transparent py-1 pr-6 focus:ring-0 text-topo-dark cursor-pointer"
            >
              <option value="todas">Todos los Componentes ({componentesDisponibles.length})</option>
              {componentesDisponibles.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Carga */}
          <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1 border border-[#E2DCCE]">
            <button
              type="button"
              onClick={() => setFiltroCarga("todos")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filtroCarga === "todos"
                  ? "bg-topo-mustard text-topo-dark shadow-xs"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              Todos ({todosLosTalleristas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCarga("con_asignacion")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filtroCarga === "con_asignacion"
                  ? "bg-topo-green text-white shadow-xs"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              Con Asignación
            </button>
            <button
              type="button"
              onClick={() => setFiltroCarga("sin_asignacion")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filtroCarga === "sin_asignacion"
                  ? "bg-[#D83A56] text-white shadow-xs"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              Sin Asignar
            </button>
          </div>

          {/* Filtro Activos vs Antiguos */}
          <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1 border border-[#E2DCCE]">
            <button
              type="button"
              onClick={() => setFiltroVigencia("todos")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filtroVigencia === "todos"
                  ? "bg-[#1B365D] text-white shadow-xs"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroVigencia("activos")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filtroVigencia === "activos"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              🌟 Activos
            </button>
            <button
              type="button"
              onClick={() => setFiltroVigencia("antiguos")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                filtroVigencia === "antiguos"
                  ? "bg-stone-500 text-white shadow-xs"
                  : "text-stone-600 hover:text-topo-dark"
              }`}
            >
              📜 Antiguos
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTENIDO PRINCIPAL: DOS COLUMNAS (LISTA RESUMEN + PERFIL DETALLADO)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: RESUMEN DE TARJETAS DE TALLERISTAS (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase text-stone-500 tracking-wider">
              Talleristas ({talleristasFiltrados.length})
            </span>
            <span className="text-[11px] text-stone-400 font-bold">
              Haz clic para ver el perfil completo
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {talleristasFiltrados.map((tallerista) => {
              const p = perfilesMap.get(tallerista);
              if (!p) return null;
              const esSeleccionado = perfilActivo?.nombre === p.nombre;
              const tieneCarga = p.totalClases > 0 || p.totalTareas > 0;

              return (
                <div
                  key={p.nombre}
                  onClick={() => setTalleristaActivo(p.nombre)}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-3xl border-2 transition-all cursor-pointer text-left flex items-center justify-between gap-3 ${
                    esSeleccionado
                      ? "bg-white border-[#7A3EBE] shadow-warm-lg scale-[1.01] ring-2 ring-[#7A3EBE]/30"
                      : "bg-white border-[#E2DCCE] hover:border-topo-mustard hover:shadow-warm"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        tieneCarga ? "bg-purple-100 text-[#5C23A3]" : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {p.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-topo-dark truncate">
                          {p.nombre}
                        </h4>
                        {p.materiasBase.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black shrink-0">
                            {p.materiasBase[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {p.rolPrincipal}
                      </p>
                    </div>
                  </div>

                  {/* Acciones y Conteo rápido */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Botón rápido para abrir edición de este tallerista */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModoGestionAbierto(true);
                        handleIniciarEdicion(p.nombre);
                      }}
                      className="p-1.5 rounded-xl hover:bg-amber-100 text-stone-400 hover:text-amber-900 transition"
                      title="Editar componentes y datos de este tallerista"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <span
                      title={`${p.totalClases} bloques de clase asignados`}
                      className={`px-2 py-1 rounded-xl text-xs font-black ${
                        p.totalClases > 0
                          ? "bg-blue-100 text-[#1368CE]"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      🎓 {p.totalClases}
                    </span>
                    <span
                      title={`${p.totalTareas} tareas / compromisos`}
                      className={`px-2 py-1 rounded-xl text-xs font-black ${
                        p.totalTareas > 0
                          ? "bg-rose-100 text-[#B5253F]"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      📋 {p.totalTareas}
                    </span>
                  </div>
                </div>
              );
            })}

            {talleristasFiltrados.length === 0 && (
              <div className="p-8 rounded-3xl bg-white border-2 border-dashed border-stone-300 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs font-black text-stone-600">
                  No se encontraron talleristas con ese criterio
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: PERFIL DETALLADO DESPLEGADO (7 cols) */}
        <div className="lg:col-span-7">
          {perfilActivo ? (
            <div className="bg-white rounded-[2.5rem] border-3 border-[#E2DCCE] shadow-warm-lg p-6 sm:p-8 space-y-6">
              {/* Encabezado del Perfil del Tallerista */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#7A3EBE] to-[#5C23A3] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                    {perfilActivo.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-topo-dark">
                        {perfilActivo.nombre}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-topo-green text-xs font-black">
                        Activo 2027
                      </span>
                    </div>
                    <p className="text-xs font-bold text-stone-500 mt-1">
                      {perfilActivo.rolPrincipal}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoGestionAbierto(true);
                      handleIniciarEdicion(perfilActivo.nombre);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Info / Componentes</span>
                  </button>
                </div>
              </div>

              {/* Materias base y Datos Personales en el Perfil */}
              <div className="space-y-3">
                {/* Datos de contacto con botones directos (WhatsApp y Enviar Correo) */}
                {(() => {
                  const contacto = (estado.directorioTalleristas || []).find(
                    (d) => d.nombre.toLowerCase() === perfilActivo.nombre.toLowerCase()
                  );
                  const telLimpio = (contacto?.telefono || "").replace(/\D/g, "");

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                      <div className="flex items-center justify-between gap-2 text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-black text-stone-500">📱 Teléfono:</span>
                          <span className="font-bold text-topo-dark truncate">
                            {contacto?.telefono || "Por registrar"}
                          </span>
                        </div>
                        {telLimpio && (
                          <a
                            href={`https://wa.me/57${telLimpio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[11px] hover:bg-emerald-700 transition shrink-0"
                            title="Abrir chat de WhatsApp"
                          >
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-black text-stone-500">✉️ Correo:</span>
                          <span className="font-bold text-topo-dark truncate">
                            {contacto?.correo || "Por registrar"}
                          </span>
                        </div>
                        {contacto?.correo && (
                          <a
                            href={`mailto:${contacto.correo}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[11px] hover:bg-blue-700 transition shrink-0"
                            title="Redactar correo"
                          >
                            <span>Escribir</span>
                          </a>
                        )}
                      </div>

                      {contacto?.notas && (
                        <div className="sm:col-span-2 pt-2 border-t border-stone-200 text-stone-600">
                          <span className="font-black text-stone-500">Observaciones: </span>
                          <span className="italic">{contacto.notas}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {perfilActivo.materiasBase.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-amber-900 mr-1">
                      Componentes Oficiales:
                    </span>
                    {perfilActivo.materiasBase.map((m) => {
                      const estilo = obtenerEstiloComponente(m);
                      return (
                        <span
                          key={m}
                          className={`px-3 py-1 rounded-xl font-black text-xs border ${estilo.bg} ${estilo.text} border-current/20 shadow-xs`}
                        >
                          ⭐ {m}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Métricas Principales (Tarjetas Grandes con alturas idénticas y alineación perfecta) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-stretch">
                <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 text-left flex flex-col justify-between min-h-[130px]">
                  <span className="text-[11px] font-black uppercase text-matrix-header leading-tight block h-7">
                    Participación Total
                  </span>
                  <div>
                    <p className="text-3xl font-black text-matrix-header leading-none">
                      {perfilActivo.participacionTotal}
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold mt-1.5 truncate">
                      {perfilActivo.totalDiasUnicos} fechas distintas
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 text-left flex flex-col justify-between min-h-[130px]">
                  <span className="text-[11px] font-black uppercase text-[#5C23A3] leading-tight block h-7">
                    Clases en Aula
                  </span>
                  <div>
                    <p className="text-3xl font-black text-[#5C23A3] leading-none">
                      {perfilActivo.clasesDictadas}
                      <span className="text-base text-stone-400 font-bold"> / {perfilActivo.clasesProgramadas}</span>
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold mt-1.5 truncate">
                      Dictadas / Planeadas
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-left flex flex-col justify-between min-h-[130px]">
                  <span className="text-[11px] font-black uppercase text-amber-900 leading-tight block h-7">
                    Encuentros Comunitarios
                  </span>
                  <div>
                    <p className="text-3xl font-black text-amber-900 leading-none">
                      {perfilActivo.encuentrosComunitarios}
                    </p>
                    <p className="text-[10px] text-amber-700 font-bold mt-1.5 truncate">
                      Formación + Salidas
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-left flex flex-col justify-between min-h-[130px]">
                  <span className="text-[11px] font-black uppercase text-[#B5253F] leading-tight block h-7">
                    Tareas Asignadas
                  </span>
                  <div>
                    <p className="text-3xl font-black text-[#B5253F] leading-none">
                      {perfilActivo.totalTareas}
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold mt-1.5 truncate">
                      {perfilActivo.tareasCompletadas} completadas
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-left col-span-2 sm:col-span-1 flex flex-col justify-between min-h-[130px]">
                  <span className="text-[11px] font-black uppercase text-topo-green leading-tight block h-7">
                    Compromiso Total
                  </span>
                  <div>
                    <p className="text-3xl font-black text-topo-green leading-none">
                      {perfilActivo.clasesProgramadas > 0
                        ? `${Math.round((perfilActivo.clasesDictadas / perfilActivo.clasesProgramadas) * 100)}%`
                        : perfilActivo.totalTareas > 0
                        ? `${Math.round((perfilActivo.tareasCompletadas / perfilActivo.totalTareas) * 100)}%`
                        : "100%"}
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold mt-1.5 truncate">
                      Cumplimiento global
                    </p>
                  </div>
                </div>
              </div>

              {/* Pestañas de Visualización Detallada */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVistaTabDetalle("todas")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        vistaTabDetalle === "todas"
                          ? "bg-topo-dark text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      Todo ({perfilActivo.clases.length + perfilActivo.tareas.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaTabDetalle("clases")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        vistaTabDetalle === "clases"
                          ? "bg-[#1368CE] text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      Clases y Jornadas ({perfilActivo.clases.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaTabDetalle("tareas")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        vistaTabDetalle === "tareas"
                          ? "bg-[#D83A56] text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      Tareas y Compromisos ({perfilActivo.tareas.length})
                    </button>
                  </div>
                </div>

                {/* Listado Desplegado de Asignaciones */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {/* SECCIÓN CLASES */}
                  {(vistaTabDetalle === "todas" || vistaTabDetalle === "clases") && (
                    <div className="space-y-2">
                      {perfilActivo.clases.map((c, i) => (
                        <div
                          key={`clase-${i}`}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                            c.estadoEjecucion === "dictada"
                              ? "bg-emerald-50/70 border-emerald-300 hover:bg-emerald-50"
                              : c.estadoEjecucion === "cancelada"
                              ? "bg-rose-50/70 border-rose-300 opacity-60"
                              : "bg-blue-50/70 border-blue-200 hover:bg-blue-50"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                c.estadoEjecucion === "dictada"
                                  ? "bg-emerald-600 text-white"
                                  : c.estadoEjecucion === "cancelada"
                                  ? "bg-rose-600 text-white"
                                  : "bg-[#1368CE] text-white"
                              }`}>
                                {c.estadoEjecucion === "dictada"
                                  ? "✅ DICTADA"
                                  : c.estadoEjecucion === "cancelada"
                                  ? "❌ CANCELADA"
                                  : "⏳ PROGRAMADA"}
                              </span>

                              <span className="text-xs font-black text-topo-dark">
                                {c.componente}
                              </span>

                              {c.tipoAsignacion === "por_materia" && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold" title="Proyectada por su asignación oficial a este componente">
                                  ⭐ Por Materia
                                </span>
                              )}

                              <span className="text-[11px] font-bold text-stone-500">
                                • {c.hora}
                              </span>
                            </div>

                            <p className="text-xs text-stone-800 font-semibold pl-1">
                              {c.temaDelDia}
                            </p>

                            {c.observaciones && (
                              <p className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded font-bold italic">
                                Nota: {c.observaciones}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-[#1368CE] block">
                              {c.fecha}
                            </span>
                            <span className="text-[10px] text-stone-500 font-bold">
                              {c.diaSemana}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SECCIÓN TAREAS */}
                  {(vistaTabDetalle === "todas" || vistaTabDetalle === "tareas") && (
                    <div className="space-y-2">
                      {perfilActivo.tareas.map((t, i) => (
                        <div
                          key={`tarea-${i}`}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                            t.completado
                              ? "bg-emerald-50/70 border-emerald-200 text-stone-700"
                              : "bg-rose-50/70 border-rose-200 text-stone-900"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  t.completado
                                    ? "bg-topo-green text-white"
                                    : "bg-[#D83A56] text-white"
                                }`}
                              >
                                {t.completado ? "✓ HECHO" : "📋 TAREA"}
                              </span>
                              <span className="text-xs font-black">
                                {t.evento}
                              </span>
                            </div>
                            {t.compromiso && (
                              <p className="text-xs text-stone-600 font-medium pl-1">
                                {t.compromiso}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black block">
                              {t.fecha}
                            </span>
                            <span className="text-[10px] text-stone-500 font-bold">
                              {t.diaSemana}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {perfilActivo.clases.length === 0 && perfilActivo.tareas.length === 0 && (
                    <div className="p-8 rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 text-center space-y-2">
                      <GraduationCap className="w-8 h-8 text-stone-400 mx-auto" />
                      <p className="text-xs font-black text-stone-600">
                        {perfilActivo.nombre} no tiene clases ni tareas asignadas todavía.
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Puedes asignarlo en el Juego de Tarjetas, en la sábana o en el cronograma de tareas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-[#E2DCCE] p-12 text-center">
              <User className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-500">
                Selecciona un tallerista para ver su perfil detallado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
