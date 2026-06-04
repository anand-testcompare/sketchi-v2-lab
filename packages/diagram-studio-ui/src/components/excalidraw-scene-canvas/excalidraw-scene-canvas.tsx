import type {
  ExcalidrawInitialDataState,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawScene } from "@sketchi/diagram-excalidraw";
import { type ComponentType, useEffect, useMemo, useState } from "react";

type ExcalidrawComponent = ComponentType<ExcalidrawProps>;

export interface ExcalidrawSceneCanvasProps {
  onChange?: ExcalidrawProps["onChange"];
  scene: ExcalidrawScene;
  title: string;
  viewModeEnabled?: boolean;
}

export function ExcalidrawSceneCanvas({
  onChange,
  scene,
  title,
  viewModeEnabled = false,
}: ExcalidrawSceneCanvasProps) {
  const [Excalidraw, setExcalidraw] = useState<ExcalidrawComponent | null>(
    null,
  );
  const sceneKey = useMemo(
    () =>
      JSON.stringify({
        appState: scene.appState,
        elements: scene.elements.map((element) => ({
          containerId: "containerId" in element ? element.containerId : null,
          height: element.height,
          id: element.id,
          points: "points" in element ? element.points : null,
          text: "text" in element ? element.text : null,
          type: element.type,
          width: element.width,
          x: element.x,
          y: element.y,
        })),
      }),
    [scene],
  );
  const initialData = useMemo<ExcalidrawInitialDataState>(() => {
    const elements = scene.elements as unknown as NonNullable<
      ExcalidrawInitialDataState["elements"]
    >;
    const appState = {
      ...scene.appState,
      viewBackgroundColor:
        typeof scene.appState.viewBackgroundColor === "string"
          ? scene.appState.viewBackgroundColor
          : "#ffffff",
    } as NonNullable<ExcalidrawInitialDataState["appState"]>;

    return {
      elements,
      appState,
      scrollToContent: true,
    };
  }, [scene]);

  useEffect(() => {
    let mounted = true;

    import("@excalidraw/excalidraw").then((module) => {
      if (mounted) {
        setExcalidraw(() => module.Excalidraw);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      aria-label={title}
      className="sketchi-excalidraw-scene-canvas"
      data-testid="excalidraw-scene-canvas"
    >
      {Excalidraw ? (
        <Excalidraw
          key={sceneKey}
          {...(onChange ? { onChange } : {})}
          autoFocus={false}
          gridModeEnabled
          initialData={initialData}
          name={title}
          theme="light"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveAsImage: true,
            },
          }}
          viewModeEnabled={viewModeEnabled}
        />
      ) : (
        <div className="sketchi-excalidraw-scene-canvas__loading">
          Loading Excalidraw
        </div>
      )}
    </section>
  );
}
