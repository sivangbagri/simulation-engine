
import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getContract } from 'viem';
import deployedContracts from '~~/contracts/deployedContracts';

import { defineChain } from 'viem';
const CHAIN_ID = 10143 as const;
const targetNetwork = defineChain({
  id: CHAIN_ID,
  name: 'Monad Testnet',
  nativeCurrency: {
    name:'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.RPC_URL!],
    },
    public: {
      http: [process.env.RPC_URL!],
    },
  },
});

const contractData = deployedContracts[CHAIN_ID].Persona;

if (!contractData) {
  throw new Error(`Contract not found for chain ${targetNetwork.id}`);
}

const CONTRACT_ADDRESS = contractData.address as `0x${string}`;
const CONTRACT_ABI = contractData.abi;

export async function POST(request: NextRequest) {
  try {
    const { participants, rewardAmount = 10 } = await request.json();

    if (!participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: 'Invalid participants data' },
        { status: 400 }
      );
    }

    // Validate environment variables
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY as `0x${string}`;
    const rpcUrl = process.env.RPC_URL;

    if (!backendPrivateKey) {
      return NextResponse.json(
        { error: 'Backend private key not configured' },
        { status: 500 }
      );
    }

    // Create account from private key
    const account = privateKeyToAccount(backendPrivateKey);

    // Create clients
    const publicClient = createPublicClient({
      chain: targetNetwork,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: targetNetwork,
      transport: http(rpcUrl),
    });

    // Get contract instance
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    console.log(`Processing rewards for ${participants.length} participants`);

    // Process rewards sequentially to avoid nonce issues
    const results = [];
    for (const participant of participants) {
      try {
        console.log(`Rewarding ${participant.address} with ${rewardAmount} points`);

        const hash = await contract.write.reward([
          participant.address as `0x${string}`,
          BigInt(rewardAmount)
        ]);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        results.push({
          address: participant.address,
          success: true,
          txHash: hash,
          blockNumber: receipt.blockNumber.toString()
        });

        console.log(`✅ Rewarded ${participant.address}: ${hash}`);
      } catch (error: any) {
        console.error(`❌ Failed to reward ${participant.address}:`, error);
        results.push({
          address: participant.address,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Processed ${participants.length} participants`,
      results: {
        successful: successful.length,
        failed: failed.length,
        details: results
      }
    });

  } catch (error: any) {
    console.error('Reward processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process rewards',
        details: error.message
      },
      { status: 500 }
    );
  }
}