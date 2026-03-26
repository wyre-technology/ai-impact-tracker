# ============================================================
# WYRE AI Impact Tracker — Provider Configuration
# ============================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "registry.opentofu.org/hashicorp/azurerm"
      version = "~> 3.95"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-wyre-platform-state"
    storage_account_name = "stwyretofu"
    container_name       = "tofu-state"
    key                  = "ai-impact-tracker.tfstate"
    subscription_id      = "d1fd92e8-6084-4dae-83dd-6a9a705f4a1d"
  }
}

provider "azurerm" {
  subscription_id = "d1fd92e8-6084-4dae-83dd-6a9a705f4a1d"

  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
  }
}
