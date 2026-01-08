/**
 * Maintenance Agent for C&R Vendor Locator
 * Handles issue tracking, error reporting, and development logging
 * Runs in local mode until Mission Control credentials are configured
 */

type LogType = 'bugfix' | 'feature' | 'upgrade' | 'refactor' | 'hotfix' | 'deployment' | 'config' | 'security' | 'performance';

type Category = 
  | 'vendors' 
  | 'products' 
  | 'oem_brands' 
  | 'engine_brands' 
  | 'payment_types' 
  | 'users' 
  | 'auth' 
  | 'roles' 
  | 'search' 
  | 'migration' 
  | 'audit' 
  | 'infrastructure'
  | 'ui'
  | 'api';

type Priority = 'low' | 'medium' | 'high' | 'critical';

interface LogEntry {
  type: LogType;
  category: Category;
  message: string;
  ticketNumber?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface IssueReport {
  title: string;
  description?: string;
  priority: Priority;
  category?: Category;
  userEmail?: string;
  userId?: string;
  pageUrl: string;
  browserInfo: string;
  ticketNumber: string;
  timestamp: string;
}

interface ErrorReport {
  error: Error;
  componentStack?: string;
  userEmail?: string;
  userId?: string;
  pageUrl: string;
  browserInfo: string;
  ticketNumber: string;
  timestamp: string;
}

interface MissionControlConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

class MaintenanceAgent {
  private static instance: MaintenanceAgent;
  private config: MissionControlConfig | null = null;
  private logs: LogEntry[] = [];
  private issues: IssueReport[] = [];
  private errors: ErrorReport[] = [];
  private heartbeatInterval: number | null = null;

  private constructor() {
    this.startHeartbeat();
  }

  static getInstance(): MaintenanceAgent {
    if (!MaintenanceAgent.instance) {
      MaintenanceAgent.instance = new MaintenanceAgent();
    }
    return MaintenanceAgent.instance;
  }

  configure(config: MissionControlConfig): void {
    this.config = config;
    this.consoleLog('info', 'Mission Control configured', config.supabaseUrl);
  }

  private generateTicketNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const part1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `CR-${part1}-${part2}`;
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    return `${ua} | Screen: ${screenInfo}`;
  }

  private consoleLog(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const prefix = '🔧 MAINTENANCE:';
    const timestamp = new Date().toISOString();
    
    if (level === 'error') {
      console.error(`${prefix} [${timestamp}] ${message}`, data ?? '');
    } else if (level === 'warn') {
      console.warn(`${prefix} [${timestamp}] ${message}`, data ?? '');
    } else {
      console.log(`${prefix} [${timestamp}] ${message}`, data ?? '');
    }
  }

  private async sendToMissionControl<T>(endpoint: string, data: T): Promise<boolean> {
    if (!this.config) {
      this.consoleLog('info', `[LOCAL MODE] Would send to ${endpoint}:`, data);
      return true;
    }

    try {
      const response = await fetch(`${this.config.supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      this.consoleLog('error', `Failed to send to Mission Control: ${endpoint}`, error);
      return false;
    }
  }

  log(type: LogType, category: Category, message: string, ticketNumber?: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      type,
      category,
      message,
      ticketNumber,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);
    this.consoleLog('info', `[${type.toUpperCase()}] [${category}] ${message}`, { ticketNumber, metadata });
    this.sendToMissionControl('maintenance-log', entry);
  }

  bugfix(category: Category, message: string, ticketNumber?: string): void {
    this.log('bugfix', category, message, ticketNumber);
  }

  feature(category: Category, message: string, ticketNumber?: string): void {
    this.log('feature', category, message, ticketNumber);
  }

  deployment(message: string, metadata?: Record<string, unknown>): void {
    this.log('deployment', 'infrastructure', message, undefined, metadata);
  }

  reportIssue(
    title: string,
    description: string | undefined,
    priority: Priority,
    userContext?: { email?: string; userId?: string }
  ): string {
    const ticketNumber = this.generateTicketNumber();
    
    const issue: IssueReport = {
      title,
      description,
      priority,
      userEmail: userContext?.email,
      userId: userContext?.userId,
      pageUrl: window.location.href,
      browserInfo: this.getBrowserInfo(),
      ticketNumber,
      timestamp: new Date().toISOString(),
    };

    this.issues.push(issue);
    this.consoleLog('warn', `[ISSUE REPORTED] ${ticketNumber}: ${title}`, issue);
    this.sendToMissionControl('maintenance-issue', issue);

    return ticketNumber;
  }

  reportError(
    error: Error,
    componentStack?: string,
    userContext?: { email?: string; userId?: string }
  ): string {
    const ticketNumber = this.generateTicketNumber();

    const errorReport: ErrorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      componentStack,
      userEmail: userContext?.email,
      userId: userContext?.userId,
      pageUrl: window.location.href,
      browserInfo: this.getBrowserInfo(),
      ticketNumber,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(errorReport);
    this.consoleLog('error', `[ERROR CAPTURED] ${ticketNumber}: ${error.message}`, errorReport);
    this.sendToMissionControl('maintenance-error', errorReport);

    return ticketNumber;
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = window.setInterval(() => {
      this.sendToMissionControl('maintenance-heartbeat', {
        appKey: 'cr-vendor-locator',
        timestamp: new Date().toISOString(),
        logsCount: this.logs.length,
        issuesCount: this.issues.length,
        errorsCount: this.errors.length,
      });
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getIssues(): IssueReport[] {
    return [...this.issues];
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }
}

export const maintenanceAgent = MaintenanceAgent.getInstance();

export type { LogType, Category, Priority, LogEntry, IssueReport, ErrorReport };
