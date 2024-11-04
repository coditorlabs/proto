import { useRef, useState, useEffect } from "react";
import { monaco } from "./lib/monaco";
import "./userWorker";
import { Recorder } from "./lib/recorder";
import { Player } from "./lib/player";
import { EditorEvent } from "./lib/types";

const code = ["function x() {", '\tconsole.log("Hello world!");', "}"].join(
  "\n"
);
export function App() {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const recorder = useRef<Recorder | null>(null);
  const player = useRef<Player | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [events, setEvents] = useState<EditorEvent[]>([]);

  useEffect(() => {
    if (!monacoEl.current || editor) {
      return;
    }
    const _editor = monaco.editor.create(monacoEl.current, {
      value: code,
      language: "typescript",
      automaticLayout: true,
      theme: "vs-dark",
    });
    recorder.current = new Recorder(_editor);
    player.current = new Player(_editor, [], code);
    setEditor(_editor);

    return () => {
      _editor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartRecording = () => {
    if (recorder.current) {
      recorder.current.record();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (recorder.current) {
      const recordedEvents = recorder.current.stop();
      console.log(recordedEvents);
      setEvents(recordedEvents);
      setIsRecording(false);
    }
  };

  const handleStartPlaying = () => {
    if (player.current && events.length > 0) {
      player.current = new Player(editor!, events, code);
      player.current.play();
      setIsPlaying(true);
    }
  };

  // const handleStopPlaying = () => {
  //   if (player.current) {
  //     // Assuming Player class has a stop method
  //     player.current.stop();
  //     setIsPlaying(false);
  //   }
  // };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 9999 }}>
        <button
          onClick={handleStartRecording}
          disabled={isRecording || isPlaying}
        >
          Start Recording
        </button>
        <button
          onClick={handleStopRecording}
          disabled={!isRecording || isPlaying}
        >
          Stop Recording
        </button>
        <button
          onClick={handleStartPlaying}
          disabled={isRecording || isPlaying || events.length === 0}
        >
          Start Playing
        </button>
      </div>
      <div style={{ width: "100vw", height: "100vh" }} ref={monacoEl}></div>
    </div>
  );
}
