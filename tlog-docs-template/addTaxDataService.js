'use strict'
let AddTaxDataService = (function () {


    var $utils;

    function AddTaxDataService() {

        $utils = new TlogDocsUtils();

    }

    function isNegative(number) {
        return $utils.isNegative(number)
    }


    function addTaxDataFunc(printData) {

        var taxDataDiv = null;

        if (
            (printData.data.taxes.InclusiveTaxes.length > 0 || printData.data.taxes.InclusiveTaxes[0] !== undefined) ||
            (printData.data.taxes.ExemptedTaxes.length > 0 || printData.data.taxes.ExemptedTaxes[0] !== undefined)
        ) {

            taxDataDiv = _doc.createElement('div');
            taxDataDiv.id = 'taxDataDiv';

            if (printData.data.totals && printData.data.totals.length > 0) {
                printData.data.totals.forEach(total => {
                    var totalItemDiv = _doc.createElement('div');
                    totalItemDiv.id = 'totalItemDiv';
                    totalItemDiv.innerHTML = "<div class='itemDiv'>" +
                        "<div class='total-name'>" + (total.name ? total.name : " ") + total.rate + "%" + "</div>" + " " +
                        "<div class='total-amount " + isNegative(total.amount) + "'>" + (total.amount ? Number(total.amount).toFixed(2) : " ") + "</div>" +
                        "</div>"
                    taxDataDiv.appendChild(totalItemDiv)
                }
                )
            }


            if (printData.data.payments && printData.data.payments.length > 0) {
                printData.data.payments.forEach(payment => {
                    var paymentItemDiv = _doc.createElement('div');
                    paymentItemDiv.id = 'paymentItemDiv';
                    paymentItemDiv.innerHTML = "<div class='itemDiv'>" +
                        "<div class='payment-name'>" + (payment.name ? payment.name : " ") + "</div>" + " " +
                        "<div class='payment-amount " + isNegative(payment.amount) + "'>" + (payment.amount ? Number(payment.amount).toFixed(2) : " ") + "</div>" +
                        "</div><div class='itemDiv'>" + payment.holderName + "</div > ";

                    taxDataDiv.appendChild(paymentItemDiv)
                })
            }


            if (printData.data.taxes.InclusiveTaxes && printData.data.taxes.InclusiveTaxes.length > 0 ||
                printData.data.taxes.ExemptedTaxes && printData.data.taxes.ExemptedTaxes.length > 0) {
                if (printData.data.taxes.InclusiveTaxes.length > 0) {
                    printData.data.taxes.InclusiveTaxes.forEach(incTax => {
                        var incTaxItemDiv = _doc.createElement('div');
                        incTaxItemDiv.id = 'incTaxItemDiv';
                        incTaxItemDiv.innerHTML = "<div class='itemDiv'>" +
                            "<div class='incTax-name'>" + (incTax.name ? incTax.name : " ") + "</div>" + " " +
                            "<div class='incTax-amount " + isNegative(incTax.amount) + "'>" + (incTax.amount ? Number(incTax.amount).toFixed(2) : " ") + "</div>" +

                            taxDataDiv.appendChild(incTaxItemDiv)
                    })
                }
                if (printData.data.taxes.ExemptedTaxes.length > 0) {
                    printData.data.taxes.ExemptedTaxes.forEach(exmTax => {
                        var exmTaxItemDiv = _doc.createElement('div');
                        exmTaxItemDiv.id = 'exmTaxItemDiv';
                        exmTaxItemDiv.innerHTML = "<div class='itemDiv'>" +
                            "<div class='incTax-name'>" + (exmTax.name ? exmTax.name : " ") + "</div>" + " " +
                            "<div class='incTax-amount " + isNegative(exmTax.amount) + "'>" + (exmTax.amount ? Number(exmTax.amount).toFixed(2) : " ") + "</div>" +

                            taxDataDiv.appendChild(exmTaxItemDiv)
                    })
                }
            }
            return taxDataDiv;

        }

        return null;

    }

    AddTaxDataService.prototype.addTaxDataFunc = (printData) => addTaxDataFunc(printData);

    return AddTaxDataService;
})();