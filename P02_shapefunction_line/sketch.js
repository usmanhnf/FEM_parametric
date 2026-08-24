// ============================================================
// LINE ELEMENT SHAPE FUNCTIONS
// 2-NODE LINEAR / 3-NODE QUADRATIC
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const W = 700;
const H = 230;


// ============================================================
// CURRENT POSITION
// ============================================================

// s = x / Le

let currentS = 0.0;
let sliderDragging = false;


// ============================================================
// ELEMENT TYPE
// ============================================================

// 2 = linear
// 3 = quadratic

let elementOrder = 3;


// ============================================================
// QUADRATIC NODAL DISPLACEMENTS
// ============================================================

const quadU1 = 0.20;
const quadU2 = 0.75;
const quadU3 = 0.45;


// ============================================================
// LINEAR NODAL DISPLACEMENTS
//
// Use the SAME physical end values as the quadratic element.
// ============================================================

const linearU1 = quadU1;
const linearU2 = quadU3;


// ============================================================
// GRAPHICAL DISPLACEMENT SCALE
// ============================================================

const displacementScale = 62;


// ============================================================
// HORIZONTAL SLIDER
// ============================================================

const sliderLeft = 48;
const sliderRight = 228;
const sliderY = 166;


// ============================================================
// ELEMENT TYPE CONTROL
// ============================================================

const controlsY = 203;


// ============================================================
// SETUP
// ============================================================

function setup() {

  createCanvas(W, H);

  pixelDensity(2);

  textFont("Arial");
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  background(255);

  const s = currentS;


  // ==========================================================
  // QUADRATIC
  // ==========================================================

  if (elementOrder === 3) {

    const N1 = quadN1(s);
    const N2 = quadN2(s);
    const N3 = quadN3(s);


    const ux =
      N1 * quadU1 +
      N2 * quadU2 +
      N3 * quadU3;


    // --------------------------------------------------------
    // Element
    // --------------------------------------------------------

    drawQuadraticElement(
      48,
      48,
      180,
      s,
      ux
    );


    // --------------------------------------------------------
    // Shape functions
    // --------------------------------------------------------

    drawShapeFunction(
      250,
      55,
      115,
      100,
      s,
      N1,
      quadN1,
      "N₁",
      "N₁ = 2s² - 3s + 1",
      [0, 0.5, 1]
    );


    drawShapeFunction(
      400,
      55,
      115,
      100,
      s,
      N2,
      quadN2,
      "N₂",
      "N₂ = 4s(1-s)",
      [0, 0.5, 1]
    );


    drawShapeFunction(
      550,
      55,
      115,
      100,
      s,
      N3,
      quadN3,
      "N₃",
      "N₃ = 2s² - s",
      [0, 0.5, 1]
    );
  }


  // ==========================================================
  // LINEAR
  // ==========================================================

  else {

    const N1 = linearN1(s);
    const N2 = linearN2(s);


    const ux =
      N1 * linearU1 +
      N2 * linearU2;


    // --------------------------------------------------------
    // Element
    // --------------------------------------------------------

    drawLinearElement(
      48,
      48,
      180,
      s,
      ux
    );


    // --------------------------------------------------------
    // N1
    // --------------------------------------------------------

    drawShapeFunction(
      250,
      55,
      115,
      100,
      s,
      N1,
      linearN1,
      "N₁",
      "N₁ = 1 - s",
      [0, 1]
    );


    // --------------------------------------------------------
    // N2
    // --------------------------------------------------------

    drawShapeFunction(
      400,
      55,
      115,
      100,
      s,
      N2,
      linearN2,
      "N₂",
      "N₂ = s",
      [0, 1]
    );


    // --------------------------------------------------------
    // Keep third region clean/empty
    // --------------------------------------------------------

    drawLinearExplanation(
      550,
      55,
      115,
      100
    );
  }


  // ==========================================================
  // SAME HORIZONTAL SLIDER
  // ==========================================================

  drawHorizontalSlider(s);


  // ==========================================================
  // ELEMENT TYPE TOGGLE
  // ==========================================================

  drawElementControls();
}


// ============================================================
// LINEAR SHAPE FUNCTIONS
// ============================================================

function linearN1(s) {

  return 1 - s;
}


function linearN2(s) {

  return s;
}


// ============================================================
// QUADRATIC SHAPE FUNCTIONS
// ============================================================

function quadN1(s) {

  return (
    2 * s * s
    -
    3 * s
    +
    1
  );
}


function quadN2(s) {

  return (
    4 *
    s *
    (1 - s)
  );
}


function quadN3(s) {

  return (
    2 * s * s
    -
    s
  );
}


// ============================================================
// DISPLACEMENT FUNCTIONS
// ============================================================

function linearDisplacement(s) {

  return (
    linearN1(s) * linearU1 +
    linearN2(s) * linearU2
  );
}


function quadraticDisplacement(s) {

  return (
    quadN1(s) * quadU1 +
    quadN2(s) * quadU2 +
    quadN3(s) * quadU3
  );
}


// ============================================================
// HORIZONTAL SLIDER
// ============================================================

function drawHorizontalSlider(s) {

  const knobX =
    map(
      s,
      0,
      1,
      sliderLeft,
      sliderRight
    );


  // ----------------------------------------------------------
  // Label
  // ----------------------------------------------------------

  noStroke();

  fill(40);

  textSize(10);

  textAlign(
    LEFT,
    CENTER
  );


  text(
    "Move x along the element:",
    sliderLeft,
    sliderY - 15
  );


  // ----------------------------------------------------------
  // Track
  // ----------------------------------------------------------

  stroke(125);

  strokeWeight(0.9);


  line(
    sliderLeft,
    sliderY,
    sliderRight,
    sliderY
  );


  // ----------------------------------------------------------
  // End ticks
  // ----------------------------------------------------------

  line(
    sliderLeft,
    sliderY - 4,
    sliderLeft,
    sliderY + 4
  );


  line(
    sliderRight,
    sliderY - 4,
    sliderRight,
    sliderY + 4
  );


  // ----------------------------------------------------------
  // Knob
  // ----------------------------------------------------------

  fill(255);

  stroke(
    25,
    80,
    210
  );

  strokeWeight(1.35);


  circle(
    knobX,
    sliderY,
    14
  );


  // ----------------------------------------------------------
  // Center dot
  // ----------------------------------------------------------

  noStroke();

  fill(
    25,
    80,
    210
  );


  circle(
    knobX,
    sliderY,
    5
  );
}


// ============================================================
// SLIDER MAPPING
// ============================================================

function sFromMouseX(x) {

  return constrain(

    map(
      x,
      sliderLeft,
      sliderRight,
      0,
      1
    ),

    0,
    1
  );
}


// ============================================================
// LINEAR ELEMENT
// ============================================================

function drawLinearElement(
  x0,
  y0,
  w,
  s,
  ux
) {

  const baseY = 120;


  const node1X =
    x0;


  const node2X =
    x0 + w;


  // ==========================================================
  // ORIGINAL ELEMENT
  // ==========================================================

  stroke(0);

  strokeWeight(1.5);


  line(
    node1X,
    baseY,
    node2X,
    baseY
  );


  // ----------------------------------------------------------
  // Original nodes
  // ----------------------------------------------------------

  fill(0);

  noStroke();


  circle(
    node1X,
    baseY,
    6
  );


  circle(
    node2X,
    baseY,
    6
  );


  // ==========================================================
  // DISPLACED NODES
  // ==========================================================

  const y1 =
    baseY -
    linearU1 *
    displacementScale;


  const y2 =
    baseY -
    linearU2 *
    displacementScale;


  // ----------------------------------------------------------
  // Vertical displacement indicators
  // ----------------------------------------------------------

  stroke(150);

  strokeWeight(0.8);


  line(
    node1X,
    baseY,
    node1X,
    y1
  );


  line(
    node2X,
    baseY,
    node2X,
    y2
  );


  // ==========================================================
  // LINEAR INTERPOLATION
  // ==========================================================

  stroke(0);

  strokeWeight(2);


  line(
    node1X,
    y1,
    node2X,
    y2
  );


  // ----------------------------------------------------------
  // Displaced nodes
  // ----------------------------------------------------------

  fill(0);

  noStroke();


  circle(
    node1X,
    y1,
    6
  );


  circle(
    node2X,
    y2,
    6
  );


  // ==========================================================
  // CURRENT POINT
  // ==========================================================

  const px =
    x0 +
    s * w;


  const py =
    baseY -
    ux *
    displacementScale;


  stroke(
    40,
    100,
    230
  );

  strokeWeight(0.8);


  drawingContext.setLineDash(
    [4, 4]
  );


  line(
    px,
    baseY,
    px,
    py
  );


  drawingContext.setLineDash([]);


  fill(
    30,
    100,
    230
  );

  noStroke();


  circle(
    px,
    py,
    10
  );


  // ==========================================================
  // NODE NUMBERS
  // ==========================================================

  fill(0);

  textSize(11);

  textAlign(
    CENTER,
    TOP
  );


  text(
    "1",
    node1X,
    baseY + 7
  );


  text(
    "2",
    node2X,
    baseY + 7
  );


  // ==========================================================
  // DISPLACEMENT LABELS
  // ==========================================================

  textAlign(
    LEFT,
    CENTER
  );


  text(
    "u₁",
    node1X - 15,
    y1
  );


  text(
    "u₂",
    node2X + 7,
    y2
  );


  // ==========================================================
  // EQUATION
  // ==========================================================

  fill(
    220,
    60,
    60
  );

  textSize(12);

  textAlign(
    CENTER,
    CENTER
  );


  text(
    "u(x) = N₁u₁ + N₂u₂",
    x0 + w / 2,
    y0 - 4
  );


  // ==========================================================
  // CURRENT VALUE
  // ==========================================================

  drawCurrentDisplacementLabel(
    px,
    py,
    ux,
    s
  );
}


// ============================================================
// QUADRATIC ELEMENT
// ============================================================

function drawQuadraticElement(
  x0,
  y0,
  w,
  s,
  ux
) {

  const baseY = 120;


  const node1X =
    x0;


  const node2X =
    x0 + w / 2;


  const node3X =
    x0 + w;


  // ==========================================================
  // ORIGINAL ELEMENT
  // ==========================================================

  stroke(0);

  strokeWeight(1.5);


  line(
    node1X,
    baseY,
    node3X,
    baseY
  );


  // ----------------------------------------------------------
  // Original nodes
  // ----------------------------------------------------------

  fill(0);

  noStroke();


  circle(
    node1X,
    baseY,
    6
  );


  circle(
    node2X,
    baseY,
    6
  );


  circle(
    node3X,
    baseY,
    6
  );


  // ==========================================================
  // DISPLACED NODE POSITIONS
  // ==========================================================

  const y1 =
    baseY -
    quadU1 *
    displacementScale;


  const y2 =
    baseY -
    quadU2 *
    displacementScale;


  const y3 =
    baseY -
    quadU3 *
    displacementScale;


  // ----------------------------------------------------------
  // Displacement indicators
  // ----------------------------------------------------------

  stroke(150);

  strokeWeight(0.8);


  line(
    node1X,
    baseY,
    node1X,
    y1
  );


  line(
    node2X,
    baseY,
    node2X,
    y2
  );


  line(
    node3X,
    baseY,
    node3X,
    y3
  );


  // ==========================================================
  // QUADRATIC DISPLACEMENT CURVE
  // ==========================================================

  noFill();

  stroke(0);

  strokeWeight(2);


  beginShape();


  for (
    let i = 0;
    i <= 120;
    i++
  ) {

    const si =
      i / 120;


    const px =
      x0 +
      si *
      w;


    const ui =
      quadraticDisplacement(
        si
      );


    const py =
      baseY -
      ui *
      displacementScale;


    vertex(
      px,
      py
    );
  }


  endShape();


  // ==========================================================
  // DISPLACED NODES
  // ==========================================================

  fill(0);

  noStroke();


  circle(
    node1X,
    y1,
    6
  );


  circle(
    node2X,
    y2,
    6
  );


  circle(
    node3X,
    y3,
    6
  );


  // ==========================================================
  // CURRENT POINT
  // ==========================================================

  const px =
    x0 +
    s *
    w;


  const py =
    baseY -
    ux *
    displacementScale;


  stroke(
    40,
    100,
    230
  );

  strokeWeight(0.8);


  drawingContext.setLineDash(
    [4, 4]
  );


  line(
    px,
    baseY,
    px,
    py
  );


  drawingContext.setLineDash([]);


  fill(
    30,
    100,
    230
  );

  noStroke();


  circle(
    px,
    py,
    10
  );


  // ==========================================================
  // NODE NUMBERS
  // ==========================================================

  fill(0);

  textSize(11);

  textAlign(
    CENTER,
    TOP
  );


  text(
    "1",
    node1X,
    baseY + 7
  );


  text(
    "2",
    node2X,
    baseY + 7
  );


  text(
    "3",
    node3X,
    baseY + 7
  );


  // ==========================================================
  // DISPLACEMENT LABELS
  // ==========================================================

  textAlign(
    LEFT,
    CENTER
  );


  text(
    "u₁",
    node1X - 15,
    y1
  );


  text(
    "u₂",
    node2X - 18,
    y2 - 9
  );


  text(
    "u₃",
    node3X + 7,
    y3
  );


  // ==========================================================
  // EQUATION
  // ==========================================================

  fill(
    220,
    60,
    60
  );

  textSize(12);

  textAlign(
    CENTER,
    CENTER
  );


  text(
    "u(x) = N₁u₁ + N₂u₂ + N₃u₃",
    x0 + w / 2,
    y0 - 4
  );


  // ==========================================================
  // CURRENT VALUE
  // ==========================================================

  drawCurrentDisplacementLabel(
    px,
    py,
    ux,
    s
  );
}


// ============================================================
// CURRENT DISPLACEMENT LABEL
// ============================================================

function drawCurrentDisplacementLabel(
  px,
  py,
  ux,
  s
) {

  fill(
    30,
    100,
    230
  );

  textSize(9);


  if (
    s < 0.68
  ) {

    textAlign(
      LEFT,
      CENTER
    );


    text(
      `u(x) = ${ux.toFixed(2)}`,
      px + 6,
      py - 7
    );

  } else {

    textAlign(
      RIGHT,
      CENTER
    );


    text(
      `u(x) = ${ux.toFixed(2)}`,
      px - 6,
      py - 7
    );
  }
}


// ============================================================
// SHAPE FUNCTION GRAPH
// ============================================================

function drawShapeFunction(
  x0,
  y0,
  w,
  h,
  s,
  currentValue,
  shapeFunction,
  label,
  equation,
  nodeLocations
) {

  // Quadratic corner functions go slightly negative.

  const minValue =
    elementOrder === 3
      ? -0.2
      : 0;


  const maxValue =
    1.1;


  // ==========================================================
  // MAPPING
  // ==========================================================

  function graphY(value) {

    return map(
      value,
      minValue,
      maxValue,
      y0 + h,
      y0
    );
  }


  const zeroY =
    graphY(0);


  // ==========================================================
  // AXES
  // ==========================================================

  stroke(150);

  strokeWeight(0.8);


  line(
    x0,
    zeroY,
    x0 + w + 12,
    zeroY
  );


  line(
    x0,
    y0,
    x0,
    y0 + h
  );


  // ==========================================================
  // SHAPE FUNCTION CURVE
  // ==========================================================

  noFill();

  stroke(
    220,
    60,
    60
  );

  strokeWeight(2);


  beginShape();


  for (
    let i = 0;
    i <= 120;
    i++
  ) {

    const si =
      i /
      120;


    const value =
      shapeFunction(
        si
      );


    const px =
      x0 +
      si *
      w;


    const py =
      graphY(
        value
      );


    vertex(
      px,
      py
    );
  }


  endShape();


  // ==========================================================
  // NODAL INTERPOLATION POINTS
  // ==========================================================

  fill(
    220,
    60,
    60
  );

  noStroke();


  for (
    const ns of nodeLocations
  ) {

    const nx =
      x0 +
      ns *
      w;


    const nv =
      shapeFunction(
        ns
      );


    const ny =
      graphY(
        nv
      );


    circle(
      nx,
      ny,
      5
    );
  }


  // ==========================================================
  // CURRENT BLUE POINT
  // ==========================================================

  const px =
    x0 +
    s *
    w;


  const py =
    graphY(
      currentValue
    );


  stroke(
    30,
    100,
    230
  );

  strokeWeight(0.8);


  drawingContext.setLineDash(
    [4, 4]
  );


  line(
    px,
    zeroY,
    px,
    py
  );


  drawingContext.setLineDash([]);


  fill(
    30,
    100,
    230
  );

  noStroke();


  circle(
    px,
    py,
    9
  );


  // ==========================================================
  // AXIS LABELS
  // ==========================================================

  fill(0);

  textSize(10);


  textAlign(
    RIGHT,
    CENTER
  );


  text(
    label,
    x0 - 6,
    y0
  );


  text(
    "1",
    x0 - 5,
    graphY(1)
  );


  text(
    "0",
    x0 - 5,
    zeroY
  );


  // ==========================================================
  // x COORDINATES
  // ==========================================================

  textAlign(
    CENTER,
    TOP
  );


  text(
    "0",
    x0,
    zeroY + 5
  );


  // Quadratic has a middle node.

  if (
    elementOrder === 3
  ) {

    text(
      "Lₑ/2",
      x0 + w / 2,
      zeroY + 5
    );
  }


  text(
    "Lₑ",
    x0 + w,
    zeroY + 5
  );


  textAlign(
    LEFT,
    CENTER
  );


  text(
    "x",
    x0 + w + 13,
    zeroY
  );


  // ==========================================================
  // EQUATION
  // ==========================================================

  fill(
    220,
    60,
    60
  );

  textSize(10);

  textAlign(
    CENTER,
    CENTER
  );


  text(
    equation,
    x0 + w / 2,
    y0 - 18
  );


  // ==========================================================
  // CURRENT VALUE
  // ==========================================================

  fill(
    30,
    100,
    230
  );

  textSize(9);


  if (
    s < 0.65
  ) {

    textAlign(
      LEFT,
      CENTER
    );


    text(
      `${label} = ${currentValue.toFixed(3)}`,
      px + 5,
      py - 6
    );

  } else {

    textAlign(
      RIGHT,
      CENTER
    );


    text(
      `${label} = ${currentValue.toFixed(3)}`,
      px - 5,
      py - 6
    );
  }
}


// ============================================================
// THIRD AREA IN LINEAR MODE
// ============================================================

function drawLinearExplanation(
  x0,
  y0,
  w,
  h
) {

  // Keep this area intentionally very quiet.

  noStroke();

  fill(155);

  textSize(10);

  textAlign(
    CENTER,
    CENTER
  );


  text(
    "2-node element\nhas two shape functions",
    x0 + w / 2,
    y0 + h / 2
  );
}


// ============================================================
// ELEMENT CONTROLS
// ============================================================

function drawElementControls() {

  // ----------------------------------------------------------
  // Background strip
  // ----------------------------------------------------------

  noStroke();

  fill(247);


  rect(
    205,
    controlsY - 14,
    290,
    28,
    4
  );


  // ----------------------------------------------------------
  // Label
  // ----------------------------------------------------------

  noStroke();

  fill(50);

  textSize(10);

  textAlign(
    LEFT,
    CENTER
  );


  text(
    "Element",
    230,
    controlsY
  );


  // ----------------------------------------------------------
  // Linear
  // ----------------------------------------------------------

  drawModeButton(
    285,
    controlsY,
    "Linear · 2 node",
    elementOrder === 2
  );


  // ----------------------------------------------------------
  // Quadratic
  // ----------------------------------------------------------

  drawModeButton(
    380,
    controlsY,
    "Quadratic · 3 node",
    elementOrder === 3
  );
}


// ============================================================
// MODE BUTTON
// ============================================================

function drawModeButton(
  x,
  y,
  label,
  active
) {

  const w =
    90;


  const h =
    20;


  if (
    active
  ) {

    noStroke();

    fill(222);


    rect(
      x,
      y - h / 2,
      w,
      h,
      3
    );
  }


  noStroke();


  fill(
    active
      ? 30
      : 105
  );


  textSize(9);

  textAlign(
    CENTER,
    CENTER
  );


  text(
    label,
    x + w / 2,
    y
  );
}


// ============================================================
// MOUSE
// ============================================================

function mousePressed() {

  // ==========================================================
  // SLIDER
  // ==========================================================

  if (
    mouseX >=
      sliderLeft - 7
    &&
    mouseX <=
      sliderRight + 7
    &&
    abs(
      mouseY -
      sliderY
    ) <= 12
  ) {

    sliderDragging =
      true;


    currentS =
      sFromMouseX(
        mouseX
      );


    return;
  }


  // ==========================================================
  // LINEAR
  // ==========================================================

  if (
    insideRect(
      mouseX,
      mouseY,
      285,
      controlsY - 10,
      90,
      20
    )
  ) {

    elementOrder = 2;

    return;
  }


  // ==========================================================
  // QUADRATIC
  // ==========================================================

  if (
    insideRect(
      mouseX,
      mouseY,
      380,
      controlsY - 10,
      90,
      20
    )
  ) {

    elementOrder = 3;

    return;
  }
}


// ============================================================
// DRAG
// ============================================================

function mouseDragged() {

  if (
    sliderDragging
  ) {

    currentS =
      sFromMouseX(
        mouseX
      );
  }
}


// ============================================================
// RELEASE
// ============================================================

function mouseReleased() {

  sliderDragging =
    false;
}


// ============================================================
// HIT TEST
// ============================================================

function insideRect(
  x,
  y,
  rx,
  ry,
  rw,
  rh
) {

  return (
    x >= rx &&
    x <= rx + rw &&
    y >= ry &&
    y <= ry + rh
  );
}
