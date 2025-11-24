import {
  goToMyCollections,
  loginUser,
  setupTest,
  teardownTest,
  verifyCollectionExists,
  mockCollectionsApi,
} from "../support/helpers";

const MOCK_COLLECTION = {
  _id: "mock-collection-1",
  name: "Mock React Favorites",
  description: "Mock collection for Cypress tests",
  questions: [
    {
      title: "Mock Question",
    },
  ],
};

describe("Cypress Tests to verify viewing all collections", () => {
  beforeEach(() => {
    setupTest();
    mockCollectionsApi({
      ownerUsername: "user123",
      collections: [MOCK_COLLECTION],
    });
  });

  afterEach(() => {
    teardownTest();
  });

  it("3.1 | Displays the exisitng collections in the My Collections Page", () => {
    loginUser("user123");

    goToMyCollections();

    cy.get(".collections-title").should("contain", "Collections");

    verifyCollectionExists(MOCK_COLLECTION.name);
  });
});
