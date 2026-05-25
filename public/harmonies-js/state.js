import { BoardConsts, MarketConsts, TileType } from "./game-data.js";

export const STATE_TEMPLATE = {
  gameId: "",
  revision: 0,
  round: 0,
  terminal: false,

  board: {
    tileType: Array(BoardConsts.TILE_COUNT).fill(TileType.EMPTY),
    tileHeight: Array(BoardConsts.TILE_COUNT).fill(0),
    tileHasCube: Array(BoardConsts.TILE_COUNT).fill(false),
    cardId: Array(BoardConsts.CARD_SLOTS).fill(0),
    cardCubes: Array(BoardConsts.CARD_SLOTS).fill(0),
    completedCards: Array(MarketConsts.CARD_COUNT).fill(false),
  },

  market: {
    cardId: Array(MarketConsts.CARD_SLOTS).fill(0),
    tileTypes: Array.from(
      { length: MarketConsts.TILE_SLOTS },
      () => Array(MarketConsts.TILES_PER_SLOT).fill(TileType.EMPTY),
    ),
    remainingTileCounts: [...MarketConsts.INITIAL_TILE_COUNTS],
    remainingCardCount: MarketConsts.CARD_COUNT - 1,
  },

  turn: {
    chosenTileSlot: null,
    tilesPlaced: 0,
  },

  hidden: {
    seed: 0,
    tileBag: [],
    tileCursor: 0,
    cardDeck: [],
    cardCursor: 0,
  },
};