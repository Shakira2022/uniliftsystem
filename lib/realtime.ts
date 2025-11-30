// Real-time service for live updates and notifications
export class RealtimeService {
  private static instance: RealtimeService;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private mockInterval: NodeJS.Timeout | null = null;

  // Track last status per request to ensure one-time notifications
  private requestStatusMap: Map<number, string> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Subscribe to real-time updates
  subscribe(channel: string, callback: (data: any) => void) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    if (!this.mockInterval) {
      this.startMockUpdates();
    }

    return () => {
      const channelSubs = this.subscribers.get(channel);
      if (channelSubs) {
        channelSubs.delete(callback);
        if (channelSubs.size === 0) this.subscribers.delete(channel);
      }
    };
  }

  // Publish updates to subscribers
  publish(channel: string, data: any) {
    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) channelSubs.forEach(cb => cb(data));
  }

  // Mock real-time updates for demo
  private startMockUpdates() {
    this.mockInterval = setInterval(() => {
      const rideId = Math.floor(Math.random() * 5) + 1; // Demo: 5 rides
      const statuses = ["assigned", "in_progress", "completed", "cancelled"];
      const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];

      const lastStatus = this.requestStatusMap.get(rideId);

      // Only publish a new event if the status has changed
      if (lastStatus !== nextStatus) {
        let notificationType = "";
        switch (nextStatus) {
          case "assigned":
            notificationType = "request_assigned";
            break;
          case "in_progress":
            notificationType = "in_progress";
            break;
          case "completed":
            notificationType = "request_completed";
            break;
          case "cancelled":
            notificationType = "request_cancelled";
            break;
          default:
            return;
        }

        this.publish("ride-updates", {
          rideId,
          type: notificationType, // Correct: Now passes the expected type
          status: nextStatus,
          timestamp: new Date().toISOString(),
        });
        
        this.requestStatusMap.set(rideId, nextStatus);
      }

      // Demo driver location
      this.publish("driver-location", {
        driverId: Math.floor(Math.random() * 10),
        lat: -26.6875 + (Math.random() - 0.5) * 0.01,
        lng: 27.0953 + (Math.random() - 0.5) * 0.01,
        timestamp: new Date().toISOString(),
      });
    }, 3000);
  }

  // Send notification
  sendNotification(
    userId: string,
    notification: { title: string; message: string; type: "info" | "success" | "warning" | "error"; }
  ) {
    this.publish(`notifications-${userId}`, {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  destroy() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    this.subscribers.clear();
    this.requestStatusMap.clear();
  }
}

export const realtimeService = RealtimeService.getInstance();