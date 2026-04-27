import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

function getSession(): { email: string; nick: string } | null {
  try { return JSON.parse(localStorage.getItem("kruel-session") || "null"); } catch { return null; }
}

const ADULT_QUESTIONS = [
  {
    question: "Как расшифровывается аббревиатура ВВП в экономике?",
    answer: "валовый внутренний продукт",
    hint: "Основной показатель экономики страны",
  },
  {
    question: "Что такое дебет и кредит в бухгалтерии?",
    answer: "дебет",
    hint: "Левая и правая стороны бухгалтерского счёта",
  },
  {
    question: "Назови столицу Австралии (не Сидней)",
    answer: "канберра",
    hint: "Многие ошибочно называют Сидней",
  },
  {
    question: "Сколько нейтронов в атоме углерода-12?",
    answer: "6",
    hint: "Из курса химии",
  },
  {
    question: "Что изучает макроэкономика?",
    answer: "экономика",
    hint: "Уровень выше микроэкономики",
  },
];

function getRandomQuestion() {
  return ADULT_QUESTIONS[Math.floor(Math.random() * ADULT_QUESTIONS.length)];
}

export default function Settings() {
  const navigate = useNavigate();
  const session = getSession();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("kruel-theme") as "dark" | "light") || "dark";
  });
  const [childMode, setChildMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("kruel-child-mode");
    return saved === null ? true : saved === "true";
  });

  const [showAdultModal, setShowAdultModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(getRandomQuestion());
  const [userAnswer, setUserAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [answerSuccess, setAnswerSuccess] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("kruel-theme", theme);
  }, [theme]);

  const handleChildModeToggle = () => {
    if (!childMode) {
      setChildMode(true);
      localStorage.setItem("kruel-child-mode", "true");
    } else {
      setCurrentQuestion(getRandomQuestion());
      setUserAnswer("");
      setAnswerError("");
      setAnswerSuccess(false);
      setShowAdultModal(true);
    }
  };

  const handleAnswerSubmit = () => {
    const trimmed = userAnswer.trim().toLowerCase();
    const correct = currentQuestion.answer.toLowerCase();
    if (trimmed.includes(correct) || correct.includes(trimmed) && trimmed.length > 2) {
      setAnswerSuccess(true);
      setAnswerError("");
      setTimeout(() => {
        setChildMode(false);
        localStorage.setItem("kruel-child-mode", "false");
        setShowAdultModal(false);
        setAnswerSuccess(false);
        setUserAnswer("");
      }, 1200);
    } else {
      setAnswerError("Неверно. Попробуй ещё раз.");
      setCurrentQuestion(getRandomQuestion());
      setUserAnswer("");
    }
  };

  const handleSupport = () => {
    window.open("mailto:kruelcompany2@gmail.com?subject=Поддержка Kruel AI", "_blank");
  };

  const handleLogout = () => {
    localStorage.removeItem("kruel-session");
    navigate("/auth");
  };

  return (
    <div className="flex flex-col h-screen bg-background page-enter">
      <div className="rainbow-bar h-[3px] w-full flex-shrink-0" />

      <header className="flex items-center px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors mr-3"
        >
          <Icon name="ArrowLeft" size={20} className="text-foreground/70" />
        </button>
        <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Golos Text, sans-serif" }}>
          Настройки
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full">

        {/* Детский режим */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Безопасность</p>
          </div>
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                childMode
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-red-500/20 border-red-500/30"
              }`}>
                <Icon
                  name={childMode ? "ShieldCheck" : "ShieldOff"}
                  size={18}
                  className={childMode ? "text-green-400" : "text-red-400"}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Детский режим</p>
                <p className="text-xs text-muted-foreground">
                  {childMode ? "Включён — контент 18+ заблокирован" : "Выключен — доступен весь контент"}
                </p>
              </div>
            </div>
            <button
              onClick={handleChildModeToggle}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                childMode ? "bg-green-500" : "bg-muted"
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                childMode ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </button>
          </div>
          {childMode && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                Для выключения нужно ответить на вопрос для взрослых
              </p>
            </div>
          )}
        </div>

        {/* Тема */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Внешний вид</p>
          </div>
          <button
            onClick={() => setTheme("dark")}
            className={`w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border ${
              theme === "dark" ? "bg-muted/30" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-border flex items-center justify-center">
                <Icon name="Moon" size={18} className="text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Тёмная тема</p>
                <p className="text-xs text-muted-foreground">Чёрный фон, светлый текст</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              theme === "dark" ? "border-purple-500 bg-purple-500" : "border-border"
            }`}>
              {theme === "dark" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors ${
              theme === "light" ? "bg-muted/30" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-border flex items-center justify-center">
                <Icon name="Sun" size={18} className="text-yellow-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Светлая тема</p>
                <p className="text-xs text-muted-foreground">Белый фон, тёмный текст</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              theme === "light" ? "border-purple-500 bg-purple-500" : "border-border"
            }`}>
              {theme === "light" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        </div>

        {/* Поддержка */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Помощь</p>
          </div>
          <button
            onClick={handleSupport}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                <Icon name="Mail" size={18} className="text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Поддержка</p>
                <p className="text-xs text-muted-foreground">kruelcompany2@gmail.com</p>
              </div>
            </div>
            <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Аккаунт */}
        {session && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Аккаунт</p>
            </div>
            <div className="px-4 py-4 flex items-center gap-3 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{session.nick[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">@{session.nick}</p>
                <p className="text-xs text-muted-foreground">{session.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-500/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Icon name="LogOut" size={17} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-400">Выйти из аккаунта</p>
            </button>
          </div>
        )}

        {/* О приложении */}
        <div className="bg-card border border-border rounded-2xl px-4 py-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
            <span className="kruel-title text-xl">K</span>
          </div>
          <p className="kruel-title text-base tracking-widest mb-1">KRUEL AI</p>
          <p className="text-xs text-muted-foreground">Версия 1.0.0</p>
        </div>
      </main>

      {/* Модальное окно проверки возраста */}
      {showAdultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                <Icon name="ShieldAlert" size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Проверка возраста</p>
                <p className="text-xs text-muted-foreground">Ответь на вопрос для взрослых</p>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-1">{currentQuestion.question}</p>
              <p className="text-xs text-muted-foreground">{currentQuestion.hint}</p>
            </div>

            <input
              type="text"
              value={userAnswer}
              onChange={(e) => { setUserAnswer(e.target.value); setAnswerError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAnswerSubmit()}
              placeholder="Твой ответ..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />

            {answerError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <Icon name="X" size={12} />
                {answerError}
              </p>
            )}

            {answerSuccess && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Icon name="Check" size={12} />
                Верно! Детский режим выключен.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowAdultModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={!userAnswer.trim() || answerSuccess}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm text-white font-medium transition-colors"
              >
                Проверить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
