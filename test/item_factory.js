const { expect } = require("chai");

describe("Milk Contract Test", async function () {
  let milk;
  let itemFactory;

  beforeEach(async function () {
    const Milk = await ethers.getContractFactory("Milk");
    milk = await Milk.deploy("MilkToken", "MILK");
    await milk.deployed();

    const ItemFactory = await ethers.getContractFactory("ItemFactory");
    itemFactory = await ItemFactory.deploy("placeholderuri/{id}", milk.address);
  });

  it("Only deployer should have DEFAULT_ADMIN_ROLE", async function () {
    const [owner, user] = await ethers.getSigners();

    const role = await itemFactory.DEFAULT_ADMIN_ROLE();
    let hasRole = await itemFactory.hasRole(role, owner.address);
    expect(hasRole).to.be.eq(true);
    hasRole = await itemFactory.hasRole(role, user.address);
    expect(hasRole).to.be.eq(false);
  });

  it("Should set rarity rolls only by users with ADMIN_ROLE", async function () {
    const [owner, admin] = await ethers.getSigners();

    const adminRole = await itemFactory.ADMIN_ROLE();
    const _commonRoll = 50;
    const _uncommonRoll = 75;
    const _rareRoll = 85;
    const _epicRoll = 92;
    const _legendaryRoll = 100;
    const _maxRarityRoll = 100;

    await expect(
      itemFactory
        .connect(admin)
        .setRarityRolls(
          _commonRoll,
          _uncommonRoll,
          _rareRoll,
          _epicRoll,
          _legendaryRoll,
          _maxRarityRoll
        )
    ).to.be.revertedWith(
      `AccessControl: account ${admin.address.toLowerCase()} is missing role ${adminRole}`
    );

    await itemFactory.grantRole(adminRole, admin.address);

    await itemFactory
      .connect(admin)
      .setRarityRolls(
        _commonRoll,
        _uncommonRoll,
        _rareRoll,
        _epicRoll,
        _legendaryRoll,
        _maxRarityRoll
      );

    expect(await itemFactory._commonRoll()).to.be.eq(_commonRoll);
    expect(await itemFactory._uncommonRoll()).to.be.eq(_uncommonRoll);
    expect(await itemFactory._rareRoll()).to.be.eq(_rareRoll);
    expect(await itemFactory._epicRoll()).to.be.eq(_epicRoll);
    expect(await itemFactory._legendaryRoll()).to.be.eq(_legendaryRoll);
    expect(await itemFactory._maxRarityRoll()).to.be.eq(_maxRarityRoll);
  });

  it("Should set valid rarity rolls", async function () {
    const [owner, admin] = await ethers.getSigners();

    const adminRole = await itemFactory.ADMIN_ROLE();
    await itemFactory.grantRole(adminRole, admin.address);

    const _commonRoll = 50;
    const _uncommonRoll = 75;
    const _rareRoll = 85;
    const _epicRoll = 92;
    const _legendaryRoll = 100;
    const _maxRarityRoll = 100;

    await expect(
      itemFactory
        .connect(admin)
        .setRarityRolls(
          _commonRoll,
          _commonRoll - 1,
          _rareRoll,
          _epicRoll,
          _legendaryRoll,
          _maxRarityRoll
        )
    ).to.be.revertedWith("Common must be less rare than uncommon");

    await expect(
      itemFactory
        .connect(admin)
        .setRarityRolls(
          _commonRoll,
          _uncommonRoll,
          _uncommonRoll - 1,
          _epicRoll,
          _legendaryRoll,
          _maxRarityRoll
        )
    ).to.be.revertedWith("Uncommon must be less rare than rare");

    await expect(
      itemFactory
        .connect(admin)
        .setRarityRolls(
          _commonRoll,
          _uncommonRoll,
          _rareRoll,
          _rareRoll - 1,
          _legendaryRoll,
          _maxRarityRoll
        )
    ).to.be.revertedWith("Rare must be less rare than epic");

    await expect(
      itemFactory
        .connect(admin)
        .setRarityRolls(
          _commonRoll,
          _uncommonRoll,
          _rareRoll,
          _epicRoll,
          _epicRoll - 1,
          _maxRarityRoll
        )
    ).to.be.revertedWith("Epic must be less rare than legendary");

    await expect(
      itemFactory
        .connect(admin)
        .setRarityRolls(
          _commonRoll,
          _uncommonRoll,
          _rareRoll,
          _epicRoll,
          _legendaryRoll,
          _legendaryRoll - 1
        )
    ).to.be.revertedWith(
      "Legendary rarity level must be less than or equal to the max rarity roll"
    );
  });

  it("Should set reward only by users with ADMIN_ROLE", async function () {
    const [owner, admin] = await ethers.getSigners();

    const adminRole = await itemFactory.ADMIN_ROLE();
    const rewardType = 1;
    const rewardRarity = 2;
    const min = 10;
    const max = 20;
    const ids = [1, 2, 3, 4, 5];
    const rewardData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256[]"],
      [min, max, ids]
    );

    await expect(
      itemFactory.connect(admin).setReward(rewardType, rewardRarity, rewardData)
    ).to.be.revertedWith(
      `AccessControl: account ${admin.address.toLowerCase()} is missing role ${adminRole}`
    );

    await itemFactory.grantRole(adminRole, admin.address);

    await itemFactory
      .connect(admin)
      .setReward(rewardType, rewardRarity, rewardData);
  });
});
