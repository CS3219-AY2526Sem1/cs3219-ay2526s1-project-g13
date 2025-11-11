# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "redis.googleapis.com",
    "pubsub.googleapis.com",
    "artifactregistry.googleapis.com",
    "vpcaccess.googleapis.com",
    "compute.googleapis.com",
  ])

  service            = each.key
  disable_on_destroy = false
}

# Service Account for application
resource "google_service_account" "service_account" {
  account_id   = "peerprep-service-account"
  display_name = "PeerPrep Service Account"
}

# IAM Binding for Service Account to access Secret Manager
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.service_account.email}"
}

# IAM Binding for Service Account to access Pub/Sub
resource "google_project_iam_member" "pubsub_editor" {
  project = var.project_id
  role    = "roles/pubsub.editor"
  member  = "serviceAccount:${google_service_account.service_account.email}"
}

# VPC for private services
resource "google_compute_network" "vpc" {
  name                    = "peerprep-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "subnet" {
  name          = "peerprep-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Serverless VPC Access Connector (for Cloud Run to access Redis)
resource "google_vpc_access_connector" "connector" {
  name          = "peerprep-connector"
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.8.0.0/28"
  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 5

  depends_on = [google_project_service.apis]
}

# Redis (Memorystore)
resource "google_redis_instance" "redis" {
  name           = "peerprep-redis"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  authorized_network = google_compute_network.vpc.id

  redis_version = "REDIS_7_0"
  display_name  = "PeerPrep Redis"

  depends_on = [google_project_service.apis]
}

# Pub/Sub Topics (Kafka replacement)
resource "google_pubsub_topic" "match_topic" {
  name = "match_topic"

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "question_topic" {
  name = "question_topic"

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "room_creation_topic" {
  name = "room_creation_topic"

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "room_created_topic" {
  name = "room_created_topic"

  depends_on = [google_project_service.apis]
}

# Pub/Sub Subscriptions (Kafka replacement)
resource "google_pubsub_subscription" "match_sub" {
  name  = "match_sub"
  topic = google_pubsub_topic.match_topic.name

  ack_deadline_seconds = 20

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "question_sub" {
  name  = "question_sub"
  topic = google_pubsub_topic.question_topic.name

  ack_deadline_seconds = 20

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "room_creation_sub" {
  name  = "room_creation_sub"
  topic = google_pubsub_topic.room_creation_topic.name

  ack_deadline_seconds = 20

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "room_created_sub" {
  name  = "room_created_sub"
  topic = google_pubsub_topic.room_created_topic.name

  ack_deadline_seconds = 20

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "docker-repo"
  description   = "Docker Repository"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# Cloud Run Service - User Service
resource "google_cloud_run_v2_service" "user_service" {
  name                = "user-service"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/user-service:latest"

      ports {
        container_port = 8001
      }

      env {
        name = "MONGO_URI"
        value_source {
          secret_key_ref {
            secret  = "mongodb_uri_user"
            version = "latest"
          }
        }
      }

      env {
        name  = "WEB_BASE_URL"
        value = "https://cs3219-ay2526s1-g13.com"
      }

      env {
        name = "EMAIL_USER"
        value_source {
          secret_key_ref {
            secret  = "email_user"
            version = "latest"
          }
        }
      }

      env {
        name = "EMAIL_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = "email_password"
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt_secret"
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run Service - Question Service
resource "google_cloud_run_v2_service" "question_service" {
  name                = "question-service"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/question-service:latest"

      ports {
        container_port = 8003
      }

      env {
        name = "MONGO_URI"
        value_source {
          secret_key_ref {
            secret  = "mongodb_uri_question"
            version = "latest"
          }
        }
      }

      env {
        name  = "WEB_BASE_URL"
        value = "https://cs3219-ay2526s1-g13.com"
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run Service - Matching Service
resource "google_cloud_run_v2_service" "matching_service" {
  name                = "matching-service"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/matching-service:latest"

      ports {
        container_port = 8002
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.redis.host}:${google_redis_instance.redis.port}"
      }

      env {
        name  = "QUESTION_SERVICE_URL"
        value = google_cloud_run_v2_service.question_service.uri
      }

      env {
        name  = "COLLABORATION_SERVICE_URL"
        value = google_cloud_run_v2_service.collaboration_service.uri
      }

      env {
        name  = "DEBUG_MODE"
        value = "false"
      }
      env {
        name  = "DEBUG_MATCHING"
        value = "false"
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project_id
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt_secret"
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run Service - Collaboration Service
resource "google_cloud_run_v2_service" "collaboration_service" {
  name                = "collaboration-service"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/collaboration-service:latest"

      ports {
        container_port = 8004
      }

      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = "mongodb_uri_collaboration"
            version = "latest"
          }
        }
      }

      env {
        name  = "WEB_BASE_URL"
        value = "https://cs3219-ay2526s1-g13.com"
      }

      env {
        name  = "ROOM_TIMEOUT_MINUTES"
        value = var.room_timeout_minutes
      }

      env {
        name  = "QUESTION_SERVICE_URL"
        value = google_cloud_run_v2_service.question_service.uri
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project_id
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt_secret"
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run Service - Video Call Service
resource "google_cloud_run_v2_service" "video_call_service" {
  name                = "video-call-service"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/video-call-service:latest"

      ports {
        container_port = 8011
      }

      env {
        name = "APP_ID"
        value_source {
          secret_key_ref {
            secret  = "video_call_service_app_id"
            version = "latest"
          }
        }
      }

      env {
        name = "APP_CERTIFICATE"
        value_source {
          secret_key_ref {
            secret  = "video_call_service_app_certificate"
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run Service - Frontend
resource "google_cloud_run_v2_service" "frontend" {
  name                = "frontend"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/frontend:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.apis]
}

# IAM - Allow public access to services
resource "google_cloud_run_service_iam_member" "user_service_public" {
  service  = google_cloud_run_v2_service.user_service.name
  location = google_cloud_run_v2_service.user_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "question_service_public" {
  service  = google_cloud_run_v2_service.question_service.name
  location = google_cloud_run_v2_service.question_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "matching_service_public" {
  service  = google_cloud_run_v2_service.matching_service.name
  location = google_cloud_run_v2_service.matching_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "collaboration_service_public" {
  service  = google_cloud_run_v2_service.collaboration_service.name
  location = google_cloud_run_v2_service.collaboration_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "video_call_service_public" {
  service  = google_cloud_run_v2_service.video_call_service.name
  location = google_cloud_run_v2_service.video_call_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_v2_service.frontend.name
  location = google_cloud_run_v2_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
