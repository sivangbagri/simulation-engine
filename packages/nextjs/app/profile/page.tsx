"use client"
import React, { useEffect } from 'react'
import { useAccount } from "wagmi"
import PersonaCard from '~~/components/Persona/PersonaCard';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import Tilt from "react-parallax-tilt";

const Profile: React.FC = () => {

    const { address: connectedAddress } = useAccount();
    const { data: currentPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getPersona",
        args: [connectedAddress],
    });
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 py-12 px-6 flex flex-col items-center">


            {currentPersona && <Tilt> <PersonaCard data={JSON.parse(currentPersona)} /> </Tilt>}
        </div>
    )




}

export default Profile;