import fastifySwagger from 'fastify-swagger';

const hasPort = process.argv.indexOf('--port');
if (hasPort === -1) throw new Error('missing port option');
const PORT = parseInt(process.argv[hasPort + 1]);
if (!PORT) throw new Error(`wrong port option: ${process.argv[hasPort + 1]}`);

const app = new Koa();

app.use(kcors());
app.use(router.routes());
app.use(staticKoa(`${__dirname}/staticPages`, {}));

app.listen(PORT);
