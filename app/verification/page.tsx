"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, UploadCloud, Fingerprint, 
  CheckCircle2, ArrowRight, Loader2, Camera, User, Lock, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nni, setNni] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulation d'un appel API pour validation KYC
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(4); // Étape de succès
    }, 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 bg-[#070718] text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN - Information */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="lg:col-span-5 flex flex-col justify-center space-y-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center border border-primary/30">
                <ShieldCheck size={24} />
              </div>
              <span className="text-xl font-black tracking-widest uppercase">Vérification KYC</span>
            </div>
            <h1 className="text-4xl font-black leading-tight mb-4 tracking-tight">
              Certifiez votre identité <span className="text-primary italic">citoyenne</span>.
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Pour garantir l'intégrité de la plateforme Komoe et prévenir les faux signalements, l'accès en écriture (votes, signalements) nécessite une vérification d'identité.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1"><Lock className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-bold text-white text-sm">Données chiffrées de bout en bout</p>
                <p className="text-xs text-white/40 mt-1">Vos documents ne sont pas stockés en clair.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><Fingerprint className="w-5 h-5 text-accent" /></div>
              <div>
                <p className="font-bold text-white text-sm">Preuve d'unicité Blockchain</p>
                <p className="text-xs text-white/40 mt-1">Une seule identité citoyenne par portefeuille.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN - Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }} 
          className="lg:col-span-7"
        >
          <Card className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" 
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <CardContent className="p-8 sm:p-12">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: NNI */}
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-black">Numéro National</h2>
                      <p className="text-white/50 text-sm mt-2">Saisissez votre Numéro National d'Identification (NNI) présent sur votre CNI.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-white/50 tracking-widest mb-2 ml-1">Numéro NNI *</label>
                      <input 
                        type="text" 
                        placeholder="C0000000000"
                        value={nni}
                        onChange={(e) => setNni(e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-4 text-lg font-black tracking-widest text-center text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                      />
                    </div>

                    <Button 
                      onClick={handleNext} 
                      disabled={nni.length < 10}
                      className="w-full h-14 rounded-xl font-black text-base bg-white text-[#070718] hover:bg-white/90 transition-all"
                    >
                      Continuer <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {/* STEP 2: ID Upload */}
                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
                        <Camera className="w-8 h-8 text-accent" />
                      </div>
                      <h2 className="text-2xl font-black">Pièce d'Identité</h2>
                      <p className="text-white/50 text-sm mt-2">Uploadez une photo claire de votre pièce d'identité officielle.</p>
                    </div>

                    <div className="relative border-2 border-dashed border-white/20 rounded-3xl p-8 hover:bg-white/5 hover:border-primary/50 transition-all text-center cursor-pointer group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      {idFile ? (
                        <div className="space-y-3">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                          <p className="font-bold text-white">{idFile.name}</p>
                          <p className="text-xs text-white/50">Cliquez pour modifier</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-8 h-8 text-white/50 group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-white">Cliquez ou glissez votre document</p>
                            <p className="text-xs text-white/40 mt-1">Formats acceptés : JPG, PNG, PDF (Max 5Mo)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handleBack} variant="outline" className="flex-1 h-14 rounded-xl border-white/20 text-white hover:bg-white/10">
                        Retour
                      </Button>
                      <Button onClick={handleNext} disabled={!idFile} className="flex-[2] h-14 rounded-xl font-black bg-white text-[#070718] hover:bg-white/90">
                        Continuer <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Validation */}
                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <AlertCircle className="w-8 h-8 text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-black">Confirmation</h2>
                      <p className="text-white/50 text-sm mt-2">Veuillez vérifier vos informations avant la soumission finale.</p>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-white/50 text-sm font-bold uppercase tracking-widest">Numéro NNI</span>
                        <span className="text-white font-black">{nni}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-white/50 text-sm font-bold uppercase tracking-widest">Document</span>
                        <span className="text-white font-black truncate max-w-[150px]">{idFile?.name}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handleBack} variant="outline" disabled={isSubmitting} className="flex-1 h-14 rounded-xl border-white/20 text-white hover:bg-white/10">
                        Modifier
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting} 
                        className="flex-[2] h-14 rounded-xl font-black bg-gradient-to-r from-primary to-accent text-white border-0 hover:opacity-90 shadow-lg shadow-primary/20"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyse...</>
                        ) : (
                          <><ShieldCheck className="w-5 h-5 mr-2" /> Soumettre l'audit</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Success */}
                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-8"
                  >
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/50">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-black text-emerald-400">Profil Vérifié !</h2>
                    <p className="text-white/60 leading-relaxed max-w-sm mx-auto">
                      Votre identité a été validée avec succès. Vous avez désormais un accès complet pour soumettre des signalements et auditer votre commune.
                    </p>
                    <div className="pt-8">
                      <Button 
                        onClick={() => router.push("/public/dashboard")} 
                        className="w-full h-14 rounded-xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      >
                        Accéder au Tableau de Bord
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
