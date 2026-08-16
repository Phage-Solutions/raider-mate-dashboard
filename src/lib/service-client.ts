import type { Actor } from './actor';
import { actorHeaders } from './actor';
import type { Link } from './links';
import { readServiceError, ServiceUnreachableError } from './service-error';

/**
 * A response the service sent, with its status. Some 2xx codes are not
 * interchangeable: a signup write answers 200 with a signup and 202 with a late
 * request, and the caller has to tell them apart.
 */
export interface ServiceResponse<T> {
  status: number;
  body: T;
}

/** A page render should not sit behind a service that has stopped answering. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Typed HTTP client for raider-mate-service. It knows how to reach the service, how to
 * present the caller, and how to read what comes back. No domain logic: whether a
 * signup is valid, who is benched, and what a raid lead may do are all answered on the
 * other end.
 *
 * This module holds the shared API key and must never be imported by anything under
 * src/islands. Astro would bundle the key into the browser.
 */
export class ServiceClient {
  readonly #baseUrl: string;
  readonly #apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.#baseUrl = baseUrl.replace(/\/$/, '');
    this.#apiKey = apiKey;
  }

  /**
   * Sends one request and decodes its JSON body. A null actor omits the actor headers,
   * for the few routes the service guards with the shared key alone.
   */
  async request<T>(
    actor: Actor | null,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ServiceResponse<T>> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.#apiKey}` };
    if (actor) {
      Object.assign(headers, actorHeaders(actor));
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(this.#baseUrl + path, init);
    } catch (cause) {
      throw new ServiceUnreachableError(method, path, cause);
    }

    if (!response.ok) {
      throw await readServiceError(response);
    }
    if (response.status === 204) {
      return { status: response.status, body: undefined as T };
    }
    return { status: response.status, body: (await response.json()) as T };
  }

  async get<T>(actor: Actor | null, path: string): Promise<T> {
    const { body } = await this.request<T>(actor, 'GET', path);
    return body;
  }

  /**
   * Follows a transition the service handed back, rather than a path built here. Use
   * it whenever a response already named the transition: the absence of a link is the
   * authorization answer, and following one cannot drift from what was offered.
   */
  async follow<T>(actor: Actor | null, link: Link, body?: unknown): Promise<ServiceResponse<T>> {
    return this.request<T>(actor, link.method || 'GET', link.href, body);
  }
}
