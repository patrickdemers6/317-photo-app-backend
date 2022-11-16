/**
 * This serves as a mocked version of the GCP vision ImageAnnotatorClient.
 * It allows tests to occur offline and not interact with Google services.
 */
class MockImageAnnotatorClient {
  constructor() {}

  static async labelDetection() {
    return [
      {
        labelAnnotations: [
          {
            mid: '/m/01c8br',
            description: 'Street',
            score: 0.87294734,
            topicality: 0.87294734
          },
          {
            mid: '/m/06pg22',
            description: 'Snapshot',
            score: 0.8523099,
            topicality: 0.8523099
          },
          {
            mid: '/m/0dx1j',
            description: 'Town',
            score: 0.8481104,
            topicality: 0.8481104
          },
          {
            mid: '/m/01d74z',
            description: 'Night',
            score: 0.80408716,
            topicality: 0.80408716
          },
          {
            mid: '/m/01lwf0',
            description: 'Alley',
            score: 0.7133322,
            topicality: 0.7133322
          }
        ]
      }
    ];
  }
}

module.exports = {
  MockImageAnnotatorClient
};
