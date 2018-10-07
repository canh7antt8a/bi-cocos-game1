module.exports = {
    c: {},

    e: '',

    d: function (s) {
        var l = s.length,
            ns = '',
            c, i;
        for (i = 0; i < l; i += 1) {
            c = s[i];
            ns += this.c[c] || c;
        }
        return ns;
    },
};
