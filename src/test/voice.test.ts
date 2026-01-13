import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VoiceRecognizer, startAudioRecording, audioToBase64, processVoiceInput } from '../../services/voiceService'

// Mock browser APIs
const mockSpeechRecognition = vi.fn()
const mockGetUserMedia = vi.fn()

describe('VoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup global mocks
    global.window = {
      SpeechRecognition: mockSpeechRecognition,
      webkitSpeechRecognition: mockSpeechRecognition,
    } as any
  })

  describe('VoiceRecognizer', () => {
    it('should initialize with speech recognition', () => {
      const mockRecognitionInstance = {
        continuous: false,
        interimResults: false,
        language: 'en-US',
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null,
      }

      mockSpeechRecognition.mockReturnValue(mockRecognitionInstance)

      const recognizer = new VoiceRecognizer()
      expect(recognizer).toBeDefined()
      expect(mockSpeechRecognition).toHaveBeenCalled()
    })

    it('should throw error if Speech Recognition API is not available', () => {
      ;(global.window as any).SpeechRecognition = undefined
      ;(global.window as any).webkitSpeechRecognition = undefined

      expect(() => new VoiceRecognizer()).toThrow(
        'Speech Recognition API not supported in this browser'
      )
    })

    it('should handle voice input correctly', () => {
      const mockRecognitionInstance = {
        continuous: false,
        interimResults: false,
        language: 'en-US',
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null,
      }

      mockSpeechRecognition.mockReturnValue(mockRecognitionInstance)

      const recognizer = new VoiceRecognizer()
      const onResult = vi.fn()
      const onError = vi.fn()

      recognizer.start(onResult, onError)

      // Simulate speech recognition result
      if (mockRecognitionInstance.onresult) {
        mockRecognitionInstance.onresult({
          results: [
            [{ transcript: 'Hello world', confidence: 0.9 }],
          ] as any,
          isFinal: true,
        } as any)
      }

      expect(onResult).toHaveBeenCalledWith('Hello world', true)
    })

    it('should handle language changes', () => {
      const mockRecognitionInstance = {
        continuous: false,
        interimResults: false,
        language: 'en-US',
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null,
      }

      mockSpeechRecognition.mockReturnValue(mockRecognitionInstance)

      const recognizer = new VoiceRecognizer()
      recognizer.setLanguage('es-ES')

      expect(mockRecognitionInstance.language).toBe('es-ES')
    })

    it('should get listening state', () => {
      const mockRecognitionInstance = {
        continuous: false,
        interimResults: false,
        language: 'en-US',
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null,
      }

      mockSpeechRecognition.mockReturnValue(mockRecognitionInstance)

      const recognizer = new VoiceRecognizer()
      expect(recognizer.getIsListening()).toBe(false)

      if (mockRecognitionInstance.onstart) {
        mockRecognitionInstance.onstart()
      }

      expect(recognizer.getIsListening()).toBe(true)
    })
  })

  describe('processVoiceInput', () => {
    it('should detect save command', () => {
      const result = processVoiceInput('save this note')
      expect(result.command).toBe('save')
      expect(result.content).toBe('save this note')
    })

    it('should detect analyze command', () => {
      const result = processVoiceInput('analyze this')
      expect(result.command).toBe('analyze')
    })

    it('should detect clear command', () => {
      const result = processVoiceInput('clear everything')
      expect(result.command).toBe('clear')
    })

    it('should return content without command', () => {
      const result = processVoiceInput('just some random text')
      expect(result.command).toBeUndefined()
      expect(result.content).toBe('just some random text')
    })

    it('should trim whitespace from content', () => {
      const result = processVoiceInput('  hello world  ')
      expect(result.content).toBe('hello world')
    })

    it('should be case-insensitive for commands', () => {
      const result1 = processVoiceInput('SAVE')
      const result2 = processVoiceInput('Save')
      const result3 = processVoiceInput('sAvE')

      expect(result1.command).toBe('save')
      expect(result2.command).toBe('save')
      expect(result3.command).toBe('save')
    })
  })

  describe('audioToBase64', () => {
    it('should convert audio blob to base64', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/webm' })
      const mockDataUrl = 'data:audio/webm;base64,dGVzdCBkYXRh'

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: any) {
          setTimeout(() => {
            this.onload({ target: { result: mockDataUrl } })
          }, 0)
        }),
        onload: null,
        onerror: null,
        error: null,
        result: null,
      } as any

      global.FileReader = vi.fn(() => mockFileReader)

      const result = await audioToBase64(mockBlob)
      expect(result).toBe('dGVzdCBkYXRh')
    })

    it('should handle file reader errors', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/webm' })
      const mockError = new Error('Read error')

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: any) {
          setTimeout(() => {
            this.onerror()
          }, 0)
        }),
        onload: null,
        onerror: null,
        error: mockError,
        result: null,
      } as any

      global.FileReader = vi.fn(() => mockFileReader)

      await expect(audioToBase64(mockBlob)).rejects.toEqual(mockError)
    })
  })
})
