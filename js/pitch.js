import {freqToMidi} from './music.js';
/** One-note-at-a-time acoustic microphone detection, using YIN difference + silence gating. */
export class MicrophoneListener {
  constructor(onNote,onStatus){this.onNote=onNote;this.onStatus=onStatus;this.stream=null;this.ctx=null;this.analyser=null;this.timer=null;this.buffer=null;this.candidate=null;this.streak=0;this.lastVoiced=0;this.armed=true;this.lastSounding=null;}
  async start(){
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone access requires HTTPS or localhost.');
    if(this.stream)return;
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});}
    catch(e){throw new Error(e?.name==='NotAllowedError'?'Microphone permission was denied. Enable it in your browser settings.':`Cannot open microphone: ${e.message}`);}
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      this.ctx=new AudioCtx();await this.ctx.resume();
      this.stream=stream;
      const source=this.ctx.createMediaStreamSource(stream);
      this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=4096;source.connect(this.analyser);
      this.buffer=new Float32Array(this.analyser.fftSize);
      this.armed=true;this.lastVoiced=0;this.candidate=null;this.streak=0;this.lastSounding=null;
      this.timer=window.setInterval(()=>this._scan(),40);
    }catch(e){stream.getTracks().forEach(t=>t.stop());if(this.ctx)await this.ctx.close();this.ctx=null;throw e;}
  }
  _scan(){
    if(!this.analyser)return;
    this.analyser.getFloatTimeDomainData(this.buffer);
    const pitch=detectPitch(this.buffer,this.ctx.sampleRate);
    const now=performance.now();
    if(!pitch){
      if(now-this.lastVoiced>165){this.armed=true;this.lastSounding=null;this.candidate=null;this.streak=0;}
      return;
    }
    const midi=freqToMidi(pitch.frequency);
    if(!Number.isInteger(midi)||midi<21||midi>108)return;
    this.lastVoiced=now;
    if(midi===this.candidate)this.streak++;else{this.candidate=midi;this.streak=1;}
    if(this.streak<3)return;
    if(midi!==this.lastSounding)this.armed=true;
    this.lastSounding=midi;
    this.onStatus?.(midi);
    if(this.armed){this.armed=false;this.onNote?.(midi);}
  }
  async stop(){if(this.timer){clearInterval(this.timer);this.timer=null;}this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;if(this.ctx){await this.ctx.close().catch(()=>{});this.ctx=null;}this.analyser=null;}
}
function detectPitch(data, sampleRate){
  // Difference function and cumulative mean normalized difference (YIN).
  const N=data.length;
  let energy=0;
  for(let i=0;i<N;i++)energy+=data[i]*data[i];
  const rms=Math.sqrt(energy/N);
  if(rms<.012)return null;
  const minLag=Math.max(22,Math.floor(sampleRate/1100));
  const maxLag=Math.min(Math.floor(sampleRate/90),Math.floor(N/2)-1);
  const diffs=new Float32Array(maxLag+1);
  const windowSize=1024;
  for(let tau=1;tau<=maxLag;tau++){
    let delta=0;
    for(let i=0;i<windowSize;i+=2){const d=data[i]-data[i+tau];delta+=d*d;}
    diffs[tau]=delta;
  }
  let cumulative=0,bestLag=-1,bestValue=1;
  for(let tau=1;tau<=maxLag;tau++){
    cumulative+=diffs[tau];
    const cmnd=cumulative>0?diffs[tau]*tau/cumulative:1;
    if(tau>=minLag&&cmnd<.17){
      // Find local minimum: distinguish the real period from nearby lags.
      let t=tau;let val=cmnd;
      while(t<maxLag){const next=(diffs[t+1]*(t+1))/(cumulative+diffs[t+1]);if(next>=val)break;cumulative+=diffs[t+1];t++;val=next;}
      bestLag=t;bestValue=val;break;
    }
  }
  if(bestLag<0||bestValue>.17)return null;
  const a=diffs[Math.max(1,bestLag-1)],b=diffs[bestLag],c=diffs[Math.min(maxLag,bestLag+1)];
  const d=(a-2*b+c);const shift=Math.abs(d)>1e-9?Math.max(-1,Math.min(1,.5*(a-c)/d)):0;
  const frequency=sampleRate/(bestLag+shift);
  if(!Number.isFinite(frequency)||frequency<90||frequency>1100)return null;
  const semitone=69+12*Math.log2(frequency/440);
  if(Math.abs(semitone-Math.round(semitone))>.36)return null;
  return {frequency,confidence:1-bestValue};
}
