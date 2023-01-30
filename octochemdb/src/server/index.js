import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import fastifyCors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import Fastify from 'fastify';

import v1 from './v1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({
  logger: {
    transport: process.env.LOGGER_PRETTY_PRINT
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  ajv: {
    customOptions: {
      strict: false,
    },
  },
});

fastify.register(fastifyCors, {
  maxAge: 86400,
});
fastify.register(fastifySensible);

fastify.get('/', (_, reply) => {
  reply.redirect('/documentation');
});

fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'Search a copy of pubchem database',
      description: ``,
      version: '1.0.0',
    },
  },
  exposeRoute: true,
});

fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/public/', // optional: default '/'
});

fastify.addHook('onRegister', (instance, opts) => {
  console.log(instance.getSchema());
});

fastify.register(v1);

await fastify.ready();
fastify.swagger();

fastify.listen(
  {
    port: process.env.PORT ? Number(process.env.PORT) : 11015,
    host: '0.0.0.0',
  },
  (err) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  },
);
