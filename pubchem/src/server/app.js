import { randomUUID } from 'crypto';

import fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifySensible from 'fastify-sensible';

import setupV1 from './index.js';

function genReqId(req) {
  return req.headers['x-cloud-trace-context'] || randomUUID();
}

export function createApp(options) {
  const app = fastify({
    genReqId,
    ...options,
  });

  app.register(fastifyCors, {
    maxAge: 86400,
  });
  app.register(fastifySensible);

  app.get('/', (_, reply) => {
    reply.redirect('/documentation');
  });

  app.register(setupV1, { prefix: '/' });

  return app;
}
