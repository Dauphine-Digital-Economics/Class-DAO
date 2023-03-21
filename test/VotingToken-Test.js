const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// fixtures set the point in time that the blockchain should return to in order to run tests
async function intializeChainAndToken() {
	// initialize the contract
	const Token = await ethers.getContractFactory("VotingToken");

	//establish dummy users
	const listofSigners = await ethers.getSigners();
	listofAddresses = [];
	listofSigners.forEach(signer => listofAddresses.push(signer.address));

	//Deploy the contract
	const deployedContract = await Token.deploy();

    await deployedContract.deployed();
    // list the state to return to
    return {deployedContract, listofAddresses};
}

describe("Token Functionalities", function(){

	it("Token has owner", async function(){
		const { deployedContract , listofAddresses } = await loadFixture(intializeChainAndToken);
		expect(await deployedContract.owner()).to.equal(listofAddresses[0]);	
	});

	describe("Token Distribution", function(){
		i = [...Array(20).keys()];
		i.forEach(element => {
			it(`Address ${element} has been delegated 1000 tokens`, async function(){
				const { deployedContract , listofAddresses } = await loadFixture(intializeChainAndToken);
				deployedContract.mintAndDelegate(listofAddresses[element], 1000)
				balance = await deployedContract.balanceOf(listofAddresses[element])
				expect(balance).to.equal(1000)
			});
		});		
	});
});