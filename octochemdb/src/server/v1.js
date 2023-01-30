import { recursiveDir } from '../utils/recursiveDir.js';

export default async function v1(fastify, _, done) {
  const url = new URL('../plugins/', import.meta.url);
  const routeURLs = (await recursiveDir(url)).filter((file) =>
    file.href.match(/routes/),
  );

  for (let routeURL of routeURLs) {
    const route = (await import(routeURL)).default;
    if (typeof route.schema !== 'object') continue;
    const path = routeURL.pathname
      .replace(url.pathname, '')
      .replace('/routes', '')
      .replace('.js', '');
    route.url = path;
    fastify.route(route);
  }

  done();
}
