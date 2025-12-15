export type Language = 'en' | 'zh';

export type TranslationKey = 
  | 'welcome'
  | 'gameStarted'
  | 'draw'
  | 'playerDrew'
  | 'playerPong'
  | 'playerKong'
  | 'playerChow'
  | 'playerRon'
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
  | 'dragonWhite'
  | 'navHome'
  | 'navGame'
  | 'homeTitle'
  | 'homeSubtitle'
  | 'homeDescription'
  | 'homeStartBtn'
  | 'footerCopyright'
  | 'navAbout'
  | 'navContact'
  | 'navPrivacy'
  | 'aboutTitle'
  | 'aboutContent'
  | 'contactTitle'
  | 'contactContent'
  | 'privacyTitle'
  | 'privacyContent';

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en: {
    welcome: 'Welcome to Mahjong!',
    gameStarted: 'Game Started. East wind turn.',
    draw: 'Draw! No more tiles.',
    playerDrew: 'Player {index} drew a tile.',
    playerPong: 'Player {index} Pong!',
    playerKong: 'Player {index} Kong!',
    playerChow: 'Player {index} Chow!',
    playerRon: 'Player {index} Ron!',
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
    navHome: 'Home',
    navGame: 'Game',
    homeTitle: 'Real Mahjong',
    homeSubtitle: 'Authentic Mahjong Experience',
    homeDescription: 'Play traditional Mahjong online against intelligent AI opponents. No download required, just pure strategy and skill.',
    homeStartBtn: 'Start Game',
    footerCopyright: 'RealMahjong. All rights reserved.',
    navAbout: 'About',
    navContact: 'Contact',
    navPrivacy: 'Privacy',
    aboutTitle: 'About RealMahjong',
    aboutContent: 'RealMahjong is a free online Mahjong game dedicated to providing an authentic and smooth gaming experience. Play against advanced AI opponents anytime, anywhere, with no downloads required.',
    contactTitle: 'Contact Us',
    contactContent: 'We value your feedback! If you have any questions, bug reports, or suggestions, please reach out to us at:',
    privacyTitle: 'Privacy Policy',
    privacyContent: 'RealMahjong respects your privacy. We do not collect any personal information. All game data is processed locally on your device or temporarily for game logic purposes only. We use Google Analytics to understand website traffic, but no personally identifiable information is stored.',
  },
  zh: {
    welcome: '欢迎来到麻将游戏！',
    gameStarted: '游戏开始，东风局。',
    draw: '流局！没有牌了。',
    playerDrew: '玩家 {index} 摸了一张牌。',
    playerPong: '玩家 {index} 碰！',
    playerKong: '玩家 {index} 杠！',
    playerChow: '玩家 {index} 吃！',
    playerRon: '玩家 {index} 胡了！',
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
    navHome: '首页',
    navGame: '游戏',
    homeTitle: '正宗麻将',
    homeSubtitle: '纯粹的麻将体验',
    homeDescription: '在线体验传统麻将，与智能AI对手一决高下。无需下载，点击即玩，尽享策略与技巧的乐趣。',
    homeStartBtn: '开始游戏',
    footerCopyright: '正宗麻将. 保留所有权利.',
    navAbout: '关于',
    navContact: '联系',
    navPrivacy: '隐私',
    aboutTitle: '关于正宗麻将',
    aboutContent: '正宗麻将是一款免费的在线麻将游戏，致力于提供原汁原味且流畅的游戏体验。无需下载，随时随地与智能AI对手切磋牌技。',
    contactTitle: '联系我们',
    contactContent: '我们重视您的反馈！如果您有任何问题、错误报告或建议，请通过以下方式联系我们：',
    privacyTitle: '隐私政策',
    privacyContent: '正宗麻将尊重您的隐私。我们不会收集任何个人信息。所有游戏数据仅在您的设备上本地处理，或仅用于游戏逻辑的临时处理。我们使用 Google Analytics 来了解网站流量，但不会存储任何个人身份信息。',
  }
};

export const formatString = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template;
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, String(value));
  }, template);
};
