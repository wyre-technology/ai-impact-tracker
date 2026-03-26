# ============================================================
# WYRE AI Impact Tracker — Root Module
# ============================================================
# Provisions all infrastructure for the AI Impact Tracker:
#   - FastAPI backend (Container App)
#   - Next.js frontend (Container App)
#   - PostgreSQL Flexible Server
#   - Key Vault, ACR, Managed Identity
#
# Auth: Azure CLI or Service Principal via environment variables
#   ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_TENANT_ID,
#   ARM_SUBSCRIPTION_ID
# ============================================================

# ── Data sources ─────────────────────────────────────────────
data "azurerm_client_config" "current" {}

# ── Locals ───────────────────────────────────────────────────
locals {
  common_tags = {
    managed_by  = "opentofu"
    environment = var.environment
    project     = "ai-impact-tracker"
  }

  db_username = "impactadmin"
  db_name     = "impactdb"
}

# ── Resource Group ───────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = "rg-wyre-ai-impact-${var.environment}"
  location = var.location
  tags     = local.common_tags
}

# ── Azure Container Registry ────────────────────────────────
resource "azurerm_container_registry" "main" {
  name                = "acrwyreaiimpact${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = local.common_tags
}

# ── User-Assigned Managed Identity ───────────────────────────
resource "azurerm_user_assigned_identity" "main" {
  name                = "id-wyre-ai-impact-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.common_tags
}

# Grant managed identity AcrPull on the container registry
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

# ── Key Vault ────────────────────────────────────────────────
resource "azurerm_key_vault" "main" {
  name                       = "kv-wyre-impact-${var.environment}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = local.common_tags
}

# Allow the deploying principal to manage secrets
resource "azurerm_key_vault_access_policy" "deployer" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = ["Get", "List", "Set", "Delete", "Purge"]
}

# Allow managed identity to read secrets
resource "azurerm_key_vault_access_policy" "app_identity" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.main.principal_id

  secret_permissions = ["Get", "List"]
}

# ── Key Vault Secrets ────────────────────────────────────────
resource "azurerm_key_vault_secret" "db_connection_string" {
  name         = "db-connection-string"
  value        = "postgresql://${local.db_username}:${var.db_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${local.db_name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "entra_tenant_id" {
  name         = "entra-tenant-id"
  value        = var.entra_tenant_id
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "entra_client_id" {
  name         = "entra-client-id"
  value        = var.entra_client_id
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

# ── Log Analytics Workspace ──────────────────────────────────
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-wyre-ai-impact-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

# ── Container Apps Environment ───────────────────────────────
resource "azurerm_container_app_environment" "main" {
  name                       = "cae-wyre-ai-impact-${var.environment}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

# ── Container App: impact-api (FastAPI) ──────────────────────
resource "azurerm_container_app" "api" {
  name                         = "impact-api"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.main.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.main.id
  }

  template {
    min_replicas = 0
    max_replicas = 3

    container {
      name   = "impact-api"
      image  = "${azurerm_container_registry.main.login_server}/impact-api:${var.api_image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${local.db_username}:${var.db_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${local.db_name}?sslmode=require"
      }

      env {
        name  = "ENTRA_TENANT_ID"
        value = var.entra_tenant_id
      }

      env {
        name  = "ENTRA_CLIENT_ID"
        value = var.entra_client_id
      }

      env {
        name  = "DEFAULT_HOURLY_RATE"
        value = tostring(var.default_hourly_rate)
      }

      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.main.client_id
      }

      env {
        name  = "KEY_VAULT_URL"
        value = azurerm_key_vault.main.vault_uri
      }
    }
  }

  ingress {
    external_enabled = false
    target_port      = 8000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

# ── Container App: impact-web (Next.js) ─────────────────────
resource "azurerm_container_app" "web" {
  name                         = "impact-web"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.main.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.main.id
  }

  template {
    min_replicas = 0
    max_replicas = 3

    container {
      name   = "impact-web"
      image  = "${azurerm_container_registry.main.login_server}/impact-web:${var.web_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
      }

      env {
        name  = "NEXTAUTH_URL"
        value = "https://${azurerm_container_app.web.name}.${azurerm_container_app_environment.main.default_domain}"
      }

      env {
        name  = "ENTRA_TENANT_ID"
        value = var.entra_tenant_id
      }

      env {
        name  = "ENTRA_CLIENT_ID"
        value = var.entra_client_id
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

# ── Azure Database for PostgreSQL Flexible Server ────────────
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-wyre-ai-impact-${var.environment}"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "15"
  administrator_login           = local.db_username
  administrator_password        = var.db_password
  storage_mb                    = 32768
  sku_name                      = "B_Standard_B1ms"
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = true
  tags                          = local.common_tags

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }
}

# Allow Azure services to connect (Container Apps)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Create the application database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = local.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
