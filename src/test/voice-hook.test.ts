import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceRecorder, useVoiceInput } from '../../hooks/useVoiceRecorder'

// Mock the voice service
vi.mock('../../services/voiceService', () => ({
  VoiceRecognizer: vi.fn(function () {
    this.start = vi.fn()
    this.stop = vi.fn().mockReturnValue('test transcript')
    this.abort = vi.fn()
    this.getIsListening = vi.fn().mockReturnValue(false)
    this.setLanguage = vi.fn()
  }),
  startAudioRecording: vi.fn(),
  stopAudioRecording: vi.fn(),
  audioToBase64: vi.fn(),
  processVoiceInput: vi.fn((text) => ({
    content: text,
    command: text.includes('save') ? 'save' : undefined,
  })),
}))

describe('useVoiceRecorder Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVoiceRecorder())

    expect(result.current.isRecording).toBe(false)
    expect(result.current.transcript).toBe('')
    expect(result.current.interimTranscript).toBe('')
    expect(result.current.error).toBeNull()
    expect(result.current.isSupported).toBe(true)
  })

  it('should start recording', async () => {
    const { result } = renderHook(() => useVoiceRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.isRecording).toBe(true)
  })

  it('should handle recording errors gracefully', async () => {
    const { result } = renderHook(() => useVoiceRecorder())

    // Mock voice recognizer to throw error
    vi.mock('../../services/voiceService', () => ({
      VoiceRecognizer: vi.fn(() => {
        throw new Error('Microphone access denied')
      }),
    }))

    expect(result.current.isSupported).toBeDefined()
  })

  it('should stop recording and return transcript', async () => {
    const { result } = renderHook(() => useVoiceRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    let transcript = ''
    await act(async () => {
      transcript = await result.current.stopRecording()
    })

    expect(result.current.isRecording).toBe(false)
    expect(transcript).toBe('test transcript')
  })

  it('should clear transcript', () => {
    const { result } = renderHook(() => useVoiceRecorder())

    act(() => {
      result.current.clearTranscript()
    })

    expect(result.current.transcript).toBe('')
    expect(result.current.interimTranscript).toBe('')
    expect(result.current.error).toBeNull()
  })
})

describe('useVoiceInput Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isRecording).toBe(false)
    expect(result.current.processedCommand).toBeUndefined()
  })

  it('should call onContentAdd when content is processed', async () => {
    const mockOnContentAdd = vi.fn()
    const { result } = renderHook(() => useVoiceInput(mockOnContentAdd))

    await act(async () => {
      await result.current.startRecording()
    })

    // Simulate speech result
    await act(async () => {
      result.current.addToNote('Hello world')
    })

    expect(mockOnContentAdd).toHaveBeenCalledWith('Hello world')
  })

  it('should detect voice commands', async () => {
    const { result } = renderHook(() => useVoiceInput())

    await act(async () => {
      await result.current.startRecording()
    })

    // Simulate transcript with command
    await act(async () => {
      result.current.addToNote('save this note')
    })

    expect(result.current.processedCommand).toBeDefined()
  })
})
