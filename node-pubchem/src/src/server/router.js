'use strict';

const router = require('koa-router')();

router.get('/mfs/em', async (ctx) => {
  const search = require('../search/mfsFromEm');
  const result = await search(ctx.request.query.em, ctx.request.query);
  ctx.body = {
    result,
  };
});

router.get('/molecules/em', async (ctx) => {
  const search = require('../search/moleculesFromEm');
  const result = await search(ctx.request.query.em, ctx.request.query);
  ctx.body = {
    result,
  };
});

router.get('/molecules/mf', async (ctx) => {
  const search = require('../search/moleculesFromMf');
  const result = await search(ctx.request.query.mf, ctx.request.query);
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

module.exports = router;
