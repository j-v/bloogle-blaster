import React from 'react';
import './App.css';
import saw from './saw';

interface AppProps {

}
const App = (props: AppProps) => {
  const audioContext = new AudioContext();
  const wave = audioContext.createPeriodicWave(saw.real, saw.imag);
  const osc = audioContext.createOscillator();
  osc.setPeriodicWave(wave);
  osc.frequency.value = 440;
  osc.connect(audioContext.destination);

  const play = () => {
    osc.start();
    osc.stop(audioContext.currentTime + 1);
  }

  return (
    <div>
      <h1>hi</h1>
      <button onClick={play}>bleep</button>
    </div>
  );
}

export default App;
