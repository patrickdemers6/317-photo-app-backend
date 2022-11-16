const assert = require('assert');
const sinon = require('sinon');
const { search } = require('..');
const { token } = require('../../../../test/helpers/jwt_tokens');
const { MISSING_QUERY, UNAUTHORIZED } = require('../rejectionReasons');

describe('search unit tests', () => {
  it('rejects with no query', async () => {
    const req = {
      query: {},
      header: sinon.stub().returns(token)
    };
    const res = {
      send: sinon.stub(),
      status: sinon.stub()
    };
    await search(req, res);

    assert.equal(res.status.lastCall.args[0], 400, 'returns status code 400');
    assert.equal(
      res.send.calledOnceWith({ success: false, reason: MISSING_QUERY }),
      true,
      'return unsuccessful due to missing query'
    );
  });
  it('rejects with no auth', () => {
    const req = {
      query: {
        q: 'test'
      },
      header: sinon.stub().returns(null)
    };
    const res = {
      send: sinon.stub(),
      status: sinon.stub()
    };
    search(req, res);

    assert.equal(res.status.lastCall.args[0], 401, 'returns status code 401');
    assert.equal(
      res.send.calledOnceWith({ success: false, reason: UNAUTHORIZED }),
      true,
      'return unsuccessful due no authorization'
    );
  });
});
