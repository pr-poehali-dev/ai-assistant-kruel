import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

type Mode = "login" | "register";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Заполни все поля");
      return;
    }
    if (mode === "register" && !nick) {
      setError("Введи никнейм");
      return;
    }
    if (password.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    if (mode === "register") {
      // Регистрация — сохраняем нового пользователя
      const users = JSON.parse(localStorage.getItem("kruel-users") || "{}");
      if (users[email]) {
        setError("Такой email уже зарегистрирован");
        setLoading(false);
        return;
      }
      users[email] = { password, nick };
      localStorage.setItem("kruel-users", JSON.stringify(users));
      localStorage.setItem("kruel-session", JSON.stringify({ email, nick }));
    } else {
      // Вход
      const users = JSON.parse(localStorage.getItem("kruel-users") || "{}");
      const user = users[email];
      if (!user || user.password !== password) {
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }
      localStorage.setItem("kruel-session", JSON.stringify({ email, nick: user.nick }));
    }

    setLoading(false);
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center page-enter px-4">
      {/* Верхняя полоска */}
      <div className="rainbow-bar h-[3px] w-full fixed top-0 left-0" />

      <div className="w-full max-w-sm">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="kruel-title text-3xl">K</span>
          </div>
          <h1 className="kruel-title text-3xl tracking-widest">KRUEL AI</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "login" ? "Войди в свой аккаунт" : "Создай аккаунт"}
          </p>
        </div>

        {/* Переключатель */}
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Icon name="User" size={17} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Никнейм"
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <Icon name="Mail" size={17} className="text-muted-foreground" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <Icon name="Lock" size={17} className="text-muted-foreground" />
            </div>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full bg-muted border border-border rounded-xl pl-10 pr-11 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={showPass ? "EyeOff" : "Eye"} size={17} />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <Icon name="CircleAlert" size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "login" ? "Входим..." : "Создаём..."}
              </span>
            ) : (
              mode === "login" ? "Войти" : "Создать аккаунт"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {mode === "login" ? "Зарегистрируйся" : "Войди"}
          </button>
        </p>
      </div>
    </div>
  );
}
