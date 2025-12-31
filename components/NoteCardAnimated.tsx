import React from 'react';
import { motion } from 'framer-motion';
import { Note } from '../types';
import { EditIcon, TrashIcon, LinkIcon } from './icons';

interface NoteCardAnimatedProps {
  note: Note;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  connectionCount?: number;
}

const NoteCardAnimated: React.FC<NoteCardAnimatedProps> = ({
  note,
  isActive,
  onSelect,
  onDelete,
  connectionCount = 0,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
    hover: {
      y: -4,
      boxShadow: '0 0 30px rgba(0, 217, 255, 0.2)',
      transition: { type: 'spring', stiffness: 200, damping: 20 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: 0.1 },
    },
  };

  const truncateText = (text: string, lines: number = 2) => {
    const lineArray = text.split('\n').slice(0, lines);
    return lineArray.join('\n').substring(0, 100);
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => onSelect(note.id)}
      className={`glass-dark rounded-xl p-4 cursor-pointer transition-all ${
        isActive
          ? 'ring-2 ring-dark-accent border-dark-accent'
          : 'border border-dark-secondary hover:border-dark-accent/50'
      }`}
    >
      <motion.div variants={contentVariants} className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dark-text line-clamp-1 flex-1">
            {note.title || 'Untitled Note'}
          </h3>
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(note.id);
              }}
              className="p-1 rounded-lg hover:bg-dark-accent/20 text-dark-text-secondary hover:text-dark-accent transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 rounded-lg hover:bg-red-500/20 text-dark-text-secondary hover:text-red-400 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-dark-text-secondary line-clamp-2">
          {truncateText(note.content)}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-dark-secondary/50">
          <motion.span
            className="text-xs text-dark-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {new Date(note.updatedAt).toLocaleDateString()}
          </motion.span>

          {connectionCount > 0 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark-accent/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <LinkIcon className="w-3 h-3 text-dark-accent" />
              <span className="text-xs text-dark-accent font-semibold">
                {connectionCount}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NoteCardAnimated;
