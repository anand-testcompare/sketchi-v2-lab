import type {
  ArrowSceneElement,
  RectangleSceneElement,
  RenderedDiagramScene,
  TextSceneElement
} from "@sketchi/diagram-renderer";

export interface DiagramPreviewProps {
  scene: RenderedDiagramScene;
}

const isRectangle = (
  element: RenderedDiagramScene["elements"][number]
): element is RectangleSceneElement => element.type === "rectangle";

const isText = (
  element: RenderedDiagramScene["elements"][number]
): element is TextSceneElement => element.type === "text";

const isArrow = (
  element: RenderedDiagramScene["elements"][number]
): element is ArrowSceneElement => element.type === "arrow";

export function DiagramPreview({ scene }: DiagramPreviewProps) {
  const rectangles = scene.elements.filter(isRectangle);
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
        <marker
          id={`${scene.diagramId}-arrow`}
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
        const [start, end] = arrow.points;

        return (
          <g key={arrow.id}>
            <line
              markerEnd={`url(#${scene.diagramId}-arrow)`}
              stroke={scene.accentColor}
              strokeLinecap="round"
              strokeWidth="2"
              x1={start.x}
              x2={end.x}
              y1={start.y}
              y2={end.y}
            />
            {arrow.label ? (
              <text
                className="sketchi-diagram-preview__edge-label"
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

      {rectangles.map((rectangle) => (
        <rect
          className="sketchi-diagram-preview__node"
          height={rectangle.height}
          key={rectangle.id}
          rx="8"
          width={rectangle.width}
          x={rectangle.x}
          y={rectangle.y}
        />
      ))}

      {labels.map((label) => (
        <text
          className="sketchi-diagram-preview__label"
          dominantBaseline="middle"
          fontSize={label.fontSize}
          key={label.id}
          textAnchor="middle"
          x={label.x}
          y={label.y}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}
