var Card = require('Card');

var getRandom = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var mixArray = function (array) {
    var tmpCard, j;
    for (var i = 0; i < array.length; i += 1) {
        tmpCard = array[i];
        j = getRandom(i, array.length - 1);
        array[i] = array[j];
        array[j] = tmpCard;
    }
};

var generatePackCards = function () {
    var result = [];
    // var test = [0, 1, 2, 3, 4, 21, 34, 7, 8, 14, 16, 18, 20];
    // for (var i = 0; i < 12; i += 1) {
    //     result.push(Card.fromId(test[i]));
    // }
    for (var i = 0; i < 52; i += 1) {
        result.push(Card.fromId(i));
    }
    mixArray(result);
    return result.slice(0, 12);
    // return result;

};

var arrangePositionCards = function (cards, nodes, hasEffect, cardPrefab) {
    nodes.removeAllChildren();
    for (var i = 0; i < cards.length; i += 1) {
        var cardNew;
        cardNew = cc.instantiate(cardPrefab);
        var cardUIPhom = cardNew.getComponent('CardUIPhom');
        cardNew.parent = nodes;
        cardUIPhom.setCard(Card.fromId(cards[i].getId()));
        cardUIPhom.interactable = true;
        cardUIPhom.canMove = true;
        cardNew.position = cc.p(0, 0);
        if (hasEffect) {
            cardNew.setScaleX(0.1);
            cardNew.runAction(cc.scaleTo(0.3, 1));
        }
    }
};
var arrangeCardsOptimize = function (cards, isDoi) {
    // var hasInterestedCard = [];
    // var notInterestedCard = [];
    // for (var i = 0; i < cards.length - 1; i += 1) {
    //     var check = false;
    //     for (var j = 0; j < cards.length; j += 1) {
    //         if (checkInterestedCard(cards[i], cards[j])) {
    //             check = true;
    //             break;
    //         }
    //     }
    //     if (check) {
    //         hasInterestedCard.push(cards[i]);
    //     } else {
    //         notInterestedCard.push(cards[i]);
    //     }
    // }
    // if (isDoi) {
    //     return arrangeCardsOptimizeWithDoi1(hasInterestedCard);
    // } else {
    //     return arrangeCardsOptimizeWithSanh1(hasInterestedCard);
    // }
    // return arrangeCardsOptimizeWithDoi1(hasInterestedCard);


    if (isDoi) {
        return arrangeCardsOptimizeWithDoi(cards);
    } else {
        return arrangeCardsOptimizeWithSanh(cards);
    }
    return arrangeCardsOptimizeWithDoi(cards);
};

// var arrangeCardsOptimizeWithDoi1 = function (cards) {

// };

// var arrangeCardsOptimizeWithSanh1 = function (cards) {

// };

// var checkInterestedCard = function (c1, c2) {
//     if (c1.rank.ID === c2.rank.ID) {
//         return true;
//     }
//     if (c1.suit.ID === c2.suit.ID) {
//         if (c1.rank.ID === c2.rank.ID - 1 || c1.rank.ID === c2.rank.ID - 2) {
//             return true;
//         }
//     }
//     return false;
// };

// sắp xếp theo độ ưu tiên đôi
var arrangeCardsOptimizeWithDoi = function (cards) {
    // limit - index chứa phỏm
    var resultCards = cards.slice();
    var tmp, limit = 0;

    // thứ tự tối ưu: Phỏm(đôi)-> phỏm sảnh -> đôi + lẻ or sảnh -> sảnh lẻ
    // Đưa phỏm đôi -> sảnh lên đầu
    // Xếp ưu tiên đôi -> sảnh
    resultCards = arrangeCardsDecrease(resultCards);
    resultCards = arrangeCardsByDoi(resultCards);
    tmp = arrangeCardsByPhomDoiFirst(resultCards);
    resultCards = tmp[0];
    limit += tmp[1];

    if (limit >= resultCards.Count) {
        return resultCards;
    }

    // Sắp xếp lại sau khi đưa phỏm đôi lên đầu
    // sắp xếp giảm dần -> sắp xếp đôi 
    // Sắp xếp đưa phỏm sảnh lên đầu
    resultCards = arrangeCardsDecreaseWithLimit(resultCards, limit);
    resultCards = arrangeCardsBySanhWithLimit(resultCards, limit);
    tmp = arrangeCardsByPhomSanhFirst(resultCards, limit);
    resultCards = tmp[0];
    limit += tmp[1];

    if (limit >= resultCards.Count) {
        return resultCards;
    }

    tmp = arrangePhomDoiWithSanh(resultCards, limit);
    limit += tmp[1];
    resultCards = tmp[0];
    if (limit >= resultCards.Count) {
        return resultCards;
    }

    // -- sau khi xếp phỏm đôi, sảnh lên đầu --
    // xếp ưu tiên đôi
    resultCards = arrangeCardsDecreaseWithLimit(resultCards, limit);
    resultCards = arrangeCardsByDoiWithLimit(resultCards, limit);

    //xêp ưu tiên sảnh sau khi ưu tiên đôi
    var tmpCards;
    tmpCards = getCardAloneChuaSanhWithLimit(resultCards, limit);
    if (tmpCards.length > 0) {
        tmpCards = arrangeCardsBySanh(tmpCards);
        resultCards = insertListAtLast(resultCards, tmpCards);
    }

    // xếp card lẻ k chứa sảnh với đôi
    tmpCards = getCardsFA(tmpCards);
    if (tmpCards.length > 0) {
        // đưa có lá bài lẻ chứa sảnh với đôi lên trên
        arrangeCardsByDoiSanh(resultCards, tmpCards, limit);
    }

    return resultCards;
};

var arrangeCardsOptimizeWithSanh = function (cards) {

    var limit = 0;
    var tmp = 0;
    var resultCards = cards.slice();
    resultCards = arrangeCardsDecrease(resultCards);
    resultCards = arrangeCardsBySanh(resultCards);
    tmp = arrangeCardsByPhomSanhFirst(resultCards);
    limit += tmp[1];
    resultCards = tmp[0];
    if (limit >= resultCards.Count) {
        return resultCards;
    }

    // sắp xếp đưa phỏm đôi lên đầu
    resultCards = arrangeCardsDecreaseWithLimit(resultCards, limit);
    resultCards = arrangeCardsByDoiWithLimit(resultCards, limit);
    tmp = arrangeCardsByPhomDoiFirst(resultCards, limit);
    limit += tmp[1];
    resultCards = tmp[0];
    if (limit >= resultCards.Count) {
        return resultCards;
    }

    resultCards = arrangeCardsDecreaseWithLimit(resultCards, limit);
    resultCards = arrangeCardsBySanhWithLimit(resultCards, limit);

    // xêp ưu tiên sảnh sau khi ưu tiên đôi
    var tmpCards = getCardsAloneChuaDoiWithLimit(resultCards, limit);
    if (tmpCards && tmpCards.length > 0) {
        tmpCards = arrangeCardsByDoi(tmpCards);
        resultCards = insertListAtLast(resultCards, tmpCards);
    }
    tmpCards = getCardAloneChuaSanhWithLimit(tmpCards, 0);
    if (tmpCards && tmpCards.length > 0) {
        resultCards = arrangeCardsBySanhDoi(resultCards, tmpCards, limit);
    }
    return resultCards;
};

// sắp xếp theo tứ thự giảm dần
var arrangeCardsDecrease = function (cards) {
    var tempCard;
    for (var i = 0; i < cards.length; i += 1) {
        for (var j = i + 1; j < cards.length; j += 1) {
            if (cards[i] && cards[j] && cards[i].getId() > cards[j].getId()) {
                tempCard = cards[i];
                cards[i] = cards[j];
                cards[j] = tempCard;
            }
        }
    }
    return cards.reverse();
};

// sắp xếp theo tứ thự giảm dần với limit
var arrangeCardsDecreaseWithLimit = function (cards, limit) {
    var tmpCards = cards.slice(limit, cards.length);
    tmpCards = arrangeCardsDecrease(tmpCards);

    return insertListAtLast(cards, tmpCards);
};

// sắp xếp các bộ đội lên đầu
var arrangeCardsByDoi = function (cards) {

    var resultCards = cards.slice();
    var index = cards.length - 1,
        delta = 0;

    while (index > 0) {
        if (cards[index].rank === cards[index - 1].rank) {
            resultCards.splice(index - 1 + delta, 2);
            resultCards.splice(0, 0, cards[index]);
            resultCards.splice(0, 0, cards[index - 1]);

            if (index - 2 < 0) {
                break;
            }
            if (cards[index].rank === cards[index - 2].rank) {
                resultCards.splice(index + delta, 1);
                resultCards.splice(0, 0, cards[index - 2]); // insert(index,value)

                if (index - 3 < 0) {
                    break;
                }
                if (cards[index].rank === cards[index - 3].rank) {

                    resultCards.splice(index + delta, 1); // remove at (index)
                    resultCards.splice(0, 0, cards[index - 3]);

                    delta += 4;
                    index -= 3;

                    continue;
                }

                delta += 3;
                index -= 2;

                continue;
            }
            delta += 2;

        }
        index -= 1;
    }
    return resultCards;
};

var arrangeCardsByDoiWithLimit = function (cards, limit) {
    var tmpCards = cards.slice(limit, cards.length);
    tmpCards = arrangeCardsByDoi(tmpCards);

    return insertListAtLast(cards, tmpCards);
};

// sắp xếp các quân bài theo sảnh k chứa các quân bài có bộ đôi
var arrangeCardsBySanh = function (cards) {
    var index = 0;
    var tmpCards = [];
    while (index < cards.length - 1) {
        for (var i = index + 1; i < cards.length; i += 1) {
            if (cards[index].suit === cards[i].suit) {
                if ((cards[index].rank.ID - 1 === cards[i].rank.ID) ||
                    cards[index].rank.ID - 2 === cards[i].rank.ID) {
                    tmpCards = addItemAtLast(tmpCards, cards[index]);
                    tmpCards = addItemAtLast(tmpCards, cards[i]);
                    cards = moveItemInArray(cards, i, index + 1);
                    break;
                }
                continue;
            }
        }
        index += 1;
    }
    return insertListAtFirst(cards, tmpCards);
};

var arrangeCardsBySanhWithLimit = function (cards, limit) {
    var tmpCards = cards.slice(limit, cards.length);
    tmpCards = arrangeCardsBySanh(tmpCards);

    return insertListAtLast(cards, tmpCards);
};

// sắp xếp phỏm đôi có 4 lá chứa 1 card tạo đc phỏm sảnh
var arrangePhomDoiWithSanh = function (cards, limit) {
    var out = 0;
    if (limit < 4) {
        return [cards, out];
    }
    var tmpCards = cards.slice(0, limit);
    tmpCards = arrangeCardsDecrease(tmpCards);
    tmpCards = arrangeCardsByDoi(tmpCards);
    var tmp;
    tmp = arrangeCardsByPhomDoiFirst(tmpCards, tmp);
    if (tmp[1] < 4) {
        return [cards, out];
    }
    tmpCards = tmp[0];
    tmp = tmp[1];
    var compareCards = cards.slice(limit, cards.length);
    var index = 0;
    var check = [];
    while (index < tmp - 1) {
        if (tmpCards.length < index + 4) {
            break;
        }
        if (isPhomDoi(tmpCards.slice(index, index + 4))) {
            var xCards = tmpCards.slice(index, index + 4);

            for (var i = 0; i < xCards.length; i += 1) {
                check = [];
                check = getCardsPhomSanhByCard(xCards[i], compareCards);
                if (check.length > 2) {
                    tmpCards.splice(index + 1, 1);
                    out = check.length - 1;
                    tmpCards = insertListAtFirst(tmpCards, check);
                    break;
                }
            }
        }
        index += 3;
    }
    cards = insertListAtFirst(cards, tmpCards);
    return [cards, out];

};

// di chuyển gần phỏm sảnh gần đôi trong phỏm
var arrangeCardsByDoiSanh = function (cards, otherCards, limit) {
    var tmpCards = cards.slice(limit, cards.length);
    var index = otherCards.length - 1;
    var max = tmpCards.length - otherCards.length;
    if (max < 2 || otherCards.length < 1) {
        return cards;
    }
    while (index >= 0) {
        for (var i = 0; i < max; i += 1) {
            if (is2CardBoSanh(otherCards[index], tmpCards[i]) ||
                is2CardBoSanh(tmpCards[i], otherCards[index])) {
                tmpCards.splice(i + 1, 0, otherCards[index]);
                tmpCards.splice(max + index + 1, 1);
                max += 1;
                break;
            }
        }
        index -= 1;
    }
    return insertListAtLast(cards, tmpCards);
};

var arrangeCardsBySanhDoi = function (cards, otherCards, limit) {
    var tmpCards = cards.slice(limit, cards.length);
    var index = otherCards.length - 1;
    var max = tmpCards.length - otherCards.length;
    if (max < 2 || otherCards.length < 1) {
        return cards;
    }

    while (index >= 0) {
        for (var i = 0; i < max; i += 1) {
            if (is2CardBoDoi(otherCards[index], tmpCards[i])) {
                tmpCards.splice(i + 1, 0, otherCards[index]);
                tmpCards.splice(max + index + 1, 1);
                index -= 1;
                max += 1;
                break;
            }
        }
        index -= 1;
    }
    return insertListAtLast(cards, tmpCards);
};

// lấy phỏm sảnh lá theo card
var getCardsPhomSanhByCard = function (card, cards) {
    var tmpCards;
    cards.push(card);
    cards = arrangeCardsDecreaseWithLimit(cards, 0);
    cards = arrangeCardsBySanh(cards, 0);
    tmpCards = arrangeCardsByPhomSanhFirst(cards, 0);

    if (tmpCards[1] < 3) {
        return [];
    }
    cards = tmpCards[0].slice(0, tmpCards[1]);
    return cards;
};

// lấy ra các quân bài lẻ k chứa đôi
var getCardAloneChuaSanh = function (cards) {
    if (cards.length < 2) {
        return cards;
    }
    for (var i = cards.length - 1; i > 0; i -= 1) {
        if (cards[i].rank === cards[i - 1].rank) {
            if (i + 1 < cards.length) {
                return cards.slice(i + 1, cards.length);
            }
        }
    }
    return cards;
};

var getCardAloneChuaSanhWithLimit = function (cards, limit) {
    var tmpCards = cards.slice(limit, cards.length);
    return getCardAloneChuaSanh(tmpCards);
};

// lấy các quân bài lẻ k chứa sảnh
var getCardsAloneChuaDoi = function (cards) {
    if (cards.length < 2) {
        return cards;
    }
    for (var i = cards.length - 2; i > 0; i -= 1) {
        if (is2CardBoSanh(cards[i - 1], cards[i])) {
            return cards.slice(i + 1, cards.length);
        }
    }
    return cards;
};

var getCardsAloneChuaDoiWithLimit = function (cards, limit) {
    var tmpCards = cards.slice(limit, cards.length - limit);
    return getCardsAloneChuaDoi(tmpCards);
};

// lấy ra các quân bài lẻ k chứa đôi. k chua sanh
var getCardsFA = function (cards) {
    if (cards.length < 2) {
        return cards;
    }
    for (var i = cards.length - 2; i > 0; i -= 1) {
        if (is2CardBoSanh(cards[i], cards[i - 1])) {
            return cards.slice(i + 1, cards.length - 2);
        }
    }
    return cards;
};

// sắp xếp các phỏm đôi lên đầu tiên 
var arrangeCardsByPhomDoiFirst = function (cards) {
    var tmpCards = cards.slice();
    var checkCards = [];
    var index = cards.length - 1;
    var limit = 0;

    while (index > 1) {
        if (checkCards.length > 0) {
            checkCards = [];
        }
        if (index > 2) {
            checkCards.push(cards[index]);
            checkCards.push(cards[index - 1]);
            checkCards.push(cards[index - 2]);
            checkCards.push(cards[index - 3]);

            if (isPhomDoi(checkCards)) {
                checkCards.reverse();
                tmpCards = insertListAtFirst(tmpCards, checkCards);
                index -= 4;
                limit += 4;
                continue;
            } else {
                checkCards = [];
            }
        }
        checkCards.push(cards[index]);
        checkCards.push(cards[index - 1]);
        checkCards.push(cards[index - 2]);

        if (isPhomDoi(checkCards)) {
            checkCards.reverse();
            tmpCards = insertListAtFirst(tmpCards, checkCards);
            index -= 3;
            limit += 3;
            continue;
        }
        index -= 1;
    }
    return [tmpCards, limit];
};

//  sắp xêp đưa các phỏm sảnh lên đầu
var arrangeCardsByPhomSanhFirst = function (cards, limit) {
    var tmpCards = cards.slice();
    var checkCards = [];
    var index = cards.length - 1;
    limit = 0;
    while (index > 1) {
        if (checkCards.length > 0) {
            checkCards = [];
        }
        checkCards.push(cards[index]);
        for (var i = index; i > 0; i -= 1) {
            if (cards[i].suit.ID !== cards[i - 1].suit.ID) {
                break;
            }
            if (cards[i].rank.ID + 1 === cards[i - 1].rank.ID) {
                checkCards.push(cards[i - 1]);
                continue;
            }
            break;
        }
        if (isPhomSanh(checkCards)) {
            checkCards = arrangeCardsDecrease(checkCards);
            tmpCards = insertListAtFirst(tmpCards, checkCards);
            limit += checkCards.length;
            index -= checkCards.length;
            continue;
        }
        index -= 1;
    }
    return [tmpCards, limit];
};

//chèn 1 cardsA vào cardsB  ở vị trí đầu tiên - sao cho mảng mới k có item nào trùng nhau
var insertListAtFirst = function (cardsA, cardsB) {
    cardsA.splice.apply(cardsA, [0, 0].concat(cardsB));
    for (var i = 0; i < cardsB.length; i += 1) {
        for (var j = cardsB.length; j < cardsA.length; j += 1) {
            if (cardsB[i].getId() === cardsA[j].getId()) {
                cardsA.splice(j, 1);
                break;
            }
        }
    }
    return cardsA;
};

// chèn 1 cardsA vào cardsB ở vị trí cuối - sao cho mảng mới k có item nào trùng nhau
var insertListAtLast = function (cardsA, cardsB) {
    cardsA.splice.apply(cardsA, [cardsA.length, 0].concat(cardsB));
    for (var i = 0; i < cardsB.length; i += 1) {
        for (var j = 0; j < cardsA.length - cardsB.length; j += 1) {
            if (cardsB[i].getId() === cardsA[j].getId()) {
                cardsA.splice(j, 1);
                break;
            }
        }
    }
    return cardsA;
};

//move item trong list
var moveItemInArray = function (cards, oldIndex, newIndex) {
    var tmp = Card.fromId(cards[oldIndex].getId());
    cards.splice(oldIndex, 1);
    cards.splice(newIndex, 0, tmp);
    return cards;
};

// thêm 1 item vào array vào cuối sao cho duy nhất id trong array
var addItemAtLast = function (cards, card) {
    var tmp = card;
    for (var i = 0; i < cards.length; i += 1) {
        if (cards[i].getId() === tmp.getId()) {
            cards.splice(i, 1);
            break;
        }
    }
    cards.push(tmp);
    return cards;
};

// kiểm tra cards có phải là phỏm đôi k
var isPhomDoi = function (cards) {
    if (cards.length < 3 || cards.length > 4) {
        return false;
    }
    if (cards[0].rank === cards[1].rank && cards[0].rank === cards[2].rank) {

        if (cards.length > 3) {
            if (cards[0].rank === cards[3].rank) {
                return true;
            }
            return false;
        }
        return true;
    }
    return false;
};

// check phỏm sảnh(xếp theo giảm dần )
var isPhomSanh = function (cards) {
    if (cards.length < 3) {
        return false;
    }
    cards = arrangeCardsDecrease(cards);
    for (var i = 1; i < cards.length - 1; i += 1) {
        if (cards[i - 1].suit !== cards[i].suit ||
            cards[i].suit !== cards[i + 1].suit) {
            return false;
        }
        if (cards[i].rank.ID - 1 !== cards[i + 1].rank.ID ||
            cards[i - 1].rank.ID - 1 !== cards[i].rank.ID) {
            return false;
        }
    }
    return true;
};

// check 2 card có pải là gần phỏm sanh
var is2CardBoSanh = function (cardsA, cardsB) {
    if (cardsA.suit !== cardsB.suit) {
        return false;
    }
    if (cardsA.rank.ID - 1 === cardsB.rank.ID ||
        cardsA.rank.ID - 2 === cardsB.rank.ID) {
        return true;
    }
    return false;
};

// check 2 card có pải là gần phỏm doi
var is2CardBoDoi = function (cardsA, cardsB) {
    if (cardsA.rank.ID !== cardsB.rank.ID) {
        return false;
    }
    return true;
};

module.exports = {

    MixArray: mixArray,
    GetRandom: getRandom,
    GeneratePackCards: generatePackCards,
    ArrangeCardsDecrease: arrangeCardsDecrease,
    ArrangePositionCards: arrangePositionCards,
    ArrangeCardsOptimize: arrangeCardsOptimize,
};
