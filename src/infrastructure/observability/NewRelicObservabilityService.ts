import { injectable, inject } from 'tsyringe';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';
import type { ILogger } from '../../shared/interfaces/ILogger.js';

@injectable()
export class NewRelicObservabilityService implements IObservabilityService {
  private agent: any | null = null;

  constructor(@inject('ILogger') private readonly logger: ILogger) {
    try {
      if (process.env.NEW_RELIC_LICENSE_KEY) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.agent = require('newrelic');
      }
    } catch {
      this.agent = null;
    }
  }

  isEnabled(): boolean { return Boolean(this.agent); }

  async startWebTransaction<T>(name: string, handler: () => Promise<T>): Promise<T> {
    if (!this.agent) return handler();
    return await new Promise<T>((resolve, reject) => {
      this.agent.startWebTransaction(name, async () => {
        try {
          const res = await handler();
          this.agent.endTransaction();
          resolve(res);
        } catch (e) {
          this.agent.noticeError(e);
          this.agent.endTransaction();
          reject(e);
        }
      });
    });
  }

  async startBackgroundTransaction<T>(name: string, handler: () => Promise<T>): Promise<T> {
    if (!this.agent) return handler();
    return await new Promise<T>((resolve, reject) => {
      this.agent.startBackgroundTransaction(name, async () => {
        try {
          const res = await handler();
          this.agent.endTransaction();
          resolve(res);
        } catch (e) {
          this.agent.noticeError(e);
          this.agent.endTransaction();
          reject(e);
        }
      });
    });
  }

  async startSegment<T>(name: string, record: boolean, handler: () => Promise<T>): Promise<T> {
    if (!this.agent) return handler();
    return await this.agent.startSegment(name, record, handler);
  }

  addCustomAttributes(attrs: Record<string, unknown>): void {
    if (!this.agent) return;
    try { this.agent.addCustomAttributes(attrs); } catch {}
  }

  noticeError(error: Error, attrs?: Record<string, unknown>): void {
    if (!this.agent) return;
    try { this.agent.noticeError(error, attrs); } catch {}
  }
}

