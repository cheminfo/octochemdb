import { readdirSync, lstatSync } from 'fs';
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
  const folders = readdirSync(url);
  for (let folder of folders) {
    const folderURL = new URL(join('routes', folder), url);
    for (let routeName of readdirSync(folderURL)) {
      const routeURL = new URL(join('routes', folder, routeName), url);
      const stats = lstatSync(routeURL);
      if (!stats.isFile()) continue;

      const route = (await import(routeURL)).default;
      if (typeof route.schema !== 'object') continue;
      app.route(route);
    }
  }

  done();
}
