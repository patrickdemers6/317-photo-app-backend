const supertest = require('supertest');
const { getTestServer } = require('@google-cloud/functions-framework/testing');
const sinon = require('sinon');
var gcs = require('@google-cloud/storage');
var gcv = require('@google-cloud/vision');
const index = require('../../../../algolia');

const assert = require('assert');
const {
  EMPTY_FILE,
  EMPTY_TITLE,
  INVALID_TYPE,
  UNAUTHORIZED,
  ALGOLIA_ERROR
} = require('../rejectionReasons');
const { MockStorage } = require('../../../../test/helpers/gc_storage_mock');
const {
  MockImageAnnotatorClient
} = require('../../../../test/helpers/gc_vision_mock');
const getImage = require('../../../../test/helpers/getImage');
const {
  token,
  invalidToken,
  tokenSub
} = require('../../../../test/helpers/jwt_tokens');
const { bucketPrefix } = require('../../../../gcp');

require('../../../');

const bucket = `${bucketPrefix}-${tokenSub}`;

describe('createPhoto integration tests (regular mocking)', () => {
  let storageStub, visionStub, algoliaStub;
  let storagePrototype = Object.getPrototypeOf(gcs.Storage);
  let imageAnnotatorPrototype = Object.getPrototypeOf(
    gcv.v1.ImageAnnotatorClient
  );

  // don't actually use GCP, mock it out
  beforeEach(() => {
    // reset stub each time
    storageStub = sinon.stub().callsFake(() => new MockStorage());

    visionStub = sinon
      .stub(gcv.v1, 'ImageAnnotatorClient')
      .returns(new MockImageAnnotatorClient());
    sinon
      .stub(gcv.v1.ImageAnnotatorClient.prototype, 'labelDetection')
      .returns(MockImageAnnotatorClient.labelDetection());
    algoliaStub = sinon.stub(index, 'saveObject');

    // mock out stub
    Object.setPrototypeOf(gcs.Storage, storageStub);
    Object.setPrototypeOf(gcv.v1.ImageAnnotatorClient, visionStub);
  });

  // undo sinon after each test
  afterEach(() => {
    sinon.restore();
    Object.setPrototypeOf(gcs.Storage, storagePrototype);
    Object.setPrototypeOf(gcv.v1.ImageAnnotatorClient, imageAnnotatorPrototype);
  });

  it('works with proper input', async () => {
    // read image in from disc as base 64
    const image = getImage('tiger.jpg');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'Tiger', type: 'image/jpeg' })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(200);

    // assert return values and objects created on server
    assert.equal(res.body.success, true, 'upload image should be successful');
    assert.equal(
      Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)
        .length,
      1,
      'One file should have been created.'
    );
    assert.equal(
      Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)[0],
      res.body.fileName,
      'The name of created file should be returned in body.'
    );
    const uploadedFileContents =
      storageStub.firstCall.returnValue.buckets[bucket].files[
        Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)[0]
      ].contents.toString('base64');
    assert.equal(
      uploadedFileContents,
      image,
      'The contents of created file should be identical to image sent to server.'
    );
    assert.equal(
      algoliaStub.calledOnce,
      true,
      'Algolia saveObject should have been called exactly once.'
    );
  });

  it('fails with invalid image type', async () => {
    // read image in from disc as base 64
    const image = getImage('example_pdf.pdf');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'Name', type: 'application/pdf' })
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(400);

    // assert return values and objects created on server
    assert.equal(res.body.success, false, 'upload image should fail');
    assert.equal(
      res.body.reason,
      INVALID_TYPE,
      'upload image should fail due to invalid image type'
    );
  });

  it('errors with empty file', async () => {
    // read image in from disc as base 64
    const image = '';

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'Ocean', type: 'image/jpeg' })
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(400);

    // assert return values and objects created on server
    assert.equal(res.body.success, false, 'should return not successful');
    assert.equal(
      res.body.reason,
      EMPTY_FILE,
      'the reason for failing should be the empty file'
    );
    assert.equal(
      storageStub.callCount,
      0,
      'no storage should have been created.'
    );
  });

  it('errors with no title', async () => {
    // read image in from disc as base 64
    const image = getImage('ocean.jpg');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: '', type: 'image/jpeg' })
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(400);

    // assert return values and objects created on server
    assert.equal(res.body.success, false, 'should return not successful');
    assert.equal(
      res.body.reason,
      EMPTY_TITLE,
      'the reason for failing should be the empty title'
    );
    assert.equal(
      storageStub.callCount,
      0,
      'no storage should have been created.'
    );
  });

  it('errors with no auth', async () => {
    // read image in from disc as base 64
    const image = getImage('ocean.jpg');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'test', type: 'image/jpeg' })
      .set('Content-Type', 'application/json')
      .expect(401);

    // assert return values and objects created on server
    assert.equal(res.body.success, false, 'should return not successful');
    assert.equal(
      res.body.reason,
      UNAUTHORIZED,
      'the reason for failing should be the empty title'
    );
    assert.equal(
      storageStub.callCount,
      0,
      'no storage should have been created.'
    );
  });

  it('errors with invalid auth', async () => {
    // read image in from disc as base 64
    const image = getImage('ocean.jpg');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'test', type: 'image/jpeg' })
      .set('Content-Type', 'application/json')
      .set('Authorization', invalidToken)
      .expect(401);

    // assert return values and objects created on server
    assert.equal(res.body.success, false, 'should return not successful');
    assert.equal(
      res.body.reason,
      UNAUTHORIZED,
      'the reason for failing should be the empty title'
    );
    assert.equal(
      storageStub.callCount,
      0,
      'no storage should have been created.'
    );
  });
});

describe('createPhoto with throws', () => {
  const ogStoragePrototype = Object.getPrototypeOf(gcs.Storage);
  const ogImageAnnotatorPrototype = Object.getPrototypeOf(
    gcv.v1.ImageAnnotatorClient
  );
  // undo mocks after each test
  afterEach(() => {
    sinon.restore();
    Object.setPrototypeOf(gcs.Storage, ogStoragePrototype);
    Object.setPrototypeOf(
      gcv.v1.ImageAnnotatorClient,
      ogImageAnnotatorPrototype
    );
  });

  it('handles google cloud vision failure', async () => {
    // mock out environment
    let storageStub = sinon.stub().callsFake(() => new MockStorage());
    let visionStub = sinon
      .stub(gcv.v1, 'ImageAnnotatorClient')
      .returns(new MockImageAnnotatorClient());
    sinon
      .stub(gcv.v1.ImageAnnotatorClient.prototype, 'labelDetection')
      .throws(Error);
    let algoliaStub = sinon.stub(index, 'saveObject');
    Object.setPrototypeOf(gcs.Storage, storageStub);
    Object.setPrototypeOf(gcv.v1.ImageAnnotatorClient, visionStub);

    // read image in from disc as base 64
    const image = getImage('tiger.jpg');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'Tiger', type: 'image/jpeg' })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(200);

    // assert on response
    assert.equal(res.body.success, true, 'upload image should be successful');

    // assert on stubs
    assert.equal(
      Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)
        .length,
      1,
      'One file should have been created.'
    );
    assert.equal(
      Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)[0],
      res.body.fileName,
      'The name of created file should be returned in body.'
    );
    const uploadedFileContents =
      storageStub.firstCall.returnValue.buckets[bucket].files[
        Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)[0]
      ].contents.toString('base64');
    assert.equal(
      uploadedFileContents,
      image,
      'The contents of created file should be identical to image sent to server.'
    );
    assert.equal(
      algoliaStub.calledOnce,
      true,
      'Algolia saveObject should have been called exactly once.'
    );
  });

  it('handles algolia failure', async () => {
    // mock out environment
    let storageStub = sinon.stub().callsFake(() => new MockStorage());
    let visionStub = sinon
      .stub(gcv.v1, 'ImageAnnotatorClient')
      .returns(new MockImageAnnotatorClient());
    sinon
      .stub(gcv.v1.ImageAnnotatorClient.prototype, 'labelDetection')
      .returns(MockImageAnnotatorClient.labelDetection());
    let algoliaStub = sinon.stub(index, 'saveObject').throws(Error);
    Object.setPrototypeOf(gcs.Storage, storageStub);
    Object.setPrototypeOf(gcv.v1.ImageAnnotatorClient, visionStub);

    // read image in from disc as base 64
    const image = getImage('tiger.jpg');

    // send request to server
    const server = getTestServer('createPhoto');
    const res = await supertest(server)
      .post('/')
      .send({ content: image, title: 'Tiger', type: 'image/jpeg' })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(502);

    // assert failure response
    assert.equal(res.body.success, false, 'upload image should fail');
    assert.equal(
      res.body.reason,
      ALGOLIA_ERROR,
      'should have failed due to algolia'
    );

    // assert on stubs
    assert.equal(
      algoliaStub.calledOnce,
      true,
      'Algolia saveObject should have been called exactly once.'
    );
    assert.equal(
      Object.keys(storageStub.firstCall.returnValue.buckets[bucket].files)
        .length,
      0,
      'The one file should have been deleted.'
    );
  });
});
