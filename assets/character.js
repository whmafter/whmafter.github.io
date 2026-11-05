/* 사주 캐릭터 찾기 (세부실행계획 2장 65번 ⑧, docs/검토/성장계획_2026-11-03.md 3절 1번).
 *
 * 영어 페이지(character/)와 한국어 페이지(ko/character/)가 함께 쓴다. 페이지의 언어는 <html lang>으로 고른다.
 * 태어난 날짜는 이 브라우저 안에서만 계산하고 어디에도 보내거나 저장하지 않는다. 공유 주소(?c=byeong)에는
 * 캐릭터만 담고 날짜는 담지 않는다. 분석 도구·광고·바깥 요청이 없다.
 *
 * 일주는 앱의 엔진과 같은 규칙이다 (app/lib/engine/src/calendar.dart의 epochDayOf, dayPillarOfEpochDay):
 * 1970-01-01부터의 날수 + 2440588(1970-01-01의 율리우스 일수) + 49를 60으로 나눈 나머지. 일간은 그 수를 10으로
 * 나눈 나머지다. 날짜는 넣은 그대로 쓰고 시간대를 따지지 않는다 (앱에서 시간을 모를 때와 같다).
 * tools/web/character.test.mjs가 앱의 정답표와 대조하고, 아래 글이 앱의 글과 같은지도 본다.
 *
 * 글은 앱의 것을 그대로 옮겼다: 이름은 ARB의 characterGap…, 이름 아래 한 줄은 characterNoteGap…,
 * 성향 한 문장은 app/assets/i18n/<언어>/character.json의 character.trait.<천간> (캐릭터 공개 화면의 그 문장),
 * 오행·음양은 elementWood…, polarityYang/Yin, 둘을 잇는 꼴은 lifeChartMeaning이다.
 */
(function (root) {
  'use strict';

  var STEMS = ['gap', 'eul', 'byeong', 'jeong', 'mu', 'gi', 'gyeong', 'sin', 'im', 'gye'];
  var HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ELEMENT_KEYS = ['wood', 'fire', 'earth', 'metal', 'water'];

  var TEXTS = {
    en: {
      elements: ['Wood', 'Fire', 'Earth', 'Metal', 'Water'],
      yang: 'Yang',
      yin: 'Yin',
      meaning: function (polarity, element) { return polarity + ' ' + element; },
      characters: {
        gap: {
          name: 'Namu',
          note: 'Namu means tree in Korean.',
          trait: 'Upright and dependable, it tends to lead the way and to watch over the people around it with a generous heart.'
        },
        eul: {
          name: 'Nari',
          note: 'Nari means lily in Korean.',
          trait: 'Gentle and flexible yet not easily broken, it tends to get along well with people in any setting.'
        },
        byeong: {
          name: 'Haenim',
          note: 'Haenim is a fond Korean name for the sun.',
          trait: 'Bright, open and full of passion, it tends to share what it has without holding back.'
        },
        jeong: {
          name: 'Chorong',
          note: 'Chorong means lantern in Korean.',
          trait: 'Gentle and warm, it tends to take thoughtful care of the people around it.'
        },
        mu: {
          name: 'Moe',
          note: 'Moe is an old Korean word for mountain.',
          trait: 'Grounded and steady, it may not say much, but it tends to be a sturdy presence people can trust and lean on.'
        },
        gi: {
          name: 'Irang',
          note: 'Irang means the ridges of a plowed field in Korean.',
          trait: 'With a kind, caring heart and many talents, it tends to help the people around it grow.'
        },
        gyeong: {
          name: 'Dandan',
          note: 'Dandan comes from the Korean word for firm and solid.',
          trait: 'Resolute and loyal, it tends to stand firmly by what it believes is right and by the people it cares about.'
        },
        sin: {
          name: 'Boseok',
          note: 'Boseok means jewel in Korean.',
          trait: 'Meticulous and quick-witted, it tends to refine whatever it takes on with care until the work shines.'
        },
        im: {
          name: 'Bada',
          note: 'Bada means sea in Korean.',
          trait: 'Reflective and wise, it tends to move energetically toward wider horizons.'
        },
        gye: {
          name: 'Iseul',
          note: 'Iseul means dew in Korean.',
          trait: 'Rich in imagination and flexible in thought, it tends to be good at adapting to whatever the moment calls for.'
        }
      },
      ui: {
        mine: 'Your character',
        other: 'Saju character',
        otherHint: 'Want yours? Enter your birth date above.',
        alt: function (name, meaning) { return name + ', the ' + meaning + ' character, smiling'; },
        announce: function (name, meaning) { return 'Your character is ' + name + ', ' + meaning + '.'; },
        errorEmpty: 'Enter your birth date.',
        errorInvalid: 'That date isn\'t on the calendar. Check the year, month and day.',
        errorRange: 'Enter a date from 1900 to 2100.',
        shareTitle: 'What\'s your Korean saju character?',
        shareMine: function (tag) { return 'My Korean saju character is ' + tag + '. What\'s yours?'; },
        shareOther: function (tag) { return 'Korean saju character: ' + tag + '. What\'s yours?'; },
        copied: 'Link copied. The link holds only the character, not your birth date.',
        copyYourself: 'Copy this link:'
      }
    },
    ko: {
      elements: ['나무', '불', '흙', '쇠', '물'],
      yang: '양',
      yin: '음',
      meaning: function (polarity, element) { return polarity + '의 ' + element; },
      characters: {
        gap: {
          name: '나무',
          note: '사주에서는 갑목(甲木)이라고 불러요.',
          trait: '곧고 믿음직해서, 앞장서 길을 열고 곁의 사람을 너그럽게 지켜 주는 편이에요.'
        },
        eul: {
          name: '나리',
          note: '사주에서는 을목(乙木)이라고 불러요.',
          trait: '부드럽고 유연하면서도 쉽게 꺾이지 않아서, 어느 자리에서든 사람들과 잘 어울리는 편이에요.'
        },
        byeong: {
          name: '해님',
          note: '사주에서는 병화(丙火)라고 불러요.',
          trait: '밝고 솔직하며 열정이 넘쳐서, 가진 것을 아낌없이 나누는 편이에요.'
        },
        jeong: {
          name: '초롱',
          note: '사주에서는 정화(丁火)라고 불러요.',
          trait: '부드럽고 따뜻해서, 곁의 사람을 살뜰히 챙겨 주는 편이에요.'
        },
        mu: {
          name: '뫼',
          note: '사주에서는 무토(戊土)라고 불러요.',
          trait: '묵직하고 한결같아서, 말수는 적어도 믿고 기댈 만한 든든함이 있는 편이에요.'
        },
        gi: {
          name: '이랑',
          note: '사주에서는 기토(己土)라고 불러요.',
          trait: '다정하게 보살피는 마음과 여러 재주를 지녀서, 곁의 사람이 자라도록 돕는 편이에요.'
        },
        gyeong: {
          name: '단단',
          note: '사주에서는 경금(庚金)이라고 불러요.',
          trait: '굳세고 의리가 있어서, 옳다고 믿는 일과 아끼는 사람을 든든히 지키는 편이에요.'
        },
        sin: {
          name: '보석',
          note: '사주에서는 신금(辛金)이라고 불러요.',
          trait: '꼼꼼하고 재치가 있어서, 무엇이든 정성껏 다듬어 빛나게 하는 편이에요.'
        },
        im: {
          name: '바다',
          note: '사주에서는 임수(壬水)라고 불러요.',
          trait: '생각이 깊고 슬기로우며, 넓은 곳을 향해 힘차게 나아가는 편이에요.'
        },
        gye: {
          name: '이슬',
          note: '사주에서는 계수(癸水)라고 불러요.',
          trait: '상상력이 풍부하고 생각이 유연해서, 그때그때 알맞게 모습을 바꿀 줄 아는 편이에요.'
        }
      },
      ui: {
        mine: '나의 캐릭터',
        other: '사주 캐릭터',
        otherHint: '나의 캐릭터가 궁금하면 위에 태어난 날짜를 넣어 보세요.',
        alt: function (name, meaning) { return '웃고 있는 ' + name + ' 캐릭터 (' + meaning + ')'; },
        announce: function (name, meaning) { return '나의 캐릭터: ' + name + ', ' + meaning; },
        errorEmpty: '태어난 날짜를 넣어 주세요.',
        errorInvalid: '달력에 없는 날짜예요. 연, 월, 일을 확인해 주세요.',
        errorRange: '1900년부터 2100년까지의 날짜를 넣어 주세요.',
        shareTitle: '나의 사주 캐릭터 찾기',
        shareMine: function (tag) { return '내 사주 캐릭터: ' + tag + '. 너의 캐릭터는?'; },
        shareOther: function (tag) { return '사주 캐릭터: ' + tag + '. 너의 캐릭터는?'; },
        copied: '링크를 복사했어요. 링크에는 캐릭터만 담기고 태어난 날짜는 담기지 않아요.',
        copyYourself: '이 링크를 복사해 주세요:'
      }
    }
  };

  var FIRST = { year: 1900, month: 1, day: 1 };
  var LAST = { year: 2100, month: 12, day: 31 };
  var MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  /** 달력에 있는 날짜인지 (앱의 isValidDate와 같다). */
  function isValidDate(year, month, day) {
    if (month < 1 || month > 12 || day < 1) return false;
    var extra = month === 2 && isLeapYear(year) ? 1 : 0;
    return day <= MONTH_LENGTHS[month - 1] + extra;
  }

  /** 1970-01-01부터의 날수 (앱의 epochDayOf와 같은 값). 그레고리력의 날수 공식이라 Date를 쓰지 않는다. */
  function epochDayOf(year, month, day) {
    var y = month <= 2 ? year - 1 : year;
    var era = Math.floor(y / 400);
    var yearOfEra = y - era * 400;
    var monthFromMarch = (month + 9) % 12;
    var dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5) + day - 1;
    var dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
    return era * 146097 + dayOfEra - 719468;
  }

  /** 그 날의 일진, 60갑자 번호 (甲子 0 ~ 癸亥 59). 앱의 dayPillarOfEpochDay와 같다. */
  function dayPillarOf(year, month, day) {
    return (((epochDayOf(year, month, day) + 2440588 + 49) % 60) + 60) % 60;
  }

  /** 그 날의 일간 번호 (甲 0 ~ 癸 9). */
  function dayStemOf(year, month, day) {
    return dayPillarOf(year, month, day) % 10;
  }

  function compare(a, b) {
    return (a.year - b.year) || (a.month - b.month) || (a.day - b.day);
  }

  /**
   * 넣은 글을 날짜로 읽는다. 날짜 칸의 값(1990-07-21) 말고도, 날짜 칸이 없는 브라우저에서 손으로 넣은
   * 1990.7.21, 1990/07/21, 1990년 7월 21일, 19900721도 읽는다.
   * 돌려주는 값: { year, month, day } 또는 { error: 'empty' | 'invalid' | 'range' }.
   */
  function parseDate(text) {
    var value = String(text == null ? '' : text).trim();
    if (!value) return { error: 'empty' };
    var match = /^(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D*$/.exec(value) || /^(\d{4})(\d{2})(\d{2})$/.exec(value);
    if (!match) return { error: 'invalid' };
    var date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    if (!isValidDate(date.year, date.month, date.day)) return { error: 'invalid' };
    if (compare(date, FIRST) < 0 || compare(date, LAST) > 0) return { error: 'range' };
    return date;
  }

  /** 캐릭터 하나의 모든 것. [language]는 'en' 또는 'ko'. */
  function characterOf(stemIndex, language) {
    var texts = TEXTS[language] || TEXTS.en;
    var stem = STEMS[stemIndex];
    var element = Math.floor(stemIndex / 2);
    var isYang = stemIndex % 2 === 0;
    var own = texts.characters[stem];
    var meaning = texts.meaning(isYang ? texts.yang : texts.yin, texts.elements[element]);
    return {
      stem: stem,
      index: stemIndex,
      hanja: HANJA[stemIndex],
      elementKey: ELEMENT_KEYS[element],
      element: texts.elements[element],
      polarity: isYang ? texts.yang : texts.yin,
      isYang: isYang,
      meaning: meaning,
      name: own.name,
      note: own.note,
      trait: own.trait,
      // 앱의 characterTag와 같은 꼴: "Haenim · 丙 Yang Fire" / "해님 · 丙 양의 불".
      tag: own.name + ' · ' + HANJA[stemIndex] + ' ' + meaning
    };
  }

  /** 주소에서 캐릭터를 읽는다: ?c=byeong, #byeong, #c=byeong. 없거나 모르는 이름이면 -1. */
  function stemFromAddress(search, hash) {
    var fromQuery = /(?:^|[?&])c=([a-z]+)(?:&|$)/i.exec(search || '');
    var fromHash = /^#(?:c=)?([a-z]+)$/i.exec(hash || '');
    var name = (fromQuery && fromQuery[1]) || (fromHash && fromHash[1]) || '';
    return STEMS.indexOf(name.toLowerCase());
  }

  /** 공유 주소: 지금 페이지의 주소에 캐릭터만 붙인다. 날짜는 넣지 않는다. */
  function shareAddress(pageAddress, stemIndex) {
    return String(pageAddress).split(/[?#]/)[0] + '?c=' + STEMS[stemIndex];
  }

  var api = {
    STEMS: STEMS,
    HANJA: HANJA,
    TEXTS: TEXTS,
    FIRST: FIRST,
    LAST: LAST,
    isValidDate: isValidDate,
    epochDayOf: epochDayOf,
    dayPillarOf: dayPillarOf,
    dayStemOf: dayStemOf,
    parseDate: parseDate,
    characterOf: characterOf,
    stemFromAddress: stemFromAddress,
    shareAddress: shareAddress
  };
  root.SajuBomiCharacter = api;

  // 아래는 화면. 테스트(Node)에서는 document가 없어 여기서 멈춘다.
  if (typeof document === 'undefined') return;

  var language = /^ko/i.test(document.documentElement.lang) ? 'ko' : 'en';
  var ui = TEXTS[language].ui;

  function byId(id) { return document.getElementById(id); }

  var form = byId('character-form');
  var input = byId('birth-date');
  var error = byId('birth-date-error');
  var result = byId('character-result');
  var announce = byId('character-announce');
  var shareButton = byId('character-share');
  var shareStatus = byId('character-share-status');
  var shareFallback = byId('character-share-fallback');
  var shareField = byId('character-share-link');
  if (!form || !input || !result) return;

  var assets = result.getAttribute('data-assets') || '../assets/';
  var shown = null; // { character, mine }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setText(id, text) {
    var el = byId(id);
    if (el) el.textContent = text;
  }

  function clearShare() {
    if (shareStatus) shareStatus.textContent = '';
    if (shareFallback) shareFallback.hidden = true;
  }

  function show(stemIndex, mine) {
    var character = characterOf(stemIndex, language);
    shown = { character: character, mine: mine };
    result.setAttribute('data-element', character.elementKey);
    var image = byId('character-image');
    image.src = assets + 'characters/' + character.stem + '_happy.webp';
    image.alt = ui.alt(character.name, character.meaning);
    setText('character-label', mine ? ui.mine : ui.other);
    setText('character-name', character.name);
    setText('character-note', character.note);
    setText('character-hanja', character.hanja);
    setText('character-meaning', character.meaning);
    setText('character-trait', character.trait);
    var hint = byId('character-other-hint');
    if (hint) {
      hint.textContent = ui.otherHint;
      hint.hidden = mine;
    }
    clearShare();
    result.hidden = false;
    // 주소창의 주소도 공유 주소로 바꾼다 (날짜는 담지 않는다). 파일로 열었을 때 막히면 그대로 둔다.
    try {
      history.replaceState(null, '', shareAddress(location.href, stemIndex));
    } catch (e) { /* 주소를 바꾸지 못해도 결과는 보인다 */ }
    return character;
  }

  function showError(kind) {
    var message = kind === 'range' ? ui.errorRange : kind === 'invalid' ? ui.errorInvalid : ui.errorEmpty;
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function reveal() {
    if (typeof result.scrollIntoView === 'function') {
      result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var date = parseDate(input.value);
    if (date.error) {
      showError(date.error);
      return;
    }
    clearError();
    var character = show(dayStemOf(date.year, date.month, date.day), true);
    // 화면 읽기에 결과를 알린다. 같은 글을 다시 넣어도 읽도록 한 번 비운다.
    if (announce) {
      announce.textContent = '';
      window.setTimeout(function () { announce.textContent = ui.announce(character.name, character.meaning); }, 50);
    }
    reveal();
  });

  input.addEventListener('input', function () {
    if (error.textContent) clearError();
  });

  // 열 캐릭터 목록: 누르면 그 캐릭터를 보인다 (내 캐릭터라고 하지 않는다).
  Array.prototype.forEach.call(document.querySelectorAll('[data-stem]'), function (link) {
    link.addEventListener('click', function (event) {
      var index = STEMS.indexOf(link.getAttribute('data-stem'));
      if (index < 0) return;
      event.preventDefault();
      var character = show(index, false);
      if (announce) {
        announce.textContent = '';
        window.setTimeout(function () { announce.textContent = character.tag; }, 50);
      }
      reveal();
    });
  });

  function offerCopy(address) {
    if (!shareFallback || !shareField) return;
    shareField.value = address;
    shareFallback.hidden = false;
    setText('character-share-fallback-label', ui.copyYourself);
    shareField.focus();
    shareField.select();
  }

  function copy(address) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(function () {
        shareStatus.textContent = ui.copied;
      }, function () { offerCopy(address); });
    } else {
      offerCopy(address);
    }
  }

  if (shareButton) {
    shareButton.addEventListener('click', function () {
      if (!shown) return;
      clearShare();
      var character = shown.character;
      var address = shareAddress(location.href, character.index);
      var data = {
        title: ui.shareTitle,
        text: (shown.mine ? ui.shareMine : ui.shareOther)(character.tag),
        url: address
      };
      if (navigator.share) {
        navigator.share(data).then(function () { /* 공유 창이 닫혔다 */ }, function (problem) {
          // 사용자가 공유 창을 닫은 것이면 아무것도 하지 않는다. 그 밖의 실패는 링크 복사로 넘어간다.
          if (problem && problem.name === 'AbortError') return;
          copy(address);
        });
      } else {
        copy(address);
      }
    });
  }

  // 공유 주소로 열면 그 캐릭터를 바로 보인다.
  var fromAddress = stemFromAddress(location.search, location.hash);
  if (fromAddress >= 0) show(fromAddress, false);
})(typeof globalThis !== 'undefined' ? globalThis : this);
