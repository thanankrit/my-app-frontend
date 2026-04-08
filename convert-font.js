const fs = require("fs");
const path = require("path");

const fontPath = path.join(__dirname, "src/fonts/Sarabun-Regular.ttf");
const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString("base64");
const jsContent = `export const SarabunRegular = {
  fontName: "Sarabun",
  fontStyle: "normal",
  ttf: "${base64Font}"
};`;

fs.writeFileSync(path.join(__dirname, "src/fonts/SarabunRegular.js"), jsContent);

console.log("แปลงฟอนต์เป็น Base64 สำเร็จ");
