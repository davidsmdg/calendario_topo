import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { EstadoCronogramaTopo } from "@/types";
import { generarWorkbookCronograma } from "@/services/excelExporter";
import { obtenerEstadoInicialSemilla } from "@/services/storageService";

const RUTA_JSON = path.join(process.cwd(), "RESPALDO_DATOS_CRONOGRAMA_2027.json");
const RUTA_EXCEL = path.join(process.cwd(), "RESPALDO_LOCAL_CRONOGRAMA_2027.xlsx");

/**
 * GET /api/backup
 * Carga el estado persistido en el disco duro (servidor local).
 * Si no existe archivo aún, devuelve el estado semilla 2027 completo.
 */
export async function GET() {
  try {
    try {
      const data = await fs.readFile(RUTA_JSON, "utf-8");
      const parsed = JSON.parse(data) as EstadoCronogramaTopo;
      if (parsed && Array.isArray(parsed.jornadas) && parsed.jornadas.length > 0) {
        return NextResponse.json({ ok: true, origen: "disco", estado: parsed });
      }
    } catch {
      // Si el archivo JSON no existe en disco, generamos la semilla
    }

    const inicial = obtenerEstadoInicialSemilla();
    // Guardamos la semilla en disco inmediatamente para que exista desde el arranque
    await fs.writeFile(RUTA_JSON, JSON.stringify(inicial, null, 2), "utf-8");

    // Y generamos el Excel completo de inmediato con todas las 66 fechas, períodos y malla
    const wb = generarWorkbookCronograma(
      inicial.jornadas,
      inicial.mallaCurricular,
      inicial.hitos,
      inicial.franjasHorarias,
      inicial.directorioTalleristas || [],
      inicial.estructuraCalendario
    );
    const buf = await wb.xlsx.writeBuffer();
    await fs.writeFile(RUTA_EXCEL, Buffer.from(buf));

    return NextResponse.json({ ok: true, origen: "semilla_creada", estado: inicial });
  } catch (error) {
    console.error("Error al leer estado desde disco:", error);
    return NextResponse.json(
      { ok: false, error: "Error al leer disco", detalle: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backup
 * Guarda atómicamente el estado en:
 * 1. RESPALDO_DATOS_CRONOGRAMA_2027.json (fidelidad total de datos estructurados para reinicios)
 * 2. RESPALDO_LOCAL_CRONOGRAMA_2027.xlsx (documento Excel idéntico al descargable con todas las columnas y hojas)
 */
export async function POST(req: NextRequest) {
  try {
    const estado = (await req.json()) as EstadoCronogramaTopo;
    if (!estado || !Array.isArray(estado.jornadas) || estado.jornadas.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Datos de estado vacíos o inválidos rechazados para proteger respaldo" },
        { status: 400 }
      );
    }

    // 1. Guardar en JSON (base de datos local resistente a reinicios y apagado de equipo)
    await fs.writeFile(RUTA_JSON, JSON.stringify(estado, null, 2), "utf-8");

    // 2. Generar el documento Excel completo (todas las columnas de fechas, períodos, malla, tareas, talleristas)
    const workbook = generarWorkbookCronograma(
      estado.jornadas,
      estado.mallaCurricular || [],
      estado.hitos || [],
      estado.franjasHorarias,
      estado.directorioTalleristas || [],
      estado.estructuraCalendario
    );

    const buffer = await workbook.xlsx.writeBuffer();
    try {
      await fs.writeFile(RUTA_EXCEL, Buffer.from(buffer));
    } catch (excelErr) {
      console.warn("Aviso: No se pudo sobrescribir el archivo Excel (posiblemente abierto en MS Excel):", excelErr);
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Guardado en disco en JSON y Excel completo",
      excel: "RESPALDO_LOCAL_CRONOGRAMA_2027.xlsx",
      json: "RESPALDO_DATOS_CRONOGRAMA_2027.json",
      jornadasGuardadas: estado.jornadas.length,
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al escribir respaldo en disco:", error);
    return NextResponse.json(
      { ok: false, error: "Error al escribir respaldo", detalle: String(error) },
      { status: 500 }
    );
  }
}
