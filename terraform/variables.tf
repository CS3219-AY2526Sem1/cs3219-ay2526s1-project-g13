variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "room_timeout_minutes" {
  description = "Collaboration service room timeout in minutes"
  type        = number
  default     = 10
}

variable "piston_api_url" {
  description = "Piston API URL (e.g., http://VM_EXTERNAL_IP:2000/api/v2/execute)"
  type        = string
  default     = "http://34.126.108.247:2000/api/v2/execute"
}
