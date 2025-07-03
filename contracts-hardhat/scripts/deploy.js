// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");

async function main() {
  // Default merkle root if not provided in environment
  const defaultMerkleRoot =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const merkleRoot = process.env.MERKLE_ROOT || defaultMerkleRoot;

  console.log("Deploying ProofChainMultiTokenVoting contract...");
  console.log(`Using merkle root: ${merkleRoot}`);

  const ProofChain = await hre.ethers.getContractFactory(
    "ProofChainMultiTokenVoting"
  );
  const proofChain = await ProofChain.deploy(merkleRoot);

  await proofChain.deployed();

  console.log(`ProofChainMultiTokenVoting deployed to: ${proofChain.address}`);
  console.log("Contract deployment completed successfully!");

  // Log deployment information for verification
  console.log("\nTo verify on Etherscan:");
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${proofChain.address} "${merkleRoot}"`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
