/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeERC20} from "./SafeERC20.sol";
import {IERC20} from "./IERC20.sol";
import {SafeMath} from "./SafeMath.sol";
import {ReentrancyGuard} from "./ReentrancyGuard.sol";
import {BaseMine} from "./BaseMine.sol";
import "./MiningFactory.sol";

contract ERC20MineV3 is ReentrancyGuard, BaseMine {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // ============ Storage ============

    address public _TOKEN_;
    MiningFactory public factory;

    function init(address _factory, address owner, address token) external {
        factory = MiningFactory(_factory);
        super.initOwner(owner);
        _TOKEN_ = token;
    }

    // ============ Event  ============

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    // ============ Deposit && Withdraw && Exit ============

    function deposit(uint256 amount) external preventReentrant {
        require(amount > 0, "DODOMineV3: CANNOT_DEPOSIT_ZERO");

        _updateAllReward(msg.sender);
        uint devFee = amount.mul(factory.feePercentage()).div(10000);
        uint newDepositAmount = amount.sub(devFee);

        uint256 erc20OriginBalance = IERC20(_TOKEN_).balanceOf(address(this));
        IERC20(_TOKEN_).safeTransferFrom(msg.sender, address(this), newDepositAmount);
        IERC20(_TOKEN_).safeTransferFrom(msg.sender, factory._OWNER_(), devFee);
        uint256 actualStakeAmount = IERC20(_TOKEN_).balanceOf(address(this)).sub(erc20OriginBalance);
        
        _totalSupply = _totalSupply.add(actualStakeAmount);
        _balances[msg.sender] = _balances[msg.sender].add(actualStakeAmount);

        emit Deposit(msg.sender, actualStakeAmount);
    }

    function withdraw(uint256 amount) external preventReentrant {
        require(amount > 0, "DODOMineV3: CANNOT_WITHDRAW_ZERO");

        _updateAllReward(msg.sender);

        uint devFee = amount.mul(factory.feePercentage()).div(10000);
        uint newWithdrawAmount = amount.sub(devFee);

        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        IERC20(_TOKEN_).safeTransfer(msg.sender, newWithdrawAmount);
        IERC20(_TOKEN_).safeTransfer(factory._OWNER_(), devFee);
        emit Withdraw(msg.sender, amount);
    }
}