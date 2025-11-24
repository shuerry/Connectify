import {
  goToCollection,
  goToMyCollections,
  loginUser,
  setupTest,
  teardownTest,
  verifyCollectionExists,
  verifyCollectionPageDetails,
  mockCollectionsApi,
} from "../support/helpers";

const MOCK_COLLECTION = {
  _id: "mock-collection-2",
  name: "Mock Favorites Detail",
  description: "Mock description for collection detail page",
  username: "user123",
  questions: [
    {
      title: "Mock Detail Question",
      text: "Mock question body for detail page",
    },
  ],
};

describe("Cypress Tests to verify viewing of a specific collection page", () => {
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

  it("5.1 | Displays the collection page after clicking on an existing collection in the my collections page", () => {
    loginUser("user123");

    goToMyCollections();

    cy.get(".collections-title").should("contain", "Collections");

    // Verify some pre-seeded collections appear
    verifyCollectionExists(MOCK_COLLECTION.name);

    goToCollection(MOCK_COLLECTION.name);

    verifyCollectionPageDetails(MOCK_COLLECTION.name, "user123");
  });
});
