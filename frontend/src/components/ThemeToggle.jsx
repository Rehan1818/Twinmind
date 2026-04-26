import { useEffect, useRef, useState } from "react";
import { THEMES, useTheme } from "../context/ThemeContext.jsx";

function ThemeToggle() {
  const { mode, theme, toggleMode, setTheme } = useTheme();
  const isDark = mode === "dark";
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteRef = useRef(null);
  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  useEffect(() => {
    const onClickOutside = (event) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target)) {
        setIsPaletteOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="theme-controls">
      <div className="theme-picker" ref={paletteRef}>
        <button
          type="button"
          className="theme-picker-toggle"
          onClick={() => setIsPaletteOpen((open) => !open)}
          title="Choose theme color"
          aria-label="Choose theme color"
          aria-expanded={isPaletteOpen}
        >
          <span className="theme-current-dot" style={{ "--current-color": activeTheme.accent }} />
          <span className="theme-picker-arrow">▾</span>
        </button>

        {isPaletteOpen && (
          <div className="theme-picker-menu">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-option ${theme === t.id ? "theme-option-active" : ""}`}
                style={{ "--option-color": t.accent }}
                title={t.label}
                onClick={() => {
                  setTheme(t.id);
                  setIsPaletteOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="mode-toggle"
        onClick={toggleMode}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}

export default ThemeToggle;