"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface EditorProps {
  onSave: (content: string) => void;
  initialContent?: string;
  initialImage?: string | null; // Receive image URL from DB
  onImageUpload?: (file: File) => Promise<void>; // Handle upload function
  onImageDelete?: () => void; // Handle delete function
}

const QUOTES = [
  "What made you smile today?",
  "The best way out is always through. – Robert Frost",
  "Write it on your heart that every day is the best day in the year.",
  "Breathe. It’s just a bad day, not a bad life.",
  "Happiness depends upon ourselves.",
  "Every moment is a fresh beginning.",
  "Capture the moment, it lives forever.",
  "How are you really feeling right now?",
  "Small steps every day.",
];

export default function Editor({ onSave, initialContent = "", initialImage, onImageUpload, onImageDelete }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [quote, setQuote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedContent = useRef(initialContent);

  // Pick a random quote only once when component mounts
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // Update content when switching days
  useEffect(() => {
    setContent(initialContent || "");
    lastSavedContent.current = initialContent || "";
  }, [initialContent]);

  // Auto-save logic
  useEffect(() => {
    if (content === lastSavedContent.current) return;
    const timer = setTimeout(() => {
      onSave(content);
      lastSavedContent.current = content;
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, onSave]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    
    setIsUploading(true);
    try {
      await onImageUpload(file);
    } catch (error) {
      console.error(error);
      alert("Failed to upload image");
    }
    setIsUploading(false);
  };

  return (
    <div className="w-full h-full flex flex-col relative group">
      
      {/* PHOTO AREA (Polaroid Style) */}
      <div className="mb-6 min-h-[40px]">
        {initialImage ? (
          <div className="relative inline-block group/image">
            <div className="p-3 bg-white border border-stone-200 shadow-md rounded-sm transform -rotate-2 transition-transform duration-300 group-hover/image:rotate-0 group-hover/image:scale-105">
              <img 
                src={initialImage} 
                alt="Memory" 
                className="max-h-64 max-w-full rounded-sm object-cover" 
              />
            </div>
            {onImageDelete && (
              <button 
                onClick={onImageDelete}
                className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-md text-red-400 hover:text-red-600 opacity-0 group-hover/image:opacity-100 transition-all scale-90 hover:scale-110"
                title="Remove photo"
              >
                <X size={16} strokeWidth={3} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {onImageUpload && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/40 hover:bg-white/60 border border-white/60 rounded-2xl text-sm font-bold text-stone-500 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  {isUploading ? "Uploading..." : "Add Photo"}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* QUOTE & TEXTAREA */}
      <div className="relative flex-1">
        {/* Quote overlay only shows if NO text AND NO image */}
        {content === "" && !initialImage && (
          <div className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center pointer-events-none opacity-40 mt-10 transition-opacity duration-500">
             <Sparkles size={20} className="mb-3 text-[#D4A373] animate-pulse" />
             <p className="font-serif italic text-xl text-center max-w-md transition-colors duration-500 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
               "{quote}"
             </p>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="" 
          className="w-full h-full resize-none outline-none text-xl leading-relaxed bg-transparent p-2 font-serif z-10 transition-colors duration-500 placeholder:text-stone-300"
          style={{ color: 'var(--text-main)' }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}