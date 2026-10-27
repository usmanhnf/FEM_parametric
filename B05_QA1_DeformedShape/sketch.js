// ============================================================
// INTERACTIVE FEM: FRAME, BEAM AND TRUSS
//
// Left-click member:
//   distributed load: +q -> -q -> off
//
// Right-click:
//   Frame: point load at existing nodes
//   Beam: point load anywhere along either span
//   Truss: point load at existing nodes
//
// Point-load cycle:
//   +Fx -> -Fx -> +Fy -> -Fy ->
//   +Fx+Fy -> -Fx-Fy -> +Fx-Fy -> -Fx+Fy -> off
//
// Left-click support symbol:
//   Frame/beam: fixed -> hinged -> roller -> fixed
//   Truss end supports: hinged <-> roller
// ============================================================


// ============================================================
// CANVAS AND TYPOGRAPHY
// ============================================================

const W = 700;
const H = 420;

const FS_BASE = 10;
const FS_SMALL = 9;
const FS_TINY = 8;


// ============================================================
// PROPERTIES: N AND mm
// ============================================================

const E = 2.10e5;

const FRAME_A = 6000;
const FRAME_I = 8.0e7;

const TRUSS_A = 3500;

const nodalLoadMagnitude = 30000;
const memberLoadMagnitude = 12;


// ============================================================
// DEFORMATION SCALES
// ============================================================

const frameDeformationScale = 100;
const beamDeformationScale = 250;
const trussDeformationScale = 800;


// ============================================================
// COLOURS
// ============================================================

const COL_MEMBER = [55, 65, 75];
const COL_BLUE = [25, 90, 225];
const COL_RED = [230, 40, 35];
const COL_GREEN = [45, 115, 65];


// ============================================================
// LAYOUT
// ============================================================

const plotX = 18;
const plotY = 16;
const plotW = 664;
const plotH = 300;

const selectorY = 330;
const selectorH = 30;

const instructionY = 383;


// ============================================================
// ACTIVE STRUCTURE
// ============================================================

let activeStructure = "frame";


// ============================================================
// FRAME
// ============================================================

const frameStructure = {

  type: "frame",

  deformationScale: frameDeformationScale,

  xMin: -900,
  xMax: 5900,

  yMin: -500,
  yMax: 3700,

  nodes: [

    {
      x: 0,
      y: 0,
      support: "fixed",
      loadState: 0
    },

    {
      x: 0,
      y: 3000,
      support: "none",
      loadState: 0
    },

    {
      x: 5000,
      y: 3000,
      support: "none",
      loadState: 0
    },

    {
      x: 5000,
      y: 0,
      support: "roller",
      loadState: 0
    }

  ],

  members: [

    {
      ni: 0,
      nj: 1,
      loadState: 0
    },

    {
      ni: 1,
      nj: 2,
      loadState: 0
    },

    {
      ni: 2,
      nj: 3,
      loadState: 0
    }

  ]

};


// ============================================================
// TWO-SPAN BEAM
//
// Right-click locations become true internal FEM nodes.
// ============================================================

const beamStructure = {

  type: "beam",

  deformationScale: beamDeformationScale,

  xMin: -700,
  xMax: 6700,

  yMin: -1500,
  yMax: 1500,

  nodes: [

    {
      x: 0,
      y: 0,
      support: "hinged",
      loadState: 0
    },

    {
      x: 3000,
      y: 0,
      support: "roller",
      loadState: 0
    },

    {
      x: 6000,
      y: 0,
      support: "roller",
      loadState: 0
    }

  ],

  members: [

    {
      ni: 0,
      nj: 1,
      loadState: 0
    },

    {
      ni: 1,
      nj: 2,
      loadState: 0
    }

  ],

  pointLoads: []

};


// ============================================================
// TRUSS
// ============================================================

const trussStructure = {

  type: "truss",

  deformationScale: trussDeformationScale,

  xMin: -650,
  xMax: 6650,

  yMin: -500,
  yMax: 3000,

  nodes: [

    {
      x: 0,
      y: 0,
      support: "hinged",
      loadState: 0,
      supportEditable: true
    },

    {
      x: 2000,
      y: 0,
      support: "none",
      loadState: 0,
      supportEditable: false
    },

    {
      x: 4000,
      y: 0,
      support: "none",
      loadState: 0,
      supportEditable: false
    },

    {
      x: 6000,
      y: 0,
      support: "roller",
      loadState: 0,
      supportEditable: true
    },

    {
      x: 1000,
      y: 2200,
      support: "none",
      loadState: 0,
      supportEditable: false
    },

    {
      x: 3000,
      y: 2300,
      support: "none",
      loadState: 0,
      supportEditable: false
    },

    {
      x: 5000,
      y: 2400,
      support: "none",
      loadState: 0,
      supportEditable: false
    }

  ],

  members: [

    { ni: 0, nj: 1 },
    { ni: 1, nj: 2 },
    { ni: 2, nj: 3 },

    { ni: 4, nj: 5 },
    { ni: 5, nj: 6 },

    { ni: 1, nj: 4 },
    { ni: 2, nj: 5 },

    { ni: 0, nj: 4 },
    { ni: 6, nj: 3 },

    { ni: 1, nj: 5 },
    { ni: 2, nj: 6 }

  ]

};


// ============================================================
// SOLUTION STATE
// ============================================================

let targetDisplacements = [];
let animatedDisplacements = [];
let reactions = [];

let solvedNodes = [];
let solvedMembers = [];

let structureStable = true;
let solverMessage = "";


// ============================================================
// HOVER STATE
// ============================================================

let hoveredNode = -1;
let hoveredMember = -1;
let hoveredSupport = -1;
let hoveredSelector = "";
let hoveredReset = false;

let pulsePhase = 0;


// ============================================================
// SETUP
// ============================================================

function setup() {

  const canvas = createCanvas(W, H);

  canvas.elt.oncontextmenu = function () {
    return false;
  };

  pixelDensity(2);

  textFont("Anaheim");

  strokeCap(ROUND);
  strokeJoin(ROUND);

  solveCurrentStructure();
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  background(255);

  pulsePhase += 0.055;

  updateHoverState();
  updateAnimatedDisplacement();

  const structure = getCurrentStructure();

  drawPlotBackground();
  drawGrid(structure);

  if (structure.type !== "truss") {
    drawMemberLoads(structure);
  }

  drawPointLoads(structure);
  drawUndeformedStructure(structure);
  drawDeformedStructure(structure);
  drawNodes(structure);
  drawSupports(structure);
  drawLegend(structure);
  drawStatus();
  drawModelSelector();
  drawBottomInstruction();
}


// ============================================================
// CURRENT STRUCTURE
// ============================================================

function getCurrentStructure() {

  if (activeStructure === "beam") {
    return beamStructure;
  }

  if (activeStructure === "truss") {
    return trussStructure;
  }

  return frameStructure;
}


// ============================================================
// FONT
// ============================================================

function fontSize(sizeValue) {

  textFont("Anaheim");
  textSize(sizeValue);
}


// ============================================================
// BACKGROUND
// ============================================================

function drawPlotBackground() {

  noStroke();

  fill(250, 252, 254);

  rect(
    plotX,
    plotY,
    plotW,
    plotH,
    5
  );

  noFill();

  stroke(215, 220, 225);
  strokeWeight(0.7);

  rect(
    plotX,
    plotY,
    plotW,
    plotH,
    5
  );
}


// ============================================================
// GRID
// ============================================================

function drawGrid(structure) {

  push();

  stroke(55, 195, 210, 25);
  strokeWeight(0.55);

  const spacing = 500;

  const xStart =
    ceil(structure.xMin / spacing) * spacing;

  const xEnd =
    floor(structure.xMax / spacing) * spacing;

  const yStart =
    ceil(structure.yMin / spacing) * spacing;

  const yEnd =
    floor(structure.yMax / spacing) * spacing;

  for (
    let x = xStart;
    x <= xEnd;
    x += spacing
  ) {

    const p = structureToScreen(
      x,
      0,
      structure
    );

    line(
      p.x,
      plotY,
      p.x,
      plotY + plotH
    );
  }

  for (
    let y = yStart;
    y <= yEnd;
    y += spacing
  ) {

    const p = structureToScreen(
      0,
      y,
      structure
    );

    line(
      plotX,
      p.y,
      plotX + plotW,
      p.y
    );
  }

  pop();
}


// ============================================================
// UNDEFORMED STRUCTURE
// ============================================================

function drawUndeformedStructure(structure) {

  for (
    let e = 0;
    e < structure.members.length;
    e++
  ) {

    const member = structure.members[e];

    const p1 = structureToScreen(
      structure.nodes[member.ni].x,
      structure.nodes[member.ni].y,
      structure
    );

    const p2 = structureToScreen(
      structure.nodes[member.nj].x,
      structure.nodes[member.nj].y,
      structure
    );

    const active =
      e === hoveredMember;

    drawGlowLine(
      p1.x,
      p1.y,
      p2.x,
      p2.y,

      active
        ? color(...COL_BLUE)
        : color(...COL_MEMBER),

      active
        ? 3
        : 2.2,

      active
        ? 35
        : 12
    );
  }
}


// ============================================================
// NODES
// ============================================================

function drawNodes(structure) {

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const node = structure.nodes[n];

    const p = structureToScreen(
      node.x,
      node.y,
      structure
    );

    const active =
      n === hoveredNode;

    const pulse =
      active
        ? 0.5 + 0.5 * sin(pulsePhase)
        : 0;

    if (active) {

      noFill();

      stroke(
        COL_BLUE[0],
        COL_BLUE[1],
        COL_BLUE[2],
        70 - 40 * pulse
      );

      strokeWeight(1.2);

      circle(
        p.x,
        p.y,
        19 + 9 * pulse
      );
    }

    noStroke();

    fill(
      COL_BLUE[0],
      COL_BLUE[1],
      COL_BLUE[2],
      active ? 55 : 25
    );

    circle(
      p.x,
      p.y,
      active ? 15 : 12
    );

    fill(255);
    stroke(...COL_BLUE);

    strokeWeight(
      active ? 1.6 : 1.2
    );

    circle(
      p.x,
      p.y,
      active ? 10 : 8
    );

    noStroke();
    fill(...COL_BLUE);

    circle(
      p.x,
      p.y,
      active ? 4.5 : 3.5
    );
  }

  if (structure.type === "beam") {

    for (
      const pointLoad
      of structure.pointLoads
    ) {

      const p = structureToScreen(
        pointLoad.x,
        0,
        structure
      );

      noStroke();

      fill(
        COL_RED[0],
        COL_RED[1],
        COL_RED[2],
        45
      );

      circle(
        p.x,
        p.y,
        14
      );

      fill(255);
      stroke(...COL_RED);
      strokeWeight(1.2);

      circle(
        p.x,
        p.y,
        7
      );
    }
  }
}


// ============================================================
// SUPPORTS
// ============================================================

function drawSupports(structure) {

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const node = structure.nodes[n];

    if (node.support === "none") {
      continue;
    }

    const p = structureToScreen(
      node.x,
      node.y,
      structure
    );

    const active =
      n === hoveredSupport;

    if (active) {

      noStroke();

      fill(
        COL_BLUE[0],
        COL_BLUE[1],
        COL_BLUE[2],
        20
      );

      circle(
        p.x,
        p.y + 22,
        43
      );
    }

    if (node.support === "fixed") {

      drawFixedSupport(
        p.x,
        p.y,
        active
      );
    }

    else if (node.support === "hinged") {

      drawHingedSupport(
        p.x,
        p.y,
        active
      );
    }

    else {

      drawRollerSupport(
        p.x,
        p.y,
        active
      );
    }
  }
}


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
    active ? 1.6 : 1
  );

  line(
    x - 15,
    y + 5,
    x + 15,
    y + 5
  );

  for (
    let dx = -14;
    dx <= 17;
    dx += 6
  ) {

    line(
      x + dx,
      y + 5,
      x + dx - 5,
      y + 12
    );
  }

  pop();
}


function drawHingedSupport(
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
    active ? 1.6 : 1
  );

  triangle(
    x,
    y + 3,
    x - 12,
    y + 21,
    x + 12,
    y + 21
  );

  line(
    x - 16,
    y + 22,
    x + 16,
    y + 22
  );

  for (
    let dx = -14;
    dx <= 17;
    dx += 6
  ) {

    line(
      x + dx,
      y + 22,
      x + dx - 5,
      y + 28
    );
  }

  pop();
}


function drawRollerSupport(
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
    active ? 1.6 : 1
  );

  triangle(
    x,
    y + 3,
    x - 12,
    y + 18,
    x + 12,
    y + 18
  );

  circle(
    x - 7,
    y + 22,
    6
  );

  circle(
    x + 7,
    y + 22,
    6
  );

  line(
    x - 17,
    y + 27,
    x + 17,
    y + 27
  );

  pop();
}


// ============================================================
// MEMBER LOADS
// ============================================================

function drawMemberLoads(structure) {

  for (
    const member
    of structure.members
  ) {

    if (member.loadState === 0) {
      continue;
    }

    const nodeI =
      structure.nodes[member.ni];

    const nodeJ =
      structure.nodes[member.nj];

    const dx =
      nodeJ.x - nodeI.x;

    const dy =
      nodeJ.y - nodeI.y;

    const L =
      sqrt(dx * dx + dy * dy);

    const c = dx / L;
    const s = dy / L;

    const loadX =
      -s * member.loadState;

    const loadY =
      c * member.loadState;

    for (
      let k = 1;
      k <= 7;
      k++
    ) {

      const t = k / 8;

      drawPhysicalLoadArrow(
        nodeI.x + t * dx,
        nodeI.y + t * dy,
        loadX,
        loadY,
        structure,
        28,
        10
      );
    }
  }
}


// ============================================================
// POINT LOADS
// ============================================================

function drawPointLoads(structure) {

  for (
    const node
    of structure.nodes
  ) {

    drawPointLoadAt(
      node.x,
      node.y,
      nodalLoadFromState(
        node.loadState
      ),
      structure
    );
  }

  if (structure.type === "beam") {

    for (
      const pointLoad
      of structure.pointLoads
    ) {

      drawPointLoadAt(
        pointLoad.x,
        0,
        nodalLoadFromState(
          pointLoad.loadState
        ),
        structure
      );
    }
  }
}


function drawPointLoadAt(
  x,
  y,
  load,
  structure
) {

  if (load.fx !== 0) {

    drawPhysicalLoadArrow(
      x,
      y,
      Math.sign(load.fx),
      0,
      structure,
      42,
      8
    );
  }

  if (load.fy !== 0) {

    drawPhysicalLoadArrow(
      x,
      y,
      0,
      Math.sign(load.fy),
      structure,
      42,
      8
    );
  }
}


function drawPhysicalLoadArrow(
  x,
  y,
  dx,
  dy,
  structure,
  arrowLength,
  gap
) {

  const p = structureToScreen(
    x,
    y,
    structure
  );

  const scaleX =
    plotW /
    (
      structure.xMax -
      structure.xMin
    );

  const scaleY =
    plotH /
    (
      structure.yMax -
      structure.yMin
    );

  const screenDX =
    dx * scaleX;

  const screenDY =
    -dy * scaleY;

  const magnitude =
    sqrt(
      screenDX * screenDX +
      screenDY * screenDY
    );

  if (magnitude < 1e-12) {
    return;
  }

  const ux =
    screenDX / magnitude;

  const uy =
    screenDY / magnitude;

  drawArrow(
    p.x - ux * (gap + arrowLength),
    p.y - uy * (gap + arrowLength),

    p.x - ux * gap,
    p.y - uy * gap,

    color(...COL_RED),
    1.4
  );
}


// ============================================================
// BLUE DEFORMED STRUCTURE
// ============================================================

function drawDeformedStructure(structure) {

  if (!structureStable) {
    return;
  }

  push();

  noFill();

  stroke(...COL_BLUE);
  strokeWeight(2.5);

  drawingContext.setLineDash(
    [9, 5]
  );

  drawingContext.shadowBlur = 8;

  drawingContext.shadowColor =
    "rgba(25,90,225,0.38)";

  if (structure.type === "truss") {
    drawDeformedTruss(structure);
  }

  else {
    drawDeformedFrameOrBeam(structure);
  }

  drawingContext.shadowBlur = 0;
  drawingContext.setLineDash([]);

  pop();
}


function drawDeformedFrameOrBeam(
  structure
) {

  for (
    const member
    of solvedMembers
  ) {

    const nodeI =
      solvedNodes[member.ni];

    const nodeJ =
      solvedNodes[member.nj];

    const dx =
      nodeJ.x - nodeI.x;

    const dy =
      nodeJ.y - nodeI.y;

    const L =
      sqrt(dx * dx + dy * dy);

    const c = dx / L;
    const s = dy / L;

    const dof = [
      3 * member.ni,
      3 * member.ni + 1,
      3 * member.ni + 2,
      3 * member.nj,
      3 * member.nj + 1,
      3 * member.nj + 2
    ];

    const globalDisplacement =
      dof.map(
        index =>
          animatedDisplacements[index] || 0
      );

    const T =
      transformationMatrix(c, s);

    const localDisplacement =
      matVec(
        T,
        globalDisplacement
      );

    beginShape();

    for (
      let k = 0;
      k <= 28;
      k++
    ) {

      const xi = k / 28;
      const xLocal = xi * L;

      const N1 = 1 - xi;
      const N2 = xi;

      const H1 =
        1 - 3 * xi * xi +
        2 * xi * xi * xi;

      const H2 =
        L *
        (
          xi -
          2 * xi * xi +
          xi * xi * xi
        );

      const H3 =
        3 * xi * xi -
        2 * xi * xi * xi;

      const H4 =
        L *
        (
          -xi * xi +
          xi * xi * xi
        );

      const uLocal =
        N1 * localDisplacement[0] +
        N2 * localDisplacement[3];

      const vLocal =
        H1 * localDisplacement[1] +
        H2 * localDisplacement[2] +
        H3 * localDisplacement[4] +
        H4 * localDisplacement[5];

      const x0 =
        nodeI.x + c * xLocal;

      const y0 =
        nodeI.y + s * xLocal;

      const ux =
        c * uLocal -
        s * vLocal;

      const uy =
        s * uLocal +
        c * vLocal;

      const p = structureToScreen(
        x0 +
        structure.deformationScale * ux,

        y0 +
        structure.deformationScale * uy,

        structure
      );

      vertex(
        p.x,
        p.y
      );
    }

    endShape();
  }
}


function drawDeformedTruss(
  structure
) {

  for (
    const member
    of structure.members
  ) {

    const ni = member.ni;
    const nj = member.nj;

    const p1 = structureToScreen(

      structure.nodes[ni].x +
      structure.deformationScale *
      (
        animatedDisplacements[
          2 * ni
        ] || 0
      ),

      structure.nodes[ni].y +
      structure.deformationScale *
      (
        animatedDisplacements[
          2 * ni + 1
        ] || 0
      ),

      structure
    );

    const p2 = structureToScreen(

      structure.nodes[nj].x +
      structure.deformationScale *
      (
        animatedDisplacements[
          2 * nj
        ] || 0
      ),

      structure.nodes[nj].y +
      structure.deformationScale *
      (
        animatedDisplacements[
          2 * nj + 1
        ] || 0
      ),

      structure
    );

    line(
      p1.x,
      p1.y,
      p2.x,
      p2.y
    );
  }
}


// ============================================================
// LEGEND AND STATUS
// ============================================================

function drawLegend(structure) {

  const x = plotX + 13;
  const y = plotY + 14;

  stroke(...COL_MEMBER);
  strokeWeight(2.1);

  line(
    x,
    y,
    x + 27,
    y
  );

  noStroke();
  fill(65);

  fontSize(FS_TINY);
  textAlign(LEFT, CENTER);

  text(
    "undeformed",
    x + 34,
    y
  );

  stroke(...COL_BLUE);
  strokeWeight(2.3);

  drawingContext.setLineDash(
    [7, 4]
  );

  line(
    x + 105,
    y,
    x + 132,
    y
  );

  drawingContext.setLineDash([]);

  noStroke();
  fill(65);

  text(
    `deformed × ${structure.deformationScale}`,
    x + 139,
    y
  );
}


function drawStatus() {

  noStroke();

  fill(
    structureStable
      ? color(...COL_GREEN)
      : color(...COL_RED)
  );

  fontSize(FS_SMALL);
  textAlign(CENTER, BOTTOM);

  text(
    solverMessage,
    W / 2,
    plotY + plotH - 6
  );
}


// ============================================================
// BUTTONS
// ============================================================

function drawModelSelector() {

  const items = [

    {
      key: "frame",
      label: "Frame"
    },

    {
      key: "beam",
      label: "Beam"
    },

    {
      key: "truss",
      label: "Truss"
    },

    {
      key: "reset",
      label: "Reset"
    }

  ];

  const buttonW = 88;
  const gap = 9;

  const totalW =
    items.length * buttonW +
    (items.length - 1) * gap;

  const startX =
    (W - totalW) / 2;

  for (
    let i = 0;
    i < items.length;
    i++
  ) {

    const item = items[i];

    const x =
      startX +
      i * (buttonW + gap);

    const selected =
      item.key !== "reset" &&
      activeStructure === item.key;

    const hovered =
      item.key === "reset"
        ? hoveredReset
        : hoveredSelector === item.key;

    fill(
      selected
        ? color(55, 120, 215)
        : hovered
          ? color(225, 235, 248)
          : color(240)
    );

    stroke(
      selected
        ? color(35, 95, 195)
        : hovered
          ? color(80, 125, 200)
          : color(175)
    );

    strokeWeight(0.8);

    rect(
      x,
      selectorY,
      buttonW,
      selectorH,
      6
    );

    noStroke();

    fill(
      selected
        ? 255
        : hovered
          ? color(25, 80, 180)
          : color(60)
    );

    fontSize(FS_BASE);
    textAlign(CENTER, CENTER);

    text(
      item.label,
      x + buttonW / 2,
      selectorY + selectorH / 2
    );
  }
}


function drawBottomInstruction() {

  noStroke();
  fill(75);

  fontSize(FS_SMALL);
  textAlign(CENTER, CENTER);

  if (activeStructure === "truss") {

    text(
      "Right-click nodes for point loads • left-click end supports to change hinge/roller",
      W / 2,
      instructionY
    );
  }

  else if (activeStructure === "beam") {

    text(
      "Left-click members for distributed loads • right-click anywhere on the beam for point loads",
      W / 2,
      instructionY
    );
  }

  else {

    text(
      "Left-click members for distributed loads • right-click nodes for point loads • left-click supports",
      W / 2,
      instructionY
    );
  }
}


// ============================================================
// DIRECT MOUSE DETECTION
// ============================================================

function mousePressed(event) {

  const selector =
    getSelectorAt(
      mouseX,
      mouseY
    );

  if (selector === "reset") {

    resetCurrentStructure();
    return false;
  }

  if (
    selector === "frame" ||
    selector === "beam" ||
    selector === "truss"
  ) {

    activeStructure = selector;

    targetDisplacements = [];
    animatedDisplacements = [];
    reactions = [];

    solveCurrentStructure();

    return false;
  }

  if (
    mouseX < plotX ||
    mouseX > plotX + plotW ||
    mouseY < plotY ||
    mouseY > plotY + plotH
  ) {

    return false;
  }

  const structure =
    getCurrentStructure();

  const rightClick =
    event &&
    event.button === 2;

  const supportIndex =
    getSupportAtMouse(structure);

  if (
    !rightClick &&
    supportIndex >= 0
  ) {

    cycleSupport(
      structure,
      supportIndex
    );

    solveCurrentStructure();

    return false;
  }

  const nodeIndex =
    getNodeAtMouse(structure);

  if (
    rightClick &&
    nodeIndex >= 0
  ) {

    structure.nodes[
      nodeIndex
    ].loadState =
      (
        structure.nodes[
          nodeIndex
        ].loadState + 1
      ) % 9;

    solveCurrentStructure();

    return false;
  }

  const memberIndex =
    getMemberAtMouse(structure);

  if (
    rightClick &&
    structure.type === "beam" &&
    memberIndex >= 0
  ) {

    addOrCycleBeamPointLoad(
      structure
    );

    solveCurrentStructure();

    return false;
  }

  if (
    !rightClick &&
    structure.type !== "truss" &&
    memberIndex >= 0
  ) {

    const member =
      structure.members[
        memberIndex
      ];

    if (member.loadState === 0) {
      member.loadState = 1;
    }

    else if (member.loadState === 1) {
      member.loadState = -1;
    }

    else {
      member.loadState = 0;
    }

    solveCurrentStructure();

    return false;
  }

  return false;
}


// ============================================================
// HOVER
// ============================================================

function updateHoverState() {

  hoveredNode = -1;
  hoveredMember = -1;
  hoveredSupport = -1;
  hoveredSelector = "";
  hoveredReset = false;

  const selector =
    getSelectorAt(
      mouseX,
      mouseY
    );

  if (selector === "reset") {

    hoveredReset = true;
    cursor(HAND);
    return;
  }

  if (selector !== "") {

    hoveredSelector = selector;
    cursor(HAND);
    return;
  }

  const structure =
    getCurrentStructure();

  hoveredSupport =
    getSupportAtMouse(structure);

  if (hoveredSupport >= 0) {

    cursor(HAND);
    return;
  }

  hoveredNode =
    getNodeAtMouse(structure);

  if (hoveredNode >= 0) {

    cursor(HAND);
    return;
  }

  if (structure.type !== "truss") {

    hoveredMember =
      getMemberAtMouse(structure);

    if (hoveredMember >= 0) {

      cursor(HAND);
      return;
    }
  }

  cursor(ARROW);
}


function getNodeAtMouse(structure) {

  let closestNode = -1;
  let closestDistance = Infinity;

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const p = structureToScreen(
      structure.nodes[n].x,
      structure.nodes[n].y,
      structure
    );

    const d = dist(
      mouseX,
      mouseY,
      p.x,
      p.y
    );

    if (d < closestDistance) {

      closestDistance = d;
      closestNode = n;
    }
  }

  return closestDistance <= 16
    ? closestNode
    : -1;
}


function getSupportAtMouse(structure) {

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const node = structure.nodes[n];

    if (node.support === "none") {
      continue;
    }

    if (
      structure.type === "truss" &&
      !node.supportEditable
    ) {
      continue;
    }

    const p = structureToScreen(
      node.x,
      node.y,
      structure
    );

    if (
      mouseX >= p.x - 22 &&
      mouseX <= p.x + 22 &&
      mouseY >= p.y + 7 &&
      mouseY <= p.y + 38
    ) {

      return n;
    }
  }

  return -1;
}


function getMemberAtMouse(structure) {

  let closestMember = -1;
  let closestDistance = Infinity;

  for (
    let e = 0;
    e < structure.members.length;
    e++
  ) {

    const member =
      structure.members[e];

    const p1 = structureToScreen(
      structure.nodes[member.ni].x,
      structure.nodes[member.ni].y,
      structure
    );

    const p2 = structureToScreen(
      structure.nodes[member.nj].x,
      structure.nodes[member.nj].y,
      structure
    );

    const d =
      pointToSegmentDistance(
        mouseX,
        mouseY,
        p1.x,
        p1.y,
        p2.x,
        p2.y
      );

    if (d < closestDistance) {

      closestDistance = d;
      closestMember = e;
    }
  }

  return closestDistance <= 14
    ? closestMember
    : -1;
}


// ============================================================
// BEAM POINT LOAD
// ============================================================

function addOrCycleBeamPointLoad(
  structure
) {

  const physical =
    screenToStructure(
      mouseX,
      mouseY,
      structure
    );

  let loadX =
    constrain(
      physical.x,
      0,
      6000
    );

  loadX =
    round(loadX / 100) * 100;

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const node =
      structure.nodes[n];

    const p = structureToScreen(
      node.x,
      node.y,
      structure
    );

    if (
      abs(mouseX - p.x) <= 18
    ) {

      node.loadState =
        (node.loadState + 1) % 9;

      return;
    }
  }

  for (
    let i = 0;
    i < structure.pointLoads.length;
    i++
  ) {

    const pointLoad =
      structure.pointLoads[i];

    const p = structureToScreen(
      pointLoad.x,
      0,
      structure
    );

    if (
      abs(mouseX - p.x) <= 18
    ) {

      pointLoad.loadState =
        (pointLoad.loadState + 1) % 9;

      if (pointLoad.loadState === 0) {

        structure.pointLoads.splice(
          i,
          1
        );
      }

      return;
    }
  }

  structure.pointLoads.push({

    x: loadX,

    // Start with vertical downward load.
    loadState: 4

  });
}


// ============================================================
// SUPPORT CYCLE
// ============================================================

function cycleSupport(
  structure,
  nodeIndex
) {

  const node =
    structure.nodes[nodeIndex];

  if (structure.type === "truss") {

    node.support =
      node.support === "hinged"
        ? "roller"
        : "hinged";

    return;
  }

  if (node.support === "fixed") {
    node.support = "hinged";
  }

  else if (node.support === "hinged") {
    node.support = "roller";
  }

  else {
    node.support = "fixed";
  }
}


// ============================================================
// RESET
// ============================================================

function resetCurrentStructure() {

  const structure =
    getCurrentStructure();

  for (
    const node
    of structure.nodes
  ) {

    node.loadState = 0;
  }

  if (structure.type !== "truss") {

    for (
      const member
      of structure.members
    ) {

      member.loadState = 0;
    }
  }

  if (structure.type === "frame") {

    structure.nodes[0].support = "fixed";
    structure.nodes[3].support = "roller";
  }

  else if (structure.type === "beam") {

    structure.nodes[0].support = "hinged";
    structure.nodes[1].support = "roller";
    structure.nodes[2].support = "roller";

    structure.pointLoads = [];
  }

  else {

    structure.nodes[0].support = "hinged";
    structure.nodes[3].support = "roller";
  }

  targetDisplacements = [];
  animatedDisplacements = [];
  reactions = [];

  solveCurrentStructure();
}


// ============================================================
// SOLVER ROUTING
// ============================================================

function solveCurrentStructure() {

  const structure =
    getCurrentStructure();

  if (structure.type === "truss") {
    solveTruss(structure);
  }

  else {
    solveFrameStructure(structure);
  }
}


// ============================================================
// BEAM ANALYSIS MESH
// ============================================================

function buildBeamAnalysisMesh(
  structure
) {

  const xValues = [
    0,
    3000,
    6000
  ];

  for (
    const pointLoad
    of structure.pointLoads
  ) {

    xValues.push(pointLoad.x);
  }

  xValues.sort(
    (a, b) => a - b
  );

  const uniqueX = [];

  for (
    const x
    of xValues
  ) {

    if (
      uniqueX.length === 0 ||
      abs(
        x -
        uniqueX[
          uniqueX.length - 1
        ]
      ) > 1e-6
    ) {

      uniqueX.push(x);
    }
  }

  const nodes =
    uniqueX.map(
      x => {

        let support = "none";
        let loadState = 0;

        for (
          const originalNode
          of structure.nodes
        ) {

          if (
            abs(
              originalNode.x - x
            ) < 1e-6
          ) {

            support =
              originalNode.support;

            loadState =
              originalNode.loadState;
          }
        }

        for (
          const pointLoad
          of structure.pointLoads
        ) {

          if (
            abs(
              pointLoad.x - x
            ) < 1e-6
          ) {

            loadState =
              pointLoad.loadState;
          }
        }

        return {
          x,
          y: 0,
          support,
          loadState
        };
      }
    );

  const members = [];

  for (
    let i = 0;
    i < nodes.length - 1;
    i++
  ) {

    const midpoint =
      0.5 *
      (
        nodes[i].x +
        nodes[i + 1].x
      );

    const parentIndex =
      midpoint < 3000 ? 0 : 1;

    members.push({

      ni: i,

      nj: i + 1,

      loadState:
        structure.members[
          parentIndex
        ].loadState

    });
  }

  return {
    nodes,
    members
  };
}


// ============================================================
// FRAME AND BEAM SOLVER
// ============================================================

function solveFrameStructure(
  structure
) {

  let analysisNodes =
    structure.nodes;

  let analysisMembers =
    structure.members;

  if (structure.type === "beam") {

    const mesh =
      buildBeamAnalysisMesh(
        structure
      );

    analysisNodes = mesh.nodes;
    analysisMembers = mesh.members;
  }

  solvedNodes =
    analysisNodes.map(
      node => ({
        ...node
      })
    );

  solvedMembers =
    analysisMembers.map(
      member => ({
        ...member
      })
    );

  const ndof =
    3 * analysisNodes.length;

  const K =
    zerosMatrix(ndof, ndof);

  const F =
    new Array(ndof).fill(0);

  for (
    let n = 0;
    n < analysisNodes.length;
    n++
  ) {

    const load =
      nodalLoadFromState(
        analysisNodes[n].loadState
      );

    F[3 * n] += load.fx;
    F[3 * n + 1] += load.fy;
  }

  for (
    const member
    of analysisMembers
  ) {

    const nodeI =
      analysisNodes[member.ni];

    const nodeJ =
      analysisNodes[member.nj];

    const dx =
      nodeJ.x - nodeI.x;

    const dy =
      nodeJ.y - nodeI.y;

    const L =
      sqrt(dx * dx + dy * dy);

    const c = dx / L;
    const s = dy / L;

    const localK =
      localFrameStiffness(
        E,
        FRAME_A,
        FRAME_I,
        L
      );

    const T =
      transformationMatrix(c, s);

    const globalK =
      matMul(
        transpose(T),
        matMul(localK, T)
      );

    const dof = [
      3 * member.ni,
      3 * member.ni + 1,
      3 * member.ni + 2,
      3 * member.nj,
      3 * member.nj + 1,
      3 * member.nj + 2
    ];

    assembleMatrix(
      K,
      globalK,
      dof
    );

    if (member.loadState !== 0) {

      const q =
        memberLoadMagnitude *
        member.loadState;

      const localForce = [
        0,
        q * L / 2,
        q * L * L / 12,
        0,
        q * L / 2,
        -q * L * L / 12
      ];

      const globalForce =
        matVec(
          transpose(T),
          localForce
        );

      assembleVector(
        F,
        globalForce,
        dof
      );
    }
  }

  const fixed = [];

  for (
    let n = 0;
    n < analysisNodes.length;
    n++
  ) {

    const support =
      analysisNodes[n].support;

    if (support === "fixed") {

      fixed.push(
        3 * n,
        3 * n + 1,
        3 * n + 2
      );
    }

    else if (support === "hinged") {

      fixed.push(
        3 * n,
        3 * n + 1
      );
    }

    else if (support === "roller") {

      fixed.push(
        3 * n + 1
      );
    }
  }

  solveReducedSystem(
    K,
    F,
    fixed,
    ndof,
    3
  );
}


// ============================================================
// TRUSS SOLVER
// ============================================================

function solveTruss(structure) {

  solvedNodes =
    structure.nodes.map(
      node => ({
        ...node
      })
    );

  solvedMembers =
    structure.members.map(
      member => ({
        ...member
      })
    );

  const ndof =
    2 * structure.nodes.length;

  const K =
    zerosMatrix(ndof, ndof);

  const F =
    new Array(ndof).fill(0);

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const load =
      nodalLoadFromState(
        structure.nodes[n].loadState
      );

    F[2 * n] += load.fx;
    F[2 * n + 1] += load.fy;
  }

  for (
    const member
    of structure.members
  ) {

    const nodeI =
      structure.nodes[member.ni];

    const nodeJ =
      structure.nodes[member.nj];

    const dx =
      nodeJ.x - nodeI.x;

    const dy =
      nodeJ.y - nodeI.y;

    const L =
      sqrt(dx * dx + dy * dy);

    const c = dx / L;
    const s = dy / L;

    const factor =
      E * TRUSS_A / L;

    const elementK = [

      [
        factor * c * c,
        factor * c * s,
        -factor * c * c,
        -factor * c * s
      ],

      [
        factor * c * s,
        factor * s * s,
        -factor * c * s,
        -factor * s * s
      ],

      [
        -factor * c * c,
        -factor * c * s,
        factor * c * c,
        factor * c * s
      ],

      [
        -factor * c * s,
        -factor * s * s,
        factor * c * s,
        factor * s * s
      ]

    ];

    const dof = [
      2 * member.ni,
      2 * member.ni + 1,
      2 * member.nj,
      2 * member.nj + 1
    ];

    assembleMatrix(
      K,
      elementK,
      dof
    );
  }

  const fixed = [];

  for (
    let n = 0;
    n < structure.nodes.length;
    n++
  ) {

    const support =
      structure.nodes[n].support;

    if (support === "hinged") {

      fixed.push(
        2 * n,
        2 * n + 1
      );
    }

    else if (support === "roller") {

      fixed.push(
        2 * n + 1
      );
    }
  }

  solveReducedSystem(
    K,
    F,
    fixed,
    ndof,
    2
  );
}


// ============================================================
// REDUCED SYSTEM
// ============================================================

function solveReducedSystem(
  K,
  F,
  fixedInput,
  ndof,
  dofPerNode
) {

  const fixed =
    Array.from(
      new Set(fixedInput)
    ).sort(
      (a, b) => a - b
    );

  const fixedSet =
    new Set(fixed);

  const free = [];

  for (
    let i = 0;
    i < ndof;
    i++
  ) {

    if (!fixedSet.has(i)) {
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

    Ff[i] = F[free[i]];

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

  const solution =
    gaussianSolve(
      Kff,
      Ff
    );

  if (!solution.success) {

    structureStable = false;

    solverMessage =
      "Unstable support arrangement: rigid-body mode or mechanism.";

    targetDisplacements =
      new Array(ndof).fill(0);

    animatedDisplacements =
      new Array(ndof).fill(0);

    reactions =
      new Array(ndof).fill(0);

    return;
  }

  structureStable = true;

  targetDisplacements =
    new Array(ndof).fill(0);

  for (
    let i = 0;
    i < free.length;
    i++
  ) {

    targetDisplacements[
      free[i]
    ] =
      solution.x[i];
  }

  reactions =
    matVec(
      K,
      targetDisplacements
    ).map(
      (
        value,
        index
      ) =>
        value - F[index]
    );

  if (
    animatedDisplacements.length !==
    ndof
  ) {

    animatedDisplacements =
      new Array(ndof).fill(0);
  }

  const maximum =
    getMaximumTranslation(
      targetDisplacements,
      dofPerNode
    );

  solverMessage =
    maximum < 1e-12
      ? "Stable structure • no active load"
      : `Stable structure • maximum translation = ${maximum.toFixed(3)} mm`;
}


// ============================================================
// ELEMENT MATRICES
// ============================================================

function localFrameStiffness(
  elasticModulus,
  area,
  inertia,
  length
) {

  const EA_L =
    elasticModulus *
    area /
    length;

  const EI =
    elasticModulus *
    inertia;

  const c1 =
    12 * EI /
    pow(length, 3);

  const c2 =
    6 * EI /
    pow(length, 2);

  const c3 =
    4 * EI /
    length;

  const c4 =
    2 * EI /
    length;

  return [

    [
      EA_L, 0, 0,
      -EA_L, 0, 0
    ],

    [
      0, c1, c2,
      0, -c1, c2
    ],

    [
      0, c2, c3,
      0, -c2, c4
    ],

    [
      -EA_L, 0, 0,
      EA_L, 0, 0
    ],

    [
      0, -c1, -c2,
      0, c1, -c2
    ],

    [
      0, c2, c4,
      0, -c2, c3
    ]

  ];
}


function transformationMatrix(
  c,
  s
) {

  return [

    [
      c, s, 0,
      0, 0, 0
    ],

    [
      -s, c, 0,
      0, 0, 0
    ],

    [
      0, 0, 1,
      0, 0, 0
    ],

    [
      0, 0, 0,
      c, s, 0
    ],

    [
      0, 0, 0,
      -s, c, 0
    ],

    [
      0, 0, 0,
      0, 0, 1
    ]

  ];
}


// ============================================================
// LOAD STATES
// ============================================================

function nodalLoadFromState(state) {

  const P =
    nodalLoadMagnitude;

  const states = [

    { fx: 0, fy: 0 },

    { fx: P, fy: 0 },

    { fx: -P, fy: 0 },

    { fx: 0, fy: P },

    { fx: 0, fy: -P },

    { fx: P, fy: P },

    { fx: -P, fy: -P },

    { fx: P, fy: -P },

    { fx: -P, fy: P }

  ];

  return states[state];
}


// ============================================================
// ANIMATION
// ============================================================

function updateAnimatedDisplacement() {

  if (
    animatedDisplacements.length !==
    targetDisplacements.length
  ) {

    animatedDisplacements =
      targetDisplacements.slice();

    return;
  }

  for (
    let i = 0;
    i < targetDisplacements.length;
    i++
  ) {

    animatedDisplacements[i] =
      lerp(
        animatedDisplacements[i],
        targetDisplacements[i],
        0.10
      );
  }
}


function getMaximumTranslation(
  displacement,
  dofPerNode
) {

  let maximum = 0;

  const nodeCount =
    displacement.length /
    dofPerNode;

  for (
    let n = 0;
    n < nodeCount;
    n++
  ) {

    const ux =
      displacement[
        dofPerNode * n
      ];

    const uy =
      displacement[
        dofPerNode * n + 1
      ];

    maximum =
      max(
        maximum,
        sqrt(
          ux * ux +
          uy * uy
        )
      );
  }

  return maximum;
}


// ============================================================
// BUTTON HIT TEST
// ============================================================

function getSelectorAt(
  x,
  y
) {

  const keys = [
    "frame",
    "beam",
    "truss",
    "reset"
  ];

  const buttonW = 88;
  const gap = 9;

  const totalW =
    keys.length * buttonW +
    (keys.length - 1) * gap;

  const startX =
    (W - totalW) / 2;

  for (
    let i = 0;
    i < keys.length;
    i++
  ) {

    const buttonX =
      startX +
      i * (buttonW + gap);

    if (
      insideRect(
        x,
        y,
        buttonX,
        selectorY,
        buttonW,
        selectorH
      )
    ) {

      return keys[i];
    }
  }

  return "";
}


// ============================================================
// DRAW HELPERS
// ============================================================

function drawGlowLine(
  x1,
  y1,
  x2,
  y2,
  lineColor,
  weightValue,
  glowAlpha
) {

  push();

  drawingContext.shadowBlur = 7;

  drawingContext.shadowColor =
    `rgba(${red(lineColor)},${green(lineColor)},${blue(lineColor)},${glowAlpha / 255})`;

  stroke(lineColor);
  strokeWeight(weightValue);

  line(
    x1,
    y1,
    x2,
    y2
  );

  drawingContext.shadowBlur = 0;

  pop();
}


function drawArrow(
  x1,
  y1,
  x2,
  y2,
  arrowColor,
  lineWeight
) {

  stroke(arrowColor);
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

  fill(arrowColor);
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
// COORDINATE MAPPING
// ============================================================

function structureToScreen(
  x,
  y,
  structure
) {

  return {

    x:
      map(
        x,
        structure.xMin,
        structure.xMax,
        plotX,
        plotX + plotW
      ),

    y:
      map(
        y,
        structure.yMin,
        structure.yMax,
        plotY + plotH,
        plotY
      )

  };
}


function screenToStructure(
  x,
  y,
  structure
) {

  return {

    x:
      map(
        x,
        plotX,
        plotX + plotW,
        structure.xMin,
        structure.xMax
      ),

    y:
      map(
        y,
        plotY + plotH,
        plotY,
        structure.yMin,
        structure.yMax
      )

  };
}


// ============================================================
// HIT-TEST HELPERS
// ============================================================

function pointToSegmentDistance(
  px,
  py,
  x1,
  y1,
  x2,
  y2
) {

  const vx = x2 - x1;
  const vy = y2 - y1;

  const wx = px - x1;
  const wy = py - y1;

  const lengthSquared =
    vx * vx + vy * vy;

  if (lengthSquared < 1e-14) {

    return dist(
      px,
      py,
      x1,
      y1
    );
  }

  let t =
    (
      wx * vx +
      wy * vy
    ) /
    lengthSquared;

  t = constrain(t, 0, 1);

  return dist(
    px,
    py,
    x1 + t * vx,
    y1 + t * vy
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
    x >= rx &&
    x <= rx + rw &&
    y >= ry &&
    y <= ry + rh
  );
}


// ============================================================
// GAUSSIAN SOLVER
// ============================================================

function gaussianSolve(
  matrix,
  vector
) {

  const n = vector.length;

  if (n === 0) {

    return {
      success: true,
      x: []
    };
  }

  const A =
    matrix.map(
      row => row.slice()
    );

  const b = vector.slice();

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
          abs(A[i][j])
        );
    }
  }

  const tolerance =
    max(
      1e-8,
      maximumEntry * 1e-11
    );

  for (
    let column = 0;
    column < n;
    column++
  ) {

    let pivotRow = column;

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
        candidate >
        pivotMagnitude
      ) {

        pivotMagnitude = candidate;
        pivotRow = row;
      }
    }

    if (
      pivotMagnitude <
      tolerance
    ) {

      return {
        success: false,
        x: new Array(n).fill(0)
      };
    }

    if (pivotRow !== column) {

      [
        A[column],
        A[pivotRow]
      ] = [
        A[pivotRow],
        A[column]
      ];

      [
        b[column],
        b[pivotRow]
      ] = [
        b[pivotRow],
        b[column]
      ];
    }

    for (
      let row = column + 1;
      row < n;
      row++
    ) {

      const factor =
        A[row][column] /
        A[column][column];

      A[row][column] = 0;

      for (
        let j = column + 1;
        j < n;
        j++
      ) {

        A[row][j] -=
          factor *
          A[column][j];
      }

      b[row] -=
        factor *
        b[column];
    }
  }

  const x =
    new Array(n).fill(0);

  for (
    let i = n - 1;
    i >= 0;
    i--
  ) {

    let sum = b[i];

    for (
      let j = i + 1;
      j < n;
      j++
    ) {

      sum -=
        A[i][j] *
        x[j];
    }

    x[i] =
      sum / A[i][i];
  }

  return {
    success: true,
    x
  };
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


function transpose(A) {

  const result =
    zerosMatrix(
      A[0].length,
      A.length
    );

  for (
    let i = 0;
    i < A.length;
    i++
  ) {

    for (
      let j = 0;
      j < A[0].length;
      j++
    ) {

      result[j][i] =
        A[i][j];
    }
  }

  return result;
}


function matMul(
  A,
  B
) {

  const result =
    zerosMatrix(
      A.length,
      B[0].length
    );

  for (
    let i = 0;
    i < A.length;
    i++
  ) {

    for (
      let k = 0;
      k < B.length;
      k++
    ) {

      const value = A[i][k];

      if (abs(value) < 1e-30) {
        continue;
      }

      for (
        let j = 0;
        j < B[0].length;
        j++
      ) {

        result[i][j] +=
          value * B[k][j];
      }
    }
  }

  return result;
}


function matVec(
  A,
  x
) {

  const result =
    new Array(
      A.length
    ).fill(0);

  for (
    let i = 0;
    i < A.length;
    i++
  ) {

    for (
      let j = 0;
      j < A[i].length;
      j++
    ) {

      result[i] +=
        A[i][j] * x[j];
    }
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


function assembleVector(
  globalVector,
  elementVector,
  dof
) {

  for (
    let i = 0;
    i < dof.length;
    i++
  ) {

    globalVector[
      dof[i]
    ] +=
      elementVector[i];
  }
}