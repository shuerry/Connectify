import {
  loginUser,
  logoutUser,
  setupTest,
  teardownTest,
} from "../support/helpers";

const REPORTER_USERNAME = "user123";

type QuestionMeta = { _id: string; title: string; askedBy: string };

const normalizeQuestions = (payload: unknown): QuestionMeta[] => {
  if (Array.isArray(payload)) {
    return payload as QuestionMeta[];
  }

  if (payload && typeof payload === "object") {
    const body = payload as {
      questions?: QuestionMeta[];
      data?: QuestionMeta[];
    };
    if (Array.isArray(body.questions)) return body.questions;
    if (Array.isArray(body.data)) return body.data;
  }

  return [];
};

describe("Report + moderation warning flow", () => {
  let questionId: string;
  let questionAuthor: string;
  let questionTitle: string;
  let reportReason = "";
  let questionLookup: Record<string, QuestionMeta> = {};

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
    questionLookup = {};
  });

  it("Reporters hide abusive posts and authors see report context", () => {
    cy.intercept("POST", "**/api/report").as("createReport");

    loginUser(REPORTER_USERNAME);

    cy.request(`/api/question/getQuestion?order=newest&viewer=${REPORTER_USERNAME}`).then(
      ({ body }: { body: unknown }) => {
        const questions = normalizeQuestions(body);

        expect(questions.length, "Need at least one question to report").to.be.greaterThan(0);
        questionLookup = {};
        questions.forEach(q => {
          if (q?._id) {
            questionLookup[q._id] = q;
          }
        });
      },
    );

    cy.get("[data-cy=question-card]", { timeout: 15000 })
      .filter((_, card) => {
        const attrAuthor = card.getAttribute("data-question-author") ?? "";
        const labelAuthor =
          card.querySelector(".author-name")?.textContent?.replace(/^u\//, "").trim() ?? "";
        const author = attrAuthor || labelAuthor;
        return Boolean(author) && author !== REPORTER_USERNAME;
      })
      .then($cards => {
        const cards = $cards as JQuery<HTMLElement>;
        expect(
          cards.length,
          "Need at least one question not authored by reporter",
        ).to.be.greaterThan(0);

        const card = Cypress.$(cards.get(0));
        questionId = card.attr("data-question-id") ?? "";
        questionTitle = card.find("[data-cy=question-title]").text().trim();
        const authorAttr = card.attr("data-question-author") ?? "";
        const authorText = card.find(".author-name").text().trim().replace(/^u\//, "");
        const fallbackMeta = questionId ? questionLookup[questionId] : undefined;
        questionAuthor = authorAttr || authorText || fallbackMeta?.askedBy || "";
        questionTitle = questionTitle || fallbackMeta?.title || "";
        expect(questionAuthor, "Question author should be defined").to.have.length.greaterThan(0);
        reportReason = `Content is off-topic: ${questionTitle || "auto-generated"} (${Date.now()})`;

        expect(questionId, "Question id should be defined").to.have.length.greaterThan(0);
        expect(
          questionAuthor,
          "Question author should differ from reporter",
        ).to.not.equal(REPORTER_USERNAME);

        cy.wrap(card).within(() => {
          cy.contains("button", "Report").click();
        });
      });

    cy.get(".report-dropdown", { timeout: 10000 })
      .should("exist")
      .and("have.css", "opacity", "1");
    cy.get(".report-textarea").type(reportReason || "Automated report reason");
    cy.contains(".report-btn-submit", "Report").click();
    cy.wait("@createReport").its("response.statusCode").should("eq", 200);

    cy.get(`[data-question-id="${questionId}"]`, { timeout: 10000 }).should(
      "not.exist",
    );

  });
});

