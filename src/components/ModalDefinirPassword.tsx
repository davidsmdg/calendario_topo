"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { KeyRound, Shield, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { TopoAvatar } from "./TopoAvatar";

interface ModalDefinirPasswordProps {
  esInvitacionInicial?: boolean;
  onCompletado: () => void;
}

export function ModalDefinirPassword({
  esInvitacionInicial = true,
  onCompletado,
}: ModalDefinirPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setCargando(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) throw updateErr;

      onCompletado();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl border-3 border-[#D5CBB8] shadow-2xl p-6 sm:p-8 space-y-6 relative">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center p-2 shadow-xs">
            <TopoAvatar size="md" variant="personaje" />
          </div>
          <div>
            <h2 className="text-xl font-black text-topo-dark">
              {esInvitacionInicial ? "¡Bienvenidx a El Topo!" : "Actualizar Contraseña"}
            </h2>
            <p className="text-xs font-bold text-stone-500 mt-1">
              {esInvitacionInicial
                ? "Configura tu contraseña personal para acceder en tus próximas sesiones."
                : "Ingresa tu nueva contraseña para actualizar tu acceso."}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#7A3EBE] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider mb-1.5">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Escribe de nuevo tu contraseña"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#7A3EBE] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 px-4 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-sm shadow-md transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <span>Guardando contraseña...</span>
            ) : (
              <>
                <span>Guardar y Entrar al Planificador</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[11px] text-stone-500 font-bold flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Tus credenciales están protegidas con cifrado de alta seguridad.
          </p>
        </div>
      </div>
    </div>
  );
}
