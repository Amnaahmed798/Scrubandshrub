/**
 * Location update throttler for washer tracking
 * Only sends location updates when:
 * 1. Minimum time interval has passed (e.g., 3 seconds)
 * 2. Location has changed significantly (e.g., >10 meters)
 */

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface ThrottlerOptions {
  minIntervalMs?: number;      // Minimum time between updates (default: 3000ms)
  minDistanceMeters?: number;  // Minimum distance to trigger update (default: 10m)
  onSendUpdate?: (location: LocationUpdate) => void; // Callback to send update
}

export class LocationThrottler {
  private lastLocation: LocationUpdate | null = null;
  private lastSendTime: number = 0;
  private readonly minIntervalMs: number;
  private readonly minDistanceMeters: number;
  private readonly onSendUpdate?: (location: LocationUpdate) => void;
  private pendingUpdate: LocationUpdate | null = null;
  private pendingTimeout: NodeJS.Timeout | null = null;

  constructor(options: ThrottlerOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 3000; // 3 seconds default
    this.minDistanceMeters = options.minDistanceMeters ?? 10; // 10 meters default
    this.onSendUpdate = options.onSendUpdate;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Process a new location update
   * Will send immediately if:
   * - First location ever
   * - Minimum time has passed AND location changed significantly
   * Will queue for later if:
   * - Time threshold not met but location changed
   */
  processLocation(location: LocationUpdate): void {
    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;

    // First location ever - send immediately
    if (!this.lastLocation) {
      console.log('[LocationThrottler] First location, sending immediately');
      this.sendUpdate(location);
      return;
    }

    // Calculate distance from last sent location
    const distance = this.calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      location.latitude,
      location.longitude
    );

    const shouldSendNow = timeSinceLastSend >= this.minIntervalMs;
    const hasMovedSignificantly = distance >= this.minDistanceMeters;

    console.log(
      `[LocationThrottler] Time: ${timeSinceLastSend}ms (${this.minIntervalMs}ms), ` +
      `Distance: ${distance.toFixed(1)}m (${this.minDistanceMeters}m), ` +
      `Send now: ${shouldSendNow}, Moved: ${hasMovedSignificantly}`
    );

    // Send immediately if both conditions met
    if (shouldSendNow && hasMovedSignificantly) {
      console.log('[LocationThrottler] Sending update (time + distance threshold met)');
      this.sendUpdate(location);
    }
    // Queue for later if moved but time threshold not met
    else if (hasMovedSignificantly && !shouldSendNow) {
      console.log('[LocationThrottler] Queuing update (moved, waiting for timer)');
      this.queueUpdate(location);
    }
    // Ignore if hasn't moved significantly
    else {
      console.log('[LocationThrottler] Ignoring update (no significant movement)');
    }
  }

  /**
   * Send location update immediately
   */
  private sendUpdate(location: LocationUpdate): void {
    this.lastLocation = location;
    this.lastSendTime = Date.now();
    this.pendingUpdate = null;

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    if (this.onSendUpdate) {
      this.onSendUpdate(location);
    }
  }

  /**
   * Queue location update to be sent when timer expires
   */
  private queueUpdate(location: LocationUpdate): void {
    this.pendingUpdate = location;

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    const remainingTime = this.minIntervalMs - (Date.now() - this.lastSendTime);
    console.log(`[LocationThrottler] Will send queued update in ${remainingTime}ms`);

    this.pendingTimeout = setTimeout(() => {
      if (this.pendingUpdate) {
        console.log('[LocationThrottler] Sending queued update (timer expired)');
        this.sendUpdate(this.pendingUpdate);
      }
    }, Math.max(0, remainingTime));
  }

  /**
   * Force send the latest location (e.g., on cleanup)
   */
  forceSend(): void {
    if (this.pendingUpdate) {
      console.log('[LocationThrottler] Force sending pending update');
      this.sendUpdate(this.pendingUpdate);
    } else if (this.lastLocation) {
      console.log('[LocationThrottler] Force sending last location');
      this.sendUpdate(this.lastLocation);
    }
  }

  /**
   * Cleanup - clear pending timeout
   */
  cleanup(): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    this.pendingUpdate = null;
  }

  /**
   * Get stats about throttling effectiveness
   */
  getStats(): { lastLocation: LocationUpdate | null; lastSendTime: number } {
    return {
      lastLocation: this.lastLocation,
      lastSendTime: this.lastSendTime
    };
  }
}
