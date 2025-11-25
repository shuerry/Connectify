/// <reference types="cypress" />

import {
  createAnswer,
  createQuestion,
  goToAnswerQuestion,
  goToQuestions,
  loginUser,
  setupTest,
  teardownTest,
} from "../support/helpers";

const buildMockQuestion = (title: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  _id: overrides._id || `mock-${title.replace(/\s+/g, "-")}`,
  title,
  text: "Mock question body",
  tags: [{ _id: "mock-tag", name: "mock" }],
  askedBy: "user123",
  askDateTime: overrides.askDateTime || new Date().toISOString(),
  answers: [],
  comments: [],
  views: overrides.views || [],
  followers: [],
});

describe("Cypress Tests to verify order of questions displayed", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('10.1 | Adds three questions and one answer, then click "Questions", then click unanswered button, verifies the sequence', () => {
    loginUser("user123");

    createQuestion("Test Question A", "Test Question A Text", "javascript");

    createQuestion("Test Question B", "Test Question B Text", "javascript");

    createQuestion("Test Question C", "Test Question C Text", "javascript");

    goToAnswerQuestion("Test Question A");

    createAnswer("Answer Question A");

    goToQuestions();

    // clicks unanswered
    cy.contains("Unanswered").click();
    const qTitles = ["Test Question C", "Test Question B"];
    cy.get(".reddit-question-title").eq(0).should("contain", qTitles[0]);
    cy.get(".reddit-question-title").eq(1).should("contain", qTitles[1]);
  });

  it("10.2 | Check if questions are displayed in descending order of dates.", () => {
    const newestQuestions = [
      buildMockQuestion("Newest Question C", { askDateTime: "2024-01-03T00:00:00.000Z" }),
      buildMockQuestion("Newest Question B", { askDateTime: "2024-01-02T00:00:00.000Z" }),
      buildMockQuestion("Newest Question A", { askDateTime: "2024-01-01T00:00:00.000Z" }),
    ];
    cy.intercept("GET", /\/api\/question\/getQuestion\?order=newest.*/, req => {
      req.reply(newestQuestions);
    }).as("mockNewest");
    loginUser("user123");
    cy.wait("@mockNewest");
    cy.get(".reddit-question-title").each(($el, index) => {
      if (index >= newestQuestions.length) {
        return false;
      }
      cy.wrap($el).should("contain", newestQuestions[index].title);
    });
  });

  it("10.3 | successfully shows all questions in model in most viewed order", () => {
    const mostViewed = [
      buildMockQuestion("Most Viewed Question 1", { views: ["a", "b", "c", "d"] }),
      buildMockQuestion("Most Viewed Question 2", { views: ["a", "b", "c"] }),
      buildMockQuestion("Most Viewed Question 3", { views: ["a", "b"] }),
    ];
    cy.intercept("GET", /\/api\/question\/getQuestion\?order=mostViewed.*/, req => {
      req.reply(mostViewed);
    }).as("mockMostViewed");
    loginUser("user123");

    cy.contains("Most Viewed").click();
    cy.wait("@mockMostViewed");
    cy.get(".reddit-question-title").each(($el, index) => {
      if (index >= mostViewed.length) {
        return false;
      }
      cy.wrap($el).should("contain", mostViewed[index].title);
    });
  });
});
