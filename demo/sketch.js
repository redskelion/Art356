function setup() {
let canvas = createCanvas(600, 600);
  canvas.parent('id');
  
    background(220);
}

function draw() {
  ellipse(mouseX, mouseY, 20);
}