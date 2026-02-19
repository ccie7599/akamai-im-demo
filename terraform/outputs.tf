# ---------------------------------------------------------------------------
# Outputs — values needed for .env and verification
# ---------------------------------------------------------------------------

output "property_id" {
  description = "Akamai property ID"
  value       = akamai_property.im_demo.id
}

output "property_version" {
  description = "Current property version"
  value       = akamai_property.im_demo.latest_version
}

output "edge_hostname" {
  description = "Edge hostname"
  value       = akamai_edge_hostname.im_demo.edge_hostname
}

output "edgeworker_id" {
  description = "EdgeWorker ID — set as AKAMAI_EDGEWORKER_ID in .env"
  value       = akamai_edgeworker.im_demo.edgeworker_id
}

output "cp_code" {
  description = "CP code — set as AKAMAI_CP_CODE in .env"
  value       = "cpc_${akamai_cp_code.im_demo.id}"
}

output "property_hostname" {
  description = "Public hostname"
  value       = var.property_name
}

# output "datastream_id" {
#   description = "DataStream 2 stream ID"
#   value       = akamai_datastream.im_demo.id
# }
