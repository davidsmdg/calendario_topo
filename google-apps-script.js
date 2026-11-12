/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - ESCUELA POPULAR EL TOPO (CRONOGRAMA 2027)
 * ============================================================================
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu hoja de cálculo de Google Sheets en el navegador.
 * 2. Ve al menú superior: Extensiones > Apps Script.
 * 3. Borra cualquier código que aparezca y pega este archivo completo.
 * 4. Haz clic en el icono de Guardar (disquete) arriba.
 * 5. Haz clic en el botón azul "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 6. En "Selecciona el tipo" (icono de engranaje), elige "Aplicación web".
 * 7. Configura:
 *    - Descripción: API Cronograma El Topo 2027
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone) -> Importante para que la web pueda leer/escribir sin bloqueo CORS.
 * 8. Haz clic en "Implementar", autoriza los permisos y copia la "URL de la aplicación web".
 * 9. Pega esa URL en el botón "Configuración de Base de Datos" dentro del aplicativo web.
 * ============================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetState = ss.getSheetByName("App_State_JSON");

    // Si existe estado JSON estructurado completo, lo devolvemos con prioridad
    if (sheetState) {
      var rawJson = sheetState.getRange(1, 1).getValue();
      if (rawJson) {
        var parsed = JSON.parse(rawJson);
        return ContentService.createTextOutput(
          JSON.stringify({
            status: "success",
            state: parsed,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Fallback: leer desde hojas tabulares si alguien creó hojas manualmente
    var sheetHitos = ss.getSheetByName("Hitos_Con_Tareas") || ss.getSheetByName("Hitos") || ss.getSheets()[0];
    var dataHitos = sheetHitos ? sheetHitos.getDataRange().getValues() : [];

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        hitos: dataHitos,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: err.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Guardar el estado JSON completo para sincronización 100% fiel
    if (contents.stateJson) {
      var sheetState = ss.getSheetByName("App_State_JSON");
      if (!sheetState) {
        sheetState = ss.insertSheet("App_State_JSON");
      }
      sheetState.clear();
      sheetState.getRange(1, 1).setValue(contents.stateJson);
      sheetState.getRange(2, 1).setValue("Última actualización: " + new Date().toISOString());
    }

    // 2. Guardar hoja legible "con_tareas"
    if (contents.hitosConTareas && contents.hitosConTareas.length > 0) {
      var sheetCon = ss.getSheetByName("con_tareas");
      if (!sheetCon) sheetCon = ss.insertSheet("con_tareas");
      sheetCon.clear();
      sheetCon
        .getRange(1, 1, contents.hitosConTareas.length, contents.hitosConTareas[0].length)
        .setValues(contents.hitosConTareas);
    }

    // 3. Guardar hoja legible "sin_tareas"
    if (contents.hitosSinTareas && contents.hitosSinTareas.length > 0) {
      var sheetSin = ss.getSheetByName("sin_tareas");
      if (!sheetSin) sheetSin = ss.insertSheet("sin_tareas");
      sheetSin.clear();
      sheetSin
        .getRange(1, 1, contents.hitosSinTareas.length, contents.hitosSinTareas[0].length)
        .setValues(contents.hitosSinTareas);
    }

    // 4. Guardar hoja legible "Jornadas"
    if (contents.jornadasTabla && contents.jornadasTabla.length > 0) {
      var sheetJornadas = ss.getSheetByName("Jornadas");
      if (!sheetJornadas) sheetJornadas = ss.insertSheet("Jornadas");
      sheetJornadas.clear();
      sheetJornadas
        .getRange(1, 1, contents.jornadasTabla.length, contents.jornadasTabla[0].length)
        .setValues(contents.jornadasTabla);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "saved",
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: err.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
