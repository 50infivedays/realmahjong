
export type AiStyle = 'aggressive' | 'balanced' | 'defensive';

export interface AiConfig {
    simDepth: number;         // Max steps for simulation
    simCount: number;         // Number of simulations per action
    attackBias: number;       // Weight for win rate/shanten improvement [0,1]
    defenseBias: number;      // Weight for safety [0,1]
    callAggressiveness: number; // Weight for calling tiles (Chi/Pon/Kan) [0,1]
}

export const AI_STYLES: Record<AiStyle, AiConfig> = {
    aggressive: {
        simDepth: 10,
        simCount: 20,
        attackBias: 0.8,
        defenseBias: 0.2,
        callAggressiveness: 0.7
    },
    balanced: {
        simDepth: 30,
        simCount: 200,
        attackBias: 0.5,
        defenseBias: 0.5,
        callAggressiveness: 0.3
    },
    defensive: {
        simDepth: 40,
        simCount: 150,
        attackBias: 0.3,
        defenseBias: 0.7,
        callAggressiveness: 0.1
    }
};

// Load config from local storage or environment if needed, 
// but for now we define a default constant that can be edited locally.
// The user requested "local config file to save". 
export const CURRENT_AI_CONFIG: AiConfig = AI_STYLES.aggressive;

