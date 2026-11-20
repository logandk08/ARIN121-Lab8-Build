/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  ListOrdered,
  FileQuestion,
  Lightbulb,
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  correctLetter: string;
  explanation: string;
}

interface QuizResponse {
  title: string;
  questions: QuizQuestion[];
}

const SAMPLE_NOTES = [
  {
    topic: 'Biology: Cellular Respiration',
    text: `Cellular respiration is a metabolic pathway that breaks down glucose and produces ATP. The stages of cellular respiration include glycolysis, pyruvate oxidation, the citric acid (Krebs) cycle, and oxidative phosphorylation.
- Glycolysis occurs in the cytoplasm and does not require oxygen (anaerobic). It converts 1 glucose molecule into 2 pyruvate molecules, yielding a net 2 ATP and 2 NADH.
- Pyruvate oxidation transitions pyruvate into Acetyl-CoA inside the mitochondrial matrix, releasing CO2.
- The Krebs Cycle takes place in the mitochondrial matrix, producing ATP, NADH, and FADH2 while releasing CO2 as a byproduct.
- Oxidative phosphorylation occurs across the inner mitochondrial membrane (cristae). It consists of the electron transport chain (ETC) and chemiosmosis via ATP synthase. Oxygen acts as the final electron acceptor, combining with protons to form water (H2O). It yields the majority of cellular ATP (approximately 28-34 ATP).`,
  },
  {
    topic: 'Economics: Supply, Demand & Elasticity',
    text: `Price Elasticity of Demand (PED) measures the responsiveness of the quantity demanded of a good to a change in its price.
Formula: PED = (% change in quantity demanded) / (% change in price).
- If PED > 1, demand is elastic; consumers are highly sensitive to price changes (luxuries, goods with many close substitutes).
- If PED < 1, demand is inelastic; consumers are relatively insensitive to price changes (necessities like insulin, utilities, tap water).
- If PED = 1, demand is unit elastic; total revenue remains unchanged when price changes.
- If demand is inelastic, increasing the price causes total revenue to rise because the percentage drop in quantity demanded is smaller than the percentage price increase.
- If demand is elastic, increasing the price causes total revenue to fall.`,
  },
  {
    topic: 'Computer Science: Big-O & Hash Tables',
    text: `A hash table is a data structure that implements an associative array abstract data type, mapping keys to values using a hash function.
- In the average case, search, insert, and delete operations take O(1) constant time.
- In the worst case (when all keys collide into the same bucket), search time degrades to O(n) linear time.
- Common collision resolution strategies include separate chaining (storing colliding elements in linked lists or self-balancing trees at each index) and open addressing (such as linear probing, quadratic probing, and double hashing).
- The load factor alpha is defined as n / k, where n is the number of stored entries and k is the number of buckets. When the load factor exceeds a threshold (typically 0.7 to 0.75), dynamic resizing and rehashing is triggered to maintain O(1) performance.`,
  },
];

export default function App() {
  const [notes, setNotes] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emptyNotesWarning, setEmptyNotesWarning] = useState(false);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);

  // Student answer state: questionId -> selectedOptionIndex (0..3)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  const quizResultsRef = useRef<HTMLDivElement>(null);

  const handleGenerateQuiz = async () => {
    // Validate study notes
    if (!notes.trim()) {
      setEmptyNotesWarning(true);
      setErrorMessage('Please enter your study notes below before generating a quiz.');
      if (notesInputRef.current) {
        notesInputRef.current.focus();
      }
      return;
    }

    setEmptyNotesWarning(false);
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes.trim(),
          questionCount: Math.min(Math.max(questionCount, 1), 5),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz. Please check your notes.');
      }

      setQuiz(data);
      setUserAnswers({});
      setSubmitted(false);

      // Smooth scroll to the generated quiz
      setTimeout(() => {
        quizResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while generating the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (submitted) return; // Prevent changing after submission until reset
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleCheckAnswers = () => {
    setSubmitted(true);
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });
    const total = quiz.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  };

  const handleCopyAnswerKey = () => {
    if (!quiz) return;
    const text = quiz.questions
      .map(
        (q) =>
          `Q${q.id}: ${q.question}\nCorrect Answer: (${q.correctLetter}) ${q.options[q.correctOptionIndex]}\nExplanation: ${q.explanation}\n`
      )
      .join('\n');

    navigator.clipboard.writeText(`Quiz: ${quiz.title}\n\nANSWER KEY & EXPLANATIONS:\n\n${text}`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const score = calculateScore();
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Academic Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                QuizCrafter
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-1">
                University Practice Quiz Generator
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Intro Guidance */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Transform your lecture notes into instant practice quizzes
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paste your course notes, textbook readings, or study guides below. Choose how many questions you want (1 to 5), and generate multiple-choice questions complete with answer options and thorough explanations.
              </p>
            </div>
          </div>

          {/* Quick Sample Notes for Students */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Or load sample university notes:
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_NOTES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNotes(sample.text);
                    setEmptyNotesWarning(false);
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-500" />
                  <span>{sample.topic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Study Notes Textarea */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="study-notes"
                className="block text-sm font-semibold text-slate-800"
              >
                Study Notes <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{notes.trim().split(/\s+/).filter(Boolean).length} words</span>
                {notes && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotes('');
                      setEmptyNotesWarning(false);
                      setErrorMessage(null);
                    }}
                    className="text-slate-500 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                  >
                    Clear notes
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="study-notes"
              ref={notesInputRef}
              rows={7}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (emptyNotesWarning && e.target.value.trim()) {
                  setEmptyNotesWarning(false);
                  setErrorMessage(null);
                }
              }}
              placeholder="Paste your study notes, lecture summary, or textbook chapter here... (e.g., cell biology, Keynesian economics, data structures, history of constitutional law)"
              className={`w-full rounded-xl border p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                emptyNotesWarning
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-300 focus:border-rose-500'
                  : 'border-slate-300 bg-white focus:ring-indigo-200 focus:border-indigo-600'
              }`}
            />

            {/* Empty Notes Warning Prompt */}
            {emptyNotesWarning && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Study notes required:</strong> Please enter or paste your study notes in the text box above so Gemini can generate your quiz.
                </span>
              </div>
            )}
          </div>

          {/* Configuration & Action Bar */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Number of questions input (1 to 5) */}
            <div className="space-y-1.5">
              <label
                htmlFor="question-count"
                className="block text-sm font-semibold text-slate-800"
              >
                Number of Questions (1 - 5)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="question-count"
                  type="number"
                  min={1}
                  max={5}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setQuestionCount(Math.min(Math.max(val, 1), 5));
                    }
                  }}
                  className="w-20 px-3 py-2 text-center text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600"
                />

                {/* Quick 1 to 5 pills */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        questionCount === num
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      aria-label={`Set ${num} questions`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Quiz Button */}
            <div>
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Quiz with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* General Error Banner */}
          {errorMessage && !emptyNotesWarning && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to generate quiz</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}
        </section>

        {/* Quiz Display Section */}
        {quiz && (
          <div ref={quizResultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Quiz Banner & Title */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                  <FileQuestion className="w-4 h-4" />
                  <span>Practice Quiz</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {quiz.title || 'Course Notes Practice Quiz'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {quiz.questions.length} Question{quiz.questions.length === 1 ? '' : 's'} • 4 Answer Options Each
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Answers</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {quiz.questions.map((q, qIndex) => {
                const selectedOption = userAnswers[q.id];
                const isAnswered = selectedOption !== undefined;
                const isCorrect = submitted && selectedOption === q.correctOptionIndex;
                const isIncorrect = submitted && isAnswered && !isCorrect;

                return (
                  <div
                    key={q.id || qIndex}
                    className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-4"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                          {qIndex + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Question {qIndex + 1} of {quiz.questions.length}
                        </span>
                      </div>

                      {/* Score feedback icon when submitted */}
                      {submitted && (
                        <div>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Correct</span>
                            </span>
                          ) : isAnswered ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Incorrect</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Unanswered</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Question Text */}
                    <h4 className="text-base font-semibold text-slate-900 leading-relaxed">
                      {q.question}
                    </h4>

                    {/* 4 Answer Options */}
                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      {q.options.map((option, optIdx) => {
                        const isSelected = selectedOption === optIdx;
                        const isThisCorrect = optIdx === q.correctOptionIndex;

                        let optionStyle = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800';
                        let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';

                        if (!submitted) {
                          if (isSelected) {
                            optionStyle = 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600';
                            badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
                          }
                        } else {
                          // Submitted state: reveal correctness
                          if (isThisCorrect) {
                            optionStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500';
                            badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                          } else if (isSelected && !isThisCorrect) {
                            optionStyle = 'border-rose-500 bg-rose-50/70 text-rose-950 ring-1 ring-rose-500 line-through opacity-85';
                            badgeStyle = 'bg-rose-600 text-white border-rose-600';
                          } else {
                            optionStyle = 'border-slate-200 bg-slate-50/40 text-slate-500';
                            badgeStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            disabled={submitted}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optionStyle} ${
                              submitted ? 'cursor-default' : ''
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border ${badgeStyle}`}
                            >
                              {optionLetters[optIdx]}
                            </span>
                            <span className="text-sm leading-snug flex-1 pt-0.5">
                              {option}
                            </span>

                            {submitted && isThisCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                            )}
                            {submitted && isSelected && !isThisCorrect && (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0 self-center" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quiz Interactive Controls / Score Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {!submitted ? (
                  <p className="text-sm text-slate-600">
                    Select your answers above, then click <strong>Check My Answers</strong> to test your retention, or inspect the full answer key below.
                  </p>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-base">
                      {score.percentage}%
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        Score: {score.correct} / {score.total} Correct
                      </p>
                      <p className="text-xs text-slate-500">
                        {score.percentage >= 80
                          ? '🎉 Outstanding mastery of your notes!'
                          : score.percentage >= 60
                          ? '👍 Good attempt! Review the explanations below.'
                          : '📖 Keep studying! Check the detailed explanations below.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!submitted ? (
                  <button
                    type="button"
                    onClick={handleCheckAnswers}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer shadow-xs"
                  >
                    Check My Answers
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
                  >
                    Try Quiz Again
                  </button>
                )}
              </div>
            </div>

            {/* Answer Key & Explanations Section (Explicitly requested by user) */}
            <section className="bg-slate-900 text-slate-100 rounded-2xl p-6 md:p-8 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <ListOrdered className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Answer Key & Detailed Explanations
                    </h3>
                    <p className="text-xs text-slate-400">
                      Master the key concepts directly from your entered study notes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAnswerKey}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Answer Key</span>
                    </>
                  )}
                </button>
              </div>

              {/* Explanations List */}
              <div className="space-y-6">
                {quiz.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-sm font-bold text-indigo-300">
                        Question {idx + 1}
                      </h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        Correct: Option {q.correctLetter}
                      </span>
                    </div>

                    {/* Question text recap */}
                    <p className="text-xs text-slate-300 font-medium italic">
                      "{q.question}"
                    </p>

                    {/* Correct Option Display */}
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs flex items-start gap-2">
                      <span className="font-bold text-emerald-400 shrink-0">
                        ({q.correctLetter})
                      </span>
                      <span className="font-medium">
                        {q.options[q.correctOptionIndex]}
                      </span>
                    </div>

                    {/* Explanation */}
                    <div className="flex items-start gap-2.5 pt-1 text-slate-300 text-xs leading-relaxed">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-100">Explanation: </strong>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          QuizCrafter • Built for university students to test comprehension and exam readiness.
        </p>
      </footer>
    </div>
  );
}
