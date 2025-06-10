"use client"
import React from 'react'
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Result: React.FC = () => {

    const { data: allPersona } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getAllPersonas"
    })
    if(allPersona) console.log(allPersona[1])
    return (
        <div>

        </div>
    )
}

export default Result
