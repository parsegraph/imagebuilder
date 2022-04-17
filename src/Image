import BasicProjector from "./BasicProjector";
import { BasicGLProvider } from "parsegraph-compileprogram";

export default class ImageProjector extends BasicProjector {
  _needsUpdate: boolean;

  private _imageCanvas: HTMLCanvasElement;
  private _imageContext: CanvasRenderingContext2D;

  private _explicitWidth: number;
  private _explicitHeight: number;
  private _scale: number;

  private _fb: WebGLFramebuffer;
  private _targetTexture: WebGLTexture;

  constructor(width: number, height: number, scale: number = 1.0) {
    super(new BasicGLProvider());
    if (!width || !height) {
      throw new Error(
        "ImageWindow must receive a width and height during construction"
      );
    }

    this._needsUpdate = true;

    this._scale = scale;

    this.setExplicitSize(width, height);
    this._imageCanvas = null;
    this._imageContext = null;
  }

  gl() {
    return this.glProvider().gl();
  }

  setExplicitSize(w: number, h: number) {
    this._explicitWidth = w;
    this._explicitHeight = h;
    this.imageCanvas().width = w;
    this.imageCanvas().height = h;
    (this.glProvider() as BasicGLProvider).setExplicitSize(w, h);
  }

  scale() {
    return this._scale;
  }

  setScale(scale: number) {
    this._scale = scale;
  }

  width() {
    return this._explicitWidth;
  }

  height() {
    return this._explicitHeight;
  }

  render() {
    super.render();
    const gl = this.gl();
    const width = this.width();
    const height = this.height();

    if (!this._fb) {
      const fb = gl.createFramebuffer();
      this._fb = fb;

      this._targetTexture = gl.createTexture();
      const targetTexture = this._targetTexture;

      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      {
        // define size and format of level 0
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          width,
          height,
          border,
          format,
          type,
          null
        );

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      // attach the texture as the first color attachment
      const attachmentPoint = gl.COLOR_ATTACHMENT0;
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentPoint,
        gl.TEXTURE_2D,
        targetTexture,
        0
      );
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb);
    }
    return false;
  }

  screenshot() {
    const gl = this.gl();
    const width = this.width();
    const height = this.height();
    const texture = this._targetTexture;
    if (!texture) {
      console.log("No texture");
      return null;
    }

    // Create a framebuffer backed by the texture
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    // Create a 2D canvas to store the result
    const canvas = this.imageCanvas();
    canvas.width = width;
    canvas.height = height;

    // Read the contents of the framebuffer
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.deleteFramebuffer(framebuffer);

    const context = this.imageContext();
    context.drawImage(this.overlayCanvas(), 0, 0);

    // Copy the pixels to a 2D canvas
    const imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);

    const cont = document.createElement("div");
    cont.style.display = "inline-block";
    cont.style.position = "relative";
    cont.style.width = Math.floor(this.scale() * this._explicitWidth) + "px";
    cont.style.height = Math.floor(this.scale() * this._explicitHeight) + "px";
    cont.style.overflow = "hidden";

    let image = new Image();
    image.style.position = "absolute";
    image.style.left = "0px";
    image.style.top = "0px";
    image.style.width = Math.floor(this.scale() * this._explicitWidth) + "px";
    image.style.height = Math.floor(this.scale() * this._explicitHeight) + "px";
    image.style.transform = `scaleY(-1)`;
    image.src = canvas.toDataURL();
    cont.appendChild(image);

    context.clearRect(0, 0, width, height);
    context.drawImage(this.overlayCanvas(), 0, 0);
    image = new Image();
    image.style.position = "absolute";
    image.style.left = "0px";
    image.style.top = "0px";
    image.style.width = Math.floor(this.scale() * this._explicitWidth) + "px";
    image.style.height = Math.floor(this.scale() * this._explicitHeight) + "px";
    image.src = canvas.toDataURL();
    cont.appendChild(image);

    const domCont = document.createElement("div");
    domCont.style.position = "absolute";
    domCont.style.left = "0px";
    domCont.style.top = "0px";
    domCont.style.width = Math.floor(this._explicitWidth) + "px";
    domCont.style.height = Math.floor(this._explicitHeight) + "px";
    domCont.style.transformOrigin = "top left";
    domCont.style.transform = `scale(${this.scale()})`;
    domCont.innerHTML = this.getDOMContainer().innerHTML;
    cont.appendChild(domCont);

    return cont;
  }

  setImageCanvas(canvas: HTMLCanvasElement) {
    this._imageCanvas = canvas;
  }

  createImageCanvas() {
    return document.createElement("canvas");
  }

  imageCanvas() {
    if (!this._imageCanvas) {
      const canvas = this.createImageCanvas();
      if (canvas) {
        this.setImageCanvas(canvas);
      }
    }
    return this._imageCanvas;
  }

  setImageContext(ctx: CanvasRenderingContext2D) {
    this._imageContext = ctx;
  }

  createImageContext() {
    return this.imageCanvas()?.getContext("2d");
  }

  imageContext() {
    if (!this._imageContext) {
      const ctx = this.createImageContext();
      if (ctx) {
        this.setImageContext(ctx);
      }
    }
    return this._imageContext;
  }
}
