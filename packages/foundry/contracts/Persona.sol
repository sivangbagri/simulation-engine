// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Persona {
    address public owner;
    mapping(address => string) public personaJson;
    address[] public userAddresses; // Track all addresses that have set personas
    mapping(address => bool) public hasPersona; // Track which addresses have personas

    event PersonaSet(address indexed user, string json);

    constructor(address _owner) {
        owner = _owner;
    }

    function setPersona(string memory json) public {
        if (!hasPersona[msg.sender]) {
            userAddresses.push(msg.sender);
            hasPersona[msg.sender] = true;
        }
        personaJson[msg.sender] = json;
        emit PersonaSet(msg.sender, json);
    }

    function getPersona(address user) public view returns (string memory) {
        return personaJson[user];
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
    function setPersonaFor(address user, string memory json) public {
        require(msg.sender == owner, "Only owner can set persona for others");
        if (!hasPersona[user]) {
            userAddresses.push(user);
            hasPersona[user] = true;
        }
        personaJson[user] = json;
    }
}
