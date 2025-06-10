"use client"
import React, { useEffect } from 'react'
import { useAccount } from "wagmi"
import PersonaCard from '~~/components/Persona/PersonaCard';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Profile: React.FC = () => {

    const { address: connectedAddress } = useAccount();
    const { data: currentPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getPersona",
        args: [connectedAddress],
    });
    return (
        <>
            {currentPersona && <PersonaCard data={JSON.parse(currentPersona)} />}
        </>
    )




}

export default Profile;