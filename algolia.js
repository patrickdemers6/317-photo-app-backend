/**
 * Exports the Algolia index associated with this project.
 */

const algoliasearch = require('algoliasearch');

// Connect and authenticate with Algolia
const client = algoliasearch(
  process.env.ALGOLIA_PROJECT,
  process.env.ALGOLIA_API_KEY
);

const index = client.initIndex(process.env.ALGOLIA_INDEX);

module.exports = index;
