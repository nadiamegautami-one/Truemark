// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrueMark {
    // Struktur data untuk rekaman file
    struct FileRecord {
        string owner;
        uint256 timestamp;
    }

    // Mapping hash file ke data pemilik dan waktu registrasi
    mapping(string => FileRecord) public files;

    // Event saat file terdaftar
    event FileRegistered(string fileHash, string owner, uint256 timestamp);

    // Modifier untuk mencegah hash duplikat
    modifier notRegistered(string memory fileHash) {
        require(bytes(files[fileHash].owner).length == 0, "File already registered");
        _;
    }

    // Fungsi untuk register file
    function registerFile(string memory fileHash, string memory owner) public notRegistered(fileHash) {
        files[fileHash] = FileRecord(owner, block.timestamp);
        emit FileRegistered(fileHash, owner, block.timestamp);
    }

    // Fungsi untuk verifikasi file
    function verifyFile(string memory fileHash) public view returns (string memory owner, uint256 timestamp) {
        owner = files[fileHash].owner;
        timestamp = files[fileHash].timestamp;
    }
}