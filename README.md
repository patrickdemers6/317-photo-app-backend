# Photo Sharing App Backend

The backend of a photo sharing application.

Creates three GCP Cloud Functions.

# Functions
- Search (GET) - Search your uploaded images. Searches image content, description, and title. Only returns images you uploaded.
    - Add a url paremeter `q` with the query to search for. Use `*` to search for all images.

- Create Photo (POST) - Create a new photo. Image must be included as base 64.
    - `type`: the type of the image. Example: `image/jpeg`
    - `content`: The base64 content of the image.
    - `title`: the title of the image.
    - `description`: the description of the image.

- Get Photo (GET) - get a photo based on its ID. `{URL}/{image_id}`.

# Authorization
To authenticate, you must use Google Cloud Oauth and include the credential as a Bearer token.

# Testing
To run tests, follow these steps:
1. `npm install`
2. `npm run test`

This will execute over 50 tests that thoroughly verify the code's functionality. Unit, integration, and system tests are run. The system tests will fail without proper environment variables set.