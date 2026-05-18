"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { tokens } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, VolumeX, RotateCcw } from "lucide-react";

type ErrorType = "quota" | "timeout" | "network" | "mic" | null;
type SystemStatus = "checking" | "ready" | "degraded" | "error";

export function MiaBot() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [muted, setMuted] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [volume, setVolume] = useState(0);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>("checking");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserFrameRef = useRef<number | null>(null);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia;
    const hasMediaRecorder = typeof (window as any).MediaRecorder !== "undefined";

    if (!hasMediaDevices || !hasMediaRecorder) {
      console.error("[MIA BOT] MediaRecorder ou getUserMedia indisponible");
      setSystemStatus("error");
      return;
    }

    setSystemStatus("ready");

    return () => {
      cleanupRecording();
      releaseAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const releaseAudio = () => {
    if (audioElRef.current) {
      try { audioElRef.current.pause(); } catch {}
      audioElRef.current = null;
    }
    if (audioObjectUrlRef.current) {
      try { URL.revokeObjectURL(audioObjectUrlRef.current); } catch {}
      audioObjectUrlRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const cleanupRecording = () => {
    if (analyserFrameRef.current !== null) {
      cancelAnimationFrame(analyserFrameRef.current);
      analyserFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try { audioContextRef.current.close(); } catch {}
    }
    audioContextRef.current = null;
    setVolume(0);
  };

  const startVolumeMeter = (stream: MediaStream) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setVolume(sum / data.length);
        analyserFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn("[MIA BOT] Volume meter indisponible:", e);
    }
  };

  const startRecording = async () => {
    setErrorType(null);
    setMessage("");
    setResponse("");
    releaseAudio();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error("[MIA BOT] Permission micro refusee:", e);
      setErrorType("mic");
      setResponse("Permission du microphone refusee. Autorisez l'acces dans les parametres du navigateur.");
      return;
    }

    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
      audioChunksRef.current = [];
      cleanupRecording();
      setIsRecording(false);
      await transcribeAndAsk(blob);
    };

    recorder.start();
    setIsRecording(true);
    startVolumeMeter(stream);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      cleanupRecording();
      setIsRecording(false);
    }
  };

  const transcribeAndAsk = async (audioBlob: Blob) => {
    setIsThinking(true);
    setStatusMsg("Transcription de votre voix...");

    let userText = "";
    try {
      const res = await fetch("/api/mia/transcribe", {
        method: "POST",
        headers: { "Content-Type": audioBlob.type || "audio/webm" },
        body: audioBlob,
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setErrorType("quota");
          setResponse("Limite de transcription atteinte. Reessayez dans une minute.");
          setIsThinking(false);
          setStatusMsg("");
          return;
        }
        throw new Error(data?.detail || data?.error || "Echec transcription");
      }
      userText = (data.text || "").trim();
    } catch (e: any) {
      console.error("[MIA BOT] STT error:", e);
      setErrorType("network");
      setResponse("Impossible de transcrire votre voix. Verifiez votre connexion.");
      setIsThinking(false);
      setStatusMsg("");
      return;
    }

    if (!userText) {
      setIsThinking(false);
      setStatusMsg("");
      setResponse("Je n'ai pas entendu votre question. Reessayez en parlant plus fort.");
      return;
    }

    setMessage(userText);
    await askMia(userText);
  };

  const askMia = async (textToSend: string) => {
    setIsThinking(true);
    setStatusMsg("Mia reflechit...");
    setResponse("");
    setErrorType(null);

    const accessToken = tokens.getAccess();
    const context = {
      userName: user?.full_name,
      role: user?.role,
      commune: user?.commune || undefined,
      currentPath: pathname,
    };

    let replyText = "";
    try {
      const res = await fetch("/api/mia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, context, accessToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setErrorType("quota");
          setResponse(data?.text || "Quota IA temporairement atteint. Reessayez dans quelques minutes.");
          setIsThinking(false);
          setStatusMsg("");
          return;
        }
        throw new Error(data?.text || data?.error || "Echec de la requete IA");
      }
      replyText = (data.text || "").trim();
    } catch (e: any) {
      console.error("[MIA BOT] Chat error:", e);
      setErrorType("network");
      setResponse("Je n'arrive pas a acceder a mon cerveau IA. Verifiez votre connexion.");
      setIsThinking(false);
      setStatusMsg("");
      return;
    }

    if (!replyText) {
      setIsThinking(false);
      setStatusMsg("");
      setResponse("Je n'ai pas pu generer de reponse. Pouvez-vous reformuler ?");
      return;
    }

    setResponse(replyText);
    setIsThinking(false);
    setStatusMsg("");

    if (!muted) {
      await speak(replyText);
    }
  };

  const speak = async (text: string) => {
    releaseAudio();
    setStatusMsg("Mia vous repond...");
    try {
      const res = await fetch("/api/mia/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn("[MIA BOT] TTS echec:", errData);
        setStatusMsg("");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioObjectUrlRef.current = url;

      const audio = new Audio(url);
      audioElRef.current = audio;
      audio.onplay = () => { setIsSpeaking(true); setIsPaused(false); };
      audio.onended = () => { setIsSpeaking(false); setIsPaused(false); setStatusMsg(""); };
      audio.onpause = () => { if (!audio.ended) setIsPaused(true); };
      audio.onerror = () => { setIsSpeaking(false); setIsPaused(false); setStatusMsg(""); };
      await audio.play();
    } catch (e) {
      console.error("[MIA BOT] Speak error:", e);
      setStatusMsg("");
    }
  };

  const togglePause = () => {
    const audio = audioElRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPaused(false);
    } else {
      audio.pause();
      setIsPaused(true);
    }
  };

  const stopSpeaking = () => {
    releaseAudio();
    setStatusMsg("");
  };

  const toggleRecording = () => {
    if (isThinking) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  if (!isAuthenticated) return null;

  const currentAnimation = (isRecording || isThinking)
    ? "/animations/ANIAMTION2.lottie"
    : "/animations/ANIMATION1.lottie";

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[9999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-[24rem] max-w-[calc(100vw-32px)] overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-500/5"
          >
            {/* Fond gradient subtil + glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/85 to-emerald-50/60 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-emerald-950/40 backdrop-blur-2xl" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/40 dark:ring-white/5 rounded-[2rem] pointer-events-none" />

            {/* Glow accent en haut a droite */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-zinc-900 dark:text-white">Mia Assistant</h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest">Vocal Intelligence</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setMessage("");
                      setResponse("");
                      setErrorType(null);
                      releaseAudio();
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500 transition-all hover:scale-105"
                    title="Reinitialiser"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all hover:scale-105"
                    title="Fermer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Zone de conversation */}
              <div className="min-h-[120px] max-h-[40vh] overflow-y-auto pr-1 space-y-3 mb-5 custom-scrollbar">
                {!message && !response && !isRecording && !isThinking && !statusMsg && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 flex items-center justify-center mb-3">
                      <Mic size={22} className="text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Pretez a discuter ?</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Appuyez sur Parler pour commencer</p>
                  </div>
                )}

                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-4"
                  >
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <div className="flex gap-1 items-end">
                        <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1 h-5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="w-1 h-5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.45s' }} />
                      </div>
                      MIA VOUS ECOUTE
                    </div>
                    <div className="h-1 w-full bg-emerald-500/15 rounded-full overflow-hidden mt-3">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        animate={{ width: `${Math.min(volume * 2, 100)}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </div>
                    <span className="block text-[9px] text-emerald-600/70 dark:text-emerald-400/70 text-center font-medium uppercase tracking-widest mt-2">
                      {volume > 5 ? "Signal capte" : "En attente..."}
                    </span>
                  </motion.div>
                )}

                {(isThinking || statusMsg) && !isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 p-4"
                  >
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      {statusMsg || "MIA REFLECHIT..."}
                    </div>
                  </motion.div>
                )}

                {message && (
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%]">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 text-right pr-1">Vous</span>
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl rounded-tr-md shadow-lg text-sm leading-relaxed">
                        {message}
                      </div>
                    </div>
                  </motion.div>
                )}

                {response && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[88%]">
                      <span className={`block text-[9px] font-bold uppercase tracking-widest mb-1 pl-1 ${
                        errorType === "quota" ? "text-amber-500" :
                        errorType === "mic" ? "text-orange-500" :
                        errorType === "network" ? "text-red-500" :
                        "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {errorType === "quota" ? "Quota depasse" :
                          errorType === "mic" ? "Micro refuse" :
                          errorType === "network" ? "Erreur reseau" :
                          "Mia"}
                      </span>
                      <div className={`px-4 py-3 rounded-2xl rounded-tl-md shadow-md text-sm leading-relaxed border ${
                        errorType === "quota"
                          ? "text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/30 border-amber-200/60 dark:border-amber-700/40"
                          : errorType === "mic" || errorType === "network"
                          ? "text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-900/30 border-red-200/60 dark:border-red-700/40"
                          : "text-zinc-800 dark:text-zinc-100 bg-white/80 dark:bg-zinc-800/80 border-emerald-200/50 dark:border-emerald-900/30"
                      }`}>
                        {response}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Barre d'actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/50">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleRecording}
                  disabled={systemStatus !== "ready" || isThinking}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                    systemStatus !== "ready" || isThinking
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      : isRecording
                      ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-500/30 hover:shadow-red-500/50"
                      : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
                  }`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  <span>{systemStatus !== "ready" ? "Indispo" : isRecording ? "Stop" : "Parler"}</span>
                </motion.button>

                {(isSpeaking || isPaused) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePause}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
                    title={isPaused ? "Reprendre" : "Pause"}
                  >
                    {isPaused ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </motion.button>
                )}

                {(isSpeaking || isPaused) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopSpeaking}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-all border border-zinc-200/60 dark:border-zinc-700/50"
                    title="Arreter"
                  >
                    <X size={18} />
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMuted(!muted)}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${
                    !muted
                      ? "bg-white/80 dark:bg-zinc-800/80 text-emerald-600 dark:text-emerald-400 border-zinc-200/60 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700"
                      : "bg-zinc-200 dark:bg-zinc-700/80 text-zinc-400 border-zinc-300/60 dark:border-zinc-600/50"
                  }`}
                  title={muted ? "Activer audio" : "Couper audio"}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={systemStatus === "ready" ? { scale: 1.08 } : {}}
        whileTap={systemStatus === "ready" ? { scale: 0.92 } : {}}
        onClick={() => systemStatus === "ready" && setIsOpen(!isOpen)}
        className={`relative group ${systemStatus !== "ready" ? "cursor-not-allowed" : "cursor-pointer"}`}
        title={
          systemStatus === "checking" ? "Mia demarre..." :
          systemStatus === "error" ? "Mia indisponible (micro non supporte)" : ""
        }
      >
        {/* Halo lumineux pulsant en arriere-plan (visible en sombre ET clair) */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
            systemStatus === "ready"
              ? isRecording
                ? "bg-red-500/50 animate-pulse"
                : isSpeaking
                ? "bg-emerald-400/55 animate-pulse"
                : "bg-emerald-500/40 group-hover:bg-emerald-400/60"
              : systemStatus === "error"
              ? "bg-red-500/40"
              : "bg-zinc-400/25"
          }`}
        />

        {/* Halo secondaire pulse lent */}
        <div
          className={`absolute inset-2 rounded-full blur-xl transition-all duration-1000 ${
            systemStatus === "ready" && !isRecording && !isSpeaking
              ? "bg-emerald-400/30 animate-pulse"
              : "bg-transparent"
          }`}
          style={{ animationDuration: "3s" }}
        />

        {/* Cercle pulse externe (anneau visible flottant) */}
        {systemStatus === "ready" && (
          <motion.div
            className={`absolute inset-0 rounded-full border-2 pointer-events-none ${
              isRecording ? "border-red-400/70" : isSpeaking ? "border-emerald-300/70" : "border-emerald-400/40"
            }`}
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}

        {/* Conteneur transparent : juste l'animation Lottie visible avec drop-shadow */}
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-all duration-300 ${
            systemStatus !== "ready" ? "grayscale opacity-70" : ""
          }`}
          style={{
            filter:
              systemStatus === "ready"
                ? isRecording
                  ? "drop-shadow(0 12px 24px rgba(239,68,68,0.55)) drop-shadow(0 0 18px rgba(239,68,68,0.4))"
                  : isSpeaking
                  ? "drop-shadow(0 12px 24px rgba(16,185,129,0.55)) drop-shadow(0 0 18px rgba(16,185,129,0.45))"
                  : "drop-shadow(0 14px 28px rgba(16,185,129,0.4)) drop-shadow(0 0 14px rgba(16,185,129,0.3))"
                : "drop-shadow(0 8px 16px rgba(0,0,0,0.25))",
          }}
        >
          <DotLottieReact
            src={currentAnimation}
            loop
            autoplay
            style={{ width: "115%", height: "115%" }}
          />

          {/* Indicateur statut subtil flottant */}
          <div className="absolute -bottom-1 -right-1 z-10">
            <div
              className={`w-5 h-5 rounded-full border-[3px] border-white dark:border-zinc-900 shadow-lg shadow-black/30 ${
                isRecording
                  ? "bg-red-500 animate-pulse"
                  : isSpeaking
                  ? "bg-emerald-400 animate-pulse"
                  : systemStatus === "ready"
                  ? "bg-emerald-500 animate-pulse"
                  : systemStatus === "error"
                  ? "bg-red-500"
                  : "bg-zinc-400 animate-pulse"
              }`}
            />
          </div>

          {/* Overlay statut non-ready */}
          {systemStatus !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm rounded-full">
              <div
                className={`w-2.5 h-2.5 rounded-full mb-1 ${
                  systemStatus === "checking" ? "bg-zinc-200 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider drop-shadow-md">
                {systemStatus === "checking" ? "..." : "HS"}
              </span>
            </div>
          )}
        </div>

        {/* Tooltip subtil au hover, sans encadre lourd */}
        {!isOpen && systemStatus === "ready" && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute top-1/2 -left-4 -translate-x-full -translate-y-1/2 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          >
            <div className="bg-zinc-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-zinc-900 text-[11px] font-semibold px-4 py-2 rounded-full shadow-xl whitespace-nowrap tracking-wide">
              Parler a Mia
            </div>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
