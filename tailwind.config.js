/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand:  { 50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a" },
        calls:  { light:"#f0fdf4",DEFAULT:"#16a34a",dark:"#15803d",ring:"#bbf7d0" },
        compl:  { light:"#fff7ed",DEFAULT:"#ea580c",dark:"#c2410c",ring:"#fed7aa" }
      },
      fontFamily: {
        display:["'Lexend'","sans-serif"],
        body:   ["'DM Sans'","sans-serif"],
        mono:   ["'JetBrains Mono'","monospace"]
      },
      animation: {
        "fade-in":   "fadeIn 0.3s ease forwards",
        "slide-up":  "slideUp 0.35s ease forwards",
        "slide-in":  "slideIn 0.3s ease forwards",
        "pulse-ring":"pulseRing 1.6s cubic-bezier(0.4,0,0.6,1) infinite"
      },
      keyframes: {
        fadeIn:   {from:{opacity:"0"},to:{opacity:"1"}},
        slideUp:  {from:{opacity:"0",transform:"translateY(12px)"},to:{opacity:"1",transform:"translateY(0)"}},
        slideIn:  {from:{opacity:"0",transform:"translateX(-8px)"},to:{opacity:"1",transform:"translateX(0)"}},
        pulseRing:{"0%":{transform:"scale(1)",opacity:"0.8"},"50%":{transform:"scale(1.15)",opacity:"0.4"},"100%":{transform:"scale(1)",opacity:"0.8"}}
      }
    }
  },
  plugins:[]
};
