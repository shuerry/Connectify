import {
  goToAskQuestion,
  loginUser,
  setupTest,
  teardownTest,
} from "../support/helpers";

describe("Profanity filter prevents offensive submissions", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("Blocks question submission when banned words are present", () => {
    cy.intercept("POST", "**/api/question/addQuestion", () => {
      throw new Error("Profanity filter should stop posts before submitting.");
    });

    loginUser("user123");
    goToAskQuestion();

    cy.get("#formTitleInput").type("Why is this title allowed?");
    cy.get("#formTextInput").type("This body says shit and should be rejected.");
    cy.get("#formTagInput").type("react");
    cy.contains(".reddit-btn-primary", "Post").click();

    cy.contains(".modal-title", "Profanity Filter Alert").should("be.visible");
    cy.contains(".modal-container", "shit").should("be.visible");
    cy.get(".close-btn").click();
    cy.get(".modal-container").should("not.exist");
    cy.url().should("include", "/new/question");
  });
});

