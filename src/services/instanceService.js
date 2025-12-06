// URL to the dynamic instances JSON
const INSTANCES_URL = 'https://raw.githubusercontent.com/n-ce/Uma/main/dynamic_instances.json';

const STORAGE_KEY_INSTANCE = 'ragam_selected_instance';
const STORAGE_KEY_QUALITY = 'ragam_audio_quality';

// Default fallback if nothing is selected or fetch fails
export const DEFAULT_INSTANCE = 'https://api.piped.private.coffee'; // First item in your piped list
export const DEFAULT_QUALITY = 'high';

// --- INSTANCE MANAGEMENT ---

export const getSavedInstance = () => {
    return localStorage.getItem(STORAGE_KEY_INSTANCE) || DEFAULT_INSTANCE;
};

export const setSavedInstance = (url) => {
    if (url) {
        // Remove trailing slash if present
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        localStorage.setItem(STORAGE_KEY_INSTANCE, cleanUrl);
        return cleanUrl;
    }
    return null;
};

// --- QUALITY MANAGEMENT ---

export const getAudioQuality = () => {
    return localStorage.getItem(STORAGE_KEY_QUALITY) || DEFAULT_QUALITY;
};

export const setAudioQuality = (quality) => {
    if (['low', 'medium', 'high'].includes(quality)) {
        localStorage.setItem(STORAGE_KEY_QUALITY, quality);
        return quality;
    }
    return DEFAULT_QUALITY;
};

// --- API FETCHING ---

export const fetchInstances = async () => {
    try {
        const response = await fetch(INSTANCES_URL);
        if (!response.ok) throw new Error('Failed to fetch instances');

        const data = await response.json();
        console.log("Raw instances data:", data); // DEBUG LOG

        let parsedInstances = [];

        // The JSON structure has a "piped" key which is an array of strings
        if (data.piped && Array.isArray(data.piped)) {
            parsedInstances = data.piped.map(url => {
                try {
                    return {
                        name: new URL(url).hostname,
                        api_url: url
                    };
                } catch (e) {
                    console.warn("Invalid URL in piped list:", url);
                    return null;
                }
            }).filter(item => item !== null);
        }

        console.log("Parsed Piped instances:", parsedInstances); // DEBUG LOG
        return parsedInstances;
    } catch (error) {
        console.error("Error fetching instances:", error);
        return [];
    }
};

export const clearAllData = () => {
    localStorage.clear();
    window.location.href = '/'; // Hard reload to login page/home
};