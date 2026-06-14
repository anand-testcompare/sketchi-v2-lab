import type {
  ArrowSceneElement,
  NodeSceneElement,
  RenderedDiagramScene,
  TextSceneElement,
} from "@sketchi/diagram-renderer";

export interface DiagramPreviewProps {
  scene: RenderedDiagramScene;
}

const isRectangle = (
  element: RenderedDiagramScene["elements"][number],
): element is NodeSceneElement => element.type === "node";

const isText = (
  element: RenderedDiagramScene["elements"][number],
): element is TextSceneElement => element.type === "text";

const isArrow = (
  element: RenderedDiagramScene["elements"][number],
): element is ArrowSceneElement => element.type === "arrow";

function lastArrowPoint(arrow: ArrowSceneElement) {
  return arrow.points[arrow.points.length - 1] ?? arrow.points[0];
}

function markerId(sceneId: string, arrowId: string): string {
  return `${sceneId}-arrow-${arrowId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function DiagramPreview({ scene }: DiagramPreviewProps) {
  const nodes = scene.elements.filter(isRectangle);
  const labels = scene.elements.filter(isText);
  const arrows = scene.elements.filter(isArrow);

  return (
    <svg
      aria-label={scene.title}
      className="sketchi-diagram-preview"
      role="img"
      style={{ backgroundColor: scene.backgroundColor }}
      viewBox={`0 0 ${scene.width} ${scene.height}`}
    >
      <defs>
        {arrows.map((arrow) => (
          <marker
            id={markerId(scene.diagramId, arrow.id)}
            key={arrow.id}
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
            viewBox="0 0 8 8"
          >
            <path
              d="M0,0 L8,4 L0,8 Z"
              fill={arrow.strokeColor ?? scene.accentColor}
            />
          </marker>
        ))}
      </defs>

      {arrows.map((arrow) => {
        const start = arrow.points[0];
        const end = lastArrowPoint(arrow);
        const points = arrow.points
          .map((point) => `${point.x},${point.y}`)
          .join(" ");

        return (
          <g key={arrow.id}>
            <polyline
              fill="none"
              markerEnd={`url(#${markerId(scene.diagramId, arrow.id)})`}
              points={points}
              stroke={arrow.strokeColor ?? scene.accentColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            {arrow.label ? (
              <text
                className="sketchi-diagram-preview__edge-label"
                fill={arrow.textColor}
                textAnchor="middle"
                x={(start.x + end.x) / 2}
                y={(start.y + end.y) / 2 - 10}
              >
                {arrow.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {nodes.map((node) => {
        const style = {
          fill: node.fillColor ?? undefined,
          stroke: node.strokeColor ?? undefined,
        };

        if (node.shape === "ellipse" || node.shape === "circle") {
          return (
            <ellipse
              className="sketchi-diagram-preview__node"
              cx={node.x + node.width / 2}
              cy={node.y + node.height / 2}
              key={node.id}
              rx={node.width / 2}
              ry={node.height / 2}
              style={style}
            />
          );
        }

        if (node.shape === "diamond") {
          const points = [
            `${node.x + node.width / 2},${node.y}`,
            `${node.x + node.width},${node.y + node.height / 2}`,
            `${node.x + node.width / 2},${node.y + node.height}`,
            `${node.x},${node.y + node.height / 2}`,
          ].join(" ");
          return (
            <polygon
              className="sketchi-diagram-preview__node"
              key={node.id}
              points={points}
              style={style}
            />
          );
        }

        return (
          <rect
            className="sketchi-diagram-preview__node"
            height={node.height}
            key={node.id}
            rx="8"
            style={style}
            width={node.width}
            x={node.x}
            y={node.y}
          />
        );
      })}

      {labels.map((label) => {
        const lines = label.text.split("\n");
        const lineHeight = label.fontSize * 1.35;
        const firstLineOffset = -((lines.length - 1) * lineHeight) / 2;

        return (
          <text
            className="sketchi-diagram-preview__label"
            dominantBaseline="middle"
            fill={label.textColor}
            fontSize={label.fontSize}
            key={label.id}
            textAnchor="middle"
            x={label.x}
            y={label.y}
          >
            {lines.map((line, index) => (
              <tspan
                dy={index === 0 ? firstLineOffset : lineHeight}
                key={`${label.id}:${index}`}
                x={label.x}
              >
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
