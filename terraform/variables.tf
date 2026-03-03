# ---------------------------------------------------------------------------
# Variables — Image Manager Demo
# ---------------------------------------------------------------------------

variable "contract_id" {
  description = "Akamai contract ID (e.g. ctr_M-1234567)"
  type        = string
}

variable "group_id" {
  description = "Akamai group ID (e.g. grp_123456)"
  type        = string
}

variable "product_id" {
  description = "Akamai product ID (Ion Premier)"
  type        = string
  default     = "prd_SPM"
}

variable "property_name" {
  description = "Property hostname — should match cname_from (e.g. demo.example.com)"
  type        = string
  default     = "demo.example.com"
}

variable "origin_hostname" {
  description = "Origin server hostname (e.g. origin-demo.example.com)"
  type        = string
  default     = "origin-demo.example.com"
}

variable "edge_hostname" {
  description = "Akamai edge hostname (e.g. demo.example.com.edgesuite.net)"
  type        = string
  default     = "demo.example.com.edgesuite.net"
}

variable "cp_code_name" {
  description = "CP code display name"
  type        = string
  default     = "IM Demo"
}

variable "dns_zone" {
  description = "Edge DNS zone (e.g. example.com)"
  type        = string
  default     = "example.com"
}

variable "dns_hostname_prefix" {
  description = "Hostname prefix for DNS records (e.g. 'demo' creates demo.example.com)"
  type        = string
  default     = "demo"
}

variable "notification_emails" {
  description = "Email addresses for activation notifications"
  type        = list(string)
}

variable "ds2_webhook_username" {
  description = "DataStream 2 webhook Basic Auth username"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ds2_webhook_password" {
  description = "DataStream 2 webhook Basic Auth password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ds2_stream_id" {
  description = "DataStream 2 stream ID (required if DataStream resource is enabled)"
  type        = number
  default     = 0
}

variable "edgeworker_bundle_path" {
  description = "Path to EdgeWorker .tgz bundle"
  type        = string
  default     = "../edgeworker/edgeworker-bundle.tgz"
}

variable "edgeworker_resource_tier_id" {
  description = "EdgeWorker resource tier (200 = Dynamic Compute)"
  type        = number
  default     = 200
}

variable "origin_ip" {
  description = "Origin server IP address for DNS A record"
  type        = string
}

variable "origin_basic_auth_b64" {
  description = "Base64-encoded origin Basic Auth credentials (e.g. base64('user:pass'))"
  type        = string
  sensitive   = true
}

variable "site_basic_auth_b64" {
  description = "Base64-encoded site Basic Auth credentials for edge authentication (e.g. base64('user:pass'))"
  type        = string
  sensitive   = true
}

variable "debug_key" {
  description = "64-character hex string for Akamai Enhanced Debug header (Pragma: akamai-x-get-cache-key, ...)"
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-fA-F]{64}$", var.debug_key))
    error_message = "debug_key must be a 64-character hexadecimal string."
  }
}
