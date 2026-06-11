import * as React from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft, Share2, Plus, Check, Search,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Link as LinkIcon, Save, Loader2, AlertCircle, Lock,
  MessageCircle, Send, X, Download, Type, Palette, Sparkles, Crosshair,
  Mic, MicOff, PhoneOff, Radio
} from "lucide-react";
import { saveAs } from "file-saver";
import { Button, Avatar, Badge, Input, Modal, cn } from "../components/ui-components";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import API from "../lib/api";
import { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import { useNotifications } from "../hooks/useNotifications";
import { useCursorPresence, getUserColor } from "../hooks/useCursorPresence";
import { useSpotlight } from "../hooks/useSpotlight";
import { useHuddle } from "../hooks/useHuddle";
import { useAIAssistant } from "../hooks/useAIAssistant";
import { CursorOverlay } from "../components/editor/CursorOverlay";
import { SpotlightOverlay } from "../components/editor/SpotlightOverlay";
import { HuddlePanel } from "../components/editor/HuddlePanel";
import { AIAssistantPanel } from "../components/editor/AIAssistantPanel";
import { marked } from "marked";

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [doc, setDoc] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  
  const [activeTab, setActiveTab] = React.useState<"chat" | "ai" | null>(
    searchParams.get("tab") === "chat" ? "chat" : null
  );

  // Editable title
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editableTitle, setEditableTitle] = React.useState("");

  // Share
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [shareEmail, setShareEmail] = React.useState("");
  const [shareRole, setShareRole] = React.useState("editor");
  const [shareLoading, setShareLoading] = React.useState(false);

  // Editor state
  const editorRef = React.useRef<HTMLDivElement>(null);
  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = React.useState<Set<string>>(new Set());
  const isInternalUpdate = React.useRef(false);

  // Sockets
  const socketRef = React.useRef<Socket | null>(null);

  // Chat
  const [messages, setMessages] = React.useState<any[]>([]);
  const [chatMessage, setChatMessage] = React.useState("");
  const [typingUser, setTypingUser] = React.useState<string | null>(null);
  const typingTimeoutRef = React.useRef<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Presence
  const [onlineUsers, setOnlineUsers] = React.useState<any[]>([]);

  // ─── NEW FEATURE HOOKS ───────────────────────────────────────────
  const userColor = user ? getUserColor(user.id) : "#6366F1";

  const { remoteCursors, updateSpeakingStatus } = useCursorPresence(
    id || "",
    user?.id || "",
    user?.name || "",
    editorContainerRef
  );

  const { isSpotlightActive, remoteSpotlights, activateSpotlight, deactivateSpotlight, handleSpotlightMouseMove } = useSpotlight(
    id || "",
    user?.id || "",
    user?.name || "",
    userColor
  );

  const { isHuddleActive, isInHuddle, participants, isMuted, activeSpeakers, startHuddle, joinHuddle, leaveHuddle, toggleMute } = useHuddle(
    id || "",
    user?.id || "",
    user?.name || ""
  );

  // Sync speaking status → cursor glow
  React.useEffect(() => {
    activeSpeakers.forEach((uid) => updateSpeakingStatus(uid, true));
  }, [activeSpeakers]);

  // Fetch initial doc
  React.useEffect(() => {
    if (!id || !user) return;
    const fetchDoc = async () => {
      try {
        const res = await API.get(`/api/documents/${id}`);
        setDoc(res.data);
        setEditableTitle(res.data.title);
        
        let role = null;
        if (res.data.owner._id === user.id) role = "owner";
        else {
          const collab = res.data.collaborators.find((c: any) => c.userId._id === user.id);
          if (collab) role = collab.role;
        }
        setUserRole(role);
      } catch (err: any) {
        setError(err.response?.data?.msg || "Document not found");
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();

    const fetchChat = async () => {
      try {
        const res = await API.get(`/api/chat/${id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load chat", err);
      }
    };
    fetchChat();
  }, [id, user]);

  React.useEffect(() => {
    if (!id || !user) return;
    
    const socket = getSocket();
    socketRef.current = socket;
    
    socket.emit('identify-user', user.id);
    socket.emit("join-document", id, user.id);

    socket.on("user-joined", (userId: string) => {
      setOnlineUsers(prev => {
        if (!prev.find(u => u.id === userId)) {
          return [...prev, { id: userId, displayName: "Collaborator" }];
        }
        return prev;
      });
    });

    socket.on("receive-changes", (delta: string) => {
      if (editorRef.current) {
        isInternalUpdate.current = true;
        editorRef.current.innerHTML = delta;
      }
    });

    socket.on("receive-message", (message: any) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on("user-typing", (userName: string) => {
      setTypingUser(userName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    });

    socket.on("user-stopped-typing", () => {
      setTypingUser(null);
    });

    return () => {
      socket.off("user-joined");
      socket.off("receive-changes");
      socket.off("receive-message");
      socket.off("user-typing");
      socket.off("user-stopped-typing");
      socket.emit("leave-document", id);
    };
  }, [id, user]);

  React.useEffect(() => {
    if (doc && editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== doc.content) {
        editorRef.current.innerHTML = doc.content || "";
      }
    }
    isInternalUpdate.current = false;
  }, [doc?.content]);

  React.useEffect(() => {
    const checkFormats = () => {
      const formats = new Set<string>();
      if (document.queryCommandState("bold")) formats.add("bold");
      if (document.queryCommandState("italic")) formats.add("italic");
      if (document.queryCommandState("underline")) formats.add("underline");
      if (document.queryCommandState("insertUnorderedList")) formats.add("insertUnorderedList");
      if (document.queryCommandState("insertOrderedList")) formats.add("insertOrderedList");
      if (document.queryCommandState("justifyLeft")) formats.add("justifyLeft");
      if (document.queryCommandState("justifyCenter")) formats.add("justifyCenter");
      if (document.queryCommandState("justifyRight")) formats.add("justifyRight");
      setActiveFormats(formats);
    };

    document.addEventListener("selectionchange", checkFormats);
    return () => document.removeEventListener("selectionchange", checkFormats);
  }, []);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, activeTab]);

  const canEdit = userRole === "owner" || userRole === "editor";

  const execCommand = (command: string, value?: string) => {
    if (!canEdit) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const saveDoc = async (content: string, title?: string) => {
    setSaving(true);
    try {
      await API.put(`/api/documents/${id}`, { content, title });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const content = editorRef.current.innerHTML;
      socketRef.current?.emit("send-changes", id, content);
      
      clearTimeout((window as any).saveTimeout);
      (window as any).saveTimeout = setTimeout(() => {
        saveDoc(content);
      }, 2000);
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSpotlightActive && editorContainerRef.current) {
      handleSpotlightMouseMove(e.nativeEvent, editorContainerRef);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editableTitle.trim() && editableTitle !== doc?.title) {
      saveDoc(editorRef.current?.innerHTML || "", editableTitle.trim());
      setDoc((prev: any) => prev ? { ...prev, title: editableTitle.trim() } : null);
    }
  };

  const handleChatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    if (!id || !user) return;
    
    socketRef.current?.emit("typing-start", id, user.name);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing-end", id);
    }, 1500);
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !id || !user) return;

    socketRef.current?.emit("send-message", {
      documentId: id,
      senderId: user.id,
      senderName: user.name,
      message: chatMessage
    });
    setChatMessage("");
    socketRef.current?.emit("typing-end", id);
  };

  const exportDOCX = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    saveAs(blob, `${doc?.title || 'document'}.doc`);
    toast.success("DOCX exported successfully");
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setShareLoading(true);
    try {
      const res = await API.post(`/api/documents/${id}/collaborators`, {
        email: shareEmail.trim(),
        role: shareRole
      });
      setDoc(res.data);
      toast.success("Collaborator added successfully!");
      setShareEmail("");
      setIsShareModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Failed to add collaborator");
    } finally {
      setShareLoading(false);
    }
  };

  // Insert AI text into editor at current cursor or end
  const handleInsertAIText = async (text: string) => {
    if (!editorRef.current || !canEdit) return;
    editorRef.current.focus();
    try {
      const htmlContent = await marked.parse(text);
      document.execCommand("insertHTML", false, htmlContent);
    } catch (err) {
      document.execCommand("insertHTML", false, text.replace(/\n/g, "<br>"));
    }
    handleEditorInput();
    toast.success("Text inserted into document");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h2 className="text-xl font-bold">{error || "Document not found"}</h2>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#0F0D1F] transition-colors duration-300">
      {/* 1. FIXED TOP TOOLBAR & HEADER */}
      <div className="flex-shrink-0 flex flex-col z-40 bg-white dark:bg-[#0F0D1F] border-b border-gray-200 dark:border-white/10 shadow-sm">
        {/* Huddle notification bar — shown when huddle is active but user is not in it */}
        <HuddlePanel
          documentId={id || ""}
          userId={user?.id || ""}
          userName={user?.name || ""}
          isHuddleActive={isHuddleActive}
          isInHuddle={isInHuddle}
          participants={participants}
          isMuted={isMuted}
          activeSpeakers={activeSpeakers}
          onStart={startHuddle}
          onJoin={joinHuddle}
          onLeave={leaveHuddle}
          onToggleMute={toggleMute}
        />

        {/* Title & Actions Bar */}
        <div className="h-14 px-3 sm:px-4 flex items-center justify-between gap-2">
          {/* LEFT: back + title */}
          <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
            {activeTab !== null ? (
              <button
                onClick={() => setActiveTab(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors md:hidden flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            ) : null}
            <Link
              to="/dashboard"
              className={cn(
                "p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex-shrink-0",
                activeTab !== null ? "hidden md:flex" : "flex"
              )}
            >
              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>

            {/* Title + status */}
            <div className="flex flex-col min-w-0">
              {isEditingTitle ? (
                <input
                  autoFocus
                  className="text-base sm:text-lg font-bold bg-transparent border-b-2 border-indigo-500 outline-none py-0.5 w-full"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                />
              ) : (
                <h2
                  className="text-base sm:text-lg font-bold cursor-pointer hover:text-indigo-600 dark:text-gray-100 transition-colors truncate"
                  onClick={() => canEdit && setIsEditingTitle(true)}
                >
                  {doc.title}
                </h2>
              )}
              <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
                {saving ? (
                  <span className="text-indigo-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                ) : (
                  <span className="text-green-500">All changes saved</span>
                )}
                {!canEdit && <Badge variant="warning" className="text-[9px] py-0 h-4">View Only</Badge>}
              </div>
            </div>
          </div>

          {/* RIGHT: actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Export */}
            <div className="relative group">
              <Button variant="glass" size="sm" className="px-2 sm:px-3">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-[#1E1B4B] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                <button onClick={exportDOCX} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-200 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Export as DOCX
                </button>
              </div>
            </div>

            {/* Spotlight toggle */}
            <Button
              variant="glass"
              size="sm"
              onClick={() => isSpotlightActive ? deactivateSpotlight() : activateSpotlight()}
              className={cn(
                "px-2 sm:px-3",
                isSpotlightActive && "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
              )}
              title="Spotlight — laser pointer for all collaborators"
            >
              <Crosshair className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Spotlight</span>
              {isSpotlightActive && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            </Button>

            {/* Chat toggle */}
            <Button
              variant="glass"
              size="sm"
              onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")}
              className={cn("px-2 sm:px-3", activeTab === "chat" && "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400")}
            >
              <MessageCircle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Chat</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* AI Assistant toggle */}
            <Button
              variant="glass"
              size="sm"
              onClick={() => setActiveTab(activeTab === "ai" ? null : "ai")}
              className={cn(
                "px-2 sm:px-3",
                activeTab === "ai" && "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400"
              )}
              title="AI Collaboration Assistant"
            >
              <Sparkles className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">AI</span>
            </Button>

            {userRole === "owner" && (
              <Button size="sm" onClick={() => setIsShareModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 px-2 sm:px-3">
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}

            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />
            <Avatar fallback={user?.name?.[0]?.toUpperCase() || "U"} size="sm" className="hidden sm:flex" />
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="h-12 px-4 bg-gray-50 dark:bg-[#1E1B4B]/50 border-t border-gray-200 dark:border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center bg-white dark:bg-[#0F0D1F] border border-gray-200 dark:border-white/10 rounded-md p-0.5 mr-2">
            <select 
              onChange={(e) => execCommand("fontSize", e.target.value)}
              className="text-xs font-medium bg-transparent outline-none px-2 h-7 cursor-pointer"
              defaultValue="3"
            >
              <option value="1">Small</option>
              <option value="3">Medium</option>
              <option value="5">Large</option>
              <option value="7">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center bg-white border rounded-md p-0.5 mr-2">
            <input 
              type="color" 
              onChange={(e) => execCommand("foreColor", e.target.value)}
              className="w-7 h-7 p-0.5 border-none cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <ToolbarButton icon={Bold} disabled={!canEdit} active={activeFormats.has("bold")} onClick={() => execCommand("bold")} />
          <ToolbarButton icon={Italic} disabled={!canEdit} active={activeFormats.has("italic")} onClick={() => execCommand("italic")} />
          <ToolbarButton icon={Underline} disabled={!canEdit} active={activeFormats.has("underline")} onClick={() => execCommand("underline")} />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <ToolbarButton icon={AlignLeft} disabled={!canEdit} active={activeFormats.has("justifyLeft")} onClick={() => execCommand("justifyLeft")} />
          <ToolbarButton icon={AlignCenter} disabled={!canEdit} active={activeFormats.has("justifyCenter")} onClick={() => execCommand("justifyCenter")} />
          <ToolbarButton icon={AlignRight} disabled={!canEdit} active={activeFormats.has("justifyRight")} onClick={() => execCommand("justifyRight")} />
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
          
          <ToolbarButton icon={List} disabled={!canEdit} active={activeFormats.has("insertUnorderedList")} onClick={() => execCommand("insertUnorderedList")} />
          <ToolbarButton icon={ListOrdered} disabled={!canEdit} active={activeFormats.has("insertOrderedList")} onClick={() => execCommand("insertOrderedList")} />

          {/* Huddle start button in toolbar (only if no active huddle) */}
          {!isHuddleActive && (
            <>
              <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
              <button
                onClick={startHuddle}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
                title="Start a voice huddle with collaborators"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Huddle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-100 dark:bg-[#0A0914]">
        {/* 2. DOCUMENT EDITOR */}
        <div
          ref={editorContainerRef}
          className="flex-1 overflow-auto p-4 md:p-10 flex flex-col items-center relative"
          onMouseMove={handleEditorMouseMove}
        >
          {/* Cursor Overlay — absolutely positioned over editor container */}
          <CursorOverlay cursors={remoteCursors} editorRef={editorContainerRef} />
          {/* Spotlight Overlay */}
          <SpotlightOverlay spotlights={remoteSpotlights} />

          <div className="max-w-[816px] w-full bg-white dark:bg-[#1E1B4B] min-h-[1056px] rounded-sm shadow-2xl p-8 sm:p-12 md:p-[96px] mb-10 transition-all duration-300 ring-1 ring-gray-200 dark:ring-white/10 relative print:shadow-none print:ring-0 print:m-0 print:p-0">
            <div
              ref={editorRef}
              contentEditable={canEdit}
              onInput={handleEditorInput}
              className="w-full min-h-[864px] outline-none text-gray-800 dark:text-gray-100 text-[16px] leading-[1.6] prose max-w-none focus:ring-0 dark:prose-invert"
              style={{ fontFamily: 'Inter, sans-serif', cursor: isSpotlightActive ? 'crosshair' : 'text' }}
            />
          </div>
        </div>

        {/* 3. SIDE PANEL — CHAT or AI */}
        <AnimatePresence>
          {activeTab === "chat" && (
            <motion.div 
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 md:relative md:inset-auto md:w-80 border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F0D1F] flex flex-col shadow-xl z-30"
            >
              <div className="p-4 border-b border-gray-200 dark:border-white/10 font-bold flex justify-between items-center bg-white dark:bg-[#0F0D1F] sticky top-0 z-10">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>Team Chat</span>
                </div>
                <button onClick={() => setActiveTab(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4 bg-gray-50/50 dark:bg-[#0A0914]/50">
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[85%] p-3 rounded-2xl shadow-sm text-sm break-words overflow-hidden",
                    m.senderId?._id === user?.id || m.senderId === user?.id 
                      ? "bg-indigo-600 text-white self-end rounded-tr-none" 
                      : "bg-white dark:bg-[#1E1B4B] border dark:border-white/5 text-gray-800 dark:text-gray-100 self-start rounded-tl-none"
                  )}>
                    <div className={cn("text-[10px] font-bold uppercase mb-1 truncate", 
                      m.senderId?._id === user?.id || m.senderId === user?.id ? "text-indigo-100" : "text-gray-400"
                    )}>
                      {m.senderId?.name || m.senderName}
                    </div>
                    <span className="break-words whitespace-pre-wrap">{m.message}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F0D1F]">
                {typingUser && <div className="text-[10px] text-gray-400 italic mb-2 px-1">{typingUser} is typing...</div>}
                <div className="flex gap-2">
                  <Input 
                    value={chatMessage} 
                    onChange={handleChatChange} 
                    placeholder="Type a message..." 
                    className="flex-1 h-10 border-gray-200 focus:border-indigo-500 rounded-full px-4 text-xs" 
                  />
                  <Button type="submit" className="h-10 w-10 p-0 rounded-full bg-indigo-600 flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "ai" && (
            <AIAssistantPanel
              isOpen={activeTab === "ai"}
              onClose={() => setActiveTab(null)}
              documentContent={editorRef.current?.innerHTML || ""}
              onInsert={handleInsertAIText}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Document">
        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
            <Input 
              type="email" 
              placeholder="collaborator@example.com" 
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              className="w-full border rounded-lg h-10 px-3 outline-none focus:border-indigo-500"
              value={shareRole}
              onChange={e => setShareRole(e.target.value)}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" isLoading={shareLoading} className="w-full">Add Collaborator</Button>
          </div>
          
          {doc?.collaborators?.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-bold mb-3">Current Collaborators</h4>
              <div className="space-y-2 max-h-32 overflow-auto">
                {doc.collaborators.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{c.userId?.name}</div>
                      <div className="text-xs text-gray-500">{c.userId?.email}</div>
                    </div>
                    <Badge variant="default" className="capitalize">{c.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function ToolbarButton({ icon: Icon, disabled, active, onClick }: { icon: any; disabled?: boolean; active?: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      className={cn(
        "p-2 rounded hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300",
        active && "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
