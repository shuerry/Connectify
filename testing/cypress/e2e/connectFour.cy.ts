import {
  buildMockConnectFourGame,
  goToConnectFourPage,
  loginUser,
  mockConnectFourJoinResponse,
  mockConnectFourLobby,
  MockConnectFourGameInstance,
  setupTest,
  teardownTest,
} from "../support/helpers";

const WAITING_ROOM_ID = "cf-room-waiting";
const FRIENDLY_HOST = "friendlyfox";

const createLobbyGames = (): MockConnectFourGameInstance[] => {
  const waitingRoom = buildMockConnectFourGame({
    gameID: WAITING_ROOM_ID,
    roomName: "Strategy Session",
    status: "WAITING_TO_START",
    player1: "coachAmy",
    privacy: "PUBLIC",
    allowSpectators: true,
  });

  const playingRoom = buildMockConnectFourGame({
    gameID: "cf-room-playing",
    roomName: "Ranked Battle",
    status: "IN_PROGRESS",
    player1: "nelson",
    player2: "quentin",
    currentTurn: "YELLOW",
    allowSpectators: true,
    spectators: ["lurker1"],
    board: [
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, "RED", null, null, null, null],
      [null, null, "YELLOW", "RED", null, null, null],
      [null, "RED", "YELLOW", "YELLOW", null, null, null],
      ["RED", "YELLOW", "RED", "YELLOW", null, null, null],
    ],
    totalMoves: 9,
    lastMoveColumn: 2,
  });

  const friendsOnlyRoom = buildMockConnectFourGame({
    gameID: "cf-room-friends",
    roomName: "Friends Lounge",
    status: "WAITING_TO_START",
    player1: FRIENDLY_HOST,
    privacy: "FRIENDS_ONLY",
    allowSpectators: false,
  });

  return [waitingRoom, playingRoom, friendsOnlyRoom];
};

const JOINED_GAME = buildMockConnectFourGame({
  gameID: WAITING_ROOM_ID,
  roomName: "Strategy Session",
  status: "IN_PROGRESS",
  player1: "coachAmy",
  player2: "user123",
  player1Color: "RED",
  player2Color: "YELLOW",
  currentTurn: "RED",
  allowSpectators: true,
  spectators: ["fan1", "fan2"],
  board: [
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, "RED", null, null, null, null, null],
    [null, "YELLOW", "RED", "RED", null, null, null],
    ["YELLOW", "RED", "YELLOW", "YELLOW", null, null, null],
    ["RED", "YELLOW", "RED", "YELLOW", null, null, null],
  ],
  totalMoves: 10,
  lastMoveColumn: 3,
});

describe("Connect Four Page", () => {
  let lobbyGames: MockConnectFourGameInstance[] = [];

  beforeEach(() => {
    setupTest();
    lobbyGames = createLobbyGames();
    mockConnectFourLobby({
      username: "user123",
      games: lobbyGames,
      friends: [FRIENDLY_HOST],
    });
  });

  afterEach(() => {
    teardownTest();
  });

  it("C.o.S. | Lobby surfaces rooms and supports filtering", () => {
    loginUser("user123");
    goToConnectFourPage();
    cy.wait("@getConnectFourGames");

    cy.contains(".page-title", "Connect Four").should("be.visible");
    cy.contains(".rooms-header", "Available Rooms (3)").should("be.visible");
    cy.get(".room-card").should("have.length", 3);

    cy.contains(".room-card", "Strategy Session").within(() => {
      cy.contains("Player 1: coachAmy").should("be.visible");
      cy.contains("Join Game").should("be.visible");
    });

    cy.contains(".filter-section", "Status").within(() => {
      cy.contains("button", "Waiting").click();
    });
    cy.get(".room-card").should("have.length", 2);

    cy.contains(".filter-section", "Status").within(() => {
      cy.contains("button", "All").click();
    });

    cy.contains(".filter-section", "Room Type").within(() => {
      cy.contains("button", "Public").click();
    });
    cy.get(".room-card").should("have.length", 2);
    cy.contains(".filter-section", "Room Type").within(() => {
      cy.contains("button", "All Rooms").click();
    });

    cy.get(".code-input").type("abc123");
    cy.get(".join-code-btn").should("not.be.disabled");
  });

  it("C.o.S. | Joining a room loads the board and blocks out-of-turn moves", () => {
    mockConnectFourJoinResponse(JOINED_GAME);

    loginUser("user123");
    goToConnectFourPage();
    cy.wait("@getConnectFourGames");

    cy.contains(".room-card", "Strategy Session").within(() => {
      cy.contains("Join Game").click();
    });

    cy.wait("@joinConnectFourRoom")
      .its("request.body")
      .should("include", { gameID: WAITING_ROOM_ID, playerID: "user123" });

    cy.get(".connect-four-board-container").should("be.visible");
    cy.contains(".room-info h2", "Strategy Session").should("be.visible");
    cy.get(".players-info .player-card").first().should("contain", "coachAmy");
    cy.get(".players-info .player-card").last().should("contain", "user123");
    cy.contains(".turn-indicator span.red", "RED's Turn").should("be.visible");

    cy.get(".connect-four-board .board-row").last().children().first().click();
    cy.contains(".cf-toast", "Not your turn").should("be.visible");
  });
});


