/**
 * These mocked classes allow the code to interact with a fake version of GCP.
 * In this way, test cases are able to run offline.
 */

class MockStorage {
  constructor() {
    this.buckets = {};
  }

  bucket(name) {
    return this.buckets[name] || (this.buckets[name] = new MockBucket(name));
  }
}

class MockBucket {
  name;
  metadata;
  files;

  constructor(name) {
    this.name = name;
    this.files = {};
    this.metadata = {};
  }
  deleteFiles() {
    return Promise.resolve();
  }

  delete() {
    return Promise.resolve();
  }

  getFiles() {
    return new Promise((resolve) => {
      resolve([Object.values(this.files)]);
    });
  }

  exists() {
    return [true];
  }

  file(path) {
    return this.files[path] || (this.files[path] = new MockFile(path, this));
  }

  setMetadata(metadata) {
    this.metadata = metadata;
  }
}

class MockFile {
  path;
  contents;
  metadata;
  name;
  parent;

  constructor(path, parent) {
    this.path = path;
    this.name = path;
    this.parent = parent;
    this.contents = new Buffer.alloc(0);
    this.metadata = {};
  }

  getSignedUrl() {
    return [this.path];
  }

  publicUrl() {
    return [this.path];
  }

  get() {
    return [this, this.metadata];
  }

  setMetadata(metadata) {
    const customMetadata = { ...this.metadata.metadata, ...metadata.metadata };
    this.metadata = { ...this.metadata, ...metadata, metadata: customMetadata };
  }

  getMetadata() {
    return new Promise((resolve) => {
      resolve([this.metadata]);
    });
  }

  createReadStream() {
    const streamBuffers = require('stream-buffers');
    const readable = new streamBuffers.ReadableStreamBuffer();
    readable.put(this.contents);
    readable.stop();
    return readable;
  }

  createWriteStream({ metadata }) {
    this.setMetadata(metadata);
    const streamBuffers = require('stream-buffers');
    const writable = new streamBuffers.WritableStreamBuffer();
    writable.on('finish', () => {
      this.contents = writable.getContents();
    });
    return writable;
  }

  delete() {
    delete this.parent.files[this.path];
    return Promise.resolve();
  }

  exists() {
    return this.contents.length != 0;
  }
}

module.exports = {
  MockStorage,
  MockFile,
  MockBucket
};
