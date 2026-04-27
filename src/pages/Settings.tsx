import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("kruel-theme") as "dark" | "light") || "dark";
  });

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

  const handleSupport = () => {
    window.open("mailto:kruelcompany2@gmail.com?subject=Поддержка Kruel AI", "_blank");
  };

  return (
    <div className="flex flex-col h-screen bg-background page-enter">
      {/* Верхняя полоска */}
      <div className="rainbow-bar h-[3px] w-full flex-shrink-0" />

      {/* Шапка */}
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

      {/* Контент */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full">

        {/* Тема */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Внешний вид</p>
          </div>

          {/* Тёмная тема */}
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
              {theme === "dark" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>

          {/* Светлая тема */}
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
              {theme === "light" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
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

        {/* О приложении */}
        <div className="bg-card border border-border rounded-2xl px-4 py-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
            <span className="kruel-title text-xl">K</span>
          </div>
          <p className="kruel-title text-base tracking-widest mb-1">KRUEL AI</p>
          <p className="text-xs text-muted-foreground">Версия 1.0.0</p>
        </div>
      </main>
    </div>
  );
}
