const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const COLS = 50, ROWS = 50, CELL_SIZE = 10;

function createEmptyGrid() {
    return new Array(COLS).fill(null).map(() => new Array(ROWS).fill(0));
}
let grid = createEmptyGrid();

// Початкові фігури
grid[10][10] = 1; grid[11][10] = 1; grid[12][10] = 1; // Blinker
grid[20][2] = 1; grid[21][3] = 1; grid[19][4] = 1; grid[20][4] = 1; grid[21][4] = 1; // Glider

function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (i === 0 && j === 0) continue;
            let col = x + i, row = y + j;
            if (col >= 0 && col < COLS && row >= 0 && row < ROWS) sum += grid[col][row];
        }
    }
    return sum;
}

function nextGeneration(currentGrid) {
    let newGrid = createEmptyGrid(); // Створення нового масиву (неефективно для великих сіток)
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            let neighbors = countNeighbors(currentGrid, x, y);
            let state = currentGrid[x][y];
            if (state === 1 && (neighbors < 2 || neighbors > 3)) newGrid[x][y] = 0;
            else if (state === 0 && neighbors === 3) newGrid[x][y] = 1;
            else newGrid[x][y] = state;
        }
    }
    return newGrid;
}

function drawGrid() {
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            if (grid[x][y] === 1) ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

drawGrid();
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") { event.preventDefault(); grid = nextGeneration(grid); drawGrid(); }
});