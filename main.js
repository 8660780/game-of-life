import { Grid } from './grid.js';
import { processNextGeneration } from './logic.js';
import { drawGridState } from './render.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gridOverlay = document.getElementById("gridOverlay");

const COLS = 100;
const ROWS = 100;

const SPEED_MIN = 10;
const SPEED_MAX = 500;

let currentGrid = new Grid(COLS, ROWS);
let isRunning = false, animationId = null, lastFrameTime = 0, simulationSpeed = 50, generation = 0;

let gridVisible = false;
let showMarks = true;
let activePattern = null;
let hoverCell = null;
let placedMarks = [];

const inField = (x, y) => x >= 0 && x < COLS && y >= 0 && y < ROWS;

// ---------- Патерни ----------
const PATTERNS = {
    glider: {
        cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
        marks: { persistent: false, launch: [], arrow: [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [5, 7], [6, 7], [7, 5], [7, 6]] }
    },
    blinker: { cells: [[0, 0], [0, 1], [0, 2]] },
    block:   { cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    gun: {
        period: 30,
        cells: [
            [24, 1], [22, 2], [24, 2], [12, 3], [13, 3], [20, 3], [21, 3], [34, 3], [35, 3],
            [11, 4], [15, 4], [20, 4], [21, 4], [34, 4], [35, 4], [0, 5], [1, 5], [10, 5],
            [16, 5], [20, 5], [21, 5], [0, 6], [1, 6], [10, 6], [14, 6], [16, 6], [17, 6],
            [22, 6], [24, 6], [10, 7], [16, 7], [24, 7], [11, 8], [15, 8], [12, 9], [13, 9]
        ],
        marks: {
            persistent: true, launch: [[22, 10]],
            arrow: [[23, 11], [24, 12], [25, 13], [26, 14], [27, 15], [28, 16], [29, 17], [30, 18], [31, 19], [32, 20], [33, 21], [31, 21], [32, 21], [33, 19], [33, 20]]
        }
    }
};

function transformPattern(p, fn) {
    const moved = p.cells.map(fn);
    const minX = Math.min(...moved.map(c => c[0])), minY = Math.min(...moved.map(c => c[1]));
    const shift = ([x, y]) => [x - minX, y - minY];
    const result = { cells: moved.map(shift), period: p.period };
    if (p.marks) {
        result.marks = { persistent: p.marks.persistent, launch: p.marks.launch.map(fn).map(shift), arrow: p.marks.arrow.map(fn).map(shift) };
    }
    return result;
}

function rotatePattern(p) { return transformPattern(p, ([x, y]) => [-y, x]); }

for (const name of Object.keys(PATTERNS)) PATTERNS[name] = transformPattern(PATTERNS[name], (c) => c);

function getPlacementOffset(cellX, cellY) {
    const w = Math.max(...activePattern.cells.map(c => c[0])) + 1, h = Math.max(...activePattern.cells.map(c => c[1])) + 1;
    return { dx: cellX - Math.floor(w / 2), dy: cellY - Math.floor(h / 2) };
}

function getPlacementCells(cellX, cellY) {
    const { dx, dy } = getPlacementOffset(cellX, cellY);
    return activePattern.cells.map(([x, y]) => [x + dx, y + dy]);
}

function getPlacementMarks(cellX, cellY) {
    if (!activePattern.marks) return null;
    const { dx, dy } = getPlacementOffset(cellX, cellY);
    return { launch: activePattern.marks.launch.map(([x, y]) => [x + dx, y + dy]), arrow: activePattern.marks.arrow.map(([x, y]) => [x + dx, y + dy]) };
}

// ---------- Фази гармати ----------
function snapshotRegion(grid, r) {
    const snap = [];
    for (let x = r.x0; x <= r.x1; x++) for (let y = r.y0; y <= r.y1; y++) snap.push(grid.get(x, y));
    return snap;
}

// Область має збігатися з очікуваною фазою точно: і зниклі, і зайві живі клітинки
// означають, що гармату зламано. (Раніше перевірялися лише очікувані живі клітинки,
// тому зайва клітинка або глайдер усередині області помітки не прибирали.)
function regionMatches(grid, r, snap) {
    let i = 0;
    for (let x = r.x0; x <= r.x1; x++) {
        for (let y = r.y0; y <= r.y1; y++) {
            if (grid.get(x, y) !== snap[i++]) return false;
        }
    }
    return true;
}

function computePhases(cells, region, period) {
    let g = new Grid(COLS, ROWS);
    cells.forEach(([x, y]) => g.set(x, y, 1));
    const phases = [];
    for (let p = 0; p < period * 2; p++) {
        phases.push(snapshotRegion(g, region));
        g = processNextGeneration(g);
    }
    return phases;
}

function pruneInactiveMarks() {
    placedMarks = placedMarks.filter(entry => {
        const t = generation - entry.startGen;
        const index = t < entry.period ? t : entry.period + ((t - entry.period) % entry.period);
        return regionMatches(currentGrid, entry.region, entry.phases[index]);
    });
}

// ---------- Рендеринг ----------
function updateView() {
    let pCells = null, pMarks = null;
    if (activePattern && hoverCell) {
        pCells = getPlacementCells(hoverCell.x, hoverCell.y);
        pMarks = getPlacementMarks(hoverCell.x, hoverCell.y);
    }
    drawGridState(ctx, canvas, currentGrid, showMarks, placedMarks, activePattern, hoverCell, pCells, pMarks);
}

// ---------- Симуляція ----------
function update() {
    currentGrid = processNextGeneration(currentGrid);
    generation++;
    pruneInactiveMarks();
    updateView();
}

function gameLoop(timestamp) {
    if (!isRunning) return;
    const deltaTime = timestamp - lastFrameTime;
    if (deltaTime > simulationSpeed) {
        update();
        lastFrameTime = timestamp;
    }
    animationId = requestAnimationFrame(gameLoop);
}

function toggleSimulation() {
    isRunning = !isRunning;
    const startBtn = document.getElementById("startBtn");
    if (isRunning) {
        startBtn.textContent = "Pause"; startBtn.style.backgroundColor = "#ff9800";
        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);   // раніше id не зберігався, і cancelAnimationFrame нічого не скасовував
    } else {
        startBtn.textContent = "Play"; startBtn.style.backgroundColor = "#4CAF50";
        cancelAnimationFrame(animationId);
    }
}

// ---------- UI та Події ----------
// canvas має рамку: getBoundingClientRect() повертає розмір разом з нею, а координати клітинок
// рахуються від внутрішньої області. Без урахування рамки клік зсувався приблизно на 2 пікселі,
// і права третина кожної клітинки потрапляла в сусідню.
const getCell = (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - canvas.clientLeft;
    const py = e.clientY - rect.top - canvas.clientTop;
    return {
        x: Math.floor(px * (canvas.width / canvas.clientWidth)),
        y: Math.floor(py * (canvas.height / canvas.clientHeight))
    };
};

function cancelPlacement() {
    activePattern = null;
    document.getElementById("patternSelect").value = "none";
    canvas.style.cursor = "crosshair";
    rotateBtn.disabled = true;
    updateView();
}

canvas.addEventListener("mousemove", (e) => { if(activePattern) { hoverCell = getCell(e); updateView(); } });
canvas.addEventListener("mouseleave", () => { hoverCell = null; updateView(); });

// Права кнопка миші скасовує розміщення патерну (як сказано в підказці)
canvas.addEventListener("contextmenu", (e) => {
    if (activePattern) {
        e.preventDefault();
        cancelPlacement();
    }
});

canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const { x, y } = getCell(e);
    if (!inField(x, y)) return;

    if (activePattern) {
        const cells = getPlacementCells(x, y);
        cells.forEach(([cx, cy]) => currentGrid.set(cx, cy, 1));   // Grid.set сам ігнорує клітинки за межами поля

        const marks = getPlacementMarks(x, y);
        // Гармату, обрізану краєм поля, не відстежуємо: частини клітинок немає, тож це вже не робоча
        // гармата, і помітки "стріляє звідси сюди" вводили б в оману.
        if (marks && activePattern.marks.persistent && cells.every(([cx, cy]) => inField(cx, cy))) {
            const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
            const region = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
            placedMarks.push({ marks, region, period: activePattern.period, phases: computePhases(cells, region, activePattern.period), startGen: generation });
        }
    } else {
        currentGrid.toggle(x, y);
    }
    pruneInactiveMarks();
    updateView();
});

document.getElementById("gridBtn").addEventListener("click", (e) => {
    gridVisible = !gridVisible;
    gridOverlay.classList.toggle("visible", gridVisible);
    e.target.classList.toggle("active", gridVisible);
    e.target.textContent = gridVisible ? "Grid: On" : "Grid: Off";
    e.target.blur();
});

document.getElementById("marksBtn").addEventListener("click", (e) => {
    showMarks = !showMarks;
    e.target.classList.toggle("active", showMarks);
    e.target.textContent = showMarks ? "Marks: On" : "Marks: Off";
    e.target.blur();
    updateView();
});

const rotateBtn = document.getElementById("rotateBtn");
rotateBtn.addEventListener("click", () => {
    if (activePattern) activePattern = rotatePattern(activePattern);
    rotateBtn.blur(); updateView();
});

document.getElementById("startBtn").addEventListener("click", toggleSimulation);
document.getElementById("stepBtn").addEventListener("click", () => { if (isRunning) toggleSimulation(); update(); });
document.getElementById("resetBtn").addEventListener("click", () => {
    if (isRunning) toggleSimulation();
    currentGrid = new Grid(COLS, ROWS); placedMarks = []; generation = 0; updateView();
});

document.getElementById("patternSelect").addEventListener("change", (e) => {
    const name = e.target.value;
    e.target.blur();
    if (name === "none" || !PATTERNS[name]) {
        cancelPlacement();
        return;
    }
    activePattern = PATTERNS[name]; canvas.style.cursor = "copy"; rotateBtn.disabled = false;
    updateView();
});

// ---------- Швидкість ----------
const speedRange = document.getElementById("speedRange"), speedInput = document.getElementById("speedInput");

// Порожнє або нечислове поле дає parseInt(...) === NaN. Раніше це потрапляло в simulationSpeed,
// і умова deltaTime > NaN більше ніколи не спрацьовувала: симуляція зупинялась.
// Тепер некоректне значення ігнорується, а в поля повертається остання коректна швидкість.
const setSpeed = (v) => {
    if (Number.isFinite(v)) simulationSpeed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, Math.round(v)));
    speedRange.value = simulationSpeed;
    speedInput.value = simulationSpeed;
};
speedRange.addEventListener("input", (e) => setSpeed(parseInt(e.target.value, 10)));
speedInput.addEventListener("change", (e) => setSpeed(parseInt(e.target.value, 10)));

document.addEventListener("keydown", (e) => {
    if (document.activeElement === speedInput) return;
    if (e.code === "Space") { e.preventDefault(); toggleSimulation(); }
    else if (e.code === "KeyG") document.getElementById("gridBtn").click();
    else if (e.code === "KeyM") document.getElementById("marksBtn").click();
    else if (e.code === "KeyR") rotateBtn.click();
    else if (e.code === "Escape") { if (activePattern) cancelPlacement(); }
    else if (e.key === "+" || e.key === "=") setSpeed(simulationSpeed - 10);
    else if (e.key === "-") setSpeed(simulationSpeed + 10);
});

rotateBtn.disabled = true;
updateView();