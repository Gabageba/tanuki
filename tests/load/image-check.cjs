const assert = require('node:assert/strict');
const { buildSignedImageUrl } = require('/app/dist/img-proxy/sign.util');
const main = async () => {
  const request = (path) =>
    fetch(`http://web:8080${path}`, {
      headers: { cookie: 'tanuki_session=load-session-0' },
      signal: AbortSignal.timeout(5000),
    });
  const signed = (name) =>
    buildSignedImageUrl(process.env.IMG_SIGN_SECRET, 'acomics', `http://fixture:4080/${name}`);
  for (const path of [
    signed('oversized.jpg'),
    signed('compressed-large.jpg'),
    `${signed('image.jpg')}&w=1000000000&f=webp`,
  ]) {
    const response = await request(path);
    await response.arrayBuffer();
    assert.equal(response.status, 400);
  }
  const ready = await request('/api/v1/health/ready');
  assert.equal(ready.status, 200);
  await ready.arrayBuffer();
  console.log(
    'Oversized input, decompression overflow and excessive resize width rejected; API remains ready',
  );
};
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
