class Mutex {
    public queue : (() => void)[] = [];
    public locked : boolean;

    constructor() {
      this.queue = [];  // File d'attente des tâches en attente
      this.locked = false; // Indique si le mutex est verrouillé
    }
  
    async lock() : Promise<void> {
      return new Promise((resolve) => {
        if (!this.locked) {
          this.locked = true;
          resolve();
        } else {
          this.queue.push(resolve);
        }
      });
    }
  
    unlock() {
      if (this.queue.length > 0) {
        const next = this.queue.shift(); // Prend la prochaine tâche en attente
        if (next) next(); // Libère le mutex pour elle
      } else {
        this.locked = false;
      }
    }
  
    async runExclusive(callback: () => Promise<void>): Promise<void> {
      await this.lock();
      try {
        return await callback();
      } finally {
        this.unlock();
      }
    }
  }