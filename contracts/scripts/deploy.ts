import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  KOMOE — Déploiement BudgetLedger.sol");
  console.log(`  Réseau : ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log("═══════════════════════════════════════════════════\n");

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Déployeur : ${deployerAddress}`);
  console.log(`Balance   : ${ethers.formatEther(balance)} MATIC\n`);

  if (balance === 0n) {
    throw new Error(
      "❌ Balance déployeur = 0. Alimente ce wallet avec du MATIC testnet :\n" +
      "   https://faucet.polygon.technology/ (Amoy testnet)"
    );
  }

  // ─── Déploiement du contrat ──────────────────────────────────────────────
  console.log("📦 Déploiement de BudgetLedger...");

  const BudgetLedger = await ethers.getContractFactory("BudgetLedger");
  const budgetLedger = await BudgetLedger.deploy(deployerAddress);
  await budgetLedger.waitForDeployment();

  const contractAddress = await budgetLedger.getAddress();
  const deployTx = budgetLedger.deploymentTransaction();

  console.log(`✅ BudgetLedger déployé à : ${contractAddress}`);
  console.log(`   TX Hash  : ${deployTx?.hash}`);
  console.log(`   Bloc     : ${deployTx?.blockNumber ?? "en attente..."}\n`);

  // ─── Vérification des rôles ──────────────────────────────────────────────
  const AGENT_ROLE = await budgetLedger.AGENT_ROLE();
  const MAIRE_ROLE = await budgetLedger.MAIRE_ROLE();
  const ADMIN_ROLE = await budgetLedger.DEFAULT_ADMIN_ROLE();

  console.log("🔐 Rôles du contrat :");
  console.log(`   DEFAULT_ADMIN_ROLE : ${ADMIN_ROLE}`);
  console.log(`   AGENT_ROLE        : ${AGENT_ROLE}`);
  console.log(`   MAIRE_ROLE        : ${MAIRE_ROLE}`);
  console.log(`   Admin actuel      : ${deployerAddress}\n`);

  // ─── Sauvegarde de l'adresse déployée ────────────────────────────────────
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress,
    deployerAddress,
    txHash: deployTx?.hash,
    deployedAt: new Date().toISOString(),
    roles: {
      DEFAULT_ADMIN_ROLE: ADMIN_ROLE,
      AGENT_ROLE,
      MAIRE_ROLE,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Infos de déploiement sauvegardées : ${deploymentFile}`);

  // ─── Instructions post-déploiement ───────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ÉTAPES SUIVANTES");
  console.log("═══════════════════════════════════════════════════");

  if (network.name === "amoy") {
    console.log("\n1️⃣  Vérifier le contrat sur Polygonscan Amoy :");
    console.log(`   npx hardhat verify --network amoy ${contractAddress} "${deployerAddress}"`);
    console.log(`\n2️⃣  Lien Polygonscan :`);
    console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);
  }

  console.log(`\n3️⃣  Copier dans le .env.local du frontend Next.js :`);
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`\n4️⃣  Copier dans le .env du backend Django :`);
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n✅ Déploiement terminé !\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur de déploiement :", error);
    process.exit(1);
  });
