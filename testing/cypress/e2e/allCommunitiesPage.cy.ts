import {
  goToCommunities,
  loginUser,
  setupTest,
  teardownTest,
  mockCommunitiesApi,
} from "../support/helpers";

const MOCK_COMMUNITIES = [
  {
    _id: "mock-community-1",
    name: "Mock React Enthusiasts",
    description: "Mock React community",
    participants: ["user123", "user234"],
  },
  {
    _id: "mock-community-2",
    name: "Mock Backend Masters",
    description: "Mock backend community",
    participants: ["user123"],
  },
  {
    _id: "mock-community-3",
    name: "Mock Data Science Hub",
    description: "Mock data community",
    participants: [],
  },
];

describe("Cypress Tests to verify display of all communities", () => {
  beforeEach(() => {
    setupTest();
    mockCommunitiesApi(MOCK_COMMUNITIES);
  });

  afterEach(() => {
    teardownTest();
  });

  it("4.1 | Displays all communities on the community page", () => {
    // login with seed data user
    loginUser("user123");

    // go to all communities page
    goToCommunities();

    // verify all communities are displayed
    cy.get(".community-card").should("have.length", MOCK_COMMUNITIES.length);
    MOCK_COMMUNITIES.forEach(community => {
      cy.contains(".community-card-title", community.name).should("exist");
    });
  });

  it("4.2 | Should search for a community", () => {
    loginUser("user123");
    goToCommunities();
    cy.get(".community-search").type(MOCK_COMMUNITIES[0].name);
    cy.get(".community-card").should("contain", MOCK_COMMUNITIES[0].name);
  });
});
