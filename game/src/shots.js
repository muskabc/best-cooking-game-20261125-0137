// Sizzle & Serve — screenshot scenes behind ?shot=start|play|almost|win.
// Each scene builds a real game state with the same rules and renders it
// through the normal renderer, so every screenshot is the game itself.

import { RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, createState, spawnOrder, startShift } from './state.js';

function withOrders(state, recipeIds, patienceFractions) {
  state.orders = recipeIds.map((recipeId, index) => {
    const recipe = RECIPES.find((item) => item.id === recipeId);
    return {
      id: 100 + index,
      recipeId: recipe.id,
      patience: 45 * patienceFractions[index],
      maxPatience: 45,
    };
  });
}

/**
 * Stage the named scene on `state` and return the screen to show.
 * start: the title screen. play: mid-shift, a dish half-built on the plate
 * and a patty sizzling on the grill. almost: one ingredient short of a
 * match, its order nearly out of patience. win: the shift-complete screen.
 */
export function stageShot(name, state) {
  if (name === 'play') {
    startShift(state);
    state.timeLeft = 98;
    state.elapsed = 52;
    state.score = 240;
    state.coins = 36;
    state.served = 3;
    state.combo = 2;
    state.bestCombo = 3;
    withOrders(state, ['classic', 'garden'], [0.7, 0.45]);
    state.plate = ['bun', 'patty', 'lettuce'];
    state.grill = { state: 'cooking', id: 'patty', progress: 2.4 };
    state.message = 'Patty on the grill — almost ready!';
    state.messageUntil = 9999;
    state.screen = SCREEN_PLAY;
    return SCREEN_PLAY;
  }
  if (name === 'almost') {
    startShift(state);
    state.timeLeft = 34;
    state.elapsed = 116;
    state.score = 860;
    state.coins = 96;
    state.served = 8;
    state.combo = 4;
    state.bestCombo = 5;
    withOrders(state, ['cheese', 'stack'], [0.12, 0.8]);
    state.plate = ['bun', 'patty'];
    state.grill = { state: 'ready', id: 'patty', progress: 4.5 };
    state.message = 'One cheese away — hurry, the order is almost gone!';
    state.messageUntil = 9999;
    state.screen = SCREEN_PLAY;
    return SCREEN_PLAY;
  }
  if (name === 'win') {
    startShift(state);
    state.timeLeft = 0;
    state.elapsed = 150;
    state.score = 1240;
    state.coins = 132;
    state.served = 9;
    state.combo = 0;
    state.bestCombo = 5;
    state.servedLog = [
      { name: 'Classic Burger', coins: 12, at: 20 },
      { name: 'Double Stack', coins: 18, at: 90 },
      { name: 'Garden Salad', coins: 10, at: 140 },
    ];
    state.screen = SCREEN_WIN;
    return SCREEN_WIN;
  }
  // Default: the title screen over a fresh, empty kitchen.
  const fresh = createState(1);
  Object.assign(state, fresh);
  state.screen = SCREEN_TITLE;
  return SCREEN_TITLE;
}
