let PokemonCards = [];
let OtherCards = [];

let YourPokemon;
let OpponentPokemon;

let hand1;
let hand2;
let hand3;
let hand4;

let CoinResult = "FLIP";
let CoinFlipped = false;
let CardsDealt = false;

async function setup() {
  let canvas = createCanvas(700, 700);
  background(225);
  canvas.parent("id");

  //Pokemon Cards
  PokemonCards[0] = await loadImage("froakie.png");
  PokemonCards[1] = await loadImage("dreepy.png");

  //Trainer and Energy Cards
  OtherCards[0] = await loadImage("lillies.png");
  OtherCards[1] = await loadImage("buddy.png");
  OtherCards[2] = await loadImage("ultra.png");
  OtherCards[3] = await loadImage("boss.png");
  OtherCards[4] = await loadImage("water.png");
  OtherCards[5] = await loadImage("psychic.jpg");
}
function draw() {
  background(45, 120, 95);

  fill(255);
  textSize(28);
  textAlign(CENTER);

  //Opponents Active
  fill(90, 65, 110);
  stroke(255);
  strokeWeight(2);
  rect(290, 60, 120, 165, 10);

  noStroke();
  fill(255);
  textSize(16);
  text("Opponent Active", 350, 245);

  //Your Active
  fill(50, 85, 160);
  stroke(255);
  strokeWeight(2);
  rect(290, 300, 120, 165, 10);

  noStroke();
  fill(255);
  text("Your Active", 350, 485);

  //Board
  if (CardsDealt == true) {
    image(OpponentPokemon, 290, 60, 120, 165);
    image(YourPokemon, 290, 300, 120, 165);

    image(hand1, 145, 550, 85, 120);
    image(hand2, 245, 550, 85, 120);
    image(hand3, 345, 550, 85, 120);
    image(hand4, 445, 550, 85, 120);
  }

  //Coin
  noStroke();
  fill(0, 0, 0, 60);
  ellipse(107, 177, 120);
  if (dist(mouseX, mouseY, 100, 170) < 60) {
    fill(255, 225, 80);
  } else {
    fill(245, 190, 35);
  }
  stroke(255, 230, 100);
  strokeWeight(5);
  ellipse(100, 170, 120 + sin(frameCount * 0.08) * 5);
  noStroke();
  fill(50);
  textSize(15);
  text(CoinResult, 100, 170);

  //Draw Cards button
  if (CoinFlipped == false) {
    fill(130);
  } else if (mouseX > 25 && mouseX < 175 && mouseY > 270 && mouseY < 330) {
    fill(255, 225, 80);
  } else {
    fill(255);
  }

  noStroke();
  rect(25, 270, 150, 60, 10);

  fill(0);
  textSize(18);
  text("Draw Cards", 100, 300);

  //Restart button
  if (mouseX > 25 && mouseX < 175 && mouseY > 350 && mouseY < 410) {
    fill(245, 100, 100);
  } else {
    fill(220, 65, 65);
  }

  rect(25, 350, 150, 60, 10);

  fill(255);
  text("Restart", 100, 380);

  //Random hand 
  fill(255);
  textSize(18);
  text("Your Random Hand", 350, 525);

  //Instructions
  textAlign(LEFT);
  textSize(15);
  text("HOW TO PLAY", 490, 75);
  text("1. Click the coin", 490, 110);
  text("2. See who goes first", 490, 140);
  text("3. Click Deal Cards", 490, 170);
  text("4. View your random hand", 490, 200);
  text("5. Click Restart to try again", 490, 230);
}

function mousePressed() {
  //Flip the coin
  if (dist(mouseX, mouseY, 100, 170) < 60) {
    let RandomNumber = random();

    if (RandomNumber < 0.5) {
      CoinResult = "YOU GO FIRST";
    } else {
      CoinResult = "OPPONENT FIRST";
    }

    CoinFlipped = true;
  }

  //Draw Cards button
  if (mouseX > 25 && mouseX < 175 && mouseY > 270 && mouseY < 330) {
    if (CoinFlipped == true) {
      //Randomly choose your Active Pokémon
      YourPokemon = random(PokemonCards);

      //Give the opponent the other Pokémon
      if (YourPokemon == PokemonCards[0]) {
        OpponentPokemon = PokemonCards[1];
      } else {
        OpponentPokemon = PokemonCards[0];
      }

      //Get four random cards
      hand1 = random(OtherCards);
      hand2 = random(OtherCards);
      hand3 = random(OtherCards);
      hand4 = random(OtherCards);

      CardsDealt = true;
    }
  }

  //Restart button
  if (mouseX > 25 && mouseX < 175 && mouseY > 350 && mouseY < 410) {
    CoinResult = "FLIP";
    CoinFlipped = false;
    CardsDealt = false;
  }
}
