import { recursiveDir } from '../utils/recursiveDir.js';

/**
 * Fastify plugin that auto-registers every v1 route. It scans `src/plugins/`
 * for modules under a `routes/` path whose default export has a `schema`
 * object, derives the route URL from the file path, and registers it. Modules
 * without a schema (helpers, handlers) are skipped.
 * @param fastify - Fastify instance to register routes on.
 * @returns {Promise<void>}
 */
export default async function v1(fastify) {
  const url = new URL('../plugins/', import.meta.url);
  const routeURLs = (await recursiveDir(url)).filter((file) =>
    file.href.match(/routes/),
  );

  for (let routeURL of routeURLs) {
    const route = (await import(routeURL)).default;
    if (typeof route?.schema !== 'object') continue;
    const path = routeURL.pathname
      .replace(url.pathname, '')
      .replace('/routes', '')
      .replace('.js', '');
    route.url = path;
    fastify.route(route);
  }
}
