import type {
  ArrowSceneElement,
  NodeSceneElement,
  RenderedDiagramScene,
  TextSceneElement,
} from "@sketchi/diagram-renderer";

/**
 * Studio-local take on the lab's DiagramPreview: renders a
 * RenderedDiagramScene as sketchbook-styled SVG that fills the stage panel.
 */

export interface DiagramArtifactProps {
  scene: RenderedDiagramScene;
}

const isNode = (
  element: RenderedDiagramScene["elements"][number],
): element is NodeSceneElement => element.type === "node";

const isText = (
  element: RenderedDiagramScene["elements"][number],
): element is TextSceneElement => element.type === "text";

const isArrow = (
  element: RenderedDiagramScene["elements"][number],
): element is ArrowSceneElement => element.type === "arrow";

function NodeShape({ node }: { node: NodeSceneElement }) {
  if (node.shape === "ellipse") {
    return (
      <ellipse
        className="artifact__node artifact__node--terminal"
        cx={node.x + node.width / 2}
        cy={node.y + node.height / 2}
        rx={node.width / 2}
        ry={node.height / 2}
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
    return <polygon className="artifact__node artifact__node--decision" points={points} />;
  }

  return (
    <rect
      className="artifact__node"
      height={node.height}
      rx="10"
      width={node.width}
      x={node.x}
      y={node.y}
    />
  );
}

export function DiagramArtifact({ scene }: DiagramArtifactProps) {
  const nodes = scene.elements.filter(isNode);
  const labels = scene.elements.filter(isText);
  const arrows = scene.elements.filter(isArrow);
  const markerId = `${scene.diagramId}-arrowhead`;

  return (
    <svg
      aria-label={scene.title}
      className="artifact"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${scene.width} ${scene.height}`}
    >
      <defs>
        <marker
          id={markerId}
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
          viewBox="0 0 8 8"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill={scene.accentColor} />
        </marker>
      </defs>

      {arrows.map((arrow) => {
        const start = arrow.points[0];
        const end = arrow.points[arrow.points.length - 1] ?? start;
        const points = arrow.points
          .map((point) => `${point.x},${point.y}`)
          .join(" ");

        return (
          <g key={arrow.id}>
            <polyline
              className="artifact__edge"
              fill="none"
              markerEnd={`url(#${markerId})`}
              points={points}
              stroke={scene.accentColor}
            />
            {arrow.label ? (
              <text
                className="artifact__edge-label"
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

      {nodes.map((node) => (
        <NodeShape key={node.id} node={node} />
      ))}

      {labels.map((label) => {
        const lines = label.text.split("\n");
        const lineHeight = label.fontSize * 1.35;
        const firstLineOffset = -((lines.length - 1) * lineHeight) / 2;

        return (
          <text
            className="artifact__label"
            dominantBaseline="middle"
            fontSize={label.fontSize}
            key={label.id}
            textAnchor="middle"
            x={label.x}
            y={label.y}
          >
            {lines.map((line, index) => (
              <tspan
                dy={index === 0 ? firstLineOffset : lineHeight}
                key={`${label.id}-${index}`}
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
