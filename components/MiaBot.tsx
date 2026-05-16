"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { chatWithMia } from "@/lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX } from "lucide-react";

export function MiaBot() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [muted, setMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIndex, setVoiceIndex] = useState(0);
  
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const isCapturingRef = useRef(false);
  const [errorType, setErrorType] = useState<"quota" | "timeout" | "network" | null>(null);

  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'degraded' | 'error'>('checking');
  const lastRecogErrorRef = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialisation unique et permanente du service vocal et des voix
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("[MIA BOT] Reconnaissance vocale non supportée par ce navigateur.");
      setIsSupported(false);
      setSystemStatus('error');
      return;
    }

    console.log("[MIA BOT] Initialisation du canal vocal permanent...");
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log("[MIA BOT] Canal vocal prêt et ouvert.");
      setSystemStatus('ready');
      lastRecogErrorRef.current = null;
    };

    recognition.onresult = (event: any) => {
      if (!isCapturingRef.current) return;

      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const final = event.results[i][0].transcript;
          console.log("[MIA BOT] Final:", final);
          setMessage(final);
        } else {
          interimTranscript += event.results[i][0].transcript;
          setMessage(interimTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      lastRecogErrorRef.current = event.error;
      if (event.error === "network") {
        setSystemStatus('degraded');
        return;
      }
      console.warn("[MIA BOT] Erreur reconnaissance:", event.error);
    };

    recognition.onend = () => {
      const err = lastRecogErrorRef.current;
      lastRecogErrorRef.current = null;
      if (err === "network") {
        // Retry avec délai pour éviter la boucle infinie
        retryTimerRef.current = setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 5000);
        return;
      }
      try { recognition.start(); } catch (e) {}
    };

    recognitionRef.current = recognition;
    
    // Relance sécurisée avec délai pour éviter les collisions au montage
    const safeStart = () => {
      try {
        if (recognitionRef.current) {
          recognition.start();
        }
      } catch (e) {
        // Ignorer si déjà démarré
      }
    };

    setTimeout(safeStart, 500);

    // --- Gestion des voix ---
    const loadVoices = () => {
      try {
        const allVoices = window.speechSynthesis.getVoices();
        const frVoices = allVoices.filter(v => v.lang.startsWith("fr"));
        setAvailableVoices(frVoices);
        const defaultIdx = frVoices.findIndex(v => v.name.includes("Google") || v.name.includes("Natural"));
        if (defaultIdx !== -1) setVoiceIndex(defaultIdx);
      } catch (e) {
        console.warn("[MIA BOT] Erreur chargement voix:", e);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      recognition.onend = null;
      recognition.abort();
      window.speechSynthesis.cancel();
      stopVolumeMeter();
    };
  }, []);

  const cycleVoice = () => {
    if (availableVoices.length > 0) {
      setVoiceIndex((prev) => (prev + 1) % availableVoices.length);
    }
  };

  const [volume, setVolume] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVolumeMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!isListening) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(average);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.error("[MIA BOT] Erreur accès micro pour volume:", err);
    }
  };

  const stopVolumeMeter = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    setVolume(0);
  };

  const toggleListening = () => {
    const nextState = !isCapturing;
    setIsCapturing(nextState);
    isCapturingRef.current = nextState;
    setIsListening(nextState);

    if (nextState) {
      startVolumeMeter();
      window.speechSynthesis.cancel();
      setMessage("");
      setResponse("");
      setErrorType(null);
    } else {
      stopVolumeMeter();
    }
  };

  const handleSend = async (manualMessage?: string | any) => {
    // Si c'est un événement (ex: onClick), on l'ignore pour manualMessage
    const textToSend = typeof manualMessage === "string" ? manualMessage : message;
    if (!textToSend || !textToSend.trim() || isThinking) return;

    const startTime = Date.now();
    console.log(`[MIA BOT] >>> DÉBUT DE L'ENVOI (${new Date().toLocaleTimeString()})`);
    console.log("[MIA BOT] Message:", textToSend);
    
    setIsThinking(true);
    setResponse("");
    setStatusMsg("Préparation du contexte...");

    if (isListening) {
      toggleListening();
    }

    const context = {
      userName: user?.full_name,
      role: user?.role,
      commune: user?.commune || undefined,
      currentPath: pathname,
    };

    try {
      setStatusMsg("Mia réfléchit (Gemini AI)...");
      console.log("[MIA BOT] Appel de Gemini avec contexte:", context);

      const aiResponse = await chatWithMia(textToSend, context);
      const apiTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[MIA BOT] <<< RÉPONSE REÇUE en ${apiTime}s`);

      setIsThinking(false);
      setStatusMsg("");
      setMessage("");

      if (aiResponse.startsWith("ERREUR_QUOTA:")) {
        setErrorType("quota");
        setResponse(aiResponse.replace("ERREUR_QUOTA: ", ""));
        return;
      }
      if (aiResponse.startsWith("ERREUR_TIMEOUT:")) {
        setErrorType("timeout");
        setResponse(aiResponse.replace("ERREUR_TIMEOUT: ", ""));
        return;
      }
      if (aiResponse.startsWith("ERREUR_RESEAU:")) {
        setErrorType("network");
        setResponse(aiResponse.replace("ERREUR_RESEAU: ", ""));
        return;
      }

      setErrorType(null);
      const cleanResponse = stripMarkdown(aiResponse);
      setResponse(cleanResponse);

      if (!muted) {
        console.log("[MIA BOT] Lancement de la voix...");
        setStatusMsg("Mia vous répond oralement...");
        speak(cleanResponse);
      }
    } catch (error) {
      console.error("[MIA BOT] !!! ERREUR FATALE:", error);
      setErrorType("network");
      setStatusMsg("");
      setResponse("Une erreur inattendue est survenue. Veuillez réessayer.");
      setIsThinking(false);
    }
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/\*\*/g, "") // Supprimer le gras
      .replace(/\*/g, "")  // Supprimer l'italique
      .replace(/#/g, "")   // Supprimer les titres
      .replace(/`/g, "")   // Supprimer le code
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Supprimer les liens
      .replace(/\(ID \d+\)/gi, "") // Supprimer les IDs techniques comme (ID 1064)
      .replace(/FCFA/gi, "francs CFA") // Correction prononciation monnaie
      .replace(/CFA/gi, "CFA");
  };

  const speak = (text: string) => {
    const cleanText = stripMarkdown(text);
    console.log("[MIA BOT] Début de la synthèse vocale pour:", cleanText.substring(0, 50) + "...");
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (availableVoices[voiceIndex]) {
      console.log("[MIA BOT] Voix sélectionnée :", availableVoices[voiceIndex].name);
      utterance.voice = availableVoices[voiceIndex];
    }

    utterance.lang = "fr-FR";
    utterance.pitch = 1.0; 
    utterance.rate = 1.0;  
    
    utterance.onstart = () => {
      console.log("[MIA BOT] Lecture audio démarrée.");
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      console.log("[MIA BOT] Lecture audio terminée.");
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = (event) => {
      // Ignorer les erreurs d'interruption normales (quand on annule pour un nouveau message)
      if (event.error === "interrupted" || event.error === "canceled") return;
      console.error("[MIA BOT] Erreur synthèse vocale:", event.error || event);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePause = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  if (!isAuthenticated) return null;

  const currentAnimation = (isListening || isThinking) 
    ? "/animations/ANIAMTION2.lottie" 
    : "/animations/ANIMATION1.lottie";

  return (
    <div className="fixed top-24 right-4 sm:right-6 z-[9999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl p-6 w-[22rem] max-w-[calc(100vw-32px)] overflow-hidden ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">MIA ASSISTANT</h3>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">Vocal Intelligence</span>
                </div>
              </div>
              <div className="flex gap-2">
                {availableVoices.length > 1 && (
                  <button 
                    onClick={cycleVoice}
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-500 transition-all flex items-center gap-1"
                    title="Changer de voix"
                  >
                    <Volume2 size={16} />
                    <span className="text-[10px] font-bold">HD</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    setMessage("");
                    setResponse("");
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setIsPaused(false);
                  }}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-all"
                  title="Réinitialiser"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="min-h-[100px] max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {isListening && (
                  <div className="flex flex-col gap-2 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center gap-3 text-emerald-500 font-bold text-xs animate-pulse">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      MIA VOUS ÉCOUTE...
                    </div>
                    {/* Visualisateur de volume */}
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        animate={{ width: `${Math.min(volume * 2, 100)}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-400 text-center font-medium uppercase tracking-tighter">
                      Signal Micro : {volume > 5 ? "Capté" : "Silence"}
                    </span>
                  </div>
                )}
                
                {(isThinking || statusMsg) && (
                  <div className="flex flex-col gap-2 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                    <div className="flex items-center gap-3 text-blue-500 font-bold text-xs animate-pulse">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      {statusMsg || "MIA RÉFLÉCHIT..."}
                    </div>
                  </div>
                )}
                
                {message && (
                  <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Message</span>
                      {!isThinking && !response && (
                        <button 
                          onClick={() => handleSend()}
                          className="text-[10px] font-bold text-emerald-500 hover:underline"
                        >
                          ENVOYER MAINTENANT →
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-sm">
                      {message}
                    </p>
                  </div>
                )}

                {isThinking && (
                  <div className="flex items-center gap-3 text-zinc-400 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                    Réflexion en cours...
                  </div>
                )}

                {response && (
                  <div className="animate-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center justify-between mb-1 px-1">
                      {errorType === "quota" ? (
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Quota dépassé</span>
                      ) : errorType === "timeout" ? (
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Délai dépassé</span>
                      ) : errorType === "network" ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Erreur réseau</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Réponse de Mia</span>
                      )}
                      {!errorType && availableVoices[voiceIndex] && (
                        <span className="text-[9px] font-medium text-zinc-400 italic">
                          Mode: {availableVoices[voiceIndex].name.split(" ")[1] || "Normal"}
                        </span>
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl border shadow-sm text-sm leading-relaxed ${
                      errorType === "quota"
                        ? "text-amber-800 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/30"
                        : errorType === "timeout" || errorType === "network"
                        ? "text-red-800 dark:text-red-200 bg-red-50/60 dark:bg-red-900/20 border-red-200/60 dark:border-red-800/30"
                        : "text-zinc-800 dark:text-zinc-100 bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-900/20"
                    }`}>
                      {response}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={toggleListening}
                  disabled={!isSupported}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl transition-all ${
                    !isSupported ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" :
                    isListening 
                      ? "bg-red-500 text-white shadow-xl shadow-red-500/20 animate-pulse" 
                      : "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02]"
                  }`}
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                  <span className="text-[10px] font-bold uppercase">
                    {!isSupported ? "Non Supporté" : isListening ? "Stop" : "Parler"}
                  </span>
                </button>

                {message && !response && !isThinking && (
                  <button
                    onClick={handleSend}
                    className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition-all hover:scale-[1.02] shadow-xl"
                  >
                    <MessageSquare size={24} />
                    <span className="text-[10px] font-bold uppercase">Envoyer</span>
                  </button>
                )}
                
                {(isSpeaking || isPaused) && (
                  <button
                    onClick={togglePause}
                    className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    {isPaused ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    <span className="text-[10px] font-bold uppercase">{isPaused ? "Reprendre" : "Pause"}</span>
                  </button>
                )}

                {(isSpeaking || isPaused) && (
                  <button
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                      setIsPaused(false);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all hover:bg-zinc-200"
                  >
                    <X size={24} />
                    <span className="text-[10px] font-bold uppercase">Arrêter</span>
                  </button>
                )}

                <button
                  onClick={() => setMuted(!muted)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl transition-all ${
                    !muted 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300" 
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  <span className="text-[10px] font-bold uppercase">{muted ? "Muet" : "Audio"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={systemStatus === 'ready' ? { scale: 1.05 } : {}}
        whileTap={systemStatus === 'ready' ? { scale: 0.95 } : {}}
        onClick={() => systemStatus === 'ready' && setIsOpen(!isOpen)}
        className={`relative group ${systemStatus !== 'ready' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        title={
          systemStatus === 'checking' ? 'Mia démarre...' :
          systemStatus === 'degraded' ? 'Reconnexion vocale en cours...' :
          systemStatus === 'error' ? 'Mia indisponible' : ''
        }
      >
        <div className={`absolute inset-0 rounded-[2.5rem] blur-2xl transition-all duration-500 ${
          systemStatus === 'ready' ? 'bg-emerald-500/30 group-hover:bg-emerald-500/50' :
          systemStatus === 'degraded' ? 'bg-amber-500/30' :
          systemStatus === 'error' ? 'bg-red-500/30' :
          'bg-zinc-400/20'
        }`} />
        <div className={`relative w-24 h-24 sm:w-28 sm:h-28 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] border-2 shadow-2xl overflow-hidden flex items-center justify-center ring-1 ring-black/5 transition-all duration-300 ${
          systemStatus === 'ready' ? 'border-emerald-500/30' :
          systemStatus === 'degraded' ? 'border-amber-500/40' :
          systemStatus === 'error' ? 'border-red-500/40' :
          'border-zinc-300/40'
        } ${systemStatus !== 'ready' ? 'grayscale opacity-70' : ''}`}>
          <DotLottieReact
            src={currentAnimation}
            loop
            autoplay
            style={{ width: "135%", height: "135%" }}
          />
          {isSpeaking && !isPaused && systemStatus === 'ready' && (
            <div className="absolute bottom-4 flex gap-1.5 justify-center">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-1.5 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          )}

          {/* Overlay de statut quand non prêt */}
          {systemStatus !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-[2.5rem]">
              <div className={`w-2.5 h-2.5 rounded-full mb-1 ${
                systemStatus === 'checking' ? 'bg-zinc-400 animate-pulse' :
                systemStatus === 'degraded' ? 'bg-amber-400 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="text-[8px] font-bold text-white uppercase tracking-tight">
                {systemStatus === 'checking' ? 'Démarrage...' :
                 systemStatus === 'degraded' ? 'Reconnexion...' : 'Erreur'}
              </span>
            </div>
          )}

          {/* Indicateur d'état en bas à droite */}
          <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
              isListening ? "bg-blue-500 animate-pulse" :
              systemStatus === 'ready' ? "bg-emerald-500 animate-pulse" :
              systemStatus === 'degraded' ? "bg-amber-400 animate-pulse" :
              systemStatus === 'error' ? "bg-red-500" :
              "bg-zinc-400 animate-pulse"
            }`} />
            <span className="text-[7px] font-bold uppercase tracking-tighter opacity-60 text-white drop-shadow">
              {isListening ? "On" :
               systemStatus === 'ready' ? "OK" :
               systemStatus === 'degraded' ? "..." :
               systemStatus === 'error' ? "HS" : "..."}
            </span>
          </div>
        </div>
        
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-1/2 -left-40 -translate-y-1/2 hidden lg:block"
          >
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-800 dark:text-zinc-100 text-[12px] font-bold px-5 py-3 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 whitespace-nowrap tracking-wide">
              Besoin d'aide ? Mia est là ! ✨
            </div>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
