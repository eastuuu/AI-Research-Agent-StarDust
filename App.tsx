import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import InputSection from './components/InputSection';
import ProgressDisplay from './components/ProgressDisplay';
import ReportView from './components/ReportView';
import ParticleBackground from './components/ParticleBackground';
import { generateSubQuestions, researchQuestion, compileFinalReport } from './services/geminiService';
import { AppStatus, StepStatus, ResearchItem } from './types';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [topic, setTopic] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [finalReport, setFinalReport] = useState<string>("");
  const [researchData, setResearchData] = useState<ResearchItem[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Steps state for UI visualization
  const [steps, setSteps] = useState<StepStatus[]>([
    { id: 1, label: "Deconstruct Topic & Generate Hypotheses", status: 'pending' },
    { id: 2, label: "Conduct Deep Research (4 Parallel Streams)", status: 'pending' },
    { id: 3, label: "Synthesize Findings & Compile Report", status: 'pending' },
  ]);

  const updateStepStatus = (id: number, status: 'pending' | 'loading' | 'completed') => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleSearch = async (inputTopic: string) => {
    setTopic(inputTopic);
    setStatus(AppStatus.GENERATING_QUESTIONS);
    setError(null);
    setFinalReport("");
    setResearchData([]);
    
    // Reset steps
    setSteps([
      { id: 1, label: "Deconstruct Topic into Sub-Questions", status: 'loading' },
      { id: 2, label: "Conduct Deep Research", status: 'pending' },
      { id: 3, label: "Synthesize Findings & Compile Report", status: 'pending' },
    ]);

    try {
      // Step 1: Generate Questions
      const questions = await generateSubQuestions(inputTopic);
      
      // Initialize research data with questions and empty answers
      const initialResearchData: ResearchItem[] = questions.map(q => ({
        question: q,
        answer: ""
      }));
      setResearchData(initialResearchData);
      
      updateStepStatus(1, 'completed');
      
      // Step 2: Research
      setStatus(AppStatus.RESEARCHING);
      updateStepStatus(2, 'loading');
      
      // Execute research sequentially to avoid rate limits
      const results: {question: string, answer: string}[] = [];
      
      for (const [index, q] of questions.entries()) {
        // Add a small delay between requests to be gentle on rate limits
        if (index > 0) await new Promise(resolve => setTimeout(resolve, 500));

        const answer = await researchQuestion(q);
        
        setResearchData(prev => {
          const newData = [...prev];
          newData[index] = { ...newData[index], answer };
          return newData;
        });
        
        results.push({ question: q, answer });
      }

      updateStepStatus(2, 'completed');

      // Step 3: Compile
      setStatus(AppStatus.COMPILING);
      updateStepStatus(3, 'loading');
      
      const report = await compileFinalReport(inputTopic, results);
      
      setFinalReport(report);
      updateStepStatus(3, 'completed');
      setStatus(AppStatus.COMPLETE);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message?.includes('429') 
        ? "We're experiencing high traffic. Please try again in a moment." 
        : "An error occurred during the research process. Please check your API key or try a different topic.";
      setError(errorMessage);
      setStatus(AppStatus.ERROR);
    }
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setTopic("");
    setFinalReport("");
    setResearchData([]);
    setSteps(steps.map(s => ({...s, status: 'pending'})));
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden text-slate-100 font-sans selection:bg-primary-500/30">
      
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950 overflow-hidden">
        {/* Particle Canvas Layer */}
        <div className="absolute inset-0 z-0">
            <ParticleBackground paused={isInputFocused} />
        </div>

        {/* Animated Background Container */}
        <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isInputFocused ? 'opacity-60 paused' : 'opacity-100'}`}>
            {/* Hero Image with Slow Parallax */}
            <div 
                className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-30 animate-slow-pan ${isInputFocused ? 'paused' : ''}`}
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2940&auto=format&fit=crop')`,
                }}
            />
            
            {/* Enhanced Floating Gradient Blobs - Brighter and Larger */}
            <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen pointer-events-none ${isInputFocused ? 'paused' : ''}`} />
            
            <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-l from-blue-600/20 to-cyan-500/20 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen pointer-events-none ${isInputFocused ? 'paused' : ''}`} />
            
            <div className={`absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] animate-blob delay-5000 mix-blend-plus-lighter pointer-events-none ${isInputFocused ? 'paused' : ''}`} />
        </div>

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none mix-blend-overlay" />

        {/* Glass Overlay Stack */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/40 to-slate-950/90" />
      </div>

      {/* Navbar - Ultra Clean Glass */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={reset}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-xl group-hover:bg-white/10 transition-all shadow-lg shadow-black/20">
                {/* Subtle Geometric Death Star Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-200 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2.05 12h19.9" className="opacity-50" /> {/* Equatorial Trench */}
                  <circle cx="16" cy="8" r="3" className="opacity-80" /> {/* Superlaser Dish */}
                  <path d="M16 6a2 2 0 1 0 0 4 2 2 0 1 0 0-4" className="opacity-30" /> {/* Inner detail */}
                </svg>
            </div>
            <span className="font-serif font-bold text-white text-xl tracking-tight drop-shadow-sm">StarDustAI</span>
          </div>
          {status === AppStatus.COMPLETE && (
            <button onClick={reset} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all backdrop-blur-md">
              Start New Research
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-24 sm:px-6 lg:px-8 max-w-6xl relative z-10 flex flex-col justify-center">
        
        {status === AppStatus.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <InputSection 
              onSearch={handleSearch} 
              isLoading={false} 
              onFocusChange={setIsInputFocused}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-16 px-4">
               {[
                 { title: "Deep Synthesis", desc: "Breaks down complex topics into core research vectors." },
                 { title: "Academic Rigor", desc: "Generates neutral, fact-based reports with citations." },
                 { title: "Strategic Insight", desc: "Analyzes risks, future outlooks, and practical use cases." }
               ].map((feat, i) => (
                 <div key={i} className="group relative overflow-hidden bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <h3 className="font-serif font-bold text-slate-100 mb-3 text-lg relative z-10">{feat.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed relative z-10">{feat.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        )}

        {(status === AppStatus.GENERATING_QUESTIONS || status === AppStatus.RESEARCHING || status === AppStatus.COMPILING) && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] pb-20 pt-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-10 text-center drop-shadow-xl tracking-tight">
              Researching <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-400">{topic}</span>
            </h2>
            <ProgressDisplay steps={steps} />

            {/* Live Research Feed */}
            {researchData.length > 0 && (
              <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                 <div className="flex items-center justify-center space-x-2 mb-6 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
                    <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Active Analysis Streams</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                 {researchData.map((item, i) => (
                   <div key={i} className={`group relative bg-slate-900/40 backdrop-blur-xl rounded-xl border transition-all duration-700 overflow-hidden ${item.answer ? 'border-green-500/20 shadow-lg shadow-black/10' : 'border-white/5'}`}>
                      {/* Loading/Active Indicator Bar */}
                      {!item.answer && (
                         <div className="absolute top-0 left-0 h-0.5 bg-primary-400/50 animate-progress w-full origin-left" />
                      )}

                      <div className="p-5 flex items-start gap-4">
                        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-500 ${item.answer ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                          {item.answer ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-slate-200 leading-snug group-hover:text-white transition-colors">{item.question}</h4>
                          {!item.answer && (
                            <div className="flex items-center mt-2 text-xs text-primary-300/80 font-medium">
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Conducting deep search & synthesis...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.answer && (
                        <div className="px-5 pb-5 pt-0 pl-[4.5rem]">
                           <div className="h-px w-full bg-white/5 mb-4" />
                           <div className="text-slate-400 text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-2 prose-ul:my-2 opacity-90">
                              <ReactMarkdown>{item.answer.substring(0, 250) + "..."}</ReactMarkdown>
                           </div>
                        </div>
                      )}
                   </div>
                 ))}
                 </div>
              </div>
            )}
          </div>
        )}

        {status === AppStatus.ERROR && (
          <div className="max-w-2xl mx-auto mt-12 bg-red-950/20 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 flex items-start space-x-5 shadow-2xl">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
                <h3 className="font-bold text-xl text-red-100 mb-2">Research Interrupted</h3>
                <p className="text-red-300/80 leading-relaxed">{error}</p>
                <button onClick={reset} className="mt-6 px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-200 font-medium rounded-full hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95">
                    Retry Analysis
                </button>
            </div>
          </div>
        )}

        {status === AppStatus.COMPLETE && (
          <ReportView topic={topic} content={finalReport} researchData={researchData} />
        )}

      </main>

      <footer className="w-full text-center py-8 relative z-10 border-t border-white/5 bg-slate-950/30 backdrop-blur-md">
        <p className="text-slate-500 text-xs tracking-wider uppercase">Powered by Gemini • Developed by Utkarsh Anand</p>
      </footer>
    </div>
  );
};

export default App;
