// ============================================================
// INTERACTIVE Q8 / Q9 PLATE — COMPACT 700 px VERSION
// Exact 1D comparison + higher-order FEM + 3x3 GP contours
// Sparse PCG solver avoids p5.js "infinite loop" issue
// ============================================================

const W = 700;
const H = 445;

const FS_BASE = 10;
const FS_SMALL = 9;
const FS_TINY = 8;
const FS_XTINY = 7;

// Geometry / material / loading
const w = 500;                  // mm
const h = 3000;                 // mm
const thickness = 300;          // mm
const E = 3e4;                  // N/mm^2
const nu = 0.3;
const Ts = 0.04;                // N/mm^2
const bodyForceValue = -2.5e-5; // N/mm^3

// Display state
let showExact = true;
let showFEM = true;
let bodyForceOn = true;
let useQ9 = false;              // false = Q8, true = Q9
let fullBottomFixed = false;    // DEFAULT OFF

// Mesh
let nx = 1;
let ny = 1;

const nxOptions = [1, 2];

const nyOptions = [
  1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12
];

let femData;

// Slider
let currentY = 1500;
let sliderDragging = false;

// Layout
const graphTop = 48;
const graphBottom = 300;

const sliderX = 10;

const plateX = 28;
const plateW = 25;

const defTileX = 66;
const defTileW = 70;

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
// SETUP / DRAW
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


  drawGaussContourTile(

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

  textFont(
    "Anaheim"
  );

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
    solveHigherOrder(
      nx,
      ny,
      useQ9
    );


  femData.centerline =
    buildCenterlineData(
      femData,
      240
    );
}


// ============================================================
// STRUCTURED Q8 / Q9 MESH
// ============================================================

function generateHigherOrderMesh(
  nxRequested,
  nyRequested,
  q9
) {

  const coords = [];

  const nodeMap =
    new Map();


  function key(
    I,
    J
  ) {

    return `${I},${J}`;
  }


  function addNode(
    I,
    J
  ) {

    const k =
      key(
        I,
        J
      );


    if (
      nodeMap.has(k)
    ) {

      return nodeMap.get(k);
    }


    const n =
      coords.length;


    coords.push([

      w * I
      /
      (
        2 * nxRequested
      ),

      h * J
      /
      (
        2 * nyRequested
      )
    ]);


    nodeMap.set(
      k,
      n
    );


    return n;
  }


  // ----------------------------------------------------------
  // HALF-STEP STRUCTURED GRID
  //
  // Q8:
  // odd-odd centre nodes omitted
  //
  // Q9:
  // odd-odd centre nodes included
  // ----------------------------------------------------------

  for (
    let J = 0;
    J <= 2 * nyRequested;
    J++
  ) {

    for (
      let I = 0;
      I <= 2 * nxRequested;
      I++
    ) {

      if (
        !q9
        &&
        I % 2 === 1
        &&
        J % 2 === 1
      ) {

        continue;
      }


      addNode(
        I,
        J
      );
    }
  }


  // ----------------------------------------------------------
  // CONNECTIVITY
  //
  //       4 ----- 7 ----- 3
  //       |               |
  //       8       9       6
  //       |               |
  //       1 ----- 5 ----- 2
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

      const I =
        2 * i;


      const J =
        2 * j;


      const n1 =
        nodeMap.get(
          key(
            I,
            J
          )
        );


      const n2 =
        nodeMap.get(
          key(
            I + 2,
            J
          )
        );


      const n3 =
        nodeMap.get(
          key(
            I + 2,
            J + 2
          )
        );


      const n4 =
        nodeMap.get(
          key(
            I,
            J + 2
          )
        );


      const n5 =
        nodeMap.get(
          key(
            I + 1,
            J
          )
        );


      const n6 =
        nodeMap.get(
          key(
            I + 2,
            J + 1
          )
        );


      const n7 =
        nodeMap.get(
          key(
            I + 1,
            J + 2
          )
        );


      const n8 =
        nodeMap.get(
          key(
            I,
            J + 1
          )
        );


      if (q9) {

        const n9 =
          nodeMap.get(
            key(
              I + 1,
              J + 1
            )
          );


        elements.push([
          n1,
          n2,
          n3,
          n4,
          n5,
          n6,
          n7,
          n8,
          n9
        ]);
      }


      else {

        elements.push([
          n1,
          n2,
          n3,
          n4,
          n5,
          n6,
          n7,
          n8
        ]);
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
      nyRequested,

    q9
  };
}


// ============================================================
// Q8 / Q9 SOLVER
// ============================================================

function solveHigherOrder(
  nxRequested,
  nyRequested,
  q9
) {

  const mesh =
    generateHigherOrderMesh(
      nxRequested,
      nyRequested,
      q9
    );


  const coords =
    mesh.coords;


  const elements =
    mesh.elements;


  const nNodes =
    coords.length;


  const ndof =
    2 * nNodes;


  const nen =
    q9
      ? 9
      : 8;


  const nedof =
    2 * nen;


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
  // PLANE-STRESS MATRIX
  // ==========================================================

  const cD =
    E
    /
    (
      1 -
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


  // ==========================================================
  // FULL 3 x 3 GAUSS INTEGRATION
  // ==========================================================

  const g =
    Math.sqrt(
      3 / 5
    );


  const gp = [
    -g,
    0,
    g
  ];


  const gw = [
    5 / 9,
    8 / 9,
    5 / 9
  ];


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
        nedof,
        nedof
      );


    const fbe =
      new Array(
        nedof
      ).fill(0);


    // --------------------------------------------------------
    // 3 x 3 INTEGRATION
    // --------------------------------------------------------

    for (
      let i = 0;
      i < 3;
      i++
    ) {

      for (
        let j = 0;
        j < 3;
        j++
      ) {

        const xi =
          gp[i];


        const eta =
          gp[j];


        const weight =
          gw[i]
          *
          gw[j];


        const kin =
          higherKinematics(
            xy,
            xi,
            eta,
            q9
          );


        // ----------------------------------------------------
        // STIFFNESS
        // ----------------------------------------------------

        const BtDB =
          matMul(

            transpose(
              kin.B
            ),

            matMul(
              D,
              kin.B
            )
          );


        addScaledMatrix(

          ke,

          BtDB,

          thickness
          *
          kin.detJ
          *
          weight
        );


        // ----------------------------------------------------
        // BODY FORCE
        // ----------------------------------------------------

        const fbGP =
          matVec(

            transpose(
              kin.Nmat
            ),

            bGlobal
          );


        const loadFactor =
          thickness
          *
          kin.detJ
          *
          weight;


        for (
          let a = 0;
          a < nedof;
          a++
        ) {

          fbe[a] +=
            loadFactor
            *
            fbGP[a];
        }
      }
    }


    // --------------------------------------------------------
    // GLOBAL ASSEMBLY
    // --------------------------------------------------------

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
      fbe,
      edof
    );
  }


  // ==========================================================
  // TOP TRACTION
  //
  // QUADRATIC EDGE
  //
  // CORNER : MIDSIDE : CORNER
  //
  // 1 : 4 : 1
  // ==========================================================

  const dx =
    w
    /
    nxRequested;


  for (
    let i = 0;
    i < nxRequested;
    i++
  ) {

    const e =
      (
        nyRequested - 1
      )
      *
      nxRequested
      +
      i;


    const nodes =
      elements[e];


    const n4 =
      nodes[3];


    const n7 =
      nodes[6];


    const n3 =
      nodes[2];


    const fCorner =
      Ts
      *
      thickness
      *
      dx
      /
      6;


    const fMid =
      4
      *
      Ts
      *
      thickness
      *
      dx
      /
      6;


    Fp[
      2 * n4 + 1
    ] +=
      fCorner;


    Fp[
      2 * n7 + 1
    ] +=
      fMid;


    Fp[
      2 * n3 + 1
    ] +=
      fCorner;
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


  // ----------------------------------------------------------
  // FULL BOTTOM
  // ----------------------------------------------------------

  if (
    fullBottomFixed
  ) {

    BCx =
      mesh.bottomNodes.slice();
  }


  // ----------------------------------------------------------
  // DEFAULT:
  //
  // v = 0 along bottom
  // u = 0 at one bottom node
  // ----------------------------------------------------------

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
  // FIXED DOFS
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
  // SOLVE USING SPARSE PCG
  // ==========================================================

  const dFree =
    solveReducedSparsePCG(
      K,
      F,
      free
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
  // GAUSS-POINT POSTPROCESSING
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
      elementDofs(
        nodes
      );


    const de =
      edof.map(
        k =>
          d[k]
      );


    const points = [];


    for (
      let i = 0;
      i < 3;
      i++
    ) {

      for (
        let j = 0;
        j < 3;
        j++
      ) {

        const xi =
          gp[i];


        const eta =
          gp[j];


        const kin =
          higherKinematics(
            xy,
            xi,
            eta,
            q9
          );


        const strain =
          matVec(
            kin.B,
            de
          );


        const stress =
          matVec(
            D,
            strain
          );


        const pos =
          naturalPoint(
            xy,
            xi,
            eta,
            q9
          );


        points.push({

          i,

          j,

          xi,

          eta,

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

    gaussResults,

    gauss1D:
      gp,

    gaussWeights:
      gw
  };
}


// ============================================================
// SPARSE PRECONDITIONED CONJUGATE GRADIENT SOLVER
// ============================================================

function solveReducedSparsePCG(
  K,
  F,
  free
) {

  const n =
    free.length;


  if (
    n === 0
  ) {

    return [];
  }


  const b =
    new Array(
      n
    );


  const rows =
    new Array(
      n
    );


  const invDiag =
    new Array(
      n
    );


  // ----------------------------------------------------------
  // CONVERT REDUCED STIFFNESS MATRIX TO SPARSE ROWS
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < n;
    i++
  ) {

    const gi =
      free[i];


    b[i] =
      F[gi];


    const sparseRow = [];


    for (
      let j = 0;
      j < n;
      j++
    ) {

      const value =
        K[
          gi
        ][
          free[j]
        ];


      if (
        Math.abs(
          value
        )
        >
        1e-15
      ) {

        sparseRow.push([
          j,
          value
        ]);
      }
    }


    rows[i] =
      sparseRow;


    const diagonal =
      K[
        gi
      ][
        gi
      ];


    if (
      Math.abs(
        diagonal
      )
      <
      1e-20
    ) {

      throw new Error(
        "Zero diagonal found in reduced stiffness matrix."
      );
    }


    invDiag[i] =
      1
      /
      diagonal;
  }


  // ----------------------------------------------------------
  // INITIAL SOLUTION
  // ----------------------------------------------------------

  const x =
    new Array(
      n
    ).fill(0);


  const r =
    b.slice();


  const z =
    new Array(
      n
    );


  const p =
    new Array(
      n
    );


  // ----------------------------------------------------------
  // JACOBI PRECONDITIONER
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < n;
    i++
  ) {

    z[i] =
      invDiag[i]
      *
      r[i];


    p[i] =
      z[i];
  }


  let rzOld =
    dotProduct(
      r,
      z
    );


  const bNorm =
    Math.sqrt(
      dotProduct(
        b,
        b
      )
    );


  if (
    bNorm < 1e-20
  ) {

    return x;
  }


  const tolerance =
    Math.max(
      1e-10 * bNorm,
      1e-12
    );


  const maxIterations =
    Math.max(
      250,
      3 * n
    );


  // ==========================================================
  // PCG ITERATION
  // ==========================================================

  for (
    let iter = 0;
    iter < maxIterations;
    iter++
  ) {

    const Ap =
      sparseMatVec(
        rows,
        p
      );


    const pAp =
      dotProduct(
        p,
        Ap
      );


    if (
      Math.abs(
        pAp
      )
      <
      1e-30
    ) {

      throw new Error(
        "PCG breakdown: stiffness matrix may be singular."
      );
    }


    const alpha =
      rzOld
      /
      pAp;


    let residualSquared = 0;


    for (
      let i = 0;
      i < n;
      i++
    ) {

      x[i] +=
        alpha
        *
        p[i];


      r[i] -=
        alpha
        *
        Ap[i];


      residualSquared +=
        r[i]
        *
        r[i];
    }


    // --------------------------------------------------------
    // CONVERGENCE
    // --------------------------------------------------------

    if (
      Math.sqrt(
        residualSquared
      )
      <=
      tolerance
    ) {

      return x;
    }


    // --------------------------------------------------------
    // PRECONDITION
    // --------------------------------------------------------

    for (
      let i = 0;
      i < n;
      i++
    ) {

      z[i] =
        invDiag[i]
        *
        r[i];
    }


    const rzNew =
      dotProduct(
        r,
        z
      );


    const beta =
      rzNew
      /
      rzOld;


    for (
      let i = 0;
      i < n;
      i++
    ) {

      p[i] =
        z[i]
        +
        beta
        *
        p[i];
    }


    rzOld =
      rzNew;
  }


  return x;
}


// ============================================================
// SPARSE MATRIX-VECTOR PRODUCT
// ============================================================

function sparseMatVec(
  rows,
  x
) {

  const y =
    new Array(
      rows.length
    ).fill(0);


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    let sum = 0;


    const row =
      rows[i];


    for (
      let k = 0;
      k < row.length;
      k++
    ) {

      const entry =
        row[k];


      sum +=
        entry[1]
        *
        x[
          entry[0]
        ];
    }


    y[i] =
      sum;
  }


  return y;
}


// ============================================================
// DOT PRODUCT
// ============================================================

function dotProduct(
  a,
  b
) {

  let value = 0;


  for (
    let i = 0;
    i < a.length;
    i++
  ) {

    value +=
      a[i]
      *
      b[i];
  }


  return value;
}


// ============================================================
// Q8 / Q9 KINEMATICS
// ============================================================

function higherKinematics(
  xy,
  xi,
  eta,
  q9
) {

  const shape =
    q9

      ? q9ShapeFunctions(
          xi,
          eta
        )

      : q8ShapeFunctions(
          xi,
          eta
        );


  const N =
    shape.N;


  const dNdxi =
    shape.dNdxi;


  const dNdeta =
    shape.dNdeta;


  const nen =
    N.length;


  let dx_dxi = 0;

  let dy_dxi = 0;

  let dx_deta = 0;

  let dy_deta = 0;


  for (
    let a = 0;
    a < nen;
    a++
  ) {

    dx_dxi +=
      dNdxi[a]
      *
      xy[a][0];


    dy_dxi +=
      dNdxi[a]
      *
      xy[a][1];


    dx_deta +=
      dNdeta[a]
      *
      xy[a][0];


    dy_deta +=
      dNdeta[a]
      *
      xy[a][1];
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
    detJ <= 1e-12
  ) {

    throw new Error(
      "Q8/Q9 element has non-positive Jacobian."
    );
  }


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


  const dNdx =
    new Array(
      nen
    );


  const dNdy =
    new Array(
      nen
    );


  for (
    let a = 0;
    a < nen;
    a++
  ) {

    dNdx[a] =

      invJ[0][0]
      *
      dNdxi[a]

      +

      invJ[0][1]
      *
      dNdeta[a];


    dNdy[a] =

      invJ[1][0]
      *
      dNdxi[a]

      +

      invJ[1][1]
      *
      dNdeta[a];
  }


  const B =
    zerosMatrix(
      3,
      2 * nen
    );


  const Nmat =
    zerosMatrix(
      2,
      2 * nen
    );


  for (
    let a = 0;
    a < nen;
    a++
  ) {

    B[0][
      2 * a
    ] =
      dNdx[a];


    B[1][
      2 * a + 1
    ] =
      dNdy[a];


    B[2][
      2 * a
    ] =
      dNdy[a];


    B[2][
      2 * a + 1
    ] =
      dNdx[a];


    Nmat[0][
      2 * a
    ] =
      N[a];


    Nmat[1][
      2 * a + 1
    ] =
      N[a];
  }


  return {

    N,

    B,

    Nmat,

    J,

    detJ,

    dNdx,

    dNdy
  };
}


// ============================================================
// NATURAL -> PHYSICAL POINT
// ============================================================

function naturalPoint(
  xy,
  xi,
  eta,
  q9
) {

  const shape =
    q9

      ? q9ShapeFunctions(
          xi,
          eta
        )

      : q8ShapeFunctions(
          xi,
          eta
        );


  let x = 0;

  let y = 0;


  for (
    let a = 0;
    a < shape.N.length;
    a++
  ) {

    x +=
      shape.N[a]
      *
      xy[a][0];


    y +=
      shape.N[a]
      *
      xy[a][1];
  }


  return [
    x,
    y
  ];
}


// ============================================================
// Q8 SHAPE FUNCTIONS
// ============================================================

function q8ShapeFunctions(
  xi,
  eta
) {

  const N =
    new Array(8);


  const dNdxi =
    new Array(8);


  const dNdeta =
    new Array(8);


  // ----------------------------------------------------------
  // N
  // ----------------------------------------------------------

  N[0] =
    -0.25
    *
    (1 - xi)
    *
    (1 - eta)
    *
    (1 + xi + eta);


  N[1] =
    -0.25
    *
    (1 + xi)
    *
    (1 - eta)
    *
    (1 - xi + eta);


  N[2] =
    -0.25
    *
    (1 + xi)
    *
    (1 + eta)
    *
    (1 - xi - eta);


  N[3] =
    -0.25
    *
    (1 - xi)
    *
    (1 + eta)
    *
    (1 + xi - eta);


  N[4] =
    0.5
    *
    (1 - xi * xi)
    *
    (1 - eta);


  N[5] =
    0.5
    *
    (1 + xi)
    *
    (1 - eta * eta);


  N[6] =
    0.5
    *
    (1 - xi * xi)
    *
    (1 + eta);


  N[7] =
    0.5
    *
    (1 - xi)
    *
    (1 - eta * eta);


  // ----------------------------------------------------------
  // dN/dxi
  // ----------------------------------------------------------

  dNdxi[0] =
    0.25
    *
    (1 - eta)
    *
    (2 * xi + eta);


  dNdxi[1] =
    0.25
    *
    (1 - eta)
    *
    (2 * xi - eta);


  dNdxi[2] =
    0.25
    *
    (1 + eta)
    *
    (2 * xi + eta);


  dNdxi[3] =
    0.25
    *
    (1 + eta)
    *
    (2 * xi - eta);


  dNdxi[4] =
    -xi
    *
    (1 - eta);


  dNdxi[5] =
    0.5
    *
    (1 - eta * eta);


  dNdxi[6] =
    -xi
    *
    (1 + eta);


  dNdxi[7] =
    -0.5
    *
    (1 - eta * eta);


  // ----------------------------------------------------------
  // dN/deta
  // ----------------------------------------------------------

  dNdeta[0] =
    0.25
    *
    (1 - xi)
    *
    (xi + 2 * eta);


  dNdeta[1] =
    0.25
    *
    (1 + xi)
    *
    (-xi + 2 * eta);


  dNdeta[2] =
    0.25
    *
    (1 + xi)
    *
    (xi + 2 * eta);


  dNdeta[3] =
    0.25
    *
    (1 - xi)
    *
    (-xi + 2 * eta);


  dNdeta[4] =
    -0.5
    *
    (1 - xi * xi);


  dNdeta[5] =
    -(1 + xi)
    *
    eta;


  dNdeta[6] =
    0.5
    *
    (1 - xi * xi);


  dNdeta[7] =
    -(1 - xi)
    *
    eta;


  return {

    N,

    dNdxi,

    dNdeta
  };
}


// ============================================================
// Q9 SHAPE FUNCTIONS
// ============================================================

function q9ShapeFunctions(
  xi,
  eta
) {

  function Lm(s) {

    return 0.5 * s * (s - 1);
  }


  function L0(s) {

    return 1 - s * s;
  }


  function Lp(s) {

    return 0.5 * s * (s + 1);
  }


  function dLm(s) {

    return s - 0.5;
  }


  function dL0(s) {

    return -2 * s;
  }


  function dLp(s) {

    return s + 0.5;
  }


  const xm =
    Lm(xi);


  const x0 =
    L0(xi);


  const xp =
    Lp(xi);


  const em =
    Lm(eta);


  const e0 =
    L0(eta);


  const ep =
    Lp(eta);


  const dxm =
    dLm(xi);


  const dx0 =
    dL0(xi);


  const dxp =
    dLp(xi);


  const dem =
    dLm(eta);


  const de0 =
    dL0(eta);


  const dep =
    dLp(eta);


  const N = [

    xm * em,

    xp * em,

    xp * ep,

    xm * ep,

    x0 * em,

    xp * e0,

    x0 * ep,

    xm * e0,

    x0 * e0
  ];


  const dNdxi = [

    dxm * em,

    dxp * em,

    dxp * ep,

    dxm * ep,

    dx0 * em,

    dxp * e0,

    dx0 * ep,

    dxm * e0,

    dx0 * e0
  ];


  const dNdeta = [

    xm * dem,

    xp * dem,

    xp * dep,

    xm * dep,

    x0 * dem,

    xp * de0,

    x0 * dep,

    xm * de0,

    x0 * de0
  ];


  return {

    N,

    dNdxi,

    dNdeta
  };
}


// ============================================================
// DOF / MATRIX HELPERS
// ============================================================

function elementDofs(
  nodes
) {

  const edof = [];


  for (
    const n
    of nodes
  ) {

    edof.push(
      2 * n,
      2 * n + 1
    );
  }


  return edof;
}


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


    const row =
      A[i];


    for (
      let j = 0;
      j < row.length;
      j++
    ) {

      sum +=
        row[j]
        *
        x[j];
    }


    y[i] =
      sum;
  }


  return y;
}


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
// CENTRELINE RESULTS
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


function getFEMValueAt(y) {

  return getFEMValueAtModel(
    femData,
    y
  );
}


// ============================================================
// FEM VALUE AT HEIGHT y
// ============================================================

function getFEMValueAtModel(
  fem,
  y
) {

  // Slight right offset when nx=2 so the sampling line
  // is not exactly on the interface between two elements.

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


  const kin =
    higherKinematics(
      xy,
      xi,
      eta,
      fem.q9
    );


  const edof =
    elementDofs(
      nodes
    );


  const de =
    edof.map(
      k =>
        fem.d[k]
    );


  const displacement =
    matVec(
      kin.Nmat,
      de
    );


  const strain =
    matVec(
      kin.B,
      de
    );


  const stress =
    matVec(
      fem.D,
      strain
    );


  return {

    u:
      displacement[0],

    v:
      displacement[1],

    eps:
      strain[1],

    sigma:
      stress[1],

    eid,

    xi,

    eta
  };
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
  // MESH
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
        0.55
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
      j <= 2 * ny;
      j++
    ) {

      const yy =
        map(
          j,
          0,
          2 * ny,
          bottom,
          top
        );


      circle(
        plateX - 3,
        yy,
        ny >= 8
          ? 2
          : 2.8
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
      0.85
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


  // IMPORTANT:
  //
  // Do NOT call this variable "scale".
  // scale() is a built-in p5.js function.

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


  function screenPoint(
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
    0.6
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

    drawElementBoundary(
      element,
      screenPoint,
      false
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
      12
    );


    stroke(
      235,
      45,
      35
    );


    strokeWeight(
      0.9
    );


    for (
      const element
      of femData.elements
    ) {

      drawElementBoundary(
        element,
        screenPoint,
        true
      );
    }


    drawDeformedGaussPoints(
      screenPoint
    );
  }


  drawDeformedSupports(
    screenPoint
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
    useQ9
      ? "Q9 mesh"
      : "Q8 mesh",
    (left + right) / 2,
    graphBottom + 14
  );
}


// ============================================================
// HIGHER-ORDER ELEMENT BOUNDARY
// ============================================================

function drawElementBoundary(
  element,
  screenPoint,
  deformed
) {

  const nodes =
    element;


  const xy =
    nodes.map(
      n =>
        femData.coords[n]
    );


  const edof =
    elementDofs(
      nodes
    );


  const de =
    edof.map(
      k =>
        femData.d[k]
    );


  const nEdge =
    10;


  function mapped(
    xi,
    eta
  ) {

    const shape =
      femData.q9

        ? q9ShapeFunctions(
            xi,
            eta
          )

        : q8ShapeFunctions(
            xi,
            eta
          );


    let x = 0;

    let y = 0;


    for (
      let a = 0;
      a < nodes.length;
      a++
    ) {

      let xa =
        xy[a][0];


      let ya =
        xy[a][1];


      if (
        deformed
      ) {

        xa +=
          deformationScale
          *
          de[
            2 * a
          ];


        ya +=
          deformationScale
          *
          de[
            2 * a + 1
          ];
      }


      x +=
        shape.N[a]
        *
        xa;


      y +=
        shape.N[a]
        *
        ya;
    }


    return screenPoint(
      x,
      y
    );
  }


  beginShape();


  // bottom edge

  for (
    let k = 0;
    k <= nEdge;
    k++
  ) {

    const s =
      -1
      +
      2 * k / nEdge;


    const p =
      mapped(
        s,
        -1
      );


    vertex(
      p[0],
      p[1]
    );
  }


  // right edge

  for (
    let k = 1;
    k <= nEdge;
    k++
  ) {

    const s =
      -1
      +
      2 * k / nEdge;


    const p =
      mapped(
        1,
        s
      );


    vertex(
      p[0],
      p[1]
    );
  }


  // top edge

  for (
    let k = 1;
    k <= nEdge;
    k++
  ) {

    const s =
      1
      -
      2 * k / nEdge;


    const p =
      mapped(
        s,
        1
      );


    vertex(
      p[0],
      p[1]
    );
  }


  // left edge

  for (
    let k = 1;
    k < nEdge;
    k++
  ) {

    const s =
      1
      -
      2 * k / nEdge;


    const p =
      mapped(
        -1,
        s
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


// ============================================================
// SUBTLE 3 x 3 GAUSS POINTS
// ============================================================

function drawDeformedGaussPoints(
  screenPoint
) {

  const g =
    Math.sqrt(
      3 / 5
    );


  const gps = [
    -g,
    0,
    g
  ];


  push();


  noStroke();


  fill(
    70,
    70,
    70,
    58
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
      elementDofs(
        nodes
      );


    const de =
      edof.map(
        k =>
          femData.d[k]
      );


    for (
      const xi
      of gps
    ) {

      for (
        const eta
        of gps
      ) {

        const shape =
          femData.q9

            ? q9ShapeFunctions(
                xi,
                eta
              )

            : q8ShapeFunctions(
                xi,
                eta
              );


        let x = 0;

        let y = 0;


        for (
          let a = 0;
          a < nodes.length;
          a++
        ) {

          const xd =
            xy[a][0]
            +
            deformationScale
            *
            de[
              2 * a
            ];


          const yd =
            xy[a][1]
            +
            deformationScale
            *
            de[
              2 * a + 1
            ];


          x +=
            shape.N[a]
            *
            xd;


          y +=
            shape.N[a]
            *
            yd;
        }


        const p =
          screenPoint(
            x,
            y
          );


        circle(
          p[0],
          p[1],
          1.7
        );
      }
    }
  }


  pop();
}


// ============================================================
// DEFORMED SUPPORTS
// ============================================================

function drawDeformedSupports(
  screenPoint
) {

  if (
    fullBottomFixed
  ) {

    const a =
      screenPoint(
        0,
        0
      );


    const b =
      screenPoint(
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
        screenPoint(
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
      screenPoint(
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
// GAUSS-POINT CONTOURS
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
      (bodyTop + bodyBottom) / 2
    );


    return;
  }


  const range =
    gaussFieldRange(
      field
    );


  const minV =
    range.min;


  const maxV =
    range.max;


  // ----------------------------------------------------------
  // INTERPOLATE 3 x 3 GAUSS VALUES
  // ----------------------------------------------------------

  const nSub =
    5;


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


    const gpVals =
      femData.gaussResults[e]
      .map(
        p =>
          field === "eps"
            ? p.eps
            : p.sigma
      );


    for (
      let a = 0;
      a < nSub;
      a++
    ) {

      const xi1 =
        -1
        +
        2 * a / nSub;


      const xi2 =
        -1
        +
        2 * (a + 1) / nSub;


      for (
        let b = 0;
        b < nSub;
        b++
      ) {

        const eta1 =
          -1
          +
          2 * b / nSub;


        const eta2 =
          -1
          +
          2 * (b + 1) / nSub;


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
          interpolateGaussField(
            gpVals,
            xic,
            etac
          );


        const p1 =
          toScreen(
            ...naturalPoint(
              xy,
              xi1,
              eta1,
              femData.q9
            )
          );


        const p2 =
          toScreen(
            ...naturalPoint(
              xy,
              xi2,
              eta1,
              femData.q9
            )
          );


        const p3 =
          toScreen(
            ...naturalPoint(
              xy,
              xi2,
              eta2,
              femData.q9
            )
          );


        const p4 =
          toScreen(
            ...naturalPoint(
              xy,
              xi1,
              eta2,
              femData.q9
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
  // ELEMENT OUTLINES
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

    const corners = [

      element[0],

      element[1],

      element[2],

      element[3]
    ];


    beginShape();


    for (
      const n
      of corners
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
  // ACTUAL 3 x 3 GAUSS POINTS
  // ----------------------------------------------------------

  noStroke();

  fill(
    20,
    20,
    20,
    52
  );


  for (
    const elemGP
    of femData.gaussResults
  ) {

    for (
      const oneGP
      of elemGP
    ) {

      const p =
        toScreen(
          oneGP.x,
          oneGP.y
        );


      circle(
        p[0],
        p[1],
        1.4
      );
    }
  }


  // ----------------------------------------------------------
  // COLOUR BAR
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
// GAUSS FIELD RANGE
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
// INTERPOLATE FIELD THROUGH 3 x 3 GAUSS POINTS
// ============================================================

function interpolateGaussField(
  values,
  xi,
  eta
) {

  const g =
    Math.sqrt(
      3 / 5
    );


  const Lx =
    gaussQuadraticBasis(
      xi,
      g
    );


  const Le =
    gaussQuadraticBasis(
      eta,
      g
    );


  let value = 0;


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    for (
      let j = 0;
      j < 3;
      j++
    ) {

      value +=
        Lx[i]
        *
        Le[j]
        *
        values[
          i * 3 + j
        ];
    }
  }


  return value;
}


// ============================================================
// QUADRATIC BASIS THROUGH GAUSS LOCATIONS
// ============================================================

function gaussQuadraticBasis(
  s,
  g
) {

  return [

    s
    *
    (s - g)
    /
    (
      2 * g * g
    ),

    1
    -
    (
      s * s
    )
    /
    (
      g * g
    ),

    s
    *
    (s + g)
    /
    (
      2 * g * g
    )
  ];
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
// PULSATING VERTICAL SLIDER
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
    10 * pulse;


  const pulseAlpha =
    95
    -
    65 * pulse;


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
    graphBottom - graphTop
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
      1.7
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
  // CURRENT LOCATION
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
      1.5
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
  // AXIS LABEL
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
// MOVING EXACT / FEM VALUES
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

  const data =
    femData.centerline;


  const values =
    field === "v"

      ? data.v

      : field === "eps"

        ? data.eps

        : data.sigma;


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


  // ----------------------------------------------------------
  // EACH ELEMENT SEGMENT DRAWN SEPARATELY
  // ----------------------------------------------------------

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
  // ONE MARKER PER ELEMENT ROW
  // ----------------------------------------------------------

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

    const yMid =
      (
        j + 0.5
      )
      *
      h
      /
      ny;


    const q =
      getFEMValueAt(
        yMid
      );


    const value =
      field === "v"

        ? q.v

        : field === "eps"

          ? q.eps

          : q.sigma;


    circle(

      map(
        value,
        minValue,
        maxValue,
        left,
        left + plotW
      ),

      yFromPhysicalY(
        yMid
      ),

      ny >= 10
        ? 2.2
        : 3.4
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
        i * h / 250
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


  drawElementToggle(
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
// Q8 / Q9 TOGGLE
// ============================================================

function drawElementToggle(
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
    "Element",
    x,
    y
  );


  const q8x =
    x
    +
    textWidth(
      "Element"
    )
    +
    10;


  fontSize(
    FS_SMALL
  );


  fill(
    useQ9
      ? 105
      : 25
  );


  text(
    "Q8",
    q8x,
    y
  );


  const switchX =
    q8x
    +
    textWidth(
      "Q8"
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
    useQ9

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
    useQ9
      ? 25
      : 105
  );


  text(
    "Q9",
    switchX + switchW + 7,
    y
  );


  controlHits.push({

    type:
      "toggle",

    key:
      "element",

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
          "Q9"
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
        hit.key === "bottom"
      ) {

        fullBottomFixed =
          !fullBottomFixed;


        updateFEM();
      }


      if (
        hit.key === "element"
      ) {

        useQ9 =
          !useQ9;


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
// DRAG / RELEASE
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
    1.05
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
//
// Avoid misleading rounding such as:
//
// 0.002500 -> 0.003
// 0.002498 -> 0.002
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