// Sizzle & Serve — rendering: every pixel of the kitchen, drawn on canvas.
// No images: tiles, trays, the grill and the dishes are shapes and emoji.

import {
  GRILL_BURN_SECONDS,
  GRILL_COOK_SECONDS,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  LAYOUT,
  RECIPE_BY_ID,
  VIEW,
} from './config.js';
import { grillRect, ingredientTrayRect } from './input.js';
import { matchingOrder, starRating } from './state.js';

const WALL = '#f7e8c9';
const FLOOR = '#c98f5f';
const BOARD = '#5b4636';
const PANEL = '#fff8e7';
const INK = '#3a2c1e';
const ACCENT = '#e05252';
const GREEN = '#4caf50';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function panel(ctx, rect, fill = PANEL, stroke = '#d9c49a') {
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 14);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function text(ctx, value, x, y, size, color = INK, align = 'left', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function drawKitchen(ctx) {
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#f3ddb0';
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.fillRect(x, 300, 2, 420);
  }
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 300, VIEW.width, 420);
  ctx.fillStyle = '#b57e4e';
  for (let y = 316; y < VIEW.height; y += 48) ctx.fillRect(0, y, VIEW.width, 2);
  ctx.fillStyle = '#8fb8a8';
  ctx.fillRect(0, 296, VIEW.width, 8);
}

function drawTopBar(ctx, state) {
  const bar = LAYOUT.topBar;
  ctx.fillStyle = BOARD;
  ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
  text(ctx, '🍳 Sizzle & Serve', 24, 33, 28, '#ffe9b0', 'left', true);
  text(ctx, `⏱ ${formatTime(state.timeLeft)}`, 480, 33, 26, state.timeLeft <= 30 ? '#ff8a80' : '#ffffff', 'left', true);
  text(ctx, `⭐ ${state.score}`, 640, 33, 24, '#ffffff');
  text(ctx, `🪙 $${state.coins}`, 790, 33, 24, '#ffd54f');
  text(ctx, '❤️'.repeat(Math.max(0, state.hearts)) + '🤍'.repeat(Math.max(0, 3 - state.hearts)), 920, 33, 22);
  if (state.combo >= 2) text(ctx, `🔥 Combo x${state.combo}`, 1030, 33, 20, '#ffb74d', 'left', true);
  text(ctx, state.muted ? '🔇' : '🔊', 1240, 33, 20, '#ffffff', 'right');
}

function drawOrderBoard(ctx, state) {
  const board = LAYOUT.orderBoard;
  panel(ctx, board, '#6d4c41', '#4e342e');
  text(ctx, '📋 ORDER BOARD', board.x + 16, board.y + 22, 18, '#ffe9b0', 'left', true);
  if (state.orders.length === 0) {
    text(ctx, 'No orders — take a breath!', board.x + 16, board.y + 110, 18, '#d7ccc8');
    return;
  }
  state.orders.forEach((order, index) => {
    const recipe = RECIPE_BY_ID[order.recipeId];
    const y = board.y + 44 + index * 56;
    roundRect(ctx, board.x + 10, y, board.width - 20, 48, 10);
    ctx.fillStyle = '#fff8e7';
    ctx.fill();
    text(ctx, recipe.emoji, board.x + 36, y + 24, 28, INK, 'center');
    text(ctx, recipe.name, board.x + 58, y + 15, 16, INK, 'left', true);
    text(ctx, recipe.needs.map((id) => INGREDIENT_BY_ID[id].emoji).join(' '), board.x + 58, y + 36, 16, INK);
    const ratio = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e0d5c1';
    ctx.fillRect(board.x + board.width - 118, y + 12, 100, 10);
    ctx.fillStyle = ratio > 0.5 ? GREEN : ratio > 0.25 ? '#ff9800' : ACCENT;
    ctx.fillRect(board.x + board.width - 118, y + 12, 100 * ratio, 10);
    text(ctx, `${Math.ceil(order.patience)}s`, board.x + board.width - 118, y + 36, 13, '#8d6e63', 'left', true);
  });
}

function drawCounter(ctx) {
  const counter = LAYOUT.counter;
  panel(ctx, counter, '#a1887f', '#795548');
  text(ctx, '🧺 COUNTER — click an ingredient (keys 1–6)', counter.x + 16, counter.y + 20, 16, '#ffffff', 'left', true);
  INGREDIENTS.forEach((item, index) => {
    const tray = ingredientTrayRect(index);
    roundRect(ctx, tray.x, tray.y, tray.width, tray.height, 12);
    ctx.fillStyle = '#fff8e7';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = item.color;
    ctx.stroke();
    text(ctx, item.emoji, tray.x + tray.width / 2, tray.y + 38, 40, INK, 'center');
    text(ctx, item.name, tray.x + tray.width / 2, tray.y + 78, 14, INK, 'center', true);
    text(ctx, `[${item.key}]${item.cook ? ' 🔥 grill' : ''}`, tray.x + tray.width / 2, tray.y + 94, 11, '#8d6e63', 'center');
  });
}

function drawGrill(ctx, state) {
  const grill = LAYOUT.grill;
  panel(ctx, grill, '#37474f', '#263238');
  text(ctx, '🔥 GRILL', grill.x + 16, grill.y + 20, 16, '#ffffff', 'left', true);
  const rect = grillRect();
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fillStyle = '#212121';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#616161';
  ctx.stroke();
  const g = state.grill;
  if (g.state === 'empty') {
    text(ctx, 'empty — send a patty (key 2)', rect.x + rect.width / 2, rect.y + 50, 15, '#9e9e9e', 'center');
  } else {
    const item = INGREDIENT_BY_ID[g.id];
    text(ctx, item.emoji, rect.x + rect.width / 2, rect.y + 42, 44, INK, 'center');
    if (g.state === 'cooking') {
      const ratio = g.progress / GRILL_COOK_SECONDS;
      ctx.fillStyle = '#424242';
      ctx.fillRect(rect.x + 16, rect.y + 76, rect.width - 32, 10);
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(rect.x + 16, rect.y + 76, (rect.width - 32) * ratio, 10);
      text(ctx, 'sizzling…', rect.x + rect.width / 2, rect.y + 96, 12, '#ffb74d', 'center');
    } else if (g.state === 'ready') {
      text(ctx, '✅ READY — click to plate it!', rect.x + rect.width / 2, rect.y + 88, 14, '#a5d6a7', 'center', true);
    } else {
      text(ctx, '🔥 BURNT! Click to toss it.', rect.x + rect.width / 2, rect.y + 88, 14, '#ef9a9a', 'center', true);
    }
  }
}

function drawServeWindow(ctx, state) {
  const serve = LAYOUT.serve;
  panel(ctx, serve, '#eceff1', '#b0bec5');
  text(ctx, '🪟 SERVE WINDOW', serve.x + 16, serve.y + 20, 16, INK, 'left', true);
  const match = matchingOrder(state);
  if (match) {
    const recipe = RECIPE_BY_ID[match.recipeId];
    text(ctx, `${recipe.emoji} ${recipe.name} is ready!`, serve.x + 16, serve.y + 62, 18, GREEN, 'left', true);
    text(ctx, `Ring the bell — $${recipe.price} + points`, serve.x + 16, serve.y + 92, 15, INK);
  } else if (state.plate.length > 0) {
    text(ctx, 'No order matches this plate yet.', serve.x + 16, serve.y + 62, 16, '#8d6e63');
    text(ctx, 'Check the board, then add or trash.', serve.x + 16, serve.y + 92, 15, '#8d6e63');
  } else {
    text(ctx, 'Build a dish on the plate,', serve.x + 16, serve.y + 62, 16, '#8d6e63');
    text(ctx, 'then ring the bell to serve it.', serve.x + 16, serve.y + 92, 15, '#8d6e63');
  }
  text(ctx, `Served: ${state.served}   Best combo: x${state.bestCombo}`, serve.x + 16, serve.y + 126, 14, INK);
}

function drawPlate(ctx, state) {
  const plate = LAYOUT.plate;
  panel(ctx, plate, '#d7ccc8', '#a1887f');
  text(ctx, '🍽️ YOUR PLATE — dish mid-assembly', plate.x + 16, plate.y + 20, 16, INK, 'left', true);
  roundRect(ctx, plate.x + 24, plate.y + 40, 360, 120, 60);
  ctx.fillStyle = '#fafafa';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#bcaaa4';
  ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'Empty plate — click ingredients above', plate.x + 204, plate.y + 100, 16, '#9e9e9e', 'center');
  } else {
    const emojis = state.plate.map((id) => INGREDIENT_BY_ID[id].emoji).join(' ');
    text(ctx, emojis, plate.x + 204, plate.y + 86, 44, INK, 'center');
    text(ctx, state.plate.map((id) => INGREDIENT_BY_ID[id].name).join(' + '), plate.x + 204, plate.y + 138, 14, INK, 'center');
  }
  const match = matchingOrder(state);
  text(
    ctx,
    match ? `✅ Matches: ${RECIPE_BY_ID[match.recipeId].name} — ring the bell!` : 'Assemble the dish an order asks for.',
    plate.x + plate.width / 2, plate.y + 172, 15, match ? GREEN : INK, 'center', true,
  );
  text(ctx, 'Keys: 1–6 ingredients · Space serve · T trash · P pause', plate.x + plate.width / 2, plate.y + 188, 12, '#8d6e63', 'center');
}

function drawTrashAndBell(ctx, state) {
  const trash = LAYOUT.trash;
  panel(ctx, trash, '#efebe9', '#bcaaa4');
  text(ctx, '🗑️', trash.x + trash.width / 2, trash.y + 34, 34, INK, 'center');
  text(ctx, 'Trash [T]', trash.x + trash.width / 2, trash.y + 70, 14, INK, 'center', true);
  const bell = LAYOUT.bell;
  const match = matchingOrder(state);
  roundRect(ctx, bell.x, bell.y, bell.width, bell.height, 16);
  ctx.fillStyle = match ? '#ffca28' : '#cfd8dc';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = match ? '#ff8f00' : '#90a4ae';
  ctx.stroke();
  text(ctx, '🔔', bell.x + bell.width / 2, bell.y + 76, 64, INK, 'center');
  text(ctx, 'RING TO SERVE [Space]', bell.x + bell.width / 2, bell.y + 150, 18, INK, 'center', true);
  text(ctx, match ? 'Order matched — serve it now!' : 'Serve when the plate matches an order', bell.x + bell.width / 2, bell.y + 178, 13, '#5d4037', 'center');
}

function drawMessage(ctx, state) {
  if (!state.message || state.elapsed > state.messageUntil) return;
  ctx.fillStyle = 'rgba(58, 44, 30, 0.85)';
  roundRect(ctx, 390, 701, 500, 18, 9);
  ctx.fill();
  text(ctx, state.message, 640, 710, 13, '#ffffff', 'center');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(58, 44, 30, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, { x: 340, y: 120, width: 600, height: 420 }, '#fff8e7');
  text(ctx, '🍳', 640, 190, 72, INK, 'center');
  text(ctx, 'Sizzle & Serve', 640, 260, 44, INK, 'center', true);
  text(ctx, 'A rush-hour kitchen cooking game', 640, 306, 20, '#8d6e63', 'center');
  text(ctx, 'Read the order board. Click ingredients on the', 640, 350, 17, INK, 'center');
  text(ctx, 'counter, grill the patty, build the dish on the', 640, 376, 17, INK, 'center');
  text(ctx, 'plate, and ring the bell before patience runs out!', 640, 402, 17, INK, 'center');
  text(ctx, 'Keys: 1–6 ingredients · Space serve · T trash · P pause · M mute', 640, 448, 14, '#8d6e63', 'center');
  roundRect(ctx, 490, 470, 300, 64, 14);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  text(ctx, '▶  START SHIFT  (Enter)', 640, 503, 20, '#ffffff', 'center', true);
}

function drawEnd(ctx, state) {
  const win = state.screen === 'win';
  ctx.fillStyle = 'rgba(58, 44, 30, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, { x: 340, y: 90, width: 600, height: 500 }, '#fff8e7');
  text(ctx, win ? '🎉' : '💔', 640, 160, 64, INK, 'center');
  text(ctx, win ? 'Shift Complete!' : 'Kitchen Closed!', 640, 220, 40, INK, 'center', true);
  if (win) {
    const stars = '⭐'.repeat(starRating(state)) + '☆'.repeat(3 - starRating(state));
    text(ctx, stars, 640, 268, 36, INK, 'center');
  } else {
    text(ctx, 'Three orders walked out…', 640, 268, 20, '#8d6e63', 'center');
  }
  text(ctx, `Score: ${state.score}`, 640, 320, 24, INK, 'center', true);
  text(ctx, `Dishes served: ${state.served}    Coins earned: $${state.coins}`, 640, 356, 20, INK, 'center');
  text(ctx, `Best combo: x${state.bestCombo}`, 640, 388, 20, INK, 'center');
  const best = state.servedLog.slice(-3).map((entry) => entry.name).join(' · ');
  if (best) text(ctx, `Last dishes: ${best}`, 640, 424, 16, '#8d6e63', 'center');
  roundRect(ctx, 490, 470, 300, 64, 14);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  text(ctx, '↻  PLAY AGAIN  (Enter)', 640, 503, 20, '#ffffff', 'center', true);
}

/** Draw the whole game for the current state. */
export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawKitchen(ctx);
  drawTopBar(ctx, state);
  if (state.screen === 'title') {
    drawOrderBoard(ctx, { ...state, orders: [] });
    drawCounter(ctx);
    drawGrill(ctx, state);
    drawServeWindow(ctx, state);
    drawPlate(ctx, state);
    drawTrashAndBell(ctx, state);
    drawTitle(ctx, state);
    return;
  }
  drawOrderBoard(ctx, state);
  drawCounter(ctx);
  drawGrill(ctx, state);
  drawServeWindow(ctx, state);
  drawPlate(ctx, state);
  drawTrashAndBell(ctx, state);
  drawMessage(ctx, state);
  if (state.paused && state.screen === 'play') {
    ctx.fillStyle = 'rgba(58, 44, 30, 0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ Paused — press P to resume', 640, 360, 32, '#ffffff', 'center', true);
  }
  if (state.screen === 'over' || state.screen === 'win') drawEnd(ctx, state);
}
