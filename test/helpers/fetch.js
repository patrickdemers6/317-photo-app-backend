const nodeFetch = require('node-fetch');
const AbortController = require('abort-controller');
const jwt = require('./jwt').default;

/**
 * Send an authorized or unauthorized request.
 * @returns the Response from fetching
 */
const fetch = async (url, options = {}, authorized = true) => {
  // the abort controller causes the request to timeout after 8 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 8000);

  // construct the request options
  let opt = {
    ...options,
    headers: {
      Authorization: `Bearer ${await jwt()}`,
      ...options.headers
    },
    signal: controller.signal
  };

  // if we are not authorized, remove the Authorization header
  if (!authorized) delete opt.headers.Authorization;

  const response = await nodeFetch(url, opt);

  // if we made it here, we did not timeout
  // clear the AbortController's timout
  clearTimeout(timeout);

  return response;
};

module.exports = fetch;
