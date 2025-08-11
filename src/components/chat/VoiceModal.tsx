import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Volume2 } from "lucide-react";

export type VoicePhase = "listening" | "thinking" | "speaking" | "done";

interface VoiceModalProps {
  open: boolean;
  phase: VoicePhase;
  transcript?: string;
  onClose: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ open, phase, transcript, onClose }) => {
  const statusLabel =
    phase === "listening"
      ? "Listening..."
      : phase === "thinking"
      ? "Generating reply..."
      : phase === "speaking"
      ? "Speaking..."
      : "Done";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Mode</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Shimmering banner */}
          <div
            className="w-full h-24 rounded-lg bg-gradient-to-r from-primary/15 via-primary/25 to-primary/15 bg-[length:200%_100%] animate-shine"
            aria-hidden
          />

          {/* Equalizer bars */}
          <div className="flex items-end justify-center gap-1 h-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 80}ms`, height: `${6 + ((i * 7) % 20)}px` }}
              />
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {phase === "listening" ? (
              <Mic className="animate-float-soft" />
            ) : phase === "speaking" ? (
              <Volume2 className="animate-float-soft" />
            ) : (
              <Loader2 className="animate-spin" />
            )}
            <span>{statusLabel}</span>
          </div>

          {transcript ? (
            <p className="text-center text-sm text-muted-foreground max-w-sm">You said: “{transcript}”</p>
          ) : null}

          <Button variant="outline" onClick={onClose} className="hover-scale" aria-label="Close voice modal">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
