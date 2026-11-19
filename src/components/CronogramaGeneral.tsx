"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  GripVertical,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Circle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Users,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { EventoCronograma } from "@/types";
import { exportarHitosTodo2027Excel, importarArchivoCronograma } from "@/services/excelExporter";
import { ddmmyyyyToISO, obtenerNombreDiaSemana, isoToDDMMYYYY } from "@/utils/festivosColombia";
import { TopoAvatar } from "./TopoAvatar";

interface CronogramaGeneralProps {
  hitos: EventoCronograma[];
  talleristas: string[];
  onReordenarHitos: (nuevosHitos: EventoCronograma[]) => void;
  onActualizarHito: (hito: EventoCronograma) => void;
  onCrearHito: (parcial?: Partial<EventoCronograma>) => void;
  onDuplicarHito: (id: string) => void;
  onEliminarHito: (id: string) => void;
}

function FilaHitoSortable({
  hito,
  modoDetalle,
  onActualizar,
  onDuplicar,
  onEliminar,
}: {
  hito: EventoCronograma;
  modoDetalle: "con_tareas" | "sin_tareas";
  onActualizar: (h: EventoCronograma) => void;
  onDuplicar: (id: string) => void;
  onEliminar: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: hito.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const diaCalculado = hito.diaSemana || obtenerNombreDiaSemana(hito.fecha) || "Por definir";
  const esSabado = diaCalculado === "Sábado";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group border-b border-stone-200/80 transition ${
        isDragging
          ? "bg-amber-100/90 shadow-lg z-20 relative"
          : hito.completado
          ? "bg-emerald-50/40"
          : "bg-white hover:bg-amber-50/30"
      }`}
    >
      {/* Drag Handle + Estado */}
      <td className="px-2.5 py-2.5 w-16 text-center align-top">
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 rounded text-stone-400 hover:text-topo-dark cursor-grab active:cursor-grabbing"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onActualizar({ ...hito, completado: !hito.completado })}
            className="text-stone-400 hover:text-topo-green transition"
            title={hito.completado ? "Marcar como pendiente" : "Marcar como completado"}
          >
            {hito.completado ? (
              <CheckCircle2 className="w-4 h-4 text-topo-green" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>

      {/* Columna 1: Fecha */}
      <td className="px-3 py-2 w-36 align-top">
        <input
          type="text"
          value={hito.fecha || ""}
          onChange={(e) => {
            const nuevaFecha = e.target.value;
            onActualizar({
              ...hito,
              fecha: nuevaFecha,
              diaSemana: obtenerNombreDiaSemana(nuevaFecha),
            });
          }}
          placeholder="DD/MM/2027"
          className="w-full rounded-lg border-transparent hover:border-stone-300 focus:border-matrix-header focus:bg-white bg-stone-50 px-2.5 py-1.5 text-xs font-extrabold text-topo-dark transition"
        />
      </td>

      {/* Columna 2: Día de la Semana */}
      <td className="px-3 py-2.5 w-32 align-top text-center">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
            esSabado
              ? "bg-blue-100 text-matrix-header"
              : "bg-amber-100 text-amber-950"
          }`}
        >
          {diaCalculado}
        </span>
      </td>

      {/* Columna 3: Evento */}
      <td className="px-3 py-2 align-top min-w-[220px]">
        <textarea
          rows={Math.max(1, Math.ceil((hito.evento?.length || 1) / 48))}
          value={hito.evento || ""}
          onChange={(e) => onActualizar({ ...hito, evento: e.target.value })}
          placeholder="Nombre del hito o evento..."
          className={`w-full rounded-lg border-transparent hover:border-stone-300 focus:border-matrix-header focus:bg-white bg-transparent px-2.5 py-1.5 text-xs font-bold transition resize-y ${
            hito.completado ? "line-through text-stone-500" : "text-topo-dark"
          }`}
        />
      </td>

      {/* Columnas 4 y 5 en modo 'con_tareas' */}
      {modoDetalle === "con_tareas" && (
        <>
          <td className="px-3 py-2 align-top min-w-[280px]">
            <textarea
              rows={Math.max(2, (hito.compromiso || "").split("\n").length)}
              value={hito.compromiso || ""}
              onChange={(e) => onActualizar({ ...hito, compromiso: e.target.value })}
              placeholder="Compromisos o tareas (por llenar o editar)..."
              className="w-full rounded-lg border-transparent hover:border-stone-300 focus:border-matrix-header focus:bg-white bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 leading-relaxed transition resize-y"
            />
          </td>

          <td className="px-3 py-2 w-52 align-top">
            <input
              type="text"
              value={hito.personasEncargadas || ""}
              onChange={(e) =>
                onActualizar({ ...hito, personasEncargadas: e.target.value })
              }
              placeholder="Por llenar..."
              className="w-full rounded-lg border-transparent hover:border-stone-300 focus:border-matrix-header focus:bg-white bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-topo-green placeholder:text-stone-400 placeholder:font-normal transition"
            />
          </td>
        </>
      )}

      {/* Acciones */}
      <td className="px-3 py-2 w-24 text-right align-top">
        <div className="inline-flex items-center gap-1 pt-1 opacity-70 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={() => onDuplicar(hito.id)}
            title="Duplicar evento"
            className="p-1.5 rounded-lg text-stone-500 hover:text-matrix-header hover:bg-blue-50 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar el evento "${hito.evento || "sin título"}"?`
                )
              ) {
                onEliminar(hito.id);
              }
            }}
            title="Eliminar evento"
            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TarjetaHitoSortable({
  hito,
  modoDetalle,
  onActualizar,
  onDuplicar,
  onEliminar,
}: {
  hito: EventoCronograma;
  modoDetalle: "con_tareas" | "sin_tareas";
  onActualizar: (h: EventoCronograma) => void;
  onDuplicar: (id: string) => void;
  onEliminar: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: hito.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const diaCalculado = hito.diaSemana || obtenerNombreDiaSemana(hito.fecha) || "Por definir";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border p-4 flex flex-col justify-between transition shadow-warm ${
        isDragging
          ? "bg-amber-50 border-topo-mustard shadow-warm-lg z-20 scale-[1.02]"
          : hito.completado
          ? "bg-emerald-50/40 border-emerald-300/80"
          : "bg-white border-[#E2DCCE] hover:border-topo-mustard"
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="p-1 rounded text-stone-400 hover:text-topo-dark cursor-grab active:cursor-grabbing"
              title="Arrastrar tarjeta"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="relative flex items-center flex-1">
              <Calendar className="w-3.5 h-3.5 text-topo-terracotta absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={hito.fecha || ""}
                onChange={(e) =>
                  onActualizar({
                    ...hito,
                    fecha: e.target.value,
                    diaSemana: obtenerNombreDiaSemana(e.target.value),
                  })
                }
                placeholder="DD/MM/2027"
                className="w-full pl-7 pr-2 py-1 rounded-lg bg-amber-100/70 border-transparent focus:border-topo-mustard focus:bg-white text-xs font-extrabold text-amber-950"
              />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-matrix-header text-[10px] font-black uppercase">
              {diaCalculado}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onActualizar({ ...hito, completado: !hito.completado })}
              className="p-1 rounded-lg text-stone-400 hover:text-topo-green"
            >
              {hito.completado ? (
                <CheckCircle2 className="w-4 h-4 text-topo-green" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDuplicar(hito.id)}
              className="p-1 rounded-lg text-stone-400 hover:text-matrix-header"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Eliminar "${hito.evento || "este evento"}"?`)) {
                  onEliminar(hito.id);
                }
              }}
              className="p-1 rounded-lg text-stone-400 hover:text-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          value={hito.evento || ""}
          onChange={(e) => onActualizar({ ...hito, evento: e.target.value })}
          placeholder="Título del evento..."
          className={`w-full rounded-xl border-transparent hover:border-stone-200 focus:border-matrix-header bg-transparent px-2 py-1 text-sm font-extrabold leading-snug resize-none ${
            hito.completado ? "line-through text-stone-500" : "text-topo-dark"
          }`}
        />

        {modoDetalle === "con_tareas" && (
          <>
            <textarea
              rows={3}
              value={hito.compromiso || ""}
              onChange={(e) => onActualizar({ ...hito, compromiso: e.target.value })}
              placeholder="Compromisos, tareas o acuerdos..."
              className="w-full rounded-xl border-stone-200/70 focus:border-matrix-header bg-[#F6F2E9]/60 px-2.5 py-2 text-xs text-stone-700 leading-relaxed resize-y"
            />

            <div className="flex items-center gap-2 pt-1">
              <Users className="w-3.5 h-3.5 text-topo-green shrink-0" />
              <input
                type="text"
                value={hito.personasEncargadas || ""}
                onChange={(e) =>
                  onActualizar({ ...hito, personasEncargadas: e.target.value })
                }
                placeholder="Personas encargadas (por llenar)..."
                className="w-full rounded-lg border-transparent hover:border-stone-200 focus:border-topo-green bg-stone-50 px-2 py-1 text-xs font-semibold text-topo-green placeholder:text-stone-400"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CronogramaGeneral({
  hitos,
  onReordenarHitos,
  onActualizarHito,
  onCrearHito,
  onDuplicarHito,
  onEliminarHito,
}: CronogramaGeneralProps) {
  const [vista, setVista] = useState<"tabla" | "tarjetas">("tabla");
  const [modoDetalle, setModoDetalle] = useState<"con_tareas" | "sin_tareas">("con_tareas");
  const [busqueda, setBusqueda] = useState("");
  const [nuevaFechaPicker, setNuevaFechaPicker] = useState("");
  const [mensajeImportacion, setMensajeImportacion] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const hitosFiltrados = useMemo(() => {
    return hitos.filter((h) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const dia = (h.diaSemana || obtenerNombreDiaSemana(h.fecha) || "").toLowerCase();
      return (
        (h.fecha || "").toLowerCase().includes(q) ||
        dia.includes(q) ||
        (h.evento || "").toLowerCase().includes(q) ||
        (h.compromiso || "").toLowerCase().includes(q) ||
        (h.personasEncargadas || "").toLowerCase().includes(q)
      );
    });
  }, [hitos, busqueda]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = hitos.findIndex((item) => item.id === active.id);
      const newIndex = hitos.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReordenarHitos(arrayMove(hitos, oldIndex, newIndex));
      }
    }
  };

  const ordenarCronologicamente = () => {
    const ordenados = [...hitos].sort((a, b) => {
      const isoA = ddmmyyyyToISO(a.fecha) || "9999-99-99";
      const isoB = ddmmyyyyToISO(b.fecha) || "9999-99-99";
      return isoA.localeCompare(isoB);
    });
    onReordenarHitos(ordenados);
  };

  const manejarSubidaArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importarArchivoCronograma(file);
      if (res.hitos && res.hitos.length > 0) {
        onReordenarHitos(res.hitos);
        setMensajeImportacion(res.mensaje);
        setTimeout(() => setMensajeImportacion(null), 5000);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al importar archivo");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-3xl border-2 border-[#E2DCCE] shadow-warm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-topo-dark">
              Cronograma General de Tareas 2027 ({hitosFiltrados.length})
            </h2>
            <p className="text-xs text-stone-600">
              Ordenado cronológicamente con el <strong>día de la semana</strong> de cada fecha •
              Puedes agregar cualquier día (sábado o entre semana).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de fecha para agregar cualquier día e insertarlo en orden cronológico */}
            <div className="flex items-center gap-1.5 bg-[#F6F2E9] px-2.5 py-1.5 rounded-2xl border border-[#E2DCCE]">
              <input
                type="date"
                value={nuevaFechaPicker}
                onChange={(e) => setNuevaFechaPicker(e.target.value)}
                className="rounded-xl border-stone-300 text-xs py-1 px-2 bg-white font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  const fechaDDMM = nuevaFechaPicker
                    ? isoToDDMMYYYY(nuevaFechaPicker)
                    : "";
                  onCrearHito({
                    fecha: fechaDDMM,
                    diaSemana: obtenerNombreDiaSemana(fechaDDMM),
                    evento: "",
                    compromiso: "",
                    personasEncargadas: "",
                  });
                  setNuevaFechaPicker("");
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-black text-xs shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />+ Agregar Fecha / Tarea
              </button>
            </div>

            <button
              type="button"
              onClick={ordenarCronologicamente}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 border-[#D5CBB8] bg-white hover:bg-[#F6F2E9] text-topo-dark font-bold text-xs transition"
              title="Ordenar todas las filas cronológicamente por fecha"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-topo-terracotta" />
              Ordenar Fechas
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={manejarSubidaArchivo}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition"
              title="Importar CSV o Excel de tareas"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar
            </button>
          </div>
        </div>

        {mensajeImportacion && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
            ✅ {mensajeImportacion}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por fecha, día (ej. sábado, viernes), evento o tarea..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border-stone-300 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1 border border-[#E2DCCE]">
              <button
                type="button"
                onClick={() => setModoDetalle("con_tareas")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  modoDetalle === "con_tareas"
                    ? "bg-topo-green text-white shadow-sm"
                    : "text-stone-600 hover:text-topo-dark"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Con Tareas
              </button>
              <button
                type="button"
                onClick={() => setModoDetalle("sin_tareas")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  modoDetalle === "sin_tareas"
                    ? "bg-topo-green text-white shadow-sm"
                    : "text-stone-600 hover:text-topo-dark"
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                Sin Tareas
              </button>
            </div>

            <div className="inline-flex rounded-2xl bg-[#F6F2E9] p-1 border border-[#E2DCCE]">
              <button
                type="button"
                onClick={() => setVista("tabla")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  vista === "tabla"
                    ? "bg-matrix-header text-white shadow-sm"
                    : "text-stone-600 hover:text-topo-dark"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Tabla
              </button>
              <button
                type="button"
                onClick={() => setVista("tarjetas")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  vista === "tarjetas"
                    ? "bg-matrix-header text-white shadow-sm"
                    : "text-stone-600 hover:text-topo-dark"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Tarjetas
              </button>
            </div>
          </div>
        </div>
      </div>

      {hitosFiltrados.length === 0 ? (
        <div className="rounded-3xl bg-white border-2 border-[#E2DCCE] p-10 text-center flex flex-col items-center justify-center shadow-warm">
          <TopoAvatar size="lg" variant="completo" />
          <h3 className="mt-3 text-base font-black text-topo-dark">
            No encontramos tareas con ese filtro
          </h3>
          <button
            type="button"
            onClick={() => setBusqueda("")}
            className="mt-4 px-4 py-2 rounded-xl bg-topo-mustard text-topo-dark font-bold text-xs"
          >
            Mostrar todas las tareas
          </button>
        </div>
      ) : vista === "tabla" ? (
        <div className="rounded-3xl bg-white border-2 border-[#E2DCCE] shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-matrix-header text-white text-xs uppercase tracking-wider">
                    <th className="py-3 px-2.5 w-16 text-center font-bold">Orden</th>
                    <th className="py-3 px-3 w-36 font-bold">Fecha</th>
                    <th className="py-3 px-3 w-32 text-center font-bold">Día de la semana</th>
                    <th className="py-3 px-3 font-bold">Evento / Hito</th>
                    {modoDetalle === "con_tareas" && (
                      <>
                        <th className="py-3 px-3 font-bold">Compromiso / Tareas</th>
                        <th className="py-3 px-3 w-52 font-bold">Personas encargadas</th>
                      </>
                    )}
                    <th className="py-3 px-3 w-24 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <SortableContext
                  items={hitosFiltrados.map((h) => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {hitosFiltrados.map((hito) => (
                      <FilaHitoSortable
                        key={hito.id}
                        hito={hito}
                        modoDetalle={modoDetalle}
                        onActualizar={onActualizarHito}
                        onDuplicar={onDuplicarHito}
                        onEliminar={onEliminarHito}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={hitosFiltrados.map((h) => h.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {hitosFiltrados.map((hito) => (
                <TarjetaHitoSortable
                  key={hito.id}
                  hito={hito}
                  modoDetalle={modoDetalle}
                  onActualizar={onActualizarHito}
                  onDuplicar={onDuplicarHito}
                  onEliminar={onEliminarHito}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
