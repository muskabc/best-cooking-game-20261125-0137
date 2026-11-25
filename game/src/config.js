// Sizzle & Serve — configuration: canvas, ingredients, recipes, timing.
// Every value the game reads lives here, so tuning the shift is one edit.

export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const MAX_HEARTS = 3;
export const ORDER_PATIENCE = 45;
export const ORDER_SPAWN_EVERY = 14;
export const GRILL_COOK_SECONDS = 4;
export const GRILL_BURN_SECONDS = 9;

export const SCORE_SERVE = 100;
export const SCORE_COMBO_BONUS = 25;
export const SCORE_PERFECT_BONUS = 50;
export const COINS_PER_SERVE = 12;

// Ingredients, in counter order. `key` is the keyboard shortcut, `emoji`
// is drawn on the tray and on the plate, `cook` means it must be grilled.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', emoji: '🍞', key: '1', color: '#e8b96a', cook: false },
  { id: 'patty', name: 'Patty', emoji: '🥩', key: '2', color: '#a8542e', cook: true },
  { id: 'cheese', name: 'Cheese', emoji: '🧀', key: '3', color: '#f5c542', cook: false },
  { id: 'lettuce', name: 'Lettuce', emoji: '🥬', key: '4', color: '#7dc383', cook: false },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', key: '5', color: '#e05252', cook: false },
  { id: 'onion', name: 'Onion', emoji: '🧅', key: '6', color: '#d9c7f0', cook: false },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

// Recipes the order board can ask for. `needs` lists ingredient ids; a dish
// is served when the plate holds exactly those ids, in any order.
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', emoji: '🍔', price: 12, needs: ['bun', 'patty', 'lettuce', 'tomato'] },
  { id: 'cheese', name: 'Cheese Melt', emoji: '🧀', price: 14, needs: ['bun', 'patty', 'cheese'] },
  { id: 'garden', name: 'Garden Salad', emoji: '🥗', price: 10, needs: ['lettuce', 'tomato', 'onion'] },
  { id: 'stack', name: 'Double Stack', emoji: '🍔', price: 18, needs: ['bun', 'patty', 'patty', 'cheese'] },
  { id: 'veggie', name: 'Veggie Burger', emoji: '🥙', price: 13, needs: ['bun', 'lettuce', 'tomato', 'onion'] },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

// Layout rectangles, in canvas pixels. The render and input modules share
// these, so a click and a drawing always agree on where a thing is.
export const LAYOUT = {
  topBar: { x: 0, y: 0, width: 1280, height: 64 },
  orderBoard: { x: 24, y: 80, width: 380, height: 220 },
  counter: { x: 24, y: 330, width: 620, height: 150 },
  grill: { x: 664, y: 330, width: 280, height: 150 },
  serve: { x: 964, y: 330, width: 292, height: 150 },
  plate: { x: 24, y: 500, width: 620, height: 196 },
  trash: { x: 664, y: 500, width: 136, height: 90 },
  bell: { x: 964, y: 500, width: 292, height: 196 },
};
