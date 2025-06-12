"use client"
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import Link from "next/link"

import { SimulationInput, SimulationOutput, Persona, Survey } from "~~/types/simulation"
import PersonaCard from '~~/components/Persona/PersonaCard';

// Survey processing function
function processSurveyResults(surveyJSON: Survey, backendResults: SimulationOutput): Survey {
    // Create a deep copy of the survey to avoid mutating the original
    const processedSurvey: Survey = JSON.parse(JSON.stringify(surveyJSON));

    // Get total number of responses
    const totalResponses = backendResults.results.length;

    // Initialize counters for each option
    const optionCounts: Record<string, number> = {};

    // Process each question
    processedSurvey.questions.forEach((question) => {
        // Initialize counters for this question's options
        question.options.forEach((option) => {
            optionCounts[option.id] = 0;
        });

        // Count responses for this question
        backendResults.results.forEach((personaResult) => {
            const response = personaResult.responses.find(
                (r) => r.question_id === question.id
            );
            if (response && optionCounts.hasOwnProperty(response.selected_option_id)) {
                optionCounts[response.selected_option_id]++;
            }
        });

        // Calculate percentages and add to options
        question.options.forEach((option) => {
            const count = optionCounts[option.id];
            const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

            // Add the calculated values to the option
            (option as any).responses = count;
            (option as any).percentage = percentage;
        });
    });

    return processedSurvey;
}

const Result: React.FC = () => {
    const [results, setResults] = useState<SimulationOutput | null>(null);
    const [allPersonas, setAllPersonas] = useState<Persona[]>([])
    const [parsedSurvey, setParsedSurvey] = useState<Survey>(

    )
    const [loading, setLoading] = useState(false)

    // Process survey data with results
    const processedSurveyData = useMemo(() => {
        if (!parsedSurvey || !results) {
            return {
                title: parsedSurvey?.title || "Sample Survey",
                description: parsedSurvey?.description || "Test survey",
                responses: 0,
                questions: parsedSurvey?.questions?.map(q => ({
                    ...q,
                    options: q.options.map(opt => ({
                        ...opt,
                        percentage: 0,
                        responses: 0
                    }))
                })) || []
            };
        }

        const processed = processSurveyResults(parsedSurvey, results);
        return {
            title: processed.title,
            description: processed.description,
            responses: results.results.length,
            questions: processed.questions.map(q => ({
                ...q,
                options: q.options.map(opt => ({
                    text: opt.text,
                    percentage: (opt as any).percentage || 0,
                    responses: (opt as any).responses || 0
                }))
            }))
        };
    }, [parsedSurvey, results]);

    // Keep your existing hardcoded data as fallback
    const surveyData = {
        title: "Product Feedback Survey",
        description: "We'd love to hear your thoughts on our new product features",
        responses: 4,
        questions: [
            {
                id: "1",
                text: "How satisfied are you with our product?",
                options: [
                    { text: "Very Satisfied", percentage: 45, responses: 68 },
                    { text: "Satisfied", percentage: 30, responses: 45 },
                    { text: "Neutral", percentage: 15, responses: 23 },
                    { text: "Dissatisfied", percentage: 10, responses: 14 },
                ],
            },
            {
                id: "2",
                text: "Which feature do you use most?",
                options: [
                    { text: "Dashboard", percentage: 35, responses: 53 },
                    { text: "Analytics", percentage: 25, responses: 38 },
                    { text: "Reports", percentage: 25, responses: 37 },
                    { text: "Settings", percentage: 15, responses: 22 },
                ],
            },
        ],
        participants: [
            { id: "1", name: "John D.", status: "completed" },
            { id: "2", name: "Sarah M.", status: "completed" },
            { id: "3", name: "Mike R.", status: "pending" },
            { id: "4", name: "Emma L.", status: "completed" },
        ],
    }

    const { data: allPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getAllPersonas"
    })

    useEffect(() => {
        console.log("from contract", (allPersona?.[1]));

        if (allPersona) {
            try {
                const parsedPersonas = allPersona[1].map((p: string) => (JSON.parse(p)));
                console.log("parsedPersonas ", parsedPersonas)
                setAllPersonas(parsedPersonas);
            } catch (error) {
                console.error('Failed to parse personas from contract:', error);
            }
        }
        else {
            console.log("not found from contract")
        }
    }, [allPersona]);

    const simulateSurvey = useCallback(async (data: SimulationInput): Promise<SimulationOutput> => {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }, []);

    const handleSimulate = useCallback(async () => {
        if (!parsedSurvey || !allPersonas.length) return;

        setLoading(true);
        console.log("all ", allPersonas)
        console.log("all ques ", parsedSurvey)
        try {
            const result = await simulateSurvey({
                survey: parsedSurvey,
                personas: allPersonas
            });
            setResults(result);

        } catch (error) {
            console.error('Simulation failed:', error);
        } finally {
            setLoading(false);
        }
    }, [parsedSurvey, allPersonas, simulateSurvey]);

    useEffect(() => {
        // Load survey from session storage
        const storedState = sessionStorage.getItem('surveyJSON');
        if (storedState) {
            try {
                const parsedSurveyData = JSON.parse(storedState);
                console.log("patsed in useeffect ", parsedSurveyData)
                setParsedSurvey(parsedSurveyData);
                sessionStorage.removeItem('surveyJSON');
            } catch (error) {
                console.error('Failed to parse stored state:', error);
            }
        }
        else {
            console.log("no storedstate")
        }
    }, []);

    useEffect(() => {
        console.log(parsedSurvey, allPersonas.length, results)
        if (parsedSurvey && allPersonas.length > 0 && !results) {
            console.log("here ", results)
            handleSimulate();
        }
        else {
            console.log("some issue")
        }
    }, [parsedSurvey, allPersonas, handleSimulate, results]);

    // Determine which data to display
    const displayData = results ? processedSurveyData : surveyData;

    console.log("results ", results)
    console.log("processed survey data ", processedSurveyData)

    return (
        <div className="min-h-screen bg-neutral-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">Survey Results</h1>
                        <p className="text-neutral-400">View responses and analytics</p>
                    </div>
                    <Link href="/">
                        <button className="px-4 py-2 border border-neutral-600 rounded-xl hover:bg-neutral-800 transition-colors">
                            Back to Home
                        </button>
                    </Link>
                </div>

                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Survey Info */}
                    <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
                        <h2 className="text-xl font-semibold mb-2">{displayData.title}</h2>
                        <p className="text-neutral-400 mb-4">{displayData.description}</p>
                        <span className="inline-block px-3 py-1 bg-neutral-700 rounded-full text-sm text-neutral-300">
                            {displayData.responses} responses
                        </span>
                        {loading && (
                            <div className="mt-4 flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="text-sm text-neutral-400">Processing survey results...</span>
                            </div>
                        )}
                    </div>

                    {/* Responses */}
                    <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
                        <h2 className="text-xl font-semibold mb-6">Responses</h2>
                        <div className="space-y-8">
                            {displayData.questions.map((question, index) => (
                                <div key={question.id || index}>
                                    <h3 className="font-semibold text-lg mb-4">
                                        Question {index + 1}: {question.text}
                                    </h3>
                                    <div className="space-y-3">
                                        {question.options.map((option, optionIndex) => (
                                            <div key={optionIndex} className="space-y-2">
                                                <div className="flex justify-between text-sm text-neutral-300">
                                                    <span>{option.text}</span>
                                                    <span className="text-neutral-500">
                                                        {option.percentage}% ({option.responses} responses)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-700 rounded-full h-2">
                                                    <div
                                                        className="bg-white h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${option.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
                        <h2 className="text-xl font-semibold mb-6">Participants</h2>
                        {allPersonas?.map((persona: Persona) => (
                            <PersonaCard key={persona.address} data={persona} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Result