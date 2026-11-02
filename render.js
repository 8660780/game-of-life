let imageData = null;

const MARK_COLORS = { launch: [76, 175, 80], arrow: [255, 152, 0] };

function setPixel(imgData, cols, rows, x, y, r, g, b) {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    const index = (y * cols + x) * 4;
    imgData.data[index] = r;
    imgData.data[index + 1] = g;
    imgData.data[index + 2] = b;
    imgData.data[index + 3] = 255;
}

export function drawGridState(ctx, canvas, grid, showMarks, placedMarks, activePattern, hoverCell, pCells, pMarks) {
    if (!imageData || imageData.width !== grid.cols || imageData.height !== grid.rows) {
        imageData = ctx.createImageData(grid.cols, grid.rows);
    }

    // 1. Малюємо саму сітку
    for (let x = 0; x < grid.cols; x++) {
        for (let y = 0; y < grid.rows; y++) {
            const isAlive = grid.get(x, y) === 1;
            const color = isAlive ? 255 : 0;
            setPixel(imageData, grid.cols, grid.rows, x, y, color, color, color);
        }
    }

    // Допоміжна функція для позначок
    const paintMarks = (marks, overLive) => {
        for (const type of ["arrow", "launch"]) {
            if (!marks[type]) continue;
            const [r, g, b] = MARK_COLORS[type];
            for (const [x, y] of marks[type]) {
                if (!overLive && grid.get(x, y) === 1) continue;
                setPixel(imageData, grid.cols, grid.rows, x, y, r, g, b);
            }
        }
    };

    // 2. Малюємо позначки гармат, що вже стоять
    if (showMarks) {
        for (const entry of placedMarks) {
            paintMarks(entry.marks, false);
        }
    }

    // 3. Малюємо прев'ю патерну під курсором (синій колір)
    if (activePattern && hoverCell && pCells) {
        for (const [x, y] of pCells) {
            setPixel(imageData, grid.cols, grid.rows, x, y, 33, 150, 243);
        }
        if (showMarks && pMarks) {
            paintMarks(pMarks, true);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}