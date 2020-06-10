const Page = require('./helpers/page');

let page; //page değişkenimizin Proxy classı ile oluşturduğumuz objeyi tutacak.

beforeEach(async () => {
  page = await Page.build();

  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.closeBrowser();
});

test('The header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo');

  expect(text).toEqual('Blogster');
});

test('clicking login starts oauth flow', async () => {
  await page.click('.right a');

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test('when logged in, shows logged out button', async () => {
  await page.login();

  const text = await page.getContentsOf('a[href="/auth/logout"]');

  expect(text).toEqual('Logout');
});

/**
 * Sadece bir tane testi çalıtırmak istiyorsak o test için test.only(..test komutları) şeklinde çalıştırmalıyız.
 */
