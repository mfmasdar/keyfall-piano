import {parseMusicXML,parseMIDI,applyTrack,noteName,isBlack,staffSVG,midiToFreq} from './music.js';
import {MicrophoneListener} from './pitch.js';
import {ElectricPiano} from './sound.js';
const $=id=>document.getElementById(id);
const SONGS=[
 {id:'twinkle',file:'twinkle.musicxml',title:'Twinkle, Twinkle, Little Star',by:'Traditional',type:'song',hint:'A familiar first melody',art:'♫'},
 {id:'ode',file:'ode-to-joy.musicxml',title:'Ode to Joy',by:'Ludwig van Beethoven',type:'classical',hint:'A first classical melody',art:'♬'},
 {id:'mary',file:'mary-had-a-little-lamb.musicxml',title:'Mary Had a Little Lamb',by:'Traditional',type:'song',hint:'Easy repeating notes',art:'♪'},
 {id:'frere',file:'frere-jacques.musicxml',title:'Frère Jacques',by:'Traditional',type:'song',hint:'Great for short phrases',art:'♫'},
 {id:'london',file:'london-bridge.musicxml',title:'London Bridge',by:'Traditional',type:'song',hint:'Familiar simple melody',art:'♩'},
 {id:'row',file:'row-your-boat.musicxml',title:'Row, Row, Row Your Boat',by:'Traditional',type:'song',hint:'Melody with quicker notes',art:'♬'},
 {id:'jingle',file:'jingle-bells.musicxml',title:'Jingle Bells (Chorus)',by:'J. L. Pierpont',type:'song',hint:'A cheerful familiar tune',art:'♫'},
 {id:'saints',file:'saints.musicxml',title:'When the Saints Go Marching In',by:'Traditional',type:'song',hint:'Gentle repeated patterns',art:'♪'},
 {id:'scale',file:'scale.musicxml',title:'C Major Scale',by:'Keyfall exercise',type:'exercise',hint:'Go up and down the keys',art:'↗'},
 {id:'arpeggio',file:'arpeggio.musicxml',title:'C Major Arpeggio',by:'Keyfall exercise',type:'exercise',hint:'Learn to skip between keys',art:'♧'},
 {id:'chords',file:'chords.musicxml',title:'First Piano Chords',by:'Keyfall exercise',type:'exercise',hint:'Play three notes together',art:'≋'}
];
const state={baseSong:null,song:null,selected:'twinkle',mode:'wait',index:0,hit:new Set(),hitByGroup:new Map(),locked:false,animation:0,generation:0,
 min:60,max:83,keyX:new Map(),keyWidth:46,whiteCount:0,lastPressed:null,correctUntil:new Map(),
 mic:null,midiAccess:null,midiHandlers:new Map(),positionBeat:0,playing:false,lastTick:0,lastFrame:0,raf:0,bpm:70,
 guidePlayed:new Set(),audio:null,selectedHand:'both',previewCache:new Map()};
const viewport=$('instrument-viewport');
const instrument=new ElectricPiano();
const pointerVoices=new Map();
const computerVoices=new Map();
instrument.onStatus=message=>{if($('audio-status'))$('audio-status').textContent=message;};
function feedback(message,error=false){$('input-message').textContent=message;$('input-message').classList.toggle('error',error);$('studio-message').textContent=message;$('studio-message').classList.toggle('error',error);}
function loadStatus(message,error=false){$('load-status').textContent=message;$('load-status').classList.toggle('error',error);}
function slugTitle(filename){return filename.replace(/\.(musicxml|xml|mid|midi)$/i,'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function makeLibrary(){
 const search=$('song-search').value.trim().toLowerCase(),kind=$('library-filter').value;
 const filtered=SONGS.filter(s=>(kind==='all'||s.type===kind)&&`${s.title} ${s.by} ${s.hint}`.toLowerCase().includes(search));
 $('song-grid').innerHTML='';
 for(const song of filtered){
  const item=document.createElement('div');item.className='song-card'+(state.selected===song.id?' active':'');
  const load=document.createElement('button');load.type='button';load.className='song-load';load.dataset.song=song.id;
  load.setAttribute('aria-label',`Load ${song.title}`);
  const art=document.createElement('span');art.className=`song-art art-${song.type==='exercise'?'blue':song.type==='classical'?'purple':'peach'}`;art.textContent=song.art;
  const info=document.createElement('span');info.className='song-text';const title=document.createElement('strong');title.textContent=song.title;const subt=document.createElement('small');subt.textContent=`${song.by} · ${song.hint}`;info.append(title,subt);
  const arrow=document.createElement('span');arrow.className='song-arrow';arrow.textContent='→';load.append(art,info,arrow);
  const preview=document.createElement('button');preview.type='button';preview.className='preview-button';preview.dataset.preview=song.id;preview.textContent='♫ Listen';preview.setAttribute('aria-label',`Preview ${song.title}`);
  item.append(load,preview);$('song-grid').appendChild(item);
 }
 $('library-count').textContent=`${filtered.length} ${filtered.length===1?'piece':'pieces'}`;
 if(!filtered.length){const none=document.createElement('p');none.className='no-results';none.textContent='No matches. Try a different search.';$('song-grid').append(none);}
}
async function getBuiltIn(meta){
 if(state.previewCache.has(meta.id))return state.previewCache.get(meta.id);
 const response=await fetch('./samples/'+meta.file);if(!response.ok)throw new Error(`Cannot load ${meta.title} (${response.status}).`);
 const blob=await response.blob(),song=parseMusicXML(await blob.text(),meta.title);state.previewCache.set(meta.id,song);return song;
}
function stopFlow(){state.playing=false;cancelAnimationFrame(state.raf);state.raf=0;state.lastTick=0;}
function resetProgress(){stopFlow();state.generation++;state.index=0;state.hit=new Set();state.hitByGroup=new Map();state.locked=false;state.animation=0;state.positionBeat=0;state.guidePlayed=new Set();state.correctUntil.clear();state.lastPressed=null;}
function activateSong(base){resetProgress();state.baseSong=base;state.selectedHand='both';$('hand-select').value='both';
 state.song=applyTrack(base,base.selectedTrack??0,'both');populateTrackControls();showSong();
 loadStatus(`Loaded “${state.song.title}” — ready to practise.`);
 feedback(state.mode==='wait'?'Play the highlighted key(s). The music waits until each is correct.':'Press Play. The falling notes will continue at the selected tempo.');
}
function showSong(){const song=state.song;$('piece-title').textContent=song.title;$('piece-caption').textContent=`${song.subtitle} · ${song.groups.length} steps · ${song.partName}`;makeKeyboard(song.groups);renderAll();updateReadySummary();}
async function loadSong(blob,label){try{
 if(blob.size>5*1024*1024)throw new Error('Choose a file under 5 MB.');
 const midi=/\.(mid|midi)$/i.test(label)||['audio/midi','audio/x-midi'].includes(blob.type);
 const base=midi?parseMIDI(await blob.arrayBuffer(),slugTitle(label)):parseMusicXML(await blob.text(),slugTitle(label));
 state.selected='';makeLibrary();activateSong(base);
 }catch(e){loadStatus(e?.message||'Could not load this file.',true);console.error('Import error:',e);}}
async function fetchAndLoad(url,label){loadStatus('Loading score…');try{const res=await fetch(url);if(!res.ok)throw new Error(`HTTP ${res.status}`);await loadSong(await res.blob(),label);}catch(e){loadStatus(`${e.message}. If this is an online file, download it and choose Upload instead.`,true);}}
async function pickSample(id){const meta=SONGS.find(s=>s.id===id);if(!meta)return;try{loadStatus('Loading song…');const song=await getBuiltIn(meta);state.selected=id;makeLibrary();activateSong(song);}catch(e){loadStatus(e.message,true);}}
function populateTrackControls(){const {tracks,format,selectedTrack}=state.song,sel=$('track-select');sel.innerHTML='';tracks.forEach((part,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=`${part.name} (${part.notes.length} notes)`;sel.appendChild(opt);});sel.value=String(selectedTrack);
 const hasTwo=tracks.some(t=>t.notes.some(n=>n.staff==='2'));$('hand-select').disabled=!hasTwo;$('hand-select').value='both';
 $('track-hint').textContent=format==='MIDI'?'Choose only the piano or melody track; drums are excluded.':hasTwo?'Choose a MusicXML staff for right- or left-hand practice.':'This score has one notated staff.';
 $('track-controls').hidden=tracks.length===1&&!hasTwo;
}
function chooseTrackOrHand(){const n=+$('track-select').value,hand=$('hand-select').value;
 try{const candidate=applyTrack(state.baseSong,n,hand);resetProgress();state.song=candidate;state.selectedHand=hand;showSong();loadStatus(`Practising ${candidate.partName}${hand==='both'?'':` · ${hand} hand`}.`);}catch(e){loadStatus(e.message,true);$('track-select').value=String(state.song.selectedTrack);$('hand-select').value=state.selectedHand;}}
function makeKeyboard(groups){
 const pitches=groups.flatMap(g=>g.notes.map(n=>n.midi));const low=Math.min(...pitches),high=Math.max(...pitches);
 state.min=Math.max(24,Math.floor(low/12)*12);state.max=Math.min(107,Math.max(state.min+23,(Math.floor(high/12)+2)*12-1));
 // Let short beginner keyboards fill the available Studio width, while longer
 // arrangements remain horizontally scrollable on smaller screens.
 const visible=!$('studio-page').classList.contains('hidden');
 const whiteKeys=Array.from({length:state.max-state.min+1},(_,i)=>state.min+i).filter(m=>!isBlack(m)).length;
 state.keyWidth=visible&&viewport.clientWidth?Math.max(46,Math.min(78,Math.floor((viewport.clientWidth-2)/whiteKeys))):46;
 $('instrument-inner').style.setProperty('--key-w',state.keyWidth+'px');
 state.keyX=new Map();let whites=0;
 for(let m=state.min;m<=state.max;m++)if(!isBlack(m))state.keyX.set(m,{x:whites++*state.keyWidth+state.keyWidth/2,black:false});
 state.whiteCount=whites;const totalWidth=whites*state.keyWidth;
 $('instrument-inner').style.width=totalWidth+'px';const piano=$('piano');piano.innerHTML='';$('fall-lines').innerHTML='';
 for(let m=state.min;m<=state.max;m++)if(!isBlack(m)){
  const x=state.keyX.get(m).x,line=document.createElement('div');line.className='lane-line';line.style.left=(x+state.keyWidth/2)+'px';$('fall-lines').appendChild(line);
  const key=document.createElement('button');key.type='button';key.className='key white';key.dataset.note=m;key.style.left=(x-state.keyWidth/2)+'px';key.setAttribute('aria-label',`Play ${noteName(m)}`);
  if(m%12===0){const tag=document.createElement('span');tag.className='key-label';tag.textContent=noteName(m);key.append(tag);}piano.appendChild(key);
 }
 for(let m=state.min;m<=state.max;m++)if(isBlack(m)){
  const prev=state.keyX.get(m-1),next=state.keyX.get(m+1);if(!prev||!next)continue;
  const x=(prev.x+next.x)/2;state.keyX.set(m,{x,black:true});const key=document.createElement('button');key.type='button';key.className='key black';key.dataset.note=m;key.style.left=(x-state.keyWidth*.31)+'px';key.style.width=(state.keyWidth*.62)+'px';key.setAttribute('aria-label',`Play ${noteName(m)}`);piano.appendChild(key);
 }
 const playable=new Set(pitches);piano.querySelectorAll('.key').forEach(key=>{if(!playable.has(+key.dataset.note))key.classList.add('outside-song');});viewport.scrollLeft=0;
}
function currentGroup(){return state.song?.groups[state.index];}
function groupHit(index){return state.mode==='wait'?state.hit:(state.hitByGroup.get(index)||new Set());}
function updateFlowIndex(){if(!state.song)return;
 const groups=state.song.groups;let i=0;while(i+1<groups.length&&groups[i+1].time<=state.positionBeat)i++;
 const last=groups[groups.length-1];const end=Math.max(...last.notes.map(n=>last.time+n.duration));
 if(state.positionBeat>=end+.30){stopFlow();state.index=groups.length;renderAll();feedback('The song has finished. Press Restart to play it again.');return;}
 if(i!==state.index){state.index=i;renderControls();renderScore();scrollToTarget();}
}
function renderAll(){renderModeControls();renderControls();renderKeyboard();renderFalling();renderScore();scrollToTarget();}
function renderModeControls(){
 const wait=state.mode==='wait';$('mode-wait').classList.toggle('active',wait);$('mode-flow').classList.toggle('active',!wait);
 $('mode-wait').setAttribute('aria-pressed',String(wait));$('mode-flow').setAttribute('aria-pressed',String(!wait));
 $('mode-description').textContent=wait?'The next falling notes pause over their keys until you play every highlighted note correctly.':'The notes keep falling at the selected tempo, whether you play them or miss them. Correct notes flash green near the timing line.';
 $('stage-indicator').innerHTML=`<span class="stage-pulse"></span> ${wait?'WAIT FOR CORRECT NOTE':'CONTINUOUS PLAY MODE'}`;
 $('play-button').hidden=wait;$('play-button').textContent=state.playing?'Ⅱ Pause':'▶ Play';$('play-button').setAttribute('aria-pressed',String(state.playing));
 $('tempo-select').disabled=wait;$('guide-sound').disabled=wait;
}
function renderControls(){
 const groups=state.song?.groups||[],done=state.index>=groups.length,target=currentGroup();
 $('step-count').textContent=done?'SONG COMPLETE':`NOTE ${state.index+1} OF ${groups.length}`;
 $('progress-fill').style.width=(groups.length?(done?100:state.mode==='wait'?state.index/groups.length*100:Math.min(100,state.positionBeat/(Math.max(1,groups.at(-1).time+1))*100)):0)+'%';
 const next=target?.notes.map(n=>noteName(n.midi))||[];
 $('stage-note').innerHTML=done?'FINISHED <b>✓</b>':'PLAY <b>'+next.join(' + ')+'</b>';
 const donePitches=groupHit(state.index);
 $('target-notes').innerHTML=done?'<span class="note-chip">Song finished ✓</span>':(target?.notes||[]).map(n=>`<span class="note-chip ${donePitches.has(n.midi)?'done':''}">${noteName(n.midi)}</span>`).join('');
 $('stage-subtitle').textContent=done?'Try again or choose another song.':state.mode==='wait'?(state.locked?'Great! Next notes coming…':state.hit.size?'Good start — finish the highlighted keys.':'Notes move when you do.'):(state.playing?'Follow the rhythm. Green keys mean correct notes.':'Press Play to start the moving notes.');
}
function renderKeyboard(){const now=performance.now(),target=new Set(currentGroup()?.notes.map(n=>n.midi)||[]),hits=groupHit(state.index);
 $('piano').querySelectorAll('.key').forEach(key=>{const midi=+key.dataset.note,correct=(state.correctUntil.get(midi)||0)>now;
  key.classList.toggle('target',target.has(midi)&&!hits.has(midi));key.classList.toggle('played',hits.has(midi));key.classList.toggle('correct',correct);
  key.classList.toggle('last-pressed',state.lastPressed===midi&&!correct);key.setAttribute('aria-pressed',String(target.has(midi)));
 });
}
function renderFalling(){if(!state.song)return;
 const groups=state.song.groups,flow=state.mode==='flow',current=state.index;let html='';
 const from=flow?Math.max(0,current-5):current;
 for(let i=from;i<groups.length;i++){
  const group=groups[i],distance=flow?group.time-state.positionBeat:i-current-state.animation;
  const bottom=11+distance*78;if(bottom>310){if(flow||i>current+6)break;continue;}if(bottom< -100)continue;
  const eligible=flow?Math.abs(distance)<.48:i===current&&!state.locked,hits=flow?state.hitByGroup.get(i):i===current?state.hit:null;
  for(const note of group.notes){const k=state.keyX.get(note.midi);if(!k)continue;
   const w=k.black?29:36,h=Math.min(100,Math.max(30,note.duration*24+18));const lit=hits?.has(note.midi);
   const opacity=flow?(distance<-.25?.5:distance>3?.7:1):(i===current?1:Math.max(.45,1-distance*.14));
   html+=`<div class="note-bar ${k.black?'black-bar':''} ${eligible?'current':''} ${lit?'partial':''}" style="left:${k.x-w/2}px;width:${w}px;height:${h}px;bottom:${bottom}px;opacity:${opacity}"><span>${noteName(note.midi)}</span></div>`;
  }
 }
 $('fall-bars').innerHTML=html;
}
function renderScore(){if(state.song)$('score-preview').innerHTML=staffSVG(state.song.groups,state.index,window.innerWidth<=600?5:10);}
function scrollToTarget(){const target=currentGroup();if(!target)return;
 const x=target.notes.reduce((a,n)=>a+(state.keyX.get(n.midi)?.x||0),0)/target.notes.length;
 viewport.scrollTo({left:Math.max(0,x-viewport.clientWidth/2),behavior:'smooth'});
}
function flashCorrect(midi){state.correctUntil.set(midi,performance.now()+750);renderKeyboard();setTimeout(()=>renderKeyboard(),790);}
function playNote(midi,source){
 if(!state.song||state.index>=state.song.groups.length)return;
 state.lastPressed=midi;if(source==='midi'||source==='microphone'){$('heard-note').textContent='Heard '+noteName(midi);$('studio-heard-note').textContent='Heard '+noteName(midi);}
 if(state.mode==='wait'){
  if(state.locked)return;
  const group=currentGroup(),target=new Set(group.notes.map(n=>n.midi));
  if(!target.has(midi)){
   feedback(`Heard ${noteName(midi)}. Try ${group.notes.filter(n=>!state.hit.has(n.midi)).map(n=>noteName(n.midi)).join(' + ')}.`);
   renderKeyboard();setTimeout(()=>{if(state.lastPressed===midi){state.lastPressed=null;renderKeyboard();}},290);return;
  }
  state.hit.add(midi);flashCorrect(midi);renderFalling();renderControls();
  if([...target].every(n=>state.hit.has(n)))advanceWait();else feedback(`Correct! ${group.notes.filter(n=>!state.hit.has(n.midi)).map(n=>noteName(n.midi)).join(' + ')} still needed.`);
 }else{
  if(!state.playing){feedback('Press Play first to start continuous practice.');return;}
  const maxBeats=state.bpm/60*.50;
  let chosen=-1,diff=Infinity;
  state.song.groups.forEach((group,i)=>{
   const delta=Math.abs(group.time-state.positionBeat);if(delta>maxBeats||delta>=diff)return;
   if(!group.notes.some(n=>n.midi===midi))return;
   if(state.hitByGroup.get(i)?.has(midi))return;
   chosen=i;diff=delta;
  });
  if(chosen===-1){feedback(`${noteName(midi)} heard. Follow the highlighted key when its note reaches the line.`);renderKeyboard();setTimeout(()=>{if(state.lastPressed===midi){state.lastPressed=null;renderKeyboard();}},300);return;}
  if(!state.hitByGroup.has(chosen))state.hitByGroup.set(chosen,new Set());state.hitByGroup.get(chosen).add(midi);
  flashCorrect(midi);renderFalling();renderControls();feedback(`✓ ${noteName(midi)} — correct timing! Keep going.`);
 }
}
function advanceWait(){if(state.locked)return;state.locked=true;renderControls();
 const duration=480,start=performance.now(),generation=state.generation;
 function frame(now){if(state.mode!=='wait'||generation!==state.generation)return;
  const t=Math.min(1,(now-start)/duration);state.animation=1-Math.pow(1-t,3);renderFalling();
  if(t<1)requestAnimationFrame(frame);
  else{state.index++;state.hit=new Set();state.locked=false;state.animation=0;state.lastPressed=null;renderAll();
   feedback(state.index>=state.song.groups.length?'You played the whole piece! Press Restart to practise again.':'Correct! Play the next highlighted note.');}
 }
 requestAnimationFrame(frame);
}
function setMode(mode){if(!['wait','flow'].includes(mode)||mode===state.mode)return;
 resetProgress();state.mode=mode;renderAll();updateReadySummary();feedback(mode==='wait'?'Wait mode: each note stays until you play it correctly.':'Continuous mode: press Play. The notes continue even if you miss them.');
}
function getAudio(){return instrument.context();}
async function unlockAudio(){try{const audio=instrument.unlock();await instrument.preload();state.audio=audio;return audio;}catch(e){feedback(e.message,true);return null;}}
function soundNote(midi,time,duration=.25,volume=.045){instrument.trigger(midi,time,duration,Math.min(1,volume*12));}
function updateReadySummary(){const s=state.song;
 if(s)$('ready-summary').textContent=`${s.title} · ${state.mode==='wait'?'Wait for correct note':'Continuous play'} · ${state.bpm} BPM`;
 $('studio-mode-label').textContent=state.mode==='wait'?'WAIT FOR CORRECT NOTE':'CONTINUOUS PLAY';
}
function setPage(page){const inStudio=page==='studio';
 $('setup-page').classList.toggle('hidden',inStudio);$('studio-page').classList.toggle('hidden',!inStudio);
 $('nav-setup').classList.toggle('active',!inStudio);$('nav-studio').classList.toggle('active',inStudio);
 window.scrollTo({top:0,behavior:'instant'});
 if(inStudio){makeKeyboard(state.song.groups);renderAll();requestAnimationFrame(()=>scrollToTarget());}
}
async function enterStudio(){if(!state.song){loadStatus('Choose a song first.',true);return;}
 const btn=$('begin-button');btn.disabled=true;btn.innerHTML='Preparing piano sound…';
 try{await unlockAudio();}finally{btn.disabled=false;btn.innerHTML='Enter practice studio <span aria-hidden="true">→</span>';}
 if(state.index>=state.song.groups.length)resetProgress();
 updateReadySummary();setPage('studio');
 feedback(state.mode==='wait'?'Your studio is ready. Play the highlighted notes to move forward.':'Studio ready. Press Play to start the falling notes.');
}
async function previewSong(id){const meta=SONGS.find(s=>s.id===id);if(!meta)return;
 try{const audio=await unlockAudio();if(!audio)return;const song=await getBuiltIn(meta);const start=audio.currentTime+.06,groups=song.groups.slice(0,9);
  for(const g of groups)for(const note of g.notes)soundNote(note.midi,start+g.time*.35,Math.min(.35,note.duration*.3),.038);
  loadStatus(`Playing a short preview of “${song.title}”.`);
 }catch(e){loadStatus('Preview unavailable: '+e.message,true);}
}
async function toggleFlow(){if(state.mode!=='flow'||!state.song)return;
 if(state.playing){stopFlow();renderAll();feedback('Continuous play paused.');return;}
 if(state.index>=state.song.groups.length){resetProgress();renderAll();}
 if($('guide-sound').checked){const audio=await unlockAudio();if(!audio)return;}
 state.playing=true;state.lastTick=performance.now();state.lastFrame=0;
 renderModeControls();renderControls();feedback('Continuous play is running. Match the keys when falling notes reach the line.');
 state.raf=requestAnimationFrame(flowFrame);
}
function flowFrame(now){if(!state.playing||state.mode!=='flow')return;
 const elapsed=Math.min(.13,Math.max(0,(now-state.lastTick)/1000));state.lastTick=now;
 state.positionBeat+=elapsed*state.bpm/60;
 // Play guide notes at their scheduled onsets; the browser synthesizes these locally.
 if($('guide-sound').checked&&state.audio?.state==='running'){
  for(let i=0;i<state.song.groups.length;i++){
   const g=state.song.groups[i];if(g.time>state.positionBeat)break;
   if(state.guidePlayed.has(i))continue;state.guidePlayed.add(i);
   for(const note of g.notes)soundNote(note.midi,state.audio.currentTime+.01,Math.min(.6,note.duration*60/state.bpm*.73),.028);
  }
 }
 updateFlowIndex();if(!state.playing)return;
 if(now-state.lastFrame>28){state.lastFrame=now;renderFalling();renderKeyboard();renderControls();}
 state.raf=requestAnimationFrame(flowFrame);
}
function setTab(tab){document.querySelectorAll('.source-tab').forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active));});
 for(const name of ['library','upload','url'])$('source-'+name).classList.toggle('hidden',name!==tab);
}
async function connectMic(){
 if(state.mic){await state.mic.stop();state.mic=null;$('mic-button').classList.remove('connected');$('mic-action').textContent='Connect →';feedback('Microphone disconnected. Touch and MIDI input are still available.');return;}
 const mic=new MicrophoneListener(n=>playNote(n,'microphone'),n=>{$('heard-note').textContent='Listening · '+noteName(n);});$('mic-action').textContent='Connecting…';
 try{await mic.start();state.mic=mic;$('mic-button').classList.add('connected');$('mic-action').textContent='Disconnect';
  $('guide-sound').checked=false;feedback('Microphone connected. Guide sound switched off to avoid the microphone detecting its own playback.');}
 catch(e){$('mic-action').textContent='Connect →';feedback(e.message,true);}
}
async function connectMIDI(){
 if(state.midiAccess){for(const [input,handler] of state.midiHandlers)input.removeEventListener('midimessage',handler);
  state.midiHandlers.clear();state.midiAccess.onstatechange=null;state.midiAccess=null;$('midi-button').classList.remove('connected');$('midi-action').textContent='Connect →';feedback('MIDI disconnected.');return;}
 if(!navigator.requestMIDIAccess){feedback('Web MIDI is not supported here. iPad Safari users can choose microphone or touch; desktop Chrome/Edge support MIDI.',true);return;}
 try{const access=await navigator.requestMIDIAccess({sysex:false});state.midiAccess=access;
  function attach(){for(const [input,handler] of state.midiHandlers)input.removeEventListener('midimessage',handler);state.midiHandlers.clear();
   access.inputs.forEach(input=>{const handler=e=>{const d=e.data||[];if((d[0]&0xf0)===0x90&&d[2]>0)playNote(d[1],'midi');};input.addEventListener('midimessage',handler);state.midiHandlers.set(input,handler);});
   $('midi-button').classList.toggle('connected',access.inputs.size>0);$('midi-action').textContent='Disconnect';
   feedback(access.inputs.size?'MIDI connected: '+[...access.inputs.values()].map(i=>i.name||'Keyboard').join(', '):'MIDI access granted. Connect and play a keyboard to detect notes.');
  }access.onstatechange=attach;attach();
 }catch(e){feedback(`MIDI connection failed: ${e.message}`,true);}
}
function setup(){
 $('song-search').addEventListener('input',makeLibrary);$('library-filter').addEventListener('change',makeLibrary);
 $('song-grid').addEventListener('click',e=>{const prev=e.target.closest('[data-preview]'),load=e.target.closest('[data-song]');if(prev)previewSong(prev.dataset.preview);else if(load)pickSample(load.dataset.song);});
 document.querySelectorAll('.source-tab').forEach(button=>button.addEventListener('click',()=>setTab(button.dataset.tab)));
 $('file-input').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)loadSong(file,file.name);e.target.value='';});
 const drop=$('dropzone');for(const type of ['dragenter','dragover'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('over');});
 for(const type of ['dragleave','drop'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('over');});
 drop.addEventListener('drop',e=>{const file=e.dataTransfer?.files?.[0];if(file)loadSong(file,file.name);});
 $('url-form').addEventListener('submit',e=>{e.preventDefault();try{const url=new URL($('music-url').value.trim());if(!['https:','http:'].includes(url.protocol))throw new Error('Use an HTTPS or HTTP file URL.');
  const name=url.pathname.split('/').pop()||'remote.musicxml';fetchAndLoad(url.href,name);
 }catch(err){loadStatus(err.message,true);}});
 $('reset-button').addEventListener('click',()=>{if(!state.song)return;resetProgress();renderAll();feedback('Restarted from the beginning.');});
 $('score-toggle').addEventListener('click',()=>{const hidden=$('score-card').classList.toggle('hidden');$('score-toggle').textContent=hidden?'♫ Show score':'♫ Hide score';$('score-toggle').setAttribute('aria-expanded',String(!hidden));});
 $('track-select').addEventListener('change',chooseTrackOrHand);$('hand-select').addEventListener('change',chooseTrackOrHand);
 $('mode-wait').addEventListener('click',()=>setMode('wait'));$('mode-flow').addEventListener('click',()=>setMode('flow'));
 $('play-button').addEventListener('click',toggleFlow);$('tempo-select').addEventListener('change',e=>{state.bpm=+e.target.value;updateReadySummary();feedback(`Tempo set to ${state.bpm} BPM.`);});
 $('guide-sound').addEventListener('change',e=>{if(e.target.checked&&state.mic){e.target.checked=false;feedback('Disconnect the microphone before enabling guide sound, to avoid false detection.',true);}else feedback(e.target.checked?'Guide piano sound enabled for continuous mode.':'Guide piano sound disabled.');});
 $('piano').addEventListener('pointerdown',e=>{
  const key=e.target.closest('.key');if(!key)return;e.preventDefault();
  const note=+key.dataset.note;
  if($('key-sound').checked){const voice=instrument.noteOn(note,.80);pointerVoices.set(e.pointerId,voice);}
  try{key.setPointerCapture(e.pointerId);}catch{}
  playNote(note,'touch');
 });
 const releasePointer=e=>{const voice=pointerVoices.get(e.pointerId);if(voice){voice.release();pointerVoices.delete(e.pointerId);}};
 $('piano').addEventListener('pointerup',releasePointer);
 $('piano').addEventListener('pointercancel',releasePointer);
 $('piano').addEventListener('lostpointercapture',releasePointer);
 $('mic-button').addEventListener('click',connectMic);$('midi-button').addEventListener('click',connectMIDI);
 if(!navigator.requestMIDIAccess){$('midi-action').textContent='Browser support';$('midi-button').title='Web MIDI unavailable. Use Microphone or touch.';}
 document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.target?.matches('input,select,textarea,button')||e.repeat)return;
  const map={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72};const note=map[e.key.toLowerCase()];if(note!==undefined){if($('key-sound').checked)computerVoices.set(e.key.toLowerCase(),instrument.noteOn(note,.82));playNote(note,'computer');}});
 document.addEventListener('keyup',e=>{const key=e.key.toLowerCase();const voice=computerVoices.get(key);if(voice){voice.release();computerVoices.delete(key);}});
 $('begin-button').addEventListener('click',enterStudio);
 if(!document.fullscreenEnabled)$('fullscreen-button').hidden=true;
 $('fullscreen-button').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await $('studio-page').requestFullscreen();}
  catch(e){feedback('Full-screen is unavailable in this browser.',true);}
 });
 document.addEventListener('fullscreenchange',()=>{$('fullscreen-button').textContent=document.fullscreenElement?'⛶ Exit full screen':'⛶ Full screen';});
 $('back-button').addEventListener('click',()=>{stopFlow();setPage('setup');feedback('Practice paused. Adjust your settings, then return to the studio.');});
 $('sound-preset').addEventListener('change',e=>{instrument.setPreset(e.target.value);$('studio-audio-label').textContent=e.target.value==='warm'?'● Warm electric piano':'● Electric piano';});
 $('sound-volume').addEventListener('input',e=>{const n=+e.target.value;$('volume-value').textContent=`${n}%`;instrument.setVolume(n/100);});
 $('test-sound').addEventListener('click',async()=>{const btn=$('test-sound');btn.disabled=true;btn.textContent='Loading…';
  const audio=await unlockAudio();btn.disabled=false;btn.textContent='♫ Test the sound';if(!audio)return;
  const start=audio.currentTime+.04;[60,64,67,72].forEach((note,i)=>instrument.trigger(note,start+i*.27,.8,.78));
  $('audio-status').textContent='Playing C major electric piano test…';
 });
 window.addEventListener('resize',()=>{if(!$('studio-page').classList.contains('hidden')&&state.song){makeKeyboard(state.song.groups);renderAll();}});
 window.addEventListener('pagehide',()=>{stopFlow();state.mic?.stop();instrument.close();});
 makeLibrary();pickSample('twinkle');updateReadySummary();
}
setup();
