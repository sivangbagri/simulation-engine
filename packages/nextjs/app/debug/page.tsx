import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import Protected from "~~/components/Protected";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});
const Debug: NextPage = () => {
  return (
    <Protected>
      <>
        <DebugContracts />
        <div className="text-center mt-8 bg-secondary p-10">
          <h1 className="text-4xl my-0">Debug Contracts</h1>
          <p className="text-neutral">
            You can debug & interact with your deployed contracts here.
            <br /> Check{" "}
            <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem] px-1">
              packages / nextjs / app / debug / page.tsx
            </code>{" "}
          </p>
        </div>
      </>
    </Protected>
  );
};

export default Debug;
