import {
  ApiError,
  ConfigurationError,
  ContractError,
  FixtureMissingError,
  NetworkError,
  TimeoutError,
} from '../transport/errors'

const apiErrorMessages: Record<string, string> = {
  sector_not_found: 'El sector solicitado no está disponible.',
  event_not_found: 'El evento solicitado no está disponible.',
  invalid_request: 'Revisa los datos de la solicitud.',
  unauthorized: 'Esta acción no está disponible en la aplicación pública.',
  llm_unavailable: 'El asistente no está disponible por el momento.',
}

export function adaptDataError(error: unknown): string {
  if (error instanceof FixtureMissingError) {
    return 'Estos datos de demostración todavía no están disponibles.'
  }

  if (error instanceof TimeoutError) {
    return 'La actualización está tardando demasiado. Intenta nuevamente.'
  }

  if (error instanceof NetworkError) {
    return 'No se pudo conectar. Revisa tu señal e intenta nuevamente.'
  }

  if (error instanceof ApiError) {
    return apiErrorMessages[error.code] ?? 'El servicio no pudo completar la solicitud.'
  }

  if (error instanceof ContractError) {
    return 'Los datos recibidos no son compatibles con esta versión.'
  }

  if (error instanceof ConfigurationError) {
    return 'La fuente de datos no está configurada correctamente.'
  }

  return 'Ocurrió un problema al consultar los datos.'
}
