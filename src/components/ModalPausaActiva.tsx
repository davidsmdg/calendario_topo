"use client";

import React from "react";
import { Coffee, Clock, Sparkles, RefreshCw } from "lucide-react";
import { TopoAvatar, SolMuralSVG, FlorMuralSVG, AbejitaMuralSVG } from "./TopoAvatar";

interface ModalPausaActivaProps {
  abierto: boolean;
  sugerencia: string;
  onPosponer: () => void;
  onReiniciar: () => void;
  onOtraSugerencia: () => void;
}

export function ModalPausaActiva({
  abierto,
  sugerencia,
  onPosponer,
  onReiniciar,
  onOtraSugerencia,
}: ModalPausaActivaProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FCFBF7] border-2 border-topo-mustard shadow-warm-lg p-6 text-topo-dark overflow-hidden">
        {/* Decoración superior de mural */}
        <SolMuralSVG className="w-16 h-16 absolute -top-2 -right-2 opacity-90" />
        <AbejitaMuralSVG className="w-7 h-7 absolute top-5 left-5" />

        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative mb-3">
            <TopoAvatar size="lg" variant="completo" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 mb-2">
            <Coffee className="w-3.5 h-3.5 text-topo-terracotta" />
            Cuidado Colectivo • Pausa Activa
          </span>

          <h3 className="text-xl font-black text-topo-dark leading-snug">
            ¡Hola compa! Llevas 30 minutos organizando el cronograma.
          </h3>
          <p className="text-sm text-stone-600 mt-1">
            ¿Qué tal si nos regalamos una pausa activa?
          </p>

          {/* Caja de sugerencia rotativa */}
          <div className="w-full mt-5 p-4 rounded-2xl bg-white border-2 border-dashed border-amber-300 relative text-left shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-topo-terracotta shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-stone-800 leading-relaxed">
                  “{sugerencia}”
                </p>
              </div>
              <button
                type="button"
                onClick={onOtraSugerencia}
                title="Ver otra sugerencia"
                className="p-1.5 rounded-lg text-stone-500 hover:text-topo-dark hover:bg-amber-100 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <button
              type="button"
              onClick={onPosponer}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-sm transition"
            >
              <Clock className="w-4 h-4 text-stone-500" />
              Recordar en 5 min
            </button>
            <button
              type="button"
              onClick={onReiniciar}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-topo-mustard hover:bg-amber-500 text-topo-dark font-extrabold text-sm shadow-sm transition"
            >
              ¡Listo, con toda!
            </button>
          </div>

          {/* Flores del mural abajo */}
          <div className="flex items-end justify-center gap-3 mt-4 opacity-85">
            <FlorMuralSVG className="w-7 h-7" />
            <FlorMuralSVG className="w-6 h-6" />
            <FlorMuralSVG className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
}
