export interface Rule<S> {
  name: string;
  action: (state: S, ...args: any[]) => boolean;
}

export class Ruler<S> {
  private rules: Rule<S>[] = [];

  push(name: string, action: (state: S, ...args: any[]) => boolean) {
    this.rules.push({ name, action });
  }

  // Allow inserting before/after for extensibility
  before(beforeName: string, name: string, action: (state: S, ...args: any[]) => boolean) {
    const idx = this.rules.findIndex(r => r.name === beforeName);
    if (idx === -1) throw new Error(`Rule ${beforeName} not found`);
    this.rules.splice(idx, 0, { name, action });
  }

  after(afterName: string, name: string, action: (state: S, ...args: any[]) => boolean) {
    const idx = this.rules.findIndex(r => r.name === afterName);
    if (idx === -1) throw new Error(`Rule ${afterName} not found`);
    this.rules.splice(idx + 1, 0, { name, action });
  }

  getRules(): Rule<S>[] {
    return this.rules;
  }
}
