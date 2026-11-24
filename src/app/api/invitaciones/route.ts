import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

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

    // Determinar la URL de redirección según el entorno
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://calendario-topo.vercel.app");

    // 1. Enviar invitación con Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      {
        redirectTo: siteUrl,
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

    // 2. Guardar o actualizar en la tabla perfiles_talleristas vía Supabase Client (sin depender de pg directo)
    const { data: existingProfiles, error: searchError } = await supabaseAdmin
      .from("perfiles_talleristas")
      .select("id")
      .or(`email.eq.${email.trim()},nombre.ilike.${nombre.trim()}`)
      .limit(1);

    if (searchError) {
      console.warn("Aviso al consultar perfiles_talleristas:", searchError);
    }

    if (existingProfiles && existingProfiles.length > 0) {
      await supabaseAdmin
        .from("perfiles_talleristas")
        .update({
          email: email.trim(),
          rol: rolNormalizado,
          componentes: componentes || [],
          activo: true,
        })
        .eq("id", existingProfiles[0].id);
    } else {
      await supabaseAdmin
        .from("perfiles_talleristas")
        .insert({
          nombre: nombre.trim(),
          email: email.trim(),
          rol: rolNormalizado,
          componentes: componentes || [],
          activo: true,
        });
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
