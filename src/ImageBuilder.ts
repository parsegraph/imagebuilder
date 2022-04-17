import { AnimationTimer, elapsed } from "parsegraph-timing";
import { GraphPainter } from "parsegraph-graphpainter";
import { ImageProjector } from "parsegraph-projector";
import Camera from "parsegraph-camera";
import { INTERVAL } from "parsegraph-timingbelt";
import { showInCamera } from "parsegraph-showincamera";
import { DirectionNode } from "parsegraph-direction";
import { PaintedNode } from 'parsegraph-artist';

export type Job = {
  creatorFunc: () => DirectionNode;
  creatorFuncThisArg: object;
  callbackFunc: (img: HTMLElement) => void;
  callbackFuncThisArg: object;
  root: DirectionNode;
  rootless: boolean;
  builders: [(timeLeft: number) => boolean, object][];
};

export default class ImageBuilder {
  _renderTimer: AnimationTimer;
  _projector: ImageProjector;
  _painter: GraphPainter;

  _jobs: Job[];

  _width: number;
  _height: number;

  constructor(width: number, height: number) {
    this._renderTimer = new AnimationTimer();
    this._renderTimer.setListener(this.cycle, this);

    this._width = width;
    this._height = height;

    this._jobs = [];
    this._projector = new ImageProjector(width, height, 1);
    this._painter = new GraphPainter(null, new Camera());
    this._painter.setOnScheduleUpdate(this.scheduleUpdate, this);
    this._painter.camera().setSize(width, height);

    this.scheduleUpdate();
  }

  scheduleUpdate() {
    this._renderTimer.schedule();
  }

  projector() {
    return this._projector;
  }

  painter() {
    return this._painter;
  }

  createImage(
    creatorFunc: Function,
    creatorFuncThisArg?: object,
    callbackFunc?: (img: HTMLElement) => void,
    callbackFuncThisArg?: object
  ) {
    console.log("Adding job");
    this._jobs.push({
      creatorFunc: creatorFunc as () => DirectionNode,
      creatorFuncThisArg: creatorFuncThisArg,
      callbackFunc: callbackFunc,
      callbackFuncThisArg: callbackFuncThisArg,
      root: null,
      rootless: false,
      builders: null,
    });
    this.scheduleUpdate();
  }

  queueJob(
    builderFunc: (timeLeft: number) => boolean,
    builderFuncThisArg?: any
  ) {
    const job = this._jobs[0];
    if (!job) {
      throw new Error(
        "ImageBuilder must have a scene in progress to queue a builder."
      );
    }
    if (!job.builders) {
      job.builders = [];
    }
    job.builders.push([builderFunc, builderFuncThisArg]);
  }

  cycle() {
    const timeout = INTERVAL;
    const startTime = new Date();
    const timeLeft = function () {
      return timeout - elapsed(startTime);
    };
    const job = this._jobs[0];
    if (!job) {
      console.log("No scenes to build.");
      return false;
    }
    if (!job.rootless && !job.root) {
      job.root = job.creatorFunc.call(job.creatorFuncThisArg);
      if (!job.root) {
        job.rootless = true;
      } else {
        this._painter.setRoot(job.root);
        this._painter.markDirty();
      }
    }
    if (job.builders) {
      for (let builder = job.builders[0]; builder; builder = job.builders[0]) {
        const callAgain = builder[0].call(builder[1], timeLeft());
        if (!callAgain) {
          // console.log("Finished with builder");
          job.builders.shift();
        }
        if (timeLeft() < 0) {
          this.scheduleUpdate();
          return;
        }
      }
    }
    let needsUpdate = job.builders && job.builders.length > 0;
    needsUpdate =
      this._painter.paint(this.projector(), timeLeft()) || needsUpdate;
    this.project(job.root);
    needsUpdate = this._painter.render(this.projector()) || needsUpdate;
    if (needsUpdate) {
      this.scheduleUpdate();
      return;
    }

    // console.log("Completed render");
    if (job.callbackFunc) {
      job.callbackFunc.call(
        job.callbackFuncThisArg,
        this.projector().screenshot()
      );
    }
    if (job.root) {
      this._painter.setRoot(null);
    }
    this._jobs.shift();
    this.newImage();
    this.scheduleUpdate();
  }

  project(root: PaintedNode) {
    this.projector().setExplicitSize(this._width, this._height);
    root.value().getLayout().commitLayoutIteratively();
    showInCamera(root, this.painter().camera(), false);
    const proj = this.projector();
    proj.overlay().resetTransform();
    this.projector().render();
    this.projector().glProvider().gl().viewport(0, 0, this.projector().width(), this.projector().height());
  }

  newImage() {
    const proj = this.projector();
    const w = proj.width();
    const h = proj.height();
    if (proj.hasDOMContainer()) {
      this.projector().getDOMContainer().innerHTML = "";
    }
    if (proj.hasOverlay()) {
      this.projector().overlay().clearRect(0, 0, w, h);
    }
    if (proj.glProvider().hasGL()) {
      const gl = this.projector().gl();
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    this.projector().imageContext().clearRect(0, 0, w, h);
    const gl = this.projector().gl();
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      (this.projector() as any)._targetTexture,
      0
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
  }
}
