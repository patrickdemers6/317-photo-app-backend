const { MockFile } = require('../../../../../test/helpers/gc_storage_mock');
const getImage = require('../../../../../test/helpers/getImage');

const file = new MockFile('d7190e05-5dc6-4640-8823-38f9c5da700b');
file.contents = new Buffer.from(getImage('ocean.jpg'), 'base64');

module.exports = file;
