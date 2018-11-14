'use strict'
let DeliveryNoteTransactionDataService = (function () {

    var $createVatTemplateService;
    var $translate;
    var $utils;
    var _options = {};
    var _local;
    var _isUS;
    var _doc;


    function DeliveryNoteTransactionDataService(options) {
        _configure(options);

        $translate = new TlogDocsTranslateService({
            local: options.local
        });
        $createVatTemplateService = new CreateVatTemplateService(options)
        $utils = new TlogDocsUtils();


        if (options && options.local) {
            _local = options.local

        }
        else {
            _local = 'he-IL';
        }


    }


    function isNegative(number) {
        return $utils.isNegative(number)
    }
    function formatDateIL(stringDate) {
        return $utils.formatDateIL(stringDate);
    }

    function formatDateUS(stringDate) {
        return $utils.formatDateUS(stringDate);
    }

    function _configure(options) {
        if (options.local) _options.local = options.local;
        if (options.isUS !== undefined) {
            _options.isUS = options.isUS;
            _isUS = options.isUS;
            if (options.local === 'en-US') {
                _options.isUS = true;
            }
        };

        if (options.moment) {
            moment = options.moment;
        }
        else {
            moment = window.moment;
        }

    }

    function createDeliveryNoteTransactionData(printData, doc) {
        _doc = doc;
        var deliveryNoteTransactionDiv = _doc.createElement('div');
        deliveryNoteTransactionDiv.id = 'deliveryNoteTransactionDiv';

        var deliveryVat = $createVatTemplateService.createVatTemplate(printData, _doc)
        deliveryVat.id = 'deliveryVat';

        deliveryVat.classList += ' padding-bottom';
        deliveryVat.classList += ' padding-top';
        deliveryVat.classList += ' tpl-body-div';

        deliveryNoteTransactionDiv.appendChild(deliveryVat);

        var hAccountPayments;
        if (printData.collections.HOUSE_ACCOUNT_PAYMENTS[0]) {
            hAccountPayments = printData.collections.HOUSE_ACCOUNT_PAYMENTS[0];
        }
        var dNoteChargeAccntDiv = _doc.createElement('div');
        dNoteChargeAccntDiv.id = 'dNoteChargeAccntDiv';
        if (printData.isRefund === true) {

            var returnText = $translate.getText('RETURND_IN_CHARCHACCOUNT_FROM')
            var refundTextDiv = _doc.createElement('div')
            refundTextDiv.id = "refundTextDiv";
            refundTextDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (hAccountPayments ? returnText + " " + hAccountPayments.CHARGE_ACCOUNT_NAME : "") + "</div>" +
                "<div class='total-amount " + isNegative(hAccountPayments.P_AMOUNT) + "'>" + (hAccountPayments.P_AMOUNT ? hAccountPayments.P_AMOUNT : "") + "</div>" +
                "</div>";

            refundTextDiv.classList += " padding-bottom";
            refundTextDiv.classList += " padding-top";
            refundTextDiv.classList += " tpl-body-div";

            dNoteChargeAccntDiv.appendChild(refundTextDiv);


        }
        else if (!printData.isRefund && hAccountPayments && hAccountPayments.P_AMOUNT) {
            var returnText = $translate.getText('PAID_IN_CHARCHACCOUNT_FROM')
            var refundTextDiv = _doc.createElement('div')
            refundTextDiv.id = 'refundTextDiv';
            refundTextDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (hAccountPayments ? returnText + " " + hAccountPayments.CHARGE_ACCOUNT_NAME : "") + "</div>" +
                "<div class='total-amount " + isNegative(hAccountPayments.P_AMOUNT) + "'>" + (hAccountPayments.P_AMOUNT ? Number(hAccountPayments.P_AMOUNT).toFixed(2) : "") + "</div > " +
                "</div>";

            refundTextDiv.classList += " padding-bottom";
            refundTextDiv.classList += " padding-top";
            refundTextDiv.classList += " tpl-body-div";

            dNoteChargeAccntDiv.appendChild(refundTextDiv);

        }
        if (hAccountPayments) {

            if (hAccountPayments.P_CHANGE > 0) {
                var cashBackText = $translate.getText('TOTAL_CASHBACK')
                var cashBackDiv = _doc.createElement('div')
                cashBackDiv.id = "cashBackDiv";
                cashbackDiv.innerHTML = "<div class='changeDiv'>" +
                    "<div class='total-name'>" + (hAccountPayments ? cashBackText : "") + "</div>" +
                    "<div class='total-amount " + isNegative(hAccountPayments.P_CHANGE) + "'>" + (hAccountPayments.P_CHANGE ? Number(hAccountPayments.P_CHANGE).toFixed(2) : "") + "</div>" +
                    "</div>";

                dNoteChargeAccntDiv.appendChild(cashBackDiv);
            }

            if (hAccountPayments.PROVIDER_TRANS_ID) {
                var providerTransText = $translate.getText('CHARGE_TRANSACTION')
                var providerTransDiv = _doc.createElement('div');
                providerTransDiv.id = "providerTransDiv";
                providerTransDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (hAccountPayments ? providerTransText : "") + "</div>" +
                    "<div class='total-amount'>" + (hAccountPayments.PROVIDER_TRANS_ID ? hAccountPayments.PROVIDER_TRANS_ID : "") + "</div>" +
                    "</div>"

                dNoteChargeAccntDiv.appendChild(providerTransDiv);

            }

            if (hAccountPayments.CHARGE_ACCOUNT_NAME) {
                var cAccountNameText = $translate.getText('CHARGE_ACCOUNT_NAME')
                var cAccountNameDiv = _doc.createElement('div')
                cAccountNameDiv.id = "cAccountNameDiv";
                cAccountNameDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (hAccountPayments ? cAccountNameText : "") + " " +
                    (hAccountPayments.CHARGE_ACCOUNT_NAME ? hAccountPayments.CHARGE_ACCOUNT_NAME : "") + "</div>" +
                    "</div>"

                dNoteChargeAccntDiv.appendChild(cAccountNameDiv);

            }

            if (hAccountPayments.COMPANY_NAME) {
                var companyNameText = $translate.getText('company')
                var companyNameDiv = _doc.createElement('div');
                companyNameDiv.id = "companyNameDiv";
                companyNameDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (hAccountPayments ? companyNameText : "") + ": " +
                    (hAccountPayments.COMPANY_NAME ? hAccountPayments.COMPANY_NAME : "") + "</div>" +
                    "</div>"

                dNoteChargeAccntDiv.appendChild(companyNameDiv);

            }

            if (hAccountPayments.LAST_4) {
                var lastFourText = $translate.getText('LAST_4')
                var lastFourDiv = _doc.createElement('div')
                lastFourDiv.id = "lastFourDiv";
                lastFourDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='item-name'>" + (hAccountPayments ? lastFourText : " ")
                    + " " + " " + (hAccountPayments.LAST_4 ? hAccountPayments.LAST_4 : " ") +
                    "</div>"

                dNoteChargeAccntDiv.appendChild(lastFourDiv);

            }

            if (hAccountPayments.PROVIDER_PAYMENT_DATE) {

                printData.collections.HOUSE_ACCOUNT_PAYMENTS[0];

                var dateTimeStr = hAccountPayments.PROVIDER_PAYMENT_DATE;
                var dateTimeResult;
                var transactionTimeText = $translate.getText('TRANSACTION_TIME')
                var transactionTimeDiv = _doc.createElement('div')
                if (_isUS) dateTimeResult = formatDateUS(dateTimeStr);
                else if (!_isUS) {
                    dateTimeResult = formatDateIL(dateTimeStr);
                }
                transactionTimeDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='item-name'>" + (hAccountPayments ? transactionTimeText : "") +
                    " " + (hAccountPayments.PROVIDER_PAYMENT_DATE ? dateTimeResult : "") +
                    "</div>"

                dNoteChargeAccntDiv.appendChild(transactionTimeDiv);

            }
        }
        dNoteChargeAccntDiv.classList += ' tpl-body-div';
        deliveryNoteTransactionDiv.appendChild(dNoteChargeAccntDiv);
        return deliveryNoteTransactionDiv;
    }

    DeliveryNoteTransactionDataService.prototype.createDeliveryNoteTransactionData = (printData, doc) => createDeliveryNoteTransactionData(printData, doc);

    return DeliveryNoteTransactionDataService;
})();