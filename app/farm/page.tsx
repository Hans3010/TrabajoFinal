"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function FarmPage() {
  const { address: connectedAddress } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Read contract states
  const { data: lpBalance } = useScaffoldReadContract({
    contractName: "LPToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: dappBalance } = useScaffoldReadContract({
    contractName: "DAppToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: stakingBalance } = useScaffoldReadContract({
    contractName: "TokenFarm",
    functionName: "stakingBalance",
    args: [connectedAddress],
  });

  const { data: pendingRewards } = useScaffoldReadContract({
    contractName: "TokenFarm",
    functionName: "pendingRewards",
    args: [connectedAddress],
  });

  const { data: totalStaking } = useScaffoldReadContract({
    contractName: "TokenFarm",
    functionName: "totalStakingBalance",
  });

  const { data: isStaking } = useScaffoldReadContract({
    contractName: "TokenFarm",
    functionName: "isStaking",
    args: [connectedAddress],
  });

  const { data: allowance } = useScaffoldReadContract({
    contractName: "LPToken",
    functionName: "allowance",
    args: [connectedAddress, "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"], // TokenFarm address
  });

  // Write functions
  const { writeContractAsync: approveLP } = useScaffoldWriteContract("LPToken");
  const { writeContractAsync: deposit } = useScaffoldWriteContract("TokenFarm");
  const { writeContractAsync: withdraw } = useScaffoldWriteContract("TokenFarm");
  const { writeContractAsync: claimRewards } = useScaffoldWriteContract("TokenFarm");
  const { writeContractAsync: mintLP } = useScaffoldWriteContract("LPToken");

  const handleMintLP = async () => {
    try {
      setIsLoading(true);
      const mintAmount = parseEther("1000");
      await mintLP({
        functionName: "mint",
        args: [connectedAddress, mintAmount],
      });
      notification.success("1000 LP tokens minted successfully!");
    } catch (error) {
      console.error("Error minting LP tokens:", error);
      notification.error("Failed to mint LP tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      const amount = parseEther(stakeAmount);
      await approveLP({
        functionName: "approve",
        args: ["0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", amount],
      });
      notification.success("LP tokens approved successfully!");
    } catch (error) {
      console.error("Error approving LP tokens:", error);
      notification.error("Failed to approve LP tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    try {
      setIsLoading(true);
      const amount = parseEther(stakeAmount);
      await deposit({
        functionName: "deposit",
        args: [amount],
      });
      notification.success("LP tokens staked successfully!");
      setStakeAmount("");
    } catch (error) {
      console.error("Error staking LP tokens:", error);
      notification.error("Failed to stake LP tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      await withdraw({
        functionName: "withdraw",
      });
      notification.success("LP tokens withdrawn successfully!");
    } catch (error) {
      console.error("Error withdrawing LP tokens:", error);
      notification.error("Failed to withdraw LP tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      setIsLoading(true);
      await claimRewards({
        functionName: "claimRewards",
      });
      notification.success("Rewards claimed successfully!");
    } catch (error) {
      console.error("Error claiming rewards:", error);
      notification.error("Failed to claim rewards");
    } finally {
      setIsLoading(false);
    }
  };

  const isApprovalNeeded = () => {
    if (!stakeAmount || !allowance) return false;
    return parseEther(stakeAmount) > allowance;
  };

  const canStake = () => {
    if (!stakeAmount || !lpBalance) return false;
    return parseEther(stakeAmount) <= lpBalance && !isApprovalNeeded();
  };

  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🚜 Token Farm</h1>
          <p className="text-lg">Please connect your wallet to use the Token Farm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">🚜 Token Farm</h1>
      
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">LP Token Balance</div>
          <div className="stat-value text-primary">
            {lpBalance ? formatEther(lpBalance) : "0"}
          </div>
          <div className="stat-desc">LPT</div>
        </div>
        
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">DAPP Token Balance</div>
          <div className="stat-value text-secondary">
            {dappBalance ? formatEther(dappBalance) : "0"}
          </div>
          <div className="stat-desc">DAPP</div>
        </div>
        
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Your Staking</div>
          <div className="stat-value text-accent">
            {stakingBalance ? formatEther(stakingBalance) : "0"}
          </div>
          <div className="stat-desc">LPT Staked</div>
        </div>
        
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Pending Rewards</div>
          <div className="stat-value text-warning">
            {pendingRewards ? formatEther(pendingRewards) : "0"}
          </div>
          <div className="stat-desc">DAPP</div>
        </div>
      </div>

      {/* Total Staking Info */}
      <div className="alert alert-info mb-8">
        <div>
          <h3 className="font-bold">Total Staking Pool</h3>
          <div className="text-xs">
            {totalStaking ? formatEther(totalStaking) : "0"} LPT total staked
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Get LP Tokens */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">💰 Get LP Tokens</h2>
            <p>Need LP tokens to stake? Mint some for testing!</p>
            <div className="card-actions justify-end">
              <button 
                className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                onClick={handleMintLP}
                disabled={isLoading}
              >
                Mint 1000 LPT
              </button>
            </div>
          </div>
        </div>

        {/* Staking */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">📈 Stake LP Tokens</h2>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Amount to stake</span>
                <span className="label-text-alt">
                  Max: {lpBalance ? formatEther(lpBalance) : "0"} LPT
                </span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered w-full"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="card-actions justify-end mt-4">
              {isApprovalNeeded() ? (
                <button 
                  className={`btn btn-warning ${isLoading ? "loading" : ""}`}
                  onClick={handleApprove}
                  disabled={isLoading || !stakeAmount}
                >
                  Approve LPT
                </button>
              ) : (
                <button 
                  className={`btn btn-success ${isLoading ? "loading" : ""}`}
                  onClick={handleStake}
                  disabled={isLoading || !canStake()}
                >
                  Stake LPT
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">💎 Claim Rewards</h2>
            <p>
              Pending rewards: <strong>{pendingRewards ? formatEther(pendingRewards) : "0"} DAPP</strong>
            </p>
            <div className="card-actions justify-end">
              <button 
                className={`btn btn-accent ${isLoading ? "loading" : ""}`}
                onClick={handleClaimRewards}
                disabled={isLoading || !pendingRewards || pendingRewards === 0n}
              >
                Claim Rewards
              </button>
            </div>
          </div>
        </div>

        {/* Withdraw */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">📉 Withdraw</h2>
            <p>
              Currently staking: <strong>{stakingBalance ? formatEther(stakingBalance) : "0"} LPT</strong>
            </p>
            <div className="card-actions justify-end">
              <button 
                className={`btn btn-error ${isLoading ? "loading" : ""}`}
                onClick={handleWithdraw}
                disabled={isLoading || !isStaking || !stakingBalance || stakingBalance === 0n}
              >
                Withdraw All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📋 How it works</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Mint LP Tokens:</strong> Get LP tokens for testing purposes</li>
            <li><strong>Approve:</strong> Allow the farm contract to spend your LP tokens</li>
            <li><strong>Stake:</strong> Deposit LP tokens to start earning rewards</li>
            <li><strong>Earn:</strong> Accumulate DAPP token rewards over time (1 DAPP per block total, distributed proportionally)</li>
            <li><strong>Claim:</strong> Collect your earned DAPP token rewards</li>
            <li><strong>Withdraw:</strong> Remove your LP tokens from staking (rewards are calculated before withdrawal)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
