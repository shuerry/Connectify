// C.o.S.: Users can edit their questions after they are posted

import {
  createQuestion,
  loginUser,
  setupTest,
  teardownTest,
  waitForQuestionsToLoad,
} from "../support/helpers";

describe("Edit Question Feature", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("C.o.S. | User can edit their question after posting", () => {
    const originalTitle = `Editable question ${Date.now()}`;
    const updatedTitle = `${originalTitle} - updated`;
    const originalBody = "Original body for edit coverage.";
    const updatedBody = "Updated question body written during Cypress test.";

    loginUser("user123");
    createQuestion(originalTitle, originalBody, "cypress edit");

    waitForQuestionsToLoad();
    cy.contains(".reddit-question-title", originalTitle, { timeout: 10000 }).click();
    cy.url().should("match", /\/question\/[a-f\d]+/i);
    cy.contains(".reddit-post-title", originalTitle).should("be.visible");

    cy.get(".edit-question-btn", { timeout: 10000 }).click();
    cy.get(".edit-question-form").should("be.visible");

    cy.intercept("PUT", "**/api/question/editQuestion/*").as("editQuestion");

    cy.get("#edit-title").clear().type(updatedTitle);
    cy.get("#edit-text").clear().type(updatedBody);
    cy.get("#edit-tags").clear().type("editedtag1 editedtag2");

    cy.get(".edit-question-form")
      .contains("button", "Update Question")
      .should("not.be.disabled")
      .click();

    cy.wait("@editQuestion").its("response.statusCode").should("eq", 200);
    cy.get(".edit-question-form").should("not.exist");

    cy.contains(".reddit-post-title", updatedTitle, { timeout: 10000 }).should("be.visible");
    cy.contains(".answer_question_text", updatedBody).should("be.visible");
  });
});
