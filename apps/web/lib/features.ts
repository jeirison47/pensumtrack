export const FEATURE_KEYS = [
  'subject_status_update',
  'subject_grades',
  'dashboard_stats',
  'preselection',
  'unlock_view',
  'multiple_careers',
  'professor_detail',
  'professor_rate',
  'professor_request',
  'pensum_request',
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

export const FEATURE_LABELS: Record<FeatureKey, { label: string; description: string }> = {
  subject_status_update: {
    label: 'Marcar materias',
    description: 'Marcar materias como en curso, aprobadas o fallidas',
  },
  subject_grades: {
    label: 'Registrar notas',
    description: 'Guardar calificaciones numéricas en materias aprobadas',
  },
  dashboard_stats: {
    label: 'Estadísticas de progreso',
    description: 'Ver porcentaje de avance, promedios e índice académico',
  },
  preselection: {
    label: 'Preselección de materias',
    description: 'Crear y gestionar períodos académicos y preselecciones',
  },
  unlock_view: {
    label: 'Vista de desbloqueo',
    description: 'Ver qué materias se desbloquean al aprobar cada asignatura',
  },
  multiple_careers: {
    label: 'Múltiples carreras',
    description: 'Manejar más de una carrera simultáneamente en la app',
  },
  professor_detail: {
    label: 'Detalle de profesores',
    description: 'Ver perfil completo, calificaciones y comentarios de un profesor',
  },
  professor_rate: {
    label: 'Calificar profesores',
    description: 'Dejar calificaciones y comentarios sobre profesores',
  },
  professor_request: {
    label: 'Solicitar agregar profesor',
    description: 'Enviar solicitud para que se agregue un profesor a la plataforma',
  },
  pensum_request: {
    label: 'Solicitar agregar pensum',
    description: 'Enviar solicitud para que se agregue una carrera o pensum',
  },
}
