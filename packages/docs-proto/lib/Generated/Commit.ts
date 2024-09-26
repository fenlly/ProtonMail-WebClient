/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 5.28.0
 * source: Commit.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as dependency_1 from './DocumentUpdate'
import * as pb_1 from 'google-protobuf'
export class Commit extends pb_1.Message {
  #one_of_decls: number[][] = []
  constructor(
    data?:
      | any[]
      | {
          updates?: dependency_1.DocumentUpdateArray
          version?: number
          lockId?: string
        },
  ) {
    super()
    pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls)
    if (!Array.isArray(data) && typeof data == 'object') {
      if ('updates' in data && data.updates != undefined) {
        this.updates = data.updates
      }
      if ('version' in data && data.version != undefined) {
        this.version = data.version
      }
      if ('lockId' in data && data.lockId != undefined) {
        this.lockId = data.lockId
      }
    }
  }
  get updates() {
    return pb_1.Message.getWrapperField(this, dependency_1.DocumentUpdateArray, 1) as dependency_1.DocumentUpdateArray
  }
  set updates(value: dependency_1.DocumentUpdateArray) {
    pb_1.Message.setWrapperField(this, 1, value)
  }
  get has_updates() {
    return pb_1.Message.getField(this, 1) != null
  }
  get version() {
    return pb_1.Message.getFieldWithDefault(this, 2, 0) as number
  }
  set version(value: number) {
    pb_1.Message.setField(this, 2, value)
  }
  get lockId() {
    return pb_1.Message.getFieldWithDefault(this, 3, '') as string
  }
  set lockId(value: string) {
    pb_1.Message.setField(this, 3, value)
  }
  static fromObject(data: {
    updates?: ReturnType<typeof dependency_1.DocumentUpdateArray.prototype.toObject>
    version?: number
    lockId?: string
  }): Commit {
    const message = new Commit({})
    if (data.updates != null) {
      message.updates = dependency_1.DocumentUpdateArray.fromObject(data.updates)
    }
    if (data.version != null) {
      message.version = data.version
    }
    if (data.lockId != null) {
      message.lockId = data.lockId
    }
    return message
  }
  toObject() {
    const data: {
      updates?: ReturnType<typeof dependency_1.DocumentUpdateArray.prototype.toObject>
      version?: number
      lockId?: string
    } = {}
    if (this.updates != null) {
      data.updates = this.updates.toObject()
    }
    if (this.version != null) {
      data.version = this.version
    }
    if (this.lockId != null) {
      data.lockId = this.lockId
    }
    return data
  }
  serialize(): Uint8Array
  serialize(w: pb_1.BinaryWriter): void
  serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
    const writer = w || new pb_1.BinaryWriter()
    if (this.has_updates) writer.writeMessage(1, this.updates, () => this.updates.serialize(writer))
    if (this.version != 0) writer.writeInt32(2, this.version)
    if (this.lockId.length) writer.writeString(3, this.lockId)
    if (!w) return writer.getResultBuffer()
  }
  static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Commit {
    const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes),
      message = new Commit()
    while (reader.nextField()) {
      if (reader.isEndGroup()) break
      switch (reader.getFieldNumber()) {
        case 1:
          reader.readMessage(
            message.updates,
            () => (message.updates = dependency_1.DocumentUpdateArray.deserialize(reader)),
          )
          break
        case 2:
          message.version = reader.readInt32()
          break
        case 3:
          message.lockId = reader.readString()
          break
        default:
          reader.skipField()
      }
    }
    return message
  }
  serializeBinary(): Uint8Array {
    return this.serialize()
  }
  static deserializeBinary(bytes: Uint8Array): Commit {
    return Commit.deserialize(bytes)
  }
}
