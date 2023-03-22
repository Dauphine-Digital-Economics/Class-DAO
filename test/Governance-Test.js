const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// fixtures set the point in time that the blockchain should return to in order to run tests
async function deployDAO() {
	// initialize the contract
	const Token = await ethers.getContractFactory("VotingToken");
	const Govern = await ethers.getContractFactory("Governance");

	//establish dummy users
	const listofSigners = await ethers.getSigners();
	listofAddresses = [];
	listofSigners.forEach(signer => listofAddresses.push(signer.address));

	//Deploy the contract
	const tokenContract = await Token.deploy();
	const governanceContract = await Govern.deploy();

    await tokenContract.deployed();

    // Delegate 1000 tokens to each address
    listofAddresses.forEach(address => {
    	tokenContract.mintAndDelegate(address, 1000);
    });
    // list the state to return to
    return {tokenContract, listofAddresses, governanceContract};
}