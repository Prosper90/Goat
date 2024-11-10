// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Goat is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    address public marketingWallet;
    bool antiSnipping = false;
    uint256 public antiSniperlaunchBlock;
    uint256 public snipingDuration = 40; // Number of blocks for high taxes
    uint256 public launchMaxHold = MAX_SUPPLY / 50; // 2% max hold during launch phase
    uint256 public transferTax = 20; // Initial high tax (20%)
    mapping(address => bool) public isExcludedFromTax;

    constructor(address _marketingWallet) ERC20("Goat", "GOAT") Ownable(msg.sender) {
        require(_marketingWallet != address(0), "Marketing wallet cannot be zero address");
        marketingWallet = _marketingWallet;
        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[_marketingWallet] = true;
        
        // Mint tokens to deployer
        _mint(msg.sender, MAX_SUPPLY);
    }


    function toggleAntiSnipping(bool choice) external onlyOwner {
        antiSnipping = choice;
        if (choice) {
            antiSniperlaunchBlock = block.number; 
            transferTax = 20; 
            launchMaxHold = MAX_SUPPLY / 50; 
        } else {
            transferTax = 0;
            launchMaxHold = MAX_SUPPLY;
        }
    }

    function setSnipingDuration(uint256 newDuration) external onlyOwner {
        snipingDuration = newDuration;
    }

    function setTransferTax(uint256 newTax) external onlyOwner {
        require(newTax <= 20, "Tax too high"); // Limit the max tax rate to 20%
        transferTax = newTax;
    }

    function excludeFromTax(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Skip tax logic for minting and burning
        if (from == address(0) || to == address(0)) {
            super._update(from, to, amount);
            return;
        }

        if ( antiSnipping && block.number < antiSniperlaunchBlock + snipingDuration ) {
            // Apply max hold limit
           require(balanceOf(to) + amount <= launchMaxHold, "Max hold exceeded");
            if (!isExcludedFromTax[from] && !isExcludedFromTax[to]) {
                
                // Calculate and apply tax for antisnipping
                uint256 taxAmount = (amount * transferTax) / 100;
                uint256 sendAmount = amount - taxAmount;
                
                super._update(from, marketingWallet, taxAmount);
                super._update(from, to, sendAmount);
                return;
            } 
        } else {
            transferTax = 0;
            launchMaxHold = MAX_SUPPLY;
        }
        
        super._update(from, to, amount);
    }
}