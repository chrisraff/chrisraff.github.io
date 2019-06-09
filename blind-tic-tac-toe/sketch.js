let canvas;
let minWindowSize = 800;
let windowPadding = 20;
let messageHeight = 40;
var windowSize;

var strategyDict;
var state = 1; // 0: picking player, 1 playing game
var humanMovesFirst = true;
var turn = 1; // whose turn is it (p1, p2)

var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];


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
  board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
}


function preload() {
  strategyDict = loadJSON('strategy.json');
}


function setup() {
  windowSize = min(windowWidth - windowPadding, minWindowSize);
  
  canvas = createCanvas(windowSize, windowSize + messageHeight);

  // Attach the canvas to div
  canvas.parent('sketch-div');
}


function mouseReleased() {
  // is the game playing right now?
  if (state != 1)
    return;

  // is the click in the board?
  if (mouseY < messageHeight)
    return;

  // is it the player's turn?
  if ((humanMovesFirst && turn == 1) || (!humanMovesFirst && turn == 2)) {
    // get the cell that the player clicked on
    var i = int((mouseX / windowSize) * 3);
    var j = int(((mouseY - messageHeight) / windowSize) * 3);
    var index = i + 3*j;
    
    // check if the cell is occupied

    // make the move
    board[index] = turn;
    
    // set next turn
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
      fill(80);
      strokeWeight(4);

      for (var i = 1; i < 3; i++) {
        line(windowSize * i / 3, messageHeight + 10, windowSize * i / 3, height - 10);
        line(10, messageHeight + windowSize * i / 3, windowSize - 10, messageHeight + windowSize * i / 3);
      }

      for (var i = 0; i < 9; i++) {
        if (board[i] != 0) {
          let x = i % 3, y = int(i/3);
          text("here", x * windowSize / 3, messageHeight + y * windowSize / 3);
        }
      }

      break;
  }

  // text(strategyDict["0.0"], 10, 10);
  // text(canvas.x, 10, 30);
  // text(canvas.y, 10, 50);

}


function windowResized() {
  windowSize = min(windowWidth - windowPadding, minWindowSize);
  
  resizeCanvas(windowSize, windowSize + messageSize);
}