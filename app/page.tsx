"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { format, subYears } from "date-fns"; 
import { Book, Loader2, Cloud, Smile, Meh, Frown, Sun, CloudRain, Moon, Search, X, Calendar as CalendarIcon, Heart, Flame, LogOut, Star, History, Image as ImageIcon } from "lucide-react"; 
import Editor from "@/components/Editor"; 
import { db, storage } from "./firebase"; 
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteField } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

const Calendar = dynamic(() => import("react-calendar"), { ssr: false });
import "react-calendar/dist/Calendar.css"; 

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const MOODS = [
  { id: 'great', icon: Sun, color: '#FF9B85', label: 'Amazing' },      
  { id: 'good', icon: Smile, color: '#EAC435', label: 'Good' },        
  { id: 'okay', icon: Meh, color: '#7CB518', label: 'Okay' },          
  { id: 'bad', icon: Cloud, color: '#5C80BC', label: 'Not Great' },    
  { id: 'awful', icon: CloudRain, color: '#DB504A', label: 'Rough' },  
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [date, setDate] = useState<Value>(new Date());
  const [savedContent, setSavedContent] = useState(""); 
  const [savedImage, setSavedImage] = useState<string | null>(null); 
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entryMoods, setEntryMoods] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState('morning');
  const [streak, setStreak] = useState(0);
  
  const [onThisDayEntry, setOnThisDayEntry] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auth Listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Theme Applier
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'morning' ? 'night' : 'morning');
  };

  const getDateKey = (d: Value) => {
    if (d instanceof Date) return format(d, "yyyy-MM-dd");
    return format(new Date(), "yyyy-MM-dd");
  };

  // --- 1. Fetch Entries & "On This Day" ---
  useEffect(() => {
    const fetchEntries = async () => {
      if (!mounted || !user) return;
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "journal"));
        const moodMap: Record<string, string> = {};
        
        setStreak(querySnapshot.size);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.mood) moodMap[doc.id] = data.mood; 
          else moodMap[doc.id] = 'neutral'; 
        });
        setEntryMoods(moodMap);

        // Check 1 Year Ago
        const lastYear = subYears(new Date(), 1);
        const lastYearKey = format(lastYear, "yyyy-MM-dd");
        const lastYearDoc = await getDoc(doc(db, "users", user.uid, "journal", lastYearKey));
        
        if (lastYearDoc.exists()) {
          setOnThisDayEntry({ date: lastYearKey, ...lastYearDoc.data() });
        } else {
          setOnThisDayEntry(null);
        }

      } catch (error) { console.error("Error loading data:", error); }
    };
    fetchEntries();
  }, [mounted, user]);

  // --- 2. Fetch Specific Day ---
  useEffect(() => {
    const fetchData = async () => {
      if (!mounted || !user) return;
      setIsLoading(true);
      const dateKey = getDateKey(date);
      try {
        const docRef = doc(db, "users", user.uid, "journal", dateKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSavedContent(data.content || "");
          setSavedImage(data.imageUrl || null);
          setSelectedMood(data.mood || null);
        } else {
          setSavedContent("");
          setSavedImage(null);
          setSelectedMood(null);
        }
      } catch (error) { console.error("Error fetching:", error); }
      setIsLoading(false);
    };
    fetchData();
  }, [date, mounted, user]);

  // --- 3. Save Text/Mood ---
  const handleSave = async (content: string, moodOverride?: string) => {
    if (!user) return;
    setIsSaving(true);
    const dateKey = getDateKey(date);
    const moodToSave = moodOverride !== undefined ? moodOverride : selectedMood;
    try {
      await setDoc(doc(db, "users", user.uid, "journal", dateKey), {
        content: content,
        mood: moodToSave,
        date: dateKey,
        updatedAt: new Date()
      }, { merge: true });
      if (moodToSave) {
        setEntryMoods(prev => ({ ...prev, [dateKey]: moodToSave }));
      }
    } catch (error: any) { console.error("Auto-save failed:", error); }
    setTimeout(() => setIsSaving(false), 800);
  };

  // --- 4. Image Handlers ---
  const handleImageUpload = async (file: File) => {
    if (!user) return;
    const dateKey = getDateKey(date);
    const storageRef = ref(storage, `users/${user.uid}/${dateKey}_${file.name}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await setDoc(doc(db, "users", user.uid, "journal", dateKey), {
        imageUrl: downloadURL
      }, { merge: true });
      setSavedImage(downloadURL);
    } catch (error) { console.error("Upload failed", error); throw error; }
  };

  const handleImageDelete = async () => {
    if (!user) return;
    const dateKey = getDateKey(date);
    setSavedImage(null);
    await updateDoc(doc(db, "users", user.uid, "journal", dateKey), {
      imageUrl: deleteField()
    });
  };

  const handleMoodClick = (moodId: string) => {
    setSelectedMood(moodId);
    handleSave(savedContent, moodId); 
  };

  const handleSearch = async (query: string) => {
    if (!user) return;
    setSearchQuery(query);
    if (query.trim().length === 0) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "journal"));
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const content = data.content?.toLowerCase() || "";
        if (content.includes(query.toLowerCase())) {
          results.push({ id: doc.id, ...data, preview: data.content.substring(0, 100) });
        }
      });
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSearchResults(results);
    } catch (error) { console.error(error); }
    setIsSearching(false);
  };

  const selectSearchResult = (resultDate: string) => {
    const [year, month, day] = resultDate.split('-').map(Number);
    setDate(new Date(year, month - 1, day));
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const jumpToDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    setDate(new Date(year, month - 1, day));
  };

  const handleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) { console.error("Login failed", error); }
  };
  const handleLogout = () => { const auth = getAuth(); signOut(auth); };

  const displayDate = mounted && date instanceof Date ? format(date, "EEEE") : "Today";
  const displayFullDate = mounted && date instanceof Date ? format(date, "MMMM do, yyyy") : "";

  // ------------------------------------------------------------------
  // LOADING VIEW
  // ------------------------------------------------------------------
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]"><Loader2 className="animate-spin text-[#FFB5A7]" size={48} /></div>;

  // ------------------------------------------------------------------
  // LOGIN VIEW (PRETTY VERSION)
  // ------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#FFF9F2]">
        <div className="blob-cont"><div className="blob blob-1 opacity-60"></div><div className="blob blob-2 opacity-60"></div></div>
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-10 animate-bounce delay-1000 opacity-30 text-[#FFB5A7]"><Cloud size={80} /></div>
        <div className="absolute bottom-20 right-10 animate-pulse delay-700 opacity-30 text-[#FCD5CE]"><Heart size={100} fill="currentColor" /></div>

        <div className="w-full max-w-md p-10 rounded-[3rem] shadow-2xl backdrop-blur-2xl border border-white/60 flex flex-col items-center text-center transition-transform hover:scale-[1.01] duration-700 relative z-10"
             style={{ backgroundColor: 'rgba(255,255,255,0.45)', boxShadow: '0 20px 60px -10px rgba(255, 181, 167, 0.3)' }}>
          
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-[#FFB5A7] blur-2xl opacity-40 rounded-full group-hover:opacity-60 transition-opacity"></div>
            <div className="relative p-6 bg-white rounded-[2rem] shadow-lg transform -rotate-3 transition-transform group-hover:rotate-3 duration-500">
              <Book size={48} className="text-[#E8A598]" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-5xl font-serif font-black mb-4 text-[#4A4238] tracking-tight">My-Journal</h1>
          <p className="text-lg text-[#8D8070] mb-12 font-sans font-medium leading-relaxed max-w-xs">Your private, cozy sanctuary for thoughts, dreams, and memories.</p>

          <button onClick={handleLogin} className="w-full relative group overflow-hidden bg-white text-[#4A4238] font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFB5A7]/20 to-[#FCD5CE]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-center gap-4 text-lg">
                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                <span>Continue with Google</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // MAIN VIEW
  // ------------------------------------------------------------------
  return (
    <div className="relative min-h-screen">
      <div className="blob-cont"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>

      <main className="relative min-h-screen p-4 md:p-8 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto transition-colors duration-500">
        
        {/* SIDEBAR */}
        <section className="w-full md:w-[360px] flex flex-col gap-6 order-2 md:order-1">
          <div className="flex flex-col gap-4 p-6 rounded-[2.5rem] border backdrop-blur-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm"><img src={user.photoURL || ""} alt="User" /></div>
                <div><h1 className="text-lg font-sans font-black tracking-tight" style={{ color: 'var(--text-main)' }}>{user.displayName?.split(" ")[0]}'s Journal</h1><p className="text-xs font-bold opacity-40 uppercase" style={{ color: 'var(--text-main)' }}>Private</p></div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-400"><LogOut size={18} /></button>
            </div>
            
            <div className="flex gap-3 mt-2">
              <div className="flex-1 flex items-center gap-2 bg-white/50 p-3 rounded-2xl border border-white/40">
                <div className="bg-orange-100 p-1.5 rounded-full text-orange-500"><Flame size={16} fill="currentColor" /></div>
                <div><p className="text-xs font-bold opacity-40 uppercase" style={{ color: 'var(--text-main)' }}>Total</p><p className="text-sm font-black" style={{ color: 'var(--text-main)' }}>{streak} Entries</p></div>
              </div>
              <button onClick={() => setIsSearchOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-white/50 p-3 rounded-2xl border border-white/40 hover:bg-white text-sm font-bold text-stone-500"><Search size={16} /> Find</button>
            </div>
            <button onClick={toggleTheme} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider opacity-40 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-main)' }}>{theme === 'morning' ? <Moon size={14} /> : <Sun size={14} />} Switch Mode</button>
          </div>

          <div className="p-6 rounded-[2.5rem] shadow-xl backdrop-blur-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            {mounted && <Calendar onChange={setDate} value={date} className="font-sans w-full" tileContent={({ date, view }) => {
                if (view === 'month') {
                  const dateString = format(date, "yyyy-MM-dd");
                  const mood = entryMoods[dateString];
                  if (mood) {
                    const moodColor = MOODS.find(m => m.id === mood)?.color || '#D4A373';
                    return <div className="flex justify-center mt-1"><div className="h-1.5 w-1.5 rounded-full shadow-sm" style={{ backgroundColor: moodColor }} /></div>;
                  }
                }
                return null;
              }} />}
          </div>

          {onThisDayEntry && (
            <div className="p-6 rounded-[2.5rem] shadow-lg backdrop-blur-lg border relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" 
                 style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} onClick={() => jumpToDate(onThisDayEntry.date)}>
              <div className="absolute top-0 right-0 p-4 opacity-10"><History size={80} /></div>
              <div className="flex items-center gap-2 mb-2 text-[#E8A598]"><Star size={16} fill="currentColor" /><span className="text-xs font-black uppercase tracking-widest">On this day</span></div>
              <p className="font-serif text-lg italic line-clamp-3 opacity-80" style={{ color: 'var(--text-main)' }}>"{onThisDayEntry.content}"</p>
            </div>
          )}
        </section>

        {/* EDITOR AREA */}
        <section className="flex-1 rounded-[2.5rem] shadow-xl p-6 md:p-12 min-h-[500px] md:min-h-[600px] relative flex flex-col backdrop-blur-xl border transition-all duration-500 order-1 md:order-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex justify-between items-start mb-6 md:mb-8 pb-4 md:pb-6 border-b border-dashed" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div><h2 className="text-3xl md:text-5xl font-sans font-black mb-2 tracking-tight" style={{ color: 'var(--text-main)' }}>{displayDate}</h2><p className="font-sans text-lg md:text-xl font-bold opacity-50" style={{ color: 'var(--text-main)' }}>{displayFullDate}</p></div>
            <div className="flex flex-col items-end h-10 justify-center">
               {isLoading ? <Loader2 className="animate-spin opacity-50" size={24} style={{ color: 'var(--text-main)' }} /> : isSaving ? <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider animate-pulse opacity-50" style={{ color: 'var(--text-main)' }}>Saving...</div> : <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-40 transition-all" style={{ color: 'var(--text-main)' }}><Cloud size={16} /> Saved</div>}
            </div>
          </div>

          {/* EXPANDING MOOD DOCK */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-black uppercase tracking-widest opacity-30" style={{ color: 'var(--text-main)' }}>Current Vibe</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-[2rem] border shadow-inner backdrop-blur-md transition-colors duration-500 overflow-x-auto no-scrollbar"
                 style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'var(--card-border)' }}>
              {MOODS.map((mood) => {
                const Icon = mood.icon;
                const isSelected = selectedMood === mood.id;
                
                return (
                  <button key={mood.id} onClick={() => handleMoodClick(mood.id)}
                    className={`relative flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSelected ? 'bg-white shadow-lg scale-100 flex-[2]' : 'hover:bg-white/40 scale-95 hover:scale-100 flex-none'}`}>
                    <Icon size={24} className="transition-transform duration-300" style={{ color: mood.color, transform: isSelected ? 'scale(1.1) rotate(-10deg)' : 'scale(1) rotate(0deg)', fill: isSelected ? mood.color : 'transparent' }} strokeWidth={2.5} />
                    <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-500 ${isSelected ? 'max-w-[100px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-4'}`} style={{ color: mood.color }}>{mood.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 font-serif text-lg md:text-xl leading-relaxed">
            <Editor 
              key={getDateKey(date)} 
              initialContent={savedContent} 
              initialImage={savedImage}
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
              onSave={(content) => handleSave(content)} 
            />
          </div>
        </section>
      </main>
      
      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="absolute inset-2 md:inset-4 z-50 rounded-[2.5rem] p-6 md:p-12 flex flex-col transition-all duration-300 shadow-2xl backdrop-blur-xl border border-white/40" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between mb-8"><h2 className="text-2xl md:text-3xl font-sans font-black tracking-tight" style={{ color: 'var(--text-main)' }}>Search</h2><button onClick={() => setIsSearchOpen(false)} className="p-3 rounded-full hover:bg-black/5"><X size={28} style={{ color: 'var(--text-muted)' }} /></button></div>
          <input type="text" placeholder="Type to find a memory..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} autoFocus className="w-full px-6 py-5 rounded-3xl text-lg md:text-xl outline-none transition-all duration-300 border-2 border-transparent focus:border-[#E8A598]/50 shadow-inner" style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: 'var(--text-main)' }} />
          <div className="flex-1 overflow-y-auto space-y-4 mt-6 pr-2 custom-scrollbar">
            {searchResults.map((result) => (
              <button key={result.id} onClick={() => selectSearchResult(result.date)} className="w-full text-left p-5 rounded-3xl hover:bg-white/40 transition-all border border-transparent hover:border-white/60 group shadow-sm hover:shadow-md">
                <p className="font-sans font-bold text-xs uppercase opacity-50 mb-1" style={{ color: 'var(--text-main)' }}>{result.date}</p>
                <p className="font-serif text-lg opacity-80 line-clamp-2" style={{ color: 'var(--text-main)' }}>{result.preview}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}