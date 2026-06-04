# Kasm Workspaces API Permissions Reference Guide

This document lists the required permissions for the Kasm API Key used by the KDS Control Plane Appliance to perform its infrastructure orchestration and workspace deployment workflows.

---

## 1. Connection Verification Results
* **Status:** Verified & Working ✅
* **Target Endpoint:** `https://myworkspace.workoverip.com`
* **API Key ID:** `vG0YqjreUmwr`
* **Test Outcome:** Successfully verified connection through the `get_zones` API endpoint, receiving the zone configuration and status metrics payload.

---

## 2. API Key Permission Matrix by Workflow

To execute the appliance workflows successfully, the configured Kasm API key must be granted the following granular permissions in the Kasm Workspaces Admin Console (under **Developers** -> **API Keys**).

### Workflow A: Standalone Server Orchestration
Manages individual compute instances.
| Endpoint Method / Action | Target Resource | Required Kasm Permission |
| :--- | :--- | :--- |
| `get_servers` | `/api/public/get_servers` | `servers:read` or `view_servers` |
| `create_server` | `/api/public/create_server` | `servers:write` or `create_servers` |
| `update_server` | `/api/public/update_server` | `servers:write` or `edit_servers` |
| `delete_server` | `/api/public/delete_server` | `servers:write` or `delete_servers` |

### Workflow B & C: Autoscaling & Server Pools
Deploys and manages dynamic clusters of hypervisor-driven hosts.
| Endpoint Method / Action | Target Resource | Required Kasm Permission |
| :--- | :--- | :--- |
| `get_zones` | `/api/public/get_zones` | `zones:read` or `view_zones` |
| `get_server_pools` | `/api/public/get_server_pools` | `server_pools:read` or `view_server_pools` |
| `create_server_pool` | `/api/public/create_server_pool` | `server_pools:write` or `create_server_pools` |
| `update_server_pool` | `/api/public/update_server_pool` | `server_pools:write` or `edit_server_pools` |
| `get_autoscale_configs` | `/api/public/get_autoscale_configs` | `autoscale:read` or `view_autoscale` |
| `create_autoscale_config` | `/api/public/create_autoscale_config` | `autoscale:write` or `create_autoscale` |
| `update_autoscale_config` | `/api/public/update_autoscale_config` | `autoscale:write` or `edit_autoscale` |
| `get_vm_provider_configs` | `/api/public/get_vm_provider_configs` | `vm_providers:read` or `view_vm_providers` |

### Workflow D: Workspace Provisioning & Storage Mapping
Registers the final user-facing workspace definitions.
| Endpoint Method / Action | Target Resource | Required Kasm Permission |
| :--- | :--- | :--- |
| `get_workspaces` | `/api/public/get_workspaces` | `workspaces:read` or `view_workspaces` |
| `create_workspace` | `/api/public/create_workspace` | `workspaces:write` or `create_workspaces` |
| `get_storage_providers` | `/api/public/get_storage_providers` | `storage_providers:read` or `view_storage_providers` |
| `create_storage_mapping` | `/api/public/create_storage_mapping` | `storage_mappings:write` or `create_storage_mappings` |
| `get_ldap_configs` | `/api/public/get_ldap_configs` | `ldap:read` or `view_ldap` |

---

## 3. Best Practices for API Key Security
1. **Scope to Zones:** If supported by the deployment architecture, limit the API key's scope to the specific zone containing the Windows virtualization templates (e.g. `default`).
2. **Restrict IP Address:** Restrict the API key usage to the IP address of the KDS Control Plane Appliance server to prevent compromised credentials from being used externally.
3. **Appliance Master Key:** Ensure the `APPLIANCE_MASTER_KEY` environment variable on the KDS Control Plane Appliance is set to a secure, random 32-character string. This key is used to encrypt the Kasm API key secret at rest in the local sqlite database.
