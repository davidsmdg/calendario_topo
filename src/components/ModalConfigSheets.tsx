"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { StorageService } from "@/services/storageService";
import { EstadoCronogramaTopo } from "@/types";

interface ModalConfigSheetsProps {
  abierto: boolean;
  onCerrar: () => void;
  estadoActual: EstadoCronogramaTopo;
  onReemplazarEstado: (nuevoEstado: EstadoCronogramaTopo) => void;
  onRestaurarSemilla: () => void;
}

const SCRIPT_RESUMEN = `// Pega el archivo google-apps-script.js de la raíz del proyecto en:
// Google Sheets > Extensiones > Apps Script > Implementar > Nueva implementación (Aplicación web - Acceso: Cualquier persona)`;

export function ModalConfigSheets({
  abierto,
  onCerrar,
  estadoActual,
  onReemplazarEstado,
  onRestaurarSemilla,
}: ModalConfigSheetsProps) {
  const [url, setUrl] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estadoMsg, setEstadoMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (abierto) {
      setUrl(StorageService.obtenerUrlGoogleSheets());
      setEstadoMsg(null);
    }
  }, [abierto]);

  if (!abierto) return null;

  const guardarUrl = () => {
    StorageService.guardarUrlGoogleSheets(url);
    setEstadoMsg({
      ok: true,
      texto: url.trim()
        ? "URL guardada correctamente. Ahora puedes subir o descargar datos de Google Sheets."
        : "Modo 100% Local activado (URL eliminada).",
    });
  };

  const subirASheets = async () => {
    StorageService.guardarUrlGoogleSheets(url);
    setCargando(true);
    setEstadoMsg(null);
    const res = await StorageService.sincronizarHaciaGoogleSheets(estadoActual);
    setCargando(false);
    setEstadoMsg({ ok: res.ok, texto: res.mensaje });
  };

  const bajarDeSheets = async () => {
    StorageService.guardarUrlGoogleSheets(url);
    setCargando(true);
    setEstadoMsg(null);
    const res = await StorageService.descargarDesdeGoogleSheets();
    setCargando(false);
    setEstadoMsg({ ok: res.ok, texto: res.mensaje });
    if (res.ok && res.estado) {
      onReemplazarEstado(res.estado);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-card border border-stone-200 shadow-warm-lg overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 bg-matrix-header text-white">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-topo-mustard" />
            <h3 className="font-bold text-lg">
              Persistencia y Sincronización con Google Sheets
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-topo-dark max-h-[82vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-topo-green shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Respaldo Local Automático Activo</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Todos tus cambios se guardan al instante en este navegador (clave{" "}
                <code className="font-mono bg-emerald-100 px-1 rounded">
                  el_topo_cronograma_2027
                </code>
                ). Cuando quieras conectar Google Sheets, pega abajo la URL de tu Web App.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1.5">
              URL del Web App de Google Apps Script (Opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 rounded-xl border-stone-300 text-sm focus:border-matrix-header focus:ring-matrix-header"
              />
              <button
                type="button"
                onClick={guardarUrl}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs transition"
              >
                Guardar URL
              </button>
            </div>
          </div>

          {/* Botones de Sincronización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={cargando || !url.trim()}
              onClick={subirASheets}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-topo-mustard hover:bg-amber-500 disabled:opacity-40 text-topo-dark font-bold transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              {cargando ? "Sincronizando..." : "Enviar datos a Google Sheets"}
            </button>
            <button
              type="button"
              disabled={cargando || !url.trim()}
              onClick={bajarDeSheets}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-matrix-header hover:bg-matrix-sub disabled:opacity-40 text-white font-bold transition shadow-sm"
            >
              <DownloadCloud className="w-4 h-4" />
              {cargando ? "Cargando..." : "Traer datos desde Google Sheets"}
            </button>
          </div>

          {estadoMsg && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                estadoMsg.ok
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              {estadoMsg.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{estadoMsg.texto}</span>
            </div>
          )}

          {/* Instrucciones rápidas de Apps Script */}
          <div className="p-4 rounded-xl bg-sidebar border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-600">
                ¿Cómo conectar tu Google Sheet en 1 minuto?
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SCRIPT_RESUMEN);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-matrix-header hover:underline"
              >
                {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? "Copiado" : "Copiar recordatorio"}
              </button>
            </div>
            <ol className="list-decimal list-inside text-xs text-stone-700 space-y-1">
              <li>
                En la carpeta del proyecto encontrarás el archivo{" "}
                <code className="font-mono font-bold text-topo-terracotta">
                  google-apps-script.js
                </code>
                .
              </li>
              <li>
                En tu Google Sheet ve a <strong>Extensiones &gt; Apps Script</strong> y pega su
                contenido.
              </li>
              <li>
                Haz clic en <strong>Implementar &gt; Nueva implementación &gt; Aplicación web</strong>{" "}
                con acceso para <em>&ldquo;Cualquier persona&rdquo;</em> y pega aquí la URL.
              </li>
            </ol>
          </div>

          {/* Zona de restauración de datos semilla */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <div className="text-xs text-stone-500">
              ¿Deseas reiniciar a las 32 tareas oficiales 2027 y dejar las clases en cero?
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Reiniciar a las tareas oficiales de 2027 y dejar las clases desde cero?"
                  )
                ) {
                  onRestaurarSemilla();
                  onCerrar();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar 2027 Limpio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
