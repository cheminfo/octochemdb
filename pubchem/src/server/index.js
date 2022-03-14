import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import fastifyStatic from 'fastify-static';
import fastifySwagger from 'fastify-swagger';

import { recursiveDir } from '../utils/recursiveDir.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function setupV1(app, _, done) {
  app.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Search a copy of pubchem database',
        description: ``,
        version: '1.0.0',
      },
    },
    exposeRoute: true,
  });

  app.register(fastifyStatic, {
    root: join(__dirname, 'public'),
    prefix: '/public/', // optional: default '/'
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
