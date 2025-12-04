class IceBreakerService {
  // Érdeklődés alapú kérdés sablonok
  static questionTemplates = {
    'Utazás': [
      'Melyik volt a legemlékezetesebb utazásod?',
      'Ha most azonnal bármerre utazhatnál, hova mennél?',
      'Tengerpart vagy hegyek? Melyiket választanád egy hétvégére?',
      'Van olyan hely, ahova többször visszatérnél?',
      'Mi a legkalandosabb dolog, amit utazás közben csináltál?'
    ],
    'Fotózás': [
      'Milyen témákat szeretsz leginkább fotózni?',
      'Van kedvenc fotód, amit te készítettél?',
      'Telefonnal vagy géppel fotózol szívesebben?',
      'Ki a kedvenc fotósod vagy művészed?',
      'Naplemente vagy napkelte? Melyik a szebb?'
    ],
    'Sport': [
      'Milyen sportokat űzöl?',
      'Van kedvenc csapatod vagy sportolód?',
      'Edzőterembe jársz vagy outdoor sportokat preferálsz?',
      'Mi motivál téged a sportolásban?',
      'Szeretsz új sportokat kipróbálni?'
    ],
    'Zene': [
      'Milyen zenét hallgatsz mostanában?',
      'Volt olyan koncert, ami megváltoztatta az életed?',
      'Játszol valamilyen hangszeren?',
      'Mi volt az első CD vagy lemez, amit vettél?',
      'Kedvenc fesztivál élményed?'
    ],
    'Főzés': [
      'Mi a specialitásod a konyhában?',
      'Sütemények vagy sós ételek? Melyik a kedvenc?',
      'Van olyan recept, amit családtagtól tanultál?',
      'Szeretsz kísérletezni új ízekkel?',
      'Kedvenc konyha (olasz, ázsiai, magyar)?'
    ],
    'Olvasás': [
      'Mit olvasol most?',
      'Van kedvenc könyved, amit mindenkinek ajánlanál?',
      'Fikció vagy non-fikció?',
      'E-könyv vagy papíralapú könyv?',
      'Ki a kedvenc íród?'
    ],
    'Film': [
      'Milyen filmeket szeretsz?',
      'Van olyan film, amit már sokszor láttál?',
      'Mozi vagy otthon a kanapén?',
      'Sorozat vagy film?',
      'Kedvenc színészed/színésznőd?'
    ],
    'Művészet': [
      'Milyen művészeti ágak érdekelnek?',
      'Szeretsz múzeumba járni?',
      'Alkotsz is vagy csak szemlélőd a művészetet?',
      'Modern vagy klasszikus művészet?',
      'Van kedvenc művészed?'
    ],
    'Természet': [
      'Hegyek vagy erdő? Melyik a kedvenced?',
      'Szeretsz túrázni?',
      'Van kedvenc természeti helyed?',
      'Tábortűz vagy csillagles? Melyikre szavaznál?',
      'Reggeli madárcsicsergés vagy éjszakai tücsökzene?'
    ],
    'Gaming': [
      'Milyen játékokat játszol?',
      'PC, konzol vagy mobil?',
      'Van kedvenc játékod?',
      'Multiplayer vagy single player?',
      'Követed az e-sport versenyeket?'
    ]
  };

  // Általános kérdések (ha nincs közös érdeklődés)
  static generalQuestions = [
    'Ha lenne egy szabad napod, mit csinálnál?',
    'Mi az, amiről órákat tudnál beszélni?',
    'Van olyan dolog, amit mindig is ki akartál próbálni?',
    'Kávé vagy tea? És miért?',
    'Reggeli pacsirta vagy éjszakai bagoly?',
    'Mi a kedvenc évszakod és miért?',
    'Ha választhatnál egy szuperképességet, mi lenne az?',
    'Mi volt a legjobb tanács, amit valaha kaptál?',
    'Van olyan könyv/film, ami megváltoztatta a gondolkodásod?',
    'Milyen volt a gyerekkorod álomfoglalkozása?'
  ];

  // Mélyebb kérdések (match után)
  static deeperQuestions = [
    'Mi az, amit leginkább értékelsz egy kapcsolatban?',
    'Hogyan képzeled el az ideális hétvégédet?',
    'Van olyan álmod, amin dolgozol?',
    'Mi az, amit leginkább szeretsz magadban?',
    'Hogy definiálod a boldogságot?',
    'Mi az, amiben jó vagy, de nem sokan tudnak róla?',
    'Van olyan tulajdonságod, amin dolgozol?',
    'Mit jelent számodra a siker?'
  ];

  // Fun kérdések
  static funQuestions = [
    'Ananász a pizzán: igen vagy nem?',
    'Ha állat lennél, mi lennél?',
    'Van olyan ételed, amit soha nem próbálnál ki?',
    'Karaoke: rettegés vagy öröm?',
    'Zombi apokalipszis: mi az első három dolgod?',
    'Ha nyernél a lottón, mi az első, amit tennél?',
    'Van olyan céltalan tudásod, amire büszke vagy?',
    'Mit tennél, ha egy napig láthatatlan lennél?'
  ];

  // Ice breaker generálása közös érdeklődés alapján
  static generateIceBreakers(userInterests, matchInterests) {
    const commonInterests = userInterests.filter(interest => 
      matchInterests.includes(interest)
    );

    const iceBreakers = [];

    // 1. Közös érdeklődés alapú kérdések (2-3 db)
    if (commonInterests.length > 0) {
      commonInterests.slice(0, 2).forEach(interest => {
        const questions = this.questionTemplates[interest];
        if (questions) {
          const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
          iceBreakers.push({
            type: 'interest',
            interest,
            question: randomQuestion,
            icon: this.getInterestIcon(interest),
          });
        }
      });
    }

    // 2. Egy általános kérdés
    const generalQuestion = this.generalQuestions[
      Math.floor(Math.random() * this.generalQuestions.length)
    ];
    iceBreakers.push({
      type: 'general',
      question: generalQuestion,
      icon: '💬',
    });

    // 3. Egy fun kérdés
    const funQuestion = this.funQuestions[
      Math.floor(Math.random() * this.funQuestions.length)
    ];
    iceBreakers.push({
      type: 'fun',
      question: funQuestion,
      icon: '😄',
    });

    return iceBreakers;
  }

  // Mélyebb kérdések matchelés után
  static generateDeeperQuestions() {
    const selected = [];
    const shuffled = [...this.deeperQuestions].sort(() => 0.5 - Math.random());
    
    return shuffled.slice(0, 3).map(question => ({
      type: 'deeper',
      question,
      icon: '💭',
    }));
  }

  // Ikon hozzárendelés érdeklődéshez
  static getInterestIcon(interest) {
    const icons = {
      'Utazás': '✈️',
      'Fotózás': '📸',
      'Sport': '⚽',
      'Zene': '🎵',
      'Főzés': '👨‍🍳',
      'Olvasás': '📚',
      'Film': '🎬',
      'Művészet': '🎨',
      'Természet': '🌲',
      'Gaming': '🎮',
    };
    return icons[interest] || '💡';
  }

  // Kérdés típus szerinti szín
  static getQuestionColor(type) {
    const colors = {
      'interest': '#FF3B75',
      'general': '#2196F3',
      'fun': '#FFC107',
      'deeper': '#9C27B0',
    };
    return colors[type] || '#999';
  }
}

export default IceBreakerService;

