import React from 'react';
import './App.css';
import saw from './wavetables/saw';
import phonemeO from './wavetables/Phoneme_o';
import * as Bootstrap from 'react-bootstrap'
import { AudioContext } from 'standardized-audio-context';

interface AppProps {

}

type SynthSound = {
  name: string,
  sound: (f: number) => void,
  buttonStyle?: React.CSSProperties
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

  const wah = (freq: number) => {
    const o = audioContext.createOscillator();
    o.type = "square";
    o.frequency.value = freq / 2;
    const filter = audioContext.createBiquadFilter();
    filter.frequency.cancelScheduledValues(audioContext.currentTime);
    filter.frequency.setValueAtTime(100, audioContext.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, audioContext.currentTime + 0.5);
    o.connect(filter).connect(audioContext.destination);
    o.start();
    o.stop(audioContext.currentTime + 0.5);
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

    d.connect(feedback);
    feedback.connect(d);
   
    o.connect(d).connect(audioContext.destination);
    o.start();
    o.stop(audioContext.currentTime + 0.35);
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

  const sounds: SynthSound[] = [
    //{ name: 'buzz', sound: buzz},
    { name: 'bizz', sound: bizz },
    { name: 'merrp', sound: sayOh, buttonStyle: { fontStyle: 'italic', borderColor: 'orange', borderWidth: 5} },
    { name: 'wah', sound: wah, buttonStyle: { background: 'orange' } },
    { name: 'ZAPP', sound: laser, buttonStyle: { background: 'black', color: '#00FF00' }}
  ]

  return (
    <div>
      <h1>hey synth heads</h1>
      <Bootstrap.ButtonToolbar>
        {sounds.map((soundData) => { return <Bootstrap.Button style={{ margin: 10, ...soundData.buttonStyle }} size='lg' onMouseDown={makesound(soundData.sound)}>{soundData.name}</Bootstrap.Button>; })}
      </Bootstrap.ButtonToolbar>
    </div>
  );
}

export default App;
