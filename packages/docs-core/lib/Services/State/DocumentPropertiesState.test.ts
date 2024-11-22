import { DocumentPropertiesState } from './DocumentPropertiesState'

describe('DocumentPropertiesState', () => {
  let documentPropertiesState: DocumentPropertiesState

  beforeEach(() => {
    documentPropertiesState = new DocumentPropertiesState()
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const state = documentPropertiesState.getState()
      expect(state).toEqual({
        emailTitleEnabled: false,
        emailNotificationsEnabled: false,
      })
    })
  })

  describe('subscribe', () => {
    it('should call subscriber immediately with current state', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        emailTitleEnabled: false,
        emailNotificationsEnabled: false,
      })
    })

    it('should return unsubscribe function', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribe(callback)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should not call subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribe(callback)

      callback.mockClear()

      unsubscribe()
      documentPropertiesState.notifyChanged('emailTitleEnabled', true)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should notify multiple subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      documentPropertiesState.subscribe(callback1)
      documentPropertiesState.subscribe(callback2)

      callback1.mockClear()
      callback2.mockClear()

      documentPropertiesState.notifyChanged('emailTitleEnabled', true)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('notifyChanged', () => {
    it('should update state and notify subscribers', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribe(callback)

      callback.mockClear()

      documentPropertiesState.notifyChanged('emailTitleEnabled', true)

      expect(callback).toHaveBeenCalledWith({
        emailTitleEnabled: true,
        emailNotificationsEnabled: false,
      })
    })

    it('should not modify previous state objects', () => {
      const previousState = documentPropertiesState.getState()
      documentPropertiesState.notifyChanged('emailTitleEnabled', true)

      expect(previousState.emailTitleEnabled).toBe(false)
    })
  })

  describe('getState', () => {
    it('should return current state', () => {
      documentPropertiesState.notifyChanged('emailTitleEnabled', true)
      documentPropertiesState.notifyChanged('emailNotificationsEnabled', true)

      expect(documentPropertiesState.getState()).toEqual({
        emailTitleEnabled: true,
        emailNotificationsEnabled: true,
      })
    })

    it('should return new object instance each time', () => {
      const state1 = documentPropertiesState.getState()
      const state2 = documentPropertiesState.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })
})
