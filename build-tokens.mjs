import StyleDictionary from "style-dictionary";

// Figma 동기화 산출물의 $type은 'dimension'이 아니라 'number'라서
// style-dictionary 내장 size/px 변환이 매치되지 않습니다. 그래서 직접 만들어 사용합니다.
StyleDictionary.registerTransform({
  name: "moment/name",
  type: "name",
  transform: (token) => {
    const file = token.filePath ?? "";
    const path = token.path;

    if (file.includes("color")) return ["color", ...path].join("-");

    if (file.includes("spacing")) {
      const rest = path[0].replace(/^space-/, "");
      return ["spacing", rest].join("-");
    }

    if (file.includes("radius")) return path.join("-");

    if (file.includes("typography")) {
      const [category, ...rest] = path;
      const namespace =
        {
          "font-size": "font-size",
          "line-height": "leading",
          "letter-spacing": "tracking",
          "font-family": "font",
        }[category] ?? category;
      return [namespace, ...rest].join("-");
    }

    return path.join("-");
  },
});

StyleDictionary.registerTransform({
  name: "moment/value",
  type: "value",
  filter: (token) => token.$type === "number" || token.$type === "string",
  transform: (token) => {
    if (token.$type === "string") return `"${token.$value}"`;

    const file = token.filePath ?? "";
    const value = Math.round(token.$value * 1000) / 1000;

    if (file.includes("spacing") || file.includes("radius"))
      return `${value}px`;

    if (file.includes("typography")) {
      const category = token.path[0];
      if (category === "font-size") return `${value}px`;
      if (category === "letter-spacing") return `${value}em`;
    }

    return `${value}`;
  },
});

const sd = new StyleDictionary({
  source: ["tokens/**/*.json"],
  platforms: {
    css: {
      transforms: ["moment/name", "moment/value"],
      buildPath: "dist/css/",
      files: [
        {
          destination: "variables.css",
          format: "css/variables",
          options: { outputReferences: true },
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
