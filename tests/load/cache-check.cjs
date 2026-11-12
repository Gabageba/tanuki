const assert = require('node:assert/strict');
const Redis = require('/app/node_modules/ioredis');

const main = async () => {
  const rate = new Redis(process.env.REDIS_URL);
  const cache = new Redis(process.env.CACHE_REDIS_URL);
  try {
    if (process.env.CACHE_CHECK_VERIFY) {
      assert.equal(await rate.get('ratelimit:load:protected'), '7');
      assert.equal(await rate.get('cache:load:legacy'), null);
      console.log('Legacy cache removed; existing rate-limit counter preserved');
      return;
    }
    await rate.set('ratelimit:load:protected', '7', 'EX', 900);
    await rate.set('cache:load:legacy', 'disposable');
    for (let i = 0; i < 1024; i += 1) {
      await cache.set(`cache:load:budget:${i}`, 'x'.repeat(64 * 1024), 'EX', 60);
    }
    const field = (info, key) => Number(info.match(new RegExp(`^${key}:(\\d+)`, 'm'))?.[1]);
    const memory = await cache.info('memory');
    const stats = await cache.info('stats');
    assert.equal(field(memory, 'maxmemory'), 32 * 1024 * 1024);
    assert.ok(field(memory, 'used_memory') < 34 * 1024 * 1024);
    assert.ok(field(stats, 'evicted_keys') > 0);
    assert.equal(await rate.get('ratelimit:load:protected'), '7');
    console.log(
      JSON.stringify({
        cacheUsedBytes: field(memory, 'used_memory'),
        evictedKeys: field(stats, 'evicted_keys'),
        rateLimitCounter: 7,
      }),
    );
  } finally {
    await Promise.all([rate.quit(), cache.quit()]);
  }
};
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
