let imageData = null;

export function drawGrid(ctx, canvas, grid) {
    if (!imageData || imageData.width !== grid.cols || imageData.height !== grid.rows) {
        imageData = ctx.createImageData(grid.cols, grid.rows);
    }

    for (let x = 0; x < grid.cols; x++) {
        for (let y = 0; y < grid.rows; y++) {
            const index = (y * grid.cols + x) * 4;
            const isAlive = grid.get(x, y) === 1;
            
            const color = isAlive ? 255 : 0; 
            
            imageData.data[index] = color;     // Red
            imageData.data[index + 1] = color; // Green
            imageData.data[index + 2] = color; // Blue
            imageData.data[index + 3] = 255;   // Alpha
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}