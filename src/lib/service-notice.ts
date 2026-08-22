import { ServiceError, ServiceUnreachableError } from './service-error';

/**
 * Turns a failed service call into one sentence a raider can read, or rethrows anything
 * that is this dashboard's own bug. Every page that fetches needs the same three cases,
 * and a page inventing its own wording for a 500 is how "internal error" ends up on
 * screen.
 */
export function noticeFor(error: unknown): string {
  if (error instanceof ServiceUnreachableError) {
    return 'Raider Mate is not answering right now.';
  }
  if (error instanceof ServiceError) {
    return error.isSafe() ? error.serviceMessage : 'Raider Mate had a problem with that.';
  }
  throw error;
}

/**
 * The same failures as a code a redirect can carry. A write route has no page to render
 * a sentence into, and putting the service's own words in a query string would let
 * anyone choose what the next page says.
 */
export function noticeCodeFor(error: unknown): string {
  if (error instanceof ServiceUnreachableError) {
    return 'unreachable';
  }
  if (error instanceof ServiceError) {
    if (error.isPaymentRequired) {
      return 'premium';
    }
    if (error.isForbidden) {
      return 'denied';
    }
    if (error.isNotFound) {
      return 'gone';
    }
    return 'failed';
  }
  throw error;
}
