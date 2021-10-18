import { readdir, lstat } from 'fs/promises';
import { join } from 'path';

import fastifySwagger from 'fastify-swagger';

import { recursiveDir } from './recursiveDir.js';

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
    app.route(route);
  }

  done();
}
