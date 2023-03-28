import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import fastifyCors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastify from 'fastify';

import v1 from './v1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastifyServer = fastify({
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

fastifyServer.register(fastifyCors, {
  maxAge: 86400,
});
fastifyServer.register(fastifySensible);

fastifyServer.get('/', (_, reply) => {
  reply.redirect('/documentation');
});

fastifyServer.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'Search a copy of pubchem database',
      description: ``,
      version: '1.0.0',
    },
    produces: ['application/json'],
  },
});
fastifyServer.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
});
fastifyServer.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/public/', // optional: default '/'
});

fastifyServer.addHook('onRegister', (instance) => {
  // eslint-disable-next-line no-console
  console.log(instance.getSchema());
});

fastifyServer.register(v1);

await fastifyServer.ready();
fastifyServer.swagger();

fastifyServer.listen(
  {
    port: process.env.PORT ? Number(process.env.PORT) : 11015,
    host: '0.0.0.0',
  },
  (err) => {
    if (err) {
      fastifyServer.log.error(err);
      process.exit(1);
    }
  },
);
