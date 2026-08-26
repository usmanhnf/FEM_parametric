// Tapered axial-bar FEM explorer — p5.js global mode

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

const lighthouseHeight = 41; // m
const wallThickness = 0.06; // m
const bottomDiameter = 6; // m
const topDiameter = 3.7; // m
const elasticModulus = 2e9; // Pa
const axialLoad = -50e3; // N

const bottomArea =
  Math.PI * wallThickness * (bottomDiameter - wallThickness);

const topArea =
  Math.PI * wallThickness * (topDiameter - wallThickness);

const areaSlope =
  (topArea - bottomArea) / lighthouseHeight;

let elementSlider;
let elementValue;
let exactToggle;

function setup() {
  const controls = createDiv();

  controls.style("width", `${CANVAS_WIDTH}px`);
  controls.style("box-sizing", "border-box");
  controls.style("display", "flex");
  controls.style("align-items", "center");
  controls.style("gap", "14px");
  controls.style("padding", "12px 16px");
  controls.style("margin-bottom", "10px");
  controls.style("border", "1px solid #d6d0c4");
  controls.style("background", "#fffef9");
  controls.style("font", "12px Arial, sans-serif");

  const sliderLabel =
    createSpan("Number of elements");

  sliderLabel.parent(controls);
  sliderLabel.style("font-weight", "700");

  elementSlider =
    createSlider(1, 50, 10, 1);

  elementSlider.parent(controls);
  elementSlider.style("width", "470px");
  elementSlider.attribute(
    "aria-label",
    "Number of finite elements"
  );

  elementValue = createSpan("10");
  elementValue.parent(controls);
  elementValue.style("min-width", "24px");
  elementValue.style("color", "#235789");
  elementValue.style("font-weight", "700");

  exactToggle =
    createCheckbox("Exact solution", true);

  exactToggle.parent(controls);
  exactToggle.style("margin-left", "auto");

  const canvas =
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  canvas.style("display", "block");

  pixelDensity(1);
  noLoop();

  elementSlider.input(() => {
    elementValue.html(elementSlider.value());
    redraw();
  });

  exactToggle.changed(() => {
    redraw();
  });
}

function draw() {
  const numberOfElements =
    Number(elementSlider.value());

  const showExact =
    exactToggle.checked();

  drawExplorer(
    numberOfElements,
    showExact
  );
}

// ---------------------------------------------------------
// Exact solution
// ---------------------------------------------------------

function areaAt(x) {
  return bottomArea + areaSlope * x;
}

function exactDisplacement(x) {
  return (
    axialLoad /
    (elasticModulus * areaSlope)
  ) * Math.log(
    areaAt(x) / bottomArea
  );
}

function exactStress(x) {
  return axialLoad / areaAt(x);
}

// ---------------------------------------------------------
// Finite element solution
// ---------------------------------------------------------

function femSolution(numberOfElements) {
  const elementLength =
    lighthouseHeight / numberOfElements;

  const coordinates =
    Array.from(
      { length: numberOfElements + 1 },
      (_, index) => index * elementLength
    );

  const displacements = [0];
  const stresses = [];
  const equivalentAreas = [];

  for (
    let element = 0;
    element < numberOfElements;
    element += 1
  ) {
    const x1 = coordinates[element];
    const x2 = coordinates[element + 1];

    const integratedArea =
      bottomArea * elementLength +
      0.5 *
        areaSlope *
        (x2 * x2 - x1 * x1);

    const averageArea =
      integratedArea / elementLength;

    equivalentAreas.push(averageArea);

    stresses.push(
      axialLoad / averageArea
    );

    const displacementIncrement =
      (axialLoad * elementLength) /
      (elasticModulus * averageArea);

    displacements.push(
      displacements[element] +
        displacementIncrement
    );
  }

  return {
    coordinates,
    displacements,
    stresses,
    equivalentAreas
  };
}

// ---------------------------------------------------------
// Drawing utilities
// ---------------------------------------------------------

function mapValue(
  value,
  inputMin,
  inputMax,
  outputMin,
  outputMax
) {
  return (
    outputMin +
    ((value - inputMin) /
      (inputMax - inputMin)) *
      (outputMax - outputMin)
  );
}

function drawArrow(
  x,
  y1,
  y2,
  arrowColor
) {
  stroke(arrowColor);
  strokeWeight(2.2);

  line(x, y1, x, y2);
  line(x, y2, x - 6, y2 - 10);
  line(x, y2, x + 6, y2 - 10);
}

// ---------------------------------------------------------
// Five-section idealized tower
// ---------------------------------------------------------

function drawIdealizedTower() {
  const center = 74;
  const towerTop = 86;
  const towerBottom = 414;

  const topHalfWidth = 25;
  const bottomHalfWidth = 47;

  const numberOfShapes = 5;

  const shapeHeight =
    (towerBottom - towerTop) /
    numberOfShapes;

  const redBand = "#d65b5b";
  const towerOutline = "#202524";

  function halfWidthAt(y) {
    return mapValue(
      y,
      towerTop,
      towerBottom,
      topHalfWidth,
      bottomHalfWidth
    );
  }

  // Draw five stacked tapered shapes
  for (
    let shape = 0;
    shape < numberOfShapes;
    shape += 1
  ) {
    const yBottom =
      towerBottom -
      shape * shapeHeight;

    const yTop =
      towerBottom -
      (shape + 1) * shapeHeight;

    const halfBottom =
      halfWidthAt(yBottom);

    const halfTop =
      halfWidthAt(yTop);

    const isRedBand =
      shape === 2 ||
      shape === 3;

    fill(
      isRedBand
        ? redBand
        : "#fffef9"
    );

    stroke(towerOutline);
    strokeWeight(2.2);

    quad(
      center - halfBottom,
      yBottom,

      center + halfBottom,
      yBottom,

      center + halfTop,
      yTop,

      center - halfTop,
      yTop
    );
  }

  // Hatched fixed base
  fill("#e6e5df");
  stroke(towerOutline);
  strokeWeight(2.2);

  rect(
    10,
    towerBottom,
    128,
    29
  );

  push();

  drawingContext.save();
  drawingContext.beginPath();

  drawingContext.rect(
    10,
    towerBottom,
    128,
    29
  );

  drawingContext.clip();

  stroke("#a9aaa5");
  strokeWeight(2);

  for (
    let x = -8;
    x < 150;
    x += 10
  ) {
    line(
      x,
      towerBottom + 29,
      x + 30,
      towerBottom
    );
  }

  drawingContext.restore();

  pop();

  // Top line of fixed support
  stroke(towerOutline);
  strokeWeight(2.5);

  line(
    7,
    towerBottom,
    141,
    towerBottom
  );

  // Point load at the top
  noStroke();
  fill("#e5483f");
  textStyle(BOLD);
  textSize(11);
  textAlign(CENTER, BOTTOM);

  text(
    "P",
    center,
    47
  );

  drawArrow(
    center,
    49,
    towerTop - 2,
    "#e5483f"
  );

  textStyle(NORMAL);
}

function drawPlotFrame(
  frame,
  xTicks,
  xDomain,
  xFormatter,
  xLabel
) {
  const ink = "#27302f";
  const gridColor = "#d7d6d0";

  const yTicks = [
    0,
    10,
    20,
    30,
    40
  ];

  textFont("Arial");
  textSize(9);

  // Horizontal grid lines
  for (const elevation of yTicks) {
    const y = mapValue(
      elevation,
      0,
      lighthouseHeight,
      frame.bottom,
      frame.top
    );

    stroke(gridColor);
    strokeWeight(1);

    line(
      frame.left,
      y,
      frame.right,
      y
    );

    noStroke();
    fill("#5c6663");
    textAlign(RIGHT, CENTER);

    text(
      elevation,
      frame.left - 6,
      y
    );
  }

  // Vertical grid lines
  for (const tick of xTicks) {
    const x = mapValue(
      tick,
      xDomain[0],
      xDomain[1],
      frame.left,
      frame.right
    );

    stroke(gridColor);

    line(
      x,
      frame.top,
      x,
      frame.bottom
    );

    noStroke();
    fill("#5c6663");
    textAlign(CENTER, TOP);

    text(
      xFormatter(tick),
      x,
      frame.bottom + 7
    );
  }

  // Plot border
  noFill();
  stroke(ink);
  strokeWeight(1);

  rect(
    frame.left,
    frame.top,
    frame.right - frame.left,
    frame.bottom - frame.top
  );

  // Horizontal axis title
  noStroke();
  fill(ink);
  textSize(9.5);
  textAlign(CENTER, TOP);

  text(
    xLabel,
    (frame.left + frame.right) / 2,
    frame.bottom + 25
  );

  // Vertical axis title
  push();

  translate(
    frame.left - 31,
    (frame.top + frame.bottom) / 2
  );

  rotate(-Math.PI / 2);
  textAlign(CENTER, BOTTOM);

  text(
    "Height (m)",
    0,
    0
  );

  pop();
}

function drawLegend(
  x,
  y,
  showExact,
  compact = false
) {
  const legendWidth =
    compact ? 106 : 124;

  fill("#fffef9");
  stroke("#c9c8c1");
  strokeWeight(0.8);

  rect(
    x,
    y,
    legendWidth,
    19,
    3
  );

  let cursor = x + 8;

  textFont("Arial");
  textSize(8.5);
  textAlign(LEFT, CENTER);

  if (showExact) {
    stroke("#e5483f");
    strokeWeight(1.8);

    line(
      cursor,
      y + 9.5,
      cursor + 12,
      y + 9.5
    );

    noStroke();
    fill("#3d4643");

    text(
      "Exact",
      cursor + 16,
      y + 10
    );

    cursor += 53;
  }

  stroke("#235789");
  strokeWeight(1.6);

  line(
    cursor,
    y + 9.5,
    cursor + 12,
    y + 9.5
  );

  noStroke();
  fill("#3d4643");

  text(
    "FEM",
    cursor + 16,
    y + 10
  );
}

// ---------------------------------------------------------
// Main visualization
// ---------------------------------------------------------

function drawExplorer(
  numberOfElements,
  showExact
) {
  const red = "#e5483f";
  const blue = "#235789";
  const ink = "#27302f";

  const fem =
    femSolution(numberOfElements);

  background("#f4f1e9");
  textFont("Arial");

  const panelTitles = [
    [73, "IDEALIZED TOWER"],
    [250, "MATHEMATICAL MODEL"],
    [474, "DISPLACEMENT"],
    [701, "STRESS"]
  ];

  noStroke();
  fill(ink);
  textSize(10);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  for (const panel of panelTitles) {
    text(
      panel[1],
      panel[0],
      18
    );
  }

  textStyle(NORMAL);

  // Panel separators
  stroke("#d7d1c5");
  strokeWeight(1);

  line(149, 35, 149, 478);
  line(351, 35, 351, 478);
  line(579, 35, 579, 478);

  // Idealized five-section tower
  drawIdealizedTower();

  // -------------------------------------------------------
  // Mathematical model
  // -------------------------------------------------------

  const modelCenter = 250;
  const modelTop = 69;
  const modelBottom = 414;

  const bottomHalfWidth = 41;

  const topHalfWidth =
    bottomHalfWidth *
    (topDiameter / bottomDiameter);

  noStroke();
  fill(red);
  textStyle(BOLD);
  textSize(10);
  textAlign(CENTER, BOTTOM);

  text(
    "P = −50 kN",
    modelCenter,
    54
  );

  drawArrow(
    modelCenter,
    57,
    82,
    red
  );

  textStyle(NORMAL);

  // Exact tapered model
  if (showExact) {
    fill("rgba(229,72,63,0.16)");
    stroke(red);
    strokeWeight(1.4);

    quad(
      modelCenter - bottomHalfWidth,
      modelBottom,

      modelCenter + bottomHalfWidth,
      modelBottom,

      modelCenter + topHalfWidth,
      modelTop,

      modelCenter - topHalfWidth,
      modelTop
    );
  }

  // Equivalent FEM elements
  for (
    let element = 0;
    element < numberOfElements;
    element += 1
  ) {
    const y1 = mapValue(
      fem.coordinates[element],
      0,
      lighthouseHeight,
      modelBottom,
      modelTop
    );

    const y2 = mapValue(
      fem.coordinates[element + 1],
      0,
      lighthouseHeight,
      modelBottom,
      modelTop
    );

    const equivalentDiameter =
      fem.equivalentAreas[element] /
        (Math.PI * wallThickness) +
      wallThickness;

    const halfWidth =
      bottomHalfWidth *
      (
        equivalentDiameter /
        bottomDiameter
      );

    fill("rgba(35,87,137,0.09)");
    stroke(blue);

    strokeWeight(
      numberOfElements > 25
        ? 0.45
        : 0.8
    );

    rect(
      modelCenter - halfWidth,
      y2,
      halfWidth * 2,
      y1 - y2
    );
  }

  // Fixed base
  noStroke();
  fill("#343b39");

  rect(
    modelCenter - 52,
    modelBottom,
    104,
    5
  );

  fill("#8b8b86");

  rect(
    modelCenter - 45,
    modelBottom + 5,
    90,
    9
  );

  drawLegend(
    193,
    448,
    showExact,
    true
  );

  // -------------------------------------------------------
  // Plot definitions
  // -------------------------------------------------------

  const displacementFrame = {
    left: 384,
    right: 562,
    top: 47,
    bottom: 414
  };

  const stressFrame = {
    left: 614,
    right: 790,
    top: 47,
    bottom: 414
  };

  const displacementDomain = [
    -0.00125,
    0
  ];

  const stressDomain = [
    -80000,
    -40000
  ];

  drawPlotFrame(
    displacementFrame,

    [
      -0.0012,
      -0.0009,
      -0.0006,
      -0.0003,
      0
    ],

    displacementDomain,

    (value) => {
      return (value * 1000).toFixed(
        value === 0 ? 0 : 1
      );
    },

    "Displacement (×10⁻³ m)"
  );

  drawPlotFrame(
    stressFrame,

    [
      -80000,
      -70000,
      -60000,
      -50000,
      -40000
    ],

    stressDomain,

    (value) => {
      return String(value / 1000);
    },

    "Stress (×10³ Pa)"
  );

  // -------------------------------------------------------
  // Exact displacement and stress
  // -------------------------------------------------------

  if (showExact) {
    noFill();
    stroke(red);
    strokeWeight(1.8);

    // Exact displacement
    beginShape();

    for (
      let index = 0;
      index <= 160;
      index += 1
    ) {
      const elevation =
        (index / 160) *
        lighthouseHeight;

      const plotX = mapValue(
        exactDisplacement(elevation),

        displacementDomain[0],
        displacementDomain[1],

        displacementFrame.left,
        displacementFrame.right
      );

      const plotY = mapValue(
        elevation,
        0,
        lighthouseHeight,

        displacementFrame.bottom,
        displacementFrame.top
      );

      vertex(
        plotX,
        plotY
      );
    }

    endShape();

    // Exact stress
    beginShape();

    for (
      let index = 0;
      index <= 160;
      index += 1
    ) {
      const elevation =
        (index / 160) *
        lighthouseHeight;

      const plotX = mapValue(
        exactStress(elevation),

        stressDomain[0],
        stressDomain[1],

        stressFrame.left,
        stressFrame.right
      );

      const plotY = mapValue(
        elevation,
        0,
        lighthouseHeight,

        stressFrame.bottom,
        stressFrame.top
      );

      vertex(
        plotX,
        plotY
      );
    }

    endShape();
  }

  // -------------------------------------------------------
  // FEM nodal displacement curve
  // -------------------------------------------------------

  noFill();
  stroke(blue);
  strokeWeight(1.5);

  beginShape();

  for (
    let index = 0;
    index < fem.coordinates.length;
    index += 1
  ) {
    const plotX = mapValue(
      fem.displacements[index],

      displacementDomain[0],
      displacementDomain[1],

      displacementFrame.left,
      displacementFrame.right
    );

    const plotY = mapValue(
      fem.coordinates[index],
      0,
      lighthouseHeight,

      displacementFrame.bottom,
      displacementFrame.top
    );

    vertex(
      plotX,
      plotY
    );
  }

  endShape();

  // FEM displacement nodes
  fill(blue);
  noStroke();

  const dotDiameter =
    numberOfElements > 25
      ? 2.2
      : 3.4;

  for (
    let index = 0;
    index < fem.coordinates.length;
    index += 1
  ) {
    const plotX = mapValue(
      fem.displacements[index],

      displacementDomain[0],
      displacementDomain[1],

      displacementFrame.left,
      displacementFrame.right
    );

    const plotY = mapValue(
      fem.coordinates[index],
      0,
      lighthouseHeight,

      displacementFrame.bottom,
      displacementFrame.top
    );

    circle(
      plotX,
      plotY,
      dotDiameter
    );
  }

  // -------------------------------------------------------
  // FEM element stress field
  // -------------------------------------------------------

  for (
    let element = 0;
    element < numberOfElements;
    element += 1
  ) {
    const stressX = mapValue(
      fem.stresses[element],

      stressDomain[0],
      stressDomain[1],

      stressFrame.left,
      stressFrame.right
    );

    const y1 = mapValue(
      fem.coordinates[element],
      0,
      lighthouseHeight,

      stressFrame.bottom,
      stressFrame.top
    );

    const y2 = mapValue(
      fem.coordinates[element + 1],
      0,
      lighthouseHeight,

      stressFrame.bottom,
      stressFrame.top
    );

    stroke(blue);
    strokeWeight(1.5);

    line(
      stressX,
      y1,
      stressX,
      y2
    );

    // Connector between stress steps
    if (
      element <
      numberOfElements - 1
    ) {
      const nextStressX = mapValue(
        fem.stresses[element + 1],

        stressDomain[0],
        stressDomain[1],

        stressFrame.left,
        stressFrame.right
      );

      stroke(
        "rgba(35,87,137,0.45)"
      );

      line(
        stressX,
        y2,
        nextStressX,
        y2
      );
    }
  }

  drawLegend(
    411,
    454,
    showExact
  );

  drawLegend(
    641,
    454,
    showExact
  );
}