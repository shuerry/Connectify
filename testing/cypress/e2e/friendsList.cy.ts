import { loginUser, setupTest, teardownTest } from "../support/helpers";

const API_BASE = "http://localhost:8000";

const expandUsersMenu = () => {
  cy.contains("span.nav-item-text", "Users")
    .parents("button")
    .then($btn => {
      const buttonEl = $btn[0] as HTMLButtonElement | undefined;
      const isExpanded = buttonEl?.classList.contains("nav-item-expanded");
      if (!isExpanded && buttonEl) {
        cy.wrap(buttonEl).click();
      }
    });
};

const openFriendsPage = () => {
  expandUsersMenu();
  cy.contains(".nav-subitem-text", "Friends").click();
  cy.url().should("include", "/friends");
};

describe("Friends List Management", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("displays and removes a friend via the Friends page", () => {
    cy.request("POST", `${API_BASE}/api/user/addFriend`, {
      username: "user123",
      targetUsername: "reactexpert",
    }).its("status").should("eq", 200);
    cy.request("POST", `${API_BASE}/api/user/addFriend`, {
      username: "reactexpert",
      targetUsername: "user123",
    }).its("status").should("eq", 200);

    loginUser("user123");
    openFriendsPage();

    cy.contains(".friend-card", "reactexpert")
      .as("friendCard")
      .should("be.visible");

    cy.get("@friendCard")
      .find(".btn-remove-friend")
      .click();

    cy.contains(".friend-card", "reactexpert").should("not.exist");
  });
});

