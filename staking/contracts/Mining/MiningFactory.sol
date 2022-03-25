pragma solidity 0.6.9;

import "./ERC20Mine.sol";
import {Ownable} from "./Ownable.sol";
// import "hardhat/console.sol";

contract MiningFactory is Ownable {
    uint public feePercentage = 10;
    ERC20MineV3[] public deployedMiningPools;
    mapping(address => address[]) public poolOwners;

    event NewMiningContract(ERC20MineV3 indexed miningContract);

    function deployMiningPool(address _owner, address _stakedToken, address[] memory rewardToken, uint[] memory rewardPerBlock, uint startBlock, uint endBlock ) external {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_stakedToken != address(0), "Token cannot be the zero address");
        require(rewardToken.length == rewardPerBlock.length, "length mismatch");
        
        // bytes memory bytecode = type(ERC20MineV3).creationCode;
        // bytes32 salt = keccak256(abi.encodePacked(_owner, _stakedToken));
        // address miningPool;

        // assembly {
        //     miningPool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        // }
        ERC20MineV3 miningPool = new ERC20MineV3();

        for (uint i = 0; i < rewardToken.length; i++) {
            miningPool.addRewardToken(rewardToken[i], rewardPerBlock[i], startBlock, endBlock);
        }

        miningPool.init(address(this), _owner, _stakedToken);
    
        deployedMiningPools.push(miningPool);
        poolOwners[msg.sender].push(address(miningPool));

        emit NewMiningContract(miningPool);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        feePercentage = _feePercentage;
    }
}