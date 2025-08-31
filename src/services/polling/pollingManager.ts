/**
 * Intelligent REST polling service for job status updates
 * Implements smart polling with exponential backoff, pause/resume, and error handling
 */

import { store } from '../../store';
import { analysisApi } from '../api/analysisApi';
import { startPolling, stopPolling, addJobToPolling, removeJobFromPolling } from '../../store/slices/analysisSlice';

export interface PollingConfig {
  minInterval: number;
  maxInterval: number;
  backoffMultiplier: number;
  maxRetries: number;
  pauseOnInactive: boolean;
}

export interface JobPollingState {
  jobId: string;
  currentInterval: number;
  retryCount: number;
  lastPollTime: number;
  isPolling: boolean;
  error?: string;
}

class PollingManager {
  private config: PollingConfig = {
    minInterval: 1000,     // 1 second minimum
    maxInterval: 30000,    // 30 seconds maximum
    backoffMultiplier: 1.5, // Gradual backoff
    maxRetries: 5,         // Max retries before giving up
    pauseOnInactive: true, // Pause when tab is inactive
  };

  private pollingJobs = new Map<string, JobPollingState>();
  private timers = new Map<string, NodeJS.Timeout>();
  private isTabActive = true;
  private globalPauseCount = 0;

  constructor() {
    this.setupVisibilityHandling();
    this.setupNetworkHandling();
  }

  /**
   * Start polling for a specific job
   */
  public startJobPolling(jobId: string, initialInterval = this.config.minInterval): void {
    // Don't start if already polling
    if (this.pollingJobs.has(jobId)) {
      return;
    }

    const pollingState: JobPollingState = {
      jobId,
      currentInterval: initialInterval,
      retryCount: 0,
      lastPollTime: Date.now(),
      isPolling: true,
    };

    this.pollingJobs.set(jobId, pollingState);
    
    // Update Redux state
    store.dispatch(addJobToPolling(jobId));
    
    this.scheduleNextPoll(jobId);
  }

  /**
   * Stop polling for a specific job
   */
  public stopJobPolling(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }

    this.pollingJobs.delete(jobId);
    
    // Update Redux state
    store.dispatch(removeJobFromPolling(jobId));
  }

  /**
   * Start polling for multiple jobs
   */
  public startBatchPolling(jobIds: string[]): void {
    // Update Redux state first
    store.dispatch(startPolling({ jobIds }));
    
    jobIds.forEach(jobId => this.startJobPolling(jobId));
  }

  /**
   * Stop all polling
   */
  public stopAllPolling(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear polling states
    this.pollingJobs.clear();
    
    // Update Redux state
    store.dispatch(stopPolling());
  }

  /**
   * Pause all polling (e.g., when tab becomes inactive)
   */
  public pauseAll(): void {
    this.globalPauseCount++;
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Resume all polling (e.g., when tab becomes active)
   */
  public resumeAll(): void {
    if (this.globalPauseCount > 0) {
      this.globalPauseCount--;
    }
    
    if (this.globalPauseCount === 0) {
      // Resume polling for active jobs
      this.pollingJobs.forEach((state, jobId) => {
        if (state.isPolling) {
          this.scheduleNextPoll(jobId);
        }
      });
    }
  }

  /**
   * Get current polling status
   */
  public getPollingStatus(): {
    activeJobs: string[];
    totalJobs: number;
    isPaused: boolean;
    nextPollTimes: Record<string, number>;
  } {
    const activeJobs = Array.from(this.pollingJobs.keys());
    const nextPollTimes: Record<string, number> = {};
    
    this.pollingJobs.forEach((state, jobId) => {
      nextPollTimes[jobId] = state.lastPollTime + state.currentInterval;
    });

    return {
      activeJobs,
      totalJobs: this.pollingJobs.size,
      isPaused: this.globalPauseCount > 0,
      nextPollTimes,
    };
  }

  /**
   * Schedule the next poll for a job
   */
  private scheduleNextPoll(jobId: string): void {
    const pollingState = this.pollingJobs.get(jobId);
    if (!pollingState || !pollingState.isPolling) {
      return;
    }

    // Don't schedule if globally paused or tab is inactive
    if (this.globalPauseCount > 0 || (!this.isTabActive && this.config.pauseOnInactive)) {
      return;
    }

    const timer = setTimeout(() => {
      this.pollJobStatus(jobId);
    }, pollingState.currentInterval);

    this.timers.set(jobId, timer);
  }

  /**
   * Poll job status and handle response
   */
  private async pollJobStatus(jobId: string): Promise<void> {
    const pollingState = this.pollingJobs.get(jobId);
    if (!pollingState) {
      return;
    }

    try {
      // Trigger RTK Query fetch
      const result = await store.dispatch(
        analysisApi.endpoints.getJobStatus.initiate(jobId, { forceRefetch: true })
      ).unwrap();

      // Handle successful response
      this.handleSuccessfulPoll(jobId, result);

    } catch (error) {
      // Handle polling error
      this.handlePollingError(jobId, error);
    }
  }

  /**
   * Handle successful polling response
   */
  private handleSuccessfulPoll(jobId: string, result: any): void {
    const pollingState = this.pollingJobs.get(jobId);
    if (!pollingState) return;

    // Reset retry count on success
    pollingState.retryCount = 0;
    pollingState.lastPollTime = Date.now();
    pollingState.error = undefined;

    // Check if job is completed
    if (result.isCompleted) {
      // Job is done, stop polling
      this.stopJobPolling(jobId);
      return;
    }

    // Adjust polling interval based on job progress
    if (result.progress > 50) {
      // Job is progressing well, poll more frequently
      pollingState.currentInterval = Math.max(
        this.config.minInterval,
        pollingState.currentInterval / this.config.backoffMultiplier
      );
    } else {
      // Job is starting/slow, back off slightly
      pollingState.currentInterval = Math.min(
        this.config.maxInterval,
        pollingState.currentInterval * this.config.backoffMultiplier
      );
    }

    // Schedule next poll
    this.scheduleNextPoll(jobId);
  }

  /**
   * Handle polling errors with exponential backoff
   */
  private handlePollingError(jobId: string, error: any): void {
    const pollingState = this.pollingJobs.get(jobId);
    if (!pollingState) return;

    pollingState.retryCount++;
    pollingState.error = error.message || 'Polling failed';

    // Check if max retries exceeded
    if (pollingState.retryCount >= this.config.maxRetries) {
      console.warn(`Polling failed for job ${jobId} after ${this.config.maxRetries} retries:`, error);
      this.stopJobPolling(jobId);
      return;
    }

    // Exponential backoff for errors
    pollingState.currentInterval = Math.min(
      this.config.maxInterval,
      pollingState.currentInterval * (this.config.backoffMultiplier * 2)
    );

    // Schedule retry
    this.scheduleNextPoll(jobId);
  }

  /**
   * Setup tab visibility handling
   */
  private setupVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isTabActive = !document.hidden;
        
        if (this.isTabActive) {
          // Tab became active, resume polling
          this.resumeAll();
        } else if (this.config.pauseOnInactive) {
          // Tab became inactive, pause polling
          this.pauseAll();
        }
      });
    }
  }

  /**
   * Setup network connectivity handling
   */
  private setupNetworkHandling(): void {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      window.addEventListener('online', () => {
        // Network came back, resume polling with fresh intervals
        this.pollingJobs.forEach(state => {
          state.currentInterval = this.config.minInterval;
          state.retryCount = 0;
        });
        this.resumeAll();
      });

      window.addEventListener('offline', () => {
        // Network lost, pause all polling
        this.pauseAll();
      });
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PollingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get polling statistics for debugging
   */
  public getStats(): {
    activePolls: number;
    averageInterval: number;
    totalRetries: number;
    errors: Record<string, string>;
  } {
    const jobs = Array.from(this.pollingJobs.values());
    const totalRetries = jobs.reduce((sum, job) => sum + job.retryCount, 0);
    const averageInterval = jobs.length > 0 
      ? jobs.reduce((sum, job) => sum + job.currentInterval, 0) / jobs.length
      : 0;
    
    const errors: Record<string, string> = {};
    jobs.forEach(job => {
      if (job.error) {
        errors[job.jobId] = job.error;
      }
    });

    return {
      activePolls: jobs.length,
      averageInterval: Math.round(averageInterval),
      totalRetries,
      errors,
    };
  }
}

// Export singleton instance
export const pollingManager = new PollingManager();

// Export type for external use
export type { PollingManager };