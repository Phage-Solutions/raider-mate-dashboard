/**
 * A HATEOAS transition the service offered: where to go and what verb to use.
 */
export interface Link {
  href: string;
  method?: string;
}

/**
 * The set of transitions on a response. Controls are rendered from these and from
 * nothing else: no `lock` link means no lock button, whatever this dashboard believes
 * about the caller.
 */
export type Links = Record<string, Link>;

/** A resource that carries transitions. Every service response embeds one. */
export interface Linked {
  _links: Links;
}

export function hasLink(linked: Linked, name: string): boolean {
  return name in linked._links;
}

/**
 * Returns the named transition, or undefined when the service did not offer it. That
 * absence is the authorization answer, not an error.
 */
export function getLink(linked: Linked, name: string): Link | undefined {
  return linked._links[name];
}
