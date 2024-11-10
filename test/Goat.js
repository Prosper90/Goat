const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("GoatToken", function () {
  let GoatToken, goatToken, owner, addr1, addr2, marketingWallet;
  const MAX_SUPPLY = ethers.utils.parseUnits("1000000000", 18); // 1 billion tokens
  const gasLimit = 3000000;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, marketingWallet] = await ethers.getSigners();

    // Deploy contract
    GoatToken = await ethers.getContractFactory("Goat", owner);

    // Deploy with marketing wallet address and gas limit
    goatToken = await GoatToken.deploy(marketingWallet.address, {
      gasLimit: gasLimit,
    });

    // Wait for deployment
    await goatToken.deployed();
  });

  describe("Basic Token Functions", function () {
    it("Should set the right owner", async function () {
      expect(await goatToken.owner()).to.equal(owner.address);
    });

    it("Should transfer ownership", async function () {
      await goatToken.transferOwnership(addr1.address, {
        gasLimit: gasLimit,
      });
      expect(await goatToken.owner()).to.equal(addr1.address);
    });

    it("Should set the marketing wallet correctly", async function () {
      expect(await goatToken.marketingWallet()).to.equal(
        marketingWallet.address
      );
    });

    it("Should have correct initial supply", async function () {
      const totalSupply = await goatToken.totalSupply();
      const ownerBalance = await goatToken.balanceOf(owner.address);
      expect(totalSupply).to.equal(MAX_SUPPLY);
      expect(ownerBalance).to.equal(MAX_SUPPLY);
    });
  });

  describe("Launch and Sniping Protection", function () {
    it("Should have launch block set at deployment", async function () {
      const launchBlock = await goatToken.launchBlock();
      expect(launchBlock).to.be.gt(0);
    });

    it("should account for untasked transfer during tasked blocked for excluded wallet", async function () {
      const transferAmount = ethers.utils.parseUnits("10000000", 18);

      // Transfer from owner to addr1
      await goatToken.transfer(marketingWallet.address, transferAmount, {
        gasLimit: gasLimit,
      });
      const marketingWalletBalance = await goatToken.balanceOf(
        marketingWallet.address
      );

      expect(marketingWalletBalance).to.equal(transferAmount);
    });

    it("Should apply tax during sniping period", async function () {
      const transferAmountFromOwner = ethers.utils.parseUnits("10000000", 18);

      // Transfer from owner to addr1
      await goatToken.transfer(addr1.address, transferAmountFromOwner, {
        gasLimit: gasLimit,
      });

      const transferAmountFromAdd1 = ethers.utils.parseUnits("1000000", 18);
      const expectedTax = transferAmountFromAdd1.mul(20).div(100); // 20% tax
      const expectedTransfer = transferAmountFromAdd1.sub(expectedTax);
      //   const remainingAmountForAddr1 = transferAmountFromOwner.sub(
      //     transferAmountFromAdd1
      //   );

      // Connect the goatToken contract to addr1
      const goatTokenFromAddr1 = goatToken.connect(addr1);
      // Transfer from addr1 to addr2
      await goatTokenFromAddr1.transfer(addr2.address, transferAmountFromAdd1, {
        gasLimit: gasLimit,
      });

      // Check balances
      //   const addr1Balance = await goatToken.balanceOf(addr1.address);
      const addr2Balance = await goatToken.balanceOf(addr2.address);
      const marketingWalletBalance = await goatToken.balanceOf(
        marketingWallet.address
      );

      expect(addr2Balance).to.equal(expectedTransfer);
      expect(marketingWalletBalance).to.equal(expectedTax);
    });

    it("Should enforce max hold limit during sniping period", async function () {
      const maxHold = await goatToken.launchMaxHold();
      const transferAmount = maxHold.add(1); // Trying to transfer more than max hold

      await expect(
        goatToken.transfer(addr1.address, transferAmount, {
          gasLimit: gasLimit,
        })
      ).to.be.revertedWith("Max hold exceeded");
    });

    it("Should allow transfers below max hold limit", async function () {
      const maxHold = await goatToken.launchMaxHold();
      const transferAmount = maxHold.sub(ethers.utils.parseUnits("1000", 18)); // Less than max hold

      await expect(
        goatToken.transfer(addr1.address, transferAmount, {
          gasLimit: gasLimit,
        })
      ).to.not.be.reverted;

      const addr1Balance = await goatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.be.lt(maxHold);
    });
  });

  describe("Post-Sniping Period", function () {
    it("Should reset tax and max hold limit after sniping duration", async function () {
      const snipingDuration = await goatToken.snipingDuration();
      const transferAmount = ethers.utils.parseUnits("1000000", 18);

      // Mine blocks to pass sniping duration
      for (let i = 0; i < snipingDuration.toNumber() + 1; i++) {
        await network.provider.send("evm_mine");
      }

      // First get initial marketing wallet balance
      const initialMarketingBalance = await goatToken.balanceOf(
        marketingWallet.address
      );

      // Transfer should now happen without tax
      await goatToken.transfer(addr1.address, transferAmount, {
        gasLimit: gasLimit,
      });

      // Verify balances
      const addr1Balance = await goatToken.balanceOf(addr1.address);
      const marketingWalletBalance = await goatToken.balanceOf(
        marketingWallet.address
      );

      expect(addr1Balance).to.equal(transferAmount);
      expect(marketingWalletBalance).to.equal(initialMarketingBalance); // Should not change
    });
  });

  describe("Owner Functions", function () {
    it("Should allow only owner to set transfer tax", async function () {
      //   console.log(
      //     await goatToken.connect(addr1).setTransferTax(10, {
      //       gasLimit: gasLimit,
      //     })
      //   );
      await expect(
        goatToken.connect(addr1).setTransferTax(10, {
          gasLimit: gasLimit,
        })
      ).to.be.revertedWith(`OwnableUnauthorizedAccount(${addr1})`);

      await goatToken.setTransferTax(10, {
        gasLimit: gasLimit,
      });
      expect(await goatToken.transferTax()).to.equal(10);
    });

    it("Should not allow setting tax higher than 20%", async function () {
      await expect(
        goatToken.setTransferTax(21, {
          gasLimit: gasLimit,
        })
      ).to.be.revertedWith("Tax too high");
    });

    it("Should allow owner to exclude accounts from tax", async function () {
      // Exclude addr1 from tax
      await goatToken.excludeFromTax(addr1.address, true, {
        gasLimit: gasLimit,
      });

      const transferAmount = ethers.utils.parseUnits("1000000", 18);

      // Transfer to excluded address
      await goatToken.transfer(addr1.address, transferAmount, {
        gasLimit: gasLimit,
      });

      // Check that full amount was received (no tax)
      const addr1Balance = await goatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);
    });

    it("Should allow excluded accounts to transfer without tax", async function () {
      const initialAmount = ethers.utils.parseUnits("2000000", 18);
      const transferAmount = ethers.utils.parseUnits("1000000", 18);

      // First transfer to addr1 (will be taxed)
      await goatToken.transfer(addr1.address, initialAmount, {
        gasLimit: gasLimit,
      });

      // Exclude addr1 from tax
      await goatToken.excludeFromTax(addr1.address, true, {
        gasLimit: gasLimit,
      });

      // Transfer from excluded address to addr2
      await goatToken.connect(addr1).transfer(addr2.address, transferAmount, {
        gasLimit: gasLimit,
      });

      // Check that full amount was transferred
      const addr2Balance = await goatToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero transfers correctly", async function () {
      await expect(
        goatToken.transfer(addr1.address, 0, {
          gasLimit: gasLimit,
        })
      ).to.not.be.reverted;
    });

    it("Should prevent transfers exceeding balance", async function () {
      const snipingDuration = await goatToken.snipingDuration();
      //   const transferAmount = ethers.utils.parseUnits("1000000", 18);

      // Mine blocks to pass sniping duration
      for (let i = 0; i < snipingDuration.toNumber() + 1; i++) {
        await network.provider.send("evm_mine");
      }

      const totalSupply = await goatToken.totalSupply();

      await expect(
        goatToken.connect(addr1).transfer(addr2.address, totalSupply, {
          gasLimit: gasLimit,
        })
      ).to.be.revertedWith("ERC20InsufficientBalance");
    });

    it("Should prevent transfers to zero address", async function () {
      const amount = ethers.utils.parseUnits("1000", 18);

      await expect(
        goatToken.transfer(ethers.constants.AddressZero, amount, {
          gasLimit: gasLimit,
        })
      ).to.be.revertedWith(
        `ERC20InvalidSender(${ethers.constants.AddressZero})`
      );
    });

    it("Should handle multiple transfers correctly", async function () {
      const amount = ethers.utils.parseUnits("1000000", 18);
      const smallerAmount = ethers.utils.parseUnits("500000", 18);

      // First transfer to addr1
      await goatToken.transfer(addr1.address, amount, {
        gasLimit: gasLimit,
      });

      // Then transfer from addr1 to addr2
      await goatToken.connect(addr1).transfer(addr2.address, smallerAmount, {
        gasLimit: gasLimit,
      });

      const addr1Balance = await goatToken.balanceOf(addr1.address);
      const addr2Balance = await goatToken.balanceOf(addr2.address);

      // Calculate expected balances considering tax
      const expectedTax = smallerAmount.mul(20).div(100);
      const expectedTransfer = smallerAmount.sub(expectedTax);

      expect(addr2Balance).to.equal(expectedTransfer);
      expect(addr1Balance).to.equal(amount.sub(smallerAmount));
    });
  });
});
