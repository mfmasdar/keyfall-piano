"""Build original, royalty-free electric-piano-like sample bank for Keyfall.
The waveforms are modeled from damped struck tines; no third-party recordings.
Requires numpy + ffmpeg. Does not need to run when deploying Keyfall.
"""
import os, subprocess, numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent/'assets'/'electric-piano'
ROOT.mkdir(parents=True,exist_ok=True)
SR=32000
DURATION=3.6
rng=np.random.default_rng(126)
for midi in range(36, 97, 3):
    f=440*2**((midi-69)/12)
    t=np.arange(int(DURATION*SR))/SR
    # Time-varying steel-tine / pickup simulation, brighter on stronger attacks.
    bend=1+0.0015*np.exp(-t*16)
    phase=2*np.pi*f*(t+0.0015/16*(1-np.exp(-t*16)))
    mod_idx=1.15*np.exp(-t*12) + 0.055*np.exp(-t*1.9)
    fm=phase+mod_idx*np.sin(2.01*phase)
    fundamental=0.74*np.sin(fm+.06*np.sin(2*np.pi*4.1*t))*np.exp(-t*(0.66+f/4500))
    partial2=0.30*np.sin(2.006*phase+0.24)*np.exp(-t*(1.35+f/2700))
    partial3=0.15*np.sin(3.017*phase+0.7)*np.exp(-t*(2.30+f/2300))
    partial4=0.08*np.sin(4.13*phase+.2)*np.exp(-t*4.2)
    bell=0.11*np.sin(7.04*phase+.35)*np.exp(-t*9.5)
    click_env=np.exp(-t*83)
    # A short hammer impulse avoids the sharp electronic sine-wave onset.
    noise=rng.standard_normal(len(t))
    noise=np.convolve(noise,np.ones(6)/6,mode='same')
    click=0.068*noise*click_env
    amp=(1-np.exp(-t*130))*np.exp(-t*0.05)
    sound=amp*(fundamental+partial2+partial3+partial4+bell)+click
    # Low-level mechanical tremolo and slight saturation.
    sound*=1-0.05*np.sin(2*np.pi*5.1*t+0.4)
    sound=np.tanh(1.27*sound)*0.62
    sound*=np.clip((DURATION-t)/.3,0,1)
    pcm=np.int16(np.clip(sound,-1,1)*32767)
    mp3=ROOT/f'{midi}.mp3'
    p=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','s16le','-ar',str(SR),'-ac','1','-i','pipe:0','-c:a','libmp3lame','-q:a','5',str(mp3)],input=pcm.tobytes(),capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode())
    print(midi,mp3.stat().st_size)
print('Total',sum(p.stat().st_size for p in ROOT.glob('*.mp3')))
