import { applyAction, createNewState } from "./harmonies-js/rules.js";
import { scoreBoard } from "./harmonies-js/scoring.js";
import { InvalidActionError } from "./harmonies-js/actions.js";

const DB_BINDING = "harmonies_db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Only POST requests are allowed." }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: "Request body was not valid JSON." }, 400);
    }

    const db = env[DB_BINDING];
    if (!db) {
      return jsonResponse({ ok: false, error: `D1 binding not found: env.${DB_BINDING}` }, 500);
    }

    try {
      if (body.op === "newGame") return await handleNewGame(db, body);
      if (body.op === "move") return await handleMove(db, body);
      return jsonResponse({ ok: false, error: `Unknown op: ${String(body.op)}` }, 400);
    } catch (error) {
      if (error instanceof RequestError) {
        return jsonResponse({ ok: false, error: error.message }, 400);
      }

      console.error("Unhandled worker error:", error);
      return jsonResponse({ ok: false, error: "Internal server error." }, 500);
    }
  },
};

async function handleNewGame(db, body) {
  const gameId = requireString(body.gameId, "gameId");
  const seed = body.seed ?? 0;

  const state = createNewState({ gameId, seed });
  await saveNewGame(db, gameId, state);

  return jsonResponse({
    ok: true,
    gameId,
    revision: state.revision,
    terminal: state.terminal,
    score: scoreBoard(state.board),
    state: redactState(state),
  });
}

async function handleMove(db, body) {
  const gameId = requireString(body.gameId, "gameId");
  const action = requireInteger(body.action, "action");

  const state = await loadGame(db, gameId);
  if (state === null) {
    return jsonResponse({ ok: false, error: "game_not_found" }, 404);
  }

  if (body.revision !== undefined) {
    const revision = requireInteger(body.revision, "revision");
    if (revision !== state.revision) {
      return jsonResponse({
        ok: false,
        error: "revision_mismatch",
        gameId,
        expectedRevision: state.revision,
        receivedRevision: revision,
        revision: state.revision,
        terminal: state.terminal,
        score: scoreBoard(state.board),
        state: redactState(state),
      }, 409);
    }
  }

  let next;
  try {
    next = applyAction(state, action);
  } catch (error) {
    if (error instanceof InvalidActionError) {
      return jsonResponse({
        ok: false,
        error: error.message,
        gameId,
        revision: state.revision,
        terminal: state.terminal,
        score: scoreBoard(state.board),
        state: redactState(state),
      }, 422);
    }

    throw error;
  }

  await updateGame(db, gameId, next);

  return jsonResponse({
    ok: true,
    gameId,
    revision: next.revision,
    terminal: next.terminal,
    score: scoreBoard(next.board),
    state: redactState(next),
  });
}

async function loadGame(db, gameId) {
  const row = await db.prepare(
    "SELECT state_json FROM games WHERE id = ? LIMIT 1",
  ).bind(gameId).first();

  if (row === null || row === undefined) return null;
  if (row.state_json === null || row.state_json === undefined) return null;

  return JSON.parse(String(row.state_json));
}

async function saveNewGame(db, gameId, state) {
  const result = await db.prepare(
    "INSERT OR REPLACE INTO games (id, state_json) VALUES (?, ?)",
  ).bind(gameId, JSON.stringify(state)).run();

  assertD1Success(result, "failed_to_create_game");
}

async function updateGame(db, gameId, state) {
  const result = await db.prepare(
    "UPDATE games SET state_json = ? WHERE id = ?",
  ).bind(JSON.stringify(state), gameId).run();

  assertD1Success(result, "failed_to_save_game");
}

function redactState(state) {
  const out = clone(state);
  out.hidden = null;
  return out;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function requireString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RequestError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function requireInteger(value, name) {
  if (!Number.isInteger(value)) {
    throw new RequestError(`${name} must be an integer`);
  }
  return value;
}

function assertD1Success(result, message) {
  if (result?.success === false) throw new Error(message);
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

class RequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestError";
  }
}