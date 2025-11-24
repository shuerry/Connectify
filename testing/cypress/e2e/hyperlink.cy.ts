import {
  loginUser,
  setupTest,
  teardownTest,
  createQuestion,
  goToAnswerQuestion,
  createAnswer,
  goToQuestions,
  verifyErrorMessage,
  goToAskQuestion,
} from "../support/helpers";

describe("Cypress Tests to verify adding hyperlinks to text", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("11.1 | Adds a question with a hyperlink and verifies markdown rendering", () => {
    loginUser("user123");

    // Create a question with a valid markdown link
    createQuestion(
      "How to add a hyperlink in Markdown?",
      "Here is a link: [Google](https://www.google.com)",
      "markdown",
    );

    // Navigate to the question to verify the hyperlink is rendered
    cy.contains(".reddit-question-title", "How to add a hyperlink in Markdown?").click();

    // Verify the markdown link is rendered as an HTML anchor tag
    cy.get("#questionBody")
      .find("a")
      .should("have.attr", "href", "https://www.google.com")
      .should("contain", "Google");
  });

  it("11.2 | Creates new answer with hyperlink and verifies it's displayed at the top", () => {
    loginUser("user123");

    const existingQuestion = `Existing question for hyperlinks ${Date.now()}`;
    createQuestion(existingQuestion, "Body for hyperlink answers", "markdown");

    // Add an answer with a hyperlink to the new question
    goToAnswerQuestion(existingQuestion);
    createAnswer(
      "Check this link for more info: [Documentation](https://docs.example.com)",
    );

    // Verify we're back on the answer page
    cy.url().should("include", "/question/");

    // Verify author and timestamp
    cy.get(".answer_author").first().should("contain", "user123");
    cy.get(".answer_question_meta").first().should("contain", "seconds ago");

    // Verify the existing seeded answer is still there
    cy.get(".answerText")
      .first()
      .should("contain", "Check this link for more info:");
    // Check that the hyperlink is rendered properly
    cy.get(".answerText")
      .first()
      .within(() => {
        cy.get("a").should("have.attr", "href", "https://docs.example.com");
        cy.get("a").should("contain", "Documentation");
      });
  });

  it("11.3 | Tries to add a question with invalid hyperlinks and verifies validation", () => {
    const invalidUrls = [
      "[Google](htt://www.google.com)", // Invalid protocol
      "[Microsoft](microsoft.com)", // Missing protocol
      "[](https://www.google.com/)", // Empty link text
      "[link]()", // Empty URL
      "[link](http://www.google.com/)", // Should be https
      "[Google](https//www.google.com)", // Missing colon
      "[GitHub](http//github.com)", // Missing colon
      "[Facebook](https:/facebook.com)", // Missing slash
    ];

    loginUser("user123");

    // Test each invalid URL
    invalidUrls.forEach((invalidUrl, index) => {
      goToAskQuestion();

      cy.get("#formTitleInput").type(
        `Test Question with Invalid Link ${index + 1}`,
      );
      cy.get("#formTextInput").type(`This is an invalid link: ${invalidUrl}`);
      cy.get("#formTagInput").type("markdown");
      cy.contains(".reddit-btn-primary", "Post").click();

      // Verify error message appears
      verifyErrorMessage("Invalid hyperlink format.");

      // Navigate away from the form to reset for next test
      goToQuestions();
    });

    // Verify no invalid questions were created
    cy.contains("Test Question with Invalid Link").should("not.exist");
  });

  it("11.5 | Adds multiple questions with valid hyperlinks and verifies all links work", () => {
    loginUser("user123");

    // List of questions with valid hyperlinks
    const questionsWithLinks = [
      {
        title: "JavaScript Resources",
        text: "Check out [MDN Documentation](https://developer.mozilla.org) for JavaScript info.",
        tag: "javascript",
        linkText: "MDN Documentation",
        linkUrl: "https://developer.mozilla.org",
      },
      {
        title: "React Learning Guide",
        text: "Start learning React at [React Official Site](https://reactjs.org)",
        tag: "react",
        linkText: "React Official Site",
        linkUrl: "https://reactjs.org",
      },
      {
        title: "Python Tutorial",
        text: "Learn Python from [Python.org](https://www.python.org/tutorial/)",
        tag: "python",
        linkText: "Python.org",
        linkUrl: "https://www.python.org/tutorial/",
      },
    ];

    // Create all questions
    questionsWithLinks.forEach((question) => {
      createQuestion(question.title, question.text, question.tag);
    });

    // Verify each question's hyperlink renders correctly
    questionsWithLinks.reverse().forEach((question) => {
      cy.contains(question.title).click();

      // Verify the hyperlink is rendered correctly
      cy.get(".questionBody")
        .find("a")
        .should("have.attr", "href", question.linkUrl)
        .should("contain", question.linkText);

      // Go back to questions list for next iteration
      goToQuestions();
    });
  });

  it("11.6 | Verifies hyperlinks in both questions and answers work correctly", () => {
    loginUser("user123");

    // Create a question with a hyperlink
    createQuestion(
      "Best Development Resources",
      "I recommend [Stack Overflow](https://stackoverflow.com) for getting help.",
      "resources",
    );

    // Add an answer with a different hyperlink to the same question
    goToAnswerQuestion("Best Development Resources");
    createAnswer(
      "Also check out [GitHub](https://github.com) for code repositories.",
    );

    // Verify both hyperlinks work correctly
    cy.get(".questionBody")
      .find("a")
      .should("have.attr", "href", "https://stackoverflow.com")
      .should("contain", "Stack Overflow");

    cy.get(".answerText")
      .first()
      .find("a")
      .should("have.attr", "href", "https://github.com")
      .should("contain", "GitHub");
  });
});
