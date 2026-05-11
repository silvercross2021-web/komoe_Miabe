import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { BudgetLedger } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BudgetLedger", function () {
  let budgetLedger: BudgetLedger;
  let admin: SignerWithAddress;
  let agent: SignerWithAddress;
  let maire: SignerWithAddress;
  let autreWallet: SignerWithAddress;

  // Données de test
  const DEPENSE_ID = "dep-uuid-001";
  const COMMUNE_ID = "commune-abidjan-cocody";
  const MONTANT = ethers.parseUnits("50000000", 0); // 50 millions FCFA
  const CATEGORIE = "Infrastructure";
  const IPFS_HASH = "QmXkj9abc123def456ghi789jkl012mno345pqr678stu";
  const RECETTE_ID = "rec-uuid-001";
  const SOURCE = "Taxes locales";

  beforeEach(async function () {
    [admin, agent, maire, autreWallet] = await ethers.getSigners();

    const BudgetLedgerFactory = await ethers.getContractFactory("BudgetLedger");
    budgetLedger = await BudgetLedgerFactory.deploy(admin.address);
    await budgetLedger.waitForDeployment();
  });

  // ─── Tests de déploiement ────────────────────────────────────────────────

  describe("Déploiement", function () {
    it("attribue DEFAULT_ADMIN_ROLE à l'admin déployeur", async function () {
      const adminRole = await budgetLedger.DEFAULT_ADMIN_ROLE();
      expect(await budgetLedger.hasRole(adminRole, admin.address)).to.be.true;
    });

    it("n'attribue pas AGENT_ROLE ni MAIRE_ROLE au déployeur par défaut", async function () {
      const AGENT_ROLE = await budgetLedger.AGENT_ROLE();
      const MAIRE_ROLE = await budgetLedger.MAIRE_ROLE();
      expect(await budgetLedger.hasRole(AGENT_ROLE, admin.address)).to.be.false;
      expect(await budgetLedger.hasRole(MAIRE_ROLE, admin.address)).to.be.false;
    });

    it("initialise totalTransactions à 0", async function () {
      expect(await budgetLedger.totalTransactions()).to.equal(0n);
    });

    it("n'est pas en pause au déploiement", async function () {
      expect(await budgetLedger.paused()).to.be.false;
    });

    it("rejette l'adresse admin nulle (address(0))", async function () {
      const Factory = await ethers.getContractFactory("BudgetLedger");
      await expect(
        Factory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("BudgetLedger: adresse admin invalide");
    });
  });

  // ─── Tests de gestion des rôles ──────────────────────────────────────────

  describe("Gestion des rôles", function () {
    it("attribuerRoleAgent : admin peut attribuer AGENT_ROLE", async function () {
      await budgetLedger.connect(admin).attribuerRoleAgent(agent.address);
      expect(await budgetLedger.estAgent(agent.address)).to.be.true;
    });

    it("attribuerRoleAgent : émet l'event AgentRoleAttribue", async function () {
      await expect(budgetLedger.connect(admin).attribuerRoleAgent(agent.address))
        .to.emit(budgetLedger, "AgentRoleAttribue")
        .withArgs(agent.address, admin.address, anyValue);
    });

    it("attribuerRoleMaire : admin peut attribuer MAIRE_ROLE", async function () {
      await budgetLedger.connect(admin).attribuerRoleMaire(maire.address);
      expect(await budgetLedger.estMaire(maire.address)).to.be.true;
    });

    it("attribuerRoleMaire : émet l'event MaireRoleAttribue", async function () {
      await expect(budgetLedger.connect(admin).attribuerRoleMaire(maire.address))
        .to.emit(budgetLedger, "MaireRoleAttribue")
        .withArgs(maire.address, admin.address, anyValue);
    });

    it("attribuerRoleAgent : rejette l'adresse nulle", async function () {
      await expect(
        budgetLedger.connect(admin).attribuerRoleAgent(ethers.ZeroAddress)
      ).to.be.revertedWith("BudgetLedger: adresse invalide");
    });

    it("attribuerRoleAgent : revert si appelé par un non-admin", async function () {
      await expect(
        budgetLedger.connect(autreWallet).attribuerRoleAgent(agent.address)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });

    it("revoquerRole : admin peut révoquer AGENT_ROLE", async function () {
      await budgetLedger.connect(admin).attribuerRoleAgent(agent.address);
      const AGENT_ROLE = await budgetLedger.AGENT_ROLE();
      await budgetLedger.connect(admin).revoquerRole(AGENT_ROLE, agent.address);
      expect(await budgetLedger.estAgent(agent.address)).to.be.false;
    });

    it("revoquerRole : revert si appelé par un non-admin", async function () {
      const AGENT_ROLE = await budgetLedger.AGENT_ROLE();
      await expect(
        budgetLedger.connect(autreWallet).revoquerRole(AGENT_ROLE, agent.address)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });
  });

  // ─── Tests soumettreDepense ───────────────────────────────────────────────

  describe("soumettreDepense", function () {
    beforeEach(async function () {
      await budgetLedger.connect(admin).attribuerRoleAgent(agent.address);
    });

    it("émet l'event DepenseSoumise avec les bons arguments", async function () {
      const tx = await budgetLedger
        .connect(agent)
        .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH);

      await expect(tx)
        .to.emit(budgetLedger, "DepenseSoumise")
        .withArgs(
          DEPENSE_ID,
          COMMUNE_ID,
          MONTANT,
          CATEGORIE,
          IPFS_HASH,
          agent.address,
          await getBlockTimestamp(tx)
        );
    });

    it("incrémente totalTransactions après une soumission", async function () {
      await budgetLedger
        .connect(agent)
        .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH);
      expect(await budgetLedger.totalTransactions()).to.equal(1n);
    });

    it("revert si appelé par un non-Agent", async function () {
      await expect(
        budgetLedger
          .connect(autreWallet)
          .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });

    it("revert si appelé par le Maire (pas AGENT_ROLE)", async function () {
      await budgetLedger.connect(admin).attribuerRoleMaire(maire.address);
      await expect(
        budgetLedger
          .connect(maire)
          .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });

    it("revert si depenseId est vide", async function () {
      await expect(
        budgetLedger
          .connect(agent)
          .soumettreDepense("", COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWith("BudgetLedger: depenseId vide");
    });

    it("revert si communeId est vide", async function () {
      await expect(
        budgetLedger
          .connect(agent)
          .soumettreDepense(DEPENSE_ID, "", MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWith("BudgetLedger: communeId vide");
    });

    it("revert si montant est 0", async function () {
      await expect(
        budgetLedger
          .connect(agent)
          .soumettreDepense(DEPENSE_ID, COMMUNE_ID, 0, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWith("BudgetLedger: montant doit etre positif");
    });

    it("revert si ipfsHash est vide", async function () {
      await expect(
        budgetLedger
          .connect(agent)
          .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, "")
      ).to.be.revertedWith("BudgetLedger: ipfsHash vide");
    });

    it("revert si le contrat est en pause", async function () {
      await budgetLedger.connect(admin).pause();
      await expect(
        budgetLedger
          .connect(agent)
          .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "EnforcedPause");
    });

    it("peut soumettre plusieurs dépenses successives", async function () {
      await budgetLedger
        .connect(agent)
        .soumettreDepense("dep-001", COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH);
      await budgetLedger
        .connect(agent)
        .soumettreDepense("dep-002", COMMUNE_ID, ethers.parseUnits("10000000", 0), "Santé", IPFS_HASH);
      await budgetLedger
        .connect(agent)
        .soumettreDepense("dep-003", "commune-yamoussoukro", MONTANT, "Éducation", IPFS_HASH);

      expect(await budgetLedger.totalTransactions()).to.equal(3n);
    });
  });

  // ─── Tests validerDepense ─────────────────────────────────────────────────

  describe("validerDepense", function () {
    beforeEach(async function () {
      await budgetLedger.connect(admin).attribuerRoleMaire(maire.address);
    });

    it("émet l'event DepenseValidee avec les bons arguments", async function () {
      const tx = await budgetLedger
        .connect(maire)
        .validerDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH);

      await expect(tx)
        .to.emit(budgetLedger, "DepenseValidee")
        .withArgs(
          DEPENSE_ID,
          COMMUNE_ID,
          MONTANT,
          CATEGORIE,
          IPFS_HASH,
          maire.address,
          await getBlockTimestamp(tx)
        );
    });

    it("revert si appelé par un non-Maire", async function () {
      await expect(
        budgetLedger
          .connect(autreWallet)
          .validerDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });

    it("revert si appelé par l'Agent (pas MAIRE_ROLE)", async function () {
      await budgetLedger.connect(admin).attribuerRoleAgent(agent.address);
      await expect(
        budgetLedger
          .connect(agent)
          .validerDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });

    it("revert si montant est 0", async function () {
      await expect(
        budgetLedger
          .connect(maire)
          .validerDepense(DEPENSE_ID, COMMUNE_ID, 0, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWith("BudgetLedger: montant doit etre positif");
    });

    it("revert si le contrat est en pause", async function () {
      await budgetLedger.connect(admin).pause();
      await expect(
        budgetLedger
          .connect(maire)
          .validerDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "EnforcedPause");
    });

    it("reprend après unpause", async function () {
      await budgetLedger.connect(admin).pause();
      await budgetLedger.connect(admin).unpause();
      await expect(
        budgetLedger
          .connect(maire)
          .validerDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH)
      ).to.emit(budgetLedger, "DepenseValidee");
    });
  });

  // ─── Tests enregistrerRecette ─────────────────────────────────────────────

  describe("enregistrerRecette", function () {
    beforeEach(async function () {
      await budgetLedger.connect(admin).attribuerRoleMaire(maire.address);
    });

    it("émet l'event RecetteEnregistree avec les bons arguments", async function () {
      const tx = await budgetLedger
        .connect(maire)
        .enregistrerRecette(RECETTE_ID, COMMUNE_ID, MONTANT, SOURCE, IPFS_HASH);

      await expect(tx)
        .to.emit(budgetLedger, "RecetteEnregistree")
        .withArgs(
          RECETTE_ID,
          COMMUNE_ID,
          MONTANT,
          SOURCE,
          IPFS_HASH,
          maire.address,
          await getBlockTimestamp(tx)
        );
    });

    it("revert si appelé par un non-Maire", async function () {
      await expect(
        budgetLedger
          .connect(autreWallet)
          .enregistrerRecette(RECETTE_ID, COMMUNE_ID, MONTANT, SOURCE, IPFS_HASH)
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });

    it("revert si source est vide", async function () {
      await expect(
        budgetLedger
          .connect(maire)
          .enregistrerRecette(RECETTE_ID, COMMUNE_ID, MONTANT, "", IPFS_HASH)
      ).to.be.revertedWith("BudgetLedger: source vide");
    });
  });

  // ─── Tests pause/unpause ──────────────────────────────────────────────────

  describe("Pause d'urgence", function () {
    it("admin peut mettre en pause", async function () {
      await budgetLedger.connect(admin).pause();
      expect(await budgetLedger.paused()).to.be.true;
    });

    it("admin peut reprendre après pause", async function () {
      await budgetLedger.connect(admin).pause();
      await budgetLedger.connect(admin).unpause();
      expect(await budgetLedger.paused()).to.be.false;
    });

    it("non-admin ne peut pas mettre en pause", async function () {
      await expect(
        budgetLedger.connect(autreWallet).pause()
      ).to.be.revertedWithCustomError(budgetLedger, "AccessControlUnauthorizedAccount");
    });
  });

  // ─── Tests flux complet bout-en-bout ─────────────────────────────────────

  describe("Flux complet : Agent soumet → Maire valide", function () {
    it("simule le flux complet d'une transaction budgétaire", async function () {
      // 1. Setup des rôles
      await budgetLedger.connect(admin).attribuerRoleAgent(agent.address);
      await budgetLedger.connect(admin).attribuerRoleMaire(maire.address);

      expect(await budgetLedger.estAgent(agent.address)).to.be.true;
      expect(await budgetLedger.estMaire(maire.address)).to.be.true;

      // 2. Agent soumet la dépense (brouillon blockchain)
      const txSoumission = await budgetLedger
        .connect(agent)
        .soumettreDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH);

      await expect(txSoumission)
        .to.emit(budgetLedger, "DepenseSoumise")
        .withArgs(
          DEPENSE_ID,
          COMMUNE_ID,
          MONTANT,
          CATEGORIE,
          IPFS_HASH,
          agent.address,
          await getBlockTimestamp(txSoumission)
        );

      expect(await budgetLedger.totalTransactions()).to.equal(1n);

      // 3. Maire valide définitivement (preuve immuable publique)
      const txValidation = await budgetLedger
        .connect(maire)
        .validerDepense(DEPENSE_ID, COMMUNE_ID, MONTANT, CATEGORIE, IPFS_HASH);

      await expect(txValidation)
        .to.emit(budgetLedger, "DepenseValidee")
        .withArgs(
          DEPENSE_ID,
          COMMUNE_ID,
          MONTANT,
          CATEGORIE,
          IPFS_HASH,
          maire.address,
          await getBlockTimestamp(txValidation)
        );

      // 4. Vérification : les deux events sont bien dans les receipts
      const receiptSoumission = await txSoumission.wait();
      const receiptValidation = await txValidation.wait();

      expect(receiptSoumission?.status).to.equal(1); // succès
      expect(receiptValidation?.status).to.equal(1); // succès

      console.log("\n    ✅ Flux complet validé :");
      console.log(`       TX Soumission : ${txSoumission.hash}`);
      console.log(`       TX Validation : ${txValidation.hash}`);
      console.log(`       Hash IPFS ancré : ${IPFS_HASH}`);
    });
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp + 1;
}

async function getBlockTimestamp(tx: any): Promise<number> {
  const receipt = await tx.wait();
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  return block!.timestamp;
}
