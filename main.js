import { Grid } from './grid.js';
import { processNextGeneration } from './logic.js';
import { drawGrid } from './render.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 100;
const ROWS = 100;

let currentGrid = new Grid(COLS, ROWS);
let isRunning = false;
let animationId = null;
let lastFrameTime = 0;
let simulationSpeed = 50; 

const startBtn = document.getElementById("startBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const patternSelect = document.getElementById("patternSelect");
const speedRange = document.getElementById("speedRange");

function update() {
    currentGrid = processNextGeneration(currentGrid);
    drawGrid(ctx, canvas, currentGrid);
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
        startBtn.textContent = "Pause"; startBtn.style.backgroundColor = "#ff9800";
        lastFrameTime = performance.now(); requestAnimationFrame(gameLoop);
    } else {
        startBtn.textContent = "Play"; startBtn.style.backgroundColor = "#4CAF50";
        cancelAnimationFrame(animationId);
    }
}

function clearAllGrids() {
    currentGrid = new Grid(COLS, ROWS);
}

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const gridX = Math.floor((event.clientX - rect.left) * scaleX);
    const gridY = Math.floor((event.clientY - rect.top) * scaleY);
    
    currentGrid.toggle(gridX, gridY);
    drawGrid(ctx, canvas, currentGrid);
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault(); 
        toggleSimulation();
    } else if (e.key === "+" || e.key === "=") {
        simulationSpeed = Math.max(10, simulationSpeed - 20); 
        speedRange.value = simulationSpeed;
    } else if (e.key === "-") {
        simulationSpeed = Math.min(500, simulationSpeed + 20); 
        speedRange.value = simulationSpeed;
    }
});

startBtn.addEventListener("click", toggleSimulation);
stepBtn.addEventListener("click", () => { if (isRunning) toggleSimulation(); update(); });
resetBtn.addEventListener("click", () => { if (isRunning) toggleSimulation(); clearAllGrids(); drawGrid(); patternSelect.value = "none"; });
speedRange.addEventListener("input", (e) => simulationSpeed = parseInt(e.target.value));

patternSelect.addEventListener("change", (e) => {
    if (isRunning) toggleSimulation();
    clearAllGrids();
    
    const cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
    
    if (e.target.value === "gun") {
        const gunCoords = [
            [24, 1], [22, 2], [24, 2], [12, 3], [13, 3], [20, 3], [21, 3], [34, 3], [35, 3],
            [11, 4], [15, 4], [20, 4], [21, 4], [34, 4], [35, 4], [0, 5], [1, 5], [10, 5], 
            [16, 5], [20, 5], [21, 5], [0, 6], [1, 6], [10, 6], [14, 6], [16, 6], [17, 6], 
            [22, 6], [24, 6], [10, 7], [16, 7], [24, 7], [11, 8], [15, 8], [12, 9], [13, 9]
        ];
        let offsetX = 10, offsetY = 10;
        gunCoords.forEach(([x, y]) => currentGrid.set(x + offsetX, y + offsetY, 1));
    } 
    else if (e.target.value === "blinker") {
        currentGrid.set(cx, cy-1, 1); currentGrid.set(cx, cy, 1); currentGrid.set(cx, cy+1, 1);
    }
    else if (e.target.value === "block") {
        currentGrid.set(cx, cy, 1); currentGrid.set(cx+1, cy, 1); currentGrid.set(cx, cy+1, 1); currentGrid.set(cx+1, cy+1, 1);
    }
    else if (e.target.value === "glider") {
        currentGrid.set(cx, cy-1, 1); currentGrid.set(cx+1, cy, 1); currentGrid.set(cx-1, cy+1, 1); currentGrid.set(cx, cy+1, 1); currentGrid.set(cx+1, cy+1, 1);
    }
    
    drawGrid(ctx, canvas, currentGrid);
});

drawGrid(ctx, canvas, currentGrid);