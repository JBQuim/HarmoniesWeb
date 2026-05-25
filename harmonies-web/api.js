export const API_URL = "https://harmonies-api.joaquinbaixerasbuye.workers.dev";

export async function createGame({ gameId, seed }) {
  return postJson({
    op: "newGame",
    gameId,
    seed,
  });
}

export async function sendAction({ gameId, action, revision }) {
  return postJson({
    op: "move",
    gameId,
    action,
    revision,
  });
}

async function postJson(body) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (data === null) throw new Error(`Server returned non-JSON response with status ${response.status}`);
  if (!response.ok || data.ok === false) throw new ApiError(data.error ?? `HTTP ${response.status}`, data);
  return data;
}

export class ApiError extends Error {
  constructor(message, data) {
    super(message);
    this.name = "ApiError";
    this.data = data;
  }
}