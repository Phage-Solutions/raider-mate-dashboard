/**
 * A 4xx or 5xx from raider-mate-service, carrying the message it sent.
 */
export class ServiceError extends Error {
  readonly status: number;
  readonly serviceMessage: string;

  constructor(status: number, serviceMessage: string) {
    super(`service returned ${status}: ${serviceMessage}`);
    this.name = 'ServiceError';
    this.status = status;
    this.serviceMessage = serviceMessage;
  }

  /**
   * Whether the message can be put in front of a raider. The service writes its 4xx
   * messages for a human ("not your character", "raid lead required"); its 5xx message
   * is the words "internal error" over whatever actually broke, which belongs in the
   * log.
   */
  isSafe(): boolean {
    return this.status < 500;
  }

  /** Both "no such thing" and "not in your guild". The service does not distinguish
   * them on purpose, so neither does this. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** The action needs a capability the caller does not have. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** The shared key was rejected. A dashboard misconfiguration, never the raider. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/** The service could not be reached at all: DNS, connection refused, timeout. */
export class ServiceUnreachableError extends Error {
  constructor(method: string, path: string, cause: unknown) {
    super(`calling ${method} ${path}`, { cause });
    this.name = 'ServiceUnreachableError';
  }
}

/**
 * Reads an error response into a ServiceError. A body that will not decode is not
 * worth reporting over the status itself: the service always sends {"error": ...}, so
 * a bad body means a proxy or a panic mid-write.
 */
export async function readServiceError(response: Response): Promise<ServiceError> {
  let message = '';
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string') {
      message = body.error;
    }
  } catch {
    message = response.statusText;
  }
  return new ServiceError(response.status, message);
}
