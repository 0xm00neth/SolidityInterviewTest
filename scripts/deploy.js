async function main() {
  const [owner] = await ethers.getSigners();
  console.log("owner:", owner.address);

  console.log("Deploying Milk...");
  const Milk = await ethers.getContractFactory("Milk");
  const milk = await Milk.deploy("MilkToken", "MILK");
  console.log("Deploying Milk to:", milk.address);
  await milk.deployed();
  console.log("Milk deployed");

  console.log("Deploying ItemFactory...");
  const ItemFactory = await ethers.getContractFactory("ItemFactory");
  const itemFactory = await ItemFactory.deploy("{id}.json", milk.address);
  console.log("Deploying ItemFactory to:", itemFactory.address);
  await itemFactory.deployed();
  console.log("ItemFactory deployed");

  console.log("Granting CONTRACT_ROLE to itemFactory contract");
  const contractRole = await milk.CONTRACT_ROLE();
  await milk.grantRole(contractRole, itemFactory.address);
  console.log("Granted CONTRACT_ROLE");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
