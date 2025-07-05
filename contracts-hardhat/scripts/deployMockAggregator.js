const hre = require("hardhat");

async function main() {
  const MockAggregatorV3 = await hre.ethers.getContractFactory("MockAggregatorV3");
  // Deploy with an initial answer (e.g., 2000 * 1e8 for $2000 ETH price with 8 decimals)
  const mockAggregator = await MockAggregatorV3.deploy(200000000000);

  await mockAggregator.waitForDeployment();

  console.log(`MockAggregatorV3 deployed to: ${await mockAggregator.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
