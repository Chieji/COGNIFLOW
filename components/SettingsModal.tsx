import React, { useState, useEffect } from 'react';
import { AiSettings, AiProvider } from '../types';
import { ChevronDownIcon, XIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  onSave: (settings: AiSettings) => void;
}

const PROVIDERS: { id: AiProvider; name: string }[] = [
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'huggingface', name: 'Hugging Face' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'groq', name: 'Groq' },
];

type TaskKey = keyof AiSettings['tasks'];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [currentSettings, setCurrentSettings] = useState<AiSettings>(settings);
  const [openSections, setOpenSections] = useState<Record<TaskKey, boolean>>({
      chat: true,
      summary: false,
      translation: false,
  });
  
  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, isOpen]);


  if (!isOpen) return null;

  const handleSave = () => {
    onSave(currentSettings);
    onClose();
  };
  
  const toggleSection = (section: TaskKey) => {
      setOpenSections(prev => ({...prev, [section]: !prev[section]}));
  }

  const handleKeyChange = (provider: AiProvider, key: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      keys: { ...prev.keys, [provider]: key },
    }));
  };
  
   const handleModelIdChange = (modelId: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      huggingface: { ...prev.huggingface, modelId },
    }));
  };
  
  const handleProviderChange = (task: TaskKey, provider: AiProvider) => {
    setCurrentSettings(prev => ({
        ...prev,
        tasks: {
            ...prev.tasks,
            [task]: { provider }
        }
    }))
  };
  
  const TASKS: { id: TaskKey, name: string }[] = [
      { id: 'chat', name: 'Chat' },
      { id: 'summary', name: 'Summary' },
      { id: 'translation', name: 'Translation' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-lg p-6 relative flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-light-primary dark:border-dark-primary">
            <h2 className="text-xl font-bold">Configure your AI settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <XIcon className="w-6 h-6" />
            </button>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Cogniflow comes with a built-in AI provider. But you can use any other AI providers by setting the API key in the settings.
        </p>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {TASKS.map(task => {
                const selectedProvider = currentSettings.tasks[task.id].provider;
                return (
                    <div key={task.id} className="border border-light-primary dark:border-dark-primary rounded-lg">
                        <button onClick={() => toggleSection(task.id)} className="w-full flex justify-between items-center p-3 font-semibold">
                            <span>{task.name}</span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSections[task.id] ? '' : '-rotate-90'}`} />
                        </button>
                        {openSections[task.id] && (
                            <div className="p-4 border-t border-light-primary dark:border-dark-primary space-y-4">
                                <div>
                                    <label htmlFor={`${task.id}-provider`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Provider
                                    </label>
                                    <select
                                        id={`${task.id}-provider`}
                                        value={selectedProvider}
                                        onChange={(e) => handleProviderChange(task.id, e.target.value as AiProvider)}
                                        className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent"
                                    >
                                        {PROVIDERS.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={`${selectedProvider}-key`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key
                                    </label>
                                    <input
                                        type="password"
                                        id={`${selectedProvider}-key`}
                                        placeholder="Enter your API key"
                                        value={currentSettings.keys[selectedProvider]}
                                        onChange={(e) => handleKeyChange(selectedProvider, e.target.value)}
                                        className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent"
                                    />
                                </div>
                                {selectedProvider === 'huggingface' && (
                                     <div>
                                        <label htmlFor="hf-model-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Model ID
                                        </label>
                                        <input
                                            type="text"
                                            id="hf-model-id"
                                            placeholder="e.g., mistralai/Mistral-7B-Instruct-v0.2"
                                            value={currentSettings.huggingface.modelId}
                                            onChange={(e) => handleModelIdChange(e.target.value)}
                                            className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <div className="mt-6 pt-4 border-t border-light-primary dark:border-dark-primary flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-light-secondary hover:bg-light-primary dark:bg-dark-secondary dark:hover:bg-dark-primary transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-light-accent text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;