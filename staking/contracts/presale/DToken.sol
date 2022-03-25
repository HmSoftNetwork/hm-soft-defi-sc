pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DToken is ERC20 {
    function decimals() public view override returns (uint8) {
        return 6;
    }

    constructor() ERC20("D Token", "D") {
        _mint(msg.sender, 10000000000 * 10**decimals());
    }
}
