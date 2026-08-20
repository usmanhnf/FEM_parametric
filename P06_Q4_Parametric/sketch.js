// ============================================================
// INTERACTIVE Q4 PLATE — COMPACT 700 px VERSION
//
// Exact 1D comparison + Q4 FEM
// 1 / 4 Gauss-point toggle
// Strain / stress contours
// Pulsating height slider
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const W = 700;
const H = 445;


// ============================================================
// TYPOGRAPHY
// ============================================================

const FS_BASE  = 10;
const FS_SMALL = 9;
const FS_TINY  = 8;
const FS_XTINY = 7;


// ============================================================
// GEOMETRY / MATERIAL / LOAD
// ============================================================

const w = 500;
const h = 3000;
const thickness = 300;

const E = 3e4;
const nu = 0.3;

const Ts = 0.04;
const bodyForceValue = -2.5e-5;


// ============================================================
// DISPLAY STATE
// ============================================================

let showExact = true;
let showFEM = true;
let bodyForceOn = true;

let fullBottomFixed = true;


// ============================================================
// INTEGRATION
//
// 4 = standard 2 x 2 integration
// 1 = one-point reduced integration
// ============================================================

let integrationPoints = 4;


// Small stabilization for the one-point Q4.
// The displayed stress/strain point remains the
// single centre Gauss point.

const hourglassAlpha = 0.03;


// ============================================================
// MESH
// ============================================================

let nx = 1;
let ny = 1;

const nxOptions = [
  1,
  2
];

const nyOptions = [
  1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12
];

let femData;


// ============================================================
// HEIGHT SLIDER
// ============================================================

let currentY = 1500;

let sliderDragging = false;


// ============================================================
// COMPACT 700 px LAYOUT
// ============================================================

const graphTop = 48;
const graphBottom = 300;

const sliderX = 10;


// model

const plateX = 28;
const plateW = 25;


// deformed shape

const defTileX = 66;
const defTileW = 70;


// plots

const uPlotX = 150;

const epsPlotX = 270;
const epsContourX = 377;

const sigmaPlotX = 445;
const sigmaContourX = 552;


const plotW = 95;
const contourW = 55;


// ============================================================
// CONTROLS
// ============================================================

const controlsX = 15;
const controlsY = 325;
const controlsW = W - 30;
const controlsH = 100;

let controlHits = [];


// ============================================================
// VISUAL DEFORMATION SCALE
// ============================================================

const deformationScale = 2e5;


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

  updateFEM();
}


// ============================================================
// DRAW
// ============================================================

function draw() {

  background(255);


  const exactV =
    displacementExact(
      currentY
    );


  const exactEps =
    strainExact(
      currentY
    );


  const exactSigma =
    stressExact(
      currentY
    );


  const femCurrent =
    getFEMValueAt(
      currentY
    );


  drawLoadingSchematic();

  drawVerticalSlider();

  drawDeformedShape();


  // ----------------------------------------------------------
  // displacement
  // ----------------------------------------------------------

  drawGraph(

    uPlotX,

    "Displacement  v(y)",

    "v [mm]",

    displacementExact,

    getCombinedRange(
      displacementExact,
      "v"
    ),

    exactV,

    femCurrent.v,

    "v"
  );


  // ----------------------------------------------------------
  // strain
  // ----------------------------------------------------------

  drawGraph(

    epsPlotX,

    "Strain  εy(y)",

    "εy",

    strainExact,

    getCombinedRange(
      strainExact,
      "eps"
    ),

    exactEps,

    femCurrent.eps,

    "eps"
  );


  drawGaussContourTile(

    epsContourX,

    "εy contour",

    "eps"
  );


  // ----------------------------------------------------------
  // stress
  // ----------------------------------------------------------

  drawGraph(

    sigmaPlotX,

    "Stress  σy(y)",

    "σy [MPa]",

    stressExact,

    getCombinedRange(
      stressExact,
      "sigma"
    ),

    exactSigma,

    femCurrent.sigma,

    "sigma"
  );


  drawGaussContourTile(

    sigmaContourX,

    "σy contour",

    "sigma"
  );


  drawCurrentHeightGuide();

  drawControls();
}


// ============================================================
// FONT
// ============================================================

function fontSize(s) {

  textFont("Anaheim");

  textSize(s);
}


// ============================================================
// EXACT 1D SOLUTION
// ============================================================

function getBodyForce() {

  return bodyForceOn
    ? bodyForceValue
    : 0;
}


function displacementExact(y) {

  const b =
    getBodyForce();


  return (

    -(b / (2 * E))
    *
    y
    *
    y

    +

    (
      (Ts + b * h)
      /
      E
    )
    *
    y
  );
}


function strainExact(y) {

  const b =
    getBodyForce();


  return (

    -(b / E)
    *
    y

    +

    (Ts + b * h)
    /
    E
  );
}


function stressExact(y) {

  const b =
    getBodyForce();


  return (

    -b
    *
    y

    +

    Ts

    +

    b
    *
    h
  );
}


// ============================================================
// UPDATE FEM
// ============================================================

function updateFEM() {

  femData =
    solveQ4(
      nx,
      ny,
      integrationPoints
    );


  femData.centerline =
    buildCenterlineData(
      femData,
      240
    );
}


// ============================================================
// GENERATE Q4 MESH
// ============================================================

function generateMesh(
  nxRequested,
  nyRequested
) {

  const coords = [];


  // ----------------------------------------------------------
  // nodes
  // ----------------------------------------------------------

  for (
    let j = 0;
    j <= nyRequested;
    j++
  ) {

    for (
      let i = 0;
      i <= nxRequested;
      i++
    ) {

      coords.push([

        w *
        i /
        nxRequested,

        h *
        j /
        nyRequested
      ]);
    }
  }


  // ----------------------------------------------------------
  // connectivity
  //
  //        n4 ------- n3
  //        |           |
  //        |           |
  //        n1 ------- n2
  //
  // Q4 = [n1 n2 n3 n4]
  // ----------------------------------------------------------

  const elements = [];


  for (
    let j = 0;
    j < nyRequested;
    j++
  ) {

    for (
      let i = 0;
      i < nxRequested;
      i++
    ) {

      const n1 =
        j
        *
        (
          nxRequested + 1
        )
        +
        i;


      const n2 =
        n1 + 1;


      const n4 =
        (
          j + 1
        )
        *
        (
          nxRequested + 1
        )
        +
        i;


      const n3 =
        n4 + 1;


      elements.push([
        n1,
        n2,
        n3,
        n4
      ]);
    }
  }


  // ----------------------------------------------------------
  // boundary nodes
  // ----------------------------------------------------------

  const bottomNodes = [];

  const topNodes = [];


  for (
    let n = 0;
    n < coords.length;
    n++
  ) {

    if (
      Math.abs(
        coords[n][1]
      )
      <
      1e-9
    ) {

      bottomNodes.push(n);
    }


    if (
      Math.abs(
        coords[n][1] - h
      )
      <
      1e-9
    ) {

      topNodes.push(n);
    }
  }


  bottomNodes.sort(
    (a, b) =>
      coords[a][0]
      -
      coords[b][0]
  );


  topNodes.sort(
    (a, b) =>
      coords[a][0]
      -
      coords[b][0]
  );


  return {

    coords,

    elements,

    bottomNodes,

    topNodes,

    nx:
      nxRequested,

    ny:
      nyRequested
  };
}


// ============================================================
// INTEGRATION RULE
// ============================================================

function selectedIntegrationRule(
  nInt
) {

  // ----------------------------------------------------------
  // ONE POINT
  //
  // xi = 0
  // eta = 0
  // weight = 4
  // ----------------------------------------------------------

  if (
    nInt === 1
  ) {

    return [

      {
        xi: 0,
        eta: 0,
        weight: 4
      }
    ];
  }


  // ----------------------------------------------------------
  // FOUR POINTS
  // ----------------------------------------------------------

  const g =
    1 /
    Math.sqrt(3);


  return [

    {
      xi: -g,
      eta: -g,
      weight: 1
    },

    {
      xi: g,
      eta: -g,
      weight: 1
    },

    {
      xi: g,
      eta: g,
      weight: 1
    },

    {
      xi: -g,
      eta: g,
      weight: 1
    }
  ];
}


function fullIntegrationRule() {

  const g =
    1 /
    Math.sqrt(3);


  return [

    {
      xi: -g,
      eta: -g,
      weight: 1
    },

    {
      xi: g,
      eta: -g,
      weight: 1
    },

    {
      xi: g,
      eta: g,
      weight: 1
    },

    {
      xi: -g,
      eta: g,
      weight: 1
    }
  ];
}


// ============================================================
// Q4 SOLVER
// ============================================================

function solveQ4(
  nxRequested,
  nyRequested,
  nInt
) {

  const mesh =
    generateMesh(
      nxRequested,
      nyRequested
    );


  const coords =
    mesh.coords;


  const elements =
    mesh.elements;


  const nNodes =
    coords.length;


  const ndof =
    2 *
    nNodes;


  // ----------------------------------------------------------
  // global matrices
  // ----------------------------------------------------------

  const K =
    zerosMatrix(
      ndof,
      ndof
    );


  const Fb =
    new Array(
      ndof
    ).fill(0);


  const Fp =
    new Array(
      ndof
    ).fill(0);


  // ==========================================================
  // PLANE STRESS MATRIX
  // ==========================================================

  const cD =
    E
    /
    (
      1
      -
      nu * nu
    );


  const D = [

    [
      cD,
      cD * nu,
      0
    ],

    [
      cD * nu,
      cD,
      0
    ],

    [
      0,
      0,
      cD * (1 - nu) / 2
    ]
  ];


  const rule =
    selectedIntegrationRule(
      nInt
    );


  const bGlobal = [
    0,
    getBodyForce()
  ];


  // ==========================================================
  // ELEMENT LOOP
  // ==========================================================

  for (
    let e = 0;
    e < elements.length;
    e++
  ) {

    const nodes =
      elements[e];


    const xy =
      nodes.map(
        n =>
          coords[n]
      );


    const ke =
      zerosMatrix(
        8,
        8
      );


    const fbe =
      new Array(
        8
      ).fill(0);


    // --------------------------------------------------------
    // selected numerical integration
    // --------------------------------------------------------

    for (
      const gp
      of rule
    ) {

      const q =
        q4Kinematics(
          xy,
          gp.xi,
          gp.eta
        );


      // stiffness

      const BtDB =
        matMul(

          transpose(
            q.B
          ),

          matMul(
            D,
            q.B
          )
        );


      addScaledMatrix(

        ke,

        BtDB,

        thickness
        *
        q.detJ
        *
        gp.weight
      );


      // body force

      const fbGP =
        matVec(

          transpose(
            q.Nmat
          ),

          bGlobal
        );


      for (
        let a = 0;
        a < 8;
        a++
      ) {

        fbe[a] +=

          thickness
          *
          q.detJ
          *
          gp.weight
          *
          fbGP[a];
      }
    }


    // ========================================================
    // HOURGLASS STABILIZATION
    // ========================================================

    if (
      nInt === 1
    ) {

      const keReduced =
        copyMatrix(
          ke
        );


      const keFull =
        q4ElementStiffnessWithRule(

          xy,

          D,

          fullIntegrationRule()
        );


      for (
        let i = 0;
        i < 8;
        i++
      ) {

        for (
          let j = 0;
          j < 8;
          j++
        ) {

          ke[i][j] =

            keReduced[i][j]

            +

            hourglassAlpha

            *

            (
              keFull[i][j]
              -
              keReduced[i][j]
            );
        }
      }
    }


    // --------------------------------------------------------
    // assembly
    // --------------------------------------------------------

    const edof =
      elementDofsQ4(
        nodes
      );


    assembleMatrix(
      K,
      ke,
      edof
    );


    assembleVector(
      Fb,
      fbe,
      edof
    );
  }


  // ==========================================================
  // TOP SURFACE TRACTION
  // ==========================================================

  for (
    let i = 0;
    i < mesh.topNodes.length - 1;
    i++
  ) {

    const n1 =
      mesh.topNodes[i];


    const n2 =
      mesh.topNodes[i + 1];


    const p1 =
      coords[n1];


    const p2 =
      coords[n2];


    const Le =
      Math.hypot(

        p2[0] - p1[0],

        p2[1] - p1[1]
      );


    const fn =

      Ts
      *
      thickness
      *
      Le
      /
      2;


    assembleVector(

      Fp,

      [
        0,
        fn,
        0,
        fn
      ],

      [
        2 * n1,
        2 * n1 + 1,
        2 * n2,
        2 * n2 + 1
      ]
    );
  }


  // ==========================================================
  // TOTAL LOAD
  // ==========================================================

  const F =
    Fb.map(
      (
        value,
        i
      ) =>
        value
        +
        Fp[i]
    );


  // ==========================================================
  // BOUNDARY CONDITIONS
  // ==========================================================

  const BCy =
    mesh.bottomNodes.slice();


  let BCx;


  if (
    fullBottomFixed
  ) {

    BCx =
      mesh.bottomNodes.slice();
  }


  else {

    let anchor =
      mesh.bottomNodes[0];


    let best =
      Math.abs(
        coords[anchor][0]
        -
        w / 2
      );


    for (
      const n
      of mesh.bottomNodes
    ) {

      const error =
        Math.abs(
          coords[n][0]
          -
          w / 2
        );


      if (
        error < best
      ) {

        best =
          error;


        anchor =
          n;
      }
    }


    BCx = [
      anchor
    ];
  }


  // ----------------------------------------------------------
  // fixed DOFs
  // ----------------------------------------------------------

  const fixed = [];


  for (
    const n
    of BCx
  ) {

    fixed.push(
      2 * n
    );
  }


  for (
    const n
    of BCy
  ) {

    fixed.push(
      2 * n + 1
    );
  }


  const fixedUnique =
    Array.from(
      new Set(
        fixed
      )
    )
    .sort(
      (a, b) =>
        a - b
    );


  const fixedSet =
    new Set(
      fixedUnique
    );


  const free = [];


  for (
    let i = 0;
    i < ndof;
    i++
  ) {

    if (
      !fixedSet.has(i)
    ) {

      free.push(i);
    }
  }


  // ==========================================================
  // REDUCED SYSTEM
  // ==========================================================

  const KR =
    zerosMatrix(
      free.length,
      free.length
    );


  const FR =
    new Array(
      free.length
    ).fill(0);


  for (
    let i = 0;
    i < free.length;
    i++
  ) {

    FR[i] =
      F[
        free[i]
      ];


    for (
      let j = 0;
      j < free.length;
      j++
    ) {

      KR[i][j] =
        K[
          free[i]
        ][
          free[j]
        ];
    }
  }


  // ==========================================================
  // SOLVE
  // ==========================================================

  const dFree =
    solveLinearSystem(
      KR,
      FR
    );


  const d =
    new Array(
      ndof
    ).fill(0);


  for (
    let i = 0;
    i < free.length;
    i++
  ) {

    d[
      free[i]
    ] =
      dFree[i];
  }


  // ==========================================================
  // REACTIONS
  // ==========================================================

  const R =
    matVec(
      K,
      d
    )
    .map(
      (
        value,
        i
      ) =>
        value
        -
        F[i]
    );


  // ==========================================================
  // GAUSS-POINT RESULTS
  // ==========================================================

  const gaussResults = [];


  for (
    let e = 0;
    e < elements.length;
    e++
  ) {

    const nodes =
      elements[e];


    const xy =
      nodes.map(
        n =>
          coords[n]
      );


    const edof =
      elementDofsQ4(
        nodes
      );


    const de =
      edof.map(
        k =>
          d[k]
      );


    const points = [];


    for (
      const gp
      of rule
    ) {

      const q =
        q4Kinematics(
          xy,
          gp.xi,
          gp.eta
        );


      const strain =
        matVec(
          q.B,
          de
        );


      const stress =
        matVec(
          D,
          strain
        );


      const pos =
        naturalPointQ4(
          xy,
          gp.xi,
          gp.eta
        );


      points.push({

        xi:
          gp.xi,

        eta:
          gp.eta,

        x:
          pos[0],

        y:
          pos[1],

        eps:
          strain[1],

        sigma:
          stress[1]
      });
    }


    gaussResults.push(
      points
    );
  }


  return {

    ...mesh,

    nNodes,

    ndof,

    D,

    K,

    Fb,

    Fp,

    F,

    d,

    R,

    BCx,

    BCy,

    fixed:
      fixedUnique,

    free,

    integrationPoints:
      nInt,

    gaussResults
  };
}


// ============================================================
// ELEMENT STIFFNESS FOR SPECIFIED RULE
// ============================================================

function q4ElementStiffnessWithRule(
  xy,
  D,
  rule
) {

  const ke =
    zerosMatrix(
      8,
      8
    );


  for (
    const gp
    of rule
  ) {

    const q =
      q4Kinematics(
        xy,
        gp.xi,
        gp.eta
      );


    const BtDB =
      matMul(

        transpose(
          q.B
        ),

        matMul(
          D,
          q.B
        )
      );


    addScaledMatrix(

      ke,

      BtDB,

      thickness
      *
      q.detJ
      *
      gp.weight
    );
  }


  return ke;
}


// ============================================================
// Q4 KINEMATICS
// ============================================================

function q4Kinematics(
  xy,
  xi,
  eta
) {

  // ----------------------------------------------------------
  // shape functions
  // ----------------------------------------------------------

  const N = [

    0.25
    *
    (1 - xi)
    *
    (1 - eta),

    0.25
    *
    (1 + xi)
    *
    (1 - eta),

    0.25
    *
    (1 + xi)
    *
    (1 + eta),

    0.25
    *
    (1 - xi)
    *
    (1 + eta)
  ];


  // ----------------------------------------------------------
  // dN / dxi
  // ----------------------------------------------------------

  const dNdxi = [

    -0.25
    *
    (1 - eta),

    0.25
    *
    (1 - eta),

    0.25
    *
    (1 + eta),

    -0.25
    *
    (1 + eta)
  ];


  // ----------------------------------------------------------
  // dN / deta
  // ----------------------------------------------------------

  const dNdeta = [

    -0.25
    *
    (1 - xi),

    -0.25
    *
    (1 + xi),

    0.25
    *
    (1 + xi),

    0.25
    *
    (1 - xi)
  ];


  // ----------------------------------------------------------
  // Jacobian
  // ----------------------------------------------------------

  let dx_dxi = 0;

  let dy_dxi = 0;

  let dx_deta = 0;

  let dy_deta = 0;


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    dx_dxi +=
      dNdxi[i]
      *
      xy[i][0];


    dy_dxi +=
      dNdxi[i]
      *
      xy[i][1];


    dx_deta +=
      dNdeta[i]
      *
      xy[i][0];


    dy_deta +=
      dNdeta[i]
      *
      xy[i][1];
  }


  const J = [

    [
      dx_dxi,
      dy_dxi
    ],

    [
      dx_deta,
      dy_deta
    ]
  ];


  const detJ =

    J[0][0]
    *
    J[1][1]

    -

    J[0][1]
    *
    J[1][0];


  if (
    detJ <= 0
  ) {

    throw new Error(
      "Q4 element has non-positive Jacobian."
    );
  }


  // ----------------------------------------------------------
  // inverse Jacobian
  // ----------------------------------------------------------

  const invJ = [

    [
      J[1][1] / detJ,
      -J[0][1] / detJ
    ],

    [
      -J[1][0] / detJ,
      J[0][0] / detJ
    ]
  ];


  // ----------------------------------------------------------
  // derivatives wrt x,y
  // ----------------------------------------------------------

  const dNdx =
    new Array(4);


  const dNdy =
    new Array(4);


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    dNdx[i] =

      invJ[0][0]
      *
      dNdxi[i]

      +

      invJ[0][1]
      *
      dNdeta[i];


    dNdy[i] =

      invJ[1][0]
      *
      dNdxi[i]

      +

      invJ[1][1]
      *
      dNdeta[i];
  }


  // ----------------------------------------------------------
  // B and N matrices
  // ----------------------------------------------------------

  const B =
    zerosMatrix(
      3,
      8
    );


  const Nmat =
    zerosMatrix(
      2,
      8
    );


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    B[0][
      2 * i
    ] =
      dNdx[i];


    B[1][
      2 * i + 1
    ] =
      dNdy[i];


    B[2][
      2 * i
    ] =
      dNdy[i];


    B[2][
      2 * i + 1
    ] =
      dNdx[i];


    Nmat[0][
      2 * i
    ] =
      N[i];


    Nmat[1][
      2 * i + 1
    ] =
      N[i];
  }


  return {

    N,

    Nmat,

    B,

    J,

    detJ,

    dNdx,

    dNdy
  };
}


// ============================================================
// NATURAL -> GLOBAL COORDINATE
// ============================================================

function naturalPointQ4(
  xy,
  xi,
  eta
) {

  const q =
    q4Kinematics(
      xy,
      xi,
      eta
    );


  let x = 0;

  let y = 0;


  for (
    let a = 0;
    a < 4;
    a++
  ) {

    x +=
      q.N[a]
      *
      xy[a][0];


    y +=
      q.N[a]
      *
      xy[a][1];
  }


  return [
    x,
    y
  ];
}


// ============================================================
// ELEMENT DOFs
// ============================================================

function elementDofsQ4(
  nodes
) {

  return [

    2 * nodes[0],
    2 * nodes[0] + 1,

    2 * nodes[1],
    2 * nodes[1] + 1,

    2 * nodes[2],
    2 * nodes[2] + 1,

    2 * nodes[3],
    2 * nodes[3] + 1
  ];
}


// ============================================================
// MATRIX FUNCTIONS
// ============================================================

function zerosMatrix(
  rows,
  cols
) {

  return Array.from(

    {
      length:
        rows
    },

    () =>
      new Array(
        cols
      ).fill(0)
  );
}


function copyMatrix(A) {

  return A.map(
    row =>
      row.slice()
  );
}


function transpose(A) {

  const T =
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

      T[j][i] =
        A[i][j];
    }
  }


  return T;
}


function matMul(
  A,
  B
) {

  const C =
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
      k < A[0].length;
      k++
    ) {

      const aik =
        A[i][k];


      if (
        aik === 0
      ) {

        continue;
      }


      for (
        let j = 0;
        j < B[0].length;
        j++
      ) {

        C[i][j] +=
          aik
          *
          B[k][j];
      }
    }
  }


  return C;
}


function matVec(
  A,
  x
) {

  const y =
    new Array(
      A.length
    ).fill(0);


  for (
    let i = 0;
    i < A.length;
    i++
  ) {

    let sum = 0;


    for (
      let j = 0;
      j < A[i].length;
      j++
    ) {

      sum +=
        A[i][j]
        *
        x[j];
    }


    y[i] =
      sum;
  }


  return y;
}


// NOTE:
// parameter is called multiplier rather than "scale"
// because scale() is a p5.js function.

function addScaledMatrix(
  A,
  B,
  multiplier
) {

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

      A[i][j] +=
        multiplier
        *
        B[i][j];
    }
  }
}


function assembleMatrix(
  K,
  ke,
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

      K[
        dof[i]
      ][
        dof[j]
      ] +=
        ke[i][j];
    }
  }
}


function assembleVector(
  F,
  fe,
  dof
) {

  for (
    let i = 0;
    i < dof.length;
    i++
  ) {

    F[
      dof[i]
    ] +=
      fe[i];
  }
}


// ============================================================
// LINEAR SOLVER
// ============================================================

function solveLinearSystem(
  matrix,
  vector
) {

  const n =
    vector.length;


  if (
    n === 0
  ) {

    return [];
  }


  const A =
    matrix.map(
      row =>
        row.slice()
    );


  const b =
    vector.slice();


  // ----------------------------------------------------------
  // Gaussian elimination with pivoting
  // ----------------------------------------------------------

  for (
    let k = 0;
    k < n;
    k++
  ) {

    let pivot =
      k;


    for (
      let i = k + 1;
      i < n;
      i++
    ) {

      if (

        Math.abs(
          A[i][k]
        )

        >

        Math.abs(
          A[pivot][k]
        )

      ) {

        pivot =
          i;
      }
    }


    if (
      Math.abs(
        A[pivot][k]
      )
      <
      1e-12
    ) {

      throw new Error(
        "Singular stiffness matrix. Check BCs / integration."
      );
    }


    if (
      pivot !== k
    ) {

      [
        A[k],
        A[pivot]
      ]
      =
      [
        A[pivot],
        A[k]
      ];


      [
        b[k],
        b[pivot]
      ]
      =
      [
        b[pivot],
        b[k]
      ];
    }


    for (
      let i = k + 1;
      i < n;
      i++
    ) {

      const factor =
        A[i][k]
        /
        A[k][k];


      for (
        let j = k;
        j < n;
        j++
      ) {

        A[i][j] -=
          factor
          *
          A[k][j];
      }


      b[i] -=
        factor
        *
        b[k];
    }
  }


  // ----------------------------------------------------------
  // back substitution
  // ----------------------------------------------------------

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


    x[i] =
      sum
      /
      A[i][i];
  }


  return x;
}


// ============================================================
// CENTRELINE DATA
// ============================================================

function buildCenterlineData(
  fem,
  nSamples
) {

  const ys = [];

  const v = [];

  const eps = [];

  const sigma = [];

  const eid = [];


  for (
    let i = 0;
    i <= nSamples;
    i++
  ) {

    const y =
      h
      *
      i
      /
      nSamples;


    const q =
      getFEMValueAtModel(
        fem,
        y
      );


    ys.push(y);

    v.push(
      q.v
    );

    eps.push(
      q.eps
    );

    sigma.push(
      q.sigma
    );

    eid.push(
      q.eid
    );
  }


  return {

    ys,

    v,

    eps,

    sigma,

    eid
  };
}


// ============================================================
// FEM VALUE AT HEIGHT
// ============================================================

function getFEMValueAt(y) {

  return getFEMValueAtModel(
    femData,
    y
  );
}


// ============================================================
// FEM VALUE AT HEIGHT
//
// displacement:
//     N d
//
// strain / stress:
//     recovered from selected Gauss points
// ============================================================

function getFEMValueAtModel(
  fem,
  y
) {

  // Slight right offset when nx = 2

  let x =
    w / 2
    +
    1e-8
    *
    w;


  x =
    constrain(
      x,
      1e-9,
      w - 1e-9
    );


  const yy =
    constrain(
      y,
      1e-9 * h,
      h - 1e-9 * h
    );


  const dx =
    w
    /
    fem.nx;


  const dy =
    h
    /
    fem.ny;


  let i =
    Math.floor(
      x / dx
    );


  let j =
    Math.floor(
      yy / dy
    );


  i =
    constrain(
      i,
      0,
      fem.nx - 1
    );


  j =
    constrain(
      j,
      0,
      fem.ny - 1
    );


  const eid =
    j
    *
    fem.nx
    +
    i;


  const nodes =
    fem.elements[
      eid
    ];


  const xy =
    nodes.map(
      n =>
        fem.coords[n]
    );


  const xLeft =
    i
    *
    dx;


  const yBottom =
    j
    *
    dy;


  const xi =

    2
    *
    (
      x - xLeft
    )
    /
    dx

    -

    1;


  const eta =

    2
    *
    (
      yy - yBottom
    )
    /
    dy

    -

    1;


  const edof =
    elementDofsQ4(
      nodes
    );


  const de =
    edof.map(
      k =>
        fem.d[k]
    );


  // ----------------------------------------------------------
  // displacement
  // ----------------------------------------------------------

  const q =
    q4Kinematics(
      xy,
      xi,
      eta
    );


  const displacement =
    matVec(
      q.Nmat,
      de
    );


  // ----------------------------------------------------------
  // stress / strain recovered from active Gauss data
  // ----------------------------------------------------------

  const eps =
    recoverGaussField(
      fem,
      eid,
      xi,
      eta,
      "eps"
    );


  const sigma =
    recoverGaussField(
      fem,
      eid,
      xi,
      eta,
      "sigma"
    );


  return {

    u:
      displacement[0],

    v:
      displacement[1],

    eps,

    sigma,

    eid,

    xi,

    eta
  };
}


// ============================================================
// RECOVER FIELD FROM ACTIVE GAUSS POINTS
// ============================================================

function recoverGaussField(
  fem,
  eid,
  xi,
  eta,
  field
) {

  const gpData =
    fem.gaussResults[
      eid
    ];


  // ----------------------------------------------------------
  // ONE-POINT
  //
  // one value per element
  // ----------------------------------------------------------

  if (
    fem.integrationPoints === 1
  ) {

    return field === "eps"

      ? gpData[0].eps

      : gpData[0].sigma;
  }


  // ----------------------------------------------------------
  // FOUR-POINT RECOVERY
  // ----------------------------------------------------------

  const g =
    1 /
    Math.sqrt(3);


  const Lxm =
    (
      g - xi
    )
    /
    (
      2 * g
    );


  const Lxp =
    (
      g + xi
    )
    /
    (
      2 * g
    );


  const Lem =
    (
      g - eta
    )
    /
    (
      2 * g
    );


  const Lep =
    (
      g + eta
    )
    /
    (
      2 * g
    );


  const v1 =
    field === "eps"
      ? gpData[0].eps
      : gpData[0].sigma;


  const v2 =
    field === "eps"
      ? gpData[1].eps
      : gpData[1].sigma;


  const v3 =
    field === "eps"
      ? gpData[2].eps
      : gpData[2].sigma;


  const v4 =
    field === "eps"
      ? gpData[3].eps
      : gpData[3].sigma;


  return (

    v1
    *
    Lxm
    *
    Lem

    +

    v2
    *
    Lxp
    *
    Lem

    +

    v3
    *
    Lxp
    *
    Lep

    +

    v4
    *
    Lxm
    *
    Lep
  );
}


// ============================================================
// MODEL TILE
// ============================================================

function drawLoadingSchematic() {

  const top =
    graphTop;


  const bottom =
    graphBottom;


  const plateH =
    bottom
    -
    top;


  // title

  noStroke();

  fill(30);

  fontSize(
    FS_BASE
  );


  textAlign(
    CENTER,
    BOTTOM
  );


  text(
    "Model",
    plateX + plateW / 2,
    graphTop - 8
  );


  // ----------------------------------------------------------
  // plate
  // ----------------------------------------------------------

  fill(
    243,
    249,
    242
  );


  stroke(85);

  strokeWeight(
    0.8
  );


  rect(
    plateX,
    top,
    plateW,
    plateH
  );


  // ----------------------------------------------------------
  // mesh
  // ----------------------------------------------------------

  if (
    showFEM
  ) {

    for (
      let j = 0;
      j <= ny;
      j++
    ) {

      const yy =
        map(
          j,
          0,
          ny,
          bottom,
          top
        );


      stroke(
        160,
        160,
        160,
        95
      );


      strokeWeight(
        0.5
      );


      line(
        plateX,
        yy,
        plateX + plateW,
        yy
      );
    }


    for (
      let i = 1;
      i < nx;
      i++
    ) {

      const xx =
        plateX
        +
        plateW
        *
        i
        /
        nx;


      line(
        xx,
        top,
        xx,
        bottom
      );
    }


    noStroke();

    fill(40);


    for (
      let j = 0;
      j <= ny;
      j++
    ) {

      const yy =
        map(
          j,
          0,
          ny,
          bottom,
          top
        );


      circle(
        plateX - 3,
        yy,
        ny >= 10
          ? 2
          : 2.8
      );
    }
  }


  // ----------------------------------------------------------
  // body force
  // ----------------------------------------------------------

  if (
    bodyForceOn
  ) {

    for (
      let row = 0;
      row < 7;
      row++
    ) {

      const yy =
        top
        +
        30
        +
        row
        *
        (
          plateH - 60
        )
        /
        6;


      drawArrow(

        plateX + 8,
        yy - 7,

        plateX + 8,
        yy + 7,

        color(
          25,
          80,
          220
        )
      );


      drawArrow(

        plateX + 18,
        yy - 7,

        plateX + 18,
        yy + 7,

        color(
          25,
          80,
          220
        )
      );
    }


    noStroke();

    fill(
      25,
      75,
      195
    );


    fontSize(
      FS_SMALL
    );


    textAlign(
      LEFT,
      CENTER
    );


    text(
      "b",
      plateX + plateW + 4,
      top + 52
    );
  }


  // ----------------------------------------------------------
  // top traction
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < 2;
    i++
  ) {

    drawArrow(

      plateX + 8 + i * 10,
      top,

      plateX + 8 + i * 10,
      top - 16,

      color(
        230,
        35,
        35
      )
    );
  }


  noStroke();

  fill(
    210,
    30,
    30
  );


  fontSize(
    FS_SMALL
  );


  textAlign(
    LEFT,
    CENTER
  );


  text(
    "T",
    plateX + plateW + 4,
    top - 8
  );


  drawSchematicSupports(
    plateX,
    bottom,
    plateW
  );
}


// ============================================================
// SCHEMATIC SUPPORTS
// ============================================================

function drawSchematicSupports(
  x0,
  y0,
  widthPx
) {

  if (
    fullBottomFixed
  ) {

    stroke(55);

    strokeWeight(
      0.8
    );


    line(
      x0 - 4,
      y0,
      x0 + widthPx + 4,
      y0
    );


    for (
      let x = -2;
      x <= widthPx + 5;
      x += 6
    ) {

      line(
        x0 + x,
        y0,
        x0 + x - 4,
        y0 + 5
      );
    }
  }


  else {

    for (
      const n
      of femData.bottomNodes
    ) {

      const xx =
        map(

          femData.coords[n][0],

          0,
          w,

          x0,
          x0 + widthPx
        );


      noFill();

      stroke(
        30,
        85,
        210
      );


      strokeWeight(
        0.7
      );


      triangle(

        xx,
        y0,

        xx - 3,
        y0 + 5,

        xx + 3,
        y0 + 5
      );
    }


    const n =
      femData.BCx[0];


    const xx =
      map(

        femData.coords[n][0],

        0,
        w,

        x0,
        x0 + widthPx
      );


    noFill();

    stroke(
      30,
      85,
      210
    );


    strokeWeight(
      1
    );


    rectMode(
      CENTER
    );


    rect(
      xx,
      y0 + 1,
      5,
      5
    );


    rectMode(
      CORNER
    );
  }
}


// ============================================================
// DEFORMED SHAPE
// ============================================================

function drawDeformedShape() {

  const left =
    defTileX;


  const right =
    defTileX
    +
    defTileW;


  noStroke();

  fill(30);

  fontSize(
    FS_BASE
  );


  textAlign(
    CENTER,
    BOTTOM
  );


  text(
    "Deformed shape",
    (left + right) / 2,
    graphTop - 8
  );


  // Do not call this "scale".
  // scale() is a p5.js function.

  const meshScale =

    (
      graphBottom
      -
      graphTop
      -
      8
    )

    /

    (
      1.06
      *
      h
    );


  const xc =
    left
    +
    defTileW / 2;


  const yBottom =
    graphBottom - 2;


  function point(
    x,
    y
  ) {

    return [

      xc
      +
      (
        x - w / 2
      )
      *
      meshScale,

      yBottom
      -
      y
      *
      meshScale
    ];
  }


  function deformedPoint(n) {

    return point(

      femData.coords[n][0]
      +
      deformationScale
      *
      femData.d[
        2 * n
      ],

      femData.coords[n][1]
      +
      deformationScale
      *
      femData.d[
        2 * n + 1
      ]
    );
  }


  // ----------------------------------------------------------
  // undeformed mesh
  // ----------------------------------------------------------

  noFill();

  stroke(
    105,
    105,
    105,
    150
  );


  strokeWeight(
    0.55
  );


  drawingContext.setLineDash(
    [
      5,
      4
    ]
  );


  for (
    const element
    of femData.elements
  ) {

    const p =
      element.map(
        n =>
          point(
            ...femData.coords[n]
          )
      );


    beginShape();


    for (
      const q
      of p
    ) {

      vertex(
        q[0],
        q[1]
      );
    }


    endShape(
      CLOSE
    );
  }


  drawingContext.setLineDash(
    []
  );


  // ----------------------------------------------------------
  // deformed mesh
  // ----------------------------------------------------------

  if (
    showFEM
  ) {

    fill(
      235,
      45,
      35,
      12
    );


    stroke(
      235,
      45,
      35
    );


    strokeWeight(
      0.85
    );


    for (
      const element
      of femData.elements
    ) {

      const p =
        element.map(
          n =>
            deformedPoint(n)
        );


      beginShape();


      for (
        const q
        of p
      ) {

        vertex(
          q[0],
          q[1]
        );
      }


      endShape(
        CLOSE
      );
    }


    drawDeformedIntegrationPoints(
      point
    );
  }


  drawDeformedSupports(
    point
  );


  noStroke();

  fill(85);

  fontSize(
    FS_XTINY
  );


  textAlign(
    CENTER,
    TOP
  );


  text(
    `SF = ${deformationScale.toExponential(0)}`,
    (left + right) / 2,
    graphBottom + 4
  );


  text(

    integrationPoints === 4

      ? "Q4 • 4 GP"

      : "Q4 • 1 GP + HG",

    (left + right) / 2,
    graphBottom + 14
  );
}


// ============================================================
// DEFORMED INTEGRATION POINTS
// ============================================================

function drawDeformedIntegrationPoints(
  point
) {

  const rule =
    selectedIntegrationRule(
      integrationPoints
    );


  push();


  noStroke();


  fill(
    55,
    55,
    55,
    60
  );


  for (
    let e = 0;
    e < femData.elements.length;
    e++
  ) {

    const nodes =
      femData.elements[e];


    const xy =
      nodes.map(
        n =>
          femData.coords[n]
      );


    const edof =
      elementDofsQ4(
        nodes
      );


    const de =
      edof.map(
        k =>
          femData.d[k]
      );


    for (
      const gp
      of rule
    ) {

      const q =
        q4Kinematics(
          xy,
          gp.xi,
          gp.eta
        );


      let xd = 0;

      let yd = 0;


      for (
        let a = 0;
        a < 4;
        a++
      ) {

        const xa =
          xy[a][0]
          +
          deformationScale
          *
          de[
            2 * a
          ];


        const ya =
          xy[a][1]
          +
          deformationScale
          *
          de[
            2 * a + 1
          ];


        xd +=
          q.N[a]
          *
          xa;


        yd +=
          q.N[a]
          *
          ya;
      }


      const p =
        point(
          xd,
          yd
        );


      circle(
        p[0],
        p[1],

        integrationPoints === 1
          ? 2.6
          : 1.8
      );
    }
  }


  pop();
}


// ============================================================
// DEFORMED SUPPORTS
// ============================================================

function drawDeformedSupports(
  point
) {

  if (
    fullBottomFixed
  ) {

    const a =
      point(
        0,
        0
      );


    const b =
      point(
        w,
        0
      );


    stroke(
      30,
      85,
      210
    );


    strokeWeight(
      0.8
    );


    line(
      a[0] - 3,
      a[1],
      b[0] + 3,
      b[1]
    );


    for (
      let xx = a[0] - 2;
      xx <= b[0] + 3;
      xx += 5
    ) {

      line(
        xx,
        a[1],
        xx - 3,
        a[1] + 5
      );
    }
  }


  else {

    for (
      const n
      of femData.BCy
    ) {

      const q =
        point(
          femData.coords[n][0],
          0
        );


      noFill();

      stroke(
        30,
        85,
        210
      );


      strokeWeight(
        0.7
      );


      triangle(

        q[0],
        q[1],

        q[0] - 3,
        q[1] + 5,

        q[0] + 3,
        q[1] + 5
      );
    }


    const n =
      femData.BCx[0];


    const q =
      point(
        femData.coords[n][0],
        0
      );


    noFill();

    stroke(
      30,
      85,
      210
    );


    strokeWeight(
      1
    );


    rectMode(
      CENTER
    );


    rect(
      q[0],
      q[1] + 1,
      5,
      5
    );


    rectMode(
      CORNER
    );
  }
}


// ============================================================
// STRAIN / STRESS CONTOUR
// ============================================================

function drawGaussContourTile(
  x0,
  title,
  field
) {

  const bodyLeft =
    x0 + 4;


  const bodyRight =
    x0 + 26;


  const bodyTop =
    graphTop + 2;


  const bodyBottom =
    graphBottom - 2;


  noStroke();

  fill(30);

  fontSize(
    FS_SMALL
  );


  textAlign(
    CENTER,
    BOTTOM
  );


  text(
    title,
    x0 + contourW / 2,
    graphTop - 8
  );


  function toScreen(
    x,
    y
  ) {

    return [

      map(
        x,
        0,
        w,
        bodyLeft,
        bodyRight
      ),

      map(
        y,
        0,
        h,
        bodyBottom,
        bodyTop
      )
    ];
  }


  // ----------------------------------------------------------
  // FEM off
  // ----------------------------------------------------------

  if (
    !showFEM
  ) {

    noFill();

    stroke(210);

    strokeWeight(
      0.5
    );


    rect(
      bodyLeft,
      bodyTop,
      bodyRight - bodyLeft,
      bodyBottom - bodyTop
    );


    noStroke();

    fill(150);

    fontSize(
      FS_XTINY
    );


    textAlign(
      CENTER,
      CENTER
    );


    text(
      "FEM off",
      x0 + contourW / 2,
      (bodyTop + bodyBottom) / 2
    );


    return;
  }


  // ----------------------------------------------------------
  // contour range
  // ----------------------------------------------------------

  const range =
    gaussFieldRange(
      field
    );


  const minV =
    range.min;


  const maxV =
    range.max;


  const nSub =
    5;


  // ----------------------------------------------------------
  // element contour
  // ----------------------------------------------------------

  noStroke();


  for (
    let e = 0;
    e < femData.elements.length;
    e++
  ) {

    const nodes =
      femData.elements[e];


    const xy =
      nodes.map(
        n =>
          femData.coords[n]
      );


    const gpData =
      femData.gaussResults[e];


    for (
      let a = 0;
      a < nSub;
      a++
    ) {

      const xi1 =
        -1
        +
        2
        *
        a
        /
        nSub;


      const xi2 =
        -1
        +
        2
        *
        (
          a + 1
        )
        /
        nSub;


      for (
        let b = 0;
        b < nSub;
        b++
      ) {

        const eta1 =
          -1
          +
          2
          *
          b
          /
          nSub;


        const eta2 =
          -1
          +
          2
          *
          (
            b + 1
          )
          /
          nSub;


        const xic =
          0.5
          *
          (
            xi1 + xi2
          );


        const etac =
          0.5
          *
          (
            eta1 + eta2
          );


        const val =
          interpolateSelectedGaussField(

            gpData,

            xic,

            etac,

            field
          );


        const p1 =
          toScreen(
            ...naturalPointQ4(
              xy,
              xi1,
              eta1
            )
          );


        const p2 =
          toScreen(
            ...naturalPointQ4(
              xy,
              xi2,
              eta1
            )
          );


        const p3 =
          toScreen(
            ...naturalPointQ4(
              xy,
              xi2,
              eta2
            )
          );


        const p4 =
          toScreen(
            ...naturalPointQ4(
              xy,
              xi1,
              eta2
            )
          );


        fill(
          fieldColour(
            val,
            minV,
            maxV
          )
        );


        quad(

          p1[0],
          p1[1],

          p2[0],
          p2[1],

          p3[0],
          p3[1],

          p4[0],
          p4[1]
        );
      }
    }
  }


  // ----------------------------------------------------------
  // element outlines
  // ----------------------------------------------------------

  noFill();

  stroke(
    70,
    70,
    70,
    80
  );


  strokeWeight(
    0.4
  );


  for (
    const element
    of femData.elements
  ) {

    beginShape();


    for (
      const n
      of element
    ) {

      const p =
        toScreen(
          femData.coords[n][0],
          femData.coords[n][1]
        );


      vertex(
        p[0],
        p[1]
      );
    }


    endShape(
      CLOSE
    );
  }


  // ----------------------------------------------------------
  // integration points
  // ----------------------------------------------------------

  noStroke();

  fill(
    20,
    20,
    20,
    55
  );


  for (
    const elemGP
    of femData.gaussResults
  ) {

    for (
      const gp
      of elemGP
    ) {

      const p =
        toScreen(
          gp.x,
          gp.y
        );


      circle(

        p[0],
        p[1],

        integrationPoints === 1
          ? 2
          : 1.4
      );
    }
  }


  // ----------------------------------------------------------
  // colour bar
  // ----------------------------------------------------------

  const cbX =
    x0 + 31;


  const cbY =
    bodyTop;


  const cbW =
    5;


  const cbH =
    bodyBottom
    -
    bodyTop;


  const nBar =
    50;


  noStroke();


  for (
    let k = 0;
    k < nBar;
    k++
  ) {

    const t =
      k
      /
      (
        nBar - 1
      );


    const val =
      maxV
      -
      t
      *
      (
        maxV - minV
      );


    fill(
      fieldColour(
        val,
        minV,
        maxV
      )
    );


    rect(
      cbX,
      cbY + t * cbH,
      cbW,
      cbH / nBar + 1
    );
  }


  fill(70);

  fontSize(
    FS_XTINY
  );


  textAlign(
    LEFT,
    TOP
  );


  text(
    formatFieldValue(
      maxV
    ),
    cbX + 7,
    cbY - 2
  );


  textAlign(
    LEFT,
    BOTTOM
  );


  text(
    formatFieldValue(
      minV
    ),
    cbX + 7,
    cbY + cbH + 2
  );


  noFill();

  stroke(120);

  strokeWeight(
    0.5
  );


  rect(
    bodyLeft,
    bodyTop,
    bodyRight - bodyLeft,
    bodyBottom - bodyTop
  );
}


// ============================================================
// INTERPOLATE ACTIVE GAUSS FIELD
// ============================================================

function interpolateSelectedGaussField(
  gpData,
  xi,
  eta,
  field
) {

  // ----------------------------------------------------------
  // one-point
  // ----------------------------------------------------------

  if (
    integrationPoints === 1
  ) {

    return field === "eps"

      ? gpData[0].eps

      : gpData[0].sigma;
  }


  // ----------------------------------------------------------
  // four-point
  // ----------------------------------------------------------

  const g =
    1
    /
    Math.sqrt(3);


  const Lxm =
    (
      g - xi
    )
    /
    (
      2 * g
    );


  const Lxp =
    (
      g + xi
    )
    /
    (
      2 * g
    );


  const Lem =
    (
      g - eta
    )
    /
    (
      2 * g
    );


  const Lep =
    (
      g + eta
    )
    /
    (
      2 * g
    );


  const v1 =
    field === "eps"
      ? gpData[0].eps
      : gpData[0].sigma;


  const v2 =
    field === "eps"
      ? gpData[1].eps
      : gpData[1].sigma;


  const v3 =
    field === "eps"
      ? gpData[2].eps
      : gpData[2].sigma;


  const v4 =
    field === "eps"
      ? gpData[3].eps
      : gpData[3].sigma;


  return (

    v1
    *
    Lxm
    *
    Lem

    +

    v2
    *
    Lxp
    *
    Lem

    +

    v3
    *
    Lxp
    *
    Lep

    +

    v4
    *
    Lxm
    *
    Lep
  );
}


// ============================================================
// CONTOUR RANGE
// ============================================================

function gaussFieldRange(
  field
) {

  let minV =
    Infinity;


  let maxV =
    -Infinity;


  for (
    const elemGP
    of femData.gaussResults
  ) {

    for (
      const p
      of elemGP
    ) {

      const value =
        field === "eps"

          ? p.eps

          : p.sigma;


      minV =
        Math.min(
          minV,
          value
        );


      maxV =
        Math.max(
          maxV,
          value
        );
    }
  }


  if (
    Math.abs(
      maxV - minV
    )
    <
    1e-14
  ) {

    const ref =
      Math.max(
        Math.abs(
          maxV
        ),
        1e-8
      );


    minV -=
      0.05 * ref;


    maxV +=
      0.05 * ref;
  }


  return {

    min:
      minV,

    max:
      maxV
  };
}


// ============================================================
// CONTOUR COLOUR
// ============================================================

function fieldColour(
  value,
  minV,
  maxV
) {

  if (
    maxV <= minV
  ) {

    return color(
      245
    );
  }


  // ----------------------------------------------------------
  // blue -> white -> red when range crosses zero
  // ----------------------------------------------------------

  if (
    minV < 0
    &&
    maxV > 0
  ) {

    if (
      value <= 0
    ) {

      const t =
        constrain(

          (
            value - minV
          )
          /
          (
            0 - minV
          ),

          0,
          1
        );


      return lerpColor(

        color(
          45,
          95,
          190
        ),

        color(
          250,
          250,
          250
        ),

        t
      );
    }


    const t =
      constrain(
        value / maxV,
        0,
        1
      );


    return lerpColor(

      color(
        250,
        250,
        250
      ),

      color(
        205,
        55,
        45
      ),

      t
    );
  }


  const t =
    constrain(

      (
        value - minV
      )
      /
      (
        maxV - minV
      ),

      0,
      1
    );


  return lerpColor(

    color(
      55,
      105,
      195
    ),

    color(
      215,
      60,
      45
    ),

    t
  );
}


// ============================================================
// PULSATING SLIDER
// ============================================================

function drawVerticalSlider() {

  const yy =
    yFromPhysicalY(
      currentY
    );


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

  fontSize(
    FS_SMALL
  );


  textAlign(
    LEFT,
    CENTER
  );


  text(
    "y = h",
    sliderX + 8,
    graphTop
  );


  text(
    "y = 0",
    sliderX + 8,
    graphBottom
  );


  // ----------------------------------------------------------
  // pulse
  // ----------------------------------------------------------

  const pulse =

    0.5

    +

    0.5
    *
    Math.sin(
      frameCount
      *
      0.07
    );


  const pulseDiameter =
    18
    +
    10
    *
    pulse;


  const pulseAlpha =
    95
    -
    65
    *
    pulse;


  noFill();

  stroke(
    25,
    80,
    210,
    pulseAlpha
  );


  strokeWeight(
    1.2
  );


  circle(
    sliderX,
    yy,
    pulseDiameter
  );


  fill(255);

  stroke(
    25,
    80,
    210
  );


  strokeWeight(
    1.4
  );


  circle(
    sliderX,
    yy,
    14
  );


  noStroke();

  fill(
    25,
    80,
    210
  );


  circle(
    sliderX,
    yy,
    5
  );


  fill(
    25,
    75,
    190
  );


  fontSize(
    FS_TINY
  );


  textAlign(
    LEFT,
    CENTER
  );


  text(
    `${currentY.toFixed(0)} mm`,
    sliderX + 8,
    yy
  );
}


// ============================================================
// CURRENT HEIGHT GUIDE
// ============================================================

function drawCurrentHeightGuide() {

  const yy =
    yFromPhysicalY(
      currentY
    );


  stroke(
    60,
    90,
    160,
    38
  );


  strokeWeight(
    0.7
  );


  drawingContext.setLineDash(
    [
      4,
      4
    ]
  );


  line(
    sliderX,
    yy,
    sigmaContourX + contourW,
    yy
  );


  drawingContext.setLineDash(
    []
  );
}


// ============================================================
// RESULT GRAPH
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

  const left =
    x0;


  const right =
    x0
    +
    plotW;


  const minValue =
    range.min;


  const maxValue =
    range.max;


  noStroke();

  fill(30);

  fontSize(
    FS_BASE
  );


  textAlign(
    CENTER,
    BOTTOM
  );


  text(
    title,
    left + plotW / 2,
    graphTop - 8
  );


  // ----------------------------------------------------------
  // frame
  // ----------------------------------------------------------

  noFill();

  stroke(115);

  strokeWeight(
    0.65
  );


  rect(
    left,
    graphTop,
    plotW,
    graphBottom - graphTop
  );


  // ----------------------------------------------------------
  // y grid
  // ----------------------------------------------------------

  const heightTicks = [
    0,
    500,
    1000,
    1500,
    2000,
    2500,
    3000
  ];


  for (
    const physicalY
    of heightTicks
  ) {

    const yy =
      yFromPhysicalY(
        physicalY
      );


    stroke(232);

    strokeWeight(
      0.55
    );


    line(
      left,
      yy,
      right,
      yy
    );


    noStroke();

    fill(90);

    fontSize(
      FS_XTINY
    );


    textAlign(
      RIGHT,
      CENTER
    );


    text(
      physicalY,
      left - 4,
      yy
    );
  }


  // ----------------------------------------------------------
  // zero line
  // ----------------------------------------------------------

  if (
    minValue < 0
    &&
    maxValue > 0
  ) {

    const zeroX =
      map(
        0,
        minValue,
        maxValue,
        left,
        right
      );


    stroke(215);

    strokeWeight(
      0.6
    );


    line(
      zeroX,
      graphTop,
      zeroX,
      graphBottom
    );
  }


  // ----------------------------------------------------------
  // exact
  // ----------------------------------------------------------

  if (
    showExact
  ) {

    noFill();

    stroke(
      25,
      90,
      225
    );


    strokeWeight(
      1.6
    );


    beginShape();


    for (
      let i = 0;
      i <= 220;
      i++
    ) {

      const physicalY =
        h
        *
        i
        /
        220;


      const value =
        exactFunction(
          physicalY
        );


      vertex(

        map(
          value,
          minValue,
          maxValue,
          left,
          right
        ),

        yFromPhysicalY(
          physicalY
        )
      );
    }


    endShape();
  }


  // ----------------------------------------------------------
  // FEM
  // ----------------------------------------------------------

  if (
    showFEM
  ) {

    drawFEMFieldCurve(
      left,
      minValue,
      maxValue,
      field
    );
  }


  // ----------------------------------------------------------
  // selected height markers
  // ----------------------------------------------------------

  const py =
    yFromPhysicalY(
      currentY
    );


  if (
    showExact
  ) {

    fill(255);

    stroke(
      25,
      90,
      225
    );


    strokeWeight(
      1.4
    );


    circle(

      map(
        exactCurrent,
        minValue,
        maxValue,
        left,
        right
      ),

      py,

      7
    );
  }


  if (
    showFEM
  ) {

    noStroke();

    fill(
      235,
      45,
      35
    );


    circle(

      map(
        femCurrent,
        minValue,
        maxValue,
        left,
        right
      ),

      py,

      5
    );
  }


  drawMovingValues(
    left,
    py,
    exactCurrent,
    femCurrent
  );


  // ----------------------------------------------------------
  // x axis
  // ----------------------------------------------------------

  noStroke();

  fill(60);

  fontSize(
    FS_TINY
  );


  textAlign(
    CENTER,
    TOP
  );


  text(
    axisLabel,
    left + plotW / 2,
    graphBottom + 17
  );


  drawValueTick(
    left,
    minValue
  );


  drawValueTick(
    right,
    maxValue
  );


  if (
    minValue < 0
    &&
    maxValue > 0
  ) {

    drawValueTick(

      map(
        0,
        minValue,
        maxValue,
        left,
        right
      ),

      0
    );
  }
}


// ============================================================
// MOVING VALUES
// ============================================================

function drawMovingValues(
  left,
  y,
  exactValue,
  femValue
) {

  fontSize(
    FS_XTINY
  );


  const exactText =
    `Ex ${formatFieldValue(exactValue)}`;


  const femText =
    `FEM ${formatFieldValue(femValue)}`;


  const gap =
    4;


  const exactWidth =
    showExact

      ? textWidth(
          exactText
        )

      : 0;


  const femWidth =
    showFEM

      ? textWidth(
          femText
        )

      : 0;


  const totalWidth =

    exactWidth

    +

    femWidth

    +

    (
      showExact
      &&
      showFEM
        ? gap
        : 0
    );


  let x =
    left
    +
    (
      plotW - totalWidth
    )
    /
    2;


  const textY =
    constrain(
      y - 9,
      graphTop + 9,
      graphBottom - 6
    );


  textAlign(
    LEFT,
    CENTER
  );


  if (
    showExact
  ) {

    noStroke();

    fill(
      20,
      80,
      205
    );


    text(
      exactText,
      x,
      textY
    );


    x +=
      exactWidth
      +
      gap;
  }


  if (
    showFEM
  ) {

    noStroke();

    fill(
      205,
      40,
      30
    );


    text(
      femText,
      x,
      textY
    );
  }
}


// ============================================================
// FEM FIELD CURVE
// ============================================================

function drawFEMFieldCurve(
  left,
  minValue,
  maxValue,
  field
) {

  // ==========================================================
  // DISPLACEMENT
  // ==========================================================

  if (
    field === "v"
  ) {

    const data =
      femData.centerline;


    stroke(
      235,
      45,
      35
    );


    strokeWeight(
      1.2
    );


    noFill();


    drawingContext.setLineDash(
      [
        5,
        3
      ]
    );


    beginShape();


    for (
      let k = 0;
      k < data.ys.length;
      k++
    ) {

      vertex(

        map(
          data.v[k],
          minValue,
          maxValue,
          left,
          left + plotW
        ),

        yFromPhysicalY(
          data.ys[k]
        )
      );
    }


    endShape();


    drawingContext.setLineDash(
      []
    );


    return;
  }


  // ==========================================================
  // ONE-POINT INTEGRATION
  //
  // constant stress / strain per element
  // ==========================================================

  if (
    integrationPoints === 1
  ) {

    const dy =
      h
      /
      ny;


    stroke(
      235,
      45,
      35
    );


    strokeWeight(
      1.1
    );


    drawingContext.setLineDash(
      [
        5,
        3
      ]
    );


    let previousX =
      null;


    for (
      let j = 0;
      j < ny;
      j++
    ) {

      const yMid =
        (
          j + 0.5
        )
        *
        dy;


      const q =
        getFEMValueAt(
          yMid
        );


      const value =
        field === "eps"

          ? q.eps

          : q.sigma;


      const xx =
        map(
          value,
          minValue,
          maxValue,
          left,
          left + plotW
        );


      const y1 =
        yFromPhysicalY(
          j * dy
        );


      const y2 =
        yFromPhysicalY(
          (j + 1) * dy
        );


      line(
        xx,
        y1,
        xx,
        y2
      );


      if (
        previousX !== null
      ) {

        line(
          previousX,
          y1,
          xx,
          y1
        );
      }


      noStroke();

      fill(
        235,
        45,
        35
      );


      circle(

        xx,

        yFromPhysicalY(
          yMid
        ),

        ny >= 10
          ? 2.2
          : 3.4
      );


      stroke(
        235,
        45,
        35
      );


      previousX =
        xx;
    }


    drawingContext.setLineDash(
      []
    );


    return;
  }


  // ==========================================================
  // FOUR-POINT INTEGRATION
  // ==========================================================

  const data =
    femData.centerline;


  const values =
    field === "eps"

      ? data.eps

      : data.sigma;


  stroke(
    235,
    45,
    35
  );


  strokeWeight(
    1.1
  );


  noFill();


  drawingContext.setLineDash(
    [
      5,
      3
    ]
  );


  let start = 0;


  while (
    start < data.ys.length
  ) {

    const currentElement =
      data.eid[start];


    let end =
      start;


    while (

      end + 1 < data.ys.length

      &&

      data.eid[
        end + 1
      ]
      ===
      currentElement

    ) {

      end++;
    }


    beginShape();


    for (
      let k = start;
      k <= end;
      k++
    ) {

      vertex(

        map(
          values[k],
          minValue,
          maxValue,
          left,
          left + plotW
        ),

        yFromPhysicalY(
          data.ys[k]
        )
      );
    }


    endShape();


    start =
      end + 1;
  }


  drawingContext.setLineDash(
    []
  );


  // ----------------------------------------------------------
  // Gauss-level markers
  // ----------------------------------------------------------

  const g =
    1 /
    Math.sqrt(3);


  const dy =
    h /
    ny;


  noStroke();

  fill(
    235,
    45,
    35
  );


  for (
    let j = 0;
    j < ny;
    j++
  ) {

    const yCentre =
      (
        j + 0.5
      )
      *
      dy;


    const halfH =
      0.5
      *
      dy;


    const yGP1 =
      yCentre
      -
      g
      *
      halfH;


    const yGP2 =
      yCentre
      +
      g
      *
      halfH;


    const q1 =
      getFEMValueAt(
        yGP1
      );


    const q2 =
      getFEMValueAt(
        yGP2
      );


    const value1 =
      field === "eps"

        ? q1.eps

        : q1.sigma;


    const value2 =
      field === "eps"

        ? q2.eps

        : q2.sigma;


    circle(

      map(
        value1,
        minValue,
        maxValue,
        left,
        left + plotW
      ),

      yFromPhysicalY(
        yGP1
      ),

      ny >= 10
        ? 1.8
        : 3
    );


    circle(

      map(
        value2,
        minValue,
        maxValue,
        left,
        left + plotW
      ),

      yFromPhysicalY(
        yGP2
      ),

      ny >= 10
        ? 1.8
        : 3
    );
  }
}


// ============================================================
// GRAPH RANGE
// ============================================================

function getCombinedRange(
  exactFunction,
  field
) {

  let minValue =
    Infinity;


  let maxValue =
    -Infinity;


  for (
    let i = 0;
    i <= 250;
    i++
  ) {

    const value =
      exactFunction(
        i
        *
        h
        /
        250
      );


    minValue =
      Math.min(
        minValue,
        value
      );


    maxValue =
      Math.max(
        maxValue,
        value
      );
  }


  const values =
    field === "v"

      ? femData.centerline.v

      : field === "eps"

        ? femData.centerline.eps

        : femData.centerline.sigma;


  for (
    const value
    of values
  ) {

    minValue =
      Math.min(
        minValue,
        value
      );


    maxValue =
      Math.max(
        maxValue,
        value
      );
  }


  minValue =
    Math.min(
      minValue,
      0
    );


  maxValue =
    Math.max(
      maxValue,
      0
    );


  let span =
    maxValue
    -
    minValue;


  if (
    Math.abs(
      span
    )
    <
    1e-14
  ) {

    const reference =
      Math.max(
        Math.abs(
          maxValue
        ),
        1e-6
      );


    minValue -=
      0.25
      *
      reference;


    maxValue +=
      0.25
      *
      reference;


    span =
      maxValue
      -
      minValue;
  }


  const padding =
    0.12
    *
    span;


  return {

    min:
      minValue
      -
      padding,

    max:
      maxValue
      +
      padding
  };
}


// ============================================================
// CONTROLS
// ============================================================

function drawControls() {

  controlHits = [];


  noStroke();

  fill(247);


  rect(
    controlsX,
    controlsY,
    controlsW,
    controlsH,
    5
  );


  const row1 =
    controlsY + 27;


  const row2 =
    controlsY + 70;


  drawToggle(
    25,
    row1,
    "Exact",
    showExact,
    "exact"
  );


  drawToggle(
    100,
    row1,
    "FEM",
    showFEM,
    "fem"
  );


  drawToggle(
    170,
    row1,
    "Body",
    bodyForceOn,
    "body"
  );


  drawToggle(
    245,
    row1,
    "Full bottom",
    fullBottomFixed,
    "bottom"
  );


  drawIntegrationToggle(
    390,
    row1
  );


  drawNumberButtons(
    25,
    row2,
    "nx",
    nxOptions,
    nx,
    "nx"
  );


  drawNumberButtons(
    105,
    row2,
    "ny",
    nyOptions,
    ny,
    "ny"
  );
}


// ============================================================
// INTEGRATION TOGGLE
// ============================================================

function drawIntegrationToggle(
  x,
  y
) {

  fontSize(
    FS_BASE
  );


  noStroke();

  fill(45);


  textAlign(
    LEFT,
    CENTER
  );


  text(
    "Int",
    x,
    y
  );


  const oneX =
    x
    +
    textWidth(
      "Int"
    )
    +
    8;


  fontSize(
    FS_SMALL
  );


  fill(
    integrationPoints === 1
      ? 25
      : 105
  );


  text(
    "1",
    oneX,
    y
  );


  const switchX =
    oneX
    +
    textWidth(
      "1"
    )
    +
    7;


  const switchY =
    y - 8;


  const switchW =
    30;


  const switchH =
    16;


  fill(
    55,
    120,
    215
  );


  stroke(145);

  strokeWeight(
    0.7
  );


  rect(
    switchX,
    switchY,
    switchW,
    switchH,
    10
  );


  const knobX =
    integrationPoints === 4

      ? switchX
        +
        switchW
        -
        8

      : switchX
        +
        8;


  fill(255);

  stroke(125);

  strokeWeight(
    0.65
  );


  circle(
    knobX,
    switchY + switchH / 2,
    13
  );


  noStroke();

  fontSize(
    FS_SMALL
  );


  fill(
    integrationPoints === 4
      ? 25
      : 105
  );


  text(
    "4",
    switchX + switchW + 7,
    y
  );


  controlHits.push({

    type:
      "toggle",

    key:
      "integration",

    x,

    y:
      y - 13,

    w:
      (
        switchX
        +
        switchW
        +
        7
        +
        textWidth(
          "4"
        )
      )
      -
      x,

    h:
      26
  });
}


// ============================================================
// NORMAL TOGGLE
// ============================================================

function drawToggle(
  x,
  y,
  label,
  active,
  key
) {

  fontSize(
    FS_BASE
  );


  noStroke();

  fill(45);


  textAlign(
    LEFT,
    CENTER
  );


  text(
    label,
    x,
    y
  );


  const labelWidth =
    textWidth(
      label
    );


  const switchX =
    x
    +
    labelWidth
    +
    8;


  const switchY =
    y - 8;


  const switchW =
    30;


  const switchH =
    16;


  fill(

    active

      ? color(
          55,
          120,
          215
        )

      : color(
          224
        )
  );


  stroke(145);

  strokeWeight(
    0.7
  );


  rect(
    switchX,
    switchY,
    switchW,
    switchH,
    10
  );


  const knobX =
    active

      ? switchX
        +
        switchW
        -
        8

      : switchX
        +
        8;


  fill(255);

  stroke(125);

  strokeWeight(
    0.65
  );


  circle(
    knobX,
    switchY + switchH / 2,
    13
  );


  controlHits.push({

    type:
      "toggle",

    key,

    x,

    y:
      y - 13,

    w:
      labelWidth
      +
      8
      +
      switchW,

    h:
      26
  });
}


// ============================================================
// NUMBER BUTTONS
// ============================================================

function drawNumberButtons(
  x,
  y,
  label,
  options,
  current,
  key
) {

  fontSize(
    FS_BASE
  );


  noStroke();

  fill(45);


  textAlign(
    LEFT,
    CENTER
  );


  text(
    label,
    x,
    y
  );


  let buttonX =
    x
    +
    textWidth(
      label
    )
    +
    9;


  for (
    const value
    of options
  ) {

    const buttonW =
      value >= 10
        ? 20
        : 17;


    const buttonH =
      20;


    if (
      value === current
    ) {

      noStroke();

      fill(218);


      rect(
        buttonX,
        y - buttonH / 2,
        buttonW,
        buttonH,
        4
      );
    }


    noStroke();


    fill(
      value === current
        ? 25
        : 105
    );


    fontSize(
      FS_SMALL
    );


    textAlign(
      CENTER,
      CENTER
    );


    text(
      value,
      buttonX + buttonW / 2,
      y
    );


    controlHits.push({

      type:
        "number",

      key,

      value,

      x:
        buttonX,

      y:
        y - buttonH / 2,

      w:
        buttonW,

      h:
        buttonH
    });


    buttonX +=
      buttonW
      +
      2;
  }
}


// ============================================================
// MOUSE
// ============================================================

function mousePressed() {

  // ----------------------------------------------------------
  // slider
  // ----------------------------------------------------------

  if (

    Math.abs(
      mouseX - sliderX
    )
    <
    18

    &&

    mouseY >= graphTop

    &&

    mouseY <= graphBottom

  ) {

    sliderDragging =
      true;


    currentY =
      physicalYFromScreen(
        mouseY
      );


    return;
  }


  // ----------------------------------------------------------
  // controls
  // ----------------------------------------------------------

  for (
    const hit
    of controlHits
  ) {

    if (

      !insideRect(

        mouseX,
        mouseY,

        hit.x,
        hit.y,
        hit.w,
        hit.h
      )

    ) {

      continue;
    }


    if (
      hit.type === "toggle"
    ) {

      if (
        hit.key === "exact"
      ) {

        showExact =
          !showExact;
      }


      if (
        hit.key === "fem"
      ) {

        showFEM =
          !showFEM;
      }


      if (
        hit.key === "body"
      ) {

        bodyForceOn =
          !bodyForceOn;


        updateFEM();
      }


      if (
        hit.key === "bottom"
      ) {

        fullBottomFixed =
          !fullBottomFixed;


        updateFEM();
      }


      if (
        hit.key === "integration"
      ) {

        integrationPoints =

          integrationPoints === 4

            ? 1

            : 4;


        updateFEM();
      }


      return;
    }


    if (
      hit.type === "number"
    ) {

      if (
        hit.key === "nx"
      ) {

        nx =
          hit.value;
      }


      if (
        hit.key === "ny"
      ) {

        ny =
          hit.value;
      }


      updateFEM();


      return;
    }
  }
}


// ============================================================
// MOUSE DRAG
// ============================================================

function mouseDragged() {

  if (
    sliderDragging
  ) {

    currentY =
      physicalYFromScreen(
        mouseY
      );
  }
}


// ============================================================
// MOUSE RELEASE
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
// COORDINATE MAPPING
// ============================================================

function yFromPhysicalY(y) {

  return map(

    y,

    0,
    h,

    graphBottom,
    graphTop
  );
}


function physicalYFromScreen(y) {

  return map(

    constrain(
      y,
      graphTop,
      graphBottom
    ),

    graphBottom,
    graphTop,

    0,
    h
  );
}


// ============================================================
// ARROW
// ============================================================

function drawArrow(
  x1,
  y1,
  x2,
  y2,
  arrowColor
) {

  stroke(
    arrowColor
  );


  strokeWeight(
    1
  );


  line(
    x1,
    y1,
    x2,
    y2
  );


  const angle =
    Math.atan2(
      y2 - y1,
      x2 - x1
    );


  push();


  translate(
    x2,
    y2
  );


  rotate(
    angle
  );


  fill(
    arrowColor
  );


  noStroke();


  triangle(

    0,
    0,

    -4,
    -2.2,

    -4,
    2.2
  );


  pop();
}


// ============================================================
// GRAPH TICK
// ============================================================

function drawValueTick(
  px,
  value
) {

  stroke(105);

  strokeWeight(
    0.6
  );


  line(
    px,
    graphBottom,
    px,
    graphBottom + 4
  );


  noStroke();

  fill(80);

  fontSize(
    FS_XTINY
  );


  textAlign(
    CENTER,
    TOP
  );


  text(
    formatAxisValue(
      value
    ),
    px,
    graphBottom + 5
  );
}


// ============================================================
// BETTER NUMBER FORMATTING
//
// Prevents misleading:
//
// 0.002500 -> 0.003
//
// etc.
// ============================================================

function formatFieldValue(
  value
) {

  const a =
    Math.abs(
      value
    );


  if (
    a < 1e-14
  ) {

    return "0";
  }


  if (
    a < 1e-3
  ) {

    return value.toExponential(
      2
    );
  }


  if (
    a < 1e-2
  ) {

    return value.toFixed(
      5
    );
  }


  if (
    a < 1
  ) {

    return value.toFixed(
      4
    );
  }


  return value.toFixed(
    3
  );
}


function formatAxisValue(
  value
) {

  const a =
    Math.abs(
      value
    );


  if (
    a < 1e-14
  ) {

    return "0";
  }


  if (
    a < 1e-3
  ) {

    return value.toExponential(
      1
    );
  }


  if (
    a < 1e-2
  ) {

    return value.toFixed(
      4
    );
  }


  if (
    a < 1
  ) {

    return value.toFixed(
      3
    );
  }


  return value.toFixed(
    2
  );
}