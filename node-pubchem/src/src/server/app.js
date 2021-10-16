import { randomUUID } from 'crypto';

import fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifySensible from 'fastify-sensible';

import setupV1 from './v1/index.js.js';

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

  app.get('/', function (_, reply) {
    reply.redirect('/v1/documentation');
  });

  app.register(setupV1, { prefix: '/v1' });

  return app;
}
