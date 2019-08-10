// javascript tic tac toe

var origBoard = [];
const human = 'O'; const ai = 'X';
const turnNames = [ai, human]
const endStates = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]
const playerNames = ['O', 'X'];
var multiplayer = true;
var playerTurn = 0;
var gameModes = ['Computer', 'Multiplayer']
var multiplayerScores = {'O': 0, 'X': 0}
var computerScores = {}
computerScores[ai] = 0
computerScores[human] = 0
console.log(computerScores)

const cells = document.querySelectorAll('.cell');

declareScores(multiplayerScores)
startGame();

function changeGameMode() {
    gameModes = ['Computer', 'Multiplayer']
    multiplayerScores = {'O': 0, 'X': 0}
    declareScores(multiplayerScores)
    multiplayer = !multiplayer;
    gamemodebtn = document.getElementById("gamemodebtn");
    gamemodebtn.innerText = gameModes[Number(multiplayer)];
    startGame();
}

// start game and restart game
function startGame() {
    document.querySelector(".end").style.display = "none";
    origBoard = Array.from(Array(9).keys());
    for (let index = 0; index < cells.length; index++){
        cells[index].innerText = '';
        cells[index].style.removeProperty('background-color');
        cells[index].addEventListener('click', analyseMove, false);
    }

}

// cause humans move and make ai move
function analyseMove(cell) {
    if (typeof origBoard[cell.target.id] == 'number') {
        if (!multiplayer) {
            gameState = makeMove(cell.target.id, human);
            if (! gameState && ! tie(origBoard)) {
                aiMoveCellId = minimax(origBoard, -Infinity, Infinity, ai).id;
                makeMove(aiMoveCellId, ai);
            }
        } else {
            gameState = makeMove(cell.target.id, playerNames[playerTurn]);
            playerTurn = (playerTurn + 1) % 2
            tie(origBoard)
        }
    }
}

// make the human move (also check for a game end)
function makeMove(cellId, player) {
    origBoard[cellId] = player;
    document.getElementById(cellId).innerText = player;
    stateInd = checkEnd(origBoard, player);
    if (stateInd != null) {
        gameEnd(stateInd, player);
        return true;
    }
    return false;
}

// check if a player has won
function checkEnd(board, player) {
    for (var stateInd = 0; stateInd < endStates.length; stateInd ++) {
        state = endStates[stateInd];
        end = true;

        for (let idInd = 0; idInd < state.length; idInd ++) {
            if (board[state[idInd]] != player) {
                end = false;
                break;
            }
        }
        if (end) {
            return stateInd;
        }
    }
    return null;
}

// color the row (or column or diagonol) that has won and declare winner
function gameEnd(stateInd, player) {
    for (let id of endStates[stateInd]) {
        document.getElementById(id).style.backgroundColor =
        player == human ? "rgba(255, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";
    }
    for (let id = 0; id < cells.length; id++) {
        cells[id].removeEventListener('click', analyseMove, false);
    }
    if (multiplayer) {
        multiplayerScores[player] += 1
        declareScores(multiplayerScores)
    } else {
        computerScores[player] += 1
        declareScores(computerScores)
    }
    declareWinner("The " + player + ' player won !');
}

function declareScores(scores) {
    let string = ''
    for (let playerName of playerNames) {
        string += playerName + ' : ' + scores[playerName] + '\n\n'
    }
    document.querySelector(".score").innerText = string;
}

// show winner (or tie) on 'div' (end of game)
function declareWinner(message) {
    document.querySelector(".end").style.display = "block";
    document.querySelector(".end").innerText = message;
}

// check if the board state is a tie
function tie(origBoard) {
    flag = true
    for (let cell of origBoard) {
        if (typeof cell == 'number') flag = false;
    }
    if (flag) {
        declareWinner("Tie game !");
        for (let id = 0; id < cells.length; id++) {
            cells[id].removeEventListener('click', analyseMove, false);
            document.getElementById(id).style.backgroundColor = 'rgba(0, 255, 0, 0.5)'
        }
        return true;
    }
    return false;
}

// evaluate a board and calculate score
function getBoardCondition(board) {
    for (let state of endStates) {
        var humanCount = 0;
        var aiCount = 0;
        for (let cellId of state) {
            if (board[cellId] == ai) {
                aiCount += 1;
            } else if (board[cellId] == human) {
                humanCount += 1;
            }
        }
        if (humanCount == 3) return -10;
        if (aiCount == 3) return 10;
    }
    return 0;
}

// get empty spots
function getMoves(board) {
    var spots = []
    for (let id = 0; id < board.length; id++) {
        if (typeof board[id] == 'number') {
            spots.push(id)
        }
    }
    return spots
}

// minimax algorithm recursion
function minimax(newBoard, alpha, beta, turn) {
    // check if someone won
    let boardCondition = getBoardCondition(newBoard);
    if (boardCondition != 0) {
        return {value: boardCondition};
    }
    var moves = getMoves(newBoard);
    if (moves.length == 0) {
        return {value: 0};
    }
    if (turn == ai) {
        // if is maximiser player (ai) find move with biggest value
        var result = {value: -Infinity, id: 0}
        for (let move of moves) {
            newBoard[move] = turn
            let move_result = minimax(newBoard, alpha, beta, human).value;
            if (move_result > result.value) {
                result.value = move_result;
                result.id = move;
                alpha = Math.max(alpha, move_result);
            }
            newBoard[move] = move;
            if (alpha >= beta) break;
        }
        return result;
    }
    // if is minimiser player (human) find move with smallest value
    var result = {value: Infinity, id: 0}
    for (let move of moves) {
        newBoard[move] = turn
        let move_result = minimax(newBoard, alpha, beta, ai).value;
        if (move_result < result.value) {
            result.value = move_result;
            result.id = move;
            beta = Math.min(beta, move_result);
        }
        newBoard[move] = 0;
        if (alpha >= beta) break;
    }
    return result;
}
