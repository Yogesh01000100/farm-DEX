const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dexContract;
  let tokenContract;
  let owner;
  let farmer;

  const day = 1;
  const soilHealth = 90;
  const irrigationType = 1;
  const sapAnalysisData = 40;
  const droneImageData = 0;
  const nutrientSamplingData = 80;

  before(async function () {
    // Deploy the token contract (assuming ERC20 implementation)
    const Token = await ethers.getContractFactory("Token");
    tokenContract = await Token.deploy();

    [owner, farmer] = await ethers.getSigners();

    // Deploy the DEX contract with the token address as an argument
    const DEX = await ethers.getContractFactory("DEX");
    dexContract = await DEX.deploy(tokenContract.address);

    // Set the token address in the DEX contract
    await dexContract.setTokenAddress(tokenContract.address);

    // Mint tokens to the owner
    await tokenContract.mint(owner.address, 100);
  });

  it("should allow the owner to sell tokens", async function () {
    // Approve the DEX contract to transfer tokens on behalf of the owner
    await tokenContract.approve(dexContract.address, 100);

    // Sell tokens
    await dexContract.sell();

    // Check the token balance of the DEX contract
    const tokenBalance = await tokenContract.balanceOf(dexContract.address);
    expect(tokenBalance).to.equal(100);
  });

  it("should allow the owner to withdraw tokens", async function () {
    // Withdraw tokens from the DEX contract
    await dexContract.withdrawTokens();

    // Check the token balance of the owner
    const ownerTokenBalance = await tokenContract.balanceOf(owner.address);
    expect(ownerTokenBalance).to.equal(100);
  });

  it("should allow the owner to withdraw funds", async function () {
    // Withdraw funds from the DEX contract
    await dexContract.withdrawFunds();

    // Check the balance of the owner
    const ownerBalance = await ethers.provider.getBalance(owner.address);
    expect(ownerBalance).to.be.above(0);
  });

  it("should set harvest duration for the farmer", async function () {
    // Set the harvest duration for the farmer
    await dexContract.connect(farmer).setHarvestDuration(5);

    // Check the harvest duration for the farmer
    const harvestDuration = await dexContract.harvestDurations(farmer.address);
    expect(harvestDuration).to.equal(5);
  });

  it("should submit data from the farmer", async function () {
    // Submit data from the farmer
    await dexContract.connect(farmer).submitData(
      day,
      soilHealth,
      irrigationType,
      sapAnalysisData,
      droneImageData,
      nutrientSamplingData
    );

    // Check the submitted data
    const data = await dexContract.farmerData(farmer.address, day);
    expect(data.timestamp).to.be.above(0);
    expect(data.soilHealth).to.equal(soilHealth);
    expect(data.irrigationType).to.equal(irrigationType);
    expect(data.sapAnalysisData).to.equal(sapAnalysisData);
    expect(data.droneImageData).to.equal(droneImageData);
    expect(data.nutrientSamplingData).to.equal(nutrientSamplingData);
  });

  it("should validate the submitted data", async function () {
    // Validate the submitted data
    await dexContract.validateData(farmer.address, day);

    // Check the validation status
    const data = await dexContract.farmerData(farmer.address, day);
    expect(data.validated).to.equal(true);
    expect(data.meetsSustainableCriteria).to.equal(true);
  });

  it("should allow the farmer to claim tokens", async function () {
    // Claim tokens for the farmer
    await dexContract.connect(farmer).claim();

    // Check the token balance of the farmer
    const farmerTokenBalance = await tokenContract.balanceOf(farmer.address);
    expect(farmerTokenBalance).to.equal(10);
  });
});
