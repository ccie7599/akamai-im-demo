# ---------------------------------------------------------------------------
# Image Manager — Policies for responsive image delivery
# ---------------------------------------------------------------------------

resource "akamai_imaging_policy_set" "im_demo" {
  name        = var.cp_code_name
  region      = "US"
  type        = "IMAGE"
  contract_id = var.contract_id
}

locals {
  im_base_config = {
    breakpoints = { widths = [320, 480, 640, 768, 1024, 1280, 1440, 1920, 2560] }
    output_base = {
      allowedFormats          = ["webp", "avif", "jpeg", "png", "gif"]
      forcedFormats           = []
      preferModernFormats     = true
      allowPristineOnDownsize = true
    }
    transformations = []
  }

  im_quality_policies = {
    low      = "low"
    medium   = "medium"
    high     = "mediumHigh"
    pristine = "high"
  }
}

resource "akamai_imaging_policy_image" "quality" {
  for_each     = local.im_quality_policies
  policy_id    = each.key
  policyset_id = akamai_imaging_policy_set.im_demo.id
  contract_id  = var.contract_id
  activate_on_production = true

  json = jsonencode({
    breakpoints     = local.im_base_config.breakpoints
    output          = merge(local.im_base_config.output_base, { perceptualQuality = each.value })
    transformations = local.im_base_config.transformations
  })
}
