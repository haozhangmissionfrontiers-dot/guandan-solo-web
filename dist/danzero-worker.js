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
      function legalReturnCards(hand, level) {
        const normal = hand.filter((card) => card.rank <= 10 && card.rank !== level);
        if (normal.length) return normal;
        return hand.filter((card) => !(card.rank === level && card.suit === "H"));
      }
      function sortCards(cards, level) {
        const suitOrder = { S: 0, H: 1, C: 2, D: 3, J: 4 };
        return cards.slice().sort(
          (a, b) => rankPower(a.rank, level) - rankPower(b.rank, level) || suitOrder[a.suit] - suitOrder[b.suit] || a.deck - b.deck
        );
      }
      function cardLabel(card) {
        return card.rank >= 16 ? RANK_LABELS[card.rank] : `${SUIT_LABELS[card.suit]}${RANK_LABELS[card.rank] || card.rank}`;
      }
      module.exports = { createDeck, shuffle, rankPower, legalReturnCards, sortCards, cardLabel };
    }
  });

  // miniprogram/lib/rules.js
  var require_rules = __commonJS({
    "miniprogram/lib/rules.js"(exports, module) {
      var { rankPower } = require_cards();
      var TYPE_LABELS = {
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
      function moveKey(move) {
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
      function classifyOptions(cards, level) {
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
          unique.set(moveKey(option), option);
        }
        return [...unique.values()].sort((a, b) => b.tier - a.tier || b.power - a.power);
      }
      function classify(cards, level) {
        return classifyOptions(cards, level)[0] || null;
      }
      function beats(candidate, previous) {
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
          for (const move of classifyOptions(cards, level)) {
            const key = `${physicalKey}:${moveKey(move)}`;
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
            const selected = [];
            for (const rank of sequence) selected.push(...(byRank.get(rank) || []).slice(0, copies));
            const missing = runLength * copies - selected.length;
            if (missing >= 0 && missing <= wild.length) add(selected.concat(wild.slice(0, missing)));
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
        return generateMoves(hand, level).filter((move) => beats(move, previous));
      }
      module.exports = { TYPE_LABELS, classify, classifyOptions, moveKey, beats, generateMoves, legalMoves };
    }
  });

  // web/danzero-features.js
  var require_danzero_features = __commonJS({
    "web/danzero-features.js"(exports, module) {
      var SUIT_INDEX = { H: 0, S: 1, C: 2, D: 3 };
      function cardIndex(card) {
        if (card.rank === 16) return 52;
        if (card.rank === 17) return 53;
        if (card.rank < 2 || card.rank > 14 || SUIT_INDEX[card.suit] === void 0) throw new Error("\u96BE\u5EA6\u4E09\u6536\u5230\u65E0\u6548\u724C");
        return (card.rank - 2) * 4 + SUIT_INDEX[card.suit];
      }
      function cardCounts(cards) {
        const result = new Int8Array(54);
        for (const card of cards || []) result[cardIndex(card)] += 1;
        return result;
      }
      function missingAction() {
        return new Int8Array(54).fill(-1);
      }
      function lastEvent(events, seat) {
        for (let index = events.length - 1; index >= 0; index -= 1) {
          const event = events[index];
          if (event.seat === seat && (event.type === "play" || event.type === "pass")) return event;
        }
        return null;
      }
      function actionCounts(event) {
        if (!event) return missingAction();
        return event.type === "pass" ? new Int8Array(54) : cardCounts(event.cards);
      }
      function wildcardFeatures(hand, levelRank) {
        const result = new Int8Array(12);
        const wildcardIndex = (levelRank - 2) * 4;
        if (!hand[wildcardIndex]) return result;
        result[0] = 1;
        for (let suit = 0; suit < 4 && !result[1]; suit += 1) {
          const window = Array.from({ length: 5 }, (_, rank) => {
            const index = suit + rank * 4;
            return index === wildcardIndex ? 0 : hand[index];
          });
          for (let right = 5; right <= 12; right += 1) {
            if (window.filter((value) => value === 0).length <= 1) {
              result[1] = 1;
              break;
            }
            const index = suit + right * 4;
            window.push(index === wildcardIndex ? 0 : hand[index]);
            window.shift();
          }
        }
        const counts = new Int8Array(13);
        for (let rank = 0; rank < 13; rank += 1) {
          for (let suit = 0; suit < 4; suit += 1) {
            const index = rank * 4 + suit;
            if (index !== wildcardIndex && hand[index]) counts[rank] += 1;
          }
        }
        const max = Math.max(...counts);
        const start = max >= 6 ? 2 : max >= 5 ? 3 : max >= 4 ? 4 : max >= 3 ? 5 : max >= 2 ? 6 : 7;
        for (let index = start; index < 8; index += 1) result[index] = 1;
        let finalRun = 0;
        for (let rank = 0; rank < 13; rank += 1) {
          if (!counts[rank]) {
            finalRun = 0;
            continue;
          }
          finalRun += 1;
          if (rank >= 1) {
            if (counts[rank] === 2 && counts[rank - 1] >= 3 || counts[rank] >= 3 && counts[rank - 1] === 2) result[9] = 1;
            else if (counts[rank] === 2 && counts[rank - 1] === 2) result[11] = 1;
          }
          if (rank >= 2 && (counts[rank - 2] === 1 && counts[rank - 1] >= 2 && counts[rank] >= 2 || counts[rank - 2] >= 2 && counts[rank - 1] === 1 && counts[rank] >= 2 || counts[rank - 2] >= 2 && counts[rank - 1] >= 2 && counts[rank] === 1)) result[10] = 1;
        }
        if (finalRun >= 4) result[8] = 1;
        return result;
      }
      function countOneHot(count) {
        if (!Number.isInteger(count) || count < 0 || count > 27) throw new Error("\u96BE\u5EA6\u4E09\u73A9\u5BB6\u4F59\u724C\u6570\u5F02\u5E38");
        const result = new Int8Array(28);
        result[count] = 1;
        return result;
      }
      function rankOneHot(rank) {
        if (!Number.isInteger(rank) || rank < 2 || rank > 14) throw new Error("\u96BE\u5EA6\u4E09\u7EA7\u6570\u5F02\u5E38");
        const result = new Int8Array(13);
        result[rank - 2] = 1;
        return result;
      }
      function baseFeatures(view) {
        const seat = view.turn;
        const events = (view.events || []).filter((event) => event.handNumber === view.handNumber);
        const plays = events.filter((event) => event.type === "play");
        const hand = cardCounts(view.hand);
        const otherHands = new Int8Array(54).fill(2);
        for (let index = 0; index < 54; index += 1) otherHands[index] -= hand[index];
        for (const event of plays) for (const card of event.cards || []) otherHands[cardIndex(card)] -= 1;
        if (otherHands.some((count) => count < 0 || count > 2)) throw new Error("\u96BE\u5EA6\u4E09\u516C\u5F00\u724C\u8BB0\u5F55\u4E0E\u624B\u724C\u4E0D\u4E00\u81F4");
        const partner = (seat + 2) % 4;
        const otherLast = [...events].reverse().find((event) => event.seat !== seat && (event.type === "play" || event.type === "pass"));
        const partnerLast = view.finishOrder.includes(partner) ? null : lastEvent(events, partner);
        const playedBy = (otherSeat) => {
          const history = events.filter((event) => event.seat === otherSeat && (event.type === "play" || event.type === "pass"));
          if (history.length === 1 && history[0].type === "pass") return missingAction();
          return cardCounts(history.filter((event) => event.type === "play").flatMap((event) => event.cards || []));
        };
        const pieces = [
          hand,
          wildcardFeatures(hand, view.levelRank),
          otherHands,
          actionCounts(otherLast),
          partnerLast?.type === "pass" ? missingAction() : actionCounts(partnerLast),
          playedBy((seat + 1) % 4),
          playedBy(partner),
          playedBy((seat + 3) % 4),
          countOneHot(view.handCounts[(seat + 1) % 4]),
          countOneHot(view.handCounts[partner]),
          countOneHot(view.handCounts[(seat + 3) % 4]),
          rankOneHot(view.levels[seat % 2]),
          rankOneHot(view.levels[(seat + 1) % 2]),
          rankOneHot(view.levelRank)
        ];
        const result = new Int8Array(513);
        let offset = 0;
        for (const piece of pieces) {
          result.set(piece, offset);
          offset += piece.length;
        }
        if (offset !== result.length) throw new Error("\u96BE\u5EA6\u4E09\u7279\u5F81\u62FC\u63A5\u9519\u8BEF");
        return result;
      }
      module.exports = { cardIndex, cardCounts, wildcardFeatures, baseFeatures };
    }
  });

  // web/danzero-model.js
  var require_danzero_model = __commonJS({
    "web/danzero-model.js"(exports, module) {
      var DIMS = [567, 512, 512, 512, 512, 512, 1];
      var INPUT_PREFIX = 513;
      var ACTION_WIDTH = 54;
      var FLOATS = DIMS.slice(1).reduce((sum, outputs, layer) => sum + DIMS[layer] * outputs + outputs, 0);
      function modelFromBuffer(buffer) {
        if (!(buffer instanceof ArrayBuffer) || buffer.byteLength !== 4 + FLOATS * 4) throw new Error("\u96BE\u5EA6\u4E09\u6A21\u578B\u6587\u4EF6\u957F\u5EA6\u4E0D\u7B26");
        if (String.fromCharCode(...new Uint8Array(buffer, 0, 4)) !== "DZQ1") throw new Error("\u96BE\u5EA6\u4E09\u6A21\u578B\u6587\u4EF6\u683C\u5F0F\u4E0D\u7B26");
        const flat = new Float32Array(buffer, 4);
        const layers = [];
        let offset = 0;
        for (let layer = 0; layer < DIMS.length - 1; layer += 1) {
          const inputs = DIMS[layer];
          const outputs = DIMS[layer + 1];
          const weights = flat.subarray(offset, offset + inputs * outputs);
          offset += inputs * outputs;
          const biases = flat.subarray(offset, offset + outputs);
          offset += outputs;
          layers.push({ inputs, outputs, weights, biases });
        }
        return { layers, scratch: [new Float32Array(512), new Float32Array(512)] };
      }
      function prepareBase(model, features) {
        if (!features || features.length !== INPUT_PREFIX) throw new Error("\u96BE\u5EA6\u4E09\u8F93\u5165\u7279\u5F81\u957F\u5EA6\u4E0D\u7B26");
        const layer = model.layers[0];
        const base = new Float32Array(layer.outputs);
        for (let output = 0; output < layer.outputs; output += 1) {
          const start = output * layer.inputs;
          let value = layer.biases[output];
          for (let input = 0; input < INPUT_PREFIX; input += 1) value += layer.weights[start + input] * features[input];
          base[output] = value;
        }
        return base;
      }
      function scoreAction(model, base, actionCounts) {
        if (!actionCounts || actionCounts.length !== ACTION_WIDTH) throw new Error("\u96BE\u5EA6\u4E09\u51FA\u724C\u7279\u5F81\u957F\u5EA6\u4E0D\u7B26");
        const first = model.layers[0];
        let current = model.scratch[0];
        let next = model.scratch[1];
        const active = [];
        for (let i = 0; i < ACTION_WIDTH; i += 1) if (actionCounts[i]) active.push(i);
        for (let output = 0; output < first.outputs; output += 1) {
          const start = output * first.inputs + INPUT_PREFIX;
          let value = base[output];
          for (const index of active) value += first.weights[start + index] * actionCounts[index];
          current[output] = Math.tanh(value);
        }
        for (let layerNumber = 1; layerNumber < model.layers.length; layerNumber += 1) {
          const layer = model.layers[layerNumber];
          for (let output = 0; output < layer.outputs; output += 1) {
            const start = output * layer.inputs;
            let value = layer.biases[output];
            for (let input = 0; input < layer.inputs; input += 1) value += layer.weights[start + input] * current[input];
            next[output] = layerNumber === model.layers.length - 1 ? value : Math.tanh(value);
          }
          [current, next] = [next, current];
        }
        return current[0];
      }
      module.exports = { DIMS, FLOATS, INPUT_PREFIX, ACTION_WIDTH, modelFromBuffer, prepareBase, scoreAction };
    }
  });

  // web/danzero-worker.js
  var require_danzero_worker = __commonJS({
    "web/danzero-worker.js"(exports, module) {
      var { legalMoves } = require_rules();
      var { cardCounts, baseFeatures } = require_danzero_features();
      var { modelFromBuffer, prepareBase, scoreAction } = require_danzero_model();
      var modelPromise;
      function loadModel() {
        if (!modelPromise) {
          modelPromise = fetch(new URL("../models/danzero.f32?v=20261007", self.location.href)).then((response) => {
            if (!response.ok) throw new Error(`\u96BE\u5EA6\u4E09\u6A21\u578B\u4E0B\u8F7D\u5931\u8D25\uFF08${response.status}\uFF09`);
            return response.arrayBuffer();
          }).then(modelFromBuffer).catch((error) => {
            modelPromise = null;
            throw error;
          });
        }
        return modelPromise;
      }
      function chooseModelAction(view, model) {
        const moves = legalMoves(view.hand, view.levelRank, view.lastPlay);
        if (!moves.length && !view.lastPlay) throw new Error("\u96BE\u5EA6\u4E09\u627E\u4E0D\u5230\u5408\u6CD5\u9886\u51FA\u724C");
        const base = prepareBase(model, baseFeatures(view));
        const cached = /* @__PURE__ */ new Map();
        let best = null;
        let bestScore = -Infinity;
        for (const move of moves) {
          const action = cardCounts(move.cards);
          const key = action.join(",");
          let score = cached.get(key);
          if (score === void 0) {
            score = scoreAction(model, base, action);
            cached.set(key, score);
          }
          if (score >= bestScore) {
            bestScore = score;
            best = {
              pass: false,
              cardIds: move.cards.map((card) => card.id),
              declaration: { type: move.type, mainRank: move.mainRank, size: move.size }
            };
          }
        }
        if (view.lastPlay) {
          const passScore = scoreAction(model, base, new Int8Array(54));
          if (passScore >= bestScore) return { pass: true };
        }
        return best;
      }
      function chooseModelAnalysis(view, model, actual = null) {
        const moves = legalMoves(view.hand, view.levelRank, view.lastPlay);
        const base = prepareBase(model, baseFeatures(view));
        const unique = /* @__PURE__ */ new Map();
        for (const move of moves) {
          const counts = cardCounts(move.cards);
          const key = counts.join(",");
          if (unique.has(key)) continue;
          unique.set(key, {
            pass: false,
            cardIds: move.cards.map((card) => card.id),
            declaration: { type: move.type, mainRank: move.mainRank, size: move.size },
            score: scoreAction(model, base, counts)
          });
        }
        if (view.lastPlay) unique.set("pass", { pass: true, score: scoreAction(model, base, new Int8Array(54)) });
        const ranked = [...unique.values()].sort((a, b) => b.score - a.score);
        let actualScore = null;
        if (actual) {
          if (actual.pass) actualScore = view.lastPlay ? scoreAction(model, base, new Int8Array(54)) : null;
          else {
            const ids = new Set(actual.cardIds || []);
            const actualCards = view.hand.filter((card) => ids.has(card.id));
            if (actualCards.length === ids.size && ids.size > 0) actualScore = scoreAction(model, base, cardCounts(actualCards));
          }
        }
        return { choices: ranked.slice(0, 3), actualScore, candidateCount: ranked.length };
      }
      if (typeof self !== "undefined") {
        self.onmessage = async (event) => {
          const { id, view, mode, actual } = event.data;
          try {
            const model = await loadModel();
            if (mode === "analysis") self.postMessage({ id, analysis: chooseModelAnalysis(view, model, actual) });
            else self.postMessage({ id, action: chooseModelAction(view, model) });
          } catch (error) {
            self.postMessage({ id, error: error.message || String(error) });
          }
        };
      }
      module.exports = { chooseModelAction, chooseModelAnalysis };
    }
  });
  require_danzero_worker();
})();
