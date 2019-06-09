let minWindowSize = 800;
let windowPadding = 20;

var strategyDict;
var state = 0; // 0: picking player, 1 playing game
var humanMovesFirst = true;


function preload() {
  strategyDict = loadJSON('strategy.json');
}


function setup() {
  var windowSize = min(windowWidth - windowPadding, minWindowSize);
  
  let canvas = createCanvas(windowSize, windowSize);

  // Attach the canvas to div
  canvas.parent('sketch-div');
}


function draw() {
  background(240);

  switch (state) {
    case 0:
      text("state 0", 100, 100);
      break;

    case 1:
      text("state 1!", 100, 100);
  }

  if (millis() > 10000) {
    state = 1;
  }

  // draw board
  fill(0);

  line(width/2, 0, width/2, height);

  text(strategyDict["0.0"], 10, 10);

}


function windowResized() {
  var windowSize = min(windowWidth - windowPadding, minWindowSize);
  
  resizeCanvas(windowSize, windowSize);
}