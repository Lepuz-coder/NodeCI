const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.closeBrowser();
});

//Descripe test kümelerinin belirli bir tema altında toplanmasını ve içeride kullanılan beforeEach gibi methodların sadece o describe'ın
//içinde bulunan testlere uygulanmasını sağlar
describe('Giriş yapıldığında', async () => {
  beforeEach(async () => {
    await page.login('blogs');
    await page.click('.fixed-action-btn');
  });

  test('blog olusturma formunu görebilme', async () => {
    await page.waitForSelector('.red[href="/blogs"]');

    const text = await page.getContentsOf('.red[href="/blogs"]');

    expect(text).toEqual('Cancel');
  });

  describe('Ve geçerli verileri inputa koyduğumuzda', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'My Title');
      await page.type('.content input', 'My content');
      await page.click('form button.teal.btn-flat');
    });

    test('Submit butonuna tıklama önizleme sayfasına götürür', async () => {
      const text = await page.getContentsOf('h5');

      expect(text).toEqual('Please confirm your entries');
    });

    test('Tekrar submit edildiğinde blogların sayfasına götürür', async () => {
      await page.click('.green');
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('My Title');
      expect(content).toEqual('My content');
    });
  });

  //Error mesajlarının doğru bir şekilde gözüküp gözükmediğine bakıyor
  describe('Ve geçersiz verileri inputa koyduğumuzda', async () => {
    beforeEach(async () => {
      await page.click('form button.teal.btn-flat');
    });

    //İnput verileri boş gönderildiğinde error mesajları doğru geliyor mu diye kontrol ediyor.
    test('Form error mesajı gösterir', async () => {
      const titleError = await page.getContentsOf('div.red-text');
      const contentError = await page.getContentsOf('.content div.red-text');

      expect({ titleError, contentError }).toMatchObject({
        titleError: 'You must provide a value',
        contentError: 'You must provide a value',
      });
    });
  });
});

describe('Kullanici giris yapmadiginda', async () => {
  let actions = [
    {
      method: 'post',
      path: '/api/blogs',
      data: {
        title: 'My Title',
        content: 'My content',
      },
    },
    {
      method: 'get',
      path: '/api/blogs',
    },
  ];

  //Kullanici giris yapmadıysa blog olusturamamalı
  // test('Kullanici blog olusturamaz', async () => {
  //   const res = await page.post('/api/blogs', {
  //     title: 'My Title',
  //     content: 'My content',
  //   });

  //   expect(res).toMatchObject({ error: 'You must log in!' });
  // });

  // //Kullanıcı giriş yapmadıysa blogları görmemeli
  // test('Kullanici blogları göremez', async () => {
  //   const res = await page.get('/api/blogs');

  //   expect(res).toMatchObject({ error: 'You must log in!' });
  // });

  test('Yapamayacağı actionlar ', async () => {
    const results = await page.execActions(actions);

    results.forEach((el) => {
      expect(el).toMatchObject({ error: 'You must log in!' });
    });
  });
});
