const puppeteer = require('puppeteer');
const sessionFactory = require('../factory/sessionFactory');
const userFactory = require('../factory/userFactory');

class PageExtras {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      //Eğer ki kendi local makinemizde çalıştıracaksan bunu false yapmak mantıklı,
      //fakat travis gibi bir yerde bu testler çalışacaksa true olmalı
      args: ['--no-sandbox'], //Traviste çalıştırılırken daha hızlı olmasını sağlamak için bu ayarı ekledik
    });

    const page = await browser.newPage();
    const pageExtras = new PageExtras(page, browser);

    return new Proxy(pageExtras, {
      get: function (target, property) {
        return target[property] || page[property] || browser[property];
      },
    });
  }

  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
  }

  async closeBrowser() {
    await this.browser.close();
  }

  async closePage() {
    await this.page.close();
  }

  async login(toPage) {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto(`http://localhost:3000/${toPage}`);
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return await this.page.$eval(selector, (el) => el.innerHTML);
  }

  async basitEvaluate(method, path, data = undefined) {
    return await this.page.evaluate(
      (method, data, path) => {
        let options = {
          method,
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        data ? (options.body = JSON.stringify(data)) : '';

        return fetch(path, options).then((res) => res.json());
      },
      method,
      data,
      path
    );
  }

  async get(path) {
    const res = await this.basitEvaluate('GET', path);
    return res;
  }

  async post(path, data) {
    const res = await this.basitEvaluate('POST', path, data);
    return res;
  }

  async execActions(actions) {
    return Promise.all(
      actions.map(({ path, method, data }) => {
        return this[method](path, data);
      })
    );
  }
}

module.exports = PageExtras;
