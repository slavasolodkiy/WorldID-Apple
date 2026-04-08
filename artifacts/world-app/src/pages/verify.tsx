import { useState } from "react";
import { useGetVerificationStatus, useInitiateVerification, useCompleteVerification } from "@workspace/api-client-react";
import { Shield, Fingerprint, ShieldCheck, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Verify() {
  const { data: status, isLoading, refetch } = useGetVerificationStatus();
  const initiateVerif = useInitiateVerification();
  const completeVerif = useCompleteVerification();
  
  const [isScanning, setIsScanning] = useState(false);

  const handleVerify = async () => {
    setIsScanning(true);
    try {
      const session = await initiateVerif.mutateAsync({});
      // Simulate orb scanning delay
      await new Promise(r => setTimeout(r, 2000));
      // proof is a required field; in a real app this would be the ZKP from the Orb device
      const simulatedProof = `sim_proof_${session.sessionId}_${Date.now()}`;
      await completeVerif.mutateAsync({
        data: { sessionId: session.sessionId, proof: simulatedProof },
      });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 py-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tight">World ID</h1>
      </header>

      <main className="flex-1 px-6 py-6 flex flex-col max-w-sm mx-auto w-full">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-3xl" />
        ) : status?.isVerified ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full aspect-[1.58/1] rounded-2xl p-6 overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
            }}
          >
            {/* Orb Glow Background */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.4)_0%,transparent_60%)] mix-blend-screen blur-xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(147,51,234,0.3)_0%,transparent_60%)] mix-blend-screen blur-xl animate-pulse" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold tracking-widest uppercase border border-white/10">
                {status.level} Verified
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Nullifier Hash</div>
              <div className="font-mono text-sm text-white/90 truncate w-full">
                {status.nullifierHash || "0x..."}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin-slow"
                  />
                )}
              </AnimatePresence>
              <div className={cn(
                "w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-500 to-purple-600 flex items-center justify-center transition-all duration-700 shadow-[0_0_50px_rgba(0,212,255,0.3)]",
                isScanning ? "scale-95 shadow-[0_0_80px_rgba(0,212,255,0.6)]" : ""
              )}>
                <div className="w-[95%] h-[95%] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white/80" />
                </div>
              </div>
              
              {isScanning && (
                <motion.div 
                  initial={{ top: '10%' }}
                  animate={{ top: '90%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-1 bg-primary blur-[2px] shadow-[0_0_10px_rgba(0,212,255,1)]"
                />
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-3">Verify your humanity</h2>
            <p className="text-muted-foreground text-sm mb-8 px-4">
              Get a World ID to prove you're a unique human online, while keeping your identity totally private.
            </p>

            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl bg-white text-black hover:bg-white/90"
              onClick={handleVerify}
              disabled={isScanning}
              data-testid="button-verify"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : "Verify with Orb"}
            </Button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <h3 className="font-bold text-lg">Verification Levels</h3>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50">
            <Fingerprint className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Device</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Basic verification using your phone's secure enclave. Good for everyday apps.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <Shield className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary">Orb</h4>
              <p className="text-xs text-primary/80 mt-1 leading-relaxed">Maximum security biometric verification. Required for claiming grants and high-value actions.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
