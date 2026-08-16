declare namespace App {
  interface Locals {
    /** The sealed cookie, opened. Null when signed out. */
    session: import('./lib/session').Session | null;
    /**
     * Who the service is told this request is for. Null until a guild is picked,
     * because every actor fact except the user id is guild-scoped.
     */
    actor: import('./lib/actor').Actor | null;
    client: import('./lib/service-client').ServiceClient;
  }
}
