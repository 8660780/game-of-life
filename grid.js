export class Grid {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        // Створюємо двовимірний масив
        this.cells = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
    }

    get(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return 0;
        return this.cells[x][y];
    }

    set(x, y, value) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            this.cells[x][y] = value;
        }
    }

    toggle(x, y) {
        this.set(x, y, this.get(x, y) === 1 ? 0 : 1);
    }
}