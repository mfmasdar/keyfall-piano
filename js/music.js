/** Music decoding and lightweight beginner staff display. No external packages. */
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const PITCH_NAMES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
export const isBlack = midi => [1,3,6,8,10].includes(((midi % 12) + 12) % 12);
export function noteName(midi) { return `${PITCH_NAMES[((midi % 12)+12)%12]}${Math.floor(midi/12)-1}`; }
export function midiToFreq(midi) {return 440 * 2 ** ((midi - 69) / 12);}
export function freqToMidi(freq) {return Math.round(69 + 12 * Math.log2(freq / 440));}
function local(node, name) {return [...(node?.children || [])].find(el => el.localName === name) || null;}
function children(node, name) {return [...(node?.children || [])].filter(el => el.localName === name);}
function txt(node, name, fallback = '') {return local(node,name)?.textContent?.trim() || fallback;}
function numeric(v, fallback = 0) {const n=Number(v);return Number.isFinite(n)?n:fallback;}
function makeGroups(notes) {
  const buckets = new Map();
  for (const note of notes) {
    if (!Number.isInteger(note.midi) || note.midi < 21 || note.midi > 108) continue;
    const slot = Math.round(note.time * 192) / 192;
    if (!buckets.has(slot)) buckets.set(slot, new Map());
    const byPitch = buckets.get(slot);
    if (!byPitch.has(note.midi)) byPitch.set(note.midi, {...note, time:slot});
    else byPitch.get(note.midi).duration = Math.max(byPitch.get(note.midi).duration, note.duration);
  }
  return [...buckets.entries()].sort((a,b)=>a[0]-b[0]).map(([time, pitches])=>({
    time, notes:[...pitches.values()].sort((a,b)=>a.midi-b.midi)
  })).slice(0,2000);
}
// All tracks are kept so a learner can choose piano, melody or one hand.
function presentSong({title,subtitle,format,tracks,preferred=0}) {
  const usable=tracks.filter(t=>t.notes.length && makeGroups(t.notes).length);
  if(!usable.length) throw new Error('No playable pitched notes were found.');
  const selectedTrack=tracks[preferred];
  let picked=Math.max(0,usable.indexOf(selectedTrack));
  return {...applyTrack({title,subtitle,format,tracks:usable},picked), selectedTrack:picked};
}
export function applyTrack(song,trackIndex=0,hand='both') {
  const track=song.tracks[trackIndex];
  if(!track) throw new Error('This track is unavailable.');
  const filtered=hand==='right'?track.notes.filter(n=>n.staff==='1'):hand==='left'?track.notes.filter(n=>n.staff==='2'):track.notes;
  const groups=makeGroups(filtered);
  if(!groups.length)throw new Error('No notes in this hand. Choose Both or another part.');
  const first=groups[0].time;
  // Keep the original beat grid and relative rests; normalise just the first onset.
  const normalized=groups.map(g=>({...g,time:g.time-first}));
  return {...song,groups:normalized,partName:track.name,selectedTrack:trackIndex,selectedHand:hand};
}
function parseXMLPart(part) {
  let divisions=1,measureStart=0,beatsInBar=4;
  const notes=[];
  for(const measure of children(part,'measure')){
    let cursor=0,furthest=0,lastOnset=0;
    for(const item of [...measure.children]){
      if(item.localName==='attributes'){
        const d=numeric(txt(item,'divisions'),divisions);if(d>0)divisions=d;
        const tm=local(item,'time');if(tm){const den=numeric(txt(tm,'beat-type'),4);if(den>0)beatsInBar=numeric(txt(tm,'beats'),4)*4/den;}
      }else if(item.localName==='backup')cursor=Math.max(0,cursor-numeric(txt(item,'duration'))/divisions);
      else if(item.localName==='forward'){cursor+=numeric(txt(item,'duration'))/divisions;furthest=Math.max(furthest,cursor);}
      else if(item.localName==='note'){
        if(local(item,'grace'))continue;
        const duration=Math.max(0,numeric(txt(item,'duration'))/divisions);
        const chord=!!local(item,'chord'),onset=chord?lastOnset:cursor;
        if(!chord){lastOnset=onset;cursor+=duration;}
        furthest=Math.max(furthest,onset+duration,cursor);
        if(local(item,'rest'))continue;
        if(children(item,'tie').some(t=>t.getAttribute('type')==='stop'))continue;
        const pitch=local(item,'pitch');if(!pitch)continue;
        const step=txt(pitch,'step');if(!(step in SEMITONES))continue;
        const midi=12*(numeric(txt(pitch,'octave'),4)+1)+SEMITONES[step]+numeric(txt(pitch,'alter'),0);
        notes.push({midi,time:measureStart+onset,duration:Math.max(.20,duration),staff:txt(item,'staff','1')});
      }
    }
    measureStart+=furthest>0?furthest:beatsInBar;
  }
  return notes;
}
export function parseMusicXML(xmlString,fallbackTitle='Imported score') {
  const doc=new DOMParser().parseFromString(xmlString,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('Could not read MusicXML. Export an uncompressed, partwise .musicxml file.');
  const root=doc.documentElement;
  if(root.localName!=='score-partwise')throw new Error('Please export partwise MusicXML (.musicxml or .xml).');
  const parts=children(root,'part'),definitions=children(local(root,'part-list'),'score-part');
  if(!parts.length)throw new Error('No parts found in the MusicXML file.');
  const tracks=parts.map((p,i)=>{
    const def=definitions.find(x=>x.getAttribute('id')===p.getAttribute('id'));
    return {name:txt(def,'part-name',`Part ${i+1}`),notes:parseXMLPart(p)};
  });
  const preferred=Math.max(0,tracks.findIndex(t=>/piano|keyboard|klavier/i.test(t.name)));
  const creator=children(local(root,'identification'),'creator').find(x=>x.getAttribute('type')==='composer')?.textContent?.trim()||'';
  return presentSong({title:txt(root,'movement-title',txt(local(root,'work'),'work-title',fallbackTitle)),subtitle:creator?`${creator} · MusicXML`:'MusicXML score',format:'MusicXML',tracks,preferred});
}
// Beat-based SMF MIDI parser, preserving playable tracks/channels (percussion excluded).
export function parseMIDI(buffer,fallbackTitle='Imported MIDI') {
  const bytes=new Uint8Array(buffer),view=new DataView(buffer);let pos=0;
  function need(n,limit=bytes.length){if(pos+n>limit)throw new Error('MIDI file is truncated.');}
  function u8(limit=bytes.length){need(1,limit);return bytes[pos++];}
  function u16(){need(2);const v=view.getUint16(pos);pos+=2;return v;}
  function u32(){need(4);const v=view.getUint32(pos);pos+=4;return v;}
  function tag(){return String.fromCharCode(u8(),u8(),u8(),u8());}
  function vlq(limit){let v=0,b,count=0;do{if(++count>4)throw new Error('Invalid MIDI variable length.');b=u8(limit);v=v*128+(b&127);}while(b&128);return v;}
  if(tag()!=='MThd')throw new Error('Not a standard MIDI file.');
  const len=u32();if(len<6)throw new Error('Invalid MIDI header.');
  const format=u16(),count=u16(),division=u16();if(format>1||division&0x8000||division===0)throw new Error('MIDI must be type 0 or 1 with beat timing.');
  pos+=len-6;need(0);
  const tracks=[];
  for(let i=0;i<count;i++){
    if(tag()!=='MTrk')throw new Error('Missing MIDI track chunk.');
    const size=u32(),end=pos+size;need(size);
    let tick=0,status=0,name='',programs=new Map();
    const sounding=new Map(),channels=new Map();
    while(pos<end){
      tick+=vlq(end);let first=u8(end);
      if(first<0x80){if(status<0x80||status>=0xf0)throw new Error('Invalid MIDI running status.');pos--;first=status;}
      else if(first<0xf0)status=first;
      if(first===0xff){const type=u8(end),n=vlq(end);need(n,end);if(type===3)name=new TextDecoder().decode(bytes.slice(pos,pos+n));pos+=n;continue;}
      if(first===0xf0||first===0xf7){const n=vlq(end);need(n,end);pos+=n;continue;}
      const op=first&0xf0,ch=first&15;
      if(op===0xc0||op===0xd0){const value=u8(end);if(op===0xc0)programs.set(ch,value);continue;}
      if(![0x80,0x90,0xa0,0xb0,0xe0].includes(op))throw new Error('Unsupported MIDI event.');
      const note=u8(end),velocity=u8(end);
      if(ch===9)continue;
      if(op===0x90&&velocity>0){
        const entry={midi:note,time:tick/division,duration:1,staff:''};
        if(!channels.has(ch))channels.set(ch,[]);channels.get(ch).push(entry);
        const key=`${ch}:${note}`;if(!sounding.has(key))sounding.set(key,[]);sounding.get(key).push(entry);
      }else if(op===0x80||(op===0x90&&velocity===0)){
        const stack=sounding.get(`${ch}:${note}`);
        if(stack?.length){const entry=stack.shift();entry.duration=Math.max(.15,tick/division-entry.time);}
      }
    }
    pos=end;
    const active=[...channels.entries()].filter(([,notes])=>notes.length);
    for(const [ch,notes] of active){
      const suffix=active.length>1?` · Channel ${ch+1}`:'';
      tracks.push({name:(name||`Track ${i+1}`)+suffix,program:programs.get(ch)??999,notes});
    }
  }
  if(!tracks.length)throw new Error('No melodic MIDI notes found (drums excluded).');
  let preferred=tracks.findIndex(t=>/piano|keyboard/i.test(t.name));
  if(preferred<0)preferred=tracks.findIndex(t=>t.program<8);
  if(preferred<0)preferred=tracks.reduce((best,t,i)=>t.notes.length>tracks[best].notes.length?i:best,0);
  return presentSong({title:fallbackTitle,subtitle:'MIDI arrangement · choose a track',format:'MIDI',tracks,preferred});
}
// Not a full sheet engraving engine; provides a genuine staff-based pitch guide.
export function staffSVG(groups,index,maxNotes=10) {
  const window=groups.slice(index,Math.min(index+maxNotes,groups.length));
  if(!window.length)return '<div style="color:#456;padding:25px">Practice complete.</div>';
  const pitches=window.flatMap(g=>g.notes.map(n=>n.midi));
  const avg=pitches.reduce((a,b)=>a+b,0)/pitches.length;
  const bass=avg<58;
  const bottomDiatonic=bass?2*7+4:4*7+2; // G2 (bass) / E4 (treble)
  const sw=['C','D','E','F','G','A','B'];
  function diatonic(midi){const pitch=(midi%12+12)%12;const di=[0,0,1,1,2,3,3,4,4,5,5,6];return (Math.floor(midi/12)-1)*7+di[pitch];}
  const yFor=(midi)=>98-(diatonic(midi)-bottomDiatonic)*6;
  const width=Math.max(450,115+window.length*79);
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 155" role="img" aria-label="Simplified staff view of current and upcoming notes">`;
  for(let y=50;y<=98;y+=12)svg+=`<path d="M38 ${y} H${width-16}" stroke="#b9c6be" stroke-width="1"/>`;
  svg+=`<text x="42" y="86" font-size="38" fill="#53695e" font-family="serif">${bass?'𝄢':'𝄞'}</text>`;
  window.forEach((group,i)=>{
    const x=115+i*79;
    const current=i===0;
    if(current)svg+=`<rect x="${x-35}" y="20" width="70" height="122" rx="9" fill="#def0df"/>`;
    for(const n of group.notes){
      const y=yFor(n.midi),cy=Math.max(13,Math.min(y,135));
      if(y<44){for(let l=38;l>=y-1;l-=12)svg+=`<path d="M${x-16} ${l} h32" stroke="#7f9a8c"/>`;}
      if(y>103){for(let l=110;l<=y+1;l+=12)svg+=`<path d="M${x-16} ${l} h32" stroke="#7f9a8c"/>`;}
      svg+=`<ellipse cx="${x}" cy="${cy}" rx="11" ry="7" transform="rotate(-18 ${x} ${cy})" fill="${current?'#2d8963':'#344e5d'}"/>`;
      svg+=`<path d="M${x+10} ${cy} v-28" stroke="${current?'#2d8963':'#344e5d'}" stroke-width="2"/>`;
    }
    const label=group.notes.map(n=>noteName(n.midi)).join(' + ');
    svg+=`<text x="${x}" y="149" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="${current?'#267c58':'#667781'}" font-weight="${current?800:500}">${label.replace(/&/g,'&amp;')}</text>`;
  });
  svg+='</svg>';return svg;
}
