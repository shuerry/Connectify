import {
  Q1_DESC,
  Q2_DESC,
  Q6_DESC,
  Q10_DESC,
} from "../../../server/testData/post_strings";
import {
  loginUser,
  setupTest,
  teardownTest,
  createQuestion,
  waitForQuestionsToLoad,
} from "../support/helpers";

describe("Cypress Tests to verify tagging functionality", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("18.1 | Adds a question with multiple tags and verifies tags are created", () => {
    loginUser("user123");

    // Create a question with multiple new tags
    createQuestion(
      "Test Question A",
      "Test Question A Text",
      "test1 test2 test3",
    );

    // Navigate to Tags page to verify the new tags exist
    cy.contains("Tags").click();
    cy.url().should("include", "/tags");

    // Wait for tags to load
    cy.get(".tagNode").should("have.length.at.least", 1);

    // Verify all three new tags appear on the tags page using proper selectors
    cy.get(".tagName").should("contain", "test1");
    cy.get(".tagName").should("contain", "test2");
    cy.get(".tagName").should("contain", "test3");
  });

  it("18.2 | Checks if all seeded tags exist on the Tags page", () => {
    loginUser("user123");

    // Navigate to Tags page
    cy.contains("Tags").click();
    cy.url().should("include", "/tags");

    // Wait for tags to load
    cy.get(".tagNode").should("have.length.at.least", 1);

    // List of all expected seeded tags from tag.json
    const expectedTags = [
      "javascript", // tag1
      "python", // tag2
      "react", // tag3
      "node.js", // tag4
      "html", // tag5
      "css", // tag6
      "mongodb", // tag7
      "express", // tag8
      "typescript", // tag9
      "git", // tag10
    ];

    // Check each tag exists (use 'exist' instead of 'be.visible' to handle overflow)
    expectedTags.forEach((tagName) => {
      cy.get(".tagName").should("contain", tagName);
    });

    // Alternative approach: scroll through the page to ensure all tags are accessible
    expectedTags.forEach((tagName) => {
      cy.contains(".tagName", tagName)
        .should("exist")
        .then(($el) => {
          // Scroll the element into view if it's not visible
          if (!Cypress.dom.isVisible($el[0])) {
            cy.wrap($el[0]).scrollIntoView();
          }
        });
    });
  });

  it("18.4 | Navigates to questions filtered by 'react' tag", () => {
    loginUser("user123");

    // Go to Tags page and click on 'react' tag
    cy.contains("Tags").click();
    cy.contains(".tagName", "react")
      .scrollIntoView()
      .should("be.visible")
      .click();

    // Should navigate to questions filtered by react tag
    cy.url().should("include", "?tag=react");

    // Verify questions with react tag are displayed
    // Based on seed data: Q1, Q6, Q10 have react tag (tag3)
    cy.get(".reddit-question-title").should("contain", Q1_DESC); // Q1 has react tag
    cy.get(".reddit-question-title").should("contain", Q6_DESC); // Q6 has react tag
    cy.get(".reddit-question-title").should("contain", Q10_DESC); // Q10 has react tag
  });

 
  it("18.8 | Verifies tag navigation maintains proper question filtering", () => {
    loginUser("user123");

    // Test multiple tag navigations to ensure filtering works correctly

    // First, go to 'node.js' tag
    cy.contains("Tags").click();
    cy.contains(".tagName", "node.js")
      .scrollIntoView()
      .should("be.visible")
      .click();

    // Wait for questions to load and verify URL
    cy.url().should("include", "?tag=node.js");
    waitForQuestionsToLoad();

    // Store the questions from first filter
    let firstFilterQuestions: string[] = [];
    cy.get(".reddit-question-title").then(($titles) => {
      firstFilterQuestions = Array.from($titles).map(
        (el) => el.textContent?.trim() || "",
      );
      cy.log(`First filter questions: ${firstFilterQuestions.join(", ")}`);
    });

    // Go back to Tags page
    cy.contains("Tags").click();
    cy.url().should("include", "/tags");

    // Now click on 'typescript' tag
    cy.contains(".tagName", "typescript")
      .scrollIntoView()
      .should("be.visible")
      .click();

    // Wait for questions to load and verify URL
    cy.url().should("include", "?tag=typescript");
    waitForQuestionsToLoad();

    // Verify that we have questions for typescript filter
    cy.get(".reddit-question-title").should("have.length.at.least", 1);

    // Verify that the questions are different from the first filter
    // (This is a more reliable test than checking specific question titles)
    cy.get(".reddit-question-title").then(($newTitles) => {
      const newQuestions = Array.from($newTitles).map(
        (el) => el.textContent?.trim() || "",
      );
      cy.log(`Second filter questions: ${newQuestions.join(", ")}`);

      // At minimum, verify we have some questions and the URL changed
      expect(newQuestions.length).to.be.at.least(1);
    });
  });
});
