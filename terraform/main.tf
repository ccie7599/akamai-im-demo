terraform {
  required_version = ">= 1.5.0"
  required_providers {
    akamai = {
      source  = "akamai/akamai"
      version = ">= 6.0.0"
    }
  }
}

provider "akamai" {
  edgerc         = "~/.edgerc"
  config_section = "default"
}

# ---------------------------------------------------------------------------
# Data Sources (optional — uncomment if you need to look up IDs by name)
# ---------------------------------------------------------------------------

# data "akamai_group" "main" {
#   group_name  = "Your Group Name"
#   contract_id = var.contract_id
# }
#
# data "akamai_contract" "main" {
#   group_name = "Your Group Name"
# }
