# ---------------------------------------------------------------------------
# Akamai Property — Image Manager Demo
# ---------------------------------------------------------------------------

resource "akamai_property" "im_demo" {
  name        = var.property_name
  product_id  = var.product_id
  contract_id = var.contract_id
  group_id    = var.group_id
  rule_format = "v2025-10-16"

  hostnames {
    cname_from             = var.property_name
    cname_to               = akamai_edge_hostname.im_demo.edge_hostname
    cert_provisioning_type = "DEFAULT"
  }

  rules = data.akamai_property_rules_builder.default_rule.json
}
