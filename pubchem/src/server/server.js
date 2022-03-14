import { createApp } from './app.js';

const app = createApp({
  logger: { prettyPrint: Boolean(process.env.LOGGER_PRETTY_PRINT) },
});

app.listen(process.env.PORT || 11015, '0.0.0.0', (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
