import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "navy",    label: "Navy",    accent: "#4f8ef7" },
  { id: "violet",  label: "Violet",  accent: "#a855f7" },
  { id: "emerald", label: "Emerald", accent: "#10b981" },
  { id: "rose",    label: "Rose",    accent: "#f43f5e" },
  { id: "amber",   label: "Amber",   accent: "#f59e0b" },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode]   = useState(() => localStorage.getItem("tm-mode")   || "dark");
  const [theme, setTheme] = useState(() => localStorage.getItem("tm-theme")  || "navy");

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mode",  mode);
    root.setAttribute("data-theme", theme);
    localStorage.setItem("tm-mode",  mode);
    localStorage.setItem("tm-theme", theme);
  }, [mode, theme]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}