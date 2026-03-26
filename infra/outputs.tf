# ============================================================
# WYRE AI Impact Tracker — Outputs
# ============================================================

output "api_url" {
  description = "Impact API internal URL"
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "web_url" {
  description = "Impact Dashboard public URL"
  value       = "https://${azurerm_container_app.web.ingress[0].fqdn}"
}

output "database_host" {
  description = "PostgreSQL Flexible Server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "acr_login_server" {
  description = "ACR login server for docker push"
  value       = azurerm_container_registry.main.login_server
}

output "key_vault_name" {
  description = "Key Vault name for secret management"
  value       = azurerm_key_vault.main.name
}

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}
