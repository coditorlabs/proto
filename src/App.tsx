import { useEffect, useRef, useState } from "react";
import { monaco } from "./lib/monaco";
import { Player } from "./lib/player";
import { Recorder } from "./lib/recorder";
import { RecordingData } from "./lib/types";
import "./userWorker";

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
  const [recordingData, setRecordingData] = useState<RecordingData>({
    events: [],
    initialValue: "",
    audioBlob: new Blob(),
    duration: 0,
  });

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
    player.current = new Player(_editor, recordingData);
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
      const recordedData = recorder.current.stop();
      console.log(recordedData);
      setRecordingData(recordedData);
      setIsRecording(false);
    }
  };

  const handleStartPlaying = () => {
    if (player.current && recordingData.events.length > 0) {
      player.current = new Player(editor!, recordingData);
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
          disabled={
            isRecording || isPlaying || recordingData.events.length === 0
          }
        >
          Start Playing
        </button>
      </div>
      <div style={{ width: "100vw", height: "100vh" }} ref={monacoEl}></div>
    </div>
  );
}
