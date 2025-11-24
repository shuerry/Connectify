// C.o.S.: Users can save their unpublished question as a draft

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

    cy.intercept("POST", "**/api/question/saveDraft").as("saveDraft");

    cy.contains(".reddit-btn", "Save Draft").click();
    cy.wait("@saveDraft").its("response.statusCode").should("eq", 201);

    cy.intercept("GET", "**/api/question/getUserDrafts*").as("getUserDrafts");
    cy.contains(".nav-item-text", "My Drafts", { timeout: 10000 }).click();
    cy.url().should("include", "/drafts");
    cy.wait("@getUserDrafts").its("response.statusCode").should("eq", 200);

    cy.contains(".draft-title", draftTitle, { timeout: 10000 })
      .should("be.visible")
      .closest(".draft-card")
      .within(() => {
        cy.contains(".draft-text", draftBody).should("be.visible");
        cy.contains(".draft-tags .tag", "drafttag").should("be.visible");
      });
  });
});
