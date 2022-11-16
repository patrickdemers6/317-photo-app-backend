const assert = require('assert');
const sinon = require('sinon');
const createPhoto = require('../index');
const {
  EMPTY_TYPE,
  EMPTY_TITLE,
  EMPTY_FILE,
  INVALID_TYPE,
  UNAUTHORIZED
} = require('../rejectionReasons');
const { tokenEmail } = require('../../../../test/helpers/jwt_tokens');

describe('createPhoto unit', () => {
  describe('validateFile', () => {
    it('returns success on valid input', async () => {
      const result = createPhoto.validateFile(validBody);
      assert.deepEqual(result, { success: true });
    });

    it('returns EMPTY_FILE when content is empty string', async () => {
      const result = createPhoto.validateFile({
        content: '',
        title: 'Example Title',
        type: 'image/jpeg'
      });
      assert.deepEqual(result, { success: false, reason: EMPTY_FILE });
    });

    it('returns EMPTY_FILE when content is undefined', async () => {
      const result = createPhoto.validateFile({
        title: 'Example Title',
        type: 'image/jpeg'
      });
      assert.deepEqual(result, { success: false, reason: EMPTY_FILE });
    });

    it('returns EMPTY_TITLE when title is undefined', async () => {
      const result = createPhoto.validateFile({
        content: 'content',
        type: 'image/jpeg'
      });
      assert.deepEqual(result, { success: false, reason: EMPTY_TITLE });
    });

    it('returns EMPTY_TITLE when title is empty', async () => {
      const result = createPhoto.validateFile({
        content: 'content',
        title: '',
        type: 'image/jpeg'
      });
      assert.deepEqual(result, { success: false, reason: EMPTY_TITLE });
    });

    it('returns EMPTY_TYPE when type is undefined', async () => {
      const result = createPhoto.validateFile({
        content: 'content',
        title: 'Test'
      });
      assert.deepEqual(result, { success: false, reason: EMPTY_TYPE });
    });

    it('returns EMPTY_TYPE when type is empty', async () => {
      const result = createPhoto.validateFile({
        content: 'content',
        title: 'Test',
        type: ''
      });
      assert.deepEqual(result, { success: false, reason: EMPTY_TYPE });
    });

    it('returns INVALID_TYPE when type is json', async () => {
      const result = createPhoto.validateFile({
        content: 'content',
        title: 'Test',
        type: 'application/json'
      });
      assert.deepEqual(result, { success: false, reason: INVALID_TYPE });
    });

    it('returns INVALID_TYPE when type is svg', async () => {
      const result = createPhoto.validateFile({
        content: 'content',
        title: 'Test',
        type: 'image/svg'
      });
      assert.deepEqual(result, { success: false, reason: INVALID_TYPE });
    });
  });

  describe('authentication', () => {
    it('fails with no authentication', () => {
      const mocks = getMocks();
      mocks.req.body = validBody;

      createPhoto.createPhoto(mocks.req, mocks.res);

      assert.equal(
        mocks.res.send.callCount,
        true,
        'res send should only be called once'
      );
      assert.equal(
        mocks.res.send.calledWith({ success: false, reason: UNAUTHORIZED }),
        true,
        'should send back unauthorized'
      );

      assert.equal(
        mocks.res.status.calledOnce,
        true,
        'res status should only be called once'
      );
      assert.equal(
        mocks.res.status.calledWith(401),
        true,
        'should send back status code 401'
      );
    });
  });

  describe('enableUnifermBucketLevelAccess', () => {
    it('sets metadata', () => {
      const setMetadata = sinon.stub();
      const bucket = { setMetadata };

      createPhoto.enableUniformBucketLevelAccess(bucket);
      assert.equal(setMetadata.calledOnce, true, 'setMetadata called once');
      assert.equal(
        setMetadata.firstCall.args[0]?.iamConfiguration
          ?.uniformBucketLevelAccess?.enabled,
        true,
        'uniform bucket level access enabled'
      );
    });
  });
  describe('addBucketIamMember', () => {
    it('updates binding', async () => {
      const policyStub = {
        bindings: {
          push: sinon.stub().returns()
        }
      };
      const bucket = {
        name: 'name',
        iam: {
          getPolicy: sinon
            .stub()
            .returns(new Promise((resolve) => resolve([policyStub]))),
          setPolicy: sinon.stub().returns(new Promise((resolve) => resolve()))
        }
      };

      await createPhoto.addBucketIamMember(bucket, tokenEmail);
      assert.equal(
        bucket.iam.getPolicy.calledOnce,
        true,
        'getPolicy called once'
      );
      assert.equal(
        bucket.iam.setPolicy.calledOnce,
        true,
        'setPolicy called once'
      );
      assert.equal(
        policyStub.bindings.push.calledOnceWith({
          role: 'roles/storage.objectViewer',
          members: [`user:${tokenEmail}`]
        }),
        true,
        'proper policy binding should be pushed'
      );
    });
  });
});

const validBody = {
  content: 'content',
  title: 'Example Title',
  type: 'image/jpeg'
};

const getMocks = () => {
  const headerStub = sinon.stub().onCall('Authorization').returns();

  const req = { body: {}, query: {}, header: headerStub };

  return {
    req,
    res: {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis()
    }
  };
};
