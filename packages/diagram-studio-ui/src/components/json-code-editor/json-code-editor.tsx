import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { useMemo } from "react";

export interface JsonCodeEditorProps {
  id?: string;
  label: string;
  maxHeight?: string;
  minHeight?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
}

export function JsonCodeEditor({
  id,
  label,
  maxHeight = "100%",
  minHeight = "220px",
  onChange,
  readOnly = false,
  value,
}: JsonCodeEditorProps) {
  const extensions = useMemo(
    () => [
      json(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          backgroundColor: "#ffffff",
          color: "#111827",
          fontSize: "12px",
        },
        ".cm-content": {
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          lineHeight: "1.45",
          minHeight,
          padding: "10px",
        },
        ".cm-gutters": {
          backgroundColor: "#f8fafc",
          borderRight: "1px solid #dbe3ef",
          color: "#64748b",
        },
        ".cm-scroller": {
          maxHeight,
        },
        "&.cm-focused": {
          outline: "2px solid #2563eb",
          outlineOffset: "-2px",
        },
      }),
    ],
    [maxHeight, minHeight],
  );
  const editableProps: Pick<ReactCodeMirrorProps, "editable" | "readOnly"> = {
    editable: !readOnly,
    readOnly,
  };

  return (
    <section className="sketchi-json-code-editor">
      <label {...(id ? { htmlFor: id } : {})}>{label}</label>
      <CodeMirror
        {...editableProps}
        {...(onChange ? { onChange } : {})}
        aria-label={label}
        basicSetup={{
          autocompletion: false,
          bracketMatching: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
        }}
        className="sketchi-json-code-editor__editor"
        extensions={extensions}
        id={id}
        value={value}
      />
    </section>
  );
}
