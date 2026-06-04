import type { ExcalidrawInitialDataState, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import type { ExcalidrawScene } from "@sketchi/diagram-excalidraw";
import { type ComponentType, useEffect, useMemo, useState } from "react";

type ExcalidrawComponent = ComponentType<ExcalidrawProps>;

export interface ExcalidrawSceneCanvasProps {
  scene: ExcalidrawScene;
  title: string;
  viewModeEnabled?: boolean;
}

export function ExcalidrawSceneCanvas({
  scene,
  title,
  viewModeEnabled = false
}: ExcalidrawSceneCanvasProps) {
  const [Excalidraw, setExcalidraw] = useState<ExcalidrawComponent | null>(
    null,
  );
  const sceneKey = useMemo(
    () => scene.elements.map((element) => element.id).join(":"),
    [scene],
  );
  const initialData = useMemo<ExcalidrawInitialDataState>(
    () => {
      const elements =
        scene.elements as unknown as NonNullable<
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
    },
    [scene],
  );

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
