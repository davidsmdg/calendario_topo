interface PlantillaEmailParams {
  nombre: string;
  rol: string;
  componentes: string[];
  enlaceActivacion: string;
}

export function generarHtmlInvitacion({
  nombre,
  rol,
  componentes,
  enlaceActivacion,
}: PlantillaEmailParams): string {
  const rolEtiqueta = rol === "coordinador" ? "Coordinación General 👑" : "Tallerista Pedagógicx 👤";
  const descripcionRol =
    rol === "coordinador"
      ? `
        <div style="margin-top:10px;padding:10px;background-color:#FEF3C7;border-left:4px solid #D97706;border-radius:8px;font-size:12px;color:#92400E;line-height:1.5;">
          <strong>Permisos de Coordinación:</strong>
          <ul style="margin:4px 0 0 0;padding-left:16px;">
            <li>Administrar y modificar el equipo de talleristas.</li>
            <li>Crear y gestionar ciclos pedagógicos y calendarios anuales.</li>
            <li>Matricular y actualizar el estado de los estudiantes (activos, retirados, espera).</li>
            <li>Configurar e integrar hojas de cálculo y copias de seguridad.</li>
          </ul>
        </div>
      `
      : `
        <div style="margin-top:10px;padding:10px;background-color:#EDE9FE;border-left:4px solid #7A3EBE;border-radius:8px;font-size:12px;color:#5B21B6;line-height:1.5;">
          <strong>Funciones de Tallerista:</strong>
          <ul style="margin:4px 0 0 0;padding-left:16px;">
            <li>Consultar tu cronograma personalizado de clases y jornadas.</li>
            <li>Registrar la asistencia sabatina de estudiantes clase por clase.</li>
            <li>Postularte como encargadx del día y diligenciar la bitácora de la sede.</li>
          </ul>
        </div>
      `;

  const listaComponentes =
    componentes && componentes.length > 0
      ? componentes.map((c) => `<span style="display:inline-block;background-color:#EBF5FF;color:#1E40AF;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;margin:2px 4px 2px 0;">${c}</span>`).join("")
      : `<span style="color:#6B7280;font-size:12px;font-style:italic;">Asignación general del colectivo</span>`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación Escuela Popular El Topo</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5F0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2B2623;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F7F5F0;padding:30px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Tarjeta Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background-color:#FFFFFF;border-radius:24px;border:3px solid #E2DCCE;box-shadow:0 10px 25px rgba(0,0,0,0.06);overflow:hidden;">
          
          <!-- Encabezado con Identidad y Flores Estilo Mural -->
          <tr>
            <td align="center" style="background-color:#FFF8EC;padding:32px 24px 24px 24px;border-bottom:2px dashed #E2DCCE;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center">
                    <img src="https://calendario-topo.vercel.app/logo-completo.png" alt="Escuela Popular El Topo" width="130" style="display:block;max-width:130px;height:auto;margin-bottom:12px;" />
                    <h1 style="margin:0;font-size:22px;font-weight:900;color:#2B2623;letter-spacing:-0.5px;">
                      Escuela Popular El Topo
                    </h1>
                    <p style="margin:4px 0 0 0;font-size:13px;font-weight:bold;color:#1B7A43;">
                      ★ Planificador Pedagógico Comunitario 2027 ★
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:900;color:#2B2623;">
                ¡Hola, ${nombre}! 👋
              </h2>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#4A4440;">
                Has sido invitadx a formar parte del equipo en la plataforma pedagógica de la <strong>Escuela Popular El Topo</strong>.
              </p>

              <!-- Tarjeta de Asignación y Rol -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FCFBF7;border:2px solid #EAE5D9;border-radius:16px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#8A8178;letter-spacing:0.5px;margin-bottom:4px;">
                      Rol en el Colectivo:
                    </div>
                    <div style="font-size:15px;font-weight:900;color:#7A3EBE;margin-bottom:12px;">
                      ${rolEtiqueta}
                    </div>

                    <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#8A8178;letter-spacing:0.5px;margin-bottom:6px;">
                      Componentes / Materias:
                    </div>
                    <div>
                      ${listaComponentes}
                    </div>

                    ${descripcionRol}
                  </td>
                </tr>
              </table>

              <!-- Instrucciones y Botón Principal -->
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#4A4440;">
                Para comenzar a consultar el calendario, planificar tus clases y postularte a la bitácora de la sede, haz clic en el siguiente botón para <strong>activar tu acceso y configurar tu contraseña</strong>:
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${enlaceActivacion}" target="_blank" style="display:inline-block;background-color:#7A3EBE;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:900;padding:14px 28px;border-radius:16px;box-shadow:0 4px 12px rgba(122,62,190,0.3);letter-spacing:0.2px;">
                      🚀 Activar mi cuenta y definir contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px;font-size:12px;color:#92400E;line-height:1.5;">
                <strong>Nota:</strong> Este enlace es personal de un solo uso. Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br />
                <a href="${enlaceActivacion}" style="color:#7A3EBE;word-break:break-all;font-size:11px;">${enlaceActivacion}</a>
              </div>
            </td>
          </tr>

          <!-- Pie de página institucional -->
          <tr>
            <td align="center" style="background-color:#F9F8F5;padding:20px;border-top:1px solid #EAE5D9;font-size:11px;color:#8A8178;line-height:1.5;">
              <p style="margin:0 0 4px 0;font-weight:bold;">
                Escuela Popular El Topo • Educación Popular y Comunitaria
              </p>
              <p style="margin:0;">
                Este mensaje fue enviado por el equipo de coordinación mediante el Planificador Pedagógico 2027.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
