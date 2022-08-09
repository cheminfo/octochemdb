import { createApp } from './app.js';

const app = createApp({
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
});

app.listen(
  {
    port: process.env.PORT ? Number(process.env.PORT) : 11015,
    host: '0.0.0.0',
  },
  (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  },
);
