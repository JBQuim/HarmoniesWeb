import { ApiError, createGame, sendAction } from "./api.js";
import { EMPTY_SELECTION, handleHitbox } from "./input.js";
import { Palette, Renderer } from "./renderer.js";
import { applyAction, createNewState, encodeEndTurn } from "../harmonies-js/rules.js";
import { scoreBoard } from "../harmonies-js/scoring.js";

const canvas = document.getElementById("canvas");
const gameIdInput = document.getElementById("gameId");
const seedInput = document.getElementById("seed");
const statusEl = document.getElementById("status");
const newGameBtn = document.getElementById("newGameBtn");
const localGameBtn = document.getElementById("localGameBtn");
const redrawBtn = document.getElementById("redrawBtn");

const renderer = new Renderer(canvas);

let currentState = null;
let currentScore = 0;
let selection = { ...EMPTY_SELECTION };
let busy = false;

newGameBtn.addEventListener("click", startServerGame);
if (localGameBtn) localGameBtn.addEventListener("click", startLocalGame);
redrawBtn.addEventListener("click", redraw);

canvas.addEventListener("click", async event => {
  if (busy || currentState === null || currentState.terminal) return;

  const { x, y } = canvasEventPosition(event, canvas);
  const hitbox = renderer.hitTest(x, y);
  if (hitbox === null) return;

  const intent = handleHitbox(hitbox, selection);
  selection = intent.selection ?? selection;
  setStatus(intent.message ?? "");

  if (intent.kind === "selection" || intent.kind === "message") {
    redraw();
    return;
  }

  await handleAction(intent.action);
});

async function startServerGame() {
  const gameId = readGameId();
  const seed = readSeed();

  busy = true;
  setStatus("Creating server game...");

  try {
    const data = await createGame({ gameId, seed });
    applyServerState(data.state, data.score);
    setStatus(`Created server game ${gameId}.`);
  } catch (error) {
    showError("Could not create server game", error);
  } finally {
    busy = false;
  }
}

function startLocalGame() {
  try {
    const gameId = readGameId();
    const seed = readSeed();

    const fullState = createNewState({ gameId, seed });
    fullState.hidden = null;

    currentState = fullState;
    currentScore = scoreBoard(currentState.board);
    selection = { ...EMPTY_SELECTION };

    setStatus(`Created local redacted game ${gameId}. End Turn still needs a server.`);
    redraw();
  } catch (error) {
    showError("Local New Game failed", error);
  }
}

async function handleAction(action) {
  if (action === encodeEndTurn()) {
    await sendEndTurn(action);
    return;
  }

  const baseRevision = currentState.revision;

  try {
    currentState = applyAction(currentState, action);
    currentScore = scoreBoard(currentState.board);
    selection = { ...EMPTY_SELECTION };
    redraw();
  } catch (error) {
    showError("Invalid local action", error);
    redraw();
    return;
  }

  sendActionInBackground(action, baseRevision);
}

async function sendEndTurn(action) {
  const gameId = readGameId();
  const revision = currentState.revision;

  busy = true;
  setStatus("Resolving end turn on server...");

  try {
    const data = await sendAction({ gameId, action, revision });
    applyServerState(data.state, data.score);
    setStatus("End turn resolved.");
  } catch (error) {
    if (error instanceof ApiError && error.data?.state) {
      applyServerState(error.data.state, error.data.score);
      setStatus(`Server rejected end turn; reconciled to authoritative state. ${error.message}`);
    } else {
      showError("Could not resolve end turn", error);
    }
  } finally {
    busy = false;
  }
}

async function sendActionInBackground(action, revision) {
  const gameId = readGameId();

  try {
    const data = await sendAction({ gameId, action, revision });

    // Avoid overwriting newer optimistic local state with an older server ack.
    if (data.state && (!currentState || data.state.revision >= currentState.revision)) {
      applyServerState(data.state, data.score);
    }
  } catch (error) {
    if (error instanceof ApiError && error.data?.state) {
      applyServerState(error.data.state, error.data.score);
      setStatus(`Server rejected action; reconciled to authoritative state. ${error.message}`);
      return;
    }

    showError("Server did not acknowledge action", error);
  }
}

function applyServerState(state, score = null) {
  if (!state) throw new Error("server response did not contain state");

  currentState = redactHidden(state);
  currentScore = typeof score === "number" ? score : scoreBoard(currentState.board);
  selection = { ...EMPTY_SELECTION };
  redraw();
}

function redactHidden(state) {
  const out = clone(state);
  out.hidden = null;
  return out;
}

function redraw() {
  if (currentState === null) {
    const ctx = renderer.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = Palette.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  renderer.draw(currentState, currentScore, selection);
}

function canvasEventPosition(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function readGameId() {
  return gameIdInput.value.trim() || "test1";
}

function readSeed() {
  return Number(seedInput.value || 0);
}

function setStatus(text) {
  console.log(text);
  if (statusEl) statusEl.textContent = text;
}

function showError(prefix, error) {
  const message = error instanceof Error ? error.message : String(error);
  setStatus(`${prefix}: ${message}`);
  console.error(prefix, error);
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

redraw();