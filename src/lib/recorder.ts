import { monaco } from "./monaco";
import { EditorEvent } from "./types";

export class Recorder {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private events: EditorEvent[] = [];
  private state: "recording" | "stopped" = "stopped";
  private disposables: monaco.IDisposable[] = [];

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }

  record() {
    if (this.state === "recording") {
      return;
    }
    this.events = [];
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.state = "recording";
    this.addListeners();
  }

  stop() {
    if (this.state === "stopped") {
      return [] as EditorEvent[];
    }
    this.state = "stopped";
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    return this.events;
  }

  private addListeners() {
    this.disposables.push(this.addTextListener());
    this.disposables.push(this.addCursorListener());
    this.disposables.push(this.addSelectionListener());
  }

  private addTextListener() {
    const disposable = this.editor.onDidChangeModelContent((e) => {
      this.events.push({
        type: "text",
        timestamp: Date.now(),
        data: e.changes.map((change) => ({
          range: change.range,
          text: change.text,
        })),
      });
    });
    return disposable;
  }

  private addCursorListener() {
    const disposable = this.editor.onDidChangeCursorPosition((e) => {
      this.events.push({
        type: "cursor",
        timestamp: Date.now(),
        data: {
          position: e.position,
          source: e.source,
        },
      });
    });
    return disposable;
  }

  private addSelectionListener() {
    const disposable = this.editor.onDidChangeCursorSelection((e) => {
      this.events.push({
        type: "selection",
        timestamp: Date.now(),
        data: {
          range: e.selection,
          source: e.source,
        },
      });
    });
    return disposable;
  }
}
