interface SecurityEvent {
  type: 'auth_failure' | 'suspicious_access' | 'api_key_usage' | 'rate_limit_exceeded';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory

  private getClientInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
  }

  logAuthFailure(email: string, reason: string, details?: Record<string, any>) {
    const event: SecurityEvent = {
      type: 'auth_failure',
      email,
      details: {
        reason,
        ...details,
        ...this.getClientInfo()
      },
      timestamp: new Date().toISOString()
    };

    this.addEvent(event);
    
    // In production, send to security monitoring service
    console.warn('🔒 Security Event - Auth Failure:', event);
  }

  logSuspiciousAccess(userId: string, action: string, details?: Record<string, any>) {
    const event: SecurityEvent = {
      type: 'suspicious_access',
      userId,
      details: {
        action,
        ...details,
        ...this.getClientInfo()
      },
      timestamp: new Date().toISOString()
    };

    this.addEvent(event);
    console.warn('🔒 Security Event - Suspicious Access:', event);
  }

  logApiKeyUsage(userId: string, keyHint: string, endpoint?: string) {
    const event: SecurityEvent = {
      type: 'api_key_usage',
      userId,
      details: {
        keyHint,
        endpoint,
        ...this.getClientInfo()
      },
      timestamp: new Date().toISOString()
    };

    this.addEvent(event);
    console.log('🔑 API Key Usage:', event);
  }

  logRateLimitExceeded(identifier: string, limit: number, timeWindow: string) {
    const event: SecurityEvent = {
      type: 'rate_limit_exceeded',
      email: identifier,
      details: {
        limit,
        timeWindow,
        ...this.getClientInfo()
      },
      timestamp: new Date().toISOString()
    };

    this.addEvent(event);
    console.warn('🔒 Security Event - Rate Limit Exceeded:', event);
  }

  private addEvent(event: SecurityEvent) {
    this.events.push(event);
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Store recent events in localStorage for debugging
    try {
      const recentEvents = this.events.slice(-10);
      localStorage.setItem('security-events', JSON.stringify(recentEvents));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  getRecentEvents(type?: SecurityEvent['type'], limit = 50): SecurityEvent[] {
    let events = this.events.slice(-limit);
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    return events.reverse(); // Most recent first
  }

  clearEvents() {
    this.events = [];
    localStorage.removeItem('security-events');
  }
}

export const securityLogger = new SecurityLogger();
