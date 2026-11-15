import type { WedgeStatus, ResetResponse, Phase } from './types';

export class DemoSimulator {
  private phase: Phase = 'RESETTING';
  private angle: number = 0;
  private distance: number = 75.0;
  private initialDist: number = 75.0;
  private slipped: boolean = false;
  private slipAngle: number | null = null;
  private targetSlipAngle: number = 28;
  private startTime: number = Date.now();

  private resetTimer: ReturnType<typeof setInterval> | null = null;
  private placeBlockTimer: ReturnType<typeof setTimeout> | null = null;
  private runningTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startResetSequence();
  }

  private pickRandomSlipAngle(): number {
    return Math.floor(Math.random() * (36 - 22 + 1)) + 22;
  }

  public getStatus(): WedgeStatus {
    // Subtle acoustic sensor noise (+-0.3 mm)
    const noise = (Math.random() - 0.5) * 0.6;
    let currentDistance: number | null = null;

    if (this.phase === 'RUNNING') {
      currentDistance = Math.round((this.initialDist + noise) * 10) / 10;
    } else if (this.phase === 'SLIPPED') {
      currentDistance = Math.round((this.initialDist + 28.4 + noise) * 10) / 10;
    }

    return {
      angle: this.angle,
      distance: currentDistance,
      initialDist: this.phase === 'RESETTING' ? null : this.initialDist,
      slipped: this.slipped,
      slipAngle: this.slipAngle,
      phase: this.phase,
      maxAngle: 60,
      slipTolerance: 25,
      uptimeMs: Date.now() - this.startTime,
    };
  }

  public reset(): ResetResponse {
    if (this.phase === 'RESETTING' || this.phase === 'PLACE_BLOCK') {
      return { ok: false, reason: 'busy' };
    }
    this.startResetSequence();
    return { ok: true };
  }

  private startResetSequence() {
    if (this.resetTimer) clearInterval(this.resetTimer);
    if (this.placeBlockTimer) clearTimeout(this.placeBlockTimer);
    if (this.runningTimer) clearInterval(this.runningTimer);

    this.phase = 'RESETTING';
    this.slipped = false;
    this.slipAngle = null;
    this.targetSlipAngle = this.pickRandomSlipAngle();

    // Slew angle down at 25ms per degree
    this.resetTimer = setInterval(() => {
      if (this.angle > 0) {
        this.angle--;
      } else {
        if (this.resetTimer) clearInterval(this.resetTimer);
        this.phase = 'PLACE_BLOCK';
        this.angle = 0;

        // 3-second place block countdown
        this.placeBlockTimer = setTimeout(() => {
          this.initialDist = 75.0;
          this.distance = this.initialDist;
          this.phase = 'RUNNING';

          // Automated inclination ramp: +1 degree per second
          this.runningTimer = setInterval(() => {
            if (this.phase === 'RUNNING') {
              this.angle++;
              if (this.angle >= this.targetSlipAngle) {
                this.slipped = true;
                this.slipAngle = this.angle;
                this.phase = 'SLIPPED';
                this.distance = this.initialDist + 28.4;
                if (this.runningTimer) clearInterval(this.runningTimer);
              } else if (this.angle >= 60) {
                if (this.runningTimer) clearInterval(this.runningTimer);
              }
            }
          }, 1000);
        }, 3000);
      }
    }, 25);
  }

  public destroy() {
    if (this.resetTimer) clearInterval(this.resetTimer);
    if (this.placeBlockTimer) clearTimeout(this.placeBlockTimer);
    if (this.runningTimer) clearInterval(this.runningTimer);
  }
}
