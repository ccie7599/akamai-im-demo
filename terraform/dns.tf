# ---------------------------------------------------------------------------
# Edge DNS — CNAME for property hostname
# ---------------------------------------------------------------------------

resource "akamai_dns_record" "im_demo" {
  zone       = var.dns_zone
  name       = "${var.dns_hostname_prefix}.${var.dns_zone}"
  recordtype = "CNAME"
  ttl        = 300
  target     = [akamai_edge_hostname.im_demo.edge_hostname]
}

# Origin A record
resource "akamai_dns_record" "origin" {
  zone       = var.dns_zone
  name       = "origin-${var.dns_hostname_prefix}.${var.dns_zone}"
  recordtype = "A"
  ttl        = 300
  target     = [var.origin_ip]
}

# CPS DV ACME challenge — CNAME to Akamai validation infrastructure
resource "akamai_dns_record" "cps_challenge" {
  zone       = var.dns_zone
  name       = "_acme-challenge.${var.dns_hostname_prefix}.${var.dns_zone}"
  recordtype = "CNAME"
  ttl        = 60
  target     = ["${var.dns_hostname_prefix}.${var.dns_zone}.validate-akdv.net."]
}
