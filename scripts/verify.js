const hre = require("hardhat");

async function main() {
  const contractAddress = "0x327131e8803395ed203c30dbc1ed3898f9fca038"; // Replace with your deployed contract address
  const constructorArgs = ["0x914d9eC7EAA76b2bCfe0aF364304De9D8ce8c0B3"]; // Replace with your constructor arguments

  // Specify the exact contract source file and contract name as shown in the error message
  const contractPath = "contracts/Goat.sol:Goat"; // Adjust this to the correct path if different

  console.log("Verifying contract...");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      contract: contractPath,
    });
    console.log("Verification successful!");
  } catch (error) {
    console.error("Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
