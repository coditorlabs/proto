import { monaco } from "./monaco";
import { EditorEvent } from "./types";

export class Recorder {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private events: EditorEvent[] = [];
  private state: "recording" | "stopped" = "stopped";
  private disposables: monaco.IDisposable[] = [];
  private startTime = 0;
  private initialValue = "";
  private audioChunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }

  async record() {
    if (this.state === "recording") {
      return;
    }
    this.events = [];
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.state = "recording";
    this.initialValue = this.editor.getValue();
    this.startTime = Date.now();
    this.addListeners();
    this.addAudioListener();
  }

  stop() {
    if (this.state === "stopped") {
      return {
        events: [] as EditorEvent[],
        initialValue: this.initialValue,
        audioBlob: new Blob(),
        duration: 0,
      };
    }
    const duration = Date.now() - this.startTime;
    this.state = "stopped";
    this.mediaRecorder?.stop();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    return {
      events: this.events,
      initialValue: this.initialValue,
      audioBlob: new Blob(this.audioChunks, { type: "audio/webm" }),
      duration,
    };
  }

  private async addAudioListener() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.addEventListener("dataavailable", (e) => {
      console.log({ e });
      this.audioChunks.push(e.data);
    });

    mediaRecorder.start(1000);
    this.mediaRecorder = mediaRecorder;
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
        timestamp: Date.now() - this.startTime,
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
        timestamp: Date.now() - this.startTime,
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
        timestamp: Date.now() - this.startTime,
        data: {
          range: e.selection,
          source: e.source,
        },
      });
    });
    return disposable;
  }
}
