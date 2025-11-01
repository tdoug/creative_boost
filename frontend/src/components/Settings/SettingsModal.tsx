import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [prohibitedWords, setProhibitedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    // Load prohibited words from localStorage
    const stored = localStorage.getItem('prohibitedWords');
    if (stored) {
      setProhibitedWords(JSON.parse(stored));
    } else {
      // Set default prohibited word
      const defaultWords = ['bamboo'];
      setProhibitedWords(defaultWords);
      localStorage.setItem('prohibitedWords', JSON.stringify(defaultWords));
    }
  }, [isOpen]);

  const addWord = () => {
    const word = newWord.trim().toLowerCase();
    if (word && !prohibitedWords.includes(word)) {
      const updated = [...prohibitedWords, word];
      setProhibitedWords(updated);
      localStorage.setItem('prohibitedWords', JSON.stringify(updated));
      setNewWord('');
    }
  };

  const removeWord = (word: string) => {
    const updated = prohibitedWords.filter(w => w !== word);
    setProhibitedWords(updated);
    localStorage.setItem('prohibitedWords', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Legal Content Checks</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Define prohibited words that should not appear in campaign messages.
              Generation will be blocked if any prohibited words are detected.
            </p>
          </div>

          {/* Add Word Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Prohibited Word
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addWord()}
                placeholder="Enter word to prohibit..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addWord}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          {/* Prohibited Words List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prohibited Words ({prohibitedWords.length})
            </label>
            {prohibitedWords.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 text-center border border-dashed border-gray-300 rounded-md">
                No prohibited words defined
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prohibitedWords.map((word) => (
                  <div
                    key={word}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <span className="font-mono text-sm text-gray-900">{word}</span>
                    <button
                      onClick={() => removeWord(word)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Remove word"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
