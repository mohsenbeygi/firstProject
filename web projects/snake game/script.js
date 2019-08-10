function createTable(boardId) {
    var table = document.getElementById(boardId);
    var cellTables = [];
    let rowCells = [];
    for (var row = 0; row < TABLE_LEN; row ++) {
        var tableRow = table.insertRow(-1);
        rowCells = [];
        for (var col = 0; col < TABLE_LEN; col ++) {
            var cell = tableRow.insertCell(-1);
            cell.setAttribute('class', 'cell');
            rowCells.push(cell);
        }
        cellTables.push(rowCells);
    }
    return cellTables;
}


const TABLE_LEN = 15;

cells = createTable('grid');

class Snake {
    constructor () {
        this.body = [Array.from(startHead[0])];
        this.vx = 1;
        this.vy = 0;
    }
    collision() {
        for (let index = 0; index < this.body.length - 3; index ++) {
            if (this.body[index][0] == this.body[this.body.length - 1][0]) {
                if (this.body[index][1] == this.body[this.body.length - 1][1]) {
                    return true;
                }
            }
        }
        return false;
    }
    update(apple) {
        if (this.collision()) this.body = [this.body[this.body.length - 1]]
        let xDist = apple.x == this.body[this.body.length - 1][1];
        let yDist = apple.y == this.body[this.body.length - 1][0];
        let newPos = [
            this.body[this.body.length - 1][0] + this.vy,
            this.body[this.body.length - 1][1] + this.vx
        ];
        if (newPos[0] >= TABLE_LEN) {
            newPos[0] = 0; this.vx = 0; this.vy = 1;
        } else if (newPos[0] < 0) {
            newPos[0] = TABLE_LEN - 1; this.vx = 0; this.vy = -1;
        }
        if (newPos[1] >= TABLE_LEN) {
            newPos[1] = 0; this.vx = 1; this.vy = 0;
        } else if (newPos[1] < 0) {
            newPos[1] = TABLE_LEN - 1; this.vx = -1; this.vy = 0;
        }
        if (xDist && yDist) {
            this.body.push(newPos)
            apple.spawn()
        } else {
            for (let index = 0; index < this.body.length - 1; index ++) {
                this.body[index] = this.body[index + 1]
            }
            this.body[this.body.length - 1] = newPos;
        }
        draw(this.body, apple)
    }
}

class Apple {
    constructor () {
        this.x = Math.floor((Math.random() * TABLE_LEN));
        this.y = Math.floor((Math.random() * TABLE_LEN));
    }
    spawn () {
        this.x = Math.floor((Math.random() * TABLE_LEN));
        this.y = Math.floor((Math.random() * TABLE_LEN));

    }
}

const startHead = [[7, 5]]
var snake = new Snake();
var apple = new Apple();
idDiv = document.getElementById('score');
document.addEventListener('keydown', updateDir);
setInterval(function () {snake.update(apple)}, 1000 / 10);
function updateDir(event) {
    // console.log('new turn');
    switch(event.keyCode) {
        case 37:
            if (snake.vx != 1 || snake.vy != 0) {
                snake.vx = -1; snake.vy = 0; break;
            }
            break;
        case 38:
            if (snake.vx != 0 || snake.vy != 1) {
                snake.vx = 0; snake.vy = -1; break;
            }
            break;
        case 39:
            if (snake.vx != -1 || snake.vy != 0) {
                snake.vx = 1; snake.vy = 0; break;
            }
            break;
        case 40:
            if (snake.vx != 0 || snake.vy != -1) {
                snake.vx = 0; snake.vy = 1;
            }
            break;
    }
}

function draw(body, apple) {
    idDiv.innerText = 'length: ' + body.length
    // console.log('draw snake');
    for (let row of cells) {
        for (let cell of row) {
            cell.style.backgroundColor = 'black'
        }
    }
    for (let index = 0; index < body.length - 1; index ++) {
        let pos = body[index];
        cells[pos[0]][pos[1]].style.backgroundColor = 'white';
    }
    let head = body[body.length - 1];
    // console.log(head[0], head[1])
    cells[head[0]][head[1]].style.backgroundColor = 'yellow';
    cells[apple.y][apple.x].style.backgroundColor = 'red';
}
