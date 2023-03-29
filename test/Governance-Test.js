const { expect } = require("chai");
const { loadFixture, mine} = require("@nomicfoundation/hardhat-network-helpers");

// fixtures set the point in time that the blockchain should return to in order to run tests
async function deployDAO() {
	// initialize the contract
	const Token = await ethers.getContractFactory("VotingToken");
	const Govern = await ethers.getContractFactory("GovernanceLogic");

	//establish dummy users
	const listofSigners = await ethers.getSigners();
	listofAddresses = [];
	listofSigners.forEach(signer => listofAddresses.push(signer.address));

	//Deploy token contract
	const tokenContract = await Token.deploy();

    await tokenContract.deployed();

    // Delegate 1000 tokens to each address
    listofAddresses.forEach(address => {
    	tokenContract.mintAndDelegate(address, 1000);
    });

    // Deploy Governance Contract. Requires Token address to track tokens
    const governanceContract = await Govern.deploy(tokenContract.address);
    await governanceContract.deployed();

    // list the state to return to
    return {Token, tokenContract, listofSigners, listofAddresses, governanceContract};
}

describe("Onchain DAO Lifecycle", function(){
	i = [...Array(20).keys()];

	i.forEach(element => {
		it(`Account ${element} has been delegated 1000 votes`, async function(){
			const {Token, tokenContract, listofSigners, listofAddresses, governanceContract} = await loadFixture(deployDAO);
			
			await tokenContract.connect(listofSigners[element]).delegate(listofAddresses[element]);
			var vote = await tokenContract.connect(listofSigners[element]).getVotes(listofAddresses[element]);
			expect(vote).to.equal(1000);	
		});
	});

	it("Create a Proposal", async function(){
		const {Token, tokenContract, listofSigners, listofAddresses, governanceContract} = await loadFixture(deployDAO);
		
		for(var i = 0; i<20; i++){
			await tokenContract.connect(listofSigners[i]).delegate(listofAddresses[i]);
		}
		
		const tokenAddress = tokenContract.address;
		const recipient = listofAddresses[5];

		const transferCalldata = Token.interface.encodeFunctionData("mintAndDelegate", [recipient, 100]);
		const tx = await governanceContract.propose(
  			[tokenAddress],
  			[0],
  			[transferCalldata],
  			"Proposal #1: Mint Address 5 one hundred more tokens",
		);
	});

	it("Address 15 casts a vote", async function(){
		const {Token, tokenContract, listofSigners, listofAddresses, governanceContract} = await loadFixture(deployDAO);
		
		for(var i = 0; i<20; i++){
			await tokenContract.connect(listofSigners[i]).delegate(listofAddresses[i]);
		}
		
		const tokenAddress = tokenContract.address;
		const recipient = listofAddresses[5];

		const transferCalldata = Token.interface.encodeFunctionData("mintAndDelegate", [recipient, 100]);
		const tx = await governanceContract.propose(
  			[tokenAddress],
  			[0],
  			[transferCalldata],
  			"Proposal #1: Mint Address 5 one hundred more tokens",
		);

		const receipt = await tx.wait()
		// Receipt should now contain the logs
		const proposalId = receipt.events[0].args[0];

		await governanceContract.connect(listofSigners[15]).castVote(proposalId, 1);
		expect(await governanceContract.hasVoted(proposalId, listofAddresses[15])).to.equal(true);
	});

	it("Execute proposal upon reaching quorum", async function(){
		const {Token, tokenContract, listofSigners, listofAddresses, governanceContract} = await loadFixture(deployDAO);
		
		for(var i = 0; i<20; i++){
			await tokenContract.connect(listofSigners[i]).delegate(listofAddresses[i]);
		}
		
		const tokenAddress = tokenContract.address;
		const recipient = listofAddresses[5];

		const transferCalldata = Token.interface.encodeFunctionData("mintAndDelegate", [recipient, 100]);
		const tx = await governanceContract.propose(
  			[tokenAddress],
  			[0],
  			[transferCalldata],
  			"Proposal #1: Mint Address 5 one hundred more tokens",
		);

		const receipt = await tx.wait()
		// Receipt should now contain the logs
		const proposalId = receipt.events[0].args[0];

		await governanceContract.connect(listofSigners[15]).castVote(proposalId, 1);

		// Advance time to end proposal measured in seconds
		await mine(4);

		const descriptionHash = ethers.utils.id("Proposal #1: Mint Address 5 one hundred more tokens");

		const tx2 = await governanceContract.execute(
  			[tokenAddress],
  			[0],
  			[transferCalldata],
  			descriptionHash
		);

		const executeProposal = await tx2.wait();
		expect(await tokenContract.balanceOf(listofAddresses[5])).to.equal(1100);

	});
}); 