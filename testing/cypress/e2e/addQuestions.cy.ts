import {
  createQuestion,
  goToAskQuestion,
  loginUser,
  setupTest,
  teardownTest,
  verifyQuestionCount,
  verifyQuestionStats,
} from "../support/helpers";

describe("Cypress Tests to verify asking new questions", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("2.1 | Ask a Question creates and displays expected meta data", () => {
    loginUser("user123");

    createQuestion(
      "Test Question Q1",
      "Test Question Q1 Text T1",
      "javascript",
    );

    cy.get(".page-title").should("contain", "All Questions");
    cy.contains(".reddit-question-title", "Test Question Q1")
      .closest(".reddit-question-card")
      .within(() => {
        cy.get(".author-name").should("contain", "u/user123");
        cy.get(".post-time").should("contain", "seconds ago");
      });
    cy.contains(".reddit-question-title", "Test Question Q1")
      .closest(".reddit-question-card")
      .within(() => {
        cy.get(".reddit-action-btn").first().should("contain", "Comments");
        cy.get(".views-count").should("contain", "views");
      });
    cy.contains("Unanswered").click();
    cy.get(".reddit-question-title").should("have.length.at.least", 1);
  });

  it("2.2 | Ask a Question with empty title shows error", () => {
    loginUser("user123");

    goToAskQuestion();
    cy.get("#formTextInput").type("Test Question 1 Text Q1");
    cy.get("#formTagInput").type("javascript");
    cy.contains(".reddit-btn-primary", "Post").click();

    cy.contains("Title cannot be empty");
  });
});
