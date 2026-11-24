import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { generarHtmlInvitacion } from "@/services/emailTemplate";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwdrgduectungtsubhew.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function getEmailTransporter() {
  const gmailUser = process.env.GMAIL_USER || "david930408.dd@gmail.com";
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailPassword) {
    throw new Error("GMAIL_APP_PASSWORD no está configurada en las variables de entorno.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
}

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

    const emailLimpio = email.trim().toLowerCase();
    const nombreLimpio = nombre.trim();
    const rolNormalizado = rol === "coordinador" ? "coordinador" : "tallerista";

    // 1. Determinar el dominio base de la aplicación
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://calendario-topo.vercel.app");

    // 2. Limpiar usuario previo en Supabase Auth si existiera para generar invitación limpia
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const usuarioExistente = users?.find((u) => u.email?.toLowerCase() === emailLimpio);
    if (usuarioExistente) {
      await supabaseAdmin.auth.admin.deleteUser(usuarioExistente.id);
    }

    // 3. Generar token y link seguro
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: emailLimpio,
      options: {
        data: {
          nombre: nombreLimpio,
          rol: rolNormalizado,
        },
      },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Error generando enlace de invitación:", linkError);
      return NextResponse.json(
        { error: linkError?.message || "No se pudo generar el enlace de invitación." },
        { status: 500 }
      );
    }

    const hashedToken = linkData.properties.hashed_token;
    // Enlace directo e inmutable que NO pasa por localhost ni por el site_url de Supabase:
    const enlaceActivacion = `${baseUrl}/activar-cuenta?token_hash=${hashedToken}&type=invite`;

    // 4. Enviar el correo hermoso con Gmail SMTP (sin restricciones de destinatarios)
    const transporter = getEmailTransporter();
    const remitente = process.env.EMAIL_FROM || `Escuela Popular El Topo <${process.env.GMAIL_USER || "david930408.dd@gmail.com"}>`;
    
    const htmlContenido = generarHtmlInvitacion({
      nombre: nombreLimpio,
      rol: rolNormalizado,
      componentes: componentes || [],
      enlaceActivacion,
    });

    const asunto =
      rolNormalizado === "coordinador"
        ? `👑 ¡Bienvenidx al equipo de Coordinación de El Topo, ${nombreLimpio}!`
        : `🌻 ¡Bienvenidx al equipo pedagógico de El Topo, ${nombreLimpio}!`;

    await transporter.sendMail({
      from: remitente,
      to: emailLimpio,
      subject: asunto,
      html: htmlContenido,
    });

    // 5. Guardar o actualizar en la tabla perfiles_talleristas
    const { data: existingProfiles } = await supabaseAdmin
      .from("perfiles_talleristas")
      .select("id")
      .or(`email.eq.${emailLimpio},nombre.ilike.${nombreLimpio}`)
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      await supabaseAdmin
        .from("perfiles_talleristas")
        .update({
          email: emailLimpio,
          rol: rolNormalizado,
          componentes: componentes || [],
          activo: true,
        })
        .eq("id", existingProfiles[0].id);
    } else {
      await supabaseAdmin
        .from("perfiles_talleristas")
        .insert({
          nombre: nombreLimpio,
          email: emailLimpio,
          rol: rolNormalizado,
          componentes: componentes || [],
          activo: true,
        });
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Invitación oficial enviada con éxito a ${emailLimpio}.`,
      enlaceActivacion,
    });
  } catch (error: any) {
    console.error("Error en /api/invitaciones:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
