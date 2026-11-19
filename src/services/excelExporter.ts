import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  EventoCronograma,
  JornadaPedagogica,
  MallaComponente,
  InfoContactoTallerista,
  EstructuraCalendarioConfig,
} from "@/types";
import {
  obtenerEstiloComponente,
  obtenerNombreDiaSemana,
  ddmmyyyyToISO,
  ESTILOS_BLOQUES_PERIODO,
  ESTILOS_EXAMENES_CLAVE,
} from "@/utils/festivosColombia";

const BORDES_FINOS: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF475569" } },
  left: { style: "thin", color: { argb: "FF475569" } },
  bottom: { style: "thin", color: { argb: "FF475569" } },
  right: { style: "thin", color: { argb: "FF475569" } },
};

/**
 * Construye la hoja principal "Cronograma_Jornadas_2027" con:
 * 1. Tabla superior de COMPONENTE vs SESIÓN 1 a SESIÓN 11 (llena y editable desde la plataforma).
 * 2. Matriz horizontal cronológica con todos los sábados de 2027 y las fechas específicas con tareas,
 *    incluyendo la fila "DÍA DE LA SEMANA", las 4 franjas horarias por llenar y la fila "COMENTARIOS"
 *    con las reuniones/simulacros/tareas de ese día.
 */
function construirHojaMatrizJornadas(
  workbook: ExcelJS.Workbook,
  jornadasSinOrdenar: JornadaPedagogica[],
  malla: MallaComponente[],
  franjasHorariasPersonalizadas?: string[],
  estructura?: EstructuraCalendarioConfig
) {
  // Asegurar orden cronológico en el Excel
  const jornadas = [...jornadasSinOrdenar].sort((a, b) => {
    const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
    const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
    return isoA.localeCompare(isoB);
  });

  // Determinar cuántos bloques de clase tiene la estructura (máximo entre las jornadas o franjas definidas)
  const maxBloquesJornadas = Math.max(
    ...jornadas.map((j) => (j.tipoJornada === "clases" ? j.bloques.length : 0)),
    franjasHorariasPersonalizadas?.length || 4,
    4
  );

  const sheet = workbook.addWorksheet("Cronograma_Jornadas_2027", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 0 }],
  });

  const totalCols = Math.max(jornadas.length + 1, 13);
  const columns: Partial<ExcelJS.Column>[] = [{ key: "col0", width: 26 }];
  for (let i = 1; i < totalCols; i++) {
    columns.push({ key: `col${i}`, width: 30 });
  }
  sheet.columns = columns;

  // =========================================================================
  // PARTE 1: MALLA DE COMPONENTES Y SESIONES (1 a 11)
  // =========================================================================
  const headerMallaRow = sheet.getRow(1);
  headerMallaRow.getCell(1).value = "COMPONENTE";
  for (let s = 1; s <= 11; s++) {
    headerMallaRow.getCell(s + 1).value = `SESIÓN ${s}`;
  }
  headerMallaRow.height = 24;
  for (let c = 1; c <= 12; c++) {
    const cell = headerMallaRow.getCell(c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1B365D" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = BORDES_FINOS;
  }

  malla.forEach((item, idx) => {
    const rowIdx = idx + 2;
    const row = sheet.getRow(rowIdx);
    row.height = 34;
    const estiloComp = obtenerEstiloComponente(item.componente);

    const cellComp = row.getCell(1);
    cellComp.value = item.componente;
    cellComp.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${estiloComp.excelHex}` },
    };
    cellComp.font = { bold: true, color: { argb: "FF1E293B" }, size: 10, name: "Calibri" };
    cellComp.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cellComp.border = BORDES_FINOS;

    for (let s = 0; s < 11; s++) {
      const cellSesion = row.getCell(s + 2);
      cellSesion.value = item.sesiones[s] || "";
      cellSesion.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cellSesion.font = { size: 9, name: "Calibri", color: { argb: "FF334155" } };
      cellSesion.border = BORDES_FINOS;
    }
  });

  // =========================================================================
  // PARTE 2: MATRIZ HORIZONTAL CRONOLÓGICA DE JORNADAS 2027
  // =========================================================================
  const filaInicioJornadas = malla.length + 4;

  // 5 filas de cabecera: PERÍODO / CICLO, JORNADA, FECHA, DÍA DE LA SEMANA, ENCARGADX DEL DÍA
  const etiquetasCabecera = [
    { offset: 0, label: "PERÍODO / CICLO", bg: "FF0F172A", text: "FFFEF08A", bold: true, height: 24 },
    { offset: 1, label: "JORNADA", bg: "FF1B365D", text: "FFFFFFFF", bold: true, height: 24 },
    { offset: 2, label: "FECHA", bg: "FF2A4D7D", text: "FFFFFFFF", bold: true, height: 22 },
    { offset: 3, label: "DÍA DE LA SEMANA", bg: "FFD9E2EC", text: "FF1B365D", bold: true, height: 20 },
    { offset: 4, label: "ENCARGADX DEL DÍA", bg: "FFEAF0F6", text: "FF1B365D", bold: true, height: 22 },
  ];

  etiquetasCabecera.forEach((cfg) => {
    const r = sheet.getRow(filaInicioJornadas + cfg.offset);
    r.height = cfg.height;
    const cLabel = r.getCell(1);
    cLabel.value = cfg.label;
    cLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cfg.bg } };
    cLabel.font = { bold: cfg.bold, color: { argb: cfg.text }, size: 9.5, name: "Calibri" };
    cLabel.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cLabel.border = BORDES_FINOS;
  });

  // Bloques de clase x 4 filas cada uno (HORAS, COMPONENTE, TEMA DEL DIA, TALLERISTA)
  const inicioBloquesRow = filaInicioJornadas + 5;
  for (let b = 0; b < maxBloquesJornadas; b++) {
    const baseRow = inicioBloquesRow + b * 4;
    const subRows = [
      { off: 0, label: "HORAS", bg: "FFEAF0F6", fg: "FF1B365D", bold: true, h: 20 },
      { off: 1, label: "COMPONENTE", bg: "FF1B365D", fg: "FFFFFFFF", bold: true, h: 24 },
      { off: 2, label: "TEMA DEL DIA", bg: "FFF8FAFC", fg: "FF1E293B", bold: true, h: 42 },
      { off: 3, label: "TALLERISTA", bg: "FFF1F5F9", fg: "FF334155", bold: true, h: 24 },
    ];
    subRows.forEach((sr) => {
      const r = sheet.getRow(baseRow + sr.off);
      r.height = sr.h;
      const cell = r.getCell(1);
      cell.value = sr.label;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sr.bg } };
      cell.font = { bold: sr.bold, color: { argb: sr.fg }, size: 9.5, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = BORDES_FINOS;
    });
  }

  // Fila de COMENTARIOS al pie (para reuniones, simulacros y acuerdos de ese día)
  const filaComentarios = inicioBloquesRow + maxBloquesJornadas * 4;
  const rowCom = sheet.getRow(filaComentarios);
  rowCom.height = 55;
  const cellComLabel = rowCom.getCell(1);
  cellComLabel.value = "COMENTARIOS";
  cellComLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
  cellComLabel.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
  cellComLabel.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cellComLabel.border = BORDES_FINOS;

  // Poblar cada Jornada en su columna (colIdx = idx + 2)
  jornadas.forEach((jornada, idx) => {
    const colIdx = idx + 2;
    const diaCalculado =
      jornada.diaSemana ||
      obtenerNombreDiaSemana(jornada.fechaISO || jornada.fecha) ||
      "Sábado";
    const isoCol = jornada.fechaISO || ddmmyyyyToISO(jornada.fecha);

    // Identificar Bloque de Período y Examen Clave
    const periodo = estructura?.periodosTemporales.find(
      (p) => isoCol && isoCol >= p.fechaInicio && isoCol <= p.fechaFin
    );
    const examen = estructura?.fechasClaveExamenes.find((e) => {
      const eIso = ddmmyyyyToISO(e.fecha);
      return eIso === isoCol;
    });
    const estiloPeriodo = periodo ? ESTILOS_BLOQUES_PERIODO[periodo.tipo] : null;

    // 0. Fila PERÍODO / CARÁCTER
    const cPeriodo = sheet.getRow(filaInicioJornadas).getCell(colIdx);
    const caracterEfectivo =
      jornada.caracter ||
      (examen ? "examen" : periodo ? (periodo.tipo as any) : jornada.tipoJornada === "unificada" ? "coordinacion" : "clases");

    if (caracterEfectivo === "examen") {
      cPeriodo.value = `🎓 ${examen?.titulo.toUpperCase() || "EVALUACIÓN / EXAMEN"}`;
      cPeriodo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B21A8" } }; // Purple 800
      cPeriodo.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Calibri" };
    } else if (caracterEfectivo === "vacaciones") {
      cPeriodo.value = `🏖️ ${periodo?.nombre.toUpperCase() || "RECESO ESCOLAR / VACACIONES"}`;
      cPeriodo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; // Amber 100
      cPeriodo.font = { bold: true, color: { argb: "FF78350F" }, size: 9, name: "Calibri" };
    } else if (caracterEfectivo === "coordinacion") {
      cPeriodo.value = `👥 ${periodo?.nombre.toUpperCase() || "COORDINACIÓN / FORMACIÓN"}`;
      cPeriodo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } }; // Indigo 100
      cPeriodo.font = { bold: true, color: { argb: "FF312E81" }, size: 9, name: "Calibri" };
    } else {
      cPeriodo.value = "📚 CLASES REGULARES";
      cPeriodo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } }; // Emerald 100
      cPeriodo.font = { bold: true, color: { argb: "FF065F46" }, size: 9, name: "Calibri" };
    }
    cPeriodo.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cPeriodo.border = BORDES_FINOS;

    // 1. Número de Jornada
    const cJornada = sheet.getRow(filaInicioJornadas + 1).getCell(colIdx);
    cJornada.value = idx + 1;
    cJornada.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
    cJornada.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cJornada.alignment = { vertical: "middle", horizontal: "center" };
    cJornada.border = BORDES_FINOS;

    // 2. Fecha (con color violeta si es examen oficial)
    const cFecha = sheet.getRow(filaInicioJornadas + 2).getCell(colIdx);
    cFecha.value = jornada.fecha || "";
    if (examen) {
      cFecha.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7E22CE" } };
    } else {
      cFecha.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A4D7D" } };
    }
    cFecha.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9.5, name: "Calibri" };
    cFecha.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cFecha.border = BORDES_FINOS;

    // 3. Día de la Semana
    const cDia = sheet.getRow(filaInicioJornadas + 3).getCell(colIdx);
    cDia.value = diaCalculado.toUpperCase();
    cDia.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: diaCalculado === "Sábado" ? "FFD9E2EC" : "FFFDE68A" },
    };
    cDia.font = { bold: true, color: { argb: "FF1B365D" }, size: 9, name: "Calibri" };
    cDia.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cDia.border = BORDES_FINOS;

    // 4. Encargadx del día
    const cEnc = sheet.getRow(filaInicioJornadas + 4).getCell(colIdx);
    cEnc.value = jornada.encargadxDelDia || "";
    cEnc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF0F6" } };
    cEnc.font = { bold: true, color: { argb: "FF1B365D" }, size: 9.5, name: "Calibri" };
    cEnc.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cEnc.border = BORDES_FINOS;

    if (jornada.tipoJornada === "unificada") {
      // Fila de horas general en el primer slot de HORAS
      const cHoraUnif = sheet.getRow(inicioBloquesRow).getCell(colIdx);
      cHoraUnif.value = jornada.horasJornada || "8:00 AM - 3:00 PM";
      cHoraUnif.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF0F6" } };
      cHoraUnif.font = { bold: true, color: { argb: "FF1B365D" }, size: 9.5, name: "Calibri" };
      cHoraUnif.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cHoraUnif.border = BORDES_FINOS;

      // Combinar las filas restantes del cuerpo de la jornada
      const filaIniMerge = inicioBloquesRow + 1;
      const filaFinMerge = inicioBloquesRow + maxBloquesJornadas * 4 - 1;
      sheet.mergeCells(filaIniMerge, colIdx, filaFinMerge, colIdx);

      const cUnif = sheet.getRow(filaIniMerge).getCell(colIdx);
      cUnif.value = jornada.descripcionUnificada || "JORNADA ESPECIAL UNIFICADA";
      cUnif.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
      cUnif.font = { bold: true, color: { argb: "FF2D2A26" }, size: 10.5, name: "Calibri" };
      cUnif.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      for (let r = filaIniMerge; r <= filaFinMerge; r++) {
        sheet.getRow(r).getCell(colIdx).border = BORDES_FINOS;
      }
    } else {
      // Bloques normales de clase (con horas listas y campos por llenar o llenados)
      for (let b = 0; b < maxBloquesJornadas; b++) {
        const bloque = jornada.bloques[b];
        const horaDefecto = franjasHorariasPersonalizadas?.[b] || "";
        const baseRow = inicioBloquesRow + b * 4;
        const estilo = obtenerEstiloComponente(bloque?.componente);

        // HORAS
        const cHora = sheet.getRow(baseRow).getCell(colIdx);
        cHora.value = bloque?.hora || horaDefecto;
        cHora.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF0F6" } };
        cHora.font = { bold: true, color: { argb: "FF1B365D" }, size: 9, name: "Calibri" };
        cHora.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cHora.border = BORDES_FINOS;

        // COMPONENTE
        const cComp = sheet.getRow(baseRow + 1).getCell(colIdx);
        cComp.value = bloque?.componente || "";
        cComp.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bloque?.componente ? `FF${estilo.excelHex}` : "FFFFFFFF" },
        };
        cComp.font = { bold: true, color: { argb: "FF1E293B" }, size: 9.5, name: "Calibri" };
        cComp.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cComp.border = BORDES_FINOS;

        // TEMA DEL DIA
        const cTema = sheet.getRow(baseRow + 2).getCell(colIdx);
        cTema.value = bloque?.temaDelDia || "";
        cTema.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        cTema.font = { bold: false, color: { argb: "FF1E293B" }, size: 9.5, name: "Calibri" };
        cTema.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cTema.border = BORDES_FINOS;

        // TALLERISTA
        const cTall = sheet.getRow(baseRow + 3).getCell(colIdx);
        cTall.value = bloque?.talleristas || "";
        cTall.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        cTall.font = { italic: true, color: { argb: "FF475569" }, size: 9, name: "Calibri" };
        cTall.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cTall.border = BORDES_FINOS;
      }
    }

    // COMENTARIOS (aquí van las reuniones de coordinación, simulacros y notas del día)
    const textoComentario = jornada.comentarios || jornada.tareasDelDia || "";
    const cCom = sheet.getRow(filaComentarios).getCell(colIdx);
    cCom.value = textoComentario;
    cCom.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: textoComentario ? "FFFFFBEB" : "FFFFFFFF" },
    };
    cCom.font = {
      bold: Boolean(textoComentario),
      color: { argb: "FF9A3412" },
      size: 9,
      name: "Calibri",
    };
    cCom.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cCom.border = BORDES_FINOS;
  });
}

/**
 * Construye las hojas "con_tareas" y "sin_tareas" ordenadas cronológicamente y con columna Día
 */
function construirHojasHitos(workbook: ExcelJS.Workbook, hitosSinOrdenar: EventoCronograma[]) {
  const hitos = [...hitosSinOrdenar].sort((a, b) => {
    const isoA = ddmmyyyyToISO(a.fecha) || "9999-99-99";
    const isoB = ddmmyyyyToISO(b.fecha) || "9999-99-99";
    return isoA.localeCompare(isoB);
  });

  // 1. Hoja con_tareas
  const sheetCon = workbook.addWorksheet("con_tareas");
  sheetCon.columns = [
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Día", key: "dia", width: 14 },
    { header: "Evento", key: "evento", width: 48 },
    { header: "Compromiso", key: "compromiso", width: 65 },
    { header: "Personas encargadas", key: "encargadas", width: 32 },
  ];

  const headerCon = sheetCon.getRow(1);
  headerCon.height = 24;
  headerCon.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = BORDES_FINOS;
  });

  hitos.forEach((h, idx) => {
    const r = sheetCon.addRow({
      fecha: h.fecha || "",
      dia: h.diaSemana || obtenerNombreDiaSemana(h.fecha) || "",
      evento: h.evento || "",
      compromiso: h.compromiso || "",
      encargadas: h.personasEncargadas || "",
    });
    const numLineas = (h.compromiso || "").split("\n").length;
    r.height = Math.max(22, numLineas * 16);
    const bgPar = idx % 2 === 0 ? "FFFFFFFF" : "FFFAF8F5";
    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgPar } };
      cell.font = { size: 10, name: "Calibri", color: { argb: "FF2D2A26" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber <= 2 ? "center" : "left",
        wrapText: true,
      };
      cell.border = BORDES_FINOS;
    });
  });

  // 2. Hoja sin_tareas
  const sheetSin = workbook.addWorksheet("sin_tareas");
  sheetSin.columns = [
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Día", key: "dia", width: 14 },
    { header: "Evento", key: "evento", width: 65 },
  ];

  const headerSin = sheetSin.getRow(1);
  headerSin.height = 24;
  headerSin.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = BORDES_FINOS;
  });

  hitos.forEach((h, idx) => {
    const r = sheetSin.addRow({
      fecha: h.fecha || "",
      dia: h.diaSemana || obtenerNombreDiaSemana(h.fecha) || "",
      evento: h.evento || "",
    });
    r.height = 22;
    const bgPar = idx % 2 === 0 ? "FFFFFFFF" : "FFFAF8F5";
    r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgPar } };
      cell.font = { size: 10, name: "Calibri", color: { argb: "FF2D2A26" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber <= 2 ? "center" : "left",
        wrapText: true,
      };
      cell.border = BORDES_FINOS;
    });
  });
}

/**
 * Hoja 4: Directorio y Equipo de Talleristas con datos personales, materias y carga de trabajo
 */
function construirHojaDirectorioTalleristas(
  workbook: ExcelJS.Workbook,
  jornadas: JornadaPedagogica[],
  hitos: EventoCronograma[],
  malla: MallaComponente[],
  directorio: InfoContactoTallerista[] = []
) {
  const sheet = workbook.addWorksheet("Directorio_Talleristas", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  sheet.columns = [
    { key: "num", width: 8 },
    { key: "nombre", width: 28 },
    { key: "telefono", width: 18 },
    { key: "correo", width: 30 },
    { key: "componentes", width: 34 },
    { key: "diasAsignados", width: 16 },
    { key: "clasesProgramadas", width: 18 },
    { key: "clasesDictadas", width: 18 },
    { key: "encuentrosComunitarios", width: 22 },
    { key: "participacionTotal", width: 20 },
    { key: "tareasTotales", width: 16 },
    { key: "cumplimiento", width: 16 },
    { key: "notas", width: 32 },
  ];

  const headers = [
    "#",
    "NOMBRE COMPLETO",
    "TELÉFONO / WHATSAPP",
    "CORREO ELECTRÓNICO",
    "COMPONENTES / MATERIAS",
    "DÍAS EN ESCUELA",
    "CLASES PROGRAMADAS",
    "CLASES DICTADAS",
    "ENCUENTROS COMUNITARIOS",
    "PARTICIPACIÓN TOTAL",
    "TAREAS ASIGNADAS",
    "CUMPLIMIENTO %",
    "NOTAS Y OBSERVACIONES",
  ];

  const rHeader = sheet.getRow(1);
  rHeader.values = headers;
  rHeader.height = 28;
  rHeader.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = BORDES_FINOS;
  });

  // Mapa de componentes por tallerista desde la malla
  const compMap = new Map<string, Set<string>>();
  malla.forEach((m) => {
    (m.talleristasBase || []).forEach((t) => {
      const k = t.trim();
      if (!compMap.has(k)) compMap.set(k, new Set());
      compMap.get(k)!.add(m.componente);
    });
  });

  // Recopilar nombres únicos
  const setNombres = new Set<string>();
  directorio.forEach((d) => d.nombre && setNombres.add(d.nombre.trim()));
  compMap.forEach((_, t) => setNombres.add(t));
  jornadas.forEach((j) => {
    j.bloques.forEach((b) => {
      if (b.talleristas) {
        b.talleristas.split(/[,;/]+/).forEach((sub) => {
          const l = sub.trim();
          if (l.length > 2 && l.toLowerCase() !== "todos") setNombres.add(l);
        });
      }
    });
  });

  const nombresOrdenados = Array.from(setNombres).sort((a, b) => a.localeCompare(b));

  nombresOrdenados.forEach((nombre, idx) => {
    const info = directorio.find((d) => d.nombre.toLowerCase() === nombre.toLowerCase());
    const mats = Array.from(compMap.get(nombre) || info?.componentes || []);

    // Calcular clases y días asignados
    let clasesProgramadas = 0;
    let clasesDictadas = 0;
    let encuentrosComunitarios = 0;
    const diasSet = new Set<string>();

    jornadas.forEach((j) => {
      let tiene = false;
      const b = j.bitacora;

      j.bloques.forEach((bloque) => {
        const compUpper = (bloque.componente || "").trim().toUpperCase();
        const esDeMateria = compUpper && mats.some((m) => m.toUpperCase() === compUpper);
        const tieneNombre = bloque.talleristas && bloque.talleristas.toLowerCase().includes(nombre.toLowerCase());

        if (tieneNombre || esDeMateria) {
          clasesProgramadas++;
          tiene = true;
          const reg = b?.ejecucionBloques?.find((r) => r.bloqueId === bloque.id);
          if (reg?.estado === "dictada" || (tieneNombre && reg?.estado !== "cancelada" && j.fechaISO && j.fechaISO < "2027-01-01")) {
            clasesDictadas++;
          }
        }
      });

      // Coordinaciones, escuelas y salidas
      if (b) {
        if (b.asistentesCoordinacion?.some((a) => a.toLowerCase().includes(nombre.toLowerCase()))) {
          encuentrosComunitarios++;
          tiene = true;
        }
        if (b.asistentesEscuelaFormacion?.some((a) => a.toLowerCase().includes(nombre.toLowerCase()))) {
          encuentrosComunitarios++;
          tiene = true;
        }
        if (b.asistentesSalidaPedagogica?.some((a) => a.toLowerCase().includes(nombre.toLowerCase()))) {
          encuentrosComunitarios++;
          tiene = true;
        }
      }

      if (tiene && j.fecha) diasSet.add(j.fecha);
    });

    const participacionTotal = clasesDictadas + encuentrosComunitarios;

    let tareasCount = 0;
    hitos.forEach((h) => {
      if (h.personasEncargadas && h.personasEncargadas.toLowerCase().includes(nombre.toLowerCase())) {
        tareasCount++;
        if (h.fecha) diasSet.add(h.fecha);
      }
    });

    const cumplimientoPorcentaje =
      clasesProgramadas > 0
        ? Math.round((clasesDictadas / clasesProgramadas) * 100)
        : 100;

    const r = sheet.getRow(idx + 2);
    r.values = [
      idx + 1,
      nombre,
      info?.telefono || "Por registrar",
      info?.correo || "Por registrar",
      mats.join(", ") || "General / Comunitario",
      diasSet.size,
      clasesProgramadas,
      clasesDictadas,
      encuentrosComunitarios,
      participacionTotal,
      tareasCount,
      `${cumplimientoPorcentaje}%`,
      info?.notas || "",
    ];
    r.height = 24;

    const bg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      c.font = { size: 9.5, name: "Calibri", color: { argb: "FF1E293B" } };
      c.alignment = {
        vertical: "middle",
        horizontal: col === 1 || (col >= 6 && col <= 12) ? "center" : "left",
        wrapText: true,
      };
      c.border = BORDES_FINOS;
    });
  });
}

/**
 * Construye la Hoja 5: "Estructura_y_Fechas_Clave" con el resumen de Ciclos, Períodos (Vacaciones/Clases/Coordinación)
 * y los Exámenes Oficiales (UNAL / ICFES).
 */
function construirHojaEstructuraYFechasClave(
  workbook: ExcelJS.Workbook,
  estructura?: EstructuraCalendarioConfig
) {
  if (!estructura) return;

  const sheet = workbook.addWorksheet("Estructura_y_Fechas_Clave");
  sheet.columns = [
    { key: "col0", width: 6 },
    { key: "col1", width: 32 },
    { key: "col2", width: 22 },
    { key: "col3", width: 18 },
    { key: "col4", width: 18 },
    { key: "col5", width: 36 },
  ];

  // Título
  const rTit = sheet.getRow(1);
  rTit.getCell(2).value = "ESTRUCTURA ACADÉMICA, CICLOS Y FECHAS CLAVE 2027";
  rTit.getCell(2).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12, name: "Calibri" };
  rTit.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  sheet.mergeCells(1, 2, 1, 6);
  rTit.height = 30;

  // Resumen de Ciclos
  const rCiclo = sheet.getRow(3);
  rCiclo.getCell(2).value = "MODALIDAD DE CICLOS:";
  rCiclo.getCell(2).font = { bold: true, size: 10, name: "Calibri" };
  rCiclo.getCell(3).value =
    estructura.modalidadCiclo === "dos_ciclos"
      ? `Dos Ciclos Semestrales (${estructura.nombreCiclo1 || "Ciclo 1"} / ${estructura.nombreCiclo2 || "Ciclo 2"})`
      : "Ciclo Anual Continuo";
  sheet.mergeCells(3, 3, 3, 6);

  // Tabla 1: Períodos Temporales (Vacaciones, Coordinación, Clases)
  const rHPer = sheet.getRow(5);
  rHPer.height = 24;
  ["NOMBRE DEL BLOQUE / PERÍODO", "TIPO", "FECHA INICIO", "FECHA FIN", "DESCRIPCIÓN"].forEach(
    (h, idx) => {
      const c = rHPer.getCell(idx + 2);
      c.value = h;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
      c.alignment = { vertical: "middle", horizontal: "center" };
      c.border = BORDES_FINOS;
    }
  );

  let filaActual = 6;
  estructura.periodosTemporales.forEach((p) => {
    const r = sheet.getRow(filaActual);
    r.height = 22;
    const estilo = ESTILOS_BLOQUES_PERIODO[p.tipo];
    const valores = [
      `${estilo?.icon || "📌"} ${p.nombre}`,
      p.tipo.toUpperCase(),
      p.fechaInicio,
      p.fechaFin,
      p.descripcion || "",
    ];
    valores.forEach((v, idx) => {
      const c = r.getCell(idx + 2);
      c.value = v;
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${estilo?.excelHex || "FFFFFF"}` },
      };
      c.font = { size: 9.5, name: "Calibri", color: { argb: "FF0F172A" } };
      c.alignment = {
        vertical: "middle",
        horizontal: idx === 1 || idx === 2 || idx === 3 ? "center" : "left",
      };
      c.border = BORDES_FINOS;
    });
    filaActual++;
  });

  // Tabla 2: Exámenes Oficiales y Pruebas Clave
  filaActual += 2;
  const rHExamen = sheet.getRow(filaActual);
  rHExamen.height = 24;
  ["EXAMEN / PRUEBA CLAVE", "TIPO", "FECHA PROGRAMADA", "ESTADO", "OBSERVACIONES"].forEach(
    (h, idx) => {
      const c = rHExamen.getCell(idx + 2);
      c.value = h;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B21A8" } }; // Purple 800
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
      c.alignment = { vertical: "middle", horizontal: "center" };
      c.border = BORDES_FINOS;
    }
  );

  filaActual++;
  estructura.fechasClaveExamenes.forEach((e) => {
    const r = sheet.getRow(filaActual);
    r.height = 22;
    const estilo = ESTILOS_EXAMENES_CLAVE[e.tipo];
    const valores = [
      `🎓 ${e.titulo}`,
      estilo?.label || e.tipo.toUpperCase(),
      e.fecha,
      "Fecha Oficial Confirmada",
      e.descripcion || "",
    ];
    valores.forEach((v, idx) => {
      const c = r.getCell(idx + 2);
      c.value = v;
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx === 0 ? "FFF3E8FF" : "FFFFFFFF" },
      };
      c.font = { size: 9.5, name: "Calibri", color: { argb: "FF1E293B" } };
      c.alignment = {
        vertical: "middle",
        horizontal: idx === 1 || idx === 2 || idx === 3 ? "center" : "left",
      };
      c.border = BORDES_FINOS;
    });
    filaActual++;
  });
}

/**
 * Hoja 6: Bitácora de Sede y Ejecución Real por Jornada
 * Registra asistencia real, reemplazos, tareas de sede y quiénes asistieron a la formación/coordinación
 */
function construirHojaBitacoraSede(
  workbook: ExcelJS.Workbook,
  jornadasSinOrdenar: JornadaPedagogica[]
) {
  const jornadasConBitacora = [...jornadasSinOrdenar].sort((a, b) => {
    const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
    const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
    return isoA.localeCompare(isoB);
  });

  const sheet = workbook.addWorksheet("Bitacora_Sede_Ejecucion", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  sheet.columns = [
    { key: "num", width: 8 },
    { key: "fecha", width: 22 },
    { key: "dia", width: 14 },
    { key: "caracter", width: 18 },
    { key: "encargadx", width: 22 },
    { key: "estudiantes", width: 16 },
    { key: "clasesDictadas", width: 45 },
    { key: "escuelaFormacion", width: 35 },
    { key: "coordinacion", width: 35 },
    { key: "salidaPedagogica", width: 35 },
    { key: "sedeChecklist", width: 30 },
    { key: "observaciones", width: 40 },
  ];

  const headers = [
    "# JORN",
    "FECHA",
    "DÍA",
    "CARÁCTER",
    "ENCARGADX DEL DÍA",
    "ESTUDIANTES",
    "ESTADO Y TALLERISTAS POR BLOQUE",
    "ASISTENTES ESCUELA FORMACIÓN",
    "ASISTENTES COORDINACIÓN",
    "SALIDA PEDAGÓGICA (LUGAR Y TALLERISTAS)",
    "CHECKLIST DE SEDE",
    "OBSERVACIONES Y NOVEDADES",
  ];

  const rHeader = sheet.getRow(1);
  rHeader.values = headers;
  rHeader.height = 28;
  rHeader.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C1D95" } }; // Purple 900
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9.5, name: "Calibri" };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = BORDES_FINOS;
  });

  jornadasConBitacora.forEach((j, idx) => {
    const bit = j.bitacora;
    const caracter = j.caracter || (j.tipoJornada === "clases" ? "clases" : "coordinacion");

    // Resumen de bloques dictados
    const detalleBloques = (j.bloques || []).map((b, bIdx) => {
      const reg = bit?.ejecucionBloques?.find((r) => r.bloqueId === b.id);
      const est = reg?.estado || "pendiente";
      const tall = reg?.talleristaEfectivo || b.talleristas || "Sin tallerista";
      return `B${bIdx + 1} [${b.componente || "Materia"}]: ${est.toUpperCase()} (${tall})`;
    }).join(" | ");

    // Checklist de sede
    const checks: string[] = [];
    if (bit?.aperturaLlaves) checks.push("🔑 Llaves OK");
    if (bit?.refrigerioEntregado) checks.push("☕ Refrigerio OK");
    if (bit?.circuloPalabraRealizado) checks.push("🗣️ Círculo OK");
    if (bit?.aseoSalonesVerificado) checks.push("🧹 Aseo OK");
    if (bit?.cierreSedeRealizado) checks.push("🔒 Cierre OK");
    const checkTexto = checks.length > 0 ? checks.join(" • ") : "Sin registro";

    const detalleSalida =
      bit?.lugarSalidaPedagogica || (bit?.asistentesSalidaPedagogica || []).length > 0
        ? `${bit?.lugarSalidaPedagogica ? `[${bit.lugarSalidaPedagogica}] ` : ""}${(bit?.asistentesSalidaPedagogica || []).join(", ") || "Todos los talleristas"}`
        : "—";

    const r = sheet.getRow(idx + 2);
    r.values = [
      j.numeroJornada || idx + 1,
      j.fecha || "",
      j.diaSemana || "",
      caracter.toUpperCase(),
      bit?.encargadxConfirmadx || j.encargadxDelDia || "Por definir",
      bit?.estudiantesPresentes !== undefined ? bit.estudiantesPresentes : "—",
      detalleBloques,
      (bit?.asistentesEscuelaFormacion || []).join(", ") || "—",
      (bit?.asistentesCoordinacion || []).join(", ") || "—",
      detalleSalida,
      checkTexto,
      bit?.observacionesGenerales || j.comentarios || "",
    ];
    r.height = 26;

    const bg = idx % 2 === 0 ? "FFFFFFFF" : "FFFDF4FF";
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      c.font = { size: 9, name: "Calibri", color: { argb: "FF1E293B" } };
      c.alignment = {
        vertical: "middle",
        horizontal: col === 1 || col === 3 || col === 4 || col === 6 ? "center" : "left",
        wrapText: true,
      };
      c.border = BORDES_FINOS;
    });
  });
}

export function generarWorkbookCronograma(
  jornadas: JornadaPedagogica[],
  malla: MallaComponente[] = [],
  hitos: EventoCronograma[] = [],
  franjasHorarias?: string[],
  directorioTalleristas: InfoContactoTallerista[] = [],
  estructura?: EstructuraCalendarioConfig
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Escuela Popular El Topo";
  workbook.created = new Date();

  // Hoja 1: Matriz completa de jornadas 2027 + Malla de componentes arriba
  construirHojaMatrizJornadas(workbook, jornadas, malla, franjasHorarias, estructura);

  // Hoja 2 y 3: Cronograma de Hitos y Tareas con fechas y responsables
  if (hitos.length > 0) {
    construirHojasHitos(workbook, hitos);
  }

  // Hoja 4: Directorio completo de talleristas con teléfonos, correos y materias
  construirHojaDirectorioTalleristas(workbook, jornadas, hitos, malla, directorioTalleristas);

  // Hoja 5: Estructura de Ciclos, Períodos (Vacaciones, Clases, Coordinación) y Exámenes Oficiales
  if (estructura) {
    construirHojaEstructuraYFechasClave(workbook, estructura);
  }

  // Hoja 6: Bitácora de Sede, Ejecución Real, Escuelas de Formación y Coordinaciones
  construirHojaBitacoraSede(workbook, jornadas);

  return workbook;
}

export async function exportarJornadasAExcel(
  jornadas: JornadaPedagogica[],
  malla: MallaComponente[] = [],
  hitos: EventoCronograma[] = [],
  franjasHorarias?: string[],
  directorioTalleristas: InfoContactoTallerista[] = [],
  estructura?: EstructuraCalendarioConfig
): Promise<void> {
  const workbook = generarWorkbookCronograma(
    jornadas,
    malla,
    hitos,
    franjasHorarias,
    directorioTalleristas,
    estructura
  );
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "Cronograma_Jornadas_2027_El_Topo.xlsx");
}

export async function exportarHitosTodo2027Excel(hitos: EventoCronograma[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Escuela Popular El Topo";
  workbook.created = new Date();

  construirHojasHitos(workbook, hitos);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "todo_2027_El_Topo.xlsx");
}

export async function importarArchivoCronograma(
  file: File
): Promise<{ hitos?: EventoCronograma[]; mensaje: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const sep = lines[0]?.includes(";") ? ";" : ",";
    const nuevosHitos: EventoCronograma[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
      const [fecha, evento, compromiso, encargadas] = cols;
      if (!fecha && !evento && compromiso && nuevosHitos.length > 0) {
        const ultimo = nuevosHitos[nuevosHitos.length - 1];
        ultimo.compromiso = ultimo.compromiso
          ? `${ultimo.compromiso}\n${compromiso}`
          : compromiso;
      } else if (fecha || evento) {
        nuevosHitos.push({
          id: `imp-${Date.now()}-${i}`,
          fecha: fecha || "",
          diaSemana: obtenerNombreDiaSemana(fecha),
          evento: evento || "",
          compromiso: compromiso || "",
          personasEncargadas: encargadas || "",
          completado: false,
        });
      }
    }
    return {
      hitos: nuevosHitos,
      mensaje: `Se importaron ${nuevosHitos.length} hitos desde el archivo CSV.`,
    };
  }

  if (ext === "xlsx") {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet =
      workbook.getWorksheet("con_tareas") ||
      workbook.getWorksheet("sin_tareas") ||
      workbook.worksheets[0];

    if (!sheet) {
      throw new Error("No se encontró ninguna hoja válida en el archivo Excel.");
    }

    const nuevosHitos: EventoCronograma[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rawFecha = row.getCell(1).text?.trim() || "";
      const evento = row.getCell(2).text?.trim() || "";
      const compromiso = row.getCell(3).text?.trim() || "";
      const encargadas = row.getCell(4).text?.trim() || "";

      if (!rawFecha && !evento && compromiso && nuevosHitos.length > 0) {
        const ultimo = nuevosHitos[nuevosHitos.length - 1];
        ultimo.compromiso = ultimo.compromiso
          ? `${ultimo.compromiso}\n${compromiso}`
          : compromiso;
      } else if (rawFecha || evento) {
        nuevosHitos.push({
          id: `xlsx-${Date.now()}-${rowNumber}`,
          fecha: rawFecha,
          diaSemana: obtenerNombreDiaSemana(rawFecha),
          evento,
          compromiso,
          personasEncargadas: encargadas,
          completado: false,
        });
      }
    });

    return {
      hitos: nuevosHitos,
      mensaje: `Se importaron ${nuevosHitos.length} hitos desde el archivo Excel (${sheet.name}).`,
    };
  }

  throw new Error("Formato de archivo no soportado. Usa .xlsx o .csv");
}
