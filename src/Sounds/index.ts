import { IOscillatorNode, IAudioContext } from "standardized-audio-context";
import saw from './wavetables/saw';
import phonemeO from './wavetables/Phoneme_o';

type SynthSound = {
    name: string,
    sound: (audioContext: IAudioContext, f: number) => IOscillatorNode<IAudioContext>,
    buttonStyle?: React.CSSProperties
};

const makeOsc = (audioContext: IAudioContext) => {
    const osc = audioContext.createOscillator();
    osc.connect(audioContext.destination);
    return osc;
}

const buzz = (audioContext: IAudioContext, freq: number): IOscillatorNode<IAudioContext> => {
    const sawWave = audioContext.createPeriodicWave(saw.real, saw.imag); // TODO only init once
    const osc = makeOsc(audioContext);
    osc.setPeriodicWave(sawWave);
    osc.frequency.value = freq;
    return osc;
}

const bizz = (audioContext: IAudioContext, freq: number) => {
    const o = makeOsc(audioContext);
    o.type = "sawtooth";
    o.frequency.value = freq;
    return o;
}

const sayOh = (audioContext: IAudioContext, freq: number) => {
    const phonemeOWave = audioContext.createPeriodicWave(phonemeO.real, phonemeO.imag); // TODO only init once
    const o = makeOsc(audioContext)
    o.setPeriodicWave(phonemeOWave);
    o.frequency.value = freq;
    return o;
}

const wah = (audioContext: IAudioContext, freq: number) => {
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

const laser = (audioContext: IAudioContext, freq: number) => {
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

export const sounds: SynthSound[] = [
    //{ name: 'buzz', sound: buzz},
    { name: 'bizz', sound: bizz },
    { name: 'merrp', sound: sayOh, buttonStyle: { fontStyle: 'italic', borderColor: 'orange', borderWidth: 5 } },
    { name: 'wah', sound: wah, buttonStyle: { background: 'orange' } },
    { name: 'ZAPP', sound: laser, buttonStyle: { background: 'black', color: '#00FF00' } }
];