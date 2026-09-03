// ============================================================
// SPRING POTENTIAL-ENERGY LAB
// Paste this entire file into sketch.js in the p5.js Web Editor
// ============================================================

const W = 700;
const H = 600;
const G = 9.81;

// Parameters
let mass = 2.0;          // kg
let stiffness = 1.0;    // N/cm

// Motion state
let x;
let velocity = 0;
let simulationTime = 0;
let moving = false;
let inertiaOn = false;   // Vibration OFF by default

// Complete time history: it never slides or removes old points
let history = [];

// Interaction state
let activeSlider = "";
let draggingMass = false;
let draggingEnergy = false;

// Colors
let BLUE, RED, GREEN, ORANGE, YELLOW;
let INK, MUTED, GRID, SOFT;

// Layout
const leftX = 10;
const leftW = 215;
const rightX = 235;
const rightW = 455;

const energyY = 10;
const energyH = 365;

const historyY = 385;
const historyH = 205;

const massSlider = {
  x1: 25,
  x2: 205,
  y: 330,
  min: 0.5,
  max: 10
};

const stiffnessSlider = {
  x1: 25,
  x2: 205,
  y: 383,
  min: 0.2,
  max: 5
};

function setup() {
  createCanvas(W, H);
  pixelDensity(2);
  textFont("Arial");

  BLUE = color(25, 80, 210);
  RED = color(215, 60, 45);
  GREEN = color(55, 155, 75);
  ORANGE = color(220, 112, 50);
  YELLOW = color(239, 181, 27);

  INK = color(42);
  MUTED = color(115);
  GRID = color(222);
  SOFT = color(247);

  x = equilibrium();
  resetHistory();
}

function draw() {
  background(255);

  updateMotion();

  drawLeftPanel();
  drawEnergyPanel();
  drawHistoryPanel();
}

// ============================================================
// PHYSICS
// ============================================================

function equilibrium() {
  return mass * G / stiffness;
}

function netForce() {
  return mass * G - stiffness * x;
}

function maximumExtension() {
  return max(60, equilibrium() * 2.15);
}

function updateMotion() {
  if (!moving || draggingMass || draggingEnergy) return;

  const dt = min(deltaTime / 1000, 0.025);
  simulationTime += dt;

  if (inertiaOn) {
    // Second-order motion with light damping.
    // The factor 100 converts acceleration from metres to centimetres.
    const damping = 1.6;
    const acceleration =
      (100 * netForce() - damping * velocity) / mass;

    velocity += acceleration * dt;
    x += velocity * dt;
  } else {
    // Quasi-static, first-order approach.
    // It approaches equilibrium without overshooting.
    const responseRate = 1.7;
    x +=
      (equilibrium() - x) *
      (1 - exp(-responseRate * dt));

    velocity = 0;

    if (abs(x - equilibrium()) < 0.002) {
      x = equilibrium();
      moving = false;
    }
  }

  x = constrain(x, 0, maximumExtension());
  recordHistory();
}

function resetHistory() {
  simulationTime = 0;
  history = [];

  history.push({
    t: 0,
    x: x,
    equilibrium: equilibrium()
  });
}

function recordHistory() {
  history.push({
    t: simulationTime,
    x: x,
    equilibrium: equilibrium()
  });
}

// ============================================================
// LEFT PANEL
// ============================================================

function drawLeftPanel() {
  // Spring area
  panel(leftX, 10, leftW, 285, false);

  fill(45);
  noStroke();
  textSize(11);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Spring system", 20, 25);

  textStyle(NORMAL);
  textSize(9);
  fill(BLUE);
  textAlign(RIGHT, CENTER);
  text(
    inertiaOn ? "vibration on" : "vibration off",
    leftX + leftW - 10,
    25
  );

  drawSpring();

  // Controls
  panel(leftX, 305, leftW, 285, true);

  drawSlider(
    massSlider,
    mass,
    "Mass  m",
    mass.toFixed(2) + " kg"
  );

  drawSlider(
    stiffnessSlider,
    stiffness,
    "Stiffness  k",
    stiffness.toFixed(2) + " N/cm"
  );

  drawEquationBox();
  drawEquilibriumResult();
  drawNetForce();
  drawButtonsAndToggle();
}

function drawSpring() {
  const centerX = leftX + leftW / 2;
  const supportY = 48;
  const unloadedY = 105;

  const massY = map(
    x,
    0,
    maximumExtension(),
    unloadedY,
    260
  );

  const equilibriumY = map(
    equilibrium(),
    0,
    maximumExtension(),
    unloadedY,
    260
  );

  // Support
  stroke(INK);
  strokeWeight(3);
  line(centerX - 48, supportY, centerX + 48, supportY);

  // Upper straight portion
  stroke(ORANGE);
  strokeWeight(3);
  line(centerX, supportY, centerX, unloadedY - 28);

  // Coils
  noFill();
  beginShape();

  const coilCount = 7;
  const samples = 140;

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;

    const px =
      centerX +
      sin(u * coilCount * TWO_PI) * 29;

    const py =
      unloadedY - 28 +
      u * (massY - unloadedY + 20);

    vertex(px, py);
  }

  endShape();

  line(centerX, massY - 8, centerX, massY);

  // Equilibrium guide
  drawingContext.setLineDash([3, 3]);
  stroke(BLUE);
  strokeWeight(0.8);
  line(leftX + 8, equilibriumY, leftX + leftW - 8, equilibriumY);
  drawingContext.setLineDash([]);

  noStroke();
  fill(BLUE);
  textSize(9);
  textAlign(LEFT, BOTTOM);
  text(
    "x₀ = " + equilibrium().toFixed(1) + " cm",
    leftX + 10,
    equilibriumY - 3
  );

  // Mass
  fill(YELLOW);
  stroke(INK);
  strokeWeight(1.2);
  rectMode(CENTER);
  rect(centerX, massY + 14, 74, 28, 5);

  noStroke();
  fill(INK);
  textSize(10);
  textAlign(CENTER, CENTER);
  text(mass.toFixed(1) + " kg", centerX, massY + 14);

  rectMode(CORNER);
}

function drawSlider(slider, value, label, valueLabel) {
  fill(INK);
  noStroke();
  textSize(10);
  textAlign(LEFT, CENTER);
  text(label, slider.x1, slider.y - 18);

  fill(BLUE);
  textAlign(RIGHT, CENTER);
  text(valueLabel, slider.x2, slider.y - 18);

  stroke(145);
  strokeWeight(1);
  line(slider.x1, slider.y, slider.x2, slider.y);

  const knobX = map(
    value,
    slider.min,
    slider.max,
    slider.x1,
    slider.x2
  );

  drawGlowingKnob(knobX, slider.y);

  fill(MUTED);
  noStroke();
  textSize(8);
  textAlign(LEFT, TOP);
  text(slider.min, slider.x1, slider.y + 7);

  textAlign(RIGHT, TOP);
  text(slider.max, slider.x2, slider.y + 7);
}

function drawGlowingKnob(px, py) {
  const pulse =
    0.5 +
    0.5 * sin(frameCount * 0.07);

  noFill();

  stroke(
    red(BLUE),
    green(BLUE),
    blue(BLUE),
    65 - 35 * pulse
  );

  strokeWeight(1.2);
  circle(px, py, 18 + 9 * pulse);

  fill(255);
  stroke(BLUE);
  strokeWeight(1.5);
  circle(px, py, 12);

  noStroke();
  fill(BLUE);
  circle(px, py, 4);
}

function drawEquationBox() {
  noStroke();
  fill(255);
  rect(20, 410, 195, 47, 4);

  fill(INK);
  textFont("Georgia");
  textSize(12);
  textAlign(LEFT, CENTER);
  text("Π(x) = ½kx² − mgx", 30, 426);
  text("dΠ/dx = kx − mg", 30, 445);
  textFont("Arial");
}

function drawEquilibriumResult() {
  stroke(BLUE);
  strokeWeight(3);
  line(22, 468, 22, 507);

  noStroke();
  fill(INK);
  textSize(9);
  textAlign(LEFT, TOP);
  text("Equilibrium extension", 31, 469);

  textSize(16);
  textStyle(NORMAL);
  text(
    "x₀ = " + equilibrium().toFixed(2) + " cm",
    31,
    485
  );
}

function drawNetForce() {
  const f = netForce();

  fill(INK);
  noStroke();
  textSize(9);
  textAlign(LEFT, CENTER);
  text("Net force", 22, 523);

  fill(BLUE);
  textAlign(RIGHT, CENTER);
  text(f.toFixed(2) + " N", 214, 523);

  const center = 118;
  const width = 190;

  stroke(220);
  strokeWeight(5);
  line(23, 536, 213, 536);

  stroke(INK);
  strokeWeight(1);
  line(center, 531, center, 541);

  const forceLength =
    constrain(f / 45, -1, 1) *
    width / 2;

  stroke(BLUE);
  strokeWeight(5);
  line(center, 536, center + forceLength, 536);
}

function drawButtonsAndToggle() {
  drawButton(22, 553, 53, 24, moving ? "Pause" : "Release");
  drawButton(81, 553, 45, 24, "Reset");

  fill(INK);
  noStroke();
  textSize(9);
  textAlign(LEFT, CENTER);
  text("Inertia", 136, 565);

  drawToggle(176, 557, inertiaOn);
}

function drawButton(px, py, pw, ph, label) {
  fill(255);
  stroke(145);
  strokeWeight(0.8);
  rect(px, py, pw, ph, 4);

  fill(INK);
  noStroke();
  textSize(9);
  textAlign(CENTER, CENTER);
  text(label, px + pw / 2, py + ph / 2);
}

function drawToggle(px, py, active) {
  fill(active ? color(55, 120, 215) : color(224));
  stroke(145);
  strokeWeight(0.7);
  rect(px, py, 30, 16, 10);

  const knobX = active ? px + 22 : px + 8;

  fill(255);
  stroke(125);
  circle(knobX, py + 8, 13);
}

// ============================================================
// POTENTIAL-ENERGY GRAPH
// ============================================================

function drawEnergyPanel() {
  panel(rightX, energyY, rightW, energyH, false);

  fill(INK);
  noStroke();
  textSize(11);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Potential energy", rightX + 10, energyY + 15);
  textStyle(NORMAL);

  drawLegend();
  drawEnergyGraph();
}

function drawLegend() {
  const y = energyY + 16;

  legendItem(rightX + 285, y, RED, "U");
  legendItem(rightX + 335, y, GREEN, "Ω");
  legendItem(rightX + 385, y, BLUE, "Π");
}

function legendItem(px, py, col, label) {
  stroke(col);
  strokeWeight(2);
  line(px, py, px + 14, py);

  fill(INK);
  noStroke();
  textSize(9);
  textAlign(LEFT, CENTER);
  text(label, px + 18, py);
}

function energyValues(extension) {
  return {
    spring: 0.5 * stiffness * sq(extension),
    gravity: -mass * G * extension,
    total:
      0.5 * stiffness * sq(extension) -
      mass * G * extension
  };
}

function getEnergyBounds() {
  const xMax = maximumExtension();
  const minimum = energyValues(equilibrium()).total;

  const upper = max(
    energyValues(xMax).spring,
    abs(energyValues(xMax).gravity)
  );

  return {
    xMax,
    yMin: minimum * 1.3 - 10,
    yMax: upper * 1.07 + 10
  };
}

function drawEnergyGraph() {
  const plot = {
    left: rightX + 53,
    right: rightX + rightW - 12,
    top: energyY + 37,
    bottom: energyY + energyH - 36
  };

  const bounds = getEnergyBounds();

  const X = value =>
    map(
      value,
      0,
      bounds.xMax,
      plot.left,
      plot.right
    );

  const Y = value =>
    map(
      value,
      bounds.yMin,
      bounds.yMax,
      plot.bottom,
      plot.top
    );

  // Grid and labels
  textSize(8);
  strokeWeight(0.7);

  for (let i = 0; i <= 5; i++) {
    const extension = bounds.xMax * i / 5;
    const px = X(extension);

    stroke(GRID);
    line(px, plot.top, px, plot.bottom);

    noStroke();
    fill(MUTED);
    textAlign(CENTER, TOP);
    text(extension.toFixed(0), px, plot.bottom + 5);

    const energy =
      bounds.yMin +
      (bounds.yMax - bounds.yMin) * i / 5;

    const py = Y(energy);

    stroke(GRID);
    line(plot.left, py, plot.right, py);

    noStroke();
    fill(MUTED);
    textAlign(RIGHT, CENTER);
    text(energy.toFixed(0), plot.left - 5, py);
  }

  // Axes
  stroke(INK);
  strokeWeight(1);
  line(plot.left, plot.top, plot.left, plot.bottom);
  line(plot.left, plot.bottom, plot.right, plot.bottom);

  fill(MUTED);
  noStroke();
  textSize(9);
  textAlign(CENTER, CENTER);
  text(
    "extension x [cm]",
    (plot.left + plot.right) / 2,
    energyY + energyH - 10
  );

  push();
  translate(rightX + 12, (plot.top + plot.bottom) / 2);
  rotate(-HALF_PI);
  text("energy [N·cm]", 0, 0);
  pop();

  // Energy curves
  drawEnergyCurve(
    plot,
    bounds,
    X,
    Y,
    "spring",
    RED,
    1.3
  );

  drawEnergyCurve(
    plot,
    bounds,
    X,
    Y,
    "gravity",
    GREEN,
    1.3
  );

  drawEnergyCurve(
    plot,
    bounds,
    X,
    Y,
    "total",
    BLUE,
    2.2
  );

  // Equilibrium line
  const equilibriumX = X(equilibrium());

  drawingContext.setLineDash([3, 3]);
  stroke(BLUE);
  strokeWeight(0.9);
  line(
    equilibriumX,
    plot.top,
    equilibriumX,
    plot.bottom
  );
  drawingContext.setLineDash([]);

  noStroke();
  fill(BLUE);
  textSize(9);
  textAlign(CENTER, BOTTOM);
  text(
    "x₀ = " + equilibrium().toFixed(2),
    equilibriumX,
    plot.top + 14
  );

  // Current point
  const currentEnergy = energyValues(x).total;

  fill(255);
  stroke(BLUE);
  strokeWeight(2);
  circle(X(x), Y(currentEnergy), 9);
}

function drawEnergyCurve(
  plot,
  bounds,
  X,
  Y,
  property,
  col,
  weight
) {
  noFill();
  stroke(col);
  strokeWeight(weight);

  beginShape();

  for (let i = 0; i <= 180; i++) {
    const extension =
      bounds.xMax * i / 180;

    const energy =
      energyValues(extension)[property];

    vertex(X(extension), Y(energy));
  }

  endShape();
}

// ============================================================
// COMPLETE TIME-HISTORY GRAPH
// ============================================================

function drawHistoryPanel() {
  panel(
    rightX,
    historyY,
    rightW,
    historyH,
    false
  );

  fill(INK);
  noStroke();
  textSize(11);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text(
    "Displacement history",
    rightX + 10,
    historyY + 15
  );

  textStyle(NORMAL);
  textAlign(RIGHT, CENTER);
  text("x(t)", rightX + rightW - 10, historyY + 15);

  drawHistoryGraph();
}

function drawHistoryGraph() {
  if (history.length === 0) return;

  const plot = {
    left: rightX + 52,
    right: rightX + rightW - 12,
    top: historyY + 33,
    bottom: historyY + historyH - 30
  };

  // The time axis always begins at zero.
  // It expands in four-second blocks and never slides.
  const finalRecordedTime =
    history[history.length - 1].t;

  const timeMaximum = max(
    4,
    ceil(finalRecordedTime / 4) * 4
  );

  let minimumX = Infinity;
  let maximumX = -Infinity;

  for (const point of history) {
    minimumX = min(
      minimumX,
      point.x,
      point.equilibrium
    );

    maximumX = max(
      maximumX,
      point.x,
      point.equilibrium
    );
  }

  const displacementSpan =
    max(4, maximumX - minimumX);

  const yMinimum =
    minimumX - 0.18 * displacementSpan;

  const yMaximum =
    maximumX + 0.18 * displacementSpan;

  const X = value =>
    map(
      value,
      0,
      timeMaximum,
      plot.left,
      plot.right
    );

  const Y = value =>
    map(
      value,
      yMinimum,
      yMaximum,
      plot.bottom,
      plot.top
    );

  // Grid
  stroke(GRID);
  strokeWeight(0.7);

  for (let i = 0; i <= 4; i++) {
    const timeValue = timeMaximum * i / 4;
    const px = X(timeValue);

    line(px, plot.top, px, plot.bottom);

    noStroke();
    fill(MUTED);
    textSize(8);
    textAlign(CENTER, TOP);
    text(
      timeValue.toFixed(1),
      px,
      plot.bottom + 4
    );

    stroke(GRID);
  }

  // Equilibrium reference
  const equilibriumY = Y(equilibrium());

  drawingContext.setLineDash([3, 3]);
  stroke(MUTED);
  line(
    plot.left,
    equilibriumY,
    plot.right,
    equilibriumY
  );
  drawingContext.setLineDash([]);

  // Axes
  stroke(INK);
  strokeWeight(1);
  line(plot.left, plot.top, plot.left, plot.bottom);
  line(plot.left, plot.bottom, plot.right, plot.bottom);

  // Complete displacement history
  noFill();
  stroke(BLUE);
  strokeWeight(2);
  beginShape();

  for (const point of history) {
    vertex(X(point.t), Y(point.x));
  }

  endShape();

  // Labels
  noStroke();
  fill(MUTED);
  textSize(9);
  textAlign(CENTER, CENTER);
  text(
    "time t [s]",
    (plot.left + plot.right) / 2,
    historyY + historyH - 9
  );

  push();
  translate(
    rightX + 12,
    (plot.top + plot.bottom) / 2
  );
  rotate(-HALF_PI);
  text("x [cm]", 0, 0);
  pop();

  fill(BLUE);
  textAlign(LEFT, BOTTOM);
  text("x₀", plot.left + 3, equilibriumY - 3);
}

// ============================================================
// PANELS
// ============================================================

function panel(px, py, pw, ph, softBackground) {
  fill(softBackground ? SOFT : 255);
  stroke(softBackground ? SOFT : GRID);
  strokeWeight(0.8);
  rect(px, py, pw, ph, 5);
}

// ============================================================
// INTERACTION
// ============================================================

function mousePressed() {
  if (
    distanceToSegment(
      mouseX,
      mouseY,
      massSlider.x1,
      massSlider.y,
      massSlider.x2,
      massSlider.y
    ) < 14
  ) {
    activeSlider = "mass";
    updateActiveSlider();
    return;
  }

  if (
    distanceToSegment(
      mouseX,
      mouseY,
      stiffnessSlider.x1,
      stiffnessSlider.y,
      stiffnessSlider.x2,
      stiffnessSlider.y
    ) < 14
  ) {
    activeSlider = "stiffness";
    updateActiveSlider();
    return;
  }

  // Spring/mass interaction
  if (
    mouseX >= leftX &&
    mouseX <= leftX + leftW &&
    mouseY >= 50 &&
    mouseY <= 290
  ) {
    draggingMass = true;
    moving = false;
    velocity = 0;
    resetHistory();
    updateMassFromMouse();
    return;
  }

  // Energy-graph interaction
  if (
    mouseX >= rightX + 53 &&
    mouseX <= rightX + rightW - 12 &&
    mouseY >= energyY + 37 &&
    mouseY <= energyY + energyH - 36
  ) {
    draggingEnergy = true;
    moving = false;
    velocity = 0;
    resetHistory();
    updateEnergyPositionFromMouse();
    return;
  }

  // Release / pause
  if (inside(mouseX, mouseY, 22, 553, 53, 24)) {
    moving = !moving;

    if (moving && history.length < 2) {
      resetHistory();
    }

    return;
  }

  // Reset
  if (inside(mouseX, mouseY, 81, 553, 45, 24)) {
    x = equilibrium();
    velocity = 0;
    moving = false;
    resetHistory();
    return;
  }

  // Inertia toggle
  if (inside(mouseX, mouseY, 132, 550, 80, 30)) {
    inertiaOn = !inertiaOn;
    velocity = 0;
    moving = true;
    resetHistory();
  }
}

function mouseDragged() {
  if (activeSlider !== "") {
    updateActiveSlider();
  }

  if (draggingMass) {
    updateMassFromMouse();
  }

  if (draggingEnergy) {
    updateEnergyPositionFromMouse();
  }
}

function mouseReleased() {
  activeSlider = "";
  draggingMass = false;
  draggingEnergy = false;
}

function touchStarted() {
  mousePressed();
  return false;
}

function touchMoved() {
  mouseDragged();
  return false;
}

function touchEnded() {
  mouseReleased();
  return false;
}

function updateActiveSlider() {
  if (activeSlider === "mass") {
    mass = map(
      constrain(
        mouseX,
        massSlider.x1,
        massSlider.x2
      ),
      massSlider.x1,
      massSlider.x2,
      massSlider.min,
      massSlider.max
    );

    mass = round(mass * 10) / 10;
  }

  if (activeSlider === "stiffness") {
    stiffness = map(
      constrain(
        mouseX,
        stiffnessSlider.x1,
        stiffnessSlider.x2
      ),
      stiffnessSlider.x1,
      stiffnessSlider.x2,
      stiffnessSlider.min,
      stiffnessSlider.max
    );

    stiffness = round(stiffness * 20) / 20;
  }

  velocity = 0;
  moving = true;
  resetHistory();
}

function updateMassFromMouse() {
  const unloadedY = 105;

  x = map(
    mouseY,
    unloadedY,
    260,
    0,
    maximumExtension()
  );

  x = constrain(x, 0, maximumExtension());

  velocity = 0;
  resetHistory();
}

function updateEnergyPositionFromMouse() {
  const plotLeft = rightX + 53;
  const plotRight = rightX + rightW - 12;

  x = map(
    mouseX,
    plotLeft,
    plotRight,
    0,
    maximumExtension()
  );

  x = constrain(x, 0, maximumExtension());

  velocity = 0;
  resetHistory();
}

function inside(mx, my, px, py, pw, ph) {
  return (
    mx >= px &&
    mx <= px + pw &&
    my >= py &&
    my <= py + ph
  );
}

function distanceToSegment(
  px,
  py,
  x1,
  y1,
  x2,
  y2
) {
  const segmentLengthSquared =
    sq(x2 - x1) + sq(y2 - y1);

  if (segmentLengthSquared === 0) {
    return dist(px, py, x1, y1);
  }

  let u =
    ((px - x1) * (x2 - x1) +
      (py - y1) * (y2 - y1)) /
    segmentLengthSquared;

  u = constrain(u, 0, 1);

  const nearestX = x1 + u * (x2 - x1);
  const nearestY = y1 + u * (y2 - y1);

  return dist(px, py, nearestX, nearestY);
}