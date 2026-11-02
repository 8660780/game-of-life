export function drawGrid(ctx, canvas, grid, cellSize) {
    // Очищаємо екран (чорний фон)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Малюємо живі клітинки
    ctx.fillStyle = "white";
    for (let x = 0; x < grid.cols; x++) {
        for (let y = 0; y < grid.rows; y++) {
            if (grid.get(x, y) === 1) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    // Малюємо сіру сітку
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x = 0; x <= canvas.width; x += cellSize) { 
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); 
    }
    for(let y = 0; y <= canvas.height; y += cellSize) { 
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); 
    }
    ctx.stroke();
}