import { AnimationTimer, elapsed } from "parsegraph-timing";
import GraphPainter, {Viewport} from 'parsegraph-graphpainter';
import {ImageProjector} from 'parsegraph-projector';
import Camera from 'parsegraph-camera';
import {INTERVAL} from 'parsegraph-timingbelt';
import {showInCamera} from 'parsegraph-showincamera';

export default class ImageBuilder {
  _renderTimer: AnimationTimer;
  _projector: ImageProjector;
  _painter: GraphPainter;

  _jobs: any[];
  _builders: any[];

  constructor(width: number, height: number) {
    this._renderTimer = new AnimationTimer();
    this._renderTimer.setListener(this.cycle, this);

    this._jobs = [];
    this._builders = [];
    this._projector = new ImageProjector(width, height, 1);
    this._painter = new GraphPainter(null, new Camera());
    this._painter.setOnScheduleUpdate(this.scheduleUpdate, this);

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
    creatorFuncThisArg?: any,
    callbackFunc?: Function,
    callbackFuncThisArg?: any
  ) {
    this._jobs.push({
      creatorFunc: creatorFunc,
      creatorFuncThisArg: creatorFuncThisArg,
      callbackFunc: callbackFunc,
      callbackFuncThisArg: callbackFuncThisArg,
    });
  }

  queueJob(builderFunc: Function, builderFuncThisArg?: any) {
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
      // console.log("No scenes to build.");
      return false;
    }
    if (!job.rootless && !job.root) {
      job.root = job.creatorFunc.call(job.creatorFuncThisArg);
      if (!job.root) {
        job.rootless = true;
      } else {
        showInCamera(job.root, this.painter().camera());
        this._painter.setRoot(job.root);
        this._painter.scheduleRepaint();
      }
      job.callbackFunc.call(job.callbackFuncThisArg, this._projector.screenshot());
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
    needsUpdate = this._painter.paint(timeLeft()) || needsUpdate;
    needsUpdate = this._painter.render() || needsUpdate;
    if (needsUpdate) {
      this.scheduleUpdate();
      return;
    }
    // console.log("Completed render");
    this._jobs.shift();
    //this._window.newImage();
    if (job.root) {
      this._painter.setRoot(null);
    }
    this.scheduleUpdate();
  }
}
