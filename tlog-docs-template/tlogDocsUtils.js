'use strict'
let TlogDocsUtils = (function () {

    function TlogDocsUtils() {

    }

    function _toFixedSafe(value, num) {
        if (value && value !== undefined) {
            return value.toFixed(num);
        }
        return "--";
    }

    function _currencyFraction(val, showZero) {
        if (showZero && (!val || isNaN(val))) val = 0;
        if (!isNaN(val)) {
            var num = val / 100;
            var fixnum = _toFixedSafe(num, 2);
            return parseFloat(fixnum);
        }

    }

    function _isNegative(amount) {
        var intAmount = parseInt(amount);
        return intAmount < 0 ? 'negative' : "";

    }

    function _twoDecimals(number) {
        return Number(number).toFixed(2);
    }

    function _formatDateUS(stringDate) {
        var date = new Date(stringDate);
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + " " + date.getHours() + ":" +
            ((date.getMinutes() > 10) ? date.getMinutes() : "0" + date.getMinutes()) + " " + (date.getHours() > 12 ? "PM" : "AM");
    }

    function _formatDateIL(stringDate) {
        var date = new Date(stringDate);
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + " " +
            ((date.getHours() > 10) ? date.getHours() : "0" + date.getHours()) + ":" + ((date.getMinutes() > 10) ? date.getMinutes() : "0" + date.getMinutes());
    }

    TlogDocsUtils.prototype.isNegative = _isNegative;
    TlogDocsUtils.prototype.formatDateIL = _formatDateIL;
    TlogDocsUtils.prototype.formatDateUS = _formatDateUS;

    TlogDocsUtils.prototype.toFixedSafe = _toFixedSafe;
    TlogDocsUtils.prototype.currencyFraction = _currencyFraction;
    TlogDocsUtils.prototype.twoDecimals = _twoDecimals;

    return TlogDocsUtils;

}());
