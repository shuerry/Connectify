import {
  createAnswer,
  createQuestion,
  goToAnswerQuestion,
  loginUser,
  setupTest,
  teardownTest,
} from "../support/helpers";

describe("Cypress Tests to verify adding new answers", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("1.1 | Created new answer should be displayed at the top of the answers page", () => {
    const answers = ["Test Answer 1", "Seeded answer"];
    const questionTitle = `Answer flow ${Date.now()}`;

    loginUser("user123");
    createQuestion(questionTitle, "Question body for answers page", "answers");

    goToAnswerQuestion(questionTitle);

    createAnswer(answers[0]);

    cy.get(".answerText").contains(answers[0]);
    cy.contains("user123");
    cy.contains("0 seconds ago");
  });

  it("1.2 | Answer is mandatory when creating a new answer", () => {
    const questionTitle = `Answer validation ${Date.now()}`;
    loginUser("user123");
    createQuestion(questionTitle, "Question body for validation", "answers");

    goToAnswerQuestion(questionTitle);

    cy.contains("Post Answer").click();
    cy.contains("Answer text cannot be empty");
  });
});
