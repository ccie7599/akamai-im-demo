export interface DS2LogEntry {
  reqId?: string
  reqTimeSec?: number
  cliIP?: string
  statusCode?: number
  bytes?: number
  totalBytes?: number
  cacheStatus?: number
  cacheable?: number
  country?: string
  city?: string
  state?: string
  edgeIP?: string
  serverCountry?: string
  reqHost?: string
  reqMethod?: string
  reqPath?: string
  queryStr?: string
  rspContentType?: string
  rspContentLen?: number
  proto?: string
  tlsVersion?: string
  turnAroundTimeMSec?: number
  transferTimeMSec?: number
  timeToFirstByte?: number
  dnsLookupTimeMSec?: number
  UA?: string
  referer?: string
  ewUsageInfo?: string
  ewExecutionInfo?: string
  billingRegion?: string
  cp?: string
  [key: string]: unknown
}
