// C.o.S.: Users can toggle notifications on a question they want to follow
import {
  loginUser,
  setupTest,
  teardownTest,
  waitForQuestionsToLoad,
} from "../support/helpers";

const QUESTION_TITLE = "How to properly handle async data fetching in React?";

describe("Toggle Question Notifications Feature", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("C.o.S. | User can toggle notifications on a question", () => {
    loginUser("user123");
    waitForQuestionsToLoad();

    cy.contains(".reddit-question-title", QUESTION_TITLE, { timeout: 10000 }).click();
    cy.url().should("match", /\/question\/[a-f\d]+/i);
    cy.contains(".reddit-post-title", QUESTION_TITLE, { timeout: 10000 }).should("be.visible");

    cy.get(".follow-btn", { timeout: 10000 }).as("followButton");
    cy.get("@followButton").find(".follow-text").should("contain", "Follow");

    (cy as any).intercept("POST", "**/api/question/followQuestion").as("toggleFollow");

    cy.get("@followButton").click();
    cy.wait("@toggleFollow").its("response.statusCode").should("eq", 200);

    cy.get("@followButton").click();
    cy.wait("@toggleFollow").its("response.statusCode").should("eq", 200);
    cy.get("@followButton").find(".follow-text").should("contain", "Follow");
  });
});
