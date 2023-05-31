contract FarmerRegistration {
    struct Farmer {
        string name;
        uint age;
        string location;
        string phoneNumber;
        uint registrationDate;
        bool isRegistered;
    }

    mapping(address => Farmer) public farmers;
    address[] public farmerAddresses;

    event FarmerRegistered(address indexed farmerAddress, string name, uint age, string location, string phoneNumber, uint registrationDate);

    function registerFarmer(string memory _name, uint _age, string memory _location, string memory _phoneNumber) public {
        require(!farmers[msg.sender].isRegistered, "Farmer already registered");

        Farmer memory newFarmer = Farmer({
            name: _name,
            age: _age,
            location: _location,
            phoneNumber: _phoneNumber,
            registrationDate: block.timestamp,
            isRegistered: true
        });

        farmers[msg.sender] = newFarmer;
        farmerAddresses.push(msg.sender);

        emit FarmerRegistered(msg.sender, _name, _age, _location, _phoneNumber, block.timestamp);
    }

    function getFarmerCount() public view returns (uint) {
        return farmerAddresses.length;
    }

    function getFarmerByAddress(address _farmerAddress) public view returns (string memory, uint, string memory, string memory, uint, bool) {
        Farmer memory farmer = farmers[_farmerAddress];
        return (farmer.name, farmer.age, farmer.location, farmer.phoneNumber, farmer.registrationDate, farmer.isRegistered);
    }
}