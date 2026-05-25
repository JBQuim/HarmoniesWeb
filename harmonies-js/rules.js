import { BoardConsts, MarketConsts } from "./game-data.js";
import { STATE_TEMPLATE } from "./state.js";
import { discardCard, drawCard, drawTiles, endTurn, InvalidActionError, placeCube, placeTile, takeCard } from "./actions.js";

export function applyAction(state, action) {
  const placeTileStart = 0;
  const placeTileSize = BoardConsts.TILE_COUNT * MarketConsts.TILE_SLOTS * MarketConsts.TILES_PER_SLOT;
  const placeCubeStart = placeTileStart + placeTileSize;
  const placeCubeSize = BoardConsts.TILE_COUNT * BoardConsts.CARD_SLOTS;
  const takeCardStart = placeCubeStart + placeCubeSize;
  const takeCardSize = MarketConsts.CARD_SLOTS;
  const discardCardStart = takeCardStart + takeCardSize;
  const discardCardSize = MarketConsts.CARD_SLOTS;
  const endTurnStart = discardCardStart + discardCardSize;
  const endTurnSize = 1;
  const actionSize = endTurnStart + endTurnSize;

  if (!Number.isInteger(action) || action < 0 || action >= actionSize) throw new InvalidActionError("action out of range");

  if (action < placeCubeStart) return placeTile(state, action - placeTileStart);
  if (action < takeCardStart) return placeCube(state, action - placeCubeStart);
  if (action < discardCardStart) return takeCard(state, action - takeCardStart);
  if (action < endTurnStart) return discardCard(state, action - discardCardStart);
  return endTurn(state, action - endTurnStart);
}

export function encodePlaceTile(slot, tileIdx, pos) {
  return pos + (slot * MarketConsts.TILES_PER_SLOT + tileIdx) * BoardConsts.TILE_COUNT;
}

export function encodePlaceCube(cardIdx, pos) {
  const start = BoardConsts.TILE_COUNT * MarketConsts.TILE_SLOTS * MarketConsts.TILES_PER_SLOT;
  return start + pos + cardIdx * BoardConsts.TILE_COUNT;
}

export function encodeTakeCard(slot) {
  const placeTileSize = BoardConsts.TILE_COUNT * MarketConsts.TILE_SLOTS * MarketConsts.TILES_PER_SLOT;
  const placeCubeSize = BoardConsts.TILE_COUNT * BoardConsts.CARD_SLOTS;
  return placeTileSize + placeCubeSize + slot;
}

export function encodeDiscardCard(slot) {
  return encodeTakeCard(MarketConsts.CARD_SLOTS) + slot;
}

export function encodeEndTurn() {
  return encodeDiscardCard(MarketConsts.CARD_SLOTS);
}

export function createNewState({ gameId = "", seed = 0 } = {}) {
  const state = clone(STATE_TEMPLATE);
  state.gameId = gameId;
  state.hidden.seed = seed;
  state.hidden.tileBag = makeShuffledTileBag(seed);
  state.hidden.cardDeck = makeShuffledCardDeck(seed);
  state.market.tileTypes = chunk(drawTiles(state, MarketConsts.TILE_SLOTS * MarketConsts.TILES_PER_SLOT), MarketConsts.TILES_PER_SLOT);
  for (let i = 0; i < MarketConsts.CARD_SLOTS; i++) state.market.cardId[i] = drawCard(state);
  return state;
}

function makeShuffledTileBag(seed) {
  const tiles = [];
  for (let tileType = 0; tileType < MarketConsts.INITIAL_TILE_COUNTS.length; tileType++) {
    for (let i = 0; i < MarketConsts.INITIAL_TILE_COUNTS[tileType]; i++) tiles.push(tileType);
  }
  return shuffled(tiles, `${seed}:tiles`);
}

function makeShuffledCardDeck(seed) {
  const cards = [];
  for (let cardId = 1; cardId < MarketConsts.CARD_COUNT; cardId++) cards.push(cardId);
  return shuffled(cards, `${seed}:cards`);
}

function shuffled(values, seed) {
  const out = [...values];
  const rng = mulberry32(hashStringToUint32(String(seed)));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mulberry32(seed) {
  let x = seed >>> 0;
  return function rng() {
    x = (x + 0x6D2B79F5) >>> 0;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToUint32(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}