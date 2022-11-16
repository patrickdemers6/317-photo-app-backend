/**
 * The prefix that should be used for all GCP buckets. Changed based on the environment.
 */
exports.bucketPrefix =
  process.env.NODE_ENV === 'test'
    ? 'test-user-image-storage'
    : 'user-image-storage';
