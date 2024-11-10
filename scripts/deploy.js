// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const marketingWallet = "0x914d9eC7EAA76b2bCfe0aF364304De9D8ce8c0B3";
  const GoatInstance = await hre.ethers.getContractFactory("Goat");
  const Goat = await GoatInstance.deploy(marketingWallet);
  console.log(Goat, "checking iiiii");
  await Goat.deployed();
  console.log(
    `Token deployed to https://testnet.bscscan.com/token/${Goat.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
