/** @type {import('tailwindcss').Config} */
const { heroui, semanticColors, defaultLayout, darkLayout } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    heroui({
      // 默认使用深色主题，可按需切换 'light'
      defaultTheme: "dark",
      // 是否将 HeroUI 常用色系注入到 Tailwind（如 blue/green/purple）
      addCommonColors: true,
      // 主题定义：可在此按你的品牌色修改
      themes: {
        light: {
          colors: {
            // 品牌主色（浅色主题）
            primary: {
              DEFAULT: "#3B82F6", // 替换为你的主色
              foreground: "#ffffff",
            },
            secondary: { DEFAULT: "#22D3EE", foreground: "#051016" },
            success: { DEFAULT: "#10B981", foreground: "#042317" },
            warning: { DEFAULT: "#F59E0B", foreground: "#160D03" },
            danger: { DEFAULT: "#EF4444", foreground: "#160404" },
            background: { DEFAULT: "#FFFFFF" },
            foreground: semanticColors.light.foreground,
            default: semanticColors.light.default,
            content1: semanticColors.light.content1,
            content2: semanticColors.light.content2,
            content3: semanticColors.light.content3,
            content4: semanticColors.light.content4,
            divider: semanticColors.light.divider,
            focus: semanticColors.light.focus,
          },
          layout: {
            ...defaultLayout,
            radius: { small: "6px", medium: "10px", large: "14px" },
          },
        },
        dark: {
          colors: {
            // 品牌主色（深色主题）
            primary: {
              DEFAULT: "#60A5FA", // 替换为你的主色（深色下建议更亮）
              foreground: "#0B1221",
            },
            secondary: { DEFAULT: "#22D3EE", foreground: "#001014" },
            success: { DEFAULT: "#34D399", foreground: "#00140F" },
            warning: { DEFAULT: "#F59E0B", foreground: "#120A01" },
            danger: { DEFAULT: "#F87171", foreground: "#160404" },
            background: { DEFAULT: "#0B0B0C" },
            foreground: semanticColors.dark.foreground,
            default: semanticColors.dark.default,
            content1: semanticColors.dark.content1,
            content2: semanticColors.dark.content2,
            content3: semanticColors.dark.content3,
            content4: semanticColors.dark.content4,
            divider: semanticColors.dark.divider,
            focus: semanticColors.dark.focus,
          },
          layout: {
            ...darkLayout,
            radius: { small: "6px", medium: "10px", large: "14px" },
          },
        },
      },
    }),
  ],
};
