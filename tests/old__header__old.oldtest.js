const puppeteer = require('puppeteer');
const sessionFactory = require('./factory/sessionFactory');
const userFactory = require('./factory/userFactory');

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false,
  });

  page = await browser.newPage();

  await page.goto('http://localhost:3000');
}, 15000);

afterEach(async () => {
  await browser.close();
});

test('The header has the correct text', async () => {
  const text = await page.$eval('a.brand-logo', (el) => el.innerHTML);

  expect(text).toEqual('Blogster');
}, 15000);

test('clicking login starts oauth flow', async () => {
  await page.click('.right a');

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
}, 15000);

test.only('when logged in, shows logged out button', async () => {
  const user = await userFactory();
  const { session, sig } = sessionFactory(user);

  await page.setCookie({ name: 'session', value: session });
  await page.setCookie({ name: 'session.sig', value: sig });
  //Cookieleri oluşturarak kullanıcıyı giriş yapmış olarak saydık.
  await page.goto('http://localhost:3000');
  await page.waitFor('a[href="/auth/logout"]');

  const text = await page.$eval('a[href="/auth/logout"]', (el) => el.innerHTML);

  expect(text).toEqual('Logout');
}, 15000);

/**
 * Sadece bir tane testi çalıtırmak istiyorsak o test için test.only(..test komutları) şeklinde çalıştırmalıyız.
 */
