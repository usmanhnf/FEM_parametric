const APP_W = 800;
const CANVAS_H = 455;

let matrixInputs = [];

let matrixA = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];

let eigenSystem = [];
let lambdaCells = [[], [], []];
let vectorCells = [[], [], []];
let inputMessage;

const eigenColors = [
  [146, 86, 220],
  [0, 157, 188],
  [238, 142, 24]
];

const cubeVertices = [
  [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5],
  [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
  [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5],
  [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
];

const cubeFaces = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7]
];

const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

function setup() {
  installStyles();

  const app = createDiv();
  app.class("eig-app");

  const controls = createDiv();
  controls.class("controls");
  controls.parent(app);

  buildMatrixEditor(controls);
  buildButtons(controls);

  inputMessage = createDiv("");
  inputMessage.class("input-message");
  inputMessage.parent(app);

  const results = createDiv();
  results.class("result-matrices");
  results.parent(app);

  vectorCells = buildResultMatrix(results, "V =", "vector");
  lambdaCells = buildResultMatrix(results, "Λ =", "lambda");

  const canvas = createCanvas(APP_W, CANVAS_H, WEBGL);
  canvas.parent(app);
  canvas.class("eigen-canvas");

  const legend = createDiv(
    '<span><i class="box original"></i>Original cube</span>' +
    '<span><i class="box transformed"></i>Transformed cube</span>' +
    '<span><i class="axis x"></i>X axis</span>' +
    '<span><i class="axis y"></i>Y axis</span>' +
    '<span><i class="axis z"></i>Z axis</span>' +
    '<span><i class="axis l1"></i>&lambda;<sub>1</sub>, v<sub>1</sub></span>' +
    '<span><i class="axis l2"></i>&lambda;<sub>2</sub>, v<sub>2</sub></span>' +
    '<span><i class="axis l3"></i>&lambda;<sub>3</sub>, v<sub>3</sub></span>'
  );

  legend.class("legend");
  legend.parent(app);

  perspective(
    PI / 3,
    APP_W / CANVAS_H,
    0.1,
    10000
  );

  camera(
    340, -285, 400,
    0, 0, 0,
    0, 1, 0
  );

  refreshModel();
}

function draw() {
  background(250, 249, 246);

  orbitControl(1, 1, 0.08);

  ambientLight(185);

  directionalLight(
    255, 255, 255,
    -0.35, 0.55, -1
  );

  const transformed = cubeVertices.map(vertexValue =>
    multiplyMatrixVector(matrixA, vertexValue)
  );

  const cubeExtent =
    transformedCubeExtent(transformed);

  /*
   * Automatic zoom:
   * larger transformations are scaled down,
   * smaller transformations are scaled up.
   */
  const sceneScale = Math.max(
    12,
    Math.min(
      420,
      190 / cubeExtent
    )
  );

  const axisLength = Math.max(
    1.2,
    cubeExtent * 1.28
  );

  push();

  scale(sceneScale);

  drawReferenceGrid(axisLength);
  drawCoordinateAxes(axisLength);

  drawCubeMesh(
    cubeVertices,
    [100, 108, 118, 20],
    [92, 100, 110],
    1
  );

  drawCubeMesh(
    transformed,
    [238, 76, 72, 72],
    [220, 45, 48],
    1.8
  );

  drawEigenDirections(axisLength);

  pop();
}

function buildMatrixEditor(parentElement) {
  const matrixBlock = createDiv();
  matrixBlock.class("matrix-block");
  matrixBlock.parent(parentElement);

  const label = createDiv("A =");
  label.class("matrix-label");
  label.parent(matrixBlock);

  const leftBracket = createDiv();
  leftBracket.class("bracket left-bracket");
  leftBracket.parent(matrixBlock);

  const grid = createDiv();
  grid.class("matrix-grid");
  grid.parent(matrixBlock);

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    matrixInputs[rowIndex] = [];

    for (
      let columnIndex = 0;
      columnIndex < 3;
      columnIndex++
    ) {
      const initialValue =
        rowIndex === columnIndex ? 1 : 0;

      const field = createInput(
        String(initialValue),
        "number"
      );

      field.attribute("min", "-10");
      field.attribute("max", "10");
      field.attribute("step", "1");

      field.attribute(
        "aria-label",
        `A row ${rowIndex + 1}, column ${columnIndex + 1}`
      );

      field.class("matrix-input");
      field.parent(grid);

      field.input(refreshModel);

      field.changed(() => {
        normalizeInput(field);
      });

      matrixInputs[rowIndex][columnIndex] = field;
    }
  }

  const rightBracket = createDiv();
  rightBracket.class("bracket right-bracket");
  rightBracket.parent(matrixBlock);
}

function buildButtons(parentElement) {
  const buttons = createDiv();
  buttons.class("buttons");
  buttons.parent(parentElement);

  const resetButton = createButton("Reset");
  resetButton.parent(buttons);

  resetButton.mousePressed(() => {
    setMatrix([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]);
  });

  const randomButton = createButton("Random");
  randomButton.parent(buttons);

  randomButton.mousePressed(() => {
    const values = [];

    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      values[rowIndex] = [];

      for (
        let columnIndex = 0;
        columnIndex < 3;
        columnIndex++
      ) {
        values[rowIndex][columnIndex] =
          floor(random(-3, 4));
      }
    }

    setMatrix(values);
  });
}

function buildResultMatrix(
  parentElement,
  labelText,
  matrixType
) {
  const group = createDiv();
  group.class("result-matrix-group");
  group.parent(parentElement);

  const label = createDiv(labelText);
  label.class("result-matrix-label");
  label.parent(group);

  const leftBracket = createDiv();
  leftBracket.class(
    "result-bracket result-left-bracket"
  );
  leftBracket.parent(group);

  const grid = createDiv();
  grid.class("result-grid");
  grid.parent(group);

  const cells = [[], [], []];

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex < 3;
      columnIndex++
    ) {
      const cell = createDiv("0");
      cell.class("result-cell");

      if (
        matrixType === "vector" ||
        rowIndex === columnIndex
      ) {
        const colorIndex =
          matrixType === "vector"
            ? columnIndex + 1
            : rowIndex + 1;

        cell.addClass(
          "eigen-color-" + colorIndex
        );
      } else {
        cell.addClass("matrix-zero");
      }

      cell.parent(grid);
      cells[rowIndex][columnIndex] = cell;
    }
  }

  const rightBracket = createDiv();
  rightBracket.class(
    "result-bracket result-right-bracket"
  );
  rightBracket.parent(group);

  return cells;
}

function normalizeInput(field) {
  const raw = String(field.value()).trim();

  if (raw === "") {
    return;
  }

  const numericValue = Number(raw);

  if (!Number.isFinite(numericValue)) {
    return;
  }

  field.value(
    clampNumber(
      Math.round(numericValue),
      -10,
      10
    )
  );

  refreshModel();
}

function setMatrix(values) {
  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex < 3;
      columnIndex++
    ) {
      matrixInputs[rowIndex][columnIndex].value(
        values[rowIndex][columnIndex]
      );
    }
  }

  refreshModel();
}

function readMatrixInputs() {
  const candidate = [[], [], []];

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex < 3;
      columnIndex++
    ) {
      const raw = String(
        matrixInputs[rowIndex][columnIndex].value()
      ).trim();

      if (raw === "") {
        return null;
      }

      const numericValue = Number(raw);

      if (!Number.isFinite(numericValue)) {
        return null;
      }

      candidate[rowIndex][columnIndex] =
        clampNumber(
          numericValue,
          -10,
          10
        );
    }
  }

  return candidate;
}

function refreshModel() {
  const candidate = readMatrixInputs();

  if (candidate === null) {
    if (inputMessage) {
      inputMessage.html(
        "Finish entering all nine matrix values."
      );
    }

    return;
  }

  matrixA = candidate;
  eigenSystem = eigensystem3x3(matrixA);

  if (inputMessage) {
    inputMessage.html("");
  }

  updateEigenMatrices();
}

function updateEigenMatrices() {
  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex < 3;
      columnIndex++
    ) {
      const item = eigenSystem[columnIndex];

      vectorCells[rowIndex][columnIndex].html(
        item
          ? formatComplex(item.vector[rowIndex])
          : "—"
      );

      lambdaCells[rowIndex][columnIndex].html(
        rowIndex === columnIndex &&
        eigenSystem[rowIndex]
          ? formatComplex(
              eigenSystem[rowIndex].value
            )
          : "0"
      );
    }
  }
}

function drawReferenceGrid(axisLength) {
  const span = Math.max(
    1.5,
    axisLength
  );

  const gridSpacing =
    span > 8
      ? 2
      : span > 4
        ? 1
        : 0.5;

  const floorPosition = -0.62;

  stroke(170, 175, 180, 75);
  strokeWeight(0.55);
  noFill();

  for (
    let gridPosition = -span;
    gridPosition <= span + 0.000001;
    gridPosition += gridSpacing
  ) {
    drawMathLine(
      [-span, gridPosition, floorPosition],
      [span, gridPosition, floorPosition]
    );

    drawMathLine(
      [gridPosition, -span, floorPosition],
      [gridPosition, span, floorPosition]
    );
  }
}

function drawCoordinateAxes(axisLength) {
  drawArrowMath(
    [axisLength, 0, 0],
    [215, 45, 48],
    1.3
  );

  drawArrowMath(
    [0, axisLength, 0],
    [40, 155, 75],
    1.3
  );

  drawArrowMath(
    [0, 0, axisLength],
    [40, 105, 220],
    1.3
  );
}

function drawEigenDirections(axisLength) {
  for (
    let eigenIndex = 0;
    eigenIndex < eigenSystem.length;
    eigenIndex++
  ) {
    const item = eigenSystem[eigenIndex];

    /*
     * Complex eigenvectors do not define one real
     * line in three-dimensional real space.
     */
    if (
      !item ||
      Math.abs(item.value.im) > 0.0000001
    ) {
      continue;
    }

    const realVector =
      item.vector.map(component => component.re);

    const imaginarySize = Math.max(
      ...item.vector.map(component =>
        Math.abs(component.im)
      )
    );

    if (
      imaginarySize > 0.000001 ||
      !allFinite(realVector)
    ) {
      continue;
    }

    const direction =
      normalizeRealVector(realVector);

    if (!direction) {
      continue;
    }

    const eigenColor =
      eigenColors[eigenIndex];

    stroke(
      eigenColor[0],
      eigenColor[1],
      eigenColor[2],
      115
    );

    strokeWeight(0.8);

    drawMathLine(
      scaleVector(direction, -axisLength),
      scaleVector(direction, axisLength)
    );

    /*
     * Clip long eigenvalue arrows to the current
     * fitted view. The Lambda matrix still displays
     * the complete eigenvalue.
     */
    const displayedMagnitude = Math.min(
      Math.abs(item.value.re),
      axisLength * 0.9
    );

    const signedMagnitude =
      item.value.re < 0
        ? -displayedMagnitude
        : displayedMagnitude;

    const transformedVector =
      scaleVector(
        direction,
        signedMagnitude
      );

    if (
      vectorLength(transformedVector) <
      0.0000001
    ) {
      push();

      noStroke();

      fill(
        eigenColor[0],
        eigenColor[1],
        eigenColor[2]
      );

      sphere(0.045, 8, 6);

      pop();
    } else {
      drawArrowMath(
        transformedVector,
        eigenColor,
        2.4
      );
    }
  }
}

function drawCubeMesh(
  vertices,
  faceColor,
  edgeColor,
  edgeWeight
) {
  if (!vertices.every(allFinite)) {
    return;
  }

  noStroke();

  fill(
    faceColor[0],
    faceColor[1],
    faceColor[2],
    faceColor[3]
  );

  beginShape(QUADS);

  for (const face of cubeFaces) {
    for (const vertexIndex of face) {
      const pointValue =
        mathToP5(vertices[vertexIndex]);

      vertex(
        pointValue[0],
        pointValue[1],
        pointValue[2]
      );
    }
  }

  endShape();

  noFill();

  stroke(
    edgeColor[0],
    edgeColor[1],
    edgeColor[2],
    220
  );

  strokeWeight(edgeWeight);

  for (const edge of cubeEdges) {
    drawMathLine(
      vertices[edge[0]],
      vertices[edge[1]]
    );
  }
}

function drawMathLine(pointA, pointB) {
  if (
    !allFinite(pointA) ||
    !allFinite(pointB)
  ) {
    return;
  }

  const convertedA = mathToP5(pointA);
  const convertedB = mathToP5(pointB);

  line(
    convertedA[0],
    convertedA[1],
    convertedA[2],
    convertedB[0],
    convertedB[1],
    convertedB[2]
  );
}

function drawArrowMath(
  vectorValue,
  arrowColor,
  lineWeight
) {
  if (!allFinite(vectorValue)) {
    return;
  }

  const endPoint =
    mathToP5(vectorValue);

  const magnitude =
    vectorLength(endPoint);

  if (
    !Number.isFinite(magnitude) ||
    magnitude < 0.00000001
  ) {
    return;
  }

  stroke(
    arrowColor[0],
    arrowColor[1],
    arrowColor[2]
  );

  strokeWeight(lineWeight);

  line(
    0, 0, 0,
    endPoint[0],
    endPoint[1],
    endPoint[2]
  );

  const direction = scaleVector(
    endPoint,
    1 / magnitude
  );

  const helperVector =
    Math.abs(direction[1]) < 0.9
      ? [0, 1, 0]
      : [1, 0, 0];

  const sideDirection =
    normalizeRealVector(
      cross3(
        direction,
        helperVector
      )
    );

  const upperDirection =
    sideDirection
      ? normalizeRealVector(
          cross3(
            direction,
            sideDirection
          )
        )
      : null;

  if (
    !sideDirection ||
    !upperDirection
  ) {
    return;
  }

  const arrowHeadLength = Math.min(
    0.22,
    Math.max(
      0.09,
      magnitude * 0.14
    )
  );

  const arrowHeadWidth =
    arrowHeadLength * 0.48;

  const arrowBase =
    subtractVectors(
      endPoint,
      scaleVector(
        direction,
        arrowHeadLength
      )
    );

  const sidePoint1 =
    addVectors(
      arrowBase,
      scaleVector(
        sideDirection,
        arrowHeadWidth
      )
    );

  const sidePoint2 =
    subtractVectors(
      arrowBase,
      scaleVector(
        sideDirection,
        arrowHeadWidth
      )
    );

  const upperPoint1 =
    addVectors(
      arrowBase,
      scaleVector(
        upperDirection,
        arrowHeadWidth
      )
    );

  const upperPoint2 =
    subtractVectors(
      arrowBase,
      scaleVector(
        upperDirection,
        arrowHeadWidth
      )
    );

  line(
    endPoint[0],
    endPoint[1],
    endPoint[2],
    sidePoint1[0],
    sidePoint1[1],
    sidePoint1[2]
  );

  line(
    endPoint[0],
    endPoint[1],
    endPoint[2],
    sidePoint2[0],
    sidePoint2[1],
    sidePoint2[2]
  );

  line(
    endPoint[0],
    endPoint[1],
    endPoint[2],
    upperPoint1[0],
    upperPoint1[1],
    upperPoint1[2]
  );

  line(
    endPoint[0],
    endPoint[1],
    endPoint[2],
    upperPoint2[0],
    upperPoint2[1],
    upperPoint2[2]
  );
}

function transformedCubeExtent(transformed) {
  let extent = 0.5;

  for (const vectorValue of transformed) {
    if (!allFinite(vectorValue)) {
      continue;
    }

    extent = Math.max(
      extent,
      Math.abs(vectorValue[0]),
      Math.abs(vectorValue[1]),
      Math.abs(vectorValue[2])
    );
  }

  return extent;
}

function mathToP5(vectorValue) {
  /*
   * Mathematical x, y, z become:
   * p5 x, depth, vertical.
   */
  return [
    vectorValue[0],
    -vectorValue[2],
    vectorValue[1]
  ];
}

function multiplyMatrixVector(
  matrixValue,
  vectorValue
) {
  return [
    matrixValue[0][0] * vectorValue[0] +
      matrixValue[0][1] * vectorValue[1] +
      matrixValue[0][2] * vectorValue[2],

    matrixValue[1][0] * vectorValue[0] +
      matrixValue[1][1] * vectorValue[1] +
      matrixValue[1][2] * vectorValue[2],

    matrixValue[2][0] * vectorValue[0] +
      matrixValue[2][1] * vectorValue[1] +
      matrixValue[2][2] * vectorValue[2]
  ];
}

// Eigenvalue and eigenvector calculations

function eigensystem3x3(matrixValue) {
  const eigenvalues =
    eigenvalues3x3(matrixValue);

  const groups = [];
  const output = [];

  for (const eigenvalue of eigenvalues) {
    let group = groups.find(existingGroup =>
      complexClose(
        existingGroup.value,
        eigenvalue,
        0.000001
      )
    );

    if (!group) {
      group = {
        value: eigenvalue,
        basis: complexNullSpace(
          matrixValue,
          eigenvalue
        ),
        used: 0
      };

      groups.push(group);
    }

    if (group.basis.length === 0) {
      group.basis = [[
        complex(1, 0),
        complex(0, 0),
        complex(0, 0)
      ]];
    }

    const basisIndex = Math.min(
      group.used,
      group.basis.length - 1
    );

    output.push({
      value: eigenvalue,
      vector: group.basis[basisIndex],
      isIndependent:
        group.used < group.basis.length
    });

    group.used++;
  }

  return output;
}

function eigenvalues3x3(matrixValue) {
  const matrixTrace =
    matrixValue[0][0] +
    matrixValue[1][1] +
    matrixValue[2][2];

  const secondCoefficient =
    matrixValue[0][0] * matrixValue[1][1] +
    matrixValue[0][0] * matrixValue[2][2] +
    matrixValue[1][1] * matrixValue[2][2] -
    matrixValue[0][1] * matrixValue[1][0] -
    matrixValue[0][2] * matrixValue[2][0] -
    matrixValue[1][2] * matrixValue[2][1];

  const matrixDeterminant =
    determinant3(matrixValue);

  /*
   * Characteristic polynomial:
   * x^3 + a*x^2 + b*x + c = 0
   */
  const coefficientA = -matrixTrace;
  const coefficientB = secondCoefficient;
  const coefficientC = -matrixDeterminant;

  const depressedP =
    coefficientB -
    coefficientA * coefficientA / 3;

  const depressedQ =
    2 *
      coefficientA *
      coefficientA *
      coefficientA / 27 -
    coefficientA *
      coefficientB / 3 +
    coefficientC;

  let discriminant =
    depressedQ * depressedQ / 4 +
    depressedP *
      depressedP *
      depressedP / 27;

  const tolerance =
    0.00000000001 *
    Math.max(
      1,
      Math.abs(
        depressedQ *
        depressedQ / 4
      ),
      Math.abs(
        depressedP *
        depressedP *
        depressedP / 27
      )
    );

  if (
    Math.abs(discriminant) <= tolerance
  ) {
    discriminant = 0;
  }

  let roots;

  /*
   * Explicit triple-root branch.
   * This prevents NaN for the identity matrix.
   */
  if (
    Math.abs(depressedP) <= tolerance &&
    Math.abs(depressedQ) <= tolerance
  ) {
    const repeatedRoot =
      -coefficientA / 3;

    roots = [
      complex(repeatedRoot, 0),
      complex(repeatedRoot, 0),
      complex(repeatedRoot, 0)
    ];
  } else if (discriminant > 0) {
    const squareRootDiscriminant =
      Math.sqrt(discriminant);

    const cubeRootU = Math.cbrt(
      -depressedQ / 2 +
      squareRootDiscriminant
    );

    const cubeRootV = Math.cbrt(
      -depressedQ / 2 -
      squareRootDiscriminant
    );

    const realRoot =
      cubeRootU +
      cubeRootV -
      coefficientA / 3;

    const complexRealPart =
      -(cubeRootU + cubeRootV) / 2 -
      coefficientA / 3;

    const complexImaginaryPart =
      Math.sqrt(3) / 2 *
      (cubeRootU - cubeRootV);

    roots = [
      complex(realRoot, 0),

      complex(
        complexRealPart,
        complexImaginaryPart
      ),

      complex(
        complexRealPart,
        -complexImaginaryPart
      )
    ];
  } else {
    const rootRadius =
      2 *
      Math.sqrt(
        Math.max(
          0,
          -depressedP / 3
        )
      );

    const denominator =
      2 *
      Math.sqrt(
        Math.max(
          0,
          -(
            depressedP *
            depressedP *
            depressedP
          ) / 27
        )
      );

    const cosineArgument =
      denominator <
      0.000000000000001
        ? 1
        : clampNumber(
            -depressedQ / denominator,
            -1,
            1
          );

    const angle =
      Math.acos(cosineArgument);

    roots = [0, 1, 2].map(rootIndex =>
      complex(
        rootRadius *
          Math.cos(
            (
              angle +
              Math.PI *
              2 *
              rootIndex
            ) / 3
          ) -
          coefficientA / 3,
        0
      )
    );
  }

  roots.forEach(cleanComplex);

  roots.sort((firstRoot, secondRoot) => {
    if (
      Math.abs(
        firstRoot.im -
        secondRoot.im
      ) > 0.000000001
    ) {
      return (
        secondRoot.im -
        firstRoot.im
      );
    }

    return (
      secondRoot.re -
      firstRoot.re
    );
  });

  return roots;
}

function complexNullSpace(
  matrixValue,
  eigenvalue
) {
  const shiftedMatrix =
    matrixValue.map((row, rowIndex) =>
      row.map((cellValue, columnIndex) =>
        complex(
          cellValue -
            (
              rowIndex === columnIndex
                ? eigenvalue.re
                : 0
            ),

          rowIndex === columnIndex
            ? -eigenvalue.im
            : 0
        )
      )
    );

  const numericScale = Math.max(
    1,
    ...shiftedMatrix
      .flat()
      .map(complexAbs)
  );

  const tolerances = [
    0.00000001,
    0.000001,
    0.0001
  ];

  for (const toleranceFactor of tolerances) {
    const basis = rrefNullSpace(
      shiftedMatrix,
      toleranceFactor * numericScale
    );

    if (basis.length > 0) {
      return basis.map(
        normalizeComplexVector
      );
    }
  }

  return [];
}

function rrefNullSpace(
  sourceMatrix,
  tolerance
) {
  const rows =
    sourceMatrix.map(row =>
      row.map(copyComplex)
    );

  const pivotColumns = [];
  let pivotRowIndex = 0;

  for (
    let columnIndex = 0;
    columnIndex < 3 &&
    pivotRowIndex < 3;
    columnIndex++
  ) {
    let bestRowIndex = pivotRowIndex;

    let bestSize = complexAbs(
      rows[bestRowIndex][columnIndex]
    );

    for (
      let rowIndex = pivotRowIndex + 1;
      rowIndex < 3;
      rowIndex++
    ) {
      const candidateSize =
        complexAbs(
          rows[rowIndex][columnIndex]
        );

      if (candidateSize > bestSize) {
        bestSize = candidateSize;
        bestRowIndex = rowIndex;
      }
    }

    if (bestSize <= tolerance) {
      continue;
    }

    [
      rows[pivotRowIndex],
      rows[bestRowIndex]
    ] = [
      rows[bestRowIndex],
      rows[pivotRowIndex]
    ];

    const pivotValue = copyComplex(
      rows[pivotRowIndex][columnIndex]
    );

    for (
      let cellIndex = 0;
      cellIndex < 3;
      cellIndex++
    ) {
      rows[pivotRowIndex][cellIndex] =
        complexDivide(
          rows[pivotRowIndex][cellIndex],
          pivotValue
        );
    }

    for (
      let rowIndex = 0;
      rowIndex < 3;
      rowIndex++
    ) {
      if (rowIndex === pivotRowIndex) {
        continue;
      }

      const eliminationFactor =
        copyComplex(
          rows[rowIndex][columnIndex]
        );

      if (
        complexAbs(eliminationFactor) <=
        tolerance
      ) {
        continue;
      }

      for (
        let cellIndex = 0;
        cellIndex < 3;
        cellIndex++
      ) {
        rows[rowIndex][cellIndex] =
          complexSubtract(
            rows[rowIndex][cellIndex],

            complexMultiply(
              eliminationFactor,
              rows[pivotRowIndex][cellIndex]
            )
          );
      }
    }

    pivotColumns.push(columnIndex);
    pivotRowIndex++;
  }

  const freeColumns = [0, 1, 2].filter(
    columnIndex =>
      !pivotColumns.includes(columnIndex)
  );

  const basis = [];

  for (const freeColumn of freeColumns) {
    const vectorValue = [
      complex(0, 0),
      complex(0, 0),
      complex(0, 0)
    ];

    vectorValue[freeColumn] =
      complex(1, 0);

    for (
      let rowIndex =
        pivotColumns.length - 1;
      rowIndex >= 0;
      rowIndex--
    ) {
      const pivotColumn =
        pivotColumns[rowIndex];

      let sum = complex(0, 0);

      for (
        let columnIndex =
          pivotColumn + 1;
        columnIndex < 3;
        columnIndex++
      ) {
        sum = complexAdd(
          sum,

          complexMultiply(
            rows[rowIndex][columnIndex],
            vectorValue[columnIndex]
          )
        );
      }

      vectorValue[pivotColumn] =
        complex(
          -sum.re,
          -sum.im
        );
    }

    basis.push(vectorValue);
  }

  return basis;
}

function normalizeComplexVector(vectorValue) {
  let squaredLength = 0;

  for (const component of vectorValue) {
    squaredLength +=
      component.re * component.re +
      component.im * component.im;
  }

  const vectorMagnitude =
    Math.sqrt(squaredLength);

  if (
    !Number.isFinite(vectorMagnitude) ||
    vectorMagnitude <
      0.00000000000001
  ) {
    return [
      complex(1, 0),
      complex(0, 0),
      complex(0, 0)
    ];
  }

  let normalizedVector =
    vectorValue.map(component =>
      complex(
        component.re / vectorMagnitude,
        component.im / vectorMagnitude
      )
    );

  let largestIndex = 0;

  for (
    let componentIndex = 1;
    componentIndex < 3;
    componentIndex++
  ) {
    if (
      complexAbs(
        normalizedVector[componentIndex]
      ) >
      complexAbs(
        normalizedVector[largestIndex]
      )
    ) {
      largestIndex = componentIndex;
    }
  }

  const anchorSize = complexAbs(
    normalizedVector[largestIndex]
  );

  if (
    anchorSize >
    0.00000000000001
  ) {
    const phaseAdjustment = complex(
      normalizedVector[largestIndex].re /
        anchorSize,

      -normalizedVector[largestIndex].im /
        anchorSize
    );

    normalizedVector =
      normalizedVector.map(component =>
        complexMultiply(
          component,
          phaseAdjustment
        )
      );
  }

  normalizedVector.forEach(cleanComplex);

  return normalizedVector;
}

function determinant3(matrixValue) {
  return (
    matrixValue[0][0] *
      (
        matrixValue[1][1] *
          matrixValue[2][2] -
        matrixValue[1][2] *
          matrixValue[2][1]
      ) -

    matrixValue[0][1] *
      (
        matrixValue[1][0] *
          matrixValue[2][2] -
        matrixValue[1][2] *
          matrixValue[2][0]
      ) +

    matrixValue[0][2] *
      (
        matrixValue[1][0] *
          matrixValue[2][1] -
        matrixValue[1][1] *
          matrixValue[2][0]
      )
  );
}

// Complex-number helpers

function complex(realPart, imaginaryPart) {
  return {
    re: realPart,
    im: imaginaryPart
  };
}

function copyComplex(complexValue) {
  return complex(
    complexValue.re,
    complexValue.im
  );
}

function complexAdd(firstValue, secondValue) {
  return complex(
    firstValue.re + secondValue.re,
    firstValue.im + secondValue.im
  );
}

function complexSubtract(
  firstValue,
  secondValue
) {
  return complex(
    firstValue.re - secondValue.re,
    firstValue.im - secondValue.im
  );
}

function complexMultiply(
  firstValue,
  secondValue
) {
  return complex(
    firstValue.re * secondValue.re -
      firstValue.im * secondValue.im,

    firstValue.re * secondValue.im +
      firstValue.im * secondValue.re
  );
}

function complexDivide(
  firstValue,
  secondValue
) {
  const denominator =
    secondValue.re * secondValue.re +
    secondValue.im * secondValue.im;

  if (
    denominator <
    0.000000000000000000000000000001
  ) {
    return complex(0, 0);
  }

  return complex(
    (
      firstValue.re * secondValue.re +
      firstValue.im * secondValue.im
    ) / denominator,

    (
      firstValue.im * secondValue.re -
      firstValue.re * secondValue.im
    ) / denominator
  );
}

function complexAbs(complexValue) {
  return Math.hypot(
    complexValue.re,
    complexValue.im
  );
}

function complexClose(
  firstValue,
  secondValue,
  tolerance
) {
  const numericScale = Math.max(
    1,
    complexAbs(firstValue),
    complexAbs(secondValue)
  );

  return (
    complexAbs(
      complexSubtract(
        firstValue,
        secondValue
      )
    ) <= tolerance * numericScale
  );
}

function cleanComplex(complexValue) {
  if (
    Math.abs(complexValue.re) <
    0.0000000001
  ) {
    complexValue.re = 0;
  }

  if (
    Math.abs(complexValue.im) <
    0.0000000001
  ) {
    complexValue.im = 0;
  }

  return complexValue;
}

function formatComplex(complexValue) {
  const realPart =
    cleanDisplayNumber(complexValue.re);

  const imaginaryPart =
    cleanDisplayNumber(complexValue.im);

  if (
    Math.abs(imaginaryPart) <
    0.0005
  ) {
    return formatReal(realPart);
  }

  if (
    Math.abs(realPart) <
    0.0005
  ) {
    return (
      formatReal(imaginaryPart) +
      "i"
    );
  }

  return (
    formatReal(realPart) +
    " " +
    (imaginaryPart >= 0 ? "+" : "−") +
    " " +
    formatReal(
      Math.abs(imaginaryPart)
    ) +
    "i"
  );
}

function cleanDisplayNumber(numericValue) {
  return (
    Math.abs(numericValue) < 0.0005
      ? 0
      : numericValue
  );
}

function formatReal(numericValue) {
  const rounded =
    Math.round(numericValue * 1000) /
    1000;

  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(3);
}

// Numerical and vector helpers

function clampNumber(
  numericValue,
  lowerLimit,
  upperLimit
) {
  return Math.max(
    lowerLimit,
    Math.min(
      upperLimit,
      numericValue
    )
  );
}

function allFinite(values) {
  return (
    Array.isArray(values) &&
    values.every(Number.isFinite)
  );
}

function vectorLength(vectorValue) {
  return Math.hypot(
    vectorValue[0],
    vectorValue[1],
    vectorValue[2]
  );
}

function normalizeRealVector(vectorValue) {
  const vectorMagnitude =
    vectorLength(vectorValue);

  if (
    !Number.isFinite(vectorMagnitude) ||
    vectorMagnitude <
      0.000000000001
  ) {
    return null;
  }

  return scaleVector(
    vectorValue,
    1 / vectorMagnitude
  );
}

function scaleVector(
  vectorValue,
  scalarValue
) {
  return [
    vectorValue[0] * scalarValue,
    vectorValue[1] * scalarValue,
    vectorValue[2] * scalarValue
  ];
}

function addVectors(
  firstVector,
  secondVector
) {
  return [
    firstVector[0] + secondVector[0],
    firstVector[1] + secondVector[1],
    firstVector[2] + secondVector[2]
  ];
}

function subtractVectors(
  firstVector,
  secondVector
) {
  return [
    firstVector[0] - secondVector[0],
    firstVector[1] - secondVector[1],
    firstVector[2] - secondVector[2]
  ];
}

function cross3(
  firstVector,
  secondVector
) {
  return [
    firstVector[1] * secondVector[2] -
      firstVector[2] * secondVector[1],

    firstVector[2] * secondVector[0] -
      firstVector[0] * secondVector[2],

    firstVector[0] * secondVector[1] -
      firstVector[1] * secondVector[0]
  ];
}

// Styling

function installStyles() {
  createElement("style", `
    .eig-app {
      width: 800px;
      max-width: 800px;
      box-sizing: border-box;
      color: #23272b;
      font-family: Arial, Helvetica, sans-serif;
    }

    .eig-app * {
      box-sizing: border-box;
    }

    .controls {
      width: 800px;
      min-height: 128px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 42px;
      padding: 10px 14px;
      background: #f4f2ec;
      border: 1px solid #d9d5ca;
    }

    .matrix-block {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .matrix-label {
      margin-right: 3px;
      font-family: Georgia, serif;
      font-size: 28px;
      font-style: italic;
    }

    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(3, 54px);
      gap: 7px;
      padding: 4px 0;
    }

    .matrix-input {
      width: 54px;
      height: 29px;
      padding: 3px 4px;
      border: 1px solid #aaa69d;
      border-radius: 3px;
      background: white;
      color: #202428;
      font: 15px/1 monospace;
      text-align: center;
    }

    .matrix-input:focus {
      border-color: #3d78bd;
      outline: 2px solid rgba(61, 120, 189, 0.17);
    }

    .bracket {
      width: 10px;
      height: 112px;
      border-top: 2px solid #222;
      border-bottom: 2px solid #222;
    }

    .left-bracket {
      border-left: 2px solid #222;
    }

    .right-bracket {
      border-right: 2px solid #222;
    }

    .buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .buttons button {
      width: 92px;
      height: 34px;
      border: 1px solid #aaa69d;
      border-radius: 4px;
      background: white;
      color: #25282b;
      font-size: 14px;
      cursor: pointer;
    }

    .buttons button:hover {
      background: #e9eef5;
    }

    .input-message {
      width: 800px;
      min-height: 18px;
      padding: 2px 10px;
      color: #b34236;
      background: #faf9f6;
      font-size: 12px;
    }

    .result-matrices {
      width: 800px;
      min-height: 126px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 38px;
      padding: 12px 10px;
      background: #faf9f6;
      border: 1px solid #ddd9cf;
      border-bottom: 0;
    }

    .result-matrix-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .result-matrix-label {
      min-width: 38px;
      font-family: Georgia, serif;
      font-size: 25px;
      font-style: italic;
      text-align: right;
    }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(3, 76px);
      gap: 4px 5px;
      padding: 3px 0;
    }

    .result-cell {
      min-height: 23px;
      display: flex;
      align-items: center;
      justify-content: center;
      font: 12px/1.2 Consolas, monospace;
      white-space: nowrap;
    }

    .result-bracket {
      width: 9px;
      height: 91px;
      border-top: 2px solid #222;
      border-bottom: 2px solid #222;
    }

    .result-left-bracket {
      border-left: 2px solid #222;
    }

    .result-right-bracket {
      border-right: 2px solid #222;
    }

    .eigen-color-1 {
      color: rgb(124, 62, 205);
      font-weight: bold;
    }

    .eigen-color-2 {
      color: rgb(0, 135, 165);
      font-weight: bold;
    }

    .eigen-color-3 {
      color: rgb(213, 112, 0);
      font-weight: bold;
    }

    .matrix-zero {
      color: #8a8a8a;
    }

    .eigen-canvas {
      display: block;
      width: 800px !important;
      height: 455px !important;
      border: 1px solid #d7d4cc;
    }

    .legend {
      width: 800px;
      display: flex;
      flex-wrap: wrap;
      gap: 7px 17px;
      align-items: center;
      padding: 8px 10px;
      border: 1px solid #d7d4cc;
      border-top: 0;
      background: #f4f2ec;
      font-size: 12px;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .legend i {
      display: inline-block;
      flex: 0 0 auto;
    }

    .legend .box {
      width: 12px;
      height: 9px;
      border: 1px solid;
    }

    .legend .original {
      border-color: #646c76;
      background: rgba(100, 108, 118, 0.16);
    }

    .legend .transformed {
      border-color: #dc2d30;
      background: rgba(238, 76, 72, 0.4);
    }

    .legend .axis {
      width: 17px;
      height: 0;
      border-top: 3px solid;
    }

    .legend .x {
      border-color: rgb(215, 45, 48);
    }

    .legend .y {
      border-color: rgb(40, 155, 75);
    }

    .legend .z {
      border-color: rgb(40, 105, 220);
    }

    .legend .l1 {
      border-color: rgb(146, 86, 220);
    }

    .legend .l2 {
      border-color: rgb(0, 157, 188);
    }

    .legend .l3 {
      border-color: rgb(238, 142, 24);
    }
  `);
}