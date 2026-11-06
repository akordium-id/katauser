export function isRootDomain(
  host: string,
  rootDomain: string = 'katauser.com'
): boolean {
  const cleanHost = host.split(':')[0].toLowerCase();
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === rootDomain ||
    cleanHost === `app.${rootDomain}` ||
    cleanHost === `www.${rootDomain}`
  ) {
    return true;
  }
  return false;
}

export function resolveCustomDomain(host: string): string {
  const cleanHost = host.split(':')[0].toLowerCase();
  const parts = cleanHost.split('.');

  // e.g. feedback.acme.com -> acme, ideas.startup.io -> startup
  if (parts.length >= 3) {
    return parts[1];
  }
  return parts[0];
}

export function rewritePathForCustomDomain(
  path: string,
  workspaceSlug: string
): string {
  // Never rewrite static assets, sitemaps, or internal api routes
  if (
    path.startsWith('/_app') ||
    path.startsWith('/api') ||
    path.startsWith('/favicon') ||
    path.startsWith('/robots') ||
    path.startsWith('/sitemap')
  ) {
    return path;
  }

  if (path === '/' || path === '') {
    return `/b/${workspaceSlug}/general`;
  }

  if (path === '/roadmap') {
    return `/roadmap/${workspaceSlug}`;
  }

  if (path === '/changelog') {
    return `/changelog/${workspaceSlug}`;
  }

  return path;
}

