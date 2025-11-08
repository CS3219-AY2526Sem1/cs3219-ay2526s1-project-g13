# Reserve a global static IP address for the load balancer
resource "google_compute_global_address" "lb_ip" {
  name = "peerprep-lb-ip"
}

# Create Serverless Network Endpoint Groups (NEGs) for each Cloud Run service
resource "google_compute_region_network_endpoint_group" "user_service_neg" {
  name                  = "user-service-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.user_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "question_service_neg" {
  name                  = "question-service-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.question_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "matching_service_neg" {
  name                  = "matching-service-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.matching_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "collab_service_neg" {
  name                  = "collab-service-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.collaboration_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "frontend_neg" {
  name                  = "frontend-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.frontend.name
  }
}

# Create Backend Services for each NEG
resource "google_compute_backend_service" "user_service_backend" {
  name                  = "user-service-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.user_service_neg.id
  }
}

resource "google_compute_backend_service" "question_service_backend" {
  name                  = "question-service-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.question_service_neg.id
  }
}

resource "google_compute_backend_service" "matching_service_backend" {
  name                  = "matching-service-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.matching_service_neg.id
  }
}

resource "google_compute_backend_service" "collab_service_backend" {
  name                  = "collab-service-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.collab_service_neg.id
  }
}

resource "google_compute_backend_service" "frontend_backend" {
  name                  = "frontend-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.frontend_neg.id
  }
}


# Create URL Map to route traffic based on paths
resource "google_compute_url_map" "api_url_map" {
  name = "peerprep-api-url-map"
  # Route all root traffic to the frontend
  default_service = google_compute_backend_service.frontend_backend.id

  host_rule {
    hosts        = ["cs3219-ay2526s1-g13.com"]
    path_matcher = "api-paths"
  }

  path_matcher {
    name = "api-paths"
    # Route all root traffic to the frontend
    default_service = google_compute_backend_service.frontend_backend.id

    # Custom route rules for each API service
    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/api/user/"
      }
      service = google_compute_backend_service.user_service_backend.id
      route_action {
        url_rewrite {
          path_prefix_rewrite = "/"
        }
      }
    }

    route_rules {
      priority = 2
      match_rules {
        prefix_match = "/api/question/"
      }
      service = google_compute_backend_service.question_service_backend.id
      route_action {
        url_rewrite {
          path_prefix_rewrite = "/"
        }
      }
    }
    
    route_rules {
      priority = 3
      match_rules {
        prefix_match = "/api/matching/"
      }
      service = google_compute_backend_service.matching_service_backend.id
      route_action {
        url_rewrite {
          path_prefix_rewrite = "/"
        }
      }
    }
    
    route_rules {
      priority = 4
      match_rules {
        prefix_match = "/api/collaboration/"
      }
      service = google_compute_backend_service.collab_service_backend.id
      route_action {
        url_rewrite {
          path_prefix_rewrite = "/"
        }
      }
    }
  }
}

# Create a Google-managed SSL certificate
resource "google_compute_managed_ssl_certificate" "api_ssl" {
  name = "peerprep-ssl-cert"
  managed {
    domains = ["cs3219-ay2526s1-g13.com"]
  }
}

# Create the HTTPS proxy
resource "google_compute_target_https_proxy" "api_proxy" {
  name             = "peerprep-https-proxy"
  url_map          = google_compute_url_map.api_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.api_ssl.id]
}

# Create the Global Forwarding Rule (Connects the IP to the proxy)
resource "google_compute_global_forwarding_rule" "api_forwarding_rule" {
  name        = "peerprep-forwarding-rule"
  ip_protocol = "TCP"
  port_range  = "443"
  ip_address  = google_compute_global_address.lb_ip.address
  target      = google_compute_target_https_proxy.api_proxy.id
}
