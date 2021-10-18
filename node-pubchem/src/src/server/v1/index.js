import { readdir, lstat } from 'fs/promises';
import { join } from 'path';

import fastifySwagger from 'fastify-swagger';

export default async function setupV1(app, _, done) {
  app.register(fastifySwagger, {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'Search a copy of pubchem database',
        description: ``,
        version: '1.0.0',
      },
    },
    exposeRoute: true,
  });

  app.get('/', { schema: { hide: true } }, (_, reply) => {
    reply.redirect('/v1/documentation');
  });

  const url = new URL('routes', import.meta.url);
  const folders = await readdir(url);
  for (let folder of folders) {
    const folderURL = new URL(join('routes', folder), url);
    for (let routeName of await readdir(folderURL)) {
      const routeURL = new URL(join('routes', folder, routeName), url);
      const stats = await lstat(routeURL);
      if (!stats.isFile()) continue;

      const route = (await import(routeURL)).default;
      if (typeof route.schema !== 'object') continue;
      app.route(route);
    }
  }

  done();
}
