import ImageBuilder from "./ImageBuilder";
import {BlockCaret} from 'parsegraph-block';

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  root.style.position = "relative";

  const topElem = document.getElementById("demo");

  const builder = new ImageBuilder(120, 80);
  builder.createImage(()=>{
    const caret = new BlockCaret();
    caret.label("No time");
    console.log(caret);
    return caret.root();
  }, null, (img:HTMLElement)=>{
    console.log(img);
    topElem.appendChild(img);
  });
});
