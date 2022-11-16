const supertest = require('supertest');
const { getTestServer } = require('@google-cloud/functions-framework/testing');
const sinon = require('sinon');
const algoliaData = require('../../../../test/helpers/algolia');
const assert = require('assert');
const index = require('../../../../algolia');
const {
  MISSING_QUERY,
  ALGOLIA_ERROR,
  UNAUTHORIZED
} = require('../rejectionReasons');
const { token, tokenEmail } = require('../../../../test/helpers/jwt_tokens');

require('../../../');

describe('search integration tests', () => {
  let algoliaStub;

  // don't actually use GCP, mock it out
  beforeEach(() => {
    // reset stub each time
    algoliaStub = sinon
      .stub(index, 'search')
      .returns(algoliaData.singleHitSearchResponse);
  });

  // undo sinon after each test
  afterEach(() => {
    sinon.restore();
  });

  it('searches given valid query', async () => {
    // send request to server
    const server = getTestServer('search');
    const res = await supertest(server)
      .get('/?q=tiger')
      .send()
      .set('Authorization', token)
      .expect(200);

    assert.equal(res.body.success, true, 'Response should be successful.');
    assert.equal(res.body.data.length, 1, 'One result should be returned.');
    assert.equal(
      res.body.data[0].id,
      algoliaData.singleHitSearchResponse.hits[0].objectID,
      'object id should be same as what was in database'
    );
    assert.equal(
      algoliaStub.calledOnceWith('tiger', { filters: `email:${tokenEmail}` }),
      true,
      'algolia search called with valid params'
    );
  });

  it('handles search failure', async () => {
    sinon.restore();
    algoliaStub = sinon.stub(index, 'search').throws(Error);

    // send request to server
    const server = getTestServer('search');
    const res = await supertest(server)
      .get('/?q=tiger')
      .set('Authorization', token)
      .send()
      .expect(502);

    assert.equal(res.body.success, false, 'Response should be successful.');
    assert.equal(
      res.body.reason,
      ALGOLIA_ERROR,
      'Failure reason should be algolia error'
    );
  });

  it('fails with no query', async () => {
    // send request to server
    const server = getTestServer('search');
    const res = await supertest(server)
      .get('/')
      .set('Authorization', token)
      .send()
      .expect(400);

    assert.equal(res.body.success, false, 'Response should fail.');
    assert.equal(
      res.body.reason,
      MISSING_QUERY,
      'Reason should be missing query.'
    );
  });

  it('fails with no auth', async () => {
    // send request to server
    const server = getTestServer('search');
    const res = await supertest(server).get('/?q=test').send().expect(401);

    assert.equal(res.body.success, false, 'Response should fail.');
    assert.equal(
      res.body.reason,
      UNAUTHORIZED,
      'Reason should be unauthorized.'
    );
  });
});
