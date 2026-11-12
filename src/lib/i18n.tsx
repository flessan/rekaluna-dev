import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "id";

const messages = {
  en: {
    workspace: "Workspace", quickPrint: "Quick Print", priceDesk: "Price Desk",
    resources: "Resources", support: "Support", about: "About", navigate: "Navigate",
    quick: "Quick", searchCommands: "Search commands", settings: "Settings",
    printWorkspace: "Print workspace", localFirst: "Local-first · Offline ready · No account",
    searchRekaluna: "Search Rekaluna…", search: "Search", home: "Home", print: "Print",
    price: "Price", tools: "Tools", more: "More", notFound: "Page not found",
    pageMissing: "That page does not exist in this workspace.", backWorkspace: "Back to Workspace",
    offline: "You're offline - Rekaluna keeps working locally.",
    language: "Language", languageHint: "Choose the language used across Rekaluna.",
    english: "English", indonesian: "Bahasa Indonesia",
    printingDefaults: "Printing defaults", paperSize: "Paper size", orientation: "Orientation",
    theme: "Theme", data: "Data", exportData: "Export data", importData: "Import data",
    clearData: "Clear local data", shortcuts: "Shortcuts", supportSection: "Price desk",
    quickMoney: "Quick money buttons", commaSeparatedRupiah: "Comma-separated Rupiah amounts.", editServicesHint: "Edit services directly from Price Desk using the Edit services button.", addAmountError: "Add at least one amount.", quickMoneySaved: "Quick money saved.", dataExported: "Data exported.", dataImported: "Data imported.", importFailed: "Could not read file.", dataCleared: "Data cleared.", currentQuickMoney: "Current quick money:", cashItem: "Cash", resourceNameExample: "e.g. Epson L3210 Driver", categoryExample: "Driver / PDF / Image / Utility", noteExample: "e.g. Use for L-series", light: "Light", dark: "Dark", system: "System", services: "Services", interface: "Interface",
    saveAmounts: "Save amounts", cancel: "Cancel", name: "Name", url: "URL",
    category: "Category", optionalNote: "Note (optional)", clearConfirm: "Clear all local data? This resets services, favorites, and settings.",
    dataStored: "Everything is stored on this device. Use export to back up or move between computers.",
    shortcutSearch: "Open command search", shortcutPaste: "Paste image in Quick Print",
    shortcutPrint: "Print the current sheet", shortcutClose: "Close modals / sheets",
    qpTitle: "Quick Print", qpSubtitle: "Arrange multiple images on one sheet, then print.",
    addImages: "Add images", addImage: "Add image", addFrame: "Add frame", selectFiles: "Select files",
    dropHint: "Drop images anywhere on the sheet", emptyTitle: "Your sheet is ready",
    emptyHint: "Add images, paste with Ctrl V, or drop files onto the paper.",
    frameHint: "Empty frame · drop an image here", paper: "Paper", paperBackground: "Paper background", chooseBackground: "Choose a background color", customColor: "Custom color", colorPrintNote: "Background colors are included in the print sheet. Printer output may depend on its color settings.", white: "White", warm: "Warm", sky: "Sky", mint: "Mint", blush: "Blush", lavender: "Lavender", slate: "Slate", charcoal: "Charcoal", portrait: "Portrait",
    landscape: "Landscape", margin: "Safe margin", noMargin: "None", small: "Small",
    normal: "Normal", large: "Large", snapping: "Snap guides", snappingHint: "Align to page edges and nearby objects",
    quickLayouts: "Quick layouts", twoUp: "2-up", threeUp: "3-up", fourUp: "4-up", sixUp: "6-up",
    shape: "Shape", square: "Square", rounded: "Rounded", circle: "Circle",
    oval: "Oval", selectedObject: "Selected object", noSelection: "Select an object to edit its position and size.",
    position: "Position", size: "Size", rotation: "Rotation", width: "Width", height: "Height",
    duplicate: "Duplicate", delete: "Delete", centerPage: "Center on page", bringForward: "Bring forward",
    sendBackward: "Send backward", fit: "Fit", fill: "Fill", imageFit: "Image fit", cover: "Cover", contain: "Contain",
    objects: "Objects", noObjects: "No objects yet", image: "Image", frame: "Frame",
    printSheet: "Print sheet", clearSheet: "Clear sheet", undo: "Undo", redo: "Redo",
    precise: "Fine movement (0.1 mm)", preciseHint: "Arrow keys move the selected object. Hold Shift for 10 mm.",
    dropToFill: "Drop an image to fill this frame", imageCount: "images", objectCount: "objects",
    sheetPreview: "Sheet preview", page: "Page", marginGuide: "Safe area",
    localPrivacy: "Images stay on this device. Nothing is uploaded.",
    selectObject: "Select an object", rotateLeft: "Rotate 90°", addLayout: "Add layout",
    replaceImage: "Replace image", selectImage: "Select image", removeAll: "Remove all",
    confirmClear: "Remove every object from this sheet?",
    zoom: "Preview zoom", layers: "Layers", moveHint: "Drag to move · use arrow keys for precise positioning",
    frameFilled: "Frame filled", imageAdded: "Image added", copied: "Object duplicated",
    unsupportedFile: "Choose an image file to continue.", loading: "Loading image…",
    morning: "Good morning.", afternoon: "Good afternoon.", evening: "Good evening.", welcomeBack: "Welcome back.",
    workspaceTagline: "One workspace. Every essential tool. Zero friction.", localOnly: "Local-only · nothing leaves this device",
    quickActions: "Quick actions", navigation: "Navigation", appGroup: "App", quickActionsGroup: "Quick Actions", resourcesGroup: "Resources", favoritesGroup: "Favorites", commandPalette: "Command palette", goWorkspace: "Go to Workspace", openQuickPrint: "Open Quick Print", openPriceDesk: "Open Price Desk", openResourceCenter: "Open Resource Center", openSupportDonate: "Open Support / Donate", aboutRekalunaCommand: "About Rekaluna", openSettings: "Open Settings", triggerPrintCommand: "Print current sheet (Ctrl+P)", pasteImageCommand: "Paste image to Quick Print", noMatchesTry: "No matches. Try print, price, or epson.", runCommand: "run", openCommand: "open", quickPrintDesc: "Paste, preview, print.", priceDeskDesc: "Answer How much? fast.", resourcesDesc: "Drivers and tools.", supportDesc: "Donate and say thanks.", favorite: "Favorite", unfavorite: "Unfavorite", favorites: "Favorites",
    pinDaily: "Pin tools you use daily", noFavorites: "Star a quick action to pin it here. Fewer clicks every morning.",
    recent: "Recent", nothingRecent: "Nothing here yet. Open a tool, print something, or calculate a price - your recent actions show up here.",
    keyboardFirst: "Keyboard first", commandSearch: "Command search", pasteIntoPrint: "Paste into Quick Print", closePanels: "Close panels",
    resourceCenter: "Resource Center", resourceDescription: "Drivers, PDF tools, and utilities - one tab away.",
    all: "All", driver: "Driver", pdfCategory: "PDF", imageCategory: "Image", utility: "Utility", printing: "Printing",
    linuxSupportEyebrow: "LINUX PRINT SETUP", linuxSupportTitle: "We support Linux printing.",
    linuxSupportBody: "Set up CUPS and the Epson L3210 ESC/P-R driver from your Linux desktop. No app account or photo editor required.",
    linuxOneLineTitle: "One-line installer", linuxLocalTitle: "Download and run locally",
    copyCommand: "Copy command", viewScript: "View script",
    linuxSafetyNote: "The one-line command downloads and executes the installer with Bash. Review the script first if you prefer to inspect what will run.",
    linuxModelFallback: "If L3210 is not listed in the CUPS driver picker, try the Epson L3250 Series profile. This is a practical fallback, not a guarantee for every driver build.",
    linuxCommandCopied: "Installer command copied.", linuxCopyFailed: "Could not copy. Select and copy the command manually.",
    addResource: "Add resource", searchResources: "Search resources…", noResources: "No resources match. Try another search or add your own.",
    edit: "Edit", open: "Open", editResource: "Edit resource", save: "Save", addedFavorite: "Added to favorites",
    removedFavorite: "Removed from favorites", resourceUpdated: "Resource updated", resourceAdded: "Resource added",
    resourceDeleted: "Resource deleted", close: "Close", serviceName: "Service name", note: "Note",
    priceSubtitle: "Answer “How much?” with one hand.", cashModeOn: "Cash mode: on", cashMode: "Cash mode",
    done: "Done", editServices: "Edit services", tapToEdit: "Tap to edit", tapToAdd: "Tap to add",
    newService: "New service", addService: "Add service", custom: "Custom", transaction: "Transaction",
    undoLast: "Undo (last)", clearAll: "Clear all", readyToCalculate: "Ready to calculate",
    calculateHint: "Tap a service, press a quick money button, or type a custom price. No confirmations - it just adds.", remove: "Remove", total: "Total", copy: "Copy", copyTotal: "Copy total",
    cashCheck: "Cash check", amountReceived: "Amount received", expected: "Expected", received: "Received",
    exact: "Exact", reset: "Reset", change: "Change", short: "Short",
    cashModeTip: "Tip: turn on Cash mode so quick-money buttons add to cash received.",
    addCustomItem: "Add custom item", priceRp: "Price (Rp)", addItem: "Add item",
    deleteService: "Delete service", enterNamePrice: "Enter name and price",
    itemRemoved: "Item removed", transactionCleared: "Transaction cleared", totalCopied: "Total copied",
    itemDuplicated: "Item duplicated", undone: "Undone", supportTitle: "Support Rekaluna",
    qris: "QRIS", scanQris: "Scan with any e-wallet / mobile banking app",
    aboutTitle: "About Rekaluna", philosophy: "Philosophy", freeOpenSource: "Free and open-source.",
    mitBlurb: "MIT licensed. Inspect it, fork it, improve it.", privacyFriendly: "Privacy friendly.",
    privacyBlurb: "No accounts, no analytics, no tracking. Your data stays on your device.",
    localFirstTitle: "Local-first.", localFirstBlurb: "Works offline. No server required for core features.",
    operatorTitle: "Designed for operators.", operatorBlurb: "Every feature must answer: “does this save time?” If not, it is removed.",
    techStack: "Technology", noMatches: "No matches.", searchTools: "Search tools, resources, settings…",
    cancelAction: "Cancel", categoryLabel: "Category", optionalNoteLabel: "Note (optional)",
    xPosition: "X position", yPosition: "Y position", unlocked: "Unlocked", clear: "Clear", version: "Version", whatIsRekaluna: "What is Rekaluna?",
    aboutIntro: "Rekaluna is a browser workspace for print shop operators - the tool you leave open all day. It combines quick printing, a fast price calculator, and the resources you reach for every day into one calm, focused, offline-ready workspace.",
    whyCreated: "Why was it created?", whyCreatedBody: "Print operators juggle image editors, calculators, PDF tools, driver pages, price lists and screenshot utilities across a dozen windows. Rekaluna keeps daily workflows in one place.",
    technology: "Technology", technologyBody: "Rekaluna is built with React, TypeScript, Vite, and Tailwind CSS. Font Awesome provides the iconography. Persistence uses localStorage, while printing uses the browser's native print dialog. A service worker caches assets so the app keeps working offline.",
    contribute: "Contribute", contributeBody: "Found a bug or have an idea? Contributions are welcome. Translators, designers, and print operators are all encouraged to help shape the tool.",
    license: "License", licenseBody: "Rekaluna is released under the MIT License. You can use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, provided the original copyright notice is included.", supportIntro: "Rekaluna is free, open-source, and built for people who need a simple tool for everyday printing work. If Rekaluna helps your workflow, you can optionally donate through the QRIS code below.",
    supportNoObligation: "There is absolutely no obligation. Using Rekaluna is already meaningful support.", thankYou: "Thank you.", copySuffix: "copy", openIssuePrompt: "Open an issue or pull request on", copyDonation: "Copy donation link", openDonation: "Open donation page",
    donationCopied: "Donation link copied", contributionLine: "Rekaluna does not collect data, show ads, or require accounts. Every contribution - code, feedback, translations, or a kind word - helps the project.",
    layoutShape: "Layout shape", selectedCount: "objects selected", cropMode: "Adjust crop", finishCrop: "Finish crop", resetCrop: "Reset crop", cropZoom: "Crop zoom", cropHorizontal: "Horizontal position", cropVertical: "Vertical position", cropDragHint: "Drag the image inside its frame to reposition the crop.",
    bringToFront: "Bring to front", sendToBack: "Send to back", selectAll: "Select all", paste: "Paste", cut: "Cut", addSquareFrame: "Add square frame", addCircleFrame: "Add circle frame", addRoundedFrame: "Add rounded frame",

  },
  id: {
    workspace: "Ruang kerja", quickPrint: "Cetak cepat", priceDesk: "Daftar harga",
    resources: "Sumber daya", support: "Dukungan", about: "Tentang", navigate: "Navigasi",
    quick: "Akses cepat", searchCommands: "Cari perintah", settings: "Pengaturan",
    printWorkspace: "Ruang kerja percetakan", localFirst: "Lokal · Siap offline · Tanpa akun",
    searchRekaluna: "Cari di Rekaluna…", search: "Cari", home: "Beranda", print: "Cetak",
    price: "Harga", tools: "Alat", more: "Lainnya", notFound: "Halaman tidak ditemukan",
    pageMissing: "Halaman tersebut tidak tersedia di ruang kerja ini.", backWorkspace: "Kembali ke Ruang Kerja",
    offline: "Kamu sedang offline - Rekaluna tetap bisa digunakan secara lokal.",
    language: "Bahasa", languageHint: "Pilih bahasa yang digunakan di seluruh Rekaluna.",
    english: "English", indonesian: "Bahasa Indonesia",
    printingDefaults: "Pengaturan cetak bawaan", paperSize: "Ukuran kertas", orientation: "Orientasi",
    theme: "Tema", data: "Data", exportData: "Ekspor data", importData: "Impor data",
    clearData: "Hapus data lokal", shortcuts: "Pintasan", supportSection: "Daftar harga",
    quickMoney: "Tombol nominal cepat", commaSeparatedRupiah: "Pisahkan nominal Rupiah dengan koma.", editServicesHint: "Edit layanan langsung dari halaman Daftar Harga melalui tombol Edit layanan.", addAmountError: "Tambahkan setidaknya satu nominal.", quickMoneySaved: "Nominal cepat disimpan.", dataExported: "Data berhasil diekspor.", dataImported: "Data berhasil diimpor.", importFailed: "Berkas tidak dapat dibaca.", dataCleared: "Data lokal dihapus.", currentQuickMoney: "Nominal cepat saat ini:", cashItem: "Tunai", resourceNameExample: "mis. Driver Epson L3210", categoryExample: "Driver / PDF / Gambar / Utilitas", noteExample: "mis. Untuk seri L", light: "Terang", dark: "Gelap", system: "Sistem", services: "Layanan", interface: "Tampilan",
    saveAmounts: "Simpan nominal", cancel: "Batal", name: "Nama", url: "URL",
    category: "Kategori", optionalNote: "Catatan (opsional)", clearConfirm: "Hapus seluruh data lokal? Layanan, favorit, dan pengaturan akan direset.",
    dataStored: "Semua data disimpan di perangkat ini. Ekspor data untuk mencadangkan atau memindahkannya ke komputer lain.",
    shortcutSearch: "Buka pencarian perintah", shortcutPaste: "Tempel gambar di Cetak Cepat",
    shortcutPrint: "Cetak lembar aktif", shortcutClose: "Tutup dialog / panel",
    qpTitle: "Cetak Cepat", qpSubtitle: "Atur beberapa gambar dalam satu lembar, lalu cetak.",
    addImages: "Tambah gambar", addImage: "Tambah gambar", addFrame: "Tambah bingkai", selectFiles: "Pilih berkas",
    dropHint: "Lepaskan gambar di area kertas", emptyTitle: "Lembar siap digunakan",
    emptyHint: "Tambahkan gambar, tempel dengan Ctrl V, atau jatuhkan berkas ke kertas.",
    frameHint: "Bingkai kosong · jatuhkan gambar di sini", paper: "Kertas", paperBackground: "Warna latar kertas", chooseBackground: "Pilih warna latar", customColor: "Warna kustom", colorPrintNote: "Warna latar akan ikut dicetak. Hasilnya dapat dipengaruhi pengaturan warna printer.", white: "Putih", warm: "Hangat", sky: "Biru langit", mint: "Mint", blush: "Merah muda", lavender: "Lavender", slate: "Abu-abu kebiruan", charcoal: "Arang", portrait: "Potret",
    landscape: "Lanskap", margin: "Batas aman", noMargin: "Tanpa batas", small: "Kecil",
    normal: "Normal", large: "Besar", snapping: "Panduan snap", snappingHint: "Ratakan dengan tepi kertas dan objek di sekitar",
    quickLayouts: "Tata letak cepat", twoUp: "2 gambar", threeUp: "3 gambar", fourUp: "4 gambar", sixUp: "6 gambar",
    shape: "Bentuk", square: "Kotak", rounded: "Sudut bulat", circle: "Lingkaran",
    oval: "Oval", selectedObject: "Objek terpilih", noSelection: "Pilih objek untuk mengatur posisi dan ukurannya.",
    position: "Posisi", size: "Ukuran", rotation: "Rotasi", width: "Lebar", height: "Tinggi",
    duplicate: "Duplikat", delete: "Hapus", centerPage: "Tengahkan di kertas", bringForward: "Maju satu lapis",
    sendBackward: "Mundur satu lapis", fit: "Pas", fill: "Penuhi", imageFit: "Penyesuaian gambar", cover: "Penuhi bingkai", contain: "Tampilkan seluruh gambar",
    objects: "Objek", noObjects: "Belum ada objek", image: "Gambar", frame: "Bingkai",
    printSheet: "Cetak lembar", clearSheet: "Kosongkan lembar", undo: "Urungkan", redo: "Ulangi",
    precise: "Gerakan presisi (0,1 mm)", preciseHint: "Tombol panah menggeser objek. Tahan Shift untuk 10 mm.",
    dropToFill: "Jatuhkan gambar untuk mengisi bingkai ini", imageCount: "gambar", objectCount: "objek",
    sheetPreview: "Pratinjau lembar", page: "Halaman", marginGuide: "Area aman",
    localPrivacy: "Gambar tetap di perangkat ini. Tidak ada yang diunggah.",
    selectObject: "Pilih objek", rotateLeft: "Putar 90°", addLayout: "Tambah tata letak",
    replaceImage: "Ganti gambar", selectImage: "Pilih gambar", removeAll: "Hapus semua",
    confirmClear: "Hapus semua objek dari lembar ini?",
    zoom: "Perbesaran pratinjau", layers: "Lapisan", moveHint: "Seret untuk memindahkan · gunakan tombol panah untuk posisi presisi",
    frameFilled: "Bingkai terisi", imageAdded: "Gambar ditambahkan", copied: "Objek diduplikasi",
    unsupportedFile: "Pilih berkas gambar untuk melanjutkan.", loading: "Memuat gambar…",
    morning: "Selamat pagi.", afternoon: "Selamat siang.", evening: "Selamat sore.", welcomeBack: "Selamat datang kembali.",
    workspaceTagline: "Satu ruang kerja. Semua alat penting. Tanpa hambatan.", localOnly: "Hanya lokal · data tidak keluar dari perangkat",
    quickActions: "Aksi cepat", navigation: "Navigasi", appGroup: "Aplikasi", quickActionsGroup: "Aksi Cepat", resourcesGroup: "Sumber Daya", favoritesGroup: "Favorit", commandPalette: "Palet perintah", goWorkspace: "Buka Ruang Kerja", openQuickPrint: "Buka Cetak Cepat", openPriceDesk: "Buka Daftar Harga", openResourceCenter: "Buka Pusat Sumber Daya", openSupportDonate: "Buka Dukungan / Donasi", aboutRekalunaCommand: "Tentang Rekaluna", openSettings: "Buka Pengaturan", triggerPrintCommand: "Cetak lembar saat ini (Ctrl+P)", pasteImageCommand: "Tempel gambar ke Cetak Cepat", noMatchesTry: "Tidak ada hasil. Coba print, price, atau epson.", runCommand: "jalankan", openCommand: "buka", quickPrintDesc: "Tempel, lihat pratinjau, lalu cetak.", priceDeskDesc: "Hitung harga dengan cepat.", resourcesDesc: "Driver dan berbagai alat.", supportDesc: "Donasi dan beri dukungan.", favorite: "Tambahkan favorit", unfavorite: "Hapus dari favorit", favorites: "Favorit",
    pinDaily: "Sematkan alat yang sering digunakan", noFavorites: "Tandai aksi cepat untuk menyematkannya di sini. Lebih sedikit klik setiap hari.",
    recent: "Terbaru", nothingRecent: "Belum ada aktivitas. Buka alat, cetak sesuatu, atau hitung harga untuk melihat aktivitas terakhirmu di sini.",
    keyboardFirst: "Utamakan keyboard", commandSearch: "Pencarian perintah", pasteIntoPrint: "Tempel ke Cetak Cepat", closePanels: "Tutup panel",
    resourceCenter: "Pusat Sumber Daya", resourceDescription: "Driver, alat PDF, dan utilitas dalam satu tempat.",
    all: "Semua", driver: "Driver", pdfCategory: "PDF", imageCategory: "Gambar", utility: "Utilitas", printing: "Percetakan",
    linuxSupportEyebrow: "PENYIAPAN CETAK LINUX", linuxSupportTitle: "Kami mendukung Linux!",
    linuxSupportBody: "Siapkan CUPS dan driver Epson L3210 ESC/P-R langsung dari desktop Linux. Tanpa akun aplikasi dan tanpa editor foto tambahan.",
    linuxOneLineTitle: "Instalasi satu perintah", linuxLocalTitle: "Unduh lalu jalankan secara lokal",
    copyCommand: "Salin perintah", viewScript: "Lihat skrip",
    linuxSafetyNote: "Perintah satu baris akan mengunduh lalu menjalankan installer dengan Bash. Periksa isi skrip terlebih dahulu jika ingin meninjau perintah yang akan dijalankan.",
    linuxModelFallback: "Jika L3210 tidak tersedia di daftar driver CUPS, coba profil Epson L3250 Series. Ini opsi alternatif yang pernah berhasil, tetapi bukan jaminan untuk setiap versi driver.",
    linuxCommandCopied: "Perintah installer disalin.", linuxCopyFailed: "Tidak dapat menyalin. Pilih dan salin perintah secara manual.",
    addResource: "Tambah sumber daya", searchResources: "Cari sumber daya…", noResources: "Sumber daya tidak ditemukan. Coba pencarian lain atau tambahkan sendiri.",
    edit: "Edit", open: "Buka", editResource: "Edit sumber daya", save: "Simpan", addedFavorite: "Ditambahkan ke favorit",
    removedFavorite: "Dihapus dari favorit", resourceUpdated: "Sumber daya diperbarui", resourceAdded: "Sumber daya ditambahkan",
    resourceDeleted: "Sumber daya dihapus", close: "Tutup", serviceName: "Nama layanan", note: "Catatan",
    priceSubtitle: "Jawab pertanyaan “Berapa harganya?” dengan cepat.", cashModeOn: "Mode uang tunai: aktif", cashMode: "Mode uang tunai",
    done: "Selesai", editServices: "Edit layanan", tapToEdit: "Ketuk untuk edit", tapToAdd: "Ketuk untuk tambah",
    newService: "Layanan baru", addService: "Tambah layanan", custom: "Kustom", transaction: "Transaksi",
    undoLast: "Urungkan terakhir", clearAll: "Hapus semua", readyToCalculate: "Siap menghitung",
    calculateHint: "Ketuk layanan, pilih nominal cepat, atau masukkan harga kustom. Langsung ditambahkan tanpa konfirmasi.", remove: "Hapus", total: "Total", copy: "Salin", copyTotal: "Salin total",
    cashCheck: "Pemeriksaan tunai", amountReceived: "Uang diterima", expected: "Seharusnya", received: "Diterima",
    exact: "Pas", reset: "Reset", change: "Kembalian", short: "Kurang",
    cashModeTip: "Tips: aktifkan Mode uang tunai agar tombol nominal cepat menambahkan jumlah uang diterima.",
    addCustomItem: "Tambah item kustom", priceRp: "Harga (Rp)", addItem: "Tambah item",
    deleteService: "Hapus layanan", enterNamePrice: "Masukkan nama dan harga",
    itemRemoved: "Item dihapus", transactionCleared: "Transaksi dikosongkan", totalCopied: "Total disalin",
    itemDuplicated: "Item diduplikasi", undone: "Dibatalkan", supportTitle: "Dukung Rekaluna",
    qris: "QRIS", scanQris: "Pindai dengan e-wallet atau aplikasi mobile banking",
    aboutTitle: "Tentang Rekaluna", philosophy: "Filosofi", freeOpenSource: "Gratis dan bersumber terbuka.",
    mitBlurb: "Berlisensi MIT. Periksa, fork, dan kembangkan.", privacyFriendly: "Ramah privasi.",
    privacyBlurb: "Tanpa akun, analitik, atau pelacakan. Data tetap berada di perangkatmu.",
    localFirstTitle: "Mengutamakan lokal.", localFirstBlurb: "Bekerja offline. Fitur utama tidak membutuhkan server.",
    operatorTitle: "Dirancang untuk operator.", operatorBlurb: "Setiap fitur harus menjawab: “apakah ini menghemat waktu?” Jika tidak, fitur itu dihapus.",
    techStack: "Teknologi", noMatches: "Tidak ada hasil.", searchTools: "Cari alat, sumber daya, pengaturan…",
    cancelAction: "Batal", categoryLabel: "Kategori", optionalNoteLabel: "Catatan (opsional)",
    xPosition: "Posisi X", yPosition: "Posisi Y", unlocked: "Tidak terkunci", clear: "Bersihkan", version: "Versi", whatIsRekaluna: "Apa itu Rekaluna?",
    aboutIntro: "Rekaluna adalah ruang kerja berbasis browser untuk operator percetakan yang bisa dibiarkan terbuka sepanjang hari. Rekaluna menggabungkan cetak cepat, kalkulator harga, dan sumber daya harian dalam satu ruang kerja yang fokus dan siap digunakan secara offline.",
    whyCreated: "Mengapa dibuat?", whyCreatedBody: "Operator percetakan sering berpindah di antara editor gambar, kalkulator, alat PDF, halaman driver, daftar harga, dan alat tangkapan layar. Rekaluna menyatukan alur kerja harian tersebut di satu tempat.",
    technology: "Teknologi", technologyBody: "Rekaluna dibangun dengan React, TypeScript, Vite, dan Tailwind CSS. Font Awesome menyediakan ikon. Penyimpanan menggunakan localStorage, sementara pencetakan menggunakan dialog cetak bawaan browser. Service worker menyimpan aset agar aplikasi tetap berjalan offline.",
    contribute: "Berkontribusi", contributeBody: "Menemukan bug atau punya ide? Kontribusi sangat terbuka. Penerjemah, desainer, dan operator percetakan juga dapat membantu mengembangkan alat ini.",
    license: "Lisensi", licenseBody: "Rekaluna dirilis dengan Lisensi MIT. Kamu dapat menggunakan, menyalin, mengubah, menggabungkan, menerbitkan, mendistribusikan, mensublisensikan, atau menjual salinan perangkat lunak dengan tetap menyertakan pemberitahuan hak cipta asli.", supportIntro: "Rekaluna gratis, bersumber terbuka, dan dibuat untuk siapa pun yang membutuhkan alat sederhana untuk pekerjaan cetak sehari-hari. Jika Rekaluna membantu pekerjaanmu, kamu boleh berdonasi melalui kode QRIS di bawah.",
    supportNoObligation: "Tidak ada kewajiban sama sekali. Menggunakan Rekaluna saja sudah menjadi bentuk dukungan yang berarti.", thankYou: "Terima kasih.", copySuffix: "salinan", openIssuePrompt: "Buat issue atau pull request di", copyDonation: "Salin tautan donasi", openDonation: "Buka halaman donasi",
    donationCopied: "Tautan donasi disalin", contributionLine: "Rekaluna tidak mengumpulkan data, menampilkan iklan, atau mewajibkan akun. Setiap kontribusi - kode, masukan, terjemahan, atau dukungan - membantu proyek ini.",
    layoutShape: "Bentuk tata letak", selectedCount: "objek dipilih", cropMode: "Atur potongan", finishCrop: "Selesai memotong", resetCrop: "Reset potongan", cropZoom: "Perbesaran potongan", cropHorizontal: "Posisi horizontal", cropVertical: "Posisi vertikal", cropDragHint: "Seret gambar di dalam bingkai untuk mengatur area potong.",
    bringToFront: "Pindahkan ke paling depan", sendToBack: "Pindahkan ke paling belakang", selectAll: "Pilih semua", paste: "Tempel", cut: "Potong", addSquareFrame: "Tambah bingkai kotak", addCircleFrame: "Tambah bingkai lingkaran", addRoundedFrame: "Tambah bingkai sudut bulat",

  },
} as const;

export type MessageKey = keyof typeof messages.en;

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "rekaluna:locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "id") return saved;
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Language selection remains available for the current session.
    }
  };

  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale,
    t: (key) => messages[locale][key],
  }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
