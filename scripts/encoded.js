const { ethers } = require("hardhat");

const args = "0x914d9eC7EAA76b2bCfe0aF364304De9D8ce8c0B3";
const abiCoder = new ethers.utils.AbiCoder();
const abiEncodedArgs = abiCoder.encode(
  ["address"], // Changed to address since you're encoding an Ethereum address
  [args] // Args needs to be in an array
);
console.log("ABI-encoded arguments:", abiEncodedArgs);
