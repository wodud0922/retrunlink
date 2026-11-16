/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,mdx}", "./components/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF6",
          100: "#FBF7EF",
          200: "#F3ECDF",
          300: "#E8DFCE",
        },
        ink: "#2B2A27",
        // 카드·입력창 테두리를 따뜻한 베이지 그레이 1px 선으로 통일해요.
        neutral: { 200: "#E5E2DC" },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(60, 50, 30, 0.04), 0 6px 20px rgba(60, 50, 30, 0.06)",
      },
    },
  },
  plugins: [],
};
