import { describe, it, expect, vi } from 'vitest'
import NoteEditor from '../../components/NoteEditor'

// Mock all the complex dependencies to avoid rendering issues
vi.mock('../../services/geminiService', () => ({
  summarizeAndTagNote: vi.fn(),
  analyzeVisualMedia: vi.fn(),
  generateSpeech: vi.fn(),
}))

vi.mock('../../utils', () => ({
  decode: vi.fn(),
  decodeAudioData: vi.fn(),
  blobToBase64: vi.fn(),
}))

vi.mock('../../components/Tag', () => ({
  default: () => null,
}))

vi.mock('../../components/Spinner', () => ({
  default: () => null,
}))

vi.mock('../../components/icons', () => ({
  SparklesIcon: () => null,
  PaperclipIcon: () => null,
  CameraIcon: () => null,
  MicIcon: () => null,
  XCircleIcon: () => null,
  PlayCircleIcon: () => null,
  BrainCircuitIcon: () => null,
  LoaderIcon: () => null,
  Volume2Icon: () => null,
  Share2Icon: () => null,
  MessageCircleIcon: () => null,
}))

describe('NoteEditor', () => {
  it('is a valid React component', () => {
    expect(typeof NoteEditor).toBe('function')
    expect(NoteEditor.name).toBe('NoteEditor')
  })

  it('can be imported without errors', () => {
    expect(NoteEditor).toBeDefined()
    expect(NoteEditor).not.toBeNull()
  })
})