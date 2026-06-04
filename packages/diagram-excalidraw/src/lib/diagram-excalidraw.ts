import type {
  ArrowSceneElement,
  NodeSceneElement,
  RenderedDiagramScene,
  TextSceneElement,
} from "@sketchi/diagram-renderer";

export type ExcalidrawElement = Record<string, unknown> & {
  id: string;
  type: string;
};

export interface ExcalidrawScene {
  appState: Record<string, unknown>;
  elements: ExcalidrawElement[];
}

export interface ExcalidrawSceneValidationIssue {
  code:
    | "empty-scene"
    | "missing-arrow-binding"
    | "missing-bound-arrow"
    | "missing-container"
    | "overlapping-arrow-segment"
    | "text-overflow";
  elementId?: string;
  message: string;
}

export interface ExcalidrawSceneValidationResult {
  issues: ExcalidrawSceneValidationIssue[];
  ok: boolean;
}

const SHAPE_TYPES = new Set(["rectangle", "ellipse", "diamond"]);
const TEXT_LINE_HEIGHT = 1.35;
const TEXT_WIDTH_FACTOR = 0.62;
const TEXT_HORIZONTAL_PADDING = 24;
const TEXT_VERTICAL_PADDING = 18;
const ARROW_LABEL_WIDTH = 160;
const FIT_TARGET_WIDTH = 860;
const FIT_TARGET_HEIGHT = 420;
const MIN_INITIAL_ZOOM = 0.5;
const SEGMENT_EPSILON = 0.001;

function initialZoomForScene(scene: RenderedDiagramScene): number {
  const zoom = Math.min(
    1,
    FIT_TARGET_WIDTH / Math.max(scene.width, 1),
    FIT_TARGET_HEIGHT / Math.max(scene.height, 1),
  );

  return Math.max(MIN_INITIAL_ZOOM, Math.round(zoom * 100) / 100);
}

function stableSeed(input: string): number {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
}

function elementBase(id: string, index: number) {
  const seed = stableSeed(id);
  return {
    id,
    angle: 0,
    fillStyle: "solid",
    frameId: null,
    groupIds: [],
    index: `a${index}`,
    isDeleted: false,
    link: null,
    locked: false,
    opacity: 100,
    roughness: 1,
    seed,
    strokeStyle: "solid",
    strokeWidth: 2,
    updated: 1,
    version: 1,
    versionNonce: seed + 1,
  };
}

function estimateTextWidth(text: string, fontSize: number): number {
  return Math.ceil(
    Math.max(...text.split("\n").map((line) => line.length)) *
      fontSize *
      TEXT_WIDTH_FACTOR,
  );
}

function textHeight(text: string, fontSize: number): number {
  return Math.ceil(text.split("\n").length * fontSize * TEXT_LINE_HEIGHT);
}

function textElement(input: {
  containerId: string;
  fontSize: number;
  id: string;
  index: number;
  maxWidth: number;
  text: string;
  x: number;
  y: number;
}): ExcalidrawElement {
  const width = Math.max(
    1,
    Math.min(input.maxWidth, estimateTextWidth(input.text, input.fontSize)),
  );
  const height = textHeight(input.text, input.fontSize);

  return {
    ...elementBase(input.id, input.index),
    type: "text",
    x: input.x - width / 2,
    y: input.y - height / 2,
    width,
    height,
    backgroundColor: "transparent",
    boundElements: null,
    containerId: input.containerId,
    fontFamily: 5,
    fontSize: input.fontSize,
    lineHeight: TEXT_LINE_HEIGHT,
    originalText: input.text,
    roundness: null,
    strokeColor: "#1e1e1e",
    text: input.text,
    textAlign: "center",
    verticalAlign: "middle",
    autoResize: true,
  };
}

function shapeElement(input: {
  arrowIds: readonly string[];
  index: number;
  scene: RenderedDiagramScene;
  shape: NodeSceneElement;
  text?: TextSceneElement;
}): ExcalidrawElement {
  const labelHeight = input.text
    ? textHeight(input.text.text, input.text.fontSize) + TEXT_VERTICAL_PADDING
    : 0;
  const height = Math.max(input.shape.height, labelHeight);
  const boundElements = [
    ...(input.text ? [{ id: input.text.id, type: "text" }] : []),
    ...input.arrowIds.map((id) => ({ id, type: "arrow" })),
  ];

  return {
    ...elementBase(input.shape.id, input.index),
    type: input.shape.shape,
    x: input.shape.x,
    y: input.shape.y,
    width: input.shape.width,
    height,
    backgroundColor: input.scene.backgroundColor,
    boundElements: boundElements.length > 0 ? boundElements : null,
    roundness: input.shape.shape === "rectangle" ? { type: 3 } : null,
    strokeColor: input.scene.accentColor,
  };
}

function lastArrowPoint(arrow: ArrowSceneElement) {
  return arrow.points[arrow.points.length - 1] ?? arrow.points[0];
}

function arrowElement(input: {
  arrow: ArrowSceneElement;
  index: number;
  scene: RenderedDiagramScene;
}): ExcalidrawElement {
  const start = input.arrow.points[0];
  const end = lastArrowPoint(input.arrow);

  return {
    ...elementBase(input.arrow.id, input.index),
    type: "arrow",
    x: start.x,
    y: start.y,
    width: end.x - start.x,
    height: end.y - start.y,
    backgroundColor: "transparent",
    boundElements: input.arrow.label
      ? [{ id: `${input.arrow.id}:label`, type: "text" }]
      : null,
    endArrowhead: "arrow",
    endBinding: {
      elementId: `node:${input.arrow.targetNodeId}`,
      focus: 0,
      gap: 5,
      fixedPoint: null,
    },
    points: input.arrow.points.map((point) => [
      point.x - start.x,
      point.y - start.y,
    ]),
    roundness: { type: 2 },
    startArrowhead: null,
    startBinding: {
      elementId: `node:${input.arrow.sourceNodeId}`,
      focus: 0,
      gap: 5,
      fixedPoint: null,
    },
    strokeColor: input.scene.accentColor,
  };
}

function arrowLabelElement(input: {
  arrow: ArrowSceneElement;
  index: number;
}): ExcalidrawElement | null {
  if (!input.arrow.label) {
    return null;
  }

  const start = input.arrow.points[0];
  const end = lastArrowPoint(input.arrow);
  return textElement({
    id: `${input.arrow.id}:label`,
    index: input.index,
    containerId: input.arrow.id,
    fontSize: 13,
    maxWidth: ARROW_LABEL_WIDTH,
    text: input.arrow.label,
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 10,
  });
}

function collectArrowsByNode(
  arrows: readonly ArrowSceneElement[],
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const arrow of arrows) {
    for (const nodeId of [arrow.sourceNodeId, arrow.targetNodeId]) {
      const shapeId = `node:${nodeId}`;
      result.set(shapeId, [...(result.get(shapeId) ?? []), arrow.id]);
    }
  }

  return result;
}

function isNode(
  element: RenderedDiagramScene["elements"][number],
): element is NodeSceneElement {
  return element.type === "node";
}

function isText(
  element: RenderedDiagramScene["elements"][number],
): element is TextSceneElement {
  return element.type === "text";
}

function isArrow(
  element: RenderedDiagramScene["elements"][number],
): element is ArrowSceneElement {
  return element.type === "arrow";
}

export function convertSceneToExcalidraw(
  scene: RenderedDiagramScene,
): ExcalidrawScene {
  const nodes = scene.elements.filter(isNode);
  const textByContainerId = new Map(
    scene.elements
      .filter(isText)
      .map((element) => [element.containerId ?? "", element]),
  );
  const arrows = scene.elements.filter(isArrow);
  const arrowsByNode = collectArrowsByNode(arrows);
  const elements: ExcalidrawElement[] = [];
  let index = 0;

  for (const node of nodes) {
    const text = textByContainerId.get(node.id);
    elements.push(
      shapeElement({
        scene,
        shape: node,
        arrowIds: arrowsByNode.get(node.id) ?? [],
        index,
        ...(text ? { text } : {}),
      }),
    );
    index += 1;
  }

  for (const text of scene.elements.filter(isText)) {
    if (!text.containerId) {
      continue;
    }
    elements.push(
      textElement({
        id: text.id,
        index,
        containerId: text.containerId,
        fontSize: text.fontSize,
        maxWidth: text.maxWidth ?? 160,
        text: text.text,
        x: text.x,
        y: text.y,
      }),
    );
    index += 1;
  }

  for (const arrow of arrows) {
    elements.push(arrowElement({ arrow, scene, index }));
    index += 1;
    const label = arrowLabelElement({ arrow, index });
    if (label) {
      elements.push(label);
      index += 1;
    }
  }

  return {
    appState: {
      viewBackgroundColor: scene.backgroundColor,
      zoom: {
        value: initialZoomForScene(scene),
      },
    },
    elements,
  };
}

function hasBoundElement(
  element: ExcalidrawElement,
  id: string,
  type: string,
): boolean {
  const boundElements = element.boundElements;
  if (!Array.isArray(boundElements)) {
    return false;
  }

  return boundElements.some((bound) => {
    if (!(bound && typeof bound === "object")) {
      return false;
    }
    return (
      (bound as { id?: unknown }).id === id &&
      (bound as { type?: unknown }).type === type
    );
  });
}

function bindingElementId(
  element: ExcalidrawElement,
  key: string,
): string | null {
  const binding = element[key];
  if (!(binding && typeof binding === "object")) {
    return null;
  }

  const elementId = (binding as { elementId?: unknown }).elementId;
  return typeof elementId === "string" ? elementId : null;
}

interface ArrowSegment {
  arrowId: string;
  max: number;
  min: number;
  orientation: "horizontal" | "vertical";
  segmentIndex: number;
  staticCoordinate: number;
}

function numericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pointTuple(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const x = numericValue(value[0]);
  const y = numericValue(value[1]);

  return x === null || y === null ? null : [x, y];
}

function arrowSegments(element: ExcalidrawElement): ArrowSegment[] {
  const originX = numericValue(element.x) ?? 0;
  const originY = numericValue(element.y) ?? 0;
  const points = Array.isArray(element.points)
    ? element.points
        .map(pointTuple)
        .filter((point): point is [number, number] => Boolean(point))
    : [];
  const segments: ArrowSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index];
    const current = points[index + 1];

    if (!previous || !current) {
      continue;
    }

    const [previousX, previousY] = previous;
    const [currentX, currentY] = current;
    const x1 = originX + previousX;
    const y1 = originY + previousY;
    const x2 = originX + currentX;
    const y2 = originY + currentY;

    if (Math.abs(y1 - y2) <= SEGMENT_EPSILON) {
      segments.push({
        arrowId: element.id,
        max: Math.max(x1, x2),
        min: Math.min(x1, x2),
        orientation: "horizontal",
        segmentIndex: index,
        staticCoordinate: y1,
      });
      continue;
    }

    if (Math.abs(x1 - x2) <= SEGMENT_EPSILON) {
      segments.push({
        arrowId: element.id,
        max: Math.max(y1, y2),
        min: Math.min(y1, y2),
        orientation: "vertical",
        segmentIndex: index,
        staticCoordinate: x1,
      });
    }
  }

  return segments.filter(
    (segment) => segment.max - segment.min > SEGMENT_EPSILON,
  );
}

function overlapLength(left: ArrowSegment, right: ArrowSegment): number {
  return Math.min(left.max, right.max) - Math.max(left.min, right.min);
}

function overlappingArrowSegments(
  elements: readonly ExcalidrawElement[],
): ExcalidrawSceneValidationIssue[] {
  const segments = elements
    .filter((element) => element.type === "arrow")
    .flatMap(arrowSegments);
  const issues: ExcalidrawSceneValidationIssue[] = [];
  const seen = new Set<string>();

  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    const left = segments[leftIndex];
    if (!left) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < segments.length;
      rightIndex += 1
    ) {
      const right = segments[rightIndex];
      if (!right) {
        continue;
      }

      if (
        left.arrowId === right.arrowId ||
        left.orientation !== right.orientation ||
        Math.abs(left.staticCoordinate - right.staticCoordinate) >
          SEGMENT_EPSILON ||
        overlapLength(left, right) <= SEGMENT_EPSILON
      ) {
        continue;
      }

      const key = [
        left.arrowId,
        left.segmentIndex,
        right.arrowId,
        right.segmentIndex,
      ]
        .sort()
        .join(":");
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      issues.push({
        code: "overlapping-arrow-segment",
        elementId: left.arrowId,
        message: `Arrow "${left.arrowId}" overlaps arrow "${right.arrowId}".`,
      });
    }
  }

  return issues;
}

export function validateExcalidrawScene(
  scene: ExcalidrawScene,
): ExcalidrawSceneValidationResult {
  const issues: ExcalidrawSceneValidationIssue[] = [];
  const elementsById = new Map(
    scene.elements.map((element) => [element.id, element]),
  );
  const shapeIds = new Set(
    scene.elements
      .filter((element) => SHAPE_TYPES.has(element.type))
      .map((element) => element.id),
  );

  if (shapeIds.size === 0) {
    issues.push({
      code: "empty-scene",
      message: "Excalidraw scene must contain at least one shape.",
    });
  }

  for (const element of scene.elements) {
    if (element.type === "arrow") {
      for (const bindingKey of ["startBinding", "endBinding"]) {
        const shapeId = bindingElementId(element, bindingKey);
        if (!(shapeId && shapeIds.has(shapeId))) {
          issues.push({
            code: "missing-arrow-binding",
            elementId: element.id,
            message: `Arrow "${element.id}" has invalid ${bindingKey}.`,
          });
          continue;
        }

        const shape = elementsById.get(shapeId);
        if (shape && !hasBoundElement(shape, element.id, "arrow")) {
          issues.push({
            code: "missing-bound-arrow",
            elementId: shape.id,
            message: `Shape "${shape.id}" does not include bound arrow "${element.id}".`,
          });
        }
      }
    }

    if (element.type === "text") {
      const containerId = element.containerId;
      if (typeof containerId !== "string") {
        continue;
      }

      const container = elementsById.get(containerId);
      if (!container) {
        issues.push({
          code: "missing-container",
          elementId: element.id,
          message: `Text "${element.id}" references missing container "${containerId}".`,
        });
        continue;
      }

      const textWidth = typeof element.width === "number" ? element.width : 0;
      const textHeightValue =
        typeof element.height === "number" ? element.height : 0;
      const containerWidth =
        typeof container.width === "number" ? container.width : 0;
      const containerHeight =
        typeof container.height === "number" ? container.height : 0;

      if (
        SHAPE_TYPES.has(container.type) &&
        (textWidth + TEXT_HORIZONTAL_PADDING > containerWidth ||
          textHeightValue + TEXT_VERTICAL_PADDING > containerHeight)
      ) {
        issues.push({
          code: "text-overflow",
          elementId: element.id,
          message: `Text "${element.id}" does not fit inside "${containerId}".`,
        });
      }
    }
  }

  issues.push(...overlappingArrowSegments(scene.elements));

  return {
    ok: issues.length === 0,
    issues,
  };
}
