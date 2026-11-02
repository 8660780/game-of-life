import { Grid } from './grid.js';

export function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (i === 0 && j === 0) continue;
            sum += grid.get(x + i, y + j);
        }
    }
    return sum;
}

export function processNextGeneration(currentGrid) {
    const nextGrid = new Grid(currentGrid.cols, currentGrid.rows);
    
    for (let x = 0; x < currentGrid.cols; x++) {
        for (let y = 0; y < currentGrid.rows; y++) {
            let neighbors = countNeighbors(currentGrid, x, y);
            let state = currentGrid.get(x, y);
            
            if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                nextGrid.set(x, y, 0);
            } else if (state === 0 && neighbors === 3) {
                nextGrid.set(x, y, 1);
            } else {
                nextGrid.set(x, y, state);
            }
        }
    }
    return nextGrid;
}