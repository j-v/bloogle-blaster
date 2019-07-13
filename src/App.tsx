import React from 'react';
import './App.css';
import saw from './wavetables/saw';
import phonemeO from './wavetables/Phoneme_o';
import * as Bootstrap from 'react-bootstrap'

interface AppProps {

}

const initMidi = async (midiHandler: (msg: WebMidi.MIDIMessageEvent) => void) => {
  const midi = await navigator.requestMIDIAccess();
  midi.inputs.forEach((input: WebMidi.MIDIInput, key: string) => {
    console.log(key + ':' + input.name);
    input.onmidimessage = midiHandler;
  })
}

const App = (props: AppProps) => {
  const audioContext = new AudioContext({ latencyHint: 'interactive' });
  const sawWave = audioContext.createPeriodicWave(saw.real, saw.imag);
  const phonemeOWave = audioContext.createPeriodicWave(phonemeO.real, phonemeO.imag);

  // TODO why doesn't this work?
  //const makeOsc = () => audioContext.createOscillator().connect(audioContext.destination) as OscillatorNode;

  const makeOsc = () => {
    const c = audioContext.createOscillator();
    c.connect(audioContext.destination);
    return c;
  }

  const buzz = (freq: number) => {
    const osc = makeOsc();
    osc.setPeriodicWave(sawWave);
    osc.frequency.value = freq;
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
  }

  const bizz = (freq: number) => {
    const o = makeOsc();
    o.type = "sawtooth";
    o.frequency.value = freq;
    o.start();
    o.stop(audioContext.currentTime + 0.5);
  }

  const sayOh = (freq: number) => {
    const o = makeOsc()
    o.setPeriodicWave(phonemeOWave);
    o.frequency.value = freq;
    o.start();
    o.stop(audioContext.currentTime + 0.5);
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
  function makesound(sound: (f: number) => void): () => void {
    return () => sound(f);
  }

  return (
    <div>
      <h1>hey synth heads</h1>
      <Bootstrap.ButtonToolbar>
        <Bootstrap.Button variant='primary' size='lg' onClick={makesound(buzz)}>buzz</Bootstrap.Button>
        <Bootstrap.Button variant='light' size='lg' onClick={makesound(bizz)}>bizz</Bootstrap.Button>
        <Bootstrap.Button variant='light' size='lg' onClick={makesound(sayOh)}>merrp</Bootstrap.Button>
      </Bootstrap.ButtonToolbar>
    </div>
  );
}

export default App;
