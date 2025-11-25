import {
  loginUser,
  logoutUser,
  setupTest,
  teardownTest,
} from "../support/helpers";

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

const openGroupChats = () => {
  expandMessagingMenu();
  cy.contains(".nav-subitem-text", "Group Chats").click();
  cy.url().should("include", "/messaging/group-chat");
};

describe("Group & Community Chat Flows", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("allows community admins to spin up a community chat and send a message", () => {
    loginUser("reactexpert", "R3@ctM@ster!");
    openGroupChats();

    cy.contains("button", "New Group Chat").click();
    cy.contains("button", "Community Chat").click();

    cy.contains(".community-item h4", "React Enthusiasts").click();
    cy.contains(".create-chat-confirm-btn", "Create Community Chat").click();

    cy.get(".gc-chat-header").within(() => {
      cy.contains("Community chat for React Enthusiasts").should("be.visible");
    });

    const announcement = `Community broadcast ${Date.now()}`;
    cy.get(".gc-message-textbox").type(announcement);
    cy.get(".gc-send-button").click();

    cy.get(".gc-messages-container").contains(announcement).should("be.visible");

    logoutUser();
  });
});

