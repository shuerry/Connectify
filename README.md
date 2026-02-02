https://cs4530-f25-509-6v2m.onrender.com/

## Getting Started

Run `npm install` in the root directory to install all dependencies for the `client`, `server`, and `shared` folders.

Refer to the user manual for further instructions related to setting environment variables and running the client and server.



## Cypress Tests

Cypress tests are end-to-end tests that can help verify your implementation.

### Setup Instructions

1. Navigate to the `testing` directory:

   ```sh
   cd testing
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the `testing/` directory with the following content:

   ```
   MONGODB_URI=mongodb://127.0.0.1:27017
   ```

4. Make sure that both the server and client are already running

5. Run Cypress tests:

   ```sh
   npx cypress open
   ```

6. In the Cypress UI that opens:
   - Select _E2E Testing_
   - Choose your browser (Chrome is preferred)
   - Click on any of the test files to run it
   - If any of the tests fail, you should be able to see the exact sequence of steps that led to the failure.

> [!NOTE]
> Running Cypress tests is optional. Cypress tests require significant system resources, and without them, the tests may be flaky. We will use these tests for grading.
