# CP Code — Image Manager demo property

resource "akamai_cp_code" "im_demo" {
  name        = var.cp_code_name
  contract_id = var.contract_id
  group_id    = var.group_id
  product_id  = var.product_id
}
