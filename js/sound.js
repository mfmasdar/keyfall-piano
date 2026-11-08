/* Keyfall original, locally sampled electric-piano-like instrument.
 * 21 individually generated electric tine samples, chromatically interpolated.
 * Sample generator: ./make_samples.py. No third-party CDN or sound service.
 */
const ROOTS=Array.from({length:21},(_,i)=>36+i*3);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const frequency=midi=>440*Math.pow(2,(midi-69)/12);

export class ElectricPiano {
 constructor(){this.ctx=null;this.buffers=new Map();this.loading=null;this.volume=.75;this.preset='tine';this.master=null;this.compressor=null;this.echo=null;this.wet=null;this.readyCount=0;this.onStatus=null;}
 context(){
  if(this.ctx)return this.ctx;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)throw new Error('This browser does not support Web Audio.');
  const a=this.ctx=new AudioCtor();
  this.master=a.createGain();this.master.gain.value=this.volume;
  this.compressor=a.createDynamicsCompressor();
  this.compressor.threshold.value=-16;this.compressor.knee.value=12;this.compressor.ratio.value=2.6;
  this.compressor.attack.value=.006;this.compressor.release.value=.20;
  this.master.connect(this.compressor);this.compressor.connect(a.destination);
  this.echo=a.createDelay(.4);this.echo.delayTime.value=.105;
  this.wet=a.createGain();this.wet.gain.value=.12;
  const filter=a.createBiquadFilter();filter.type='lowpass';filter.frequency.value=4200;
  this.echo.connect(filter);filter.connect(this.wet);this.wet.connect(this.master);
  return a;
 }
 unlock(){const ctx=this.context();if(ctx.state!=='running')ctx.resume().catch(()=>{});return ctx;}
 setVolume(value){this.volume=clamp(value,0,1);if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.025);}
 setPreset(name){this.preset=name==='warm'?'warm':'tine';}
 status(message){if(this.onStatus)this.onStatus(message);}
 async preload(){
  const ctx=this.unlock();
  if(this.loading)return this.loading;
  this.status('Loading electric-piano samples…');
  this.loading=Promise.all(ROOTS.map(async m=>{
   try{
    const res=await fetch(`./assets/electric-piano/${m}.mp3`);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const decoded=await ctx.decodeAudioData(await res.arrayBuffer());
    this.buffers.set(m,decoded);this.readyCount++;
   }catch(e){console.warn('Audio sample could not be loaded:',m,e);}
  })).then(()=>{
   this.status(this.readyCount?`Electric piano loaded · ${this.readyCount} samples ready`:'Using built-in synthesized fallback sound');
   return this.readyCount>0;
  });
  return this.loading;
 }
 rootFor(midi){return ROOTS.reduce((best,m)=>Math.abs(m-midi)<Math.abs(best-midi)?m:best,ROOTS[0]);}
 noteOn(midi,velocity=.85,when=null){
  const ctx=this.unlock();this.preload().catch(()=>{});
  const t=Math.max(ctx.currentTime,when??ctx.currentTime);
  const n=clamp(Math.round(midi),24,108);
  if(!this.buffers.size || !this.buffers.has(this.rootFor(n)))return this.fallback(n,velocity,t);
  const src=ctx.createBufferSource();const root=this.rootFor(n);
  src.buffer=this.buffers.get(root);src.playbackRate.value=Math.pow(2,(n-root)/12);
  const tone=ctx.createBiquadFilter();tone.type='lowpass';tone.frequency.value=this.preset==='warm'?2200:7500;tone.Q.value=.65;
  const amp=ctx.createGain();amp.gain.setValueAtTime(.0001,t);
  amp.gain.exponentialRampToValueAtTime(Math.max(.0001,clamp(velocity,0,1)*.82),t+.012);
  src.connect(tone);tone.connect(amp);amp.connect(this.master);
  const send=ctx.createGain();send.gain.value=.12;amp.connect(send);send.connect(this.echo);
  src.start(t);
  let released=false;
  return {release:(at=null)=>{
   if(released)return;released=true;
   const stop=Math.max(ctx.currentTime,at??ctx.currentTime,t+.11);
   amp.gain.cancelScheduledValues(stop);amp.gain.setValueAtTime(Math.max(.0001,amp.gain.value),stop);
   amp.gain.exponentialRampToValueAtTime(.0001,stop+.24);
   try{src.stop(stop+.3);}catch{}
  }};
 }
 // Physical-model fallback keeps the first tap audible even if samples have not loaded.
 fallback(midi,velocity,t){
  const ctx=this.ctx,f=frequency(midi),amp=ctx.createGain(),partial=[1,2.006,3.03,7.02];
  amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(Math.max(.0001,velocity*.40),t+.009);
  amp.gain.exponentialRampToValueAtTime(.0001,t+2.2);
  amp.connect(this.master);
  const oscs=partial.map((p,i)=>{const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=i===0?'sine':i===1?'triangle':'sine';osc.frequency.value=f*p;g.gain.value=[.75,.22,.08,.045][i]*(this.preset==='warm'&&i>0?.4:1);osc.connect(g);g.connect(amp);osc.start(t);osc.stop(t+2.28);return osc;});
  let released=false;
  return {release:()=>{if(released)return;released=true;const r=Math.max(ctx.currentTime,t+.09);amp.gain.cancelScheduledValues(r);amp.gain.setValueAtTime(.25*velocity,r);amp.gain.exponentialRampToValueAtTime(.0001,r+.21);}};
 }
 trigger(midi,time=null,duration=.6,velocity=.75){const ctx=this.unlock(),start=time??ctx.currentTime,voice=this.noteOn(midi,velocity,start);voice.release(start+Math.max(.16,duration));return voice;}
 close(){if(this.ctx)this.ctx.close().catch(()=>{});}
}
