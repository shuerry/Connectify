// C.o.S.: Users can save their unpublished question as a draft

/// <reference types="cypress" />

import {
  goToAskQuestion,
  loginUser,
  setupTest,
  teardownTest,
  waitForQuestionsToLoad,
} from "../support/helpers";

describe("Draft Question Feature", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("C.o.S. | User can save an unpublished question as a draft", () => {
    const draftTitle = `Drafted question ${Date.now()}`;
    const draftBody = "Body for draft verification via Cypress.";
    const draftTags = "drafttag cypresstag";

    loginUser("user123");
    waitForQuestionsToLoad();
    goToAskQuestion();
    cy.url().should("include", "/new/question");

    cy.get("#formTitleInput").clear().type(draftTitle);
    cy.get("#formTextInput").clear().type(draftBody);
    cy.get("#formTagInput").clear().type(draftTags);

    // Network stub removed: was cy.intercept for saveDraft

    cy.contains(".reddit-btn", "Save Draft").click();
    // cy.wait("@saveDraft").its("response.statusCode").should("eq", 201); // removed with intercept

    // Network stub removed: was cy.intercept for getUserDrafts
    cy.contains(".nav-item-text", "My Drafts", { timeout: 10000 }).click();
    cy.url().should("include", "/drafts");
    // cy.wait("@getUserDrafts").its("response.statusCode").should("eq", 200); // removed with intercept

    cy.contains(".draft-title", draftTitle, { timeout: 10000 })
      .should("be.visible")
      .closest(".draft-card")
      .within(() => {
        cy.contains(".draft-text", draftBody).should("be.visible");
        cy.contains(".draft-tags .tag", "drafttag").should("be.visible");
      });
  });
});
