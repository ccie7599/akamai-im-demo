import type { GovernanceAction } from "../types/ccu.js"

class GovernanceLog {
  private actions: GovernanceAction[] = []

  add(action: Omit<GovernanceAction, "id">) {
    const entry: GovernanceAction = {
      ...action,
      id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }
    this.actions.push(entry)
    return entry
  }

  getAll(): GovernanceAction[] {
    return [...this.actions]
  }

  clear() {
    this.actions = []
  }
}

export const governanceLog = new GovernanceLog()
