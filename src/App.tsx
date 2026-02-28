/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Zap, 
  Settings, 
  Terminal, 
  Box, 
  Activity, 
  Search, 
  ChevronRight, 
  Download, 
  Share2,
  RefreshCw,
  Layers,
  Shield,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';
import { generateRobotDesign, generateRobotImage, RobotDesign } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import RobotScene from './components/RobotScene';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<RobotDesign | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'code' | 'sim'>('specs');
  const [telemetry, setTelemetry] = useState(() => Array.from({ length: 20 }, (_, i) => ({
    time: i,
    torque: 40 + Math.random() * 20,
    temp: 38 + Math.random() * 5,
    battery: 100 - i * 0.5
  })));

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const last = prev[prev.length - 1];
        const nextTime = last.time + 1;
        const nextTorque = Math.max(20, Math.min(90, last.torque + (Math.random() - 0.5) * 15));
        const nextTemp = Math.max(30, Math.min(60, last.temp + (Math.random() - 0.5) * 2));
        const nextBattery = Math.max(0, last.battery - 0.05);
        
        const newData = [...prev.slice(1), { 
          time: nextTime, 
          torque: nextTorque, 
          temp: nextTemp, 
          battery: nextBattery 
        }];
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Run sequentially or with better error handling if one fails
      const newDesign = await generateRobotDesign(prompt);
      setDesign(newDesign);
      
      // Image is secondary, don't let it block the design if it fails
      try {
        const newImage = await generateRobotImage(prompt);
        setImageUrl(newImage);
      } catch (imgErr) {
        console.error("Image generation failed", imgErr);
      }
      
    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "Failed to generate robot design. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-300 font-sans selection:bg-hardware-accent selection:text-black overflow-x-hidden">
      {/* 3D Background */}
      <RobotScene />
      
      {/* Background Grid */}
      <div className="fixed inset-0 dashed-grid opacity-10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-hardware-border bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-hardware-accent rounded flex items-center justify-center">
              <Cpu className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-mono text-xl font-bold tracking-tighter text-white">
              ROBO<span className="text-hardware-accent">FORGE</span>.AI
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-gray-500">
            <div className="flex items-center gap-2 text-hardware-accent">
              <div className="w-2 h-2 rounded-full bg-hardware-accent animate-pulse" />
              SYSTEM READY
            </div>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero / Input Section */}
        <section className="mb-12">
          <div className="max-w-3xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-none"
            >
              Forge the <span className="italic font-serif font-light">Future</span> of Robotics.
            </motion.h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Describe your robotics concept. Our AI engine generates full engineering specs, 
              visual concepts, and control logic in seconds.
            </p>

            <form onSubmit={handleGenerate} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-hardware-accent/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-hardware-bg border border-hardware-border rounded-xl p-2 focus-within:border-hardware-accent transition-all">
                <Search className="w-6 h-6 text-gray-500 ml-4" />
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A hexapod robot for lunar cave exploration with LiDAR..."
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-lg text-white placeholder:text-gray-600"
                />
                <button 
                  disabled={loading}
                  className="bg-hardware-accent hover:bg-emerald-400 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      GENERATE
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3"
              >
                <Shield className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {design ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Visualization & Stats */}
              <div className="lg:col-span-5 space-y-8">
                {/* Robot Image */}
                <motion.div 
                  whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="hardware-card overflow-hidden aspect-square relative group perspective-1000"
                >
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <span className="bg-black/80 backdrop-blur-md text-[10px] font-mono px-2 py-1 rounded border border-white/10 text-hardware-accent">
                      VISUAL_RENDER_V1.0
                    </span>
                  </div>
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={design.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                      <Box className="w-12 h-12 text-gray-700 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{design.name}</h3>
                    <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">{design.purpose}</p>
                  </div>
                </motion.div>

                {/* Sensor Dashboard (Mock) */}
                <motion.div 
                  whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="hardware-card p-6 perspective-1000"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-hardware-accent" />
                      <span className="text-xs font-mono uppercase tracking-widest text-gray-400">Telemetry Simulation</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-600">LIVE_FEED_01</div>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetry}>
                        <defs>
                          <linearGradient id="colorTorque" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2f" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#151619', border: '1px solid #2a2b2f', borderRadius: '8px' }}
                          itemStyle={{ color: '#00ff41', fontSize: '12px', fontFamily: 'monospace' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="torque" 
                          stroke="#00ff41" 
                          fillOpacity={1} 
                          fill="url(#colorTorque)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-3 bg-black/40 rounded-lg border border-hardware-border">
                      <div className="text-[10px] text-gray-500 font-mono mb-1">TEMP</div>
                      <div className="text-lg font-mono text-white">
                        {telemetry[telemetry.length - 1].temp.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg border border-hardware-border">
                      <div className="text-[10px] text-gray-500 font-mono mb-1">BATT</div>
                      <div className="text-lg font-mono text-white">
                        {Math.floor(telemetry[telemetry.length - 1].battery)}%
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg border border-hardware-border">
                      <div className="text-[10px] text-gray-500 font-mono mb-1">LOAD</div>
                      <div className="text-lg font-mono text-white">12.4kg</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Specs & Code */}
              <div className="lg:col-span-7 flex flex-col">
                <motion.div 
                  whileHover={{ translateZ: 20 }}
                  className="hardware-card flex-1 flex flex-col overflow-hidden shadow-emerald-500/5"
                >
                  {/* Tabs */}
                  <div className="flex border-b border-hardware-border bg-black/20">
                    <button 
                      onClick={() => setActiveTab('specs')}
                      className={cn(
                        "px-6 py-4 text-xs font-mono uppercase tracking-widest transition-all border-b-2",
                        activeTab === 'specs' ? "text-hardware-accent border-hardware-accent bg-hardware-accent/5" : "text-gray-500 border-transparent hover:text-gray-300"
                      )}
                    >
                      Specifications
                    </button>
                    <button 
                      onClick={() => setActiveTab('code')}
                      className={cn(
                        "px-6 py-4 text-xs font-mono uppercase tracking-widest transition-all border-b-2",
                        activeTab === 'code' ? "text-hardware-accent border-hardware-accent bg-hardware-accent/5" : "text-gray-500 border-transparent hover:text-gray-300"
                      )}
                    >
                      Control Logic
                    </button>
                    <button 
                      onClick={() => setActiveTab('sim')}
                      className={cn(
                        "px-6 py-4 text-xs font-mono uppercase tracking-widest transition-all border-b-2",
                        activeTab === 'sim' ? "text-hardware-accent border-hardware-accent bg-hardware-accent/5" : "text-gray-500 border-transparent hover:text-gray-300"
                      )}
                    >
                      Components
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-8 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
                    {activeTab === 'specs' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="prose prose-invert prose-emerald max-w-none"
                      >
                        <Markdown>{design.specifications}</Markdown>
                      </motion.div>
                    )}

                    {activeTab === 'code' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-t-lg border-x border-t border-hardware-border">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-mono text-gray-400">controller_main.py</span>
                          </div>
                          <button className="text-gray-500 hover:text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <pre className="bg-[#050506] p-6 rounded-b-lg border border-hardware-border overflow-x-auto font-mono text-sm leading-relaxed text-emerald-400/90">
                          <code>{design.controlLogic}</code>
                        </pre>
                      </motion.div>
                    )}

                    {activeTab === 'sim' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {design.components.map((comp, idx) => (
                          <div key={idx} className="p-4 bg-black/20 border border-hardware-border rounded-lg hover:border-hardware-accent/50 transition-colors group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono text-hardware-accent uppercase tracking-widest">{comp.type}</span>
                              <Settings className="w-3 h-3 text-gray-600 group-hover:text-hardware-accent transition-colors" />
                            </div>
                            <h4 className="text-white font-bold mb-1">{comp.name}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">{comp.description}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-hardware-border bg-black/20 flex items-center justify-between">
                    <div className="flex gap-4">
                      <button className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                        EXPORT_JSON
                      </button>
                      <button className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition-colors">
                        <Layers className="w-4 h-4" />
                        CAD_FILES
                      </button>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-mono text-hardware-accent hover:glow-text transition-all">
                      <Shield className="w-4 h-4" />
                      VALIDATE_DESIGN
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full border border-hardware-border flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-t border-hardware-accent animate-spin" />
                <Cpu className="w-10 h-10 text-gray-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Awaiting Input Parameters</h3>
                <p className="text-gray-500 max-w-md">
                  Enter a robot concept above to initialize the Forge engine. 
                  Our AI will synthesize mechanical, electrical, and software specifications.
                </p>
              </div>
              <div className="flex gap-3">
                {['Search & Rescue', 'Deep Sea Exploration', 'Medical Assistant', 'Warehouse Logistics'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setPrompt(tag)}
                    className="px-4 py-2 bg-hardware-bg border border-hardware-border rounded-full text-xs font-mono text-gray-500 hover:border-hardware-accent hover:text-hardware-accent transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-hardware-border py-12 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 bg-hardware-accent rounded flex items-center justify-center">
                <Cpu className="w-4 h-4 text-black" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-mono text-lg font-bold tracking-tighter text-white">
                  ROBO<span className="text-hardware-accent">FORGE</span>.AI
                </h1>
                <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">by Alphons Jaison</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              The world's first AI-native robotics design platform. 
              Bridging the gap between conceptual engineering and physical reality.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-white mb-6">System Status</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">FORGE_ENGINE</span>
                <span className="text-hardware-accent">OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">SIM_CLUSTER</span>
                <span className="text-hardware-accent">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">NEURAL_SYNC</span>
                <span className="text-hardware-accent">99.9%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-hardware-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-mono text-gray-600">© 2026 ROBOFORGE AI. ALL RIGHTS RESERVED. [SECURE_CONNECTION_ESTABLISHED]</p>
            <p className="text-[9px] font-mono text-amber-500/40 uppercase tracking-wider max-w-md">
              System Notice: This application is under active development. Experimental features may result in unexpected behavior or errors.
            </p>
          </div>
          <div className="flex gap-6">
            <Eye className="w-4 h-4 text-gray-700" />
            <Zap className="w-4 h-4 text-gray-700" />
            <Shield className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      </footer>
    </div>
  );
}
