import { CARD_INFO, TileType } from "../harmonies-js/game-data.js";

export const Palette = {
  bg: "#7d6847",
  hexFill: "#f0d39a",
  squareFill: "#f3de74",
};

const TILE_COLORS = {
  [TileType.EMPTY]: null,
  [TileType.ROCK]: "#8d8a84",
  [TileType.BUILDING]: "#c9553f",
  [TileType.WOOD]: "#8b5a2b",
  [TileType.LEAF]: "#6fa85a",
  [TileType.WATER]: "#5aa7d8",
  [TileType.FIELD]: "#d6b84b",
};

class Rect {
  constructor(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  get width() { return this.right - this.left; }
  get height() { return this.bottom - this.top; }
  get cx() { return (this.left + this.right) / 2; }
  get cy() { return (this.top + this.bottom) / 2; }
}

class Layout {
  constructor(screenW = 720) {
    this.screenW = screenW;
    this.screenHRatio = 0.90;

    this.hexRRatio = 0.05;
    this.hexDxRatio = 1.5;
    this.circleRRatio = 0.6;
    this.squareHalfRatio = 0.3;

    this.outlineWRatio = 0.0045;
    this.squareOutlineScale = 0.8;
    this.fontSizeRatio = 0.018;

    this.tripletOrbitScale = 1.28;
    this.tripletPaddingScale = 0.35;
    this.tripletColumnGapScale = 0.32;

    this.cardWRatio = 0.19;
    this.cardAspect = 0.86;
    this.cardCornerScale = 0.08;
    this.cardGapRatio = 0.025;

    this.cardScoreBandHScale = 0.23;
    this.cardScorePadXScale = 0.08;
    this.cardScoreGapScale = 0.175;
    this.cardScoreYScale = 0.54;
    this.cardScoreCubeHalfScale = 0.060;
    this.cardSeparatorWScale = 0.75;

    this.cardHexRScale = 0.155;
    this.cardPatternYShiftScale = 0.0;
    this.cardPatternFontBoost = 1.35;

    this.cardXSquareHalfScale = 0.055;
    this.cardXPadScale = 0.045;
    this.cardXLineScale = 0.55;

    this.sidePanelGapRatio = 0.08;
    this.mainBottomMarginRatio = 0.04;
    this.topMarginRatio = 0.04;
    this.topCardsToBoardGapRatio = 0.035;

    this.scorePanelFontScale = 0.25;
    this.endTurnHRatio = 0.075;
    this.endTurnFontRatio = 0.032;
    this.controlPanelWScale = 2.70;
    this.controlPanelGapRatio = 0.012;

    this.compute();
  }

  compute() {
    this.screenH = Math.floor(this.screenW * this.screenHRatio);

    this.hexR = this.screenW * this.hexRRatio;
    this.hexDx = this.hexR * this.hexDxRatio;
    this.hexDy = this.hexR * Math.sqrt(3);

    this.circleR = this.hexR * this.circleRRatio;
    this.squareHalf = this.hexR * this.squareHalfRatio;

    this.outlineW = Math.max(1, Math.floor(this.screenW * this.outlineWRatio));
    this.squareOutlineW = Math.max(1, Math.floor(this.outlineW * this.squareOutlineScale));
    this.fontSize = Math.max(10, Math.floor(this.screenW * this.fontSizeRatio));

    this.tripletOrbitR = this.circleR * this.tripletOrbitScale;
    this.tripletContainerR = this.tripletOrbitR + this.circleR * (1 + this.tripletPaddingScale);
    this.tripletColumnStep = 2 * this.tripletContainerR + this.tripletContainerR * this.tripletColumnGapScale;

    this.cardW = this.screenW * this.cardWRatio;
    this.cardH = this.cardW * this.cardAspect;
    this.cardCornerR = this.cardW * this.cardCornerScale;
    this.cardGap = this.screenW * this.cardGapRatio;
    this.cardColumnStep = this.cardH + this.cardGap;

    this.cardHexR = this.cardW * this.cardHexRScale;
    this.cardCircleR = this.cardHexR * this.circleRRatio;
    this.cardSquareHalf = this.cardHexR * this.squareHalfRatio;
    this.cardFontSize = Math.max(8, Math.floor(this.fontSize * this.cardHexR / this.hexR * this.cardPatternFontBoost));
    this.cardPatternYShift = this.cardH * this.cardPatternYShiftScale;

    this.cardScoreBandH = this.cardH * this.cardScoreBandHScale;
    this.cardScoreFontSize = Math.max(8, Math.floor(this.cardFontSize * 0.95));
    this.cardScorePadX = this.cardW * this.cardScorePadXScale;
    this.cardScoreGap = this.cardW * this.cardScoreGapScale;
    this.cardScoreY = this.cardScoreBandH * this.cardScoreYScale;
    this.cardScoreCubeHalf = this.cardW * this.cardScoreCubeHalfScale;
    this.cardSeparatorW = Math.max(1, Math.floor(this.outlineW * this.cardSeparatorWScale));

    this.cardXSquareHalf = this.cardW * this.cardXSquareHalfScale;
    this.cardXPad = this.cardW * this.cardXPadScale;
    this.cardXLineW = Math.max(1, Math.floor(this.outlineW * this.cardXLineScale));

    this.sidePanelGap = this.screenW * this.sidePanelGapRatio;
    this.mainBottomMargin = this.screenW * this.mainBottomMarginRatio;
    this.topMargin = this.screenW * this.topMarginRatio;
    this.topCardsToBoardGap = this.screenW * this.topCardsToBoardGapRatio;

    this.scorePanelFontSize = Math.max(16, Math.floor(this.cardW * this.scorePanelFontScale));
    this.endTurnH = this.screenW * this.endTurnHRatio;
    this.endTurnFontSize = Math.max(14, Math.floor(this.screenW * this.endTurnFontRatio));
    this.controlPanelW = this.tripletContainerR * this.controlPanelWScale;
    this.controlPanelGap = this.screenW * this.controlPanelGapRatio;
  }
}

class Geometry {
  constructor(layout) {
    this.layout = layout;
    this.rowsByCol = [5, 4, 5, 4, 5];

    this.rawBoardCenters = this.makeRawBoardCenters();
    this.rawBoardBounds = this.makeRawBoardBounds();
    this.horizontal = this.makeHorizontalLayout();
    this.boardBounds = this.makeBoardDisplayBounds();
    this.boardCenters = this.makeBoardCenters();
    this.marketCardRects = this.makeMarketCardRects();
    this.boardCardRects = this.makeBoardCardRects();
    this.marketTileHolders = this.makeMarketTileHolders();
    this.controlPanelRects = this.makeControlPanelRects();
  }

  mainBottomY() {
    return this.layout.screenH - this.layout.mainBottomMargin;
  }

  bottomAlignedStackCenters(n, itemH, step, bottomY) {
    const first = bottomY - itemH / 2 - (n - 1) * step;
    return Array.from({ length: n }, (_, i) => first + i * step);
  }

  makeRawBoardCenters() {
    const out = [];
    for (let col = 0; col < this.rowsByCol.length; col++) {
      const rows = this.rowsByCol[col];
      for (let row = 0; row < rows; row++) {
        const x = col * this.layout.hexDx;
        const y = row * this.layout.hexDy + (col % 2 ? this.layout.hexDy / 2 : 0);
        out.push([x, y]);
      }
    }
    return out;
  }

  makeRawBoardBounds() {
    const halfH = this.layout.hexR * Math.sqrt(3) / 2;
    const xs = this.rawBoardCenters.map(([x]) => x);
    const ys = this.rawBoardCenters.map(([, y]) => y);
    return new Rect(
      Math.min(...xs.map(x => x - this.layout.hexR)),
      Math.min(...ys.map(y => y - halfH)),
      Math.max(...xs.map(x => x + this.layout.hexR)),
      Math.max(...ys.map(y => y + halfH)),
    );
  }

  makeHorizontalLayout() {
    const raw = this.rawBoardBounds;
    const groupW = this.layout.cardW + this.layout.sidePanelGap + raw.width + this.layout.sidePanelGap + 2 * this.layout.tripletContainerR;
    const leftMargin = (this.layout.screenW - groupW) / 2;
    const marketCardCx = leftMargin + this.layout.cardW / 2;
    const boardLeft = leftMargin + this.layout.cardW + this.layout.sidePanelGap;
    const boardRight = boardLeft + raw.width;
    const marketTileCx = boardRight + this.layout.sidePanelGap + this.layout.tripletContainerR;
    return { leftMargin, marketCardCx, boardLeft, boardRight, marketTileCx };
  }

  makeBoardDisplayBounds() {
    const raw = this.rawBoardBounds;
    const bottom = this.mainBottomY();
    return new Rect(this.horizontal.boardLeft, bottom - raw.height, this.horizontal.boardRight, bottom);
  }

  makeBoardCenters() {
    const raw = this.rawBoardBounds;
    const board = this.boardBounds;
    const offsetX = board.left - raw.left;
    const offsetY = board.bottom - raw.bottom;
    return this.rawBoardCenters.map(([x, y]) => [x + offsetX, y + offsetY]);
  }

  cardRectAt(cx, cy) {
    return new Rect(cx - this.layout.cardW / 2, cy - this.layout.cardH / 2, cx + this.layout.cardW / 2, cy + this.layout.cardH / 2);
  }

  makeMarketCardRects() {
    const ys = this.bottomAlignedStackCenters(3, this.layout.cardH, this.layout.cardColumnStep, this.mainBottomY());
    return ys.map(y => this.cardRectAt(this.horizontal.marketCardCx, y));
  }

  makeBoardCardRects() {
    const gridW = 2 * this.layout.cardW + this.layout.cardGap;
    const gridH = 2 * this.layout.cardH + this.layout.cardGap;
    const left = this.boardBounds.cx - gridW / 2;
    const top = this.boardBounds.top - this.layout.topCardsToBoardGap - gridH;
    const out = [];

    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const cx = left + this.layout.cardW / 2 + col * (this.layout.cardW + this.layout.cardGap);
      const cy = top + this.layout.cardH / 2 + row * (this.layout.cardH + this.layout.cardGap);
      out.push(this.cardRectAt(cx, cy));
    }

    return out;
  }

  makeMarketTileHolders() {
    const itemH = 2 * this.layout.tripletContainerR;
    const ys = this.bottomAlignedStackCenters(3, itemH, this.layout.tripletColumnStep, this.mainBottomY());
    const x = this.horizontal.marketTileCx;

    return ys.map(y => {
      const centers = [-90, 150, 30].map(angleDeg => {
        const a = radians(angleDeg);
        return [
          x + this.layout.tripletOrbitR * Math.cos(a),
          y + this.layout.tripletOrbitR * Math.sin(a),
        ];
      });
      return { center: [x, y], tileCenters: centers };
    });
  }

  makeControlPanelRects() {
    const x0 = this.horizontal.marketTileCx - this.layout.controlPanelW / 2;
    const x1 = this.horizontal.marketTileCx + this.layout.controlPanelW / 2;
    const scoreY0 = this.layout.topMargin;
    const scoreY1 = scoreY0 + this.layout.endTurnH;
    const endY0 = scoreY1 + this.layout.controlPanelGap;
    const endY1 = endY0 + this.layout.endTurnH;
    return {
      score: new Rect(x0, scoreY0, x1, scoreY1),
      endTurn: new Rect(x0, endY0, x1, endY1),
    };
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.layout = new Layout(canvas.width);
    this.geometry = new Geometry(this.layout);
    this.hitboxes = [];
  }

  draw(gameState, score, selection) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = Palette.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.hitboxes = [];

    this.drawScorePanel(score);
    this.drawEndTurnButton();
    this.drawBoardCards(gameState, selection);
    this.drawMarketCards(gameState);
    this.drawBoard(gameState);
    this.drawMarketTiles(gameState, selection);
  }

  addHitbox(hitbox) {
    this.hitboxes.push(hitbox);
  }

  hitTest(x, y) {
    for (let i = this.hitboxes.length - 1; i >= 0; i--) {
      const h = this.hitboxes[i];
      if (hitboxContains(h, x, y)) return h;
    }
    return null;
  }

  drawScorePanel(score) {
    const rect = this.geometry.controlPanelRects.score;
    this.roundedRect(rect, this.layout.cardCornerR, Palette.hexFill, darker(Palette.hexFill), this.layout.outlineW);
    this.text(String(score ?? 0), rect.cx, rect.cy, this.layout.scorePanelFontSize, "bold");
  }

  drawEndTurnButton() {
    const rect = this.geometry.controlPanelRects.endTurn;
    this.roundedRect(rect, this.layout.cardCornerR, Palette.hexFill, darker(Palette.hexFill), this.layout.outlineW);
    this.addHitbox({ kind: "end_turn", shape: "rect", rect, payload: null });
    this.text("End Turn", rect.cx, rect.cy, this.layout.endTurnFontSize, "bold");
  }

  drawMarketCards(gameState) {
    const ids = gameState.market.cardId;
    for (let slot = 0; slot < this.geometry.marketCardRects.length; slot++) {
      const rect = this.geometry.marketCardRects[slot];
      const cardId = Number(ids[slot]);
      this.drawCard(rect, cardId, 0, {
        showX: cardId !== 0,
        blank: cardId === 0,
        hitboxKind: "market_card",
        xHitboxKind: "market_card_x",
        payload: slot,
        selected: false,
      });
    }
  }

  drawBoardCards(gameState, selection) {
    const ids = gameState.board.cardId;
    const cubes = gameState.board.cardCubes;
    for (let slot = 0; slot < this.geometry.boardCardRects.length; slot++) {
      const rect = this.geometry.boardCardRects[slot];
      const cardId = Number(ids[slot]);
      this.drawCard(rect, cardId, Number(cubes[slot]), {
        showX: false,
        blank: cardId === 0,
        hitboxKind: "board_card",
        xHitboxKind: "board_card_x",
        payload: slot,
        selected: selection.kind === "board_card" && selection.payload === slot,
      });
    }
  }

  drawCard(rect, cardId, cubesRemaining, options) {
    const card = cardId === 0 ? null : CARD_INFO[cardId];

    this.roundedRect(rect, this.layout.cardCornerR, Palette.hexFill, darker(Palette.hexFill), this.layout.outlineW);

    if (options.selected) {
      this.strokeRect(rect, "#111", Math.max(3, this.layout.outlineW * 1.4));
    }

    if (!options.blank) {
      this.addHitbox({ kind: options.hitboxKind, shape: "rect", rect, payload: options.payload });
    }

    if (options.blank || card === null || card === undefined) return;

    const scoreY1 = rect.top + this.layout.cardScoreBandH;
    const patternCy = scoreY1 + (rect.bottom - scoreY1) / 2;

    this.line(
      rect.left + this.layout.cardCornerR * 0.65,
      scoreY1,
      rect.right - this.layout.cardCornerR * 0.65,
      scoreY1,
      darker(Palette.hexFill),
      this.layout.cardSeparatorW,
    );

    this.drawCardScores(rect.left, rect.top, rect.right, scoreY1, card.scores, cubesRemaining);
    this.drawCardPattern(rect.cx, patternCy, card.pattern);

    if (options.showX) {
      const xRect = this.cardXRect(rect);
      this.drawCardXMarker(xRect);
      this.addHitbox({ kind: options.xHitboxKind, shape: "rect", rect: xRect, payload: options.payload });
    }
  }

  drawCardScores(x0, y0, x1, y1, scores, nCubes = 0) {
    const scoreY = y0 + this.layout.cardScoreY;
    let x = x1 - this.layout.cardScorePadX - this.layout.cardScoreCubeHalf;
    const reversed = [...scores].reverse();

    for (let i = 0; i < reversed.length; i++) {
      if (i < Math.max(0, Math.min(nCubes, scores.length))) {
        this.cube(x, scoreY, this.layout.cardScoreCubeHalf, this.layout.squareOutlineW);
      }

      this.text(String(reversed[i]), x, scoreY, this.layout.cardScoreFontSize, "bold");
      x -= this.layout.cardScoreGap;
    }
  }

  drawCardPattern(cx, cy, pattern) {
    const targetY = cy + this.layout.cardPatternYShift;
    const positions = centeredPatternPositions(pattern, cx, targetY, this.layout.cardHexR);

    for (let i = 0; i < positions.length; i++) {
      const [cell, hx, hy] = positions[i];
      this.drawCardPatternCell(hx, hy, cell, i === 0);
    }
  }

  drawCardPatternCell(cx, cy, cell, hasCube) {
    const pts = flatHexPoints(cx, cy, this.layout.cardHexR);
    this.fillPoly(pts, Palette.hexFill, darker(Palette.hexFill), this.layout.outlineW);
    this.drawCircleTile(cx, cy, Number(cell.tileType), this.layout.cardCircleR, this.layout.outlineW);

    if (hasCube) {
      this.cube(cx, cy, this.layout.cardSquareHalf, this.layout.squareOutlineW);
    }

    this.drawValue(cx, cy, Number(cell.h), this.layout.cardFontSize);
  }

  cardXRect(cardRect) {
    const half = this.layout.cardXSquareHalf;
    const cx = cardRect.left + this.layout.cardXPad + half;
    const cy = cardRect.bottom - this.layout.cardXPad - half;
    return new Rect(cx - half, cy - half, cx + half, cy + half);
  }

  drawCardXMarker(rect) {
    const ctx = this.ctx;
    ctx.fillStyle = Palette.hexFill;
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    const d = rect.width * 0.275;
    this.line(rect.cx - d, rect.cy - d, rect.cx + d, rect.cy + d, darker(Palette.hexFill, 0.58), this.layout.cardXLineW);
    this.line(rect.cx - d, rect.cy + d, rect.cx + d, rect.cy - d, darker(Palette.hexFill, 0.58), this.layout.cardXLineW);
  }

  drawBoard(gameState) {
    const b = gameState.board;

    for (let pos = 0; pos < this.geometry.boardCenters.length; pos++) {
      const [x, y] = this.geometry.boardCenters[pos];
      const pts = flatHexPoints(x, y, this.layout.hexR);
      this.addHitbox({ kind: "board_hex", shape: "poly", points: pts, payload: pos });

      const tileType = Number(b.tileType[pos]);
      const hasCube = Boolean(b.tileHasCube[pos]);
      const value = Number(b.tileHeight[pos]);

      this.drawHexTile(x, y, tileType, hasCube, value);
    }
  }

  drawMarketTiles(gameState, selection) {
    const tiles = gameState.market.tileTypes;

    for (let holderIdx = 0; holderIdx < this.geometry.marketTileHolders.length; holderIdx++) {
      const holder = this.geometry.marketTileHolders[holderIdx];
      const [cx, cy] = holder.center;

      this.circle(cx, cy, this.layout.tripletContainerR, Palette.hexFill, darker(Palette.hexFill), this.layout.outlineW);

      for (let tileIdx = 0; tileIdx < holder.tileCenters.length; tileIdx++) {
        const [tx, ty] = holder.tileCenters[tileIdx];
        const tileType = Number(tiles[holderIdx][tileIdx]);

        this.drawCircleTile(tx, ty, tileType, this.layout.circleR, this.layout.outlineW);

        if (tileType !== TileType.EMPTY) {
          this.addHitbox({ kind: "market_tile", shape: "circle", cx: tx, cy: ty, r: this.layout.circleR, payload: [holderIdx, tileIdx] });
        }

        if (selection.kind === "market_tile" && selection.payload[0] === holderIdx && selection.payload[1] === tileIdx) {
          this.circle(tx, ty, this.layout.circleR + 5, "transparent", "#111", 4);
        }
      }
    }
  }

  drawHexTile(cx, cy, tileType, hasCube, value) {
    const pts = flatHexPoints(cx, cy, this.layout.hexR);
    this.fillPoly(pts, Palette.hexFill, darker(Palette.hexFill), this.layout.outlineW);
    this.drawCircleTile(cx, cy, tileType, this.layout.circleR, this.layout.outlineW);

    if (hasCube) {
      this.cube(cx, cy, this.layout.squareHalf, this.layout.squareOutlineW);
    }

    this.drawValue(cx, cy, value, this.layout.fontSize);
  }

  drawCircleTile(cx, cy, tileType, r, width) {
    const fill = TILE_COLORS[tileType];
    if (fill === null || fill === undefined) return;
    this.circle(cx, cy, r, fill, darker(fill), width);
  }

  drawValue(cx, cy, value, fontSize) {
    if (value !== 0 && value !== 1) {
      this.text(String(value), cx, cy, fontSize, "bold");
    }
  }

  cube(cx, cy, half, width) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(cx - half, cy - half, 2 * half, 2 * half);
    ctx.fillStyle = Palette.squareFill;
    ctx.fill();
    ctx.lineWidth = width;
    ctx.strokeStyle = darker(Palette.squareFill);
    ctx.stroke();
  }

  roundedRect(rect, radius, fill, stroke, width) {
    this.fillPoly(roundedRectPoints(rect.left, rect.top, rect.right, rect.bottom, radius), fill, stroke, width);
  }

  strokeRect(rect, stroke, width) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(rect.left, rect.top, rect.width, rect.height);
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  fillPoly(points, fill, stroke, width) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  circle(cx, cy, r, fill, stroke, width) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    if (fill !== "transparent") {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  line(x0, y0, x1, y1, stroke, width) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  text(text, x, y, size, weight = "normal") {
    const ctx = this.ctx;
    ctx.fillStyle = "black";
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }
}

function darker(hexColor, factor = 0.78) {
  const h = hexColor.replace("#", "");
  const r = Math.max(0, Math.min(255, Math.floor(parseInt(h.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.floor(parseInt(h.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.floor(parseInt(h.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function radians(deg) {
  return deg * Math.PI / 180;
}

function flatHexPoints(cx, cy, r) {
  return [0, 60, 120, 180, 240, 300].map(deg => {
    const a = radians(deg);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

function roundedRectPoints(x0, y0, x1, y1, radius, steps = 12) {
  const r = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
  const pts = [];
  const corners = [
    [x1 - r, y0 + r, -90, 0],
    [x1 - r, y1 - r, 0, 90],
    [x0 + r, y1 - r, 90, 180],
    [x0 + r, y0 + r, 180, 270],
  ];

  for (const [cx, cy, a0, a1] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = radians(a0 + (a1 - a0) * i / steps);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }

  return pts;
}

function hexDirectionVectors(r) {
  const rt3 = Math.sqrt(3);
  return [
    [-1.5 * r, -0.5 * rt3 * r],
    [0.0, -rt3 * r],
    [1.5 * r, -0.5 * rt3 * r],
    [1.5 * r, 0.5 * rt3 * r],
    [0.0, rt3 * r],
    [-1.5 * r, 0.5 * rt3 * r],
  ];
}

function patternCellXY(cell, hexR) {
  if (Number(cell.r) === 0) return [0.0, 0.0];
  const dirs = hexDirectionVectors(hexR);
  const [dx, dy] = dirs[Number(cell.d) % 6];
  return [Number(cell.r) * dx, Number(cell.r) * dy];
}

function centeredPatternPositions(pattern, targetCx, targetCy, hexR) {
  const raw = pattern.map(cell => {
    const [x, y] = patternCellXY(cell, hexR);
    return [cell, x, y];
  });

  const halfH = Math.sqrt(3) * hexR / 2;

  const minX = Math.min(...raw.map(([, x]) => x - hexR));
  const maxX = Math.max(...raw.map(([, x]) => x + hexR));
  const minY = Math.min(...raw.map(([, , y]) => y - halfH));
  const maxY = Math.max(...raw.map(([, , y]) => y + halfH));

  const offsetX = targetCx - (minX + maxX) / 2;
  const offsetY = targetCy - (minY + maxY) / 2;

  return raw.map(([cell, x, y]) => [cell, x + offsetX, y + offsetY]);
}

function pointInRect(x, y, rect) {
  return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
}

function pointInCircle(x, y, h) {
  return (x - h.cx) ** 2 + (y - h.cy) ** 2 <= h.r ** 2;
}

function pointInPoly(x, y, pts) {
  let inside = false;
  let j = pts.length - 1;

  for (let i = 0; i < pts.length; i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];

    if ((yi > y) !== (yj > y)) {
      const xCross = (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi;
      if (x < xCross) inside = !inside;
    }

    j = i;
  }

  return inside;
}

function hitboxContains(hitbox, x, y) {
  if (hitbox.shape === "rect") return pointInRect(x, y, hitbox.rect);
  if (hitbox.shape === "circle") return pointInCircle(x, y, hitbox);
  if (hitbox.shape === "poly") return pointInPoly(x, y, hitbox.points);
  return false;
}