import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

const CHAT_URL = "https://functions.poehali.dev/baa09bc3-4e87-4af0-bc13-0d6904e82f3f";

function getChildMode(): boolean {
  const saved = localStorage.getItem("kruel-child-mode");
  return saved === null ? true : saved === "true";
}

function getTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function getSession(): { email: string; nick: string } | null {
  try { return JSON.parse(localStorage.getItem("kruel-session") || "null"); } catch { return null; }
}

export default function Index() {
  const navigate = useNavigate();
  const session = getSession();
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Что такое квантовая физика?",
      date: "Сегодня",
      messages: [
        { id: "m1", role: "user", text: "Что такое квантовая физика?", time: "10:22" },
        { id: "m2", role: "assistant", text: "Квантовая физика — раздел науки, изучающий поведение материи и энергии на мельчайших масштабах. Частицы могут находиться в нескольких состояниях одновременно — это называется суперпозиция.", time: "10:22" },
      ],
    },
    {
      id: "2",
      title: "Как приготовить карбонару?",
      date: "Вчера",
      messages: [
        { id: "m3", role: "user", text: "Как приготовить пасту карбонара?", time: "18:05" },
        { id: "m4", role: "assistant", text: "Для карбонары нужны: спагетти, гуанчале (или бекон), яйца, пармезан, чёрный перец. Главный секрет — никакой сметаны! Соус делается только из яиц и сыра.", time: "18:05" },
      ],
    },
  ]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<{ stop: () => void; lang: string; interimResults: boolean; onresult: ((e: Event) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const openSidebar = () => {
    setSidebarVisible(true);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSidebarVisible(false), 300);
  };

  const loadConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
    closeSidebar();
  };

  const newChat = () => {
    setActiveConvId(null);
    setMessages([]);
    closeSidebar();
  };

  const sendMessage = async (text?: string) => {
    const msg = text || inputText.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: msg,
      time: getTime(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);

    let reply = "Произошла ошибка. Попробуй ещё раз.";
    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, childMode: getChildMode() }),
      });
      const data = await res.json();
      reply = data.reply || reply;
    } catch {
      reply = "Не удалось связаться с Kruel AI. Проверь интернет и попробуй снова.";
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      text: reply,
      time: getTime(),
    };

    const finalMessages = [...newMessages, assistantMsg];
    setMessages(finalMessages);
    setIsTyping(false);

    const convTitle = msg.length > 40 ? msg.slice(0, 40) + "..." : msg;
    if (activeConvId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, messages: finalMessages } : c
        )
      );
    } else {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: convTitle,
        date: "Сегодня",
        messages: finalMessages,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }

    speakText(reply);
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ru-RU";
    utter.rate = 0.95;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const toggleVoice = () => {
    type SpeechRecognitionConstructor = new () => { stop: () => void; lang: string; interimResults: boolean; onresult: ((e: Event) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void };
    const SpeechRecognition =
      ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;

    if (!SpeechRecognition) {
      alert("Голосовой ввод не поддерживается в вашем браузере.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "ru-RU";
    recognition.interimResults = false;

    recognition.onresult = (e: Event) => {
      const re = e as Event & { results: { [key: number]: { [key: number]: { transcript: string } } } };
      const transcript = re.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden page-enter chat-bg">
      {/* Aurora слой 3 */}
      <div className="aurora3" />

      {/* Верхняя переливающаяся полоска */}
      <div className="rainbow-bar h-[3px] w-full flex-shrink-0" />

      {/* Шапка */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md flex-shrink-0 relative z-10">
        <button
          onClick={openSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        >
          <Icon name="Menu" size={20} className="text-white/70" />
        </button>

        <h1 className="kruel-title text-2xl tracking-widest absolute left-1/2 -translate-x-1/2">
          KRUEL AI
        </h1>

        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        >
          <Icon name="Settings" size={20} className="text-white/70" />
        </button>
      </header>

      {/* Боковая панель */}
      {sidebarVisible && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeSidebar}
          />
          <aside
            className={`fixed top-0 left-0 h-full w-[80vw] max-w-[320px] bg-black/80 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col ${
              sidebarOpen ? "sidebar-open" : "sidebar-close"
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <span className="kruel-title text-lg tracking-widest">KRUEL AI</span>
                {session && (
                  <p className="text-xs text-muted-foreground mt-0.5">@{session.nick}</p>
                )}
              </div>
              <button
                onClick={closeSidebar}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <Icon name="X" size={18} className="text-white/70" />
              </button>
            </div>

            <div className="p-3 border-b border-white/10">
              <button
                onClick={newChat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-blue-600/30 transition-all text-sm font-medium"
              >
                <Icon name="Plus" size={18} className="text-purple-400" />
                <span className="text-foreground">Новый чат</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium uppercase tracking-wider">
                История разговоров
              </p>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all hover:bg-white/10 ${
                    activeConvId === conv.id ? "bg-white/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Icon name="MessageCircle" size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{conv.date}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* Сообщения */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
              <span className="kruel-title text-3xl">K</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Привет, я Kruel AI</h2>
              <p className="text-white/50 text-sm max-w-xs leading-relaxed">
                Задай любой вопрос — отвечу на всё. Можно голосом или текстом.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {["Что такое чёрная дыра?", "Расскажи анекдот", "Как медитировать?"].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-4 py-2.5 rounded-xl text-sm border border-white/15 bg-white/5 hover:border-purple-500/60 hover:bg-white/10 transition-all text-left text-white/80"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex msg-animate ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="text-white text-xs font-bold" style={{ fontFamily: "Orbitron" }}>K</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm"
                      : "bg-white/10 backdrop-blur-sm text-white rounded-bl-sm border border-white/10"
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-white/60" : "text-white/40"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start msg-animate">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold" style={{ fontFamily: "Orbitron" }}>K</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <div className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
                    <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                    <div className="typing-dot w-2 h-2 rounded-full bg-pink-400" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Индикатор озвучки */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-purple-400 border-t border-white/10">
          <Icon name="Volume2" size={14} />
          <span>Kruel говорит...</span>
          <button onClick={stopSpeaking} className="underline hover:no-underline ml-1">
            стоп
          </button>
        </div>
      )}

      {/* Поле ввода */}
      <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-md flex-shrink-0">
        <div className="flex items-end gap-2 bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-purple-500/50 transition-colors">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Слушаю..." : "Спроси что угодно..."}
            rows={1}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none leading-relaxed max-h-32"
            style={{ fontFamily: "Golos Text, sans-serif" }}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={toggleVoice}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isListening
                  ? "bg-purple-600 text-white mic-active"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon name={isListening ? "MicOff" : "Mic"} size={18} />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-purple-500 hover:to-blue-500 transition-all"
            >
              <Icon name="ArrowUp" size={18} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Enter — отправить · Shift+Enter — новая строка
        </p>
      </div>
    </div>
  );
}