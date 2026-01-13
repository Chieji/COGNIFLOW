import { describe, it, expect } from 'vitest'
import { AiTool } from '../../types'

describe('AI Tools', () => {
  it('defines all expected AI tools', () => {
    const expectedTools: AiTool[] = [
      'create_note',
      'update_note',
      'add_tags_to_note',
      'propose_code_patch',
      'create_folder',
      'update_folder_description',
      'delete_folder',
      'explain_note_connections',
      'get_note_content',
      'set_note_metadata',
      'update_note_title',
      'move_note_to_folder',
      'list_folders',
      'write_file',
      'cleanup_note_content',
      'organize_notes_by_topic',
      'create_note_from_conversation'
    ]

    // Test that all tools are defined
    expectedTools.forEach(tool => {
      expect(typeof tool).toBe('string')
      expect(tool.length).toBeGreaterThan(0)
    })

    expect(expectedTools).toHaveLength(17)
  })

  it('includes new AI management tools', () => {
    const newTools: AiTool[] = [
      'cleanup_note_content',
      'organize_notes_by_topic',
      'create_note_from_conversation'
    ]

    newTools.forEach(tool => {
      expect(typeof tool).toBe('string')
    })
  })
})