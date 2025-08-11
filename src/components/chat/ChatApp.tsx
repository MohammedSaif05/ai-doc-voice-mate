import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageBubble } from "./MessageBubble";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { extractTextFromFile, truncateForPrompt } from "@/utils/docParser";
import { callGemini } from "@/utils/gemini";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Mic, MicOff, Send, Upload, Trash2, Volume2, VolumeX, Settings } from "lucide-react";

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

const STORAGE = {
  CHAT: "chatHistory",
  DOC: "docText",
  API: "geminiApiKey",
  STT: "sttEnabled",
  TTS: "ttsEnabled",
};

export const ChatApp: React.FC = () => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(STORAGE.CHAT, []);
  const [docText, setDocText] = useLocalStorage<string>(STORAGE.DOC, "");
  const [apiKey, setApiKey] = useLocalStorage<string>(STORAGE.API, "");
  const [sttEnabled, setSttEnabled] = useLocalStorage<boolean>(STORAGE.STT, true);
  const [ttsEnabled, setTtsEnabled] = useLocalStorage<boolean>(STORAGE.TTS, false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // SEO
  useEffect(() => {
    document.title = "AI Chatbot with Voice & Docs | Gemini";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Chatbot with Gemini, voice input/output, and document Q&A (PDF/DOCX/TXT)");

    const ld = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AI Chatbot with Voice & Docs",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Chat with Gemini, upload PDFs/DOCX/TXT, and use voice features.",
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const SpeechRecognition = useMemo(
    () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition,
    []
  );

  const startListening = () => {
    if (!SpeechRecognition) {
      toast({ title: "Voice input not supported", description: "Your browser does not support SpeechRecognition." });
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " : "") + transcript);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      setListening(true);
      recognition.start();
    } catch (e) {
      setListening(false);
      toast({ title: "Failed to start", description: String(e) });
    }
  };

  const speak = (text: string) => {
    if (!ttsEnabled) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const onSend = async () => {
    const content = input.trim();
    if (!content) return;
    if (!apiKey) {
      toast({ title: "API key required", description: "Open settings to add your Gemini API key.", });
      return;
    }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(
        apiKey,
        next,
        content,
        docText ? truncateForPrompt(docText) : undefined
      );
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", text: reply };
      const updated = [...next, aiMsg].slice(-40); // keep recent 20 exchanges
      setMessages(updated);
      speak(reply);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to fetch reply" });
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      setDocText(text);
      toast({ title: "Document processed", description: `${file.name} text extracted.` });
    } catch (e: any) {
      toast({ title: "Failed to read document", description: e?.message || String(e) });
    }
  };

  const onClear = () => {
    setMessages([]);
    toast({ title: "Chat cleared" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Gemini Chatbot</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="stt">STT</Label>
              <Switch id="stt" checked={sttEnabled} onCheckedChange={setSttEnabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="tts">TTS</Label>
              <Switch id="tts" checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Settings className="mr-2"/>Settings</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api">Gemini API Key</Label>
                    <Input
                      id="api"
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">Stored locally in your browser.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(apiKey)}>
                      Copy Key
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setApiKey("")}>Remove Key</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" size="sm" onClick={onClear}>
              <Trash2/>
              <span className="sr-only">Clear chat</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 grid gap-4">
        <Card className="border bg-card/60">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[55vh] md:h-[60vh] overflow-y-auto pr-1 space-y-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-10">Start chatting or upload a document to ask questions about it.</div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} text={m.text} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="animate-spin" /> Thinking...
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                />
                <Button onClick={onSend} disabled={loading}>
                  <Send />
                </Button>
                <Button
                  variant={sttEnabled ? "secondary" : "outline"}
                  onClick={() => {
                    if (!sttEnabled) return;
                    if (listening) {
                      try { (window as any).speechSynthesis?.cancel?.(); } catch {}
                      setListening(false);
                    } else {
                      startListening();
                    }
                  }}
                >
                  {listening ? <MicOff /> : <Mic />}
                </Button>
                <label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0] || undefined)}
                  />
                  <Button asChild variant="outline">
                    <span className="inline-flex items-center"><Upload className="mr-2"/>Upload</span>
                  </Button>
                </label>
              </div>

              {docText && (
                <details className="rounded-md border p-3 bg-muted/30">
                  <summary className="cursor-pointer select-none">Document loaded ({Math.round(docText.length / 1000)}k chars)</summary>
                  <div className="mt-2 max-h-40 overflow-y-auto text-sm text-muted-foreground whitespace-pre-wrap">
                    {docText.slice(0, 1200)}{docText.length > 1200 ? "..." : ""}
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => { setDocText(""); toast({ title: "Document removed" }); }}>
                      Remove document
                    </Button>
                  </div>
                </details>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 className={ttsEnabled ? "" : "hidden"} />
                <VolumeX className={ttsEnabled ? "hidden" : ""} />
                <span>Text-to-Speech is {ttsEnabled ? "enabled" : "disabled"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="container py-6 text-center text-sm text-muted-foreground">
        Built with Gemini, Web Speech API, and localStorage. Documents never leave your browser.
      </footer>
    </div>
  );
};
