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
  points: readonly [ScenePoint, ...ScenePoint[]];
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
const HORIZONTAL_GAP = 112;
const VERTICAL_GAP = 96;
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
    longestLineLength * NODE_LABEL_FONT_SIZE * NODE_LABEL_WIDTH_FACTOR +
      NODE_LABEL_HORIZONTAL_PADDING,
  );
  const height = Math.ceil(
    lines.length * NODE_LABEL_FONT_SIZE * NODE_LABEL_LINE_HEIGHT +
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

function createNodeShape(node: DiagramNode): NodeSceneElement {
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
    x: 0,
    y: 0,
    width: Math.max(MIN_NODE_WIDTH, labelMetrics.width + shapeWidthPad),
    height: Math.max(MIN_NODE_HEIGHT, labelMetrics.height + shapeHeightPad),
    label: labelMetrics.text,
  };
}

function positionNodes(diagram: IntermediateDiagram): NodeSceneElement[] {
  const vertical =
    diagram.layout.direction === "TB" || diagram.layout.direction === "BT";
  const shapesByNodeId = new Map(
    diagram.nodes.map((node) => [node.id, createNodeShape(node)]),
  );
  const incoming = new Map<string, DiagramEdge[]>();
  const outgoing = new Map<string, DiagramEdge[]>();

  for (const edge of diagram.edges) {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }

  const startNode =
    diagram.nodes.find((node) => (incoming.get(node.id) ?? []).length === 0) ??
    diagram.nodes[0];
  const rankByNodeId = new Map<string, number>();
  const queue = startNode ? [{ id: startNode.id, rank: 0 }] : [];

  for (const item of queue) {
    if (rankByNodeId.has(item.id)) {
      continue;
    }

    rankByNodeId.set(item.id, item.rank);
    for (const edge of outgoing.get(item.id) ?? []) {
      queue.push({ id: edge.target, rank: item.rank + 1 });
    }
  }

  for (const node of diagram.nodes) {
    if (!rankByNodeId.has(node.id)) {
      rankByNodeId.set(node.id, rankByNodeId.size);
    }
  }

  const rankedShapes = new Map<number, NodeSceneElement[]>();
  for (const node of diagram.nodes) {
    const rank = rankByNodeId.get(node.id) ?? 0;
    const shape = shapesByNodeId.get(node.id);
    if (shape) {
      rankedShapes.set(rank, [...(rankedShapes.get(rank) ?? []), shape]);
    }
  }

  const ranks = Array.from(rankedShapes.entries()).sort(
    ([left], [right]) => left - right,
  );
  const rankMetrics = ranks.map(([rank, shapes]) => {
    const breadth = shapes.reduce(
      (sum, shape, index) =>
        sum +
        (vertical ? shape.width : shape.height) +
        (index > 0 ? HORIZONTAL_GAP : 0),
      0,
    );
    const depth = Math.max(
      ...shapes.map((shape) => (vertical ? shape.height : shape.width)),
    );

    return { breadth, depth, rank, shapes };
  });
  const maxBreadth = Math.max(...rankMetrics.map((metric) => metric.breadth));
  let rankOffset = PADDING;
  const positioned: NodeSceneElement[] = [];

  for (const metric of rankMetrics) {
    let breadthOffset = PADDING + Math.max(0, maxBreadth - metric.breadth) / 2;

    for (const shape of metric.shapes) {
      if (vertical) {
        positioned.push({
          ...shape,
          x: breadthOffset,
          y: rankOffset + Math.max(0, metric.depth - shape.height) / 2,
        });
        breadthOffset += shape.width + HORIZONTAL_GAP;
      } else {
        positioned.push({
          ...shape,
          x: rankOffset + Math.max(0, metric.depth - shape.width) / 2,
          y: breadthOffset,
        });
        breadthOffset += shape.height + HORIZONTAL_GAP;
      }
    }

    rankOffset += metric.depth + VERTICAL_GAP;
  }

  if (diagram.layout.direction === "BT") {
    const totalHeight = Math.max(
      ...positioned.map((shape) => shape.y + shape.height),
    );
    return positioned.map((shape) => ({
      ...shape,
      y: PADDING + totalHeight - shape.y - shape.height,
    }));
  }

  if (diagram.layout.direction === "RL") {
    const totalWidth = Math.max(
      ...positioned.map((shape) => shape.x + shape.width),
    );
    return positioned.map((shape) => ({
      ...shape,
      x: PADDING + totalWidth - shape.x - shape.width,
    }));
  }

  return positioned;
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

function connectionEdges(
  source: NodeSceneElement,
  target: NodeSceneElement,
): {
  sourceEdge: ConnectionEdge;
  targetEdge: ConnectionEdge;
} {
  const sourceCenter = center(source);
  const targetCenter = center(target);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const sourceKind = source.kind?.toLowerCase();

  if (sourceKind === "decision" && dx !== 0 && dy > 0) {
    return {
      sourceEdge: dx > 0 ? "right" : "left",
      targetEdge: "top",
    };
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceEdge: "right", targetEdge: "left" }
      : { sourceEdge: "left", targetEdge: "right" };
  }

  return dy > 0
    ? { sourceEdge: "bottom", targetEdge: "top" }
    : { sourceEdge: "top", targetEdge: "bottom" };
}

function pointOnEdge(
  shape: NodeSceneElement,
  edge: ConnectionEdge,
): ScenePoint {
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
  edgeRouting: IntermediateDiagram["layout"]["edgeRouting"],
): ArrowSceneElement {
  const source = shapesByNodeId.get(edge.source);
  const target = shapesByNodeId.get(edge.target);

  if (!source || !target) {
    throw new Error(`Cannot render edge "${edge.id}" with unresolved nodes.`);
  }

  const { sourceEdge, targetEdge } = connectionEdges(source, target);
  const start = pointOnEdge(source, sourceEdge);
  const end = pointOnEdge(target, targetEdge);
  const points: [ScenePoint, ...ScenePoint[]] = [start, end];

  if (edgeRouting === "orthogonal" && start.x !== end.x && start.y !== end.y) {
    const verticalFirst = sourceEdge === "top" || sourceEdge === "bottom";
    const cornerA = verticalFirst
      ? { x: start.x, y: start.y + (end.y - start.y) / 2 }
      : { x: start.x + (end.x - start.x) / 2, y: start.y };
    const cornerB = verticalFirst
      ? { x: end.x, y: cornerA.y }
      : { x: cornerA.x, y: end.y };

    points.splice(1, 0, cornerA, cornerB);
  }

  return {
    type: "arrow",
    id: `edge:${edge.id}`,
    edgeId: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    points,
    ...(edge.label ? { label: edge.label } : {}),
  };
}

function sceneBounds(elements: readonly NodeSceneElement[]): {
  width: number;
  height: number;
} {
  const maxX = Math.max(
    ...elements.map((element) => element.x + element.width),
  );
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
    arrowForEdge(edge, shapesByNodeId, diagram.layout.edgeRouting),
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
