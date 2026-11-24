"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TopoAvatar, SolMuralSVG, AbejitaMuralSVG, FlorMuralSVG } from "./TopoAvatar";
import { Mail, KeyRound, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Shield, Lock } from "lucide-react";

interface LoginModalProps {
  onLoginExitoso: (user: any) => void;
}

export function PantallaLogin({ onLoginExitoso }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState<"login" | "recuperar">("login");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    const emailLimpio = email.trim().toLowerCase();
    if (!emailLimpio || !emailLimpio.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setCargando(true);

    try {
      if (modo === "recuperar") {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailLimpio, {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        });
        if (resetErr) throw resetErr;
        setMensajeExito(
          `¡Enlace de recuperación enviado a ${emailLimpio}! Revisa tu bandeja de entrada o spam para restablecer tu contraseña.`
        );
      } else {
        if (!password) {
          setError("Por favor ingresa tu contraseña.");
          setCargando(false);
          return;
        }

        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: emailLimpio,
          password: password,
        });

        if (authErr) {
          if (authErr.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error(
              "Credenciales incorrectas. Si recibiste un correo de invitación, ábrelo primero para activar tu cuenta y configurar tu contraseña."
            );
          }
          throw authErr;
        }

        if (data?.user) {
          onLoginExitoso(data.user);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decoración comunitaria de fondo estilo mural */}
      <div className="absolute top-6 left-8 opacity-40 pointer-events-none hidden md:block">
        <SolMuralSVG className="w-24 h-24 text-amber-400" />
      </div>
      <div className="absolute bottom-8 right-8 opacity-40 pointer-events-none hidden md:block">
        <FlorMuralSVG className="w-28 h-28 text-rose-400" />
      </div>
      <div className="absolute top-1/4 right-12 opacity-30 pointer-events-none hidden lg:block">
        <AbejitaMuralSVG className="w-16 h-16" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border-3 border-[#D5CBB8] shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        {/* Cabecera institucional */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center p-2 shadow-sm">
            <TopoAvatar size="lg" variant="personaje" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-topo-dark tracking-tight">
              Escuela Popular El Topo
            </h1>
            <p className="text-xs font-bold text-stone-500 mt-0.5">
              Planificador Pedagógico Comunitario • Acceso por Invitación
            </p>
          </div>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Mensaje de Éxito */}
        {mensajeExito && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{mensajeExito}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo registrado"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#7A3EBE] focus:bg-white transition"
              />
            </div>
          </div>

          {modo === "login" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase text-stone-700 tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMensajeExito(null);
                    setModo("recuperar");
                  }}
                  className="text-[11px] font-black text-[#7A3EBE] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña personal"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#7A3EBE] focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {modo === "recuperar" && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
              Te enviaremos un <strong>enlace de restablecimiento</strong> a tu correo para que definas una nueva contraseña.
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMensajeExito(null);
                    setModo("login");
                  }}
                  className="text-[11px] font-black text-[#7A3EBE] hover:underline"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 px-4 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-sm shadow-md transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <span>Procesando...</span>
            ) : modo === "recuperar" ? (
              <>
                <span>Enviar Enlace de Recuperación</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-stone-200 text-center space-y-1">
          <p className="text-[11px] text-stone-500 font-bold flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Acceso exclusivo por invitación del equipo de coordinación
          </p>
          <p className="text-[10px] text-stone-600">
            ¿Aún no tienes cuenta? Solicita tu invitación a coordinación para activar tu usuario.
          </p>
        </div>
      </div>
    </div>
  );
}
