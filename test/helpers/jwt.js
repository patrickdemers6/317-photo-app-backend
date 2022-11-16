const { JWT } = require('google-auth-library');

// the email of the service account to use for signed requests
exports.authorizedEmail =
  'patrick-dev-laptop@photo-app-317-test.iam.gserviceaccount.com';

// the sub of the service account
exports.sub = '107405436151016370379';

/**
 * Get a signed JWT that can be used to make requests to GCP.
 * @returns the signed JWT
 */
const getSignedJwt = async () => {
  const jwtToken = new JWT({
    email: this.authorizedEmail,
    key: process.env.PRIVATE_KEY || ''
  });
  return jwtToken.fetchIdToken(
    process.env.CLIENT_ID
  );
};

exports.default = getSignedJwt;
