// ============================================================
// INTERACTIVE LST PLATE — 700 px COMPACT VERSION
// 6-node quadratic triangle (Linear Strain Triangle)
//
// Exact 1D comparison
// Displacement / strain / stress profiles
// 3-point triangular integration
// LST strain / stress contours
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const W = 700;
const H = 445;


// ============================================================
// TYPOGRAPHY
// ============================================================

const FS_BASE = 10;
const FS_SMALL = 9;
const FS_TINY = 8;
const FS_XTINY = 7;


// ============================================================
// GEOMETRY / MATERIAL / LOADING
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

let symmetryOn = false;

let fullBottomFixed = true;


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
// SLIDER
// ============================================================

let currentY = 1500;

let sliderDragging = false;


// ============================================================
// 700 px LAYOUT
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


// result plots

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


  textFont(
    "Anaheim"
  );


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


  drawLSTContourTile(

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


  drawLSTContourTile(

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
// UPDATE FEM
// ============================================================

function updateFEM() {

  femData =
    solveLST(
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
// LST MESH
//
// Six-node triangular element:
//
//                3
//               / \
//              6   5
//             /     \
//            1---4---2
//
// node 4 = midpoint 1-2
// node 5 = midpoint 2-3
// node 6 = midpoint 3-1
// ============================================================

function generateLSTMesh(
  nxRequested,
  nyRequested
) {

  // ----------------------------------------------------------
  // symmetry mode introduces a centreline if nx = 1
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

  const nodeMap =
    new Map();


  // ----------------------------------------------------------
  // integer half-grid key
  //
  // corner nodes occur at even I,J
  // midside nodes occur at odd/even combinations
  // ----------------------------------------------------------

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

      w
      *
      I
      /
      (
        2 * nxEff
      ),

      h
      *
      J
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
  // physical orientation test
  // ----------------------------------------------------------

  function physicalCross(
    A,
    B,
    C
  ) {

    const ax =
      w
      *
      A[0]
      /
      (
        2 * nxEff
      );


    const ay =
      h
      *
      A[1]
      /
      (
        2 * nyRequested
      );


    const bx =
      w
      *
      B[0]
      /
      (
        2 * nxEff
      );


    const by =
      h
      *
      B[1]
      /
      (
        2 * nyRequested
      );


    const cx =
      w
      *
      C[0]
      /
      (
        2 * nxEff
      );


    const cy =
      h
      *
      C[1]
      /
      (
        2 * nyRequested
      );


    return (

      (bx - ax)
      *
      (cy - ay)

      -

      (by - ay)
      *
      (cx - ax)
    );
  }


  const elements = [];


  // ----------------------------------------------------------
  // add one six-node triangle
  // ----------------------------------------------------------

  function addTriangle(
    A,
    B,
    C
  ) {

    let P1 =
      A.slice();


    let P2 =
      B.slice();


    let P3 =
      C.slice();


    // ensure CCW orientation

    if (
      physicalCross(
        P1,
        P2,
        P3
      )
      <
      0
    ) {

      const temp =
        P2;


      P2 =
        P3;


      P3 =
        temp;
    }


    // corner nodes

    const n1 =
      addNode(
        P1[0],
        P1[1]
      );


    const n2 =
      addNode(
        P2[0],
        P2[1]
      );


    const n3 =
      addNode(
        P3[0],
        P3[1]
      );


    // midside nodes

    const n4 =
      addNode(

        (
          P1[0]
          +
          P2[0]
        )
        /
        2,

        (
          P1[1]
          +
          P2[1]
        )
        /
        2
      );


    const n5 =
      addNode(

        (
          P2[0]
          +
          P3[0]
        )
        /
        2,

        (
          P2[1]
          +
          P3[1]
        )
        /
        2
      );


    const n6 =
      addNode(

        (
          P3[0]
          +
          P1[0]
        )
        /
        2,

        (
          P3[1]
          +
          P1[1]
        )
        /
        2
      );


    elements.push([
      n1,
      n2,
      n3,
      n4,
      n5,
      n6
    ]);
  }


  // ==========================================================
  // RECTANGULAR CELLS -> TWO LST TRIANGLES
  // ==========================================================

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

      const I =
        2 * i;


      const J =
        2 * j;


      // rectangle corners

      const P1 = [
        I,
        J
      ];


      const P2 = [
        I + 2,
        J
      ];


      const P3 = [
        I + 2,
        J + 2
      ];


      const P4 = [
        I,
        J + 2
      ];


      const xmid =
        w
        *
        (
          i + 0.5
        )
        /
        nxEff;


      // ------------------------------------------------------
      // same diagonal / left half
      // ------------------------------------------------------

      if (

        !symmetryOn

        ||

        xmid <= w / 2

      ) {

        addTriangle(
          P1,
          P2,
          P4
        );


        addTriangle(
          P2,
          P3,
          P4
        );
      }


      // ------------------------------------------------------
      // mirrored right-half diagonal
      // ------------------------------------------------------

      else {

        addTriangle(
          P1,
          P2,
          P3
        );


        addTriangle(
          P4,
          P1,
          P3
        );
      }
    }
  }


  // ==========================================================
  // BOUNDARY NODES
  // ==========================================================

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


  // ==========================================================
  // FIND QUADRATIC TOP EDGES
  //
  // edge 1-2 uses node 4
  // edge 2-3 uses node 5
  // edge 3-1 uses node 6
  // ==========================================================

  const topEdgeMap =
    new Map();


  const edgeDefs = [

    [
      0,
      1,
      3
    ],

    [
      1,
      2,
      4
    ],

    [
      2,
      0,
      5
    ]
  ];


  for (
    const element
    of elements
  ) {

    for (
      const edge
      of edgeDefs
    ) {

      const a =
        element[
          edge[0]
        ];


      const b =
        element[
          edge[1]
        ];


      const m =
        element[
          edge[2]
        ];


      if (

        Math.abs(
          coords[a][1] - h
        )
        <
        1e-9

        &&

        Math.abs(
          coords[b][1] - h
        )
        <
        1e-9

      ) {

        const edgeKey =

          a < b

            ? `${a},${b}`

            : `${b},${a}`;


        if (
          !topEdgeMap.has(
            edgeKey
          )
        ) {

          topEdgeMap.set(

            edgeKey,

            [
              a,
              m,
              b
            ]
          );
        }
      }
    }
  }


  return {

    coords,

    elements,

    bottomNodes,

    topNodes,

    topEdges:
      Array.from(
        topEdgeMap.values()
      ),

    nxEff,

    ny:
      nyRequested
  };
}


// ============================================================
// LST SHAPE FUNCTIONS
//
// reference triangle:
//
// node 1: (r,s) = (0,0)
// node 2: (r,s) = (1,0)
// node 3: (r,s) = (0,1)
//
// area coordinates:
//
// L1 = 1-r-s
// L2 = r
// L3 = s
// ============================================================

function lstShapeFunctions(
  r,
  s
) {

  const L1 =
    1 - r - s;


  const L2 =
    r;


  const L3 =
    s;


  // ----------------------------------------------------------
  // quadratic shape functions
  // ----------------------------------------------------------

  const N = [

    L1
    *
    (
      2 * L1 - 1
    ),

    L2
    *
    (
      2 * L2 - 1
    ),

    L3
    *
    (
      2 * L3 - 1
    ),

    4
    *
    L1
    *
    L2,

    4
    *
    L2
    *
    L3,

    4
    *
    L3
    *
    L1
  ];


  // ----------------------------------------------------------
  // derivatives wrt r
  // ----------------------------------------------------------

  const dNdr = [

    1
    -
    4 * L1,

    4 * L2
    -
    1,

    0,

    4
    *
    (
      L1 - L2
    ),

    4
    *
    L3,

    -4
    *
    L3
  ];


  // ----------------------------------------------------------
  // derivatives wrt s
  // ----------------------------------------------------------

  const dNds = [

    1
    -
    4 * L1,

    0,

    4 * L3
    -
    1,

    -4
    *
    L2,

    4
    *
    L2,

    4
    *
    (
      L1 - L3
    )
  ];


  return {

    N,

    dNdr,

    dNds,

    L1,

    L2,

    L3
  };
}


// ============================================================
// LST KINEMATICS
// ============================================================

function lstKinematics(
  xy,
  r,
  s
) {

  const shape =
    lstShapeFunctions(
      r,
      s
    );


  const N =
    shape.N;


  let dxdr = 0;

  let dydr = 0;

  let dxds = 0;

  let dyds = 0;


  for (
    let a = 0;
    a < 6;
    a++
  ) {

    dxdr +=
      shape.dNdr[a]
      *
      xy[a][0];


    dydr +=
      shape.dNdr[a]
      *
      xy[a][1];


    dxds +=
      shape.dNds[a]
      *
      xy[a][0];


    dyds +=
      shape.dNds[a]
      *
      xy[a][1];
  }


  // ----------------------------------------------------------
  // Jacobian
  //
  // [Nr]   [xr yr] [Nx]
  // [Ns] = [xs ys] [Ny]
  // ----------------------------------------------------------

  const J = [

    [
      dxdr,
      dydr
    ],

    [
      dxds,
      dyds
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
      "LST element has non-positive Jacobian."
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


  // ----------------------------------------------------------
  // derivatives wrt x,y
  // ----------------------------------------------------------

  const dNdx =
    new Array(6);


  const dNdy =
    new Array(6);


  for (
    let a = 0;
    a < 6;
    a++
  ) {

    dNdx[a] =

      invJ[0][0]
      *
      shape.dNdr[a]

      +

      invJ[0][1]
      *
      shape.dNds[a];


    dNdy[a] =

      invJ[1][0]
      *
      shape.dNdr[a]

      +

      invJ[1][1]
      *
      shape.dNds[a];
  }


  // ----------------------------------------------------------
  // B matrix
  // ----------------------------------------------------------

  const B =
    zerosMatrix(
      3,
      12
    );


  // ----------------------------------------------------------
  // displacement N matrix
  // ----------------------------------------------------------

  const Nmat =
    zerosMatrix(
      2,
      12
    );


  for (
    let a = 0;
    a < 6;
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

    Nmat,

    B,

    J,

    detJ,

    dNdx,

    dNdy
  };
}


// ============================================================
// NATURAL -> PHYSICAL COORDINATES
// ============================================================

function naturalPointLST(
  xy,
  r,
  s
) {

  const N =
    lstShapeFunctions(
      r,
      s
    ).N;


  let x = 0;

  let y = 0;


  for (
    let a = 0;
    a < 6;
    a++
  ) {

    x +=
      N[a]
      *
      xy[a][0];


    y +=
      N[a]
      *
      xy[a][1];
  }


  return [
    x,
    y
  ];
}


// ============================================================
// THREE-POINT TRIANGLE INTEGRATION
//
// barycentric locations:
//
// (2/3, 1/6, 1/6)
// (1/6, 2/3, 1/6)
// (1/6, 1/6, 2/3)
//
// in r,s:
//
// (1/6,1/6)
// (2/3,1/6)
// (1/6,2/3)
//
// weights = 1/6
//
// weights sum to 1/2 = area of reference triangle
// ============================================================

function triangleIntegrationRule() {

  return [

    {
      r: 1 / 6,
      s: 1 / 6,
      weight: 1 / 6
    },

    {
      r: 2 / 3,
      s: 1 / 6,
      weight: 1 / 6
    },

    {
      r: 1 / 6,
      s: 2 / 3,
      weight: 1 / 6
    }
  ];
}


// ============================================================
// LST SOLVER
// ============================================================

function solveLST(
  nxRequested,
  nyRequested
) {

  const mesh =
    generateLSTMesh(
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
  // global matrices / vectors
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
    triangleIntegrationRule();


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
        12,
        12
      );


    const fbe =
      new Array(
        12
      ).fill(0);


    // --------------------------------------------------------
    // numerical integration
    // --------------------------------------------------------

    for (
      const gp
      of rule
    ) {

      const kin =
        lstKinematics(
          xy,
          gp.r,
          gp.s
        );


      // ------------------------------------------------------
      // stiffness
      //
      // ke = ∫ B' D B t detJ dr ds
      // ------------------------------------------------------

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
        gp.weight
      );


      // ------------------------------------------------------
      // body force
      // ------------------------------------------------------

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
        gp.weight;


      for (
        let a = 0;
        a < 12;
        a++
      ) {

        fbe[a] +=

          loadFactor
          *
          fbGP[a];
      }
    }


    const edof =
      elementDofsLST(
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
  // quadratic edge consistent load:
  //
  // corner : midside : corner
  //
  //       1 : 4 : 1
  // ==========================================================

  for (
    const edge
    of mesh.topEdges
  ) {

    const n1 =
      edge[0];


    const nm =
      edge[1];


    const n2 =
      edge[2];


    const Le =
      Math.hypot(

        coords[n2][0]
        -
        coords[n1][0],

        coords[n2][1]
        -
        coords[n1][1]
      );


    const fCorner =

      Ts
      *
      thickness
      *
      Le
      /
      6;


    const fMid =

      4
      *
      Ts
      *
      thickness
      *
      Le
      /
      6;


    Fp[
      2 * n1 + 1
    ] +=
      fCorner;


    Fp[
      2 * nm + 1
    ] +=
      fMid;


    Fp[
      2 * n2 + 1
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
  // full bottom fixed
  // ----------------------------------------------------------

  if (
    fullBottomFixed
  ) {

    BCx =
      mesh.bottomNodes.slice();
  }


  // ----------------------------------------------------------
  // roller-like bottom
  //
  // v = 0 along bottom
  // one u = 0 anchor
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
  // SOLVE WITH SPARSE PCG
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
      elementDofsLST(
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

      const kin =
        lstKinematics(
          xy,
          gp.r,
          gp.s
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
        naturalPointLST(
          xy,
          gp.r,
          gp.s
        );


      points.push({

        r:
          gp.r,

        s:
          gp.s,

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

    gaussResults
  };
}


// ============================================================
// ELEMENT DOFs
// ============================================================

function elementDofsLST(
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


// ============================================================
// MATRIX HELPERS
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
// SPARSE PRECONDITIONED CONJUGATE GRADIENT
//
// used instead of dense Gaussian elimination so
// nx = 2, ny = 12 remains practical in p5.js
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
    new Array(n);


  const rows =
    new Array(n);


  const invDiag =
    new Array(n);


  // ----------------------------------------------------------
  // reduced sparse matrix
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


    const row = [];


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
        Math.abs(value)
        >
        1e-15
      ) {

        row.push([
          j,
          value
        ]);
      }
    }


    rows[i] =
      row;


    const diagonal =
      K[
        gi
      ][
        gi
      ];


    if (
      Math.abs(diagonal)
      <
      1e-20
    ) {

      throw new Error(
        "Zero diagonal in reduced LST stiffness matrix."
      );
    }


    invDiag[i] =
      1
      /
      diagonal;
  }


  // ----------------------------------------------------------
  // initial vectors
  // ----------------------------------------------------------

  const x =
    new Array(n).fill(0);


  const r =
    b.slice();


  const z =
    new Array(n);


  const p =
    new Array(n);


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
      350,
      4 * n
    );


  // ==========================================================
  // PCG ITERATIONS
  // ==========================================================

  for (
    let iteration = 0;
    iteration < maxIterations;
    iteration++
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
      Math.abs(pAp)
      <
      1e-30
    ) {

      break;
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


    if (
      Math.sqrt(
        residualSquared
      )
      <=
      tolerance
    ) {

      return x;
    }


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

      sum +=

        row[k][1]

        *

        x[
          row[k][0]
        ];
    }


    y[i] =
      sum;
  }


  return y;
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


  // tiny offset avoids landing exactly on shared edges

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
      evaluateLSTAtPoint(
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

  return evaluateLSTAtPoint(

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
// LST VALUE AT ARBITRARY POINT
// ============================================================

function evaluateLSTAtPoint(
  fem,
  x,
  y
) {

  let result =
    evaluateLSTAtPointOneSide(
      fem,
      x,
      y
    );


  if (
    result
  ) {

    return result;
  }


  // opposite centreline side fallback

  result =
    evaluateLSTAtPointOneSide(

      fem,

      w / 2
      -
      1e-8
      *
      w,

      y
    );


  return result || {

    u: 0,

    v: 0,

    eps: 0,

    sigma: 0,

    eid: 0,

    r: 0,

    s: 0
  };
}


function evaluateLSTAtPointOneSide(
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


    // barycentric coordinates use the three corner nodes

    const L =
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
      !L
    ) {

      continue;
    }


    // L1 = 1-r-s
    // L2 = r
    // L3 = s

    const r =
      L[1];


    const s =
      L[2];


    const xy =
      nodes.map(
        n =>
          fem.coords[n]
      );


    const kin =
      lstKinematics(
        xy,
        r,
        s
      );


    const edof =
      elementDofsLST(
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

      eid:
        e,

      r,

      s
    };
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


  const L1 =

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


  const L2 =

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


  const L3 =
    1
    -
    L1
    -
    L2;


  const tolerance =
    1e-7;


  if (

    L1 >= -tolerance

    &&

    L2 >= -tolerance

    &&

    L3 >= -tolerance

    &&

    L1 <= 1 + tolerance

    &&

    L2 <= 1 + tolerance

    &&

    L3 <= 1 + tolerance

  ) {

    return [
      L1,
      L2,
      L3
    ];
  }


  return null;
}


// ============================================================
// FIELD VALUE INSIDE A PARTICULAR ELEMENT
// ============================================================

function elementFieldAt(
  fem,
  elementIndex,
  r,
  s,
  field
) {

  const nodes =
    fem.elements[
      elementIndex
    ];


  const xy =
    nodes.map(
      n =>
        fem.coords[n]
    );


  const kin =
    lstKinematics(
      xy,
      r,
      s
    );


  const edof =
    elementDofsLST(
      nodes
    );


  const de =
    edof.map(
      k =>
        fem.d[k]
    );


  const strain =
    matVec(
      kin.B,
      de
    );


  if (
    field === "eps"
  ) {

    return strain[1];
  }


  const stress =
    matVec(
      fem.D,
      strain
    );


  return stress[1];
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


  // ----------------------------------------------------------
  // title
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


  function toModel(
    x,
    y
  ) {

    return [

      map(
        x,
        0,
        w,
        plateX,
        plateX + plateW
      ),

      map(
        y,
        0,
        h,
        bottom,
        top
      )
    ];
  }


  // ----------------------------------------------------------
  // LST triangular mesh
  // ----------------------------------------------------------

  if (
    showFEM
  ) {

    stroke(
      150,
      150,
      150,
      85
    );


    strokeWeight(
      0.45
    );


    for (
      const element
      of femData.elements
    ) {

      const corners = [
        element[0],
        element[1],
        element[2]
      ];


      beginShape();


      for (
        const n
        of corners
      ) {

        const p =
          toModel(
            ...femData.coords[n]
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


    // all LST nodes, including midside nodes

    noStroke();

    fill(
      45,
      45,
      45,
      120
    );


    for (
      let n = 0;
      n < femData.coords.length;
      n++
    ) {

      const p =
        toModel(
          ...femData.coords[n]
        );


      circle(

        p[0],
        p[1],

        ny >= 8
          ? 1.2
          : 1.7
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
  // traction
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
// DEFORMED LST SHAPE
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


  // avoid p5 scale() naming conflict

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
  // undeformed
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

    drawLSTElementBoundary(
      element,
      screenPoint,
      false
    );
  }


  drawingContext.setLineDash(
    []
  );


  // ----------------------------------------------------------
  // deformed
  // ----------------------------------------------------------

  if (
    showFEM
  ) {

    noFill();

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

      drawLSTElementBoundary(
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


  // ----------------------------------------------------------
  // labels
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


  text(

    "LST • 3 GP",

    (left + right) / 2,

    graphBottom + 14
  );
}


// ============================================================
// CURVED LST ELEMENT BOUNDARY
// ============================================================

function drawLSTElementBoundary(
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
    elementDofsLST(
      nodes
    );


  const de =
    edof.map(
      k =>
        femData.d[k]
    );


  const nEdge =
    8;


  function mapped(
    r,
    s
  ) {

    const N =
      lstShapeFunctions(
        r,
        s
      ).N;


    let x = 0;

    let y = 0;


    for (
      let a = 0;
      a < 6;
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
        N[a]
        *
        xa;


      y +=
        N[a]
        *
        ya;
    }


    return screenPoint(
      x,
      y
    );
  }


  beginShape();


  // ----------------------------------------------------------
  // edge 1 -> 2
  //
  // s = 0
  // ----------------------------------------------------------

  for (
    let k = 0;
    k <= nEdge;
    k++
  ) {

    const t =
      k / nEdge;


    const p =
      mapped(
        t,
        0
      );


    vertex(
      p[0],
      p[1]
    );
  }


  // ----------------------------------------------------------
  // edge 2 -> 3
  //
  // r+s = 1
  // ----------------------------------------------------------

  for (
    let k = 1;
    k <= nEdge;
    k++
  ) {

    const t =
      k / nEdge;


    const p =
      mapped(
        1 - t,
        t
      );


    vertex(
      p[0],
      p[1]
    );
  }


  // ----------------------------------------------------------
  // edge 3 -> 1
  //
  // r = 0
  // ----------------------------------------------------------

  for (
    let k = 1;
    k < nEdge;
    k++
  ) {

    const t =
      k / nEdge;


    const p =
      mapped(
        0,
        1 - t
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
// DEFORMED INTEGRATION POINTS
// ============================================================

function drawDeformedGaussPoints(
  screenPoint
) {

  push();


  noStroke();


  fill(
    55,
    55,
    55,
    60
  );


  const rule =
    triangleIntegrationRule();


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
      elementDofsLST(
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

      const N =
        lstShapeFunctions(
          gp.r,
          gp.s
        ).N;


      let x = 0;

      let y = 0;


      for (
        let a = 0;
        a < 6;
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
          N[a]
          *
          xd;


        y +=
          N[a]
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
// LST STRAIN / STRESS CONTOURS
//
// IMPORTANT:
//
// displacement is quadratic.
//
// strain and stress vary LINEARLY inside each LST.
//
// Therefore the contour varies within each triangle,
// but no averaging is performed between neighbouring
// triangles.
// ============================================================

function drawLSTContourTile(
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
  // title
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
  // RANGE
  // ==========================================================

  const range =
    lstFieldRange(
      field
    );


  const minV =
    range.min;


  const maxV =
    range.max;


  // ----------------------------------------------------------
  // subdivisions used only to visually represent the
  // linearly varying field
  // ----------------------------------------------------------

  const nSub =
    4;


  noStroke();


  // ==========================================================
  // ELEMENT LOOP
  // ==========================================================

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


    // --------------------------------------------------------
    // draw one small triangular patch
    // --------------------------------------------------------

    function drawSmallTriangle(
      A,
      B,
      C
    ) {

      // evaluate linear strain/stress at patch centroid

      const rc =

        (
          A[0]
          +
          B[0]
          +
          C[0]
        )
        /
        3;


      const sc =

        (
          A[1]
          +
          B[1]
          +
          C[1]
        )
        /
        3;


      const value =
        elementFieldAt(

          femData,

          e,

          rc,

          sc,

          field
        );


      const p1 =
        toScreen(
          ...naturalPointLST(
            xy,
            A[0],
            A[1]
          )
        );


      const p2 =
        toScreen(
          ...naturalPointLST(
            xy,
            B[0],
            B[1]
          )
        );


      const p3 =
        toScreen(
          ...naturalPointLST(
            xy,
            C[0],
            C[1]
          )
        );


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


    // ========================================================
    // SUBDIVIDE REFERENCE TRIANGLE
    // ========================================================

    for (
      let i = 0;
      i < nSub;
      i++
    ) {

      for (
        let j = 0;
        j < nSub - i;
        j++
      ) {

        const A = [

          i / nSub,

          j / nSub
        ];


        const B = [

          (i + 1) / nSub,

          j / nSub
        ];


        const C = [

          i / nSub,

          (j + 1) / nSub
        ];


        drawSmallTriangle(
          A,
          B,
          C
        );


        // second triangle in subdivision cell

        if (
          i + j
          <=
          nSub - 2
        ) {

          const D = [

            (i + 1) / nSub,

            (j + 1) / nSub
          ];


          if (
            D[0] + D[1]
            <=
            1 + 1e-12
          ) {

            drawSmallTriangle(
              B,
              D,
              C
            );
          }
        }
      }
    }
  }


  // ==========================================================
  // ELEMENT OUTLINES
  // ==========================================================

  noFill();

  stroke(
    55,
    55,
    55,
    85
  );


  strokeWeight(
    0.4
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
  // ACTUAL THREE INTEGRATION POINTS
  // ==========================================================

  noStroke();

  fill(
    20,
    20,
    20,
    52
  );


  for (
    const elementGP
    of femData.gaussResults
  ) {

    for (
      const gp
      of elementGP
    ) {

      const p =
        toScreen(
          gp.x,
          gp.y
        );


      circle(
        p[0],
        p[1],
        1.4
      );
    }
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

      cbH / nBar
      +
      1
    );
  }


  // maximum

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


  // minimum

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


  // frame

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
// LST CONTOUR RANGE
//
// Since the field is linear inside an LST,
// its extrema occur at the three triangle corners.
// ============================================================

function lstFieldRange(
  field
) {

  let minV =
    Infinity;


  let maxV =
    -Infinity;


  const corners = [

    [
      0,
      0
    ],

    [
      1,
      0
    ],

    [
      0,
      1
    ]
  ];


  for (
    let e = 0;
    e < femData.elements.length;
    e++
  ) {

    for (
      const q
      of corners
    ) {

      const value =
        elementFieldAt(

          femData,

          e,

          q[0],

          q[1],

          field
        );


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
      0.05
      *
      ref;


    maxV +=
      0.05
      *
      ref;
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
  // blue -> white -> red if zero is in range
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
// VERTICAL SLIDER
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


  // main point

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


  // label

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
// HEIGHT GUIDE
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
  // title
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

    graphBottom
    -
    graphTop
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
  // selected-height markers
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
  // axis
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
// FEM PROFILE
//
// displacement:
// quadratic interpolation, globally continuous.
//
// strain/stress:
// linear inside each LST.
// Adjacent elements may have discontinuous values.
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
    1.15
  );


  noFill();


  drawingContext.setLineDash(
    [
      5,
      3
    ]
  );


  // ==========================================================
  // DISPLACEMENT
  // ==========================================================

  if (
    field === "v"
  ) {

    beginShape();


    for (
      let k = 0;
      k < data.ys.length;
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


    drawingContext.setLineDash(
      []
    );


    return;
  }


  // ==========================================================
  // STRAIN / STRESS
  //
  // draw each triangle separately
  // ==========================================================

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


  // ----------------------------------------------------------
  // exact
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // FEM
  // ----------------------------------------------------------

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
    Math.abs(span)
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


  // ----------------------------------------------------------
  // row 1
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // row 2
  // ----------------------------------------------------------

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


    // toggle

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


    // number button

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