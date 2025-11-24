import { setupTest, teardownTest, loginUser } from "../support/helpers";

describe("Email Verification Flow", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("C.o.S. | Users can request verification and confirm their email for notifications", () => {
    const username = "user123";
    const newEmail = "user123@example.com";

    cy.intercept("PATCH", "**/api/user/updateEmail").as("updateEmail");
    loginUser(username);
    cy.visit(`http://localhost:4530/user/${username}`);

    cy.get(".bio-section").eq(1).within(() => {
      cy.contains("Edit").click();
      cy.get("input.input-text").clear().type(newEmail);
      cy.contains("Save").click();
    });
    cy.wait("@updateEmail").its("response.statusCode").should("eq", 200);
    cy.contains("Verification email sent").should("be.visible");
    cy.contains(".unverified-email", "(pending verification)").should("be.visible");
    cy.contains(".warning-message", "Notifications will not be sent").should("be.visible");

    cy.intercept("GET", "**/api/user/verifyEmail?token=mock-token", {
      statusCode: 200,
      body: { msg: "Email verified successfully", email: newEmail },
    }).as("verifyEmail");

    cy.visit(`http://localhost:4530/verify-email?token=mock-token`);
    cy.wait("@verifyEmail");
    cy.contains("Email verified successfully", { timeout: 10000 }).should("be.visible");

    cy.visit(`http://localhost:4530/user/${username}`);
    cy.contains(".unverified-email", "(pending verification)").should("not.exist");
    cy.contains(".warning-message", "Notifications will not be sent").should("not.exist");
    cy.contains(newEmail).should("be.visible");
  });
});

