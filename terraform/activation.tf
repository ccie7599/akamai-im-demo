# ---------------------------------------------------------------------------
# Property Activation — Staging then Production
# ---------------------------------------------------------------------------

resource "akamai_property_activation" "staging" {
  property_id                    = akamai_property.im_demo.id
  contact                        = var.notification_emails
  version                        = akamai_property.im_demo.latest_version
  network                        = "STAGING"
  note                           = "IM Demo — Terraform managed"
  auto_acknowledge_rule_warnings = true
}

resource "akamai_property_activation" "production" {
  property_id                    = akamai_property.im_demo.id
  contact                        = var.notification_emails
  version                        = akamai_property.im_demo.latest_version
  network                        = "PRODUCTION"
  note                           = "IM Demo — Terraform managed"
  auto_acknowledge_rule_warnings = true

  compliance_record {
    noncompliance_reason_no_production_traffic {}
  }

  depends_on = [akamai_property_activation.staging]
}
