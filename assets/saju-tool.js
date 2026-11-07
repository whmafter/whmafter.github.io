/* 웹의 사주 도구: 오늘의 운세, 2027 신년운세, 궁합, 전체사주, 연애운 (세부실행계획 2장 70~73번).
 *
 * 소개 페이지와 기능마다의 페이지(fortune/, year/, match/, saju/, love/와 그 한국어판)가 함께 쓴다. 페이지의 언어는
 * <html lang>으로, 결과에서 처음 여는 탭은 data-kind로 정한다. 계산과 글은 앱의 코드를 컴파일한
 * assets/fortune/fortune.js(sajuWeb)가 하고, 이 파일은 입력을 받아 그 결과를 화면에 놓기만 한다.
 *
 * 흐름 (2장 73번): 첫 화면은 본인 정보 입력뿐이다. "내 운세 보기"를 누르면 결과 화면이 열리고, 탭 다섯(오늘·신년운세·
 * 궁합·전체사주·연애운)을 바꿔도 생일을 다시 넣지 않는다. 궁합의 상대는 궁합 탭 안에서 넣는다. 탭마다 요약을 먼저 두고,
 * 자세한 것은 "자세히 보기" 하나로 접는다. "왜?"는 문단 끝의 작은 링크로만 둔다.
 *
 * 넣은 생일(과 궁합의 상대의 생일)은 이 브라우저의 메모리에만 있고 어디에도 보내거나 저장하지 않는다. 쿠키·브라우저의
 * 저장소를 쓰지 않고, 주소에도 담지 않는다(입력 칸에는 이름이 없어 폼이 주소로 가지 않는다). 주소는 탭의 경로만 바뀐다
 * (history.pushState·replaceState). 창을 닫으면 사라진다. 계산 파일과 자료(assets/fortune/<언어>.json)는 이 웹사이트에서 받는다.
 */
(function () {
  'use strict';

  var root = document.getElementById('saju');
  if (!root) return;
  var language = document.documentElement.lang === 'ko' ? 'ko' : 'en';
  var assets = root.getAttribute('data-assets');
  // 파일을 새로 만들면 판이 바뀌어 브라우저가 예전 파일을 쓰지 않는다.
  var version = root.getAttribute('data-version') || '';
  var suffix = version ? '?v=' + version : '';
  var joinHref = root.getAttribute('data-join');
  var appHref = root.getAttribute('data-app');

  function pad(number) { return (number < 10 ? '0' : '') + number; }
  var EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var TEXTS = {
    en: {
      names: ['Person A', 'Person B'],
      headings: {
        today: function (date) {
          return "Today's fortune for " + EN_MONTHS[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
        },
        year: '2027 New Year fortune',
        match: 'Your match',
        saju: 'Your full chart',
        love: 'Your love fortune',
        health: 'Your health fortune'
      },
      // 궁합 탭 안의 두 화면 (2장 77번 ①)
      matchViews: { today: "Today's match", overall: 'Overall match' },
      matchViewsLabel: 'Match view',
      lockedInApp: 'Opens in the app',
      // 건강운 (2장 77번 ③): 앱의 "컨디션" 글을 그대로 쓰고, 맨 아래에 의료 판단이 아니라는 안내.
      healthToday: "Today's energy",
      healthYear: function (year) { return 'Your energy in ' + year; },
      healthNote: "This isn't medical advice. If you feel unwell, please see a doctor or another health professional.",
      errors: {
        empty: 'Please fill in the year, month and day.',
        year: 'Please enter the year with four digits.',
        time: 'Please enter the birth time, or choose "I don\'t know".',
        load: "Couldn't load the reading. Please check your connection and reload the page.",
        range: "This date can't be worked out. Please check it.",
        zone: "This date can't be worked out. Please check it."
      },
      placeChosen: function (names) {
        return 'Worked out in the time zone of the country you chose (' + names + "), without adjusting for your birth city's sun time. Adding your birth city in the app makes it more precise.";
      },
      place: function (zone) {
        return "No country of birth was chosen, so this uses your device's time zone (" + zone + '). Adding your birth city in the app makes it more precise.';
      },
      noTime: 'Worked out without a birth time. Adding it in the app makes it more precise.',
      ready: 'Your reading is ready.',
      working: 'Working it out…',
      partnerNeeded: "Enter the other person's birthday to see your match.",
      more: 'See more',
      less: 'Show less',
      // 전체사주에서만 남은 접힌 칸 둘 (2장 77번 ⑤): 사주를 아는 사람의 표와 시각을 모를 때의 도구.
      tablesMore: 'See the almanac tables',
      explorerMore: "Don't know your birth time? See it by time of day",
      basis: 'Basis',
      when: function (strength) { return 'when ' + strength.charAt(0).toLowerCase() + strength.slice(1); },
      basisToggle: 'How it was read',
      onlyHere: "This result is only on this screen. Close the page and it's gone.",
      female: 'Female',
      male: 'Male',
      // 결과 화면 맨 위의 짧은 줄: "May 15, 1990 · 14:30 · Female".
      basisShort: function (person, birth) {
        var text = person.calendar === 'lunar'
          ? person.year + '-' + pad(person.month) + '-' + pad(person.day) + ' (lunar' + (person.leap ? ', leap month' : '') + ')'
          : EN_MONTHS[person.month - 1] + ' ' + person.day + ', ' + person.year;
        text += person.hour == null ? ' · time unknown' : ' · ' + pad(person.hour) + ':' + pad(person.minute);
        if (person.gender) text += ' · ' + (person.gender === 'female' ? 'Female' : 'Male');
        if (person.zoneName) text += ' · ' + person.zoneName;
        if (birth.solar && person.calendar === 'lunar') text += ' (solar ' + birth.solar[0] + '-' + pad(birth.solar[1]) + '-' + pad(birth.solar[2]) + ')';
        return text;
      },
      partnerLine: function (text) { return 'Person B: ' + text; },
      partnerEdit: 'Change',
      appMore: function (titles) { return 'More in the app: ' + titles.join(', '); },
      appLink: 'Web vs. app',
      join: 'Join the test',
      chartTitle: 'Your eight signs',
      typeTitle: 'Saju type',
      yearArt: '2027, the year of the red sheep (丁未)'
    },
    ko: {
      names: ['본인', '상대'],
      headings: {
        today: function (date) {
          return date.getFullYear() + '년 ' + (date.getMonth() + 1) + '월 ' + date.getDate() + '일 오늘의 운세';
        },
        year: '2027 신년운세',
        match: '두 사람의 궁합',
        saju: '전체사주',
        love: '연애운',
        health: '건강운'
      },
      // 궁합 탭 안의 두 화면 (2장 77번 ①)
      matchViews: { today: '오늘의 궁합', overall: '전체 궁합' },
      matchViewsLabel: '궁합 보기',
      lockedInApp: '앱에서 열려요',
      // 건강운 (2장 77번 ③): 앱의 "컨디션" 글을 그대로 쓰고, 맨 아래에 의료 판단이 아니라는 안내.
      healthToday: '오늘의 컨디션',
      healthYear: function (year) { return year + '년의 컨디션'; },
      healthNote: '의료 판단이 아니에요. 몸이 불편하면 전문가와 상의하세요.',
      errors: {
        empty: '태어난 해, 달, 날을 모두 넣어 주세요.',
        year: '해는 네 자리로 넣어 주세요.',
        time: '태어난 시각을 넣거나 "모름"을 골라 주세요.',
        load: '불러오지 못했어요. 인터넷 연결을 확인하고 페이지를 다시 열어 주세요.',
        range: '이 날짜는 계산할 수 없어요. 다시 확인해 주세요.',
        zone: '이 날짜는 계산할 수 없어요. 다시 확인해 주세요.'
      },
      placeChosen: function (names) {
        return '고른 나라(' + names + ')의 시간대로 계산했어요. 태어난 도시의 해의 시각에 맞추지는 않았어요. 앱에서 태어난 곳까지 넣으면 더 정확해요.';
      },
      place: function () {
        return '태어난 나라를 고르지 않아 한국 시간으로 계산했어요. 앱에서 태어난 도시까지 넣으면 더 정확해요.';
      },
      noTime: '태어난 시각 없이 봤어요. 앱에서 시각까지 넣으면 더 정확해요.',
      ready: '결과가 나왔어요.',
      working: '계산하고 있어요…',
      partnerNeeded: '상대의 생일을 넣으면 궁합을 봐요.',
      more: '자세히 보기',
      less: '접기',
      // 전체사주에서만 남은 접힌 칸 둘 (2장 77번 ⑤): 사주를 아는 사람의 표와 시각을 모를 때의 도구.
      tablesMore: '만세력 표 보기',
      explorerMore: '태어난 시각을 모르면: 시간대별로 보기',
      basis: '근거',
      when: function (strength) { return strength + '일 때'; },
      basisToggle: '어떻게 읽었나요',
      onlyHere: '이 결과는 이 화면에만 있어요. 창을 닫으면 사라져요.',
      female: '여성',
      male: '남성',
      // 결과 화면 맨 위의 짧은 줄: "1990.05.15 양력 · 14:30 · 여성".
      basisShort: function (person, birth) {
        var text = person.year + '.' + pad(person.month) + '.' + pad(person.day) + ' ' +
          (person.calendar === 'lunar' ? '음력' + (person.leap ? '(윤달)' : '') : '양력');
        text += person.hour == null ? ' · 시각 모름' : ' · ' + pad(person.hour) + ':' + pad(person.minute);
        if (person.gender) text += ' · ' + (person.gender === 'female' ? '여성' : '남성');
        if (person.zoneName) text += ' · ' + person.zoneName;
        if (birth.solar && person.calendar === 'lunar') text += ' (양력 ' + birth.solar[0] + '.' + pad(birth.solar[1]) + '.' + pad(birth.solar[2]) + ')';
        return text;
      },
      partnerLine: function (text) { return '상대 ' + text; },
      partnerEdit: '상대 바꾸기',
      appMore: function (titles) { return '앱에서 더 열려요: ' + titles.join(', '); },
      appLink: '웹과 앱의 차이',
      join: '테스트 참여하기',
      chartTitle: '사주 여덟 글자',
      typeTitle: '사주 유형',
      yearArt: '2027 정미년(丁未年), 붉은 양의 해'
    }
  };
  var texts = TEXTS[language];
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  // 앱의 기능 이름을 웹의 이름으로 (2장 73번 ③: 신년운세, 전체사주). 글은 앱의 것 그대로이고(앱과의 대조도 그대로), 화면에 놓을
  // 때 앱 안의 자리를 가리키는 이름만 바꾼다: "앱에서 더 열려요" 줄과 "왜?"의 시각 모름 안내.
  var WEB_NAMES = {
    ko: [['2027 올해의 운세', '2027 신년운세'], ['사주 탭의', '전체사주 탭의']],
    en: [['on the Saju tab', 'on the Full chart tab']]
  }[language];
  function webName(text) {
    if (!text) return text;
    WEB_NAMES.forEach(function (pair) { text = text.split(pair[0]).join(pair[1]); });
    return text;
  }

  // 앱의 행운의 색 (app/lib/ui/home/lucky_card.dart의 luckySwatch).
  var SWATCHES = { cheong: '#2E94A6', jeok: '#E5463E', hwang: '#FFD23F', baek: '#FFFFFF', heuk: '#26221F' };
  var ARROWS = { east: '→', south: '↓', center: '◎', west: '←', north: '↑' };
  var KINDS = ['today', 'year', 'match', 'saju', 'love', 'health'];

  function byId(id) { return document.getElementById(id); }
  var form = byId('saju-form');
  var partnerForm = byId('saju-partner-form');
  var partnerBox = byId('saju-partner');
  var status = byId('saju-status');
  var result = byId('saju-result');

  function fieldsOf(prefix) {
    return {
      solar: byId(prefix + '-solar'),
      lunar: byId(prefix + '-lunar'),
      leap: byId(prefix + '-leap'),
      optionsToggle: byId(prefix + '-options-toggle'),
      optionsLabel: byId(prefix + '-options-label'),
      optionsSummary: byId(prefix + '-options-summary'),
      options: byId(prefix + '-options'),
      leapRow: byId(prefix + '-leap-row'),
      year: byId(prefix + '-year'),
      month: byId(prefix + '-month'),
      day: byId(prefix + '-day'),
      time: byId(prefix + '-time'),
      noTime: byId(prefix + '-no-time'),
      gender: byId(prefix + '-gender'),
      zone: byId(prefix + '-zone'),
      error: byId(prefix + '-error')
    };
  }
  var people = [fieldsOf('p0'), fieldsOf('p1')];
  // 숫자를 다 넣어 다음 칸으로 저절로 넘어가는 중 (해님은 이때 뛰지 않는다: 칸에 직접 들어갈 때만).
  var advancing = false;

  // 숫자 칸: 숫자만 받고, 앱처럼 다 넣으면 다음 칸으로 간다 (해 네 자리, 달은 두 자리나 2~9 한 자리).
  people.forEach(function (fields) {
    [['year', 4, fields.month], ['month', 2, fields.day], ['day', 2, null]].forEach(function (part) {
      var input = fields[part[0]];
      input.addEventListener('input', function () {
        var digits = input.value.replace(/[^0-9]/g, '').slice(0, part[1]);
        if (digits !== input.value) input.value = digits;
        var next = part[2];
        var filled = digits.length === part[1] || (part[0] === 'month' && /^[2-9]$/.test(digits));
        if (next && filled && document.activeElement === input) {
          advancing = true;
          next.focus();
          advancing = false;
        }
      });
      // 달과 날은 칸을 떠날 때 두 자리로 맞춘다 ("3" → "03"). 계산은 숫자로 읽으므로 같다 (2장 75번).
      if (part[0] !== 'year') {
        input.addEventListener('blur', function () {
          if (/^[1-9]$/.test(input.value)) input.value = '0' + input.value;
        });
      }
    });
    // 양력|음력 (한국어 화면): 이름 없는 두 단추. 음력이면 윤달을 고르는 칸이 나온다.
    [fields.solar, fields.lunar].forEach(function (button) {
      if (!button) return;
      button.addEventListener('click', function () {
        setCalendar(fields, button === fields.lunar);
        onEdit(people.indexOf(fields));
      });
    });
    // 태어난 시각·성별: 눌러서 펼친다. 넣은 값은 접어도 쓰이고, 단추 옆에 짧게 보인다.
    fields.optionsToggle.addEventListener('click', function () {
      setOptions(fields, fields.options.hidden);
    });
    fields.noTime.addEventListener('change', function () {
      fields.time.disabled = fields.noTime.checked;
      if (fields.noTime.checked) fields.time.value = '';
      showOptionsSummary(fields);
    });
    fields.time.addEventListener('input', function () { showOptionsSummary(fields); });
    fields.gender.addEventListener('change', function () { showOptionsSummary(fields); });
    fields.zone.addEventListener('change', function () { showOptionsSummary(fields); });
  });

  function isLunar(fields) {
    return !!fields.lunar && fields.lunar.getAttribute('aria-pressed') === 'true';
  }
  function setCalendar(fields, lunar) {
    if (!fields.lunar) return;
    fields.lunar.setAttribute('aria-pressed', lunar ? 'true' : 'false');
    fields.solar.setAttribute('aria-pressed', lunar ? 'false' : 'true');
    fields.leapRow.hidden = !lunar;
    if (!lunar) fields.leap.checked = false;
  }
  function setOptions(fields, open) {
    fields.options.hidden = !open;
    fields.optionsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    fields.optionsToggle.firstChild.textContent = open ? '－' : '＋';
  }
  // 접힌 단추 옆에 넣은 값을 작게 ("09:30 · 남성 · 일본").
  function showOptionsSummary(fields) {
    var parts = [];
    if (!fields.noTime.checked && fields.time.value) parts.push(fields.time.value);
    if (fields.gender.value) parts.push(fields.gender.value === 'female' ? texts.female : texts.male);
    if (fields.zone.value) parts.push(fields.zone.options[fields.zone.selectedIndex].textContent);
    fields.optionsSummary.textContent = parts.join(' · ');
  }

  // 계산 파일과 자료는 처음 쓸 때 한 번 받는다. 둘 다 이 웹사이트의 파일이다. 입력 칸에 처음 들어오면 미리 받기 시작한다.
  var dataText = null;
  var engine = null;
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  function loadEngine() {
    if (engine) return engine;
    engine = Promise.all([
      typeof window.sajuWeb === 'function' ? Promise.resolve() : loadScript(assets + 'fortune/fortune.js' + suffix),
      fetch(assets + 'fortune/' + language + '.json' + suffix, { credentials: 'omit' }).then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
    ]).then(function (loaded) {
      dataText = loaded[1];
      if (typeof window.sajuWeb !== 'function') throw new Error('sajuWeb');
    });
    // 받지 못했으면 다음에 다시 받는다.
    engine.catch(function () { engine = null; });
    return engine;
  }
  form.addEventListener('focusin', function () { loadEngine().catch(function () {}); }, { once: true });

  // 페이지가 정하는 어림한 시간대: 한국어 페이지는 한국, 영어 페이지는 이 기기의 시간대 (앱이 태어난 곳을 모를 때와 같은 뜻).
  function zoneOf() {
    if (language === 'ko') return 'Asia/Seoul';
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }

  function clearErrors(index) {
    var fields = people[index];
    fields.error.textContent = '';
    fields.error.hidden = true;
    ['year', 'month', 'day', 'time'].forEach(function (name) { fields[name].removeAttribute('aria-invalid'); });
  }
  function showError(index, message, field) {
    var fields = people[index] || people[0];
    fields.error.textContent = message;
    fields.error.hidden = false;
    var target = fields[field] || fields.year;
    ['year', 'month', 'day'].forEach(function (name) {
      if (!field || name === field) fields[name].setAttribute('aria-invalid', 'true');
    });
    if (field === 'time') {
      // 시각의 잘못이면 접힌 칸을 펼친다.
      setOptions(fields, true);
      fields.time.setAttribute('aria-invalid', 'true');
    }
    target.focus();
  }

  // 한 사람의 칸을 읽는다. 받을 수 있는지는 계산 파일이 앱과 같은 규칙으로 본다.
  function readPerson(index) {
    var fields = people[index];
    var year = fields.year.value.trim();
    var month = fields.month.value.trim();
    var day = fields.day.value.trim();
    if (!year || !month || !day) return { error: texts.errors.empty, field: !year ? 'year' : !month ? 'month' : 'day' };
    if (year.length !== 4) return { error: texts.errors.year, field: 'year' };
    if (!fields.noTime.checked && fields.time.validity && fields.time.validity.badInput) {
      return { error: texts.errors.time, field: 'time' };
    }
    var time = fields.noTime.checked ? '' : fields.time.value;
    var clock = time ? time.split(':').map(Number) : null;
    var lunar = isLunar(fields);
    return {
      person: {
        calendar: lunar ? 'lunar' : 'solar',
        leap: lunar && fields.leap.checked,
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: clock ? clock[0] : null,
        minute: clock ? clock[1] : null,
        gender: fields.gender.value || null,
        timeZone: fields.zone.value || zoneOf(),
        zoneName: fields.zone.value ? fields.zone.options[fields.zone.selectedIndex].textContent : null
      }
    };
  }

  function todayOf(now) { return [now.getFullYear(), now.getMonth() + 1, now.getDate()]; }

  function compute(kind, input) {
    var now = new Date();
    var request = {
      kind: kind,
      language: language,
      today: todayOf(now),
      now: now.getTime(),
      people: input.people,
      names: texts.names
    };
    var output = JSON.parse(window.sajuWeb(dataText, JSON.stringify(request)));
    if (output.error === 'zone' && input.people.some(function (person) { return person.timeZone !== 'UTC'; })) {
      input.people.forEach(function (person) { person.timeZone = 'UTC'; });
      return compute(kind, input);
    }
    return output;
  }

  // ---- 첫 화면의 반짝임과 해님 (2장 76번) ----
  // 반짝임: CSS 애니메이션(밝기만)이고, 이 단추로 멈추고 다시 켠다(WCAG 2.2.2). 고른 것은 저장하지 않는다.
  var band = byId('saju-input-view');
  var sparkle = byId('saju-sparkle-toggle');
  if (sparkle) {
    sparkle.addEventListener('click', function () {
      var still = band.classList.toggle('is-still');
      sparkle.textContent = sparkle.getAttribute(still ? 'data-go' : 'data-stop');
    });
  }

  // 해님: 눈동자가 따라보기 (2장 76번 ⑧, 사용자 답 "눈동자가 따라보기"). 해님은 몸(눈 없음)·눈·하이라이트 세 겹(Blender 렌더)이고,
  // PC는 천천히 따라오는 커서 자리(프레임마다 4.5%, 약 0.8초)로 눈만 몇 px 미끄러진다(하이라이트는 60%만 움직여 입체감). 그림은
  // 바꾸지 않는다. 몸은 아주 살짝 기운다. 4~7초에 한 번 짧게 깜빡인다. 스크롤하면 살짝 떠오르며 작아지고, 누르면 부드럽게 통통.
  // 생일을 넣기 시작하면 궁금(행복, 눈을 감아 따라보기는 쉼), 다 들어가면 신남(눈이 있어 계속 따라봄): 표정은 그림을 미리 풀어 둔 뒤
  // 한 번만 서서히 넘긴다. 휴대폰은 기울이기를 쓰지 않고 스크롤·탭·깜빡임만. 움직임 줄이기면 표정만 바뀐다(넘김·깜빡임 없이).
  // transform·opacity만 쓰고, 바뀔 것이 있을 때만 그린다.
  (function mascot() {
    var box = root.querySelector('.saju-mascot');
    if (!box) return;
    var stage = box.querySelector('.saju-mascot-stage');
    var still = !!(reduceMotion && reduceMotion.matches);
    var fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    var follow = fine && !still;
    var FOLLOW = 0.045;      // 한 프레임(60fps)에 남은 거리의 4.5%
    var EYE_X = 1.3;         // 눈이 움직이는 가장 큰 폭 (그림 폭의 %)
    var EYE_Y = 0.8;
    var SHINE = 0.6;         // 하이라이트는 눈의 60%만
    var GLANCE = 0.16;       // 빈 곳을 누르면 눈만 그쪽으로 힐끗 (한 프레임에 16%, 약 0.25초)
    var faces = { calm: box.querySelector('.saju-face') };
    var showing = 'calm';
    var state = 'idle';
    var raw = { x: 0, y: 0 };       // 커서 자리 (-1~1). 몸은 이것을 천천히 따른다.
    var soft = { x: 0, y: 0 };
    var eyeRaw = { x: 0, y: 0 };    // 눈이 볼 곳: 보통은 커서, 힐끗 보는 동안은 누른 곳
    var eyeSoft = { x: 0, y: 0 };
    var eyeRate = FOLLOW;
    var glancing = null;
    var scrollRaw = 0;
    var scrollSoft = 0;
    var drawing = false;
    var last = 0;

    // 표정 그림 한 벌 (첫 화면의 평온과 같은 크기·고르기). 행복은 눈을 감은 한 장, 신남은 세 겹.
    function layer(name, className) {
      var calmImage = faces.calm.querySelector('img');
      var picture = document.createElement('picture');
      picture.className = className;
      var source = document.createElement('source');
      source.type = 'image/avif';
      source.srcset = faces.calm.querySelector('source').srcset.replace(/calm_body/g, name);
      source.sizes = faces.calm.querySelector('source').sizes;
      var image = document.createElement('img');
      image.alt = '';
      image.decoding = 'async';
      image.width = calmImage.width;
      image.height = calmImage.height;
      image.sizes = calmImage.sizes;
      image.srcset = calmImage.srcset.replace(/calm_body/g, name);
      image.src = calmImage.getAttribute('src').replace(/calm_body/g, name);
      picture.appendChild(source);
      picture.appendChild(image);
      return picture;
    }
    function build(name) {
      if (faces[name]) return faces[name];
      var face = document.createElement('div');
      face.className = 'saju-face';
      face.setAttribute('data-face', name);
      face.setAttribute('aria-hidden', 'true');
      if (name === 'happy') {
        face.appendChild(layer('happy', 'saju-face-body'));
      } else {
        face.appendChild(layer(name + '_body', 'saju-face-body'));
        face.appendChild(layer(name + '_eyes', 'saju-face-eyes'));
        face.appendChild(layer(name + '_shine', 'saju-face-shine'));
      }
      stage.appendChild(face);
      faces[name] = face;
      return face;
    }
    // 그림을 다 풀어 둔 뒤 보이게 한다 (넘기는 순간 멈칫이 없게).
    function decoded(face) {
      return Promise.all(Array.prototype.map.call(face.querySelectorAll('img'), function (image) {
        return image.decode ? image.decode().catch(function () {}) : Promise.resolve();
      }));
    }
    function show(name) {
      var face = build(name);
      decoded(face).then(function () {
        if (state !== stateOf(name)) return;   // 그사이 바뀌었으면 넘기지 않는다
        Object.keys(faces).forEach(function (key) { faces[key].classList.toggle('is-active', key === name); });
        showing = name;
        request();
      });
    }
    function stateOf(name) { return name === 'happy' ? 'typing' : name === 'excited' ? 'done' : 'idle'; }
    function faceOf(next) { return next === 'typing' ? 'happy' : next === 'done' ? 'excited' : 'calm'; }

    // 뛰기: 해님을 누르거나 생일을 다 넣거나 "내 운세 보기"를 누르면 통통(is-bounce), 입력 칸에 들어가면 조금 작게 폴짝(is-hop) (2장 76번 ⑩).
    // 뛰는 중에는 다시 시작하지 않는다(겹치면 한 번만, 중간에 끊겨 튀지 않게). 칸 폴짝은 마지막 뛰기에서 1.2초가 지나야.
    var lastJump = -Infinity;
    function landed() { stage.classList.remove('is-bounce', 'is-hop'); }
    function jump(kind) {
      if (still) return;
      var now = window.performance.now();
      var busy = stage.classList.contains('is-bounce') || stage.classList.contains('is-hop');
      if (busy && now - lastJump < 1500) return;
      landed();
      void stage.offsetWidth;
      stage.classList.add(kind);
      lastJump = now;
    }
    function hop() {
      if (band.hidden || window.performance.now() - lastJump < 1200) return;
      jump('is-hop');
    }
    stage.addEventListener('animationend', function (event) {
      if (event.target === stage) landed();
    });
    stage.addEventListener('animationcancel', function (event) {
      if (event.target === stage) landed();
    });

    // 깜빡임: 4~7초에 한 번, 눈이 있는 표정에서만.
    function blink() {
      if (!still && !document.hidden && !band.hidden && showing !== 'happy') {
        var face = faces[showing];
        face.classList.remove('is-blink');
        void face.offsetWidth;
        face.classList.add('is-blink');
        setTimeout(function () { face.classList.remove('is-blink'); }, 400);
      }
      setTimeout(blink, 4000 + Math.random() * 3000);
    }
    if (!still) setTimeout(blink, 2500 + Math.random() * 2000);

    function draw(time) {
      drawing = false;
      if (document.hidden || band.hidden) return;
      var dt = last ? Math.min(64, time - last) : 16.7;
      last = time;
      var k = 1 - Math.pow(1 - FOLLOW, dt / 16.7);   // 화면 빈도와 상관없이 같은 빠르기
      var ke = 1 - Math.pow(1 - eyeRate, dt / 16.7);
      soft.x += (raw.x - soft.x) * k;
      soft.y += (raw.y - soft.y) * k;
      eyeSoft.x += (eyeRaw.x - eyeSoft.x) * ke;
      eyeSoft.y += (eyeRaw.y - eyeSoft.y) * ke;
      scrollSoft += (scrollRaw - scrollSoft) * k;
      var moving = Math.abs(raw.x - soft.x) > 0.002 || Math.abs(raw.y - soft.y) > 0.002 || Math.abs(scrollRaw - scrollSoft) > 0.3 ||
        Math.abs(eyeRaw.x - eyeSoft.x) > 0.002 || Math.abs(eyeRaw.y - eyeSoft.y) > 0.002;
      var lift = Math.min(scrollSoft, 240);
      box.style.transform = 'translate3d(' + (soft.x * 3).toFixed(2) + 'px,' + (soft.y * 2 - lift * 0.1).toFixed(2) + 'px,0) rotate(' +
        (soft.x * 1.2 + lift * 0.008).toFixed(3) + 'deg) scale(' + (1 - lift / 2400).toFixed(4) + ')';
      var ex = (eyeSoft.x * EYE_X).toFixed(3);
      var ey = (eyeSoft.y * EYE_Y).toFixed(3);
      ['calm', 'excited'].forEach(function (name) {
        var face = faces[name];
        if (!face) return;
        var eyes = face.querySelector('.saju-face-eyes');
        var shine = face.querySelector('.saju-face-shine');
        eyes.style.transform = 'translate3d(' + ex + '%,' + ey + '%,0)';
        shine.style.transform = 'translate3d(' + (ex * SHINE).toFixed(3) + '%,' + (ey * SHINE).toFixed(3) + '%,0)';
      });
      if (moving) request();
      else last = 0;
    }
    function request() {
      if (!drawing && !still) {
        drawing = true;
        window.requestAnimationFrame(draw);
      }
    }

    // 화면의 한 점을 해님 기준 -1~1로 (해님 가운데 = 0)
    function aim(x, y, into) {
      var rect = box.getBoundingClientRect();
      into.x = Math.max(-1, Math.min(1, (x - (rect.left + rect.width / 2)) / (window.innerWidth * 0.35)));
      into.y = Math.max(-1, Math.min(1, (y - (rect.top + rect.height * 0.55)) / (window.innerHeight * 0.35)));
    }
    function lookAtPointer() {
      eyeRaw.x = raw.x;
      eyeRaw.y = raw.y;
    }
    if (follow) {
      window.addEventListener('pointermove', function (event) {
        if (band.hidden || event.pointerType !== 'mouse') return;
        aim(event.clientX, event.clientY, raw);
        if (!glancing) lookAtPointer();
        request();
      }, { passive: true });
      document.addEventListener('mouseleave', function () {
        raw.x = raw.y = 0;
        if (!glancing) lookAtPointer();
        request();
      });
    }
    // 빈 곳(링크·단추·입력·해님이 아닌 곳)을 누르면 뛰지 않고 눈만 그쪽으로 힐끗 갔다가 0.8~1.2초 뒤 천천히 돌아온다
    // (PC는 커서 따라보기로, 휴대폰은 가운데로). 눈을 감은 표정(궁금)이면 하지 않는다 (2장 76번 ⑪).
    function glance(x, y) {
      if (still || band.hidden || showing === 'happy') return;
      aim(x, y, eyeRaw);
      eyeRate = GLANCE;
      clearTimeout(glancing);
      glancing = setTimeout(function () {
        glancing = null;
        eyeRate = FOLLOW;
        lookAtPointer();
        request();
      }, 800 + Math.random() * 400);
      request();
    }
    if (!still) {
      document.addEventListener('click', function (event) {
        var target = event.target;
        if (band.hidden || !target.closest) return;
        if (target.closest('a, button, input, select, textarea, label, summary, [role=button], [tabindex], .saju-mascot')) return;
        glance(event.clientX, event.clientY);
      });
    }
    if (!still) {
      window.addEventListener('scroll', function () {
        scrollRaw = window.scrollY || 0;
        request();
      }, { passive: true });
      box.addEventListener('click', function () { jump('is-bounce'); });
      // "내 운세 보기"를 누르는 순간 한 번 (결과로 넘어가는 것은 늦추지 않는다).
      var go = band.querySelector('button[type=submit]');
      if (go) go.addEventListener('pointerdown', function () { jump('is-bounce'); });
    }
    // 입력 카드의 칸(양력|음력, 년·월·일, 펼치기, 펼친 칸)에 들어가거나 고를 때 한 번 폴짝. 같은 칸에서 숫자를 칠 때,
    // 숫자를 다 넣어 저절로 다음 칸으로 갈 때, 창을 오갔다 같은 칸으로 돌아올 때는 뛰지 않는다. 보기 단추는 결과로 가므로 뺀다.
    var card = band.querySelector('.saju-card');
    var lastField = null;
    function isField(element) {
      return !!element && element.matches && element.matches('input, select, textarea, button') && element.type !== 'submit';
    }
    if (card && !still) {
      card.addEventListener('focusin', function (event) {
        var field = event.target;
        if (field === lastField) return;
        lastField = field;
        if (!advancing && isField(field)) hop();
      });
      // Safari는 단추를 눌러도 초점을 주지 않으므로 고르는 단추·상자는 누를 때도 (초점과 겹치면 1.2초 규칙으로 한 번).
      card.addEventListener('click', function (event) {
        var field = event.target.closest && event.target.closest('button, select, input[type=checkbox], input[type=radio]');
        if (field && card.contains(field) && isField(field)) hop();
      });
    }
    // 생일을 넣는 것에 따라 표정: 비어 있으면 평온, 넣기 시작하면 궁금(행복), 다 들어가면 신남.
    var birth = people[0];
    function onBirth() {
      var year = birth.year.value.trim();
      var month = birth.month.value.trim();
      var day = birth.day.value.trim();
      var next = year.length === 4 && month && day ? 'done' : year || month || day ? 'typing' : 'idle';
      if (next === state) return;
      state = next;
      show(faceOf(next));
      if (next === 'done') jump('is-bounce');
    }
    ['year', 'month', 'day'].forEach(function (name) { birth[name].addEventListener('input', onBirth); });
    // 표정 그림은 첫 화면을 다 그린 뒤 늦게 받아 미리 풀어 둔다.
    function later() {
      var idle = window.requestIdleCallback || function (callback) { return setTimeout(callback, 400); };
      idle(function () { decoded(build('happy')); decoded(build('excited')); });
    }
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later, { once: true });
  })();

  // ---- 상태 (메모리에만) ----
  var me = null; // 본인: {person, birth}. "내 운세 보기"로 정한다.
  var partner = null; // 궁합의 상대: {person}. 궁합 탭에서 정한다.
  var activeKind = root.getAttribute('data-kind'); // 결과에서 열 탭. 처음은 그 페이지의 기능(소개는 오늘).
  var shown = null; // 지금 보이는 결과의 탭과 입력.
  var matchView = 'overall'; // 궁합 탭 안에서 고른 화면 (오늘의 궁합·전체 궁합, 2장 77번 ①).
  var midnight = null;

  // ---- 입력 화면과 결과 화면 (2장 71번 ⑨, 73번) ----
  // "내 운세 보기"를 누르면 같은 문서에서 결과 화면으로 바꾸고, 주소의 경로만 그 탭의 페이지로 바꾼다(history.pushState).
  // 탭을 바꾸면 경로만 바꾼다(replaceState). 뒤로 가기와 "고치기"는 입력 화면으로 돌아오고 넣은 값은 그대로다. 새로고침하거나
  // 그 주소로 바로 들어오면 입력 화면이 열린다(생일은 사라진다).
  var inputView = byId('saju-input-view');
  var resultView = byId('saju-result-view');
  var resultBasis = byId('saju-result-basis');
  var editButton = byId('saju-edit');
  var paths = JSON.parse(root.getAttribute('data-paths'));
  var titles = JSON.parse(root.getAttribute('data-titles'));
  var inputKind = root.getAttribute('data-page'); // 입력 화면의 주소가 가리키는 페이지.
  var pushedResult = false; // 입력 화면에서 결과 화면으로 넘어가며 기록을 하나 더했는지.
  var resultTabs = Array.prototype.slice.call(root.querySelectorAll('.saju-result-tab'));

  function showInputView() {
    resultView.hidden = true;
    inputView.hidden = false;
    document.title = titles[inputKind];
  }
  function showResultView(kind) {
    inputView.hidden = true;
    resultView.hidden = false;
    document.title = titles[kind];
    resultTabs.forEach(function (tab) {
      if (tab.getAttribute('data-kind') === kind) {
        tab.setAttribute('aria-current', 'page');
        revealTab(tab);
      } else {
        tab.removeAttribute('aria-current');
      }
    });
  }
  // 좁은 화면에서 탭 여섯이 한 줄에 들어가지 않으면 탭 줄을 가로로 밀어 본다. 고른 탭이 가려져 있으면 가운데로 (2장 77번 ③).
  function revealTab(tab) {
    var strip = tab.parentNode;
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;
    var box = strip.getBoundingClientRect();
    var rect = tab.getBoundingClientRect();
    if (rect.left >= box.left && rect.right <= box.right) return;
    strip.scrollLeft += (rect.left + rect.width / 2) - (box.left + box.width / 2);
  }

  // 풀이의 근거 보기 (2장 77번 ②): 문장 아래의 근거 줄은 처음에 숨기고, 이 전환 하나로 모두 보이거나 숨긴다. 탭을 바꿔도 그대로이고
  // 메모리에만 있다(저장하지 않는다).
  var reasonsButton = byId('saju-reasons');
  var resultTools = reasonsButton.parentNode;
  function setReasons(on) {
    resultView.classList.toggle('is-reasons', on);
    reasonsButton.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  reasonsButton.addEventListener('click', function () {
    setReasons(reasonsButton.getAttribute('aria-pressed') !== 'true');
  });
  function hideResult() {
    shown = null;
    resultTools.hidden = true;
    if (midnight) clearTimeout(midnight);
    clear(result);
  }

  // 본인의 칸이 바뀌면 지난 결과는 쓰지 않는다. 상대의 칸이 바뀌면 다시 "궁합 보기"로 정한다.
  function onEdit(index) {
    if (index === 0) {
      me = null;
      hideResult();
    } else {
      partner = null;
    }
  }
  people.forEach(function (fields, index) {
    ['year', 'month', 'day', 'time'].forEach(function (name) {
      fields[name].addEventListener('input', function () { onEdit(index); });
    });
    ['leap', 'time', 'noTime', 'gender', 'zone'].forEach(function (name) {
      if (fields[name]) fields[name].addEventListener('change', function () { onEdit(index); });
    });
  });

  // 결과로 넘어가거나(입력 화면에서), 탭을 바꿀 때 주소의 경로를 그 탭으로.
  function setPath(kind, fromInput) {
    if (fromInput) {
      history.pushState({ saju: 'result', kind: kind }, '', paths[kind]);
      pushedResult = true;
    } else {
      history.replaceState({ saju: 'result', kind: kind }, '', paths[kind]);
    }
  }

  // 탭 하나를 연다. mode: 'submit'(입력 화면의 "내 운세 보기"), 'switch'(탭), 'partner'(궁합 보기), 'midnight'.
  function open(kind, mode) {
    var fromInput = !resultView.hidden ? false : mode === 'submit';
    activeKind = kind;
    clearErrors(1);
    if (kind === 'match' && !partner) {
      // 상대가 없으면 궁합 탭 안에 상대의 칸만 보인다.
      hideResult();
      shown = { kind: kind, input: null };
      partnerBox.hidden = false;
      showResultView(kind);
      setPath(kind, fromInput);
      status.textContent = texts.partnerNeeded;
      if (mode !== 'switch') byId('saju-partner-title').focus({ preventScroll: true });
      if (mode === 'submit') window.scrollTo(0, 0);
      scheduleMidnight();
      return;
    }
    var input = { people: [me.person] };
    if (kind === 'match') input.people.push(partner.person);
    var output;
    try {
      output = compute(kind, input);
    } catch (error) {
      failed(0, texts.errors.load);
      return;
    }
    if (output.error) {
      var index = output.person || 0;
      if (index === 1) {
        // 상대의 생일이 받을 수 없는 것이면 궁합 탭의 상대 칸에서 고친다.
        partner = null;
        hideResult();
        partnerBox.hidden = false;
        showError(1, output.message || texts.errors[output.error] || texts.errors.range, output.field);
        return;
      }
      failed(0, output.message || texts.errors[output.error] || texts.errors.range, output.field);
      return;
    }
    me.birth = output.people[0];
    partnerBox.hidden = true;
    shown = { kind: kind, input: input };
    render(output, input);
    showResultView(kind);
    setPath(kind, fromInput);
    status.textContent = texts.ready;
    if (mode === 'submit' || mode === 'partner') {
      byId('saju-result-title').focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    scheduleMidnight();
  }

  // 본인의 입력으로 돌아가 잘못을 알린다.
  function failed(index, message, field) {
    me = null;
    hideResult();
    if (!resultView.hidden) {
      showInputView();
      history.replaceState({ saju: 'input' }, '', paths[inputKind]);
      pushedResult = false;
    }
    status.textContent = '';
    showError(index, message, field);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors(0);
    var read = readPerson(0);
    if (read.error) {
      me = null;
      showError(0, read.error, read.field);
      return;
    }
    status.textContent = texts.working;
    loadEngine().then(function () {
      me = { person: read.person, birth: null };
      showBasis();
      open(activeKind, 'submit');
    }, function () {
      status.textContent = '';
      showError(0, texts.errors.load);
    });
  });

  partnerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors(1);
    var read = readPerson(1);
    if (read.error) {
      showError(1, read.error, read.field);
      return;
    }
    partner = { person: read.person };
    open('match', 'partner');
  });

  // 결과 화면 맨 위의 줄: 본인의 생일 (탭을 바꿔도 같다).
  function showBasis() {
    clear(resultBasis);
    resultBasis.appendChild(element('span', 'saju-result-person', texts.basisShort(me.person, me.birth || {})));
  }

  resultTabs.forEach(function (tab) {
    tab.addEventListener('click', function (event) {
      event.preventDefault();
      if (!me) return;
      open(tab.getAttribute('data-kind'), 'switch');
    });
  });

  // 고치기: 입력 화면으로 (결과로 넘어오며 더한 기록이 있으면 뒤로 가기와 같다).
  editButton.addEventListener('click', function () {
    if (pushedResult) {
      history.back();
      return;
    }
    showInputView();
    history.replaceState({ saju: 'input' }, '', paths[inputKind]);
    people[0].year.focus();
  });

  window.addEventListener('popstate', function (event) {
    var state = event.state || {};
    if (state.saju === 'result' && me && KINDS.indexOf(state.kind) >= 0) {
      pushedResult = true;
      if (shown && shown.kind === state.kind) showResultView(state.kind);
      else open(state.kind, 'switch');
      return;
    }
    pushedResult = false;
    showInputView();
    people[0].year.focus({ preventScroll: true });
  });

  // 앱처럼 자정에 오늘이 바뀐다. 결과가 보이는 동안 자정이 지나면 새 날로 다시 계산한다.
  function scheduleMidnight() {
    if (midnight) clearTimeout(midnight);
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    midnight = setTimeout(function () {
      if (!shown || !shown.input) return;
      var output = compute(shown.kind, shown.input);
      if (!output.error) render(output, shown.input);
      scheduleMidnight();
    }, next - now);
  }

  // ---- 화면에 놓기: 글은 모두 textContent로 넣는다. ----
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function append(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }
  function avatar(character, expression, size) {
    var image = element('img', 'saju-avatar');
    // 그 표정의 그림 하나만 받는다. 무엇인지는 옆의 글이 알린다.
    image.src = assets + 'characters/' + character + '_' + expression + '.webp';
    image.alt = '';
    image.width = size;
    image.height = size;
    return image;
  }
  function card(className) { return element('div', 'card' + (className ? ' ' + className : '')); }

  // ---- 캐릭터 타일 (2장 74번 B·C): 그 캐릭터의 오행 배경을 구운 그림. Blender로 만든 것이다(characters/scripts/web_scenes.py).
  // 오늘 탭은 그날 표정의 2.5초 움직임을 두 번(약 5초) 보이고 첫 장면에서 멈춘다. 움직이는 시간이 5초를 넘지 않아 멈춤 단추가
  // 없어도 WCAG 2.2.2에 맞다. 움직임 줄이기 설정이면 처음부터 정지 그림이다. 그 사람의 것 하나만 받는다. 장식이라 화면 읽기에서
  // 숨기고, 옆의 글(기분, 캐릭터 이름)이 뜻을 알린다.
  var PLAYS = 2;
  function tile(character, expression, moving) {
    var box = element('div', 'saju-tile');
    box.setAttribute('aria-hidden', 'true');
    var base = assets + 'scene/loop/' + character + '_' + expression;
    if (moving && !(reduceMotion && reduceMotion.matches)) {
      var video = element('video');
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('disablepictureinpicture', '');
      video.width = 320;
      video.height = 320;
      video.poster = base + '-poster.webp' + suffix;
      [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (pair) {
        var source = element('source');
        source.src = base + '.' + pair[0] + suffix;
        source.type = pair[1];
        video.appendChild(source);
      });
      var plays = 0;
      video.addEventListener('ended', function () {
        plays += 1;
        video.currentTime = 0;
        if (plays < PLAYS) {
          var again = video.play();
          if (again && again.catch) again.catch(function () {});
        }
      });
      box.appendChild(video);
      return box;
    }
    var picture = element('picture');
    var source = element('source');
    source.type = 'image/avif';
    source.srcset = base + '-poster.avif' + suffix;
    var image = element('img');
    image.src = base + '-poster.webp' + suffix;
    image.alt = '';
    image.width = 320;
    image.height = 320;
    image.decoding = 'async';
    append(picture, source, image);
    box.appendChild(picture);
    return box;
  }

  // 신년운세 머리의 2027 그림 (2장 74번 E): 丁(등불) 캐릭터와 붉은 양. 폭별 AVIF·WebP.
  var yearArtSize = (root.getAttribute('data-year-art') || '1200x630').split('x').map(Number);
  function yearArt() {
    var box = element('div', 'saju-year-art');
    var picture = element('picture');
    var widths = [600, 900, 1200];
    var sizes = '(min-width: 56.25em) 38rem, calc(100vw - 2rem)';
    var source = element('source');
    source.type = 'image/avif';
    source.srcset = widths.map(function (w) { return assets + 'scene/year2027-' + w + '.avif' + suffix + ' ' + w + 'w'; }).join(', ');
    source.sizes = sizes;
    var image = element('img');
    image.src = assets + 'scene/year2027-900.webp' + suffix;
    image.srcset = widths.map(function (w) { return assets + 'scene/year2027-' + w + '.webp' + suffix + ' ' + w + 'w'; }).join(', ');
    image.sizes = sizes;
    image.alt = texts.yearArt;
    image.width = yearArtSize[0];
    image.height = yearArtSize[1];
    image.decoding = 'async';
    append(picture, source, image);
    box.appendChild(picture);
    return box;
  }
  function label(text) { return element('h3', 'fortune-label', text); }
  function soft(text, className) { return text ? element('p', 'fortune-soft fortune-small' + (className ? ' ' + className : ''), text) : null; }
  function lockIcon() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'saju-lock');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z');
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }
  var uid = 0;
  function nextId(prefix) { uid += 1; return prefix + '-' + uid; }

  function headingOf(kind) {
    if (kind === 'today') return texts.headings.today(new Date());
    return texts.headings[kind];
  }

  function render(output, input) {
    clear(result);
    var kind = output.kind;
    var whys = output.whys || {};
    showBasis();
    var section = element('section', 'saju-section fortune-section saju-' + kind);
    section.setAttribute('aria-labelledby', 'saju-result-title');
    var title = element('h2', 'section-title', headingOf(kind));
    title.id = 'saju-result-title';
    title.tabIndex = -1;
    section.appendChild(title);

    // 궁합은 상대가 누구인지와 바꾸기.
    if (kind === 'match') {
      var who = element('p', 'saju-partner-line');
      append(who, element('span', null, texts.partnerLine(texts.basisShort(input.people[1], output.people[1]))), document.createTextNode(' '));
      var change = element('button', 'saju-link-button', texts.partnerEdit);
      change.type = 'button';
      change.addEventListener('click', function () {
        hideResult();
        shown = { kind: 'match', input: null };
        partnerBox.hidden = false;
        status.textContent = texts.partnerNeeded;
        people[1].year.focus();
      });
      who.appendChild(change);
      section.appendChild(who);
    }

    var parts = RENDER[kind](output[kind], whys, output);
    // 요약 다음에 나머지도 처음부터 모두 보인다 (2장 77번 ⑤, 사용자 "자세히 보기 버튼 없이 더 많은 정보가 보여지게"). 전체사주의
    // 만세력 표와 출생 시간 탐색기만 자기 이름의 접힌 칸이다.
    section.appendChild(parts.summary);
    if (parts.detail && parts.detail.childNodes.length) {
      parts.detail.classList.add('saju-detail');
      section.appendChild(parts.detail);
    }
    section.appendChild(appLine(output.appMore));
    section.appendChild(notesOf(output, input, kind));
    result.appendChild(section);
    result.hidden = false;
    resultTools.hidden = false;
  }

  // 접힌 칸 하나: 단추를 누르면 펼치고 "접기"로 바뀐다. [more]는 단추의 이름(없으면 "자세히 보기").
  function fold(body, more) {
    var label = more || texts.more;
    var box = element('div', 'saju-fold');
    var button = element('button', 'saju-fold-button', label);
    button.type = 'button';
    body.id = nextId('saju-fold');
    body.className = 'saju-fold-body';
    body.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', body.id);
    button.addEventListener('click', function () {
      var openNow = body.hidden;
      body.hidden = !openNow;
      button.setAttribute('aria-expanded', openNow ? 'true' : 'false');
      button.textContent = openNow ? texts.less : label;
    });
    return append(box, button, body);
  }

  // 탭 맨 아래의 한 줄: 이 사람에게 앱에서 더 열리는 것의 이름, 테스트 참여하기, 웹과 앱의 차이. 긴 목록은 "웹과 앱" 페이지에.
  function appLine(groups) {
    var line = element('p', 'saju-app-line');
    var titlesOfPaid = (groups || []).filter(function (group) { return group.tier !== 'free'; })
      .map(function (group) { return webName(group.title); });
    line.appendChild(lockIcon());
    if (titlesOfPaid.length) append(line, element('span', null, texts.appMore(titlesOfPaid)), document.createTextNode(' · '));
    var join = element('a', null, texts.join);
    join.href = joinHref;
    var app = element('a', null, texts.appLink);
    app.href = appHref;
    return append(line, join, document.createTextNode(' · '), app);
  }

  // 결과 맨 아래의 작은 안내 한 덩어리: 이 화면에만 있다는 것, 태어난 곳의 가정, 시각 모름, 재미로 보는 콘텐츠(건강운은 의료
  // 판단이 아니라는 것까지).
  function notesOf(output, input, kind) {
    var notes = element('div', 'note saju-notes');
    var here = element('p', 'saju-privacy saju-privacy-small');
    append(here, lockIcon(), element('span', null, texts.onlyHere));
    append(notes,
      here,
      input.people.some(function (person) { return !person.zoneName; })
        ? element('p', null, texts.place(zoneOf()))
        : null,
      input.people.some(function (person) { return person.zoneName; })
        ? element('p', null, texts.placeChosen(input.people.filter(function (person) { return person.zoneName; })
          .map(function (person) { return person.zoneName; }).join(', ')))
        : null,
      input.people.some(function (person) { return person.hour == null; }) ? element('p', null, texts.noTime) : null,
      element('p', null, output[kind].notice),
      // 건강운의 맨 아래: 의료 판단이 아니라는 안내 (2장 77번 ③).
      kind === 'health' ? element('p', 'saju-health-note', texts.healthNote) : null);
    return notes;
  }

  // ---- 근거 한 줄 (A-82, 2장 75번 ①): 문장 바로 아래의 작은 회색 한 줄. 2장 77번 ②부터 처음에는 숨기고 "풀이의 근거 보기"로 모두 보인다.
  // 고른 글자·규칙(짧게), 강약, 확신도, 시각을 모르면 시각에 따라 달라지는지. 글은 앱의 "왜?" 그대로이고(앱과의 대조는 그대로),
  // 화면에 놓을 때 핵심만 남긴다. 예: "근거 · 그날 지지 酉(겁재) · 센 편일 때 · 경향".
  function shortBasis(text) {
    // 한자가 든 괄호("(正財)")와 한자 뒤의 읽기("卯 (묘)")를 뺀다.
    var short = text.replace(/ \([^)]*[\u4E00-\u9FFF][^)]*\)/g, '').replace(/([\u4E00-\u9FFF]) \([^)]*\)/g, '$1');
    if (language === 'ko') {
      short = short.replace(/:\s*일간에게\s+(\S+)$/, '($1)').replace(/ · 일간에게 (\S+)$/, '($1)')
        .replace(/^(\d{4}년): /, '$1 ').replace(/태어난 날의 지지 /g, '일지 ').replace(/태어난 달의 지지 /g, '월지 ').replace(/ · 원국의 지지와 /, ' ');
    } else {
      short = short.replace(/:\s*(\S+) to the day stem$/, ' ($1)').replace(/, (\S+) to the day stem$/, ' ($1)');
    }
    return short;
  }
  function basisText(why) {
    var items = [];
    (why.groups || []).forEach(function (group) {
      group.lines.forEach(function (line) {
        var text = shortBasis(line.text);
        if (items.length < 2 && items.indexOf(text) < 0) items.push(text);
      });
    });
    var parts = [texts.basis].concat(items);
    (why.context || []).forEach(function (line) {
      var match = /(강약|strength)[^:]*:\s*([^(]+)/i.exec(line);
      if (match) parts.push(texts.when(match[2].trim()));
    });
    var certainty = (why.badge || '').replace(/\s*·\s*(왜\?|Why\?)$/, '');
    if (certainty) parts.push(certainty);
    if (why.varies && why.hourMark) parts.push(why.hourMark);
    return items.length ? parts.join(' · ') : '';
  }
  function withWhy(node, why) {
    if (!why || why.chip === false) return node;
    var text = basisText(why);
    if (!text) return node;
    var holder = element('div', 'saju-why-holder');
    return append(holder, node, element('p', 'saju-basis-line', text));
  }

  // 앱에서 열리는 것의 이름 (앱의 잠긴 카드처럼 이름만, 그 문장은 웹의 자료에 없다): "앱에서 더"의 이용권 묶음마다.
  function lockedCard(groups) {
    var paid = (groups || []).filter(function (group) { return group.tier !== 'free'; });
    if (!paid.length) return null;
    var box = card('saju-locked');
    paid.forEach(function (group) {
      var head = element('h3', 'fortune-label saju-locked-title');
      append(head, lockIcon(), element('span', null, webName(group.title)));
      box.appendChild(head);
      if (group.items && group.items.length) {
        var list = element('ul', 'saju-locked-list');
        group.items.forEach(function (item) { list.appendChild(element('li', null, webName(item))); });
        box.appendChild(list);
      }
    });
    box.appendChild(element('p', 'fortune-soft fortune-small', texts.lockedInApp));
    return box;
  }

  // 결과의 격자: 휴대폰에서는 차례대로 쌓이고, PC에서는 CSS가 칸을 나눈다.
  function grid(className) { return element('div', 'saju-grid ' + className); }

  // 요약 카드: 왼쪽 캐릭터, 오른쪽 핵심.
  function summaryCard(face, body) {
    var box = card('saju-summary');
    append(box, face, append(element('div', 'saju-summary-body'), body));
    return box;
  }

  var RENDER = {
    // 오늘: 요약은 캐릭터·기분, 핵심, 해 보기. 자세히는 그날의 바탕, 네 영역, 행운 키워드.
    today: function (today, whys) {
      var face = element('div', 'saju-summary-face');
      face.setAttribute('data-element', today.element);
      append(face, tile(today.character, today.expression, true), element('p', 'fortune-pill', today.mood),
        element('p', 'fortune-soft fortune-small', today.moodLine));
      var body = element('div');
      append(body,
        label(today.keyLabel),
        withWhy(element('p', 'fortune-lead', today.summary), whys['today.summary']),
        label(today.actionLabel),
        withWhy(element('p', null, today.action), whys['today.action']));
      var summary = summaryCard(face, body);

      var detail = element('div');
      if (today.notes.length) {
        var notes = card();
        today.notes.forEach(function (note, index) {
          append(notes, element('p', 'fortune-label saju-note-label', note.label),
            withWhy(element('p', null, note.text), whys['today.note.' + index]));
        });
        detail.appendChild(notes);
      }
      var areas = card('fortune-areas');
      areas.appendChild(element('h3', 'fortune-label', today.areasTitle));
      var areaGrid = element('div', 'saju-area-grid');
      today.areas.forEach(function (area) {
        var item = element('div', 'fortune-area');
        append(item, element('h4', null, area.title), element('p', null, area.line), area.more ? element('p', 'fortune-soft', area.more) : null);
        areaGrid.appendChild(item);
      });
      areas.appendChild(areaGrid);
      // 앱처럼 네 영역 아래에 "왜?" 하나.
      if (whys['today.areas']) areas.appendChild(withWhy(element('p', 'saju-why-row'), whys['today.areas']));
      detail.appendChild(areas);
      var lucky = card('saju-lucky');
      lucky.appendChild(element('h3', 'fortune-label', today.luckyTitle));
      var list = element('ul', 'fortune-lucky');
      today.lucky.forEach(function (item) {
        var row = element('li');
        var mark = element('span', 'fortune-mark');
        mark.setAttribute('aria-hidden', 'true');
        if (item.kind === 'color') {
          mark.className = 'fortune-mark fortune-swatch';
          mark.style.backgroundColor = SWATCHES[item.color];
        } else if (item.kind === 'direction') {
          mark.textContent = ARROWS[item.direction];
        } else {
          mark.textContent = '#';
        }
        append(row, mark, element('span', 'fortune-lucky-label', item.label), document.createTextNode(' '),
          element('span', 'fortune-lucky-value', item.value));
        list.appendChild(row);
      });
      lucky.appendChild(list);
      detail.appendChild(lucky);
      return { summary: summary, detail: detail };
    },

    // 신년운세: 요약은 캐릭터·해, 등급과 테마, 흐름 한 줄. 자세히는 영역 다섯(2장 78번으로 무료), 바탕, 10년, 눈여겨볼 것,
    // 좋은 달·주의할 달, 앱에서 열리는 것(열두 달 등)의 이름.
    year: function (year, whys, output) {
      var face = element('div', 'saju-summary-face');
      append(face, tile(year.character, year.expression, false), element('p', 'fortune-soft fortune-small', year.pillar));
      var body = element('div');
      append(body,
        label(year.flowTitle),
        element('p', 'saju-grade-tag', year.grade),
        withWhy(element('p', 'fortune-lead', year.theme), whys['year.theme']),
        withWhy(element('p', null, year.gradeLine), whys['year.grade']));
      var chips = element('ul', 'fortune-chips');
      year.chips.forEach(function (chip) { chips.appendChild(element('li', null, chip)); });
      append(body, chips, soft(year.period), year.flowNote ? soft(year.flowNote) : null);
      var summary = append(element('div'), yearArt(), summaryCard(face, body));

      var detail = element('div');
      var areas = card('saju-year-areas');
      areas.appendChild(label(year.areasTitle));
      var areaGrid = element('div', 'saju-area-grid');
      year.areas.forEach(function (area) {
        areaGrid.appendChild(append(element('div', 'fortune-area'), element('h4', null, area.title), element('p', null, area.text)));
      });
      areas.appendChild(areaGrid);
      // 앱처럼 영역 다섯 아래에 근거 하나 (같은 글자로 고르고 확신도도 같다).
      if (whys['year.areas']) areas.appendChild(withWhy(element('p', 'saju-why-row'), whys['year.areas']));
      detail.appendChild(areas);
      var middle = grid('saju-grid-two');
      var branch = card();
      append(branch, label(year.branchTitle), withWhy(element('p', null, year.branch), whys['year.branch']), soft(year.branchSource));
      var decade = card();
      decade.appendChild(label(year.decadeTitle));
      if (year.decade.none) {
        decade.appendChild(element('p', 'fortune-soft', year.decade.none));
      } else {
        append(decade, element('h4', null, year.decade.label), withWhy(element('p', null, year.decade.text), whys['year.decade']));
      }
      if (year.decadeChange) {
        append(decade, element('h4', null, year.decadeChange.label),
          withWhy(element('p', null, year.decadeChange.text), whys['year.decadeChange']));
      }
      append(middle, branch, decade);
      detail.appendChild(middle);
      if (year.notes.length) {
        var notes = card();
        notes.appendChild(label(year.notesTitle));
        var noteGrid = element('div', 'saju-note-grid');
        year.notes.forEach(function (note, index) {
          noteGrid.appendChild(append(element('div', 'saju-note'), element('h4', null, note.label),
            withWhy(element('p', null, note.text), whys['year.note.' + index])));
        });
        notes.appendChild(noteGrid);
        detail.appendChild(notes);
      }
      var months = card('saju-months-card');
      months.appendChild(label(year.monthsTitle));
      var monthGrid = element('div', 'saju-months');
      function monthColumn(rows, good) {
        var list = element('div', 'saju-month-column');
        rows.forEach(function (row) {
          var item = element('div', 'fortune-month' + (good ? ' good' : ''));
          append(item, element('p', 'fortune-label', row.label), element('h4', null, row.title));
          var reasons = element('ul', 'fortune-chips');
          row.reasons.forEach(function (reason) { reasons.appendChild(element('li', null, reason)); });
          item.appendChild(reasons);
          list.appendChild(item);
        });
        return list;
      }
      append(monthGrid, monthColumn(year.goodMonths, true), monthColumn(year.cautionMonths, false));
      months.appendChild(monthGrid);
      append(detail, months, lockedCard(output.appMore));
      return { summary: summary, detail: detail };
    },

    // 궁합 (2장 77번 ①): 탭 안의 작은 전환 "오늘의 궁합 · 전체 궁합". 처음에는 전체 궁합(처음 보는 사람의 핵심이 점수라서)이고
    // 고른 것은 메모리에만 둔다(탭을 바꿔도, 상대를 바꿔도 그대로). 두 화면은 같은 상대를 쓴다.
    match: function (match, whys, output) {
      var box = element('div', 'saju-match');
      var switcher = element('div', 'saju-views');
      switcher.setAttribute('role', 'group');
      switcher.setAttribute('aria-label', texts.matchViewsLabel);
      var panels = { today: matchToday(match.today, whys), overall: matchOverall(match, whys, output) };
      var buttons = {};
      function choose(name) {
        matchView = name;
        ['today', 'overall'].forEach(function (key) {
          panels[key].hidden = key !== name;
          buttons[key].setAttribute('aria-pressed', key === name ? 'true' : 'false');
        });
      }
      ['today', 'overall'].forEach(function (name) {
        var button = element('button', 'saju-view-button', texts.matchViews[name]);
        button.type = 'button';
        button.addEventListener('click', function () { choose(name); });
        buttons[name] = button;
        switcher.appendChild(button);
      });
      append(box, switcher, panels.today, panels.overall);
      choose(matchView);
      return { summary: box, detail: null };
    },

    // 전체사주: 요약은 캐릭터, 사주 여덟 글자(누르면 그 글자의 뜻), 성격 요약, 한 줄 판정. 자세히는 오행, 사주 유형,
    // 리포트의 표지, 기본 성향, 출생 시간 탐색기, 만세력 같은 자세한 표.
    saju: function (saju, whys) {
      return sajuParts(saju, whys);
    },

    // 연애운: 요약은 캐릭터와 한 줄 판정. 자세히는 본문 1부 "끌림과 가까워지는 방식"(2장 78번으로 무료), 강점 둘과 숫자,
    // 앱에서 열리는 나머지 일곱 부분의 이름.
    love: function (love, whys, output) {
      var face = element('div', 'saju-summary-face');
      face.appendChild(tile(love.character, 'happy', false));
      var body = element('div');
      append(body, label(love.title), element('p', 'fortune-lead', love.verdict));
      var summary = summaryCard(face, body);
      var detail = element('div');
      var draw = card('saju-love-part');
      draw.appendChild(label(love.draw.title));
      love.draw.paragraphs.forEach(function (text, index) {
        if (text) draw.appendChild(withWhy(element('p', index === 0 ? 'fortune-lead' : null, text), whys['love.draw.' + index]));
      });
      var strengths = card();
      strengths.appendChild(label(love.strengthsLabel));
      var list = element('ul', 'saju-list');
      love.strengths.forEach(function (text) { list.appendChild(element('li', null, text)); });
      append(strengths, list, element('p', 'saju-numbers', love.numbers), soft(love.numbersNote),
        love.variesNote ? soft(love.variesNote) : null, soft(love.decisionNote));
      append(detail, draw, strengths, lockedCard(output.appMore));
      return { summary: summary, detail: detail };
    },

    // 건강운 (2장 77번 ③): 요약은 그날 표정의 캐릭터와 오늘의 컨디션(한 줄과 자세히). 자세히는 2027년의 컨디션(78번으로 무료),
    // 오행 균형, 앱에서 열리는 것(오행을 채우는 법)의 이름. 글은 모두 앱의 "컨디션"·오행 글 그대로다.
    health: function (health, whys, output) {
      var face = element('div', 'saju-summary-face');
      face.setAttribute('data-element', health.element);
      append(face, tile(health.character, health.expression, false), element('p', 'fortune-pill', health.mood),
        element('p', 'fortune-soft fortune-small', health.moodLine));
      var body = element('div');
      append(body, label(texts.healthToday),
        withWhy(element('p', 'fortune-lead', health.today.line), whys['health.today']),
        health.today.more ? element('p', null, health.today.more) : null);
      var summary = summaryCard(face, body);
      var detail = element('div');
      var year = card();
      append(year, label(texts.healthYear(health.sajuYear)), withWhy(element('p', null, health.year.text), whys['health.year']));
      append(detail, year, elementsCard(health), lockedCard(output.appMore));
      return { summary: summary, detail: detail };
    }
  };

  // 전체 궁합: 요약은 두 캐릭터와 점수, 한 줄, 자세한 풀이의 "어떤 사이인지"(2장 78번으로 무료). 자세히는 누가 어느 쪽, 근거,
  // 점수의 내역, 앱에서 열리는 나머지의 이름.
  function matchOverall(match, whys, output) {
    var panel = element('div', 'saju-view-panel');
    // 점수: 두 캐릭터가 점수의 표정을 짓는다. 화면 읽기는 한 문장으로 읽는다 (앱의 matchScoreSemantics).
    var score = element('div', 'saju-summary-face saju-score');
    score.appendChild(element('p', 'visually-hidden', match.scoreSpoken));
    var visual = element('div', 'saju-score-visual');
    visual.setAttribute('aria-hidden', 'true');
    append(visual,
      element('p', 'fortune-label', match.scoreLabel),
      append(element('div', 'saju-score-row'),
        avatar(match.characters[0], match.expression, 80),
        element('p', 'saju-score-number', String(match.score)),
        avatar(match.characters[1], match.expression, 80)),
      element('p', 'fortune-soft fortune-small', match.scoreRange));
    score.appendChild(visual);
    score.appendChild(element('p', 'fortune-soft fortune-small', match.moodLine));
    var body = element('div');
    append(body, label(match.summaryTitle), element('p', 'fortune-lead', match.summary),
      label(match.kindTitle), withWhy(element('p', null, match.kind), whys['match.kind']));
    panel.appendChild(summaryCard(score, body));

    var detail = element('div');
    var layout = grid('saju-grid-match');
    var left = card();
    var sides = element('div', 'saju-sides');
    sides.appendChild(label(match.sidesTitle));
    if (match.sides.both) {
      sides.appendChild(element('p', null, match.sides.both));
    } else {
      match.sides.rows.forEach(function (row) {
        var line = element('p', 'saju-side');
        append(line, avatar(row.character, 'happy', 36), element('strong', null, row.name), document.createTextNode('  ' + row.side));
        sides.appendChild(line);
      });
      sides.appendChild(soft(match.sides.hint));
    }
    left.appendChild(sides);
    match.basis.forEach(function (line) { left.appendChild(soft(line)); });
    var breakdown = card('saju-breakdown');
    breakdown.appendChild(label(match.breakdownTitle));
    var list = element('dl', 'saju-rows');
    match.rows.forEach(function (row) {
      var item = element('div', 'saju-row' + (row.total ? ' saju-row-total' : ''));
      append(item, element('dt', null, row.label),
        append(element('dd', null), row.value ? element('span', 'saju-row-value', row.value) : null,
          element('span', 'saju-row-points', row.points)));
      list.appendChild(item);
      if (row.help) list.appendChild(append(element('div', 'saju-row-help'), element('dd', 'fortune-soft fortune-small', row.help)));
    });
    breakdown.appendChild(list);
    append(breakdown, match.timeUnknown ? element('p', 'saju-step', match.timeUnknown) : null, soft(match.scoreNote), soft(match.terms));
    append(layout, left, breakdown);
    append(detail, layout, lockedCard(output.appMore));
    detail.className = 'saju-detail';
    panel.appendChild(detail);
    return panel;
  }

  // 오늘의 궁합 (앱의 `MatchTodayCard`): 두 사람의 그날 표정, 오늘의 사이의 이름과 사실 줄, 한 줄, 함께 해 볼 것, 두 사람의
  // 그날, 알림, 앱이 정한 방식이라는 말과 어떻게 읽었는지. 숫자 점수는 없다.
  function matchToday(today, whys) {
    var panel = element('div', 'saju-view-panel');
    var face = element('div', 'saju-summary-face saju-pair-face');
    var pair = element('div', 'saju-pair');
    pair.setAttribute('aria-hidden', 'true');
    today.people.forEach(function (person) { pair.appendChild(avatar(person.character, person.expression, 72)); });
    append(face, pair, element('p', 'fortune-pill', today.name));
    var body = element('div');
    append(body, label(today.title), element('p', 'fortune-soft', today.fact),
      withWhy(element('p', 'fortune-lead', today.line), whys['match.today.line']),
      label(today.actionTitle), withWhy(element('p', null, today.action), whys['match.today.action']));
    panel.appendChild(summaryCard(face, body));
    var people = card('saju-pair-days');
    people.appendChild(label(today.peopleTitle));
    today.people.forEach(function (person) {
      var row = element('div', 'saju-pair-day');
      var text = element('div');
      append(text, element('p', 'saju-pair-name', person.name), element('p', 'saju-pair-mood', person.day),
        element('p', 'fortune-soft fortune-small', person.line));
      append(row, avatar(person.character, person.expression, 44), text);
      people.appendChild(row);
    });
    append(people, today.pattern ? element('p', 'saju-step', today.pattern) : null,
      today.timeUnknown ? element('p', 'saju-step', today.timeUnknown) : null,
      soft(today.about));
    today.basis.forEach(function (line) { people.appendChild(element('p', 'saju-basis-line', line)); });
    panel.appendChild(people);
    return panel;
  }

  function sajuParts(saju, whys) {
    var face = element('div', 'saju-summary-face');
    face.setAttribute('data-element', saju.element);
    append(face, tile(saju.character, 'happy', false), element('p', 'fortune-pill', saju.characterLine));
    var body = element('div');
    append(body, label(saju.personalityTitle), element('p', 'fortune-lead', saju.personality),
      label(saju.cover.verdictLabel), element('p', null, saju.cover.verdict));
    var summary = element('div');
    append(summary, summaryCard(face, body), chartCard(saju));

    var detail = element('div');
    detail.appendChild(elementsCard(saju));
    if (saju.type) detail.appendChild(typeCard(saju.type));
    detail.appendChild(coverCard(saju));
    if (saju.nature) detail.appendChild(natureCard(saju.nature, whys, saju.cover.hourNote));
    if (saju.explorer) detail.appendChild(fold(append(element('div'), explorerCard(saju.explorer)), texts.explorerMore));
    if (saju.detail) detail.appendChild(fold(append(element('div'), tablesCard(saju.detail)), texts.tablesMore));
    return { summary: summary, detail: detail };
  }


  // 사주 여덟 글자: 글자를 누르면 그 글자의 뜻과 내 사주에서 맡은 일 (A-86, 앱의 글자의 창).
  function chartCard(saju) {
    var box = card('saju-signs');
    append(box, label(texts.chartTitle), element('p', 'saju-signs-line', saju.signs));
    var detail = saju.detail;
    var sheet = element('div', 'saju-sign-sheet');
    sheet.id = nextId('saju-sign');
    sheet.hidden = true;
    sheet.setAttribute('aria-live', 'polite');
    var buttons = [];
    var pillars = element('div', 'saju-pillars');
    saju.pillars.forEach(function (pillar, index) {
      var cell = element('div', 'saju-pillar' + (pillar.day ? ' saju-pillar-day' : ''));
      cell.appendChild(element('p', 'saju-pillar-label', pillar.label));
      var spots = detail && detail.pillarSpots ? detail.pillarSpots[index] : null;
      if (pillar.unknown) {
        append(cell, element('p', 'saju-pillar-unknown', pillar.unknown), element('p', 'fortune-soft fortune-small', pillar.later));
      } else {
        [['stem', pillar.stem, pillar.stemSpoken, pillar.stemMeaning, pillar.stemGod, pillar.stemElement],
          ['branch', pillar.branch, pillar.branchSpoken, pillar.branchMeaning, pillar.branchGod, pillar.branchElement]
        ].forEach(function (sign, part) {
          var spot = spots ? spots[part] : null;
          var target = spot && detail.signs[spot] ? element('button', 'saju-sign') : element('div', 'saju-sign');
          var glyph = element('span', 'saju-glyph', sign[1]);
          glyph.setAttribute('data-element', sign[5]);
          // 화면 읽기는 한자 대신 "병, 양의 불"처럼 읽기와 뜻으로 (앱의 signGlyphSpoken).
          glyph.setAttribute('aria-hidden', 'true');
          var meaning = element('span', 'saju-glyph-meaning', sign[3]);
          meaning.setAttribute('aria-hidden', 'true');
          append(target, glyph, element('span', 'visually-hidden', sign[2]), meaning,
            sign[4] ? element('span', 'saju-glyph-god', sign[4]) : null);
          if (target.tagName === 'BUTTON') {
            target.type = 'button';
            target.setAttribute('aria-expanded', 'false');
            target.setAttribute('aria-controls', sheet.id);
            target.setAttribute('data-spot', spot);
            target.addEventListener('click', function () {
              var openNow = target.getAttribute('aria-expanded') !== 'true';
              buttons.forEach(function (other) { other.setAttribute('aria-expanded', 'false'); });
              if (openNow) {
                target.setAttribute('aria-expanded', 'true');
                fillSheet(sheet, detail.signs[spot]);
              }
              sheet.hidden = !openNow;
            });
            buttons.push(target);
          }
          cell.appendChild(target);
        });
        cell.appendChild(element('p', 'saju-pillar-reading', pillar.reading));
      }
      pillars.appendChild(cell);
    });
    append(box, pillars, detail ? soft(detail.signTapHint, 'saju-sign-hint') : null, sheet, soft(saju.branchNote));
    return box;
  }
  function fillSheet(sheet, sign) {
    clear(sheet);
    var head = element('div', 'saju-sheet-head');
    var big = element('span', 'saju-sheet-glyph', sign.hanja);
    big.setAttribute('aria-hidden', 'true');
    append(head, big, append(element('div'), element('p', 'saju-sheet-title', sign.title),
      element('p', 'fortune-soft', sign.reading + ' · ' + sign.meaning)));
    sheet.appendChild(head);
    var place = element('ul', 'saju-list');
    sign.place.forEach(function (text) { place.appendChild(element('li', null, text)); });
    append(sheet, element('p', 'saju-why-sub', sign.placeTitle), place,
      element('p', 'saju-why-sub', sign.godTitle), element('p', null, sign.god), soft(sign.godDefinition));
    var sentences = sign.sentences;
    if (sentences) {
      sheet.appendChild(element('p', 'saju-why-sub', sentences.title));
      if (sentences.items.length) {
        var list = element('ul', 'saju-list');
        sentences.items.forEach(function (item) { list.appendChild(element('li', null, item.text)); });
        sheet.appendChild(list);
      }
      append(sheet, soft(sentences.none), soft(sentences.locked));
    }
  }

  function elementsCard(saju) {
    var elements = card();
    elements.appendChild(label(saju.elementsTitle));
    var bars = element('ul', 'saju-bars');
    saju.elements.forEach(function (row) {
      var item = element('li', 'saju-bar');
      item.setAttribute('data-element', row.element);
      var name = element('span', 'saju-bar-name', row.name);
      var track = element('span', 'saju-bar-track');
      track.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < row.total; i++) track.appendChild(element('span', i < row.count ? 'filled' : null));
      var count = element('span', 'saju-bar-count', String(row.count));
      var rest = append(element('span', 'saju-bar-rest'), track, count, row.tag ? element('span', 'saju-tag', row.tag) : null);
      var visual = append(element('span', 'saju-bar-visual'), name, rest);
      visual.setAttribute('aria-hidden', 'true');
      append(item, visual, element('span', 'visually-hidden', row.spoken + (row.tag ? ', ' + row.tag : '')));
      bars.appendChild(item);
    });
    append(elements, bars, saju.elementsBalanced ? element('p', null, saju.elementsBalanced) : null, soft(saju.elementsNote),
      saju.elementsNoTime ? element('p', 'saju-step', saju.elementsNoTime) : null);
    return elements;
  }

  // 사주 유형 (A-65): 이름과 코드, 이름의 짜임, 강점 둘, 코드 뒷자리(센 편·약한 편)의 뜻.
  function typeCard(type) {
    var box = card('saju-type');
    var head = element('div', 'saju-type-head');
    append(head, avatar(type.character, 'happy', 72), append(element('div'),
      element('p', 'fortune-label', type.title),
      element('p', 'saju-type-name', type.name + ' · ' + type.code),
      element('p', 'fortune-soft fortune-small', type.reading)));
    append(box, head, element('p', null, type.cardDetail));
    var parts = element('ul', 'saju-list');
    type.nameParts.forEach(function (text) { parts.appendChild(element('li', null, text)); });
    append(box, element('p', 'saju-why-sub', type.nameTitle), parts, soft(type.zodiacNote));
    if (type.strengths) {
      var list = element('ul', 'saju-list');
      type.strengths.items.forEach(function (item) {
        list.appendChild(append(element('li', null, item.text), element('span', 'saju-why-detail', item.from)));
      });
      append(box, element('p', 'saju-why-sub', type.strengths.title), list);
    }
    var side = type.side;
    append(box, element('p', 'saju-why-sub', side.title), element('p', null, side.meaning), element('p', null, side.score));
    side.notes.forEach(function (text) { box.appendChild(soft(text)); });
    append(box, side.timeSplit ? element('p', 'saju-step', side.timeSplit) : null, side.borderline ? soft(side.borderline) : null);
    return box;
  }

  // 평생 리포트의 표지: 한 줄 판정과 숫자, 강점 셋, 지금 속한 10년.
  function coverCard(saju) {
    var cover = saju.cover;
    var coverBox = card('saju-cover');
    coverBox.appendChild(element('h3', 'fortune-label', saju.reportTitle));
    var parts = element('div', 'saju-cover-grid');
    // 한 줄 판정은 요약에 있어 여기서는 숫자만 (리포트가 짚은 해와 근거의 수).
    var verdict = element('div', 'saju-cover-part');
    var numbers = element('ul', 'fortune-chips');
    cover.numbers.forEach(function (text) { numbers.appendChild(element('li', null, text)); });
    append(verdict, numbers, soft(cover.numbersNote));
    var strengthsPart = element('div', 'saju-cover-part');
    strengthsPart.appendChild(label(cover.strengthsTitle));
    var strengths = element('ul', 'saju-list');
    cover.strengths.forEach(function (item) { strengths.appendChild(withMarks(element('li', null, item.text), item.marks)); });
    strengthsPart.appendChild(strengths);
    append(parts, verdict, strengthsPart);
    if (cover.decade || cover.hourNote) {
      var decadePart = element('div', 'saju-cover-part');
      if (cover.decade) {
        append(decadePart, label(cover.decade.title),
          withMarks(element('p', null, cover.decade.text), cover.decade.marks),
          element('p', 'saju-time', cover.decade.time));
      }
      if (cover.hourNote) decadePart.appendChild(element('p', 'saju-step', cover.hourNote));
      parts.appendChild(decadePart);
    }
    coverBox.appendChild(parts);
    return coverBox;
  }

  // 평생 리포트의 1부 기본 성향 (2장 72번 ②, 무료): 문단마다 칸, 끝에 "왜?". 맨 아래 "어떻게 읽었나요".
  function natureCard(nature, whys, shownNote) {
    var box = card('saju-nature');
    append(box, element('h3', 'fortune-label', nature.title),
      nature.hourNote && nature.hourNote !== shownNote ? element('p', 'saju-step', nature.hourNote) : null);
    var index = 0;
    [nature.always, nature.more].forEach(function (groups) {
      (groups || []).forEach(function (group) {
        if (group.title) box.appendChild(element('h4', null, group.title));
        group.items.forEach(function (paragraph) {
          var block = element('div', 'saju-paragraph' + (paragraph.lead ? ' saju-paragraph-lead' : ''));
          paragraph.cells.forEach(function (cell, cellIndex) {
            var line = element('p', null);
            if (cell.heading) append(line, element('strong', 'saju-cell-heading', cell.heading), document.createTextNode(' '));
            line.appendChild(document.createTextNode(cell.text));
            if (cellIndex === paragraph.cells.length - 1) withMarks(line, paragraph.marks);
            block.appendChild(cellIndex === paragraph.cells.length - 1 ? withWhy(line, whys['saju.nature.' + index]) : line);
          });
          box.appendChild(block);
          index += 1;
        });
      });
    });
    if (nature.basis) {
      var basis = element('details', 'saju-basis');
      basis.appendChild(element('summary', null, nature.basis.toggle || texts.basisToggle));
      var lines = element('ul', 'saju-list');
      nature.basis.lines.forEach(function (text) { lines.appendChild(element('li', null, text)); });
      basis.appendChild(lines);
      if (nature.basis.terms && nature.basis.terms.length) {
        basis.appendChild(element('p', 'saju-why-sub', nature.basis.termsTitle));
        var terms = element('dl', 'saju-terms');
        nature.basis.terms.forEach(function (term) {
          append(terms, element('dt', null, term.name), element('dd', null, term.meaning));
        });
        basis.appendChild(terms);
      }
      box.appendChild(basis);
    }
    return box;
  }

  // 만세력 같은 자세한 표 (A-86): 대운·세운·월운의 표, 원국의 12운성·신살·합충, 넣은 정보와 계산에 쓴 시각.
  function tablesCard(detail) {
    var box = card('saju-tables');
    var details = detail.details;
    append(box, element('h3', 'fortune-label', details.toggle), soft(details.help));
    details.sections.forEach(function (section) {
      box.appendChild(element('h4', null, section.title));
      if (section.rows) {
        var scroll = element('div', 'saju-table-scroll');
        var table = element('table', 'saju-almanac');
        var headRow = element('tr');
        details.columns.forEach(function (column) {
          var th = element('th', null, column);
          th.setAttribute('scope', 'col');
          headRow.appendChild(th);
        });
        table.appendChild(append(element('thead'), headRow));
        var tbody = element('tbody');
        section.rows.forEach(function (row) {
          var tr = element('tr', row.now ? 'now' : null);
          row.cells.forEach(function (text, cellIndex) {
            var cell = element(cellIndex === 0 ? 'th' : 'td', null, text);
            if (cellIndex === 0) cell.setAttribute('scope', 'row');
            tr.appendChild(cell);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        scroll.appendChild(table);
        box.appendChild(scroll);
      } else if (section.lines) {
        var list = element('ul', 'saju-list');
        section.lines.forEach(function (text) { list.appendChild(element('li', null, text)); });
        box.appendChild(list);
      }
      if (section.message) box.appendChild(soft(section.message));
    });
    append(box, soft(detail.entered), soft(detail.applied));
    return box;
  }

  // 출생 시간 탐색기 (A-85): 태어난 시각을 모를 때, 그날 가능한 시주마다 강약·오행이 어떻게 갈리는지. 아침·낮·저녁·밤을
  // 고르면 그 때의 시주만 센다 (앱의 같은 화면의 글). 앱의 설정을 말하는 줄(하루가 바뀌는 시각·경도)은 웹에 없어 두지 않는다.
  function explorerCard(explorer) {
    var box = card('saju-explorer');
    append(box, label(explorer.title), element('p', null, explorer.intro), element('h4', null, explorer.periodTitle));
    var choices = element('div', 'saju-periods');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', explorer.periodTitle);
    var body = element('div', 'saju-explorer-body');
    body.setAttribute('aria-live', 'polite');
    var buttons = [];
    function show(id) {
      buttons.forEach(function (button) { button.setAttribute('aria-pressed', button.getAttribute('data-period') === id ? 'true' : 'false'); });
      var view = explorer.views[id];
      clear(body);
      body.appendChild(element('p', 'saju-explorer-count', view.countTitle));
      body.appendChild(element('p', 'fortune-lead', view.strength.text));
      var list = element('ul', 'saju-explorer-elements');
      view.elements.forEach(function (row) {
        var item = element('li', row.same ? 'same' : null, row.text);
        item.setAttribute('data-element', row.element);
        list.appendChild(item);
      });
      body.appendChild(list);
      var details = element('details', 'saju-explorer-list');
      details.appendChild(element('summary', null, explorer.listTitle));
      var rows = element('ul');
      view.candidates.forEach(function (candidate) {
        rows.appendChild(element('li', null, candidate.span + ' · ' + candidate.pillar + ' (' + candidate.reading + ') · ' + candidate.strength));
      });
      details.appendChild(rows);
      body.appendChild(details);
    }
    explorer.periods.forEach(function (period) {
      var button = element('button', 'saju-toggle', period.label);
      button.type = 'button';
      button.setAttribute('data-period', period.id);
      button.addEventListener('click', function () { show(period.id); });
      buttons.push(button);
      choices.appendChild(button);
    });
    append(box, choices, body, soft(explorer.hourPillarNote));
    show('unknown');
    return box;
  }

  // 문단 뒤의 작은 표시 ("시각에 따라 달라요").
  function withMarks(node, marks) {
    (marks || []).forEach(function (mark) {
      node.appendChild(document.createTextNode(' '));
      node.appendChild(element('span', 'saju-mark', mark));
    });
    return node;
  }
})();
