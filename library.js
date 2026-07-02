/*=========================================
    IMAGE LIBRARY SYSTEM
=========================================*/

export default class ImageLibrary {

    constructor() {

        this.images = [];
        this.folders = new Map();
        this.tags = new Map();
        this.favorites = new Set();

        this.index = new Map(); // search index

    }

    /*============================*/
    /* Add image to library */
    /*============================*/

    addImage(src, meta = {}) {

        const id = crypto.randomUUID();

        const image = {

            id,
            src,
            name: meta.name || "untitled",
            tags: meta.tags || [],
            folder: meta.folder || "root",
            createdAt: Date.now()

        };

        this.images.push(image);

        this._indexImage(image);

        this._addToFolder(image);

        this._addTags(image);

        return image;

    }

    /*============================*/
    /* Remove image */
    /*============================*/

    removeImage(id) {

        this.images = this.images.filter(img => img.id !== id);

        this.favorites.delete(id);

        this._rebuildIndex();

    }

    /*============================*/
    /* Favorites system */
    /*============================*/

    toggleFavorite(id) {

        if (this.favorites.has(id)) {
            this.favorites.delete(id);
        } else {
            this.favorites.add(id);
        }

    }

    getFavorites() {

        return this.images.filter(img =>
            this.favorites.has(img.id)
        );

    }

    /*============================*/
    /* Folder system */
    /*============================*/

    _addToFolder(image) {

        const folder = image.folder || "root";

        if (!this.folders.has(folder)) {
            this.folders.set(folder, []);
        }

        this.folders.get(folder).push(image);

    }

    getFolder(name) {

        return this.folders.get(name) || [];

    }

    getAllFolders() {

        return [...this.folders.keys()];

    }

    /*============================*/
    /* Tag system */
    /*============================*/

    _addTags(image) {

        image.tags.forEach(tag => {

            if (!this.tags.has(tag)) {
                this.tags.set(tag, []);
            }

            this.tags.get(tag).push(image);

        });

    }

    getByTag(tag) {

        return this.tags.get(tag) || [];

    }

    /*============================*/
    /* Search index */
    /*============================*/

    _indexImage(image) {

        const tokens = [

            image.name.toLowerCase(),
            image.folder.toLowerCase(),
            ...image.tags.map(t => t.toLowerCase())

        ];

        this.index.set(image.id, tokens);

    }

    search(query) {

        const q = query.toLowerCase();

        return this.images.filter(img => {

            const tokens = this.index.get(img.id) || [];

            return tokens.some(t => t.includes(q));

        });

    }

    /*============================*/
    /* Rebuild index */
    /*============================*/

    _rebuildIndex() {

        this.index.clear();

        this.images.forEach(img => this._indexImage(img));

    }

}

/*=========================================
    IMAGE LIBRARY SYSTEM - PART 2
=========================================*/

export default class ImageLibrary {

    constructor() {

        this.images = [];
        this.folders = new Map();
        this.tags = new Map();
        this.favorites = new Set();
        this.index = new Map();

        this.dbName = "ai_wallpaper_library";
        this.storeKey = "images";

        this._loadFromStorage();

    }

    /*============================*/
    /* Persistence Layer (IndexedDB-like fallback) */
    /*============================*/

    saveToStorage() {

        const data = {
            images: this.images,
            favorites: [...this.favorites],
            folders: [...this.folders.entries()],
            tags: [...this.tags.entries()]
        };

        localStorage.setItem(
            this.dbName,
            JSON.stringify(data)
        );

    }

    _loadFromStorage() {

        const raw = localStorage.getItem(this.dbName);

        if (!raw) return;

        try {

            const data = JSON.parse(raw);

            this.images = data.images || [];

            this.favorites = new Set(data.favorites || []);

            this.folders = new Map(data.folders || []);

            this.tags = new Map(data.tags || []);

            this._rebuildIndex();

        } catch (e) {

            console.error("Library load failed:", e);

        }

    }

    /*============================*/
    /* Auto persist wrapper */
    /*============================*/

    _autoSave() {
        this.saveToStorage();
    }

    /*============================*/
    /* Enhanced add image */
    /*============================*/

    addImage(src, meta = {}) {

        const image = super.addImage
            ? super.addImage(src, meta)
            : this._createImage(src, meta);

        this._autoSave();

        return image;

    }

    _createImage(src, meta) {

        const image = {

            id: crypto.randomUUID(),
            src,
            name: meta.name || "untitled",
            tags: meta.tags || [],
            folder: meta.folder || "root",
            createdAt: Date.now()

        };

        this.images.push(image);

        this._indexImage(image);
        this._addToFolder(image);
        this._addTags(image);

        return image;

    }

    /*============================*/
    /* Smart folders (filters) */
    /*============================*/

    createSmartFolder(name, filterFn) {

        this.folders.set(name, {
            smart: true,
            filter: filterFn
        });

        this._autoSave();

    }

    getSmartFolder(name) {

        const folder = this.folders.get(name);

        if (!folder?.smart) {
            return this.getFolder(name);
        }

        return this.images.filter(folder.filter);

    }

    /*============================*/
    /* Bulk operations */
    /*============================*/

    clearLibrary() {

        this.images = [];
        this.folders.clear();
        this.tags.clear();
        this.favorites.clear();
        this.index.clear();

        this._autoSave();

    }

    importLibrary(data) {

        try {

            const parsed = JSON.parse(data);

            this.images = parsed.images || [];

            this.favorites = new Set(parsed.favorites || []);

            this.folders = new Map(parsed.folders || []);

            this.tags = new Map(parsed.tags || []);

            this._rebuildIndex();

            this._autoSave();

        } catch (e) {

            console.error("Import failed:", e);

        }

    }

    exportLibrary() {

        return JSON.stringify({

            images: this.images,
            favorites: [...this.favorites],
            folders: [...this.folders.entries()],
            tags: [...this.tags.entries()]

        });

    }

    /*============================*/
    /* Cleanup system */
    /*============================*/

    removeImage(id) {

        this.images = this.images.filter(img => img.id !== id);

        this.favorites.delete(id);

        this._rebuildIndex();

        this._autoSave();

    }

    /*============================*/
    /* Re-index everything */
    /*============================*/

    _rebuildIndex() {

        this.index.clear();

        this.images.forEach(img => this._indexImage(img));

    }

}
