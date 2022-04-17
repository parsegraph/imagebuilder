import ImageBuilder from "./ImageBuilder";
import { BlockCaret } from "parsegraph-block";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  root.style.position = "relative";

  const topElem = document.getElementById("demo");

  const builder = new ImageBuilder(240, 160);

  for(let maxNum = 0; maxNum < 100; ++maxNum) {
    builder.createImage(
      ((max) => () => {
        const caret = new BlockCaret();
        for(let i = 0; i < max; ++i) {
          caret.spawnMove('f', 'b');
          caret.label("No time");
        }
        console.log(caret);
        return caret.root();
      })(maxNum),
      null,
      (img: HTMLElement) => {
        console.log(img);
        topElem.appendChild(img);
      }
    );
  }
});
