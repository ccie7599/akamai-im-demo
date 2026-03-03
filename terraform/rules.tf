# ---------------------------------------------------------------------------
# Property Rules — akamai_property_rules_builder (HCL-native)
# Ion Standard baseline with Image Manager, EdgeWorkers, and API pass-through
# ---------------------------------------------------------------------------

# ===== DEFAULT RULE (ROOT) =====
data "akamai_property_rules_builder" "default_rule" {
  rules_v2025_10_16 {
    name      = "default"
    is_secure = false
    comments  = "IM Demo — Ion Standard with Image Manager, EdgeWorkers, Origin IP ACL"

    # --- Origin Server ---
    behavior {
      origin {
        origin_type                = "CUSTOMER"
        hostname                   = var.origin_hostname
        forward_host_header        = "ORIGIN_HOSTNAME"
        cache_key_hostname         = "REQUEST_HOST_HEADER"
        compress                   = true
        enable_true_client_ip      = true
        true_client_ip_header      = "True-Client-IP"
        true_client_ip_client_setting = false
        http_port                  = 80
        https_port                 = 443
        origin_sni                 = true
        http2_enabled              = true
        verification_mode          = "PLATFORM_SETTINGS"
        ip_version                 = "IPV4"
        min_tls_version            = "DYNAMIC"
        max_tls_version            = "DYNAMIC"
      }
    }

    # --- CP Code ---
    behavior {
      cp_code {
        value {
          id          = akamai_cp_code.im_demo.id
          name        = akamai_cp_code.im_demo.name
          products    = [var.product_id]
        }
      }
    }

    # --- Origin IP ACL (enables Linode firewall to Akamai-only) ---
    behavior {
      origin_ip_acl {
        enable = true
      }
    }

    # --- Default caching: NO_STORE (child rules override) ---
    behavior {
      caching {
        behavior = "NO_STORE"
      }
    }

    # --- Enhanced Debug ---
    behavior {
      enhanced_debug {
        enable_debug  = true
        debug_key     = var.debug_key
        disable_pragma = false
        generate_grn  = true
      }
    }

    # --- Allow HTTP Methods for API ---
    behavior {
      allow_post {
        enabled                      = true
        allow_without_content_length = false
      }
    }

    behavior {
      allow_put {
        enabled = true
      }
    }

    behavior {
      allow_delete {
        enabled = true
      }
    }

    behavior {
      allow_patch {
        enabled = true
      }
    }

    behavior {
      allow_options {
        enabled = true
      }
    }

    # --- Cache Key ---
    behavior {
      cache_key_query_params {
        behavior = "INCLUDE_ALL_ALPHABETIZE_ORDER"
      }
    }

    # --- Downstream Cache ---
    behavior {
      downstream_cache {
        behavior     = "ALLOW"
        allow_behavior = "LESSER"
        send_headers = "CACHE_CONTROL"
        send_private = false
      }
    }

    # --- Via Header ---
    behavior {
      modify_via_header {
        enabled             = true
        modification_option = "REMOVE_HEADER"
      }
    }

    children = [
      data.akamai_property_rules_builder.site_auth.json,
      data.akamai_property_rules_builder.augment_insights.json,
      data.akamai_property_rules_builder.accelerate_delivery.json,
      data.akamai_property_rules_builder.offload_origin.json,
      data.akamai_property_rules_builder.minimize_payload.json,
      data.akamai_property_rules_builder.images.json,
      data.akamai_property_rules_builder.api_passthrough.json,
    ]
  }
}

# ===== SITE AUTHENTICATION (HTTP Basic Auth at edge) =====
data "akamai_property_rules_builder" "site_auth" {
  rules_v2025_10_16 {
    name     = "Site authentication"
    comments = "HTTP Basic Auth — deny requests without valid credentials"

    criterion {
      request_header {
        header_name          = "Authorization"
        match_operator       = "IS_NOT_ONE_OF"
        values               = ["Basic ${var.site_basic_auth_b64}"]
        match_wildcard_name  = false
        match_wildcard_value = false
      }
    }

    behavior {
      construct_response {
        enabled       = true
        response_code = 401
        body          = "Unauthorized"
        force_eviction = false
      }
    }

    behavior {
      modify_outgoing_response_header {
        action                   = "ADD"
        standard_add_header_name = "OTHER"
        custom_header_name       = "WWW-Authenticate"
        header_value             = "Basic realm=\"Presales Demo\""
        avoid_duplicate_headers  = true
      }
    }
  }
}

# ===== AUGMENT INSIGHTS =====
data "akamai_property_rules_builder" "augment_insights" {
  rules_v2025_10_16 {
    name     = "Augment insights"
    comments = "Monitoring and reporting"

    children = [
      data.akamai_property_rules_builder.traffic_reporting.json,
      data.akamai_property_rules_builder.log_delivery.json,
    ]
  }
}

data "akamai_property_rules_builder" "traffic_reporting" {
  rules_v2025_10_16 {
    name     = "Traffic reporting"
    comments = "CP code for traffic attribution"

    behavior {
      cp_code {
        value {
          id       = akamai_cp_code.im_demo.id
          name     = akamai_cp_code.im_demo.name
          products = [var.product_id]
        }
      }
    }
  }
}

data "akamai_property_rules_builder" "log_delivery" {
  rules_v2025_10_16 {
    name     = "Log delivery"
    comments = "Log Delivery Service configuration"

    behavior {
      report {
        log_host            = false
        log_referer         = false
        log_user_agent      = true
        log_accept_language = false
        log_cookies         = "OFF"
        log_custom_log_field = false
        log_edge_ip         = false
        log_x_forwarded_for = false
      }
    }

    behavior {
      datastream {
        enabled          = true
        stream_type      = "LOG"
        log_enabled      = true
        log_stream_name  = [tostring(var.ds2_stream_id)]
        log_stream_title = "im-demo-ds2"
        datastream_ids   = tostring(var.ds2_stream_id)
      }
    }
  }
}

# ===== ACCELERATE DELIVERY =====
data "akamai_property_rules_builder" "accelerate_delivery" {
  rules_v2025_10_16 {
    name     = "Accelerate delivery"
    comments = "Performance optimizations"

    children = [
      data.akamai_property_rules_builder.origin_connectivity.json,
      data.akamai_property_rules_builder.protocol_optimizations.json,
      data.akamai_property_rules_builder.adaptive_accel.json,
    ]
  }
}

data "akamai_property_rules_builder" "origin_connectivity" {
  rules_v2025_10_16 {
    name     = "Origin connectivity"
    comments = "DNS async refresh for origin"

    behavior {
      dns_async_refresh {
        enabled = true
        timeout = "1h"
      }
    }
  }
}

data "akamai_property_rules_builder" "protocol_optimizations" {
  rules_v2025_10_16 {
    name     = "Protocol optimizations"
    comments = "HTTP/2, HTTP/3, HTTPS, SureRoute"

    behavior {
      enhanced_akamai_protocol {}
    }

    behavior {
      http2 {}
    }

    behavior {
      http3 {
        enable = true
      }
    }

    behavior {
      allow_transfer_encoding {
        enabled = true
      }
    }

    behavior {
      sure_route {
        enabled           = true
        type              = "PERFORMANCE"
        test_object_url   = "/akamai/sureroute-test-object.html"
        to_host_status    = "INCOMING_HH"
        race_stat_ttl     = "30m"
        force_ssl_forward = false
        enable_custom_key = false
      }
    }
  }
}

data "akamai_property_rules_builder" "adaptive_accel" {
  rules_v2025_10_16 {
    name     = "Adaptive acceleration"
    comments = "Machine learning performance optimizations"

    behavior {
      adaptive_acceleration {
        source                    = "MPULSE"
        enable_brotli_compression = true
        enable_for_noncacheable   = false
        enable_preconnect         = false
        enable_push               = false
        enable_ro                 = false
        preload_enable            = false
      }
    }
  }
}

# ===== OFFLOAD ORIGIN =====
data "akamai_property_rules_builder" "offload_origin" {
  rules_v2025_10_16 {
    name     = "Offload origin"
    comments = "Caching and offload controls"

    behavior {
      caching {
        behavior = "NO_STORE"
      }
    }

    behavior {
      tiered_distribution {
        enabled = true
      }
    }

    behavior {
      validate_entity_tag {
        enabled = false
      }
    }

    behavior {
      remove_vary {
        enabled = false
      }
    }

    behavior {
      cache_error {
        enabled        = true
        preserve_stale = true
        ttl            = "10s"
      }
    }

    behavior {
      cache_key_query_params {
        behavior = "INCLUDE_ALL_ALPHABETIZE_ORDER"
      }
    }

    behavior {
      prefresh_cache {
        enabled     = true
        prefreshval = 90
      }
    }

    children = [
      data.akamai_property_rules_builder.css_js.json,
      data.akamai_property_rules_builder.fonts.json,
      data.akamai_property_rules_builder.static_images.json,
      data.akamai_property_rules_builder.html_pages.json,
      data.akamai_property_rules_builder.uncacheable.json,
    ]
  }
}

data "akamai_property_rules_builder" "css_js" {
  rules_v2025_10_16 {
    name     = "CSS and JavaScript"
    comments = "7-day cache for static assets"

    criterion {
      file_extension {
        match_operator       = "IS_ONE_OF"
        match_case_sensitive = false
        values               = ["css", "js"]
      }
    }

    behavior {
      caching {
        behavior        = "MAX_AGE"
        must_revalidate = false
        ttl             = "7d"
      }
    }
  }
}

data "akamai_property_rules_builder" "fonts" {
  rules_v2025_10_16 {
    name     = "Fonts"
    comments = "30-day cache for fonts"

    criterion {
      file_extension {
        match_operator       = "IS_ONE_OF"
        match_case_sensitive = false
        values               = ["eot", "woff", "woff2", "otf", "ttf"]
      }
    }

    behavior {
      caching {
        behavior        = "MAX_AGE"
        must_revalidate = false
        ttl             = "30d"
      }
    }
  }
}

data "akamai_property_rules_builder" "static_images" {
  rules_v2025_10_16 {
    name     = "Images"
    comments = "30-day cache for static images (file extension match)"

    criterion {
      file_extension {
        match_operator       = "IS_ONE_OF"
        match_case_sensitive = false
        values               = ["jpg", "jpeg", "png", "gif", "webp", "jp2", "ico", "svg", "svgz"]
      }
    }

    behavior {
      caching {
        behavior        = "MAX_AGE"
        must_revalidate = false
        ttl             = "30d"
      }
    }
  }
}

data "akamai_property_rules_builder" "html_pages" {
  rules_v2025_10_16 {
    name     = "HTML pages"
    comments = "No-store for dynamic pages"

    criterion {
      file_extension {
        match_operator       = "IS_ONE_OF"
        match_case_sensitive = false
        values               = ["html", "htm", "php", "jsp", "aspx", "EMPTY_STRING"]
      }
    }

    behavior {
      caching {
        behavior = "NO_STORE"
      }
    }

    behavior {
      cache_key_query_params {
        behavior    = "IGNORE"
        exact_match = true
        parameters  = ["gclid", "fbclid", "utm_source", "utm_campaign", "utm_medium", "utm_content"]
      }
    }
  }
}

data "akamai_property_rules_builder" "uncacheable" {
  rules_v2025_10_16 {
    name     = "Uncacheable objects"
    comments = "Bust downstream cache for uncacheable content"

    criterion {
      cacheability {
        match_operator = "IS_NOT"
        value          = "CACHEABLE"
      }
    }

    behavior {
      downstream_cache {
        behavior = "BUST"
      }
    }
  }
}

# ===== MINIMIZE PAYLOAD =====
data "akamai_property_rules_builder" "minimize_payload" {
  rules_v2025_10_16 {
    name     = "Minimize payload"
    comments = "Compression"

    children = [
      data.akamai_property_rules_builder.compressible.json,
    ]
  }
}

data "akamai_property_rules_builder" "compressible" {
  rules_v2025_10_16 {
    name     = "Compressible objects"
    comments = "gzip for text-based content"

    criterion {
      content_type {
        match_operator       = "IS_ONE_OF"
        match_wildcard       = true
        match_case_sensitive = false
        values = [
          "application/*javascript*",
          "application/*json*",
          "application/*xml*",
          "application/text*",
          "application/vnd-ms-fontobject",
          "application/vnd.microsoft.icon",
          "application/x-font-opentype",
          "application/x-font-truetype",
          "application/x-font-ttf",
          "application/xml*",
          "font/eot*",
          "font/eot",
          "font/opentype",
          "font/otf",
          "image/svg+xml",
          "image/vnd.microsoft.icon",
          "image/x-icon",
          "text/*",
        ]
      }
    }

    behavior {
      gzip_response {
        behavior = "ALWAYS"
      }
    }
  }
}

# ===== IMAGE OPTIMIZATION (/images/*) =====
data "akamai_property_rules_builder" "images" {
  rules_v2025_10_16 {
    name     = "Image Manager — Product Images"
    comments = "Image Manager + EdgeWorker on /images/* path. 30-day edge cache."

    criterion {
      path {
        match_operator       = "MATCHES_ONE_OF"
        match_case_sensitive = false
        normalize            = false
        values               = ["/images/*"]
      }
    }

    criterion {
      file_extension {
        match_operator       = "IS_ONE_OF"
        match_case_sensitive = false
        values               = ["jpg", "jpeg", "png", "gif", "webp", "jp2", "ico", "svg", "svgz"]
      }
    }

    # Origin protected by Origin IP ACL + site basic auth at edge.
    # No need for separate origin basic auth headers — removed to
    # avoid interfering with requestHeader criterion in site_auth rule.

    behavior {
      caching {
        behavior        = "MAX_AGE"
        must_revalidate = false
        ttl             = "30d"
      }
    }

    # Include Accept header in cache key so IM format negotiation
    # produces separate cached variants per client capability
    behavior {
      cache_id {
        rule          = "INCLUDE_HEADERS"
        elements      = ["Accept"]
        include_value = true
        optional      = true
      }
    }

    behavior {
      image_manager {
        enabled              = true
        resize               = true
        apply_best_file_type = true
        super_cache_region   = "US"
        advanced             = false
        policy_token_default = "responsive"

        cp_code_original {
          id   = akamai_cp_code.im_demo.id
          name = akamai_cp_code.im_demo.name
        }

        cp_code_transformed {
          id   = akamai_cp_code.im_demo.id
          name = akamai_cp_code.im_demo.name
        }
      }
    }

    behavior {
      edge_worker {
        enabled        = true
        edge_worker_id = akamai_edgeworker.im_demo.edgeworker_id
      }
    }
  }
}

# ===== API PASS-THROUGH (/api/*, /socket.io/*) =====
data "akamai_property_rules_builder" "api_passthrough" {
  rules_v2025_10_16 {
    name     = "API and WebSocket pass-through"
    comments = "No caching for API endpoints and Socket.IO WebSocket connections."

    criterion {
      path {
        match_operator       = "MATCHES_ONE_OF"
        match_case_sensitive = false
        normalize            = false
        values               = ["/api/*", "/socket.io/*"]
      }
    }

    # Origin protected by Origin IP ACL + site basic auth at edge.

    behavior {
      caching {
        behavior = "NO_STORE"
      }
    }

    behavior {
      downstream_cache {
        behavior = "BUST"
      }
    }

    behavior {
      web_sockets {
        enabled = true
      }
    }
  }
}
