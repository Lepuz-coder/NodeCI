const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');
const keys = require('../config/keys');

// const redisUrl = 'redis://127.0.0.1:6379';

const client = redis.createClient(keys.redisUrl);
client.hget = promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this._cache = true;
  this.hashKey = JSON.stringify(options.key || '');
  //hget, hset
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this._cache) return await exec.apply(this, arguments);

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  //See if we have the 'key' in redis
  const cacheValue = await client.hget(this.hashKey, key);

  //If we do return that
  if (cacheValue) {
    console.log('Server in redis ');
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
    /**Bunu yapmamızın sebebi mongoose'un find methodunu kullandığımızda sonuç olarak bizden bir model bekleyecektir. Biz de bunu yaparak
     * Querynin çalıştırıldığı modeli içini redis bilgileriyle doldurarak çalıştırıyoruz.
     *
     * new Blog({
     *  title:'hi',
     * content:'There'
     * })
     *
     * Demek gibi birşeydir.
     *
     * Array ise teker teker map ile tekrar array olarak döndürmemizin sebebi her bir elemanın döndürülen belirli modelin elemanı olarak
     * belirmek içindir.
     * Model olarak belirtmezisek find ile veri bulunduktan sonra bu veri üzerine değişiklik yapamayız ve mongoose bunun yapılıyor olmasını
     * düşündüğü için otomatik olarak hata verir.
     */
  }

  //Otherwise, issue that query and save it into redis

  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result));

  return result;
};

module.exports = {
  clearHash: (hashKey) => {
    client.del(JSON.stringify(hashKey)); //Verilen keye sahip değeri redis'ten silecek.
  },
};
