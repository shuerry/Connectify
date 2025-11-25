import {
  loginUser,
  logoutUser,
  setupTest,
  teardownTest,
} from "../support/helpers";

const API_BASE = "http://localhost:8000";

const expandMessagingMenu = () => {
  cy.contains("span.nav-item-text", "Messaging")
    .parents("button")
    .then($btn => {
      const buttonEl = $btn[0] as HTMLButtonElement | undefined;
      const isExpanded = buttonEl?.classList.contains("nav-item-expanded");
      if (!isExpanded && buttonEl) {
        cy.wrap(buttonEl).click();
      }
    });
};

const openDirectMessages = () => {
  expandMessagingMenu();
  cy.contains(".nav-subitem-text", "Direct Messages").click();
  cy.url().should("include", "/messaging/direct-message");
};

const selectUserFromList = (username: string) => {
  cy.get(".create-chat-panel", { timeout: 10000 })
    .should("exist")
    .and("have.css", "opacity", "1");
  cy.contains(".userUsername", username).scrollIntoView().should("be.visible").click();
};

describe("Direct Messaging Flows", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("blocks creating a direct message when users are not friends", () => {
    loginUser("user123");
    openDirectMessages();

    cy.contains("button", "New Chat").click();
    selectUserFromList("user234");
    cy.contains(".create-chat-confirm-btn", "Create Chat").click();
    cy.contains(".create-chat-error", "You can only message users who are your friends").should("be.visible");
  });

  it("allows sending a direct message once both users are friends", () => {
    cy.request("POST", `${API_BASE}/api/user/addFriend`, {
      username: "user123",
      targetUsername: "reactexpert",
    }).its("status").should("eq", 200);
    cy.request("POST", `${API_BASE}/api/user/addFriend`, {
      username: "reactexpert",
      targetUsername: "user123",
    }).its("status").should("eq", 200);

    loginUser("user123");
    openDirectMessages();

    cy.contains("button", "New Chat").click();
    selectUserFromList("reactexpert");
    cy.contains(".create-chat-confirm-btn", "Create Chat").click();

    cy.get(".dm-chat-header").within(() => {
      cy.contains("reactexpert").should("be.visible");
    });

    const messageBody = `Hello from Cypress ${Date.now()}`;
    cy.get(".dm-message-textbox").type(messageBody);
    cy.get(".dm-send-button").click();

    cy.get(".dm-messages-container")
      .contains(messageBody)
      .scrollIntoView()
      .should("be.visible");

    logoutUser();
  });
});

