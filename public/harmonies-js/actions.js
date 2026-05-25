// actions.js
// Deterministic action reducers. Each exported action receives a state and a local action index, validates it, and returns a new state.

import { BoardConsts, CARD_INFO, MarketConsts, NEIGHBORS, TileType } from "./game-data.js";

const PLACE_TILE_ACTION_SIZE = BoardConsts.TILE_COUNT * MarketConsts.TILE_SLOTS * MarketConsts.TILES_PER_SLOT;
const PLACE_CUBE_ACTION_SIZE = BoardConsts.TILE_COUNT * BoardConsts.CARD_SLOTS;

export class InvalidActionError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidActionError";
  }
}

export function placeTile(state, action) {
  const decoded = decodePlaceTile(action);
  if (!canPlaceTile(state, decoded)) throw new InvalidActionError("invalid place-tile action");

  const next = cloneState(state);
  const { slot, tileIdx, pos } = decoded;
  const tileType = next.market.tileTypes[slot][tileIdx];

  next.board.tileType[pos] = tileType;
  next.board.tileHeight[pos] += 1;
  next.market.tileTypes[slot][tileIdx] = TileType.EMPTY;

  if (next.turn.tilesPlaced === 0) next.turn.chosenTileSlot = slot;
  next.turn.tilesPlaced += 1;
  next.revision += 1;

  return next;
}

export function placeCube(state, action) {
  const decoded = decodePlaceCube(action);
  if (!canPlaceCube(state, decoded)) throw new InvalidActionError("invalid place-cube action");

  const next = cloneState(state);
  const { cardIdx, pos } = decoded;
  const cardId = next.board.cardId[cardIdx];

  next.board.tileHasCube[pos] = true;
  next.board.cardCubes[cardIdx] -= 1;

  if (next.board.cardCubes[cardIdx] === 0) {
    next.board.completedCards[cardId] = true;
    next.board.cardId[cardIdx] = 0;
    next.board.cardCubes[cardIdx] = 0;
  }

  next.revision += 1;
  return next;
}

export function takeCard(state, action) {
  if (!canTakeCard(state, action)) throw new InvalidActionError("invalid take-card action");

  const next = cloneState(state);
  const emptyBoardSlot = next.board.cardId.indexOf(0);
  const cardId = next.market.cardId[action];

  next.board.cardId[emptyBoardSlot] = cardId;
  next.board.cardCubes[emptyBoardSlot] = CARD_INFO[cardId].scores.length;
  next.market.cardId[action] = 0;
  next.revision += 1;

  return next;
}

export function discardCard(state, action) {
  if (!canDiscardCard(state, action)) throw new InvalidActionError("invalid discard-card action");

  const next = cloneState(state);
  next.market.cardId[action] = 0;
  next.revision += 1;
  return next;
}

export function endTurn(state, action) {
  if (action !== 0) throw new InvalidActionError("invalid end-turn action");
  if (!canEndTurn(state)) throw new InvalidActionError("invalid end-turn action");
  assertHiddenState(state);

  const emptyCardSlots = marketEmptyCardSlots(state);

  if (
    emptyBoardCellCount(state) <= 2 ||
    !canDrawTiles(state, MarketConsts.TILES_PER_SLOT) ||
    !canDrawCards(state, emptyCardSlots.length)
  ) {
    const terminalState = cloneState(state);
    terminalState.terminal = true;
    terminalState.revision += 1;
    return terminalState;
  }

  const next = cloneState(state);
  next.market.tileTypes[next.turn.chosenTileSlot] = drawTiles(next, MarketConsts.TILES_PER_SLOT);
  for (const slot of marketEmptyCardSlots(next)) next.market.cardId[slot] = drawCard(next);

  next.turn.chosenTileSlot = null;
  next.turn.tilesPlaced = 0;
  next.round += 1;
  next.revision += 1;

  return next;
}

export function decodePlaceTile(action) {
  assertLocalAction(action, PLACE_TILE_ACTION_SIZE, "place-tile action");
  const pos = action % BoardConsts.TILE_COUNT;
  const rest = Math.floor(action / BoardConsts.TILE_COUNT);
  const tileIdx = rest % MarketConsts.TILES_PER_SLOT;
  const slot = Math.floor(rest / MarketConsts.TILES_PER_SLOT);
  return { slot, tileIdx, pos };
}

export function decodePlaceCube(action) {
  assertLocalAction(action, PLACE_CUBE_ACTION_SIZE, "place-cube action");
  const pos = action % BoardConsts.TILE_COUNT;
  const cardIdx = Math.floor(action / BoardConsts.TILE_COUNT);
  return { cardIdx, pos };
}

export function canPlaceTile(state, { slot, tileIdx, pos }) {
  if (!inRange(slot, 0, MarketConsts.TILE_SLOTS)) return false;
  if (!inRange(tileIdx, 0, MarketConsts.TILES_PER_SLOT)) return false;
  if (!inRange(pos, 0, BoardConsts.TILE_COUNT)) return false;
  if (state.terminal) return false;
  if (state.turn.tilesPlaced >= MarketConsts.TILES_PER_SLOT) return false;
  if (state.turn.tilesPlaced > 0 && state.turn.chosenTileSlot !== slot) return false;
  if (state.turn.tilesPlaced === 0 && state.turn.chosenTileSlot !== null) return false;

  const tileType = state.market.tileTypes[slot][tileIdx];
  if (tileType === TileType.EMPTY) return false;
  if (state.board.tileHasCube[pos]) return false;

  return canStackTile(tileType, state.board.tileType[pos], state.board.tileHeight[pos]);
}

export function canPlaceCube(state, { cardIdx, pos }) {
  if (!inRange(cardIdx, 0, BoardConsts.CARD_SLOTS)) return false;
  if (!inRange(pos, 0, BoardConsts.TILE_COUNT)) return false;
  if (state.terminal) return false;
  if (state.board.tileHasCube[pos]) return false;

  const cardId = state.board.cardId[cardIdx];
  if (cardId === 0) return false;
  if (state.board.cardCubes[cardIdx] <= 0) return false;

  const card = CARD_INFO[cardId];
  if (!card) return false;

  for (let rot = 0; rot < 6; rot++) {
    let matches = true;
    for (const cell of card.pattern) {
      const actual = lookupCell(state, pos, cell.r, cell.d + rot);
      if (actual === null || actual.tileType !== cell.tileType || actual.tileHeight !== cell.h) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }

  return false;
}

export function canTakeCard(state, action) {
  if (!inRange(action, 0, MarketConsts.CARD_SLOTS)) return false;
  if (state.terminal) return false;
  if (state.market.cardId.some(cardId => cardId === 0)) return false;
  if (!state.board.cardId.some(cardId => cardId === 0)) return false;
  return state.market.cardId[action] !== 0;
}

export function canDiscardCard(state, action) {
  if (!inRange(action, 0, MarketConsts.CARD_SLOTS)) return false;
  if (state.terminal) return false;
  if (state.market.cardId.some(cardId => cardId === 0)) return false;
  return state.market.cardId[action] !== 0;
}

export function canEndTurn(state) {
  return !state.terminal && state.turn.tilesPlaced === MarketConsts.TILES_PER_SLOT && state.turn.chosenTileSlot !== null;
}

export function canDrawTiles(state, count) {
  assertHiddenState(state);
  return state.hidden.tileCursor + count <= state.hidden.tileBag.length;
}

export function canDrawCards(state, count) {
  assertHiddenState(state);
  return state.hidden.cardCursor + count <= state.hidden.cardDeck.length;
}

export function drawTiles(state, count) {
  assertHiddenState(state);
  if (!Number.isInteger(count) || count < 0) throw new Error("tile draw count must be a non-negative integer");
  if (!canDrawTiles(state, count)) throw new Error("cannot draw tiles: tile bag exhausted");

  const start = state.hidden.tileCursor;
  const tiles = state.hidden.tileBag.slice(start, start + count);
  state.hidden.tileCursor += count;
  for (const tileType of tiles) state.market.remainingTileCounts[tileType] -= 1;
  return tiles;
}

export function drawCard(state) {
  assertHiddenState(state);
  if (!canDrawCards(state, 1)) throw new Error("cannot draw card: card deck exhausted");

  const cardId = state.hidden.cardDeck[state.hidden.cardCursor++];
  state.market.remainingCardCount -= 1;
  return cardId;
}

export function marketEmptyCardSlots(state) {
  const out = [];
  for (let i = 0; i < state.market.cardId.length; i++) if (state.market.cardId[i] === 0) out.push(i);
  return out;
}

export function emptyBoardCellCount(state) {
  let n = 0;
  for (const tileType of state.board.tileType) if (tileType === TileType.EMPTY) n++;
  return n;
}

export function canStackTile(tileType, baseType, baseHeight) {
  if (baseType === TileType.EMPTY) return true;
  if (tileType === TileType.ROCK) return baseType === TileType.ROCK && baseHeight < 3;
  if (tileType === TileType.BUILDING) return [TileType.ROCK, TileType.WOOD, TileType.BUILDING].includes(baseType) && baseHeight === 1;
  if (tileType === TileType.WOOD) return baseType === TileType.WOOD && baseHeight === 1;
  if (tileType === TileType.LEAF) return baseType === TileType.WOOD && (baseHeight === 1 || baseHeight === 2);
  return false;
}

function lookupCell(state, pos, distance, direction) {
  let curr = pos;
  for (let i = 0; i < distance; i++) {
    curr = NEIGHBORS[curr][mod(direction, 6)];
    if (curr === -1) return null;
  }
  return {
    tileType: state.board.tileType[curr],
    tileHeight: state.board.tileHeight[curr],
  };
}

function assertHiddenState(state) {
  if (state.hidden === null || state.hidden === undefined) throw new Error("hidden state is required");
  if (!Array.isArray(state.hidden.tileBag)) throw new Error("hidden.tileBag is required");
  if (!Array.isArray(state.hidden.cardDeck)) throw new Error("hidden.cardDeck is required");
  if (!Number.isInteger(state.hidden.tileCursor)) throw new Error("hidden.tileCursor is required");
  if (!Number.isInteger(state.hidden.cardCursor)) throw new Error("hidden.cardCursor is required");
}

function assertLocalAction(action, size, name) {
  if (!Number.isInteger(action) || action < 0 || action >= size) throw new InvalidActionError(`${name} out of range`);
}

function inRange(value, min, maxExclusive) {
  return Number.isInteger(value) && value >= min && value < maxExclusive;
}

function mod(x, n) {
  return ((x % n) + n) % n;
}

function cloneState(state) {
  if (typeof structuredClone === "function") return structuredClone(state);
  return JSON.parse(JSON.stringify(state));
}