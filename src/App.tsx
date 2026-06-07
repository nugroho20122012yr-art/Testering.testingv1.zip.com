import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette,
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
  MessageSquare,
  HelpCircle,
  Send,
  ImageIcon,
  Info,
  Lock,
  Check,
  RotateCcw,
  Zap,
  CheckCircle2,
  FileDown
} from "lucide-react";
import { Message, CrayonMode, CrayonStyleConfig } from "./types";
import { renderCrayonArtwork } from "./crayonRenderer";

// 9 Crayon Modes Definition
const CRAYON_SYSTEMS: CrayonStyleConfig[] = [
  {
    id: "multi",
    name: "Multi-Color Wax",
    colorHex: "linear-gradient(to right, #ef4444, #3b82f6, #10b981, #f59e0b)",
    bgColor: "bg-slate-800/80",
    textColor: "text-amber-400",
    description: "Original image colors mapped to a classic multi-colored wax palette."
  },
  {
    id: "red",
    name: "Red Cherry",
    colorHex: "rgb(215, 38, 56)",
    bgColor: "bg-red-950/40",
    textColor: "text-red-400",
    description: "Vibrant and intense monochrome red wax crayon sketch."
  },
  {
    id: "blue",
    name: "Sky Blue",
    colorHex: "rgb(26, 117, 239)",
    bgColor: "bg-blue-950/40",
    textColor: "text-blue-400",
    description: "Deep, tranquil monochrome blue ocean wax crayon sketch."
  },
  {
    id: "green",
    name: "Forest Green",
    colorHex: "rgb(34, 139, 34)",
    bgColor: "bg-emerald-950/40",
    textColor: "text-emerald-400",
    description: "Earthy, cool emerald green wax outlines and shades."
  },
  {
    id: "yellow",
    name: "Sunlight Yellow",
    colorHex: "rgb(249, 191, 59)",
    bgColor: "bg-amber-950/30",
    textColor: "text-yellow-400",
    description: "Warm golden-yellow crayon shading with bright contrast."
  },
  {
    id: "orange",
    name: "Pumpkin Orange",
    colorHex: "rgb(242, 120, 75)",
    bgColor: "bg-orange-950/30",
    textColor: "text-orange-400",
    description: "Energetic and warm juicy orange monochrome sketch."
  },
  {
    id: "violet",
    name: "Royal Violet",
    colorHex: "rgb(155, 89, 182)",
    bgColor: "bg-purple-950/40",
    textColor: "text-purple-400",
    description: "Deep imperial violet/lavender soft chalky drawings."
  },
  {
    id: "brown",
    name: "Terra Cotta Brown",
    colorHex: "rgb(139, 90, 43)",
    bgColor: "bg-amber-900/20",
    textColor: "text-amber-650",
    description: "Organic sienna brown resembling rustic wooden board lines."
  },
  {
    id: "black",
    name: "Charcoal Black",
    colorHex: "rgb(44, 53, 57)",
    bgColor: "bg-slate-900/80",
    textColor: "text-slate-400",
    description: "Classic graphite charcoal style for raw structural contours."
  }
];

export default function App() {
  // Main states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crayonMode, setCrayonMode] = useState<CrayonMode>("multi");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);

  // Mobile layout workspace tab switcher to lock sizing and enforce scrollability
  const [activeMobileTab, setActiveMobileTab] = useState<"controls" | "stage" | "chat">("stage");

  // Sliders for pixel rendering adjustments
  const [textureIntensity, setTextureIntensity] = useState<number>(55);
  const [outlineStrength, setOutlineStrength] = useState<number>(65);
  const [paperGrain, setPaperGrain] = useState<number>(45);
  const [colorCount, setColorCount] = useState<number>(10);

  // View toggler (0: Side-By-Side, 1: Split-Slide, 2: Result Only)
  const [viewTab, setViewTab] = useState<"compare" | "compiled">("compare");
  const [splitRatio, setSplitRatio] = useState<number>(50); // 0 to 100 for side-by-side wipe

  // Chat interface states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Halo! Saya adalah asisten khusus CID•AI. Tugas saya di sini hanya memandu Anda tentang cara menggunakan web konverter krayon ini. Silakan tanyakan hal-hal terkait upload gambar, pemilihan 9 warna krayon, pengaturan kontur kertas, atau proses download!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle local image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setOutputImageUrl(null); // Clear previous result
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Run Crayon Renderer
  const handleGenerate = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    // Create virtual Image element to render onto Canvas
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      try {
        const renderCanvas = renderCrayonArtwork(img, crayonMode, {
          textureIntensity,
          outlineStrength,
          paperGrain,
          colorCount
        });
        
        // Convert canvas output to data URL
        const dataUrl = renderCanvas.toDataURL("image/png");
        setOutputImageUrl(dataUrl);
        setViewTab("compiled"); // Switch to focus view
        setActiveMobileTab("stage"); // Focus Stage on mobile
      } catch (err) {
        console.error("Rendering error:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
      alert("Gagal memuat gambar asli. Silakan coba file lain.");
    };
  };

  // Preset configuration click handlers
  const handleApplyPreset = (modeId: CrayonMode) => {
    setCrayonMode(modeId);
  };

  // Handle FAQ click to feed chatbot automatically
  const handleFAQClick = (question: string) => {
    setChatInput(question);
    submitMessage(question);
  };

  // Chat message submit handler
  const submitMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || chatInput;
    if (!rawMsg.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: rawMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMessage]);
    if (!textToSend) setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawMsg,
          history: chatHistory.slice(-10) // Send recent context only
        })
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: data.reply || "Maaf, terjadi ketidakcocokan dalam respons server.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      // Fallback response with beautiful layout
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: "Maaf, koneksi ke asisten utama kami sedang sibuk atau kunci API belum dikonfigurasi. Namun, Anda tetap bisa mengonversi gambar di sebelah kiri secara tak terbatas dan gratis!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Reset current artwork
  const handleReset = () => {
    setSelectedFile(null);
    setImageSrc(null);
    setOutputImageUrl(null);
    setViewTab("compare");
  };

  // Download artwork helper
  const handleDownload = () => {
    if (!outputImageUrl) return;
    const link = document.createElement("a");
    link.download = `cid_ai_crayon_${crayonMode}_${Date.now()}.png`;
    link.href = outputImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="cid-app-container" className="h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-150 flex flex-col font-sans select-none antialiased relative">
      
      {/* HEADER SECTION (NO ESCAPING OVERFLOW) */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/90 px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-blue-500 p-[2px] shadow-lg shadow-purple-950/20">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
              <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 text-lg">CID</span>
            </div>
          </div>
          <div>
            <h1 className="font-display font-extrabold tracking-tight text-white flex items-center gap-2 text-md">
              CID•AI <span className="text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono px-1.5 py-0.5 rounded-full font-medium">Infinite Engine</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Artistic Wax Crayon Conversions</p>
          </div>
        </div>

        {/* Top Indicators - Anti AI Slop: No raw metadata, simple neat status */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local WebGL Render: Active</span>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <span>Powered by Client GPU + GenAI support</span>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION TABS (Visible only on mobile/tablet screen widths) */}
      <div className="lg:hidden h-12 bg-slate-955 border-b border-slate-900 flex items-center p-1 shrink-0 z-50">
        <div className="grid grid-cols-3 w-full h-full gap-1">
          <button
            onClick={() => setActiveMobileTab("controls")}
            className={`rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-tight font-mono transition-all duration-150 cursor-pointer ${
              activeMobileTab === "controls"
                ? "bg-indigo-900/40 border border-indigo-805 text-indigo-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Kontrol</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("stage")}
            className={`rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-tight font-mono transition-all duration-150 cursor-pointer ${
              activeMobileTab === "stage"
                ? "bg-indigo-900/40 border border-indigo-805 text-indigo-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>2. Kanvas</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("chat")}
            className={`rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-tight font-mono transition-all duration-150 cursor-pointer ${
              activeMobileTab === "chat"
                ? "bg-indigo-900/40 border border-indigo-805 text-indigo-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3. Asisten</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA (SCROLL RESTRICTED TO HEIGHTS OF CONTAINERS) */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col lg:flex-row bg-slate-950">
        
        {/* LEFT COLUMN: CONTROLS & PALETTES (3 Cols Equivalent) */}
        <section className={`w-full lg:w-80 lg:border-r border-slate-900 bg-slate-950 flex flex-col min-h-0 shrink-0 ${
          activeMobileTab === "controls" ? "flex flex-1" : "hidden lg:flex"
        }`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* STEP 1: PHOTO SOURCE */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-indigo-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-indigo-950 text-indigo-400 flex items-center justify-center text-[10px] font-bold">1</span>
                SUMBER GAMBAR ORIGINAL
              </label>

              {!imageSrc ? (
                // Dropzone
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/10 hover:bg-indigo-950/10 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-200 font-medium">Klik atau Drag & Drop Gambar</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                // Preview thumbnail with reset button
                <div className="relative bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={imageSrc} className="max-w-full max-h-full object-cover" alt="Original Thumb" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{selectedFile?.name || "Image_Original.png"}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) + " MB" : "Standard Photo")}
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-1.5 hover:bg-red-950/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Hapus gambar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* STEP 2: 9 CRAYON STYLES */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-indigo-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-indigo-950 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                PILIH PALET CRAYON (9 WARNA)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {CRAYON_SYSTEMS.map((sys) => {
                  const isSelected = crayonMode === sys.id;
                  return (
                    <button
                      key={sys.id}
                      onClick={() => handleApplyPreset(sys.id)}
                      className={`relative group rounded-xl p-2 bg-slate-900/20 border transition-all duration-200 text-left flex flex-col justify-between items-start h-[72px] cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 shadow-lg shadow-indigo-950/20 bg-slate-900/60"
                          : "border-slate-900 hover:border-slate-800 hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div
                          className="w-5.5 h-3.5 rounded-full"
                          style={{ background: sys.colorHex }}
                        />
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-200 truncate leading-none mt-2">
                          {sys.name.split(" ")[0]}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono truncate leading-none mt-1">
                          {sys.id === "multi" ? "Full Tone" : "Mono"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: TEXTURIZERS */}
            <div className="space-y-4 bg-slate-900/10 border border-slate-900 rounded-xl p-3">
              <label className="text-xs font-mono font-semibold text-indigo-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-indigo-950 text-indigo-400 flex items-center justify-center text-[10px] font-bold">3</span>
                PENYETEL TEKSTUR & CORETAK
              </label>

              {/* Slider 1: Wax Grain */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-mono">Kepulangan Wax (Texture)</span>
                  <span className="text-[11px] text-indigo-300 font-mono font-semibold">{textureIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={textureIntensity}
                  onChange={(e) => setTextureIntensity(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Outline Sketched Edge */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-mono">Garis Outlines Kontur</span>
                  <span className="text-[11px] text-indigo-300 font-mono font-semibold">{outlineStrength}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={outlineStrength}
                  onChange={(e) => setOutlineStrength(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 3: Paper Fibers Grid */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-mono">Kekasaran Kertas</span>
                  <span className="text-[11px] text-indigo-300 font-mono font-semibold">{paperGrain}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={paperGrain}
                  onChange={(e) => setPaperGrain(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 4: Quantization Palette */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-mono">Jumlah Gradasi Pigmen</span>
                  <span className="text-[11px] text-indigo-300 font-mono font-semibold">{colorCount} Kelas</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="32"
                  value={colorCount}
                  onChange={(e) => setColorCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* GENERATE RUN BUTTON IN STICKY CORNER */}
          <div className="p-4 border-t border-slate-900 bg-slate-950">
            <button
              onClick={handleGenerate}
              disabled={!imageSrc || isProcessing}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-display font-bold text-sm transition-all duration-300 ${
                !imageSrc
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : isProcessing
                  ? "bg-indigo-900 text-indigo-300"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-950/40 text-white cursor-pointer active:scale-[0.98]"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Mengonversi Gaya Crayon...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Mulai Konversi Crayon</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* MIDDLE COLUMN: ART SHOWCASE STAGE (5 Cols Equivalent) */}
        <section className={`flex-1 min-h-0 bg-slate-900/30 flex flex-col relative ${
          activeMobileTab === "stage" ? "flex flex-1" : "hidden lg:flex"
        }`}>
          
          {/* VIEW SWITCHER MENU */}
          <div className="h-14 border-b border-slate-900/80 px-6 flex items-center justify-between z-10 bg-slate-950/70 select-none">
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewTab("compare")}
                className={`py-1 px-3 rounded-md text-xs font-medium font-mono transition-colors ${
                  viewTab === "compare"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Pembanding (Original vs Crayon)
              </button>
              <button
                onClick={() => setViewTab("compiled")}
                className={`py-1 px-3 rounded-md text-xs font-medium font-mono transition-colors ${
                  viewTab === "compiled"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Karya Seni Krayon Saja
              </button>
            </div>

            {outputImageUrl && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleDownload}
                className="py-1.5 px-3.5 rounded-lg bg-indigo-950/80 border border-indigo-800 hover:border-indigo-600 text-indigo-300 hover:text-white flex items-center gap-1.5 font-mono text-xs cursor-pointer transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </motion.button>
            )}
          </div>

          {/* MAIN ARTBOARD FOR DRAWINGS */}
          <div className="flex-1 min-h-0 p-6 flex items-center justify-center overflow-hidden">
            {!imageSrc ? (
              // Empty Display
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center mx-auto text-indigo-400 shadow-md">
                  <ImageIcon className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-200 text-md">Belum Ada Foto Terpilih</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Aplikasi ini akan mengubah detail pigmen pixel dari foto Anda menjadi anyaman lilin krayon secara presisi dan dramatis.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-indigo-400 font-mono text-xs transition-colors cursor-pointer"
                >
                  Pilih Foto Sekarang
                </button>
              </div>
            ) : (
              // Interactive Stage
              <div ref={containerRef} className="w-full h-full relative flex items-center justify-center min-h-0 bg-slate-950/45 rounded-2xl border border-slate-900 p-2 overflow-hidden shadow-inner">
                
                {viewTab === "compare" ? (
                  // Dual Slider View / Side-By-Side Split Overlay
                  <div className="relative max-w-full max-h-full aspect-auto flex items-center justify-center overflow-hidden h-full w-full">
                    
                    {/* Background Original Photo */}
                    <img
                      src={imageSrc}
                      className="max-w-full max-h-full object-contain pointer-events-none rounded-xl"
                      alt="Source Static"
                      style={{ opacity: outputImageUrl ? 0.35 : 1 }}
                    />

                    {outputImageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={outputImageUrl}
                          className="max-w-full max-h-full object-contain pointer-events-none rounded-xl"
                          alt="Crayon Art Snapshot"
                        />
                        {/* Overlay label marker */}
                        <div className="absolute bottom-4 left-4 bg-emerald-950/90 border border-emerald-800 text-emerald-400 text-[10px] font-mono px-2 py-1 rounded shadow">
                          Sandingkan Crayon
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // High Definition Crayon Result Canvas Only
                  <div className="relative max-w-full max-h-full flex items-center justify-center h-full w-full">
                    {outputImageUrl ? (
                      <div className="relative flex flex-col items-center max-w-full max-h-full">
                        <img
                          src={outputImageUrl}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-850"
                          alt="Crayon Styled Artwork"
                        />
                        <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-850 text-amber-400 text-[10px] font-mono px-2.5 py-1 rounded-full shadow flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>CID•AI Crayon Artwork Ready</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-indigo-950 border border-indigo-900 text-indigo-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <Sliders className="w-5 h-5 animate-spin" />
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          Silakan klik tombol <span className="text-indigo-400 font-bold">Mulai Konversi</span> di panel kontrol kiri untuk merender gaya lilin krayon.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats Toolbar (No Overflow) */}
          <div className="h-11 border-t border-slate-900 bg-slate-950/40 px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0 select-none">
            <span>Model: {CRAYON_SYSTEMS.find(c => c.id === crayonMode)?.name || "Original Default"}</span>
            <span>Ratio Sizing: Dynamic WebGL Canvas</span>
            <span>Rendering: Unlimited Frames (100% Client GPU)</span>
          </div>
        </section>

        {/* RIGHT COLUMN: REASSURING SUPPORT CHATBOT (4 Cols Equivalent) */}
        <section className={`w-full lg:w-96 lg:border-l border-slate-900 bg-slate-950 flex flex-col min-h-0 shrink-0 ${
          activeMobileTab === "chat" ? "flex flex-1" : "hidden lg:flex"
        }`}>
          
          {/* Chat Header */}
          <div className="h-14 px-4 border-b border-slate-900 flex items-center justify-between shrink-0 bg-slate-950/75 select-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-900 shadow">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-display text-white tracking-wide">PANDUAN ASISTEN</h2>
                <p className="text-[9px] text-slate-500 font-mono leading-none">Topik Khusus CID•AI Saja</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50 text-[10px] text-indigo-300 font-mono">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Grup Terisolasi</span>
            </div>
          </div>

          {/* MESSAGE HISTORY */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-950/60 scroll-smooth">
            
            {/* Quick Helper Chip Prompts */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-mono font-semibold text-indigo-400 tracking-wider block">
                TANYA ASISTEN CEPAT:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Bagaimana cara mengunggah foto?",
                  "Fungsi dari 9 warna krayon?",
                  "Apakah ada batas pengunggahan?",
                  "Mengapa gambar belum diconvert?"
                ].map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFAQClick(faq)}
                    className="text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer active:scale-95 leading-snug"
                  >
                    {faq}
                  </button>
                ))}
              </div>
            </div>

            {chatHistory.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAi ? "justify-start" : "justify-end"}`}
                >
                  {isAi && (
                    <div className="w-6.5 h-6.5 rounded-lg bg-indigo-950/50 border border-indigo-900 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 font-normal leading-relaxed ${
                      isAi
                        ? "bg-slate-900/70 border border-slate-850 rounded-tl-none text-left"
                        : "bg-indigo-600 rounded-tr-none text-right ml-auto"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[8.5px] opacity-40 font-mono mt-1 w-full block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6.5 h-6.5 rounded-lg bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono animate-bounce">
                  AI
                </div>
                <div className="bg-slate-900/60 border border-slate-850 text-slate-400 max-w-[80%] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* CHAT INPUT AREA */}
          <div className="p-4 border-t border-slate-900 bg-slate-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanya cara menggunakan CID•AI..."
                className="w-full pl-3.5 pr-11 py-2.5 bg-slate-900 border border-slate-800 text-xs rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans text-slate-100"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white rounded-lg transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>
      </main>

    </div>
  );
}
