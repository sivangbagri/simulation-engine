// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Persona {
    address public owner;
    mapping(address => string) public personaJson;
    event PersonaSet(address indexed user, string json);

    constructor(address _owner) {
        owner = _owner;
    }

    function setPersona(string memory json) public {
        personaJson[msg.sender] = json;
        emit PersonaSet(msg.sender, json);
    }

    function getPersona(address user) public view returns (string memory) {
        return personaJson[user];
    }

    // Admin function to set persona for any address (optional)
    function setPersonaFor(address user, string memory json) public {
        require(msg.sender == owner, "Only owner can set persona for others");
        personaJson[user] = json;
    }
}
