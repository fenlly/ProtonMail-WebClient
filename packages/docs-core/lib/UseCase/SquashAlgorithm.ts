import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocumentUpdate } from '@proton/docs-proto'
import { DecryptedMessage } from '../Models/DecryptedMessage'
import { mergeUpdates } from 'yjs'

export type UpdatePair = {
  encrypted: DocumentUpdate
  decrypted: DecryptedMessage
}

export type SquashResult = {
  unmodifiedUpdates: UpdatePair[]
  updatesAsSquashed: Uint8Array | undefined
}

export class SquashAlgorithm implements UseCaseInterface<SquashResult> {
  async execute(updates: UpdatePair[], config: { limit: number; factor: number }): Promise<Result<SquashResult>> {
    const desiredNumberOfUpdates = Math.floor(config.limit * config.factor)

    const numUpdatesToSquash = updates.length - desiredNumberOfUpdates

    if (numUpdatesToSquash <= 0) {
      return Result.ok({
        updatesAsSquashed: undefined,
        unmodifiedUpdates: updates,
      })
    }

    const updatesToSquash = updates.slice(-numUpdatesToSquash)
    const unmodifiedUpdates = updates.slice(0, updates.length - numUpdatesToSquash)

    const updatesAsSquashed = mergeUpdates(updatesToSquash.map((update) => update.decrypted.content))

    return Result.ok({
      updatesAsSquashed,
      unmodifiedUpdates,
    })
  }
}
