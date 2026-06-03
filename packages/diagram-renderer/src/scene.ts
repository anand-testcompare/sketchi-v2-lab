import {
  type DiagramEdge,
  type DiagramNode,
  type IntermediateDiagram,
  parseIntermediateDiagram
} from "@sketchi/diagram-core";

export type SceneElement =
  | RectangleSceneElement
  | TextSceneElement
  | ArrowSceneElement;

export interface RectangleSceneElement {
  type: "rectangle";
  id: string;
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface TextSceneElement {
  type: "text";
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
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

const NODE_WIDTH = 184;
const NODE_HEIGHT = 72;
const HORIZONTAL_GAP = 72;
const VERTICAL_GAP = 48;
const PADDING = 48;

function positionNode(
  node: DiagramNode,
  index: number,
  diagram: IntermediateDiagram
): RectangleSceneElement {
  const horizontal = diagram.layout.direction === "LR";
  const x = PADDING + (horizontal ? index * (NODE_WIDTH + HORIZONTAL_GAP) : 0);
  const y = PADDING + (horizontal ? 0 : index * (NODE_HEIGHT + VERTICAL_GAP));

  return {
    type: "rectangle",
    id: `node:${node.id}`,
    nodeId: node.id,
    x,
    y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    label: node.label
  };
}

function textForNode(shape: RectangleSceneElement): TextSceneElement {
  return {
    type: "text",
    id: `label:${shape.nodeId}`,
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
    text: shape.label,
    fontSize: 14
  };
}

function arrowForEdge(
  edge: DiagramEdge,
  shapesByNodeId: ReadonlyMap<string, RectangleSceneElement>
): ArrowSceneElement {
  const source = shapesByNodeId.get(edge.source);
  const target = shapesByNodeId.get(edge.target);

  if (!source || !target) {
    throw new Error(`Cannot render edge "${edge.id}" with unresolved nodes.`);
  }

  const sourceCenter = {
    x: source.x + source.width,
    y: source.y + source.height / 2
  };
  const targetCenter = {
    x: target.x,
    y: target.y + target.height / 2
  };

  return {
    type: "arrow",
    id: `edge:${edge.id}`,
    edgeId: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    points: [sourceCenter, targetCenter],
    ...(edge.label ? { label: edge.label } : {})
  };
}

export function renderIntermediateDiagram(
  input: IntermediateDiagram | unknown
): RenderedDiagramScene {
  const diagram = parseIntermediateDiagram(input);
  const nodeShapes = diagram.nodes.map((node, index) =>
    positionNode(node, index, diagram)
  );
  const shapesByNodeId = new Map(
    nodeShapes.map((shape) => [shape.nodeId, shape])
  );
  const edgeArrows = diagram.edges.map((edge) =>
    arrowForEdge(edge, shapesByNodeId)
  );
  const labels = nodeShapes.map(textForNode);
  const horizontal = diagram.layout.direction === "LR";

  return {
    diagramId: diagram.id,
    title: diagram.title,
    width:
      PADDING * 2 +
      (horizontal
        ? diagram.nodes.length * NODE_WIDTH +
          Math.max(0, diagram.nodes.length - 1) * HORIZONTAL_GAP
        : NODE_WIDTH),
    height:
      PADDING * 2 +
      (horizontal
        ? NODE_HEIGHT
        : diagram.nodes.length * NODE_HEIGHT +
          Math.max(0, diagram.nodes.length - 1) * VERTICAL_GAP),
    accentColor: diagram.style.accentColor,
    backgroundColor: diagram.style.backgroundColor,
    elements: [...edgeArrows, ...nodeShapes, ...labels]
  };
}
