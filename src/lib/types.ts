import { monaco } from "./monaco";

export type EditorEvent =
  | {
      type: "cursor";
      timestamp: number;
      data: {
        position: monaco.Position;
        source?: string;
      };
    }
  | {
      type: "selection";
      timestamp: number;
      data: {
        range: monaco.IRange;
        source?: string;
      };
    }
  | {
      type: "text";
      timestamp: number;
      data: Array<{
        range: monaco.IRange;
        text: string;
      }>;
    };

export type RecordingData = {
  events: EditorEvent[];
  initialValue: string;
  audioBlob: Blob;
  duration: number;
};
