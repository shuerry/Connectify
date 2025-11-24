/**
 * Test utility functions for Cypress tests
 * Provides shared helper functions for common test patterns like authentication, navigation, and data setup
 */

/**
 * Logs in a user by visiting the login page and entering credentials
 * @param username - The username to log in with
 * @param password - The password to log in with (defaults to 'password123')
 */
export const loginUser = (
  username: string,
  password: string = "securePass123!",
) => {
  cy.visit("http://localhost:4530");
  cy.contains(".auth-title", "Welcome Back!").should("be.visible");
  cy.get("#username-input").clear().type(username);
  cy.get("#password-input").clear().type(password);
  cy.contains("button", "Sign In").click();
  // Wait for redirect to home page
  cy.url().should("include", "/home");
};

/**
 * Logs out by clearing stored user state and returning to the login screen.
 */
export const logoutUser = () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("currentUser");
    win.localStorage.removeItem("rememberedUser");
  });
  cy.visit("http://localhost:4530/login");
  cy.contains(".auth-title", "Welcome Back!").should("be.visible");
};

/**
 * Seeds the database with test data
 */
export const seedDatabase = () => {
  cy.exec(
    "npx ts-node ../server/seedData/populateDB.ts " +
      Cypress.env("MONGODB_URI"),
  );
};

/**
 * Clears the database
 */
export const cleanDatabase = () => {
  cy.exec(
    "npx ts-node ../server/seedData/deleteDB.ts " + Cypress.env("MONGODB_URI"),
  );
};

/**
 * Sets up the database before each test
 */
export const setupTest = () => {
  cleanDatabase();
  seedDatabase();
};

/**
 * Cleans up the database after each test
 */
export const teardownTest = () => {
  cleanDatabase();
};

/**
 * Navigates to the Ask Question page
 */
export const goToAskQuestion = () => {
  cy.contains("button", "Ask a Question").click();
  cy.url().should("include", "/new/question");
};

/**
 * Creates a new question with the provided details
 * @param title - Question title
 * @param text - Question content
 * @param tags - Space-separated tags
 */
export const createQuestion = (title: string, text: string, tags: string) => {
  goToAskQuestion();
  cy.get("#formTitleInput").type(title);
  cy.get("#formTextInput").type(text);
  cy.get("#formTagInput").type(tags);
  cy.contains(".reddit-btn-primary", "Post").click();
  cy.url({ timeout: 10000 }).should("include", "/home");
  waitForQuestionsToLoad();
};

/**
 * Navigates to answer a specific question by clicking on its title
 * @param questionTitle - The title of the question to click on
 */
export const goToAnswerQuestion = (questionTitle: string) => {
  waitForQuestionsToLoad();
  cy.contains(".reddit-question-title", questionTitle, { timeout: 10000 }).click();
  cy.contains(".reddit-answer-button", "Add an Answer", { timeout: 10000 }).click();
  cy.url().should("include", "/new/answer");
};

/**
 * Creates an answer to the current question
 * @param answerText - The answer content
 */
export const createAnswer = (answerText: string) => {
  cy.get("#answerTextInput").type(answerText);
  cy.contains("Post Answer").click();
};

/**
 * Performs a search using the search bar
 * @param searchTerm - The term to search for
 */
export const performSearch = (searchTerm: string) => {
  cy.get("#searchBar").type(`${searchTerm}{enter}`);
};

/**
 * Clicks on a specific filter/order button
 * @param filterName - The name of the filter ("Newest", "Unanswered", "Active", "Most Viewed")
 */
export const clickFilter = (filterName: string) => {
  cy.contains(filterName).click();
};

/**
 * Navigates back to the Questions page
 */
export const goToQuestions = () => {
  cy.contains(".nav-item-text", "Questions").click();
  cy.url().should("include", "/home");
  waitForQuestionsToLoad();
};

/**
 * Navigates back to the Collections page
 */
export const goToCollections = () => {
  cy.contains(".nav-item-text", "My Collections").click();
  cy.url().should("include", "/collections");
};

/**
 * Creates a new question with the provided details
 * @param title - Question title
 * @param text - Question content
 * @param tags - Space-separated tags
 */
export const createCommunity = (
  title: string,
  desc: string,
  isPrivate: boolean,
) => {
  cy.get(".new-community-button").click();
  // Use expected classnames instead of placeholder selectors
  cy.get(".new-community-input").eq(0).type(title);
  cy.get(".new-community-input").eq(1).type(desc);
  if (isPrivate) {
    cy.get('.new-community-checkbox-label input[type="checkbox"]').check();
  }
  cy.get(".new-community-submit").click();
};

/**
 * Navigates back to the Communities page
 */
export const goToCommunities = () => {
  cy.contains(".nav-item-text", "Communities").click();
  cy.url().should("include", "/communities");
};

/**
 * Navigates to the Connect Four lobby via the Games page.
 */
export const goToConnectFourPage = () => {
  cy.contains(".nav-item-text", "Games").click();
  cy.url().should("include", "/games");
  cy.get(".btn-connect-four", { timeout: 10000 }).should("be.visible").click();
  cy.url().should("include", "/games/connectfour");
  cy.get(".connect-four-page").should("exist");
};

/**
 * Navigate to a Community Card
 */
export const viewCommunityCard = (CommunityName: string) => {
  cy.contains(".community-card-title", CommunityName)
    .closest(".community-card")
    .contains("button", "View Community")
    .click();
};

/**
 * Waits for questions to load and verifies the page is ready
 */
export const waitForQuestionsToLoad = () => {
  cy.get("body", { timeout: 10000 }).then($body => {
    if ($body.find(".reddit-question-title").length) {
      cy.get(".reddit-question-title").should("exist");
    } else {
      cy.get(".empty-state").should("exist");
    }
  });
};

/**
 * Open save question to collection modal
 * @param questionTitle - The title of the question to click on
 */
export const openSaveToCollectionModal = (questionTitle: string) => {
  cy.contains(".reddit-question-title", questionTitle, { timeout: 10000 })
    .closest(".reddit-question-card")
    .within(() => {
      cy.contains(".reddit-action-btn", "Save").click();
    });
};

/**
 * Toggle save question modal
 * @param collectionTitle - The title of the question to click on
 */
export const toggleSaveQuestion = (collectionTitle: string) => {
  cy.contains(".collection-item-dropdown", collectionTitle)
    .find(".save-btn-dropdown")
    .click();
};

/**
 * Saves a question to a collection
 * @param questionTitle - The title of the question to click on
 * @param collectionTitle - The title of the collection to save to
 */
export const toggleSaveQuestionToCollection = (
  questionTitle: string,
  collectionTitle: string,
) => {
  openSaveToCollectionModal(questionTitle);
  toggleSaveQuestion(collectionTitle);
};

/**
 * Verify community details are displayed
 * @param communityName - The name of the community
 * @param communityDesc - The description of the community
 * @param communityMembers - The members of the community
 */
export const verifyCommunityDetailsDisplayed = (
  communityName: string,
  communityDesc: string,
  communityMembers: Array<string>,
) => {
  cy.contains(".community-title", communityName).should("be.visible");
  cy.contains(".community-description", communityDesc).should("be.visible");
  communityMembers.forEach(member => {
    cy.contains(".member-item", member).should("exist");
  });
};

/**
 * Verify community details are displayed
 * @param communityName - The name of the community
 * @param communityDesc - The description of the community
 * @param communityMembers - The members of the community
 */
export const verifyCommunityDetailsNotDisplayed = (
  communityName: string,
  communityDesc: string,
  communityMembers: Array<string>,
) => {
  cy.contains(".community-title", communityName).should("not.exist");
  cy.contains(".community-description", communityDesc).should("not.exist");
  cy.get(".member-item").should("not.exist");
};

/**
 * Verify question is saved to collection
 * @param collectionTitle - The title of the collection to click on
 */
export const verifyQuestionSaved = (collectionTitle: string) => {
  cy.contains(".collection-item-dropdown", collectionTitle)
    .find(".save-btn-dropdown")
    .should("have.class", "saved")
    .and("contain", "Unsave");
};

/**
 * Verify question is unsaved to collection
 * @param collectionTitle - The title of the collection to click on
 */
export const verifyQuestionUnsaved = (collectionTitle: string) => {
  cy.contains(".collection-item-dropdown", collectionTitle)
    .find(".save-btn-dropdown")
    .should("have.class", "unsaved")
    .and("contain", "Save");
};

/**
 * Verifies the order of questions on the page
 * @param expectedTitles - Array of question titles in expected order
 */
export const verifyQuestionOrder = (expectedTitles: string[]) => {
  cy.get(".reddit-question-title").should("have.length", expectedTitles.length);
  cy.get(".reddit-question-title").each(($el, index) => {
    cy.wrap($el).should("contain", expectedTitles[index]);
  });
};

/**
 * Verifies the stats (answers/views) for questions
 * @param expectedAnswers - Array of expected answer counts
 * @param expectedViews - Array of expected view counts
 */
export const verifyQuestionStats = (
  expectedAnswers: string[],
  expectedViews: string[],
) => {
  cy.get(".reddit-question-card").each(($card, index) => {
    if (index < expectedAnswers.length) {
      const match = expectedAnswers[index].match(/\d+/);
      const count = match ? match[0] : expectedAnswers[index];
      cy.wrap($card)
        .find(".reddit-action-btn")
        .first()
        .should("contain", `${count} Comments`);
    }
    if (index < expectedViews.length) {
      cy.wrap($card).find(".views-count").should("contain", expectedViews[index]);
    }
  });
};

/**
 * Verifies error messages are displayed
 * @param errorMessage - The error message to check for
 */
export const verifyErrorMessage = (errorMessage: string) => {
  cy.contains(errorMessage).should("be.visible");
};

/**
 * Verifies that the question count is displayed correctly
 * @param count - Expected number of questions
 */
export const verifyQuestionCount = (count: number) => {
  cy.get(".question-count").within(() => {
    cy.get(".count-number").should("contain", count);
    cy.get(".count-label").should("contain", count === 1 ? "question" : "questions");
  });
};

/**
 * Custom assertion to check that elements contain text in order
 * @param selector - CSS selector for elements
 * @param texts - Array of texts in expected order
 */
export const verifyElementsInOrder = (selector: string, texts: string[]) => {
  cy.get(selector).should("have.length", texts.length);
  texts.forEach((text, index) => {
    cy.get(selector).eq(index).should("contain", text);
  });
};

// New methods added below

/**
 * Navigates to the My Collections page
 */
export const goToMyCollections = () => {
  cy.contains(".nav-item-text", "My Collections").click();
  cy.url().should("include", "/collections");
};

/**
 * Navigates to the new collection creation page from My Collections.
 */
export const goToCreateCollection = () => {
  cy.get(".collections-create-btn").click({ force: true });
  cy.url().should("include", "/new/collection");
  cy.get(".new-collection-page").should("exist");
};

/**
 * Fills out the new collection form.
 */
export const createNewCollection = (
  name: string,
  description: string,
  isPrivate: boolean = false,
) => {
  // Fill using expected classnames instead of placeholders
  cy.get(".new-collection-input").eq(0).should("exist").clear().type(name);

  cy.get(".new-collection-input")
    .eq(1)
    .should("exist")
    .clear()
    .type(description);

  // Handle privacy checkbox
  const checkboxSelector = '.new-collection-checkbox input[type="checkbox"]';
  cy.get(checkboxSelector).then(($checkbox) => {
    if (isPrivate) {
      cy.wrap($checkbox).check({ force: true });
    } else {
      cy.wrap($checkbox).uncheck({ force: true });
    }
  });

  // Submit the form
  cy.get(".new-collection-btn").should("exist").click({ force: true });
};

/**
 *  Deletes a collection by name
 * @param name - name of the collection to delete
 */
export const deleteCollection = (name: string) => {
  goToMyCollections();

  cy.get(".collection-card")
    .contains(".collection-name", name)
    .then(($nameEl) => {
      // Go back to a stable parent context before clicking
      cy.wrap($nameEl)
        .closest(".collection-card")
        .find(".delete-collection-button")
        .click({ force: true });
    });
  // Verify deletion
  cy.get(".collection-name").should("not.contain", name);
};

/**
 * Verifies that a collection with the specified name is visible on the page.
 * @param name - name of the collection to verify
 */
export const verifyCollectionVisible = (name: string) => {
  cy.contains(name).should("exist");
};

/**
 * Verifies that a collection card with the specified name is visible on the page.
 * @param collectionName - Name of the collection to verify.
 */
export const verifyCollectionExists = (collectionName: string) => {
  cy.get(".collection-card", { timeout: 10000 }).should("exist");
  cy.get(".collection-name").contains(collectionName).should("be.visible");
};

/**
 * Opens a collection by clicking on its name on the My Collections page.
 * @param name - Name of the collection to open
 */
export const goToCollection = (name: string) => {
  cy.get(".collection-card")
    .contains(".collection-name", name)
    .click({ force: true });
  cy.url().should("include", "/collections/");
  cy.get(".collection-page").should("exist");
};

/**
 * Verifies that a collection page shows required details
 * (name, description, meta, and questions list).
 * @param name - Expected collection name
 * @param username - Expected username (optional)
 */
export const verifyCollectionPageDetails = (
  name: string,
  username?: string,
) => {
  cy.get(".collection-title").should("contain", name);
  cy.get(".collection-description").should("exist");
  cy.get(".collection-meta").should("exist");
  cy.get(".questions-list").should("exist");

  if (username) {
    cy.get(".collection-meta").should("contain", username);
  }
};

type MockQuestionInput = {
  _id?: string;
  title: string;
  text?: string;
  askedBy?: string;
  askDateTime?: string;
  tags?: Array<{ _id?: string; name: string } | string>;
  answers?: Array<{
    _id?: string;
    text: string;
    ansBy: string;
    ansDateTime?: string;
    comments?: Array<Record<string, unknown>>;
  }>;
  comments?: Array<Record<string, unknown>>;
  views?: string[];
  followers?: string[];
};

const buildMockQuestion = (question: MockQuestionInput, prefix: string) => {
  const normalizeTags = (tags?: MockQuestionInput['tags']) => {
    if (!tags || tags.length === 0) {
      return [{ _id: `${prefix}-tag`, name: 'mock' }];
    }
    return tags.map((tag, index) =>
      typeof tag === 'string'
        ? { _id: `${prefix}-tag-${index}`, name: tag }
        : { _id: tag._id || `${prefix}-tag-${index}`, name: tag.name },
    );
  };

  return {
    _id: question._id || `${prefix}-question`,
    title: question.title,
    text: question.text || 'Mock question body',
    tags: normalizeTags(question.tags),
    askedBy: question.askedBy || 'user123',
    askDateTime: question.askDateTime || new Date().toISOString(),
    answers:
      question.answers?.map((answer, index) => ({
        _id: answer._id || `${prefix}-answer-${index}`,
        text: answer.text,
        ansBy: answer.ansBy,
        ansDateTime: answer.ansDateTime || new Date().toISOString(),
        comments: answer.comments || [],
      })) || [],
    comments: question.comments || [],
    views: question.views || [],
    followers: question.followers || [],
  };
};

type MockCollectionInput = {
  _id?: string;
  name: string;
  description: string;
  username?: string;
  isPrivate?: boolean;
  questions?: MockQuestionInput[];
};

export const mockCollectionsApi = ({
  ownerUsername,
  collections,
}: {
  ownerUsername: string;
  collections: MockCollectionInput[];
}) => {
  const normalized = collections.map((collection, index) => ({
    _id: collection._id || `mock-collection-${index}`,
    name: collection.name,
    description: collection.description,
    username: collection.username || ownerUsername,
    isPrivate: collection.isPrivate ?? false,
    questions: (collection.questions || []).map((question, qIndex) =>
      buildMockQuestion(question, `mock-col-${index}-${qIndex}`),
    ),
  }));

  cy.intercept("GET", /\/api\/collection\/getCollectionsByUsername\/[^?]+/, req => {
    req.reply(normalized);
  }).as("getCollectionsByUsername");

  cy.intercept("GET", /\/api\/collection\/getCollectionById\/[^?]+/, req => {
    const idMatch = req.url.match(/getCollectionById\/([^?]+)/);
    const collectionId = idMatch ? idMatch[1] : '';
    const match = normalized.find(col => col._id === collectionId);
    if (match) {
      req.reply(match);
    } else {
      req.reply({ statusCode: 404, body: { error: 'Collection not found' } });
    }
  }).as("getCollectionById");

  cy.intercept("DELETE", /\/api\/collection\/delete\/[^?]+/, req => {
    const idMatch = req.url.match(/delete\/([^?]+)/);
    const collectionId = idMatch ? idMatch[1] : '';
    const index = normalized.findIndex(col => col._id === collectionId);
    if (index >= 0) {
      normalized.splice(index, 1);
    }
    req.reply({ ok: true });
  }).as("deleteCollectionApi");
};

type MockCommunityInput = {
  _id?: string;
  name: string;
  description: string;
  participants?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE';
  admin?: string;
};

export const mockCommunitiesApi = (communities: MockCommunityInput[]) => {
  const normalized = communities.map((community, index) => ({
    _id: community._id || `mock-community-${index}`,
    name: community.name,
    description: community.description,
    participants: community.participants ? [...community.participants] : [],
    visibility: community.visibility || 'PUBLIC',
    admin: community.admin || community.participants?.[0] || 'adminUser',
  }));

  cy.intercept("GET", "**/api/community/getAllCommunities", req => {
    req.reply(normalized);
  }).as("getAllCommunities");

  cy.intercept("GET", /\/api\/community\/getCommunity\/[^?]+/, req => {
    const idMatch = req.url.match(/getCommunity\/([^?]+)/);
    const communityId = idMatch ? idMatch[1] : '';
    const match = normalized.find(com => com._id === communityId);
    if (match) {
      req.reply(match);
    } else {
      req.reply({ statusCode: 404, body: { error: 'Community not found' } });
    }
  }).as("getCommunityById");

  cy.intercept("POST", "**/api/community/toggleMembership", req => {
    const { communityId, username } = req.body as { communityId: string; username: string };
    const match = normalized.find(com => com._id === communityId);

    if (!match) {
      req.reply({ statusCode: 404, body: { error: 'Community not found' } });
      return;
    }

    if (match.participants.indexOf(username) >= 0) {
      match.participants = match.participants.filter(participant => participant !== username);
    } else {
      match.participants.push(username);
    }
    req.reply(match);
  }).as("toggleCommunityMembership");
};

type ConnectFourColor = "RED" | "YELLOW";
type ConnectFourStatus = "WAITING_TO_START" | "IN_PROGRESS" | "OVER";
type ConnectFourPrivacy = "PUBLIC" | "PRIVATE" | "FRIENDS_ONLY";

export type MockConnectFourGameInput = {
  gameID?: string;
  roomName: string;
  status?: ConnectFourStatus;
  privacy?: ConnectFourPrivacy;
  allowSpectators?: boolean;
  player1?: string;
  player2?: string;
  player1Color?: ConnectFourColor;
  player2Color?: ConnectFourColor;
  currentTurn?: ConnectFourColor;
  spectators?: string[];
  board?: Array<Array<ConnectFourColor | null>>;
  totalMoves?: number;
  lastMoveColumn?: number;
  roomCode?: string;
  winners?: string[];
  moves?: Array<{ column: number; playerID: string }>;
  winningPositions?: Array<{ row: number; col: number }>;
};

export type MockConnectFourGameInstance = {
  gameID: string;
  gameType: "Connect Four";
  players: string[];
  state: {
    status: ConnectFourStatus;
    board: Array<Array<ConnectFourColor | null>>;
    currentTurn: ConnectFourColor;
    player1: string | null;
    player2: string | null;
    player1Color: ConnectFourColor;
    player2Color: ConnectFourColor;
    moves: Array<{ column: number; playerID: string }>;
    winningPositions?: Array<{ row: number; col: number }>;
    totalMoves: number;
    roomSettings: {
      roomName: string;
      privacy: ConnectFourPrivacy;
      allowSpectators: boolean;
      roomCode?: string;
    };
    spectators: string[];
    lastMoveColumn?: number;
    winners?: string[];
  };
};

const createEmptyConnectFourBoard = () =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null as ConnectFourColor | null));

export const buildMockConnectFourGame = (
  config: MockConnectFourGameInput,
  index: number = 0,
): MockConnectFourGameInstance => {
  const player1 = config.player1 || "playerOne";
  const player2 = config.player2 ?? null;
  const clonedBoard = (config.board || createEmptyConnectFourBoard()).map(row => [...row]);
  const players = [player1, player2].filter((p): p is string => Boolean(p));

  return {
    gameID: config.gameID || `mock-connect-four-${index}`,
    gameType: "Connect Four",
    players,
    state: {
      status: config.status || (player2 ? "IN_PROGRESS" : "WAITING_TO_START"),
      board: clonedBoard,
      currentTurn: config.currentTurn || "RED",
      player1,
      player2,
      player1Color: config.player1Color || "RED",
      player2Color: config.player2Color || "YELLOW",
      moves: config.moves || [],
      winningPositions: config.winningPositions,
      totalMoves: config.totalMoves ?? 0,
      roomSettings: {
        roomName: config.roomName,
        privacy: config.privacy || "PUBLIC",
        allowSpectators: config.allowSpectators ?? true,
        roomCode: config.roomCode,
      },
      spectators: config.spectators || [],
      lastMoveColumn: config.lastMoveColumn,
      winners: config.winners,
    },
  };
};

export const mockConnectFourLobby = ({
  username,
  games,
  friends = [],
}: {
  username: string;
  games: MockConnectFourGameInstance[];
  friends?: string[];
}) => {
  cy.intercept("GET", "**/api/games/games*", req => {
    if (req.url.includes("Connect%20Four") || req.url.includes("Connect+Four")) {
      req.reply(games);
    } else {
      req.continue();
    }
  }).as("getConnectFourGames");

  cy.intercept("GET", `**/api/user/relations/${username}`, {
    friends,
    blockedUsers: [],
  }).as("getUserRelations");
};

export const mockConnectFourJoinResponse = (game: MockConnectFourGameInstance) => {
  cy.intercept("POST", "**/api/games/connectfour/join", req => {
    req.reply(game);
  }).as("joinConnectFourRoom");

  cy.intercept("POST", "**/api/games/connectfour/join-by-code", req => {
    req.reply(game);
  }).as("joinConnectFourByCode");
};
