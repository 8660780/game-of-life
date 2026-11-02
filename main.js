import { Grid } from './grid.js';
import { nextGeneration } from './logic.js';
import { drawGrid } from './render.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 60;
const ROWS = 60;
const CELL_SIZE = 10;

let currentGrid = new Grid(COLS, ROWS);
let isRunning = false;
let animationId = null;
let lastFrameTime = 0;
let simulationSpeed = 100;

const startBtn = document.getElementById("startBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const patternSelect = document.getElementById("patternSelect");
const speedRange = document.getElementById("speedRange");

function update() {
    currentGrid = nextGeneration(currentGrid);
    drawGrid(ctx, canvas, currentGrid, CELL_SIZE);
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
    if (isRunning) {
        startBtn.textContent = "Pause"; 
        startBtn.style.backgroundColor = "#ff9800";
        lastFrameTime = performance.now(); 
        requestAnimationFrame(gameLoop);
    } else {
        startBtn.textContent = "Play"; 
        startBtn.style.backgroundColor = "#4CAF50";
        cancelAnimationFrame(animationId);
    }
}

// Кліки по полотну
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const gridX = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const gridY = Math.floor((event.clientY - rect.top) / CELL_SIZE);
    
    currentGrid.toggle(gridX, gridY);
    drawGrid(ctx, canvas, currentGrid, CELL_SIZE);
});

// Кнопки
startBtn.addEventListener("click", toggleSimulation);
stepBtn.addEventListener("click", () => { 
    if (isRunning) toggleSimulation(); 
    update(); 
});
resetBtn.addEventListener("click", () => { 
    if (isRunning) toggleSimulation(); 
    currentGrid = new Grid(COLS, ROWS); 
    drawGrid(ctx, canvas, currentGrid, CELL_SIZE); 
    patternSelect.value = "none";
});

// Обробник повзунка швидкості
speedRange.addEventListener("input", (e) => {
    simulationSpeed = parseInt(e.target.value, 10);
});

// Обробник вибору патернів
patternSelect.addEventListener("change", (e) => {
    if (isRunning) toggleSimulation();
    currentGrid = new Grid(COLS, ROWS); // Очищаємо поле перед новим патерном
    
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    
    if (e.target.value === "blinker") {
        currentGrid.set(cx, cy - 1, 1);
        currentGrid.set(cx, cy, 1);
        currentGrid.set(cx, cy + 1, 1);
    } else if (e.target.value === "block") {
        currentGrid.set(cx, cy, 1);
        currentGrid.set(cx + 1, cy, 1);
        currentGrid.set(cx, cy + 1, 1);
        currentGrid.set(cx + 1, cy + 1, 1);
    } else if (e.target.value === "glider") {
        currentGrid.set(cx, cy - 1, 1);
        currentGrid.set(cx + 1, cy, 1);
        currentGrid.set(cx - 1, cy + 1, 1);
        currentGrid.set(cx, cy + 1, 1);
        currentGrid.set(cx + 1, cy + 1, 1);
    }
    
    drawGrid(ctx, canvas, currentGrid, CELL_SIZE);
});

// Початкове малювання
drawGrid(ctx, canvas, currentGrid, CELL_SIZE);