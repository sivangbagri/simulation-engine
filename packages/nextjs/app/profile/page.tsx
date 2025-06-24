"use client"
import React from 'react'
import { useAccount } from "wagmi"
import PersonaCard from '~~/components/Persona/PersonaCard';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import Tilt from "react-parallax-tilt";
import Link from 'next/link';

const Profile: React.FC = () => {

    const { address: connectedAddress } = useAccount();
    const { data: currentPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getPersona",
        args: [connectedAddress],
    });
    const { data: hasPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "hasPersona",
        args: [connectedAddress],
    });
     
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 py-16 px-6 flex flex-col items-center justify-center ">
            <div className="space-y-4 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {!hasPersona && "Ready to be a part of Zapp ?"}
                </h1>
                {/* <p className="text-neutral-400 text-lg md:text-xl">
                    {hasPersona
                        ? "Review your persona below and continue with your survey."
                        : "To begin, create your persona so we can personalize your experience."}
                </p> */}
            </div>

            {!hasPersona ? (
                <Link href="/upload">
                    <button className="cursor-pointer mt-7 px-6 py-3 bg-white text-black hover:bg-neutral-200 transition-colors duration-200 rounded-lg font-semibold shadow-lg focus:outline-none">
                        Create Your Persona
                    </button>
                </Link>
            ) : (
                currentPersona && (
                    <Tilt>
                        <PersonaCard data={JSON.parse(currentPersona)} />
                    </Tilt>
                )
            )}
        </div>

    )


    //

}
export default Profile;