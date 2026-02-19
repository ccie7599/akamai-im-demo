# ---------------------------------------------------------------------------
# EdgeWorker — Image Manager companion logic
# ---------------------------------------------------------------------------

resource "akamai_edgeworker" "im_demo" {
  name             = "im-demo-edgeworker"
  group_id         = var.group_id
  resource_tier_id = var.edgeworker_resource_tier_id
  local_bundle     = var.edgeworker_bundle_path
}

resource "akamai_edgeworkers_activation" "staging" {
  edgeworker_id = akamai_edgeworker.im_demo.edgeworker_id
  network       = "STAGING"
  version       = akamai_edgeworker.im_demo.version
}

resource "akamai_edgeworkers_activation" "production" {
  edgeworker_id = akamai_edgeworker.im_demo.edgeworker_id
  network       = "PRODUCTION"
  version       = akamai_edgeworker.im_demo.version

  depends_on = [akamai_edgeworkers_activation.staging]
}
