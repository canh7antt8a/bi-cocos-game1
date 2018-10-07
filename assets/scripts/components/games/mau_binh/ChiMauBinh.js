var Utils = require('Utils'),
    MauBinhConstant = require('MauBinhConstant');

module.exports = Utils.Class({

    $$constructor: function (cardIds) {
        this.cards = cardIds.slice(0);
        this.chi = MauBinhConstant.Chi.NONE;
        this.cardsChi = [];
        this.cardsInChi = [];
        for (var i = 0; i < 3; i += 1) {
            this.cardsChi.push(this.cards.slice(i * 5, i * 5 + (i >= 2 ? 3 : 5)));
            this.cardsInChi.push(0);
        }
        this.result = [MauBinhConstant.Chi.NONE, MauBinhConstant.Chi.NONE, MauBinhConstant.Chi.NONE];
        this._calculateResult();
    },

    getResult: function () {
        // cc.log(this.cardsInChi);
        return this.result;
    },

    getCardsNotInChi: function () {
        var i, j;
        var cards = [];
        var cardsAll = [],
            cardsInChiAll = [];
        for (i = 0; i < 3; i += 1) {
            for (j = 0; j < this.cardsChi[i].length; j += 1) {
                this._congQuanAt(this.cardsChi[i][j]);
                cardsAll.push(this.cardsChi[i][j]);
            }
        }
        for (i = 0; i < 3; i += 1) {
            for (j = 0; j < this.cardsInChi[i].length; j += 1) {
                this._congQuanAt(this.cardsInChi[i][j]);
                cardsInChiAll.push(this.cardsInChi[i][j]);
            }
        }
        for (i = 0; i < cardsAll.length; i += 1) {
            var isNotInChi = true;
            for (j = 0; j < cardsInChiAll.length; j += 1) {
                if (cardsAll[i] === cardsInChiAll[j]) {
                    isNotInChi = false;
                    break;
                }
            }
            if (isNotInChi) {
                Utils.Array.pushUnique(cards, cardsAll[i]);
            }
        }
        return cards;
    },

    isChiThung: function (indexChi) {
        var cardChi = this.cardsChi[indexChi];
        var first = cardChi[0] % 4;
        for (var i = 1; i < cardChi.length; i += 1) {
            if (first !== cardChi[i] % 4) {
                return false;
            }
        }
        this.cardsInChi[indexChi] = cardChi;
        return true;
        // return cardChi.length >= 5;
    },

    isChiSanh: function (indexChi) {
        var cardChi = this.cardsChi[indexChi];
        this.sortCard(cardChi);
        var card1 = cardChi[0];
        for (var i = 1; i < cardChi.length; i += 1) {
            if (this.getSubRank(card1, cardChi[i]) !== i) {
                return false;
            }
        }
        this.cardsInChi[indexChi] = cardChi;
        return true;
        // return cardChi.length >= 5;
    },

    isChiSanhAt: function (indexChi) {
        var cardChi = this.cardsChi[indexChi];
        this._congQuanAt(cardChi);
        this.sortCard(cardChi);
        var card1 = cardChi[0];
        for (var i = 1; i < cardChi.length; i += 1) {
            if (this.getSubRank(card1, cardChi[i]) !== i) {
                return false;
            }
        }
        this.cardsInChi[indexChi] = cardChi;
        return true;
        // return cardChi.length >= 5;
    },

    isSanhRong: function () {
        var cardsTmp = this.cards.slice(0);
        this.sortCard(cardsTmp);
        var card1 = cardsTmp[0];
        for (var i = 1; i < cardsTmp.length; i += 1) {
            if (this.getSubRank(card1, cardsTmp[i]) !== i) {
                return false;
            }
        }
        return true;
    },

    isThangTrang: function () {
        return this.result[0] === MauBinhConstant.Chi.LUC_PHE_BON ||
            this.result[0] === MauBinhConstant.Chi.BA_CAI_SANH ||
            this.result[0] === MauBinhConstant.Chi.BA_CAI_THUNG ||
            this.result[0] === MauBinhConstant.Chi.SANH_RONG;
    },

    isBinhLung: function () {
        if (this.isThangTrang()) {
            return false;
        }
        var binhLung = this.result[0].ID < this.result[1].ID || this.result[0].ID < this.result[2].ID || this.result[1].ID < this.result[2].ID;
        if (!binhLung) {
            binhLung = this._tinhBinhLungChiGiongNhau();
        }
        return binhLung;
    },

    _congQuanAt: function (cards) {
        for (var j = 0; j < cards.length; j += 1) {
            if (cards[j] <= 3) {
                cards[j] += 52;
            }
        }
    },

    _tinhBinhLungChiGiongNhau: function () {
        var binhLung = false;
        for (var i = 0; i < 3 - 1; i += 1) {
            for (var j = i + 1; j < 3; j += 1) {
                if (!binhLung && this.result[i].ID === this.result[j].ID) {
                    binhLung = this._tinhBinhLung2ChiGiongNhau(i, j);
                    if (binhLung) {
                        break;
                    }
                }
            }
        }
        return binhLung;
    },

    _tinhBinhLung2ChiGiongNhau: function (index1, index2) {
        var chi1 = this.cardsInChi[index1];
        var chi2 = this.cardsInChi[index2];
        var binhLung = false;

        // Neu Chi Cu Lu
        if (this.result[index1] === MauBinhConstant.Chi.CU_LU) {
            // Lay Gia Tri Lon Nhat Cua Chi
            var maxChi1, maxChi0;
            maxChi0 = this._getMaxChiCuLu(chi1);
            maxChi1 = this._getMaxChiCuLu(chi2);

            // Lay Rank ID
            maxChi0 = Math.floor(maxChi0 / 4);
            maxChi1 = Math.floor(maxChi1 / 4);
            binhLung = maxChi0 < maxChi1;
        }
        // 2 MAU THAU => Lay Quan Lon Nhat Trong Chi
        else if (this.result[index1] === MauBinhConstant.Chi.MAU_THAU) {
            chi1 = this.cardsChi[index1];
            chi2 = this.cardsChi[index2];
            binhLung = this._tinhBinhLungSoSanhLoaiTruQuanGiongNhau(chi1, chi2);
        }
        // Chi  ĐÔI - THU
        else if (this.result[index1] === MauBinhConstant.Chi.DOI || this.result[index1] === MauBinhConstant.Chi.THU) {
            binhLung = this._tinhBinhLungSoSanhLoaiTruQuanGiongNhauChiDOITHU(index1, index2, this.result[index1]);
        }
        // Cac chi con lai
        else {
            chi1 = this.cardsInChi[index1];
            chi2 = this.cardsInChi[index2];
            binhLung = this._tinhBinhLungSoSanhLoaiTruQuanGiongNhau(chi1, chi2);
        }
        return binhLung;
    },

    _tinhBinhLungSoSanhLoaiTruQuanGiongNhau: function (chi1, chi2) {
        var ingnoreValues1 = [];
        var ingnoreValues2 = [];
        var max1, max2, count = 0;
        while (true) {
            max1 = this.getMaxOfArray(chi1, ingnoreValues1);
            max2 = this.getMaxOfArray(chi2, ingnoreValues2);
            var round1 = Math.floor(max1 / 4);
            var round2 = Math.floor(max2 / 4);
            if (round1 === round2 && round1 !== -1) {
                // Cho Vao Danh Sach Bo Qua
                ingnoreValues1.push(max1);
                ingnoreValues2.push(max2);
            }
            if (round1 !== round2 || ingnoreValues1.length >= chi1.length || ingnoreValues2.length >= chi2.length || count >= 5) {
                break;
            }
            count += 1;
        }
        var binhLung = (Math.floor(max1 / 4) < Math.floor(max2 / 4));
        return binhLung;
    },

    _tinhBinhLungSoSanhLoaiTruQuanGiongNhauChiDOITHU: function (index1, index2, type) {
        var round1, round2;
        var chi1 = this.cardsInChi[index1];
        var chi2 = this.cardsInChi[index2];
        var ingnoreValues1 = [];
        var ingnoreValues2 = [];
        var max1, max2, count = 0;
        while (true) {
            max1 = this.getMaxOfArray(chi1, ingnoreValues1);
            max2 = this.getMaxOfArray(chi2, ingnoreValues2);
            round1 = Math.floor(max1 / 4);
            round2 = Math.floor(max2 / 4);
            if (round1 === round2 && round1 !== -1) {
                // Cho Vao Danh Sach Bo Qua
                ingnoreValues1.push(max1);
                ingnoreValues2.push(max2);
            }
            if (round1 !== round2 || ingnoreValues1.length >= chi1.length || ingnoreValues2.length >= chi2.length || count >= 5) {
                break;
            }
            count += 1;
        }
        var binhLung = (Math.floor(max1 / 4) < Math.floor(max2 / 4));

        // Truong Hop Dac Biet 2 Doi Giong Nhau
        var maxQuanGiongNhau = type === MauBinhConstant.Chi.DOI ? 2 : 4;
        if (!binhLung && ingnoreValues1.length >= maxQuanGiongNhau) {
            chi1 = this.cardsChi[index1];
            chi2 = this.cardsChi[index2];
            while (true) {
                max1 = this.getMaxOfArray(chi1, ingnoreValues1);
                max2 = this.getMaxOfArray(chi2, ingnoreValues2);
                round1 = Math.floor(max1 / 4);
                round2 = Math.floor(max2 / 4);
                if (round1 === round2 && round1 !== -1) {
                    // Cho Vao Danh Sach Bo Qua
                    ingnoreValues1.push(max1);
                    ingnoreValues2.push(max2);
                }
                if (round1 !== round2 || ingnoreValues1.length >= chi1.length || ingnoreValues2.length >= chi2.length || count >= 5) {
                    break;
                }
                count += 1;
            }
            binhLung = (Math.floor(max1 / 4) < Math.floor(max2 / 4));
        }
        return binhLung;
    },

    getMaxOfArray: function (numArray, ingnoreValues) {
        // Lay Phan Tu Thoa Man
        var newList = [];
        var i, j;
        for (i = 0; i < numArray.length; i += 1) {
            var tmp = numArray[i];
            var isOk = true;
            for (j = 0; j < ingnoreValues.length; j += 1) {
                if (tmp === ingnoreValues[j]) {
                    isOk = false;
                    break;
                }
            }
            if (isOk) {
                newList.push(tmp);
            }
        }

        // Tim Max
        var max = -1;
        if (newList.length > 0) {
            max = Math.max.apply(null, newList);
        }
        return max;
    },

    _getMaxChiCuLu: function (cardsId) {
        var list1 = [],
            list2 = [];
        list1.push(cardsId[0]);
        for (var i = 1; i < cardsId.length; i += 1) {
            if (this.getSubRank(list1[0], cardsId[i]) === 0) {
                list1.push(cardsId[i]);
            }
            else {
                list2.push(cardsId[i]);
            }
        }
        var max = list1.length === 3 ? list1[0] : list2[0];
        return max;
    },

    _calculateResult: function () {
        var i, j;
        // Sanh Rong
        var isSanhRong = this.isSanhRong();
        if (isSanhRong) {
            for (i = 0; i < 3; i += 1) {
                this.result[i] = MauBinhConstant.Chi.SANH_RONG;
            }
            return this.result;
        }

        // Thung Pha Sanh - Sanh - Thung - Doi - Cu Lu - Sam
        for (i = 0; i < 3; i += 1) {
            var chi = MauBinhConstant.Chi.NONE;
            var isThung = this.isChiThung(i);
            var isSanh = this.isChiSanh(i);
            if (!isSanh) {
                isSanh = this.isChiSanhAt(i);
            }
            if (isThung && isSanh) {
                chi = MauBinhConstant.Chi.THUNG_PHA_SANH;
            }
            else if (isThung) {
                chi = MauBinhConstant.Chi.THUNG;
            }
            else if (isSanh) {
                chi = MauBinhConstant.Chi.SANH;
            }
            else {
                chi = this._calculateTuQuyCuLuThuDoi(i);
            }
            if (chi === MauBinhConstant.Chi.NONE) {
                chi = MauBinhConstant.Chi.MAU_THAU;
            }
            this.result[i] = chi;
        }

        // Check Chi Dac Biet
        var chiSpecial = MauBinhConstant.Chi.NONE;

        // Luc Phe Bon
        if (this.result[0] === this.result[1] && this.result[0] === MauBinhConstant.Chi.THU && this.result[2] === MauBinhConstant.Chi.DOI) {
            var cardsNotInChi = this.getCardsNotInChi();
            for (i = 0; i < cardsNotInChi.length - 1; i += 1) {
                for (j = i + 1; j < cardsNotInChi.length; j += 1) {
                    if (this.getSubRank(cardsNotInChi[i], cardsNotInChi[j]) === 0) {
                        chiSpecial = MauBinhConstant.Chi.LUC_PHE_BON;
                        break;
                    }
                }
            }
        }

        // Ba Cai Thung
        if ((this.result[0] === this.result[1] && this.result[0] === MauBinhConstant.Chi.THUNG && (this.result[2] === MauBinhConstant.Chi.THUNG_PHA_SANH || this.result[2] === MauBinhConstant.Chi.THUNG)) ||
            (this.result[0] === this.result[2] && this.result[0] === MauBinhConstant.Chi.THUNG && (this.result[1] === MauBinhConstant.Chi.THUNG_PHA_SANH || this.result[1] === MauBinhConstant.Chi.THUNG)) ||
            (this.result[1] === this.result[2] && this.result[1] === MauBinhConstant.Chi.THUNG && (this.result[0] === MauBinhConstant.Chi.THUNG_PHA_SANH || this.result[0] === MauBinhConstant.Chi.THUNG))) {
            chiSpecial = MauBinhConstant.Chi.BA_CAI_THUNG;

        }

        // Ba Cai Sanh
        if ((this.result[0] === this.result[1] && this.result[0] === MauBinhConstant.Chi.SANH && (this.result[2] === MauBinhConstant.Chi.THUNG_PHA_SANH || this.result[2] === MauBinhConstant.Chi.SANH)) ||
            (this.result[0] === this.result[2] && this.result[0] === MauBinhConstant.Chi.SANH && (this.result[1] === MauBinhConstant.Chi.THUNG_PHA_SANH || this.result[1] === MauBinhConstant.Chi.SANH)) ||
            (this.result[1] === this.result[2] && this.result[1] === MauBinhConstant.Chi.SANH && (this.result[0] === MauBinhConstant.Chi.THUNG_PHA_SANH || this.result[0] === MauBinhConstant.Chi.SANH))) {
            chiSpecial = MauBinhConstant.Chi.BA_CAI_SANH;

        }

        if (chiSpecial !== MauBinhConstant.Chi.NONE) {
            for (i = 0; i < 3; i += 1) {
                this.result[i] = chiSpecial;
            }
            return this.result;
        }

        // Check Mau Thau Chi 3
        if (this.result[2] === MauBinhConstant.Chi.SANH || this.result[2] === MauBinhConstant.Chi.THUNG ||
            this.result[2] === MauBinhConstant.Chi.THUNG_PHA_SANH) {
            this.result[2] = MauBinhConstant.Chi.MAU_THAU;
            this.cardsInChi[2] = [];
        }
        return this.result;
    },

    _calculateTuQuyCuLuThuDoi: function (indexChi) {
        var countEquals = this.getCountEqualsRank(this.cardsChi[indexChi]);
        var chi = MauBinhConstant.Chi.NONE;
        switch (countEquals.count) {
        case 0:
            break;
        case 1: // Doi
            chi = MauBinhConstant.Chi.DOI;
            break;
        case 2: // Thu 
            chi = MauBinhConstant.Chi.THU;
            break;
        case 3: // Sam Co
            chi = MauBinhConstant.Chi.SAM;
            break;
        case 4: // Cu Lu
            chi = MauBinhConstant.Chi.CU_LU;
            break;
        case 6: // Tu Quy
            chi = MauBinhConstant.Chi.TU_QUY;
            break;
        }
        this.cardsInChi[indexChi] = countEquals.cards;
        return chi;
    },

    getCountEqualsRank: function (cardIds) {
        var count = 0;
        var cards = [];
        for (var i = 0; i < cardIds.length - 1; i += 1) {
            for (var j = i + 1; j < cardIds.length; j += 1) {
                if (this.getSubRank(cardIds[i], cardIds[j]) === 0) {
                    count += 1;
                    Utils.Array.pushUnique(cards, cardIds[i]);
                    Utils.Array.pushUnique(cards, cardIds[j]);
                }
            }
        }
        if (count <= 0) {
            cards = [];
        }
        return {
            count: count,
            cards: cards
        };
    },

    getSubRank: function (cardId1, cardId2) {
        var sub = Math.abs(Math.floor(cardId1 / 4) - Math.floor(cardId2 / 4));
        return sub;
    },

    sortCard: function (cardIds) {
        // Sort Tang Dan
        for (var i = 0; i < cardIds.length - 1; i += 1) {
            for (var j = i + 1; j < cardIds.length; j += 1) {
                if (cardIds[i] > cardIds[j]) {
                    var tmp = cardIds[i];
                    cardIds[i] = cardIds[j];
                    cardIds[j] = tmp;
                }
            }
        }
    }
});
