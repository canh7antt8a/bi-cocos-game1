var ccSpawn = cc.spawn,
    ccSequence = cc.sequence;

function createWrapper(original) {
    return function (array) {
        if (!Array.isArray(array)) {
            array = Array.prototype.slice.call(arguments);
        }
        while (array.length < 2) {
            array.push(cc.callFunc(function () {}));
        }
        return original.call(null, array);
    };
}

cc.spawn = createWrapper(ccSpawn);
cc.sequence = createWrapper(ccSequence);

var Utils = {
    String: {
        CaseType: cc.Enum({
            NONE: 0,
            UPPER: 1,
            LOWER: 2,
            CAMEL: 3,
        }),

        changeCase: function (s, strCase) {
            switch (strCase) {
            case this.CaseType.NONE:
                return s;
            case this.CaseType.UPPER:
                return s.toUpperCase();
            case this.CaseType.LOWER:
                return s.toLowerCase();
            case this.CaseType.CAMEL:
                return s.substr(0, 1).toUpperCase() + s.substr(1).toLowerCase();
            }
        },

        param: function (abj) {
            var s = [],
                rbracket = /\[\]$/,
                isArray = function (obj) {
                    return Array.isArray(obj);
                },
                add = function (k, v) {
                    v = typeof v === 'function' ? v() : v === null ? '' : v === undefined ? '' : v;
                    s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
                },
                buildParams = function (prefix, obj) {
                    var i, len, key;

                    if (prefix) {
                        if (isArray(obj)) {
                            for (i = 0, len = obj.length; i < len; i += 1) {
                                if (rbracket.test(prefix)) {
                                    add(prefix, obj[i]);
                                }
                                else {
                                    buildParams(prefix + '[' + (typeof obj[i] === 'object' ? i : '') + ']', obj[i]);
                                }
                            }
                        }
                        else if (obj && String(obj) === '[object Object]') {
                            for (key in obj) {
                                buildParams(prefix + '[' + key + ']', obj[key]);
                            }
                        }
                        else {
                            add(prefix, obj);
                        }
                    }
                    else if (isArray(obj)) {
                        for (i = 0, len = obj.length; i < len; i += 1) {
                            add(obj[i].name, obj[i].value);
                        }
                    }
                    else {
                        for (key in obj) {
                            buildParams(key, obj[key]);
                        }
                    }
                    return s;
                };

            return buildParams('', abj).join('&').replace(/%20/g, '+');
        },

        deparam: function (query) {
            var pair,
                query_string = {},
                vars = query.split('̃&');
            for (var i = 0; i < vars.length; i += 1) {
                pair = vars[i].split('=');
                pair[0] = decodeURIComponent(pair[0]);
                pair[1] = decodeURIComponent(pair[1]);
                // If first entry with this name
                if (typeof query_string[pair[0]] === 'undefined') {
                    query_string[pair[0]] = pair[1];
                    // If second entry with this name
                }
                else if (typeof query_string[pair[0]] === 'string') {
                    var arr = [query_string[pair[0]], pair[1]];
                    query_string[pair[0]] = arr;
                    // If third or later entry with this name
                }
                else {
                    query_string[pair[0]].push(pair[1]);
                }
            }
            return query_string;
        },

        removeRichText: (function () {
            var REGEXES = [
                /<i>(.*)<\/i>/i,
                /<b>(.*)<\/b>/i,
                /<color(?:=[^>]*)*>(.+)<\/color>/i,
            ];
            return function (string) {
                var i;
                for (i = 0; i < REGEXES.length; i += 1) {
                    string = string.replace(REGEXES[i], '$1');
                }
                return string;
            };
        }()),

        escape: function (str) {
            return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    },

    Array: {
        removeRef: function (arr, elem) {
            var i = arr.indexOf(elem);
            if (i > -1) {
                arr.splice(i, 1);
            }
        },

        remove: function (arr, elem) {
            var i = Utils.Array.indexOf(arr, elem);
            if (i > -1) {
                arr.splice(i, 1);
            }
        },

        /**
         * Iterate an array and touch each its element, even if the array can be modified.
         *
         * @param  {Array} arr     array
         * @param  {Function} handler same as callback of ``Array.prototype.forEach()``
         */
        forEach: function (arr, handler) {
            arr.slice().forEach(handler);
        },

        trimLeft: function (arr, size) {
            while (arr.length > size) {
                arr.shift();
            }
        },

        trimRight: function (arr, size) {
            while (arr.length > size) {
                arr.pop();
            }
        },

        /**
         * Same as Array.prototype.indexOf() but deal with equality better.
         */
        indexOf: function (arr, val) {
            var i;
            for (i = 0; i < arr.length; i += 1) {
                if (Utils.Object.isEqual(arr[i], val)) {
                    return i;
                }
            }
            return -1;
        },

        unique: function (arr) {
            var result = [],
                val,
                i;
            for (i = 0; i < arr.length; i += 1) {
                val = arr[i];
                if (result.indexOf(val) === -1) {
                    result.push(val);
                }
            }
            return result;
        },

        pushUnique: function (arr, val) {
            if (Utils.Array.indexOf(arr, val) === -1) {
                arr.push(val);
                return true;
            }
            return false;
        },

        createCircular: (function () {
            function Circular(array) {
                this._array = array;
                this._index = -1;
            }

            Circular.prototype.next = function () {
                this._index += 1;
                if (this._index >= this._array.length) {
                    this._index = 0;
                }
                return this._array[this._index];
            };

            Circular.prototype.prev = function () {
                this._index -= 1;
                if (this._index < 0) {
                    this._index = this._array.length - 1;
                }
                return this._array[this._index];
            };

            return function (array) {
                return new Circular(array);
            };
        }())
    },

    Set: {
        compare: function (set1, set2) {
            var same = [],
                diff12 = [],
                diff21 = [];

            if (set1 === set2) {
                same = set1.slice();
            }
            else {
                var i, j, v1, v2;
                diff12 = set1.slice();
                diff21 = set2.slice();
                for (i = 0; i < set1.length; i += 1) {
                    v1 = set1[i];
                    for (j = 0; j < set2.length; j += 1) {
                        v2 = set2[j];
                        if (Utils.Object.isEqual(v1, v2)) {
                            same.push(v1);
                            Utils.Array.remove(diff12, v1);
                            Utils.Array.remove(diff21, v1);
                            break;
                        }
                    }
                }
            }

            return {
                same: same,
                diff12: diff12,
                diff21: diff21
            };
        }
    },

    Object: {
        isEqual: function (o1, o2) {
            if (o1 === o2) {
                return true;
            }

            if (typeof o1 !== typeof o2) {
                return false;
            }

            if (o1 === undefined || o1 === null || (typeof o1 === 'number' && isNaN(o1) && isNaN(o2))) {
                return true;
            }

            var isDate1 = Utils.Type.isDate(o1),
                isDate2 = Utils.Type.isDate(o2);

            if ((isDate1 && !isDate2) || (!isDate1 && isDate2)) {
                return false;
            }
            if (isDate1 && isDate2) {
                return o1.getTime() === o2.getTime();
            }

            var isRegExp1 = Utils.Type.isRegExp(o1),
                isRegExp2 = Utils.Type.isRegExp(o2);

            if ((isRegExp1 && !isRegExp2) || (!isRegExp1 && isRegExp2)) {
                return false;
            }
            if (isRegExp1 && isRegExp2) {
                return o1.toString() === o2.toString();
            }

            if (Utils.Type.isObject(o1) && Utils.Type.isObject(o2)) {
                var o1Props = Object.getOwnPropertyNames(o1),
                    o2Props = Object.getOwnPropertyNames(o2),
                    i;

                if (o1Props.length !== o2Props.length) {
                    return false;
                }

                for (i = 0; i < o1Props.length; i += 1) {
                    if (!Utils.Object.isEqual(o1[o1Props[i]], o2[o2Props[i]])) {
                        return false;
                    }
                }

                return true;
            }
            else {
                return o1 === o2;
            }
        },

        /**
         * Find object inside parent object whose value of prop name is equality with specified value.
         *
         * @param  {Object} obj       parent object to find
         * @param  {String} propName  property name
         * @param  {*}      propValue property value
         * @return {Object}           found object or null
         */
        findObject: function (obj, propName, propValue) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    var val = obj[prop];
                    if (Utils.Type.isObject(val) && val[propName] === propValue) {
                        return val;
                    }
                }
            }
            return null;
        },

        replaceProperty: function (obj, oldProp, newProp) {
            var value = obj[oldProp];
            delete obj[oldProp];
            obj[newProp] = value;
        },

        isEmpty: function (obj) {
            return Object.getOwnPropertyNames(obj).length === 0;
        },

        /**
         * Return new object with same properties of original object, but all its props
         * are unchangable.
         *
         * @param  {Object} obj original object
         * @return {Object}     constant object
         */
        toConstant: function (obj) {
            var r = {},
                prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    var val = obj[prop];
                    if (Utils.Type.isObject(val)) {
                        val = Utils.Object.toConstant(val);
                    }
                    Object.defineProperty(r, prop, {
                        value: val,
                        writable: false,
                        enumerable: true,
                        configurable: true
                    });
                }
            }
            return r;
        },

        values: function (obj) {
            if (Utils.Type.isFunction(Object.values)) {
                return Object.values(obj);
            }

            var values = [],
                prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    values.push(obj[prop]);
                }
            }
            return values;
        },
    },

    Type: {
        isString: function (obj) {
            return typeof obj === 'string';
        },

        isNumber: function (obj) {
            return typeof obj === 'number' && !isNaN(obj);
        },

        isObject: function (obj) {
            return typeof obj === 'object' && obj !== null;
        },

        isFunction: function (obj) {
            return typeof obj === 'function';
        },

        isUndefined: function (obj) {
            return typeof obj === 'undefined';
        },

        isDefined: function (obj) {
            return !this.isUndefined(obj) && obj !== null;
        },

        isArray: function (obj) {
            return Array.isArray(obj);
        },

        isDate: function (obj) {
            return obj instanceof Date;
        },

        isRegExp: function (obj) {
            return obj instanceof RegExp;
        }
    },

    Number: {
        format: function (number) {
            var numberStr = Math.abs(number).toString(),
                intStrPartNew = '',
                parts, intStrPart, floatPart, i, j;
            numberStr = numberStr.replace('.', ',');
            parts = numberStr.split(',');
            intStrPart = parts[0];
            floatPart = parts[1];
            for (i = intStrPart.length - 1, j = 1; i >= 0; i -= 1, j += 1) {
                intStrPartNew = intStrPart[i] + intStrPartNew;
                if (j % 3 === 0 && i !== 0) {
                    intStrPartNew = '.' + intStrPartNew;
                }
            }
            return ((number < 0 ? '-' : '') + intStrPartNew + (floatPart ? (',' + floatPart) : ''));
        },

        abbreviate: function (number, decPlaces) {
            // 2 decimal places => 100, 3 => 1000, etc
            decPlaces = Math.pow(10, decPlaces || 2);

            // Enumerate number abbreviations
            var abbrev = ['K', 'M', 'B', 'T'],
                str = (number < 0) ? '-' : '',
                size;

            number = Math.abs(number);

            // Go through the array backwards, so we do the largest first
            for (var i = abbrev.length - 1; i >= 0; i -= 1) {
                // Convert array index to '1000', '1000000', etc
                size = Math.pow(10, (i + 1) * 3);
                // If the number is bigger or equal do the abbreviation
                if (size <= number) {
                    // Here, we multiply by decPlaces, round, and then divide by decPlaces.
                    // This gives us nice rounding to a particular decimal place.
                    number = Math.floor(number * decPlaces / size) / decPlaces;
                    // Handle special case where we round up to the next abbreviation
                    if ((number === 1000) && (i < abbrev.length - 1)) {
                        number = 1;
                        i += 1;
                    }
                    // Add the letter for the abbreviation
                    number += abbrev[i];
                    // We are done... stop
                    break;
                }
            }
            return str + number;
        },

        fillZero: function (number, maxSize) {
            var s = '' + number;
            while (s.length < maxSize) {
                s = '0' + s;
            }
            return s;
        },

        random: function (from, to) {
            var add = (from === 0 || to === 0) ? 1 : 0;
            return Math.floor((Math.random() * (to + add)) + from);
        }
    },

    Date: {
        currentTime: function () {
            var date = new Date();
            return Utils.Number.fillZero(date.getHours(), 2) + ':' +
                Utils.Number.fillZero(date.getMinutes(), 2) + ':' +
                Utils.Number.fillZero(date.getSeconds(), 2);
        },
        /**
         * Convert "2016-11-17 17:50:00" to Date(2016, 11, 17, 17, 50, 00)
         */
        fromString: function (s) {
            var year = s.slice(0, 4),
                month = s.slice(5, 7) - 1,
                day = s.slice(8, 10),
                hour = s.slice(11, 13),
                minute = s.slice(14, 16),
                second = s.slice(17, 19);
            return new Date(year, month, day, hour, minute, second);
        },
        /**
         * Convert 123456 second to (3 day, 15:04:15)
         */
        fromSecond: function (time) {
            var day = Math.floor(time / 24 / 60.0 / 60.0);
            var daySecond = day * 24 * 60 * 60;
            var hour = Math.floor((time - daySecond) / 60.0 / 60.0);
            var hourSecond = hour * 60 * 60;
            var minute = Math.floor((time - daySecond - hourSecond) / 60.0);
            var second = Math.floor(time - minute * 60 - daySecond - hourSecond);
            var timeFormat = ((hour < 10) ? ('0' + hour) : hour) + ':' + ((minute < 10) ? ('0' + minute) : minute) + ':' + ((second < 10) ? ('0' + second) : second);
            if (day > 0) {
                timeFormat = day + ' ngày, ' + timeFormat;
            }
            return timeFormat;
        },


        format: (function () {
            var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'|'[^']*'/g;
            var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
            var timezoneClip = /[^-+\dA-Z]/g;

            function getDayOfWeek(date) {
                var dow = date.getDay();
                if (dow === 0) {
                    dow = 7;
                }
                return dow;
            }

            function getWeek(date) {
                // Remove time components of date
                var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                // Change date to Thursday same week
                targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

                // Take January 4th as it is always in week 1 (see ISO 8601)
                var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

                // Change date to Thursday same week
                firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

                // Check if daylight-saving-time-switch occured and correct for it
                var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
                targetThursday.setHours(targetThursday.getHours() - ds);

                // Number of weeks between target Thursday and first Thursday
                var weekDiff = (targetThursday - firstThursday) / (86400000 * 7);
                return 1 + Math.floor(weekDiff);
            }

            // Regexes and supporting functions are cached through closure
            var dateFormat = function (date, mask, utc, gmt) {

                // You can't provide utc if you skip other args (use the 'UTC:' mask prefix)
                if (arguments.length === 1 && typeof date === 'string' === 'string' && !/\d/.test(date)) {
                    mask = date;
                    date = undefined;
                }

                date = date || new Date();

                if (!(date instanceof Date)) {
                    date = new Date(date);
                }

                if (isNaN(date)) {
                    throw TypeError('Invalid date');
                }

                mask = String(dateFormat.masks[mask] || mask || dateFormat.masks['default']);

                // Allow setting the utc/gmt argument via the mask
                var maskSlice = mask.slice(0, 4);
                if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
                    mask = mask.slice(4);
                    utc = true;
                    if (maskSlice === 'GMT:') {
                        gmt = true;
                    }
                }

                var pad = Utils.Number.fillZero;
                var _ = utc ? 'getUTC' : 'get';
                var d = date[_ + 'Date']();
                var D = date[_ + 'Day']();
                var m = date[_ + 'Month']();
                var y = date[_ + 'FullYear']();
                var H = date[_ + 'Hours']();
                var M = date[_ + 'Minutes']();
                var s = date[_ + 'Seconds']();
                var L = date[_ + 'Milliseconds']();
                var o = utc ? 0 : date.getTimezoneOffset();
                var W = getWeek(date);
                var N = getDayOfWeek(date);
                var flags = {
                    d: d,
                    dd: pad(d, 2),
                    ddd: dateFormat.i18n.dayNames[D],
                    dddd: dateFormat.i18n.dayNames[D + 7],
                    m: m + 1,
                    mm: pad(m + 1, 2),
                    mmm: dateFormat.i18n.monthNames[m],
                    mmmm: dateFormat.i18n.monthNames[m + 12],
                    yy: String(y).slice(2),
                    yyyy: y,
                    h: H % 12 || 12,
                    hh: pad(H % 12 || 12, 2),
                    H: H,
                    HH: pad(H, 2),
                    M: M,
                    MM: pad(M, 2),
                    s: s,
                    ss: pad(s, 2),
                    l: pad(L, 3),
                    L: pad(Math.round(L / 10), 2),
                    t: H < 12 ? 'a' : 'p',
                    tt: H < 12 ? 'am' : 'pm',
                    T: H < 12 ? 'A' : 'P',
                    TT: H < 12 ? 'AM' : 'PM',
                    Z: gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
                    o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10],
                    W: W,
                    N: N
                };

                return mask.replace(token, function (match) {
                    if (match in flags) {
                        return flags[match];
                    }
                    return match.slice(1, match.length - 1);
                });
            };

            dateFormat.masks = {
                'default': 'ddd mmm dd yyyy HH:MM:ss',
                'shortDate': 'm/d/yy',
                'mediumDate': 'mmm d, yyyy',
                'longDate': 'mmmm d, yyyy',
                'fullDate': 'dddd, mmmm d, yyyy',
                'shortTime': 'h:MM TT',
                'mediumTime': 'h:MM:ss TT',
                'longTime': 'h:MM:ss TT Z',
                'isoDate': 'yyyy-mm-dd',
                'isoTime': 'HH:MM:ss',
                'isoDateTime': 'yyyy-mm-dd\'T\'HH:MM:sso',
                'isoUtcDateTime': 'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
                'expiresHeaderFormat': 'ddd, dd mmm yyyy HH:MM:ss Z'
            };

            // Internationalization strings
            dateFormat.i18n = {
                dayNames: [
                    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
                    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
                ],
                monthNames: [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
                ]
            };

            return dateFormat;
        })()
    },

    Cookie: {
        get: function (name) {
            var value,
                cookies,
                cookieItem;
            cookies = document.cookie.split('; ');
            for (var i = 0; i < cookies.length; i += 1) {
                cookieItem = cookies[i].split('=');
                if (cookieItem[0] === name) {
                    value = cookieItem[1];
                }
            }
            return value;
        },
        set: function (name, value, expires, path, domain, secure) {
            var cookieStr = name + '=' + value + '; ';
            if (expires) {
                expires = this._setExpiration(expires);
                cookieStr += 'expires=' + expires + '; ';
            }
            if (path) {
                cookieStr += 'path=' + path + '; ';
            }
            if (domain) {
                cookieStr += 'domain=' + domain + '; ';
            }
            if (secure) {
                cookieStr += 'secure; ';
            }
            document.cookie = cookieStr;
        },
        _setExpiration: function (cookieLife) {
            var today = new Date();
            var expr = new Date(today.getTime() + cookieLife * 24 * 60 * 60 * 1000);
            return expr.toGMTString();
        }
    },

    /**
     * Usage:
     *
     * var SuperClass = Utils.Class({
     *     $$constructor: function (param) {
     *         this.param = param;
     *     },
     *
     *     $$static: {
     *         STATIC_VAR: 100,
     *         staticMethod: function () {}
     *     },
     *
     *     someMethod: function (extraParam) {
     *         // use 'extraParam' and 'this.param'
     *     }
     * });
     *
     * var DerivedClass = Utils.Class({
     *     $$extends: SuperClass,
     *
     *     $$constructor: function (param, extraParam) {
     *         // call super constructor
     *         this.$super.constructor.call(this, param);
     *         this.extraParam = extraParam;
     *     },
     *
     *     someMethod: function (extraParam, extraExtraParam) {
     *         // call super method
     *         this.$super.someMethod.call(this, extraParam);
     *         // use 'extraExtraParam'
     *     },
     *
     *     otherMethod: function (extraParam) {
     *         // use 'extraParam', 'this.param' and 'this.extraParam'
     *     }
     * })
     *
     */
    Class: (function () {
        var RESERVED_KEYWORDS = ['$$constructor', '$$extends', '$$static'];

        return function (objSpec) {
            var F = objSpec.$$constructor || function () {},
                prop, value, staticProp;

            for (prop in objSpec) {
                if (objSpec.hasOwnProperty(prop)) {
                    value = objSpec[prop];
                    if (prop === '$$static') {
                        for (staticProp in value) {
                            if (value.hasOwnProperty(staticProp)) {
                                F[staticProp] = value[staticProp];
                            }
                        }
                    }
                    else if (prop === '$$extends') {
                        F.prototype = Object.create(value.prototype);
                        F.prototype.$super = Object.create(value.prototype);
                        F.prototype.constructor = F;
                    }
                    else if (RESERVED_KEYWORDS.indexOf(prop) === -1) {
                        F.prototype[prop] = value;
                    }
                }
            }

            return F;
        };
    }()),

    Node: {
        getChild: function (parentNode, dottedName) {
            var names = dottedName.split('.'),
                node = parentNode,
                i;
            for (i = 0; i < names.length; i += 1) {
                if (node === null) {
                    break;
                }
                node = node.getChildByName(names[i]);
            }
            return node;
        },

        stopPropagation: function (node) {
            function disableEventFn(event) {
                event.stopPropagation();
            }

            node.on(cc.Node.EventType.TOUCH_START, disableEventFn);
            node.on(cc.Node.EventType.TOUCH_END, disableEventFn);
            node.on(cc.Node.EventType.TOUCH_MOVE, disableEventFn);
            node.on(cc.Node.EventType.MOUSE_DOWN, disableEventFn);
            node.on(cc.Node.EventType.MOUSE_UP, disableEventFn);
            node.on(cc.Node.EventType.MOUSE_MOVE, disableEventFn);

            return function () {
                node.off(cc.Node.EventType.TOUCH_START, disableEventFn);
                node.off(cc.Node.EventType.TOUCH_END, disableEventFn);
                node.off(cc.Node.EventType.TOUCH_MOVE, disableEventFn);
                node.off(cc.Node.EventType.MOUSE_DOWN, disableEventFn);
                node.off(cc.Node.EventType.MOUSE_UP, disableEventFn);
                node.off(cc.Node.EventType.MOUSE_MOVE, disableEventFn);
            };
        },

        destroyAllChildrenInNode: function (node) {
            for (var i = node.childrenCount - 1; i >= 0; i -= 1) {
                node.children[i].destroy();
            }
        }
    },

    Director: (function () {
        var loadingScenes = [],
            currentSceneName,
            previousSceneName;

        return {
            loadScene: function (sceneName, onLaunched, onError) {
                if (currentSceneName) {
                    previousSceneName = currentSceneName;
                }
                currentSceneName = sceneName;

                var pushSuccess = Utils.Array.pushUnique(loadingScenes, {
                    sceneName: sceneName,
                    onLaunched: onLaunched,
                    onError: onError
                });
                if (pushSuccess) {
                    if (loadingScenes.length === 1) {
                        this._loadScene(sceneName, onLaunched, onError);
                    }
                }
            },

            getCurrentSceneName: function () {
                return currentSceneName;
            },

            getPreviousSceneName: function () {
                return previousSceneName;
            },

            preloadScene: function (sceneName, onLaunched, onError) {
                cc.director.preloadScene(sceneName, function (e) {
                    var success = !e;
                    if (success && Utils.Type.isFunction(onLaunched)) {
                        onLaunched();
                    }
                    if (!success && Utils.Type.isFunction(onError)) {
                        onError();
                    }
                });
            },

            _loadScene: function (sceneName, onLaunched, onError) {
                var self = this;
                self.preloadScene(sceneName, function () {
                    var success = cc.director.loadScene(sceneName, function (e) {
                        self._loadNextSceneFrom(sceneName, onLaunched, onError, !e);
                    });
                    if (!success) {
                        self._loadNextSceneFrom(sceneName, onLaunched, onError, false);
                    }
                }, function () {
                    self._loadNextSceneFrom(sceneName, onLaunched, onError, false);
                });
            },

            _loadNextSceneFrom: function (sceneName, onLaunched, onError, success) {
                Utils.Array.remove(loadingScenes, {
                    sceneName: sceneName,
                    onLaunched: onLaunched,
                    onError: onError
                });
                if (success && Utils.Type.isFunction(onLaunched)) {
                    onLaunched();
                }
                if (!success && Utils.Type.isFunction(onError)) {
                    onError();
                }
                if (loadingScenes.length > 0) {
                    var sceneConfigs = loadingScenes[0];
                    this._loadScene(sceneConfigs.sceneName, sceneConfigs.onLaunched, sceneConfigs.onError);
                }
            }
        };
    }()),

    Scheduler: {
        /**
         * Schedule function execution by interval.
         *
         * @param {Function}  func     function to execute
         * @param {Number}    interval interval in ms
         * @param {Boolean}   isEager  execute first time if true
         */
        setInterval: function (func, interval, isEager) {
            if (interval > 0 && Utils.Type.isFunction(func)) {
                if (isEager) {
                    func();
                }
                return setInterval(func, interval);
            }
            return null;
        },

        debounce: function (func, delayTime, fixedTimeToExecute) {
            var startTime = 0,
                timeoutId;

            return function () {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (fixedTimeToExecute > delayTime) {
                    var deltaTime = Date.now() - startTime;
                    if (deltaTime >= fixedTimeToExecute) {
                        func.apply(null, arguments);
                        startTime = Date.now();
                    }
                }

                timeoutId = setTimeout(function () {
                    func.apply(null, arguments);
                    startTime = Date.now();
                    timeoutId = null;
                }, delayTime);
            };
        }
    },

    Module: {
        get: function (moduleName) {
            if (Utils.Type.isString(moduleName)) {
                try {
                    return require(moduleName);
                }
                catch (e) {
                    return null;
                }
            }
            return null;
        }
    },

    Game: (function () {
        var isFocus = true;

        function onShow() {
            isFocus = true;
        }

        function onHide() {
            isFocus = false;
        }

        cc.game.on(cc.game.EVENT_SHOW, onShow, this);
        cc.game.on(cc.game.EVENT_HIDE, onHide, this);

        return {
            isFocus: function () {
                return isFocus;
            }
        };
    }()),

    Screen: (function () {
        var winSize = cc.winSize,
            ratio = winSize.width / winSize.height,
            ScreenRatioEnum = cc.Enum({
                '<= 4:3': 1,
                '<= 3:2': 2,
                '<= 16:10': 3,
                '<= 17:10': 4,
                '>= 16:10': 5,
                '>= 17:10': 6,
                '>= 16:9': 7,
            });

        return {
            ScreenRatioEnum: ScreenRatioEnum,

            isType: function (screenRatioType) {
                switch (screenRatioType) {
                case 1:
                    return ratio <= 1.35;
                case 2:
                    return ratio <= 1.5;
                case 3:
                    return ratio <= 1.6;
                case 4:
                    return ratio <= 1.7;
                case 5:
                    return ratio >= 1.6;
                case 6:
                    return ratio >= 1.7;
                case 7:
                    return ratio >= 1.73;
                }
                return false;
            },

            getCenterPosition: function () {
                var v = new cc.Vec2(0, 0);
                try {
                    return cc.director.getScene().children[0].convertToWorldSpaceAR(v);
                }
                catch (e) {
                    return v;
                }
            }
        };
    }()),

    EventManager: {
        onKeyReleased: function (key, nodeOrPriority, callback) {
            cc.eventManager.addListener({
                event: cc.EventListener.KEYBOARD,
                onKeyReleased: function (keyCode) {
                    switch (keyCode) {
                    case key:
                        if (callback) {
                            callback();
                        }
                        break;
                    }
                }
            }, nodeOrPriority);
        }
    },
};

module.exports = Utils;
