// script.js

// Konfigurasi kontrak dan provider
const contractAddress = "0xYourContractAddressHere"; // Ganti dengan alamat kontrak Anda
const contractABI = [
  // ABI dari smart contract
  "event FileRegistered(string fileHash, string owner, uint256 timestamp)",
  "function registerFile(string memory fileHash, string memory owner) public",
  "function verifyFile(string memory fileHash) public view returns (string memory owner, uint256 timestamp)"
];

let provider, signer, contract;
let currentHash = "";
let currentOwner = "";

// Inisialisasi koneksi ke metamask
async function init() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("Connected to Ethereum");
  } else {
    alert("Harap Install MetaMask!");
  }
}

// Fungsi hashing file menggunakan crypto.subtle.digest
async function hashFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Event listener upload file
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    // Tampilkan loader atau animasi jika perlu
    document.getElementById('fileHash').textContent = "Calculating hash...";
    document.getElementById('hashCard').classList.remove('opacity-0');

    // Hitung hash
    currentHash = await hashFile(file);
    document.getElementById('fileHash').textContent = currentHash;

    // Tampilkan tombol register/verify
    document.getElementById('actionButtons').style.display = 'flex';

    // Reset hasil sebelumnya
    document.getElementById('result').style.opacity = 0;
    document.getElementById('certificate').classList.add('hidden');
    document.getElementById('qrcodeContainer').innerHTML = "";
  }
});

// Register ownership
document.getElementById('registerBtn').addEventListener('click', async () => {
  const owner = prompt("Enter your name:");
  if (!owner) return alert("Owner name is required!");

  try {
    // Panggil smart contract untuk register file
    const tx = await contract.registerFile(currentHash, owner);
    await tx.wait();

    // Tampilkan sertifikat
    await generateCertificate(currentHash, owner);
    alert("Ownership registered successfully!");

  } catch (err) {
    console.error(err);
    alert("Error during registration: " + err.message);
  }
});

// Verify ownership
document.getElementById('verifyBtn').addEventListener('click', async () => {
  try {
    const [owner, timestamp] = await contract.verifyFile(currentHash);
    if (owner) {
      // Tampilkan hasil verifikasi
      showResult(`Owner: ${owner}\nDate: ${new Date(timestamp.toNumber() * 1000).toLocaleString()}\nHash: ${currentHash}`);
    } else {
      showResult("This file hash is not registered yet. You can register it.");
    }
  } catch (err) {
    console.error(err);
    showResult("File not found or error occurred.");
  }
});

// Fungsi menampilkan hasil
function showResult(message) {
  const resultDiv = document.getElementById('result');
  resultDiv.textContent = message;
  resultDiv.classList.remove('opacity-0');
}

// Fungsi generate sertifikat
async function generateCertificate(hash, owner) {
  const canvas = document.getElementById('certCanvas');
  const ctx = canvas.getContext('2d');

  // Atur ukuran canvas
  const width = 600;
  const height = 400;
  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);

  // Teks sertifikat
  ctx.fillStyle = "#0ff";
  ctx.font = "20px Arial Rounded MT Bold";
  ctx.fillText("TrueMark Ownership Certificate", 50, 50);

  ctx.font = "16px Arial";
  ctx.fillText(`Hash: ${hash}`, 20, 100);
  ctx.fillText(`Owner: ${owner}`, 20, 130);
  ctx.fillText(`Date: ${new Date().toLocaleString()}`, 20, 160);

  // Render QR code nanti di generateQR
  document.getElementById('certificate').classList.remove('hidden');
}

// Download sertifikat
document.getElementById('downloadCert').addEventListener('click', () => {
  const canvas = document.getElementById('certCanvas');
  const link = document.createElement('a');
  link.download = 'ownership_certificate.png';
  link.href = canvas.toDataURL();
  link.click();
});

// Generate QR code
document.getElementById('generateQR').addEventListener('click', () => {
  const link = `https://sepolia.etherscan.io/address/${contractAddress}`;
  const container = document.getElementById('qrcodeContainer');
  container.innerHTML = "";
  QRCode.toCanvas(link, { width: 200 }, function (error, canvas) {
    if (error) console.error(error);
    container.appendChild(canvas);
  });
});

// Inisialisasi saat halaman dimuat
window.addEventListener('load', () => {
  init();
});
