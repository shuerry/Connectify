import { loginUser, setupTest, teardownTest } from "../support/helpers";

describe("Question ordering controls", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("Requests trending data and renders it in returned order", () => {
    const trendingResponse = [
      {
        _id: "64b0f0c7dfb09bb8b6f0a001",
        title: "Stub: Optimizing suspense hydration",
        text: "Stub body 1",
        tags: [
          { _id: "tag-react", name: "react" },
          { _id: "tag-performance", name: "performance" },
        ],
        answers: [],
        askedBy: "reactexpert",
        askDateTime: "2025-04-20T10:00:00.000Z",
        views: ["user123", "user234", "user345"],
        upVotes: ["user123", "user234"],
        downVotes: [],
        comments: [],
        followers: [],
        community: null,
      },
      {
        _id: "64b0f0c7dfb09bb8b6f0a002",
        title: "Stub: Debugging Node streams backpressure",
        text: "Stub body 2",
        tags: [{ _id: "tag-node", name: "node.js" }],
        answers: [],
        askedBy: "serverdev",
        askDateTime: "2025-04-19T08:00:00.000Z",
        views: ["user123"],
        upVotes: ["user345"],
        downVotes: ["user234"],
        comments: [],
        followers: [],
        community: null,
      },
    ] as any[];

    cy.intercept("GET", "**/api/question/getQuestion?order=trending*", req => {
      req.reply({
        statusCode: 200,
        body: trendingResponse,
      });
    }).as("getTrending");

    loginUser("user123");

    cy.contains(".order-btn", "Trending").click();
    cy.wait("@getTrending").its("request.url").should("include", "order=trending");

    cy.get("[data-cy=question-title]")
      .should("have.length", trendingResponse.length)
      .each(($el, index) => {
        cy.wrap($el).should("contain", trendingResponse[index].title);
      });
  });
});

