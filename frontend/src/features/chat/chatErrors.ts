import {
  ApiError,
  FixtureMissingError,
  NetworkError,
  TimeoutError,
} from '../../data/transport/errors'

/** Convierte un fallo del chat en un aviso claro, en español simple. */
export function chatErrorText(error: unknown): string {
  if (error instanceof FixtureMissingError) {
    return 'Estos son datos de demostración: aquí solo puedo contestar la primera pregunta de ejemplo. Con el servicio conectado contesto las demás.'
  }

  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return 'No hay señal o el servicio no responde. Su pregunta no se envió. Intente de nuevo cuando vuelva la señal.'
  }

  if (error instanceof ApiError && error.code === 'llm_unavailable') {
    return 'La llamita no puede contestar ahora. Intente de nuevo en unos minutos.'
  }

  if (error instanceof ApiError && error.code === 'sector_not_found') {
    return 'No encuentro ese sector. Elija su sector otra vez.'
  }

  return 'No pude contestar esa pregunta. Intente de nuevo.'
}
