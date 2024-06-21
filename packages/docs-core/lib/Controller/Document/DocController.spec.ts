import { DriveCompat, NodeMeta } from '@proton/drive-store'
import { DocController } from './DocController'
import { UserService } from '../../Services/User/UserService'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import {
  BroadcastSource,
  ClientRequiresEditorMethods,
  DecryptedMessage,
  InternalEventBusInterface,
  RtsMessagePayload,
} from '@proton/docs-shared'
import { LoggerInterface } from '@proton/utils/logs'
import { LoadCommit } from '../../UseCase/LoadCommit'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { DecryptedCommit } from '../../Models/DecryptedCommit'
import { Result } from '../../Domain/Result/Result'
import { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocControllerEvent } from './DocControllerEvent'

describe('DocController', () => {
  let controller: DocController

  beforeEach(() => {
    controller = new DocController(
      {} as NodeMeta,
      {
        user: { Email: 'foo@bar.com' },
      } as jest.Mocked<UserService>,
      {} as jest.Mocked<DriveCompat>,
      {} as jest.Mocked<SquashDocument>,
      {} as jest.Mocked<SeedInitialCommit>,
      {
        execute: jest
          .fn()
          .mockReturnValue(Result.ok({ keys: {}, meta: {}, lastCommitId: '123', entitlements: { keys: {} } })),
      } as unknown as jest.Mocked<LoadDocument>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ numberOfUpdates: jest.fn() })),
      } as unknown as jest.Mocked<LoadCommit>,
      {} as jest.Mocked<DuplicateDocument>,
      {} as jest.Mocked<CreateNewDocument>,
      {
        execute: jest.fn().mockReturnValue(
          Result.ok({
            latestCommitId: jest.fn().mockReturnValue('123'),
          }),
        ),
      } as unknown as jest.Mocked<GetDocumentMeta>,
      {} as jest.Mocked<ExportAndDownload>,
      {
        createConnection: jest.fn().mockReturnValue({ connect: jest.fn().mockResolvedValue(true) }),
        sendDocumentUpdateMessage: jest.fn(),
        flushPendingUpdates: jest.fn(),
        reconnectToDocumentWithoutDelay: jest.fn(),
      } as unknown as jest.Mocked<WebsocketServiceInterface>,
      {
        addEventHandler: jest.fn(),
        publish: jest.fn(),
      } as unknown as jest.Mocked<InternalEventBusInterface>,
      {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as jest.Mocked<LoggerInterface>,
    )

    controller.entitlements = {
      role: {
        canEdit: () => true,
      },
      keys: {},
    } as unknown as DocumentEntitlements

    controller.beginInitialSyncTimer = jest.fn()
    controller.beginInitialConnectionTimer = jest.fn()

    controller.editorInvoker = {
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      changeLockedState: jest.fn().mockResolvedValue(false),
      performClosingCeremony: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>
  })

  it('should queue updates received while editor was not yet ready', async () => {
    controller.editorInvoker = undefined

    await controller.handleDocumentUpdatesMessage({} as DecryptedMessage)

    expect(controller.updatesReceivedWhileEditorInvokerWasNotReady).toHaveLength(1)
  })

  it('should replay queued updates as soon as editor is ready, and clear the queue', async () => {
    controller.editorInvoker = undefined

    await controller.handleDocumentUpdatesMessage(
      new DecryptedMessage({
        content: new Uint8Array(),
        signature: new Uint8Array(),
        authorAddress: '123',
        aad: '123',
        timestamp: 0,
      }),
    )

    controller.handleDocumentUpdatesMessage = jest.fn()

    await controller.editorIsReadyToReceiveInvocations({
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      changeLockedState: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>)

    expect(controller.handleDocumentUpdatesMessage).toHaveBeenCalled()
    expect(controller.updatesReceivedWhileEditorInvokerWasNotReady).toHaveLength(0)
  })

  describe('editorIsReadyToReceiveInvocations', () => {
    it('should send initial commit to editor', async () => {
      controller.sendInitialCommitToEditor = jest.fn()

      const editorInvoker = controller.editorInvoker!
      controller.editorInvoker = undefined
      await controller.editorIsReadyToReceiveInvocations(editorInvoker)

      expect(controller.sendInitialCommitToEditor).toHaveBeenCalled()
    })
  })

  describe('initialize', () => {
    it('should set the initial commit', async () => {
      controller.setInitialCommit = jest.fn()

      await controller.initialize()

      expect(controller.setInitialCommit).toHaveBeenCalled()
    })
  })

  describe('setInitialCommit', () => {
    it('should send the initial commit to the editor', async () => {
      controller.sendInitialCommitToEditor = jest.fn()

      controller.setInitialCommit({
        needsSquash: jest.fn(),
      } as unknown as jest.Mocked<DecryptedCommit>)

      expect(controller.sendInitialCommitToEditor).toHaveBeenCalled()
    })

    it('should set last commit id property', async () => {
      controller.setInitialCommit({
        needsSquash: jest.fn(),
        commitId: '456',
      } as unknown as jest.Mocked<DecryptedCommit>)

      expect(controller.lastCommitIdReceivedFromRtsOrApi).toBe('456')
    })
  })

  describe('showEditorIfAllConnectionsReady', () => {
    it('should not show editor if docs server connection is not ready', () => {
      controller.realtimeConnectionReady = true
      controller.docsServerConnectionReady = false
      controller.showEditor = jest.fn()

      controller.showEditorIfAllConnectionsReady()

      expect(controller.showEditor).not.toHaveBeenCalled()
    })

    it('should not show editor if realtime connection is not ready', () => {
      controller.realtimeConnectionReady = false
      controller.docsServerConnectionReady = true
      controller.showEditor = jest.fn()

      controller.showEditorIfAllConnectionsReady()

      expect(controller.showEditor).not.toHaveBeenCalled()
    })

    it('should not show editor if editorInvoker is undefined', () => {
      controller.editorInvoker = undefined
      controller.realtimeConnectionReady = true
      controller.docsServerConnectionReady = true
      controller.showEditor = jest.fn()

      controller.showEditorIfAllConnectionsReady()

      expect(controller.showEditor).not.toHaveBeenCalled()
    })
  })

  describe('handleRealtimeConnectionReady', () => {
    it('should show editor', () => {
      controller.didAlreadyReceiveEditorReadyEvent = true
      controller.docsServerConnectionReady = true

      controller.handleRealtimeConnectionReady()

      expect(controller.editorInvoker!.showEditor).toHaveBeenCalled()
    })
  })

  describe('reloadEditingLockedState', () => {
    it('should lock if user does not have editing permissions', () => {
      controller.doesUserHaveEditingPermissions = jest.fn().mockReturnValue(false)

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if experiencing errored sync', () => {
      controller.isExperiencingErroredSync = true

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if websocket status is connecting', () => {
      controller.websocketStatus = 'connecting'

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock if websocket status is disconnected', () => {
      controller.websocketStatus = 'disconnected'

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should unlock if all flags are green', () => {
      controller.doesUserHaveEditingPermissions = jest.fn().mockReturnValue(true)
      controller.isExperiencingErroredSync = false
      controller.websocketStatus = 'connected'

      controller.reloadEditingLockedState()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(false)
    })
  })

  describe('websocket lifecycle', () => {
    it('should lock document when websocket is still connecting', () => {
      controller.handleWebsocketConnectingEvent()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should begin initial sync timer on connected event', () => {
      controller.beginInitialSyncTimer = jest.fn()

      controller.handleWebsocketConnectedEvent()

      expect(controller.beginInitialSyncTimer).toHaveBeenCalled()
    })
  })

  describe('handleWebsocketDisconnectedEvent', () => {
    it('should prevent editing when websocket is closed', () => {
      const payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected] = {
        document: {} as NodeMeta,
        serverReason: ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.NORMAL_CLOSURE }),
      }
      controller.handleWebsocketDisconnectedEvent(payload)

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should refetch commit if disconnect reason is stale commit id', () => {
      const payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected] = {
        document: {} as NodeMeta,
        serverReason: ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.STALE_COMMIT_ID }),
      }
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleWebsocketDisconnectedEvent(payload)

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('handleCommitIdOutOfSyncEvent', () => {
    it('should refetch commit', () => {
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleFailedToGetTokenDueToCommitIdOutOfSyncEvent()

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('refetchCommitDueToStaleContents', () => {
    it('should post UnableToResolveCommitIdConflict error if unable to resolve', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(Result.fail('Unable to resolve'))
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.fail('Unable to resolve'))

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.eventBus.publish).toHaveBeenCalledWith({
        type: DocControllerEvent.UnableToResolveCommitIdConflict,
        payload: undefined,
      })
    })

    it('should not reprocess if already processing', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(Result.ok({}))
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.ok({}))

      controller.isRefetchingStaleCommit = true

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller._loadCommit.execute).not.toHaveBeenCalled()
    })

    it('should re-set the initial commit if commit is successfully resolved', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn().mockReturnValue(0),
          needsSquash: jest.fn().mockReturnValue(false),
        }),
      )

      controller.setInitialCommit = jest.fn()

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.setInitialCommit).toHaveBeenCalled()
    })

    it('should reconnect websocket without delay if commit is successfully resolved', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn().mockReturnValue(0),
          needsSquash: jest.fn().mockReturnValue(false),
        }),
      )

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.websocketService.reconnectToDocumentWithoutDelay).toHaveBeenCalled()
    })
  })

  describe('handleWebsocketConnectedEvent', () => {
    it('should allow editing', () => {
      controller.handleWebsocketConnectedEvent()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(false)
    })
  })

  describe('handleWebsocketFailedToConnectEvent', () => {
    it('should block editing', () => {
      controller.handleWebsocketFailedToConnectEvent()

      expect(controller.editorInvoker!.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should set state to disconnected', () => {
      controller.handleWebsocketFailedToConnectEvent()

      expect(controller.websocketStatus).toBe('disconnected')
    })
  })

  describe('handleWebsocketAckStatusChangeEvent', () => {
    it('should reload editing locked state', () => {
      controller.reloadEditingLockedState = jest.fn()

      controller.handleWebsocketAckStatusChangeEvent({
        ledger: { hasErroredMessages: jest.fn() },
      } as unknown as WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange])

      expect(controller.reloadEditingLockedState).toHaveBeenCalled()
    })
  })

  describe('editorRequestsPropagationOfUpdate', () => {
    it('Should propagate update', () => {
      void controller.editorRequestsPropagationOfUpdate(
        {
          type: {
            wrapper: 'du',
          },
          content: {
            byteLength: 123,
          },
        } as RtsMessagePayload,
        'mock' as BroadcastSource,
      )

      // @ts-ignore: accessing private property
      expect(controller.websocketService.sendDocumentUpdateMessage).toHaveBeenCalled()
    })

    it('Should not propagate update if message is above MAX_DU_SIZE', () => {
      void controller.editorRequestsPropagationOfUpdate(
        {
          type: {
            wrapper: 'du',
          },
          content: {
            byteLength: 123123123,
          },
        } as RtsMessagePayload,
        'mock' as BroadcastSource,
      )
      // @ts-ignore: accessing private property
      expect(controller.websocketService.sendDocumentUpdateMessage).not.toHaveBeenCalled()
      // @ts-ignore: accessing private property
      expect(controller.websocketService.flushPendingUpdates).toHaveBeenCalled()
    })
  })
})
