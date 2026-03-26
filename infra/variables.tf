# ============================================================
# WYRE AI Impact Tracker — Variables
# ============================================================

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus2"
}

variable "environment" {
  description = "Deployment environment (prod, staging, dev)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "environment must be prod, staging, or dev."
  }
}

variable "entra_tenant_id" {
  description = "Microsoft Entra ID tenant ID for authentication"
  type        = string
}

variable "entra_client_id" {
  description = "Microsoft Entra ID app registration client ID"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "default_hourly_rate" {
  description = "Default hourly rate for dollar value calculations"
  type        = number
  default     = 225
}

variable "api_image_tag" {
  description = "Docker image tag for the impact-api container"
  type        = string
  default     = "latest"
}

variable "web_image_tag" {
  description = "Docker image tag for the impact-web container"
  type        = string
  default     = "latest"
}
