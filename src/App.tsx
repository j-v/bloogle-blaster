import React from 'react';
import './App.css';
import saw from './wavetables/saw';
import phonemeO from './wavetables/Phoneme_o';
import * as Bootstrap from 'react-bootstrap'
import { AudioContext, IOscillatorNode, IAudioContext } from 'standardized-audio-context';

interface AppProps {

}

type SynthSound = {
  name: string,
  sound: (f: number) => IOscillatorNode<IAudioContext>,
  buttonStyle?: React.CSSProperties
}

const initMidi = async (midiHandler: (msg: WebMidi.MIDIMessageEvent) => void) => {
  const midi = await navigator.requestMIDIAccess();
  midi.inputs.forEach((input: WebMidi.MIDIInput, key: string) => {
    console.log(key + ':' + input.name);
    input.onmidimessage = midiHandler;
  })
}


const audioContext = new AudioContext({ latencyHint: 'interactive' });
const sawWave = audioContext.createPeriodicWave(saw.real, saw.imag);
const phonemeOWave = audioContext.createPeriodicWave(phonemeO.real, phonemeO.imag);

// TODO why doesn't this work?
//const makeOsc = () => audioContext.createOscillator().connect(audioContext.destination) as OscillatorNode;

const makeOsc = () => {
  const osc = audioContext.createOscillator();
  osc.connect(audioContext.destination);
  return osc;
}

const buzz = (freq: number): IOscillatorNode<IAudioContext> => {
  const osc = makeOsc();
  osc.setPeriodicWave(sawWave);
  osc.frequency.value = freq;
  return osc;
}

const bizz = (freq: number) => {
  const o = makeOsc();
  o.type = "sawtooth";
  o.frequency.value = freq;
  return o;
}

const sayOh = (freq: number) => {
  const o = makeOsc()
  o.setPeriodicWave(phonemeOWave);
  o.frequency.value = freq;
  return o;
}

const wah = (freq: number) => {
  const o = audioContext.createOscillator();
  o.type = "square";
  o.frequency.value = freq / 2;
  const filter = audioContext.createBiquadFilter();
  filter.frequency.cancelScheduledValues(audioContext.currentTime);
  filter.frequency.setValueAtTime(100, audioContext.currentTime);
  filter.frequency.linearRampToValueAtTime(2000, audioContext.currentTime + 0.5);
  o.connect(filter).connect(audioContext.destination);
  return o;
}

const laser = (freq: number) => {
  const o = audioContext.createOscillator();
  o.type = "square";
  o.frequency.value = freq / 2;
  o.frequency.cancelScheduledValues(audioContext.currentTime);
  o.frequency.setValueAtTime(freq * 4, audioContext.currentTime);
  o.frequency.linearRampToValueAtTime(20, audioContext.currentTime + 0.35);

  const d = audioContext.createDelay();
  d.delayTime.value = 0.12;
  
  const feedback = audioContext.createGain();
  feedback.gain.value = 0.4;

  const m = audioContext.createChannelMerger(2);
  o.connect(m, 0, 0);
  d.connect(m, 0, 1);

  d.connect(feedback);
  feedback.connect(d);
 
  //o.connect(d).connect(audioContext.destination);
  o.connect(d);
  m.connect(audioContext.destination);
  return o;
}

const midiHandler = (msg: WebMidi.MIDIMessageEvent) => {
  console.log(msg);
  const noteToFreq = (note: number) => {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
  }
  var command = msg.data[0];
  var note = msg.data[1];
  var velocity = (msg.data.length > 2) ? msg.data[2] : 0; // a velocity value might not be included with a noteOff command

  switch (command) {
    case 152: // noteOn
      if (velocity > 0) {
        sayOh(noteToFreq(note) * 4);
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
function makesound(sound: (f: number) => IOscillatorNode<IAudioContext>, t?: number): () => void {
  return () => {
    const duration = 0.3;
    if (!t) {
      t = audioContext.currentTime;
    }
    t = audioContext.currentTime; // test
    const osc = sound(f);
    osc.start(t);
    osc.stop(t + duration);
  }
}

const sounds: SynthSound[] = [
  //{ name: 'buzz', sound: buzz},
  { name: 'bizz', sound: bizz },
  { name: 'merrp', sound: sayOh, buttonStyle: { fontStyle: 'italic', borderColor: 'orange', borderWidth: 5} },
  { name: 'wah', sound: wah, buttonStyle: { background: 'orange' } },
  { name: 'ZAPP', sound: laser, buttonStyle: { background: 'black', color: '#00FF00' }}
];

let tempo = 240;
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
  //console.log(noteIndex);
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
