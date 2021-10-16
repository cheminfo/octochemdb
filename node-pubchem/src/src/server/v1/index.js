import fastifySwagger from 'fastify-swagger';

import { mfsFromEM } from './routes/compounds/mfsFromEM.js';
import { compoundsFromEM } from './routes/compounds/compoundsFromEM.js';
import { compoundsFromMF } from './routes/compounds/compoundsFromMF.js';
import { compoundsFromSmiles } from './routes/compounds/compoundsFromSmiles.js';

export default function setupV1(app, _, done) {
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

  app.route(mfsFromEM);
  app.route(compoundsFromEM);
  app.route(compoundsFromMF);
  app.route(compoundsFromSmiles);

  done();
}
