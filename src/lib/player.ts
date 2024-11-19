import { monaco } from "./monaco";
import { EditorEvent, RecordingData } from "./types";

export class Player {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private events: EditorEvent[];
  private lastPlayedEventIndex = 0;
  private state: "playing" | "paused" | "stopped" = "stopped";
  private initialCode: string;
  private audioBlob: Blob;
  private duration: number;
  private audio: HTMLAudioElement | null = null;
  private lastPlayedTime = 0;
  private rafId: number | null = null;
  private startTime: number | null = null;

  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    recordingData: RecordingData
  ) {
    this.editor = editor;
    this.events = recordingData.events;
    this.initialCode = recordingData.initialValue;
    this.audioBlob = recordingData.audioBlob;
    this.duration = recordingData.duration;
  }

  play() {
    if (this.state === "playing") {
      return;
    }
    this.editor.setValue(this.initialCode);
    this.editor.focus();
    this.state = "playing";
    this.lastPlayedEventIndex = 0;
    this.lastPlayedTime = 0;
    this.startTime = null;

    this.audio = new Audio(URL.createObjectURL(this.audioBlob));
    this.startPlayback();
    this.audio.play();
  }

  private startPlayback() {
    const animate = (timestamp: number) => {
      if (this.startTime === null) {
        this.startTime = timestamp;
      }

      const currentTime = timestamp - this.startTime;
      const events = this.events.filter(
        (ev) =>
          ev.timestamp <= currentTime && ev.timestamp > this.lastPlayedTime
      );

      this.lastPlayedTime = currentTime;
      events.forEach((e) => this.playEvent(e));

      if (this.state === "playing") {
        this.rafId = requestAnimationFrame(animate);
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }

  stop() {
    this.state = "stopped";
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
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
