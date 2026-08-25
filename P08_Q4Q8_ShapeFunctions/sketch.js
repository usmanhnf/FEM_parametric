// ============================================================
// Q4 / Q8 QUADRILATERAL SHAPE FUNCTIONS
//
// Node order:
//
//   4 ----- 7 ----- 3
//   |               |
//   8               6
//   |               |
//   1 ----- 5 ----- 2
// ============================================================

const W = 700;
const H = 296;

let elementMode = "Q4";
let coordinateMode = "ISO";

let viewYaw = -0.55;
let viewPitch = 0.72;

let interactionMode = null;
let activeSlider = -1;
let lastMouseX = 0;
let lastMouseY = 0;

const pointGrabRadius = 18;

let pointXi = 0.18;
let pointEta = -0.20;

const nodalValues = [
  0.20, 0.80, 0.45, 0.35,
  0.60, 0.30, 0.70, 0.50
];

const nodes = [
  { xi: -1, eta: -1 },
  { xi:  1, eta: -1 },
  { xi:  1, eta:  1 },
  { xi: -1, eta:  1 },
  { xi:  0, eta: -1 },
  { xi:  1, eta:  0 },
  { xi:  0, eta:  1 },
  { xi: -1, eta:  0 }
];

const mainPanel = {
  x: 6,
  y: 6,
  w: 205,
  h: 220
};

const q4Panels = [
  { x: 219, y: 6,   w: 234, h: 106 },
  { x: 460, y: 6,   w: 234, h: 106 },
  { x: 219, y: 120, w: 234, h: 106 },
  { x: 460, y: 120, w: 234, h: 106 }
];

const q8Panels = [
  { x: 219, y: 6,   w: 113, h: 106 },
  { x: 339, y: 6,   w: 113, h: 106 },
  { x: 459, y: 6,   w: 113, h: 106 },
  { x: 579, y: 6,   w: 115, h: 106 },

  { x: 219, y: 120, w: 113, h: 106 },
  { x: 339, y: 120, w: 113, h: 106 },
  { x: 459, y: 120, w: 113, h: 106 },
  { x: 579, y: 120, w: 115, h: 106 }
];

const sliderRow1Y = 251;
const sliderRow2Y = 280;

const controls = {
  q4: {
    x: 276,
    y: 242,
    w: 82,
    h: 20
  },

  q8: {
    x: 362,
    y: 242,
    w: 82,
    h: 20
  },

  physical: {
    x: 493,
    y: 242,
    w: 92,
    h: 20
  },

  iso: {
    x: 589,
    y: 242,
    w: 98,
    h: 20
  }
};


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

  drawMainPanel();
  drawShapeFunctionPanels();
  drawNodalControls();
  drawElementControls();
  updateCursor();
}


// ============================================================
// SHAPE FUNCTIONS
// ============================================================

function shapeFunctions(
  xi,
  eta,
  mode = elementMode
) {
  if (mode === "Q4") {
    return [
      0.25 *
        (1 - xi) *
        (1 - eta),

      0.25 *
        (1 + xi) *
        (1 - eta),

      0.25 *
        (1 + xi) *
        (1 + eta),

      0.25 *
        (1 - xi) *
        (1 + eta)
    ];
  }

  return [
    0.25 *
      (1 - xi) *
      (1 - eta) *
      (-xi - eta - 1),

    0.25 *
      (1 + xi) *
      (1 - eta) *
      (xi - eta - 1),

    0.25 *
      (1 + xi) *
      (1 + eta) *
      (xi + eta - 1),

    0.25 *
      (1 - xi) *
      (1 + eta) *
      (-xi + eta - 1),

    0.50 *
      (1 - xi * xi) *
      (1 - eta),

    0.50 *
      (1 + xi) *
      (1 - eta * eta),

    0.50 *
      (1 - xi * xi) *
      (1 + eta),

    0.50 *
      (1 - xi) *
      (1 - eta * eta)
  ];
}


// ============================================================
// INTERPOLATED FIELD
// ============================================================

function interpolateField(xi, eta) {
  const N =
    shapeFunctions(xi, eta);

  let value = 0;

  for (
    let i = 0;
    i < N.length;
    i++
  ) {
    value +=
      N[i] *
      nodalValues[i];
  }

  return value;
}


// ============================================================
// MAIN PANEL
// ============================================================

function drawMainPanel() {
  drawPanelFrame(
    mainPanel
  );

  drawPanelTitle(
    mainPanel,
    `${elementMode} interpolated field`,
    10
  );

  drawSurface(
    mainPanel,
    interpolateField,
    true,
    -0.55,
    1.20
  );

  const pointZ =
    interpolateField(
      pointXi,
      pointEta
    );

  const point =
    projectPoint(
      mainPanel,
      pointXi,
      pointEta,
      pointZ,
      -0.55,
      1.20,
      true
    );

  drawGlowingPoint(
    point.x,
    point.y
  );

  noStroke();
  fill(55);
  textSize(7.5);

  textAlign(
    LEFT,
    CENTER
  );

  const firstCoordinate =
    coordinateMode === "ISO"
      ? "ξ"
      : "x/a";

  const secondCoordinate =
    coordinateMode === "ISO"
      ? "η"
      : "y/b";

  text(
    `P: ${firstCoordinate}=${pointXi.toFixed(2)}, ` +
    `${secondCoordinate}=${pointEta.toFixed(2)}   ` +
    `u=${pointZ.toFixed(3)}`,
    mainPanel.x + 8,
    mainPanel.y +
      mainPanel.h -
      10
  );
}


// ============================================================
// SHAPE-FUNCTION PANELS
// ============================================================

function drawShapeFunctionPanels() {
  const panels =
    getCurrentPanels();

  const count =
    elementMode === "Q4"
      ? 4
      : 8;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const panel =
      panels[i];

    drawPanelFrame(
      panel
    );

    drawFormulaTitle(
      panel,
      i
    );

    drawSurface(
      panel,

      (xi, eta) =>
        shapeFunctions(
          xi,
          eta
        )[i],

      false,

      elementMode === "Q8"
        ? -0.55
        : -0.18,

      1.05
    );

    const pointZ =
      shapeFunctions(
        pointXi,
        pointEta
      )[i];

    const point =
      projectPoint(
        panel,
        pointXi,
        pointEta,
        pointZ,

        elementMode === "Q8"
          ? -0.55
          : -0.18,

        1.05,
        false
      );

    drawSmallPoint(
      point.x,
      point.y
    );
  }
}


function getCurrentPanels() {
  return elementMode === "Q4"
    ? q4Panels
    : q8Panels;
}


// ============================================================
// SURFACE
// ============================================================

function drawSurface(
  panel,
  fieldFunction,
  main,
  zMin,
  zMax
) {
  const divisions =
    main
      ? 13
      : 10;

  noStroke();

  for (
    let row = 0;
    row < divisions;
    row++
  ) {
    const eta0 =
      map(
        row,
        0,
        divisions,
        -1,
        1
      );

    const eta1 =
      map(
        row + 1,
        0,
        divisions,
        -1,
        1
      );

    for (
      let column = 0;
      column < divisions;
      column++
    ) {
      const xi0 =
        map(
          column,
          0,
          divisions,
          -1,
          1
        );

      const xi1 =
        map(
          column + 1,
          0,
          divisions,
          -1,
          1
        );

      const z00 =
        fieldFunction(
          xi0,
          eta0
        );

      const z10 =
        fieldFunction(
          xi1,
          eta0
        );

      const z11 =
        fieldFunction(
          xi1,
          eta1
        );

      const z01 =
        fieldFunction(
          xi0,
          eta1
        );

      const average =
        0.25 *
        (
          z00 +
          z10 +
          z11 +
          z01
        );

      fill(
        surfaceColor(
          average,
          zMin,
          zMax
        )
      );

      const p00 =
        projectPoint(
          panel,
          xi0,
          eta0,
          z00,
          zMin,
          zMax,
          main
        );

      const p10 =
        projectPoint(
          panel,
          xi1,
          eta0,
          z10,
          zMin,
          zMax,
          main
        );

      const p11 =
        projectPoint(
          panel,
          xi1,
          eta1,
          z11,
          zMin,
          zMax,
          main
        );

      const p01 =
        projectPoint(
          panel,
          xi0,
          eta1,
          z01,
          zMin,
          zMax,
          main
        );

      beginShape();

      vertex(
        p00.x,
        p00.y
      );

      vertex(
        p10.x,
        p10.y
      );

      vertex(
        p11.x,
        p11.y
      );

      vertex(
        p01.x,
        p01.y
      );

      endShape(CLOSE);
    }
  }

  drawSurfaceMesh(
    panel,
    fieldFunction,
    main,
    zMin,
    zMax,
    divisions
  );

  drawBaseSquare(
    panel,
    main,
    zMin,
    zMax
  );

  drawElementNodes(
    panel,
    fieldFunction,
    main,
    zMin,
    zMax
  );
}


// ============================================================
// SURFACE MESH
// ============================================================

function drawSurfaceMesh(
  panel,
  fieldFunction,
  main,
  zMin,
  zMax,
  divisions
) {
  stroke(
    25,
    43,
    64,
    115
  );

  strokeWeight(
    main
      ? 0.65
      : 0.45
  );

  noFill();

  for (
    let index = 0;
    index <= divisions;
    index++
  ) {
    const fixedCoordinate =
      map(
        index,
        0,
        divisions,
        -1,
        1
      );

    beginShape();

    for (
      let step = 0;
      step <= divisions;
      step++
    ) {
      const xi =
        map(
          step,
          0,
          divisions,
          -1,
          1
        );

      const eta =
        fixedCoordinate;

      const point =
        projectPoint(
          panel,
          xi,
          eta,
          fieldFunction(
            xi,
            eta
          ),
          zMin,
          zMax,
          main
        );

      vertex(
        point.x,
        point.y
      );
    }

    endShape();

    beginShape();

    for (
      let step = 0;
      step <= divisions;
      step++
    ) {
      const xi =
        fixedCoordinate;

      const eta =
        map(
          step,
          0,
          divisions,
          -1,
          1
        );

      const point =
        projectPoint(
          panel,
          xi,
          eta,
          fieldFunction(
            xi,
            eta
          ),
          zMin,
          zMax,
          main
        );

      vertex(
        point.x,
        point.y
      );
    }

    endShape();
  }
}


// ============================================================
// BASE SQUARE
// ============================================================

function drawBaseSquare(
  panel,
  main,
  zMin,
  zMax
) {
  stroke(
    90,
    105
  );

  strokeWeight(
    main
      ? 0.9
      : 0.6
  );

  noFill();

  beginShape();

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    const node =
      nodes[i];

    const point =
      projectPoint(
        panel,
        node.xi,
        node.eta,
        0,
        zMin,
        zMax,
        main
      );

    vertex(
      point.x,
      point.y
    );
  }

  endShape(CLOSE);
}


// ============================================================
// ELEMENT NODES
// ============================================================

function drawElementNodes(
  panel,
  fieldFunction,
  main,
  zMin,
  zMax
) {
  const count =
    elementMode === "Q4"
      ? 4
      : 8;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const node =
      nodes[i];

    const z =
      fieldFunction(
        node.xi,
        node.eta
      );

    const point =
      projectPoint(
        panel,
        node.xi,
        node.eta,
        z,
        zMin,
        zMax,
        main
      );

    fill(255);

    stroke(
      230,
      45,
      65
    );

    strokeWeight(
      main
        ? 1
        : 0.7
    );

    circle(
      point.x,
      point.y,

      main
        ? 6
        : 4
    );

    if (main) {
      noStroke();
      fill(45);
      textSize(7);

      textAlign(
        CENTER,
        CENTER
      );

      text(
        `${i + 1}`,
        point.x,
        point.y - 8
      );
    }
  }
}


// ============================================================
// PROJECTION
// ============================================================

function projectPoint(
  panel,
  xi,
  eta,
  z,
  zMin,
  zMax,
  main
) {
  const centerX =
    panel.x +
    panel.w * 0.50;

  const centerY =
    panel.y +
    panel.h *
    (
      main
        ? 0.55
        : 0.60
    );

  let scale;

  if (main) {
    scale = 66;
  }
  else if (
    elementMode === "Q4"
  ) {
    scale = 34;
  }
  else {
    scale = 24;
  }

  const normalizedZ =
    map(
      z,
      zMin,
      zMax,
      -0.18,
      1.18
    );

  const rotatedX =
    xi *
      cos(viewYaw) -
    eta *
      sin(viewYaw);

  const rotatedY =
    xi *
      sin(viewYaw) +
    eta *
      cos(viewYaw);

  const projectedY =
    rotatedY *
      cos(viewPitch) -
    normalizedZ *
      sin(viewPitch);

  return {
    x:
      centerX +
      scale *
      rotatedX,

    y:
      centerY +
      scale *
      projectedY
  };
}


// ============================================================
// FORMULAS
// ============================================================

function formulaLines(index) {
  const isoQ4 = [
    ["N₁=(1−ξ)(1−η)/4"],
    ["N₂=(1+ξ)(1−η)/4"],
    ["N₃=(1+ξ)(1+η)/4"],
    ["N₄=(1−ξ)(1+η)/4"]
  ];

  const physicalQ4 = [
    ["N₁=(a−x)(b−y)/4ab"],
    ["N₂=(a+x)(b−y)/4ab"],
    ["N₃=(a+x)(b+y)/4ab"],
    ["N₄=(a−x)(b+y)/4ab"]
  ];

  const isoQ8 = [
    [
      "N₁=(1−ξ)(1−η)",
      "(−ξ−η−1)/4"
    ],

    [
      "N₂=(1+ξ)(1−η)",
      "(ξ−η−1)/4"
    ],

    [
      "N₃=(1+ξ)(1+η)",
      "(ξ+η−1)/4"
    ],

    [
      "N₄=(1−ξ)(1+η)",
      "(−ξ+η−1)/4"
    ],

    [
      "N₅=(1−ξ²)(1−η)/2"
    ],

    [
      "N₆=(1+ξ)(1−η²)/2"
    ],

    [
      "N₇=(1−ξ²)(1+η)/2"
    ],

    [
      "N₈=(1−ξ)(1−η²)/2"
    ]
  ];

  const physicalQ8 = [
    [
      "N₁=(1−x/a)(1−y/b)",
      "(−x/a−y/b−1)/4"
    ],

    [
      "N₂=(1+x/a)(1−y/b)",
      "(x/a−y/b−1)/4"
    ],

    [
      "N₃=(1+x/a)(1+y/b)",
      "(x/a+y/b−1)/4"
    ],

    [
      "N₄=(1−x/a)(1+y/b)",
      "(−x/a+y/b−1)/4"
    ],

    [
      "N₅=(1−x²/a²)",
      "(1−y/b)/2"
    ],

    [
      "N₆=(1+x/a)",
      "(1−y²/b²)/2"
    ],

    [
      "N₇=(1−x²/a²)",
      "(1+y/b)/2"
    ],

    [
      "N₈=(1−x/a)",
      "(1−y²/b²)/2"
    ]
  ];

  if (
    elementMode === "Q4"
  ) {
    return coordinateMode === "ISO"
      ? isoQ4[index]
      : physicalQ4[index];
  }

  return coordinateMode === "ISO"
    ? isoQ8[index]
    : physicalQ8[index];
}


// ============================================================
// FORMULA TITLES
// ============================================================

function drawFormulaTitle(
  panel,
  index
) {
  const lines =
    formulaLines(index);

  noStroke();
  fill(38);

  textAlign(
    CENTER,
    TOP
  );

  textStyle(NORMAL);

  textSize(
    elementMode === "Q4"
      ? 8.5
      : 6.2
  );

  for (
    let line = 0;
    line < lines.length;
    line++
  ) {
    text(
      lines[line],
      panel.x +
        panel.w / 2,
      panel.y +
        5 +
        line * 7
    );
  }
}


// ============================================================
// MOVABLE POINT
// ============================================================

function getCurrentPointScreenPosition() {
  const z =
    interpolateField(
      pointXi,
      pointEta
    );

  return projectPoint(
    mainPanel,
    pointXi,
    pointEta,
    z,
    -0.55,
    1.20,
    true
  );
}


function updatePointFromMouse() {
  let bestXi =
    pointXi;

  let bestEta =
    pointEta;

  let bestDistance =
    Infinity;

  const divisions = 34;

  // Coarse search over the complete element.
  for (
    let row = 0;
    row <= divisions;
    row++
  ) {
    const eta =
      map(
        row,
        0,
        divisions,
        -1,
        1
      );

    for (
      let column = 0;
      column <= divisions;
      column++
    ) {
      const xi =
        map(
          column,
          0,
          divisions,
          -1,
          1
        );

      const z =
        interpolateField(
          xi,
          eta
        );

      const point =
        projectPoint(
          mainPanel,
          xi,
          eta,
          z,
          -0.55,
          1.20,
          true
        );

      const distanceSquared =
        sq(
          point.x -
          mouseX
        )
        +
        sq(
          point.y -
          mouseY
        );

      if (
        distanceSquared <
        bestDistance
      ) {
        bestDistance =
          distanceSquared;

        bestXi = xi;
        bestEta = eta;
      }
    }
  }

  // Local refinement.
  let step =
    2 / divisions;

  for (
    let iteration = 0;
    iteration < 5;
    iteration++
  ) {
    let localXi =
      bestXi;

    let localEta =
      bestEta;

    let localDistance =
      bestDistance;

    for (
      let deltaXi = -2;
      deltaXi <= 2;
      deltaXi++
    ) {
      for (
        let deltaEta = -2;
        deltaEta <= 2;
        deltaEta++
      ) {
        const xi =
          constrain(
            bestXi +
              deltaXi *
              step,
            -1,
            1
          );

        const eta =
          constrain(
            bestEta +
              deltaEta *
              step,
            -1,
            1
          );

        const z =
          interpolateField(
            xi,
            eta
          );

        const point =
          projectPoint(
            mainPanel,
            xi,
            eta,
            z,
            -0.55,
            1.20,
            true
          );

        const distanceSquared =
          sq(
            point.x -
            mouseX
          )
          +
          sq(
            point.y -
            mouseY
          );

        if (
          distanceSquared <
          localDistance
        ) {
          localDistance =
            distanceSquared;

          localXi = xi;
          localEta = eta;
        }
      }
    }

    bestXi = localXi;
    bestEta = localEta;

    bestDistance =
      localDistance;

    step *= 0.35;
  }

  pointXi = bestXi;
  pointEta = bestEta;
}


// ============================================================
// GLOWING POINT
// ============================================================

function drawGlowingPoint(
  x,
  y
) {
  const pulse =
    0.5 +
    0.5 *
    sin(
      frameCount *
      0.10
    );

  const coreSize =
    8 +
    pulse * 2;

  const ringSize =
    15 +
    pulse * 5;

  drawingContext.save();

  drawingContext.shadowColor =
    "rgba(30,100,255,0.85)";

  drawingContext.shadowBlur =
    8 +
    pulse * 10;

  fill(
    30,
    100,
    235
  );

  noStroke();

  circle(
    x,
    y,
    coreSize
  );

  drawingContext.restore();

  noFill();

  stroke(
    30,
    100,
    235,
    120 -
      pulse * 40
  );

  strokeWeight(1);

  circle(
    x,
    y,
    ringSize
  );
}


function drawSmallPoint(
  x,
  y
) {
  fill(255);

  stroke(
    230,
    55,
    72
  );

  strokeWeight(0.8);

  circle(
    x,
    y,
    4
  );
}


// ============================================================
// COMPACT NODAL SLIDERS
// ============================================================

function drawNodalControls() {
  const count =
    elementMode === "Q4"
      ? 4
      : 8;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const geometry =
      getSliderGeometry(i);

    drawMiniSlider(
      i,
      geometry.x0,
      geometry.y,
      geometry.w
    );
  }
}


function drawMiniSlider(
  index,
  x0,
  y,
  widthValue
) {
  const minimum = -0.40;
  const maximum = 1.20;

  const knobX =
    map(
      nodalValues[index],
      minimum,
      maximum,
      x0,
      x0 + widthValue
    );

  noStroke();
  fill(65);

  textSize(6.5);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    `u${subscript(index + 1)}=${nodalValues[index].toFixed(2)}`,
    x0 +
      widthValue / 2,
    y - 9
  );

  stroke(135);
  strokeWeight(0.7);

  line(
    x0,
    y,
    x0 + widthValue,
    y
  );

  line(
    x0,
    y - 2.5,
    x0,
    y + 2.5
  );

  line(
    x0 + widthValue,
    y - 2.5,
    x0 + widthValue,
    y + 2.5
  );

  fill(255);

  stroke(
    25,
    80,
    210
  );

  strokeWeight(1);

  circle(
    knobX,
    y,
    8
  );

  noStroke();

  fill(
    25,
    80,
    210
  );

  circle(
    knobX,
    y,
    3
  );
}


function getSliderGeometry(index) {
  const starts = [
    8,
    59,
    110,
    161
  ];

  const row =
    floor(
      index / 4
    );

  const column =
    index % 4;

  return {
    x0:
      starts[column],

    y:
      row === 0
        ? sliderRow1Y
        : sliderRow2Y,

    w: 40
  };
}


function updateSliderFromMouse(
  index
) {
  const geometry =
    getSliderGeometry(index);

  nodalValues[index] =
    constrain(
      map(
        mouseX,
        geometry.x0,
        geometry.x0 +
          geometry.w,
        -0.40,
        1.20
      ),
      -0.40,
      1.20
    );
}


// ============================================================
// ORIGINAL-STYLE BUTTONS
// ============================================================

function drawElementControls() {
  noStroke();
  fill(247);

  rect(
    219,
    232,
    475,
    56,
    4
  );

  fill(50);
  textSize(8);

  textAlign(
    LEFT,
    CENTER
  );

  text(
    "Element",
    228,
    252
  );

  text(
    "Formula",
    452,
    252
  );

  drawModeButton(
    controls.q4,
    "Q4 · 4 node",
    elementMode === "Q4"
  );

  drawModeButton(
    controls.q8,
    "Q8 · 8 node",
    elementMode === "Q8"
  );

  drawModeButton(
    controls.physical,
    "Physical x,y",
    coordinateMode ===
      "PHYSICAL"
  );

  drawModeButton(
    controls.iso,
    "Isoparam ξ,η",
    coordinateMode ===
      "ISO"
  );
}


function drawModeButton(
  button,
  label,
  active
) {
  if (active) {
    noStroke();
    fill(222);

    rect(
      button.x,
      button.y,
      button.w,
      button.h,
      3
    );
  }

  noStroke();

  fill(
    active
      ? 30
      : 105
  );

  textSize(8);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    label,
    button.x +
      button.w / 2,
    button.y +
      button.h / 2
  );
}


// ============================================================
// MOUSE PRESSED
// ============================================================

function mousePressed() {
  if (
    insideRect(
      mouseX,
      mouseY,
      controls.q4
    )
  ) {
    elementMode = "Q4";
    interactionMode = null;
    activeSlider = -1;
    return;
  }

  if (
    insideRect(
      mouseX,
      mouseY,
      controls.q8
    )
  ) {
    elementMode = "Q8";
    interactionMode = null;
    activeSlider = -1;
    return;
  }

  if (
    insideRect(
      mouseX,
      mouseY,
      controls.physical
    )
  ) {
    coordinateMode =
      "PHYSICAL";

    interactionMode =
      null;

    activeSlider = -1;
    return;
  }

  if (
    insideRect(
      mouseX,
      mouseY,
      controls.iso
    )
  ) {
    coordinateMode =
      "ISO";

    interactionMode =
      null;

    activeSlider = -1;
    return;
  }

  const sliderCount =
    elementMode === "Q4"
      ? 4
      : 8;

  for (
    let i = 0;
    i < sliderCount;
    i++
  ) {
    const geometry =
      getSliderGeometry(i);

    if (
      mouseX >=
        geometry.x0 - 5
      &&
      mouseX <=
        geometry.x0 +
        geometry.w +
        5
      &&
      abs(
        mouseY -
        geometry.y
      ) <= 8
    ) {
      activeSlider = i;
      interactionMode = null;

      updateSliderFromMouse(i);

      return;
    }
  }

  const currentPoint =
    getCurrentPointScreenPosition();

  if (
    insidePanel(
      mouseX,
      mouseY,
      mainPanel
    )
    &&
    dist(
      mouseX,
      mouseY,
      currentPoint.x,
      currentPoint.y
    ) <= pointGrabRadius
  ) {
    activeSlider = -1;

    interactionMode =
      "point";

    updatePointFromMouse();

    return;
  }

  if (
    mouseIsOverAnyPanel()
  ) {
    activeSlider = -1;

    interactionMode =
      "rotate";

    lastMouseX =
      mouseX;

    lastMouseY =
      mouseY;
  }
}


// ============================================================
// MOUSE DRAGGED
// ============================================================

function mouseDragged() {
  if (
    activeSlider >= 0
  ) {
    updateSliderFromMouse(
      activeSlider
    );

    return false;
  }

  if (
    interactionMode ===
    "point"
  ) {
    updatePointFromMouse();

    return false;
  }

  if (
    interactionMode ===
    "rotate"
  ) {
    const dx =
      mouseX -
      lastMouseX;

    const dy =
      mouseY -
      lastMouseY;

    viewYaw +=
      dx * 0.011;

    viewPitch +=
      dy * 0.009;

    // No pitch constraint:
    // full rotation is permitted.

    lastMouseX =
      mouseX;

    lastMouseY =
      mouseY;

    return false;
  }
}


// ============================================================
// MOUSE RELEASED
// ============================================================

function mouseReleased() {
  interactionMode = null;
  activeSlider = -1;
}


// ============================================================
// CURSOR
// ============================================================

function updateCursor() {
  const sliderCount =
    elementMode === "Q4"
      ? 4
      : 8;

  for (
    let i = 0;
    i < sliderCount;
    i++
  ) {
    const geometry =
      getSliderGeometry(i);

    if (
      mouseX >=
        geometry.x0 - 5
      &&
      mouseX <=
        geometry.x0 +
        geometry.w +
        5
      &&
      abs(
        mouseY -
        geometry.y
      ) <= 8
    ) {
      cursor(HAND);
      return;
    }
  }

  const overButton =
    Object.values(
      controls
    ).some(
      button =>
        insideRect(
          mouseX,
          mouseY,
          button
        )
    );

  if (overButton) {
    cursor(HAND);
    return;
  }

  const currentPoint =
    getCurrentPointScreenPosition();

  if (
    insidePanel(
      mouseX,
      mouseY,
      mainPanel
    )
    &&
    dist(
      mouseX,
      mouseY,
      currentPoint.x,
      currentPoint.y
    ) <= pointGrabRadius
  ) {
    cursor(HAND);
    return;
  }

  if (
    mouseIsOverAnyPanel()
  ) {
    cursor(
      interactionMode ===
        "rotate"
        ? "grabbing"
        : "grab"
    );

    return;
  }

  cursor(ARROW);
}


// ============================================================
// DRAWING HELPERS
// ============================================================

function drawPanelFrame(panel) {
  stroke(215);
  strokeWeight(0.7);
  fill(255);

  rect(
    panel.x,
    panel.y,
    panel.w,
    panel.h,
    3
  );
}


function drawPanelTitle(
  panel,
  title,
  size
) {
  noStroke();
  fill(40);
  textSize(size);

  textAlign(
    CENTER,
    TOP
  );

  text(
    title,
    panel.x +
      panel.w / 2,
    panel.y + 6
  );
}


function surfaceColor(
  value,
  minimum,
  maximum
) {
  const t =
    constrain(
      map(
        value,
        minimum,
        maximum,
        0,
        1
      ),
      0,
      1
    );

  const low =
    color(
      65,
      63,
      190
    );

  const middle =
    color(
      31,
      190,
      205
    );

  const high =
    color(
      249,
      225,
      48
    );

  if (t < 0.5) {
    return lerpColor(
      low,
      middle,
      t * 2
    );
  }

  return lerpColor(
    middle,
    high,
    (t - 0.5) * 2
  );
}


function mouseIsOverAnyPanel() {
  if (
    insidePanel(
      mouseX,
      mouseY,
      mainPanel
    )
  ) {
    return true;
  }

  return getCurrentPanels()
    .some(
      panel =>
        insidePanel(
          mouseX,
          mouseY,
          panel
        )
    );
}


function insidePanel(
  x,
  y,
  panel
) {
  return (
    x >= panel.x
    &&
    x <=
      panel.x +
      panel.w
    &&
    y >= panel.y
    &&
    y <=
      panel.y +
      panel.h
  );
}


function insideRect(
  x,
  y,
  rectangle
) {
  return (
    x >= rectangle.x
    &&
    x <=
      rectangle.x +
      rectangle.w
    &&
    y >= rectangle.y
    &&
    y <=
      rectangle.y +
      rectangle.h
  );
}


function subscript(number) {
  const characters = [
    "₀", "₁", "₂", "₃", "₄",
    "₅", "₆", "₇", "₈", "₉"
  ];

  return String(number)
    .split("")
    .map(
      character =>
        characters[
          Number(character)
        ]
    )
    .join("");
}