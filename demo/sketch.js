function setup() {
 let canvas = createCanvas(600, 600);
canvas.parent('test');
    background(220);
}

function draw() {



  ellipse(mouseX, mouseY, 20);
}