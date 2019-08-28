import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import { AudioContext, IAudioContext, IOscillatorNode } from 'standardized-audio-context';
import './App.css';
import { sounds } from './Sounds';

interface AppProps {

}

const initMidi = async (midiHandler: (msg: WebMidi.MIDIMessageEvent) => void) => {
  const midi = await navigator.requestMIDIAccess();
  midi.inputs.forEach((input: WebMidi.MIDIInput, key: string) => {
    console.log(key + ':' + input.name);
    input.onmidimessage = midiHandler;
  })
}

const audioContext = new AudioContext({ latencyHint: 'interactive' });

const midiHandler = (msg: WebMidi.MIDIMessageEvent) => {
  console.log(msg);
  const noteToFreq = (note: number) => {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
  }
  var command = msg.data[0];
  var note = msg.data[1];
  var velocity = (msg.data.length > 2) ? msg.data[2] : 0; // a velocity value might not be included with a noteOff command

  const sayOh = sounds[1].sound; // TODO export sound directly probably is nicer
  switch (command) {
    case 152: // noteOn
      if (velocity > 0) {
        sayOh(audioContext, noteToFreq(note) * 4);
      } else {
        // do noteOff
      }
      break;
    case 136: // noteOff
      break;
    // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
  }
};

initMidi(midiHandler);

const f = 220;
function makesound(sound: (audioContext: IAudioContext, f: number) => IOscillatorNode<IAudioContext>, t?: number): () => void {
  return () => {
    const duration = 0.3;
    if (!t) {
      t = audioContext.currentTime;
    }
    const osc = sound(audioContext, f);
    osc.start(t);
    osc.stop(t + duration);
  }
}

let tempo = 120;
let currentNote = 0; // The note we are currently playing
const maxNote = 4;
let nextNoteTime = 0.0; // when the next note is due.
function nextNote() {
  const secondsPerBeat = 60.0 / tempo;

  nextNoteTime += secondsPerBeat; // Add beat length to last beat time

  // Advance the beat number, wrap to zero
  currentNote++;
  if (currentNote === maxNote) {
    currentNote = 0;
  }
}

const scheduleNote = (noteIndex: number, noteTime: number): void => {
  const sound = sounds[Math.floor(Math.random() * sounds.length)];
  makesound(sound.sound, noteTime)();
}

let timerID: number;
const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
function sequenceScheduler() {
  // while there are notes that will need to play before the next interval,
  // schedule them and advance the pointer.
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
      scheduleNote(currentNote, nextNoteTime); // TODO
      nextNote();
  }
  timerID = window.setTimeout(sequenceScheduler, lookahead);
}

const App = (props: AppProps) => {
  const [playing, setPlaying] = React.useState(false);

  const startSequence = () => {
    setPlaying(true);
    nextNoteTime = audioContext.currentTime;
    sequenceScheduler();
  }

  const stopSequence = () => {
    setPlaying(false);
    clearTimeout(timerID);
  }

  return (
    <div>
      <h1>hey synth heads</h1>
      <Bootstrap.ButtonToolbar>
        {sounds.map((soundData) => { return <Bootstrap.Button style={{ margin: 10, ...soundData.buttonStyle }} size='lg' 
        onMouseDown={makesound(soundData.sound)}>{soundData.name}</Bootstrap.Button>; })}
      </Bootstrap.ButtonToolbar>
      <Bootstrap.ButtonToolbar>
        { !playing && <Bootstrap.Button size='lg' onClick={startSequence}>Start</Bootstrap.Button>}
        { playing && <Bootstrap.Button size='lg' onClick={stopSequence}>Stop</Bootstrap.Button>}
      </Bootstrap.ButtonToolbar>
    </div>
  );
}

export default App;
