(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // miniprogram/lib/cards.js
  var require_cards = __commonJS({
    "miniprogram/lib/cards.js"(exports, module) {
      var SUITS = ["S", "H", "C", "D"];
      var SUIT_LABELS = { S: "\u2660", H: "\u2665", C: "\u2663", D: "\u2666", J: "" };
      var RANK_LABELS = { 11: "J", 12: "Q", 13: "K", 14: "A", 16: "\u5C0F\u738B", 17: "\u5927\u738B" };
      function createDeck() {
        const cards = [];
        for (let deck = 0; deck < 2; deck += 1) {
          for (const suit of SUITS) {
            for (let rank = 2; rank <= 14; rank += 1) {
              cards.push({ id: `${deck}-${suit}-${rank}`, deck, suit, rank });
            }
          }
          cards.push({ id: `${deck}-J-16`, deck, suit: "J", rank: 16 });
          cards.push({ id: `${deck}-J-17`, deck, suit: "J", rank: 17 });
        }
        return cards;
      }
      function shuffle(cards, random = Math.random) {
        const result = cards.slice();
        for (let i = result.length - 1; i > 0; i -= 1) {
          const j = Math.floor(random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      }
      function rankPower(rank, level) {
        return rank >= 16 ? rank + 1 : rank === level ? 16 : rank;
      }
      function legalReturnCards2(hand, level) {
        const normal = hand.filter((card) => card.rank <= 10 && card.rank !== level);
        if (normal.length) return normal;
        return hand.filter((card) => !(card.rank === level && card.suit === "H"));
      }
      function sortCards2(cards, level) {
        const suitOrder = { S: 0, H: 1, C: 2, D: 3, J: 4 };
        return cards.slice().sort(
          (a, b) => rankPower(a.rank, level) - rankPower(b.rank, level) || suitOrder[a.suit] - suitOrder[b.suit] || a.deck - b.deck
        );
      }
      function cardLabel2(card) {
        return card.rank >= 16 ? RANK_LABELS[card.rank] : `${SUIT_LABELS[card.suit]}${RANK_LABELS[card.rank] || card.rank}`;
      }
      module.exports = { createDeck, shuffle, rankPower, legalReturnCards: legalReturnCards2, sortCards: sortCards2, cardLabel: cardLabel2 };
    }
  });

  // miniprogram/lib/rules.js
  var require_rules = __commonJS({
    "miniprogram/lib/rules.js"(exports, module) {
      var { rankPower } = require_cards();
      var TYPE_LABELS2 = {
        single: "\u5355\u5F20",
        pair: "\u5BF9\u5B50",
        triple: "\u4E09\u5F20",
        fullHouse: "\u4E09\u5E26\u4E8C",
        straight: "\u987A\u5B50",
        pairsRun: "\u4E09\u8FDE\u5BF9",
        triplesRun: "\u94A2\u677F",
        bomb: "\u70B8\u5F39",
        straightFlush: "\u540C\u82B1\u987A",
        jokerBomb: "\u56DB\u738B\u70B8"
      };
      var SEQUENCE_TYPES = /* @__PURE__ */ new Set(["straight", "pairsRun", "triplesRun", "straightFlush"]);
      function tierOf(move) {
        if (move.type === "jokerBomb") return 9;
        if (move.type === "straightFlush") return 3;
        if (move.type === "bomb") return move.size < 6 ? move.size - 3 : move.size - 2;
        return 0;
      }
      function moveKey2(move) {
        return `${move.type}:${move.mainRank}:${move.size}`;
      }
      function sequenceTop(values) {
        const sorted = values.slice().sort((a, b) => a - b);
        if (new Set(sorted).size !== values.length) return null;
        if (sorted.length === 5 && sorted.join(",") === "2,3,4,5,14") return 5;
        if (sorted.length === 3 && sorted.join(",") === "2,3,14") return 3;
        if (sorted.length === 2 && sorted.join(",") === "2,14") return 2;
        for (let i = 1; i < sorted.length; i += 1) {
          if (sorted[i] !== sorted[i - 1] + 1) return null;
        }
        return sorted[sorted.length - 1];
      }
      function interpret(ranks, suits, level, wildIndexes) {
        const n = ranks.length;
        const counts = /* @__PURE__ */ new Map();
        for (const rank of ranks) counts.set(rank, (counts.get(rank) || 0) + 1);
        const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || rankPower(b[0], level) - rankPower(a[0], level));
        const allSame = groups.length === 1;
        const invalidPair = (rank) => rank !== level && wildIndexes.filter((index) => ranks[index] === rank).length > 1;
        const results = [];
        const add = (type, mainRank) => results.push({
          type,
          mainRank,
          size: n,
          tier: tierOf({ type, size: n }),
          power: SEQUENCE_TYPES.has(type) ? mainRank : rankPower(mainRank, level)
        });
        if (n >= 4 && n <= 10 && allSame && ranks[0] < 16) add("bomb", ranks[0]);
        if (n === 5 && suits.every((suit) => suit === suits[0] && suit !== "J")) {
          const top = sequenceTop(ranks);
          if (top !== null) add("straightFlush", top);
        }
        if (n === 1) add("single", ranks[0]);
        if (n === 2 && allSame && !invalidPair(ranks[0])) add("pair", ranks[0]);
        if (n === 3 && allSame && ranks[0] < 16) add("triple", ranks[0]);
        if (n === 5 && groups.length === 2 && groups[0][1] === 3 && groups[1][1] === 2 && groups[0][0] < 16 && !invalidPair(groups[1][0])) add("fullHouse", groups[0][0]);
        if (n === 5 && ranks.every((rank) => rank < 16)) {
          const top = sequenceTop(ranks);
          if (top !== null) add("straight", top);
        }
        if (n === 6 && groups.length === 3 && groups.every((group) => group[1] === 2 && group[0] < 16 && !invalidPair(group[0]))) {
          const top = sequenceTop(groups.map((group) => group[0]));
          if (top !== null) add("pairsRun", top);
        }
        if (n === 6 && groups.length === 2 && groups.every((group) => group[1] === 3 && group[0] < 16)) {
          const top = sequenceTop(groups.map((group) => group[0]));
          if (top !== null) add("triplesRun", top);
        }
        return results;
      }
      function classifyOptions2(cards, level) {
        if (!Array.isArray(cards) || !cards.length || cards.length > 10 || new Set(cards.map((card) => card.id)).size !== cards.length) return [];
        if (cards.length === 4 && cards.filter((card) => card.rank === 16).length === 2 && cards.filter((card) => card.rank === 17).length === 2) {
          return [{ type: "jokerBomb", mainRank: 17, size: 4, tier: 9, power: 18 }];
        }
        const wildIndexes = [];
        const ranks = cards.map((card, i) => {
          if (card.rank === level && card.suit === "H") wildIndexes.push(i);
          return card.rank;
        });
        const suits = cards.map((card) => card.suit);
        const naturalSuits = cards.filter((card) => !(card.rank === level && card.suit === "H")).map((card) => card.suit);
        const flushSuit = naturalSuits.length && naturalSuits.every((suit) => suit === naturalSuits[0] && suit !== "J") ? naturalSuits[0] : null;
        const found = [];
        function visit(index) {
          if (index === wildIndexes.length) {
            found.push(...interpret(ranks, suits, level, wildIndexes));
            return;
          }
          const position = wildIndexes[index];
          const original = ranks[position];
          const originalSuit = suits[position];
          for (let rank = 2; rank <= 14; rank += 1) {
            ranks[position] = rank;
            suits[position] = flushSuit || originalSuit;
            visit(index + 1);
          }
          ranks[position] = original;
          suits[position] = originalSuit;
        }
        visit(0);
        const onlyWildcards = cards.length <= 2 && cards.every((card) => card.rank === level && card.suit === "H");
        const unique = /* @__PURE__ */ new Map();
        for (const option of found) {
          if (onlyWildcards && option.mainRank !== level) continue;
          if (option.type === "straight" && flushSuit) continue;
          unique.set(moveKey2(option), option);
        }
        return [...unique.values()].sort((a, b) => b.tier - a.tier || b.power - a.power);
      }
      function classify(cards, level) {
        return classifyOptions2(cards, level)[0] || null;
      }
      function beats2(candidate, previous) {
        if (!candidate) return false;
        if (!previous) return true;
        const candidateTier = tierOf(candidate);
        const previousTier = tierOf(previous);
        if (candidateTier !== previousTier) return candidateTier > previousTier;
        if (candidateTier > 0) return candidate.type === "straightFlush" ? candidate.mainRank > previous.mainRank : candidate.power > previous.power;
        if (SEQUENCE_TYPES.has(candidate.type) && candidate.type === previous.type) return candidate.mainRank > previous.mainRank;
        return candidate.type === previous.type && candidate.size === previous.size && candidate.power > previous.power;
      }
      function generateMoves(hand, level) {
        const byRank = /* @__PURE__ */ new Map();
        const wild = hand.filter((card) => card.rank === level && card.suit === "H");
        for (const card of hand) {
          if (wild.includes(card)) continue;
          if (!byRank.has(card.rank)) byRank.set(card.rank, []);
          byRank.get(card.rank).push(card);
        }
        const moves = /* @__PURE__ */ new Map();
        function add(cards) {
          if (!cards || !cards.length) return;
          const physicalKey = cards.map((card) => card.id).sort().join("|");
          for (const move of classifyOptions2(cards, level)) {
            const key = `${physicalKey}:${moveKey2(move)}`;
            if (!moves.has(key)) moves.set(key, { cards: cards.slice(), ...move });
          }
        }
        for (const card of hand) add([card]);
        for (const [rank, group] of byRank) {
          for (let size = 2; size <= Math.min(10, group.length + wild.length); size += 1) {
            for (let wc = 0; wc <= Math.min(wild.length, size); wc += 1) {
              if (group.length >= size - wc && size - wc > 0) add(group.slice(0, size - wc).concat(wild.slice(0, wc)));
            }
          }
        }
        if (wild.length === 2) add(wild);
        for (const [tripleRank, tripleGroup] of byRank) {
          if (tripleRank >= 16) continue;
          for (const [pairRank, pairGroup] of byRank) {
            if (pairRank === tripleRank) continue;
            for (let tripleWild = 0; tripleWild <= wild.length; tripleWild += 1) {
              const pairWild = Math.max(0, 2 - pairGroup.length);
              if (tripleGroup.length < 3 - tripleWild || tripleWild + pairWild > wild.length) continue;
              add(tripleGroup.slice(0, 3 - tripleWild).concat(pairGroup.slice(0, 2 - pairWild)).concat(wild.slice(0, tripleWild + pairWild)));
            }
          }
        }
        for (const runLength of [5, 3, 2]) {
          const copies = runLength === 5 ? 1 : runLength === 3 ? 2 : 3;
          const sequences = [];
          for (let start = 2; start <= 15 - runLength; start += 1) sequences.push(Array.from({ length: runLength }, (_, i) => start + i));
          sequences.push(runLength === 5 ? [14, 2, 3, 4, 5] : runLength === 3 ? [14, 2, 3] : [14, 2]);
          for (const sequence of sequences) {
            const selected2 = [];
            for (const rank of sequence) selected2.push(...(byRank.get(rank) || []).slice(0, copies));
            const missing = runLength * copies - selected2.length;
            if (missing >= 0 && missing <= wild.length) add(selected2.concat(wild.slice(0, missing)));
            if (runLength === 5) {
              for (const suit of ["S", "H", "C", "D"]) {
                const suited = [];
                for (const rank of sequence) {
                  const card = (byRank.get(rank) || []).find((item) => item.suit === suit);
                  if (card) suited.push(card);
                }
                const suitMissing = 5 - suited.length;
                if (suitMissing >= 0 && suitMissing <= wild.length) add(suited.concat(wild.slice(0, suitMissing)));
              }
            }
          }
        }
        const jokers = hand.filter((card) => card.rank >= 16);
        if (jokers.length === 4) add(jokers);
        return [...moves.values()];
      }
      function legalMoves(hand, level, previous) {
        return generateMoves(hand, level).filter((move) => beats2(move, previous));
      }
      module.exports = { TYPE_LABELS: TYPE_LABELS2, classify, classifyOptions: classifyOptions2, moveKey: moveKey2, beats: beats2, generateMoves, legalMoves };
    }
  });

  // web/no-rule-coach.js
  var require_no_rule_coach = __commonJS({
    "web/no-rule-coach.js"(exports, module) {
      function recommend() {
        return { actions: [], note: "" };
      }
      module.exports = { recommend };
    }
  });

  // web/solo-bot.js
  var require_solo_bot = __commonJS({
    "web/solo-bot.js"(exports, module) {
      var { rankPower, legalReturnCards: legalReturnCards2 } = require_cards();
      var DIFFICULTIES = ["danlm"];
      function handQuality(hand, level) {
        const counts = /* @__PURE__ */ new Map();
        let control = 0;
        for (const card of hand) {
          counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
          const power = rankPower(card.rank, level);
          if (power >= 15) control += 0.75;
          else if (power >= 13) control += 0.35;
        }
        let groups = 0;
        for (const count of counts.values()) {
          if (count >= 2) groups += Math.min(count - 1, 3) * 0.65;
          if (count >= 4) groups += 1.4;
        }
        let runs = 0;
        for (let start = 2; start <= 10; start += 1) {
          let distinct = 0;
          let pairs = 0;
          for (let rank = start; rank < start + 5; rank += 1) {
            if (counts.get(rank)) distinct += 1;
            if (counts.get(rank) >= 2) pairs += 1;
          }
          runs = Math.max(runs, distinct >= 4 ? distinct * 0.35 : 0);
          if (pairs >= 3) runs += 0.35;
        }
        return -hand.length * 2.3 + groups + runs + control;
      }
      function chooseReturnCard(view) {
        return legalReturnCards2(view.hand, view.levelRank).sort((a, b) => {
          const aQuality = handQuality(view.hand.filter((card) => card.id !== a.id), view.levelRank) - rankPower(a.rank, view.levelRank) * 0.15;
          const bQuality = handQuality(view.hand.filter((card) => card.id !== b.id), view.levelRank) - rankPower(b.rank, view.levelRank) * 0.15;
          return bQuality - aQuality || rankPower(a.rank, view.levelRank) - rankPower(b.rank, view.levelRank);
        })[0];
      }
      function chooseBotAction() {
        throw new Error("\u8BF7\u4F7F\u7528\u96BE\u5EA6\u56DB\u6A21\u578B\u7EBF\u7A0B\u51FA\u724C");
      }
      module.exports = { DIFFICULTIES, chooseBotAction, chooseReturnCard };
    }
  });

  // miniprogram/lib/match.js
  var require_match = __commonJS({
    "miniprogram/lib/match.js"(exports, module) {
      var { createDeck, shuffle, sortCards: sortCards2, rankPower, legalReturnCards: legalReturnCards2, cardLabel: cardLabel2 } = require_cards();
      var { classifyOptions: classifyOptions2, moveKey: moveKey2, beats: beats2 } = require_rules();
      var { recommend } = require_no_rule_coach();
      var { DIFFICULTIES, chooseBotAction, chooseReturnCard } = require_solo_bot();
      function teamOf(seat) {
        return seat % 2;
      }
      function partnerOf(seat) {
        return (seat + 2) % 4;
      }
      function nextActive(state, seat) {
        for (let step = 1; step <= 4; step += 1) {
          const next = (seat + step) % 4;
          if (!state.finishOrder.includes(next)) return next;
        }
        return null;
      }
      function cardExists(hand, id) {
        return hand.find((card) => card.id === id);
      }
      function rankHighest(cards, level) {
        return cards.slice().sort((a, b) => rankPower(b.rank, level) - rankPower(a.rank, level) || b.rank - a.rank)[0];
      }
      function addEvent(state, event) {
        state.events.push({ number: state.events.length + 1, handNumber: state.handNumber, ...event });
      }
      function createMatch2(players, random = Math.random) {
        if (!Array.isArray(players) || players.length !== 4) throw new Error("\u4E00\u684C\u5FC5\u987B\u6709\u56DB\u4E2A\u5EA7\u4F4D");
        const state = {
          players: players.map((player, seat) => ({ id: player.id, name: player.name, bot: !!player.bot, difficulty: player.bot ? DIFFICULTIES.includes(player.difficulty) ? player.difficulty : "simple" : null, seat })),
          levels: [2, 2],
          levelRank: 2,
          handNumber: 0,
          hands: [[], [], [], []],
          phase: "between",
          turn: null,
          lastPlay: null,
          lastSeat: null,
          passes: 0,
          finishOrder: [],
          previousOrder: null,
          pendingReturns: [],
          events: [],
          winnerTeam: null,
          handResults: [],
          decisionSnapshots: [],
          reviewsBySeat: [[], [], [], []]
        };
        startNextHand2(state, random);
        return state;
      }
      function startNextHand2(state, random = Math.random) {
        if (state.phase !== "between") throw new Error("\u5F53\u524D\u4E0D\u80FD\u5F00\u59CB\u4E0B\u4E00\u526F");
        state.handNumber += 1;
        state.hands = [[], [], [], []];
        const deck = shuffle(createDeck(), random);
        deck.forEach((card, index) => state.hands[index % 4].push(card));
        state.hands = state.hands.map((hand) => sortCards2(hand, state.levelRank));
        state.finishOrder = [];
        state.lastPlay = null;
        state.lastSeat = null;
        state.passes = 0;
        state.pendingReturns = [];
        state.phase = "playing";
        state.turn = state.previousOrder ? state.previousOrder[0] : Math.floor(random() * 4);
        addEvent(state, { type: "deal", level: state.levelRank });
        if (!state.previousOrder) return state;
        const prior = state.previousOrder;
        const payers = teamOf(prior[0]) === teamOf(prior[1]) ? prior.slice(2) : [prior[3]];
        const recipients = payers.length === 2 ? prior.slice(0, 2) : [prior[0]];
        if (payers.reduce((count, seat) => count + state.hands[seat].filter((card) => card.rank === 17).length, 0) === 2) {
          addEvent(state, { type: "antiTribute", seats: payers });
          return state;
        }
        const offerings = payers.map((payer) => {
          const eligible = state.hands[payer].filter((card) => !(card.rank === state.levelRank && card.suit === "H"));
          return { payer, card: rankHighest(eligible, state.levelRank) };
        }).sort((a, b) => rankPower(b.card.rank, state.levelRank) - rankPower(a.card.rank, state.levelRank) || (payers.length === 2 ? prior.indexOf(b.payer) - prior.indexOf(a.payer) : 0));
        const tiedDoubleTribute = offerings.length === 2 && rankPower(offerings[0].card.rank, state.levelRank) === rankPower(offerings[1].card.rank, state.levelRank);
        offerings.forEach((offering, index) => {
          const receiver = recipients[index];
          state.hands[offering.payer] = state.hands[offering.payer].filter((card) => card.id !== offering.card.id);
          state.hands[receiver].push(offering.card);
          state.pendingReturns.push({ payer: offering.payer, receiver, tributeCard: offering.card });
          addEvent(state, { type: "tribute", seat: offering.payer, to: receiver, cards: [offering.card] });
        });
        state.turn = tiedDoubleTribute ? (prior[0] + 1) % 4 : offerings[0].payer;
        state.phase = "returning";
        return state;
      }
      function returnTribute2(state, seat, cardId) {
        if (state.phase !== "returning") throw new Error("\u5F53\u524D\u65E0\u9700\u8FD8\u8D21");
        const index = state.pendingReturns.findIndex((item) => item.receiver === seat);
        if (index < 0) throw new Error("\u4E0D\u662F\u4F60\u7684\u8FD8\u8D21\u56DE\u5408");
        const pending = state.pendingReturns[index];
        const card = cardExists(state.hands[seat], cardId);
        if (!card || !legalReturnCards2(state.hands[seat], state.levelRank).some((item) => item.id === cardId)) {
          throw new Error("\u8BF7\u9009\u62E9\u4E00\u5F20\u5408\u6CD5\u8FD8\u8D21\u724C\uFF08\u901A\u5E38\u4E3A\u4E0D\u8D85\u8FC710\u7684\u975E\u7EA7\u724C\uFF09");
        }
        state.hands[seat] = state.hands[seat].filter((item) => item.id !== cardId);
        state.hands[pending.payer].push(card);
        addEvent(state, { type: "return", seat, to: pending.payer, cards: [card], privateTo: [seat, pending.payer] });
        state.pendingReturns.splice(index, 1);
        if (!state.pendingReturns.length) state.phase = "playing";
        return state;
      }
      function settleHand(state) {
        const order = state.finishOrder.slice();
        for (let seat = 0; seat < 4; seat += 1) if (!order.includes(seat)) order.push(seat);
        const first = order[0];
        const team = teamOf(first);
        const teammatePlace = order.indexOf(partnerOf(first)) + 1;
        const climbed = teammatePlace === 2 ? 3 : teammatePlace === 3 ? 2 : 1;
        const wasAtA = state.levels[team] === 14;
        const passedA = wasAtA && teammatePlace < 4;
        if (passedA) {
          state.winnerTeam = team;
          state.phase = "complete";
        } else {
          state.levels[team] = Math.min(14, state.levels[team] + climbed);
          state.levelRank = state.levels[team];
          state.phase = "between";
        }
        state.previousOrder = order;
        const result = { handNumber: state.handNumber, order, team, climbed, levels: state.levels.slice(), passedA };
        state.handResults.push(result);
        addEvent(state, { type: "handEnd", ...result });
        for (const snapshot of state.decisionSnapshots.filter((item) => item.handNumber === state.handNumber)) {
          const event = state.events.find((item) => item.number === snapshot.eventNumber);
          const advice = recommend(snapshot.visible, snapshot.seat);
          state.reviewsBySeat[snapshot.seat].push({
            handNumber: snapshot.handNumber,
            eventNumber: snapshot.eventNumber,
            actual: event.type === "pass" ? "\u8FC7\u724C" : event.cards.map((card) => card.id).join(","),
            actualLabel: event.type === "pass" ? "\u8FC7\u724C" : event.cards.map(cardLabel2).join(" "),
            handAtTime: snapshot.visible.hand,
            lastPlayAtTime: snapshot.visible.lastPlay,
            handCountsAtTime: snapshot.visible.handCounts,
            advice: advice.actions[0] || null,
            alternatives: advice.actions,
            note: advice.note
          });
        }
      }
      function recordDecision(state, seat) {
        if (state.captureReviews === false) return;
        state.decisionSnapshots.push({
          seat,
          handNumber: state.handNumber,
          eventNumber: state.events.length + 1,
          visible: {
            phase: state.phase,
            turn: state.turn,
            hand: state.hands[seat].slice(),
            handCounts: state.hands.map((hand) => hand.length),
            levelRank: state.levelRank,
            levels: state.levels.slice(),
            lastPlay: state.lastPlay,
            lastSeat: state.lastSeat,
            finishOrder: state.finishOrder.slice()
          }
        });
      }
      function play2(state, seat, cardIds, declaration = null) {
        if (state.phase !== "playing") throw new Error("\u5F53\u524D\u4E0D\u80FD\u51FA\u724C");
        if (state.turn !== seat) throw new Error("\u8FD8\u6CA1\u8F6E\u5230\u4F60");
        if (!Array.isArray(cardIds) || !cardIds.length || new Set(cardIds).size !== cardIds.length) throw new Error("\u8BF7\u9009\u62E9\u8981\u51FA\u7684\u724C");
        const cards = cardIds.map((id) => cardExists(state.hands[seat], id));
        if (cards.some((card) => !card)) throw new Error("\u6240\u9009\u724C\u4E0D\u5728\u4F60\u7684\u624B\u91CC");
        const options = classifyOptions2(cards, state.levelRank);
        const move = declaration ? options.find((option) => moveKey2(option) === moveKey2(declaration)) : options[0];
        if (declaration && !move) throw new Error("\u6240\u9009\u724C\u578B\u4E0E\u8FD9\u7EC4\u724C\u4E0D\u7B26");
        if (!move) throw new Error("\u8FD9\u4E0D\u662F\u6709\u6548\u724C\u578B");
        if (!beats2(move, state.lastPlay)) throw new Error("\u8FD9\u624B\u724C\u538B\u4E0D\u8FC7\u684C\u9762\u4E0A\u7684\u724C");
        recordDecision(state, seat);
        const used = new Set(cardIds);
        state.hands[seat] = state.hands[seat].filter((card) => !used.has(card.id));
        state.lastPlay = move;
        state.lastSeat = seat;
        state.passes = 0;
        addEvent(state, { type: "play", seat, cards, move });
        if (!state.hands[seat].length) {
          state.finishOrder.push(seat);
          addEvent(state, { type: "finish", seat, place: state.finishOrder.length });
          if (state.finishOrder.length === 2 && teamOf(state.finishOrder[0]) === teamOf(state.finishOrder[1])) {
            settleHand(state);
            return state;
          }
          if (state.finishOrder.length === 3) {
            settleHand(state);
            return state;
          }
        }
        state.turn = nextActive(state, seat);
        return state;
      }
      function pass2(state, seat) {
        if (state.phase !== "playing" || state.turn !== seat) throw new Error("\u5F53\u524D\u4E0D\u80FD\u8FC7\u724C");
        if (!state.lastPlay) throw new Error("\u4F60\u9700\u8981\u9886\u51FA\u4E00\u624B\u724C");
        recordDecision(state, seat);
        state.passes += 1;
        addEvent(state, { type: "pass", seat });
        const active = 4 - state.finishOrder.length;
        const needed = active - (state.finishOrder.includes(state.lastSeat) ? 0 : 1);
        if (state.passes >= needed) {
          const lead = state.finishOrder.includes(state.lastSeat) ? partnerOf(state.lastSeat) : state.lastSeat;
          state.turn = state.finishOrder.includes(lead) ? nextActive(state, lead) : lead;
          state.lastPlay = null;
          state.lastSeat = null;
          state.passes = 0;
          addEvent(state, { type: "trickEnd", seat: state.turn });
        } else {
          state.turn = nextActive(state, seat);
        }
        return state;
      }
      function autoAction2(state) {
        if (state.phase === "returning") {
          const pending = state.pendingReturns.find((item) => state.players[item.receiver].bot);
          if (!pending) return false;
          const choice = chooseReturnCard(viewFor2(state, pending.receiver), state.players[pending.receiver].difficulty);
          if (!choice) throw new Error("\u7535\u8111\u73A9\u5BB6\u6CA1\u6709\u5408\u6CD5\u8FD8\u8D21\u724C");
          returnTribute2(state, pending.receiver, choice.id);
          return true;
        }
        if (state.phase !== "playing" || !state.players[state.turn].bot) return false;
        const seat = state.turn;
        const action = chooseBotAction(viewFor2(state, seat), state.players[seat].difficulty);
        if (action.pass) pass2(state, seat);
        else play2(state, seat, action.cardIds, action.declaration);
        return true;
      }
      function viewFor2(state, seat) {
        return {
          players: state.players,
          levels: state.levels,
          levelRank: state.levelRank,
          handNumber: state.handNumber,
          phase: state.phase,
          turn: state.turn,
          passes: state.passes,
          hand: seat === null ? [] : sortCards2(state.hands[seat], state.levelRank),
          handCounts: state.hands.map((hand) => hand.length),
          lastPlay: state.lastPlay,
          lastSeat: state.lastSeat,
          finishOrder: state.finishOrder,
          winnerTeam: state.winnerTeam,
          pendingReturn: seat === null ? null : state.pendingReturns.find((item) => item.receiver === seat) || null,
          handResults: state.handResults,
          reviews: seat === null ? [] : state.reviewsBySeat[seat],
          events: state.events.map((event) => {
            if (!event.privateTo || event.privateTo.includes(seat)) return event;
            return { ...event, cards: void 0 };
          })
        };
      }
      module.exports = { createMatch: createMatch2, startNextHand: startNextHand2, returnTribute: returnTribute2, legalReturnCards: legalReturnCards2, play: play2, pass: pass2, autoAction: autoAction2, viewFor: viewFor2, teamOf };
    }
  });

  // miniprogram/lib/planner.js
  var require_planner = __commonJS({
    "miniprogram/lib/planner.js"(exports, module) {
      var { generateMoves, TYPE_LABELS: TYPE_LABELS2 } = require_rules();
      var { cardLabel: cardLabel2 } = require_cards();
      var STRATEGIES = [
        { id: "fewest", title: "\u6210\u7EC4\u4F18\u5148", description: "\u4F18\u5148\u6574\u7406\u80FD\u4E00\u6B21\u6253\u51FA\u7684\u591A\u5F20\u724C\u3002" },
        { id: "reserve", title: "\u4FDD\u7559\u63A7\u5236\u724C", description: "\u5148\u6574\u7406\u666E\u901A\u724C\u578B\uFF0C\u628A\u70B8\u5F39\u7559\u4F5C\u540E\u624B\u3002" },
        { id: "small", title: "\u5148\u8D70\u5C0F\u724C", description: "\u4F18\u5148\u5904\u7406\u8F83\u96BE\u5355\u72EC\u638C\u63A7\u7684\u5C0F\u724C\u3002" }
      ];
      function moveScore(move, strategy) {
        const bomb = move.tier > 0;
        if (strategy === "reserve") return move.size * 12 - (bomb ? 100 : 0) - move.power / 10;
        if (strategy === "small") return move.size * 8 - move.power - (bomb ? 30 : 0);
        return move.size * 15 + (move.type === "straight" || move.type === "pairsRun" || move.type === "triplesRun" ? 7 : 0) - (bomb ? 5 : 0);
      }
      function planForStrategy(hand, moves, strategy, level, forcedMove = null) {
        const remaining = new Map(hand.map((card) => [card.id, card]));
        const groups = [];
        function take(chosen) {
          groups.push({
            type: chosen.type,
            label: TYPE_LABELS2[chosen.type],
            cards: chosen.cards,
            text: chosen.cards.map(cardLabel2).join(" "),
            usesWildcard: chosen.cards.some((card) => card.rank === level && card.suit === "H")
          });
          for (const card of chosen.cards) remaining.delete(card.id);
        }
        if (forcedMove) take(forcedMove);
        while (remaining.size) {
          const usable = moves.filter((move) => move.cards.every((card) => remaining.has(card.id)));
          if (!usable.length) break;
          usable.sort((a, b) => moveScore(b, strategy) - moveScore(a, strategy) || b.size - a.size);
          const chosen = usable[0];
          take(chosen);
        }
        return groups;
      }
      function openingAnalysis2(hand, level) {
        const moves = generateMoves(hand, level);
        const plans = [];
        const signatures = /* @__PURE__ */ new Set();
        function addPlan(strategy, groups) {
          const signature = groups.map((group) => group.cards.map((card) => card.id).sort().join(",")).sort().join("|");
          if (signatures.has(signature)) return;
          signatures.add(signature);
          plans.push({ ...strategy, groups, handCount: groups.length });
        }
        for (const strategy of STRATEGIES) {
          const groups = planForStrategy(hand, moves, strategy.id, level);
          addPlan(strategy, groups);
        }
        if (plans.length < 3) {
          const alternatives = moves.filter((move) => move.size >= 2).sort((a, b) => b.size - a.size || b.tier - a.tier);
          for (const move of alternatives) {
            if (plans.length >= 3) break;
            const groups = planForStrategy(hand, moves, "fewest", level, move);
            addPlan({ id: `alternate-${plans.length}-${move.cards.map((card) => card.id).join("-")}`, title: `${TYPE_LABELS2[move.type]}\u8DEF\u7EBF`, description: `\u4EE5\u8FD9\u7EC4${TYPE_LABELS2[move.type]}\u4E3A\u8D77\u70B9\uFF0C\u91CD\u65B0\u5B89\u6392\u5176\u4F59\u624B\u724C\u3002` }, groups);
          }
        }
        const highlights = moves.filter((move) => ["bomb", "straightFlush", "jokerBomb", "straight", "pairsRun", "triplesRun"].includes(move.type)).sort((a, b) => b.tier - a.tier || b.size - a.size || b.power - a.power).slice(0, 8).map((move) => ({
          label: TYPE_LABELS2[move.type],
          text: move.cards.map(cardLabel2).join(" "),
          usesWildcard: move.cards.some((card) => card.rank === level && card.suit === "H")
        }));
        return { plans, highlights };
      }
      module.exports = { openingAnalysis: openingAnalysis2 };
    }
  });

  // web/model-review.js
  var require_model_review = __commonJS({
    "web/model-review.js"(exports, module) {
      function reviewView2(review, currentView) {
        if (!review || !Array.isArray(review.handAtTime) || !Array.isArray(review.handCountsAtTime)) return null;
        const events = (currentView.events || []).filter((event) => event.number < review.eventNumber);
        const deal = events.find((event) => event.type === "deal" && event.handNumber === review.handNumber);
        if (!deal) return null;
        const previousEnd = [...events].reverse().find((event) => event.type === "handEnd");
        const levels = previousEnd?.levels || [2, 2];
        const finishOrder = events.filter((event) => event.handNumber === review.handNumber && event.type === "finish").map((event) => event.seat);
        return {
          turn: 0,
          handNumber: review.handNumber,
          hand: review.handAtTime,
          handCounts: review.handCountsAtTime,
          levelRank: deal.level,
          levels,
          lastPlay: review.lastPlayAtTime,
          finishOrder,
          events
        };
      }
      function reviewActual2(review, currentView) {
        const event = (currentView.events || []).find((item) => item.number === review.eventNumber);
        if (!event || event.seat !== 0) return null;
        if (event.type === "pass") return { pass: true };
        if (event.type === "play" && Array.isArray(event.cards)) {
          return {
            pass: false,
            cardIds: event.cards.map((card) => card.id),
            declaration: event.move && { type: event.move.type, mainRank: event.move.mainRank, size: event.move.size }
          };
        }
        return null;
      }
      module.exports = { reviewView: reviewView2, reviewActual: reviewActual2 };
    }
  });

  // web/round-history.js
  var require_round_history = __commonJS({
    "web/round-history.js"(exports, module) {
      function roundsForHand2(events, handNumber) {
        const rounds = [];
        let current = null;
        for (const event of events || []) {
          if (event.handNumber !== handNumber) continue;
          if (event.type === "play" || event.type === "pass") {
            if (!current) current = { number: rounds.length + 1, actions: [], completed: false, winnerSeat: null };
            current.actions.push(event);
            if (event.type === "play") current.winnerSeat = event.seat;
          } else if ((event.type === "trickEnd" || event.type === "handEnd") && current) {
            current.completed = true;
            rounds.push(current);
            current = null;
          }
        }
        if (current) rounds.push(current);
        return rounds;
      }
      module.exports = { roundsForHand: roundsForHand2 };
    }
  });

  // web/model-reasons.js
  var require_model_reasons = __commonJS({
    "web/model-reasons.js"(exports, module) {
      function modelChoiceReason2(choice, view) {
        const lastSeat = view.lastSeat;
        const partnerLeads = lastSeat === 2;
        const opponentLeads = lastSeat === 1 || lastSeat === 3;
        const opponentCount = opponentLeads ? view.handCounts?.[lastSeat] : null;
        if (choice.pass) {
          if (partnerLeads) return "\u961F\u53CB\u6B63\u5360\u7740\u8FD9\u4E00\u8F6E\uFF1B\u8FC7\u724C\u4E0D\u4F1A\u6D88\u8017\u4F60\u7684\u624B\u724C\uFF0C\u4E5F\u4E0D\u4F1A\u4E3B\u52A8\u538B\u8FC7\u961F\u53CB\u3002";
          if (opponentCount != null && opponentCount <= 5) return `\u4E0D\u6D88\u8017\u624B\u724C\uFF0C\u4F46\u5F53\u524D\u538B\u4F4F\u724C\u684C\u7684\u5BF9\u624B\u53EA\u5269 ${opponentCount} \u5F20\uFF1B\u8FD9\u4E00\u8F6E\u6682\u4E0D\u4E89\u724C\u6743\u3002`;
          return "\u4E0D\u6D88\u8017\u624B\u724C\uFF0C\u4FDD\u7559\u73B0\u6709\u7EC4\u5408\uFF1B\u4EE3\u4EF7\u662F\u8FD9\u4E00\u8F6E\u6682\u4E0D\u4E89\u724C\u6743\u3002";
        }
        const used = new Set(choice.cardIds || []);
        const count = used.size;
        const remaining = Math.max(0, (view.hand?.length || 0) - count);
        if (!count) return "\u8FD9\u624B\u724C\u7684\u53EF\u89C1\u5229\u5F0A\u6682\u65F6\u65E0\u6CD5\u8BA1\u7B97\u3002";
        let reason;
        if (remaining === 0) reason = "\u8FD9\u624B\u53EF\u4EE5\u51FA\u5B8C\u4F60\u5269\u4F59\u7684\u5168\u90E8\u624B\u724C\u3002";
        else if (partnerLeads) reason = `\u4E00\u6B21\u8D70\u6389 ${count} \u5F20\uFF0C\u4F46\u4F1A\u538B\u8FC7\u961F\u53CB\u5F53\u524D\u7684\u724C\uFF0C\u9700\u8981\u6743\u8861\u56E2\u961F\u724C\u6743\u3002`;
        else if (opponentCount != null && opponentCount <= 5) reason = `\u5F53\u524D\u538B\u4F4F\u724C\u684C\u7684\u5BF9\u624B\u53EA\u5269 ${opponentCount} \u5F20\uFF1B\u8FD9\u624B\u53EF\u4EE5\u538B\u4F4F\u5F53\u524D\u51FA\u724C\uFF0C\u4E89\u593A\u724C\u6743\u3002`;
        else if (opponentLeads) reason = `\u8FD9\u624B\u53EF\u4EE5\u538B\u4F4F\u5BF9\u624B\uFF0C\u4E89\u593A\u4E0B\u4E00\u624B\u7684\u9886\u51FA\u673A\u4F1A\uFF1B\u540C\u65F6\u8D70\u6389 ${count} \u5F20\u3002`;
        else reason = `\u4F60\u6765\u9886\u51FA\uFF0C\u4E00\u6B21\u8D70\u6389 ${count} \u5F20\uFF1B\u51FA\u5B8C\u540E\u8FD8\u5269 ${remaining} \u5F20\u3002`;
        const type = choice.declaration?.type;
        if (type === "bomb") reason += " \u9700\u8981\u7528\u6389\u4E00\u7EC4\u70B8\u5F39\u3002";
        else if (type === "straightFlush") reason += " \u9700\u8981\u7528\u6389\u4E00\u7EC4\u540C\u82B1\u987A\u3002";
        else if (type === "jokerBomb") reason += " \u9700\u8981\u7528\u6389\u56DB\u738B\u70B8\u3002";
        if ((view.hand || []).some((card) => used.has(card.id) && card.rank === view.levelRank && card.suit === "H") && count > 2) {
          reason += " \u5176\u4E2D\u7528\u5230\u4E86\u9022\u4EBA\u914D\u3002";
        }
        return reason;
      }
      module.exports = { modelChoiceReason: modelChoiceReason2 };
    }
  });

  // web/app.js
  var { createMatch, startNextHand, returnTribute, play, pass, autoAction, viewFor } = require_match();
  var { cardLabel, sortCards, legalReturnCards } = require_cards();
  var { classifyOptions, moveKey, beats, TYPE_LABELS } = require_rules();
  var { openingAnalysis } = require_planner();
  var { reviewView, reviewActual } = require_model_review();
  var { roundsForHand } = require_round_history();
  var { modelChoiceReason } = require_model_reasons();
  var STORAGE = "guandan-web-solo-v1";
  var BOT_STEP_DELAY_MS = 1450;
  var BOT_CUE_DURATION_MS = 1300;
  var root = document.getElementById("app");
  var toast = document.getElementById("toast");
  var match = null;
  var screen = "home";
  var selected = /* @__PURE__ */ new Set();
  var selectedDeclarationKey = null;
  var cardOrder = [];
  var panel = "plans";
  var planId = null;
  var reviewNumber = null;
  var roundArchiveOpen = false;
  var opening = null;
  var openingHand = null;
  var botTimer = null;
  var botCueTimer = null;
  var recentBotAction = null;
  var botCueFresh = false;
  var toastTimer = null;
  var escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  var nameFor = (view, seat) => seat === 0 ? "\u4F60" : escapeHTML(view.players[seat].name);
  var levelName = (rank) => rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : String(rank);
  var seatTone = (seat) => seat % 2 === 0 ? "ally" : "rival";
  var modelWorkerInstance = null;
  var modelRequestNumber = 0;
  var botGeneration = 0;
  var modelError = null;
  var modelWorkerStage = null;
  var pendingModelRequests = /* @__PURE__ */ new Map();
  var liveModelAnalysis = null;
  var reviewModelAnalysis = /* @__PURE__ */ new Map();
  var MODEL_TIMEOUT_MS = { starting: 45e3, queued: 24e4, loading: 24e4, running: 9e4 };
  var MODEL_TIMEOUT_MESSAGE = {
    starting: "\u96BE\u5EA6\u56DB\u6A21\u578B\u7EBF\u7A0B\u542F\u52A8\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5",
    queued: "\u96BE\u5EA6\u56DB\u5206\u6790\u7B49\u5F85\u8FC7\u4E45\uFF0C\u8BF7\u91CD\u8BD5",
    loading: "\u96BE\u5EA6\u56DB\u6A21\u578B\u52A0\u8F7D\u8D85\u65F6\uFF08\u9996\u6B21\u7EA6\u9700\u4E0B\u8F7D 30 MB\uFF09\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
    running: "\u96BE\u5EA6\u56DB\u63A8\u7406\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5"
  };
  function armModelTimeout(pending, stage) {
    clearTimeout(pending.timer);
    pending.stage = stage;
    pending.timer = setTimeout(() => {
      if (modelWorkerInstance === pending.worker) stopModelWorker(MODEL_TIMEOUT_MESSAGE[stage]);
    }, MODEL_TIMEOUT_MS[stage]);
  }
  function stopModelWorker(message) {
    const worker = modelWorkerInstance;
    for (const [id, pending] of pendingModelRequests) {
      if (pending.worker !== worker) continue;
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
      pendingModelRequests.delete(id);
    }
    worker?.terminate();
    modelWorkerInstance = null;
    modelWorkerStage = null;
  }
  function modelWorker() {
    if (modelWorkerInstance) return modelWorkerInstance;
    if (typeof Worker === "undefined") throw new Error("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u51FA\u724C\u5206\u6790\u6240\u9700\u7684\u540E\u53F0\u7EBF\u7A0B");
    const worker = new Worker(new URL("./dist/danlm-worker.js?v=20261007-timeout-fix", document.baseURI));
    worker.onmessage = (event) => {
      const pending = pendingModelRequests.get(event.data.id);
      if (!pending) return;
      if (event.data.stage) {
        modelWorkerStage = event.data.stage;
        armModelTimeout(pending, event.data.stage);
        pending.onProgress?.(event.data.stage);
        return;
      }
      pendingModelRequests.delete(event.data.id);
      clearTimeout(pending.timer);
      modelWorkerStage = null;
      if (event.data.error) pending.reject(new Error(event.data.error));
      else pending.resolve(event.data.analysis ?? event.data.action);
    };
    worker.onerror = () => {
      if (modelWorkerInstance === worker) stopModelWorker("\u96BE\u5EA6\u56DB\u6A21\u578B\u7EBF\u7A0B\u672A\u80FD\u542F\u52A8");
    };
    modelWorkerInstance = worker;
    return worker;
  }
  function requestModel(mode, view, actual = null, onProgress = null) {
    return new Promise((resolve, reject) => {
      const worker = modelWorker();
      const id = ++modelRequestNumber;
      const pending = { resolve, reject, timer: null, worker, onProgress };
      pendingModelRequests.set(id, pending);
      armModelTimeout(pending, "starting");
      worker.postMessage({ id, mode, view, actual });
    });
  }
  function requestModelAction(view, onProgress = null) {
    return requestModel("action", view, null, onProgress);
  }
  function requestModelAnalysis(view, actual = null, onProgress = null) {
    return requestModel("analysis", view, actual, onProgress);
  }
  function inform(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }
  function save() {
    if (!match) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ match, cardOrder }));
    } catch {
      inform("\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u672C\u5730\u4FDD\u5B58\uFF1B\u672C\u5C40\u4ECD\u53EF\u7EE7\u7EED\u73A9\u3002");
    }
  }
  function savedGame() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if (value?.match?.players?.length === 4 && Array.isArray(value.match.hands) && value.match.hands.length === 4) {
        for (const player of value.match.players) if (player.bot) player.difficulty = "danlm";
        return value;
      }
    } catch {
    }
    return null;
  }
  function clearSelection() {
    selected.clear();
    selectedDeclarationKey = null;
  }
  function clearBotCue() {
    clearTimeout(botCueTimer);
    recentBotAction = null;
    botCueFresh = false;
  }
  function showBotCue(events) {
    const action = events.find((event) => ["play", "pass", "return"].includes(event.type) && event.seat !== 0);
    if (!action) return;
    clearTimeout(botCueTimer);
    recentBotAction = {
      seat: action.seat,
      type: action.type,
      label: action.type === "play" ? `\u6253\u51FA${TYPE_LABELS[action.move?.type] || "\u4E00\u624B\u724C"}` : action.type === "pass" ? "\u8FC7\u724C" : "\u8FD8\u8D21"
    };
    botCueFresh = true;
    botCueTimer = setTimeout(() => {
      recentBotAction = null;
      if (screen === "game") render();
    }, BOT_CUE_DURATION_MS);
  }
  function visible() {
    return viewFor(match, 0);
  }
  function currentDecisionKey(view) {
    return `${view.handNumber}:${view.events.length}`;
  }
  function resetModelAssistance() {
    liveModelAnalysis = null;
    reviewModelAnalysis = /* @__PURE__ */ new Map();
  }
  function ensureModelAssistance() {
    if (screen !== "game" || !match || document.hidden) return;
    const view = visible();
    const currentMatch = match;
    if (panel === "advice" && view.phase === "playing" && view.turn === 0) {
      const key = currentDecisionKey(view);
      if (liveModelAnalysis?.key === key) return;
      const attempt = /* @__PURE__ */ Symbol("live-analysis");
      liveModelAnalysis = { key, attempt, status: "loading" };
      requestModelAnalysis(view, null, (stage) => {
        if (match !== currentMatch || liveModelAnalysis?.attempt !== attempt) return;
        liveModelAnalysis = { key, attempt, status: "loading", stage };
        if (screen === "game" && panel === "advice") render();
      }).then((result) => {
        if (match !== currentMatch || liveModelAnalysis?.attempt !== attempt) return;
        liveModelAnalysis = { key, attempt, status: "ready", result };
        if (screen === "game" && panel === "advice") render();
      }).catch((error) => {
        if (document.hidden || match !== currentMatch || liveModelAnalysis?.attempt !== attempt) return;
        liveModelAnalysis = { key, attempt, status: "error", error: error.message };
        if (screen === "game" && panel === "advice") render();
      });
    }
    if (panel === "history" && reviewNumber != null && !reviewModelAnalysis.has(reviewNumber)) {
      const review = view.reviews.find((item) => item.eventNumber === reviewNumber);
      if (!review) return;
      const pastView = reviewView(review, view);
      const actual = reviewActual(review, view);
      if (!pastView || !actual) {
        reviewModelAnalysis.set(reviewNumber, { status: "unavailable" });
        render();
        return;
      }
      const number = reviewNumber;
      const attempt = /* @__PURE__ */ Symbol("review-analysis");
      reviewModelAnalysis.set(number, { attempt, status: "loading" });
      requestModelAnalysis(pastView, actual, (stage) => {
        if (match !== currentMatch || reviewModelAnalysis.get(number)?.attempt !== attempt) return;
        reviewModelAnalysis.set(number, { attempt, status: "loading", stage });
        if (screen === "game" && panel === "history" && reviewNumber === number) render();
      }).then((result) => {
        if (match !== currentMatch || reviewModelAnalysis.get(number)?.attempt !== attempt) return;
        reviewModelAnalysis.set(number, { attempt, status: "ready", result });
        if (screen === "game" && panel === "history" && reviewNumber === number) render();
      }).catch((error) => {
        if (document.hidden || match !== currentMatch || reviewModelAnalysis.get(number)?.attempt !== attempt) return;
        reviewModelAnalysis.set(number, { attempt, status: "error", error: error.message });
        if (screen === "game" && panel === "history" && reviewNumber === number) render();
      });
    }
  }
  function modelActionLabel(choice, hand) {
    if (choice.pass) return "\u8FC7\u724C";
    const byId = new Map(hand.map((card) => [card.id, card]));
    const cards = choice.cardIds.map((id) => byId.get(id)).filter(Boolean);
    return `${TYPE_LABELS[choice.declaration?.type] || "\u51FA\u724C"} \xB7 ${cards.map(cardLabel).join(" ")}`;
  }
  function modelScore(score) {
    const value = Number(score);
    return (Math.abs(value) < 5e-3 ? 0 : value).toFixed(2);
  }
  function syncOrder(view) {
    const ids = new Set(view.hand.map((card) => card.id));
    cardOrder = cardOrder.filter((id) => ids.has(id));
    const ordered = sortCards(view.hand, view.levelRank).reverse();
    for (const card of ordered) if (!cardOrder.includes(card.id)) cardOrder.push(card.id);
    selected = new Set([...selected].filter((id) => ids.has(id)));
  }
  function getOpening(view) {
    if (openingHand !== view.handNumber) {
      opening = openingAnalysis(view.hand, view.levelRank);
      openingHand = view.handNumber;
      planId = opening.plans[0]?.id || null;
    }
    return opening;
  }
  function cardHTML(card, index) {
    const red = card.suit === "H" || card.suit === "D";
    const label = cardLabel(card);
    const wild = match && card.rank === match.levelRank && card.suit === "H";
    return `<button type="button" class="card ${red ? "red" : ""} ${selected.has(card.id) ? "selected" : ""} ${wild ? "wild" : ""}" data-action="card" data-id="${card.id}" aria-pressed="${selected.has(card.id)}" aria-label="${escapeHTML(label)}${wild ? "\uFF0C\u9022\u4EBA\u914D" : ""}${selected.has(card.id) ? "\uFF0C\u5DF2\u9009" : ""}"><span class="card-index">${index + 1}</span><span class="card-rank">${card.rank >= 16 ? card.rank === 17 ? "\u5927\u738B" : "\u5C0F\u738B" : levelName(card.rank)}</span><span class="card-suit">${card.suit === "J" ? "\u2605" : { S: "\u2660", H: "\u2665", C: "\u2663", D: "\u2666" }[card.suit]}</span>${wild ? '<span class="wild-mark">\u914D</span>' : ""}</button>`;
  }
  function eventText(event, view) {
    const who = event.seat == null ? "" : nameFor(view, event.seat);
    if (event.type === "deal") return `\u7B2C ${event.handNumber} \u526F\u53D1\u724C \xB7 \u6253 ${levelName(event.level)}`;
    if (event.type === "play") return `${who} \xB7 ${TYPE_LABELS[event.move?.type] || "\u51FA\u724C"} ${event.cards?.map(cardLabel).join(" ") || ""}`;
    if (event.type === "pass") return `${who} \xB7 \u8FC7\u724C`;
    if (event.type === "finish") return `${who} \xB7 \u7B2C ${event.place} \u540D\u8D70\u5B8C`;
    if (event.type === "trickEnd") return `\u4E00\u8F6E\u7ED3\u675F \xB7 ${nameFor(view, event.seat)}\u9886\u51FA`;
    if (event.type === "tribute") return `${who}\u5411${nameFor(view, event.to)}\u8FDB\u8D21 ${event.cards?.map(cardLabel).join(" ") || ""}`;
    if (event.type === "return") return `${who}\u5411${nameFor(view, event.to)}\u8FD8\u8D21 ${event.cards?.map(cardLabel).join(" ") || "\uFF08\u975E\u516C\u5F00\uFF09"}`;
    if (event.type === "antiTribute") return "\u53CC\u5927\u738B\u6297\u8D21";
    if (event.type === "handEnd") return `\u7B2C ${event.handNumber} \u526F\u7ED3\u675F \xB7 ${event.team === 0 ? "\u6211\u65B9" : "\u5BF9\u65B9"}\u5347\u7EA7 ${event.climbed} \u7EA7`;
    return event.type;
  }
  function roundActionHTML(event, index, view) {
    const cards = event.type === "play" ? (event.cards || []).map(cardLabel).join(" ") : "";
    return `<li class="round-action ${seatTone(event.seat)}"><span class="round-order">${String(index + 1).padStart(2, "0")}</span><span class="round-actor">${nameFor(view, event.seat)}</span><span class="round-action-detail">${event.type === "pass" ? "<em>\u8FC7\u724C</em>" : `<strong>${TYPE_LABELS[event.move?.type] || "\u51FA\u724C"}</strong><span class="round-card-text">${escapeHTML(cards)}</span>`}</span></li>`;
  }
  function roundBlockHTML(round, view, current = false) {
    const state = round.completed ? `\xB7 ${nameFor(view, round.winnerSeat)}\u6536\u4E0B` : "\xB7 \u8FDB\u884C\u4E2D";
    return `<div class="round-block ${current ? "round-current" : ""}"><div class="round-block-head"><strong>\u7B2C ${round.number} \u8F6E</strong><span>${state}</span></div><ol class="round-action-list">${round.actions.map((event, index) => roundActionHTML(event, index, view)).join("")}</ol></div>`;
  }
  function roundHistoryHTML(view) {
    const rounds = roundsForHand(view.events, view.handNumber);
    const latest = rounds[rounds.length - 1];
    const earlier = rounds.slice(0, -1).reverse();
    return `<section class="round-ledger" aria-label="\u672C\u526F\u51FA\u724C\u987A\u5E8F"><div class="round-ledger-head"><div><span class="eyebrow">THIS HAND</span><h2>\u672C\u526F\u51FA\u724C\u987A\u5E8F</h2></div><span class="round-count">${rounds.length} \u8F6E</span></div>${latest ? roundBlockHTML(latest, view, true) : '<p class="round-empty">\u8FD8\u6CA1\u6709\u4EBA\u51FA\u724C\uFF1B\u6BCF\u4E00\u6B65\u4F1A\u6309\u5148\u540E\u987A\u5E8F\u7559\u5728\u8FD9\u91CC\u3002</p>'}${earlier.length ? `<button class="round-archive-toggle" data-action="round-archive" aria-expanded="${roundArchiveOpen}">${roundArchiveOpen ? "\u6536\u8D77" : "\u56DE\u770B"}\u6B64\u524D ${earlier.length} \u8F6E <span aria-hidden="true">${roundArchiveOpen ? "\u2191" : "\u2193"}</span></button>${roundArchiveOpen ? `<div class="round-archive">${earlier.map((round) => roundBlockHTML(round, view)).join("")}</div>` : ""}` : ""}</section>`;
  }
  function homeHTML() {
    const saved = savedGame();
    return `<main class="home">
    <div class="home-grain" aria-hidden="true"></div>
    <header class="home-top"><div class="brand-mark">\u60EF<span>\u86CB</span></div><span class="eyebrow">A LITTLE GAME, A BETTER MOVE</span></header>
    <section class="home-hero"><div class="hero-copy"><div class="hero-kicker"><span class="pulse-dot"></span> \u79C1\u4EBA\u7EC3\u4E60\u684C \xB7 \u968F\u65F6\u5F00\u5C40</div><h1>\u597D\u724C\uFF0C<br><em>\u6084\u6084</em>\u7EC3\u51FA\u6765\u3002</h1><p>\u4ECE 2 \u6253\u5230 A\uFF0C\u548C\u4E09\u4F4D\u7535\u8111\u724C\u53CB\u5B8C\u6574\u6253\u4E0A\u4E00\u573A\u3002\u7406\u597D\u6BCF\u4E00\u624B\uFF0C\u770B\u6E05\u4E0B\u4E00\u6B65\uFF0C\u6253\u5B8C\u518D\u590D\u76D8\u3002</p><div class="home-form"><label for="player-name">\u724C\u684C\u4E0A\u600E\u4E48\u79F0\u547C\u4F60\uFF1F</label><input id="player-name" name="player-name" maxlength="12" value="${escapeHTML(saved?.match?.players?.[0]?.name || "\u5C0F\u724C\u624B")}" autocomplete="nickname"><p class="model-info">\u4E09\u4F4D\u7535\u8111\u724C\u53CB\u7EDF\u4E00\u4F7F\u7528\u96BE\u5EA6\u56DB\uFF1B\u51FA\u724C\u5EFA\u8BAE\u4E0E\u590D\u76D8\u4E5F\u7531\u5B83\u63D0\u4F9B\u3002\u9996\u6B21\u9700\u52A0\u8F7D\u7EA6 30 MB\u3002</p><button class="button primary big" data-action="new">\u5F00\u59CB\u5355\u4EBA\u7EC3\u4E60 <span aria-hidden="true">\u2197</span></button>${saved ? '<button class="button text-button" data-action="continue">\u7EE7\u7EED\u4E0A\u6B21\u724C\u5C40 \u2192</button>' : ""}</div><div class="home-note"><span>\u2726 \u4E0D\u7528\u6CE8\u518C</span><span>\u2726 \u724C\u5C40\u4EC5\u4FDD\u5B58\u5728\u6B64\u6D4F\u89C8\u5668</span><span>\u2726 \u684C\u9762\u4E0D\u5C55\u793A\u7535\u8111\u624B\u724C</span></div></div><div class="hero-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-card art-back"></div><div class="art-card art-front"><span class="art-corner">A<br>\u2665</span><span class="art-heart">\u2665</span><span class="art-bottom">A<br>\u2665</span></div><div class="art-spark spark-one">\u2726</div><div class="art-spark spark-two">\u2726</div><div class="art-note">\u4ECA\u5929\u4E5F\u8981<br>\u5077\u5077\u53D8\u5F3A</div></div></section>
    <footer class="home-footer"><span>\u63BC\u86CB \xB7 \u5355\u4EBA\u7F51\u9875\u7248</span><span>\u7ED9\u7231\u7422\u78E8\u6BCF\u4E00\u624B\u7684\u4EBA</span></footer>
  </main>`;
  }
  function playerHTML(view, seat, position) {
    const finished = view.finishOrder.indexOf(seat);
    const active = view.phase === "playing" && view.turn === seat;
    const recent = recentBotAction?.seat === seat;
    return `<div class="player ${position} ${seatTone(seat)} ${active ? "active" : ""} ${recent ? "recent" : ""} ${recent && botCueFresh ? "cue-fresh" : ""}"><div class="avatar">${seat === 2 ? "\u53CB" : seat === 1 ? "\u5DE6" : "\u53F3"}</div><div class="player-info"><strong>${nameFor(view, seat)}</strong><span>${seat === 2 ? "\u4F60\u7684\u961F\u53CB" : "\u7535\u8111\u5BF9\u624B"} \xB7 ${finished >= 0 ? `\u7B2C${finished + 1}\u540D\u8D70\u5B8C` : `\u4F59 ${view.handCounts[seat]} \u5F20`}</span></div>${active ? '<i class="turn-indicator" aria-label="\u5F53\u524D\u51FA\u724C"></i>' : ""}</div>`;
  }
  function currentMove(view) {
    const cards = view.hand.filter((card) => selected.has(card.id));
    if (!cards.length) return { text: "\u70B9\u9009\u624B\u724C\uFF0C\u7EC4\u5408\u4F60\u60F3\u51FA\u7684\u724C", valid: false, cards };
    const options = classifyOptions(cards, view.levelRank);
    const move = options.find((option) => moveKey(option) === selectedDeclarationKey) || options.find((option) => beats(option, view.lastPlay)) || options[0];
    if (!move) return { text: `\u5DF2\u9009 ${cards.length} \u5F20 \xB7 \u4E0D\u662F\u6709\u6548\u724C\u578B`, valid: false, cards, options };
    const valid = beats(move, view.lastPlay);
    return { text: `\u5DF2\u9009 ${cards.length} \u5F20 \xB7 ${TYPE_LABELS[move.type]}${options.length > 1 ? `\uFF08${levelName(move.mainRank)}\uFF09` : ""}${valid ? "" : " \xB7 \u538B\u4E0D\u8FC7\u684C\u9762"}`, valid, cards, options, move };
  }
  function gameHTML() {
    const view = visible();
    syncOrder(view);
    const analysis = getOpening(view);
    const myTurn = view.phase === "playing" && view.turn === 0;
    const returning = view.phase === "returning" && !!view.pendingReturn;
    const move = currentMove(view);
    const returnableIds = new Set(returning ? legalReturnCards(view.hand, view.levelRank).map((card) => card.id) : []);
    const returnFallback = returning && !view.hand.some((card) => card.rank <= 10 && card.rank !== view.levelRank);
    const declarationHTML = view.phase === "playing" && move.options?.length > 1 ? `<div class="declaration-choices" aria-label="\u9009\u62E9\u9022\u4EBA\u914D\u724C\u578B"><span>\u8FD9\u7EC4\u724C\u53EF\u7533\u62A5\u4E3A</span>${move.options.map((option) => `<button type="button" data-action="declaration" data-key="${moveKey(option)}" aria-pressed="${moveKey(option) === moveKey(move.move)}" class="declaration-choice ${moveKey(option) === moveKey(move.move) ? "active" : ""}" ${beats(option, view.lastPlay) ? "" : "disabled"}>${TYPE_LABELS[option.type]} \xB7 ${levelName(option.mainRank)}</button>`).join("")}</div>` : "";
    const handById = new Map(view.hand.map((card) => [card.id, card]));
    const ordered = cardOrder.map((id) => handById.get(id)).filter(Boolean);
    const lastPlayEvent = view.lastPlay ? [...view.events].reverse().find((item) => item.type === "play" && item.seat === view.lastSeat) : null;
    const cue = recentBotAction;
    const cueHTML = cue ? `<div class="action-cue ${botCueFresh ? "cue-fresh" : ""}" aria-hidden="true"><span class="cue-symbol">\u2726</span>${escapeHTML(view.players[cue.seat].name)} \xB7 ${escapeHTML(cue.label)}</div>` : "";
    const direction = view.lastSeat === 1 ? "from-left" : view.lastSeat === 3 ? "from-right" : view.lastSeat === 2 ? "from-top" : "from-bottom";
    const playedCardsHTML = (lastPlayEvent?.cards || []).map((card, index) => `<span class="mini-card ${card.suit === "H" || card.suit === "D" ? "red" : ""}" style="--i:${Math.min(index, 6)}">${escapeHTML(cardLabel(card))}</span>`).join("");
    const ordinaryStatus = modelError && view.phase === "playing" && view.players[view.turn]?.bot ? modelError : view.phase === "complete" ? view.winnerTeam === 0 ? "\u606D\u559C\uFF0C\u6211\u65B9\u8FC7 A\uFF01" : "\u5BF9\u65B9\u8FC7 A\uFF0C\u6574\u573A\u7ED3\u675F" : view.phase === "between" ? "\u672C\u526F\u7ED3\u675F\uFF0C\u67E5\u770B\u590D\u76D8\u6216\u7EE7\u7EED" : returning ? returnFallback ? "\u65E0\u5408\u683C\u5C0F\u724C\uFF0C\u53EF\u8FD8\u5176\u4ED6\u975E\u7EA2\u6843\u7EA7\u724C" : "\u8BF7\u9009\u4E00\u5F20 \u226410 \u7684\u975E\u7EA7\u724C\u8FD8\u8D21" : myTurn ? "\u8F6E\u5230\u4F60\u4E86\uFF0C\u60F3\u597D\u518D\u51FA" : view.phase === "returning" ? "\u7535\u8111\u6B63\u5728\u8FD8\u8D21\u2026" : modelWorkerStage === "loading" ? "\u6B63\u5728\u52A0\u8F7D\u96BE\u5EA6\u56DB\u6A21\u578B\uFF0C\u9996\u6B21\u7EA6\u9700\u4E0B\u8F7D 30 MB\u2026" : `${nameFor(view, view.turn)}\u6B63\u5728\u601D\u8003\u2026`;
    const status = cue ? `${nameFor(view, cue.seat)} \xB7 ${escapeHTML(cue.label)}` : ordinaryStatus;
    const statusMark = cue ? '<span class="status-spark" aria-hidden="true">\u2726</span>' : `<span class="pulse-dot ${myTurn || returning ? "" : "quiet"}"></span>`;
    return `<div class="game-shell"><header class="game-header"><button class="wordmark" data-action="home" aria-label="\u56DE\u5230\u9996\u9875">\u60EF\u86CB<span>\xB7 \u7EC3\u4E60\u684C</span></button><div class="game-meta"><span class="meta-pill">\u7B2C ${view.handNumber} \u526F</span><span class="meta-pill">\u672C\u7EA7 <strong>${levelName(view.levelRank)}</strong></span></div><button class="header-link" data-action="home">\u8FD4\u56DE\u9996\u9875</button></header>
  <div class="game-layout"><main class="table-column"><section class="scoreboard"><div class="team-score"><span>\u6211\u65B9 \xB7 \u4F60\u548C\u961F\u53CB</span><strong>${levelName(view.levels[0])}</strong></div><div class="score-divider"><span>\u6253\u5230 A \u83B7\u80DC</span></div><div class="team-score opponents"><span>\u5BF9\u65B9 \xB7 \u4E24\u4F4D\u7535\u8111</span><strong>${levelName(view.levels[1])}</strong></div></section>
  <section class="felt" aria-label="\u63BC\u86CB\u724C\u684C"><div class="felt-ring"></div>${playerHTML(view, 2, "top")}${playerHTML(view, 1, "left")}${playerHTML(view, 3, "right")}<div class="table-center">${cueHTML}<div class="center-eyebrow">${view.lastPlay ? "\u724C\u684C\u4E0A" : "\u7B49\u5F85\u9886\u51FA"}</div>${view.lastPlay ? `<div class="played-type">${TYPE_LABELS[view.lastPlay.type] || "\u51FA\u724C"}</div><div class="played-cards ${cue?.type === "play" && botCueFresh ? `cards-arriving ${direction}` : ""}">${playedCardsHTML}</div><div class="played-by">${nameFor(view, view.lastSeat)}\u51FA\u7684\u724C</div>` : '<div class="table-idle">\u5148\u624B\uFF0C\u7531\u4F60\u638C\u63A7\u8282\u594F</div>'}</div><div class="self-badge"><div class="self-avatar">\u6211</div><span>${escapeHTML(view.players[0].name)}</span><small>\u4F59 ${view.handCounts[0]} \u5F20</small></div></section>
  ${roundHistoryHTML(view)}
  <section class="hand-area"><div class="section-heading"><div><span class="eyebrow">YOUR HAND</span><h2>\u624B\u91CC\u7684\u724C <span>${view.hand.length}</span></h2></div><button class="subtle-action" data-action="sort">\u6309\u70B9\u6570\u7406\u724C \u21BA</button></div><div class="hand-grid" aria-label="\u4F60\u7684\u5168\u90E8\u624B\u724C">${ordered.map(cardHTML).join("")}</div><div class="hand-hint">${move.text}</div>${declarationHTML}<div class="action-bar"><div class="turn-status ${cue ? "bot-action" : ""} ${cue && botCueFresh ? "cue-fresh" : ""}" role="status" aria-live="polite">${statusMark}${status}</div><div class="action-buttons"><button class="button ghost" data-action="bring-forward" ${!selected.size ? "disabled" : ""}>\u9009\u4E2D\u724C\u9760\u524D</button>${modelError && view.phase === "playing" && view.players[view.turn]?.bot ? '<button class="button outline" data-action="retry-bot">\u91CD\u8BD5\u6A21\u578B</button>' : ""}${view.phase === "playing" ? `<button class="button ghost" data-action="pass" ${!myTurn || !view.lastPlay ? "disabled" : ""}>\u8FC7\u724C</button><button class="button primary" data-action="play" ${!myTurn || !move.valid ? "disabled" : ""}>\u51FA\u724C <span aria-hidden="true">\u2197</span></button>` : returning ? `<button class="button primary" data-action="return" ${selected.size !== 1 || !returnableIds.has([...selected][0]) ? "disabled" : ""}>\u8FD8\u8D21 <span aria-hidden="true">\u2197</span></button>` : view.phase === "between" ? '<button class="button primary" data-action="next">\u5F00\u59CB\u4E0B\u4E00\u526F <span aria-hidden="true">\u2197</span></button>' : ""}</div></div></section></main>
  <aside class="side-panel"><div class="panel-tabs" role="tablist" aria-label="\u7B56\u7565\u548C\u8BB0\u5F55">${[["plans", "\u5F00\u5C40\u724C\u8DEF"], ["advice", "\u51FA\u724C\u5EFA\u8BAE"], ["history", "\u51FA\u724C\u8BB0\u5F55"]].map(([id, label]) => `<button class="panel-tab ${panel === id ? "active" : ""}" role="tab" aria-selected="${panel === id}" data-action="panel" data-id="${id}">${label}</button>`).join("")}</div>${panel === "plans" ? plansHTML(analysis, view) : panel === "advice" ? adviceHTML(view) : historyHTML(view)}</aside></div></div>`;
  }
  function plansHTML(analysis, view) {
    const chosen = analysis.plans.find((item) => item.id === planId) || analysis.plans[0];
    return `<div class="panel-content"><div class="panel-intro"><span class="eyebrow">START WITH A PLAN</span><h2>\u5148\u770B\u6574\u624B\u724C\u3002</h2><p>\u8FD9\u4E9B\u662F\u7406\u724C\u601D\u8DEF\uFF0C\u4E0D\u662F\u552F\u4E00\u6B63\u786E\u7B54\u6848\u3002\u6839\u636E\u5C40\u9762\u968F\u65F6\u8C03\u6574\u3002</p></div>${analysis.highlights.length ? `<div class="highlights"><strong>\u8D77\u624B\u770B\u70B9</strong><div>${analysis.highlights.slice(0, 4).map((item) => `<span class="highlight-chip">${escapeHTML(item.label)} \xB7 ${escapeHTML(item.text)}</span>`).join("")}</div></div>` : ""}<div class="plan-choices">${analysis.plans.map((item, index) => `<button class="plan-choice ${chosen?.id === item.id ? "active" : ""}" data-action="plan" data-id="${escapeHTML(item.id)}"><span class="plan-count">0${index + 1}</span><span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.description)}</small></span><span class="plan-arrow">\u2197</span></button>`).join("")}</div>${chosen ? `<div class="plan-detail"><div class="detail-head"><strong>${escapeHTML(chosen.title)}</strong><span>\u9884\u8BA1 ${chosen.handCount} \u624B</span></div><div class="plan-groups">${chosen.groups.slice(0, 12).map((group, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHTML(group.label)}</strong><em>${escapeHTML(group.text)}</em></div>`).join("")}</div><button class="button outline full" data-action="apply-plan" data-id="${escapeHTML(chosen.id)}">\u6309\u8FD9\u6761\u724C\u8DEF\u7406\u724C</button></div>` : ""}<p class="panel-footnote">\u53EA\u5206\u6790\u4F60\u7684\u624B\u724C\u3002\u724C\u8DEF\u4E0D\u662F\u627F\u8BFA\uFF0C\u5176\u4ED6\u73A9\u5BB6\u624B\u724C\u59CB\u7EC8\u4FDD\u5BC6\u3002</p></div>`;
  }
  function modelAdviceHTML(view) {
    const state = liveModelAnalysis?.key === currentDecisionKey(view) ? liveModelAnalysis : null;
    if (!state || state.status === "loading") return `<div class="model-assist"><strong>\u51FA\u724C\u601D\u8DEF</strong><p>${state?.stage === "loading" ? "\u6B63\u5728\u52A0\u8F7D\u96BE\u5EA6\u56DB\u6A21\u578B\u3002\u9996\u6B21\u7EA6\u9700\u4E0B\u8F7D 30 MB\uFF0C\u8BF7\u4FDD\u6301\u9875\u9762\u6253\u5F00\u2026" : state?.stage === "queued" ? "\u6B63\u5728\u7B49\u5F85\u6A21\u578B\u5904\u7406\u524D\u4E00\u9879\u5206\u6790\u2026" : "\u6B63\u5728\u6309\u5F53\u524D\u5C40\u9762\u5206\u6790\u5408\u6CD5\u51FA\u724C\u2026"}</p></div>`;
    if (state.status === "error") return `<div class="model-assist"><strong>\u51FA\u724C\u601D\u8DEF\u6682\u4E0D\u53EF\u7528</strong><p>${escapeHTML(state.error)}</p><button class="button outline" data-action="model-retry">\u91CD\u8BD5\u5206\u6790</button></div>`;
    return `<div class="model-assist"><div class="model-assist-head"><strong>\u51FA\u724C\u601D\u8DEF</strong><span>\u524D ${state.result.choices.length} / \u5171 ${state.result.candidateCount} \u79CD</span></div><p class="model-explanation-note">\u6309\u6A21\u578B\u8BC4\u5206\u6392\u5E8F\uFF1B\u53C2\u8003\u7406\u7531\u57FA\u4E8E\u53EF\u89C1\u724C\u9762\uFF0C\u5E76\u975E\u6A21\u578B\u7684\u5185\u90E8\u89E3\u91CA\u3002</p><div class="model-choices">${state.result.choices.map((choice, index) => `<button class="model-choice" data-action="model-advice" data-index="${index}"><span>\u7B2C ${index + 1} \u9009 \xB7 \u8BC4\u5206 ${modelScore(choice.score)}</span><strong>${escapeHTML(modelActionLabel(choice, view.hand))}</strong><span class="model-choice-reason">\u53C2\u8003\u7406\u7531\uFF1A${escapeHTML(modelChoiceReason(choice, view))}</span><small>${choice.pass ? "\u70B9\u6B64\u67E5\u770B\uFF0C\u518D\u7531\u4F60\u786E\u8BA4\u8FC7\u724C" : "\u70B9\u6B64\u9009\u4E2D\u724C\uFF0C\u51FA\u724C\u4ECD\u7531\u4F60\u786E\u8BA4"} \u2192</small></button>`).join("")}</div><p class="model-caveat">\u8BC4\u5206\u53EA\u6BD4\u8F83\u5F53\u524D\u5019\u9009\uFF0C\u4E0D\u662F\u80DC\u7387\uFF1B\u8BF7\u7ED3\u5408\u961F\u53CB\u548C\u5269\u4F59\u724C\u5224\u65AD\u3002</p></div>`;
  }
  function adviceHTML(view) {
    const active = view.phase === "playing" && view.turn === 0;
    return `<div class="panel-content"><div class="panel-intro"><span class="eyebrow">A SECOND OPINION</span><h2>\u8FD9\u4E00\u624B\uFF0C\u600E\u4E48\u60F3\uFF1F</h2><p>\u53EA\u6839\u636E\u4F60\u7684\u624B\u724C\u548C\u724C\u684C\u516C\u5F00\u4FE1\u606F\uFF0C\u6392\u5217\u5F53\u524D\u5408\u6CD5\u51FA\u724C\u3002</p></div>${active ? modelAdviceHTML(view) : `<div class="empty-note"><span>\u25CC</span><strong>\u7B49\u8F6E\u5230\u4F60\uFF0C\u518D\u770B\u5EFA\u8BAE</strong><p>\u4F60\u53EF\u4EE5\u5148\u770B\u770B\u5F00\u5C40\u724C\u8DEF\uFF0C\u6216\u7FFB\u7FFB\u5DF2\u7ECF\u53D1\u751F\u7684\u51FA\u724C\u8BB0\u5F55\u3002</p></div>`}</div>`;
  }
  function modelReviewHTML(review) {
    const state = reviewModelAnalysis.get(review.eventNumber);
    if (!state || state.status === "loading") return `<div class="model-retro"><strong>\u51FA\u724C\u590D\u76D8</strong><p>${state?.stage === "loading" ? "\u6B63\u5728\u52A0\u8F7D\u96BE\u5EA6\u56DB\u6A21\u578B\u3002\u9996\u6B21\u7EA6\u9700\u4E0B\u8F7D 30 MB\uFF0C\u8BF7\u4FDD\u6301\u9875\u9762\u6253\u5F00\u2026" : state?.stage === "queued" ? "\u6B63\u5728\u7B49\u5F85\u6A21\u578B\u5904\u7406\u524D\u4E00\u9879\u5206\u6790\u2026" : "\u6B63\u5728\u91CD\u5EFA\u5F53\u65F6\u5C40\u9762\u5E76\u8BC4\u5206\u2026"}</p></div>`;
    if (state.status === "unavailable") return '<div class="model-retro"><strong>\u51FA\u724C\u590D\u76D8</strong><p>\u8FD9\u6B65\u65E7\u8BB0\u5F55\u7F3A\u5C11\u5FC5\u8981\u4FE1\u606F\uFF0C\u65E0\u6CD5\u5B89\u5168\u91CD\u5EFA\u5F53\u65F6\u5C40\u9762\u3002</p></div>';
    if (state.status === "error") return `<div class="model-retro"><strong>\u51FA\u724C\u590D\u76D8\u6682\u4E0D\u53EF\u7528</strong><p>${escapeHTML(state.error)}</p><button class="button outline" data-action="model-retry">\u91CD\u8BD5\u5206\u6790</button></div>`;
    const best = state.result.choices[0];
    const actualScore = state.result.actualScore;
    const comparison = actualScore == null ? "\u65E0\u6CD5\u4E3A\u4F60\u5F53\u65F6\u7684\u9009\u62E9\u8BA1\u7B97\u6A21\u578B\u5206\u6570\u3002" : !best ? "\u5F53\u65F6\u6CA1\u6709\u53EF\u6BD4\u8F83\u7684\u5019\u9009\u3002" : actualScore > best.score + 0.01 ? "\u4F60\u7684\u5B9E\u9645\u51FA\u724C\u5206\u6570\u66F4\u9AD8\uFF1B\u6A21\u578B\u5019\u9009\u96C6\u53EF\u80FD\u6F0F\u6389\u4E86\u8FD9\u624B\u3002" : actualScore >= best.score - 0.01 ? "\u4F60\u7684\u9009\u62E9\u4E0E\u6A21\u578B\u9996\u9009\u8BC4\u5206\u63A5\u8FD1\u3002" : "\u6A21\u578B\u66F4\u504F\u5411\u4E0B\u5217\u9996\u9009\uFF1B\u53EF\u5BF9\u7167\u5B83\u4E0E\u5B9E\u9645\u51FA\u724C\u7684\u5DEE\u522B\u3002";
    return `<div class="model-retro"><strong>\u51FA\u724C\u590D\u76D8</strong><p>\u4F60\u7684\u5B9E\u9645\u9009\u62E9\uFF1A${actualScore == null ? "\u672A\u80FD\u8BC4\u5206" : `\u8BC4\u5206 ${modelScore(actualScore)}`}</p><p>${escapeHTML(comparison)}</p><div class="model-review-choices">${state.result.choices.map((choice, index) => `<div><span>\u7B2C ${index + 1} \u9009 \xB7 ${modelScore(choice.score)}</span><strong>${escapeHTML(modelActionLabel(choice, review.handAtTime))}</strong></div>`).join("")}</div><small>\u5206\u6570\u53EA\u6BD4\u8F83\u5F53\u65F6\u7684\u5019\u9009\u52A8\u4F5C\uFF0C\u4E0D\u662F\u80DC\u7387\uFF1B\u6A21\u578B\u4E0D\u80FD\u7ED9\u51FA\u53EF\u9A8C\u8BC1\u7684\u56E0\u679C\u89E3\u91CA\u3002</small></div>`;
  }
  function historyHTML(view) {
    const list = [...view.events].reverse();
    const review = view.reviews.find((item) => item.eventNumber === reviewNumber);
    return `<div class="panel-content"><div class="panel-intro"><span class="eyebrow">EVERY MOVE COUNTS</span><h2>\u6574\u573A\uFF0C\u4E00\u773C\u770B\u5B8C\u3002</h2><p>\u6309\u65F6\u95F4\u8BB0\u5F55\u6BCF\u4E00\u6B65\u3002\u6253\u5B8C\u4E00\u526F\u540E\uFF0C\u70B9\u81EA\u5DF1\u7684\u51B3\u7B56\u770B\u5F53\u65F6\u8FD8\u80FD\u600E\u4E48\u6253\u3002</p></div>${review ? `<div class="review-box"><div class="detail-head"><strong>\u7B2C ${review.eventNumber} \u6B65 \xB7 \u590D\u76D8</strong><button class="small-close" data-action="close-review" aria-label="\u5173\u95ED\u590D\u76D8">\xD7</button></div><p>\u5F53\u65F6\u4F60\u6253\u4E86\uFF1A${escapeHTML(review.actualLabel)}</p>${modelReviewHTML(review)}<small>\u53EA\u4F7F\u7528\u5F53\u65F6\u53EF\u89C1\u4FE1\u606F\uFF0C\u4E0D\u5077\u770B\u540E\u7EED\u6216\u4ED6\u4EBA\u624B\u724C\u3002</small></div>` : ""}<ol class="history-list">${list.map((event) => {
      const canReview = event.seat === 0 && (event.type === "play" || event.type === "pass") && view.reviews.some((item) => item.eventNumber === event.number);
      return `<li><span class="history-number">${String(event.number).padStart(3, "0")}</span><div><strong>${escapeHTML(eventText(event, view))}</strong><small>\u7B2C ${event.handNumber} \u526F</small></div>${canReview ? `<button data-action="review" data-number="${event.number}">\u590D\u76D8 \u2197</button>` : ""}</li>`;
    }).join("")}</ol></div>`;
  }
  function render() {
    root.innerHTML = screen === "game" && match ? gameHTML() : homeHTML();
    botCueFresh = false;
    ensureModelAssistance();
  }
  function afterAction() {
    clearSelection();
    clearBotCue();
    modelError = null;
    save();
    render();
    scheduleBot();
  }
  function scheduleBot() {
    clearTimeout(botTimer);
    const generation = ++botGeneration;
    if (screen !== "game" || !match || document.hidden) return;
    const needsBot = match.phase === "playing" && match.players[match.turn]?.bot || match.phase === "returning" && match.pendingReturns.some((item) => match.players[item.receiver].bot);
    if (!needsBot) return;
    botTimer = setTimeout(async () => {
      if (document.hidden) return;
      try {
        const currentMatch = match;
        const previousEventCount = match.events.length;
        let acted;
        if (match.phase === "playing") {
          const seat = match.turn;
          const action = await requestModelAction(viewFor(match, seat), () => {
            if (generation === botGeneration && match === currentMatch && screen === "game") render();
          });
          if (generation !== botGeneration || match !== currentMatch || screen !== "game" || document.hidden) return;
          if (action.pass) pass(match, seat);
          else play(match, seat, action.cardIds, action.declaration);
          acted = true;
        } else {
          acted = autoAction(match);
        }
        if (acted) {
          modelError = null;
          showBotCue(match.events.slice(previousEventCount));
          save();
          render();
          scheduleBot();
        }
      } catch (error) {
        if (generation !== botGeneration) return;
        modelError = error.message || "\u7535\u8111\u51FA\u724C\u9047\u5230\u95EE\u9898";
        inform(modelError);
        render();
      }
    }, BOT_STEP_DELAY_MS);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(botTimer);
      botGeneration += 1;
      if (pendingModelRequests.size) {
        stopModelWorker("\u9875\u9762\u5207\u5230\u540E\u53F0\uFF0C\u5206\u6790\u5DF2\u6682\u505C");
        resetModelAssistance();
      }
    } else {
      render();
      scheduleBot();
    }
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    try {
      if (action === "new") {
        const name = document.getElementById("player-name")?.value.trim().slice(0, 12) || "\u5C0F\u724C\u624B";
        match = createMatch([{ id: "you", name, bot: false }, { id: "left", name: "\u963F\u5DE6", bot: true, difficulty: "danlm" }, { id: "partner", name: "\u642D\u5B50", bot: true, difficulty: "danlm" }, { id: "right", name: "\u963F\u53F3", bot: true, difficulty: "danlm" }]);
        cardOrder = [];
        openingHand = null;
        panel = "plans";
        reviewNumber = null;
        roundArchiveOpen = false;
        resetModelAssistance();
        screen = "game";
        afterAction();
        return;
      }
      if (action === "continue") {
        const saved = savedGame();
        if (!saved) return;
        clearBotCue();
        match = saved.match;
        cardOrder = saved.cardOrder || [];
        openingHand = null;
        reviewNumber = null;
        roundArchiveOpen = false;
        resetModelAssistance();
        screen = "game";
        save();
        render();
        scheduleBot();
        return;
      }
      if (action === "home") {
        screen = "home";
        clearTimeout(botTimer);
        botGeneration += 1;
        clearBotCue();
        save();
        render();
        return;
      }
      if (!match) return;
      const view = visible();
      if (action === "retry-bot") {
        modelError = null;
        render();
        scheduleBot();
        return;
      }
      if (action === "round-archive") {
        roundArchiveOpen = !roundArchiveOpen;
        render();
        return;
      }
      if (action === "model-retry") {
        if (panel === "advice") liveModelAnalysis = null;
        if (panel === "history" && reviewNumber != null) reviewModelAnalysis.delete(reviewNumber);
        render();
        return;
      }
      if (action === "card") {
        const id = button.dataset.id;
        selected.has(id) ? selected.delete(id) : selected.add(id);
        selectedDeclarationKey = null;
        render();
        return;
      }
      if (action === "declaration") {
        selectedDeclarationKey = button.dataset.key;
        render();
        return;
      }
      if (action === "sort") {
        cardOrder = sortCards(view.hand, view.levelRank).reverse().map((card) => card.id);
        save();
        render();
        return;
      }
      if (action === "bring-forward") {
        cardOrder = [...selected, ...cardOrder.filter((id) => !selected.has(id))];
        save();
        render();
        return;
      }
      if (action === "play") {
        play(match, 0, [...selected], currentMove(view).move);
        afterAction();
        return;
      }
      if (action === "pass") {
        pass(match, 0);
        afterAction();
        return;
      }
      if (action === "return") {
        returnTribute(match, 0, [...selected][0]);
        afterAction();
        return;
      }
      if (action === "next") {
        startNextHand(match);
        cardOrder = [];
        openingHand = null;
        panel = "plans";
        roundArchiveOpen = false;
        afterAction();
        return;
      }
      if (action === "panel") {
        panel = button.dataset.id;
        render();
        return;
      }
      if (action === "plan") {
        planId = button.dataset.id;
        render();
        return;
      }
      if (action === "apply-plan") {
        const plan = getOpening(view).plans.find((item) => item.id === button.dataset.id);
        if (!plan) return;
        cardOrder = plan.groups.flatMap((group) => group.cards.map((card) => card.id));
        syncOrder(view);
        save();
        render();
        inform(`\u5DF2\u6309\u201C${plan.title}\u201D\u7406\u724C`);
        return;
      }
      if (action === "model-advice") {
        if (view.phase !== "playing" || view.turn !== 0 || liveModelAnalysis?.key !== currentDecisionKey(view) || liveModelAnalysis.status !== "ready") return;
        const choice = liveModelAnalysis.result.choices[Number(button.dataset.index)];
        if (!choice) return;
        if (choice.pass) {
          clearSelection();
          inform("\u8FD9\u6761\u51FA\u724C\u601D\u8DEF\u662F\u8FC7\u724C\uFF1B\u8BF7\u70B9\u51FB\u724C\u684C\u4E0B\u65B9\u7684\u201C\u8FC7\u724C\u201D\u786E\u8BA4\u3002");
        } else {
          selected = new Set(choice.cardIds);
          selectedDeclarationKey = choice.declaration ? moveKey(choice.declaration) : null;
          inform("\u5DF2\u6309\u8FD9\u6761\u51FA\u724C\u601D\u8DEF\u9009\u724C\uFF0C\u8BF7\u81EA\u5DF1\u786E\u8BA4\u51FA\u724C\u3002");
        }
        render();
        return;
      }
      if (action === "review") {
        reviewNumber = Number(button.dataset.number);
        render();
        return;
      }
      if (action === "close-review") {
        reviewNumber = null;
        render();
      }
    } catch (error) {
      inform(error.message || "\u64CD\u4F5C\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5");
    }
  });
  render();
})();
