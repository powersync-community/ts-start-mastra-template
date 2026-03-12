import type {
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  AbstractPowerSyncDatabase,
} from '@powersync/web'

export class Connector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    return {
      endpoint: '',
      token: '',
      expiresAt: new Date(Date.now() + 3600_000),
    }
  }

  async uploadData(_database: AbstractPowerSyncDatabase): Promise<void> {
    // No-op: local-only mode, no sync backend
  }
}
