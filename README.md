# Photo Sharing App Backend

The backend of a photo sharing application.

Creates three GCP Cloud Functions.

# Functions
- Search - Search your uploaded images. Searches image content, description, and title.
- Create Photo - Create a new photo. Image must be included as base 64.
- Get Photo - get a photo based on it's ID.

# Authorization
To authenticate, you must use Google Cloud Oauth and include the credential as a Bearer token.

# Testing
To run tests, follow these steps:
1. `npm install`
2. `mocha './{,!(node_modules)/**}/*.test.js'`

This will execute over 50 tests that thoroughly verify the code's functionality. Unit, integration, and system tests are run. The system tests will fail without proper environment variables set.