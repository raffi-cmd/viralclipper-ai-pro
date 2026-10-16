import { JobStatus, ProcessingJob } from './types';

export type JobSubscriber = (job: ProcessingJob) => void;

export class ProcessingJobManager {
  private currentJob: ProcessingJob = {
    id: 'idle',
    status: 'idle',
    progress: 0,
    stepDescription: 'Menunggu input video...',
    canCancel: false,
  };

  private subscribers: Set<JobSubscriber> = new Set();
  private timeoutTimer: NodeJS.Timeout | null = null;
  private isCancelled = false;

  subscribe(callback: JobSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.currentJob);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb({ ...this.currentJob }));
  }

  startJob(jobId: string, initialDescription: string): void {
    this.isCancelled = false;
    this.clearTimeoutTimer();

    this.currentJob = {
      id: jobId,
      status: 'validating',
      progress: 5,
      stepDescription: initialDescription,
      canCancel: true,
    };
    this.notify();

    // Set watchdog timeout for 90 seconds
    this.timeoutTimer = setTimeout(() => {
      if (this.currentJob.status !== 'completed' && this.currentJob.status !== 'failed') {
        this.failJob('Batas waktu pemrosesan terlampaui (timeout 90 detik). Silakan coba lagi.');
      }
    }, 90000);
  }

  updateStage(status: JobStatus, progress: number, stepDescription: string): void {
    if (this.isCancelled) return;
    this.currentJob = {
      ...this.currentJob,
      status,
      progress: Math.min(100, Math.max(0, progress)),
      stepDescription,
    };
    this.notify();
  }

  completeJob(message = 'Pemrosesan selesai! Klip siap dipratinjau & diunduh.'): void {
    this.clearTimeoutTimer();
    this.currentJob = {
      ...this.currentJob,
      status: 'completed',
      progress: 100,
      stepDescription: message,
      canCancel: false,
    };
    this.notify();
  }

  failJob(errorMessage: string): void {
    this.clearTimeoutTimer();
    this.currentJob = {
      ...this.currentJob,
      status: 'failed',
      progress: 0,
      stepDescription: 'Pemrosesan gagal.',
      error: errorMessage,
      canCancel: false,
    };
    this.notify();
  }

  cancelJob(): void {
    this.isCancelled = true;
    this.clearTimeoutTimer();
    this.currentJob = {
      ...this.currentJob,
      status: 'cancelled',
      progress: 0,
      stepDescription: 'Proses dibatalkan oleh pengguna.',
      canCancel: false,
    };
    this.notify();
  }

  getJob(): ProcessingJob {
    return { ...this.currentJob };
  }

  private clearTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}
