import fastifySwagger from 'fastify-swagger';

import { mfsFromEM } from './routes/compounds/mfsFromEM.js';
import { moleculesFromEM } from './routes/compounds/moleculesFromEM.js';
import { moleculesFromMF } from './routes/compounds/moleculesFromMF.js';
import { moleculesFromSmiles } from './routes/compounds/moleculesFromSmiles.js';

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
  app.route(moleculesFromEM);
  app.route(moleculesFromMF);
  app.route(moleculesFromSmiles);

  done();
}
