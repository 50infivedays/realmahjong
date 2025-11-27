export type Language = 'en' | 'zh';

export type TranslationKey = 
  | 'welcome'
  | 'gameStarted'
  | 'draw'
  | 'playerDrew'
  | 'tsumoCanWin'
  | 'playerTsumo'
  | 'playerDiscarded'
  | 'claimTile'
  | 'youWinRon'
  | 'youWinTsumo'
  | 'pong'
  | 'kongReplacement'
  | 'chow'
  | 'passed'
  | 'playerWins'
  | 'winningHand'
  | 'gameOver'
  | 'playAgain'
  | 'remaining'
  | 'btnPong'
  | 'btnKong'
  | 'btnChow'
  | 'btnRon'
  | 'btnTsumo'
  | 'btnPass'
  | 'suitBamboo'
  | 'suitCharacter'
  | 'suitDot'
  | 'suitWind'
  | 'suitDragon'
  | 'windEast'
  | 'windSouth'
  | 'windWest'
  | 'windNorth'
  | 'dragonRed'
  | 'dragonGreen'
  | 'dragonWhite';

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en: {
    welcome: 'Welcome to Mahjong!',
    gameStarted: 'Game Started. East wind turn.',
    draw: 'Draw! No more tiles.',
    playerDrew: 'Player {index} drew a tile.',
    tsumoCanWin: 'Tsumo! You can Win!',
    playerTsumo: 'Player {index} Tsumo!',
    playerDiscarded: 'Player {index} discarded {tile}.',
    claimTile: 'Claim tile?',
    youWinRon: 'You Win (Ron)!',
    youWinTsumo: 'You Win (Tsumo)!',
    pong: 'Pong!',
    kongReplacement: 'Kong! Draw replacement.',
    chow: 'Chow!',
    passed: 'Passed.',
    playerWins: 'Player {index} Wins!',
    winningHand: 'Winning Hand:',
    gameOver: 'Game Over',
    playAgain: 'Play Again',
    remaining: 'Remaining',
    btnPong: 'Pong',
    btnKong: 'Kong',
    btnChow: 'Chow',
    btnRon: 'Ron',
    btnTsumo: 'Tsumo',
    btnPass: 'Pass',
    suitBamboo: 'Bamboo',
    suitCharacter: 'Character',
    suitDot: 'Dot',
    suitWind: 'Wind',
    suitDragon: 'Dragon',
    windEast: 'East',
    windSouth: 'South',
    windWest: 'West',
    windNorth: 'North',
    dragonRed: 'Red',
    dragonGreen: 'Green',
    dragonWhite: 'White',
  },
  zh: {
    welcome: '欢迎来到麻将游戏！',
    gameStarted: '游戏开始，东风局。',
    draw: '流局！没有牌了。',
    playerDrew: '玩家 {index} 摸了一张牌。',
    tsumoCanWin: '自摸！你可以胡牌了！',
    playerTsumo: '玩家 {index} 自摸！',
    playerDiscarded: '玩家 {index} 打出了 {tile}。',
    claimTile: '要吃/碰/杠/胡吗？',
    youWinRon: '你胡了 (点炮)!',
    youWinTsumo: '你胡了 (自摸)!',
    pong: '碰！',
    kongReplacement: '杠！摸牌。',
    chow: '吃！',
    passed: '过。',
    playerWins: '玩家 {index} 获胜！',
    winningHand: '获胜手牌:',
    gameOver: '游戏结束',
    playAgain: '再来一局',
    remaining: '剩余牌数',
    btnPong: '碰',
    btnKong: '杠',
    btnChow: '吃',
    btnRon: '胡',
    btnTsumo: '自摸',
    btnPass: '过',
    suitBamboo: '索',
    suitCharacter: '万',
    suitDot: '筒',
    suitWind: '风',
    suitDragon: '箭',
    windEast: '东',
    windSouth: '南',
    windWest: '西',
    windNorth: '北',
    dragonRed: '中',
    dragonGreen: '发',
    dragonWhite: '白',
  }
};

export const formatString = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template;
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, String(value));
  }, template);
};

