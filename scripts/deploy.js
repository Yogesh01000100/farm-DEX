const { ethers } = require("hardhat");
const fs = require("fs/promises");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("100000");

  console.log("Token address:", token.address);

  const DEX = await ethers.getContractFactory("DEX");
  const dex = await DEX.deploy(token.address);
  console.log("DEX address:", dex.address);


  const Farmer=await ethers.getContractFactory("FarmerRegistration");
  const farmer=await Farmer.deploy();
  console.log("FarmerRegistration address:", farmer.address);


  console.log("Writing deployment info to JSON files...");

  await writeDeploymentInfo(token, "token.json");
  await writeDeploymentInfo(dex, "dex.json");
  await writeDeploymentInfo(farmer, "farmerRegistration.json");

  console.log("Deployment completed!");
}

async function writeDeploymentInfo(contract, filename = "") {
  const data = {
    network: ethers.provider.network.name,
    contract: {
      address: contract.address,
      signerAddress: contract.signer.address,
      abi: contract.interface.format(),
    },
  };

  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filename, content, { encoding: "utf-8" });
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
