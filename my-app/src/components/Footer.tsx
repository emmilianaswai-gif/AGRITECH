import { useTheme } from "../context/ThemeContext";

export default function Footer() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const year = new Date().getFullYear();

  return (
    <footer
      className={`fixed left-0 right-0 z-30 border-t backdrop-blur-sm transition-colors bottom-[60px] md:bottom-0 ${
        dark ? "bg-[#0d1813]/95 border-gray-800 text-gray-400" : "bg-white/95 border-gray-100 text-gray-500"
      }`}
    >
      <div className="max-w-[1920px] mx-auto h-12 px-4 sm:px-6 flex items-center justify-center md:justify-between gap-3">
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 bg-green-700 rounded-md flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </span>
          <p className="text-xs">
            <span className="font-bold text-green-800 dark:text-green-400">AGRICONNECT</span>{" "}
            <span className="hidden lg:inline">— connecting farmers & buyers directly</span>
          </p>
        </div>
        <p className="text-[11px] text-center md:text-right truncate">
          © {year} AGRICONNECT. All rights reserved.
        </p>
      </div>
    </footer>
  );
}