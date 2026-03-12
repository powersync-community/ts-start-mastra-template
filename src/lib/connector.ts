import type {
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  AbstractPowerSyncDatabase,
} from '@powersync/web'
import { getPowerSyncCredentials, uploadPowerSyncData } from './server-fns'

export class Connector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    return getPowerSyncCredentials()
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return
    try {
      const operations = transaction.crud.map((op) => ({
        id: op.id,
        op: op.op,
        table: op.table,
        opData: op.opData,
      }))
      const result = await uploadPowerSyncData({ data: { operations } })
      if (!result.success) {
        console.warn('[Connector] Upload had errors:', result.error)
      }
      await transaction.complete()
    } catch (ex) {
      throw ex
    }
  }
}
