const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const miningPoolABI = (JSON.parse(fs.readFileSync('./artifacts/contracts/Mining/ERC20Mine.sol/ERC20MineV3.json', 'utf8'))).abi;
 

describe("DODO staking", function () {
	const advanceBlock = () => new Promise((resolve, reject) => {
		web3.currentProvider.send({
			jsonrpc: '2.0',
			method: 'evm_mine',
			id: new Date().getTime()
		}, async (err, result) => {
			if (err) { return reject(err) }
			// const newBlockHash =await web3.eth.getBlock('latest').hash
			return resolve()
		})
	})
	
	const advanceBlocks = async (num) => {
		let resp = []
		for (let i = 0; i < num; i += 1) {
			resp.push(advanceBlock())
		}
		await Promise.all(resp)
	}

	before(async () => {
		const MiningFactory = await ethers.getContractFactory("MiningFactory");
		miningFactory = await MiningFactory.deploy();	
		await miningFactory.deployed();

		let mining
	
		AToken = await ethers.getContractFactory("AToken");
		AToken = await AToken.deploy();	
		await AToken.deployed();

		BToken = await ethers.getContractFactory("BToken");
		BToken = await BToken.deploy();	
		await BToken.deployed();

		CToken = await ethers.getContractFactory("CToken");
		CToken = await CToken.deploy();	
		await CToken.deployed();

		DToken = await ethers.getContractFactory("DToken");
		DToken = await DToken.deploy();	
		await DToken.deployed();

        // accounts = await web3.eth.getAccounts()
		accounts = await ethers.getSigners();
	})

	it ("should deploy mining pools, from mining factory", async () => {
		const blockNum = await provider.getBlockNumber()
		await miningFactory.deployMiningPool(accounts[0].address, AToken.address, [DToken.address], [0], blockNum + 10, blockNum + 1000);

		const minePool = await miningFactory.deployedMiningPools(0)
		console.log({
			minePool
		})
		mining = new ethers.Contract(minePool, miningPoolABI, accounts[0])
	})

	it("Should not init mining contracts again", async () => {
		await expect(mining.init(miningFactory.address, accounts[1].address, accounts[2].address)).to.be.revertedWith('DODO_INITIALIZED');
	});

	it("Should stake token", async () => {
		await AToken.approve(mining.address, "10000000000000000000000000000");

		const balBefAccount0 = await AToken.balanceOf(accounts[0].address);
		await mining.deposit("5000000")
		const balAftAccount0 = await AToken.balanceOf(accounts[0].address);

		const feePercentage = await miningFactory.feePercentage()
		const devAmount = 5000000 * feePercentage / 10000
		const factoryOwner = await miningFactory._OWNER_()
		

		expect(balBefAccount0.sub(balAftAccount0)).to.equal(5000000 - devAmount);
	})

	it("Should withdraw token", async () => {
		const balBefAccount0 = await AToken.balanceOf(accounts[0].address);
		await mining.withdraw("2000000")
		const balAftAccount0 = await AToken.balanceOf(accounts[0].address);

		const feePercentage = await miningFactory.feePercentage()
		const devAmount = 2000000 * feePercentage / 10000
		
		expect(balAftAccount0.sub(balBefAccount0)).to.equal(2000000);
	})

	it ("Should be able to claim rewards", async () => {
		const ATokenbalBefAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalBefAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalBefAccount0 = await CToken.balanceOf(accounts[0].address);

		let tx = await mining.claimAllRewards()
		await tx.wait()

		const ATokenbalAftAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalAftAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalAftAccount0 = await CToken.balanceOf(accounts[0].address);

		expect(ATokenbalBefAccount0.sub(ATokenbalAftAccount0)).to.equal("0");
		expect(BTokenbalBefAccount0.sub(BTokenbalAftAccount0)).to.equal("0");
		expect(CTokenbalBefAccount0.sub(CTokenbalAftAccount0)).to.equal("0");
	})

	it ("Should add rewards", async () => {
		const blockNum = await provider.getBlockNumber()
		console.log(blockNum)

		// await BToken.transfer(mining.address, 990 * 3000000)
		await BToken.approve(mining.address, "9900000000000000000000000000");
		await mining.addRewardToken(BToken.address, "3000000", blockNum + 10, blockNum + 1000)
		const rewardInfoAft = await mining.rewardTokenInfos(1)

		const rewardContractBal = await BToken.balanceOf(rewardInfoAft.rewardVault)
		expect(rewardContractBal).to.equal(990 * 3000000)
		console.log({
			rewardInfoAft,
		})
	})

	it ("should be able to claim rewards", async () => {
		await advanceBlocks(100);

		const ATokenbalBefAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalBefAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalBefAccount0 = await CToken.balanceOf(accounts[0].address);

		let tx = await mining.claimAllRewards()
		await tx.wait()

		const ATokenbalAftAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalAftAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalAftAccount0 = await CToken.balanceOf(accounts[0].address);

		console.log({
			ATokenbalBefAccount0,
			BTokenbalBefAccount0,
			CTokenbalBefAccount0,
			ATokenbalAftAccount0,
			BTokenbalAftAccount0,
			CTokenbalAftAccount0,
		})

		expect(ATokenbalBefAccount0.sub(ATokenbalAftAccount0)).to.equal("0");
		// expect(1.5).to.be.closeTo(1, 0.5);
		expect(parseInt(BTokenbalAftAccount0.sub(BTokenbalBefAccount0)), 10).to.be.closeTo((101 - 8) * 3000000, 1000);
		expect(CTokenbalBefAccount0.sub(CTokenbalAftAccount0)).to.equal("0");
	})

	it ("should add more reward tokens", async () => {
		const blockNum = await provider.getBlockNumber()
		console.log(blockNum)

		// await CToken.transfer(mining.address, 495 * 5000000)
		await CToken.approve(mining.address, 495 * 5000000)
		await mining.addRewardToken(CToken.address, "5000000", blockNum + 5, blockNum + 500)
		const rewardInfoAft = await mining.rewardTokenInfos(2)

		const rewardContractBal = await CToken.balanceOf(rewardInfoAft.rewardVault)
		expect(rewardContractBal).to.equal(495 * 5000000)
		console.log({
			rewardInfoAft,
		})
	})

	it ("should be able to claim rewards for B and C", async () => {
		await advanceBlocks(50);

		const ATokenbalBefAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalBefAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalBefAccount0 = await CToken.balanceOf(accounts[0].address);

		let tx = await mining.claimAllRewards()
		await tx.wait()

		const ATokenbalAftAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalAftAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalAftAccount0 = await CToken.balanceOf(accounts[0].address);

		console.log({
			ATokenbalBefAccount0,
			BTokenbalBefAccount0,
			CTokenbalBefAccount0,
			ATokenbalAftAccount0,
			BTokenbalAftAccount0,
			CTokenbalAftAccount0,
		})

		expect(ATokenbalBefAccount0.sub(ATokenbalAftAccount0)).to.equal("0");
		expect(parseInt(BTokenbalAftAccount0.sub(BTokenbalBefAccount0)), 10).to.be.closeTo((53) * 3000000, 1000);
		expect(parseInt(CTokenbalAftAccount0.sub(CTokenbalBefAccount0)), 10).to.be.closeTo((52 - 4) * 5000000, 1000);
	})

	it ("another user can invest", async () => {
		await AToken.connect(accounts[1]).approve(mining.address, "10000000000000000000000000000");
		await AToken.transfer(accounts[1].address, "2000000000");

		const balBefAccount1 = await AToken.balanceOf(accounts[1].address);
		const balBefAccount0 = await AToken.balanceOf(accounts[0].address);

		await mining.connect(accounts[1]).deposit("10000000")

		const balAftAccount1 = await AToken.balanceOf(accounts[1].address);
		const balAftAccount0 = await AToken.balanceOf(accounts[0].address);

		expect(balBefAccount1.sub(balAftAccount1)).to.equal("10000000");

		const feePercentage = await miningFactory.feePercentage()
		const devAmount = 10000000 * feePercentage / 10000

		expect(balAftAccount0.sub(balBefAccount0)).to.equal(devAmount);

		await advanceBlocks(20)

		const ATokenbalBefAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalBefAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalBefAccount0 = await CToken.balanceOf(accounts[0].address);
		const ATokenbalBefAccount1 = await AToken.balanceOf(accounts[1].address);
		const BTokenbalBefAccount1 = await BToken.balanceOf(accounts[1].address);
		const CTokenbalBefAccount1 = await CToken.balanceOf(accounts[1].address);

		await mining.claimAllRewards()
		await mining.connect(accounts[1]).claimAllRewards()

		const ATokenbalAftAccount0 = await AToken.balanceOf(accounts[0].address);
		const BTokenbalAftAccount0 = await BToken.balanceOf(accounts[0].address);
		const CTokenbalAftAccount0 = await CToken.balanceOf(accounts[0].address);
		const ATokenbalAftAccount1 = await AToken.balanceOf(accounts[1].address);
		const BTokenbalAftAccount1 = await BToken.balanceOf(accounts[1].address);
		const CTokenbalAftAccount1 = await CToken.balanceOf(accounts[1].address);

		console.log({
			ATokenbalBefAccount0,
			BTokenbalBefAccount0,
			CTokenbalBefAccount0,
			ATokenbalBefAccount1,
			BTokenbalBefAccount1,
			CTokenbalBefAccount1,
			ATokenbalAftAccount0,
			BTokenbalAftAccount0,
			CTokenbalAftAccount0,
			ATokenbalAftAccount1,
			BTokenbalAftAccount1,
			CTokenbalAftAccount1,
		})

		expect(ATokenbalBefAccount0.sub(ATokenbalAftAccount0)).to.equal("0");
		expect(parseInt(BTokenbalAftAccount0.sub(BTokenbalBefAccount0)), 10).to.be.closeTo(parseInt(((3 * 3000000) + ((21 * 3000000) * 3000000)/13000000), 10), 1000000);
		expect(parseInt(CTokenbalAftAccount0.sub(CTokenbalBefAccount0)), 10).to.be.closeTo(parseInt(((3 * 5000000) + (21 * 5000000) * 3000000/13000000), 10), 1000000);

		expect(ATokenbalBefAccount1.sub(ATokenbalAftAccount1)).to.equal("0");
		expect(parseInt(BTokenbalAftAccount1.sub(BTokenbalBefAccount1)), 10).to.be.closeTo(parseInt((22 * 3000000) * 10000000/13000000, 10), 1000000);
		expect(parseInt(CTokenbalAftAccount1.sub(CTokenbalBefAccount1)), 10).to.be.closeTo(parseInt((22 * 5000000) * 10000000/13000000, 10), 1000000);
	})

	it("check fees while withdrawal", async () => {
		const balBefAccount0 = await AToken.balanceOf(accounts[0].address);
		const balBefAccount1 = await AToken.balanceOf(accounts[1].address);

		await mining.connect(accounts[1]).withdraw("4000000")

		const feePercentage = await miningFactory.feePercentage()
		const devAmount = 4000000 * feePercentage / 10000

		const balAftAccount0 = await AToken.balanceOf(accounts[0].address);
		const balAftAccount1 = await AToken.balanceOf(accounts[1].address);

		expect(feePercentage, 10)
		expect(balAftAccount0.sub(balBefAccount0)).to.equal(devAmount);
		expect(balAftAccount1.sub(balBefAccount1)).to.equal(4000000 - devAmount);
	})

});