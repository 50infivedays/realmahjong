import { TileType } from '@/lib/mahjong/types';
import { TranslationKey } from '@/lib/i18n';

export type GameMessage = {
    key: TranslationKey;
    params?: Record<string, string | number>;
};

export const getTileNameKey = (tile: TileType): { key: TranslationKey, value?: string } => {
    if (tile.suit === 'wind') {
        const winds: TranslationKey[] = ['windEast', 'windSouth', 'windWest', 'windNorth'];
        return { key: winds[tile.value - 1] };
    }
    if (tile.suit === 'dragon') {
        const dragons: TranslationKey[] = ['dragonRed', 'dragonGreen', 'dragonWhite'];
        return { key: dragons[tile.value - 1] };
    }

    const suits: Record<string, TranslationKey> = {
        'bamboo': 'suitBamboo',
        'character': 'suitCharacter',
        'dot': 'suitDot'
    };
    return { key: suits[tile.suit], value: String(tile.value) };
};

