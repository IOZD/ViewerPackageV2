'use strict'
let CreateCreditSlipService = (function () {

    function CreateCreditSlipService() {
    }

    function createCreditSlip(printData, docObjChosen) {

        var creditSlipDiv = _doc.createElement('div');
        creditSlipDiv.id = 'creditSlipDiv';

        var creditSlipDoc = printData.collections.PAYMENT_LIST && printData.collections.PAYMENT_LIST[0] ? printData.collections.PAYMENT_LIST[0] : null;

        if (creditSlipDoc) {
            var transactionTypeDiv = _doc.createElement('div');
            transactionTypeDiv.id = 'transactionTypeDiv';
            var TransactionTypeText = $translate.getText('TransactionType');
            transactionTypeDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(TransactionTypeText === null) ? TransactionTypeText : "") + ": "
                + (creditSlipDoc.TRANS_TYPE ? creditSlipDoc.TRANS_TYPE : "") + "</div></div>"

            transactionTypeDiv.classList += ' padding-top';
            creditSlipDiv.appendChild(transactionTypeDiv);

            var cardTypeDiv = _doc.createElement('div');
            cardTypeDiv.id = 'cardTypeDiv';
            var cardTypeText = $translate.getText('CardType');
            cardTypeDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(cardTypeText === null) ? cardTypeText : "") + ": "
                + (creditSlipDoc.CARD_TYPE ? creditSlipDoc.CARD_TYPE : "") + "</div></div>"
            creditSlipDiv.appendChild(cardTypeDiv)

            var cardNumDiv = _doc.createElement('div');
            cardNumDiv.id = 'cardNumDiv';
            var cardNumText = $translate.getText('CardNumber');
            cardNumDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(cardNumText === null) ? cardNumText : "") + ": " + (creditSlipDoc.CARD_NUMBER_MASKED ? creditSlipDoc.CARD_NUMBER_MASKED : "XXXX-" + creditSlipDoc.LAST_4) +
                "</div></div>"

            creditSlipDiv.appendChild(cardNumDiv)

            if (creditSlipDoc.P_TENDER_TYPE === 'creditCard') {
                var pTenderTypeDiv = _doc.createElement('div');
                pTenderTypeDiv.id = 'pTenderTypeDiv';
                var pTenderTypeText = $translate.getText('CardHolder');
                pTenderTypeDiv.innerHTML = "<div class='itemDiv'>" +
                    (!(pTenderTypeText === null) ? pTenderTypeText : "") + ": " + (creditSlipDoc.CUSTOMER_NAME ? creditSlipDoc.CUSTOMER_NAME : "") +
                    "</div></div>"
                creditSlipDiv.appendChild(pTenderTypeDiv)
            }


            var dateTimeStr = creditSlipDoc.PROVIDER_PAYMENT_DATE;
            var dateTimeResult;
            var transactTimeText = $translate.getText('transactTimeText');
            var creditSlipTimeDiv = _doc.createElement('div')
            if (_isUS) dateTimeResult = formatDateUS(dateTimeStr);
            else if (!_isUS) {
                dateTimeResult = formatDateIL(dateTimeStr);
            }
            creditSlipTimeDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (transactTimeText ? transactTimeText : "") + ": " + (transactTimeText ? dateTimeResult : "") + "</div>" +
                "</div>";

            creditSlipTimeDiv.classList += ' padding-bottom';
            creditSlipTimeDiv.classList += ' tpl-body-div';

            creditSlipDiv.appendChild(creditSlipTimeDiv);


            var merchantDiv = _doc.createElement('div');
            merchantDiv.id = 'merchantDiv';
            var merchantText = $translate.getText('Merchant');
            merchantDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(merchantText === null) ? merchantText : "") + ": " + (creditSlipDoc.MERCHANT_NUMBER ? creditSlipDoc.MERCHANT_NUMBER : "") +
                "</div></div>";
            merchantDiv.classList += ' padding-top';

            creditSlipDiv.appendChild(merchantDiv)


            var sequenceDiv = _doc.createElement('div');
            sequenceDiv.id = 'sequenceDiv';
            var sequenceText = $translate.getText('Sequence');
            sequenceDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(sequenceText === null) ? sequenceText : "") + ": " +
                + (creditSlipDoc.PROVIDER_TRANS_ID ? creditSlipDoc.PROVIDER_TRANS_ID : "") + "</div>" +
                "</div>"
            creditSlipDiv.appendChild(sequenceDiv)

            var responseDiv = _doc.createElement('div');
            responseDiv.id = 'responseDiv';
            var responseText = $translate.getText('Response');
            var responseMessage = creditSlipDoc.PROVIDER_RESPONSE_MESSAGE ? creditSlipDoc.PROVIDER_RESPONSE_MESSAGE : '';
            responseDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(responseText === null || responseText === undefined) ? responseText : "") + ": " +
                (creditSlipDoc.PROVIDER_RESPONSE_CODE ? creditSlipDoc.PROVIDER_RESPONSE_CODE + "/" + responseMessage : "") + "</div>" +
                "</div>"
            creditSlipDiv.appendChild(responseDiv)



            var approvalDiv = _doc.createElement('div');
            approvalDiv.id = 'approvalDiv';
            var approvalText = $translate.getText('Approval');
            approvalDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(approvalText === null) ? approvalText : "") + ": " +
                (creditSlipDoc.CONFIRMATION_NUMBER ? creditSlipDoc.CONFIRMATION_NUMBER : "") + "</div></div>"

            creditSlipDiv.appendChild(approvalDiv)



            var entryDiv = _doc.createElement('div');
            entryDiv.classList += ' tpl-body-div';
            entryDiv.id = 'entryDiv';
            var entryText = $translate.getText('Entry');
            entryDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(entryText === null) ? entryText : "") + ": " +
                (creditSlipDoc.ENTRY_METHOD ? creditSlipDoc.ENTRY_METHOD : "") +
                "</div></div>"

            entryDiv.classList += ' padding-bottom';
            entryDiv.classList += ' tpl-body-div';
            creditSlipDiv.appendChild(entryDiv)




            var checkTotalDiv = _doc.createElement('div');
            checkTotalDiv.id = 'checkTotalDiv';
            var checkTotalText = $translate.getText('CheckTotal');
            checkTotalDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(checkTotalText === null) ? checkTotalText : "") + ": " + "</div >" +
                "<div class='total-amount'>" + (creditSlipDoc.P_AMOUNT_WO_TIP ? Number(creditSlipDoc.P_AMOUNT_WO_TIP).toFixed(2) : "") +
                "</div></div>"

            checkTotalDiv.classList += ' padding-top';
            creditSlipDiv.appendChild(checkTotalDiv)


            var tipDiv = _doc.createElement('div');
            tipDiv.id = 'tipDiv';
            var tipText = $translate.getText('Tip');
            var tipAmount;
            if (creditSlipDoc.TIP_AMOUNT !== undefined && creditSlipDoc.TIP_AMOUNT !== null) {
                tipAmount = creditSlipDoc.TIP_AMOUNT;
            }
            else {
                tipAmount = 0;
            }
            tipDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (!(tipText === null) ? tipText : "") + ": " + "</div >" +
                "<div class='total-amount'>" + (tipAmount ? Number(tipAmount).toFixed(2) : 0) +
                "</div></div>"
            creditSlipDiv.appendChild(tipDiv)


            var totalDiv = _doc.createElement('div');
            totalDiv.id = 'totalDiv';
            var totalText = $translate.getText('Total');
            totalDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (totalText ? totalText : "") + ": " + "</div >" +
                "<div class='total-amount'>" + (creditSlipDoc.P_AMOUNT ? Number(creditSlipDoc.P_AMOUNT).toFixed(2) : "") + "</div></div>";
            creditSlipDiv.appendChild(totalDiv)

            //Add signature 

            if (docObjChosen.md.signature) {

                var signatureData = docObjChosen.md.signature;
                var signatureDiv = _doc.createElement('div');
                signatureDiv.id = 'signatureDiv';
                signatureDiv.classList += " signature-container";

                var elementSVGDiv = _doc.createElement('div');
                elementSVGDiv.id = 'elementSVGDiv'
                elementSVGDiv.classList += " signature-container";
                var newSVG = _doc.createElement('div');
                newSVG.id = 'newSVG';

                elementSVGDiv.appendChild(newSVG)
                newSVG.outerHTML += `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id='svg' width='100%' height='100' transform='translate(0, 0)'  viewBox="0 0 500 150" ></svg>`
                var svgNode = elementSVGDiv.getElementsByTagName('svg')[0];
                svgNode.classList += " signature-container";


                elementSVGDiv.appendChild(svgNode);

                signatureDiv.appendChild(elementSVGDiv)


                var elementSVG = signatureDiv.getElementsByTagName('svg')[0];
                elementSVG.id = 'elementSVG';


                var path = makeSVG('path', { d: signatureData, version: "1.1", xmlns: "http://www.w3.org/2000/svg", stroke: "#06067f", 'stroke-width': "2", height: "auto", transform: 'translate(50,-80) scale(0.5,0.5)', 'stroke-linecap': "butt", fill: "none", 'stroke-linejoin': "miter" });
                path.setAttribute("width", "50%");
                path.setAttribute("height", "auto");

                elementSVG.setAttribute("width", "100");
                elementSVG.setAttribute("height", "auto");


                elementSVG.innerHTML = "";
                elementSVG.appendChild(path);
                elementSVG.setAttribute("width", "100%");
                elementSVG.setAttribute("height", "auto");


                elementSVGDiv.appendChild(elementSVG);
                creditSlipDiv.appendChild(signatureDiv)

            }
        }

        return creditSlipDiv;
    }


    CreateCreditSlipService.prototype.createCreditSlip = (printData, docObjChosen) => createCreditSlip(printData, docObjChosen);

    return CreateCreditSlipService;

})();