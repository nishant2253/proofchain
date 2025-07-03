const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("ProofChainMultiTokenVoting", function () {
  let proofChain;
  let owner;
  let addr1;
  let addr2;
  let merkleTree;
  let merkleRoot;

  before(async function () {
    // Create a simple merkle tree for testing
    const addresses = [];
    [owner, addr1, addr2] = await ethers.getSigners();
    addresses.push(owner.address, addr1.address, addr2.address);

    // Create merkle tree
    const leaves = addresses.map((addr) => keccak256(addr));
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();
  });

  beforeEach(async function () {
    const ProofChain = await ethers.getContractFactory(
      "ProofChainMultiTokenVoting"
    );
    proofChain = await ProofChain.deploy(merkleRoot);
  });

  it("Should set the correct merkle root", async function () {
    expect(await proofChain.verifiedIdentityRoot()).to.equal(merkleRoot);
  });

  it("Should allow the owner to set a new merkle root", async function () {
    const newRoot = "0x" + "1".repeat(64);
    await proofChain.setVerifiedIdentityRoot(newRoot);
    expect(await proofChain.verifiedIdentityRoot()).to.equal(newRoot);
  });

  it("Should verify identity correctly", async function () {
    const leaf = keccak256(owner.address);
    const proof = merkleTree.getHexProof(leaf);

    expect(await proofChain.isVerifiedIdentity(owner.address, proof)).to.be
      .true;

    // Should return false for an invalid proof
    const invalidProof = ["0x" + "1".repeat(64)];
    expect(await proofChain.isVerifiedIdentity(owner.address, invalidProof)).to
      .be.false;
  });
});
