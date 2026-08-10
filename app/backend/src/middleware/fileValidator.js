const fs = require('fs');
const path = require('path');

/**
 * Magic bytes / file signatures untuk validasi tipe file sebenarnya.
 * Mencegah file palsu yang hanya di-rename ekstensinya.
 */
const FILE_SIGNATURES = {
    pdf: {
        magic: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
        description: 'PDF Document'
    },
    doc: {
        magic: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]), // OLE Compound File (MS Office legacy)
        description: 'Microsoft Word Document (DOC)'
    },
    docx: {
        magic: Buffer.from([0x50, 0x4B, 0x03, 0x04]), // PK (ZIP archive - OOXML)
        description: 'Microsoft Word Document (DOCX)'
    }
};

/**
 * Middleware yang berjalan SETELAH multer menyimpan file.
 * Membaca byte pertama file dan memvalidasi terhadap magic bytes yang diharapkan.
 * Jika tidak valid, file dihapus dan request ditolak.
 */
const fileValidator = (req, res, next) => {
    if (!req.file) {
        return next(); // Tidak ada file, lanjutkan (controller akan handle)
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Cek ukuran file tidak 0 byte
    try {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            fs.unlinkSync(filePath); // Hapus file kosong
            return res.status(400).json({
                detail: 'File yang diupload kosong (0 byte). Silakan upload file yang valid.'
            });
        }
    } catch (err) {
        return res.status(500).json({
            detail: 'Gagal memvalidasi file yang diupload.'
        });
    }

    // Baca 4 byte pertama untuk cek magic bytes
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    // Tentukan magic bytes yang diharapkan berdasarkan ekstensi
    const expectedSignature = FILE_SIGNATURES[ext];

    if (!expectedSignature) {
        // Ekstensi tidak dikenali (seharusnya sudah di-filter multer, tapi jaga-jaga)
        fs.unlinkSync(filePath);
        return res.status(400).json({
            detail: `Tipe file .${ext} tidak didukung. Hanya PDF, DOC, dan DOCX yang diizinkan.`
        });
    }

    // Bandingkan magic bytes
    const magicLength = expectedSignature.magic.length;
    const fileMagic = buffer.slice(0, magicLength);

    if (!fileMagic.equals(expectedSignature.magic)) {
        // Magic bytes tidak cocok — file palsu!
        fs.unlinkSync(filePath);

        // Cek apakah magic bytes cocok dengan tipe lain (info tambahan)
        let actualType = 'tidak diketahui';
        for (const [type, sig] of Object.entries(FILE_SIGNATURES)) {
            if (fileMagic.equals(sig.magic.slice(0, magicLength))) {
                actualType = sig.description;
                break;
            }
        }

        return res.status(400).json({
            detail: `File tidak valid. File memiliki ekstensi .${ext} tetapi isi file bukan ${expectedSignature.description}. ` +
                    `Tipe file sebenarnya: ${actualType}. ` +
                    `Pastikan Anda mengupload file yang asli, bukan file yang di-rename.`
        });
    }

    // Validasi berhasil
    next();
};

module.exports = fileValidator;
