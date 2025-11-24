import {
  setupTest,
  teardownTest,
  loginUser,
  logoutUser,
  createQuestion,
  waitForQuestionsToLoad,
} from "../support/helpers";

describe("Post Visibility Controls", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("C.o.S. | Authors can block specific users from viewing their posts", () => {
    const questionTitle = `Visibility control ${Date.now()}`;

    loginUser("user123");
    createQuestion(questionTitle, "Body for visibility testing.", "privacy");
    waitForQuestionsToLoad();
    cy.contains(".reddit-question-title", questionTitle).should("exist");

    cy.visit("http://localhost:4530/users");
    cy.contains(".user", "user234", { timeout: 10000 })
      .as("userCard")
      .within(() => {
        cy.contains("Block").click();
      });
    cy.get("@userCard").contains(".user-status.blocked", "Blocked").should("be.visible");

    logoutUser();
    loginUser("user234", "strongP@ss234");
    waitForQuestionsToLoad();
    cy.get("#searchBar").type(`${questionTitle}{enter}`);
    cy.contains(".empty-state-title", "No Questions Found", { timeout: 10000 }).should(
      "be.visible",
    );
  });
});

