import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { EventoCronograma, JornadaPedagogica, MallaComponente } from "@/types";
import {
  obtenerEstiloComponente,
  obtenerNombreDiaSemana,
  ddmmyyyyToISO,
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
  malla: MallaComponente[]
) {
  // Asegurar orden cronológico en el Excel
  const jornadas = [...jornadasSinOrdenar].sort((a, b) => {
    const isoA = a.fechaISO || ddmmyyyyToISO(a.fecha) || "9999-99-99";
    const isoB = b.fechaISO || ddmmyyyyToISO(b.fecha) || "9999-99-99";
    return isoA.localeCompare(isoB);
  });

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

  // 4 filas de cabecera: JORNADA, FECHA, DÍA DE LA SEMANA, ENCARGADX DEL DÍA
  const etiquetasCabecera = [
    { offset: 0, label: "JORNADA", bg: "FF1B365D", text: "FFFFFFFF", bold: true, height: 24 },
    { offset: 1, label: "FECHA", bg: "FF2A4D7D", text: "FFFFFFFF", bold: true, height: 22 },
    { offset: 2, label: "DÍA DE LA SEMANA", bg: "FFD9E2EC", text: "FF1B365D", bold: true, height: 20 },
    { offset: 3, label: "ENCARGADX DEL DÍA", bg: "FFEAF0F6", text: "FF1B365D", bold: true, height: 22 },
  ];

  etiquetasCabecera.forEach((cfg) => {
    const r = sheet.getRow(filaInicioJornadas + cfg.offset);
    r.height = cfg.height;
    const cLabel = r.getCell(1);
    cLabel.value = cfg.label;
    cLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cfg.bg } };
    cLabel.font = { bold: cfg.bold, color: { argb: cfg.text }, size: 10, name: "Calibri" };
    cLabel.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cLabel.border = BORDES_FINOS;
  });

  // 4 Bloques de clase x 4 filas cada uno (HORAS, COMPONENTE, TEMA DEL DIA, TALLERISTA) = 16 filas
  const inicioBloquesRow = filaInicioJornadas + 4;
  for (let b = 0; b < 4; b++) {
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
  const filaComentarios = inicioBloquesRow + 16;
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

    // 1. Número de Jornada
    const cJornada = sheet.getRow(filaInicioJornadas).getCell(colIdx);
    cJornada.value = idx + 1;
    cJornada.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
    cJornada.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cJornada.alignment = { vertical: "middle", horizontal: "center" };
    cJornada.border = BORDES_FINOS;

    // 2. Fecha
    const cFecha = sheet.getRow(filaInicioJornadas + 1).getCell(colIdx);
    cFecha.value = jornada.fecha || "";
    cFecha.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A4D7D" } };
    cFecha.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9.5, name: "Calibri" };
    cFecha.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cFecha.border = BORDES_FINOS;

    // 3. Día de la Semana
    const cDia = sheet.getRow(filaInicioJornadas + 2).getCell(colIdx);
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
    const cEnc = sheet.getRow(filaInicioJornadas + 3).getCell(colIdx);
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

      // Combinar las 15 filas restantes del cuerpo de la jornada
      const filaIniMerge = inicioBloquesRow + 1;
      const filaFinMerge = inicioBloquesRow + 15;
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
      // 4 bloques normales de clase (con horas listas y campos por llenar o llenados)
      for (let b = 0; b < 4; b++) {
        const bloque = jornada.bloques[b];
        const baseRow = inicioBloquesRow + b * 4;
        const estilo = obtenerEstiloComponente(bloque?.componente);

        // HORAS
        const cHora = sheet.getRow(baseRow).getCell(colIdx);
        cHora.value = bloque?.hora || "";
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

export async function exportarJornadasAExcel(
  jornadas: JornadaPedagogica[],
  malla: MallaComponente[] = [],
  hitos: EventoCronograma[] = []
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Escuela Popular El Topo";
  workbook.created = new Date();

  construirHojaMatrizJornadas(workbook, jornadas, malla);
  if (hitos.length > 0) {
    construirHojasHitos(workbook, hitos);
  }

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
