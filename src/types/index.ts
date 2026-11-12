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

// 3. Jornada Pedagógica Completa (Estructura Matricial Horizontal)
export interface JornadaPedagogica {
  id: string;
  numeroJornada?: number | string;// Ej: 1, 2, 3...
  fechaISO?: string;              // Formato YYYY-MM-DD para ordenar cronológicamente cualquier día (sábado o no)
  fecha?: string;                 // Ej: "23 de enero de 2027"
  diaSemana?: string;             // Ej: "Sábado", "Martes", "Domingo"...
  encargadxDelDia?: string;       // Por llenar
  horasJornada?: string;          // Ej: "8:00 AM - 3:00 PM"
  tipoJornada?: 'unificada' | 'clases'; // Unificada para hitos/inducción/inauguración; Clases para slots de 4 bloques
  descripcionUnificada?: string;  // Ej: "REUNIÓN DE COORDINACIÓN #01 Y ESCUELA DE FORMACIÓN #01"
  bloques: BloqueClase[];         // 4 franjas horarias por jornada
  comentarios?: string;           // Para reuniones, simulacros y tareas adicionales de ese día (en Excel va en fila COMENTARIOS)
  tareasDelDia?: string;          // Detalle de tareas/compromisos asociados a esa fecha desde con_tareas_2027
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

// 6. Estado Global Persistido del Aplicativo
export interface EstadoCronogramaTopo {
  version: string;
  ultimaActualizacion: string;
  hitos: EventoCronograma[];
  jornadas: JornadaPedagogica[];
  mallaCurricular: MallaComponente[];
  talleristas: string[];
}
