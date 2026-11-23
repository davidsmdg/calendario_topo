import { NextResponse } from "next/server";
import { Client } from "pg";

function getPgClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// GET: Cargar todos los calendarios, el activo, sus jornadas, hitos y talleristas
export async function GET() {
  const client = getPgClient();
  try {
    await client.connect();

    // 1. Calendarios
    const resCal = await client.query(
      "SELECT * FROM calendarios_ciclo ORDER BY ano DESC, id DESC"
    );

    // 2. Talleristas
    const resTal = await client.query(
      "SELECT id, nombre, apodo, email, rol, componentes, activo FROM perfiles_talleristas WHERE activo = true ORDER BY nombre ASC"
    );

    // Si no hay calendarios creados
    if (resCal.rows.length === 0) {
      return NextResponse.json({
        calendarios: [],
        calendarioActivo: null,
        jornadas: [],
        hitos: [],
        talleristas: resTal.rows.map((t) => t.nombre),
        directorioTalleristas: resTal.rows,
      });
    }

    // Identificar el calendario activo (o el primero que tenga estado 'activo')
    const calendarios = resCal.rows;
    let activo = calendarios.find((c) => c.estado === "activo") || null;

    let jornadas: any[] = [];
    let hitos: any[] = [];
    let estudiantes: any[] = [];

    if (activo) {
      // Cargar jornadas del activo
      const resJornadas = await client.query(
        `SELECT j.*, 
                json_agg(
                  json_build_object(
                    'id', b.id,
                    'hora', b.hora,
                    'componente', b.componente,
                    'temaDelDia', b.tema_del_dia,
                    'talleristas', b.talleristas
                  ) ORDER BY b.numero_bloque ASC
                ) as bloques
         FROM jornadas_sabatinas j
         LEFT JOIN bloques_clase b ON b.jornada_id = j.id
         WHERE j.calendario_id = $1
         GROUP BY j.id
         ORDER BY j.numero_jornada ASC`,
        [activo.id]
      );

      jornadas = resJornadas.rows.map((row) => ({
        id: row.id,
        numeroJornada: row.numero_jornada,
        fechaISO: row.fecha ? row.fecha.toISOString().split("T")[0] : "",
        fecha: row.fecha ? row.fecha.toISOString().split("T")[0] : "",
        diaSemana: row.dia_semana || "Sábado",
        caracter: row.caracter || "clases",
        tipoJornada: row.tipo_jornada || "clases",
        descripcionUnificada: row.descripcion_unificada || undefined,
        encargadxDelDia: row.encargadx_nombre || "",
        horasJornada: row.horas_jornada || "8:00 AM - 3:00 PM",
        bloques: (row.bloques || []).filter((b: any) => b.id !== null),
        bitacora: row.bitacora_json || {},
        comentarios: row.comentarios || "",
      }));

      // Cargar hitos del activo
      const resHitos = await client.query(
        "SELECT * FROM hitos_fechas_clave WHERE calendario_id = $1 ORDER BY fecha ASC",
        [activo.id]
      );
      hitos = resHitos.rows.map((h) => ({
        id: h.id,
        fecha: h.fecha ? h.fecha.toISOString().split("T")[0] : "",
        diaSemana: "",
        evento: h.titulo,
        compromiso: h.descripcion || "",
        personasEncargadas: "",
        completado: false,
        tipo: h.tipo,
      }));

      // Cargar estudiantes del activo
      const resEst = await client.query(
        "SELECT * FROM estudiantes_topo WHERE calendario_id = $1 ORDER BY num ASC, nombres ASC",
        [activo.id]
      );
      estudiantes = resEst.rows.map((e) => ({
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
      talleristas: resTal.rows.map((t) => t.nombre),
      directorioTalleristas: resTal.rows,
    });
  } catch (error: any) {
    console.error("Error en GET /api/calendarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}

// POST: Crear nuevo calendario o cambiar estado (activar / finalizar)
export async function POST(req: Request) {
  const client = getPgClient();
  try {
    const body = await req.json();
    const { action } = body;

    await client.connect();

    if (action === "crear_calendario") {
      const { nuevoCal, jornadas, hitos } = body;

      // 1. Desactivar otros calendarios si este se crea como activo
      if (nuevoCal.estado === "activo") {
        await client.query("UPDATE calendarios_ciclo SET estado = 'finalizado' WHERE estado = 'activo'");
      }

      // 2. Insertar en calendarios_ciclo
      const calId = nuevoCal.id || `cal-${nuevoCal.codigo || Date.now()}`;
      await client.query(
        `INSERT INTO calendarios_ciclo (id, codigo, nombre, ano, estado, fecha_inicio, fecha_fin, descripcion, estructura_config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           estado = EXCLUDED.estado,
           fecha_inicio = EXCLUDED.fecha_inicio,
           fecha_fin = EXCLUDED.fecha_fin,
           descripcion = EXCLUDED.descripcion,
           estructura_config = EXCLUDED.estructura_config`,
        [
          calId,
          nuevoCal.codigo || String(nuevoCal.ano || 2027),
          nuevoCal.nombre,
          nuevoCal.ano || 2027,
          nuevoCal.estado || "activo",
          nuevoCal.fechaInicio || null,
          nuevoCal.fechaFin || null,
          nuevoCal.descripcion || "",
          JSON.stringify(nuevoCal.estructuraCalendario || {}),
        ]
      );

      // 3. Insertar Jornadas Sabatinas y sus bloques
      if (Array.isArray(jornadas) && jornadas.length > 0) {
        // Limpiar previas de este calendario
        await client.query("DELETE FROM jornadas_sabatinas WHERE calendario_id = $1", [calId]);

        for (const j of jornadas) {
          const jId = j.id || `j-${Date.now()}-${Math.random()}`;
          await client.query(
            `INSERT INTO jornadas_sabatinas (id, calendario_id, numero_jornada, fecha, fecha_texto, tipo_jornada, caracter, descripcion_unificada, encargadx, bitacora, comentarios)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              jId,
              calId,
              parseInt(String(j.numeroJornada), 10) || null,
              j.fechaISO || null,
              j.fecha || "",
              j.tipoJornada || "clases",
              j.caracter || "clases",
              j.descripcionUnificada || null,
              j.encargadxDelDia || "",
              JSON.stringify(j.bitacora || {}),
              j.comentarios || "",
            ]
          );

          if (Array.isArray(j.bloques)) {
            for (let bIdx = 0; bIdx < j.bloques.length; bIdx++) {
              const b = j.bloques[bIdx];
              await client.query(
                `INSERT INTO bloques_clase (id, jornada_id, orden, hora, componente, tema, talleristas)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  b.id || `${jId}-b${bIdx + 1}`,
                  jId,
                  bIdx + 1,
                  b.hora || "",
                  b.componente || "",
                  b.temaDelDia || "",
                  b.talleristas || "",
                ]
              );
            }
          }
        }
      }

      // 4. Insertar Hitos
      if (Array.isArray(hitos) && hitos.length > 0) {
        await client.query("DELETE FROM hitos_fechas_clave WHERE calendario_id = $1", [calId]);
        for (const h of hitos) {
          await client.query(
            `INSERT INTO hitos_fechas_clave (id, calendario_id, tipo, titulo, fecha, descripcion)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              h.id || `h-${Date.now()}-${Math.random()}`,
              calId,
              h.tipo || "hito",
              h.evento || h.titulo || "Hito",
              h.fecha || null,
              h.compromiso || h.descripcion || "",
            ]
          );
        }
      }

      return NextResponse.json({ ok: true, mensaje: "Calendario creado y guardado en Supabase.", calId });
    }

    if (action === "cambiar_estado_calendario") {
      const { calId, nuevoEstado } = body; // 'activo' | 'finalizado' | 'archivado'
      if (nuevoEstado === "activo") {
        // Desactivar cualquier otro
        await client.query("UPDATE calendarios_ciclo SET estado = 'finalizado' WHERE estado = 'activo'");
      }
      await client.query("UPDATE calendarios_ciclo SET estado = $1 WHERE id = $2", [nuevoEstado, calId]);
      return NextResponse.json({ ok: true, mensaje: `Estado cambiado a ${nuevoEstado}.` });
    }

    if (action === "guardar_jornadas_lote") {
      // Para guardar actualizaciones a las jornadas en curso
      const { calId, jornadas } = body;
      for (const j of jornadas) {
        await client.query(
          `UPDATE jornadas_sabatinas 
           SET encargadx_nombre = $1, bitacora_json = $2, comentarios = $3, tipo_jornada = $4, caracter = $5, descripcion_unificada = $6
           WHERE id = $7`,
          [
            j.encargadxDelDia || "",
            JSON.stringify(j.bitacora || {}),
            j.comentarios || "",
            j.tipoJornada || "clases",
            j.caracter || "clases",
            j.descripcionUnificada || null,
            j.id,
          ]
        );

        if (Array.isArray(j.bloques)) {
          for (const b of j.bloques) {
            await client.query(
              `UPDATE bloques_clase
               SET componente = $1, tema_del_dia = $2, talleristas = $3
               WHERE id = $4`,
              [b.componente || "", b.temaDelDia || "", b.talleristas || "", b.id]
            );
          }
        }
      }
      return NextResponse.json({ ok: true, mensaje: "Jornadas actualizadas en base de datos." });
    }

    if (action === "actualizar_encargadx") {
      const { jornadaId, encargadxNombre } = body;
      await client.query(
        `UPDATE jornadas_sabatinas SET encargadx_nombre = $1 WHERE id = $2`,
        [encargadxNombre || "", jornadaId]
      );
      return NextResponse.json({ ok: true, mensaje: "Encargadx actualizado con éxito." });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    console.error("Error en POST /api/calendarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
