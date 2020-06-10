const { Buffer } = require('safe-buffer');
const Keygrip = require('keygrip');
const keys = require('../../config/keys');

module.exports = (user) => {
  //   const id = '5edb91b293594b2d00187641';

  const sessionObject = {
    passport: {
      user: user.id.toString(), //toString yapmaz isek objectId olarak gelen veriyi string haline çevirmiş oluyoruz
    },
  };

  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');

  const keygrip = new Keygrip([keys.cookieKey]);
  const sig = keygrip.sign('session=' + session);
  //Bundan önce yapılan her şey authorization için göndereceğimiz bilgiiy hazırlamak içindi. JWT kullanılmadığı için bu yöntemle yapıldı.

  return {
    session,
    sig,
  };
};
