const { Storage } = require('@google-cloud/storage');
const fetch = require('../../../test/helpers/fetch');
const getImage = require('../../../test/helpers/getImage');
const assert = require('assert');
const { bucketPrefix } = require('../../../gcp');
const index = require('../../../algolia');
const { v4 } = require('uuid');
const { authorizedEmail, sub } = require('../../../test/helpers/jwt');

/**
 * System tests which interact with real Google Cloud Platform services.
 */
describe('system test (long runtime)', () => {

  /**
   * Creates an image, searches for it, and gets it.
   * Uses the getPhoto, createPhoto, and search endpoints.
   * @param {*} storage the GCP Storage instance to use for checking results
   */
  const createSearchGet = async (storage) => {
    // create image test
    const title = 'Ocean View';
    const createImageResult = await fetch(process.env.CREATE_PHOTO_TEST_URL, {
      method: 'post',
      body: JSON.stringify({
        content: getImage('ocean.jpg'),
        type: 'image/jpeg',
        title
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const body = await createImageResult.json();
    let bucket = storage.bucket(`${bucketPrefix}-${sub}`);
    console.log(`bucket: ${bucketPrefix}-${sub}`);
    console.log(`bucket contents: ${await bucket.getFiles()}`);
    const filesInBucket = (await bucket.getFiles())[0];
    console.log({ filesInBucket });
    assert.equal(filesInBucket.length, 1, 'one file should be in the bucket');
    const expectedUrl = `https://storage.cloud.google.com/${bucketPrefix}-${sub}/${filesInBucket[0].name}`;
    assert.equal(body.success, true, 1, 'the request should be successful');
    assert.equal(
      (await bucket.exists())[0],
      true,
      'the new bucket should exist'
    );
    assert.equal(filesInBucket.length, 1, 'one file should exist');
    assert.equal(
      body.fileName,
      filesInBucket[0].name,
      1,
      'the returned file name and storage bucket file names should be identical'
    );
    assert.equal(
      body.url,
      expectedUrl,
      1,
      'the correct url should be returned'
    );

    // wait for algolia to add to index
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // search test
    const searchResult = await fetch(`${process.env.SEARCH_TEST_URL}/?q=water`);

    const searchResultBody = await searchResult.json();
    console.log({ searchResultBody });
    assert.equal(searchResultBody.success, true, 'search should succeed');
    assert.equal(
      searchResultBody.data.length,
      1,
      'one record should be returned from search'
    );
    assert.equal(
      searchResultBody.data[0].title,
      title,
      'returned record title should be correct from search'
    );
    assert.equal(
      searchResultBody.data[0].id,
      body.fileName,
      'correct file name should be returned from search'
    );

    // getPhoto test
    const getPhotoResult = await fetch(
      `${process.env.GET_PHOTO_TEST_URL}/${body.fileName}`
    );
    const getPhotoBody = await getPhotoResult.json();
    console.log({ getPhotoBody });

    assert.equal(
      getPhotoBody.success,
      true,
      'getting photo should be successful'
    );
    assert.equal(
      getPhotoBody.url,
      expectedUrl,
      'the returned url should be accurate'
    );
  };
  it('creates bucket, saves to storage, adds to algolia', async () => {
    const storage = new Storage();
    let bucket = storage.bucket(`${bucketPrefix}-${sub}`);

    // if the bucket exists, delete all files in it and delete bucket
    if ((await bucket.exists())[0]) {
      const [files] = await bucket.getFiles();
      for (const file of files) {
        await file.delete();
      }
      await bucket.delete();
    }

    // clear algolia index
    await index.clearObjects();

    // test createPhoto, search, and getPhoto
    await createSearchGet(storage);
  }).timeout(40000);

  it('search yields results from correct email address', async () => {
    // setup algolia with two records
    await index.clearObjects();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const saveObjects = [
      {
        objectID: 1,
        title: 'Title 1',
        labels: ['label1'],
        email: 'test@example.com'
      },
      {
        objectID: 2,
        title: 'Ocean',
        labels: ['water'],
        email: authorizedEmail
      }
    ];
    console.log(saveObjects);
    for (const toSave of saveObjects) {
      await index.saveObject(toSave);
    }

    // wait for algolia to finish indexing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // search using cloud function
    const result = await fetch(`${process.env.SEARCH_TEST_URL}/?q=*`);

    // asert successful request
    assert.equal(result.status, 200, 'search should yield 200 status code');
    const resultBody = await result.json();

    // asert the content of body was as expected
    assert.equal(resultBody.success, true, 'search should yield successful');
    assert.equal(
      resultBody.data.length,
      1,
      'only the one record from `authorizedEmail` should be returned'
    );
    assert.equal(
      resultBody.data[0].title,
      saveObjects[1].title,
      'the saved record title should be as expected'
    );

    // empty the algolia index for future tests
    await index.clearObjects();
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }).timeout(40000);

  describe('reject unauthorized', () => {
    it('create photo', async () => {
      // creating a photo without auth fails
      const title = 'Example title';
      const result = await fetch(
        process.env.CREATE_PHOTO_TEST_URL,
        {
          method: 'post',
          body: JSON.stringify({
            content: getImage('ocean.jpg'),
            type: 'image/jpeg',
            title
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        },
        false
      );
      assert.equal(result.status, 403, 'Should be 403 (Forbidden) status code');
      console.log(result.body);
    }).timeout(10000);

    it('get photo', async () => {
      // getting a photo without auth fails
      const result = await fetch(
        `${process.env.GET_PHOTO_TEST_URL}/${v4()}`,
        {},
        false
      );
      assert.equal(result.status, 403, 'Should be 403 (Forbidden) status code');
      console.log(result.body);
    }).timeout(10000);

    it('search photo', async () => {
      // searching a photo without auth fails
      const result = await fetch(
        `${process.env.SEARCH_TEST_URL}/?q=test`,
        {},
        false
      );
      assert.equal(result.status, 403, 'Should be 403 (Forbidden) status code');
      console.log(result.body);
    }).timeout(10000);
  });
});
