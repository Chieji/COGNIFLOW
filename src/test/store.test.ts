import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStore } from '../../store'
import { Note } from '../../types'

// Mock the db to prevent actual db operations during tests
vi.mock('../../db', () => ({
  db: {
    notes: {
      add: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

describe('Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useStore.setState(useStore.getInitialState())
    })
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useStore())

    expect(result.current.notes).toEqual([])
    expect(result.current.activeNoteId).toBeNull()
    expect(result.current.chatMessages).toEqual([])
  })

  it('can create and select a note', async () => {
    const { result } = renderHook(() => useStore())

    await act(async () => {
      await result.current.createNewNote()
    })

    expect(result.current.notes).toHaveLength(1)
    const newNote = result.current.notes[0]
    expect(newNote.title).toBe('Untitled Note')

    act(() => {
      result.current.setActiveNoteId(newNote.id)
    })

    expect(result.current.activeNoteId).toEqual(newNote.id)
  })

  it('can update a note', async () => {
    const { result } = renderHook(() => useStore())

    const testNote: Note = {
      id: 'test-1',
      title: 'Test Note',
      content: 'Test content',
      summary: '',
      tags: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      folderId: null,
      type: 'text' as const,
      attachments: [],
    }

    await act(async () => {
      // Manually add note to state for this test since createNewNote has side effects
      useStore.setState({ notes: [testNote] })
      await result.current.updateNote({ ...testNote, title: 'Updated Title' })
    })

    expect(result.current.notes[0].title).toBe('Updated Title')
  })

  it('can delete a note', async () => {
    const { result } = renderHook(() => useStore())

    const testNote: Note = { id: 'test-1', title: 'Test Note', content: 'Test content', summary: '', tags: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', folderId: null, type: 'text' as const, attachments: [] };

    await act(async () => {
      useStore.setState({ notes: [testNote], activeNoteId: 'test-1' })
      await result.current.deleteNote('test-1')
    })

    expect(result.current.notes).toHaveLength(0)
  })
})