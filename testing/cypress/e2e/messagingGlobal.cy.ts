import { loginUser, logoutUser, setupTest, teardownTest } from "../support/helpers";

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

const openGlobalChat = () => {
  expandMessagingMenu();
  cy.contains(".nav-subitem-text", "Global Messages").click();
  cy.url().should("include", "/messaging");
};

describe("Global Chat Messaging", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("shows profanity modal and blocks sending offensive content", () => {
    loginUser("user123");
    openGlobalChat();

    cy.get(".modern-message-textbox").type("This chat is shit");
    cy.get(".modern-send-button").click();

    cy.contains(".modal-title", "Profanity Filter Alert").should("be.visible");
    cy.contains(".modal-backdrop", "inappropriate language").should("be.visible");
    cy.get(".close-btn").click();
    cy.get(".modal-backdrop").should("not.exist");

    logoutUser();
  });

  it("lets a user send a clean message that appears in the feed", () => {
    loginUser("user123");
    openGlobalChat();

    const messageBody = `Global hello ${Date.now()}`;

    cy.get(".modern-message-textbox").type(messageBody);
    cy.get(".modern-send-button").click();

    cy.get(".modern-chat-messages")
      .contains(messageBody)
      .scrollIntoView()
      .should("be.visible");

    logoutUser();
  });
});

