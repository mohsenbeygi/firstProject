const BLACK = 1, WHITE = 2, EMPTY = 0, TABLE_LEN = 8;
const AI = BLACK, HUMAN = WHITE;
const COMPUTER_DEPTH = 7;
const CORNERS = [[0, 0],
    [TABLE_LEN - 1, 0],
    [0, TABLE_LEN - 1],
    [TABLE_LEN - 1, TABLE_LEN - 1]
];
const AiWaitTime = 400000;
var origBoard;
var computerTurn = false;

cells = createTable("gametable");

startGame(cells)

setInterval(function () {checkAiResponse()}, 1000 / 5);

function startGame(cells) {
    document.querySelector(".result").style.display = "none";
    origBoard = getEmptyBoard()
    getEmptyTable(cells)
    movesPossible = getMoves(origBoard, HUMAN)
    showScores(origBoard)
    for (let move of movesPossible) {
        cells[move[0]][move[1]].innerHTML =
        '<span class="redcircle"></span>'
    }
    for (let row = 0; row < TABLE_LEN; row++) {
        for (let col = 0; col < TABLE_LEN; col++) {
            // cells[row][col].addEventListener('click',
            // (cell) => analyseMove(row, col, cell), false);
            cells[row][col].addEventListener('click', function() {
                analyseMove(row, col, cells[row][col], origBoard);
            }, false);
        }
    }
}

function setStartPieces(cells) {
    for (let x = TABLE_LEN / 2 - 1; x < TABLE_LEN / 2 + 1; x++) {
        for (let y = TABLE_LEN / 2 - 1; y < TABLE_LEN / 2 + 1; y++) {
            let className = "whitecircle"
            if (x == y) className = "blackcircle";
            cells[y][x].innerHTML =
            '<span class="' + className + '"></span>';
        }
    }
}

function createTable(boardId) {
    var table = document.getElementById(boardId);
    var tableCells = [];
    for (var row = 0; row < TABLE_LEN; row++) {
        var tableRow = table.insertRow(-1);
        var rowCells = [];
        for (var col = 0; col < TABLE_LEN; col++) {
            var cell = tableRow.insertCell(-1);
            cell.setAttribute('class', 'cell');
            rowCells.push(cell);
        }
        tableCells.push(rowCells);
    }
    setStartPieces(tableCells);
    return tableCells;
}

function getEmptyBoard() {
    var origBoard = [];
    for (let y = 0; y < TABLE_LEN; y++) {
        let row = [];
        for (let x = 0; x < TABLE_LEN; x++) {
            row.push(EMPTY);
        }
        origBoard.push(row);
    }
    for (let x = TABLE_LEN / 2 - 1; x < TABLE_LEN / 2 + 1; x++) {
        for (let y = TABLE_LEN / 2 - 1; y < TABLE_LEN / 2 + 1; y++) {
            let color = WHITE
            if (x == y) color = BLACK;
            origBoard[y][x] = color;
        }
    }
    return origBoard;
}

function getEmptyTable(cells) {
    for (let row = 0; row < TABLE_LEN; row++) {
        for (let col = 0; col < TABLE_LEN; col++) {
            cells[row][col].innerHTML = '<span></span>';
        }
    }
    setStartPieces(cells);
}
function checkAiResponse() {
    if (computerTurn) {
        setTimeout(function() {}, AiWaitTime);
        aiMovesPossible = getMoves(origBoard, AI);
        let scores = showScores(origBoard);
        if (! checkEnd(scores) && aiMovesPossible.length > 0) {
            // ai move (ai turn is after humans turn)
            // setTimeout(function(){}, 10000)
            aiMove = getBestMove(origBoard);
            makeMove(aiMove[0], aiMove[1], AI, origBoard);
            console.log('\n\n--- Ai move start ---\n');
            console.log('\nai move:\nx: ', aiMove[0], ' y: ', aiMove[1]);
            scores = showScores(origBoard);
            aiMovesPossible = getMoves(origBoard, AI)
            c = getMoves(origBoard, HUMAN).length == 0;
            if (c && aiMovesPossible.length > 0) {
                scores = showScores(origBoard);
                return
            }
            // while (c && aiMovesPossible.length > 0) {
            //     aiMove = getBestMove(origBoard);
            //     console.log('ai move:\nx: ', aiMove[0], ' y: ', aiMove[1]);
            //     makeMove(aiMove[0], aiMove[1], AI, origBoard);
            //     setTimeout(function() {}, AiWaitTime);
            //     aiMovesPossible = getMoves(origBoard, AI);
            //     c = getMoves(origBoard, HUMAN).length == 0;
            //     scores = showScores(origBoard);
            // }
            console.log('\n--- Ai move end ---\n\n\n');

        }
        // mark spots the player can put pieces in
        humanMovesPossible = getMoves(origBoard, HUMAN);
        for (let move of humanMovesPossible) {
            cells[move[0]][move[1]].innerHTML =
            '<span class="redcircle"></span>'
        }
        checkEnd(scores);
        computerTurn = false;
    }


}

function analyseMove(row, col, cell) {
    // check if spot is empty
    if (origBoard[row][col] == EMPTY) {
        // check if spot is valif (possible to capture atleast one piece)
        if (validMove(row, col, origBoard, HUMAN)) {
            // console.log('row: ', row, 'col: ', col)
            removeMoveMarkers(cells);
            makeMove(row, col, HUMAN, origBoard);
            let scores = showScores(origBoard);
            computerTurn = true;
            checkEnd(scores);

        }
    }

}



function checkEnd(scores) {
    aiMovesPossible = getMoves(origBoard, AI)
    humanMovesPossible = getMoves(origBoard, HUMAN)
    // game finsished
    if (aiMovesPossible.length == 0 && humanMovesPossible.length == 0) {
        console.log('finished')
        stopGame()
        let state = 'black';
        if (scores.white > scores.black) {
            state = 'white';
        } else if (scores.white == scores.black) {
            state = 'tie';
        }
        declareWinner(origBoard, state);
        return true;
    }
    return false;
}

function copyList(arr) {
    var newArr = [];
    for (let innerArr of arr) {
        newArr.push(Array.from(innerArr));
    }
    return newArr;
}

function makeMove(row, col, player, board) {
    var className;
    if (player == BLACK) {
        className = 'blackcircle';
    }  else className = 'whitecircle';
    // change choosen spot color
    cells[row][col].innerHTML = '<span class="' + className + '"></span>';
    board[row][col] = player;

    var x = col;
    var y = row;
    // pieces in specific direction
    var dirPieces = [];
    var flipped = [];
    // x direction ( -1, 0, 1)
    for (var xDir = -1; xDir < 2; xDir ++) {
        // y direction ( -1, 0, 1)
        for (var yDir = -1; yDir < 2; yDir ++) {
            // opponent pieces in-between players pieces
            dirPieces = [];
            // length to go on the specific direction
            for (var len = 1; len < TABLE_LEN - 1; len ++) {
                x = col + len * xDir, y = row + len * yDir;
                // stop if gone out of table
                if (x < 0 || x >= TABLE_LEN || y < 0 || y >= TABLE_LEN) break;
                // if reach an empty break (not able to capture)
                if (board[y][x] == EMPTY) {
                    break;
                } else if (board[y][x] == player) {
                    // if reach own color check if were opponent pieces between
                    if (dirPieces.length >= 1) flipped =
                    flipped.concat(dirPieces);
                    // if before reaching opponent color, we reach own break
                    break;
                } else dirPieces.push([y, x]);

            }
        }
    }
    for (let spot of flipped) {
        board[spot[0]][spot[1]] = player;
        cells[spot[0]][spot[1]].innerHTML =
        '<span class="' + className + '"></span>';
    }
}

function removeMoveMarkers(cells) {
    for (let row of cells) {
        for (let cell of row) {
            if (cell.innerHTML == '<span class="redcircle"></span>') {
                cell.innerHTML = "<span></span>";
            }
        }
    }
}

function getMoves(board, player) {
    var moves = [];
    for (let row = 0; row < TABLE_LEN; row++) {
        for (let col = 0; col < TABLE_LEN; col++) {
            if (validMove(row, col, board, player)) moves.push([row, col]);
        }
    }
    return moves;
}

// function validMove(row, col, board, player) {
//     // if empty
//     if (board[row][col] != EMPTY) return false;
//     // right
//     var opponentPieces = 0;
//     for (let x = col + 1; x < TABLE_LEN; x ++) {
//         if (board[row][x] == EMPTY) {
//             break;
//         } else if (board[row][x] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//     }
//     // left
//     opponentPieces = 0;
//     for (let x = col - 1; x >= 0; x --) {
//         if (board[row][x] == EMPTY) {
//             break;
//         } else if (board[row][x] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//     }
//     // down
//     var opponentPieces = 0;
//     for (let y = row + 1; y < TABLE_LEN; y ++) {
//         if (board[y][col] == EMPTY) {
//             break;
//         } else if (board[y][col] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//     }
//     // up
//     var opponentPieces = 0;
//     for (let y = row - 1; y >= 0; y --) {
//         if (board[y][col] == EMPTY) {
//             break;
//         } else if (board[y][col] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//     }
//     // right down
//     var opponentPieces = 0;
//     var x = col + 1;
//     var y = row + 1;
//     for (let move = Math.max(x, y); move < TABLE_LEN; move ++) {
//         if (board[y][x] == EMPTY) {
//             break;
//         } else if (board[y][x] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//         x ++, y ++;
//     }
//     // left up
//     var opponentPieces = 0;
//     var x = col - 1;
//     var y = row - 1;
//     for (let move = Math.min(x, y); move >= 0; move --) {
//         if (board[y][x] == EMPTY) {
//             break;
//         } else if (board[y][x] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//         x --, y --;
//     }
//     // right up
//     var opponentPieces = 0;
//     var x = col + 1;
//     var y = row - 1;
//     for (let move = Math.min(TABLE_LEN - x, y); move > 0; move --) {
//         if (board[y][x] == EMPTY) {
//             break;
//         } else if (board[y][x] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//         x ++, y --;
//     }
//     // left down
//     var opponentPieces = 0;
//     var x = col - 1;
//     var y = row + 1;
//     // console.log('start', row, col)
//     for (let move = Math.min(x, TABLE_LEN - y); move > 0; move --) {
//         // console.log('move:', move, 'y: ', TABLE_LEN - y, 'x: ', x)
//         if (board[y][x] == EMPTY) {
//             break;
//         } else if (board[y][x] == player) {
//             if (opponentPieces >= 1) return true;
//             break;
//         } else opponentPieces ++;
//         x --, y ++;
//     }
//     return false;
// }

function validMove(row, col, board, player) {
    // check if spot is empty
    if (board[row][col] != EMPTY) return false
    var x = col;
    var y = row;
    var opponentPieces = 0;
    // x direction ( -1, 0, 1)
    for (var xDir = -1; xDir < 2; xDir ++) {
        // y direction ( -1, 0, 1)
        for (var yDir = -1; yDir < 2; yDir ++) {
            // opponent pieces in-between players pieces
            opponentPieces = 0;
            // length to go on the specific direction
            for (var len = 1; len < TABLE_LEN - 1; len ++) {
                x = col + len * xDir, y = row + len * yDir;
                // stop if gone out of table
                if (x < 0 || x >= TABLE_LEN || y < 0 || y >= TABLE_LEN) break;
                // if reach an empty break (not able to capture)
                if (board[y][x] == EMPTY) {
                    break;
                } else if (board[y][x] == player) {
                    // if reach own color check if were opponent pieces between
                    if (opponentPieces >= 1) return true;
                    // if before reaching opponent color, we reach own break
                    break;
                } else opponentPieces ++;

            }
        }
    }
    // if nothing was able to be captured (invalid move) return false
    return false
}

function stopGame() {
    for (let row of cells) {
        for (let cell of row) {
            cell.removeEventListener('click',
            (cell) => analyseMove(row, col, cell), false);
        }
    }
}

function declareWinner(board, state) {
    document.querySelector(".result").style.display = "block";
    if (state == 'tie') {
        document.querySelector(".result").innerText = "Tie !";
    } else {
        let mess = 'Winner is ' + state;
        document.querySelector(".result").innerText = mess
    }
}

function showScores(board) {
    var black = 0;
    var white = 0;
    for (let row of board) {
        for (let cell of row) {
            if (cell == BLACK) black ++
            if (cell == WHITE) white ++
        }
    }
    let mess = "White: " + white.toString() + "\n\nBlack: " + black.toString()
    document.querySelector(".score").innerText = mess
    return {black: black, white: white}
}

function getBestMove(board) {
    move = minimax(board, -Infinity, Infinity, COMPUTER_DEPTH, AI).move
    return move

}

function evaluateBoard(board, aiMoveCount, opponentMoveCount) {
    // number of moves possible for ai and human
    var moveCountScore = (aiMoveCount - opponentMoveCount)
    // (aiMoveCount + opponentMoveCount);

    // difference between number of corners of ai and human
    var cornerScore = 0;
    for (let corner of CORNERS) {
        if (board[corner[0]][corner[1]] == AI) {
            cornerScore += 1
        } else if (board[corner[0]][corner[1]] == HUMAN) cornerScore -= 1
    }

    // difference between number of pieces in total
    var aiPieceCount = 0;
    var humanPieceCount = 0;
    for (let row of board) {
        for (let cell of board) {
            if (cell == AI) {
                aiPieceCount ++
            } else if (cell == HUMAN) humanPieceCount ++
        }
    }
    // return scores with weights
    return moveCountScore * 10 + cornerScore * 100 + (aiPieceCount - humanPieceCount) /
    (aiPieceCount + humanPieceCount)
}

function implementMove(row, col, player, board) {
    var className;
    if (player == BLACK) {
        className = 'blackcircle';
    }  else className = 'whitecircle';

    var x = col;
    var y = row;
    // pieces in specific direction
    var dirPieces = [];
    var flipped = [[row, col]];
    // x direction ( -1, 0, 1)
    for (var xDir = -1; xDir < 2; xDir ++) {
        // y direction ( -1, 0, 1)
        for (var yDir = -1; yDir < 2; yDir ++) {
            // opponent pieces in-between players pieces
            dirPieces = [];
            // length to go on the specific direction
            for (var len = 1; len < TABLE_LEN - 1; len ++) {
                x = col + len * xDir, y = row + len * yDir;
                // stop if gone out of table
                if (x < 0 || x >= TABLE_LEN || y < 0 || y >= TABLE_LEN) break;
                // if reach an empty break (not able to capture)
                if (board[y][x] == EMPTY) {
                    break;
                } else if (board[y][x] == player) {
                    // if reach own color check if were opponent pieces between
                    if (dirPieces.length >= 1) flipped =
                    flipped.concat(dirPieces);
                    // if before reaching opponent color, we reach own break
                    break;
                } else dirPieces.push([y, x]);

            }
        }
    }
    for (let spot of flipped) {
        board[spot[0]][spot[1]] = player;
    }
    return flipped
}

function minimax(board, alpha, beta, depth, turn) {
    if (depth == 0) {
        return {value: evaluateBoard(board,
            getMoves(board, AI).length, getMoves(board, HUMAN).length)};
    }
    var moves = getMoves(board, turn);
    if (moves.length == 0) {
        var nextPlayerMoves = getMoves(board, turn % 2 + 1);
        if (nextPlayerMoves.length == 0) {
            // if (turn == AI) {
            //     return {value: evaluateBoard(board,
            //         moves.length, nextPlayerMoves.length)};
            // }
            // if (turn == HUMAN) {
            //     return {value: evaluateBoard(board,
            //         nextPlayerMoves.length, moves.length)};
            // }
            var aiPieceCount = 0;
            var humanPieceCount = 0;
            for (let row of board) {
                for (let cell of board) {
                    if (cell == AI) {
                        aiPieceCount ++
                    } else if (cell == HUMAN) humanPieceCount ++
                }
            }
            return (aiPieceCount - humanPieceCount) * 100
        }
    }
    var flipped;
    var value;
    if (turn == AI) {
        var result = {move: moves[0], value: -Infinity};
        for (let move of moves) {
            flipped = implementMove(move[0], move[1], turn, board);
            value = minimax(board, alpha, beta, depth - 1, turn % 2 + 1).value;
            if (result.value < value) {
                result.value = value;
                result.move = move;
                alpha = Math.max(alpha, value);
            }
            for (let pieceFlipped of flipped) {
                board[pieceFlipped[0]][pieceFlipped[1]] = turn % 2 + 1;
            }
            board[move[0]][move[1]] = EMPTY;
            if (alpha >= beta) break;
        }
        return result;
    }

    var result = {move: moves[0], value: Infinity};
    for (let move of moves) {
        flipped = implementMove(move[0], move[1], turn, board);
        value = minimax(board, alpha, beta, depth - 1, turn % 2 + 1).value;
        if (result.value > value) {
            result.value = value;
            result.move = move;
            beta = Math.min(beta, value);
        }
        for (let pieceFlipped of flipped) {
            board[pieceFlipped[0]][pieceFlipped[1]] = turn % 2 + 1;
        }
        board[move[0]][move[1]] = EMPTY;
        if (alpha >= beta) break;
    }
    return result;

}
