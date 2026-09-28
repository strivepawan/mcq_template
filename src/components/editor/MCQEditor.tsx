import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Volume2,
  Sparkles,
  Clock,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Globe,
  FileSpreadsheet
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { OptionId, MCQItem, LanguageCode } from '../../types/mcq';
import { ttsService, VoiceOption } from '../../services/ttsService';
import { CSVBulkUploadModal } from './CSVBulkUploadModal';

const ENGLISH_PRESETS: Array<{
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: [string, string, string, string];
  correctAnswer: OptionId;
  explanation: string;
}> = [
  {
    category: 'Astronomy',
    difficulty: 'Easy',
    question: 'Which planet in our solar system is known as the "Red Planet"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
    correctAnswer: 'B',
    explanation: 'Mars is red because iron minerals in the Martian soil oxidize (rust).'
  },
  {
    category: 'Science',
    difficulty: 'Medium',
    question: 'What is the chemical symbol for Gold in the Periodic Table?',
    options: ['Ag', 'Au', 'Gd', 'Fe'],
    correctAnswer: 'B',
    explanation: 'Au comes from the Latin word "Aurum", which means shining dawn or gold.'
  },
  {
    category: 'Geography',
    difficulty: 'Hard',
    question: 'Which is the largest desert on Earth by total surface area?',
    options: ['Sahara Desert', 'Arabian Desert', 'Antarctic Desert', 'Gobi Desert'],
    correctAnswer: 'C',
    explanation: 'Antarctica is a polar desert with an area of 14.2 million sq km, making it Earth’s largest desert.'
  },
  {
    category: 'World History',
    difficulty: 'Medium',
    question: 'In which year did the Apollo 11 mission land the first humans on the Moon?',
    options: ['1965', '1969', '1971', '1975'],
    correctAnswer: 'B',
    explanation: 'Neil Armstrong and Buzz Aldrin landed on the lunar surface on July 20, 1969.'
  }
];

const HINDI_PRESETS: Array<{
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: [string, string, string, string];
  correctAnswer: OptionId;
  explanation: string;
}> = [
  {
    category: 'सामान्य विज्ञान',
    difficulty: 'Medium',
    question: 'मानव शरीर की सबसे बड़ी ग्रंथि (Largest Gland) कौन सी है?',
    options: ['अग्न्याशय (Pancreas)', 'यकृत (Liver)', 'थायरॉयड (Thyroid)', 'पीयूष ग्रंथि (Pituitary)'],
    correctAnswer: 'B',
    explanation: 'यकृत (Liver) मानव शरीर का सबसे बड़ा आंतरिक अंग और प्रमुख ग्रंथि है, जो पित्त रस बनाती है।'
  },
  {
    category: 'भारतीय संविधान',
    difficulty: 'Easy',
    question: 'भारतीय संविधान में "मौलिक अधिकार" किस देश के संविधान से लिए गए हैं?',
    options: ['रूस (Russia)', 'संयुक्त राज्य अमेरिका (USA)', 'ब्रिटेन (UK)', 'ऑस्ट्रेलिया (Australia)'],
    correctAnswer: 'B',
    explanation: 'भारतीय संविधान के भाग 3 में वर्णित मौलिक अधिकार अमेरिकी संविधान के बिल ऑफ राइट्स से प्रेरित हैं।'
  },
  {
    category: 'भारत का भूगोल',
    difficulty: 'Easy',
    question: 'भारत की सबसे लंबी नदी कौन सी है?',
    options: ['यमुना नदी', 'गंगा नदी', 'गोदावरी नदी', 'ब्रह्मपुत्र नदी'],
    correctAnswer: 'B',
    explanation: 'गंगा नदी भारत की सबसे लंबी नदी है, जिसकी कुल लंबाई लगभग 2,525 किलोमीटर है।'
  },
  {
    category: 'सौर मंडल',
    difficulty: 'Easy',
    question: 'सौरमंडल में किस ग्रह को "लाल ग्रह" के नाम से जाना जाता है?',
    options: ['शुक्र (Venus)', 'मंगल (Mars)', 'बृहस्पति (Jupiter)', 'बुध (Mercury)'],
    correctAnswer: 'B',
    explanation: 'मंगल ग्रह की सतह पर आयरन ऑक्साइड (जंग) की अधिकता के कारण यह लाल दिखाई देता है।'
  },
  {
    category: 'भारतीय इतिहास',
    difficulty: 'Medium',
    question: 'सिंधु घाटी सभ्यता का प्रमुख बंदरगाह नगर (Port City) कौन सा था?',
    options: ['कालीबंगा', 'लोथल (गुजरात)', 'हड़प्पा', 'मोहनजोदड़ो'],
    correctAnswer: 'B',
    explanation: 'लोथल गुजरात के भोगवा नदी के तट पर स्थित सिंधु सभ्यता का एक प्रसिद्ध प्राचीन बंदरगाह था।'
  }
];

export const MCQEditor: React.FC = () => {
  const {
    currentProject,
    activeMcqIndex,
    setActiveMcqIndex,
    updateActiveMcq,
    addMcq,
    deleteMcq,
    duplicateMcq
  } = useProjectStore();

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  if (!currentProject || !currentProject.mcqItems[activeMcqIndex]) {
    return (
      <div className="p-8 text-center text-slate-400">
        No MCQ selected. Click "+ Add MCQ" to get started.
      </div>
    );
  }

  const mcq = currentProject.mcqItems[activeMcqIndex];
  const currentLang: LanguageCode = mcq.language || 'en';
  const availableVoices = ttsService.getVoicesForLanguage(currentLang);

  const handleLanguageSwitch = (lang: LanguageCode) => {
    const defaultVoice = lang === 'hi' ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural';
    updateActiveMcq({
      language: lang,
      voiceName: defaultVoice
    });
  };

  const handleOptionChange = (id: OptionId, text: string) => {
    const newOptions = mcq.options.map(opt =>
      opt.id === id ? { ...opt, text } : opt
    ) as [typeof mcq.options[0], typeof mcq.options[1], typeof mcq.options[2], typeof mcq.options[3]];

    updateActiveMcq({ options: newOptions });
  };

  const handleCorrectAnswerSelect = (id: OptionId) => {
    updateActiveMcq({ correctAnswer: id });
  };

  const handleTestVoice = () => {
    setIsPlayingVoice(true);
    const isHindi = mcq.language === 'hi';
    const textToSpeak = isHindi
      ? `${mcq.question}। विकल्प ए: ${mcq.options[0].text}। विकल्प बी: ${mcq.options[1].text}। विकल्प सी: ${mcq.options[2].text}। विकल्प डी: ${mcq.options[3].text}।`
      : `${mcq.question}. Option A: ${mcq.options[0].text}. Option B: ${mcq.options[1].text}. Option C: ${mcq.options[2].text}. Option D: ${mcq.options[3].text}.`;

    ttsService.speak(textToSpeak, {
      voiceName: mcq.voiceName || (isHindi ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural'),
      rate: mcq.voiceRate ?? 1.0,
      pitch: mcq.voicePitch ?? 1.0,
      onEnd: () => setIsPlayingVoice(false)
    });
  };

  const handleApplyPreset = (preset: typeof ENGLISH_PRESETS[0]) => {
    updateActiveMcq({
      question: preset.question,
      category: preset.category,
      difficulty: preset.difficulty,
      options: [
        { id: 'A', text: preset.options[0] },
        { id: 'B', text: preset.options[1] },
        { id: 'C', text: preset.options[2] },
        { id: 'D', text: preset.options[3] }
      ],
      correctAnswer: preset.correctAnswer,
      explanation: preset.explanation
    });
  };

  const activePresets = currentLang === 'hi' ? HINDI_PRESETS : ENGLISH_PRESETS;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto pb-24">
      {/* Top Language Switcher Bar: ONLY English and Hindi */}
      <div className="bg-[#131a2b] border border-indigo-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              MCQ Language / माध्यम चुनें:
            </span>
            <p className="text-[11px] text-slate-400">
              {currentLang === 'hi'
                ? 'हिंदी माध्यम के छात्रों के लिए शुद्ध हिंदी प्रश्न, विकल्प और वॉयसओवर'
                : 'English trivia questions with clear voice narration'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => handleLanguageSwitch('en')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition ${
              currentLang === 'en'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>

          <button
            onClick={() => handleLanguageSwitch('hi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition ${
              currentLang === 'hi'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇮🇳</span>
            <span>हिंदी (Hindi Medium)</span>
          </button>
        </div>
      </div>

      {/* Question Tabs & Actions */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {currentProject.mcqItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveMcqIndex(idx)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                idx === activeMcqIndex
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span>{item.language === 'hi' ? `प्रश्न ${idx + 1}` : `Q${idx + 1}`}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          ))}

          <button
            onClick={addMcq}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-indigo-400 text-xs font-semibold border border-dashed border-indigo-500/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{currentLang === 'hi' ? 'नया प्रश्न' : 'Add MCQ'}</span>
          </button>

          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 text-indigo-200 text-xs font-bold border border-indigo-500/40 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentLang === 'hi' ? 'CSV बल्क अपलोड' : 'Bulk CSV Upload'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => duplicateMcq(mcq.id)}
            title="Duplicate MCQ"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          {currentProject.mcqItems.length > 1 && (
            <button
              onClick={() => deleteMcq(mcq.id)}
              title="Delete MCQ"
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Sample Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {currentLang === 'hi' ? 'त्वरित टेम्पलेट्स:' : 'Quick Templates:'}
        </span>
        {activePresets.map((p, i) => (
          <button
            key={i}
            onClick={() => handleApplyPreset(p)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 transition whitespace-nowrap"
          >
            {p.category}
          </button>
        ))}
      </div>

      {/* Question Form Section */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>{currentLang === 'hi' ? 'क्विज़ प्रश्न (Quiz Question)' : 'Quiz Question'}</span>
            <span className="text-rose-400">*</span>
          </label>

          {/* Category & Difficulty */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={currentLang === 'hi' ? 'श्रेणी (उदा. विज्ञान)' : 'Category (e.g. Science)'}
              value={mcq.category || ''}
              onChange={(e) => updateActiveMcq({ category: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-40"
            />
            <select
              value={mcq.difficulty || 'Easy'}
              onChange={(e) => updateActiveMcq({ difficulty: e.target.value as MCQItem['difficulty'] })}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Easy">Easy / सरल</option>
              <option value="Medium">Medium / मध्यम</option>
              <option value="Hard">Hard / कठिन</option>
            </select>
          </div>
        </div>

        <textarea
          rows={3}
          value={mcq.question}
          onChange={(e) => updateActiveMcq({ question: e.target.value })}
          placeholder={currentLang === 'hi' ? 'यहाँ अपना बहुविकल्पीय प्रश्न दर्ज करें...' : 'Enter your multiple-choice trivia question here...'}
          className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 font-medium text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
        />

        {/* 4 Options Grid (A, B, C, D) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentLang === 'hi' ? 'विकल्प (सही उत्तर चुनने के लिए टिक पर क्लिक करें)' : 'Answer Options (Click checkmark to select correct answer)'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {currentLang === 'hi' ? `विकल्प ${mcq.correctAnswer} सही है` : `Option ${mcq.correctAnswer} is Correct`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {mcq.options.map((option) => {
              const isCorrect = option.id === mcq.correctAnswer;
              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-900/20'
                      : 'bg-slate-900/70 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => handleCorrectAnswerSelect(option.id)}
                    title={`Mark Option ${option.id} as Correct`}
                    className={`w-9 h-9 rounded-lg font-black text-sm flex items-center justify-center transition ${
                      isCorrect
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    {option.id}
                  </button>

                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    placeholder={currentLang === 'hi' ? `विकल्प ${option.id} का उत्तर` : `Option ${option.id} text`}
                    className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none font-semibold"
                  />

                  <button
                    onClick={() => handleCorrectAnswerSelect(option.id)}
                    className={`p-1.5 rounded-lg transition ${
                      isCorrect ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Countdown Timer Duration Slider */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {currentLang === 'hi' ? 'उलटी गिनती का समय (Countdown Wait):' : 'Countdown Wait Duration:'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
              {mcq.waitTimeSeconds || 3} Seconds
            </span>
          </div>

          <div className="flex items-center gap-3">
            {[2, 3, 5, 7, 10].map((sec) => (
              <button
                key={sec}
                onClick={() => updateActiveMcq({ waitTimeSeconds: sec })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  (mcq.waitTimeSeconds || 3) === sec
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Optional Explanation */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {currentLang === 'hi' ? 'स्पष्टीकरण (उत्तर के बाद दिखाया जाएगा):' : 'Explanation Note (Revealed after the answer):'}
            </label>
          </div>
          <textarea
            rows={2}
            value={mcq.explanation || ''}
            onChange={(e) => updateActiveMcq({ explanation: e.target.value })}
            placeholder={currentLang === 'hi' ? 'यह उत्तर क्यों सही है? (वैकल्पिक - वीडियो के अंत में बोनस स्लाइड के रूप में दिखाई देगा)' : 'Why is this answer correct? (Optional - displays as a bonus slide at the end of the video)'}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      </div>

      {/* Voiceover & Audio Settings */}
      <div className="bg-[#111625] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {currentLang === 'hi' ? 'नेचुरल एआई वॉयसओवर (Natural AI Voiceover)' : 'Natural AI Voiceover'}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mcq.voiceoverEnabled}
              onChange={(e) => updateActiveMcq({ voiceoverEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {mcq.voiceoverEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {currentLang === 'hi' ? 'हिंदी वॉयस आर्टिस्ट' : 'English Voice Actor'}
              </label>
              <select
                value={mcq.voiceName || (currentLang === 'hi' ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural')}
                onChange={(e) => updateActiveMcq({ voiceName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Speech Speed ({mcq.voiceRate || 1.0}x)
              </label>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={mcq.voiceRate || 1.0}
                onChange={(e) => updateActiveMcq({ voiceRate: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 mt-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleTestVoice}
                disabled={isPlayingVoice}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition disabled:opacity-50"
              >
                {isPlayingVoice ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{currentLang === 'hi' ? 'बोल रहा है...' : 'Speaking...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>{currentLang === 'hi' ? 'वॉयस सुनें (Test Voice)' : 'Test Voiceover'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Bulk Upload Modal */}
      <CSVBulkUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
      />
    </div>
  );
};
