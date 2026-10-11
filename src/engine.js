// Pure, DOM-free simulation. Rendering and input live in main.js.
// World units: x spans the board left to right, y runs from the paddle
// (bottom) to the back wall (top). The 3D view maps y onto the scene's z axis.

export const FIELD = { width: 13, height: 15.5 };
export const COLS = 11;
export const BRICK = { margin: 0.3, gap: 0.12, depth: 0.62, pitch: 0.74, top: FIELD.height - 1.3 };
export const PADDLE = { y: 1.3, width: 2.7, depth: 0.46, keySpeed: 13, pointerSpeed: 42 };
export const BALL = { radius: 0.24, maxBalls: 6 };
export const SHIELD_Y = 0.42;
export const STEP = 1 / 240;

export const POWERS = {
  copilot: { name: 'Flux Surge', detail: 'Multi-ball + auto-aim', seconds: 10 },
  dependabot: { name: 'Laser Grid', detail: 'Safety shield', seconds: 15 },
  actions: { name: 'Proton Cannons', detail: 'Laser runners', seconds: 8 },
};
export const REGRESSION_SECONDS = 8;
export const START_LIVES = 3;

// Layout legend: . empty, 1-4 commit brick hit points (contribution shades),
// X merge conflict (unbreakable, not required), B bug brick (drops a bug),
// C / D / A bricks always drop Copilot, Dependabot or Actions power-ups.
export const LEVELS = [
  {
    repo: '1982', branch: 'Tron Era', pr: 'Arcade Dawn',
    rows: [
      '...........',
      '....4.4....',
      '..3.3.3.3..',
      '.22D2C2A22.',
      '11111111111',
      '11111111111',
    ],
  },
  {
    repo: '1984', branch: 'Ghostbusters', pr: 'Proton Pack',
    rows: [
      '.4.......4.',
      '.3.3...3.3.',
      '.2.2C4D2.2.',
      '11A1.3.1A11',
      '11111211111',
      '11111111111',
    ],
  },
  {
    repo: '1985', branch: 'Back to the Future', pr: '88 MPH',
    rows: [
      '..4.....4..',
      '..3.4.4.3..',
      '.22.3.3.22.',
      '.11D2C2A11.',
      '1111B1B1111',
      '11111111111',
    ],
  },
  {
    repo: '1986', branch: 'Top Gun', pr: 'Danger Zone',
    rows: [
      '..X..4..X..',
      '....333....',
      '...22C22...',
      '..111D111..',
      '.11X111X11.',
      '11111A11111',
    ],
  },
  {
    repo: '1987', branch: 'RoboCop', pr: 'Detroit Steel',
    rows: [
      '4.4.4.4.4.4',
      '3.3.3.3.3.3',
      '2C2.2.2.2A2',
      '111.1D1.111',
      '11B11111B11',
      '11111111111',
    ],
  },
  {
    repo: '1989', branch: 'Batman', pr: 'Gotham Nights',
    rows: [
      '4.........4',
      '34.......43',
      '234.....432',
      '1234D.C4321',
      '11234A43211',
      '11123432111',
    ],
  },
  {
    repo: '1991', branch: 'Terminator 2', pr: 'Liquid Metal',
    rows: [
      '4.4.....4.4',
      '3.3.4.4.3.3',
      '2.2.3.3.2.2',
      '1D1.2C2.1A1',
      '11B.111.B11',
      '111.1X1.111',
    ],
  },
  {
    repo: '1993', branch: 'Jurassic Park', pr: 'Amber Mosquito',
    rows: [
      '.....4.....',
      '....343....',
      '...23432...',
      '..12D4C21..',
      '.111242111.',
      '11111A11111',
    ],
  },
  {
    repo: '1999', branch: 'The Matrix', pr: 'Digital Rain',
    rows: [
      '4.4.4.4.4.4',
      '3.3.3.3.3.3',
      '3.3.3.3.3.3',
      '2.2.2.2.2.2',
      '1.1.1.1.1.1',
      '1D1A1.1C1A1',
    ],
  },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function levelInfo(level) {
  const index = (level - 1) % LEVELS.length;
  const cycle = Math.floor((level - 1) / LEVELS.length);
  const base = LEVELS[index];
  if (!cycle) return { ...base, index, cycle };
  return { ...base, index, cycle, repo: `${base.repo}-v${cycle + 1}`, branch: `${base.branch}-${cycle + 1}` };
}

export function ballSpeed(level) {
  return Math.min(8.6 + (level - 1) * 0.45, 13.2);
}

const cellWidth = (FIELD.width - BRICK.margin * 2) / COLS;
export function brickRect(col, row) {
  const w = cellWidth - BRICK.gap;
  const x = -FIELD.width / 2 + BRICK.margin + cellWidth * col + cellWidth / 2;
  const y = BRICK.top - row * BRICK.pitch;
  return { x, y, w, d: BRICK.depth };
}

export function buildBricks(level) {
  const info = levelInfo(level);
  const bricks = [];
  info.rows.forEach((line, row) => {
    if (line.length !== COLS) throw new Error(`Level ${info.repo} row ${row} must have ${COLS} columns.`);
    [...line].forEach((char, col) => {
      if (char === '.') return;
      let hp = 1, kind = 'commit', drop = null;
      if (/[1-4]/.test(char)) hp = Number(char);
      else if (char === 'X') { kind = 'conflict'; hp = Infinity; }
      else if (char === 'B') kind = 'bug';
      else if (char === 'C') drop = 'copilot';
      else if (char === 'D') drop = 'dependabot';
      else if (char === 'A') drop = 'actions';
      else throw new Error(`Unknown brick "${char}" in ${info.repo}.`);
      // Repeat cycles toughen ordinary commits without changing the layout.
      if (kind === 'commit' && info.cycle) hp = Math.min(4, hp + info.cycle);
      bricks.push({ id: `${row}:${col}`, row, col, kind, hp, maxHp: hp, drop, alive: true, ...brickRect(col, row) });
    });
  });
  return bricks;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class Game {
  constructor({ seed = 1, onEvent = () => {}, level = 1 } = {}) {
    this.onEvent = onEvent;
    this.seed = seed >>> 0;
    this.input = { axis: 0, targetX: null };
    this.newGame(level);
  }

  newGame(level = 1) {
    this.random = mulberry32(this.seed + level * 7919);
    this.score = 0;
    this.lives = START_LIVES;
    this.status = 'ready';
    this.pausedFrom = null;
    this.loadLevel(level);
  }

  loadLevel(level) {
    this.level = level;
    this.info = levelInfo(level);
    this.bricks = buildBricks(level);
    this.clearTimer = 0;
    this.nextId = 1;
    this.resetRound();
  }

  resetRound() {
    this.paddle = { x: this.paddle?.x ?? 0, width: PADDLE.width, fire: 0 };
    this.effects = { copilot: 0, dependabot: 0, actions: 0, regression: 0 };
    this.shield = false;
    this.items = [];
    this.bugs = [];
    this.lasers = [];
    this.balls = [this.makeBall(true)];
    this.clampPaddle();
    this.attachBalls();
  }

  makeBall(attached = false) {
    return { id: this.nextId++, x: this.paddle.x, y: 0, vx: 0, vy: 0, attached, offset: 0.35 };
  }

  get speed() {
    const cleared = this.breakableCount ? 1 - this.remaining / this.breakableCount : 0;
    return ballSpeed(this.level) * (1 + cleared * 0.12);
  }

  get breakableCount() { return this.bricks.filter(b => b.kind !== 'conflict').length; }
  get remaining() { return this.bricks.filter(b => b.alive && b.kind !== 'conflict').length; }

  start() {
    if (this.status === 'ready') this.status = 'serving';
  }

  pause() {
    if (['serving', 'playing', 'cleared'].includes(this.status)) {
      this.pausedFrom = this.status;
      this.status = 'paused';
      return true;
    }
    if (this.status === 'paused') {
      this.status = this.pausedFrom ?? 'playing';
      this.pausedFrom = null;
      return true;
    }
    return false;
  }

  launch() {
    if (this.status === 'ready') this.start();
    if (this.status !== 'serving') return false;
    for (const ball of this.balls) {
      if (!ball.attached) continue;
      ball.attached = false;
      const angle = this.aimAngle(ball, clamp(ball.offset / (this.paddle.width / 2), -1, 1) * 0.5);
      ball.vx = Math.sin(angle) * this.speed;
      ball.vy = Math.cos(angle) * this.speed;
    }
    this.status = 'playing';
    this.onEvent('launch');
    return true;
  }

  // Copilot nudges the bounce toward the lowest remaining commit.
  aimAngle(ball, angle) {
    if (this.effects.copilot <= 0) return angle;
    const target = this.bricks.filter(b => b.alive && b.kind !== 'conflict')
      .sort((a, b) => a.y - b.y || Math.abs(a.x - ball.x) - Math.abs(b.x - ball.x))[0];
    if (!target) return angle;
    const toward = Math.atan2(target.x - ball.x, Math.max(1, target.y - ball.y));
    return clamp(angle * 0.35 + toward * 0.65, -1.05, 1.05);
  }

  clampPaddle() {
    const half = this.paddle.width / 2;
    this.paddle.x = clamp(this.paddle.x, -FIELD.width / 2 + half, FIELD.width / 2 - half);
  }

  attachBalls() {
    for (const ball of this.balls) {
      if (!ball.attached) continue;
      ball.x = this.paddle.x + ball.offset;
      ball.y = PADDLE.y + PADDLE.depth / 2 + BALL.radius + 0.02;
    }
  }

  update(dt) {
    let left = Math.min(dt, 0.1);
    while (left > 1e-9) {
      const step = Math.min(STEP, left);
      this.step(step);
      left -= step;
    }
  }

  step(dt) {
    if (this.status === 'cleared') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.loadLevel(this.level + 1);
        this.status = 'serving';
        this.onEvent('level', { level: this.level });
      }
      return;
    }
    if (this.status !== 'serving' && this.status !== 'playing') return;
    this.movePaddle(dt);
    this.attachBalls();
    this.tickEffects(dt);
    if (this.status === 'serving') return;
    for (const ball of [...this.balls]) if (!ball.attached) this.moveBall(ball, dt);
    this.moveItems(dt);
    this.moveBugs(dt);
    this.moveLasers(dt);
    if (!this.balls.length) this.loseLife();
    else if (this.remaining === 0) this.clearLevel();
  }

  movePaddle(dt) {
    const { axis, targetX } = this.input;
    if (axis) {
      this.paddle.x += clamp(axis, -1, 1) * PADDLE.keySpeed * dt;
    } else if (targetX !== null && Number.isFinite(targetX)) {
      const delta = targetX - this.paddle.x;
      const max = PADDLE.pointerSpeed * dt;
      this.paddle.x += clamp(delta, -max, max);
    }
    const width = PADDLE.width * (this.effects.regression > 0 ? 0.62 : 1);
    this.paddle.width += clamp(width - this.paddle.width, -dt * 6, dt * 6);
    this.clampPaddle();
  }

  tickEffects(dt) {
    for (const key of Object.keys(this.effects)) {
      if (this.effects[key] > 0) this.effects[key] = Math.max(0, this.effects[key] - dt);
    }
    if (this.shield && this.effects.dependabot <= 0) this.shield = false;
    if (this.status === 'playing' && this.effects.actions > 0) {
      this.paddle.fire -= dt;
      if (this.paddle.fire <= 0) {
        this.paddle.fire = 0.42;
        const edge = this.paddle.width / 2 - 0.2;
        for (const side of [-1, 1]) {
          this.lasers.push({ id: this.nextId++, x: this.paddle.x + side * edge, y: PADDLE.y + PADDLE.depth / 2 });
        }
        this.onEvent('laser');
      }
    }
  }

  moveBall(ball, dt) {
    const r = BALL.radius;
    const halfW = FIELD.width / 2;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x - r < -halfW && ball.vx < 0) { ball.x = -halfW + r; ball.vx *= -1; this.onEvent('wall'); }
    if (ball.x + r > halfW && ball.vx > 0) { ball.x = halfW - r; ball.vx *= -1; this.onEvent('wall'); }
    if (ball.y + r > FIELD.height && ball.vy > 0) { ball.y = FIELD.height - r; ball.vy *= -1; this.onEvent('wall'); }

    const paddleTop = PADDLE.y + PADDLE.depth / 2;
    const half = this.paddle.width / 2;
    if (ball.vy < 0 && ball.y - r <= paddleTop && ball.y + r >= PADDLE.y - PADDLE.depth / 2
      && Math.abs(ball.x - this.paddle.x) <= half + r * 0.9) {
      const t = clamp((ball.x - this.paddle.x) / (half + r), -1, 1);
      const angle = this.aimAngle(ball, t * 1.05);
      const speed = this.speed;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = Math.abs(Math.cos(angle) * speed);
      ball.y = paddleTop + r;
      this.onEvent('paddle', { x: ball.x });
    }

    if (this.shield && ball.vy < 0 && ball.y - r <= SHIELD_Y) {
      ball.y = SHIELD_Y + r;
      ball.vy = Math.abs(ball.vy);
      this.shield = false;
      this.effects.dependabot = 0;
      this.onEvent('shield');
    }

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      const cx = clamp(ball.x, brick.x - brick.w / 2, brick.x + brick.w / 2);
      const cy = clamp(ball.y, brick.y - brick.d / 2, brick.y + brick.d / 2);
      const dx = ball.x - cx, dy = ball.y - cy;
      if (dx * dx + dy * dy > r * r) continue;
      const overlapX = brick.w / 2 + r - Math.abs(ball.x - brick.x);
      const overlapY = brick.d / 2 + r - Math.abs(ball.y - brick.y);
      if (overlapX < overlapY) {
        const dir = Math.sign(ball.x - brick.x) || 1;
        ball.x += dir * overlapX;
        ball.vx = dir * Math.abs(ball.vx);
      } else {
        const dir = Math.sign(ball.y - brick.y) || 1;
        ball.y += dir * overlapY;
        ball.vy = dir * Math.abs(ball.vy);
      }
      this.hitBrick(brick);
      break;
    }

    // Avoid near-horizontal loops that never return to the paddle.
    const speed = Math.hypot(ball.vx, ball.vy) || this.speed;
    const minVy = speed * 0.28;
    if (Math.abs(ball.vy) < minVy) {
      ball.vy = (Math.sign(ball.vy) || 1) * minVy;
      ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(Math.max(0, speed * speed - minVy * minVy));
    }

    if (ball.y < -1) {
      this.balls = this.balls.filter(b => b !== ball);
      this.onEvent('drop');
    }
  }

  hitBrick(brick, source = 'ball') {
    if (brick.kind === 'conflict') { this.onEvent('conflict', { brick }); return; }
    brick.hp -= 1;
    if (brick.hp > 0) { this.score += 5; this.onEvent('hit', { brick, source }); return; }
    brick.alive = false;
    this.score += 25 * brick.maxHp;
    this.onEvent('brick', { brick, source });
    if (brick.kind === 'bug') {
      this.bugs.push({ id: this.nextId++, x: brick.x, y: brick.y, baseX: brick.x, age: 0 });
      this.onEvent('bug-spawn', { brick });
    }
    let drop = brick.drop;
    if (!drop && brick.kind === 'commit' && this.random() < 0.09) {
      drop = ['copilot', 'dependabot', 'actions'][Math.floor(this.random() * 3)];
    }
    if (drop) this.items.push({ id: this.nextId++, type: drop, x: brick.x, y: brick.y });
  }

  catches(x, y, halfWidth) {
    return Math.abs(y - PADDLE.y) <= PADDLE.depth / 2 + 0.3 && Math.abs(x - this.paddle.x) <= this.paddle.width / 2 + halfWidth;
  }

  moveItems(dt) {
    for (const item of [...this.items]) {
      item.y -= 3.3 * dt;
      if (this.catches(item.x, item.y, 0.42)) {
        this.items = this.items.filter(i => i !== item);
        this.applyPower(item.type);
      } else if (item.y < -0.8) {
        this.items = this.items.filter(i => i !== item);
      }
    }
  }

  applyPower(type) {
    this.score += 50;
    this.effects[type] = POWERS[type].seconds;
    if (type === 'dependabot') this.shield = true;
    if (type === 'actions') this.paddle.fire = 0;
    if (type === 'copilot') {
      const extra = [];
      for (const ball of this.balls) {
        if (ball.attached) continue;
        for (const turn of [-0.42, 0.42]) {
          if (this.balls.length + extra.length >= BALL.maxBalls) break;
          const cos = Math.cos(turn), sin = Math.sin(turn);
          const vx = ball.vx * cos - ball.vy * sin;
          const vy = Math.abs(ball.vx * sin + ball.vy * cos) || this.speed;
          extra.push({ ...this.makeBall(false), x: ball.x, y: ball.y, vx, vy });
        }
      }
      this.balls.push(...extra);
    }
    this.onEvent('power', { type });
  }

  moveBugs(dt) {
    for (const bug of [...this.bugs]) {
      bug.age += dt;
      bug.y -= 2.5 * dt;
      bug.x = clamp(bug.baseX + Math.sin(bug.age * 2.6) * 0.9, -FIELD.width / 2 + 0.4, FIELD.width / 2 - 0.4);
      if (this.catches(bug.x, bug.y, 0.32)) {
        this.bugs = this.bugs.filter(b => b !== bug);
        if (this.shield) {
          this.score += 100;
          this.onEvent('bug-patched');
        } else {
          this.effects.regression = REGRESSION_SECONDS;
          this.onEvent('regression');
        }
      } else if (bug.y < -0.8) {
        this.bugs = this.bugs.filter(b => b !== bug);
      }
    }
  }

  moveLasers(dt) {
    for (const laser of [...this.lasers]) {
      laser.y += 17 * dt;
      let hit = laser.y > FIELD.height;
      for (const bug of this.bugs) {
        if (Math.abs(bug.x - laser.x) < 0.34 && Math.abs(bug.y - laser.y) < 0.34) {
          this.bugs = this.bugs.filter(b => b !== bug);
          this.score += 100;
          this.onEvent('bug-zapped', { bug });
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const brick of this.bricks) {
          if (brick.alive && Math.abs(laser.x - brick.x) <= brick.w / 2 && Math.abs(laser.y - brick.y) <= brick.d / 2) {
            this.hitBrick(brick, 'laser');
            hit = true;
            break;
          }
        }
      }
      if (hit) this.lasers = this.lasers.filter(l => l !== laser);
    }
  }

  loseLife() {
    this.lives -= 1;
    this.onEvent('life', { lives: this.lives });
    if (this.lives <= 0) {
      this.lives = 0;
      this.status = 'over';
      this.items = []; this.bugs = []; this.lasers = [];
      this.onEvent('over', { score: this.score });
      return;
    }
    this.resetRound();
    this.status = 'serving';
  }

  clearLevel() {
    this.score += 500 + this.lives * 100;
    this.status = 'cleared';
    this.clearTimer = 2.6;
    this.items = []; this.bugs = []; this.lasers = [];
    this.onEvent('cleared', { level: this.level, pr: this.info.pr });
  }
}
