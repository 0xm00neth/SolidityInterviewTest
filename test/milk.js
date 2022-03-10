const { expect } = require("chai");

describe("Milk Contract Test", async function () {
  let milk;

  beforeEach(async function () {
    const Milk = await ethers.getContractFactory("Milk");
    milk = await Milk.deploy("MilkToken", "MILK");
    await milk.deployed();
  });

  it("Only deployer should have DEFAULT_ADMIN_ROLE", async function () {
    const [owner, user] = await ethers.getSigners();

    const role = await milk.DEFAULT_ADMIN_ROLE();
    let hasRole = await milk.hasRole(role, owner.address);
    expect(hasRole).to.be.eq(true);
    hasRole = await milk.hasRole(role, user.address);
    expect(hasRole).to.be.eq(false);
  });

  describe("Milk Contract Deposit Test", async function () {
    it("Only users with DEPOSITOR_ROLE should deposit", async function () {
      const [owner, depositor, user] = await ethers.getSigners();

      const depositAmount = ethers.utils.parseUnits("100", 18);

      await expect(milk.connect(depositor).deposit(user.address, depositAmount))
        .to.be.reverted;

      const depositorRole = await milk.DEPOSITOR_ROLE();
      await milk.grantRole(depositorRole, depositor.address);

      await milk
        .connect(depositor)
        .deposit(
          user.address,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [depositAmount])
        );

      const milkBalance = await milk.balanceOf(user.address);
      expect(milkBalance).to.be.eq(depositAmount);
    });
  });

  describe("Milk Contract Withdraw Test", async function () {
    beforeEach(async function () {
      const [owner, depositor, user] = await ethers.getSigners();

      const depositAmount = ethers.utils.parseUnits("10000", 18);

      await expect(
        milk.connect(depositor).deposit(user.address, depositAmount)
      ).to.be.reverted;

      const depositorRole = await milk.DEPOSITOR_ROLE();
      await milk.grantRole(depositorRole, depositor.address);

      await milk
        .connect(depositor)
        .deposit(
          user.address,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [depositAmount])
        );
    });

    it("Should not burn more than balance", async function () {
      const [owner, depositor, user] = await ethers.getSigners();
      const withdrawAmount = ethers.utils.parseUnits("20000", 18);

      await expect(
        milk.connect(user).withdraw(withdrawAmount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should burn up to balance", async function () {
      const [owner, depositor, user] = await ethers.getSigners();
      const withdrawAmount = ethers.utils.parseUnits("3000", 18);

      const beforeBalance = await milk.balanceOf(user.address);
      await milk.connect(user).withdraw(withdrawAmount);
      const afterBalance = await milk.balanceOf(user.address);
      expect(afterBalance).to.be.eq(beforeBalance.sub(withdrawAmount));
    });
  });

  describe("Milk Contract Mint Test", async function () {
    it("Only users with CONTRACT_ROLE should gameMint", async function () {
      const [owner, master, user, game] = await ethers.getSigners();

      const mintAmount = ethers.utils.parseUnits("1000", 18);

      await expect(milk.connect(game).mint(user.address, mintAmount)).to.be
        .reverted;
      const beforeBalance = await milk.balanceOf(user.address);

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      await milk
        .connect(game)
        .gameMint(
          user.address,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [mintAmount])
        );

      const afterBalance = await milk.balanceOf(user.address);
      expect(afterBalance).to.be.eq(beforeBalance.add(mintAmount));
    });

    it("Only users with MASTER_ROLE should mint", async function () {
      const [owner, master, user] = await ethers.getSigners();

      const mintAmount = ethers.utils.parseUnits("100", 18);

      await expect(milk.connect(master).mint(user.address, mintAmount)).to.be
        .reverted;

      const masterRole = await milk.MASTER_ROLE();
      await milk.grantRole(masterRole, master.address);

      await milk
        .connect(master)
        .mint(
          user.address,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [mintAmount])
        );

      const milkBalance = await milk.balanceOf(user.address);
      expect(milkBalance).to.be.eq(mintAmount);
    });
  });

  describe("Milk Contract Game Test", async function () {
    beforeEach(async function () {
      const [owner, master, user] = await ethers.getSigners();

      const mintAmount = ethers.utils.parseUnits("1000", 18);

      const masterRole = await milk.MASTER_ROLE();
      await milk.grantRole(masterRole, master.address);

      await milk
        .connect(master)
        .mint(
          user.address,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [mintAmount])
        );
    });

    it("Should not withdraw more than balance", async function () {
      const [owner, master, user, game] = await ethers.getSigners();

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      const userBalance = await milk.balanceOf(user.address);
      await expect(
        milk
          .connect(game)
          .gameWithdraw(
            user.address,
            userBalance.add(ethers.utils.parseUnits("10", 18))
          )
      ).to.be.reverted;
    });

    it("Should withdraw up to balance", async function () {
      const [owner, master, user, game] = await ethers.getSigners();

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      const userBalance = await milk.balanceOf(user.address);
      const withdrawAmount = userBalance.div(2);
      await milk.connect(game).gameWithdraw(user.address, withdrawAmount);

      const afterBalance = await milk.balanceOf(user.address);
      expect(afterBalance).to.be.eq(userBalance.sub(withdrawAmount));
    });

    it("Should not transfer more than balance", async function () {
      const [owner, master, user, game, user2] = await ethers.getSigners();

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      const userBalance = await milk.balanceOf(user.address);
      await expect(
        milk
          .connect(game)
          .gameTransferFrom(
            user.address,
            user2.address,
            userBalance.add(ethers.utils.parseUnits("10", 18))
          )
      ).to.be.reverted;
    });

    it("Should transfer up to balance", async function () {
      const [owner, master, user, game, user2] = await ethers.getSigners();

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      const userBalance = await milk.balanceOf(user.address);
      const beforeBalance = await milk.balanceOf(user2.address);
      const transferAmount = userBalance.div(2);
      await milk
        .connect(game)
        .gameTransferFrom(user.address, user2.address, transferAmount);

      const userAfterBalance = await milk.balanceOf(user.address);
      expect(userAfterBalance).to.be.eq(userBalance.sub(transferAmount));

      const user2AfterBalance = await milk.balanceOf(user2.address);
      expect(user2AfterBalance).to.be.eq(beforeBalance.add(transferAmount));
    });

    it("Should not burn more than balance", async function () {
      const [owner, master, user, game] = await ethers.getSigners();

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      const userBalance = await milk.balanceOf(user.address);
      await expect(
        milk
          .connect(game)
          .gameBurn(
            user.address,
            userBalance.add(ethers.utils.parseUnits("10", 18))
          )
      ).to.be.reverted;
    });

    it("Should burn up to balance", async function () {
      const [owner, master, user, game] = await ethers.getSigners();

      const role = await milk.CONTRACT_ROLE();
      await milk.grantRole(role, game.address);

      const userBalance = await milk.balanceOf(user.address);
      const burnAmount = userBalance.div(2);
      await milk
        .connect(game)
        .gameBurn(user.address, burnAmount);

      const afterBalance = await milk.balanceOf(user.address);
      expect(afterBalance).to.be.eq(userBalance.sub(burnAmount));
    });
  });
});
