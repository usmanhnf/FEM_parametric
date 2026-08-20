// ============================================================
// 1D PLATE — EXACT SOLUTION + LINEAR FEM
// Standalone p5.js sketch
// Sized to fit a ~700 px content column
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const W = 700;
const H = 430;


// ============================================================
// TYPOGRAPHY
// ============================================================

const FS_BASE = 13;
const FS_SMALL = 11;
const FS_TINY = 9;
const FS_XTINY = 8;


// ============================================================
// GEOMETRY + MATERIAL
// ============================================================

const plateWidth = 300;       // mm
const plateThickness = 500;   // mm
const A = plateWidth * plateThickness;

const h = 3000;               // mm
const E = 210000;             // MPa = N/mm²
const t = 0.04;               // MPa

const bodyForceValue = -2.5e-5; // N/mm³


// ============================================================
// DISPLAY STATE
// ============================================================

let showExact = true;
let showFEM = true;
let bodyForceOn = true;


// ============================================================
// FEM
// ============================================================

let nElements = 10;

const elementOptions = [3, 5, 10, 25];

let femData;


// ============================================================
// x SLIDER
// ============================================================

let currentX = 1500;
let sliderDragging = false;


// ============================================================
// LAYOUT
// ============================================================

const graphTop = 54;
const graphBottom = 305;

const sliderX = 22;

const plateX = 50;
const plateW = 38;

const uPlotX = 126;
const epsPlotX = 306;
const sigmaPlotX = 486;

const plotW = 150;


// ============================================================
// CONTROLS BAND
// ============================================================

const controlsX = 68;
const controlsY = 345;
const controlsW = 565;
const controlsH = 58;


// ============================================================
// SETUP
// ============================================================

function setup() {

  createCanvas(W, H);

  pixelDensity(2);

  textFont("Anaheim");

  updateFEM();
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  background(255);


  const exactU =
    displacementExact(currentX);

  const exactEps =
    strainExact(currentX);

  const exactSigma =
    stressExact(currentX);


  const femCurrent =
    getFEMValueAt(currentX);


  drawPlate();
  drawVerticalSlider();


  const uRange =
    getCombinedRange(
      displacementExact,
      "u"
    );

  const epsRange =
    getCombinedRange(
      strainExact,
      "eps"
    );

  const sigmaRange =
    getCombinedRange(
      stressExact,
      "sigma"
    );


  drawGraph(
    uPlotX,
    "Displacement  u(x)",
    "u [mm]",
    displacementExact,
    uRange,
    exactU,
    femCurrent.u,
    "u"
  );

  drawGraph(
    epsPlotX,
    "Strain  ε(x)",
    "ε",
    strainExact,
    epsRange,
    exactEps,
    femCurrent.eps,
    "eps"
  );

  drawGraph(
    sigmaPlotX,
    "Stress  σ(x)",
    "σ [MPa]",
    stressExact,
    sigmaRange,
    exactSigma,
    femCurrent.sigma,
    "sigma"
  );


  drawCurrentHeightGuide();
  drawControls();
}


// ============================================================
// FONT HELPER
// ============================================================

function fontSize(size) {
  textFont("Anaheim");
  textSize(size);
}


// ============================================================
// BODY FORCE
// ============================================================

function getBodyForce() {
  return bodyForceOn ? bodyForceValue : 0;
}


// ============================================================
// EXACT SOLUTION
// ============================================================

function displacementExact(x) {

  const b = getBodyForce();

  return (
    -(b / (2 * E)) * x * x
    +
    ((t + b * h) / E) * x
  );
}


function strainExact(x) {

  const b = getBodyForce();

  return (
    -(b / E) * x
    +
    (t + b * h) / E
  );
}


function stressExact(x) {

  const b = getBodyForce();

  return (
    -b * x
    +
    t
    +
    b * h
  );
}


// ============================================================
// FEM UPDATE
// ============================================================

function updateFEM() {
  femData = solveFEM(nElements);
}


// ============================================================
// LINEAR 2-NODE BAR FEM
// ============================================================

function solveFEM(nel) {

  const nNodes = nel + 1;
  const Le = h / nel;

  const K = new Array(nNodes);

  for (let i = 0; i < nNodes; i++) {
    K[i] = new Array(nNodes).fill(0);
  }

  const F = new Array(nNodes).fill(0);

  const k = E * A / Le;
  const b = getBodyForce();

  for (let e = 0; e < nel; e++) {

    const i = e;
    const j = e + 1;

    K[i][i] += k;
    K[i][j] -= k;

    K[j][i] -= k;
    K[j][j] += k;

    const fb =
      b * A * Le / 2;

    F[i] += fb;
    F[j] += fb;
  }

  F[nNodes - 1] += t * A;

  const nFree = nNodes - 1;

  const KR = new Array(nFree);
  const FR = new Array(nFree);

  for (let i = 0; i < nFree; i++) {

    KR[i] = new Array(nFree);
    FR[i] = F[i + 1];

    for (let j = 0; j < nFree; j++) {
      KR[i][j] = K[i + 1][j + 1];
    }
  }

  const uFree =
    solveLinearSystem(KR, FR);

  const U = new Array(nNodes).fill(0);
  U[0] = 0;

  for (let i = 1; i < nNodes; i++) {
    U[i] = uFree[i - 1];
  }

  const xNodes = new Array(nNodes);

  for (let i = 0; i < nNodes; i++) {
    xNodes[i] = i * Le;
  }

  const eps = new Array(nel);
  const sigma = new Array(nel);

  for (let e = 0; e < nel; e++) {

    eps[e] =
      (U[e + 1] - U[e]) / Le;

    sigma[e] =
      E * eps[e];
  }

  return {
    nel,
    nNodes,
    Le,
    U,
    eps,
    sigma,
    xNodes
  };
}


// ============================================================
// LINEAR SYSTEM SOLVER
// ============================================================

function solveLinearSystem(matrix, vector) {

  const n = vector.length;

  const M =
    matrix.map(row => row.slice());

  const f = vector.slice();

  for (let k = 0; k < n; k++) {

    let pivot = k;

    for (let i = k + 1; i < n; i++) {
      if (abs(M[i][k]) > abs(M[pivot][k])) {
        pivot = i;
      }
    }

    if (pivot !== k) {
      [M[k], M[pivot]] = [M[pivot], M[k]];
      [f[k], f[pivot]] = [f[pivot], f[k]];
    }

    for (let i = k + 1; i < n; i++) {

      const factor =
        M[i][k] / M[k][k];

      for (let j = k; j < n; j++) {
        M[i][j] -= factor * M[k][j];
      }

      f[i] -= factor * f[k];
    }
  }

  const x = new Array(n).fill(0);

  for (let i = n - 1; i >= 0; i--) {

    let sum = f[i];

    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }

    x[i] = sum / M[i][i];
  }

  return x;
}


// ============================================================
// FEM VALUE AT ARBITRARY x
// ============================================================

function getFEMValueAt(x) {

  const Le = femData.Le;

  let e = floor(x / Le);

  e = constrain(
    e,
    0,
    femData.nel - 1
  );

  const x1 = femData.xNodes[e];

  let s =
    (x - x1) / Le;

  s = constrain(s, 0, 1);

  const u =
    (1 - s) * femData.U[e]
    +
    s * femData.U[e + 1];

  return {
    u: u,
    eps: femData.eps[e],
    sigma: femData.sigma[e]
  };
}


// ============================================================
// PLATE
// ============================================================

function drawPlate() {

  const top = graphTop;
  const bottom = graphBottom;
  const plateH = bottom - top;

  fill(243, 249, 242);

  stroke(85);
  strokeWeight(0.8);

  rect(
    plateX,
    top,
    plateW,
    plateH
  );

  if (showFEM) {

    for (let i = 0; i <= nElements; i++) {

      const physicalX =
        i * h / nElements;

      const yy =
        map(
          physicalX,
          0,
          h,
          bottom,
          top
        );

      stroke(155, 155, 155, 75);
      strokeWeight(0.6);

      line(
        plateX,
        yy,
        plateX + plateW,
        yy
      );

      noStroke();
      fill(40);

      circle(
        plateX - 3,
        yy,
        nElements >= 25 ? 2 : 3.3
      );
    }
  }

  if (bodyForceOn) {

    for (let row = 0; row < 6; row++) {

      const yy =
        top +
        36 +
        row * (plateH - 72) / 5;

      drawArrow(
        plateX + 12,
        yy - 8,
        plateX + 12,
        yy + 8,
        color(25, 80, 220)
      );

      drawArrow(
        plateX + 26,
        yy - 8,
        plateX + 26,
        yy + 8,
        color(25, 80, 220)
      );
    }

    noStroke();
    fill(25, 75, 195);

    fontSize(FS_SMALL);

    textAlign(LEFT, CENTER);

    text(
      "b",
      plateX + plateW + 6,
      top + 56
    );
  }

  for (let i = 0; i < 2; i++) {

    const xx =
      plateX + 10 + i * 14;

    drawArrow(
      xx,
      top,
      xx,
      top - 20,
      color(230, 35, 35)
    );
  }

  noStroke();
  fill(210, 30, 30);

  fontSize(FS_SMALL);

  textAlign(LEFT, CENTER);

  text(
    "t",
    plateX + plateW + 6,
    top - 10
  );

  stroke(55);
  strokeWeight(0.9);

  line(
    plateX - 5,
    bottom,
    plateX + plateW + 6,
    bottom
  );

  for (let i = -1; i <= plateW + 6; i += 8) {
    line(
      plateX + i,
      bottom,
      plateX + i - 6,
      bottom + 7
    );
  }
}


// ============================================================
// VERTICAL SLIDER
// ============================================================

function drawVerticalSlider() {

  const sliderY =
    yFromPhysicalX(currentX);

  stroke(85);
  strokeWeight(1);

  line(
    sliderX,
    graphTop,
    sliderX,
    graphBottom
  );

  line(
    sliderX - 4,
    graphTop,
    sliderX + 4,
    graphTop
  );

  line(
    sliderX - 4,
    graphBottom,
    sliderX + 4,
    graphBottom
  );

  noStroke();
  fill(55);

  fontSize(FS_SMALL);

  textAlign(LEFT, CENTER);

  text(
    "x = h",
    sliderX + 8,
    graphTop
  );

  text(
    "x = 0",
    sliderX + 8,
    graphBottom
  );

  fill(255);

  stroke(25, 80, 210);
  strokeWeight(1.35);

  circle(
    sliderX,
    sliderY,
    14
  );

  noStroke();
  fill(25, 80, 210);

  circle(
    sliderX,
    sliderY,
    5
  );

  fill(25, 75, 190);

  fontSize(FS_TINY);

  textAlign(LEFT, CENTER);

  text(
    `${currentX.toFixed(0)} mm`,
    sliderX + 8,
    sliderY
  );
}


// ============================================================
// SHARED GUIDE
// ============================================================

function drawCurrentHeightGuide() {

  const yy =
    yFromPhysicalX(currentX);

  stroke(60, 90, 160, 45);
  strokeWeight(0.7);

  drawingContext.setLineDash([4, 4]);

  line(
    sliderX,
    yy,
    sigmaPlotX + plotW,
    yy
  );

  drawingContext.setLineDash([]);
}


// ============================================================
// GRAPH
// ============================================================

function drawGraph(
  x0,
  title,
  axisLabel,
  exactFunction,
  range,
  exactCurrent,
  femCurrent,
  field
) {

  const left = x0;
  const right = x0 + plotW;

  const minValue = range.min;
  const maxValue = range.max;

  noStroke();
  fill(30);

  fontSize(FS_BASE);

  textAlign(CENTER, BOTTOM);

  text(
    title,
    left + plotW / 2,
    graphTop - 8
  );

  noFill();
  stroke(115);
  strokeWeight(0.65);

  rect(
    left,
    graphTop,
    plotW,
    graphBottom - graphTop
  );

  const heightTicks = [
    0, 500, 1000, 1500,
    2000, 2500, 3000
  ];

  fontSize(FS_XTINY);

  for (const physicalX of heightTicks) {

    const yy =
      yFromPhysicalX(physicalX);

    stroke(232);
    strokeWeight(0.55);

    line(left, yy, right, yy);

    noStroke();
    fill(90);

    textAlign(RIGHT, CENTER);

    text(
      physicalX,
      left - 4,
      yy
    );
  }

  if (minValue < 0 && maxValue > 0) {

    const zeroX =
      map(
        0,
        minValue,
        maxValue,
        left,
        right
      );

    stroke(215);
    strokeWeight(0.6);

    line(
      zeroX,
      graphTop,
      zeroX,
      graphBottom
    );
  }

  if (showExact) {

    noFill();
    stroke(25, 90, 225);
    strokeWeight(1.7);

    beginShape();

    for (let i = 0; i <= 220; i++) {

      const physicalX =
        map(i, 0, 220, 0, h);

      const value =
        exactFunction(physicalX);

      const px =
        map(
          value,
          minValue,
          maxValue,
          left,
          right
        );

      const py =
        yFromPhysicalX(physicalX);

      vertex(px, py);
    }

    endShape();
  }

  if (showFEM) {

    if (field === "u") {

      drawFEMDisplacement(
        left,
        minValue,
        maxValue
      );

    } else if (field === "eps") {

      drawFEMConstantField(
        left,
        minValue,
        maxValue,
        femData.eps
      );

    } else {

      drawFEMConstantField(
        left,
        minValue,
        maxValue,
        femData.sigma
      );
    }
  }

  const currentY =
    yFromPhysicalX(currentX);

  if (showExact) {

    const pxExact =
      map(
        exactCurrent,
        minValue,
        maxValue,
        left,
        right
      );

    fill(255);
    stroke(25, 90, 225);
    strokeWeight(1.5);

    circle(
      pxExact,
      currentY,
      8
    );
  }

  if (showFEM) {

    const pxFEM =
      map(
        femCurrent,
        minValue,
        maxValue,
        left,
        right
      );

    noStroke();
    fill(235, 45, 35);

    circle(
      pxFEM,
      currentY,
      6
    );
  }

  drawMovingValues(
    left,
    currentY,
    exactCurrent,
    femCurrent,
    field
  );

  noStroke();
  fill(60);

  fontSize(FS_TINY);

  textAlign(CENTER, TOP);

  text(
    axisLabel,
    left + plotW / 2,
    graphBottom + 18
  );

  drawValueTick(left, minValue);
  drawValueTick(right, maxValue);

  if (minValue < 0 && maxValue > 0) {

    const zeroPX =
      map(
        0,
        minValue,
        maxValue,
        left,
        right
      );

    drawValueTick(zeroPX, 0);
  }
}


// ============================================================
// MOVING VALUE TEXT
// ============================================================

function drawMovingValues(
  left,
  y,
  exactValue,
  femValue,
  field
) {

  fontSize(FS_XTINY);

  const exactText =
    `Ex ${formatFieldValue(exactValue, field)}`;

  const femText =
    `FEM ${formatFieldValue(femValue, field)}`;

  const gap = 8;

  const exactW =
    showExact ? textWidth(exactText) : 0;

  const femW =
    showFEM ? textWidth(femText) : 0;

  const totalW =
    exactW + femW + (
      showExact && showFEM ? gap : 0
    );

  let x =
    left + (plotW - totalW) / 2;

  let textY = y - 10;

  textY = constrain(
    textY,
    graphTop + 10,
    graphBottom - 6
  );

  textAlign(LEFT, CENTER);

  if (showExact) {

    noStroke();
    fill(20, 80, 205);

    text(
      exactText,
      x,
      textY
    );

    x += exactW + gap;
  }

  if (showFEM) {

    noStroke();
    fill(205, 40, 30);

    text(
      femText,
      x,
      textY
    );
  }
}


// ============================================================
// FEM DISPLACEMENT
// ============================================================

function drawFEMDisplacement(
  left,
  minValue,
  maxValue
) {

  stroke(235, 45, 35);
  strokeWeight(1.25);
  noFill();

  drawingContext.setLineDash([5, 3]);

  beginShape();

  for (let i = 0; i < femData.nNodes; i++) {

    const px =
      map(
        femData.U[i],
        minValue,
        maxValue,
        left,
        left + plotW
      );

    const py =
      yFromPhysicalX(
        femData.xNodes[i]
      );

    vertex(px, py);
  }

  endShape();

  drawingContext.setLineDash([]);

  const nodeSize =
    nElements >= 25 ? 2.5 : 4.3;

  noStroke();
  fill(235, 45, 35);

  for (let i = 0; i < femData.nNodes; i++) {

    const px =
      map(
        femData.U[i],
        minValue,
        maxValue,
        left,
        left + plotW
      );

    const py =
      yFromPhysicalX(
        femData.xNodes[i]
      );

    circle(px, py, nodeSize);
  }
}


// ============================================================
// FEM STRAIN / STRESS
// ============================================================

function drawFEMConstantField(
  left,
  minValue,
  maxValue,
  values
) {

  let previousPX = null;

  for (let e = 0; e < femData.nel; e++) {

    const px =
      map(
        values[e],
        minValue,
        maxValue,
        left,
        left + plotW
      );

    const yBottom =
      yFromPhysicalX(
        femData.xNodes[e]
      );

    const yTop =
      yFromPhysicalX(
        femData.xNodes[e + 1]
      );

    stroke(235, 45, 35);
    strokeWeight(1.2);

    drawingContext.setLineDash([5, 3]);

    line(px, yBottom, px, yTop);

    if (previousPX !== null) {
      line(previousPX, yBottom, px, yBottom);
    }

    drawingContext.setLineDash([]);

    noStroke();
    fill(235, 45, 35);

    const pointSize =
      nElements >= 25 ? 2.2 : 4;

    circle(px, yBottom, pointSize);
    circle(px, yTop, pointSize);

    previousPX = px;
  }
}


// ============================================================
// CONTROLS
// ============================================================

function drawControls() {

  noStroke();
  fill(247);

  rect(
    controlsX,
    controlsY,
    controlsW,
    controlsH,
    4
  );

  drawSketchToggle(
    84,
    controlsY + 18,
    "Exact",
    showExact
  );

  drawSketchToggle(
    210,
    controlsY + 18,
    "FEM",
    showFEM
  );

  drawSketchToggle(
    318,
    controlsY + 18,
    "Body",
    bodyForceOn
  );

  drawElementButtons(
    450,
    controlsY + 18
  );
}


// ============================================================
// TOGGLE
// ============================================================

function drawSketchToggle(
  x,
  y,
  label,
  active
) {

  fontSize(FS_BASE);

  noStroke();
  fill(40);

  textAlign(LEFT, CENTER);

  text(label, x, y);

  const labelW =
    textWidth(label);

  const sx =
    x + labelW + 8;

  const sy = y - 8;

  const sw = 32;
  const sh = 16;

  if (active) {
    fill(55, 120, 215);
  } else {
    fill(225);
  }

  stroke(145);
  strokeWeight(0.75);

  rect(sx, sy, sw, sh, 9);

  if (active) {

    stroke(25, 80, 175, 145);
    strokeWeight(0.55);

    for (let i = 4; i < 16; i += 5) {
      line(
        sx + i,
        sy + sh - 3,
        sx + i + 6,
        sy + 3
      );
    }
  }

  const knobX =
    active ? sx + sw - 8 : sx + 8;

  fill(255);
  stroke(125);
  strokeWeight(0.7);

  circle(
    knobX,
    sy + sh / 2,
    13
  );
}


// ============================================================
// ELEMENT SELECTOR
// ============================================================

function drawElementButtons(
  x,
  y
) {

  fontSize(FS_BASE);

  noStroke();
  fill(45);

  textAlign(LEFT, CENTER);

  text("Elements", x, y);

  let bx =
    x + textWidth("Elements") + 10;

  for (let i = 0; i < elementOptions.length; i++) {

    const value =
      elementOptions[i];

    const bw =
      value === 25 ? 26 : 22;

    if (value === nElements) {

      noStroke();
      fill(222);

      rect(
        bx,
        y - 10,
        bw,
        20,
        3
      );
    }

    noStroke();

    fill(
      value === nElements ? 20 : 105
    );

    fontSize(FS_SMALL);

    textAlign(CENTER, CENTER);

    text(
      value,
      bx + bw / 2,
      y
    );

    bx += bw + 4;
  }
}


// ============================================================
// RANGE
// ============================================================

function getCombinedRange(
  exactFunction,
  field
) {

  let minValue = Infinity;
  let maxValue = -Infinity;

  for (let i = 0; i <= 300; i++) {

    const x = i * h / 300;

    const value =
      exactFunction(x);

    minValue = min(minValue, value);
    maxValue = max(maxValue, value);
  }

  let values;

  if (field === "u") {
    values = femData.U;
  } else if (field === "eps") {
    values = femData.eps;
  } else {
    values = femData.sigma;
  }

  for (const value of values) {
    minValue = min(minValue, value);
    maxValue = max(maxValue, value);
  }

  minValue = min(minValue, 0);
  maxValue = max(maxValue, 0);

  let span = maxValue - minValue;

  if (abs(span) < 1e-14) {

    const reference =
      max(abs(maxValue), 1e-6);

    minValue -= 0.25 * reference;
    maxValue += 0.25 * reference;

    span = maxValue - minValue;
  }

  const padding = 0.12 * span;

  return {
    min: minValue - padding,
    max: maxValue + padding
  };
}


// ============================================================
// COORDINATE MAPPING
// ============================================================

function yFromPhysicalX(x) {
  return map(
    x,
    0,
    h,
    graphBottom,
    graphTop
  );
}


function physicalXFromY(y) {
  return map(
    constrain(y, graphTop, graphBottom),
    graphBottom,
    graphTop,
    0,
    h
  );
}


// ============================================================
// MOUSE
// ============================================================

function mousePressed() {

  if (
    abs(mouseX - sliderX) < 18 &&
    mouseY >= graphTop &&
    mouseY <= graphBottom
  ) {
    sliderDragging = true;
    currentX = physicalXFromY(mouseY);
    return;
  }

  if (
    insideRect(
      mouseX, mouseY,
      78, controlsY + 5,
      110, 24
    )
  ) {
    showExact = !showExact;
    return;
  }

  if (
    insideRect(
      mouseX, mouseY,
      204, controlsY + 5,
      92, 24
    )
  ) {
    showFEM = !showFEM;
    return;
  }

  if (
    insideRect(
      mouseX, mouseY,
      312, controlsY + 5,
      108, 24
    )
  ) {
    bodyForceOn = !bodyForceOn;
    updateFEM();
    return;
  }

  fontSize(FS_BASE);

  let bx =
    450 + textWidth("Elements") + 10;

  for (let i = 0; i < elementOptions.length; i++) {

    const value =
      elementOptions[i];

    const bw =
      value === 25 ? 26 : 22;

    if (
      insideRect(
        mouseX,
        mouseY,
        bx,
        controlsY + 8,
        bw,
        20
      )
    ) {
      nElements = value;
      updateFEM();
      return;
    }

    bx += bw + 4;
  }
}


function mouseDragged() {
  if (sliderDragging) {
    currentX = physicalXFromY(mouseY);
  }
}


function mouseReleased() {
  sliderDragging = false;
}


// ============================================================
// HIT TEST
// ============================================================

function insideRect(
  x, y, rx, ry, rw, rh
) {
  return (
    x >= rx &&
    x <= rx + rw &&
    y >= ry &&
    y <= ry + rh
  );
}


// ============================================================
// ARROW
// ============================================================

function drawArrow(
  x1, y1, x2, y2, arrowColor
) {

  stroke(arrowColor);
  strokeWeight(1.1);

  line(x1, y1, x2, y2);

  const angle =
    atan2(y2 - y1, x2 - x1);

  push();

  translate(x2, y2);
  rotate(angle);

  fill(arrowColor);
  noStroke();

  triangle(
    0, 0,
    -4, -2.2,
    -4, 2.2
  );

  pop();
}


// ============================================================
// AXIS TICKS
// ============================================================

function drawValueTick(px, value) {

  stroke(105);
  strokeWeight(0.6);

  line(
    px,
    graphBottom,
    px,
    graphBottom + 4
  );

  noStroke();
  fill(80);

  fontSize(FS_XTINY);

  textAlign(CENTER, TOP);

  text(
    formatAxisValue(value),
    px,
    graphBottom + 5
  );
}


// ============================================================
// VALUE FORMATTING
// ============================================================

function formatFieldValue(value, field) {

  if (
    abs(value) < 0.001 &&
    value !== 0
  ) {
    return value.toExponential(2);
  }

  return value.toFixed(3);
}


function formatAxisValue(value) {

  if (abs(value) < 1e-14) {
    return "0";
  }

  if (abs(value) < 0.001) {
    return value.toExponential(1);
  }

  return value.toFixed(3);
}