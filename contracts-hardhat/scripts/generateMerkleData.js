const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('hardhat');

async function generateMerkleData() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const addresses = [owner.address, addr1.address, addr2.address];

    const leaves = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = merkleTree.getHexRoot();

    const targetAddress = addr2.address; // The address you are using in MetaMask
    const targetLeaf = keccak256(targetAddress);
    const targetProof = merkleTree.getHexProof(targetLeaf);

    console.log("Merkle Root:", root);
    console.log("Target Address:", targetAddress);
    console.log("Target Merkle Proof:", JSON.stringify(targetProof));
}

generateMerkleData()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });