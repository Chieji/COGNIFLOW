import { useStore } from '../store';

export function useAI() {
  const aiService = useStore((state) => state.settings?.aiService);
  const aiActions = useStore((state) => state.aiActions);
  const addAiAction = useStore((state) => state.addAiAction);
  return { aiService, aiActions, addAiAction };
}
