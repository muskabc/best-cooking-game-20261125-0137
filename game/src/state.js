// Sizzle & Serve — game state: orders, the plate, the grill, scoring.
// Pure logic: no canvas, no audio, so the self-test can drive it headlessly.

import {
  GRILL_BURN_SECONDS,
  GRILL_COOK_SECONDS,
  INGREDIENT_BY_ID,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_PATIENCE,
  ORDER_SPAWN_EVERY,
  RECIPES,
  RECIPE_BY_ID,
  SCORE_COMBO_BONUS,
  SCORE_PERFECT_BONUS,
  SCORE_SERVE,
  SHIFT_SECONDS,
} from './config.js';
import { makeRandom, pickRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export const GRILL_EMPTY = 'empty';
export const GRILL_COOKING = 'cooking';
export const GRILL_READY = 'ready';
export const GRILL_BURNT = 'burnt';

let nextOrderId = 1;

/** A fresh state for a new shift. `seed` fixes the order deck. */
export function createState(seed = 1) {
  return {
    screen: SCREEN_TITLE,
    seed,
    random: makeRandom(seed),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnIn: 6,
    orders: [],
    plate: [],
    grill: { state: GRILL_EMPTY, id: null, progress: 0 },
    score: 0,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    muted: false,
    paused: false,
    message: '',
    messageUntil: 0,
    flashes: [],
    servedLog: [],
  };
}

/** Deal one new order onto the board, if there is room. */
export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRandom(state.random, RECIPES);
  const order = {
    id: nextOrderId,
    recipeId: recipe.id,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  };
  nextOrderId += 1;
  state.orders.push(order);
  return order;
}

/** Start the shift: clear the board and deal the first two orders. */
export function startShift(state) {
  state.screen = SCREEN_PLAY;
  state.orders = [];
  state.plate = [];
  state.grill = { state: GRILL_EMPTY, id: null, progress: 0 };
  state.timeLeft = SHIFT_SECONDS;
  state.elapsed = 0;
  state.spawnIn = ORDER_SPAWN_EVERY;
  state.score = 0;
  state.coins = 0;
  state.served = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.hearts = MAX_HEARTS;
  spawnOrder(state);
  spawnOrder(state);
  showMessage(state, 'Shift started! Serve the orders!');
}

/** Add an ingredient to the plate, or send a patty to the grill. */
export function addIngredient(state, id) {
  if (state.screen !== SCREEN_PLAY || state.paused) return false;
  const item = INGREDIENT_BY_ID[id];
  if (!item) return false;
  if (item.cook) {
    if (state.grill.state !== GRILL_EMPTY) {
      showMessage(state, 'Grill is busy!');
      return false;
    }
    state.grill = { state: GRILL_COOKING, id, progress: 0 };
    return true;
  }
  if (state.plate.length >= 6) {
    showMessage(state, 'Plate is full — serve or trash it!');
    return false;
  }
  state.plate.push(id);
  return true;
}

/** Take a cooked patty off the grill onto the plate. */
export function takeFromGrill(state) {
  if (state.screen !== SCREEN_PLAY || state.paused) return false;
  if (state.grill.state === GRILL_READY) {
    if (state.plate.length >= 6) {
      showMessage(state, 'Plate is full — serve or trash it!');
      return false;
    }
    state.plate.push(state.grill.id);
    state.grill = { state: GRILL_EMPTY, id: null, progress: 0 };
    return true;
  }
  if (state.grill.state === GRILL_BURNT) {
    state.grill = { state: GRILL_EMPTY, id: null, progress: 0 };
    showMessage(state, 'Burnt patty tossed!');
    return true;
  }
  return false;
}

/** Empty the plate into the trash. */
export function trashPlate(state) {
  if (state.screen !== SCREEN_PLAY || state.paused) return false;
  if (state.plate.length === 0) return false;
  state.plate = [];
  showMessage(state, 'Plate cleared.');
  return true;
}

/** Does the plate hold exactly the recipe's ingredients, in any order? */
export function plateMatches(state, recipe) {
  if (state.plate.length !== recipe.needs.length) return false;
  const have = state.plate.slice().sort().join(',');
  const want = recipe.needs.slice().sort().join(',');
  return have === want;
}

/** Find the first open order the plate satisfies, if any. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatches(state, RECIPE_BY_ID[order.recipeId])) return order;
  }
  return null;
}

/** Serve the plate: score when it matches an order, buzz when it does not. */
export function servePlate(state) {
  if (state.screen !== SCREEN_PLAY || state.paused) return 'idle';
  if (state.plate.length === 0) {
    showMessage(state, 'Nothing on the plate yet!');
    return 'empty';
  }
  const order = matchingOrder(state);
  if (!order) {
    state.combo = 0;
    showMessage(state, 'No order wants this dish!');
    return 'wrong';
  }
  const recipe = RECIPE_BY_ID[order.recipeId];
  const perfect = order.patience > order.maxPatience * 0.6;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const gained = SCORE_SERVE + (state.combo - 1) * SCORE_COMBO_BONUS + (perfect ? SCORE_PERFECT_BONUS : 0);
  state.score += gained;
  state.coins += recipe.price;
  state.served += 1;
  state.orders = state.orders.filter((item) => item.id !== order.id);
  state.plate = [];
  state.servedLog.push({ name: recipe.name, coins: recipe.price, at: state.elapsed });
  showMessage(state, `Served ${recipe.name}! +${gained} pts, $${recipe.price}`);
  return 'served';
}

export function showMessage(state, text) {
  state.message = text;
  state.messageUntil = state.elapsed + 2.5;
}

/** Advance the clock: timers, grill, order patience, spawns. */
export function tick(state, dt) {
  if (state.screen !== SCREEN_PLAY || state.paused) return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.timeLeft <= 0) {
    state.screen = SCREEN_WIN;
    return;
  }
  if (state.grill.state === GRILL_COOKING) {
    state.grill.progress += dt;
    if (state.grill.progress >= GRILL_COOK_SECONDS) state.grill.state = GRILL_READY;
  } else if (state.grill.state === GRILL_READY) {
    state.grill.progress += dt;
    if (state.grill.progress >= GRILL_BURN_SECONDS) state.grill.state = GRILL_BURNT;
  }
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder(state);
    state.spawnIn = ORDER_SPAWN_EVERY;
  }
  for (let index = state.orders.length - 1; index >= 0; index -= 1) {
    const order = state.orders[index];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(index, 1);
      state.hearts -= 1;
      state.combo = 0;
      showMessage(state, 'An order walked out! Lost a heart.');
      if (state.hearts <= 0) {
        state.screen = SCREEN_OVER;
        return;
      }
    }
  }
}

/** Stars for the results screen, from dishes served and score. */
export function starRating(state) {
  if (state.served >= 9) return 3;
  if (state.served >= 6) return 2;
  if (state.served >= 3) return 1;
  return 0;
}
