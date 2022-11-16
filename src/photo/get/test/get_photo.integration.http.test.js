const { getTestServer } = require('@google-cloud/functions-framework/testing');
var gcs = require('@google-cloud/storage');
const supertest = require('supertest');
const sinon = require('sinon');
const assert = require('assert');
const { NONEXISTENT_FILE } = require('../rejectionReasons');
const { MockStorage } = require('../../../../test/helpers/gc_storage_mock');
const file = require('./mock/file');
const { token, tokenSub } = require('../../../../test/helpers/jwt_tokens');
const { bucketPrefix } = require('../../../../gcp');

require('../../../');

describe('getPhoto integration tests', () => {
  let storageStub;
  const gcsStoragePrototype = Object.getPrototypeOf(gcs.Storage);

  // don't actually use GCP, mock it out
  beforeEach(() => {
    // reset stub each time
    storageStub = sinon.stub().callsFake(() => {
      const mock = new MockStorage();

      // add a file to the storage bucket
      const bucket = mock.bucket(`${bucketPrefix}-${tokenSub}`);
      bucket.files[file.path] = file;

      return mock;
    });

    // mock out stub
    Object.setPrototypeOf(gcs.Storage, storageStub);
  });

  // undo sinon after each test
  afterEach(() => {
    sinon.restore();
    Object.setPrototypeOf(gcs.Storage, gcsStoragePrototype);
  });

  it('works with proper input', async () => {
    // send request to server
    const server = getTestServer('getPhoto');
    const res = await supertest(server)
      .get(`/${file.path}`)
      .set('Authorization', token)
      .send()
      .expect(200);

    // assert image details returned
    assert.equal(res.body.success, true, 'get image should be successful');
    assert.equal(
      res.body.url,
      `https://storage.cloud.google.com/${bucketPrefix}-${tokenSub}/${file.path}`,
      'the url should be accurate'
    );
  });

  it('errors with nonexistent file', async () => {
    // send request to server
    const server = getTestServer('getPhoto');
    const res = await supertest(server)
      .get('/nonexistent-url')
      .set('Authorization', token)
      .expect(404);

    // assert no file was found
    assert.equal(res.body.success, false, 'should return not successful');
    assert.equal(
      res.body.reason,
      NONEXISTENT_FILE,
      'the reason for failing should be nonexistent file'
    );
  });

  it('errors with nonexistent bucket', async () => {
    sinon.restore();
    storageStub = sinon.stub().callsFake(() => {
      return new MockStorage();
    });
    Object.setPrototypeOf(gcs.Storage, storageStub);

    // send request to server
    const server = getTestServer('getPhoto');
    const res = await supertest(server)
      .get('/nonexistent-url')
      .set('Authorization', token)
      .expect(404);

    // assert no file was found
    assert.equal(res.body.success, false, 'should return not successful');
    assert.equal(
      res.body.reason,
      NONEXISTENT_FILE,
      'the reason for failing should be nonexistent file'
    );
  });
});
