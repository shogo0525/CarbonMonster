import { ethers, artifacts } from "hardhat";
import path from "path";
import { CarbonMonster } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const CarbonMonster = await ethers.getContractFactory("CarbonMonster");
  const carbonMonster = await CarbonMonster.deploy();
  await carbonMonster.deployed();

  console.log("CarbonMonster address:", carbonMonster.address);

  saveFrontendFiles(carbonMonster);
}

function saveFrontendFiles(carbonMonster: CarbonMonster) {
  const fs = require("fs");
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contracts"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ CarbonMonster: carbonMonster.address }, undefined, 2)
  );

  const CarbonMonsterArtifact = artifacts.readArtifactSync("CarbonMonster");

  fs.writeFileSync(
    path.join(contractsDir, "CarbonMonster.json"),
    JSON.stringify(CarbonMonsterArtifact, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
