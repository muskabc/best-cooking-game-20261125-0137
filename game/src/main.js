// Sizzle & Serve — entry point: the loop, the wiring, the self-test.
// ?shot=start|play|almost|win stages a screenshot scene; ?selftest=1 runs
// the rules headlessly and draws PASS or FAIL on the canvas.

import { VIEW } from './config.js';
import { addIngredient, createState, plateMatches, servePlate, startShift, takeFromGrill, tick } from './state.js';
import { handleClick, handleKey } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const params = new URLSearchParams(window.location.search);

const state = createState(1);

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}

function announce() {
  if (!statusLine) return;
  statusLine.textContent = `Sizzle and Serve. Score ${state.score}, ${state.served} dishes served, `
    + `${formatTimeLeft()} left, ${state.orders.length} orders waiting.`;
}

function formatTimeLeft() {
  const total = Math.max(0, Math.ceil(state.timeLeft));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function toCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('click', (event) => {
  if (handleClick(state, toCanvasPoint(event))) announce();
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  if (handleKey(state, event.key)) announce();
});

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  tick(state, dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}

/** Headless rule checks: plate matching, serving, grill, expiry. */
export function selfTest() {
  const results = [];
  const check = (name, ok) => results.push({ name, ok });

  const fresh = createState(7);
  startShift(fresh);
  check('shift starts with two orders', fresh.orders.length === 2);
  check('plate starts empty', fresh.plate.length === 0);

  fresh.plate = ['bun', 'patty', 'lettuce', 'tomato'];
  const recipe = { id: 'classic', needs: ['bun', 'patty', 'lettuce', 'tomato'] };
  check('plate matches classic burger', plateMatches(fresh, recipe));
  fresh.plate = ['bun', 'patty', 'lettuce'];
  check('incomplete plate does not match', !plateMatches(fresh, recipe));

  const served = createState(8);
  startShift(served);
  served.orders = [{ id: 1, recipeId: 'classic', patience: 40, maxPatience: 45 }];
  served.plate = ['tomato', 'lettuce', 'patty', 'bun'];
  check('serve matches any order of ingredients', servePlate(served) === 'served');
  check('serve scores and clears the plate', served.score > 0 && served.plate.length === 0);
  served.plate = ['bun'];
  check('serve with no match is wrong', servePlate(served) === 'wrong');

  const grilled = createState(9);
  startShift(grilled);
  check('grill starts empty', grilled.grill.state === 'empty');
  addIngredient(grilled, 'patty');
  check('patty goes to the grill, not the plate', grilled.grill.state === 'cooking' && grilled.plate.length === 0);
  tick(grilled, 5);
  check('patty is ready after cooking', grilled.grill.state === 'ready');
  takeFromGrill(grilled);
  check('cooked patty lands on the plate', grilled.plate.includes('patty') && grilled.grill.state === 'empty');
  addIngredient(grilled, 'bun');
  check('bun goes straight to the plate', grilled.plate.includes('bun'));

  const expiring = createState(10);
  startShift(expiring);
  expiring.orders = [{ id: 2, recipeId: 'garden', patience: 0.5, maxPatience: 45 }];
  expiring.hearts = 3;
  tick(expiring, 1);
  check('expired order costs a heart', expiring.hearts === 2 && expiring.orders.length === 0);

  const timed = createState(11);
  startShift(timed);
  timed.timeLeft = 0.5;
  tick(timed, 1);
  check('shift ends at zero time', timed.screen === 'win');

  return results;
}

function drawSelfTest(results) {
  ctx.fillStyle = '#11141b';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const passed = results.filter((item) => item.ok).length;
  ctx.fillText(`selftest: ${passed}/${results.length} PASS`, 40, 50);
  results.forEach((item, index) => {
    ctx.fillStyle = item.ok ? '#4caf50' : '#e05252';
    ctx.fillText(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name}`, 40, 100 + index * 36);
  });
  document.title = passed === results.length ? 'SELFTEST PASS' : 'SELFTEST FAIL';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

if (params.get('selftest') === '1') {
  drawSelfTest(selfTest());
} else if (params.get('shot')) {
  stageShot(params.get('shot'), state);
  render(ctx, state);
  document.title = `SHOT ${params.get('shot')}`;
} else {
  state.screen = 'title';
  render(ctx, state);
  requestAnimationFrame(frame);
}
