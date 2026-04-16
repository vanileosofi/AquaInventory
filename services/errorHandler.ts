// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'NO_API_KEY'
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'OVERLOADED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'GENERIC_ERROR';

export interface AppError {
  code: AppErrorCode;
  retryAfterSeconds?: number;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

/**
 * Clasifica un error HTTP de la API de Gemini en un AppError tipado.
 */
export async function parseGeminiError(response: Response): Promise<AppError> {
  const body = await response.json().catch(() => ({})) as any;
  const message: string = body?.error?.message ?? '';

  if (response.status === 429) {
    const retryHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryHeader ? parseInt(retryHeader, 10) : 60;
    return { code: 'RATE_LIMITED', retryAfterSeconds };
  }

  if (response.status === 503 || response.status === 529) {
    return { code: 'OVERLOADED', retryAfterSeconds: 30 };
  }

  if (response.status === 500) {
    return { code: 'SERVER_ERROR' };
  }

  if (
    (response.status === 400 && message.includes('API_KEY')) ||
    response.status === 403
  ) {
    return { code: 'INVALID_API_KEY' };
  }

  return { code: 'GENERIC_ERROR' };
}

/**
 * Devuelve un AppError de tipo PARSE_ERROR para respuestas vacías o JSON inválido.
 */
export function parseGeminiParseError(): AppError {
  return { code: 'PARSE_ERROR' };
}

// ─── UI — mapper de errores a traducción ──────────────────────────────────────

/**
 * Devuelve la clave i18n correspondiente al error.
 */
export function getErrorTranslationKey(error: AppError): string {
  switch (error.code) {
    case 'RATE_LIMITED':    return 'camera.error_rate_limit';
    case 'OVERLOADED':      return 'camera.error_overloaded';
    case 'SERVER_ERROR':    return 'camera.error_server';
    case 'INVALID_API_KEY': return 'camera.invalid_api_key';
    case 'NETWORK_ERROR':   return 'camera.error_network';
    case 'PARSE_ERROR':     return 'camera.error_parse';
    case 'NO_API_KEY':      return 'camera.no_api_key_desc';
    default:                return 'camera.error_generic';
  }
}

/**
 * true solo para errores que tienen un countdown antes de permitir reintentar.
 */
export function hasRetryCountdown(error: AppError): boolean {
  return error.code === 'RATE_LIMITED' || error.code === 'OVERLOADED';
}

/**
 * true para errores relacionados con la API key (falta o inválida).
 */
export function isApiKeyError(error: AppError): boolean {
  return error.code === 'NO_API_KEY' || error.code === 'INVALID_API_KEY';
}

/**
 * true si tiene sentido ofrecer al usuario la opción de reintentar.
 * PARSE_ERROR indica una imagen problemática, no un error transitorio.
 */
export function canRetry(error: AppError): boolean {
  return error.code !== 'PARSE_ERROR';
}

// ─── Otros servicios (espacio reservado) ─────────────────────────────────────
//
// Agregar aquí parsers para otros servicios siguiendo el mismo patrón:
//   - parseColormindError(response: Response): Promise<AppError>
//   - parseN8NError(response: Response): Promise<AppError>
//   etc.
