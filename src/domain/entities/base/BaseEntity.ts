export abstract class BaseEntity<T> {
  protected _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: string, createdAt: Date, updatedAt: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Abstract methods that must be implemented by subclasses
  abstract validate(): boolean;
  abstract toJSON(): T;
  abstract clone(): BaseEntity<T>;

  // Common utility methods
  /*isNew(): boolean {
    return !this._id || this._id === '';
  }

  equals(other: BaseEntity<T>): boolean {
    return this._id === other._id;
  }*/

  // Update timestamp when entity is modified
  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }
} 