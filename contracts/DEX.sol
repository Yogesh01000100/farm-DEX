pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {
    IERC20 public associatedToken;
    address public owner;
    uint256 public tokenAmount = 100; // amount of tokens to transfer

    struct HarvestData {
        uint256 timestamp;
        uint256 soilHealth;
        uint256 irrigationType;
        uint256 sapAnalysisData;
        uint256 droneImageData;
        uint256 nutrientSamplingData;
        bool validated;
        bool meetsSustainableCriteria;
    }

    mapping(address => mapping(uint256 => HarvestData)) public farmerData;
    mapping(address => uint256) public harvestDurations;

    event DataSubmitted(
        address indexed farmer,
        uint256 indexed day,
        uint256 soilHealth,
        uint256 irrigationType,
        uint256 sapAnalysisData,
        uint256 droneImageData,
        uint256 nutrientSamplingData
    );
    event DataValidated(
        address indexed farmer,
        uint256 indexed day,
        bool meetsSustainableCriteria
    );

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can perform this action"
        );
        _;
    }

    constructor(address _token) {
        associatedToken = IERC20(_token);
        owner = msg.sender;
    }

    //owner operations
    function sell() external onlyOwner {
        uint256 allowance = associatedToken.allowance(
            msg.sender,
            address(this)
        );
        require(
            allowance > 0,
            "you must allow this contract access to at least one token"
        );
        bool sent = associatedToken.transferFrom(
            msg.sender,
            address(this),
            allowance
        );
        require(sent, "failed to send");
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = associatedToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");

        associatedToken.transfer(msg.sender, balance);
    }

    function withdrawFunds() external onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "Failed to withdraw funds");
    }

    function getTokenBalance() public view returns (uint256) {
        return associatedToken.balanceOf(address(this));
    }

    // farmer operations
    function setHarvestDuration(uint256 duration) external {
        harvestDurations[msg.sender] = duration;
    }

    function submitData(
        uint256 day,
        uint256 soilHealth,
        uint256 irrigationType,
        uint256 sapAnalysisData,
        uint256 droneImageData,
        uint256 nutrientSamplingData
    ) external {
        uint256 harvestDuration = harvestDurations[msg.sender];
        require(
            harvestDuration > 0,
            "Harvest duration not set for this farmer"
        );
        require(day <= harvestDuration, "Invalid day");

        HarvestData storage data = farmerData[msg.sender][day];
        require(data.timestamp == 0, "Data already submitted for this day");

        data.timestamp = block.timestamp;
        data.soilHealth = soilHealth;
        data.irrigationType = irrigationType;
        data.sapAnalysisData = sapAnalysisData;
        data.droneImageData = droneImageData;
        data.nutrientSamplingData = nutrientSamplingData;
        data.validated = false;
        data.meetsSustainableCriteria = false;

        emit DataSubmitted(
            msg.sender,
            day,
            soilHealth,
            irrigationType,
            sapAnalysisData,
            droneImageData,
            nutrientSamplingData
        );
    }

    function getSubmittedData(address farmer, uint256 day)
        external
        view
        returns (
            uint256 timestamp,
            uint256 soilHealth,
            uint256 irrigationType,
            uint256 sapAnalysisData,
            uint256 droneImageData,
            uint256 nutrientSamplingData,
            bool validated,
            bool meetsSustainableCriteria
        )
    {
        HarvestData storage data = farmerData[farmer][day];
        return (
            data.timestamp,
            data.soilHealth,
            data.irrigationType,
            data.sapAnalysisData,
            data.droneImageData,
            data.nutrientSamplingData,
            data.validated,
            data.meetsSustainableCriteria
        );
    }

    //validation functions
    function claim(uint256 day) public payable {
        HarvestData storage data = farmerData[msg.sender][day];
        require(data.timestamp != 0, "Data not submitted for this day");
        require(
            data.meetsSustainableCriteria,
            "Data does not meet sustainable criteria"
        );

        associatedToken.transfer(msg.sender, tokenAmount);
    }

    function validateSubmittedData(address farmer, uint256 day) external {
        HarvestData storage data = farmerData[farmer][day];
        require(data.timestamp != 0, "Data not submitted for this day");

        bool meetsCriteria = checkSustainableCriteria(data);
        data.validated = true;
        data.meetsSustainableCriteria = meetsCriteria;
    }

    function checkSustainableCriteria(HarvestData storage data)
        internal
        view
        returns (bool)
    {
        // Check if all data parameters meet the defined thresholds
        if (
            data.soilHealth >= 80 &&
            data.irrigationType == 1 && // Assuming 1 represents sustainable irrigation type
            data.sapAnalysisData <= 50 &&
            data.droneImageData == 0 && // Assuming 0 represents absence of negative drone image analysis
            data.nutrientSamplingData <= 100
        ) {
            return true;
        }
        return false;
    }
}
