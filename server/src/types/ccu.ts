export interface CcuPurgeRequest {
  objects: string[]
}

export interface CcuPurgeResponse {
  httpStatus: number
  detail: string
  estimatedSeconds: number
  purgeId: string
  supportId: string
}

export interface GovernanceAction {
  id: string
  action: "invalidate" | "delete" | "replace"
  urls: string[]
  timestamp: string
  apiResponse: CcuPurgeResponse | null
  latencyMs: number
  status: "pending" | "complete" | "error"
  error?: string
}
