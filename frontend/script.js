const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;

const tokenAbi = [
  "constructor(uint256 initialSupply)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)",
  "function increaseAllowance(address spender, uint256 addedValue) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];
const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let tokenContract = null;

const dexAbi = [
  "constructor(address _token)",
      "event DataSubmitted(address indexed farmer, uint256 indexed day, uint256 soilHealth, uint256 irrigationType, uint256 sapAnalysisData, uint256 droneImageData, uint256 nutrientSamplingData)",
      "event DataValidated(address indexed farmer, uint256 indexed day, bool meetsSustainableCriteria)",
      "function associatedToken() view returns (address)",
      "function claim(uint256 day) payable",
      "function farmerData(address, uint256) view returns (uint256 timestamp, uint256 soilHealth, uint256 irrigationType, uint256 sapAnalysisData, uint256 droneImageData, uint256 nutrientSamplingData, bool validated, bool meetsSustainableCriteria)",
      "function getSubmittedData(address farmer, uint256 day) view returns (uint256 timestamp, uint256 soilHealth, uint256 irrigationType, uint256 sapAnalysisData, uint256 droneImageData, uint256 nutrientSamplingData, bool validated, bool meetsSustainableCriteria)",
      "function getTokenBalance() view returns (uint256)",
      "function harvestDurations(address) view returns (uint256)",
      "function owner() view returns (address)",
      "function sell()",
      "function setHarvestDuration(uint256 duration)",
      "function submitData(uint256 day, uint256 soilHealth, uint256 irrigationType, uint256 sapAnalysisData, uint256 droneImageData, uint256 nutrientSamplingData)",
      "function tokenAmount() view returns (uint256)",
      "function validateSubmittedData(address farmer, uint256 day)",
      "function withdrawFunds()",
      "function withdrawTokens()"
];
const dexAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
let dexContract = null;

const FarmerRegistrationAbi = [
  "event FarmerRegistered(address indexed farmerAddress, string name, uint256 age, string location, string phoneNumber, uint256 registrationDate)",
  "function farmerAddresses(uint256) view returns (address)",
  "function farmers(address) view returns (string name, uint256 age, string location, string phoneNumber, uint256 registrationDate, bool isRegistered)",
  "function getFarmerByAddress(address _farmerAddress) view returns (string, uint256, string, string, uint256, bool)",
  "function getFarmerCount() view returns (uint256)",
  "function registerFarmer(string _name, uint256 _age, string _location, string _phoneNumber)"
];
const FarmerRegistrationAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
let FarmerRegistrationContract = null;



async function getAccess() {
  if (tokenContract) return;
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
  dexContract = new ethers.Contract(dexAddress, dexAbi, signer);
  FarmerRegistrationContract = new ethers.Contract(
    FarmerRegistrationAddress,
    FarmerRegistrationAbi,
    signer
  );
}

async function getPrice() {
  await getAccess();
  const price = await dexContract.getPrice(1);
  document.getElementById("tokenPrice").innerHTML = price;
  return price;
}

async function getTokenBalance() {
  await getAccess();
  const balance = await tokenContract.balanceOf(await signer.getAddress());
  document.getElementById("tokensBalance").innerHTML = balance;
}

async function getAvailableTokens() {
  await getAccess();
  const tokens = await dexContract.getTokenBalance();
  document.getElementById("tokensAvailable").innerHTML = tokens;
}

async function grantAccess() {
  await getAccess();
  const value = document.getElementById("tokenGrant").value;
  await tokenContract
    .approve(dexAddress, value)
    .then(() => alert("success"))
    .catch((error) => alert(error));
}

async function sell() {
  await getAccess(); // Assuming this function handles user authentication

  try {
    await dexContract.sell();
    alert("Success");
  } catch (error) {
    alert(error);
  }
}


async function registerFarmer() {
  const name = document.getElementById("farmerName").value;
  const age = document.getElementById("farmerAge").value;
  const location = document.getElementById("farmerLocation").value;
  const phoneNumber = document.getElementById("farmerPhoneNumber").value;

  try {
      const tx = await FarmerRegistrationContract.registerFarmer(name, age, location, phoneNumber);
      await tx.wait();

      alert("Farmer registered successfully!");
  } catch (error) {
      console.error("Error occurred while registering the farmer:", error);
      alert("Failed to register the farmer. Please try again.");
  }
}


async function getFarmerCount() {
  try {
      const count = await FarmerRegistrationContract.getFarmerCount();
      alert(`Total number of farmers: ${count}`);
  } catch (error) {
      console.error("Error occurred while fetching the farmer count:", error);
      alert("Failed to fetch the farmer count. Please try again.");
  }
}

// Function to get farmer details by address

async function submitData() {
  await getAccess();
  const day = ethers.BigNumber.from(document.getElementById("day").value);
  const soilHealth = ethers.BigNumber.from(document.getElementById("soilHealth").value);
  const irrigationType = ethers.BigNumber.from(document.getElementById("irrigationType").value);
  const sapAnalysisData = ethers.BigNumber.from(document.getElementById("sapAnalysisData").value);
  const droneImageData = ethers.BigNumber.from(document.getElementById("droneImageData").value);
  const nutrientSamplingData = ethers.BigNumber.from(document.getElementById("nutrientSamplingData").value);

  await dexContract
    .submitData(day, soilHealth, irrigationType, sapAnalysisData, droneImageData, nutrientSamplingData)
    .then(() => alert("Success"))
    .catch((error) => alert(error));
}

async function getSubmittedData() {
  const farmerAddress = document.getElementById("farmerAddress_1").value;
  const day = parseInt(document.getElementById("validateDay_1").value);

  try {
    const data = await dexContract.getSubmittedData(farmerAddress, day);

    const timestamp = new Date(data.timestamp * 1000).toLocaleString();

    const alertMessage = `SUBMITTED DATA\n\nTimestamp: ${timestamp}\nSoil Health: ${data.soilHealth}\nIrrigation Type: ${data.irrigationType}\nSap Analysis Data: ${data.sapAnalysisData}\nDrone Image Data: ${data.droneImageData}\nNutrient Sampling Data: ${data.nutrientSamplingData}\nValidated: ${data.validated}\nMeets Sustainable Criteria: ${data.meetsSustainableCriteria}`;

    alert(alertMessage);
  } catch (error) {
    console.error("Error occurred while fetching submitted data:", error);
    alert("Failed to fetch submitted data. Please try again.");
  }
}

async function validateSubmittedData() {
  const farmerAddress = document.getElementById("farmerAddress").value;
  const day = parseInt(document.getElementById("validateDay").value);
  
  try {
    await dexContract.validateSubmittedData(farmerAddress, day);
    alert("Validation done please check the view submit data to check the results");
  } catch (error) {
    console.error("Error occurred while validating submitted data:", error);
    alert("Failed to validate submitted data. Please try again.");
  }
}


async function getFarmerByAddress() {
  const farmerAddress = document.getElementById("farmerAddress").value;

  try {
    const farmer = await FarmerRegistrationContract.getFarmerByAddress(farmerAddress);
    
    // Convert Unix timestamp to milliseconds
    const registrationDateMs = farmer[4] * 1000;
    
    // Create a new Date object using the milliseconds
    const registrationDate = new Date(registrationDateMs);
    
    // Format the date as desired (e.g., "YYYY-MM-DD HH:MM:SS")
    const formattedDate = `${registrationDate.getFullYear()}-${registrationDate.getMonth() + 1}-${registrationDate.getDate()} ${registrationDate.getHours()}:${registrationDate.getMinutes()}:${registrationDate.getSeconds()}`;
    
    alert(`FARMER DETAILS\n\nName: ${farmer[0]}\nAge: ${farmer[1]}\nLocation: ${farmer[2]}\nPhone Number: ${farmer[3]}\nRegistration Date: ${formattedDate}\nIs Registered: ${farmer[5]}`);
  } catch (error) {
    console.error("Error occurred while fetching farmer details:", error);
    alert("Failed to fetch farmer details. Please try again.");
  }
}



async function claim() {
  const day = document.getElementById("claimDay").value;

  try {
    await dexContract.claim(day);
    alert("Tokens claimed successfully");
  } catch (error) {
    console.error("Error occurred while claiming tokens:", error);
    alert("Failed to claim tokens. Please try again.");
  }
}

async function getAccountAddress() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return address;
  }
}

async function setHarvestDuration() {
  await getAccess();
  const duration = document.getElementById("harvestDuration").value;

  await dexContract
    .setHarvestDuration(duration)
    .then(() => alert("Success"))
    .catch((error) => alert(error));
}

window.addEventListener("DOMContentLoaded", async (event) => {
  const accountAddressElement = document.getElementById("accountAddress");
  const accountAddress = await getAccountAddress();
  accountAddressElement.textContent = accountAddress;

  await getAccess();
});