# Edge Hostname

resource "akamai_edge_hostname" "im_demo" {
  product_id    = var.product_id
  contract_id   = var.contract_id
  group_id      = var.group_id
  edge_hostname = var.edge_hostname
  ip_behavior   = "IPV6_COMPLIANCE"
}
