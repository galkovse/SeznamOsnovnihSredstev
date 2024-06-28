// clock.js
let clockDiameter;

function setup() {
    let canvas = createCanvas(200, 200);
    canvas.parent('analogClock');
    clockDiameter = min(width, height) * 0.9;
}

function draw() {
    background(255);
    let s = map(second(), 0, 60, 0, TWO_PI) - HALF_PI;
    let m = map(minute(), 0, 60, 0, TWO_PI) - HALF_PI;
    let h = map(hour() % 12, 0, 12, 0, TWO_PI) - HALF_PI;

    // Draw the clock background
    fill(255);
    stroke(0);
    strokeWeight(8);
    ellipse(width / 2, height / 2, clockDiameter, clockDiameter);

    // Draw the clock numbers
    textSize(16);
    textAlign(CENTER, CENTER);
    noStroke();
    fill(0);
    for (let i = 1; i <= 12; i++) {
        let angle = map(i, 0, 12, 0, TWO_PI) - HALF_PI;
        let x = width / 2 + cos(angle) * clockDiameter / 2.5;
        let y = height / 2 + sin(angle) * clockDiameter / 2.5;
        text(i, x, y);
    }

    // Draw the clock hands
    drawHand(s, clockDiameter / 2 * 0.9, color(255, 0, 0)); // second hand in red
    drawHand(m, clockDiameter / 2 * 0.8, color(0, 0, 0)); // minute hand in black
    drawHand(h, clockDiameter / 2 * 0.5, color(0, 0, 0)); // hour hand in black

    // Draw the logo in the center
    imageMode(CENTER);
    let logo = loadImage('tab_logo.png'); // Path to your logo image
    image(logo, width / 2, height / 2, 30, 30);
}

function drawHand(angle, length, col) {
    push();
    translate(width / 2, height / 2);
    rotate(angle);
    stroke(col);
    strokeWeight(4);
    line(0, 0, length, 0);
    pop();
}



$(document).ready(function() {
    function updateTime() {
        const now = new Date();
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        
        $('#currentDate').text(now.toLocaleDateString('sl-SI', optionsDate));
        $('#currentTime').text(now.toLocaleTimeString('sl-SI', optionsTime));
    }

    updateTime();
    setInterval(updateTime, 1000);
});

