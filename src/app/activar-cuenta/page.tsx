"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { KeyRound, Shield, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { TopoAvatar, SolMuralSVG, FlorMuralSVG, AbejitaMuralSVG } from "@/components/TopoAvatar";

export default function ActivarCuentaPage() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [errorVerificacion, setErrorVerificacion] = useState<string | null>(null);
  const [usuarioEmail, setUsuarioEmail] = useState<string>("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    async function procesarToken() {
      try {
        if (typeof window === "undefined") return;

        // 1. Buscar en query params: ?token_hash=... o ?code=...
        const urlParams = new URLSearchParams(window.location.search);
        const tokenHash = urlParams.get("token_hash");
        const type = (urlParams.get("type") as any) || "invite";

        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type === "recovery" ? "recovery" : "invite",
          });

          if (error) {
            throw error;
          }

          if (data?.user?.email) {
            setUsuarioEmail(data.user.email);
          }
          setVerificando(false);
          return;
        }

        // 2. Si ya viene con sesión activa o hash fragment (#access_token=...)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUsuarioEmail(session.user.email || "");
          setVerificando(false);
          return;
        }

        // Si no hay token ni sesión
        setErrorVerificacion(
          "El enlace de invitación no es válido o ya ha expirado. Por favor solicita una nueva invitación a coordinación."
        );
        setVerificando(false);
      } catch (err: any) {
        console.error("Error al procesar token:", err);
        setErrorVerificacion(
          err.message || "Ocurrió un error al verificar tu enlace de invitación."
        );
        setVerificando(false);
      }
    }

    procesarToken();
  }, []);

  const handleGuardarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGuardado(null);

    if (password.length < 6) {
      setErrorGuardado("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorGuardado("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setGuardando(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) throw updateErr;

      setExito(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setErrorGuardado(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Decoración mural comunitario */}
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
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center p-2 shadow-xs">
            <TopoAvatar size="lg" variant="personaje" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-topo-dark tracking-tight">
              Escuela Popular El Topo
            </h1>
            <p className="text-xs font-bold text-stone-500 mt-0.5">
              Activación de Cuenta y Configuración de Contraseña
            </p>
          </div>
        </div>

        {verificando && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#7A3EBE] animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-600">
              Validando tu enlace de invitación seguro...
            </p>
          </div>
        )}

        {!verificando && errorVerificacion && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorVerificacion}</div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs transition"
            >
              Ir a la pantalla de inicio
            </button>
          </div>
        )}

        {!verificando && !errorVerificacion && !exito && (
          <form onSubmit={handleGuardarPassword} className="space-y-4 animate-fadeIn">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 font-medium">
              ¡Hola! Tu correo <strong>{usuarioEmail}</strong> ha sido verificado con éxito. Define tu contraseña para acceder al planificador.
            </div>

            {errorGuardado && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorGuardado}</span>
              </div>
            )}

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
                  placeholder="Repite tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-stone-300 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#7A3EBE] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 px-4 rounded-2xl bg-[#7A3EBE] hover:bg-[#5C23A3] text-white font-black text-sm shadow-md transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {guardando ? (
                <span>Guardando contraseña...</span>
              ) : (
                <>
                  <span>Guardar y Entrar al Planificador</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {exito && (
          <div className="p-6 text-center space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-emerald-950">
              ¡Contraseña guardada con éxito!
            </h3>
            <p className="text-xs text-stone-600 font-bold">
              Redirigiendo a tu espacio pedagógico...
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-stone-200 text-center">
          <p className="text-[11px] text-stone-500 font-bold flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Tus datos y claves cuentan con protección cifrada comunitaria
          </p>
        </div>
      </div>
    </div>
  );
}
