/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Leaf, Eye, Wind, Sun, ChevronDown, Volume2, VolumeX, Crown, Map, Compass, Star, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import ForestWebGL from './components/ForestWebGL';

gsap.registerPlugin(ScrollTrigger);

// Extend Window interface for AI Studio API key selection
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ParallaxImage = ({ src, alt, className = "", speed = 0.5 }: { src: string, alt: string, className?: string, speed?: number }) => {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.to(imgRef.current, {
      yPercent: speed * 20,
      ease: "none",
      scrollTrigger: {
        trigger: imgRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }, [speed]);

  return (
    <div ref={imgRef} className={`overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover scale-125" referrerPolicy="no-referrer" />
    </div>
  );
};

export default function App() {
  const mainRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const generateMusic = async () => {
    setIsGeneratingMusic(true);
    try {
      // Check for API key selection for Lyria
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: "Generate a 30-second ethereal, magical forest ambient track with soft flutes, twinkling bells, and gentle wind whispers. No drums, very peaceful and royal.",
        config: {
          responseModalities: [Modality.AUDIO],
        },
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (audioBase64) {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsMuted(false);
      }
    } catch (error) {
      console.error("Music generation failed:", error);
      // If it's a key selection error, we might need to prompt again
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      }
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      }
    }
  }, [isMuted, audioUrl]);

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      // 1. CUSTOM CURSOR
      const moveCursor = (e: MouseEvent) => {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.8,
          ease: "power3.out"
        });
      };
      window.addEventListener('mousemove', moveCursor);

      // 2. TEXT REVEAL ANIMATIONS
      const revealElements = document.querySelectorAll('.reveal-text');
      revealElements.forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        });
      });

      // 3. IMAGE REVEALS
      const imgReveals = document.querySelectorAll('.img-reveal');
      imgReveals.forEach((el) => {
        gsap.from(el, {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 2,
          ease: "expo.inOut",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
          }
        });
      });

      // 4. FIREFLIES
      gsap.to(".firefly", {
        y: "random(-100, 100)",
        x: "random(-100, 100)",
        opacity: "random(0.2, 0.8)",
        repeat: -1,
        yoyo: true,
        duration: "random(3, 6)",
        stagger: { amount: 3, from: "random" },
        ease: "sine.inOut"
      });

      // 5. SCROLL PROGRESS DOTS
      const sections = ['#hero', '#lineage', '#treasures', '#coronation', '#conclusion'];
      sections.forEach((id, i) => {
        ScrollTrigger.create({
          trigger: id,
          start: "top center",
          end: "bottom center",
          onToggle: self => {
            if (self.isActive) {
              gsap.to(`#nav-dot-${i}`, { backgroundColor: "#eab308", scale: 1.5, duration: 0.3 });
            } else {
              gsap.to(`#nav-dot-${i}`, { backgroundColor: "transparent", scale: 1, duration: 0.3 });
            }
          }
        });
      });

    }, mainRef);

    return () => {
      ctx.revert();
    };
  }, [isLoaded]);

  return (
    <div className="mist-overlay grain-overlay">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[#051109] flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-yellow-500 mb-12"
            >
              <Crown size={64} strokeWidth={1} />
            </motion.div>
            <div className="overflow-hidden">
              <motion.h2 
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: "circOut" }}
                className="font-display text-2xl tracking-[0.8em] text-yellow-200/40 uppercase"
              >
                The Princess Awakes
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={mainRef} className="relative min-h-screen font-sans selection:bg-yellow-500/30">
        
        {/* WebGL Background */}
        <ForestWebGL />

        {/* Scroll Progress Indicator */}
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4 items-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="w-1.5 h-1.5 rounded-full border border-yellow-500/40 transition-all duration-500"
              id={`nav-dot-${i}`}
            />
          ))}
        </div>

        {/* Interaction: Custom Fairy Dust Cursor */}
        <div 
          ref={cursorRef} 
          className="fixed top-0 left-0 w-12 h-12 border border-yellow-500/20 rounded-full pointer-events-none z-[999] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 hidden md:flex"
        >
          <div className="w-1 h-1 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,1)]" />
        </div>

        {/* Navigation Rail */}
        <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-[100] hidden lg:flex flex-col gap-8 items-center">
          <div className="w-px h-24 bg-gradient-to-b from-transparent to-yellow-500/40" />
          <div className="writing-vertical-rl rotate-180 text-[10px] uppercase tracking-[0.5em] text-yellow-500/40 font-bold">
            Aethelgard Chronicle
          </div>
          <div className="w-px h-24 bg-gradient-to-t from-transparent to-yellow-500/40" />
        </nav>

        {/* Audio Controls */}
        <div className="fixed top-12 right-12 z-[100] flex gap-4">
          {!audioUrl ? (
            <button 
              onClick={generateMusic}
              disabled={isGeneratingMusic}
              className="p-4 rounded-full glass-panel text-yellow-500 hover:scale-110 transition-all duration-500 disabled:opacity-50"
              title="Generate Magical Music"
            >
              {isGeneratingMusic ? <Sparkles className="animate-spin" size={18} /> : <Music size={18} />}
            </button>
          ) : (
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-4 rounded-full glass-panel text-yellow-500 hover:scale-110 transition-all duration-500"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </div>

        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} loop />
        )}

        {/* SECTION 1: THE ROYAL THRESHOLD (HERO) */}
        <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="hero-bg absolute inset-0 z-0">
             <div className="absolute inset-0 bg-gradient-to-b from-green-950/60 via-transparent to-[#051109] z-10" />
             <img 
               src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=2000" 
               className="w-full h-full object-cover scale-110" 
               alt="Misty Forest"
               referrerPolicy="no-referrer"
             />
          </div>
          
          <div className="z-20 text-center px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, ease: "circOut" }}
            >
              <span className="font-display text-xs tracking-[1em] text-yellow-500 mb-8 block uppercase">The Forest Sovereign</span>
              <h1 className="font-display text-[12vw] leading-[0.8] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-green-800 mb-8 drop-shadow-2xl">
                ELARA
              </h1>
              <div className="flex items-center justify-center gap-6">
                <div className="h-px w-12 bg-yellow-500/40" />
                <p className="font-serif text-lg md:text-2xl font-light italic text-yellow-100/60 tracking-[0.2em]">
                  Guardian of the Ancient Pines
                </p>
                <div className="h-px w-12 bg-yellow-500/40" />
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <div className="w-px h-16 bg-gradient-to-b from-yellow-500 to-transparent" />
            <span className="text-[9px] uppercase tracking-[0.6em] text-yellow-500/40 font-bold">Descend into Lore</span>
          </div>
        </section>

        {/* SECTION 2: THE ROYAL LINEAGE (SPLIT LAYOUT) */}
        <section id="lineage" className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#071a0e]">
          <div className="relative h-[60vh] lg:h-screen overflow-hidden img-reveal">
            <ParallaxImage 
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000" 
              alt="The Princess" 
              className="h-full"
              speed={0.3}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#071a0e] z-10 hidden lg:block" />
          </div>
          
          <div className="flex flex-col justify-center px-8 md:px-24 py-20 lg:py-0">
            <div className="max-w-xl">
              <span className="flex items-center gap-4 text-yellow-500 mb-8 uppercase tracking-[0.5em] text-[10px] font-bold">
                <Crown size={14} /> Chapter I: The Awakening
              </span>
              <h2 className="font-serif text-5xl md:text-7xl mb-12 reveal-text leading-[1.1]">
                A crown of <span className="italic-accent text-yellow-400">thorns</span> and <span className="italic-accent text-yellow-400">starlight</span>.
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-slate-300 font-light reveal-text mb-12">
                Princess Elara was not born in a castle of stone, but within the hollow of the Great Oak. Her lineage is traced not in ink, but in the rings of the trees and the migration of the swallows.
              </p>
              <div className="flex items-center gap-8 reveal-text">
                <div className="flex flex-col">
                  <span className="text-3xl font-display text-yellow-500">800</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">Years of Reign</span>
                </div>
                <div className="w-px h-12 bg-yellow-500/20" />
                <div className="flex flex-col">
                  <span className="text-3xl font-display text-yellow-500">12</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">Sacred Groves</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: THE PRINCESS'S TREASURES (BENTO GRID) */}
        <section id="treasures" className="min-h-screen px-8 md:px-24 py-32 bg-[#051109]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <span className="text-yellow-500 uppercase tracking-[0.5em] text-[10px] font-bold mb-4 block">The Royal Artifacts</span>
              <h2 className="font-display text-4xl md:text-6xl text-yellow-100 reveal-text">Treasures of the <br/><span className="italic-accent text-yellow-500">Emerald Throne</span></h2>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-sm italic-accent max-w-xs">Each object pulses with the latent energy of the forest's first breath.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[120vh]">
            {/* Large Feature Card */}
            <div className="md:col-span-7 relative group overflow-hidden rounded-2xl glass-panel p-12 flex flex-col justify-end img-reveal">
              <div className="absolute inset-0 z-0 opacity-40 group-hover:scale-110 transition-transform duration-1000">
                <img src="https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" alt="Artifact" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#051109] to-transparent z-10" />
              <div className="relative z-20">
                <Compass className="text-yellow-500 mb-6" size={32} />
                <h3 className="font-serif text-4xl text-yellow-100 mb-4">The Compass of Roots</h3>
                <p className="text-slate-400 max-w-md">A tool that points not to the north, but to the deepest source of water in times of drought.</p>
              </div>
            </div>

            {/* Side Column */}
            <div className="md:col-span-5 grid grid-rows-2 gap-6">
              <div className="relative group overflow-hidden rounded-2xl glass-panel p-10 flex flex-col justify-center img-reveal">
                <div className="absolute inset-0 z-0 opacity-20 group-hover:scale-110 transition-transform duration-1000">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Artifact" referrerPolicy="no-referrer" />
                </div>
                <Map className="text-yellow-500 mb-4" size={24} />
                <h3 className="font-serif text-2xl text-yellow-100 mb-2">The Living Map</h3>
                <p className="text-sm text-slate-400">A scroll that updates in real-time as the forest grows and shifts.</p>
              </div>
              
              <div className="relative group overflow-hidden rounded-2xl glass-panel p-10 flex flex-col justify-center img-reveal">
                <div className="absolute inset-0 z-0 opacity-20 group-hover:scale-110 transition-transform duration-1000">
                  <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Artifact" referrerPolicy="no-referrer" />
                </div>
                <Star className="text-yellow-500 mb-4" size={24} />
                <h3 className="font-serif text-2xl text-yellow-100 mb-2">Starlight Vial</h3>
                <p className="text-sm text-slate-400">Captured essence of the winter solstice, used to illuminate the dark paths.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE CORONATION OF LIGHT (IMMERSIVE) */}
        <section id="coronation" className="min-h-screen flex flex-col items-center justify-center bg-[#071a0e] relative overflow-hidden py-32">
           {/* Fireflies */}
           {[...Array(30)].map((_, i) => (
             <div 
               key={i} 
               className="firefly absolute w-1.5 h-1.5 bg-yellow-400 rounded-full blur-[2px] z-0"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
               }}
             />
           ))}

           <div className="relative z-10 flex flex-col items-center">
             <div className="mb-12 text-center">
               <span className="text-yellow-500 uppercase tracking-[0.8em] text-[10px] font-bold mb-6 block reveal-text">The Final Rite</span>
               <h2 className="font-display text-5xl md:text-8xl text-yellow-100 reveal-text mb-8">The Coronation</h2>
             </div>

             <div className="relative group cursor-pointer">
               <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="relative z-10 w-64 h-64 md:w-96 md:h-96 rounded-full border border-yellow-500/30 flex items-center justify-center glass-panel group-hover:border-yellow-500 transition-all duration-700">
                  <div className="text-center p-8">
                    <Sun className="text-yellow-500 mx-auto mb-6 float-slow" size={64} strokeWidth={1} />
                    <p className="font-serif italic text-yellow-100/60 text-sm md:text-lg">Place your hand upon the light to claim your lineage.</p>
                  </div>
               </div>
             </div>

             <div className="mt-20 max-w-2xl text-center px-6">
               <p className="text-xl md:text-3xl text-slate-300 font-light italic-accent leading-relaxed reveal-text">
                 "To rule the forest is to serve the forest. To be the princess is to be the soil, the rain, and the sun."
               </p>
             </div>
           </div>
        </section>

        {/* SECTION 5: THE ETERNAL REIGN (CONCLUSION) */}
        <section id="conclusion" className="relative h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#071a0e] to-[#051109] px-8 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="Space Forest" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#051109] via-transparent to-transparent z-10" />
          
          <div className="text-center z-20 max-w-4xl">
            <h2 className="font-display text-6xl md:text-[10vw] font-black mb-12 reveal-text text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-600 leading-none">
              ETERNAL <br/>REIGN
            </h2>
            <p className="text-lg md:text-2xl text-slate-400 mb-16 reveal-text max-w-2xl mx-auto font-light">
              The story of Elara is written in every falling leaf. Will you carry the whisper forward?
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 reveal-text">
              <button className="group relative px-16 py-6 overflow-hidden rounded-full border border-yellow-500 text-yellow-500 transition-all duration-700 hover:text-green-950">
                <div className="absolute inset-0 bg-yellow-500 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <span className="relative z-10 font-display tracking-[0.4em] text-xs uppercase font-bold">Claim the Crown</span>
              </button>
              <button className="text-yellow-500/60 hover:text-yellow-500 transition-colors duration-500 font-display tracking-[0.4em] text-[10px] uppercase font-bold">
                Explore the Archives
              </button>
            </div>
          </div>

          <footer className="absolute bottom-12 w-full px-12 flex flex-col md:flex-row justify-between items-center gap-6 z-20">
            <div className="text-slate-600 text-[10px] tracking-[0.5em] uppercase font-bold">
              &copy; 2026 Aethelgard Chronicle
            </div>
            <div className="flex gap-8">
              {['Instagram', 'Twitter', 'Lore'].map(link => (
                <a key={link} href="#" className="text-slate-600 hover:text-yellow-500 transition-colors duration-500 text-[10px] tracking-[0.3em] uppercase font-bold">{link}</a>
              ))}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
