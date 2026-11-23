import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, nombre, rol, componentes } = body;

    if (!email || !nombre) {
      return NextResponse.json(
        { error: "El email y el nombre son obligatorios." },
        { status: 400 }
      );
    }

    const rolNormalizado = rol === "coordinador" ? "coordinador" : "tallerista";

    // 1. Enviar invitación con Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      {
        data: {
          nombre: nombre.trim(),
          rol: rolNormalizado,
        },
      }
    );

    if (inviteError) {
      console.error("Error invitando usuario vía Supabase Auth:", inviteError);
      return NextResponse.json(
        { error: inviteError.message || "Error al enviar la invitación." },
        { status: 500 }
      );
    }

    // 2. Guardar o actualizar en la tabla perfiles_talleristas en PostgreSQL
    const client = new Client({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:TopoCoordinacion2026@db.lwdrgduectungtsubhew.supabase.co:5432/postgres",
    });

    try {
      await client.connect();
      // Si ya existe el tallerista por nombre o email, actualizamos; sino insertamos
      const checkExist = await client.query(
        "SELECT id FROM perfiles_talleristas WHERE email = $1 OR nombre ILIKE $2",
        [email.trim(), nombre.trim()]
      );

      if (checkExist.rows.length > 0) {
        await client.query(
          `UPDATE perfiles_talleristas 
           SET email = $1, rol = $2, componentes = COALESCE($3, componentes), activo = true 
           WHERE id = $4`,
          [email.trim(), rolNormalizado, componentes || [], checkExist.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO perfiles_talleristas (nombre, email, rol, componentes, activo)
           VALUES ($1, $2, $3, $4, true)`,
          [nombre.trim(), email.trim(), rolNormalizado, componentes || []]
        );
      }
    } finally {
      await client.end();
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Invitación enviada con éxito a ${email}.`,
      user: inviteData.user,
    });
  } catch (error: any) {
    console.error("Error en /api/invitaciones:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
