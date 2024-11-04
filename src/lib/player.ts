import { monaco } from "./monaco";
import { EditorEvent } from "./types";

export class Player {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private events: EditorEvent[];
  private lastPlayedEventIndex = 0;
  private state: "playing" | "paused" | "stopped" = "stopped";
  private initialCode: string;
  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    events: EditorEvent[],
    initialCode: string
  ) {
    this.editor = editor;
    this.events = events;
    this.initialCode = initialCode;
  }

  play() {
    if (this.state === "playing") {
      return;
    }
    this.editor.setValue(this.initialCode);
    this.editor.focus();
    this.state = "playing";
    this.lastPlayedEventIndex = 0;
    this.playNextEvent();
  }

  wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async playNextEvent() {
    if (this.state === "paused" || this.state === "stopped") {
      return;
    }

    const newIdx = this.lastPlayedEventIndex + 1;
    if (newIdx >= this.events.length) {
      this.state = "stopped";
      return;
    }

    const event = this.events[newIdx];
    const delay =
      event.timestamp - this.events[this.lastPlayedEventIndex].timestamp;
    this.lastPlayedEventIndex = newIdx;

    await this.wait(delay);
    this.playEvent(event);
    await this.playNextEvent();
  }

  private playEvent(event: EditorEvent) {
    if (event.type === "cursor") {
      this.editor.setPosition(event.data.position, event.data.source);
      return;
    }
    if (event.type === "selection") {
      this.editor.setSelection(event.data.range, event.data.source);
      return;
    }
    if (event.type === "text") {
      const model = this.editor.getModel();
      if (!model) {
        return;
      }
      model.applyEdits(event.data);
      return;
    }
  }
}
