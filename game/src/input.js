// Sizzle & Serve — input: mouse clicks and keyboard shortcuts.
// Hit-testing reuses the layout rectangles from config, so clicks land
// exactly where render draws the trays, grill, plate and bell.

import { INGREDIENTS, LAYOUT } from './config.js';
import {
  addIngredient,
  servePlate,
  startShift,
  takeFromGrill,
  trashPlate,
} from './state.js';
import { playSound } from './audio.js';

function inside(point, rect) {
  return point.x >= rect.x && point.x < rect.x + rect.width
    && point.y >= rect.y && point.y < rect.y + rect.height;
}

/** Tray rectangles for the six ingredient bins on the counter. */
export function ingredientTrayRect(index) {
  const trayWidth = 96;
  const gap = 8;
  return {
    x: LAYOUT.counter.x + 8 + index * (trayWidth + gap),
    y: LAYOUT.counter.y + 34,
    width: trayWidth,
    height: 100,
  };
}

/** The grill's clickable rectangle. */
export function grillRect() {
  return { x: LAYOUT.grill.x + 8, y: LAYOUT.grill.y + 34, width: LAYOUT.grill.width - 16, height: 100 };
}

function serveResultSound(state, result) {
  if (result === 'served') playSound(state, 'serve');
  else if (result === 'wrong') playSound(state, 'wrong');
}

/** Handle one click at canvas coordinates; returns true when it did something. */
export function handleClick(state, point) {
  if (state.screen === 'title') {
    if (inside(point, { x: 490, y: 470, width: 300, height: 64 })) {
      startShift(state);
      playSound(state, 'serve');
      return true;
    }
    return false;
  }
  if (state.screen === 'over' || state.screen === 'win') {
    if (inside(point, { x: 490, y: 560, width: 300, height: 64 })) {
      const seed = state.seed + 1;
      Object.assign(state, { seed });
      startShift(state);
      playSound(state, 'serve');
      return true;
    }
    return false;
  }
  if (state.paused) return false;
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    if (inside(point, ingredientTrayRect(index))) {
      if (addIngredient(state, INGREDIENTS[index].id)) {
        playSound(state, INGREDIENTS[index].cook ? 'grill' : 'add');
      }
      return true;
    }
  }
  if (inside(point, grillRect())) {
    if (takeFromGrill(state)) playSound(state, 'ready');
    return true;
  }
  if (inside(point, LAYOUT.trash)) {
    if (trashPlate(state)) playSound(state, 'trash');
    return true;
  }
  if (inside(point, LAYOUT.bell) || inside(point, LAYOUT.serve)) {
    serveResultSound(state, servePlate(state));
    return true;
  }
  return false;
}

/** Handle one key press; returns true when it did something. */
export function handleKey(state, key) {
  const lower = key.toLowerCase();
  if (lower === 'm') {
    state.muted = !state.muted;
    return true;
  }
  if (state.screen === 'title' && (key === 'Enter' || key === ' ')) {
    startShift(state);
    return true;
  }
  if ((state.screen === 'over' || state.screen === 'win') && key === 'Enter') {
    startShift(state);
    return true;
  }
  if (state.screen !== 'play') return false;
  if (lower === 'p') {
    state.paused = !state.paused;
    return true;
  }
  if (state.paused) return false;
  if (lower === ' ') {
    serveResultSound(state, servePlate(state));
    return true;
  }
  if (lower === 't' || key === 'Backspace') {
    if (trashPlate(state)) playSound(state, 'trash');
    return true;
  }
  if (lower === 'g') {
    if (takeFromGrill(state)) playSound(state, 'ready');
    return true;
  }
  const ingredient = INGREDIENTS.find((item) => item.key === lower);
  if (ingredient) {
    if (addIngredient(state, ingredient.id)) {
      playSound(state, ingredient.cook ? 'grill' : 'add');
    }
    return true;
  }
  return false;
}
