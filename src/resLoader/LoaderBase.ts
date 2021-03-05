export class LoaderBase<T> {
  constructor() {}

  private eventmap = new Map<keyof T, ((arg)=>void)[]>()

  protected trigger<K extends keyof T>(
    eventName: K,
    payload: T[K]
  ) {
    const arr = this.eventmap.get(eventName) || []
    for (const cb of arr) {
      cb(payload)
    }
  }

  on<K extends keyof T>(
    eventName: K,
    callback: (arg: T[K]) => void,
  ) {
    const arr = this.eventmap.get(eventName) || []
    arr.push(
      callback
    )
    if (!this.eventmap.has(eventName)) {
      this.eventmap.set(eventName, arr)
    }
  }

  off<K extends keyof T>(
    eventName: K,
    callback: (arg: T[K]) => void,
  ) {
    const arr = this.eventmap.get(eventName) || []
    const idx = arr.indexOf(callback)
    if (idx >= 0) arr.splice(idx, 1)
  }
}

export interface ILoader<T> {
  load(res: T): Promise<string>
}