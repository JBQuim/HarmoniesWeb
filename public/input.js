import { encodeDiscardCard, encodeEndTurn, encodePlaceCube, encodePlaceTile, encodeTakeCard } from "./harmonies-js/rules.js";

export const EMPTY_SELECTION = Object.freeze({ kind: null, payload: null });

export function handleHitbox(hitbox, selection = EMPTY_SELECTION) {
  if (hitbox.kind === "market_tile") {
    return {
      kind: "selection",
      selection: { kind: "market_tile", payload: hitbox.payload },
      message: `Selected market tile ${JSON.stringify(hitbox.payload)}.`,
    };
  }

  if (hitbox.kind === "board_card") {
    return {
      kind: "selection",
      selection: { kind: "board_card", payload: hitbox.payload },
      message: `Selected board card ${hitbox.payload}.`,
    };
  }

  if (hitbox.kind === "board_hex") {
    if (selection.kind === "market_tile") {
      const pos = hitbox.payload;
      const [slot, tileIdx] = selection.payload;
      return {
        kind: "action",
        action: encodePlaceTile(slot, tileIdx, pos),
        selection: EMPTY_SELECTION,
        message: `Placed market tile ${slot}:${tileIdx} on board hex ${pos}.`,
      };
    }

    if (selection.kind === "board_card") {
      const pos = hitbox.payload;
      const cardIdx = selection.payload;
      return {
        kind: "action",
        action: encodePlaceCube(cardIdx, pos),
        selection: EMPTY_SELECTION,
        message: `Placed cube from board card ${cardIdx} on board hex ${pos}.`,
      };
    }

    return {
      kind: "message",
      selection,
      message: `Board hex ${hitbox.payload}. Select a market tile or board card first.`,
    };
  }

  if (hitbox.kind === "market_card_x") {
    return {
      kind: "action",
      action: encodeDiscardCard(hitbox.payload),
      selection: EMPTY_SELECTION,
      message: `Discarded market card ${hitbox.payload}.`,
    };
  }

  if (hitbox.kind === "market_card") {
    return {
      kind: "action",
      action: encodeTakeCard(hitbox.payload),
      selection: EMPTY_SELECTION,
      message: `Took market card ${hitbox.payload}.`,
    };
  }

  if (hitbox.kind === "end_turn") {
    return {
      kind: "action",
      action: encodeEndTurn(),
      selection: EMPTY_SELECTION,
      message: "Ending turn.",
    };
  }

  return { kind: "message", selection, message: "Unknown click target." };
}