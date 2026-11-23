// 1. Hito o Evento del Cronograma General (Vistas 'con_tareas' y 'sin_tareas')
export interface EventoCronograma {
  id: string;
  fecha?: string;                 // Ej: "15/12/2026", "22/01/2027", "01/11/2027"
  diaSemana?: string;             // Ej: "Sábado", "Viernes", "Domingo"...
  evento?: string;                // Ej: "Apertura de formulario de inscripción estudiantes"
  compromiso?: string;            // Detalle, lista de tareas o acuerdos (multilínea o libre)
  personasEncargadas?: string;    // Nombres libres o vacíos (por llenar)
  completado?: boolean;
}

// 2. Bloque temático de clase dentro de una jornada
export interface BloqueClase {
  id: string;
  hora?: string;                  // Ej: "8:00 AM - 9:30 AM"
  componente?: string;            // Ej: "ORIENTACIÓN VOCACIONAL", "MATEMÁTICAS", "FILOSOFÍA"
  temaDelDia?: string;            // Ej: "¿Cómo leer textos desde la filosofía?"
  talleristas?: string;           // Por llenar en 2027
}

// Carácter específico pedagógico de una jornada en el calendario
export type CaracterJornada = 'clases' | 'vacaciones' | 'coordinacion' | 'examen' | 'salida';

// Estado de ejecución de un bloque en la jornada real
export type EstadoEjecucionBloque = 'pendiente' | 'dictada' | 'reemplazo' | 'cancelada';

export interface RegistroEjecucionBloque {
  bloqueId: string;
  estado: EstadoEjecucionBloque;
  talleristasEfectivos?: string[]; // Uno o varios talleristas que dictaron la clase (co-docencia)
  talleristaEfectivo?: string; // Compatibilidad con valor singular
  temaDictado?: string;
  observaciones?: string;
}

// 2.1. Bitácora de seguimiento operativo del Encargadx del Día
export interface BitacoraEncargadx {
  encargadxConfirmadx?: string;
  horaApertura?: string;
  aperturaLlaves?: boolean;
  refrigerioEntregado?: boolean;
  circuloPalabraRealizado?: boolean;
  aseoSalonesVerificado?: boolean;
  cierreSedeRealizado?: boolean;
  estudiantesPresentes?: number;
  observacionesGenerales?: string;
  acuerdosDelDia?: string;
  ejecucionBloques?: RegistroEjecucionBloque[];
  asistentesCoordinacion?: string[]; // Nombres de talleristas que asistieron a la reunión de coordinación
  asistentesEscuelaFormacion?: string[]; // Nombres de talleristas que asistieron a la escuela de formación
  asistentesSalidaPedagogica?: string[]; // Nombres de talleristas en salidas
  lugarSalidaPedagogica?: string;
  jornadaFinalizada?: boolean;
  horaCierre?: string;
}

// 3. Jornada Pedagógica Completa (Estructura Matricial Horizontal)
export interface JornadaPedagogica {
  id: string;
  numeroJornada?: number | string;// Ej: 1, 2, 3...
  fechaISO?: string;              // Formato YYYY-MM-DD para ordenar cronológicamente cualquier día (sábado o no)
  fecha?: string;                 // Ej: "23 de enero de 2027"
  diaSemana?: string;             // Ej: "Sábado", "Martes", "Domingo"...
  caracter?: CaracterJornada;     // 'clases' (4 bloques), 'vacaciones' (receso), 'coordinacion' (reunión), 'examen' (evaluación)
  encargadxDelDia?: string;       // Por llenar
  horasJornada?: string;          // Ej: "8:00 AM - 3:00 PM"
  tipoJornada?: 'unificada' | 'clases'; // Unificada para hitos/inducción/vacaciones; Clases para slots de 4 bloques
  descripcionUnificada?: string;  // Ej: "REUNIÓN DE COORDINACIÓN #01 Y ESCUELA DE FORMACIÓN #01"
  bloques: BloqueClase[];         // 4 franjas horarias por jornada
  comentarios?: string;           // Para reuniones, simulacros y tareas adicionales de ese día (en Excel va en fila COMENTARIOS)
  tareasDelDia?: string;          // Detalle de tareas/compromisos asociados a esa fecha desde con_tareas_2027
  bitacora?: BitacoraEncargadx;   // Registro en vivo de ejecución del Encargadx del Día
}

// 4. Festivo Oficial de Colombia
export interface FestivoColombia {
  fecha: string;                  // Formato YYYY-MM-DD
  fechaCorta: string;             // Formato DD/MM/YYYY
  nombre: string;
  tipo: 'fijo' | 'emiliani' | 'pascua';
}

// 5. Fila de la Malla Curricular por Componente (Sesiones 1 a 11)
export interface MallaComponente {
  id: string;
  componente: string;
  talleristasBase?: string[];     // Talleristas que pertenecen a este componente / materia
  sesiones: string[];             // Array de 11 sesiones (índice 0 = Sesión 1)
}

// 6. Información Personal y de Contacto del Tallerista
export interface InfoContactoTallerista {
  nombre: string;
  telefono?: string;
  correo?: string;
  rol?: string;
  componentes?: string[];
  notas?: string;
  calendariosParticipados?: string[]; // Ej: ["2026-Anual", "2027-1"]
  activo?: boolean; // Activo en el ciclo actual vs Antiguo
}

// 6.1. Definición y Seguimiento de Estudiantes
export type EstadoEstudiante = 'activo' | 'espera' | 'retirado' | 'egresado';

export interface AsistenciaEstudianteJornada {
  jornadaId: string;
  fechaISO: string;
  bloquesAsistidos: number; // 0, 1, 2, 3 o 4 clases
  asistioTotal: boolean;    // true si vino a las 4 clases
  observacion?: string;     // Ej: "Llegó tarde al Bloque 2", "Permiso médico"
}

export interface EstudianteTopo {
  id: string;
  num?: number;
  nombres: string;
  apellidos: string;
  documento?: string;
  telefono?: string;
  correo?: string;
  estado: EstadoEstudiante; // 'activo' | 'espera' | 'retirado' | 'egresado'
  fechaIngreso?: string;   // Para identificar cuándo ingresó (ej. desde lista de espera)
  fechaRetiro?: string;
  motivoRetiro?: string;
  calendarioId: string;    // ID del calendario/cohorte al que pertenece (ej. "cal-2026", "cal-2027-1")
  asistenciasPorJornada?: Record<string, number>; // jornadaId o fechaISO -> número de clases (0, 1, 2, 3, 4)
  totalClasesAsistidas?: number; // Total acumulado de clases
  totalJornadasAsistidas?: number; // Total jornadas equivalentes (fracciones)
  puntajeSaber11?: number; // Puntaje oficial o simulacro final
  simulacros?: { nombre: string; puntaje: number; fecha?: string }[];
  observaciones?: string;
}

// 6.2. Modelo de Calendario / Ciclo Independiente
export type EstadoCalendario = 'activo' | 'historico' | 'borrador';

export interface CalendarioCicloTopo {
  id: string;                    // Ej: "cal-2026-anual", "cal-2027-anual", "cal-2027-1"
  nombre: string;                // Ej: "2026 - Ciclo Anual (Histórico)", "2027 - Ciclo Anual (En Curso)"
  codigo: string;                // Ej: "2026", "2027-1", "2027-2"
  ano: number;                   // 2026, 2027, etc.
  estado: EstadoCalendario;      // 'activo' (en transcurso, editable) o 'historico' (cerrado, solo lectura)
  fechaInicio: string;           // YYYY-MM-DD
  fechaFin: string;             // YYYY-MM-DD
  descripcion?: string;
  jornadas: JornadaPedagogica[]; // Jornadas propias de este calendario
  hitos: EventoCronograma[];     // Tareas/hitos propios
  mallaCurricular: MallaComponente[];
  estructuraCalendario: EstructuraCalendarioConfig;
  estudiantes: EstudianteTopo[]; // Estudiantes vinculados a este calendario
  talleristasAsignados?: string[]; // Nombres de talleristas activos en este ciclo
}

// 7. Configuración de Bloque Temporal del Calendario (Vacaciones, Clases, Coordinación, Salida)
export type TipoBloqueCalendario = 'clases' | 'vacaciones' | 'coordinacion' | 'evaluacion' | 'salida';

export interface BloquePeriodoCalendario {
  id: string;
  nombre: string;              // Ej: "Vacaciones de Mitad de Año", "Semana Santa", "Período Clases Semestre 1"
  tipo: TipoBloqueCalendario;
  fechaInicio: string;         // YYYY-MM-DD
  fechaFin: string;           // YYYY-MM-DD
  colorHex?: string;
  descripcion?: string;
}

// 8. Fecha Hito Clave (Exámenes de Estado, Pruebas Institucionales, Salidas Pedagógicas, Coordinación, Escuela de Formación y Asamblea)
export type TipoHitoExamen = 'unal' | 'icfes' | 'simulacro' | 'salida' | 'cierre' | 'inauguracion' | 'coordinacion' | 'formacion' | 'asamblea' | 'hito';

export interface FechaClaveExamen {
  id: string;
  titulo: string;             // Ej: "Examen Admisión UNAL 2027-1", "Asamblea General Topo 2026"
  tipo: TipoHitoExamen;
  fecha: string;              // YYYY-MM-DD o DD/MM/YYYY (o fecha inicial)
  fechaFin?: string;          // YYYY-MM-DD opcional para hitos de varios días (ej. Asamblea de 2 días)
  descripcion?: string;
}

// 9. Configuración Estructural y Estratégica del Año
export type ModalidadCiclo = 'anual' | 'dos_ciclos'; // 1 ciclo anual continuo vs 2 ciclos semestrales

export interface EstructuraCalendarioConfig {
  modalidadCiclo: ModalidadCiclo;
  nombreCiclo1?: string;      // Ej: "Ciclo I - 2027 (UNAL 2027-2 / ICFES)"
  nombreCiclo2?: string;      // Ej: "Ciclo II - 2027 (UNAL 2028-1)"
  horaInicioDefecto: string;  // Ej: "8:00 AM" o "9:00 AM"
  duracionBloqueMinutos: number; // Ej: 90
  periodosTemporales: BloquePeriodoCalendario[];
  fechasClaveExamenes: FechaClaveExamen[];
}

// 10. Configuración estructural de franjas horarias y clases
export interface FranjaHorariaConfig {
  id: string;
  nombre: string;     // Ej: "Bloque 1", "Bloque 2"
  hora: string;       // Ej: "8:00 AM - 9:30 AM"
  duracionMinutos?: number;
}

// 11. Estado Global Persistido del Aplicativo
export interface EstadoCronogramaTopo {
  version: string;
  ultimaActualizacion: string;
  calendarioActivoId?: string; // ID del calendario actualmente visualizado
  calendarios?: CalendarioCicloTopo[]; // Lista de todos los calendarios (2026, 2027, etc.)
  hitos: EventoCronograma[];
  jornadas: JornadaPedagogica[];
  mallaCurricular: MallaComponente[];
  talleristas: string[];
  directorioTalleristas?: InfoContactoTallerista[]; // Datos personales/contacto
  estudiantes?: EstudianteTopo[]; // Estudiantes del calendario actual
  franjasHorarias?: string[]; // Array de strings con las horas por defecto estructurales
  estructuraCalendario?: EstructuraCalendarioConfig; // Configuración de ciclos, períodos y exámenes
}
