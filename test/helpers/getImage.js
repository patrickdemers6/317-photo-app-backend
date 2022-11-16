const fs = require('fs');

/**
 * Get an image from test/images/ in base64.
 * @param {*} name a file name from test/images/
 * @returns the base64 encoded content of the image
 */
const getImage = (name) => {
  const imagePath = __dirname + `/../images/${name}`;
  return fs.readFileSync(imagePath, { encoding: 'base64' });
};

module.exports = getImage;
