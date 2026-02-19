# ---------------------------------------------------------------------------
# DataStream 2 — Real-time log delivery to origin webhook
# TEMPORARILY DISABLED — DS2 provisioning timed out, will retry later
# ---------------------------------------------------------------------------

# resource "akamai_datastream" "im_demo" {
#   active      = true
#   stream_name = "im-demo-ds2"
#   contract_id = var.contract_id
#   group_id    = var.group_id
#   properties  = [akamai_property.im_demo.id]
#
#   dataset_fields = [1002, 1005, 1013, 1015, 1016, 1017, 1102, 2010, 2012, 2014, 3000]
#
#   delivery_configuration {
#     format = "JSON"
#     frequency {
#       interval_in_secs = 30
#     }
#   }
#
#   https_connector {
#     display_name        = "im-demo-origin-webhook"
#     endpoint            = "https://origin-${var.dns_hostname_prefix}.${var.dns_zone}/api/ds2/webhook"
#     authentication_type = "BASIC"
#     user_name           = var.ds2_webhook_username
#     password            = var.ds2_webhook_password
#     content_type        = "application/json"
#     compress_logs       = false
#   }
#
#   notification_emails = var.notification_emails
#
#   depends_on = [akamai_property_activation.staging]
# }
