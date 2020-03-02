let canvas;
let minWindowSize = 800;
let windowPadding = 20;
let messageHeight = 40;
var windowSize;

var strategyDict;
var state = 1; // 0: picking player, 1 playing game

// vars set at menu
var humanMovesFirst = false;

// vars set at game start
var turn = 1; // whose turn is it (1: p1, 2: p2)
var winner = -1;
var message = "";

var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var humanBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var cpuBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];

class Button {
  constructor(x, y, width, height, text, func) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.func = func;

    this.wasPressedLastFrame = false;
  }


  display() {
    // let isMouseInsideX = mouseX >= this.x && mouseX <= this.x + width;
    // let isMouseInsideY = mouseY >= this.y && mouseY <= this.y + width;
    // let isMouseInside = isMouseInsideX && isMouseInsideY;

    // fill(isMouseInside ? 200 : 180);
    fill(0);
    rect(this.x, this.y, this.w, this.h);
    fill(0);
    text(this.text, this.x, this.y);
  }
}


function startGame() {
  state = 1;

  turn = 1;
  winner = -1;

  board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  humanBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  cpuBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  var num = (humanMovesFirst ? "first" : "second");
  message = "You're moving " + num + ", click to move";

  if (!humanMovesFirst) {
    cpuMove();
  }
}


function preload() {
  strategyDict = loadJSON('strategy.json');
}


function setup() {
  windowSize = min(windowWidth - windowPadding, minWindowSize);
  
  canvas = createCanvas(windowSize, windowSize + messageHeight);

  // Attach the canvas to div
  canvas.parent('sketch-div');

  // TODO set up the menu, don't start the game
  startGame();
}


function mouseReleased() {
  // is the game playing right now?
  if (state != 1)
    return;

  // if the game is over, any click can reset it (for now)
  if (winner != -1) {
    startGame();

    // don't let this click do anything else
    return;
  }

  // is the click in the board?
  if (mouseY < messageHeight || mouseY > height || mouseX < 0 || mouseX > width)
    return;

  // is it the player's turn?
  if (winner == -1 && (humanMovesFirst && turn == 1) || (!humanMovesFirst && turn == 2)) {
    // get the cell that the player clicked on
    var i = int((mouseX / windowSize) * 3);
    var j = int(((mouseY - messageHeight) / windowSize) * 3);
    var index = i + 3*j;

    // make the move
    var pid = turn;

    message = "";
    var moved = make_move(index);

    // update local board
    if (moved) {
      humanBoard[index] = pid;
    } else {
      message = "Can't move there, move again";
      humanBoard[index] = 3 - pid;
    }

    // if the player's turn ended, tell the AI to move
    if (moved && winner == -1) {
      cpuMove();
    }
  }
}


function draw() {
  background(240);

  switch (state) {
    case 0:
      // menu - currently unused

      rect(80, 80, 40, 30);
      
      break;

    case 1:
      // in game

      // draw the board
      stroke(80);
      strokeWeight(4);

      for (var i = 1; i < 3; i++) {
        line(windowSize * i / 3, messageHeight + 10, windowSize * i / 3, height - 10);
        line(10, messageHeight + windowSize * i / 3, windowSize - 10, messageHeight + windowSize * i / 3);
      }

      var displayBoard = winner == -1 ? humanBoard : board;

      for (var i = 0; i < 9; i++) {
        if (displayBoard[i] == 1) {
          drawX(i);
        }
        if (displayBoard[i] == 2) {
          drawO(i);
        }
      }

      break;
  }

  strokeWeight(1);
  stroke(color(0, 0, 0));
  text(message, 10, 10);
}


function windowResized() {
  windowSize = min(windowWidth - windowPadding, minWindowSize);
  
  resizeCanvas(windowSize, windowSize + messageHeight);
}


function cpuMove() {
  var moved = false;
  while (!moved) {
    // just pick random moves for now
    move = Math.floor(Math.random() * 9);

    var pid = turn;

    moved = make_move(move);

    // update private board
    if (moved) {
      cpuBoard[move] = pid;
    } else {
      if (cpuBoard[move] != 0)
        cpuBoard[move] = 3 - pid;
    }
  }
}


function make_move(move) {
  if (board[move] == 0) {
    // this move is valid
    board[move] = turn;

    // check if the game is over
    winner = checkWin(board);

    if (winner != -1) {
      var result = "";
      if (winner == 0) {
        result = "tied";
      } else if (
          (winner == 1 && humanMovesFirst) || (winner == 2 && !humanMovesFirst)
        ) {
        result = "won";
      } else {
        result = "lost";
      }

      message = "You " + result + "! Click to play again";
    } else {
      // swap turn
      turn = 3 - turn;
    }

    return true;
  } else {
    // this move was invalid
    return false;
  }
}


function drawX(cellId) {
  let i = cellId % 3, j = int(cellId / 3);

  let centerX = i * windowSize / 3 + windowSize / 6, centerY = messageHeight + j * windowSize / 3 + windowSize / 6;
  let radius = windowSize / 6 - 20;

  strokeWeight(8);
  stroke(color(0, 0, 220));
  
  line(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
  line(centerX - radius, centerY + radius, centerX + radius, centerY - radius);
}


function drawO(cellId) {
  let i = cellId % 3, j = int(cellId / 3);

  let centerX = i * windowSize / 3 + windowSize / 6, centerY = messageHeight + j * windowSize / 3 + windowSize / 6;
  let radius = windowSize / 6 - 20;

  strokeWeight(8);
  noFill();
  stroke(color(220, 0, 0));
  
  ellipse(centerX, centerY, radius * 2);
}


function checkWin(boardArray) {
  for (var p = 1; p <= 2; p++) {
    // check straight lines
    for (var i = 0; i < 3; i++) {
      var win_vert = true, win_hori = true
      for (var j = 0; j < 3; j++) {
        if (boardArray[i + j*3] != p)
          win_vert = false;
        if (boardArray[i*3 + j] != p)
          win_hori = false;
      }
      if (win_hori || win_vert)
        return p;
    }

    // check for diagonals
    var diag_m = true, diag_o = true;
    for (var i = 0; i < 3; i++) {
      if (boardArray[i + i*3] != p)
        diag_m = false;
      if (boardArray[i + (2 - i)*3] != p)
        diag_o = false;
    }
    if (diag_m || diag_o)
      return p;
  }

  // if we checked every configuration, and the board is full, it is a tie
  for (var i = 0; i < 9; i++) {
    if (boardArray[i] == 0)
      return -1; // the board is not full, so no one has won yet
  }
  return 0; // tie
}


function boardHash(boardArray) {
  var total = 0;
  for (var i = 0; i < 9; i++)
    total += Math.pow(3, i) * boardArray[i];
  return total;
}
