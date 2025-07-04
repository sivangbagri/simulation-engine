"use client"
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import Link from "next/link"
import { SimulationInput, SimulationOutput, Persona, Survey } from "~~/types/simulation"
import PersonaCard, { PersonaCardSkeleton } from '~~/components/Persona/PersonaCard';
import { useAccount } from "wagmi"
import { SkeletonText, SkeletonBar } from '~~/components/Skeletons/skeleton';



const QuestionSkeleton = () => (
    <div className="space-y-4">
        <SkeletonText width="70%" height="h-6" />
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                        <SkeletonText width="40%" />
                        <SkeletonText width="20%" />
                    </div>
                    <SkeletonBar />
                </div>
            ))}
        </div>
    </div>
);

// Survey processing function
function processSurveyResults(surveyJSON: Survey, backendResults: SimulationOutput): Survey {
    // deep copy of the survey to avoid mutating the original
    const processedSurvey: Survey = JSON.parse(JSON.stringify(surveyJSON));

    const totalResponses = backendResults.results.length;

    const optionCounts: Record<string, number> = {};

    processedSurvey.questions.forEach((question) => {
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
    const [parsedSurvey, setParsedSurvey] = useState<Survey | null>(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [niche, setNiche] = useState("")
    const [rewardsProcessed, setRewardsProcessed] = useState(false) // Track if rewards have been processed
    const { address: connectedAddress } = useAccount();

    const { data: hasPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "hasPersona",
        args: [connectedAddress],
    });
    // Process survey data with results
    const processedSurveyData = useMemo(() => {
        if (!parsedSurvey || !results) {
            return null;
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

    const { data: allPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getAllPersonas"
    })

    const reward = async (personas: Persona[]) => {
        try {
            console.log("Processing rewards for personas:", personas);
            const response = await fetch('/api/reward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participants: personas.map(p => ({
                        address: p.address,
                        name: p.basic_info.username || 'Unknown',
                        niche: p.niche
                    })),
                    rewardAmount: 10
                })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                // console.log("✅ Rewards processed successfully:", result);

                setRewardsProcessed(true);
            } else {
                console.error("❌ Reward processing failed:", result);

            }

        } catch (error) {
            console.error("❌ Error rewarding personas:", error);
        }
    };


    useEffect(() => {
        console.log("from contract", (allPersona?.[1]));

        if (allPersona) {
            try {
                const parsedPersonas = allPersona[1].map((p: string) => (JSON.parse(p)));
                console.log("parsedPersonas ", parsedPersonas)
                const filteredPersonas = parsedPersonas.filter((persona: Persona) => persona.niche === niche);
                setAllPersonas(filteredPersonas);
            } catch (error) {
                console.error('Failed to parse personas from contract:', error);
            }
        }
        else {
            console.log("not found from contract")
        }
    }, [allPersona, niche]);

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
                console.log("niche= ", parsedSurveyData.niche)
                setNiche(parsedSurveyData.niche.toLowerCase())
                console.log("parsed in useeffect ", parsedSurveyData)
                setParsedSurvey(parsedSurveyData);
                sessionStorage.removeItem('surveyJSON');
            } catch (error) {
                console.error('Failed to parse stored state:', error);
            }
        }
        else {
            console.log("no storedstate")
        }
        setInitialLoading(false);
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

    // Process rewards after simulation is complete and we have personas
    useEffect(() => {
        if (results && allPersonas.length > 0 && !rewardsProcessed) {
            console.log("Processing rewards for", allPersonas.length, "personas");
            reward(allPersonas);
        }
    }, [results, allPersonas, rewardsProcessed]);

    console.log("results ", results)
    console.log("processed survey data ", processedSurveyData)

    // Show loading state while initial data is being loaded
    if (initialLoading) {
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
                        {/* Loading skeleton */}
                        <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
                            <SkeletonText width="60%" height="h-6" />
                            <div className="mt-2 mb-4">
                                <SkeletonText width="80%" />
                            </div>
                            <SkeletonText width="30%" height="h-8" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-10 mx-auto">
                    <div className=''>
                        <h1 className="text-3xl font-bold">Survey Results</h1>
                        <p className="text-neutral-400">View responses and participants</p>
                    </div>
                    <Link href="/">
                        <button className="cursor-pointer px-4 py-2 border border-neutral-600 rounded-xl hover:bg-neutral-800 transition-colors">
                            Back to Home
                        </button>
                    </Link>
                </div>

                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Survey Info */}
                    <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-700">
                        {parsedSurvey ? (
                            <>
                                <h2 className="text-xl font-semibold mb-2">{parsedSurvey.title}</h2>
                                <p className="text-neutral-400 mb-4">{parsedSurvey.description}</p>
                                <span className="inline-block px-3 py-1 bg-neutral-700 rounded-full text-sm text-neutral-300">
                                    {processedSurveyData?.responses || 0} responses
                                </span>
                            </>
                        ) : (
                            <>
                                <SkeletonText width="60%" height="h-6" />
                                <div className="mt-2 mb-4">
                                    <SkeletonText width="80%" />
                                </div>
                                <SkeletonText width="30%" height="h-8" />
                            </>
                        )}

                        {loading && (
                            <div className="mt-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {/* <span className="text-sm text-neutral-400">Processing survey results...</span> */}

                                    <div className="text-xs text-neutral-500 italic overflow-hidden h-4">
                                        <div
                                            className="transition-transform duration-500 ease-in-out"
                                            style={{
                                                transform: `translateY(-${(Math.floor(Date.now() / 100) % 8) * 16}px)`

                                            }}
                                        >
                                            {[
                                                " Did you know? Mario was originally called 'Jumpman'",
                                                " Did you know? Pac-Man was inspired by a pizza with a missing slice",
                                                " Did you know? The average gamer is 34 years old",
                                                " Did you know? Tetris has been played by over 520 million people",
                                                " Did you know? Space Invaders caused a coin shortage in Japan",
                                                " Did you know? The first video game was created in 1958",
                                                " Did you know? Minecraft is the best-selling game of all time",
                                                " Did you know? World of Warcraft players have played over 10 million years collectively"
                                            ].map((fact, index) => (
                                                <div key={index} className="h-4 flex items-center font-semibold">
                                                    {fact}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Responses */}
                    <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-700">
                        <h2 className="text-xl font-semibold mb-6">Responses</h2>
                        <div className="space-y-8">
                            {processedSurveyData ? (
                                processedSurveyData.questions.map((question, index) => (
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
                                                    <div className="w-full bg-neutral-700 rounded-full h-3">
                                                        <div
                                                            className="bg-white h-3 rounded-full transition-all duration-300"
                                                            style={{ width: `${option.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : loading ? (
                                <>
                                    <QuestionSkeleton />
                                    <QuestionSkeleton />
                                </>
                            ) : (
                                // Show message when no data
                                <div className="text-center py-8">
                                    <p className="text-neutral-400">No survey data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Participants */}
                    <div className='bg-neutral-900/50 rounded-2xl p-6 border border-neutral-700' >
                        <div className="flex items-baseline justify-between">
                            <h2 className="text-xl  font-semibold mb-6">Participants</h2>
                            <p className="text-neutral-400 text-md"> {niche.charAt(0).toUpperCase() + niche.slice(1)} ({allPersonas.length})</p>
                        </div>


                        {parsedSurvey && (


                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 ">
                                {!hasPersona && <PersonaCardSkeleton />}
                                {allPersonas.length > 0 ? (
                                    allPersonas.map((persona: Persona) => (
                                        <PersonaCard key={persona.address} data={persona} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-neutral-400">No gaming participants yet</p>
                                    </div>
                                )}
                            </div>

                        )}

                        {!parsedSurvey && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-neutral-700 rounded-lg p-4 animate-pulse">
                                        <SkeletonText width="40%" height="h-5" />
                                        <div className="mt-2">
                                            <SkeletonText width="60%" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>

    )
}

export default Result

