/**
 * basics-data.js — Static data for the Basics pages (no Firestore/admin).
 *
 * Structure:
 *   BASICS_GROUPS: [{ id, title, topics: [topic] }]
 *   topic: { id, title, desc, layout, tabs?, items? }
 *     layout: 'grid-check' (tickable tile grid) | 'tabs' (one table per tab) | 'list' (single table)
 *     tabs: [{ id, title, items: [item] }]   (used when layout = 'tabs')
 *     items: [item]                          (used when layout = 'grid-check' | 'list')
 *   item: { label, text, ipa?, usage?, note? }
 *     label: short key (letter, symbol, number...)
 *     text:  main English content — used by the TTS button
 *     ipa:   pronunciation /.../
 *     usage: examples / context
 *     note:  extra tip
 *
 * All item fields are optional — the engine only renders fields that exist.
 */

export const BASICS_GROUPS = [
  {
    id: 'foundation',
    title: 'Foundation',
    topics: [
      {
        id: 'alphabet',
        title: 'Alphabet',
        desc: 'The English alphabet: how to say all 26 letter names and the sounds they make.',
        layout: 'grid-check',
        items: [
          { label: 'Aa', text: 'A', ipa: '/eɪ/', usage: 'apple · cat · baby', note: 'Letter name "ay". In words it usually sounds /æ/ (apple), /ə/ (about) or /eɪ/ (baby).' },
          { label: 'Bb', text: 'B', ipa: '/biː/', usage: 'book · bag · climb', note: 'Letter name "bee". Sound /b/; silent in climb, bomb.' },
          { label: 'Cc', text: 'C', ipa: '/siː/', usage: 'cat · city · ocean', note: 'Before e, i, y it is /s/ (city, ice); before a, o, u /k/ (cat); ch = /tʃ/ (chair).' },
          { label: 'Dd', text: 'D', ipa: '/diː/', usage: 'dog · desk · Wednesday', note: 'Sound /d/ as in "day"; silent in Wednesday, handkerchief.' },
          { label: 'Ee', text: 'E', ipa: '/iː/', usage: 'egg · me · the', note: 'The most common letter in English; sounds /e/ (egg), /iː/ (me) or silent (late).' },
          { label: 'Ff', text: 'F', ipa: '/ef/', usage: 'fish · of · phone', note: 'Sound /f/; note that of is pronounced /əv/ (a v sound); ph = /f/ (phone).' },
          { label: 'Gg', text: 'G', ipa: '/dʒiː/', usage: 'go · giraffe · ghost', note: 'Before e, i, y often /dʒ/ (gem, page); before a, o, u /ɡ/ (go); silent in ghost.' },
          { label: 'Hh', text: 'H', ipa: '/eɪtʃ/', usage: 'hat · hour · school', note: 'A breathy /h/; silent in hour, honest; th = /θ/ or /ð/.' },
          { label: 'Ii', text: 'I', ipa: '/aɪ/', usage: 'ice · sit · bike', note: 'Letter name "eye". In words: /ɪ/ (sit), /aɪ/ (bike), /ə/ (family).' },
          { label: 'Jj', text: 'J', ipa: '/dʒeɪ/', usage: 'job · juice · jeans', note: 'Almost always /dʒ/ as in "jam".' },
          { label: 'Kk', text: 'K', ipa: '/keɪ/', usage: 'kite · know · knife', note: 'Sound /k/; silent before n (know, knife, knee).' },
          { label: 'Ll', text: 'L', ipa: '/el/', usage: 'leg · ball · milk', note: 'Two variants: clear L before vowels (leg), dark L at syllable end (ball, milk).' },
          { label: 'Mm', text: 'M', ipa: '/em/', usage: 'man · mum · camera', note: 'Nasal /m/ — keep the lips fully closed. camera can be /ˈkæm.rə/ or /ˈkæm.ər.ə/.' },
          { label: 'Nn', text: 'N', ipa: '/en/', usage: 'net · sing · thank', note: 'Sound /n/; becomes /ŋ/ before k, g: sing, think, anger.' },
          { label: 'Oo', text: 'O', ipa: '/əʊ/', usage: 'orange · go · women', note: 'The most varied vowel: /ɒ/ (hot), /əʊ/ (go), /ʌ/ (son), /uː/ (do), /ə/ (lemon).' },
          { label: 'Pp', text: 'P', ipa: '/piː/', usage: 'pen · psychology · receipt', note: 'Sound /p/; silent in psychology, receipt, corps.' },
          { label: 'Qq', text: 'Q', ipa: '/kjuː/', usage: 'queen · quick · question', note: 'Almost always with u: qu = /kw/ (queen); word-final French borrowings /k/ (unique).' },
          { label: 'Rr', text: 'R', ipa: '/ɑːr/', usage: 'red · car · tree', note: 'British English usually drops /r/ after a vowel (car = /kɑː/); American English pronounces it clearly.' },
          { label: 'Ss', text: 'S', ipa: '/es/', usage: 'sun · cars · sure', note: '/s/ (sun), /z/ after vowels (cars, is), /ʃ/ before ure/su (sure, sugar).' },
          { label: 'Tt', text: 'T', ipa: '/tiː/', usage: 'table · water · nation', note: '/t/; in American English it becomes a flap between vowels (water); tion = /ʃn/.' },
          { label: 'Uu', text: 'U', ipa: '/juː/', usage: 'umbrella · bus · rule', note: '/juː/ (use), /ʌ/ (bus), /uː/ (rule), /ʊ/ (put); after l, r, j the /j/ drops (blue, rule).' },
          { label: 'Vv', text: 'V', ipa: '/viː/', usage: 'van · very · five', note: 'Lip-to-teeth voiced /v/ — don\'t confuse it with /b/; let the upper teeth touch the lip.' },
          { label: 'Ww', text: 'W', ipa: '/ˈdʌb.əl.juː/', usage: 'water · world · answer', note: 'Letter name "double-u"; sound /w/ with rounded lips; silent in answer, sword, write.' },
          { label: 'Xx', text: 'X', ipa: '/eks/', usage: 'box · exam · Xerox', note: 'Middle/final /ks/ (box); initial Greek borrowings /z/ (Xerox, xylophone).' },
          { label: 'Yy', text: 'Y', ipa: '/waɪ/', usage: 'yes · my · happy', note: 'Word-initial /j/ (yes); final /aɪ/ (my) or /i/ (happy); medial /ɪ/ (gym).' },
          { label: 'Zz', text: 'Z', ipa: '/ziː/', usage: 'zoo · zero · music', note: 'American "zee", British "zed" /zed/; in words usually /z/ (music).' }
        ]
      },
      {
        id: 'ipa',
        title: 'IPA — Sounds',
        desc: 'The 44 English phonemes in the International Phonetic Alphabet: vowels, diphthongs and consonants.',
        layout: 'tabs',
        tabs: [
          {
            id: 'vowels', title: 'Pure vowels (12)', items: [
              { label: '/iː/', text: 'see', usage: 'see · eat · machine · key', note: 'Long "ee": stretch the lips wide, as if smiling.' },
              { label: '/ɪ/', text: 'sit', usage: 'sit · big · woman · happy', note: 'Short "i": more relaxed than /iː/; compare ship – sheep.' },
              { label: '/e/', text: 'bed', usage: 'bed · ten · said · friend', note: 'Short e (US writes /ɛ/); the jaw opens a little more than /ɪ/.' },
              { label: '/æ/', text: 'cat', usage: 'cat · bad · man · apple', note: 'Between "a" and "e": open wide, tongue low — a sound many languages lack.' },
              { label: '/ɑː/', text: 'father', usage: 'father · car · heart · park', note: 'Long "ah", throat open like at the doctor\'s; US adds /r/ (car).' },
              { label: '/ɒ/', text: 'hot', usage: 'hot · dog · lot · want', note: 'Short o (British); US usually uses /ɑː/ (hot = /hɑːt/).' },
              { label: '/ɔː/', text: 'door', usage: 'door · four · ball · thought', note: 'Long "aw" with rounded lips; minimal pair: dog – dawn.' },
              { label: '/ʊ/', text: 'book', usage: 'book · put · woman · good', note: 'Short "oo" with light lip rounding; look is not "luck".' },
              { label: '/uː/', text: 'food', usage: 'food · blue · school · you', note: 'Long "oo", lips pushed forward; pairs: ship – sheep, full – fool.' },
              { label: '/ʌ/', text: 'cup', usage: 'cup · bus · love · money', note: 'A short "uh" barked from mid-throat; never = /ˈnev.ər/.' },
              { label: '/ɜː/', text: 'bird', usage: 'bird · girl · nurse · word', note: 'Long "er"; US adds /r/ (bird = /bɜːrd/); spelled er, ir, ur, or.' },
              { label: '/ə/', text: 'about', usage: 'about · banana · teacher · support', note: 'Schwa — the most common English sound, always in unstressed syllables.' }
            ]
          },
          {
            id: 'diphthongs', title: 'Diphthongs (8)', items: [
              { label: '/eɪ/', text: 'day', usage: 'day · name · say · table', note: 'Glides e→i; open a + silent e (name), ay, ei.' },
              { label: '/aɪ/', text: 'my', usage: 'my · time · bike · try', note: 'Glides a→i; open i (bike) or y.' },
              { label: '/ɔɪ/', text: 'boy', usage: 'boy · oil · voice · point', note: 'o→i; spelled oy, oi.' },
              { label: '/əʊ/', text: 'go', usage: 'go · home · phone · toe', note: 'British /əʊ/, American /oʊ/; open o (go), oa, ow.' },
              { label: '/aʊ/', text: 'now', usage: 'now · house · out · cow', note: 'a→u; compare /aʊ/ – /aɪ/: now – nigh.' },
              { label: '/ɪə/', text: 'here', usage: 'here · near · idea · ear', note: 'i→ə; spelled ear, ere, here.' },
              { label: '/eə/', text: 'hair', usage: 'hair · there · chair · air', note: 'e→ə; spelled air, are, ere.' },
              { label: '/ʊə/', text: 'tour', usage: 'tour · sure · poor · cure', note: 'u→ə; many British speakers now merge it into /ɔː/ (poor = /pɔː/).' }
            ]
          },
          {
            id: 'consonants-voiceless', title: 'Voiceless consonants (9)', items: [
              { label: '/p/', text: 'pen', usage: 'pen · apple · happy', note: 'A puff of air, no vibration; initial p has a strong burst (pie).' },
              { label: '/t/', text: 'tea', usage: 'tea · stop · nation', note: 'No vibration; US flaps it between vowels (water, better).' },
              { label: '/k/', text: 'cat', usage: 'cat · school · kite', note: 'A sharp back-of-throat stop; c, k, ck, ch (Greek: school).' },
              { label: '/f/', text: 'fish', usage: 'fish · of-no · phone · laugh', note: 'Lower lip touches upper teeth; f, ph, gh (laugh).' },
              { label: '/θ/', text: 'think', usage: 'think · three · math · bath', note: 'Voiceless th: tongue between the teeth, then blow — not "s" or "f".' },
              { label: '/s/', text: 'sun', usage: 'sun · city · price · nice', note: 'A light hiss, no vibration; s, c, ss, ce, sc.' },
              { label: '/ʃ/', text: 'she', usage: 'she · sure · ocean · shoe', note: 'A rounded "sh"; sh, s+u (sure), tion (nation), ci (special).' },
              { label: '/tʃ/', text: 'chair', usage: 'chair · watch · teacher · church', note: 'ch or tch; a quick t sliding into sh.' },
              { label: '/h/', text: 'hat', usage: 'hat · who · behind · house', note: 'A breathy h; silent in hour, honest; who = /huː/.' }
            ]
          },
          {
            id: 'consonants-voiced', title: 'Voiced consonants (15)', items: [
              { label: '/b/', text: 'bag', usage: 'bag · table · climb-no', note: 'Voiced, lips pop open — don\'t bite the lip (that\'s /v/).' },
              { label: '/d/', text: 'dog', usage: 'dog · Wednesday-no · ladder', note: 'Voiced; US also flaps it (ladder ≈ a soft, quick d).' },
              { label: '/ɡ/', text: 'go', usage: 'go · big · ghost-no', note: 'A voiced throat stop; g, gu (guess); gh silent in ghost.' },
              { label: '/v/', text: 'van', usage: 'van · very · of', note: 'Lip + teeth WITH vibration; very / berry is a common learner mix-up.' },
              { label: '/ð/', text: 'this', usage: 'this · mother · the · breathe', note: 'Voiced th: tongue between the teeth, buzzing; the, this, mother.' },
              { label: '/z/', text: 'zoo', usage: 'zoo · cars · music · is', note: 'A buzzing s; z, s between vowels (music), s after voiced sounds (dogs).' },
              { label: '/ʒ/', text: 'vision', usage: 'vision · measure · beige · genre', note: 'The voiced twin of /ʃ/; rare — mostly -sion and loanwords.' },
              { label: '/dʒ/', text: 'jam', usage: 'jam · page · bridge · geometry', note: 'j or dge, ge, gg; the voiced twin of /tʃ/.' },
              { label: '/m/', text: 'man', usage: 'man · mother · camera', note: 'Nasal and voiced; keep the lips fully closed.' },
              { label: '/n/', text: 'net', usage: 'net · ten · dinner', note: 'Nasal and voiced; tongue tip at the ridge behind the teeth.' },
              { label: '/ŋ/', text: 'sing', usage: 'sing · think · language · anger', note: 'The "ng" nasal; ng, n before k/g; do NOT add a /ɡ/ after (sing ≠ sing-g).' },
              { label: '/l/', text: 'leg', usage: 'leg · ball · milk · yellow', note: 'Clear L at word start vs dark L at word end (deeper, more vowel-like: ball).' },
              { label: '/r/', text: 'red', usage: 'red · very · tree · around', note: 'Curl the tongue up WITHOUT touching the roof — unlike a rolled r.' },
              { label: '/w/', text: 'we', usage: 'we · water · queen · once', note: 'Round the lips, then glide open; w, qu, o (once).' },
              { label: '/j/', text: 'yes', usage: 'yes · beauty · unit · year', note: 'A "y" glide; y at word start (yes), u after j (unit), i at word end (beauty).' }
            ]
          }
        ]
      },
      {
        id: 'question-words',
        title: 'Question Words',
        desc: 'The question words: what, when, where, who, why, how and their key variations.',
        layout: 'list',
        items: [
          { label: 'what', text: "What's this?", ipa: '/wɒt/', usage: 'What do you do? — asking about a job', note: 'Asks about things, events or jobs.' },
          { label: 'when', text: 'When is your birthday?', ipa: '/wen/', usage: 'When does the class start?', note: 'Asks about time; answer with in/on/at.' },
          { label: 'where', text: 'Where do you live?', ipa: '/weə/', usage: 'Where are you from? — asking about origin', note: 'Asks about place.' },
          { label: 'who', text: 'Who is that man?', ipa: '/huː/', usage: 'Who called you?', note: 'Asks about people (subject or object in speech).' },
          { label: 'whom', text: 'To whom did you speak?', ipa: '/huːm/', usage: 'Whom did you meet?', note: 'Object form of who — formal; use who in everyday speech.' },
          { label: 'whose', text: 'Whose bag is this?', ipa: '/huːz/', usage: 'Whose is this?', note: 'Asks about ownership; don\'t confuse with who\'s = who is.' },
          { label: 'why', text: 'Why are you late?', ipa: '/waɪ/', usage: 'Why not join us?', note: 'Asks about reason; answer with because.' },
          { label: 'which', text: 'Which color do you prefer?', ipa: '/wɪtʃ/', usage: 'Which one is yours?', note: 'Choose from a known set (narrower than what).' },
          { label: 'how', text: 'How do you go to work?', ipa: '/haʊ/', usage: 'How was the movie?', note: 'Asks about manner or condition.' },
          { label: 'how many', text: 'How many siblings do you have?', ipa: '/haʊ ˈmen.i/', usage: 'How many people came?', note: 'COUNTABLE nouns, plural.' },
          { label: 'how much', text: 'How much does it cost?', ipa: '/haʊ mʌtʃ/', usage: 'How much water do you drink?', note: 'UNCOUNTABLE nouns; also asks the price.' },
          { label: 'how long', text: 'How long does it take?', ipa: '/haʊ lɒŋ/', usage: 'How long have you learned English?', note: 'Asks about duration (or physical length).' },
          { label: 'how often', text: 'How often do you exercise?', ipa: '/haʊ ˈɒf.ən/', usage: 'How often do you visit your grandparents?', note: 'Asks about frequency: once a week, every day...' },
          { label: 'how far', text: 'How far is it from here?', ipa: '/haʊ fɑː/', usage: 'How far is the airport?', note: 'Asks about distance.' },
          { label: 'how old', text: 'How old are you?', ipa: '/haʊ əʊld/', usage: 'How old is your car?', note: 'Asks about age; uses TO BE, not do/does.' },
          { label: 'how come', text: 'How come you know that?', ipa: '/haʊ kʌm/', usage: 'How come he didn\'t call?', note: 'Informal = why; keeps statement word order.' },
          { label: 'how about', text: 'How about a coffee?', ipa: '/haʊ əˈbaʊt/', usage: 'How about going for a walk?', note: 'Making suggestions: + noun / V-ing.' },
          { label: 'how is', text: "How's your mother?", ipa: '/haʊ ɪz/', usage: 'How is everything going?', note: 'Asking about health or a situation.' },
          { label: 'what time', text: 'What time is it?', ipa: '/wɒt taɪm/', usage: 'What time does the train leave?', note: 'Asks the clock time (narrower than when).' },
          { label: 'what kind of', text: 'What kind of music do you like?', ipa: '/wɒt kaɪnd əv/', usage: 'What kind of food is this?', note: 'Asks about type; speech: what kinda.' },
          { label: 'what for', text: 'What did you buy that for?', ipa: '/wɒt fɔː/', usage: 'What for?', note: 'Asks about purpose = why.' },
          { label: 'why don\'t we', text: "Why don't we take a break?", ipa: '/waɪ dəʊnt wiː/', usage: 'Why don\'t you ask the teacher?', note: 'A polite suggestion, not a real question.' },
          { label: 'who else', text: 'Who else is coming?', ipa: '/huː els/', usage: 'Who else knows the password?', note: 'else = "in addition", placed after question words.' },
          { label: 'where else', text: 'Where else have you been?', ipa: '/weə els/', usage: 'What else do you need?', note: 'Pair with else to widen the question.' },
          { label: 'which way', text: 'Which way is the station?', ipa: '/wɪtʃ weɪ/', usage: 'Which way did he go?', note: 'Asks about direction.' },
          { label: 'how many times', text: 'How many times have you tried?', ipa: '/haʊ ˈmen.i taɪmz/', usage: 'How many times a week do you swim?', note: 'Asks a specific number of times.' },
          { label: 'how do you do', text: 'How do you do?', ipa: '/haʊ də juː duː/', usage: '— How do you do? — How do you do?', note: 'Very formal first-meeting greeting; the polite reply is the same sentence.' },
          { label: 'what if', text: 'What if it rains?', ipa: '/wɒt ɪf/', usage: 'What if we\'re late?', note: 'Hypothetical: "suppose...".' },
          { label: 'how long ago', text: 'How long ago was it?', ipa: '/haʊ lɒŋ əˈɡəʊ/', usage: 'How long ago did you move here?', note: 'Asks about a past point; answer: "two years ago".' },
          { label: 'which of', text: 'Which of these do you like?', ipa: '/wɪtʃ əv/', usage: 'Which of you speaks French?', note: 'which + of + a defined pronoun/noun.' }
        ]
      },
      {
        id: 'introduction',
        title: 'Introduction',
        desc: 'Greetings, introducing yourself, saying goodbye and basic politeness.',
        layout: 'list',
        items: [
          { label: 'Greeting', text: 'Hello!', ipa: '/həˈləʊ/', usage: 'Hello, is Mai there?', note: 'Neutral, works any time; slightly more formal than Hi.' },
          { label: 'Casual greeting', text: 'Hi!', ipa: '/haɪ/', usage: 'Hi, guys!', note: 'The most common greeting in speech.' },
          { label: 'Morning', text: 'Good morning!', ipa: '/ɡʊd ˈmɔː.nɪŋ/', usage: 'Good morning, everyone.', note: 'Use before noon.' },
          { label: 'Afternoon', text: 'Good afternoon!', ipa: '/ɡʊd ˌɑːf.təˈnuːn/', usage: 'Good afternoon, how can I help you?', note: 'From about 12:00 to 17:00–18:00.' },
          { label: 'Evening', text: 'Good evening!', ipa: '/ɡʊd ˈiːv.nɪŋ/', usage: 'Good evening, welcome to the show.', note: 'A greeting for the evening — NOT for leaving (use Good night).' },
          { label: 'Between friends', text: 'Hey!', ipa: '/heɪ/', usage: 'Hey! Long time no see.', note: 'Very informal; Hey there also works.' },
          { label: 'What\'s up', text: "What's up?", ipa: '/wɒts ʌp/', usage: "— What's up? — Not much.", note: 'Casual, youth style; reply: Not much / Nothing much.' },
          { label: 'How\'s it going', text: "How's it going?", ipa: '/haʊz ɪt ˈɡəʊ.ɪŋ/', usage: "Hey John, how's it going?", note: 'Small-talk check-in; no detailed answer expected.' },
          { label: 'How are you', text: 'How are you?', ipa: '/haʊ ɑː juː/', usage: '— How are you? — I\'m fine, thanks. And you?', note: 'Classic and polite; always ask back: And you?' },
          { label: 'Old friends', text: 'Long time no see!', ipa: '/ˌlɒŋ taɪm nəʊ ˈsiː/', usage: 'Wow, long time no see!', note: 'Meeting someone after a long gap.' },
          { label: 'Reply', text: "I'm good, thanks.", ipa: '/aɪm ɡʊd θæŋks/', usage: "— You okay? — Yeah, I'm good, thanks.", note: 'More natural than "I\'m fine" in casual American speech.' },
          { label: 'So-so', text: 'So-so.', ipa: '/ˈsəʊ.səʊ/', usage: '— How was the test? — So-so.', note: 'Just okay; more natural: Not bad, Alright.' },
          { label: 'My name', text: 'My name is Linh.', ipa: '/maɪ neɪm ɪz/', usage: 'My name is Linh, I\'m from Da Nang.', note: 'Formal; in speech people prefer I\'m + name.' },
          { label: 'I am', text: "I'm Tuan.", ipa: '/aɪm/', usage: "Hi, I'm Tuan.", note: 'The most natural way to give your name.' },
          { label: 'Nickname', text: 'You can call me Mike.', ipa: '/juː kæn kɔːl miː/', usage: 'My full name is Nguyen Van A — call me Nam.', note: 'Use when you have a shorter, easier name.' },
          { label: 'Origin', text: "I'm from Vietnam.", ipa: '/aɪm frɒm/', usage: 'I\'m from Hanoi, the capital of Vietnam.', note: 'from + city/country.' },
          { label: 'Where I live', text: 'I live in Ho Chi Minh City.', ipa: '/aɪ lɪv ɪn/', usage: 'I live in a small flat downtown.', note: 'Preposition in + city/country.' },
          { label: 'Job', text: 'I\'m a software developer.', ipa: '/aɪm ə/', usage: 'I work for a startup as a designer.', note: 'Jobs take a/an; I work as + job also works.' },
          { label: 'Age', text: "I'm 25 years old.", ipa: '/aɪm/', usage: 'I\'m 25 (years old).', note: 'Uses TO BE, not have; "years old" can be dropped.' },
          { label: 'Nice to meet you', text: 'Nice to meet you.', ipa: '/naɪs tə miːt juː/', usage: '— This is Anna. — Nice to meet you.', note: 'First meetings; Pleased/Delightened to meet you is more formal.' },
          { label: 'At parting', text: 'Nice meeting you.', ipa: '/naɪs ˈmiː.tɪŋ juː/', usage: 'Nice meeting you — hope to see you again.', note: 'meeting (already met) — used when saying goodbye.' },
          { label: 'Introducing', text: "I'd like you to meet my brother.", ipa: '/aɪd laɪk juː tə/', usage: 'May I introduce my colleague, Peter?', note: 'Formal: May I introduce...; casual: This is...' },
          { label: 'This is', text: 'This is my friend Lan.', ipa: '/ðɪs ɪz/', usage: 'Lan, this is my colleague David.', note: 'The most common way to introduce people.' },
          { label: 'He/She is', text: "He's my manager.", ipa: '/hiːz/', usage: "She's a teacher at a primary school.", note: 'He/She + to be + job (with a/an).' },
          { label: 'My card', text: "Here's my card.", ipa: '/hɪəz/', usage: 'Here\'s my number — give me a ring.', note: 'Handing over a business card or phone number.' },
          { label: 'Goodbye', text: 'Goodbye!', ipa: '/ˌɡʊdˈbaɪ/', usage: 'Goodbye! — Bye bye!', note: 'Standard; Bye is casual, Bye-bye very casual/childish.' },
          { label: 'See you', text: 'See you later!', ipa: '/siː juː ˈleɪ.tə/', usage: 'See you! / See you soon! / See you tomorrow!', note: 'Very common; Catch you later (casual).' },
          { label: 'Take care', text: 'Take care!', ipa: '/teɪk keə/', usage: 'Bye, take care!', note: 'A warm wish when parting.' },
          { label: 'Good wishes', text: 'Have a nice day!', ipa: '/hæv ə naɪs deɪ/', usage: 'Have a good weekend! / Have a nice trip!', note: 'The classic conversation closer.' },
          { label: 'Good night', text: 'Good night!', ipa: '/ˌɡʊd ˈnaɪt/', usage: 'Good night, sleep well!', note: 'ONLY for leaving at night / going to bed — never for hello.' },
          { label: 'Talk later', text: 'Talk to you later.', ipa: '/tɔːk tə juː/', usage: 'I gotta go — talk to you later!', note: 'Ending a call or chat.' },
          { label: 'Please', text: 'Please.', ipa: '/pliːz/', usage: 'One coffee, please. / Please, go ahead.', note: 'Polite requests; Go ahead = "be my guest".' },
          { label: 'Thanking', text: 'Thank you.', ipa: '/ˈθæŋk juː/', usage: 'Thanks a lot! / Thank you so much!', note: 'Thanks is casual; Thank you very much is formal.' },
          { label: 'You\'re welcome', text: "You're welcome.", ipa: '/jɔː ˈwel.kəm/', usage: 'No problem. / No worries. / Anytime.', note: 'Many replies to thanks; No worries is very British/Australian.' },
          { label: 'Excuse me', text: 'Excuse me.', ipa: '/ɪkˈskjuːz miː/', usage: 'Excuse me, is this seat taken?', note: 'Getting attention, squeezing past, or calling a waiter.' },
          { label: 'Apologizing', text: "I'm sorry.", ipa: '/aɪm ˈsɒr.i/', usage: "Sorry about that. / I'm so sorry for being late.", note: 'sorry (everyday) < I\'m sorry (sincere) < I apologize (formal).' },
          { label: 'Never mind', text: 'Never mind.', ipa: '/ˈnev.ə maɪnd/', usage: 'Never mind, it\'s my fault.', note: 'Drop it, don\'t worry; It doesn\'t matter is similar.' },
          { label: 'Agreeing', text: 'Of course!', ipa: '/əv ˈkɔːs/', usage: 'Sure! / Certainly! / No problem at all.', note: 'Quick agreement; Certainly is very polite.' },
          { label: 'Totally agree', text: "I couldn't agree more.", ipa: '/aɪ kʊd ˈnɒt/', usage: 'You\'re absolutely right.', note: 'Full agreement; Absolutely! works too.' },
          { label: 'Bothering politely', text: 'Sorry to bother you...', ipa: '/ˈsɒr.i tə ˈbɒð.ə/', usage: 'Sorry to bother you, do you have a minute?', note: 'A polite opener before interrupting someone.' },
          { label: 'Self-intro', text: 'Let me introduce myself.', ipa: '/', usage: 'Let me introduce myself — I\'m Hung.', note: 'Opening a formal introduction (interviews, presentations).' },
          { label: 'Field', text: 'I work in marketing.', ipa: '/', usage: 'I work in IT / finance / education.', note: 'in + field; at + company (I work at FPT).' },
          { label: 'Family', text: 'I\'m married with two children.', ipa: '/', usage: 'I\'m single. / I have a son and a daughter.', note: 'married takes WITH ("married with a man" is wrong → married to).' },
          { label: 'Hobbies', text: 'I\'m a fan of football.', ipa: '/', usage: 'I\'m really into photography.', note: 'be into + noun/V-ing = to love something.' },
          { label: 'English?', text: 'Do you speak English?', ipa: '/', usage: 'Sorry, do you speak English?', note: 'The opener when helping a foreigner; "My English is not very good."' }
        ]
      }
    ]
  },
  {
    id: 'numbers',
    title: 'Numbers',
    topics: [
      {
        id: 'numbers-basic',
        title: 'Basic Numbers',
        desc: 'Cardinal numbers from 0 to 1,000: how to say them, spelling and teen/ty traps.',
        layout: 'tabs',
        tabs: [
          {
            id: 'zero-twelve', title: '0 – 12', items: [
              { label: '0', text: 'zero', ipa: '/ˈzɪə.rəʊ/', usage: 'The temperature is minus two degrees.', note: 'Also read "oh" /əʊ/ in phone numbers, codes and years (1908 = nineteen oh eight).' },
              { label: '1', text: 'one', ipa: '/wʌn/', usage: 'I have one brother.', note: 'Pronounced like "wan", not "oo-un".' },
              { label: '2', text: 'two', ipa: '/tuː/', usage: 'Two cups of coffee, please.', note: 'Sounds the same as to and too — tell them apart by context.' },
              { label: '3', text: 'three', ipa: '/θriː/', usage: 'There are three of us.', note: 'Starts with /θ/ — don\'t read it as "free".' },
              { label: '4', text: 'four', ipa: '/fɔː/', usage: 'The class starts at four.', note: 'Sounds the same as for.' },
              { label: '5', text: 'five', ipa: '/faɪv/', usage: 'Give me five!', note: 'Ends with /v/, not /f/.' },
              { label: '6', text: 'six', ipa: '/sɪks/', usage: 'Six of one, half a dozen of the other.', note: 'Sounds close to sex — pronounce it cleanly!' },
              { label: '7', text: 'seven', ipa: '/ˈsev.ən/', usage: 'See you at seven.', note: 'Stress the first syllable.' },
              { label: '8', text: 'eight', ipa: '/eɪt/', usage: 'I work eight hours a day.', note: 'Spelled with an extra t compared to ate, but sounds identical.' },
              { label: '9', text: 'nine', ipa: '/naɪn/', usage: 'Nine times out of ten.', note: 'Drop the e before ty: nine → ninety (but keep it in nineteen).' },
              { label: '10', text: 'ten', ipa: '/ten/', usage: 'Count from one to ten.', note: 'The base of the teens (11–19) and the tens (20–90).' },
              { label: '11', text: 'eleven', ipa: '/ɪˈlev.ən/', usage: 'Eleven o\'clock already!', note: 'Irregular — it doesn\'t follow the -teen pattern.' },
              { label: '12', text: 'twelve', ipa: '/twelv/', usage: 'A dozen = twelve.', note: 'Ends in /v/; ve → f in the ordinal: twelfth.' }
            ]
          },
          {
            id: 'thirteen-nineteen', title: '13 – 19 (teens)', items: [
              { label: '13', text: 'thirteen', ipa: '/ˌθɜːˈtiːn/', usage: 'She was thirteen when she moved abroad.', note: 'Stress the LAST syllable (-TEEN); 30 = THIR-ty (stress first) — the most confused pair.' },
              { label: '14', text: 'fourteen', ipa: '/ˌfɔːˈtiːn/', usage: 'The legal age is fourteen in some countries.', note: 'four + teen.' },
              { label: '15', text: 'fifteen', ipa: '/ˌfɪfˈtiːn/', usage: 'Wait fifteen minutes.', note: 'five → fif (drop the ve).' },
              { label: '16', text: 'sixteen', ipa: '/ˌsɪksˈtiːn/', usage: 'Sixteen candles on the cake.', note: 'six + teen.' },
              { label: '17', text: 'seventeen', ipa: '/ˌsev.ənˈtiːn/', usage: 'He started work at seventeen.', note: 'seven + teen.' },
              { label: '18', text: 'eighteen', ipa: '/ˌeɪˈtiːn/', usage: 'You can vote at eighteen.', note: 'eight + teen (one t); the age of adulthood in many countries.' },
              { label: '19', text: 'nineteen', ipa: '/ˌnaɪnˈtiːn/', usage: 'Born in 1999 — nineteen ninety-nine.', note: 'nine + teen, keeping the e.' }
            ]
          },
          {
            id: 'tens', title: '20 – 90 (tens)', items: [
              { label: '20', text: 'twenty', ipa: '/ˈtwen.ti/', usage: 'Twenty to one — it\'s unlikely.', note: 'two → twen; stress the FIRST syllable (opposite of the teens).' },
              { label: '30', text: 'thirty', ipa: '/ˈθɜː.ti/', usage: 'She\'s in her thirties.', note: 'three → thir (drop the e); THIR-ty vs thir-TEEN.' },
              { label: '40', text: 'forty', ipa: '/ˈfɔː.ti/', usage: 'The forties — the decade of life.', note: 'Spelling trap: NO u (four → forty).' },
              { label: '50', text: 'fifty', ipa: '/ˈfɪf.ti/', usage: 'Over fifty thousand people attended.', note: 'five → fif.' },
              { label: '60', text: 'sixty', ipa: '/ˈsɪk.sti/', usage: 'Sixty years — a diamond anniversary.', note: 'six + ty; the two s sounds blend — practice slowly.' },
              { label: '70', text: 'seventy', ipa: '/ˈsev.ən.ti/', usage: 'Seventy-two percent agreed.', note: 'seven + ty.' },
              { label: '80', text: 'eighty', ipa: '/ˈeɪ.ti/', usage: 'Give me eighty percent effort.', note: 'eight + y (the t stays): eighty.' },
              { label: '90', text: 'ninety', ipa: '/ˈnaɪn.ti/', usage: 'Ninety degrees — a right angle.', note: 'nine + ty (drop the e).' }
            ]
          },
          {
            id: 'hundreds', title: '100 – 1,000', items: [
              { label: '100', text: 'one hundred', ipa: '/wʌn ˈhʌn.drəd/', usage: 'A century = one hundred years.', note: 'a hundred is more casual than one hundred; never say "one hundreds".' },
              { label: '101', text: 'one hundred and one', ipa: '/ˌwʌn hʌn.drəd ən ˈwʌn/', usage: 'One Hundred and One Dalmatians.', note: 'British English adds and before the remainder; American English often drops it.' },
              { label: '110', text: 'one hundred (and) ten', ipa: '/ˈhʌn.drəd/', usage: 'Room one hundred and ten.', note: 'After hundred, numbers up to 99 read normally.' },
              { label: '121', text: 'one hundred and twenty-one', ipa: '/', usage: 'It costs one hundred and twenty-one dollars.', note: 'Hyphenate 21–99: twenty-one, fifty-six.' },
              { label: '200', text: 'two hundred', ipa: '/tuː ˈhʌn.drəd/', usage: 'Two hundred guests came.', note: 'hundred takes NO s after a number (two hundred, not two hundreds).' },
              { label: '999', text: 'nine hundred and ninety-nine', ipa: '/', usage: 'Nine ninety-nine — the price ending.', note: 'Retail prices often end in .99: "five dollars ninety-nine".' },
              { label: '1,000', text: 'one thousand', ipa: '/ˈθaʊ.zənd/', usage: 'A thousand times over.', note: 'Commas separate every three digits: 1,000.' },
              { label: '1,005', text: 'one thousand and five', ipa: '/', usage: '1,005 = one thousand and five.', note: 'A remainder under 100 still needs "and five" — never "thousand five".' }
            ]
          },
          {
            id: 'practice', title: 'Number practice', items: [
              { label: '24', text: 'twenty-four', ipa: '/ˈtwen.ti fɔː/', usage: 'I\'m twenty-four years old.', note: 'Hyphenated: twenty-four.' },
              { label: '45', text: 'forty-five', ipa: '/ˈfɔː.ti faɪv/', usage: 'Forty-five minutes to noon.', note: 'Remember: forty has no u.' },
              { label: '67', text: 'sixty-seven', ipa: '/ˈsɪk.sti ˈsev.ən/', usage: 'He\'s sixty-seven but runs marathons.', note: 'Fast reading: "siks-ee-seven".' },
              { label: '308', text: 'three hundred and eight', ipa: '/', usage: 'Bus three hundred and eight.', note: 'Empty tens slot → and + single digit.' },
              { label: '1,432', text: 'one thousand four hundred and thirty-two', ipa: '/', usage: 'The price is 1,432 dollars.', note: 'Order: thousands → hundreds → tens → units.' },
              { label: '2,500', text: 'twenty-five hundred', ipa: '/', usage: 'US: twenty-five hundred = 2,500.', note: 'Americans often say "twenty-five hundred" for money and quantities.' },
              { label: '13 vs 30', text: 'thirteen / thirty', ipa: '/ˌθɜːˈtiːn – ˈθɜː.ti/', usage: 'Listen: 13 ≠ 30.', note: 'Trick: teen = stress LATE + long /iː/; ty = stress EARLY + short /i/.' },
              { label: '15 vs 50', text: 'fifteen / fifty', ipa: '/ˌfɪfˈtiːn – ˈfɪf.ti/', usage: 'Same trick: 15 ≠ 50.', note: 'Other pairs: 17/70, 18/80, 19/90.' },
              { label: '1,000,000', text: 'a million', ipa: '/ˈmɪl.jən/', usage: '1,000,000 = a million.', note: 'Commas: one beat every three digits — count from the right.' },
              { label: '1,000,000,000', text: 'a billion', ipa: '/ˈbɪl.jən/', usage: '1,000,000,000 = a billion.', note: 'Old British English said "thousand million"; now billion is global.' },
              { label: '7', text: 'lucky seven', ipa: '/', usage: 'In the West, seven is a lucky number.', note: 'Culture: 7 = lucky, 13 = unlucky (US/UK).' },
              { label: '0', text: 'love / nil / zero / oh', ipa: '/', usage: 'Zero has four readings depending on context.', note: 'love (tennis), nil (football UK), oh (phones/years), zero (science).' }
            ]
          }
        ]
      },
      {
        id: 'numbers-big',
        title: 'Big Numbers',
        desc: 'Millions, billions, trillions — how to read large numbers and quantity words.',
        layout: 'list',
        items: [
          { label: '100', text: 'a hundred', ipa: '/ˈhʌn.drəd/', usage: 'Hundreds of fans waited outside.', note: 'With a number: two hundred (no s). Vague quantity: hundreds OF.' },
          { label: '1,000', text: 'a thousand', ipa: '/ˈθaʊ.zənd/', usage: 'Thanks a million — no, a thousand!', note: 'thousands of people = many thousands.' },
          { label: '10,000', text: 'ten thousand', ipa: '/ten ˈθaʊ.zənd/', usage: 'Ten thousand steps a day.', note: 'Just say it normally: ten + thousand.' },
          { label: '100,000', text: 'one hundred thousand', ipa: '/', usage: 'The city has one hundred thousand residents.', note: 'Never "a hundred thousands".' },
          { label: '1,000,000', text: 'one million', ipa: '/ˈmɪl.jən/', usage: 'One million subscribers!', note: 'million takes no s after a number (two million).' },
          { label: '10,000,000', text: 'ten million', ipa: '/', usage: 'Ten million viewers watched live.', note: 'Each comma group is one beat: thousand, million, billion.' },
          { label: '100,000,000', text: 'one hundred million', ipa: '/', usage: 'A hundred million views on YouTube.', note: 'British: hundred million — there is no separate word here.' },
          { label: '1,000,000,000', text: 'one billion', ipa: '/ˈbɪl.jən/', usage: 'The world population passed eight billion.', note: 'billion = 10^9 (the short scale, used worldwide today).' },
          { label: '1,000,000,000,000', text: 'one trillion', ipa: '/ˈtrɪl.jən/', usage: 'The US debt is in the tens of trillions.', note: 'A thousand billions.' },
          { label: '10^15', text: 'one quadrillion', ipa: '/ˌkwɒdˈrɪl.jən/', usage: 'A quadrillion seconds is a very long time.', note: 'Every three zeros: thousand → million → billion → trillion → quadrillion.' },
          { label: '2,345', text: 'two thousand three hundred and forty-five', ipa: '/', usage: 'The ticket costs 2,345 dollars.', note: 'Large-number pattern: thousand – hundred – and – tens units.' },
          { label: '12,600', text: 'twelve thousand six hundred', ipa: '/', usage: 'She earns twelve thousand six hundred a month.', note: 'Round hundreds: skip the remainder.' },
          { label: '1,200,000', text: 'one point two million', ipa: '/', usage: 'The film made 1.2 million dollars.', note: 'Decimals with big units: "one point two million".' },
          { label: '3,500,000', text: 'three and a half million', ipa: '/', usage: 'Three and a half million people voted.', note: 'Or "three point five million".' },
          { label: '450,000', text: 'four hundred and fifty thousand', ipa: '/', usage: '450,000 copies sold.', note: 'Mind the order: hundreds → tens → thousand.' },
          { label: '12', text: 'a dozen', ipa: '/ˈdʌz.ən/', usage: 'A dozen eggs, please.', note: 'A dozen = 12; two dozen roses (no s).' },
          { label: '13', text: 'baker\'s dozen', ipa: '/ˈbeɪ.kəz ˈdʌz.ən/', usage: 'A baker\'s dozen = thirteen.', note: 'Idiom: a baker\'s dozen is 13 — one extra to be safe.' },
          { label: '20', text: 'a score', ipa: '/skɔː/', usage: 'Four score and seven years ago... (Lincoln)', note: 'score = 20; archaic/formal.' },
          { label: '2', text: 'a pair', ipa: '/peə/', usage: 'A pair of shoes / scissors.', note: 'For things that come in twos.' },
          { label: '500,000', text: 'half a million', ipa: '/', usage: 'Half a million tourists visited last year.', note: '"half a" works with big number units.' },
          { label: 'millions', text: 'millions of', ipa: '/', usage: 'Millions of people watched the final.', note: 'Vague plurals: millions/thousands/hundreds + OF.' },
          { label: 'a few thousand', text: 'a few thousand', ipa: '/', usage: 'A few thousand people came.', note: 'Some thousands; a couple of thousand = a rough estimate.' },
          { label: '10^10', text: 'ten billion', ipa: '/', usage: 'Ten billion devices are online.', note: 'Remember: billion = 10^9, not 10^12.' },
          { label: '1,100,000', text: 'one point one million', ipa: '/', usage: '1.1 million viewers.', note: 'Read "one point one million".' },
          { label: '2,000,000,000,000', text: 'two trillion', ipa: '/', usage: 'Two trillion dollars of debt.', note: 'million → billion → trillion: one step = three zeros.' },
          { label: 'round', text: 'a round number', ipa: '/', usage: 'Let\'s pay a round number — 50, not 47.', note: 'A number ending in zeros; "round up" = round it upward.' }
        ]
      },
      {
        id: 'numbers-ordinal',
        title: 'Ordinal Numbers',
        desc: 'Ordinals 1st → 31st: dates, floors, birthdays and rankings.',
        layout: 'list',
        items: [
          { label: '1st', text: 'first', ipa: '/fɜːst/', usage: 'My first day at work.', note: 'Completely irregular compared to one.' },
          { label: '2nd', text: 'second', ipa: '/ˈsek.ənd/', usage: 'The second floor (UK: = US first floor).', note: 'Sounds the same as second (time unit).' },
          { label: '3rd', text: 'third', ipa: '/θɜːd/', usage: 'Chapter three — the third chapter.', note: 'three → third (drop the e, add d).' },
          { label: '4th', text: 'fourth', ipa: '/fɔːθ/', usage: 'It\'s my fourth coffee today.', note: 'four + th.' },
          { label: '5th', text: 'fifth', ipa: '/fɪfθ/', usage: 'On my fifth birthday.', note: 'five → fif + th (ve → f).' },
          { label: '6th', text: 'sixth', ipa: '/sɪksθ/', usage: 'The sixth sense.', note: 'Three consonants at the end /ksθ/ — glide through it.' },
          { label: '7th', text: 'seventh', ipa: '/ˈsev.ənθ/', usage: 'Seven days — the seventh day is Saturday.' },
          { label: '8th', text: 'eighth', ipa: '/eɪtθ/', usage: 'The Eighth Amendment.', note: 'eight + h (no extra t).' },
          { label: '9th', text: 'ninth', ipa: '/naɪnθ/', usage: 'Cloud nine — extremely happy.', note: 'Spelling trap: nine → ninth (DROP the e).' },
          { label: '10th', text: 'tenth', ipa: '/tenθ/', usage: 'The top ten — tenth time lucky!', note: 'ten + th.' },
          { label: '11th', text: 'eleventh', ipa: '/ɪˈlev.ənθ/', usage: 'Chapter eleven — the eleventh chapter.' },
          { label: '12th', text: 'twelfth', ipa: '/twelfθ/', usage: 'Twelfth Night (Shakespeare).', note: 'Spelling trap: twelve → twelfth (ve → f).' },
          { label: '13th', text: 'thirteenth', ipa: '/ˌθɜːˈtiːnθ/', usage: 'Friday the 13th.', note: 'teen + th.' },
          { label: '14th', text: 'fourteenth', ipa: '/ˌfɔːˈtiːnθ/', usage: 'Born on the 14th of March.' },
          { label: '15th', text: 'fifteenth', ipa: '/ˌfɪfˈtiːnθ/', usage: 'The 15th century began in 1401.', note: 'Century N = years (N−1)01 → N00.' },
          { label: '16th', text: 'sixteenth', ipa: '/ˌsɪksˈtiːnθ/', usage: 'In the 16th century, Shakespeare lived.' },
          { label: '17th', text: 'seventeenth', ipa: '/ˌsev.ənˈtiːnθ/', usage: 'The 17th parallel — history lesson.' },
          { label: '18th', text: 'eighteenth', ipa: '/ˌeɪˈtiːnθ/', usage: 'The 18th amendment gave women the vote (US, 1920).' },
          { label: '19th', text: 'nineteenth', ipa: '/ˌnaɪnˈtiːnθ/', usage: 'The nineteenth century = 1800s.' },
          { label: '20th', text: 'twentieth', ipa: '/ˈtwen.ti.əθ/', usage: 'The 20th century — the fastest-changing ever.', note: 'Spelling trap: ty → tieth (y → ie).' },
          { label: '21st', text: 'twenty-first', ipa: '/', usage: 'Her twenty-first birthday.', note: 'Complex numbers: only the LAST unit changes: 21st, 32nd, 53rd.' },
          { label: '22nd', text: 'twenty-second', ipa: '/', usage: 'The 22nd of April.', note: '-second keeps the nd ending.' },
          { label: '23rd', text: 'twenty-third', ipa: '/', usage: 'Room 23rd? No — room twenty-three.', note: 'Written 23rd, still read "twenty-third".' },
          { label: '24th', text: 'twenty-fourth', ipa: '/', usage: 'Christmas is the 24th–25th.' },
          { label: '25th', text: 'twenty-fifth', ipa: '/', usage: 'The 25th hour — too late already.', note: 'fifth, not "fiveth".' },
          { label: '30th', text: 'thirtieth', ipa: '/ˈθɜː.ti.əθ/', usage: 'At the thirtieth reunion.', note: 'ty → tieth: 30th, 40th, 50th, 60th...' },
          { label: '31st', text: 'thirty-first', ipa: '/', usage: 'The 31st of December.', note: 'The last day of most months.' },
          { label: '100th', text: 'one hundredth', ipa: '/', usage: 'The 100th episode!', note: 'hundred + th; 1000th = thousandth.' },
          { label: 'the + ordinal', text: 'the first, the second...', ipa: '/', usage: 'She was the first to arrive.', note: 'Ordinals usually take THE; written short: 1st, 2nd, 3rd, 4th.' },
          { label: 'ranking', text: 'in the third place', ipa: '/', usage: 'He finished in third place.', note: 'Rankings: first/second/third place.' },
          { label: 'penultimate', text: 'second to last', ipa: '/', usage: 'He was second to last in the race.', note: 'One before the end; UK: "the last but one".' },
          { label: 'first time', text: 'the first time I...', ipa: '/', usage: 'It was the first time I had flown.', note: 'the first/second time + clause.' },
          { label: 'rethinking', text: 'on second thoughts', ipa: '/', usage: 'On second thoughts, let\'s stay home.', note: 'UK: on second thoughts; US: on second thought — changing your mind.' },
          { label: 'lucky try', text: 'third time lucky!', ipa: '/', usage: 'Third time lucky — try again!', note: 'Idiom: the third attempt often succeeds.' }
        ]
      },
      {
        id: 'numbers-years',
        title: 'Years & Centuries',
        desc: 'Reading birth years, centuries and decades — the split-in-two rule and exceptions.',
        layout: 'list',
        items: [
          { label: '1999', text: 'nineteen ninety-nine', ipa: '/', usage: 'Born in 1999.', note: 'Split in two: 19 | 99 → nineteen + ninety-nine.' },
          { label: '1985', text: 'nineteen eighty-five', ipa: '/', usage: 'Stranger Things is set in 1985.', note: 'The general pattern for 1000–1999.' },
          { label: '2025', text: 'twenty twenty-five', ipa: '/', usage: 'What are your plans for 2025?', note: '2000–2099: 20 | 25 → twenty + twenty-five.' },
          { label: '2008', text: 'two thousand and eight', ipa: '/', usage: 'The Beijing Olympics were in 2008.', note: '2000–2009 are usually read "two thousand (and) X".' },
          { label: '2000', text: 'the year two thousand', ipa: '/', usage: 'We partied in the year 2000.', note: 'Round millennium years: two thousand.' },
          { label: '1905', text: 'nineteen oh five', ipa: '/', usage: 'He was born in nineteen oh five.', note: 'Empty tens → "oh": 1908 = nineteen oh eight.' },
          { label: '1800', text: 'eighteen hundred', ipa: '/', usage: 'The war ended in eighteen hundred.', note: 'Round centuries (1100–1900) can be read "X hundred".' },
          { label: '2400 BC', text: 'twenty-four hundred BC', ipa: '/', usage: 'Babylon, around 2400 BC.', note: 'BC = Before Christ (counted backwards); modern form: BCE.' },
          { label: 'AD 1066', text: 'ten sixty-six AD', ipa: '/', usage: 'The Normans conquered England in 1066.', note: 'AD = Anno Domini; modern neutral form: CE (Common Era).' },
          { label: 'the 1900s', text: 'the nineteen hundreds', ipa: '/', usage: 'Photos from the 1900s.', note: 'An era: read the whole "nineteen hundreds".' },
          { label: 'the 1960s', text: 'the sixties', ipa: '/', usage: 'Music of the sixties.', note: 'Decade: 1960s = the sixties; short form: the \'60s.' },
          { label: 'the 1920s', text: 'the Roaring Twenties', ipa: '/', usage: 'The Great Gatsby — the twenties.', note: 'Famous nickname: the Roaring Twenties.' },
          { label: 'the 2010s', text: 'the tens / the twenties?', ipa: '/', usage: 'The 2010s = the (twenty) tens.', note: 'New naming: "the teens", "the twenties" (2020s).' },
          { label: 'mid-1990s', text: 'the mid-nineties', ipa: '/', usage: 'He grew up in the mid-nineties.', note: 'Middle of a decade: mid-; start/end: early / late.' },
          { label: 'early 1900s', text: 'the early nineteen hundreds', ipa: '/', usage: 'Films of the early 1900s.', note: 'the 1900s = years 1900–1909 (or the whole century, by context).' },
          { label: 'turn', text: 'the turn of the century', ipa: '/', usage: 'The house dates from the turn of the century.', note: 'Around 1900/2000 — the century changeover.' },
          { label: 'in + year', text: 'in 2020', ipa: '/', usage: 'I graduated in 2020.', note: 'Preposition IN for years; ON for specific dates (on 2 May 2020).' },
          { label: 'range', text: 'from 1997 to 2003', ipa: '/', usage: 'He lived abroad from 1997 to 2003.', note: 'Or "between 1997 and 2003"; the dash – is read "to".' },
          { label: '1939–1945', text: 'nineteen thirty-nine to nineteen forty-five', ipa: '/', usage: 'World War II: 1939–1945.', note: 'Historical years are read in full on both sides.' },
          { label: 'round year', text: '1900 — nineteen hundred', ipa: '/', usage: 'The war ended in nineteen hundred.', note: 'Round hundreds: "X hundred" or "X oh-hundred".' },
          { label: 'the 1000s', text: 'the thousands?', ipa: '/', usage: 'Around the year 1000.', note: 'Thousand + s: "the thousands" = around year 1000.' },
          { label: '2000s name', text: 'the aughties / noughties', ipa: '/', usage: 'US: the aughties; UK: the noughties = 2000s.', note: 'Region-specific names for the 2000s decade.' },
          { label: 'age', text: 'in my thirties', ipa: '/', usage: 'She\'s in her early forties.', note: 'Age range: in one\'s thirties = between 30 and 39.' },
          { label: 'anniversary', text: 'the 50th anniversary', ipa: '/', usage: 'The school celebrated its 50th anniversary.', note: 'Anniversaries: ordinal + anniversary.' }
        ]
      },
      {
        id: 'numbers-calendar',
        title: 'Calendar',
        desc: 'Days of the week, months, dates, seasons and holidays.',
        layout: 'tabs',
        tabs: [
          {
            id: 'days', title: 'Days', items: [
              { label: 'Mon', text: 'Monday', ipa: '/ˈmʌn.deɪ/', usage: 'See you on Monday.', note: 'Always capitalized; preposition ON + day. "Monday week" = the Monday after next.' },
              { label: 'Tue', text: 'Tuesday', ipa: '/ˈtjuːz.deɪ/', usage: 'I have English on Tuesdays.', note: 'Add s (on Tuesdays) = every Tuesday.' },
              { label: 'Wed', text: 'Wednesday', ipa: '/ˈwenz.deɪ/', usage: 'Wednesday — the d is silent!', note: 'Pronounced "uenz-day" — don\'t spell it out.' },
              { label: 'Thu', text: 'Thursday', ipa: '/ˈθɜːz.deɪ/', usage: 'The meeting is on Thursday.', note: 'Starts with /θ/.' },
              { label: 'Fri', text: 'Friday', ipa: '/ˈfraɪ.deɪ/', usage: 'Thank God It\'s Friday (TGIF)!', note: 'The weekend is close — idiom TGIF.' },
              { label: 'Sat', text: 'Saturday', ipa: '/ˈsæt.ə.deɪ/', usage: 'Saturday morning market.', note: 'The weekend day off in most countries.' },
              { label: 'Sun', text: 'Sunday', ipa: '/ˈsʌn.deɪ/', usage: 'Sunday roast — a long lunch.', note: 'The Western week starts on Sunday.' },
              { label: 'weekend', text: 'the weekend', ipa: '/ˌwiːkˈend/', usage: 'What did you do at the weekend? (UK) / on the weekend? (US)', note: 'at (UK) / on (US) the weekend; weekday = a working day.' }
            ]
          },
          {
            id: 'months', title: 'Months', items: [
              { label: 'Jan', text: 'January', ipa: '/ˈdʒæn.ju.ər.i/', usage: 'New Year\'s Day is on 1 January.', note: 'Stress the first syllable: JAN-u-ary.' },
              { label: 'Feb', text: 'February', ipa: '/ˈfeb.ru.ər.i/', usage: 'February has 28 or 29 days.', note: 'Trap: many Americans skip a syllable — "feb-yoo-ary".' },
              { label: 'Mar', text: 'March', ipa: '/mɑːtʃ/', usage: 'Spring begins in March.', note: 'Sounds the same as to march (to walk in step).' },
              { label: 'Apr', text: 'April', ipa: '/ˈeɪ.prəl/', usage: 'April showers bring May flowers.', note: 'April Fools\' Day = 1/4.' },
              { label: 'May', text: 'May', ipa: '/meɪ/', usage: 'May I come in? — the month and the verb "may"', note: 'Capitalized = the month; lowercase = the modal verb.' },
              { label: 'Jun', text: 'June', ipa: '/dʒuːn/', usage: 'Wedding season — June.', note: 'Same sound as the name June.' },
              { label: 'Jul', text: 'July', ipa: '/dʒuˈlaɪ/', usage: 'Independence Day is 4 July.', note: 'Stress the second syllable: ju-LY.' },
              { label: 'Aug', text: 'August', ipa: '/ˈɔː.ɡəst/', usage: 'August is the hottest month.', note: 'The adjective august (majestic) is rare.' },
              { label: 'Sep', text: 'September', ipa: '/sepˈtem.bər/', usage: 'School starts in September.', note: 'The root sept- = seven (old Roman calendar).' },
              { label: 'Oct', text: 'October', ipa: '/ɒkˈtəʊ.bər/', usage: 'Halloween is on 31 October.', note: 'oct- = eight.' },
              { label: 'Nov', text: 'November', ipa: '/nəʊˈvem.bər/', usage: 'Black Friday is in November.', note: 'nov- = nine.' },
              { label: 'Dec', text: 'December', ipa: '/dɪˈsem.bər/', usage: 'Christmas is in December.', note: 'dec- = ten; the year ends here.' }
            ]
          },
          {
            id: 'dates', title: 'Dates', items: [
              { label: '1/5', text: 'May the first', ipa: '/', usage: 'UK: 1 May — US: May 1.', note: 'British: day before month; American: month before day.' },
              { label: '5/6', text: 'the fifth of June', ipa: '/', usage: 'UK 5/6 = 5 June; US 5/6 = June 5!', note: 'WARNING: 5/6 means different dates in the UK and the US.' },
              { label: 'reading', text: 'the first of May', ipa: '/', usage: 'My birthday is on the first of May.', note: 'Written "1 May", read "the first of May".' },
              { label: 'day date', text: 'the 21st', ipa: '/', usage: 'It\'s the twenty-first today.', note: 'Ask: What\'s the date? — never "What day is the date?".' },
              { label: 'weekday', text: 'What day is it today?', ipa: '/', usage: '— What day is it? — It\'s Friday.', note: 'What day = the weekday; What\'s the date = the number.' },
              { label: 'full form', text: 'on 6 May 2024', ipa: '/', usage: 'The wedding is on 6 May 2024.', note: 'Read: "on the sixth of May, twenty twenty-four".' },
              { label: 'in + month', text: 'in July', ipa: '/', usage: 'We\'re going to Da Lat in July.', note: 'IN for months/years/seasons; ON for days; AT for clock times.' },
              { label: 'start/end', text: 'at the beginning of June', ipa: '/', usage: 'At the end of the month.', note: 'at the beginning/end of; in the middle of.' },
              { label: 'ISO', text: '2024-05-06', ipa: '/', usage: 'ISO format: year-month-day.', note: 'The international standard YYYY-MM-DD — no UK/US confusion.' },
              { label: '4/7', text: 'the Fourth of July', ipa: '/', usage: 'US Independence Day.', note: 'American holidays read as "the Fourth of July".' },
              { label: 'legal', text: 'this 6th day of May', ipa: '/', usage: 'Contract: on this 6th day of May.', note: 'Formal/legal style: "on this Xth day of Month, Year".' },
              { label: 'birthday', text: 'When is your birthday?', ipa: '/', usage: 'My birthday is on 3 March.', note: 'ON + date; short answer: "In March".' }
            ]
          },
          {
            id: 'seasons', title: 'Seasons', items: [
              { label: 'spring', text: 'spring', ipa: '/sprɪŋ/', usage: 'Flowers bloom in spring.', note: 'UK: March–May.' },
              { label: 'summer', text: 'summer', ipa: '/ˈsʌm.ər/', usage: 'Summer holidays last three months.', note: 'summer camp, summer break.' },
              { label: 'autumn', text: 'autumn / fall', ipa: '/ˈɔː.təm / fɔːl/', usage: 'Leaves change colour in autumn (UK) / fall (US).', note: 'British: autumn; American: fall.' },
              { label: 'winter', text: 'winter', ipa: '/ˈwɪn.tər/', usage: 'It snows in winter.', note: 'winter solstice = the shortest day.' },
              { label: 'rainy', text: 'the rainy season', ipa: '/', usage: 'Vietnam has two seasons: rainy and dry.', note: 'Tropical countries use rainy/dry instead of four seasons.' },
              { label: 'peak', text: 'high season', ipa: '/', usage: 'Book early — it\'s high season.', note: 'Travel: high/low (off) season.' }
            ]
          },
          {
            id: 'holidays', title: 'Holidays', items: [
              { label: '1 Jan', text: "New Year's Day", ipa: '/', usage: 'We watch fireworks on New Year\'s Eve.', note: 'Eve = the night before (31 Dec).' },
              { label: '14 Feb', text: "Valentine's Day", ipa: '/', usage: 'Roses on Valentine\'s Day.', note: 'The day of love and cards.' },
              { label: '1 Apr', text: "April Fools' Day", ipa: '/', usage: 'Gotcha — it\'s April Fools\'!', note: 'Harmless pranks until midday.' },
              { label: 'spring', text: 'Easter', ipa: '/ˈiː.stər/', usage: 'Easter eggs and the Easter Bunny.', note: 'The spring festival; Easter Monday is a day off in many countries.' },
              { label: 'May', text: "Mother's Day", ipa: '/', usage: 'I bought flowers for Mother\'s Day.', note: 'US: second Sunday of May; UK: March.' },
              { label: 'Jun', text: "Father's Day", ipa: '/', usage: 'Third Sunday of June — Father\'s Day.', note: 'The pair of Mother\'s Day.' },
              { label: '31 Oct', text: 'Halloween', ipa: '/ˌhæl.əˈwiːn/', usage: 'Trick or treat! — Halloween night.', note: 'The night before All Saints\' Day.' },
              { label: '25 Dec', text: 'Christmas', ipa: '/ˈkrɪs.məs/', usage: 'Merry Christmas! — Christmas Day.', note: 'Christmas Eve = 24 Dec; say "Have a Merry Christmas".' },
              { label: 'Nov', text: 'Thanksgiving', ipa: '/ˌθæŋksˈɡɪv.ɪŋ/', usage: 'Turkey on Thanksgiving (US, 4th Thursday of November).', note: 'The harvest-feast holiday — very US/Canada.' },
              { label: '4 Jul', text: 'Independence Day', ipa: '/', usage: 'Fireworks on the Fourth of July.', note: 'US national day = 4 July.' },
              { label: 'day off', text: 'a public holiday', ipa: '/', usage: 'Monday is a public holiday in the UK.', note: 'UK: public/bank holiday; US: federal holiday, day off.' }
            ]
          },
          {
            id: 'units', title: 'Units of time', items: [
              { label: '7 days', text: 'a week', ipa: '/wiːk/', usage: 'I swim twice a week.', note: 'weekly = every week.' },
              { label: '14 days', text: 'a fortnight', ipa: '/ˈfɔːt.naɪt/', usage: 'We stayed for a fortnight. (UK)', note: 'fourteen nights → fortnight; mostly British.' },
              { label: '4 weeks', text: 'a month', ipa: '/mʌnθ/', usage: 'Once a month.', note: 'monthly = every month.' },
              { label: '3 months', text: 'a quarter', ipa: '/ˈkwɔː.tər/', usage: 'Paid quarterly — every quarter.', note: 'A quarter of a year; "quarter final" too.' },
              { label: '12 months', text: 'a year', ipa: '/jɪər/', usage: 'yearly / annually = every year.', note: 'anniversary = the yearly return of a date.' },
              { label: '10 years', text: 'a decade', ipa: '/ˈdek.eɪd/', usage: 'The past decade has changed everything.', note: 'the next decade = the coming ten years.' },
              { label: '100 years', text: 'a century', ipa: '/ˈsen.tʃər.i/', usage: 'A century ago, in 1925...', note: 'centenary/centennial = the 100-year celebration.' },
              { label: '366 days', text: 'a leap year', ipa: '/ˈliːp jɪər/', usage: '29 February comes in a leap year.', note: 'A "leap year baby" is born on 29 Feb.' }
            ]
          }
        ]
      },
      {
        id: 'numbers-time',
        title: 'Time',
        desc: 'Nine ways to talk about clock time, duration, frequency, age and schedules.',
        layout: 'tabs',
        tabs: [
          {
            id: 'oclock', title: 'O\'clock & minutes', items: [
              { label: ':00', text: 'three o\'clock', ipa: '/əˈklɒk/', usage: 'It\'s three o\'clock sharp.', note: 'Only for exact hours; never "four thirty o\'clock".' },
              { label: ':30', text: 'half past six', ipa: '/', usage: 'It\'s half past six.', note: 'UK: half past; US: "six thirty".' },
              { label: ':15', text: 'quarter past nine', ipa: '/', usage: 'The lesson starts at quarter past nine.', note: 'A quarter = 15 minutes.' },
              { label: ':45', text: 'quarter to five', ipa: '/', usage: 'It\'s quarter to five — 4:45.', note: 'to = "before"; 4:45 = quarter to five.' },
              { label: ':05–:10', text: 'ten past two', ipa: '/', usage: '2:10 = ten past two.', note: 'Minutes ≤ 30 use PAST (UK) or just read the digits.' },
              { label: ':35–:55', text: 'twenty to eight', ipa: '/', usage: '7:40 = twenty to eight.', note: 'Minutes > 30 use TO (minutes before the next hour).' },
              { label: '12:00 day', text: 'noon / midday', ipa: '/nuːn/', usage: 'Let\'s meet at noon.', note: 'at noon, never "in noon".' },
              { label: '12:00 night', text: 'midnight', ipa: '/ˈmɪd.naɪt/', usage: 'The show ends at midnight.', note: 'at midnight; "midnight snack".' }
            ]
          },
          {
            id: 'digital', title: 'Digital time', items: [
              { label: '07:05', text: 'seven oh five', ipa: '/', usage: 'My flight is at seven oh five.', note: 'Leading-zero minutes → "oh": seven oh five.' },
              { label: '13:45', text: 'thirteen forty-five', ipa: '/', usage: 'The 24h clock: thirteen forty-five.', note: 'On the 24-hour clock, read both numbers straight.' },
              { label: '09:00', text: 'nine hundred hours', ipa: '/', usage: 'Military: 0900 = nine hundred hours.', note: 'Military/aviation adds "hours".' },
              { label: '12:15', text: 'twelve fifteen', ipa: '/', usage: 'Noon-ish: twelve fifteen.', note: '12 reads as "twelve", never "zero twelve".' },
              { label: '06:59', text: 'five to seven', ipa: '/', usage: 'Almost seven — five to seven.', note: 'Near the hour: use "to".' },
              { label: '18:20', text: 'six twenty in the evening', ipa: '/', usage: '6:20 p.m. = six twenty in the evening.', note: 'Convert 24h → 12h + part of day.' },
              { label: '23:59', text: 'eleven fifty-nine p.m.', ipa: '/', usage: 'Deadline: 23:59 tonight.', note: '11:59 p.m. — the last minute of the day.' },
              { label: '00:30', text: 'twelve thirty a.m.', ipa: '/', usage: 'The bar closes at twelve thirty a.m.', note: 'After midnight it is a.m., not p.m.!' }
            ]
          },
          {
            id: 'ampm', title: 'AM / PM & times of day', items: [
              { label: 'a.m.', text: 'in the morning', ipa: '/eɪ.em/', usage: 'I get up at six in the morning.', note: 'Latin: ante meridiem — before midday.' },
              { label: 'p.m.', text: 'in the afternoon', ipa: '/piː.em/', usage: 'The class is at three in the afternoon.', note: 'post meridiem; afternoon = 12:00–about 17:00.' },
              { label: 'evening', text: 'in the evening', ipa: '/', usage: 'We watch TV in the evening.', note: 'evening ≈ 17:00–22:00; AT NIGHT for late.' },
              { label: 'night', text: 'at night', ipa: '/', usage: 'It\'s cold at night here.', note: 'Preposition AT with night (not in).' },
              { label: 'dawn', text: 'at dawn / daybreak', ipa: '/dɔːn/', usage: 'The fishermen leave at dawn.', note: 'dawn = sunrise; dusk = twilight.' },
              { label: 'overnight', text: 'overnight', ipa: '/ˌəʊ.vəˈnaɪt/', usage: 'The price doubled overnight.', note: 'During the night; also figurative "very fast".' },
              { label: 'dusk', text: 'at dusk', ipa: '/dʌsk/', usage: 'The temple looks best at dusk.', note: 'dawn → dusk = from sunrise to sunset.' },
              { label: 'all day', text: 'all day', ipa: '/', usage: 'I\'ve been waiting all day.', note: 'all day / all morning / all week (no "the").' }
            ]
          },
          {
            id: 'duration', title: 'Duration', items: [
              { label: 'for', text: 'for two hours', ipa: '/', usage: 'I studied English for two hours.', note: 'FOR + length; SINCE + starting point.' },
              { label: 'since', text: 'since 2019', ipa: '/', usage: 'She\'s lived here since 2019.', note: 'since + point in time; used with perfect tenses.' },
              { label: 'from...to', text: 'from Monday to Friday', ipa: '/', usage: 'Open from 9 to 5.', note: 'US: Monday through Friday.' },
              { label: '30 min', text: 'half an hour', ipa: '/', usage: 'It\'s only half an hour by bus.', note: 'US: a half hour; "half an hour\'s drive".' },
              { label: '15 min', text: 'a quarter of an hour', ipa: '/', usage: 'Give me a quarter of an hour.', note: 'Less common than "fifteen minutes".' },
              { label: 'walking', text: 'twenty minutes\' walk', ipa: '/', usage: 'It\'s a twenty-minute walk.', note: 'Plural possessive: minutes\' walk; compound adjective: twenty-minute.' },
              { label: 'whole', text: 'the whole week', ipa: '/', usage: 'I worked the whole weekend.', note: 'whole = entire; "all week" also works.' },
              { label: 'takes', text: 'It takes 30 minutes.', ipa: '/', usage: 'How long does it take to get there?', note: 'It takes + (person) + time.' }
            ]
          },
          {
            id: 'frequency', title: 'Frequency', items: [
              { label: '1/week', text: 'once a week', ipa: '/', usage: 'I go swimming once a week.', note: 'ONCE (1), TWICE (2), then three times a...' },
              { label: '2/day', text: 'twice a day', ipa: '/', usage: 'Take the pills twice a day.', note: 'twice = two times (more natural).' },
              { label: '3/month', text: 'three times a month', ipa: '/', usage: 'We meet three times a month.', note: 'From 3 up: N times + a + unit.' },
              { label: 'alternate', text: 'every other day', ipa: '/', usage: 'I wash my hair every other day.', note: 'every other + unit = alternating.' },
              { label: 'seldom', text: 'once in a while', ipa: '/', usage: 'I eat fast food once in a while.', note: 'Occasionally; = now and then.' },
              { label: 'sometimes', text: 'from time to time', ipa: '/', usage: 'We still meet from time to time.', note: 'Same family; hardly ever = almost never.' },
              { label: 'always', text: 'all the time', ipa: '/', usage: 'He\'s on his phone all the time.', note: 'Continuously; constantly, nonstop.' },
              { label: 'daily', text: 'daily', ipa: '/', usage: 'A daily routine.', note: 'Adverb/adjective: daily, weekly, monthly, yearly.' }
            ]
          },
          {
            id: 'age', title: 'Age', items: [
              { label: '25', text: "I'm 25 years old.", ipa: '/', usage: 'How old are you? — I\'m twenty-five.', note: 'TO BE + number; "years old" can be dropped.' },
              { label: '30s', text: 'in my thirties', ipa: '/', usage: 'My dad is in his fifties.', note: 'in one\'s + plural ordinal = between 30 and 39, etc.' },
              { label: 'at 10', text: 'at the age of ten', ipa: '/', usage: 'She moved abroad at the age of ten.', note: '"when I was ten" also works.' },
              { label: '2yo', text: 'a two-year-old child', ipa: '/', usage: 'A two-year-old can run already.', note: 'Hyphenated compound, NO plural s: two-year-old.' },
              { label: '18+', text: 'over 18', ipa: '/', usage: 'You must be over 18 to enter.', note: 'over = older than; under = younger.' },
              { label: '<5', text: 'under five', ipa: '/', usage: 'Kids under five go free.', note: 'Common on tickets: under 5 free.' },
              { label: '3.5', text: 'three and a half years old', ipa: '/', usage: 'My son is three and a half.', note: 'Half ages: and a half.' },
              { label: '40-60', text: 'middle-aged', ipa: '/', usage: 'A middle-aged man in a suit.', note: 'About 45–65; elderly is politer than old.' }
            ]
          },
          {
            id: 'schedule', title: 'Schedule', items: [
              { label: 'timetable', text: 'The train leaves at six.', ipa: '/', usage: 'Present simple for timetables.', note: 'Fixed schedules use the PRESENT SIMPLE even for the future.' },
              { label: 'opening', text: 'open from 9 to 5', ipa: '/', usage: 'We\'re open from 9 to 5, Monday to Friday.', note: 'Closed on Sundays; 24/7 = all day and night.' },
              { label: 'deadline', text: 'due on Monday', ipa: '/', usage: 'The essay is due next Monday.', note: 'due = the deadline is then.' },
              { label: 'future gap', text: 'in five minutes', ipa: '/', usage: 'I\'ll be back in five minutes.', note: 'in + length = "five minutes from now" (future).' },
              { label: 'past gap', text: 'ten minutes ago', ipa: '/', usage: 'The bus left ten minutes ago.', note: 'ago takes the PAST tense.' },
              { label: 'latest', text: 'by 3 p.m.', ipa: '/', usage: 'Finish the report by three.', note: 'by = no later than; until = the whole way to.' },
              { label: 'approx', text: 'around noon', ipa: '/', usage: 'Call me around noon / about three.', note: 'around/about = approximately.' },
              { label: 'exact', text: 'at eight sharp', ipa: '/', usage: 'Be here at eight o\'clock sharp!', note: 'sharp = exactly; on time ≠ in time.' }
            ]
          },
          {
            id: 'eras', title: 'Decades & eras', items: [
              { label: '10y', text: 'a decade', ipa: '/ˈdek.eɪd/', usage: 'A decade of change.', note: 'the next decade = the coming ten years.' },
              { label: '100y', text: 'a century', ipa: '/ˈsen.tʃər.i/', usage: 'It has been a century since 1925.', note: 'Centuries start at year 1 (the 21st century: 2001).' },
              { label: '2000s', text: 'the noughties', ipa: '/', usage: 'The noughties = 2000–2009.', note: 'UK name for the 2000s decade.' },
              { label: '1920s', text: 'the Roaring Twenties', ipa: '/', usage: 'Jazz age — the twenties.', note: 'The booming 1920s between the wars.' },
              { label: 'BC', text: 'BC', ipa: '/ˌbiːˈsiː/', usage: 'Confucius lived in 500 BC.', note: 'Before Christ; years count DOWN (500 BC is older than 200 BC).' },
              { label: 'AD', text: 'AD', ipa: '/ˌeɪˈdiː/', usage: 'The temple was built in AD 100.', note: 'Anno Domini; written BEFORE the year: AD 1066.' },
              { label: 'BCE/CE', text: 'BCE / CE', ipa: '/', usage: 'Scholars now write 500 BCE, 2025 CE.', note: 'Religion-neutral: Before Common Era / Common Era.' },
              { label: '1000y', text: 'a millennium', ipa: '/mɪˈlen.i.əm/', usage: 'The millennium celebrations in 2000.', note: 'A thousand years.' }
            ]
          },
          {
            id: 'idioms', title: 'Time idioms', items: [
              { label: '24/7', text: 'around the clock', ipa: '/', usage: 'Doctors worked around the clock.', note: 'All day and night; UK: "round the clock".' },
              { label: 'fast', text: 'in no time', ipa: '/', usage: 'We\'ll be there in no time.', note: 'Very soon; = right away.' },
              { label: 'rarely', text: 'once in a blue moon', ipa: '/', usage: 'He cooks once in a blue moon.', note: 'Extremely rarely; a blue moon = a rare second full moon.' },
              { label: 'just in time', text: 'in the nick of time', ipa: '/', usage: 'The ambulance arrived in the nick of time.', note: 'With seconds to spare.' },
              { label: 'rushing', text: 'against the clock', ipa: '/', usage: 'It\'s a race against the clock.', note: 'Racing to finish before time runs out.' },
              { label: 'outdated', text: 'behind the times', ipa: '/', usage: 'This software is behind the times.', note: 'Old-fashioned; the opposite: with the times.' },
              { label: 'last moment', text: 'at the last minute', ipa: '/', usage: 'He changed his mind at the last minute.', note: 'Right before the deadline; "a last-minute change".' },
              { label: 'overdue', text: 'It\'s high time we left.', ipa: '/', usage: 'It\'s about time you apologized.', note: 'high/about time + PAST tense = it should have happened already.' }
            ]
          }
        ]
      },
      {
        id: 'numbers-money',
        title: 'Money',
        desc: 'Currencies, reading prices, coins and notes, talking about spending.',
        layout: 'tabs',
        tabs: [
          {
            id: 'currencies', title: 'Currencies', items: [
              { label: '$', text: 'dollar', ipa: '/ˈdɒl.ər/', usage: 'US dollar, Australian dollar.', note: 'Many countries use the dollar: US, Australia, Canada, Singapore.' },
              { label: '€', text: 'euro', ipa: '/ˈjʊə.rəʊ/', usage: 'The euro is used in 20 EU countries.', note: 'British English: "YUR-oh".' },
              { label: '£', text: 'pound sterling', ipa: '/paʊnd/', usage: 'Ten pounds, please.', note: '£10 = "ten pounds"; the currency of the UK.' },
              { label: '¥', text: 'yen', ipa: '/jen/', usage: 'One thousand yen.', note: 'Japan; everyday amounts have no decimals.' },
              { label: '₩', text: 'won', ipa: '/wɒn/', usage: 'Ten thousand won.', note: 'South Korea; sounds like "one" — say it slowly.' },
              { label: '฿', text: 'baht', ipa: '/bɑːt/', usage: 'Two hundred baht.', note: 'Thailand; the h is silent: "baht".' },
              { label: '₹', text: 'rupee', ipa: '/ruːˈpiː/', usage: 'Fifty rupees.', note: 'India, Pakistan, Nepal...' },
              { label: '₫', text: 'dong', ipa: '/dɒŋ/', usage: 'Vietnamese dong: one hundred thousand dong.', note: 'Vietnam; big numbers, small value.' },
              { label: 'CHF', text: 'Swiss franc', ipa: '/fræŋk/', usage: 'A hundred Swiss francs.', note: 'Switzerland; the franc is also used in some African countries.' },
              { label: 'RMB', text: 'yuan', ipa: '/juːˈɑːn/', usage: 'Three hundred yuan.', note: 'China; "kuai" is the slang word for the yuan.' },
              { label: 'AUD', text: 'Aussie dollar', ipa: '/', usage: 'Two hundred Aussie dollars.', note: 'Australia; "Aussie" = Australian (things and people).' },
              { label: 'rate', text: 'the exchange rate', ipa: '/', usage: 'What\'s the exchange rate today?', note: 'exchange rate = the price of one currency in another; currency = money system.' }
            ]
          },
          {
            id: 'prices', title: 'Prices', items: [
              { label: '$4.99', text: 'four ninety-nine', ipa: '/', usage: 'It\'s four ninety-nine.', note: 'In speech people drop "dollars": four ninety-nine.' },
              { label: '$4.99 full', text: 'four dollars and ninety-nine cents', ipa: '/', usage: 'Four dollars and ninety-nine cents.', note: 'Full form: dollars + and + cents.' },
              { label: '£10.50', text: 'ten pounds fifty', ipa: '/', usage: 'Ten pounds fifty pence.', note: 'UK: pounds + pence; casually "ten fifty".' },
              { label: '$0.50', text: 'fifty cents', ipa: '/', usage: 'A fifty-cent coin.', note: 'Under one dollar: cents only.' },
              { label: '€2,000', text: 'two thousand euros', ipa: '/', usage: 'The flight cost two thousand euros.', note: 'Big number + currency name.' },
              { label: 'asking', text: 'How much is it?', ipa: '/', usage: 'How much does it cost?', note: 'How much is + thing; How much does + cost.' },
              { label: 'answering', text: 'It\'s twenty dollars.', ipa: '/', usage: 'It costs twenty dollars. / That\'s twenty dollars.', note: 'It\'s / It costs / That\'s.' },
              { label: 'expensive', text: 'It\'s expensive.', ipa: '/ɪkˈspen.sɪv/', usage: 'It costs an arm and a leg!', note: 'Idiom for very expensive: "an arm and a leg".' },
              { label: 'cheap', text: 'It\'s a bargain.', ipa: '/ˈbɑː.ɡɪn/', usage: 'Only five euros — what a bargain!', note: 'bargain = a great deal; cheap can sound negative.' },
              { label: 'discount', text: '20% off', ipa: '/', usage: 'Everything is 20% off.', note: 'off = reduced; "buy one get one free" = BOGO.' },
              { label: 'receipt', text: 'Can I have a receipt?', ipa: '/rɪˈsiːt/', usage: 'Keep the receipt for returns.', note: 'The p in receipt is silent.' },
              { label: 'cash', text: 'cash or card?', ipa: '/', usage: 'I\'ll pay in cash / by card.', note: 'pay IN cash, BY card; "contactless" = tap to pay.' }
            ]
          },
          {
            id: 'coins', title: 'Coins', items: [
              { label: '1¢', text: 'a penny', ipa: '/ˈpen.i/', usage: 'US: one cent = a penny.', note: 'US: penny = 1 cent; UK: penny = 1p (plural pence).' },
              { label: '5¢', text: 'a nickel', ipa: '/ˈnɪk.əl/', usage: 'US: five cents = a nickel.', note: 'US/Canada only.' },
              { label: '10¢', text: 'a dime', ipa: '/daɪm/', usage: 'US: ten cents = a dime.', note: 'Idiom: "penny-wise and pound-foolish" (UK).' },
              { label: '25¢', text: 'a quarter', ipa: '/ˈkwɔː.tər/', usage: 'US: twenty-five cents = a quarter.', note: 'Very common; old slang "two bits" = 25¢.' },
              { label: '1p', text: 'a penny (UK)', ipa: '/', usage: 'UK: two pence pieces.', note: 'UK coins: 1p, 2p, 5p, 10p, 20p, 50p, £1, £2.' },
              { label: '50p', text: 'fifty pence', ipa: '/pens/', usage: 'UK: a fifty-pence piece.', note: 'pence = plural of penny; written short: 50p.' },
              { label: 'loose', text: 'small change', ipa: '/', usage: 'Do you have any small change?', note: 'change = coins left over; "keep the change".' },
              { label: 'mint', text: 'to mint a coin', ipa: '/mɪnt/', usage: 'The Royal Mint makes UK coins.', note: 'mint = the official coin factory.' }
            ]
          },
          {
            id: 'notes', title: 'Banknotes', items: [
              { label: '$5', text: 'a five-dollar bill', ipa: '/', usage: 'US: a five, a ten, a twenty.', note: 'US paper money = BILL; casually just "a twenty".' },
              { label: '£5', text: 'a fiver', ipa: '/ˈfaɪ.vər/', usage: 'UK slang: a fiver = a five-pound note.', note: 'fiver (5), tenner (10) — informal.' },
              { label: '£10', text: 'a tenner', ipa: '/ˈten.ər/', usage: 'Can I borrow a tenner?', note: 'UK/Australia.' },
              { label: '£20', text: 'a twenty-pound note', ipa: '/', usage: 'Pay with a twenty.', note: 'note = paper money (UK); bill (US).' },
              { label: '$100', text: 'a hundred-dollar bill', ipa: '/', usage: 'US slang: a Benjamin, a C-note.', note: 'US $100 bills print Franklin\'s face.' },
              { label: 'withdraw', text: 'to withdraw money', ipa: '/', usage: 'I withdrew cash from the ATM.', note: 'ATM = cashpoint (UK); deposit = the opposite.' }
            ]
          },
          {
            id: 'spending', title: 'Spending', items: [
              { label: 'afford', text: 'I can\'t afford it.', ipa: '/əˈfɔːd/', usage: 'I\'d love to go but I can\'t afford it.', note: 'afford = have enough money (usually with can/could).' },
              { label: 'saving', text: 'to save up', ipa: '/', usage: 'I\'m saving up for a new laptop.', note: 'save up for = keep money to buy something.' },
              { label: 'spend', text: 'to spend money on', ipa: '/', usage: 'He spends too much on games.', note: 'spend + money + ON + noun/V-ing.' },
              { label: 'budget', text: 'over budget', ipa: '/', usage: 'The project is over budget.', note: 'within budget = inside the money plan.' },
              { label: 'sharing', text: 'to split the bill', ipa: '/', usage: 'Shall we go Dutch?', note: 'go Dutch = everyone pays their own share.' },
              { label: 'poorly', text: 'on a shoestring', ipa: '/', usage: 'They run the café on a shoestring.', note: 'With very little money; "live from hand to mouth" = barely enough.' }
            ]
          }
        ]
      },
      {
        id: 'numbers-phone',
        title: 'Phone Numbers',
        desc: 'Reading phone numbers, area codes, extensions and the "oh" / "double" conventions.',
        layout: 'list',
        items: [
          { label: 'digits', text: '0912 345 678', ipa: '/', usage: 'oh nine one two, three four five, six seven eight.', note: 'Phone numbers are read ONE DIGIT AT A TIME, never "nine hundred..."' },
          { label: '0', text: 'oh / zero', ipa: '/əʊ/', usage: 'My number starts with oh-nine.', note: '0 is usually "oh" for speed; "zero" is clearer/formal.' },
          { label: '00', text: 'double oh', ipa: '/', usage: 'The international prefix is double oh.', note: '00 = double oh; three alike = triple.' },
          { label: '+84', text: '+84 — country code', ipa: '/', usage: 'Dial plus eight four for Vietnam.', note: 'Country codes: +84 VN, +1 US, +44 UK, +81 Japan.' },
          { label: 'ext.', text: 'extension two-oh-three', ipa: '/ɪkˈsten.ʃən/', usage: 'Call 555-0100 and ask for extension 203.', note: 'extension = the internal office number.' },
          { label: 'area', text: 'area code', ipa: '/', usage: 'The area code for Hanoi is 24.', note: 'US: the first three digits (212, 310).' },
          { label: 'dial', text: 'to dial a number', ipa: '/ˈdaɪ.əl/', usage: 'Dial nine to get an outside line.', note: 'dial = to key the number; "wrong number" = misdialled.' },
          { label: 'busy', text: 'The line is busy.', ipa: '/', usage: 'It\'s engaged in the UK.', note: 'US: busy; UK: engaged.' },
          { label: 'mistake', text: 'You\'ve got the wrong number.', ipa: '/', usage: 'Sorry, wrong number!', note: 'Apologise and hang up: "Sorry, I must have misdialed."' },
          { label: 'return', text: 'to ring back / call back', ipa: '/', usage: 'I\'ll ring you back in five minutes.', note: 'UK: ring; US: call; casual: "hit me up".' },
          { label: 'free', text: 'a toll-free number', ipa: '/', usage: 'Call 1-800-FLOWERS.', note: '1-800 numbers cost nothing; letters are spelled out: "F as in Frank"...' },
          { label: 'emergency', text: '911 / 112 / 113 / 114 / 115', ipa: '/', usage: 'In the US, dial nine-one-one.', note: 'US 911; EU 112; VN: 113 police, 114 fire, 115 ambulance, 112 general.' },
          { label: 'directory', text: 'directory enquiries', ipa: '/', usage: 'UK: dial 118 118 for the number.', note: 'The service for looking up numbers; US: 411.' },
          { label: 'mobile', text: 'mobile / cell phone', ipa: '/', usage: 'What\'s your mobile number?', note: 'UK: mobile; US: cell (phone).' },
          { label: 'fixed', text: 'landline', ipa: '/', usage: 'Do you have a landline at home?', note: 'A fixed home phone.' },
          { label: 'answering', text: 'Who\'s calling, please?', ipa: '/', usage: 'This is Mai speaking.', note: 'On the phone say "This is...", not "I am..."' },
          { label: 'message', text: 'Can I leave a message?', ipa: '/', usage: 'Take a message — I\'ll call you back.', note: 'voicemail = the answering machine.' },
          { label: 'repeat', text: 'What\'s my number again?', ipa: '/', usage: 'Could you repeat that, please?', note: 'Rising "again?" = asking someone to repeat.' },
          { label: '* #', text: 'star and hash', ipa: '/', usage: 'Press star, then one, then hash.', note: '* = star; # = hash/pound (US) — keypad symbols.' },
          { label: 'voicemail', text: 'Hi, this is Nam. Leave a message after the beep.', ipa: '/', usage: 'Voicemail greeting.', note: 'beep = the tone that starts recording.' },
          { label: 'signal', text: 'The signal is bad here.', ipa: '/', usage: 'I\'m losing signal — can you hear me?', note: 'Weak line: "I can\'t hear you" / "You\'re breaking up".' },
          { label: 'hang up', text: 'to hang up', ipa: '/', usage: 'He hung up on me!', note: 'To end a call; "hang up on someone" = end it rudely.' }
        ]
      },
      {
        id: 'numbers-decimal',
        title: 'Decimals & Percentages',
        desc: 'Decimal numbers and percentages: reading, rounding and expressing ratios.',
        layout: 'list',
        items: [
          { label: '0.5', text: 'nought point five', ipa: '/', usage: 'US: zero point five.', note: 'British: "nought" /nɔːt/; American: "zero"; read decimals digit by digit.' },
          { label: '3.14', text: 'three point one four', ipa: '/', usage: 'Pi is three point one four.', note: 'Never read it as "three point fourteen".' },
          { label: '0.01', text: 'zero point zero one', ipa: '/', usage: 'Just one hundredth.', note: 'Each digit after the point is read separately.' },
          { label: '12.75', text: 'twelve point seven five', ipa: '/', usage: 'The score was twelve point seven five.', note: 'Money is different: "twelve seventy-five".' },
          { label: '2 d.p.', text: 'two decimal places', ipa: '/', usage: 'Round it to two decimal places.', note: 'place = one digit after the point.' },
          { label: 'rounding', text: 'round up', ipa: '/', usage: 'Round 3.6 up to four.', note: 'round down = the opposite direction.' },
          { label: '~', text: 'approximately', ipa: '/əˈprɒk.sɪ.meɪt.li/', usage: 'Approximately 3.5 million — about three and a half million.', note: 'approx., roughly, around.' },
          { label: '50%', text: 'fifty per cent', ipa: '/', usage: 'Fifty per cent of students.', note: 'UK: "per cent" (two words); US: "percent" (one).' },
          { label: '0.5%', text: 'zero point five per cent', ipa: '/', usage: 'A rate of 0.5%.', note: 'Read the decimal, then per cent.' },
          { label: '12.5%', text: 'twelve and a half per cent', ipa: '/', usage: 'Interest rose twelve and a half per cent.', note: 'Fractions work too: "an eighth".' },
          { label: '100%', text: 'one hundred per cent', ipa: '/', usage: 'One hundred per cent sure!', note: 'The whole amount = all / the whole of.' },
          { label: '25%', text: 'a quarter', ipa: '/', usage: 'A quarter of the class failed.', note: '25% = a quarter; 75% = three quarters.' },
          { label: '33%', text: 'a third', ipa: '/', usage: 'About a third said yes.', note: '66% = two thirds.' },
          { label: 'increase', text: 'up by 20%', ipa: '/', usage: 'Prices are up by twenty per cent.', note: 'up/down + by + %; "rose by", "fell by".' },
          { label: 'decrease', text: 'down 5%', ipa: '/', usage: 'Sales were down five per cent.', note: 'a five per cent drop = a fall of 5%.' },
          { label: '×2', text: 'double', ipa: '/', usage: 'The number doubled in ten years.', note: 'double, triple; "twice as big as".' },
          { label: '×3', text: 'three times more than', ipa: '/', usage: 'It costs three times as much.', note: 'N times as + adjective.' },
          { label: 'ratio', text: 'the ratio of 3 to 1', ipa: '/', usage: 'A ratio of three to one.', note: '3:1 is read "three to one".' },
          { label: '1/10', text: 'one in ten', ipa: '/', usage: 'One in ten people are left-handed.', note: 'Statistics pattern: one in N.' },
          { label: 'proportion', text: 'proportional to', ipa: '/', usage: 'Pay is proportional to effort.', note: 'inversely proportional = the opposite relationship.' },
          { label: 'GPA', text: 'a GPA of three point five', ipa: '/', usage: 'She graduated with a 3.5 GPA.', note: 'US grade point average, on a four-point scale.' },
          { label: 'score', text: 'I got 80%', ipa: '/', usage: 'I got eighty per cent in the test.', note: 'Exam marks: "I got 80%".' },
          { label: 'odds', text: 'odds of 2 to 1', ipa: '/', usage: 'The odds are two to one against us.', note: 'Betting/statistics: odds.' },
          { label: 'chance', text: 'a 70% chance', ipa: '/', usage: 'There\'s a seventy per cent chance of rain.', note: 'probability = the formal word for chance.' },
          { label: 'comma', text: 'In Europe they write 3,5', ipa: '/', usage: 'English writes 3.5 — the comma is for thousands.', note: 'English: DOT for decimals, COMMA for thousands — opposite of Vietnamese!' },
          { label: '1,000.50', text: 'one thousand point five', ipa: '/', usage: '1,000.50 = one thousand point five (pounds).', note: 'Both marks together: read the pattern correctly.' },
          { label: 'macro', text: 'GDP grew by 6.5%', ipa: '/', usage: 'Vietnam\'s GDP grew six point five per cent.', note: 'Economic figures always use %.' },
          { label: 'usage', text: 'the percentage of', ipa: '/', usage: 'The percentage of smokers fell.', note: 'per cent follows a NUMBER; percentage is the noun for the ratio.' },
          { label: '0.001', text: 'zero point zero zero one', ipa: '/', usage: 'A thousandth of a gram.', note: 'Read each zero: "point oh oh one" casually.' },
          { label: '3.333...', text: 'three point three recurring', ipa: '/', usage: '1/3 = 0.3 recurring.', note: 'Endless repetition: "recurring" (UK) / "repeating" (US).' },
          { label: 'sig figs', text: 'significant figures', ipa: '/', usage: 'Round to three significant figures.', note: 'Science: 0.0045 has two significant figures.' },
          { label: '1.5%', text: 'one and a half per cent', ipa: '/', usage: 'Inflation rose one and a half per cent.', note: 'Half percentages: "and a half".' },
          { label: '+50%', text: 'a 50% increase', ipa: '/', usage: 'A fifty per cent increase = half as much again.', note: 'Up 50% = half again as much as before.' },
          { label: '.99', text: 'four ninety-nine', ipa: '/', usage: '$4.99 — four ninety-nine.', note: 'Retail prices drop "dollars and cents".' }
        ]
      },
      {
        id: 'numbers-fractions',
        title: 'Fractions',
        desc: 'Fractions: halves, thirds, quarters... up to thousandths and mixed numbers.',
        layout: 'list',
        items: [
          { label: '1/2', text: 'a half', ipa: '/hɑːf/', usage: 'Half an hour. / A half of the cake.', note: 'A special denominator: half (not "second").' },
          { label: '2 halves', text: 'two halves', ipa: '/', usage: 'Two halves make a whole.', note: 'half → halves (f → v + es).' },
          { label: '1/3', text: 'a third', ipa: '/θɜːd/', usage: 'A third of the world drinks tea.', note: 'Ordinals become denominators.' },
          { label: '2/3', text: 'two thirds', ipa: '/', usage: 'Two thirds of students passed.', note: 'Numerator > 1 → ADD S to the denominator: thirds.' },
          { label: '1/4', text: 'a quarter', ipa: '/ˈkwɔː.tər/', usage: 'A quarter past three.', note: 'UK/US: quarter is more common than "fourth".' },
          { label: '3/4', text: 'three quarters', ipa: '/', usage: 'Three quarters of an hour.', note: 'US also says "three fourths".' },
          { label: '1/5', text: 'a fifth', ipa: '/fɪfθ/', usage: 'One fifth of the budget.', note: 'fifth, not "fiveth".' },
          { label: '1/6', text: 'a sixth', ipa: '/sɪksθ/', usage: 'A sixth of the total.', note: 'The numerator can be "one" or "a".' },
          { label: '1/7', text: 'a seventh', ipa: '/', usage: 'One seventh of seven days...' },
          { label: '1/8', text: 'an eighth', ipa: '/eɪtθ/', usage: 'An eighth of a teaspoon.', note: 'Recipes: "a pinch", "an eighth".' },
          { label: '1/9', text: 'a ninth', ipa: '/naɪnθ/', usage: 'A ninth part.', note: 'Remember to drop the e: nine → ninth.' },
          { label: '1/10', text: 'a tenth', ipa: '/tenθ/', usage: 'One tenth of a millimetre.', note: '10% = a tenth.' },
          { label: '1/12', text: 'a twelfth', ipa: '/twelfθ/', usage: 'A twelfth of the year is a month.', note: 'twelve → twelfth.' },
          { label: '1/100', text: 'a hundredth', ipa: '/', usage: 'A hundredth of a second.', note: '1% = a hundredth.' },
          { label: '1/1000', text: 'a thousandth', ipa: '/', usage: 'To the nearest thousandth.', note: 'Precise to three decimal places.' },
          { label: '3/2', text: 'three halves', ipa: '/', usage: 'Three halves of an apple pie.', note: 'Improper fractions: pluralize the denominator.' },
          { label: '1.5', text: 'one and a half', ipa: '/', usage: 'One and a half years.', note: 'Mixed numbers: whole + and a half.' },
          { label: '2.75', text: 'two and three quarters', ipa: '/', usage: 'Two and three quarter miles.', note: 'and + fraction after the whole number.' },
          { label: '3/4 US', text: 'three fourths', ipa: '/', usage: 'US: three fourths = 3/4.', note: 'Americans often use fourths instead of quarters.' },
          { label: 'x/y', text: 'x over y', ipa: '/', usage: 'Read a/b as "a over b" in maths.', note: 'In math class: "three over four".' },
          { label: 'simplify', text: 'to reduce a fraction', ipa: '/', usage: 'Reduce 2/4 to one half.', note: 'simplify = reduce; numerator/denominator = top/bottom.' },
          { label: 'of', text: 'two-thirds of the students', ipa: '/', usage: 'Two thirds of the cake is gone.', note: 'of + noun; the verb follows the noun after of.' },
          { label: 'part', text: 'half of it', ipa: '/', usage: 'I ate half of it.', note: 'half of + object; casual "half it".' },
          { label: 'mixed', text: 'Half seriously, half joking.', ipa: '/', usage: 'Half and half.', note: 'Splitting a description in two parts.' },
          { label: 'majority', text: 'more than half', ipa: '/', usage: 'More than half agreed.', note: 'under half = less than 50%.' },
          { label: '3:1', text: 'three to one', ipa: '/', usage: 'The ratio is three to one.', note: 'Ratios read with "to".' },
          { label: '1/3 ≈', text: 'one third is approximately zero point three three', ipa: '/', usage: 'In decimals: 1/3 = 0.333...', note: 'Converting fractions → decimals.' },
          { label: '1/8 in', text: 'an eighth of an inch', ipa: '/', usage: 'Just an eighth of an inch!', note: 'Measuring: fraction + of a + unit.' },
          { label: 'cooking', text: 'half a teaspoon', ipa: '/', usage: 'Add half a teaspoon of salt.', note: 'Recipes: half a cup, a quarter cup.' },
          { label: 'forms', text: 'a half = 0.5 = 50%', ipa: '/', usage: 'Same value, three forms.', note: 'Converting fraction ↔ decimal ↔ percent.' },
          { label: 'exact', text: 'to a T', ipa: '/', usage: 'That fits to a T — perfectly.', note: 'Idiom: exactly right.' },
          { label: 'big', text: 'five sixths', ipa: '/', usage: 'Five sixths of the report is done.', note: 'Numerator 5, denominator 6 → "five sixths" (with s).' }
        ]
      },
      {
        id: 'numbers-measurement',
        title: 'Measurement',
        desc: 'Length, weight, distance, temperature, speed and capacity.',
        layout: 'tabs',
        tabs: [
          {
            id: 'length', title: 'Length', items: [
              { label: 'mm', text: 'millimetre', ipa: '/ˈmɪl.ɪ.miː.tər/', usage: 'A few millimetres wide.', note: '10 mm = 1 cm; US spelling: millimeter.' },
              { label: 'cm', text: 'centimetre', ipa: '/ˈsen.tɪ.miː.tər/', usage: 'He\'s 175 centimetres tall.', note: '100 cm = 1 m.' },
              { label: 'm', text: 'metre', ipa: '/ˈmiː.tər/', usage: 'A five-metre rope.', note: 'US: meter; compound adjective: a 10-metre-long pool.' },
              { label: 'km', text: 'kilometre', ipa: '/kɪˈlɒm.ɪ.tər/', usage: 'It\'s 100 kilometres away.', note: '1,000 m.' },
              { label: 'in', text: 'inch', ipa: '/ɪntʃ/', usage: 'A 27-inch monitor.', note: '≈ 2.54 cm; screens are measured in inches.' },
              { label: 'ft', text: 'foot / feet', ipa: '/fʊt/', usage: 'He\'s six feet tall.', note: '≈ 30.48 cm; plural: feet.' },
              { label: 'yd', text: 'yard', ipa: '/jɑːd/', usage: 'A hundred-yard dash.', note: '≈ 0.91 m; 3 feet = 1 yard.' },
              { label: 'mi', text: 'mile', ipa: '/maɪl/', usage: 'It\'s ten miles to the city.', note: '≈ 1.6 km; "give me a mile" = one lane of road.' }
            ]
          },
          {
            id: 'weight', title: 'Weight', items: [
              { label: 'g', text: 'gram', ipa: '/ɡræm/', usage: 'Two hundred grams of flour.', note: '1,000 g = 1 kg.' },
              { label: 'kg', text: 'kilogram', ipa: '/ˈkɪl.ə.ɡræm/', usage: 'I weigh 60 kilograms.', note: 'Luggage allowance: 23 kg.' },
              { label: 't', text: 'tonne / ton', ipa: '/tʌn/', usage: 'A ten-tonne truck.', note: 'tonne (metric) ≈ ton (UK/US slightly different).' },
              { label: 'oz', text: 'ounce', ipa: '/aʊns/', usage: 'Half an ounce of gold.', note: '≈ 28 g; 16 oz = 1 pound.' },
              { label: 'lb', text: 'pound', ipa: '/paʊnd/', usage: 'She weighs 120 pounds.', note: '≈ 0.45 kg (weight — different from the £ pound).' },
              { label: 'st', text: 'stone', ipa: '/stəʊn/', usage: 'UK: I weigh ten stone.', note: '≈ 6.35 kg; the British weigh themselves in stone.' }
            ]
          },
          {
            id: 'capacity', title: 'Capacity & area', items: [
              { label: 'ml', text: 'millilitre', ipa: '/ˈmɪl.ɪ.liː.tər/', usage: 'A 500 ml bottle.', note: '1,000 ml = 1 litre.' },
              { label: 'l', text: 'litre', ipa: '/ˈliː.tər/', usage: 'Two litres of water.', note: 'US: liter; drink 2 litres a day.' },
              { label: 'gal', text: 'gallon', ipa: '/ˈɡæl.ən/', usage: 'US: a gallon of milk.', note: '≈ 3.78 litres (US), 4.54 litres (UK).' },
              { label: 'm²', text: 'square metre', ipa: '/', usage: 'A fifty-square-metre flat.', note: 'Area: square + unit.' },
              { label: 'm³', text: 'cubic metre', ipa: '/ˈkjuː.bɪk/', usage: 'A cubic metre of water.', note: 'Volume: cubic + unit.' },
              { label: 'ha', text: 'hectare', ipa: '/ˈhek.teər/', usage: 'A ten-hectare farm.', note: '10,000 m²; farmland measure.' }
            ]
          },
          {
            id: 'temperature', title: 'Temperature', items: [
              { label: '20°C', text: 'twenty degrees Celsius', ipa: '/', usage: 'It\'s twenty degrees today.', note: 'Degrees C; the US uses Fahrenheit.' },
              { label: '37°C', text: 'body temperature', ipa: '/', usage: 'Normal body temperature is 37°C.', note: '"I have a temperature" = I have a fever.' },
              { label: '0°C', text: 'the freezing point', ipa: '/', usage: 'Water freezes at zero degrees.', note: 'Where water turns to ice.' },
              { label: '100°C', text: 'the boiling point', ipa: '/', usage: 'Water boils at one hundred degrees.', note: 'Where water turns to steam.' },
              { label: '-5°C', text: 'minus five degrees', ipa: '/', usage: 'It\'s minus five this morning.', note: 'US: "five below zero"; UK: "minus five".' },
              { label: '68°F', text: 'sixty-eight degrees Fahrenheit', ipa: '/', usage: 'US weather: 68°F.', note: 'Fahrenheit: 32°F freezes, 212°F boils.' }
            ]
          },
          {
            id: 'speed', title: 'Speed', items: [
              { label: 'km/h', text: 'kilometres per hour', ipa: '/', usage: 'The limit is 60 kilometres per hour.', note: 'per = every; casually "sixty kilos an hour".' },
              { label: 'mph', text: 'miles per hour', ipa: '/', usage: 'UK/US: 70 mph on the motorway.', note: 'The UK and US measure speed in mph.' },
              { label: 'kn', text: 'knot', ipa: '/nɒt/', usage: 'The ship sails at 20 knots.', note: 'Nautical miles per hour (sea and air).' },
              { label: 'm/s', text: 'metres per second', ipa: '/', usage: 'Free fall: 9.8 metres per second squared.', note: 'Science units: m/s².' },
              { label: 'light', text: 'the speed of light', ipa: '/', usage: 'About 300,000 km per second.', note: 'The universal speed limit.' },
              { label: 'pace', text: 'pace', ipa: '/peɪs/', usage: 'She ran at a fast pace.', note: 'Speed of activity; "keep pace with" = stay level.' }
            ]
          },
          {
            id: 'usage', title: 'Talking about measurements', items: [
              { label: 'tall', text: 'It\'s two metres tall.', ipa: '/', usage: 'How tall is it? — Two metres.', note: 'tall (people/trees), high (objects/altitude).' },
              { label: 'size', text: 'It measures three by four.', ipa: '/', usage: 'The room is three metres by four.', note: 'Dimensions: A by B (length × width).' },
              { label: 'weigh', text: 'It weighs 60 kilos.', ipa: '/', usage: 'How much does it weigh?', note: 'weigh = to have weight; How much does... weigh?' },
              { label: 'distance', text: 'How far is it?', ipa: '/', usage: 'It\'s about ten kilometres.', note: 'far (distance) ≠ long (time/length).' },
              { label: 'comparison', text: 'the size of a football', ipa: '/', usage: 'It\'s about the size of a coin.', note: 'the size/shape/weight of + noun.' },
              { label: 'exact', text: 'exactly / precisely', ipa: '/', usage: 'Exactly three metres. / Roughly ten.', note: 'exactly vs roughly/approximately.' },
              { label: 'about', text: 'about / around', ipa: '/', usage: 'Around five kilos. / About two metres.', note: 'about/around = not exact.' },
              { label: 'over/under', text: 'more than / less than', ipa: '/', usage: 'More than ten metres. / Less than a kilo.', note: 'over/under work too.' }
            ]
          }
        ]
      },
      {
        id: 'numbers-math',
        title: 'Math',
        desc: 'Basic maths: operations, fractions, geometry and everyday terms.',
        layout: 'list',
        items: [
          { label: '+', text: 'two plus three equals five', ipa: '/', usage: '2 + 3 = 5.', note: 'plus = add; the sign = is read "equals".' },
          { label: '−', text: 'ten minus four equals six', ipa: '/', usage: '10 − 4 = 6.', note: 'minus = subtract; "take away" (primary school).' },
          { label: '×', text: 'six times seven equals forty-two', ipa: '/', usage: '6 × 7 = 42.', note: 'multiply by; casually: "six sevens are forty-two".' },
          { label: '÷', text: 'twenty divided by five equals four', ipa: '/', usage: '20 ÷ 5 = 4.', note: 'divide by = to split.' },
          { label: '=', text: 'equals / is equal to', ipa: '/', usage: 'A is equal to B.', note: '≠ = "is not equal to".' },
          { label: '>', text: 'more than / greater than', ipa: '/', usage: '5 is greater than 3.', note: '< = less than; math uses greater/less, life uses more/less.' },
          { label: '≥', text: 'at least', ipa: '/', usage: 'You need at least five.', note: '≥ = at least; ≤ = at most.' },
          { label: '≈', text: 'approximately equal to', ipa: '/', usage: 'π ≈ 3.14.', note: '≈ = roughly the same.' },
          { label: 'x²', text: 'x squared', ipa: '/skweəd/', usage: '3 squared = 9.', note: 'to the power 2; "the square of 3".' },
          { label: 'x³', text: 'x cubed', ipa: '/kjuːbd/', usage: '2 cubed = 8.', note: 'to the power 3.' },
          { label: '√', text: 'the square root of', ipa: '/', usage: 'The square root of 16 is 4.', note: 'root; cube root = the third root.' },
          { label: 'π', text: 'pi', ipa: '/paɪ/', usage: 'Pi is 3.14159...', note: 'Read "pie".' },
          { label: '∞', text: 'infinity', ipa: '/ɪnˈfɪn.ə.ti/', usage: 'To infinity and beyond!', note: 'Endless; the everyday word is endless.' },
          { label: 'x', text: 'x / variable', ipa: '/', usage: 'Solve for x.', note: 'The unknown reads "eks"; y reads "wʌɪ".' },
          { label: '2n / 2n+1', text: 'even / odd', ipa: '/', usage: 'Two, four, six are even. One, three are odd.', note: 'Even and odd numbers.' },
          { label: '2,3,5,7', text: 'prime number', ipa: '/', usage: '2, 3, 5, 7, 11 are primes.', note: 'Divisible only by 1 and itself.' },
          { label: 'ℤ', text: 'integer', ipa: '/ˈɪn.tɪ.dʒər/', usage: '−3, 0, 5 are integers.', note: 'A whole number, no decimals.' },
          { label: '−5', text: 'negative / minus', ipa: '/', usage: 'Minus five, or negative five.', note: '−5 = "minus five" (UK) / "negative five".' },
          { label: '+', text: 'positive', ipa: '/', usage: 'A positive number.', note: 'The opposite of negative.' },
          { label: 'sum', text: 'the sum of', ipa: '/', usage: 'The sum of 2 and 3 is 5.', note: 'sum = the answer of addition.' },
          { label: 'minus', text: 'the difference', ipa: '/', usage: 'The difference between 10 and 4 is 6.', note: 'difference = the answer of subtraction.' },
          { label: 'times', text: 'the product', ipa: '/', usage: 'The product of 6 and 7 is 42.', note: 'product = the answer of multiplication.' },
          { label: 'divide', text: 'the quotient', ipa: '/', usage: 'The quotient of 20 and 5 is 4.', note: 'quotient = the answer of division.' },
          { label: 'leftover', text: 'the remainder', ipa: '/', usage: '7 divided by 2 is 3 with a remainder of 1.', note: 'remainder = what is left over.' },
          { label: 'a/b', text: 'numerator / denominator', ipa: '/', usage: 'In 3/4, 3 is the numerator.', note: 'top number / bottom number.' },
          { label: '0.5', text: 'decimal', ipa: '/ˈdes.ɪ.məl/', usage: 'Change the fraction to a decimal.', note: 'A number with a point.' },
          { label: '50%', text: 'percentage', ipa: '/pəˈsen.tɪdʒ/', usage: 'What percentage passed?', note: 'percent (%) vs percentage (the noun).' },
          { label: '◯', text: 'circle / radius', ipa: '/', usage: 'The radius is half the diameter.', note: 'radius = centre to edge; diameter = edge to edge.' },
          { label: '▢', text: 'square', ipa: '/', usage: 'A square has four equal sides.', note: 'rectangle = a box with two long sides.' },
          { label: '△', text: 'triangle', ipa: '/', usage: 'A triangle has three angles.', note: 'angle = the corner; 90° = right angle.' },
          { label: 'm²', text: 'area', ipa: '/', usage: 'The area of the room is 12 square metres.', note: 'area = surface inside; perimeter = the edge.' },
          { label: 'edge', text: 'perimeter', ipa: '/', usage: 'The perimeter of a square is 4 × side.', note: 'The distance all the way round.' },
          { label: 'm³', text: 'volume', ipa: '/ˈvɒl.juːm/', usage: 'The volume of a box = length × width × height.', note: 'Space inside; capacity = how much it holds.' },
          { label: 'solve', text: 'to solve an equation', ipa: '/', usage: 'Solve the equation for x.', note: 'equation = a statement with =.' },
          { label: 'formula', text: 'formula', ipa: '/ˈfɔː.mjələ/', usage: 'The formula for area is πr².', note: 'Plural: formulas / formulae.' },
          { label: 'prove', text: 'to prove / proof', ipa: '/', usage: 'Let me prove it.', note: 'proof = the evidence or the act of proving.' },
          { label: 'geo', text: 'coordinates', ipa: '/kəʊˈɔː.dɪ.nəts/', usage: 'Latitude 10, longitude 106.', note: 'Position on a map; latitude = N-S, longitude = E-W.' },
          { label: 'round', text: 'to round off', ipa: '/', usage: 'Round 3.7 off to four.', note: 'round up/down; nearest = closest.' },
          { label: 'mean', text: 'the average', ipa: '/ˈæv.ər.ɪdʒ/', usage: 'The average of 2 and 4 is three.', note: 'mean = the average; statistics = the field.' },
          { label: 'ratio', text: 'proportional', ipa: '/', usage: 'Y is proportional to X.', note: 'directly/inversely proportional.' },
          { label: 'xⁿ', text: 'two to the power of ten', ipa: '/', usage: '2¹⁰ = two to the power of ten = 1,024.', note: 'xⁿ = "x to the power n"; powers 2/3: squared/cubed.' },
          { label: '5!', text: 'five factorial', ipa: '/', usage: '5! = 120.', note: 'The sign ! is read "factorial".' },
          { label: 'algebra', text: 'equation vs expression', ipa: '/', usage: '2x + 1 = 5 is an equation.', note: 'An equation has =; an expression does not.' },
          { label: 'axes', text: 'the x-axis / y-axis', ipa: '/', usage: 'Plot it on the x-axis.', note: 'axis (singular), axes /ˈæk.siːz/ (plural).' },
          { label: 'chart', text: 'graph / chart', ipa: '/', usage: 'The graph shows a rise.', note: 'bar chart = bars, pie chart = circle, line graph = line.' },
          { label: '−3', text: 'a negative result', ipa: '/', usage: '5 minus 8 equals minus three.', note: 'Negative answers: "minus three" / "negative three".' },
          { label: 'rank', text: 'the top 10 percent', ipa: '/', usage: 'She scored in the top ten per cent.', note: 'percentile = the ranking scale at school.' },
          { label: 'fixed', text: 'a constant', ipa: '/', usage: 'c is a constant; x is a variable.', note: 'Constant vs variable.' }
        ]
      },
      {
        id: 'numbers-addresses',
        title: 'Addresses',
        desc: 'Street addresses, floors, postcodes — how to write and read them in UK/US style.',
        layout: 'list',
        items: [
          { label: 'house no.', text: '12 Nguyen Trai Street', ipa: '/', usage: 'I live at 12 Nguyen Trai Street.', note: 'at + house number; read "twelve Nguyen Trai Street".' },
          { label: 'No.', text: 'No. 5', ipa: '/', usage: 'House number five.', note: '"No." = number; read "number five".' },
          { label: 'street', text: 'street / road / avenue', ipa: '/', usage: 'On Oxford Street.', note: 'Preposition ON + street name (not in).' },
          { label: 'alley', text: 'lane / alley', ipa: '/', usage: 'In an alley off the main road.', note: 'A small side passage off a main road.' },
          { label: 'flat', text: 'flat / apartment', ipa: '/', usage: 'UK: a flat; US: an apartment.', note: 'flat (UK) = apartment (US); "a two-bedroom flat".' },
          { label: 'unit', text: 'Flat 502, Block A', ipa: '/', usage: 'I live in flat five-oh-two.', note: 'Read unit numbers digit by digit.' },
          { label: 'floor UK', text: 'the ground floor', ipa: '/', usage: 'UK: ground floor = the street level.', note: 'UK: ground → first → second; US: first = floor 1.' },
          { label: 'floor US', text: 'the first floor', ipa: '/', usage: 'US: first floor = the ground floor.', note: 'Trap: US first = UK ground.' },
          { label: 'upstairs', text: 'the third floor', ipa: '/', usage: 'My office is on the third floor.', note: 'on the + ordinal + floor.' },
          { label: 'below', text: 'the basement / B1', ipa: '/', usage: 'Parking in the basement.', note: 'Underground level; US: "floor B1".' },
          { label: 'top', text: 'the top floor', ipa: '/', usage: 'A penthouse on the top floor.', note: 'A penthouse = the luxury top-floor flat.' },
          { label: 'postcode', text: 'postcode / ZIP code', ipa: '/', usage: 'UK: postcode; US: ZIP code.', note: 'VN postcodes are 6 digits; US ZIP: 10001.' },
          { label: 'district', text: 'district', ipa: '/ˈdɪs.trɪkt/', usage: 'District 1, Ho Chi Minh City.', note: 'Used for city districts; "downtown" = the city centre.' },
          { label: 'ward', text: 'ward', ipa: '/wɔːd/', usage: 'Pham Ngu Lao Ward.', note: 'A small administrative division below a district.' },
          { label: 'province', text: 'province', ipa: '/ˈprɒv.ɪns/', usage: 'Khanh Hoa Province.', note: 'A region larger than a district; pairs with city.' },
          { label: 'corner', text: 'on the corner of X and Y', ipa: '/', usage: 'The café is on the corner of Le Loi and Tran Hung Dao.', note: 'Where two streets meet.' },
          { label: 'facing', text: 'opposite / across from', ipa: '/', usage: 'Opposite the bank.', note: 'Facing it; "next to" = beside.' },
          { label: 'between', text: 'between A and B', ipa: '/', usage: 'Between the bakery and the pharmacy.', note: 'In the middle of two; among = of many.' },
          { label: 'beside', text: 'next to / beside', ipa: '/', usage: 'Next to the bus stop.', note: 'At the side of; "behind" = at the back, "in front of" = ahead.' },
          { label: 'US form', text: '123 Main St, Springfield, IL 62704', ipa: '/', usage: 'US format: number, street, city, state, ZIP.', note: 'Written small → big, like Vietnamese addresses.' },
          { label: 'P.O. Box', text: 'P.O. Box', ipa: '/', usage: 'Send it to P.O. Box 12.', note: 'A locked box at the post office.' },
          { label: 'asking', text: 'How do I get to...?', ipa: '/', usage: 'Excuse me, how do I get to the station?', note: 'Asking the way; "Is this the right way for...?"' },
          { label: 'shared', text: 'to share a flat', ipa: '/', usage: 'I share a flat with two friends.', note: 'An apartment block = "block of flats" (UK).' },
          { label: 'gate', text: 'Gate 3, Block B', ipa: '/', usage: 'Enter through gate three.', note: 'Gated complexes: gate, block, tower.' },
          { label: 'landmark', text: 'near the landmark', ipa: '/', usage: 'It\'s by the big tree — you can\'t miss it.', note: '"you can\'t miss it" = impossible to miss.' },
          { label: 'suburbs', text: 'the suburbs', ipa: '/ˈsʌb.ɜːbz/', usage: 'She lives in the suburbs.', note: 'Residential outer areas; "downtown" = the centre (US).' }
        ]
      },
      {
        id: 'numbers-mixed',
        title: 'Mixed Numbers',
        desc: 'Numbers in daily life: scores, versions, chapters, gates, sizes and more.',
        layout: 'list',
        items: [
          { label: '3–1', text: 'three one', ipa: '/', usage: 'United won three one.', note: 'Football scores: read the digits, drop "to".' },
          { label: '0–0', text: 'nil-nil', ipa: '/', usage: 'UK: it finished nil-nil.', note: 'Zero in scores = nil (UK) / zero / nothing (US).' },
          { label: 'tennis', text: 'fifteen–love', ipa: '/', usage: 'Tennis: love means zero.', note: 'love = 0 in tennis; then 15, 30, 40.' },
          { label: '9/10', text: 'nine out of ten', ipa: '/', usage: 'I gave it nine out of ten.', note: 'Marks: N out of M.' },
          { label: '17.5', text: 'iOS seventeen point five', ipa: '/', usage: 'Update to version seventeen point five.', note: 'Versions: the number, then the decimal digits.' },
          { label: '2.0', text: 'version two point oh', ipa: '/', usage: 'Software version two point oh.', note: 'A trailing 0 reads "oh".' },
          { label: 'Ch.5', text: 'Chapter five', ipa: '/', usage: 'Read chapter five.', note: 'Noun + cardinal number (not ordinal): Chapter 5, Page 12.' },
          { label: 'p.12', text: 'page twelve', ipa: '/', usage: 'Turn to page twelve.', note: 'But: "on the twelfth page" (ordinal).' },
          { label: 'Room 204', text: 'room two-oh-four', ipa: '/', usage: 'My room is two-oh-four.', note: 'Room numbers read digit by digit.' },
          { label: 'Gate 12', text: 'gate twelve', ipa: '/', usage: 'Boarding at gate twelve.', note: 'Airport gates; read as a normal number.' },
          { label: 'Bus 86', text: 'bus number eighty-six', ipa: '/', usage: 'Take bus eighty-six.', note: 'Route numbers.' },
          { label: 'size 38', text: 'a size thirty-eight', ipa: '/', usage: 'I take a size thirty-eight.', note: 'Clothes and shoe sizes.' },
          { label: '5:15', text: 'the five-fifteen', ipa: '/', usage: 'I\'ll catch the five-fifteen train.', note: 'A specific departure: "the five-fifteen".' },
          { label: '100m', text: 'the hundred metres', ipa: '/', usage: 'She runs the hundred metres.', note: 'Track events: the 100 (metres).' },
          { label: '101', text: 'one-oh-one', ipa: '/', usage: 'Dial one-oh-one.', note: 'Service numbers: digit by digit.' },
          { label: '3rd bus', text: 'every third bus', ipa: '/', usage: 'Every third bus is full.', note: 'One in every three.' },
          { label: '×2', text: 'twice as big as', ipa: '/', usage: 'It\'s twice as big as that one.', note: 'Double size: twice as + adjective + as.' },
          { label: '×3', text: 'three times more than', ipa: '/', usage: 'Three times more expensive.', note: 'Triple size.' },
          { label: 'pairs', text: 'in twos', ipa: '/', usage: 'The children lined up in twos.', note: 'In groups of two; in tens = by tens.' },
          { label: 'skip', text: 'count by tens', ipa: '/', usage: 'Count from nought by tens.', note: 'Counting in steps of ten.' },
          { label: 'many', text: 'dozens of', ipa: '/', usage: 'Dozens of people came.', note: 'Many tens; "a couple of" = a few.' },
          { label: 'lots', text: 'tons of', ipa: '/', usage: 'I have tons of work.', note: 'Casual: a huge amount = tons/loads/heaps of.' },
          { label: '∞', text: 'countless', ipa: '/', usage: 'Countless attempts.', note: 'Too many to count; innumerable.' },
          { label: 'few', text: 'a handful', ipa: '/', usage: 'A handful of rice.', note: 'One hand full; figuratively: very few.' },
          { label: 'first 2', text: 'the first two chapters', ipa: '/', usage: 'Read the first two chapters.', note: 'Ordinal + cardinal: the first two, the last five.' },
          { label: 'last 5', text: 'the last five minutes', ipa: '/', usage: 'I scored in the last five minutes.', note: 'The final stretch.' },
          { label: 'more', text: 'another three weeks', ipa: '/', usage: 'Wait another three weeks.', note: 'Three more weeks; "three more weeks" also works.' },
          { label: 'both', text: 'both of them', ipa: '/', usage: 'Both my parents are teachers.', note: 'The two together; "the two of us".' },
          { label: 'either', text: 'either side', ipa: '/', usage: 'On either side of the road.', note: 'One or the other of two.' },
          { label: 'neither', text: 'neither answer', ipa: '/', usage: 'Neither of them is right.', note: 'Not one and not the other.' },
          { label: 'hotel', text: 'half board', ipa: '/', usage: 'Hotel: half board = breakfast + dinner.', note: 'Half meals included; "full board" = three meals.' },
          { label: 'room', text: 'a double room', ipa: '/', usage: 'A double for two nights.', note: 'A double bed; "twin" = two single beds.' },
          { label: 'below', text: 'lower ground floor', ipa: '/', usage: 'UK: the lower ground floor.', note: 'A half-level below; US: "basement".' },
          { label: '1 in 4', text: 'one in four', ipa: '/', usage: 'One in four adults can\'t swim.', note: 'Statistical ratio.' },
          { label: 'top ten', text: 'the top ten', ipa: '/', usage: 'The song is in the top ten.', note: 'Rankings: top/bottom + number.' },
          { label: 'no.1', text: 'number one', ipa: '/', usage: 'It\'s my number one priority.', note: 'The most important; "number one" also = yourself.' },
          { label: 'however', text: 'on the one hand... on the other', ipa: '/', usage: 'On the one hand yes, on the other no.', note: 'One way... the other way (arguing both sides).' },
          { label: 'few', text: 'two or three', ipa: '/', usage: 'A couple of two or three days.', note: 'A small estimate.' },
          { label: 'nap', text: 'forty winks', ipa: '/', usage: 'I had forty winks.', note: 'Idiom: a short nap.' },
          { label: 'smart', text: 'dressed up to the nines', ipa: '/', usage: 'She was dressed up to the nines.', note: 'Idiom: dressed very smartly.' },
          { label: 'lvl 99', text: 'level ninety-nine', ipa: '/', usage: 'He\'s level 99 in the game.', note: 'Game levels: noun + cardinal number.' },
          { label: 'Act 2', text: 'Act two, scene three', ipa: '/', usage: 'We\'re at act two now.', note: 'Plays/films: act + scene; "it\'s act two" = the middle phase.' },
          { label: 'size 42', text: 'a size forty-two', ipa: '/', usage: 'I wear a size forty-two.', note: 'EU shoe size 42 ≈ US 8.5.' },
          { label: 'ch.5', text: 'channel five', ipa: '/', usage: 'It\'s on channel five tonight.', note: 'TV channels.' },
          { label: 'Suite', text: 'suite seven hundred', ipa: '/', usage: 'Office: suite 700, Fifth Avenue.', note: 'suite = an office or luxury hotel room.' },
          { label: 'row H', text: 'row H, seat twelve', ipa: '/', usage: 'My seat is row H, seat twelve.', note: 'Seating: row + seat; letters read as letter names.' },
          { label: '9¾', text: 'platform nine and three quarters', ipa: '/', usage: 'Harry Potter: platform nine and three-quarters.', note: 'A station platform; fractions read "and three quarters".' },
          { label: '12 noon', text: 'twelve noon', ipa: '/', usage: 'Lunch at twelve noon sharp.', note: '12 midday = noon (not 12 a.m.!).' },
          { label: 'BC joke', text: 'before dinner', ipa: '/', usage: 'British humor: B.D. = before dinner.', note: 'A pun on B.C. (Before Christ).' }
        ]
      }
    ]
  }
];

/** Flat list of all topics in display order. */
export function allTopics() {
  return BASICS_GROUPS.flatMap(g => g.topics.map(t => ({ ...t, groupId: g.id, groupTitle: g.title })));
}

/** Count the items of a topic (merged from tabs when present). */
export function countItems(topic) {
  if (topic.layout === 'tabs' && Array.isArray(topic.tabs)) {
    return topic.tabs.reduce((n, t) => n + (t.items ? t.items.length : 0), 0);
  }
  return topic.items ? topic.items.length : 0;
}

/** Find a topic by id, with its index in the flat list. */
export function findTopic(id) {
  const flat = allTopics();
  const index = flat.findIndex(t => t.id === id);
  return index >= 0 ? { topic: flat[index], index, flat } : null;
}

/** Previous/next topic for prev-next navigation. */
export function topicNeighbors(id) {
  const found = findTopic(id);
  if (!found) return { prev: null, next: null };
  const { flat, index } = found;
  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null
  };
}
