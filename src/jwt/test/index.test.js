const jwt = require('..');
const assert = require('assert');
const { invalidToken, token } = require('../../../test/helpers/jwt_tokens');

describe('jwt', () => {
  it('returns valid decode info', () => {
    const result = jwt(token);
    assert.deepEqual(
      result,
      {
        iss: 'https://accounts.google.com',
        nbf: 1667058944,
        aud: '396157439888-1skjn5ivt7l8u0dpenl02kf3s17nn2tv.apps.googleusercontent.com',
        sub: '110177814948114251935',
        email: 'patrickdemers6@gmail.com',
        email_verified: true,
        azp: '396157439888-1skjn5ivt7l8u0dpenl02kf3s17nn2tv.apps.googleusercontent.com',
        name: 'Patrick Demers',
        picture:
          'https://lh3.googleusercontent.com/a/ALm5wu0VD9b_4EU0BfBZny7loV0kEJJmEga22Tl2wKioT5o=s96-c',
        given_name: 'Patrick',
        family_name: 'Demers',
        iat: 1667059244,
        exp: 1667062844,
        jti: '5177892b1ab3044866710782f21ebb72f0a52c5a'
      },
      'The resulting jwt from decoding is incorrect.'
    );
  });

  it('null if no jwt', () => {
    const result = jwt();
    assert.equal(result, null);
  });

  it('null if empty jwt', () => {
    const result = jwt('');
    assert.equal(result, null);
  });

  it("null if start with ' earer '", () => {
    let modToken = ' ' + token.substring(1);
    const result = jwt(modToken);
    assert.equal(result, null);
  });

  it('null if invalid bearer', () => {
    const result = jwt(invalidToken);
    assert.equal(result, null);
  });
});
