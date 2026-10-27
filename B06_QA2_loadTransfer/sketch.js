// ============================================================
// BEAM WITH OPTIONAL DIAGONAL BAR
//
// Purpose:
// Demonstrate how an inclined axial bar redirects a unit load
// and significantly reduces bending in a cantilever beam.
//
// INTERACTION
// - Click diagonal bar: activate / remove bar
// - Click left beam support: fixed / pinned
// - Click N, V or M: show / hide corresponding overlay
// - Click Reset: restore initial configuration
//
// DEFAULT
// - Bar OFF
// - Beam support FIXED
//
// RESULTS
// - Light dashed purple: calculated no-bar reference moment
// - Solid transparent purple: current calculated moment
// - Yellow: calculated axial force
// - Green: calculated shear force
// - Blue dashed: exaggerated deformed shape
//
// Units:
// Force = N
// Length = mm
// Moment = Nmm
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const W = 700;
const H = 410;


// ============================================================
// TYPOGRAPHY
// ============================================================

const FS_BASE = 10;
const FS_SMALL = 9;
const FS_TINY = 8;


// ============================================================
// MATERIAL AND SECTION PROPERTIES
// ============================================================

const E = 2.10e5;

// Beam properties
const beamArea = 6000;
const beamInertia = 8.0e7;

// Diagonal axial bar
const barArea = 3000;

// Unit downward load
const unitLoad = 1;


// ============================================================
// GEOMETRY
//
// C o  upper pin
//    \
//     \  diagonal axial bar
//      \
// A ======= o B
// support     ↓ P = 1
//
// A = beam support
// B = loaded joint
// C = upper bar support
// ============================================================

const beamLength = 5000;
const barRise = 3000;

const nodes = [

  // A
  {
    x: 0,
    y: 0
  },

  // B
  {
    x: beamLength,
    y: 0
  },

  // C
  {
    x: 0,
    y: barRise
  }

];


// ============================================================
// INTERACTIVE STATE
// ============================================================

// Bar is OFF by default.
let barActive = false;

// Beam support starts fixed.
let beamSupport = "fixed";

// Result overlays
let showAxial = true;
let showShear = true;
let showMoment = true;


// ============================================================
// COLOURS
// ============================================================

const COL_STRUCTURE = [
  48,
  55,
  64
];

const COL_REFERENCE = [
  135,
  143,
  151
];

const COL_BLUE = [
  25,
  90,
  225
];

const COL_RED = [
  230,
  40,
  35
];

const COL_AXIAL = [
  235,
  188,
  20
];

const COL_SHEAR = [
  35,
  168,
  88
];

const COL_MOMENT = [
  148,
  72,
  205
];


// ============================================================
// PANELS
// ============================================================

const panelY = 18;
const panelH = 322;

const leftPanelX = 12;
const leftPanelW = 330;

const rightPanelX = 358;
const rightPanelW = 330;


// ============================================================
// DISPLAY LIMITS
// ============================================================

const xMin = -850;
const xMax = 5850;

const yMin = -950;
const yMax = 3900;


// ============================================================
// SMALL BUTTONS
// ============================================================

// Reset in upper-right corner of left panel
const resetX =
  leftPanelX
  +
  leftPanelW
  -
  57;

const resetY =
  panelY + 8;

const resetW = 47;
const resetH = 20;


// N, V and M buttons in upper-right corner of result panel
const resultButtonY =
  panelY + 8;

const resultButtonW = 34;
const resultButtonH = 20;

const axialButtonX =
  rightPanelX
  +
  rightPanelW
  -
  118;

const shearButtonX =
  rightPanelX
  +
  rightPanelW
  -
  80;

const momentButtonX =
  rightPanelX
  +
  rightPanelW
  -
  42;


// ============================================================
// GLOBAL DOF ORDER
//
// Node A:
//   0 = uxA
//   1 = uyA
//   2 = rzA
//
// Node B:
//   3 = uxB
//   4 = uyB
//   5 = rzB
//
// Node C:
//   6 = uxC
//   7 = uyC
// ============================================================

const NDOF = 8;


// ============================================================
// CURRENT DISPLACEMENT STATE
// ============================================================

let targetDisplacement =
  new Array(
    NDOF
  ).fill(0);

let animatedDisplacement =
  new Array(
    NDOF
  ).fill(0);

let structureStable = true;


// ============================================================
// CURRENT CALCULATED FORCE RESULTS
// ============================================================

let currentResults = {

  beamN: 0,

  beamV: 0,

  momentA: 0,

  momentB: 0,

  barN: 0

};


// ============================================================
// NO-BAR REFERENCE RESULTS
//
// Calculated once using:
// - bar OFF
// - beam support FIXED
//
// For P = 1 and L = 5000:
//
// M0 = P L = 5000 Nmm
// ============================================================

let referenceResults = {

  beamN: 0,

  beamV: 0,

  momentA: 0,

  momentB: 0,

  barN: 0

};


// ============================================================
// VISUAL DEFORMATION SCALE
// ============================================================

const deformationScale = 3.0e5;


// ============================================================
// HOVER STATE
// ============================================================

let hoverLeftBar = false;
let hoverRightBar = false;

let hoverLeftSupport = false;
let hoverRightSupport = false;

let hoverReset = false;

let hoverAxial = false;
let hoverShear = false;
let hoverMoment = false;


// ============================================================
// SETUP
// ============================================================

function setup() {

  createCanvas(
    W,
    H
  );

  pixelDensity(2);

  textFont("Anaheim");

  strokeCap(ROUND);
  strokeJoin(ROUND);

  calculateReferenceResults();
  solveCurrentStructure();
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  background(255);

  updateHoverState();
  updateAnimation();

  // ----------------------------------------------------------
  // PANELS
  // ----------------------------------------------------------

  drawPanel(
    leftPanelX,
    leftPanelW,
    "Structure and deformation"
  );

  drawPanel(
    rightPanelX,
    rightPanelW,
    "Internal-force comparison"
  );

  drawGrid(
    leftPanelX,
    leftPanelW
  );

  drawGrid(
    rightPanelX,
    rightPanelW
  );

  // ----------------------------------------------------------
  // LEFT STRUCTURE
  // ----------------------------------------------------------

  drawStructure(
    leftPanelX,
    leftPanelW,
    false
  );

  drawMemberLabels(
    leftPanelX,
    leftPanelW
  );

  drawDeformedShape(
    leftPanelX,
    leftPanelW
  );

  drawUnitLoad(
    leftPanelX,
    leftPanelW
  );

  // ----------------------------------------------------------
  // RIGHT STRUCTURE AND FORCE RESULTS
  // ----------------------------------------------------------

  drawStructure(
    rightPanelX,
    rightPanelW,
    true
  );

  drawForceOverlays(
    rightPanelX,
    rightPanelW
  );

  drawUnitLoad(
    rightPanelX,
    rightPanelW
  );

  // ----------------------------------------------------------
  // CONTROLS
  // ----------------------------------------------------------

  drawResetButton();
  drawResultButtons();

  drawLegend();
  drawInstruction();
}


// ============================================================
// FONT
// ============================================================

function fontSize(
  sizeValue
) {

  textFont("Anaheim");
  textSize(sizeValue);
}


// ============================================================
// PANEL
// ============================================================

function drawPanel(
  panelX,
  panelWidth,
  title
) {

  noStroke();

  fill(
    250,
    252,
    254
  );

  rect(
    panelX,
    panelY,
    panelWidth,
    panelH,
    6
  );

  noFill();

  stroke(
    214,
    220,
    226
  );

  strokeWeight(0.75);

  rect(
    panelX,
    panelY,
    panelWidth,
    panelH,
    6
  );

  noStroke();

  fill(55);

  fontSize(FS_SMALL);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    title,
    panelX + panelWidth / 2,
    panelY + 18
  );
}


// ============================================================
// GRID
// ============================================================

function drawGrid(
  panelX,
  panelWidth
) {

  push();

  drawingContext.save();

  drawingContext.beginPath();

  drawingContext.rect(
    panelX,
    panelY + 30,
    panelWidth,
    panelH - 30
  );

  drawingContext.clip();

  stroke(
    55,
    195,
    210,
    22
  );

  strokeWeight(0.5);

  for (
    let x = -500;
    x <= 5500;
    x += 500
  ) {

    const point =
      toScreen(
        x,
        0,
        panelX,
        panelWidth
      );

    line(
      point.x,
      panelY + 30,
      point.x,
      panelY + panelH
    );
  }

  for (
    let y = -500;
    y <= 3500;
    y += 500
  ) {

    const point =
      toScreen(
        0,
        y,
        panelX,
        panelWidth
      );

    line(
      panelX,
      point.y,
      panelX + panelWidth,
      point.y
    );
  }

  drawingContext.restore();

  pop();
}


// ============================================================
// STRUCTURE
// ============================================================

function drawStructure(
  panelX,
  panelWidth,
  rightPanel
) {

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  const barHovered =
    rightPanel
      ? hoverRightBar
      : hoverLeftBar;

  const supportHovered =
    rightPanel
      ? hoverRightSupport
      : hoverLeftSupport;

  // ----------------------------------------------------------
  // THICK BEAM
  // ----------------------------------------------------------

  push();

  drawingContext.shadowBlur = 5;

  drawingContext.shadowColor =
    "rgba(48,55,64,0.16)";

  stroke(...COL_STRUCTURE);

  strokeWeight(7);

  line(
    points.A.x,
    points.A.y,
    points.B.x,
    points.B.y
  );

  drawingContext.shadowBlur = 0;

  pop();

  // ----------------------------------------------------------
  // OPTIONAL DIAGONAL BAR
  // ----------------------------------------------------------

  push();

  noFill();

  if (barHovered) {

    drawingContext.shadowBlur = 9;

    drawingContext.shadowColor =
      "rgba(25,90,225,0.42)";
  }

  if (barActive) {

    stroke(
      barHovered
        ? color(...COL_BLUE)
        : color(...COL_STRUCTURE)
    );

    strokeWeight(
      barHovered
        ? 4
        : 3
    );

    drawingContext.setLineDash([]);

    line(
      points.C.x,
      points.C.y,
      points.B.x,
      points.B.y
    );
  }

  else {

    stroke(
      barHovered
        ? color(...COL_BLUE)
        : color(...COL_REFERENCE)
    );

    strokeWeight(
      barHovered
        ? 2.5
        : 1.7
    );

    drawingContext.setLineDash(
      [
        7,
        5
      ]
    );

    line(
      points.C.x,
      points.C.y,
      points.B.x,
      points.B.y
    );

    drawingContext.setLineDash([]);
  }

  drawingContext.shadowBlur = 0;

  pop();

  // ----------------------------------------------------------
  // BEAM-BAR JOINT B
  // ----------------------------------------------------------

  fill(255);

  stroke(...COL_STRUCTURE);

  strokeWeight(1.3);

  circle(
    points.B.x,
    points.B.y,
    9
  );

  // ----------------------------------------------------------
  // BEAM SUPPORT A
  // ----------------------------------------------------------

  if (supportHovered) {

    push();

    drawingContext.shadowBlur = 10;

    drawingContext.shadowColor =
      "rgba(25,90,225,0.45)";

    if (
      beamSupport === "fixed"
    ) {

      drawFixedSupport(
        points.A.x,
        points.A.y,
        true
      );
    }

    else {

      drawPinnedSupport(
        points.A.x,
        points.A.y,
        true
      );
    }

    drawingContext.shadowBlur = 0;

    pop();
  }

  else {

    if (
      beamSupport === "fixed"
    ) {

      drawFixedSupport(
        points.A.x,
        points.A.y,
        false
      );
    }

    else {

      drawPinnedSupport(
        points.A.x,
        points.A.y,
        false
      );
    }
  }

  // ----------------------------------------------------------
  // UPPER PIN C
  // ----------------------------------------------------------

  drawUpperPin(
    points.C.x,
    points.C.y
  );
}


// ============================================================
// MEMBER LABELS ON LEFT FIGURE
// ============================================================

function drawMemberLabels(
  panelX,
  panelWidth
) {

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  noStroke();

  fill(
    70,
    75,
    82
  );

  fontSize(FS_SMALL);

  // ----------------------------------------------------------
  // BEAM LABEL
  // ----------------------------------------------------------

  textAlign(
    CENTER,
    TOP
  );

  text(
    "Beam",
    0.5
    *
    (
      points.A.x
      +
      points.B.x
    ),
    points.A.y + 12
  );

  // ----------------------------------------------------------
  // BAR LABEL
  // ----------------------------------------------------------

  const barMidX =
    0.5
    *
    (
      points.C.x
      +
      points.B.x
    );

  const barMidY =
    0.5
    *
    (
      points.C.y
      +
      points.B.y
    );

  const barAngle =
    atan2(
      points.B.y
      -
      points.C.y,

      points.B.x
      -
      points.C.x
    );

  push();

  translate(
    barMidX,
    barMidY
  );

  rotate(barAngle);

  textAlign(
    CENTER,
    BOTTOM
  );

  text(
    barActive
      ? "Bar"
      : "Bar — click to activate",
    0,
    -7
  );

  pop();
}


// ============================================================
// FIXED SUPPORT
// ============================================================

function drawFixedSupport(
  x,
  y,
  active
) {

  push();

  stroke(
    active
      ? color(...COL_BLUE)
      : color(55)
  );

  strokeWeight(
    active
      ? 1.7
      : 1.1
  );

  line(
    x - 5,
    y - 18,
    x - 5,
    y + 18
  );

  for (
    let yy = -16;
    yy <= 18;
    yy += 7
  ) {

    line(
      x - 5,
      y + yy,
      x - 13,
      y + yy + 6
    );
  }

  pop();
}


// ============================================================
// PINNED SUPPORT
// ============================================================

function drawPinnedSupport(
  x,
  y,
  active
) {

  push();

  noFill();

  stroke(
    active
      ? color(...COL_BLUE)
      : color(55)
  );

  strokeWeight(
    active
      ? 1.7
      : 1.1
  );

  triangle(
    x - 2,
    y,
    x - 19,
    y - 11,
    x - 19,
    y + 11
  );

  line(
    x - 20,
    y - 16,
    x - 20,
    y + 16
  );

  for (
    let yy = -14;
    yy <= 16;
    yy += 7
  ) {

    line(
      x - 20,
      y + yy,
      x - 27,
      y + yy + 5
    );
  }

  pop();
}


// ============================================================
// UPPER PIN SUPPORT
// ============================================================

function drawUpperPin(
  x,
  y
) {

  push();

  noFill();

  stroke(55);

  strokeWeight(1.1);

  circle(
    x,
    y,
    8
  );

  line(
    x - 8,
    y - 6,
    x + 8,
    y - 6
  );

  for (
    let xx = -6;
    xx <= 8;
    xx += 5
  ) {

    line(
      x + xx,
      y - 6,
      x + xx - 4,
      y - 12
    );
  }

  pop();
}


// ============================================================
// UNIT LOAD
// ============================================================

function drawUnitLoad(
  panelX,
  panelWidth
) {

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  drawArrow(
    points.B.x,
    points.B.y - 59,
    points.B.x,
    points.B.y - 10,
    color(...COL_RED),
    1.6
  );

  noStroke();

  fill(...COL_RED);

  fontSize(FS_SMALL);

  textAlign(
    CENTER,
    BOTTOM
  );

  text(
    "P = 1",
    points.B.x,
    points.B.y - 64
  );
}


// ============================================================
// DEFORMED SHAPE
// ============================================================

function drawDeformedShape(
  panelX,
  panelWidth
) {

  if (
    !structureStable
  ) {

    noStroke();

    fill(...COL_RED);

    fontSize(FS_SMALL);

    textAlign(
      CENTER,
      BOTTOM
    );

    text(
      "Mechanism: activate the bar or fix the beam support",
      panelX + panelWidth / 2,
      panelY + panelH - 10
    );

    return;
  }

  push();

  noFill();

  stroke(...COL_BLUE);

  strokeWeight(2.4);

  drawingContext.setLineDash(
    [
      8,
      5
    ]
  );

  drawingContext.shadowBlur = 7;

  drawingContext.shadowColor =
    "rgba(25,90,225,0.32)";

  // ----------------------------------------------------------
  // BEAM DEFORMATION
  // ----------------------------------------------------------

  beginShape();

  const samples = 40;

  const uxA =
    animatedDisplacement[0];

  const uyA =
    animatedDisplacement[1];

  const rzA =
    animatedDisplacement[2];

  const uxB =
    animatedDisplacement[3];

  const uyB =
    animatedDisplacement[4];

  const rzB =
    animatedDisplacement[5];

  for (
    let i = 0;
    i <= samples;
    i++
  ) {

    const xi =
      i / samples;

    const xLocal =
      xi * beamLength;

    const N1 =
      1 - xi;

    const N2 =
      xi;

    const H1 =
      1
      -
      3 * xi * xi
      +
      2 * xi * xi * xi;

    const H2 =
      beamLength
      *
      (
        xi
        -
        2 * xi * xi
        +
        xi * xi * xi
      );

    const H3 =
      3 * xi * xi
      -
      2 * xi * xi * xi;

    const H4 =
      beamLength
      *
      (
        -xi * xi
        +
        xi * xi * xi
      );

    const u =
      N1 * uxA
      +
      N2 * uxB;

    const v =
      H1 * uyA
      +
      H2 * rzA
      +
      H3 * uyB
      +
      H4 * rzB;

    const point =
      toScreen(
        xLocal
        +
        deformationScale
        *
        u,

        deformationScale
        *
        v,

        panelX,
        panelWidth
      );

    vertex(
      point.x,
      point.y
    );
  }

  endShape();

  // ----------------------------------------------------------
  // BAR DEFORMATION
  // ----------------------------------------------------------

  if (barActive) {

    const deformedB =
      toScreen(
        nodes[1].x
        +
        deformationScale
        *
        animatedDisplacement[3],

        nodes[1].y
        +
        deformationScale
        *
        animatedDisplacement[4],

        panelX,
        panelWidth
      );

    const deformedC =
      toScreen(
        nodes[2].x
        +
        deformationScale
        *
        animatedDisplacement[6],

        nodes[2].y
        +
        deformationScale
        *
        animatedDisplacement[7],

        panelX,
        panelWidth
      );

    line(
      deformedC.x,
      deformedC.y,
      deformedB.x,
      deformedB.y
    );
  }

  drawingContext.shadowBlur = 0;

  drawingContext.setLineDash([]);

  pop();
}


// ============================================================
// FORCE OVERLAYS
// ============================================================

function drawForceOverlays(
  panelX,
  panelWidth
) {

  // The calculated no-bar reference stays visible even if
  // the current pinned/no-bar arrangement is a mechanism.
  if (showMoment) {

    drawReferenceMoment(
      panelX,
      panelWidth
    );
  }

  if (
    !structureStable
  ) {

    return;
  }

  if (showAxial) {

    drawCurrentAxial(
      panelX,
      panelWidth
    );
  }

  if (showShear) {

    drawCurrentShear(
      panelX,
      panelWidth
    );
  }

  if (showMoment) {

    drawCurrentMoment(
      panelX,
      panelWidth
    );
  }
}


// ============================================================
// COMMON FORCE-DIAGRAM SCALE
//
// Current and reference moments use the same scale.
// ============================================================

function getForceScales() {

  const referenceMoment =
    max(
      abs(
        referenceResults.momentA
      ),

      abs(
        referenceResults.momentB
      ),

      1e-12
    );

  const referenceShear =
    max(
      abs(
        referenceResults.beamV
      ),

      1e-12
    );

  const axialReference =
    max(
      abs(
        currentResults.beamN
      ),

      abs(
        currentResults.barN
      ),

      unitLoad,

      1e-12
    );

  return {

    moment:
      64
      /
      referenceMoment,

    shear:
      34
      /
      referenceShear,

    axial:
      25
      /
      axialReference

  };
}


// ============================================================
// REFERENCE MOMENT WITHOUT BAR
//
// Calculated from the FEM system with:
// - bar OFF
// - beam support FIXED
// ============================================================

function drawReferenceMoment(
  panelX,
  panelWidth
) {

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  const scales =
    getForceScales();

  const offsetA =
    referenceResults.momentA
    *
    scales.moment;

  const offsetB =
    referenceResults.momentB
    *
    scales.moment;

  push();

  noFill();

  stroke(
    COL_MOMENT[0],
    COL_MOMENT[1],
    COL_MOMENT[2],
    95
  );

  strokeWeight(1.5);

  drawingContext.setLineDash(
    [
      6,
      5
    ]
  );

  // Dashed reference boundary
  beginShape();

  vertex(
    points.A.x,
    points.A.y - offsetA
  );

  vertex(
    points.B.x,
    points.B.y - offsetB
  );

  endShape();

  // Closing reference lines
  line(
    points.A.x,
    points.A.y,
    points.A.x,
    points.A.y - offsetA
  );

  line(
    points.B.x,
    points.B.y,
    points.B.x,
    points.B.y - offsetB
  );

  drawingContext.setLineDash([]);

  pop();

  // ----------------------------------------------------------
  // CALCULATED REFERENCE VALUE
  // ----------------------------------------------------------

  noStroke();

  fill(
    COL_MOMENT[0],
    COL_MOMENT[1],
    COL_MOMENT[2],
    132
  );

  fontSize(FS_TINY);

  textAlign(
    LEFT,
    BOTTOM
  );

  text(
    `M₀ = ${formatForceValue(
      max(
        abs(
          referenceResults.momentA
        ),

        abs(
          referenceResults.momentB
        )
      )
    )} Nmm`,

    points.A.x + 5,

    points.A.y
    -
    offsetA
    -
    4
  );
}


// ============================================================
// CURRENT CALCULATED MOMENT
//
// If the bar is off, the dashed reference already represents
// the current fixed-beam result. Therefore, no duplicate solid
// diagram is drawn.
//
// If the bar is active, the smaller current moment is drawn as
// a transparent solid shape using the same diagram scale.
// ============================================================

function drawCurrentMoment(
  panelX,
  panelWidth
) {

  if (
    !barActive
  ) {

    return;
  }

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  const scales =
    getForceScales();

  const offsetA =
    currentResults.momentA
    *
    scales.moment;

  const offsetB =
    currentResults.momentB
    *
    scales.moment;

  const maximumCurrentMoment =
    max(
      abs(
        currentResults.momentA
      ),

      abs(
        currentResults.momentB
      )
    );

  // ----------------------------------------------------------
  // MOMENT IS ESSENTIALLY ZERO
  // ----------------------------------------------------------

  if (
    maximumCurrentMoment
    <
    1e-8
  ) {

    drawZeroDiagram(
      points.A.x,
      points.A.y + 39,
      points.B.x,
      points.B.y + 39,
      COL_MOMENT
    );

    noStroke();

    fill(...COL_MOMENT);

    fontSize(FS_TINY);

    textAlign(
      LEFT,
      BOTTOM
    );

    text(
      "M ≈ 0 Nmm",
      points.A.x + 5,
      points.A.y - 7
    );

    return;
  }

  // ----------------------------------------------------------
  // SOLID CURRENT MOMENT DIAGRAM
  // ----------------------------------------------------------

  push();

  fill(
    COL_MOMENT[0],
    COL_MOMENT[1],
    COL_MOMENT[2],
    68
  );

  stroke(...COL_MOMENT);

  strokeWeight(1.9);

  beginShape();

  vertex(
    points.A.x,
    points.A.y
  );

  vertex(
    points.B.x,
    points.B.y
  );

  vertex(
    points.B.x,
    points.B.y - offsetB
  );

  vertex(
    points.A.x,
    points.A.y - offsetA
  );

  endShape(CLOSE);

  pop();

  // ----------------------------------------------------------
  // CALCULATED CURRENT VALUE
  // ----------------------------------------------------------

  noStroke();

  fill(...COL_MOMENT);

  fontSize(FS_TINY);

  textAlign(
    LEFT,
    BOTTOM
  );

  const textY =
    maximumCurrentMoment
    <
    0.08
    *
    max(
      abs(
        referenceResults.momentA
      ),
      1e-12
    )

      ? points.A.y - 8

      : points.A.y
        -
        offsetA
        -
        4;

  text(
    `M = ${formatForceValue(
      maximumCurrentMoment
    )} Nmm`,

    points.A.x + 5,

    textY
  );
}


// ============================================================
// CURRENT SHEAR
// ============================================================

function drawCurrentShear(
  panelX,
  panelWidth
) {

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  const scales =
    getForceScales();

  const offset =
    currentResults.beamV
    *
    scales.shear;

  if (
    abs(
      currentResults.beamV
    )
    <
    1e-10
  ) {

    drawZeroDiagram(
      points.A.x,
      points.A.y + 25,
      points.B.x,
      points.B.y + 25,
      COL_SHEAR
    );

    return;
  }

  push();

  fill(
    COL_SHEAR[0],
    COL_SHEAR[1],
    COL_SHEAR[2],
    48
  );

  stroke(...COL_SHEAR);

  strokeWeight(1.7);

  beginShape();

  vertex(
    points.A.x,
    points.A.y
  );

  vertex(
    points.B.x,
    points.B.y
  );

  vertex(
    points.B.x,
    points.B.y - offset
  );

  vertex(
    points.A.x,
    points.A.y - offset
  );

  endShape(CLOSE);

  pop();
}


// ============================================================
// CURRENT AXIAL FORCE
// ============================================================

function drawCurrentAxial(
  panelX,
  panelWidth
) {

  const points =
    getPanelPoints(
      panelX,
      panelWidth
    );

  const scales =
    getForceScales();

  // ----------------------------------------------------------
  // BEAM AXIAL FORCE
  // ----------------------------------------------------------

  if (
    abs(
      currentResults.beamN
    )
    >
    1e-10
  ) {

    const offset =
      currentResults.beamN
      *
      scales.axial;

    push();

    fill(
      COL_AXIAL[0],
      COL_AXIAL[1],
      COL_AXIAL[2],
      52
    );

    stroke(...COL_AXIAL);

    strokeWeight(1.7);

    beginShape();

    vertex(
      points.A.x,
      points.A.y
    );

    vertex(
      points.B.x,
      points.B.y
    );

    vertex(
      points.B.x,
      points.B.y - offset
    );

    vertex(
      points.A.x,
      points.A.y - offset
    );

    endShape(CLOSE);

    pop();
  }

  else {

    drawZeroDiagram(
      points.A.x,
      points.A.y - 15,
      points.B.x,
      points.B.y - 15,
      COL_AXIAL
    );
  }

  // ----------------------------------------------------------
  // BAR AXIAL FORCE
  // ----------------------------------------------------------

  if (
    barActive
    &&
    abs(
      currentResults.barN
    )
    >
    1e-10
  ) {

    const dx =
      points.B.x
      -
      points.C.x;

    const dy =
      points.B.y
      -
      points.C.y;

    const length =
      sqrt(
        dx * dx
        +
        dy * dy
      );

    const normalX =
      -dy / length;

    const normalY =
      dx / length;

    const offset =
      currentResults.barN
      *
      scales.axial;

    const offsetCX =
      points.C.x
      +
      normalX
      *
      offset;

    const offsetCY =
      points.C.y
      +
      normalY
      *
      offset;

    const offsetBX =
      points.B.x
      +
      normalX
      *
      offset;

    const offsetBY =
      points.B.y
      +
      normalY
      *
      offset;

    push();

    fill(
      COL_AXIAL[0],
      COL_AXIAL[1],
      COL_AXIAL[2],
      62
    );

    stroke(...COL_AXIAL);

    strokeWeight(1.8);

    beginShape();

    vertex(
      points.C.x,
      points.C.y
    );

    vertex(
      points.B.x,
      points.B.y
    );

    vertex(
      offsetBX,
      offsetBY
    );

    vertex(
      offsetCX,
      offsetCY
    );

    endShape(CLOSE);

    pop();
  }

  else {

    drawZeroDiagram(
      points.C.x,
      points.C.y,
      points.B.x,
      points.B.y,
      COL_AXIAL
    );
  }
}


// ============================================================
// ZERO / INACTIVE FORCE LINE
// ============================================================

function drawZeroDiagram(
  x1,
  y1,
  x2,
  y2,
  colourArray
) {

  push();

  noFill();

  stroke(
    colourArray[0],
    colourArray[1],
    colourArray[2],
    140
  );

  strokeWeight(1.2);

  drawingContext.setLineDash(
    [
      5,
      4
    ]
  );

  line(
    x1,
    y1,
    x2,
    y2
  );

  drawingContext.setLineDash([]);

  pop();
}


// ============================================================
// LEGEND
// ============================================================

function drawLegend() {

  const y =
    panelY
    +
    panelH
    -
    13;

  drawLegendItem(
    rightPanelX + 11,
    y,
    "N",
    COL_AXIAL
  );

  drawLegendItem(
    rightPanelX + 68,
    y,
    "V",
    COL_SHEAR
  );

  drawLegendItem(
    rightPanelX + 125,
    y,
    "M",
    COL_MOMENT
  );

  push();

  stroke(
    COL_MOMENT[0],
    COL_MOMENT[1],
    COL_MOMENT[2],
    115
  );

  strokeWeight(1.3);

  drawingContext.setLineDash(
    [
      5,
      4
    ]
  );

  line(
    rightPanelX + 180,
    y,
    rightPanelX + 202,
    y
  );

  drawingContext.setLineDash([]);

  pop();

  noStroke();

  fill(75);

  fontSize(FS_TINY);

  textAlign(
    LEFT,
    CENTER
  );

  text(
    "M₀",
    rightPanelX + 207,
    y
  );
}


function drawLegendItem(
  x,
  y,
  label,
  colourArray
) {

  stroke(...colourArray);

  strokeWeight(2.2);

  line(
    x,
    y,
    x + 21,
    y
  );

  noStroke();

  fill(70);

  fontSize(FS_TINY);

  textAlign(
    LEFT,
    CENTER
  );

  text(
    label,
    x + 26,
    y
  );
}


// ============================================================
// RESET BUTTON
// ============================================================

function drawResetButton() {

  fill(
    hoverReset
      ? color(
          222,
          233,
          249
        )
      : color(244)
  );

  stroke(
    hoverReset
      ? color(...COL_BLUE)
      : color(170)
  );

  strokeWeight(0.75);

  rect(
    resetX,
    resetY,
    resetW,
    resetH,
    4
  );

  noStroke();

  fill(
    hoverReset
      ? color(...COL_BLUE)
      : color(70)
  );

  fontSize(FS_TINY);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    "Reset",
    resetX + resetW / 2,
    resetY + resetH / 2
  );
}


// ============================================================
// RESULT BUTTONS
// ============================================================

function drawResultButtons() {

  drawResultButton(
    axialButtonX,
    "N",
    showAxial,
    hoverAxial,
    COL_AXIAL
  );

  drawResultButton(
    shearButtonX,
    "V",
    showShear,
    hoverShear,
    COL_SHEAR
  );

  drawResultButton(
    momentButtonX,
    "M",
    showMoment,
    hoverMoment,
    COL_MOMENT
  );
}


function drawResultButton(
  x,
  label,
  active,
  hovered,
  colourArray
) {

  if (active) {

    fill(
      colourArray[0],
      colourArray[1],
      colourArray[2],
      hovered
        ? 85
        : 57
    );

    stroke(...colourArray);
  }

  else {

    fill(
      hovered
        ? 237
        : 247
    );

    stroke(
      colourArray[0],
      colourArray[1],
      colourArray[2],
      155
    );
  }

  strokeWeight(0.8);

  rect(
    x,
    resultButtonY,
    resultButtonW,
    resultButtonH,
    4
  );

  noStroke();

  fill(60);

  fontSize(FS_TINY);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    label,
    x + resultButtonW / 2,
    resultButtonY + resultButtonH / 2
  );
}


// ============================================================
// INSTRUCTIONS
// ============================================================

function drawInstruction() {

  noStroke();

  fill(72);

  fontSize(FS_SMALL);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    "Click the diagonal bar to add/remove it • Click the beam support to toggle fixed/pinned • N, V and M control the overlays",
    W / 2,
    375
  );

  fill(105);

  fontSize(FS_TINY);

  text(
    "Light dashed purple = calculated no-bar moment M₀ • Solid purple = calculated current moment M",
    W / 2,
    392
  );
}


// ============================================================
// REFERENCE SOLUTION
//
// Always calculated as:
// - diagonal bar OFF
// - beam support FIXED
// ============================================================

function calculateReferenceResults() {

  const solution =
    solveSystem(
      false,
      "fixed"
    );

  if (
    solution.success
  ) {

    referenceResults =
      extractForceResults(
        solution.displacement,
        false
      );
  }
}


// ============================================================
// CURRENT SOLUTION
// ============================================================

function solveCurrentStructure() {

  const solution =
    solveSystem(
      barActive,
      beamSupport
    );

  structureStable =
    solution.success;

  if (
    !solution.success
  ) {

    targetDisplacement =
      new Array(
        NDOF
      ).fill(0);

    currentResults = {

      beamN: 0,

      beamV: 0,

      momentA: 0,

      momentB: 0,

      barN: 0

    };

    return;
  }

  targetDisplacement =
    solution.displacement;

  currentResults =
    extractForceResults(
      solution.displacement,
      barActive
    );
}


// ============================================================
// ASSEMBLE AND SOLVE SYSTEM
// ============================================================

function solveSystem(
  includeBar,
  supportType
) {

  const K =
    zerosMatrix(
      NDOF,
      NDOF
    );

  const F =
    new Array(
      NDOF
    ).fill(0);

  // Unit downward load at B.
  F[4] =
    -unitLoad;

  // ----------------------------------------------------------
  // BEAM AB
  // ----------------------------------------------------------

  const beamK =
    localFrameStiffness(
      E,
      beamArea,
      beamInertia,
      beamLength
    );

  assembleMatrix(
    K,
    beamK,
    [
      0,
      1,
      2,
      3,
      4,
      5
    ]
  );

  // ----------------------------------------------------------
  // DIAGONAL BAR CB
  // ----------------------------------------------------------

  if (includeBar) {

    const geometry =
      getBarGeometry();

    const barK =
      trussStiffness(
        E,
        barArea,
        geometry.length,
        geometry.c,
        geometry.s
      );

    assembleMatrix(
      K,
      barK,
      [
        6,
        7,
        3,
        4
      ]
    );
  }

  // ----------------------------------------------------------
  // BOUNDARY CONDITIONS
  // ----------------------------------------------------------

  const fixedDOFs = [

    // Upper support C
    6,
    7

  ];

  if (
    supportType === "fixed"
  ) {

    fixedDOFs.push(
      0,
      1,
      2
    );
  }

  else {

    // Pinned beam support:
    // horizontal and vertical movement restrained,
    // rotation released.
    fixedDOFs.push(
      0,
      1
    );
  }

  return solveReduced(
    K,
    F,
    fixedDOFs
  );
}


// ============================================================
// FORCE EXTRACTION
// ============================================================

function extractForceResults(
  displacement,
  includeBar
) {

  const beamK =
    localFrameStiffness(
      E,
      beamArea,
      beamInertia,
      beamLength
    );

  const beamDisplacement = [

    displacement[0],
    displacement[1],
    displacement[2],

    displacement[3],
    displacement[4],
    displacement[5]

  ];

  const beamForce =
    matVec(
      beamK,
      beamDisplacement
    );

  let barForce = 0;

  if (includeBar) {

    const geometry =
      getBarGeometry();

    const extension =
      geometry.c
      *
      (
        displacement[3]
        -
        displacement[6]
      )
      +
      geometry.s
      *
      (
        displacement[4]
        -
        displacement[7]
      );

    barForce =
      E
      *
      barArea
      /
      geometry.length
      *
      extension;
  }

  return {

    // Beam axial force at A
    beamN:
      beamForce[0],

    // Beam shear at A
    beamV:
      beamForce[1],

    // Beam end moment at A
    momentA:
      beamForce[2],

    // Internal end moment at B
    momentB:
      -beamForce[5],

    // Diagonal axial force
    barN:
      barForce

  };
}


// ============================================================
// BAR GEOMETRY
// ============================================================

function getBarGeometry() {

  const dx =
    nodes[1].x
    -
    nodes[2].x;

  const dy =
    nodes[1].y
    -
    nodes[2].y;

  const length =
    sqrt(
      dx * dx
      +
      dy * dy
    );

  return {

    length,

    c:
      dx / length,

    s:
      dy / length

  };
}


// ============================================================
// LOCAL FRAME STIFFNESS
// ============================================================

function localFrameStiffness(
  elasticModulus,
  area,
  inertia,
  length
) {

  const axial =
    elasticModulus
    *
    area
    /
    length;

  const EI =
    elasticModulus
    *
    inertia;

  const k1 =
    12
    *
    EI
    /
    pow(
      length,
      3
    );

  const k2 =
    6
    *
    EI
    /
    pow(
      length,
      2
    );

  const k3 =
    4
    *
    EI
    /
    length;

  const k4 =
    2
    *
    EI
    /
    length;

  return [

    [
      axial,
      0,
      0,
      -axial,
      0,
      0
    ],

    [
      0,
      k1,
      k2,
      0,
      -k1,
      k2
    ],

    [
      0,
      k2,
      k3,
      0,
      -k2,
      k4
    ],

    [
      -axial,
      0,
      0,
      axial,
      0,
      0
    ],

    [
      0,
      -k1,
      -k2,
      0,
      k1,
      -k2
    ],

    [
      0,
      k2,
      k4,
      0,
      -k2,
      k3
    ]

  ];
}


// ============================================================
// GLOBAL TRUSS STIFFNESS
// ============================================================

function trussStiffness(
  elasticModulus,
  area,
  length,
  c,
  s
) {

  const factor =
    elasticModulus
    *
    area
    /
    length;

  const c2 =
    c * c;

  const s2 =
    s * s;

  const cs =
    c * s;

  return [

    [
      factor * c2,
      factor * cs,
      -factor * c2,
      -factor * cs
    ],

    [
      factor * cs,
      factor * s2,
      -factor * cs,
      -factor * s2
    ],

    [
      -factor * c2,
      -factor * cs,
      factor * c2,
      factor * cs
    ],

    [
      -factor * cs,
      -factor * s2,
      factor * cs,
      factor * s2
    ]

  ];
}


// ============================================================
// REDUCED SYSTEM
// ============================================================

function solveReduced(
  K,
  F,
  fixedInput
) {

  const fixed =
    Array.from(
      new Set(
        fixedInput
      )
    ).sort(
      (a, b) =>
        a - b
    );

  const fixedSet =
    new Set(fixed);

  const free = [];

  for (
    let i = 0;
    i < NDOF;
    i++
  ) {

    if (
      !fixedSet.has(i)
    ) {

      free.push(i);
    }
  }

  const Kff =
    zerosMatrix(
      free.length,
      free.length
    );

  const Ff =
    new Array(
      free.length
    ).fill(0);

  for (
    let i = 0;
    i < free.length;
    i++
  ) {

    Ff[i] =
      F[
        free[i]
      ];

    for (
      let j = 0;
      j < free.length;
      j++
    ) {

      Kff[i][j] =
        K[
          free[i]
        ][
          free[j]
        ];
    }
  }

  const reduced =
    gaussianSolve(
      Kff,
      Ff
    );

  if (
    !reduced.success
  ) {

    return {

      success: false,

      displacement:
        new Array(
          NDOF
        ).fill(0)

    };
  }

  const displacement =
    new Array(
      NDOF
    ).fill(0);

  for (
    let i = 0;
    i < free.length;
    i++
  ) {

    displacement[
      free[i]
    ] =
      reduced.x[i];
  }

  return {

    success: true,

    displacement

  };
}


// ============================================================
// GAUSSIAN ELIMINATION
// ============================================================

function gaussianSolve(
  matrix,
  vector
) {

  const n =
    vector.length;

  if (
    n === 0
  ) {

    return {

      success: true,

      x: []

    };
  }

  const A =
    matrix.map(
      row =>
        row.slice()
    );

  const b =
    vector.slice();

  let maximumEntry = 0;

  for (
    let i = 0;
    i < n;
    i++
  ) {

    for (
      let j = 0;
      j < n;
      j++
    ) {

      maximumEntry =
        max(
          maximumEntry,
          abs(
            A[i][j]
          )
        );
    }
  }

  const tolerance =
    max(
      1e-10,
      maximumEntry
      *
      1e-12
    );

  for (
    let column = 0;
    column < n;
    column++
  ) {

    let pivotRow =
      column;

    let pivotMagnitude =
      abs(
        A[column][column]
      );

    for (
      let row = column + 1;
      row < n;
      row++
    ) {

      const candidate =
        abs(
          A[row][column]
        );

      if (
        candidate
        >
        pivotMagnitude
      ) {

        pivotMagnitude =
          candidate;

        pivotRow =
          row;
      }
    }

    if (
      pivotMagnitude
      <
      tolerance
    ) {

      return {

        success: false,

        x:
          new Array(
            n
          ).fill(0)

      };
    }

    if (
      pivotRow
      !==
      column
    ) {

      const temporaryRow =
        A[column];

      A[column] =
        A[pivotRow];

      A[pivotRow] =
        temporaryRow;

      const temporaryValue =
        b[column];

      b[column] =
        b[pivotRow];

      b[pivotRow] =
        temporaryValue;
    }

    for (
      let row = column + 1;
      row < n;
      row++
    ) {

      const factor =
        A[row][column]
        /
        A[column][column];

      A[row][column] = 0;

      for (
        let j = column + 1;
        j < n;
        j++
      ) {

        A[row][j] -=
          factor
          *
          A[column][j];
      }

      b[row] -=
        factor
        *
        b[column];
    }
  }

  const x =
    new Array(
      n
    ).fill(0);

  for (
    let i = n - 1;
    i >= 0;
    i--
  ) {

    let sum =
      b[i];

    for (
      let j = i + 1;
      j < n;
      j++
    ) {

      sum -=
        A[i][j]
        *
        x[j];
    }

    if (
      abs(
        A[i][i]
      )
      <
      tolerance
    ) {

      return {

        success: false,

        x:
          new Array(
            n
          ).fill(0)

      };
    }

    x[i] =
      sum
      /
      A[i][i];
  }

  return {

    success: true,

    x

  };
}


// ============================================================
// ANIMATION
// ============================================================

function updateAnimation() {

  const smoothing = 0.10;

  for (
    let i = 0;
    i < NDOF;
    i++
  ) {

    animatedDisplacement[i] =
      lerp(
        animatedDisplacement[i],
        targetDisplacement[i],
        smoothing
      );
  }
}


// ============================================================
// HOVER DETECTION
// ============================================================

function updateHoverState() {

  const left =
    getPanelPoints(
      leftPanelX,
      leftPanelW
    );

  const right =
    getPanelPoints(
      rightPanelX,
      rightPanelW
    );

  // ----------------------------------------------------------
  // BAR
  // ----------------------------------------------------------

  hoverLeftBar =
    pointToSegmentDistance(
      mouseX,
      mouseY,
      left.C.x,
      left.C.y,
      left.B.x,
      left.B.y
    )
    <=
    11;

  hoverRightBar =
    pointToSegmentDistance(
      mouseX,
      mouseY,
      right.C.x,
      right.C.y,
      right.B.x,
      right.B.y
    )
    <=
    11;

  // ----------------------------------------------------------
  // SUPPORT
  // ----------------------------------------------------------

  hoverLeftSupport =
    insideRect(
      mouseX,
      mouseY,
      left.A.x - 31,
      left.A.y - 27,
      37,
      54
    );

  hoverRightSupport =
    insideRect(
      mouseX,
      mouseY,
      right.A.x - 31,
      right.A.y - 27,
      37,
      54
    );

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  hoverReset =
    insideRect(
      mouseX,
      mouseY,
      resetX,
      resetY,
      resetW,
      resetH
    );

  // ----------------------------------------------------------
  // RESULT BUTTONS
  // ----------------------------------------------------------

  hoverAxial =
    insideRect(
      mouseX,
      mouseY,
      axialButtonX,
      resultButtonY,
      resultButtonW,
      resultButtonH
    );

  hoverShear =
    insideRect(
      mouseX,
      mouseY,
      shearButtonX,
      resultButtonY,
      resultButtonW,
      resultButtonH
    );

  hoverMoment =
    insideRect(
      mouseX,
      mouseY,
      momentButtonX,
      resultButtonY,
      resultButtonW,
      resultButtonH
    );

  if (
    hoverLeftBar
    ||
    hoverRightBar
    ||
    hoverLeftSupport
    ||
    hoverRightSupport
    ||
    hoverReset
    ||
    hoverAxial
    ||
    hoverShear
    ||
    hoverMoment
  ) {

    cursor(HAND);
  }

  else {

    cursor(ARROW);
  }
}


// ============================================================
// MOUSE
// ============================================================

function mousePressed() {

  if (
    hoverReset
  ) {

    resetModel();

    return;
  }

  if (
    hoverAxial
  ) {

    showAxial =
      !showAxial;

    return;
  }

  if (
    hoverShear
  ) {

    showShear =
      !showShear;

    return;
  }

  if (
    hoverMoment
  ) {

    showMoment =
      !showMoment;

    return;
  }

  if (
    hoverLeftBar
    ||
    hoverRightBar
  ) {

    barActive =
      !barActive;

    solveCurrentStructure();

    return;
  }

  if (
    hoverLeftSupport
    ||
    hoverRightSupport
  ) {

    beamSupport =
      beamSupport
      ===
      "fixed"

        ? "pinned"

        : "fixed";

    solveCurrentStructure();
  }
}


// ============================================================
// RESET
// ============================================================

function resetModel() {

  // Requested default: bar off.
  barActive = false;

  beamSupport = "fixed";

  showAxial = true;
  showShear = true;
  showMoment = true;

  targetDisplacement =
    new Array(
      NDOF
    ).fill(0);

  animatedDisplacement =
    new Array(
      NDOF
    ).fill(0);

  solveCurrentStructure();
}


// ============================================================
// SCREEN MAPPING
// ============================================================

function toScreen(
  x,
  y,
  panelX,
  panelWidth
) {

  const top =
    panelY + 32;

  const bottom =
    panelY
    +
    panelH
    -
    24;

  return {

    x:
      map(
        x,
        xMin,
        xMax,
        panelX + 6,
        panelX + panelWidth - 6
      ),

    y:
      map(
        y,
        yMin,
        yMax,
        bottom,
        top
      )

  };
}


function getPanelPoints(
  panelX,
  panelWidth
) {

  return {

    A:
      toScreen(
        nodes[0].x,
        nodes[0].y,
        panelX,
        panelWidth
      ),

    B:
      toScreen(
        nodes[1].x,
        nodes[1].y,
        panelX,
        panelWidth
      ),

    C:
      toScreen(
        nodes[2].x,
        nodes[2].y,
        panelX,
        panelWidth
      )

  };
}


// ============================================================
// ARROW
// ============================================================

function drawArrow(
  x1,
  y1,
  x2,
  y2,
  arrowColour,
  lineWeight
) {

  stroke(arrowColour);

  strokeWeight(lineWeight);

  line(
    x1,
    y1,
    x2,
    y2
  );

  const angle =
    atan2(
      y2 - y1,
      x2 - x1
    );

  push();

  translate(
    x2,
    y2
  );

  rotate(angle);

  fill(arrowColour);

  noStroke();

  triangle(
    0,
    0,
    -6,
    -3.2,
    -6,
    3.2
  );

  pop();
}


// ============================================================
// MATRIX HELPERS
// ============================================================

function zerosMatrix(
  rows,
  columns
) {

  return Array.from(
    {
      length: rows
    },

    () =>
      new Array(
        columns
      ).fill(0)
  );
}


function matVec(
  matrix,
  vector
) {

  const result =
    new Array(
      matrix.length
    ).fill(0);

  for (
    let i = 0;
    i < matrix.length;
    i++
  ) {

    let sum = 0;

    for (
      let j = 0;
      j < matrix[i].length;
      j++
    ) {

      sum +=
        matrix[i][j]
        *
        vector[j];
    }

    result[i] =
      sum;
  }

  return result;
}


function assembleMatrix(
  globalMatrix,
  elementMatrix,
  dof
) {

  for (
    let i = 0;
    i < dof.length;
    i++
  ) {

    for (
      let j = 0;
      j < dof.length;
      j++
    ) {

      globalMatrix[
        dof[i]
      ][
        dof[j]
      ] +=
        elementMatrix[i][j];
    }
  }
}


// ============================================================
// HIT TESTS
// ============================================================

function pointToSegmentDistance(
  px,
  py,
  x1,
  y1,
  x2,
  y2
) {

  const vx =
    x2 - x1;

  const vy =
    y2 - y1;

  const lengthSquared =
    vx * vx
    +
    vy * vy;

  if (
    lengthSquared
    <
    1e-14
  ) {

    return dist(
      px,
      py,
      x1,
      y1
    );
  }

  let t =
    (
      (
        px - x1
      )
      *
      vx
      +
      (
        py - y1
      )
      *
      vy
    )
    /
    lengthSquared;

  t =
    constrain(
      t,
      0,
      1
    );

  const closestX =
    x1
    +
    t
    *
    vx;

  const closestY =
    y1
    +
    t
    *
    vy;

  return dist(
    px,
    py,
    closestX,
    closestY
  );
}


function insideRect(
  x,
  y,
  rx,
  ry,
  rw,
  rh
) {

  return (
    x >= rx
    &&
    x <= rx + rw
    &&
    y >= ry
    &&
    y <= ry + rh
  );
}


// ============================================================
// RESULT-VALUE FORMATTING
// ============================================================

function formatForceValue(
  value
) {

  const magnitude =
    abs(value);

  if (
    magnitude
    <
    1e-8
  ) {

    return "0";
  }

  if (
    magnitude
    >=
    1000
  ) {

    return value.toFixed(0);
  }

  if (
    magnitude
    >=
    100
  ) {

    return value.toFixed(1);
  }

  if (
    magnitude
    >=
    1
  ) {

    return value.toFixed(2);
  }

  if (
    magnitude
    >=
    0.01
  ) {

    return value.toFixed(3);
  }

  return value.toExponential(2);
}