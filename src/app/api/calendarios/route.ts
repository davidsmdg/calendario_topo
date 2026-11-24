import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://lwdrgduectungtsubhew.supabase.co";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// GET: Cargar todos los calendarios, el activo, sus jornadas, hitos y talleristas
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Calendarios
    const { data: resCal, error: errCal } = await supabase
      .from("calendarios_ciclo")
      .select("*")
      .order("ano", { ascending: false });

    if (errCal) throw errCal;

    // 2. Talleristas
    const { data: resTal, error: errTal } = await supabase
      .from("perfiles_talleristas")
      .select("id, nombre, apodo, email, rol, componentes, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (errTal) throw errTal;

    const calendarios = resCal || [];
    const talleristas = resTal || [];

    if (calendarios.length === 0) {
      return NextResponse.json({
        calendarios: [],
        calendarioActivo: null,
        jornadas: [],
        hitos: [],
        talleristas: talleristas.map((t) => t.nombre),
        directorioTalleristas: talleristas,
      });
    }

    let activo = calendarios.find((c) => c.estado === "activo") || null;

    let jornadas: any[] = [];
    let hitos: any[] = [];
    let estudiantes: any[] = [];

    if (activo) {
      // Cargar jornadas del activo con sus bloques
      const { data: rawJornadas, error: errJornadas } = await supabase
        .from("jornadas_sabatinas")
        .select("*, bloques_clase(*)")
        .eq("calendario_id", activo.id)
        .order("numero_jornada", { ascending: true });

      if (errJornadas) throw errJornadas;

      jornadas = (rawJornadas || []).map((row: any) => {
        const sortedBloques = (row.bloques_clase || [])
          .sort((a: any, b: any) => (a.numero_bloque || 0) - (b.numero_bloque || 0))
          .map((b: any) => ({
            id: b.id,
            hora: b.hora || "",
            componente: b.componente || "",
            temaDelDia: b.tema_del_dia || "",
            talleristas: b.talleristas || "",
          }));

        return {
          id: row.id,
          numeroJornada: row.numero_jornada,
          fechaISO: row.fecha || "",
          fecha: row.fecha || "",
          diaSemana: row.dia_semana || "Sábado",
          caracter: row.caracter || "clases",
          tipoJornada: row.tipo_jornada || "clases",
          descripcionUnificada: row.descripcion_unificada || undefined,
          encargadxDelDia: row.encargadx_nombre || "",
          horasJornada: row.horas_jornada || "8:00 AM - 3:00 PM",
          bloques: sortedBloques,
          bitacora: row.bitacora_json || {},
          comentarios: row.comentarios || "",
        };
      });

      // Cargar hitos del activo
      const { data: rawHitos, error: errHitos } = await supabase
        .from("hitos_fechas_clave")
        .select("*")
        .eq("calendario_id", activo.id)
        .order("fecha", { ascending: true });

      if (errHitos) throw errHitos;

      hitos = (rawHitos || []).map((h: any) => ({
        id: h.id,
        fecha: h.fecha || "",
        diaSemana: "",
        evento: h.titulo,
        compromiso: h.descripcion || "",
        personasEncargadas: "",
        completado: false,
        tipo: h.tipo,
      }));

      // Cargar estudiantes del activo
      const { data: rawEst, error: errEst } = await supabase
        .from("estudiantes_topo")
        .select("*")
        .eq("calendario_id", activo.id)
        .order("num", { ascending: true });

      if (errEst) throw errEst;

      estudiantes = (rawEst || []).map((e: any) => ({
        id: e.id,
        nombre: `${e.nombres || ""} ${e.apellidos || ""}`.trim(),
        estado: e.estado || "activo",
        asistenciasPorJornada: e.asistencias_por_jornada || {},
      }));
    }

    return NextResponse.json({
      calendarios,
      calendarioActivo: activo,
      jornadas,
      hitos,
      estudiantes,
      talleristas: talleristas.map((t) => t.nombre),
      directorioTalleristas: talleristas,
    });
  } catch (error: any) {
    console.error("Error en GET /api/calendarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo calendario o cambiar estado (activar / finalizar)
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { action } = body;

    if (action === "crear_calendario") {
      const { nuevoCal, jornadas, hitos } = body;

      // 1. Desactivar otros calendarios si este se crea como activo
      if (nuevoCal.estado === "activo") {
        await supabase
          .from("calendarios_ciclo")
          .update({ estado: "finalizado" })
          .eq("estado", "activo");
      }

      // 2. Insertar en calendarios_ciclo
      const calId = nuevoCal.id || `cal-${nuevoCal.codigo || Date.now()}`;
      const { error: errUpsertCal } = await supabase
        .from("calendarios_ciclo")
        .upsert({
          id: calId,
          codigo: nuevoCal.codigo || String(nuevoCal.ano || 2027),
          nombre: nuevoCal.nombre,
          ano: nuevoCal.ano || 2027,
          estado: nuevoCal.estado || "activo",
          fecha_inicio: nuevoCal.fechaInicio || null,
          fecha_fin: nuevoCal.fechaFin || null,
          descripcion: nuevoCal.descripcion || "",
          configuracion_json: nuevoCal.estructuraCalendario || {},
        });

      if (errUpsertCal) throw errUpsertCal;

      // 3. Insertar Jornadas Sabatinas y sus bloques
      if (Array.isArray(jornadas) && jornadas.length > 0) {
        // Limpiar previas de este calendario
        await supabase
          .from("jornadas_sabatinas")
          .delete()
          .eq("calendario_id", calId);

        const rowsJornadas = [];
        const rowsBloques = [];

        for (const j of jornadas) {
          const jId = j.id || `j-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          rowsJornadas.push({
            id: jId,
            calendario_id: calId,
            numero_jornada: parseInt(String(j.numeroJornada), 10) || null,
            fecha: j.fechaISO || (j.fecha ? j.fecha.split("T")[0] : null),
            dia_semana: j.diaSemana || "Sábado",
            tipo_jornada: j.tipoJornada || "clases",
            caracter: j.caracter || "clases",
            descripcion_unificada: j.descripcionUnificada || null,
            encargadx_nombre: j.encargadxDelDia || "",
            horas_jornada: j.horasJornada || "8:00 AM - 3:00 PM",
            bitacora_json: j.bitacora || {},
            comentarios: j.comentarios || "",
          });

          if (Array.isArray(j.bloques)) {
            for (let bIdx = 0; bIdx < j.bloques.length; bIdx++) {
              const b = j.bloques[bIdx];
              rowsBloques.push({
                id: b.id || `${jId}-b${bIdx + 1}`,
                jornada_id: jId,
                numero_bloque: bIdx + 1,
                hora: b.hora || "",
                componente: b.componente || "",
                tema_del_dia: b.temaDelDia || "",
                talleristas: b.talleristas || "",
              });
            }
          }
        }

        const { error: errJ } = await supabase
          .from("jornadas_sabatinas")
          .insert(rowsJornadas);
        if (errJ) throw errJ;

        if (rowsBloques.length > 0) {
          const { error: errB } = await supabase
            .from("bloques_clase")
            .insert(rowsBloques);
          if (errB) throw errB;
        }
      }

      // 4. Insertar Hitos
      if (Array.isArray(hitos) && hitos.length > 0) {
        await supabase
          .from("hitos_fechas_clave")
          .delete()
          .eq("calendario_id", calId);

        const rowsHitos = hitos.map((h: any) => ({
          id: h.id || `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          calendario_id: calId,
          tipo: h.tipo || "hito",
          titulo: h.evento || h.titulo || "Hito",
          fecha: h.fecha ? h.fecha.split("T")[0] : null,
          descripcion: h.compromiso || h.descripcion || "",
        }));

        const { error: errH } = await supabase
          .from("hitos_fechas_clave")
          .insert(rowsHitos);
        if (errH) throw errH;
      }

      return NextResponse.json({
        ok: true,
        mensaje: "Calendario creado y guardado en Supabase.",
        calId,
      });
    }

    if (action === "cambiar_estado_calendario") {
      const { calId, nuevoEstado } = body; // 'activo' | 'finalizado' | 'archivado'
      if (nuevoEstado === "activo") {
        await supabase
          .from("calendarios_ciclo")
          .update({ estado: "finalizado" })
          .eq("estado", "activo");
      }
      const { error: errEstado } = await supabase
        .from("calendarios_ciclo")
        .update({ estado: nuevoEstado })
        .eq("id", calId);
      if (errEstado) throw errEstado;

      return NextResponse.json({
        ok: true,
        mensaje: `Estado cambiado a ${nuevoEstado}.`,
      });
    }

    if (action === "guardar_jornadas_lote") {
      const { jornadas } = body;
      for (const j of jornadas) {
        await supabase
          .from("jornadas_sabatinas")
          .update({
            encargadx_nombre: j.encargadxDelDia || "",
            bitacora_json: j.bitacora || {},
            comentarios: j.comentarios || "",
            tipo_jornada: j.tipoJornada || "clases",
            caracter: j.caracter || "clases",
            descripcion_unificada: j.descripcionUnificada || null,
          })
          .eq("id", j.id);

        if (Array.isArray(j.bloques)) {
          for (const b of j.bloques) {
            await supabase
              .from("bloques_clase")
              .update({
                componente: b.componente || "",
                tema_del_dia: b.temaDelDia || "",
                talleristas: b.talleristas || "",
              })
              .eq("id", b.id);
          }
        }
      }
      return NextResponse.json({
        ok: true,
        mensaje: "Jornadas actualizadas en base de datos.",
      });
    }

    if (action === "actualizar_encargadx") {
      const { jornadaId, encargadxNombre } = body;
      const { error: errEnc } = await supabase
        .from("jornadas_sabatinas")
        .update({ encargadx_nombre: encargadxNombre || "" })
        .eq("id", jornadaId);
      if (errEnc) throw errEnc;

      return NextResponse.json({
        ok: true,
        mensaje: "Encargadx actualizado con éxito.",
      });
    }

    return NextResponse.json(
      { error: "Acción no reconocida." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error en POST /api/calendarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
