export interface IObservabilityService {
  startWebTransaction<T>(name: string, handler: () => Promise<T>): Promise<T>;
  startBackgroundTransaction<T>(name: string, handler: () => Promise<T>): Promise<T>;
  startSegment<T>(name: string, record: boolean, handler: () => Promise<T>): Promise<T>;
  addCustomAttributes(attrs: Record<string, unknown>): void;
  noticeError(error: Error, attrs?: Record<string, unknown>): void;
  isEnabled(): boolean;
}

