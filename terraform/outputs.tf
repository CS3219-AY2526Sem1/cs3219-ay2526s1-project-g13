output "static_ip" {
  description = "Static IP address for the load balancer"
  value       = google_compute_global_address.lb_ip.address
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "user_service_url" {
  description = "User service URL"
  value       = google_cloud_run_v2_service.user_service.uri
}

output "matching_service_url" {
  description = "Matching service URL"
  value       = google_cloud_run_v2_service.matching_service.uri
}

output "question_service_url" {
  description = "Question service URL"
  value       = google_cloud_run_v2_service.question_service.uri
}

output "collaboration_service_url" {
  description = "Collaboration service URL"
  value       = google_cloud_run_v2_service.collaboration_service.uri
}

output "execution_service_url" {
  description = "Execution service URL"
  value       = google_cloud_run_v2_service.execution_service.uri
}

output "video_call_service_url" {
  description = "Video call service URL"
  value       = google_cloud_run_v2_service.video_call_service.uri
}

output "redis_host" {
  description = "Redis host address"
  value       = google_redis_instance.redis.host
}
