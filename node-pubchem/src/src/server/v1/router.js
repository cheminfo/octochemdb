
import router   from 'koa-router'();

router.get('/mfs/em', async (ctx) => {
  import search from '../../search/mfsFromEm.js';
  const result = await search(ctx.request.query.em, ctx.request.query);
  ctx.body = {
    result,
  };
});

router.get('/molecules/em', async (ctx) => {
  import search from '../../search/moleculesFromEm.js';
  const result = await search(ctx.request.query.em, ctx.request.query);
  ctx.body = {
    result,
  };
});

router.get('/molecules/mf', async (ctx) => {
  import search from '../../search/moleculesFromMf.js';
  const result = await search(ctx.request.query.mf, ctx.request.query);
  ctx.body = {
    result,
  };
});

router.get('/molecules/smiles', async (ctx) => {
  import search from '../../search/moleculesFromSmiles.js';
  const result = await search(ctx.request.query.smiles, ctx.request.query);
  ctx.body = {
    result,
  };
});

/*
router.get('/mfStats/search', async () => {
  this.body = {
    result: await api.mfStats.search(this.query)
  };
});
*/

/*
router.get('/mfStats/toc', () => {
  this.body = {
    result: await api.mfStats.toc(this.query)
  };
});
*/

export default router;
