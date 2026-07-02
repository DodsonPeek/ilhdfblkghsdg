/*=========================================
    AI IMAGE GENERATION MODULE
=========================================*/

/*
    This module is the bridge between:
    Wallpaper Engine → AI Backend → UI
*/

export default class ImageGenerator {

    constructor(options = {}) {

        this.endpoint = options.endpoint || null; 
        this.apiKey = options.apiKey || null;

        this.queue = [];
        this.isProcessing = false;

    }

    /*============================*/
    /* Public Generate Function */
    /*============================*/

    async generate(request) {

        this.queue.push(request);

        if (!this.isProcessing) {
            return this.processQueue();
        }

    }

    /*============================*/
    /* Queue Processor */
    /*============================*/

    async processQueue() {

        this.isProcessing = true;

        const results = [];

        while (this.queue.length > 0) {

            const job = this.queue.shift();

            try {

                const result = await this.generateImage(job);

                results.push(result);

            } catch (err) {

                console.error("Generation failed:", err);

            }

        }

        this.isProcessing = false;

        return results;

    }

    /*============================*/
    /* Core Generation Function */
    /*============================*/

    async generateImage(request) {

        const payload = this.buildPayload(request);

        // If no backend configured → fallback mock
        if (!this.endpoint) {
            return this.mockGenerate(request);
        }

        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("AI generation request failed");
        }

        const data = await response.json();

        return this.formatResponse(data, request);

    }

    /*============================*/
    /* Build API Payload */
    /*============================*/

    buildPayload(request) {

        return {

            prompt: request.prompt,

            negative_prompt: request.negativePrompt || "",

            style: request.settings?.style,

            width: this.parseResolution(request.settings?.resolution).width,

            height: this.parseResolution(request.settings?.resolution).height,

            steps: 30,

            guidance_scale: request.settings?.creativity || 7,

            seed: request.seed || Math.floor(Math.random() * 999999)

        };

    }

    /*============================*/
    /* Resolution Parser */
    /*============================*/

    parseResolution(res) {

        const map = {

            "1920x1080": { width: 1920, height: 1080 },
            "2560x1440": { width: 2560, height: 1440 },
            "3840x2160": { width: 3840, height: 2160 },
            "1080x2400": { width: 1080, height: 2400 }

        };

        return map[res] || map["1920x1080"];

    }

    /*============================*/
    /* Format API Response */
    /*============================*/

    formatResponse(data, request) {

        return {

            id: crypto.randomUUID(),

            images: data.images || data.output || [],

            prompt: request.prompt,

            meta: request.settings,

            createdAt: Date.now()

        };

    }

    /*============================*/
    /* Mock Generator (fallback) */
    /*============================*/

    async mockGenerate(request) {

        await new Promise(r => setTimeout(r, 1200));

        return {

            id: crypto.randomUUID(),

            images: request.images?.slice(0, 1) || [],

            prompt: request.prompt,

            meta: request.settings,

            createdAt: Date.now(),

            mock: true

        };

    }

}

/*=========================================
    AI IMAGE GENERATION MODULE - PART 2
=========================================*/

export default class ImageGenerator {

    constructor(options = {}) {

        this.endpoint = options.endpoint || null;
        this.apiKey = options.apiKey || null;

        this.queue = [];
        this.isProcessing = false;

        this.onResult = null;

    }

    /*============================*/
    /* UI callback */
    /*============================*/

    setResultCallback(fn) {
        this.onResult = fn;
    }

    /*============================*/
    /* Batch generation (multiple images) */
    /*============================*/

    async generateBatch(request, count = 1) {

        const results = [];

        for (let i = 0; i < count; i++) {

            const seededRequest = {
                ...request,
                seed: this.randomSeed()
            };

            const result = await this.generate(seededRequest);

            results.push(result);

            if (this.onResult) {
                this.onResult(result, i);
            }

        }

        return results;

    }

    /*============================*/
    /* Seed system (VERY important) */
    /*============================*/

    randomSeed() {
        return Math.floor(Math.random() * 999999999);
    }

    fixedSeed(seed) {
        return seed || this.randomSeed();
    }

    /*============================*/
    /* Prompt enhancement */
    /*============================*/

    enhancePrompt(prompt, settings = {}) {

        let enhanced = prompt;

        if (settings.style) {
            enhanced += `, ${settings.style} style`;
        }

        if (settings.quality === "Ultra") {
            enhanced += ", ultra detailed, 8k, cinematic lighting";
        }

        if (settings.creativity > 70) {
            enhanced += ", artistic interpretation, dynamic composition";
        }

        if (settings.creativity < 30) {
            enhanced += ", realistic, precise, accurate details";
        }

        return enhanced;

    }

    /*============================*/
    /* Override generateImage */
    /*============================*/

    async generateImage(request) {

        const enhancedRequest = {
            ...request,
            prompt: this.enhancePrompt(
                request.prompt,
                request.settings
            ),
            seed: this.fixedSeed(request.seed)
        };

        const payload = this.buildPayload(enhancedRequest);

        if (!this.endpoint) {
            return this.mockGenerate(enhancedRequest);
        }

        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(this.apiKey ? {
                    "Authorization": `Bearer ${this.apiKey}`
                } : {})
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Generation failed");
        }

        const data = await response.json();

        const formatted = this.formatResponse(data, enhancedRequest);

        return formatted;

    }

    /*============================*/
    /* Variation generator */
    /*============================*/

    async generateVariations(request, variations = 3) {

        const baseSeed = this.randomSeed();

        const results = [];

        for (let i = 0; i < variations; i++) {

            const variationRequest = {
                ...request,
                seed: baseSeed + i * 1000,
                prompt: request.prompt + ` variation ${i + 1}`
            };

            const result = await this.generateImage(variationRequest);

            results.push(result);

        }

        return results;

    }

    /*============================*/
    /* Progress hook (UI integration) */
    /*============================*/

    async generateWithProgress(request, onProgress) {

        onProgress?.(10);

        const enhanced = {
            ...request,
            seed: this.fixedSeed(request.seed)
        };

        onProgress?.(40);

        const result = await this.generateImage(enhanced);

        onProgress?.(100);

        return result;

    }

}
