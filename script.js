const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('title');
const msgEl = document.getElementById('msg');
const startBtn = document.getElementById('start');

let best = 0;
try { best = +localStorage.getItem('stars-best') || 0; } catch (e) {}
bestEl.textContent = best;

const basket = { x: W / 2, y: H - 40, w: 70, h: 24 };
let items, score, lives, spawnTimer, running, last;

function reset() {
  items = [];
  score = 0;
  lives = 3;
  spawnTimer = 0;
  basket.x = W / 2;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  bestEl.textContent = best;
}

function spawn() {
  const bomb = Math.random() < 0.25;
  items.push({
    x: 20 + Math.random() * (W - 40),
    y: -20,
    r: 14,
    bomb,
    speed: 120 + Math.random() * 80 + score * 3
  });
}

function setBasketX(x) {
  basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, x));
}

function moveBasket(clientX) {
  const rect = canvas.getBoundingClientRect();
  setBasketX((clientX - rect.left) * (W / rect.width));
}

canvas.addEventListener('mousemove', e => moveBasket(e.clientX));
canvas.addEventListener('touchstart', e => moveBasket(e.touches[0].clientX), { passive: true });
canvas.addEventListener('touchmove', e => { e.preventDefault(); moveBasket(e.touches[0].clientX); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') setBasketX(basket.x - 30);
  if (e.key === 'ArrowRight') setBasketX(basket.x + 30);
});

function update(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawn();
    spawnTimer = Math.max(0.35, 0.9 - score * 0.01);
  }
  for (const it of items) it.y += it.speed * dt;

  items = items.filter(it => {
    const caught = it.y + it.r >= basket.y &&
      it.y - it.r <= basket.y + basket.h &&
      Math.abs(it.x - basket.x) <= basket.w / 2 + it.r / 2;
    if (caught) {
      if (it.bomb) lives--; else score++;
      updateHud();
      return false;
    }
    if (it.y - it.r > H) {
      if (!it.bomb) { lives--; updateHud(); }
      return false;
    }
    return true;
  });

  if (lives <= 0) gameOver();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const it of items) ctx.fillText(it.bomb ? '💣' : '⭐', it.x, it.y);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.roundRect(basket.x - basket.w / 2, basket.y, basket.w, basket.h, 8);
  ctx.fill();
}

function loop(t) {
  if (!running) return;
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  if (score > best) {
    best = score;
    try { localStorage.setItem('stars-best', best); } catch (e) {}
  }
  updateHud();
  titleEl.textContent = 'Игра окончена';
  msgEl.innerHTML = 'Твой счёт: ' + score;
  startBtn.textContent = 'Ещё раз';
  overlay.classList.remove('hidden');
}

startBtn.addEventListener('click', () => {
  reset();
  overlay.classList.add('hidden');
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
});

reset();
draw();
