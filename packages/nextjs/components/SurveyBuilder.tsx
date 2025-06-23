
import React, { useState } from 'react';
import { Plus, Trash2, Download, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from "react"
// TypeScript interfaces
interface Option {
    id: string;
    text: string;
}

interface Question {
    id: string;
    text: string;
    options: Option[];
}

interface Survey {
    title: string;
    description: string;
    niche: string;
    questions: Question[];
}

// Generate UUID-like string
const generateId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const SurveyBuilder: React.FC = () => {
    const [survey, setSurvey] = useState<Survey>({
        title: '',
        description: '',
        niche: 'Gaming',
        questions: []
    });

    const router = useRouter();

    const addQuestion = (): void => {
        const newQuestion: Question = {
            id: generateId(),
            text: '',
            options: [
                { id: generateId(), text: '' },
                { id: generateId(), text: '' }
            ]
        };
        setSurvey(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const updateQuestion = (questionId: string, text: string): void => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId ? { ...q, text } : q
            )
        }));
    };

    const deleteQuestion = (questionId: string): void => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== questionId)
        }));
    };

    const updateOption = (questionId: string, optionId: string, text: string): void => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map(opt =>
                            opt.id === optionId ? { ...opt, text } : opt
                        )
                    }
                    : q
            )
        }));
    };

    const addOption = (questionId: string): void => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId && q.options.length < 4
                    ? {
                        ...q,
                        options: [...q.options, { id: generateId(), text: '' }]
                    }
                    : q
            )
        }));
    };

    const deleteOption = (questionId: string, optionId: string): void => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.filter(opt => opt.id !== optionId)
                    }
                    : q
            )
        }));
    };

    const exportSurvey = (): void => {
        const dataStr = JSON.stringify(survey, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${survey.title || 'survey'}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleSubmit = (): void => {
        startTransition(() => {
            sessionStorage.setItem('surveyJSON', JSON.stringify(survey));
            router.push("/result");
        });
    };

    const handleSurveyTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSurvey(prev => ({ ...prev, title: e.target.value }));
    };

    const handleSurveyDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setSurvey(prev => ({ ...prev, description: e.target.value }));
    };

    const handleNicheChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setSurvey(prev => ({ ...prev, niche: e.target.value }));
    };

    const handleQuestionTextChange = (questionId: string) => (e: React.ChangeEvent<HTMLInputElement>): void => {
        updateQuestion(questionId, e.target.value);
    };

    const handleOptionTextChange = (questionId: string, optionId: string) =>
        (e: React.ChangeEvent<HTMLInputElement>): void => {
            updateOption(questionId, optionId, e.target.value);
        };

    const isSubmitDisabled: boolean = !survey.title || survey.questions.length === 0;
    const [isPending, startTransition] = useTransition();

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-4 text-white">Zapp your idea!</h1>
                    <p className="text-neutral-400 text-lg">Validate Instantly. Build with Confidence

                    </p>
                </div>

                {/* Survey Info */}
                <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-neutral-800/50 shadow-xl">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-3 text-neutral-200">Survey Title</label>
                            <input
                                type="text"
                                value={survey.title}
                                onChange={handleSurveyTitleChange}
                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all duration-200 text-neutral-100 placeholder-neutral-500"
                                placeholder="PS5 Rental Marketplace"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3 text-neutral-200">Description</label>
                            <textarea
                                value={survey.description}
                                onChange={handleSurveyDescriptionChange}
                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all duration-200 resize-none text-neutral-100 placeholder-neutral-500"
                                rows={3}
                                placeholder="Enter survey description"
                            />
                        </div>

                        {/* Niche Dropdown */}
                        <div>
                            <label className="block text-sm font-medium mb-3 text-neutral-200">Survey Niche</label>
                            <select
                                value={survey.niche}
                                onChange={handleNicheChange}
                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all duration-200 text-neutral-100"
                            >
                                <option value="Gaming">Gaming</option>

                                <option value="General" disabled>More (coming soon)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-8">
                    {survey.questions.map((question, questionIndex) => (
                        <div key={question.id} className="bg-neutral-900/30 backdrop-blur-sm rounded-xl p-6 border border-neutral-800/30 shadow-lg">
                            <div className="flex items-start justify-between mb-6">
                                <h3 className="text-lg font-medium text-neutral-100">Question {questionIndex + 1}</h3>
                                <button
                                    onClick={() => deleteQuestion(question.id)}
                                    className="cursor-pointer text-neutral-400 hover:text-red-400 transition-colors duration-200 p-1 rounded-md hover:bg-neutral-800/50"
                                    aria-label={`Delete question ${questionIndex + 1}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-3 text-neutral-200">Question Text</label>
                                    <input
                                        type="text"
                                        value={question.text}
                                        onChange={handleQuestionTextChange(question.id)}
                                        className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all duration-200 text-neutral-100 placeholder-neutral-500"
                                        placeholder="What would motivate you to rent a PS5?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3 text-neutral-200">Options</label>
                                    <div className="space-y-3">
                                        {question.options.map((option, optionIndex) => (
                                            <div key={option.id} className="flex items-center space-x-3">
                                                <span className="text-sm text-neutral-400 w-6 h-6 flex items-center justify-center bg-neutral-800/50 rounded-full font-medium">
                                                    {String.fromCharCode(65 + optionIndex)}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={handleOptionTextChange(question.id, option.id)}
                                                    className="flex-1 px-4 py-2.5 bg-neutral-800/30 border border-neutral-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-all duration-200 text-neutral-100 placeholder-neutral-500"
                                                    placeholder={`Option ${optionIndex + 1}`}
                                                />
                                                {question.options.length > 2 && (
                                                    <button
                                                        onClick={() => deleteOption(question.id, option.id)}
                                                        className="cursor-pointer text-neutral-400 hover:text-red-400 transition-colors duration-200 p-1.5 rounded-md hover:bg-neutral-800/50"
                                                        aria-label={`Delete option ${optionIndex + 1}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {question.options.length < 4 && (
                                        <button
                                            onClick={() => addOption(question.id)}
                                            className="cursor-pointer mt-3 text-neutral-400 hover:text-neutral-200 text-sm flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-800/30 transition-all duration-200"
                                        >
                                            <Plus size={16} />
                                            <span>Add option</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Question Button */}
                <div className="mt-8">
                    <button
                        onClick={addQuestion}
                        className="cursor-pointer w-full py-4 bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-700/50 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-neutral-300 hover:text-neutral-100 backdrop-blur-sm"
                    >
                        <Plus size={20} />
                        <span className="font-medium">Add Question</span>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4">
                    {/* <button
                        onClick={exportSurvey}
                        disabled={isSubmitDisabled}
                        className="cursor-pointer flex-1 px-6 py-4 bg-neutral-800/50 hover:bg-neutral-700/50 disabled:bg-neutral-800/30 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-700/50 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-neutral-100 backdrop-blur-sm shadow-lg"
                    >
                        <Download size={20} />
                        <span className="font-medium">Export Survey JSON</span>
                    </button> */}

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled || isPending}
                        className="cursor-pointer flex-1 px-6 py-4 bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg font-medium mb-7"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>Submit Survey</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Preview JSON */}
                {/* {survey.title && (
                    <div className="mt-12">
                        <details className="bg-neutral-900/30 backdrop-blur-sm rounded-xl border border-neutral-800/30 shadow-lg overflow-hidden">
                            <summary className="p-6 cursor-pointer hover:bg-neutral-800/30 transition-all duration-200 text-neutral-200 font-medium">
                                Preview JSON Output
                            </summary>
                            <div className="p-6 border-t border-neutral-800/30 bg-neutral-950/50">
                                <pre className="text-sm text-neutral-300 overflow-x-auto font-mono leading-relaxed">
                                    {JSON.stringify(survey, null, 2)}
                                </pre>
                            </div>
                        </details>
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default SurveyBuilder;
