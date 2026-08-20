// ============================================================
// CST / LST TRIANGULAR SHAPE FUNCTIONS
//
// CST:
//   3-node linear triangle
//
// LST:
//   6-node quadratic triangle
//
// LAYOUT
// ------------------------------------------------------------
// • Main element on left
// • Shape functions on right
// • Main element frame narrowed without reducing element scale
// • Shape-function plots enlarged
// • Sliders below main element
// • LST sliders use two rows
// • Element selector below shape-function plots
//
// INTERACTION
// ------------------------------------------------------------
// • Drag glowing blue point -> move point P
// • Drag elsewhere on ANY plot -> rotate ALL plots together
//
// AXIS TRIAD
// ------------------------------------------------------------
// X = red
// Y = green
// Z = blue
//
// LST NODE ORDER:
//
//             3
//             *
//            / \
//           6   5
//          *     *
//         /       \
//        *----*----*
//        1    4    2
//
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const W = 700;
const H = 292;


// ============================================================
// ELEMENT MODE
// ============================================================

let elementMode = "CST";


// ============================================================
// REFERENCE TRIANGLE
// ============================================================

const refNodes = [

  { x: 0.00, y: 0.00 },   // Node 1

  { x: 1.00, y: 0.00 },   // Node 2

  { x: 0.28, y: 0.85 }    // Node 3

];


// ============================================================
// ROTATION CENTER
// ============================================================

const triCenter = {

  x:
    (
      refNodes[0].x +
      refNodes[1].x +
      refNodes[2].x
    ) / 3,

  y:
    (
      refNodes[0].y +
      refNodes[1].y +
      refNodes[2].y
    ) / 3

};


// ============================================================
// MAIN PANEL
//
// Narrower frame.
//
// The projection scale remains large so the actual
// element does not become smaller.
// ============================================================

const mainPanel = {

  x: 6,
  y: 6,

  w: 205,
  h: 220

};


// ============================================================
// CST SHAPE-FUNCTION PANELS
//
// Wider panels than before.
// ============================================================

const cstShapePanels = [

  {
    x: 219,
    y: 6,
    w: 155,
    h: 220
  },

  {
    x: 380,
    y: 6,
    w: 155,
    h: 220
  },

  {
    x: 541,
    y: 6,
    w: 153,
    h: 220
  }

];


// ============================================================
// LST SHAPE-FUNCTION PANELS
//
//        N1   N2   N3
//        N4   N5   N6
// ============================================================

const lstShapePanels = [

  // ----------------------------------------------------------
  // TOP ROW
  // ----------------------------------------------------------

  {
    x: 219,
    y: 6,
    w: 155,
    h: 106
  },

  {
    x: 380,
    y: 6,
    w: 155,
    h: 106
  },

  {
    x: 541,
    y: 6,
    w: 153,
    h: 106
  },


  // ----------------------------------------------------------
  // BOTTOM ROW
  // ----------------------------------------------------------

  {
    x: 219,
    y: 120,
    w: 155,
    h: 106
  },

  {
    x: 380,
    y: 120,
    w: 155,
    h: 106
  },

  {
    x: 541,
    y: 120,
    w: 153,
    h: 106
  }

];


// ============================================================
// CURRENT POINT P
//
// Stored as barycentric coordinates:
//
// L1 + L2 + L3 = 1
// ============================================================

let currentBary = [

  0.42,
  0.30,
  0.28

];


// ============================================================
// NODAL VALUES
// ============================================================

let nodalValues = [

  0.20,   // u1
  0.80,   // u2
  0.45,   // u3

  0.60,   // u4
  0.30,   // u5
  0.70    // u6

];


// ============================================================
// SHARED VIEW
//
// Every plot uses these SAME camera angles.
// ============================================================

let viewYaw = -0.55;

let viewPitch = 0.72;


// ============================================================
// ROTATION SETTINGS
// ============================================================

const rotationCenterZ = 0.32;

const worldZScale = 0.88;


// ============================================================
// INTERACTION
// ============================================================

let interactionMode = null;

// null
// "point"
// "rotate"

let lastMouseX = 0;
let lastMouseY = 0;

const pointGrabRadius = 17;


// ============================================================
// SLIDER INTERACTION
// ============================================================

let activeSlider = -1;


// ============================================================
// CONTROL POSITIONS
// ============================================================

const sliderRow1Y = 251;

const sliderRow2Y = 275;

const controlsY = 263;


// ============================================================
// SUBSCRIPTS
// ============================================================

const subscripts = [

  "₁",
  "₂",
  "₃",
  "₄",
  "₅",
  "₆"

];


// ============================================================
// SETUP
// ============================================================

function setup() {

  createCanvas(
    W,
    H
  );

  pixelDensity(2);

  textFont("Arial");
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  background(255);


  // ==========================================================
  // MAIN FIELD
  // ==========================================================

  const values =
    getCurrentNodalValues();


  drawMainPanel(
    values
  );


  // ==========================================================
  // SHAPE FUNCTIONS
  // ==========================================================

  drawShapeFunctionPanels();


  // ==========================================================
  // NODAL SLIDERS
  // ==========================================================

  drawNodalControls();


  // ==========================================================
  // ELEMENT SELECTOR
  // ==========================================================

  drawElementControls();


  // ==========================================================
  // CURSOR
  // ==========================================================

  updateCursor();
}


// ============================================================
// CURRENT NODAL VALUES
// ============================================================

function getCurrentNodalValues() {

  const count =
    elementMode === "CST"
      ? 3
      : 6;


  return nodalValues.slice(
    0,
    count
  );
}


// ============================================================
// ELEMENT NODE BARYCENTRIC COORDINATES
// ============================================================

function getElementNodeBarycentrics() {

  // ==========================================================
  // CST
  // ==========================================================

  if (
    elementMode === "CST"
  ) {

    return [

      [1, 0, 0],

      [0, 1, 0],

      [0, 0, 1]

    ];
  }


  // ==========================================================
  // LST
  //
  // Node 4 = midpoint 1-2
  // Node 5 = midpoint 2-3
  // Node 6 = midpoint 3-1
  // ==========================================================

  return [

    [1,   0,   0],     // 1

    [0,   1,   0],     // 2

    [0,   0,   1],     // 3

    [0.5, 0.5, 0],     // 4

    [0,   0.5, 0.5],   // 5

    [0.5, 0,   0.5]    // 6

  ];
}


// ============================================================
// SHAPE FUNCTIONS
// ============================================================

function shapeFunctions(
  bary
) {

  const L1 = bary[0];

  const L2 = bary[1];

  const L3 = bary[2];


  // ==========================================================
  // CST
  // ==========================================================

  if (
    elementMode === "CST"
  ) {

    return [

      L1,
      L2,
      L3

    ];
  }


  // ==========================================================
  // LST
  // ==========================================================

  const N1 =
    L1 *
    (
      2 * L1 - 1
    );


  const N2 =
    L2 *
    (
      2 * L2 - 1
    );


  const N3 =
    L3 *
    (
      2 * L3 - 1
    );


  const N4 =
    4 *
    L1 *
    L2;


  const N5 =
    4 *
    L2 *
    L3;


  const N6 =
    4 *
    L3 *
    L1;


  return [

    N1,
    N2,
    N3,
    N4,
    N5,
    N6

  ];
}


// ============================================================
// INTERPOLATED FIELD
// ============================================================

function interpolateField(
  bary,
  nodalValuesLocal
) {

  const N =
    shapeFunctions(
      bary
    );


  let value = 0;


  for (
    let i = 0;
    i < N.length;
    i++
  ) {

    value +=
      N[i] *
      nodalValuesLocal[i];
  }


  return value;
}


// ============================================================
// MAIN PANEL
// ============================================================

function drawMainPanel(
  nodalValuesLocal
) {

  // ==========================================================
  // PANEL FRAME
  // ==========================================================

  stroke(232);

  strokeWeight(1);

  noFill();


  rect(

    mainPanel.x,
    mainPanel.y,

    mainPanel.w,
    mainPanel.h,

    5

  );


  // ==========================================================
  // TITLE
  // ==========================================================

  noStroke();

  fill(35);


  textSize(13);

  textAlign(
    LEFT,
    TOP
  );


  text(

    "u(x,y)",

    mainPanel.x + 9,
    mainPanel.y + 8

  );


  // ==========================================================
  // FIELD FUNCTION
  // ==========================================================

  const fieldFunction =
    function (
      bary
    ) {

      return interpolateField(

        bary,

        nodalValuesLocal

      );

    };


  // ==========================================================
  // SURFACE
  // ==========================================================

  drawFieldSurface(

    mainPanel,

    fieldFunction,

    true,

    -1

  );
}


// ============================================================
// SHAPE FUNCTION PANELS
// ============================================================

function drawShapeFunctionPanels() {

  const panels =
    getCurrentShapePanels();


  const numberOfFunctions =
    elementMode === "CST"
      ? 3
      : 6;


  for (
    let i = 0;
    i < numberOfFunctions;
    i++
  ) {

    const panel =
      panels[i];


    // ========================================================
    // PANEL FRAME
    // ========================================================

    stroke(232);

    strokeWeight(1);

    noFill();


    rect(

      panel.x,
      panel.y,

      panel.w,
      panel.h,

      5

    );


    // ========================================================
    // TITLE
    // ========================================================

    noStroke();

    fill(35);


    textAlign(
      LEFT,
      TOP
    );


    textSize(
      elementMode === "CST"
        ? 12
        : 10
    );


    text(

      "N" +
      subscripts[i],

      panel.x + 7,
      panel.y + 6

    );


    // ========================================================
    // SHAPE FUNCTION
    // ========================================================

    const shapeIndex = i;


    const fieldFunction =
      function (
        bary
      ) {

        return shapeFunctions(
          bary
        )[shapeIndex];

      };


    drawFieldSurface(

      panel,

      fieldFunction,

      false,

      shapeIndex

    );
  }
}


// ============================================================
// CURRENT SHAPE PANELS
// ============================================================

function getCurrentShapePanels() {

  if (
    elementMode === "CST"
  ) {

    return cstShapePanels;
  }


  return lstShapePanels;
}


// ============================================================
// DRAW FIELD SURFACE
// ============================================================

function drawFieldSurface(

  panel,

  fieldFunction,

  main,

  unitNode

) {

  const proj =
    makeProjection(
      panel,
      main
    );


  // ==========================================================
  // BASE TRIANGLE
  // ==========================================================

  const baseCorners = [

    projectPoint(
      refNodes[0].x,
      refNodes[0].y,
      0,
      proj
    ),

    projectPoint(
      refNodes[1].x,
      refNodes[1].y,
      0,
      proj
    ),

    projectPoint(
      refNodes[2].x,
      refNodes[2].y,
      0,
      proj
    )

  ];


  stroke(170);

  strokeWeight(0.7);

  noFill();


  drawingContext.setLineDash(
    [4, 4]
  );


  polylineClosed(
    baseCorners
  );


  drawingContext.setLineDash([]);


  // ==========================================================
  // SURFACE MESH
  // ==========================================================

  drawSurfaceMesh(

    fieldFunction,

    proj,

    main

  );


  // ==========================================================
  // SURFACE BOUNDARY
  // ==========================================================

  drawSurfaceBoundary(

    fieldFunction,

    proj,

    main

  );


  // ==========================================================
  // ORIGIN TRIAD
  // ==========================================================

  drawOriginTriad(

    panel,

    main

  );


  // ==========================================================
  // ELEMENT NODES
  // ==========================================================

  drawElementNodes(

    fieldFunction,

    proj,

    main,

    unitNode

  );


  // ==========================================================
  // CURRENT POINT P
  // ==========================================================

  const currentValue =
    fieldFunction(
      currentBary
    );


  const Pxy =
    pointFromBary(

      currentBary,

      refNodes

    );


  const Pbase =
    projectPoint(

      Pxy.x,
      Pxy.y,
      0,

      proj

    );


  const Ptop =
    projectPoint(

      Pxy.x,
      Pxy.y,
      currentValue,

      proj

    );


  // ==========================================================
  // GUIDE LINE
  // ==========================================================

  stroke(
    30,
    100,
    230,
    140
  );


  strokeWeight(0.7);


  drawingContext.setLineDash(
    [3, 3]
  );


  line(

    Pbase.x,
    Pbase.y,

    Ptop.x,
    Ptop.y

  );


  drawingContext.setLineDash([]);


  // ==========================================================
  // CURRENT POINT
  // ==========================================================

  if (
    main
  ) {

    drawGlowingPoint(

      Ptop.x,
      Ptop.y

    );

  } else {

    fill(
      30,
      100,
      230
    );


    noStroke();


    circle(

      Ptop.x,
      Ptop.y,

      elementMode === "LST"
        ? 5
        : 6

    );
  }
}


// ============================================================
// SURFACE MESH
// ============================================================

function drawSurfaceMesh(

  fieldFunction,

  proj,

  main

) {

  let n;


  // ==========================================================
  // CST
  // ==========================================================

  if (
    elementMode === "CST"
  ) {

    n = 1;

  }


  // ==========================================================
  // LST
  // ==========================================================

  else {

    n =
      main
        ? 14
        : 9;
  }


  // ==========================================================
  // FILL
  // ==========================================================

  noStroke();


  if (
    main
  ) {

    fill(
      225,
      236,
      255,
      180
    );

  } else {

    fill(
      255,
      232,
      232,
      170
    );
  }


  // ==========================================================
  // TRIANGULATE BARYCENTRIC DOMAIN
  // ==========================================================

  for (
    let i = 0;
    i < n;
    i++
  ) {

    for (
      let j = 0;
      j < n - i;
      j++
    ) {

      // ------------------------------------------------------
      // FIRST SMALL TRIANGLE
      // ------------------------------------------------------

      const A =
        baryFromRS(

          i / n,
          j / n

        );


      const B =
        baryFromRS(

          (i + 1) / n,
          j / n

        );


      const C =
        baryFromRS(

          i / n,
          (j + 1) / n

        );


      drawSurfaceTriangle(

        A,
        B,
        C,

        fieldFunction,

        proj

      );


      // ------------------------------------------------------
      // SECOND SMALL TRIANGLE
      // ------------------------------------------------------

      if (
        i + j <
        n - 1
      ) {

        const D =
          baryFromRS(

            (i + 1) / n,
            (j + 1) / n

          );


        drawSurfaceTriangle(

          B,
          D,
          C,

          fieldFunction,

          proj

        );
      }
    }
  }
}


// ============================================================
// DRAW ONE SURFACE TRIANGLE
// ============================================================

function drawSurfaceTriangle(

  b1,
  b2,
  b3,

  fieldFunction,

  proj

) {

  const p1 =
    projectFieldPoint(

      b1,

      fieldFunction,

      proj

    );


  const p2 =
    projectFieldPoint(

      b2,

      fieldFunction,

      proj

    );


  const p3 =
    projectFieldPoint(

      b3,

      fieldFunction,

      proj

    );


  triangle(

    p1.x,
    p1.y,

    p2.x,
    p2.y,

    p3.x,
    p3.y

  );
}


// ============================================================
// SURFACE BOUNDARY
// ============================================================

function drawSurfaceBoundary(

  fieldFunction,

  proj,

  main

) {

  if (
    main
  ) {

    stroke(
      35,
      90,
      220
    );

  } else {

    stroke(
      225,
      65,
      65
    );
  }


  strokeWeight(
    main
      ? 1.8
      : 1.5
  );


  noFill();


  const segments =
    elementMode === "LST"
      ? 24
      : 1;


  // ==========================================================
  // EDGE 1 -> 2
  // ==========================================================

  beginShape();


  for (
    let k = 0;
    k <= segments;
    k++
  ) {

    const t =
      k / segments;


    const bary = [

      1 - t,
      t,
      0

    ];


    const p =
      projectFieldPoint(

        bary,

        fieldFunction,

        proj

      );


    vertex(
      p.x,
      p.y
    );
  }


  endShape();


  // ==========================================================
  // EDGE 2 -> 3
  // ==========================================================

  beginShape();


  for (
    let k = 0;
    k <= segments;
    k++
  ) {

    const t =
      k / segments;


    const bary = [

      0,
      1 - t,
      t

    ];


    const p =
      projectFieldPoint(

        bary,

        fieldFunction,

        proj

      );


    vertex(
      p.x,
      p.y
    );
  }


  endShape();


  // ==========================================================
  // EDGE 3 -> 1
  // ==========================================================

  beginShape();


  for (
    let k = 0;
    k <= segments;
    k++
  ) {

    const t =
      k / segments;


    const bary = [

      t,
      0,
      1 - t

    ];


    const p =
      projectFieldPoint(

        bary,

        fieldFunction,

        proj

      );


    vertex(
      p.x,
      p.y
    );
  }


  endShape();
}


// ============================================================
// ELEMENT NODES
// ============================================================

function drawElementNodes(

  fieldFunction,

  proj,

  main,

  unitNode

) {

  const nodeBarys =
    getElementNodeBarycentrics();


  for (
    let i = 0;
    i < nodeBarys.length;
    i++
  ) {

    const bary =
      nodeBarys[i];


    const p =
      projectFieldPoint(

        bary,

        fieldFunction,

        proj

      );


    // ========================================================
    // UNIT NODE
    // ========================================================

    if (
      !main &&
      i === unitNode
    ) {

      fill(
        220,
        55,
        55
      );


      noStroke();


      circle(

        p.x,
        p.y,

        elementMode === "LST"
          ? 5
          : 7

      );


      fill(
        210,
        45,
        45
      );


      textAlign(
        CENTER,
        BOTTOM
      );


      textSize(
        elementMode === "LST"
          ? 7
          : 9
      );


      text(

        "1",

        p.x,
        p.y - 4

      );

    }


    // ========================================================
    // OTHER NODES
    // ========================================================

    else {

      fill(0);

      noStroke();


      circle(

        p.x,
        p.y,

        elementMode === "LST"
          ? 3.5
          : 5

      );


      if (
        !main
      ) {

        fill(100);


        textAlign(
          CENTER,
          TOP
        );


        textSize(
          elementMode === "LST"
            ? 6
            : 8
        );


        text(

          "0",

          p.x,
          p.y + 3

        );
      }
    }


    // ========================================================
    // NODE NUMBERS ON MAIN ELEMENT
    // ========================================================

    if (
      main
    ) {

      const off =
        getNodeLabelOffset(
          i
        );


      fill(50);


      textAlign(
        CENTER,
        CENTER
      );


      textSize(
        elementMode === "LST"
          ? 7
          : 8
      );


      text(

        String(
          i + 1
        ),

        p.x + off.x,
        p.y + off.y

      );
    }
  }
}


// ============================================================
// NODE LABEL OFFSETS
// ============================================================

function getNodeLabelOffset(
  i
) {

  const offsets = [

    { x: -7, y: 8 },

    { x:  7, y: 8 },

    { x:  0, y: -9 },

    { x:  0, y: 8 },

    { x:  7, y: 0 },

    { x: -7, y: 0 }

  ];


  return offsets[i];
}


// ============================================================
// PROJECT FIELD POINT
// ============================================================

function projectFieldPoint(

  bary,

  fieldFunction,

  proj

) {

  const xy =
    pointFromBary(

      bary,

      refNodes

    );


  const z =
    fieldFunction(
      bary
    );


  return projectPoint(

    xy.x,
    xy.y,
    z,

    proj

  );
}


// ============================================================
// BARYCENTRIC FROM r,s
// ============================================================

function baryFromRS(
  r,
  s
) {

  return [

    1 - r - s,

    r,

    s

  ];
}


// ============================================================
// ORIGIN TRIAD
//
// X = RED
// Y = GREEN
// Z = BLUE
// ============================================================

function drawOriginTriad(

  panel,

  main

) {

  const proj =
    makeProjection(

      panel,

      main

    );


  let L;


  if (
    main
  ) {

    L = 0.18;

  }

  else if (
    elementMode === "LST"
  ) {

    L = 0.13;

  }

  else {

    L = 0.16;
  }


  // ==========================================================
  // ORIGIN
  // ==========================================================

  const O =
    projectPoint(

      0,
      0,
      0,

      proj

    );


  // ==========================================================
  // AXIS ENDS
  // ==========================================================

  const X =
    projectPoint(

      L,
      0,
      0,

      proj

    );


  const Y =
    projectPoint(

      0,
      L,
      0,

      proj

    );


  const Z =
    projectPoint(

      0,
      0,
      L,

      proj

    );


  // ==========================================================
  // ORIGIN DOT
  // ==========================================================

  fill(45);

  noStroke();


  circle(

    O.x,
    O.y,

    main
      ? 3.5
      : 2.5

  );


  // ==========================================================
  // X
  // ==========================================================

  stroke(
    220,
    50,
    50
  );


  strokeWeight(
    main
      ? 1.4
      : 1
  );


  line(

    O.x,
    O.y,

    X.x,
    X.y

  );


  drawArrowHead(

    O,
    X,

    color(
      220,
      50,
      50
    ),

    main

  );


  // ==========================================================
  // Y
  // ==========================================================

  stroke(
    30,
    165,
    75
  );


  strokeWeight(
    main
      ? 1.4
      : 1
  );


  line(

    O.x,
    O.y,

    Y.x,
    Y.y

  );


  drawArrowHead(

    O,
    Y,

    color(
      30,
      165,
      75
    ),

    main

  );


  // ==========================================================
  // Z
  // ==========================================================

  stroke(
    35,
    100,
    230
  );


  strokeWeight(
    main
      ? 1.4
      : 1
  );


  line(

    O.x,
    O.y,

    Z.x,
    Z.y

  );


  drawArrowHead(

    O,
    Z,

    color(
      35,
      100,
      230
    ),

    main

  );


  // ==========================================================
  // LABELS
  // ==========================================================

  noStroke();


  textAlign(
    CENTER,
    CENTER
  );


  textSize(
    main
      ? 7
      : 6
  );


  fill(
    220,
    50,
    50
  );


  text(

    "x",

    X.x + 4,
    X.y

  );


  fill(
    30,
    165,
    75
  );


  text(

    "y",

    Y.x + 3,
    Y.y - 1

  );


  fill(
    35,
    100,
    230
  );


  text(

    "z",

    Z.x + 3,
    Z.y - 2

  );
}


// ============================================================
// ARROW HEAD
// ============================================================

function drawArrowHead(

  start,

  end,

  arrowColor,

  main

) {

  const dx =
    end.x -
    start.x;


  const dy =
    end.y -
    start.y;


  const angle =
    atan2(
      dy,
      dx
    );


  const size =
    main
      ? 4
      : 3;


  fill(
    arrowColor
  );


  noStroke();


  push();


  translate(

    end.x,
    end.y

  );


  rotate(
    angle
  );


  triangle(

    0,
    0,

    -size,
    -size * 0.45,

    -size,
    size * 0.45

  );


  pop();
}


// ============================================================
// GLOWING / PULSATING POINT
// ============================================================

function drawGlowingPoint(
  x,
  y
) {

  const pulse =

    0.5

    +

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


  // ==========================================================
  // GLOW
  // ==========================================================

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


  // ==========================================================
  // PULSE RING
  // ==========================================================

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


// ============================================================
// PROJECTION SETTINGS
//
// Main element retains its previous scale.
//
// Right-hand shape functions are slightly larger.
// ============================================================

function makeProjection(

  panel,

  main

) {

  let scale;


  // ==========================================================
  // MAIN
  // ==========================================================

  if (
    main
  ) {

    scale = 118;

  }


  // ==========================================================
  // LST SHAPE FUNCTIONS
  // ==========================================================

  else if (
    elementMode === "LST"
  ) {

    scale = 53;

  }


  // ==========================================================
  // CST SHAPE FUNCTIONS
  // ==========================================================

  else {

    scale = 82;
  }


  return {

    cx:

      panel.x +
      panel.w *
      0.50,


    cy:

      panel.y +
      panel.h *
      0.60,


    scale:
      scale

  };
}


// ============================================================
// 3D ROTATION + 2D PROJECTION
// ============================================================

function projectPoint(

  X,

  Y,

  Z,

  cfg

) {

  // ==========================================================
  // CENTER OBJECT
  // ==========================================================

  let x =
    X -
    triCenter.x;


  let y =
    Y -
    triCenter.y;


  let z =

    (
      Z -
      rotationCenterZ
    )

    *

    worldZScale;


  // ==========================================================
  // YAW
  // ==========================================================

  const cYaw =
    cos(
      viewYaw
    );


  const sYaw =
    sin(
      viewYaw
    );


  const x1 =

    x *
    cYaw

    -

    y *
    sYaw;


  const y1 =

    x *
    sYaw

    +

    y *
    cYaw;


  // ==========================================================
  // PITCH
  // ==========================================================

  const cPitch =
    cos(
      viewPitch
    );


  const sPitch =
    sin(
      viewPitch
    );


  const y2 =

    y1 *
    cPitch

    -

    z *
    sPitch;


  // ==========================================================
  // SCREEN COORDINATES
  // ==========================================================

  return {

    x:

      cfg.cx

      +

      cfg.scale *
      x1,


    y:

      cfg.cy

      +

      cfg.scale *
      y2

  };
}


// ============================================================
// NODAL CONTROLS
//
// LEFT SIDE ONLY
//
// CST:
// u1 u2 u3
//
// LST:
// u1 u2 u3
// u4 u5 u6
// ============================================================

function drawNodalControls() {

  const sliderWidth = 52;


  const starts = [

    13,
    80,
    147

  ];


  // ==========================================================
  // ROW 1
  //
  // u1 u2 u3
  // ==========================================================

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    drawMiniSlider(

      i,

      starts[i],

      sliderRow1Y,

      sliderWidth

    );
  }


  // ==========================================================
  // ROW 2
  //
  // LST only:
  // u4 u5 u6
  // ==========================================================

  if (
    elementMode === "LST"
  ) {

    for (
      let i = 3;
      i < 6;
      i++
    ) {

      drawMiniSlider(

        i,

        starts[i - 3],

        sliderRow2Y,

        sliderWidth

      );
    }
  }
}


// ============================================================
// MINI SLIDER
// ============================================================

function drawMiniSlider(

  index,

  x0,

  y,

  w

) {

  const minValue = -0.40;

  const maxValue = 1.20;


  const knobX =

    map(

      nodalValues[index],

      minValue,
      maxValue,

      x0,
      x0 + w

    );


  // ==========================================================
  // LABEL
  // ==========================================================

  noStroke();

  fill(65);


  textSize(7.5);


  textAlign(
    CENTER,
    CENTER
  );


  text(

    `u${subscripts[index]} = ${nodalValues[index].toFixed(2)}`,

    x0 + w / 2,
    y - 11

  );


  // ==========================================================
  // TRACK
  // ==========================================================

  stroke(135);

  strokeWeight(0.8);


  line(

    x0,
    y,

    x0 + w,
    y

  );


  // ==========================================================
  // END TICKS
  // ==========================================================

  line(

    x0,
    y - 3,

    x0,
    y + 3

  );


  line(

    x0 + w,
    y - 3,

    x0 + w,
    y + 3

  );


  // ==========================================================
  // KNOB
  // ==========================================================

  fill(255);


  stroke(
    25,
    80,
    210
  );


  strokeWeight(1.25);


  circle(

    knobX,
    y,

    10

  );


  // ==========================================================
  // CENTER DOT
  // ==========================================================

  noStroke();


  fill(
    25,
    80,
    210
  );


  circle(

    knobX,
    y,

    4

  );
}


// ============================================================
// SLIDER GEOMETRY
// ============================================================

function getSliderGeometry(
  index
) {

  const sliderWidth = 52;


  const starts = [

    13,
    80,
    147

  ];


  // ==========================================================
  // U1 U2 U3
  // ==========================================================

  if (
    index < 3
  ) {

    return {

      x0:
        starts[index],

      w:
        sliderWidth,

      y:
        sliderRow1Y

    };
  }


  // ==========================================================
  // U4 U5 U6
  // ==========================================================

  return {

    x0:
      starts[index - 3],

    w:
      sliderWidth,

    y:
      sliderRow2Y

  };
}


// ============================================================
// UPDATE SLIDER VALUE
// ============================================================

function updateSliderFromMouse(
  index
) {

  const g =
    getSliderGeometry(
      index
    );


  nodalValues[index] =

    constrain(

      map(

        mouseX,

        g.x0,
        g.x0 + g.w,

        -0.40,
        1.20

      ),

      -0.40,
      1.20

    );
}


// ============================================================
// ELEMENT CONTROLS
//
// Positioned under the SHAPE-FUNCTION side.
// ============================================================

function drawElementControls() {

  // ==========================================================
  // BACKGROUND
  // ==========================================================

  noStroke();

  fill(247);


  rect(

    270,
    controlsY - 14,

    330,
    28,

    4

  );


  // ==========================================================
  // ELEMENT LABEL
  // ==========================================================

  fill(50);


  textSize(10);


  textAlign(
    LEFT,
    CENTER
  );


  text(

    "Element",

    285,
    controlsY

  );


  // ==========================================================
  // CST
  // ==========================================================

  drawModeButton(

    345,
    controlsY,

    "CST · 3 node",

    elementMode === "CST"

  );


  // ==========================================================
  // LST
  // ==========================================================

  drawModeButton(

    440,
    controlsY,

    "LST · 6 node",

    elementMode === "LST"

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

  const w = 90;

  const h = 20;


  // ==========================================================
  // ACTIVE BACKGROUND
  // ==========================================================

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


  // ==========================================================
  // LABEL
  // ==========================================================

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
// MAIN FIELD FUNCTION
// ============================================================

function getMainFieldFunction() {

  const values =
    getCurrentNodalValues();


  return function (
    bary
  ) {

    return interpolateField(

      bary,

      values

    );

  };
}


// ============================================================
// SCREEN POINT ON FIELD
// ============================================================

function getScreenPointOnField(

  bary,

  panel,

  fieldFunction,

  main

) {

  const proj =
    makeProjection(

      panel,

      main

    );


  return projectFieldPoint(

    bary,

    fieldFunction,

    proj

  );
}


// ============================================================
// MOVE POINT P
//
// Numerical search works for:
//
// • CST plane
// • LST quadratic surface
// ============================================================

function updatePointFromMouse() {

  const fieldFunction =
    getMainFieldFunction();


  let bestBary =
    currentBary.slice();


  let bestDistance =
    Infinity;


  // ==========================================================
  // COARSE SEARCH
  // ==========================================================

  const n = 28;


  for (
    let i = 0;
    i <= n;
    i++
  ) {

    for (
      let j = 0;
      j <= n - i;
      j++
    ) {

      const bary = [

        1 -
        i / n -
        j / n,

        i / n,

        j / n

      ];


      const p =
        getScreenPointOnField(

          bary,

          mainPanel,

          fieldFunction,

          true

        );


      const d =

        sq(
          p.x -
          mouseX
        )

        +

        sq(
          p.y -
          mouseY
        );


      if (
        d <
        bestDistance
      ) {

        bestDistance =
          d;


        bestBary =
          bary;
      }
    }
  }


  // ==========================================================
  // LOCAL REFINEMENT
  // ==========================================================

  let step =
    1 / n;


  for (
    let iteration = 0;
    iteration < 4;
    iteration++
  ) {

    let localBest =
      bestBary.slice();


    let localDistance =
      bestDistance;


    for (
      let dr = -2;
      dr <= 2;
      dr++
    ) {

      for (
        let ds = -2;
        ds <= 2;
        ds++
      ) {

        const candidate = [

          0,

          bestBary[1] +
          dr * step,

          bestBary[2] +
          ds * step

        ];


        candidate[0] =

          1

          -

          candidate[1]

          -

          candidate[2];


        const clamped =
          clampBarycentric(
            candidate
          );


        const p =
          getScreenPointOnField(

            clamped,

            mainPanel,

            fieldFunction,

            true

          );


        const d =

          sq(
            p.x -
            mouseX
          )

          +

          sq(
            p.y -
            mouseY
          );


        if (
          d <
          localDistance
        ) {

          localDistance =
            d;


          localBest =
            clamped;
        }
      }
    }


    bestBary =
      localBest;


    bestDistance =
      localDistance;


    step *= 0.35;
  }


  currentBary =
    bestBary;
}


// ============================================================
// MOUSE PRESSED
// ============================================================

function mousePressed() {

  // ==========================================================
  // CST BUTTON
  // ==========================================================

  if (

    insideRect(

      mouseX,
      mouseY,

      345,
      controlsY - 10,

      90,
      20

    )

  ) {

    elementMode =
      "CST";


    activeSlider =
      -1;


    interactionMode =
      null;


    return;
  }


  // ==========================================================
  // LST BUTTON
  // ==========================================================

  if (

    insideRect(

      mouseX,
      mouseY,

      440,
      controlsY - 10,

      90,
      20

    )

  ) {

    elementMode =
      "LST";


    activeSlider =
      -1;


    interactionMode =
      null;


    return;
  }


  // ==========================================================
  // SLIDERS
  // ==========================================================

  const count =
    elementMode === "CST"
      ? 3
      : 6;


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const g =
      getSliderGeometry(
        i
      );


    if (

      mouseX >=
      g.x0 - 6

      &&

      mouseX <=
      g.x0 + g.w + 6

      &&

      abs(
        mouseY -
        g.y
      )

      <=
      9

    ) {

      activeSlider =
        i;


      interactionMode =
        null;


      updateSliderFromMouse(
        i
      );


      return;
    }
  }


  // ==========================================================
  // CURRENT BLUE POINT
  // ==========================================================

  const mainFunction =
    getMainFieldFunction();


  const currentScreenPoint =
    getScreenPointOnField(

      currentBary,

      mainPanel,

      mainFunction,

      true

    );


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

      currentScreenPoint.x,
      currentScreenPoint.y

    )

    <=

    pointGrabRadius

  ) {

    interactionMode =
      "point";


    updatePointFromMouse();


    return;
  }


  // ==========================================================
  // ROTATION
  // ==========================================================

  if (
    mouseIsOverAnyPanel()
  ) {

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

  // ==========================================================
  // SLIDER
  // ==========================================================

  if (
    activeSlider >= 0
  ) {

    updateSliderFromMouse(
      activeSlider
    );


    return;
  }


  // ==========================================================
  // MOVE POINT
  // ==========================================================

  if (
    interactionMode === "point"
  ) {

    updatePointFromMouse();


    return;
  }


  // ==========================================================
  // ROTATE ALL PLOTS
  // ==========================================================

  if (
    interactionMode === "rotate"
  ) {

    const dx =
      mouseX -
      lastMouseX;


    const dy =
      mouseY -
      lastMouseY;


    viewYaw +=

      dx *
      0.011;


    viewPitch +=

      dy *
      0.009;


    viewPitch =

      constrain(

        viewPitch,

        -2.8,
        2.8

      );


    lastMouseX =
      mouseX;


    lastMouseY =
      mouseY;
  }
}


// ============================================================
// MOUSE RELEASED
// ============================================================

function mouseReleased() {

  interactionMode =
    null;


  activeSlider =
    -1;
}


// ============================================================
// CURSOR
// ============================================================

function updateCursor() {

  // ==========================================================
  // SLIDERS
  // ==========================================================

  const count =
    elementMode === "CST"
      ? 3
      : 6;


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const g =
      getSliderGeometry(
        i
      );


    if (

      mouseX >=
      g.x0 - 5

      &&

      mouseX <=
      g.x0 + g.w + 5

      &&

      abs(
        mouseY -
        g.y
      )

      <=
      8

    ) {

      cursor(
        HAND
      );


      return;
    }
  }


  // ==========================================================
  // ELEMENT BUTTONS
  // ==========================================================

  if (

    insideRect(

      mouseX,
      mouseY,

      345,
      controlsY - 10,

      90,
      20

    )

    ||

    insideRect(

      mouseX,
      mouseY,

      440,
      controlsY - 10,

      90,
      20

    )

  ) {

    cursor(
      HAND
    );


    return;
  }


  // ==========================================================
  // BLUE POINT
  // ==========================================================

  const fieldFunction =
    getMainFieldFunction();


  const p =
    getScreenPointOnField(

      currentBary,

      mainPanel,

      fieldFunction,

      true

    );


  const nearPoint =

    insidePanel(

      mouseX,
      mouseY,

      mainPanel

    )

    &&

    dist(

      mouseX,
      mouseY,

      p.x,
      p.y

    )

    <=

    pointGrabRadius;


  if (
    nearPoint
  ) {

    cursor(
      HAND
    );


    return;
  }


  // ==========================================================
  // ROTATION AREA
  // ==========================================================

  if (
    mouseIsOverAnyPanel()
  ) {

    cursor(
      MOVE
    );


    return;
  }


  cursor(
    ARROW
  );
}


// ============================================================
// MOUSE OVER ANY PLOT?
// ============================================================

function mouseIsOverAnyPanel() {

  // ==========================================================
  // MAIN
  // ==========================================================

  if (

    insidePanel(

      mouseX,
      mouseY,

      mainPanel

    )

  ) {

    return true;
  }


  // ==========================================================
  // SHAPE FUNCTIONS
  // ==========================================================

  const panels =
    getCurrentShapePanels();


  for (
    const panel of panels
  ) {

    if (

      insidePanel(

        mouseX,
        mouseY,

        panel

      )

    ) {

      return true;
    }
  }


  return false;
}


// ============================================================
// PANEL HIT TEST
// ============================================================

function insidePanel(

  x,
  y,

  panel

) {

  return (

    x >=
    panel.x

    &&

    x <=
    panel.x +
    panel.w

    &&

    y >=
    panel.y

    &&

    y <=
    panel.y +
    panel.h

  );
}


// ============================================================
// RECTANGLE HIT TEST
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

    x >= rx

    &&

    x <=
    rx + rw

    &&

    y >= ry

    &&

    y <=
    ry + rh

  );
}


// ============================================================
// POINT FROM BARYCENTRIC COORDINATES
// ============================================================

function pointFromBary(

  bary,

  nodes

) {

  return {

    x:

      bary[0] *
      nodes[0].x

      +

      bary[1] *
      nodes[1].x

      +

      bary[2] *
      nodes[2].x,


    y:

      bary[0] *
      nodes[0].y

      +

      bary[1] *
      nodes[1].y

      +

      bary[2] *
      nodes[2].y

  };
}


// ============================================================
// CLAMP BARYCENTRIC COORDINATES
// ============================================================

function clampBarycentric(
  bary
) {

  const c = [

    max(
      0,
      bary[0]
    ),

    max(
      0,
      bary[1]
    ),

    max(
      0,
      bary[2]
    )

  ];


  const sum =

    c[0]

    +

    c[1]

    +

    c[2];


  if (
    sum <
    1e-10
  ) {

    return currentBary.slice();
  }


  return [

    c[0] /
    sum,

    c[1] /
    sum,

    c[2] /
    sum

  ];
}


// ============================================================
// CLOSED POLYLINE
// ============================================================

function polylineClosed(
  pts
) {

  beginShape();


  for (
    const p of pts
  ) {

    vertex(

      p.x,
      p.y

    );
  }


  vertex(

    pts[0].x,
    pts[0].y

  );


  endShape();
}