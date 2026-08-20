// ============================================================
// INTERACTIVE CST PLATE — 700 px COMPACT VERSION
// Exact 1D comparison + CST FEM
// Displacement / strain / stress profiles
// CST strain & stress contours: one constant colour per triangle
// ============================================================

const W = 700;
const H = 445;

const FS_BASE = 10;
const FS_SMALL = 9;
const FS_TINY = 8;
const FS_XTINY = 7;

// Geometry / material / loading
const w = 500;
const h = 3000;
const thickness = 300;
const E = 3e4;
const nu = 0.3;
const Ts = 0.04;
const bodyForceValue = -2.5e-5;

// Display state
let showExact = true;
let showFEM = true;
let bodyForceOn = true;
let symmetryOn = false;
let fullBottomFixed = true;

// Mesh
let nx = 1;
let ny = 6;

const nxOptions = [1, 2];

const nyOptions = [
  1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12
];

let femData;

// Slider
let currentY = 1500;
let sliderDragging = false;


// ============================================================
// LAYOUT
// ============================================================

const graphTop = 48;
const graphBottom = 300;

const sliderX = 10;


// Model

const plateX = 28;
const plateW = 25;


// Deformed shape

const defTileX = 66;
const defTileW = 70;


// Results

const uPlotX = 150;

const epsPlotX = 270;
const epsContourX = 377;

const sigmaPlotX = 445;
const sigmaContourX = 552;

const plotW = 95;
const contourW = 55;


// Controls

const controlsX = 15;
const controlsY = 325;
const controlsW = W - 30;
const controlsH = 100;

let controlHits = [];


// Visual deformation scale

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
  // DISPLACEMENT
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
  // STRAIN
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


  drawCSTContourTile(

    epsContourX,

    "εy contour",

    "eps"
  );


  // ----------------------------------------------------------
  // STRESS
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


  drawCSTContourTile(

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
// FEM UPDATE
// ============================================================

function updateFEM() {

  femData =
    solveCST(
      nx,
      ny
    );


  femData.centerline =
    buildCenterlineData(
      femData,
      260
    );
}


// ============================================================
// CST MESH
// ============================================================

function generateMesh(
  nxRequested,
  nyRequested
) {

  // ----------------------------------------------------------
  // If symmetry is ON and nx = 1,
  // automatically introduce a centreline.
  // ----------------------------------------------------------

  const nxEff =

    (
      symmetryOn
      &&
      nxRequested === 1
    )

      ? 2

      : nxRequested;


  const coords = [];


  // ----------------------------------------------------------
  // NODES
  // ----------------------------------------------------------

  for (
    let j = 0;
    j <= nyRequested;
    j++
  ) {

    for (
      let i = 0;
      i <= nxEff;
      i++
    ) {

      coords.push([

        w
        *
        i
        /
        nxEff,

        h
        *
        j
        /
        nyRequested
      ]);
    }
  }


  // ----------------------------------------------------------
  // TRIANGULAR ELEMENTS
  // ----------------------------------------------------------

  const elements = [];


  for (
    let j = 0;
    j < nyRequested;
    j++
  ) {

    for (
      let i = 0;
      i < nxEff;
      i++
    ) {

      /*
             n4 -------- n3
             |            |
             |            |
             n1 -------- n2
      */


      const n1 =
        j
        *
        (
          nxEff + 1
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
          nxEff + 1
        )
        +
        i;


      const n3 =
        n4 + 1;


      const xmid =

        0.5

        *

        (
          coords[n1][0]
          +
          coords[n2][0]
        );


      // ------------------------------------------------------
      // SAME DIAGONAL / LEFT HALF
      // ------------------------------------------------------

      if (

        !symmetryOn

        ||

        xmid <= w / 2

      ) {

        elements.push(

          makeCCW(
            coords,
            [
              n1,
              n2,
              n4
            ]
          )
        );


        elements.push(

          makeCCW(
            coords,
            [
              n2,
              n3,
              n4
            ]
          )
        );
      }


      // ------------------------------------------------------
      // MIRRORED RIGHT HALF
      // ------------------------------------------------------

      else {

        elements.push(

          makeCCW(
            coords,
            [
              n1,
              n2,
              n3
            ]
          )
        );


        elements.push(

          makeCCW(
            coords,
            [
              n4,
              n1,
              n3
            ]
          )
        );
      }
    }
  }


  // ----------------------------------------------------------
  // BOUNDARY NODES
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
        coords[n][1]
        -
        h
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

    nxEff,

    ny:
      nyRequested
  };
}


// ============================================================
// ENSURE COUNTER-CLOCKWISE TRIANGLE
// ============================================================

function makeCCW(
  coords,
  nodes
) {

  const a =
    coords[
      nodes[0]
    ];


  const b =
    coords[
      nodes[1]
    ];


  const c =
    coords[
      nodes[2]
    ];


  const cross =

    (
      b[0] - a[0]
    )
    *
    (
      c[1] - a[1]
    )

    -

    (
      b[1] - a[1]
    )
    *
    (
      c[0] - a[0]
    );


  if (
    cross < 0
  ) {

    return [

      nodes[0],

      nodes[2],

      nodes[1]
    ];
  }


  return nodes.slice();
}


// ============================================================
// CST SOLVER
// ============================================================

function solveCST(
  nxRequested,
  nyRequested
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
    2
    *
    nNodes;


  // ----------------------------------------------------------
  // GLOBAL ARRAYS
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
  // PLANE-STRESS CONSTITUTIVE MATRIX
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


  const bGlobal = [

    0,

    getBodyForce()
  ];


  const elementData = [];


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


    const x1 =
      xy[0][0];


    const y1 =
      xy[0][1];


    const x2 =
      xy[1][0];


    const y2 =
      xy[1][1];


    const x3 =
      xy[2][0];


    const y3 =
      xy[2][1];


    // --------------------------------------------------------
    // TWICE THE TRIANGLE AREA
    // --------------------------------------------------------

    const twoA =

      x1
      *
      (
        y2 - y3
      )

      +

      x2
      *
      (
        y3 - y1
      )

      +

      x3
      *
      (
        y1 - y2
      );


    if (
      twoA <= 1e-12
    ) {

      throw new Error(
        "CST element has non-positive area."
      );
    }


    const Ael =
      twoA / 2;


    // --------------------------------------------------------
    // CST COEFFICIENTS
    // --------------------------------------------------------

    const b1 =
      y2 - y3;


    const b2 =
      y3 - y1;


    const b3 =
      y1 - y2;


    const c1 =
      x3 - x2;


    const c2 =
      x1 - x3;


    const c3 =
      x2 - x1;


    const q =
      1 / twoA;


    // --------------------------------------------------------
    // B MATRIX
    // --------------------------------------------------------

    const B = [

      [
        b1 * q,
        0,

        b2 * q,
        0,

        b3 * q,
        0
      ],

      [
        0,
        c1 * q,

        0,
        c2 * q,

        0,
        c3 * q
      ],

      [
        c1 * q,
        b1 * q,

        c2 * q,
        b2 * q,

        c3 * q,
        b3 * q
      ]
    ];


    // --------------------------------------------------------
    // ELEMENT STIFFNESS
    //
    // ke = t A B^T D B
    // --------------------------------------------------------

    const ke =
      scaleMatrix(

        matMul(

          transpose(B),

          matMul(
            D,
            B
          )
        ),

        thickness
        *
        Ael
      );


    // --------------------------------------------------------
    // BODY FORCE
    // --------------------------------------------------------

    const bodyScale =

      thickness
      *
      Ael
      /
      3;


    const feBody = [

      bGlobal[0] * bodyScale,
      bGlobal[1] * bodyScale,

      bGlobal[0] * bodyScale,
      bGlobal[1] * bodyScale,

      bGlobal[0] * bodyScale,
      bGlobal[1] * bodyScale
    ];


    const edof =
      elementDofs(
        nodes
      );


    assembleMatrix(
      K,
      ke,
      edof
    );


    assembleVector(
      Fb,
      feBody,
      edof
    );


    elementData.push({

      nodes:
        nodes.slice(),

      B,

      strainGlobal:
        [
          0,
          0,
          0
        ],

      stressGlobal:
        [
          0,
          0,
          0
        ]
    });
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
  // TOTAL FORCE
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

      const err =
        Math.abs(

          coords[n][0]
          -
          w / 2
        );


      if (
        err < best
      ) {

        best =
          err;


        anchor =
          n;
      }
    }


    BCx = [
      anchor
    ];
  }


  // ----------------------------------------------------------
  // FIXED DOFs
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
  // CST POSTPROCESSING
  //
  // One constant strain and stress state per triangle.
  // ==========================================================

  for (
    let e = 0;
    e < elementData.length;
    e++
  ) {

    const ed =
      elementData[e];


    const edof =
      elementDofs(
        ed.nodes
      );


    const de =
      edof.map(

        k =>
          d[k]
      );


    const strain =
      matVec(
        ed.B,
        de
      );


    const stress =
      matVec(
        D,
        strain
      );


    ed.strainGlobal =
      strain;


    ed.stressGlobal =
      stress;
  }


  return {

    ...mesh,

    nNodes,

    ndof,

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

    elementData,

    D
  };
}


// ============================================================
// ELEMENT DOFs
// ============================================================

function elementDofs(
  nodes
) {

  return [

    2 * nodes[0],
    2 * nodes[0] + 1,

    2 * nodes[1],
    2 * nodes[1] + 1,

    2 * nodes[2],
    2 * nodes[2] + 1
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


function scaleMatrix(
  A,
  multiplier
) {

  return A.map(

    row =>
      row.map(

        value =>
          multiplier
          *
          value
      )
  );
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
// LINEAR SYSTEM SOLVER
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
  // GAUSSIAN ELIMINATION
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
        "Singular stiffness matrix. Check boundary conditions."
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


      if (

        Math.abs(
          factor
        )

        <
        1e-30

      ) {

        continue;
      }


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
  // BACK SUBSTITUTION
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


  const xq =

    w / 2

    +

    1e-8
    *
    w;


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


    const yi =
      constrain(

        y,

        1e-9
        *
        h,

        h
        -
        1e-9
        *
        h
      );


    const q =
      evaluateAtPoint(
        fem,
        xq,
        yi
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
// VALUE AT CURRENT HEIGHT
// ============================================================

function getFEMValueAt(y) {

  return evaluateAtPoint(

    femData,

    w / 2
    +
    1e-8
    *
    w,

    constrain(

      y,

      1e-9
      *
      h,

      h
      -
      1e-9
      *
      h
    )
  );
}


// ============================================================
// VALUE AT ARBITRARY POINT
// ============================================================

function evaluateAtPoint(
  fem,
  x,
  y
) {

  let result =
    evaluateAtPointOneSide(
      fem,
      x,
      y
    );


  if (
    result
  ) {

    return result;
  }


  result =
    evaluateAtPointOneSide(

      fem,

      w / 2
      -
      1e-8
      *
      w,

      y
    );


  return result || {

    v: 0,

    eps: 0,

    sigma: 0,

    eid: 0,

    N:
      [
        1,
        0,
        0
      ]
  };
}


function evaluateAtPointOneSide(
  fem,
  x,
  y
) {

  const p = [
    x,
    y
  ];


  for (
    let e = 0;
    e < fem.elements.length;
    e++
  ) {

    const nodes =
      fem.elements[e];


    const N =
      barycentric(

        p,

        fem.coords[
          nodes[0]
        ],

        fem.coords[
          nodes[1]
        ],

        fem.coords[
          nodes[2]
        ]
      );


    if (
      N
    ) {

      const vv =

        N[0]
        *
        fem.d[
          2 * nodes[0] + 1
        ]

        +

        N[1]
        *
        fem.d[
          2 * nodes[1] + 1
        ]

        +

        N[2]
        *
        fem.d[
          2 * nodes[2] + 1
        ];


      return {

        v:
          vv,

        eps:
          fem.elementData[e]
            .strainGlobal[1],

        sigma:
          fem.elementData[e]
            .stressGlobal[1],

        eid:
          e,

        N
      };
    }
  }


  return null;
}


// ============================================================
// BARYCENTRIC COORDINATES
// ============================================================

function barycentric(
  p,
  a,
  b,
  c
) {

  const denominator =

    (
      b[1] - c[1]
    )
    *
    (
      a[0] - c[0]
    )

    +

    (
      c[0] - b[0]
    )
    *
    (
      a[1] - c[1]
    );


  if (

    Math.abs(
      denominator
    )

    <
    1e-14

  ) {

    return null;
  }


  const N1 =

    (
      (
        b[1] - c[1]
      )
      *
      (
        p[0] - c[0]
      )

      +

      (
        c[0] - b[0]
      )
      *
      (
        p[1] - c[1]
      )
    )

    /
    denominator;


  const N2 =

    (
      (
        c[1] - a[1]
      )
      *
      (
        p[0] - c[0]
      )

      +

      (
        a[0] - c[0]
      )
      *
      (
        p[1] - c[1]
      )
    )

    /
    denominator;


  const N3 =
    1
    -
    N1
    -
    N2;


  const tol =
    1e-7;


  if (

    N1 >= -tol

    &&

    N2 >= -tol

    &&

    N3 >= -tol

    &&

    N1 <= 1 + tol

    &&

    N2 <= 1 + tol

    &&

    N3 <= 1 + tol

  ) {

    return [
      N1,
      N2,
      N3
    ];
  }


  return null;
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
  // PLATE
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
  // MESH GUIDE
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
        155,
        155,
        155,
        85
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


      noStroke();

      fill(40);


      circle(

        plateX - 3,

        yy,

        ny >= 10
          ? 2
          : 2.8
      );
    }


    for (
      let i = 1;
      i < femData.nxEff;
      i++
    ) {

      const xx =

        plateX

        +

        plateW
        *
        i
        /
        femData.nxEff;


      stroke(
        160,
        160,
        160,
        80
      );


      line(
        xx,
        top,
        xx,
        bottom
      );
    }
  }


  // ----------------------------------------------------------
  // BODY FORCE
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
  // TOP TRACTION
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
// SUPPORTS
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
      let xx = -2;
      xx <= widthPx + 5;
      xx += 6
    ) {

      line(

        x0 + xx,
        y0,

        x0 + xx - 4,
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
  // UNDEFORMED
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

    const a =
      point(
        ...femData.coords[
          element[0]
        ]
      );


    const b =
      point(
        ...femData.coords[
          element[1]
        ]
      );


    const c =
      point(
        ...femData.coords[
          element[2]
        ]
      );


    triangle(

      a[0],
      a[1],

      b[0],
      b[1],

      c[0],
      c[1]
    );
  }


  drawingContext.setLineDash(
    []
  );


  // ----------------------------------------------------------
  // DEFORMED
  // ----------------------------------------------------------

  if (
    showFEM
  ) {

    fill(
      235,
      45,
      35,
      14
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

      const a =
        deformedPoint(
          element[0]
        );


      const b =
        deformedPoint(
          element[1]
        );


      const c =
        deformedPoint(
          element[2]
        );


      triangle(

        a[0],
        a[1],

        b[0],
        b[1],

        c[0],
        c[1]
      );
    }
  }


  drawDeformedSupports(
    point
  );


  // ----------------------------------------------------------
  // LABELS
  // ----------------------------------------------------------

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


  fill(

    symmetryOn

      ? color(
          20,
          95,
          185
        )

      : color(100)
  );


  text(

    symmetryOn
      ? "mirrored mesh"
      : "same diagonals",

    (left + right) / 2,

    graphBottom + 14
  );
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
// CST CONSTANT STRAIN / STRESS CONTOURS
//
// ONE SOLID COLOUR PER TRIANGLE.
//
// No interpolation or smoothing is used.
// ============================================================

function drawCSTContourTile(
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


  // ----------------------------------------------------------
  // TITLE
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // PHYSICAL -> SCREEN
  // ----------------------------------------------------------

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
  // FEM OFF
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

      (
        bodyTop + bodyBottom
      )
      /
      2
    );


    return;
  }


  // ==========================================================
  // FIELD RANGE
  // ==========================================================

  const range =
    cstFieldRange(
      field
    );


  const minV =
    range.min;


  const maxV =
    range.max;


  // ==========================================================
  // CONSTANT TRIANGULAR ELEMENT COLOURS
  // ==========================================================

  for (
    let e = 0;
    e < femData.elements.length;
    e++
  ) {

    const element =
      femData.elements[e];


    const result =
      femData.elementData[e];


    // --------------------------------------------------------
    // ONE CONSTANT VALUE FOR THIS CST
    // --------------------------------------------------------

    const value =

      field === "eps"

        ? result
            .strainGlobal[1]

        : result
            .stressGlobal[1];


    const p1 =
      toScreen(
        ...femData.coords[
          element[0]
        ]
      );


    const p2 =
      toScreen(
        ...femData.coords[
          element[1]
        ]
      );


    const p3 =
      toScreen(
        ...femData.coords[
          element[2]
        ]
      );


    noStroke();


    fill(
      fieldColour(
        value,
        minV,
        maxV
      )
    );


    triangle(

      p1[0],
      p1[1],

      p2[0],
      p2[1],

      p3[0],
      p3[1]
    );
  }


  // ==========================================================
  // TRIANGLE EDGES
  // ==========================================================

  noFill();

  stroke(
    55,
    55,
    55,
    90
  );


  strokeWeight(
    0.45
  );


  for (
    const element
    of femData.elements
  ) {

    const p1 =
      toScreen(
        ...femData.coords[
          element[0]
        ]
      );


    const p2 =
      toScreen(
        ...femData.coords[
          element[1]
        ]
      );


    const p3 =
      toScreen(
        ...femData.coords[
          element[2]
        ]
      );


    triangle(

      p1[0],
      p1[1],

      p2[0],
      p2[1],

      p3[0],
      p3[1]
    );
  }


  // ==========================================================
  // SUBTLE CENTROID DOT
  //
  // Represents one constant element result.
  // ==========================================================

  noStroke();

  fill(
    20,
    20,
    20,
    45
  );


  for (
    const element
    of femData.elements
  ) {

    const xC =

      (
        femData.coords[
          element[0]
        ][0]

        +

        femData.coords[
          element[1]
        ][0]

        +

        femData.coords[
          element[2]
        ][0]
      )

      /
      3;


    const yC =

      (
        femData.coords[
          element[0]
        ][1]

        +

        femData.coords[
          element[1]
        ][1]

        +

        femData.coords[
          element[2]
        ][1]
      )

      /
      3;


    const p =
      toScreen(
        xC,
        yC
      );


    circle(
      p[0],
      p[1],
      1.4
    );
  }


  // ==========================================================
  // COLOUR BAR
  // ==========================================================

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


    const value =

      maxV

      -

      t
      *
      (
        maxV - minV
      );


    fill(
      fieldColour(
        value,
        minV,
        maxV
      )
    );


    rect(

      cbX,

      cbY
      +
      t
      *
      cbH,

      cbW,

      cbH
      /
      nBar
      +
      1
    );
  }


  // ----------------------------------------------------------
  // MAXIMUM
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // MINIMUM
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // FRAME
  // ----------------------------------------------------------

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
// CST CONTOUR RANGE
// ============================================================

function cstFieldRange(
  field
) {

  let minV =
    Infinity;


  let maxV =
    -Infinity;


  for (
    const result
    of femData.elementData
  ) {

    const value =

      field === "eps"

        ? result
            .strainGlobal[1]

        : result
            .stressGlobal[1];


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


  if (

    Math.abs(
      maxV - minV
    )

    <
    1e-14

  ) {

    const reference =
      Math.max(

        Math.abs(
          maxV
        ),

        1e-8
      );


    minV -=
      0.05
      *
      reference;


    maxV +=
      0.05
      *
      reference;
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

    return color(245);
  }


  // ----------------------------------------------------------
  // RANGE CROSSES ZERO
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


    else {

      const t =
        constrain(

          value
          /
          maxV,

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
  }


  // ----------------------------------------------------------
  // SINGLE-SIGNED RANGE
  // ----------------------------------------------------------

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
// PULSATING HEIGHT SLIDER
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


  // ----------------------------------------------------------
  // LABELS
  // ----------------------------------------------------------

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
  // PULSE
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


  // ----------------------------------------------------------
  // MAIN SLIDER
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // VALUE
  // ----------------------------------------------------------

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

    sigmaContourX
    +
    contourW,

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


  // ----------------------------------------------------------
  // TITLE
  // ----------------------------------------------------------

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
  // FRAME
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

    graphBottom
    -
    graphTop
  );


  // ----------------------------------------------------------
  // HEIGHT GRID
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
  // ZERO LINE
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
  // EXACT
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

    if (
      field === "v"
    ) {

      drawFEMDisplacement(

        left,

        minValue,

        maxValue
      );
    }


    else {

      drawFEMStepField(

        left,

        minValue,

        maxValue,

        field
      );
    }
  }


  // ----------------------------------------------------------
  // CURRENT-Y MARKERS
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
  // AXIS
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
      plotW
      -
      totalWidth
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
// FEM DISPLACEMENT PROFILE
// ============================================================

function drawFEMDisplacement(
  left,
  minValue,
  maxValue
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
    let i = 0;
    i < data.ys.length;
    i++
  ) {

    vertex(

      map(

        data.v[i],

        minValue,
        maxValue,

        left,
        left + plotW
      ),

      yFromPhysicalY(
        data.ys[i]
      )
    );
  }


  endShape();


  drawingContext.setLineDash(
    []
  );


  // ----------------------------------------------------------
  // LEVEL MARKERS
  // ----------------------------------------------------------

  noStroke();

  fill(
    235,
    45,
    35
  );


  for (
    let j = 0;
    j <= ny;
    j++
  ) {

    const physicalY =

      h
      *
      j
      /
      ny;


    const value =
      getFEMValueAt(
        physicalY
      ).v;


    circle(

      map(

        value,

        minValue,
        maxValue,

        left,
        left + plotW
      ),

      yFromPhysicalY(
        physicalY
      ),

      ny >= 10
        ? 2
        : 3.2
    );
  }
}


// ============================================================
// CST STRAIN / STRESS STEP PROFILE
//
// Each triangle has a constant value.
// ============================================================

function drawFEMStepField(
  left,
  minValue,
  maxValue,
  field
) {

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


  drawingContext.setLineDash(
    [
      5,
      3
    ]
  );


  let start =
    0;


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


    const value =
      values[start];


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
        data.ys[start]
      );


    const y2 =
      yFromPhysicalY(
        data.ys[end]
      );


    // constant field

    line(
      xx,
      y1,
      xx,
      y2
    );


    // jump to next triangle

    if (
      end + 1 < data.ys.length
    ) {

      const nextValue =
        values[
          end + 1
        ];


      const nextX =
        map(

          nextValue,

          minValue,
          maxValue,

          left,
          left + plotW
        );


      line(
        xx,
        y2,
        nextX,
        y2
      );
    }


    // element marker

    noStroke();

    fill(
      235,
      45,
      35
    );


    circle(

      xx,

      0.5
      *
      (
        y1 + y2
      ),

      ny >= 10
        ? 1.8
        : 2.8
    );


    stroke(
      235,
      45,
      35
    );


    strokeWeight(
      1.1
    );


    start =
      end + 1;
  }


  drawingContext.setLineDash(
    []
  );
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


  // exact

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


  // FEM

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

    const ref =
      Math.max(

        Math.abs(
          maxValue
        ),

        1e-6
      );


    minValue -=
      0.25
      *
      ref;


    maxValue +=
      0.25
      *
      ref;


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

    "Symmetry",

    symmetryOn,

    "symmetry"
  );


  drawToggle(

    360,

    row1,

    "Full bottom",

    fullBottomFixed,

    "bottom"
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
// TOGGLE
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

    switchY
    +
    switchH / 2,

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

        y
        -
        buttonH / 2,

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

      buttonX
      +
      buttonW / 2,

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
        y
        -
        buttonH / 2,

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
  // SLIDER
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
  // CONTROLS
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
        hit.key === "symmetry"
      ) {

        symmetryOn =
          !symmetryOn;


        updateFEM();
      }


      if (
        hit.key === "bottom"
      ) {

        fullBottomFixed =
          !fullBottomFixed;


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
// NUMBER FORMATTING
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