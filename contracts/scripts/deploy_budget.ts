import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Déploiement avec le compte :", deployer.address);
  console.log("💰 Solde :", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "POL");

  const BudgetLedger = await ethers.getContractFactory("BudgetLedger");
  const contract = await BudgetLedger.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ BudgetLedger déployé à :", address);

  // MVP custodial : le wallet DGDDL (backend) reçoit AGENT_ROLE + MAIRE_ROLE
  // Il peut donc signer pour toutes les communes grâce au bypass DEFAULT_ADMIN_ROLE
  const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT_ROLE"));
  const MAIRE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAIRE_ROLE"));

  await (await contract.grantRole(AGENT_ROLE, deployer.address)).wait();
  console.log("✅ AGENT_ROLE attribué au wallet DGDDL");

  await (await contract.grantRole(MAIRE_ROLE, deployer.address)).wait();
  console.log("✅ MAIRE_ROLE attribué au wallet DGDDL");

  console.log("\n📋 RÉSUMÉ — à copier dans vos fichiers .env :");
  console.log("CONTRACT_ADDRESS=", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
