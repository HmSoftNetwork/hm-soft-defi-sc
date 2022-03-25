pragma solidity 0.8.4;

import "./OwnableByAcceptance.sol";
import "./OwnerWithdrawable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract Presale is OwnableByAcceptance, OwnerWithdrawable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IERC20Metadata;

    // Dev wallet where user funds are sent
    address public devWallet;

    // Token for which presale is being done
    address public saleToken;

    // Whitelist of tokens to buy from
    mapping(address => bool) public tokenWL;

    // 1 Token price in terms of WL tokens
    mapping(address => uint256) public tokenPrices;

    // Bool to track sale
    bool public saleStarted;

    //
    // Statictics
    //
    uint256 public totalTokensSold;

    // List of Buyers
    address[] public buyers;

    // Amounts bought by buyers
    mapping(address => uint256) public buyersAmount;

    struct BuyReceipt {
        address buyer;
        uint256 amount;
    }
    BuyReceipt[] public buyReceipts;

    constructor() {
        saleStarted = false;
        devWallet = address(0);
        saleToken = address(0);
    }

    function setParams(address _saleToken, address _devWallet)
        public
        onlyOwner
    {
        saleToken = _saleToken;
        devWallet = _devWallet;
    }

    function receiptsLen() public view returns(uint) {
        return buyReceipts.length;
    }

    // Add a token to buy presale token from, with price
    function addWhiteListedToken(
        address[] memory tokens,
        uint256[] memory prices
    ) public onlyOwner {
        require(
            tokens.length == prices.length,
            "Presale: tokens & prices arrays length mismatch"
        );

        for (uint256 i = 0; i < tokens.length; i++) {
            require(prices[i] != 0, "Presale: Cannot set price to 0");
            tokenWL[tokens[i]] = true;
            tokenPrices[tokens[i]] = prices[i];
        }
    }

    // Remove a token to buy presale tokens from
    function removeWhiteListedToken(address[] memory tokens) public onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenWL[tokens[i]] = false;
            tokenPrices[tokens[i]] = 0;
        }
    }

    // Start the Sale
    function startSale() public onlyOwner {
        require(
            devWallet != address(0),
            "Presale: Cannot start sale before devWallet is set"
        );
        require(
            saleToken != address(0),
            "Presale: Cannot start sale before saleToken is set"
        );
        uint256 tokenAmt = IERC20(saleToken).balanceOf(address(this));
        require(
            tokenAmt > 0,
            "Presale: Cannot start sale as no tokens present for sale"
        );
        saleStarted = true;
    }

    // Stop the Sale
    function stopSale() public onlyOwner {
        saleStarted = false;
    }

    // Public view function to calculate amount of sale tokens returned if you buy using "amount" of "token"
    function getTokenAmount(address token, uint256 amount)
        public
        view
        returns (uint256)
    {
        require(tokenWL[token] == true, "Presale: Token not whitelisted");
        // uint tokenDec = IERC20(token).decimals();
        uint256 saleTokenDec = IERC20Metadata(saleToken).decimals();
        uint256 price = tokenPrices[token];
        uint256 amtOut = amount.mul(10**saleTokenDec).div(price);
        return amtOut;
    }

    // Public Function to buy tokens. APPROVAL needs to be done first
    function buyToken(address token, uint256 amount) public {
        require(amount > 0, "Presale: Cannot buy with zero amount");
        require(saleStarted == true, "Presale: Sale hasn't started");
        require(tokenWL[token] == true, "Presale: Token not whitelisted");
        uint256 allowance = IERC20(token).allowance(msg.sender, address(this));
        require(
            allowance >= amount,
            "Presale: Allowance exceeds transfer amount"
        );
        uint256 saleTokenAmt = getTokenAmount(token, amount);

        // Update Stats
        totalTokensSold += saleTokenAmt;
        if (buyersAmount[msg.sender] == 0) {
            buyers.push(msg.sender);
        }
        buyersAmount[msg.sender] += saleTokenAmt;
        buyReceipts.push(BuyReceipt({buyer: msg.sender, amount: saleTokenAmt}));

        // Transfer Tokens from/to buyer
        IERC20(token).safeTransferFrom(msg.sender, devWallet, amount);
        IERC20(saleToken).safeTransfer(msg.sender, saleTokenAmt);
    }
}
