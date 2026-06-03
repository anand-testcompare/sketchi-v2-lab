import {
  type DiagramEdge,
  type DiagramNode,
  type IntermediateDiagram,
  parseIntermediateDiagram,
} from "@sketchi/diagram-core";

export type NodeSceneShape = "rectangle" | "ellipse" | "diamond";

export type SceneElement =
  | NodeSceneElement
  | TextSceneElement
  | ArrowSceneElement;

export interface NodeSceneElement {
  type: "node";
  id: string;
  nodeId: string;
  kind?: string;
  shape: NodeSceneShape;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface TextSceneElement {
  type: "text";
  id: string;
  containerId?: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  maxWidth?: number;
}

export interface ArrowSceneElement {
  type: "arrow";
  id: string;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  points: readonly [ScenePoint, ScenePoint];
  label?: string;
}

export interface ScenePoint {
  x: number;
  y: number;
}

export interface RenderedDiagramScene {
  diagramId: string;
  title: string;
  width: number;
  height: number;
  accentColor: string;
  backgroundColor: string;
  elements: SceneElement[];
}

const MIN_NODE_WIDTH = 184;
const MIN_NODE_HEIGHT = 72;
const HORIZONTAL_GAP = 72;
const VERTICAL_GAP = 64;
const PADDING = 48;
const NODE_LABEL_FONT_SIZE = 14;
const NODE_LABEL_WIDTH_FACTOR = 0.62;
const NODE_LABEL_LINE_HEIGHT = 1.35;
const NODE_LABEL_HORIZONTAL_PADDING = 36;
const NODE_LABEL_VERTICAL_PADDING = 28;
const MAX_LABEL_CHARS_PER_LINE = 18;

type ConnectionEdge = "top" | "right" | "bottom" | "left";

function splitLongWord(word: string, maxChars: number): string[] {
  if (word.length <= maxChars) {
    return [word];
  }

  const chunks: string[] = [];
  for (let index = 0; index < word.length; index += maxChars) {
    chunks.push(word.slice(index, index + maxChars));
  }
  return chunks;
}

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) {
    return [line];
  }

  const wrapped: string[] = [];
  let current = "";

  for (const word of line.split(" ")) {
    if (word.length > maxChars) {
      if (current) {
        wrapped.push(current);
        current = "";
      }
      wrapped.push(...splitLongWord(word, maxChars));
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    wrapped.push(current);
    current = word;
  }

  if (current) {
    wrapped.push(current);
  }

  return wrapped;
}

function wrapLabel(label: string): string {
  return label
    .split("\n")
    .flatMap((line) => wrapLine(line, MAX_LABEL_CHARS_PER_LINE))
    .join("\n");
}

function measureLabel(label: string): {
  height: number;
  text: string;
  width: number;
} {
  const text = wrapLabel(label);
  const lines = text.split("\n");
  const longestLineLength = Math.max(...lines.map((line) => line.length));
  const width = Math.ceil(
    longestLineLength *
      NODE_LABEL_FONT_SIZE *
      NODE_LABEL_WIDTH_FACTOR +
      NODE_LABEL_HORIZONTAL_PADDING,
  );
  const height = Math.ceil(
    lines.length *
      NODE_LABEL_FONT_SIZE *
      NODE_LABEL_LINE_HEIGHT +
      NODE_LABEL_VERTICAL_PADDING,
  );

  return { text, width, height };
}

function shapeForNode(node: DiagramNode): NodeSceneShape {
  const kind = node.kind?.toLowerCase();
  if (kind === "start" || kind === "end") {
    return "ellipse";
  }
  if (kind === "decision") {
    return "diamond";
  }
  return "rectangle";
}

function createNodeShape(
  node: DiagramNode,
  position: ScenePoint,
): NodeSceneElement {
  const labelMetrics = measureLabel(node.label);
  const shape = shapeForNode(node);
  const shapeWidthPad = shape === "diamond" ? 32 : shape === "ellipse" ? 20 : 0;
  const shapeHeightPad = shape === "diamond" ? 32 : 0;

  return {
    type: "node",
    id: `node:${node.id}`,
    nodeId: node.id,
    ...(node.kind ? { kind: node.kind } : {}),
    shape,
    x: position.x,
    y: position.y,
    width: Math.max(MIN_NODE_WIDTH, labelMetrics.width + shapeWidthPad),
    height: Math.max(MIN_NODE_HEIGHT, labelMetrics.height + shapeHeightPad),
    label: labelMetrics.text,
  };
}

function positionNodes(diagram: IntermediateDiagram): NodeSceneElement[] {
  const vertical =
    diagram.layout.direction === "TB" || diagram.layout.direction === "BT";
  const shapes: NodeSceneElement[] = [];
  let offset = PADDING;

  for (const node of diagram.nodes) {
    const position = vertical
      ? { x: PADDING, y: offset }
      : { x: offset, y: PADDING };
    const shape = createNodeShape(node, position);
    shapes.push(shape);
    offset +=
      (vertical ? shape.height : shape.width) +
      (vertical ? VERTICAL_GAP : HORIZONTAL_GAP);
  }

  if (diagram.layout.direction === "BT") {
    const totalHeight =
      shapes.reduce((sum, shape) => sum + shape.height, 0) +
      Math.max(0, shapes.length - 1) * VERTICAL_GAP;
    return shapes.map((shape) => ({
      ...shape,
      y: PADDING + totalHeight - (shape.y - PADDING) - shape.height,
    }));
  }

  if (diagram.layout.direction === "RL") {
    const totalWidth =
      shapes.reduce((sum, shape) => sum + shape.width, 0) +
      Math.max(0, shapes.length - 1) * HORIZONTAL_GAP;
    return shapes.map((shape) => ({
      ...shape,
      x: PADDING + totalWidth - (shape.x - PADDING) - shape.width,
    }));
  }

  return shapes;
}

function textForNode(shape: NodeSceneElement): TextSceneElement {
  return {
    type: "text",
    id: `label:${shape.nodeId}`,
    containerId: shape.id,
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
    text: shape.label,
    fontSize: NODE_LABEL_FONT_SIZE,
    maxWidth: Math.max(1, shape.width - NODE_LABEL_HORIZONTAL_PADDING),
  };
}

function center(shape: NodeSceneElement): ScenePoint {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

function connectionEdges(source: NodeSceneElement, target: NodeSceneElement): {
  sourceEdge: ConnectionEdge;
  targetEdge: ConnectionEdge;
} {
  const sourceCenter = center(source);
  const targetCenter = center(target);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceEdge: "right", targetEdge: "left" }
      : { sourceEdge: "left", targetEdge: "right" };
  }

  return dy > 0
    ? { sourceEdge: "bottom", targetEdge: "top" }
    : { sourceEdge: "top", targetEdge: "bottom" };
}

function pointOnEdge(shape: NodeSceneElement, edge: ConnectionEdge): ScenePoint {
  switch (edge) {
    case "top":
      return { x: shape.x + shape.width / 2, y: shape.y };
    case "right":
      return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
    case "bottom":
      return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
    case "left":
      return { x: shape.x, y: shape.y + shape.height / 2 };
  }
}

function arrowForEdge(
  edge: DiagramEdge,
  shapesByNodeId: ReadonlyMap<string, NodeSceneElement>,
): ArrowSceneElement {
  const source = shapesByNodeId.get(edge.source);
  const target = shapesByNodeId.get(edge.target);

  if (!source || !target) {
    throw new Error(`Cannot render edge "${edge.id}" with unresolved nodes.`);
  }

  const { sourceEdge, targetEdge } = connectionEdges(source, target);

  return {
    type: "arrow",
    id: `edge:${edge.id}`,
    edgeId: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    points: [pointOnEdge(source, sourceEdge), pointOnEdge(target, targetEdge)],
    ...(edge.label ? { label: edge.label } : {}),
  };
}

function sceneBounds(elements: readonly NodeSceneElement[]): {
  width: number;
  height: number;
} {
  const maxX = Math.max(...elements.map((element) => element.x + element.width));
  const maxY = Math.max(
    ...elements.map((element) => element.y + element.height),
  );

  return {
    width: maxX + PADDING,
    height: maxY + PADDING,
  };
}

export function renderIntermediateDiagram(
  input: IntermediateDiagram | unknown,
): RenderedDiagramScene {
  const diagram = parseIntermediateDiagram(input);
  const nodeShapes = positionNodes(diagram);
  const shapesByNodeId = new Map(
    nodeShapes.map((shape) => [shape.nodeId, shape]),
  );
  const edgeArrows = diagram.edges.map((edge) =>
    arrowForEdge(edge, shapesByNodeId),
  );
  const labels = nodeShapes.map(textForNode);
  const bounds = sceneBounds(nodeShapes);

  return {
    diagramId: diagram.id,
    title: diagram.title,
    width: bounds.width,
    height: bounds.height,
    accentColor: diagram.style.accentColor,
    backgroundColor: diagram.style.backgroundColor,
    elements: [...edgeArrows, ...nodeShapes, ...labels],
  };
}
