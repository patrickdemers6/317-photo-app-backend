const functions = require('@google-cloud/functions-framework');
const index = require('../../../algolia');
const {
  MISSING_QUERY,
  ALGOLIA_ERROR,
  UNAUTHORIZED
} = require('./rejectionReasons');
const decodeProfile = require('../../jwt/');
const { bucketPrefix } = require('../../../gcp');

exports.search = async (req, res) => {
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
      'exiting early due to UNAUTHORIZED (401). user profile decoded to null'
    );
    console.log(
      `received Authorization header: ${req.header('Authorization')}`
    );
    res.status(401);
    res.send({ success: false, reason: UNAUTHORIZED });
    return;
  }

  // verify valid query
  const searchQuery = req.query.q;
  console.info(`searching with query ${searchQuery}`);
  if (!searchQuery) {
    console.log('exiting early due to MISSING_QUERY (400)');
    res.status(400);
    res.send({ success: false, reason: MISSING_QUERY });
    return;
  }

  // search and send result
  try {
    console.info(
      `searching '${searchQuery}' for email ${userProfile.email.toLowerCase()}`
    );
    const { hits } = await index.search(searchQuery, {
      filters: `email:${userProfile.email.toLowerCase()}`
    });
    console.info(`recieved ${hits.length} results`);
    console.info(
      `resulting IDs: ${hits.map((hit) => hit.objectID).join(', ')}`
    );

    res.send({
      success: true,
      data: hits.map((hit) => ({
        id: hit.objectID,
        title: hit.title,
        description: hit.description,
        url: `https://storage.cloud.google.com/${bucketPrefix}-${userProfile.sub}/${hit.objectID}`
      }))
    });
  } catch (e) {
    console.error('something weth wrong fetching hits from algolia');
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
    console.error('\t' + e.stack);

    res.status(502);
    res.send({ success: false, reason: ALGOLIA_ERROR });
  }
};

functions.http('search', this.search);
