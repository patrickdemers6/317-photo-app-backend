const functions = require('@google-cloud/functions-framework');
var gcs = require('@google-cloud/storage');
const vision = require('@google-cloud/vision');
const { v4: uuid } = require('uuid');
var stream = require('stream');

const {
  EMPTY_FILE,
  EMPTY_TITLE,
  EMPTY_TYPE,
  INVALID_TYPE,
  UNAUTHORIZED,
  ALGOLIA_ERROR,
  GCP_ERROR
} = require('./rejectionReasons');
const index = require('../../../algolia');
const decodeProfile = require('../../jwt/');
const { bucketPrefix } = require('../../../gcp');

// used for cloud vision
const client = new vision.v1.ImageAnnotatorClient();

// only accept jpeg, png, and gif images
const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];

/**
 * Checks for file content and title.
 *
 * @param {any} file contains details of file
 * @returns if successful, and if false a reason
 */
exports.validateFile = (file) => {
  const fail = (reason) => ({ success: false, reason });

  if (!file.content) return fail(EMPTY_FILE);

  if (!file.title) return fail(EMPTY_TITLE);

  if (!file.type) return fail(EMPTY_TYPE);

  if (!acceptedFileTypes.includes(file.type)) return fail(INVALID_TYPE);

  return { success: true };
};

/**
 * Gets labels from Google Vision for the given image.
 * @param {*} imageContent base64 endcoded image
 * @returns labels
 */
const getLabels = async (imageContent) => {
  const [result] = await client.labelDetection(
    Buffer.from(imageContent, 'base64')
  );
  return result.labelAnnotations;
};

exports.createPhoto = async (req, res) => {
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

  const validationResult = this.validateFile(req.body);
  if (!validationResult.success) {
    console.log(
      `exiting early due to request body validation failed. (reason=${validationResult.reason}, code=400)`
    );
    res.status(400);
    res.send(validationResult);
    return;
  }

  let file;
  try {
    console.info('before write file to cloud');
    file = await writeFileToCloud(
      req.body.content,
      userProfile,
      req.body.type,
      req.body.title
    );
    console.info('successfully wrote to cloud');
  } catch (e) {
    console.error('exiting early - error writing to the cloud:');
    console.error(
      '\tname: ' +
        e.name +
        ' message: ' +
        e.message +
        ' at: ' +
        e.at +
        ' text: ' +
        e.text
    );
    res.status(502);
    res.send({ success: false, reason: GCP_ERROR });
    return;
  }

  let labels = [];
  try {
    console.info('before get labels from google cloud vision');
    labels = await getLabels(req.body.content);
    console.info('successfully got labels from google cloud vision');
  } catch (e) {
    console.warn('error getting labels; saving to algolia with labels=[]');
    console.warn(
      '\tname: ' +
        e.name +
        ' message: ' +
        e.message +
        ' at: ' +
        e.at +
        ' text: ' +
        e.text
    );
    // labels are an empty array since failed to get them. okay to proceed
  }

  try {
    const objectToSave = {
      objectID: file.name,
      title: req.body.title,
      labels: labels.map((label) => label.description),
      email: userProfile.email.toLowerCase()
    };
    console.info('about to save object to algolia. content:', objectToSave);
    await index.saveObject(objectToSave);
    console.info('successfully saved object to algolia');
  } catch (e) {
    console.error('error saving to algolia');
    console.error(
      '\tname: ' +
        e.name +
        ' message: ' +
        e.message +
        ' at: ' +
        e.at +
        ' text: ' +
        e.text
    );

    // if we don't save to algolia, unable to search
    // very problematic so delete image and return error
    console.log(`deleting file ${file.name} since saving to algolia failed.`);
    file.delete();
    console.log(`file ${file.name} deleted`);

    res.status(502);
    res.send({ success: false, reason: ALGOLIA_ERROR });
    return;
  }

  res.send({
    success: true,
    fileName: file.name,
    url: `https://storage.cloud.google.com/${bucketPrefix}-${userProfile.sub}/${file.name}`
  });
};

const writeFileToCloud = async (image, userProfile, imageType, title) => {
  const storage = new gcs.Storage();
  const bucketName = `${bucketPrefix}-${userProfile.sub}`;
  let bucket = storage.bucket(bucketName);
  if (!(await bucket.exists())[0]) {
    console.info(`creating bucket '${bucketName}' since it does not exist`);
    [bucket] = await storage.createBucket(`${bucketName}`, {
      regional: 'US-CENTRAL1',
      standard: true,
      multiRegional: false
    });
    await this.enableUniformBucketLevelAccess(bucket);
    await this.addBucketIamMember(bucket, userProfile.email);
  } else {
    console.info(`bucket '${bucketName}' already exists. no need to create.`);
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(image, 'base64'));

  const fileName = uuid();
  const file = bucket.file(fileName);
  console.info(`create file '${fileName}' in bucket '${bucketName}'`);
  return new Promise((resolve, reject) => {
    bufferStream
      .pipe(
        file.createWriteStream({
          metadata: {
            contentType: imageType
          },
          validation: 'md5'
        })
      )
      .on('error', (e) => {
        console.error(`error saving file ${file.name}`);
        console.error(
          '\tname: ' +
            e.name +
            ' message: ' +
            e.message +
            ' at: ' +
            e.at +
            ' text: ' +
            e.text
        );
        reject(e);
      })
      .on('finish', async () => {
        await file.setMetadata({ title });
        resolve(file);
      });
  });
};

exports.addBucketIamMember = async (bucket, email) => {
  const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });

  // Adds the new roles to the bucket's IAM policy
  const role = 'roles/storage.objectViewer';
  let members;
  if (email.endsWith('iam.gserviceaccount.com')) {
    members = [`serviceAccount:${email}`];
  } else {
    members = [`user:${email}`];
  }
  policy.bindings.push({
    role,
    members
  });

  // Updates the bucket's IAM policy
  await bucket.iam.setPolicy(policy);

  // logging
  console.log(
    `Added the following member(s) with role ${role} to ${bucket.name}:`
  );
  members.forEach((member) => {
    console.log(`  ${member}`);
  });
};

exports.enableUniformBucketLevelAccess = async (bucket) => {
  await bucket.setMetadata({
    iamConfiguration: {
      uniformBucketLevelAccess: {
        enabled: true
      }
    }
  });

  console.log(`Uniform bucket-level access was enabled for ${bucket.name}.`);
};

functions.http('createPhoto', this.createPhoto);
