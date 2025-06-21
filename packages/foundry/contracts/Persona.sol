// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Persona {
    address public owner;
    mapping(address => string) public personaJson;
    address[] public userAddresses; // Track all addresses that have set personas
    mapping(address => bool) public hasPersona; // Track which addresses have personas
    mapping(address => uint256) public personaPoints;
    event PersonaSet(address indexed user, string json);

    constructor(address _owner) {
        owner = _owner;
    }

    function setPersona(string memory json, uint256 _points) public {
        if (!hasPersona[msg.sender]) {
            userAddresses.push(msg.sender);
            hasPersona[msg.sender] = true;
        }
        personaJson[msg.sender] = json;
        personaPoints[msg.sender] += _points;

        emit PersonaSet(msg.sender, json);
    }

    function getPersona(address user) public view returns (string memory) {
        return personaJson[user];
    }

    function getLeaderboard() public view returns (address[] memory addresses, uint256[] memory points) {
        uint256 count = userAddresses.length;
        points = new uint256[](count);
        for(uint256 i=0; i<count; i++){
            points[i]=personaPoints[userAddresses[i]];

        }
        return (userAddresses, points);
    }

    // Get all personas
    function getAllPersonas()
        public
        view
        returns (address[] memory addresses, string[] memory personas)
    {
        uint256 count = userAddresses.length;
        addresses = new address[](count);
        personas = new string[](count);

        for (uint256 i = 0; i < count; i++) {
            addresses[i] = userAddresses[i];
            personas[i] = personaJson[userAddresses[i]];
        }

        return (addresses, personas);
    }

    // Admin function to set persona for any address (optional)
    function setPersonaFor(
        address user,
        string memory json,
        uint256 _points
    ) public {
        require(msg.sender == owner, "Only owner can set persona for others");
        if (!hasPersona[user]) {
            userAddresses.push(user);
            hasPersona[user] = true;
        }
        personaJson[user] = json;
        personaPoints[user] += _points;
    }


    function reward(address user, uint256 _points ) public{
        personaPoints[user]+=_points;

    }
}
