import { CARD_INFO, MarketConsts, NEIGHBORS, TileType } from "./game-data.js";

const LEAF_SCORES = [1, 3, 7];
const ROCK_SCORES = [1, 3, 7];
const FIELD_SCORE = 5;
const BUILDING_SCORE = 5;
const WATER_SCORES = [0, 2, 5, 8, 11];
const WATER_BONUS = 4;

export function scoreBoard(board) {
  return scoreLeaf(board) + scoreRock(board) + scoreField(board) + scoreBuilding(board) + scoreWater(board) + scoreCards(board);
}

export function scoreLeaf(board) {
  let out = 0;
  for (let pos = 0; pos < board.tileType.length; pos++) {
    if (board.tileType[pos] === TileType.LEAF) out += LEAF_SCORES[board.tileHeight[pos] - 1] ?? 0;
  }
  return out;
}

export function scoreRock(board) {
  let out = 0;
  for (let pos = 0; pos < board.tileType.length; pos++) {
    if (board.tileType[pos] !== TileType.ROCK) continue;
    for (const neigh of NEIGHBORS[pos]) {
      if (neigh === -1) continue;
      if (board.tileType[neigh] === TileType.ROCK) {
        out += ROCK_SCORES[board.tileHeight[pos] - 1] ?? 0;
        break;
      }
    }
  }
  return out;
}

export function scoreField(board) {
  let out = 0;
  const visited = Array(board.tileType.length).fill(false);

  for (let pos = 0; pos < board.tileType.length; pos++) {
    if (visited[pos]) continue;
    if (board.tileType[pos] !== TileType.FIELD) continue;

    visited[pos] = true;
    const queue = [pos];
    let size = 1;

    while (queue.length > 0) {
      const curr = queue.pop();
      for (const neigh of NEIGHBORS[curr]) {
        if (neigh === -1) continue;
        if (visited[neigh]) continue;
        if (board.tileType[neigh] !== TileType.FIELD) continue;
        visited[neigh] = true;
        queue.push(neigh);
        size += 1;
      }
    }

    if (size > 1) out += FIELD_SCORE;
  }

  return out;
}

export function scoreBuilding(board) {
  let out = 0;
  for (let pos = 0; pos < board.tileType.length; pos++) {
    if (board.tileType[pos] !== TileType.BUILDING || board.tileHeight[pos] !== 2) continue;

    const neighborTypes = Array(MarketConsts.TILE_TYPE_COUNT).fill(0);
    for (const neigh of NEIGHBORS[pos]) {
      if (neigh === -1) continue;
      const tileType = board.tileType[neigh];
      if (tileType === TileType.EMPTY) continue;
      neighborTypes[tileType] = 1;
    }

    if (neighborTypes.reduce((a, b) => a + b, 0) >= 3) out += BUILDING_SCORE;
  }
  return out;
}

export function scoreWater(board) {
  let maxDist = 0;
  const n = board.tileType.length;

  for (let pos = 0; pos < n; pos++) {
    if (board.tileType[pos] !== TileType.WATER) continue;

    const visited = Array(n).fill(false);
    const queue = [[pos, 0]];
    visited[pos] = true;

    while (queue.length > 0) {
      const [curr, dist] = queue.shift();
      if (maxDist < dist) maxDist = dist;

      for (const neigh of NEIGHBORS[curr]) {
        if (neigh === -1) continue;
        if (visited[neigh]) continue;
        if (board.tileType[neigh] !== TileType.WATER) continue;
        visited[neigh] = true;
        queue.push([neigh, dist + 1]);
      }
    }
  }

  if (maxDist < WATER_SCORES.length) return WATER_SCORES[maxDist];
  return WATER_SCORES[WATER_SCORES.length - 1] + (maxDist - WATER_SCORES.length + 1) * WATER_BONUS;
}

export function scoreCards(board) {
  let out = 0;

  for (let cardId = 0; cardId < board.completedCards.length; cardId++) {
    if (!board.completedCards[cardId]) continue;
    const card = CARD_INFO[cardId];
    if (card === null || card === undefined) continue;
    out += card.scores[card.scores.length - 1];
  }

  for (let slot = 0; slot < board.cardId.length; slot++) {
    const cardId = board.cardId[slot];
    if (cardId === 0) continue;

    const card = CARD_INFO[cardId];
    const cubesPlaced = card.scores.length - board.cardCubes[slot];
    if (cubesPlaced === 0) continue;
    out += card.scores[cubesPlaced - 1];
  }

  return out;
}