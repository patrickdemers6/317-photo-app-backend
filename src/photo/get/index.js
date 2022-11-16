const functions = require('@google-cloud/functions-framework');
var gcs = require('@google-cloud/storage');
const { bucketPrefix } = require('../../../gcp');

const decodeProfile = require('../../jwt/');
const { NONEXISTENT_FILE, UNAUTHORIZED } = require('./rejectionReasons');

const getPhoto = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', '*');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  const userProfile = decodeProfile(req.header('Authorization'));
  if (userProfile == null) {
    // this should never happen. Cloud Function should reject unauthorized before it even gets here
    console.log(
      'exiting early due to UNAUTHORIZED (401). user profile decoded to null.'
    );
    console.log(
      `received Authorization header: ${req.header('Authorization')}`
    );
    res.status(401);
    res.send({ success: false, reason: UNAUTHORIZED });
    return;
  }

  const storage = new gcs.Storage();

  const bucket = storage.bucket(`${bucketPrefix}-${userProfile.sub}`);
  console.info(
    `using GCP storage bucket: '${bucketPrefix}-${userProfile.sub}'`
  );

  let bucketExist = (await bucket.exists())[0];
  if (!bucketExist) {
    console.log(
      `the bucket does not exist. exiting with reason ${NONEXISTENT_FILE} (404)`
    );
    res.status(404);
    res.send({ success: false, reason: NONEXISTENT_FILE });
    return;
  }

  const file = bucket.file(req.path.substr(1));
  const fileExist = await file.exists();
  if (!fileExist) {
    console.log(
      `the file '${req.path.substr(
        1
      )}' does not exist in bucket '${bucketPrefix}-${userProfile.sub}'`
    );
    console.log(`exiting early with reason ${NONEXISTENT_FILE} (404)`);
    res.status(404);
    res.send({ success: false, reason: NONEXISTENT_FILE });
    return;
  }

  console.info('about to fetch metadata');
  const [metadata] = await file.getMetadata();
  console.info(`fetched metadata: ${JSON.stringify(metadata)}`);

  const resBody = {
    success: true,
    url: `https://storage.cloud.google.com/${bucketPrefix}-${userProfile.sub}/${file.name}`,
    created: metadata.timeCreated,
    title: metadata.title,
    description: metadata.description
  };
  console.log(`returning successfully with body: ${JSON.stringify(resBody)}`);

  res.send(resBody);
};

functions.http('getPhoto', getPhoto);
