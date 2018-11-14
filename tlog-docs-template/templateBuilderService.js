'use strict'
let TemplateBuilderService = (function () {

    var _options = {}

    var $translate;
    var $utils;
    var $addTaxData;
    var $createCreditSlipService;
    var $createVatTemplateService;
    var $deliveryNoteTransactionService
    var _billService
    var _docData;
    var _docObj;
    var _printData;
    var _isUS;
    var _doc;
    var _local;

    function TemplateBuilderService(options) {
        _configure(options);

        if (options && options.local) {
            _local = options.local

        }
        else {
            _local = 'he-IL';
        }

        $translate = new TlogDocsTranslateService({
            local: options.local
        });

        $utils = new TlogDocsUtils();

        var cssStyling = `
        .templateDiv{
            background-color:white;
        }
        `
        var doc = document.implementation.createHTMLDocument("BillTemplate");

        _doc = doc;

        var styleTag = _doc.createElement('style');
        styleTag.id = 'styleTag'
        _doc.head.appendChild(styleTag);
        var styleContent = _doc.createTextNode(cssStyling)

        styleTag.appendChild(styleContent);
    }

    function _configure(options) {
        debugger;
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

    //create document for export 
    function createHTMLFromPrintDATA(docObj, printDataObj) {

        $createVatTemplateService = new CreateVatTemplateService(_options)
        $createCreditSlipService = new CreateCreditSlipService();
        $deliveryNoteTransactionService = new DeliveryNoteTransactionDataService(_options);
        $addTaxData = new AddTaxDataService();
        _billService = new BillService(_options);

        // Setting UP
        let isRefund = docObj.isRefund;

        // setting global variables
        _docObj = docObj;
        _docData = printDataObj;

        //bill servuce for converting prnt data to collections, variables and data
        _printData = _billService.resolvePrintData(printDataObj.printData, _isUS)
        _printData.isRefund = isRefund;


        //create basic document template the function create doc template returns a docTemplate with all its children
        var docTemplate = createDocTemplate(docObj);
        _doc.body.appendChild(docTemplate);

        //******************  setting styling Try - delete when finished  ******************//
        // var htmlString = docTemplate.outerHTML;
        // _doc.getElementById('templateDiv').style.fontFamily = "Courier New, Courier, monospace";
        //******************************************************//

        // sending the doc
        var docToAdd = _doc;
        var htmlString = new XMLSerializer().serializeToString(docToAdd);
        return htmlString

    }

    function createDocTemplate(docObjChosen) {
        //create a template for the document and give it id 
        var docTemplate = _doc.createElement('div');
        docTemplate.id = 'docTemplate';
        docTemplate.classList.add('basicTemplate');

        //set language and locals
        if (_local == 'he-IL') {
            docTemplate.classList += ' rtl'
            docTemplate.classList.remove('ltr')
        }
        else {
            docTemplate.classList += ' ltr'
            docTemplate.classList.remove('rtl')
        }

        //create document header
        var templateHeader = createHeader(_printData);
        docTemplate.appendChild(templateHeader);

        var checkInIL;
        if (_local == 'he-IL' && docObjChosen.documentType === 'check') {
            checkInIL = true;
        }

        var isCreditSlip = (docObjChosen.md && docObjChosen.type === 'creditCard' && !docObjChosen.isFullOrderBill && !docObjChosen.md.checkNumber && !checkInIL)

        if (isCreditSlip !== null && isCreditSlip) {
            var tplCreditSlipTemplate = $createCreditSlipService.createCreditSlip(_printData, docObjChosen);
            docTemplate.appendChild(tplCreditSlipTemplate);
        }
        else {

            //create a general template content
            if (_printData.variables.ORDER_TYPE.toUpperCase() !== "REFUND") {//in case the invoice is refund=> do not show the the tplOrderPaymentData div
                var tplOrderPaymentData = createOrderPaymentData(_printData);
                tplOrderPaymentData.id = 'tplOrderPaymentData';
                tplOrderPaymentData.hasChildNodes() ? tplOrderPaymentData.classList += ' body-div' : '';

            };

            // var tplOrderPaymentData = createOrderPaymentData(_printData);
            var tplOrderTotals = createTotalsData(_printData);
            var tplOrderPayments = createPaymentsData(_printData);

            // tplOrderPaymentData.id = 'tplOrderPaymentData';
            tplOrderTotals.id = 'tplOrderTotals';
            tplOrderPayments.id = 'tplOrderPayments';

            //adding styling to the template divs
            // tplOrderPaymentData.hasChildNodes() ? tplOrderPaymentData.classList += ' body-div' : '';
            tplOrderTotals.hasChildNodes() ? tplOrderTotals.classList += ' body-div tpl-body-div' : '';
            tplOrderPayments.hasChildNodes() ? tplOrderPayments.classList += ' body-div tpl-body-div' : '';

            //set body main divs

            if (_printData.variables.ORDER_TYPE.toUpperCase() !== "REFUND") {//in case the invoice is refund=> do not show the the tplOrderPaymentData div
                docTemplate.appendChild(tplOrderPaymentData);
            }
            tplOrderTotals.hasChildNodes() ? docTemplate.appendChild(tplOrderTotals) : null;
            tplOrderPayments.hasChildNodes() ? docTemplate.appendChild(tplOrderPayments) : null;

        }
        return docTemplate;
    }

    //header creator
    function createHeader(printData) {
        //creating a div to populate and return
        var headerDiv = _doc.createElement('div');
        headerDiv.id = "headerDiv";


        //setting header constants div for display
        var tplHeaderConstants = _doc.createElement('div');
        tplHeaderConstants.id = "tplHeaderConstants"
        tplHeaderConstants.classList += ' rowPadding';
        // setting constants
        let headerKeys = [
            'ORGANIZATION_NAME',
            'ORGANIZATION_LEGAL_NAME',
            'ORGANIZATION_ADDR_STREET',
            'ORGANIZATION_ADDR_CITY',
            'ORGANIZATION_TEL'
        ];

        headerKeys.forEach(element => {
            var constantLine = placeHeaderData(printData, element)
            tplHeaderConstants.appendChild(constantLine)
        })

        //inner function for placing the constants on the template with data
        function placeHeaderData(printData, element) {
            var tplHeaderLine = _doc.createElement('div');
            tplHeaderLine.id = 'tplHeaderLine';
            if (printData.variables.hasOwnProperty(element)) {

                switch (element) {
                    case 'ORGANIZATION_NAME': {
                        tplHeaderLine.innerHTML = printData.variables.ORGANIZATION_NAME;
                        tplHeaderLine.classList += ' big-chars';
                    }
                        break;
                    case 'ORGANIZATION_LEGAL_NAME': {
                        if (!_isUS) {
                            var bnNumber = $translate.getText('BN_NUMBER');
                            var orgString = printData.variables.ORGANIZATION_LEGAL_NAME + "-" + bnNumber + " " + printData.variables.ORGANIZATION_BN_NUMBER;
                            tplHeaderLine.innerHTML = orgString;
                        }
                        else {
                            tplHeaderLine.innerHTML = printData.variables.ORGANIZATION_LEGAL_NAME
                        }
                    }
                        break;
                    case 'ORGANIZATION_ADDR_STREET': {
                        tplHeaderLine.innerHTML = printData.variables.ORGANIZATION_ADDR_STREET;
                    }
                        break;
                    case 'ORGANIZATION_ADDR_CITY': {
                        tplHeaderLine.innerHTML = printData.variables.ORGANIZATION_ADDR_CITY;
                    }
                        break;
                    case 'ORGANIZATION_TEL': {
                        var phoneTranslate = $translate.getText('PHONE');
                        var phoneString = phoneTranslate + " " + printData.variables.ORGANIZATION_TEL;
                        tplHeaderLine.innerHTML = phoneString;
                    }
                        break;

                }
            }
            return tplHeaderLine;

        }

        var tplHeader = _doc.createElement('div');
        tplHeader.id = 'tplHeader';
        tplHeader.setAttribute('style', "text-align:center;")
        tplHeader.classList += ' rowPadding'
        var orderHeader = createOrderHeader(printData);
        orderHeader.id = 'orderHeader';
        orderHeader.classList += ' rowPadding'

        var tplOrderInfoText = createOrderInfoText(printData);
        tplOrderInfoText.id = 'tplOrderInfoText';

        tplHeader.appendChild(tplHeaderConstants);
        tplHeader.appendChild(orderHeader);
        tplHeader.appendChild(tplOrderInfoText);


        headerDiv.appendChild(tplHeader);
        //styling the header
        headerDiv.classList.add('header-div');
        headerDiv.classList.add('header-border');

        return headerDiv;
    }

    function createOrderHeader(printData) {
        //Bring the tplOrderHeader for appending other divs to it
        var tplOrderHeader = _doc.createElement('div');
        tplOrderHeader.id = 'tplOrderHeader';
        //all order header needed Divs
        var tplOrderCustomer = _doc.createElement('div');
        tplOrderCustomer.id = "tplOrderCustomer";
        var tplOrderDateTime = _doc.createElement('div');
        tplOrderDateTime.id = "tplOrderDateTime";
        tplOrderDateTime.classList.add('mystyle');
        // var tplOrderTitle = _doc.createElement('div');
        // tplOrderTitle.id = "tplOrderTitle";
        var tplOrderType = _doc.createElement('div');
        tplOrderType.id = "tplOrderType";
        tplOrderType.setAttribute('style', 'text-align:center;')
        var tplOrderTable = _doc.createElement('div');
        tplOrderTable.id = "tplOrderTable";
        var tplOrderServerClients = _doc.createElement('div');
        tplOrderServerClients.id = "tplOrderServerClients";
        //create array for the appendChildren function
        var orderBasicInfoArray = [tplOrderCustomer, tplOrderDateTime, tplOrderType, tplOrderTable, tplOrderServerClients,];

        var filledInfoArray = [];
        placeOrderHeaderData(printData, orderBasicInfoArray)

        function placeOrderHeaderData(printData, array) {
            array.forEach(element => {
                var singleElement = fillOrderHeaderData(printData, element)
                filledInfoArray.push(singleElement);

            });
        }

        var tplOrderHeaderReturn = appendChildren(tplOrderHeader, filledInfoArray)

        return tplOrderHeaderReturn;

    }

    function fillOrderHeaderData(printData, htmlElement) {

        switch (htmlElement.id) {
            case 'tplOrderCustomer': {
                if (printData.variables.CUSTOMER_ID) {
                    var forText = $translate.getText("FOR");
                    var BnOrSnText = $translate.getText("BN_OR_SN");
                    var customerName = printData.collections.PAYMENT_LIST[0].CUSTOMER_NAME;
                    var customerId = printData.collections.PAYMENT_LIST[0].CUSTOMER_ID;
                    htmlElement.innerText = forText + ": " + customerName + " " + BnOrSnText + ": " + customerId;
                }
            }
                break;

            case 'tplOrderDateTime': {
                if (printData.variables.CREATED_AT) {
                    var dateStr = printData.variables.CREATED_AT;
                    if (_isUS) htmlElement.innerHTML = formatDateUS(dateStr);

                    else if (!_isUS) {
                        htmlElement.innerHTML = formatDateIL(dateStr);
                    }
                    htmlElement.setAttribute('class', 'med-chars');

                }
            }
                break;
            //Asked to take this down temporary
            // case 'tplOrderTitle': {
            //     if (_docObj.title) {
            //         htmlElement.innerHTML = _docObj.title;
            //         htmlElement.setAttribute('class', 'med-chars');
            //     }
            // }
            //     break;
            case 'tplOrderType': {
                if (printData.variables.ORDER_TYPE && printData.variables.ORDER_TYPE.toUpperCase() !== "REFUND") {
                    var typeTranslate = $translate.getText("ORDER_TYPE")
                    var orderType = "ORDER_TYPES_" + printData.variables.ORDER_TYPE;
                    var typeDataTranslate = $translate.getText(orderType);
                    htmlElement.innerHTML = "<div class='centralize' style='justify-content:center;'><span>" + typeTranslate + "</span>" + "&nbsp;" + "<span>" + typeDataTranslate + "</span > " + "&nbsp;" + " <span> #" + printData.variables.ORDER_NO + "</span ></div > "
                    htmlElement.setAttribute('class', 'med-chars');

                }
            }
                break;
            case 'tplOrderTable': {
                if (printData.variables.ORDER_TYPE === "SEATED" && printData.variables.TABLE_NO) {
                    var tableTranslate = $translate.getText("table")
                    htmlElement.innerHTML = tableTranslate + " " + printData.variables.TABLE_NO;
                    htmlElement.setAttribute('class', 'med-chars');

                }
            }
                break;
            case 'tplOrderServerClients': {
                if (!(_docData.documentType === "invoice") && !(_docData.documentType === "deliveryNote")) {
                    var waiterTranslate = $translate.getText("Server")
                    var dinersTranslate = $translate.getText("Diners")
                    var firstName = printData.variables.F_NAME && printData.variables.F_NAME !== null ? printData.variables.F_NAME : '';
                    var lastName = printData.variables.L_NAME && printData.variables.L_NAME !== null ? printData.variables.L_NAME : '';
                    htmlElement.innerHTML = `<span> ` + waiterTranslate + ": " + firstName + " " + lastName.substring(0, 1) + " - " + dinersTranslate + ": " + printData.variables.NUMBER_OF_GUESTS + `</span>`;
                }
            }
                break;

        }
        return htmlElement;

    }

    function createOrderInfoText(printData) {
        var tplOrderInfoText = _doc.createElement('div');
        tplOrderInfoText.id = 'tplOrderInfoText';
        //check if  all the order  is OTH and prints if it is

        if (printData.variables.ORDER_ON_THE_HOUSE === "1") {
            var allOrderOthTextDiv = _doc.createElement('div');
            allOrderOthTextDiv.id = "allOrderOthTextDiv";
            allOrderOthTextDiv.innerHTML = $translate.getText('ALL_ORDER_OTH');
            allOrderOthTextDiv.classList += ' othDiv';
            tplOrderInfoText.appendChild(allOrderOthTextDiv);
        }
        //check if this is a retrun order and prints if it is
        if (printData.data.isReturnOrder) {
            var isReturnOrderTextDiv = _doc.createElement('div');
            isReturnOrderTextDiv.id = "isReturnOrderTextDiv";
            isReturnOrderTextDiv.innerHTML = $translate.getText('RETURN_TRANSACTION');
            tplOrderInfoText.appendChild(isReturnOrderTextDiv);
            //return order comment
            if (printData.variables.RETURN_COMMENT) {
                var returnOrderCommentDiv = _doc.createElement('div');
                returnOrderCommentDiv.id = "returnOrderCommentDiv";
                returnOrderCommentDiv.innerHTML = printData.variables.RETURN_COMMENT;
                tplOrderInfoText.appendChild(returnOrderCommentDiv);
            }
        }
        //check if this is order is tax exempted  and prints if it is
        if (printData.data.isTaxExempt) {
            if (printData.variables.TAX_EXEMPTION_CODE) {
                var isTaxExemptCodeDiv = _doc.createElement('div');
                isTaxExemptCodeDiv.id = "isTaxExemptCodeDiv";
                isTaxExemptCodeDiv.innerHTML = printData.variables.TAX_EXEMPTION_CODE;
                tplOrderInfoText.appendChild(isTaxExemptCodeDiv);
            }
            if (printData.variables.TAX_EXEMPTION_COMMENT) {
                var isTaxExemptCodeDiv = _doc.createElement('div');
                isTaxExemptCodeDiv.id = "isTaxExemptCodeDiv";
                isTaxExemptCodeDiv.innerHTML = printData.variables.TAX_EXEMPTION_COMMENT;
                tplOrderInfoText.appendChild(isTaxExemptCodeDiv);
            }
        }

        return tplOrderInfoText;
    }

    function createOrderPaymentData(printData) {

        var tplOrderPaymentData = _doc.createElement('div');
        let data = _billService.resolveItems(printData.variables, printData.collections);
        tplOrderPaymentData.classList += ' tpl-body-div';
        var paymentDataDiv = _doc.createElement('div');
        paymentDataDiv.id = "paymentDataDiv";
        paymentDataDiv.classList += ' padding-top';
        paymentDataDiv.classList += ' padding-bottom';


        tplOrderPaymentData.appendChild(paymentDataDiv);

        if (_docObj && !(_docData.documentType === "deliveryNote")) {
            fillItemsData(paymentDataDiv, data, printData);
            fillOthData(paymentDataDiv, data);
        }
        else if (_docObj && _docData.documentType === "deliveryNote") {
            fillItemsData(paymentDataDiv, data, printData);
            fillOthData(paymentDataDiv, data);
            var delNoteTransDiv = $deliveryNoteTransactionService.createDeliveryNoteTransactionData(printData, _doc);
            tplOrderPaymentData.appendChild(delNoteTransDiv);
        }
        return tplOrderPaymentData
    }

    function fillItemsData(htmlElement, data, printData) {

        if (!printData.isRefund) {
            data.items.forEach(item => {

                var itemDiv = _doc.createElement('div');
                if (item.isOffer) {
                    itemDiv.classList.add("bold");
                    item.space = "";
                }
                else if (!item.isOffer) {
                    itemDiv.classList.add("itemDiv");
                    item.qty = '&nbsp;&nbsp;';
                    item.space = "&emsp;";
                }
                itemDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='item-qty'>" + (item.qty ? item.qty : " ") + "</div>" + " " +
                    "<div class='item-name'>" + item.space + "" + (item.name ? item.name : "") + "</div>" + " " +
                    "<div class='total-amount " + isNegative(item.amount) + "'>" + (item.amount ? item.amount : "") + "</div>" +
                    "</div>"

                htmlElement.appendChild(itemDiv);

            })
        }

    }

    function fillOthData(htmlElement, data) {
        data.oth.forEach(othItem => {
            var othItemDiv = _doc.createElement('div');
            if (othItem.isOffer) {
                othItemDiv.classList.add("bold");
                othItem.space = "";

            }
            else if (!othItem.isOffer) {
                othItem.id = "singleOthDiv"
                othItem.qty = '&nbsp;&nbsp;';
                othItem.space = "&emsp;";
            }


            othItemDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='item-qty'>" + (othItem.qty ? othItem.qty : " ") + "</div>" + " " +
                "<div class='item-name'>" + othItem.space + (othItem.name ? othItem.name : "") + "</div>" + " " +
                "<div class='total-amount " + isNegative(othItem.amount) + "'>" + (othItem.amount ? othItem.amount : "") + "</div>" +
                "</div>"

            htmlElement.appendChild(othItemDiv);

        })
    }

    function createCreditTemplate(printData) {
        var CreditTemplate = _doc.createElement('div');
        CreditTemplate.id = "CreditTemplate";
        var CreditHeaderDiv = _doc.createElement('div');
        CreditHeaderDiv.id = "CreditHeaderDiv";
        let credPayments = {}
        if (printData.collections.CREDIT_PAYMENTS && printData.collections.CREDIT_PAYMENTS.length > 0) {
            credPayments = printData.collections.CREDIT_PAYMENTS[0];

            var retrunedCredFromText = null;
            var paidCredFromText = null;
            var issuer = credPayments.ISSUER
            var paymentAmount = credPayments.P_AMOUNT;
            //check if refun, if does   refund text
            if (printData.isRefund) {
                var retrunedCredFromTranslate = $translate.getText('RETURNED_IN_CREDIT_FROM')
                CreditHeaderDiv.classList.add("bold");
                retrunedCredFromText = retrunedCredFromTranslate;
                CreditHeaderDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (!(retrunedCredFromText === null) ? retrunedCredFromText : "") + " " + (issuer ? issuer : "") + "</div>" + " " +
                    "<div class='total-amount " + isNegative(paymentAmount) + "'>" + (paymentAmount ? Number(paymentAmount).toFixed(2) : "") + "</div>" +
                    "</div>"
                CreditTemplate.appendChild(CreditHeaderDiv);

            }
            else {
                var paidCredFromTranslate = $translate.getText('PAID_IN_CREDIT_FROM')
                CreditHeaderDiv.classList.add("bold");
                paidCredFromText = paidCredFromTranslate;
                CreditHeaderDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (!(paidCredFromText === null) ? paidCredFromText : "") + " " + (issuer ? issuer : "") + "</div>" + " " +
                    "<div class='total-amount " + isNegative(paymentAmount) + "'>" + (paymentAmount ? Number(paymentAmount).toFixed(2) : "") + "</div>" +
                    "</div>"
                CreditTemplate.appendChild(CreditHeaderDiv);
            }


            var creditDataTemplate = createCreditDataTemplate(credPayments, printData)
            CreditTemplate.appendChild(creditDataTemplate)

        }
        return CreditTemplate;
    }

    function createCreditDataTemplate(creditData, printData) {
        var creditDataDiv = _doc.createElement('div');
        creditDataDiv.id = "creditDataDiv";
        if (creditData) {

            var lastFourText = $translate.getText(creditData.LAST_4 ? 'LAST_4' : "");
            var transactTimeText = $translate.getText(creditData.PROVIDER_PAYMENT_DATE ? 'TRANSACTION_TIME' : "");
            var transactNumText = $translate.getText(creditData.PROVIDER_TRANS_ID ? 'TRANSACTION_NO' : "");
            var approvalText = $translate.getText(creditData.CONFIRMATION_NUMBER ? 'APPROVAL_NO' : "");
            var cashBackText = $translate.getText(printData.variables.CHANGE ? 'TOTAL_CASHBACK' : "");

            var lastFourDiv = _doc.createElement('div');
            if (lastFourText) {
                lastFourDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (lastFourText ? lastFourText : " ")
                    + " " + (creditData.LAST_4 ? creditData.LAST_4 : " ") + "</div>"
            }
            creditDataDiv.appendChild(lastFourDiv);

            var dateTimeStr = creditData.PROVIDER_PAYMENT_DATE;
            var dateTimeResult;
            var transactionTimeDiv = _doc.createElement('div')
            if (_isUS) dateTimeResult = formatDateUS(dateTimeStr);
            else if (!_isUS) {
                dateTimeResult = formatDateIL(dateTimeStr);
            }
            transactionTimeDiv.innerHTML = "<div class='itemDiv'>" +
                "<div class='total-name'>" + (transactTimeText ? transactTimeText : "") + " " + (transactTimeText ? dateTimeResult : "") + "</div>" +
                "</div>"

            creditDataDiv.appendChild(transactionTimeDiv);

            var transactNumDiv = _doc.createElement('div');
            if (creditData.PROVIDER_TRANS_ID) {
                transactNumDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (transactNumText ? transactNumText : " ") +
                    " " + (creditData.PROVIDER_TRANS_ID ? creditData.PROVIDER_TRANS_ID : " ") + "</div>" + "</div>"
            }
            creditDataDiv.appendChild(transactNumDiv);

            var approvalDiv = _doc.createElement('div');
            if (creditData.CONFIRMATION_NUMBER) {
                approvalDiv.innerHTML = "<div class='itemDiv'>" +
                    "<div class='total-name'>" + (approvalText ? approvalText : " ") + " " + (creditData.CONFIRMATION_NUMBER ? creditData.CONFIRMATION_NUMBER : " ") + "</div>" + "</div>"

                creditDataDiv.appendChild(approvalDiv);

            }

            var cashBackDiv = _doc.createElement('div');
            if (printData.collections.PAYMENT_LIST[0].P_CHANGE) {
                cashBackDiv.innerHTML = "<div class='changeDiv'>" +
                    "<div class='total-name'>" + (cashBackText ? cashBackText : " ") + "</div>" +
                    "<div class='total-amount'>" + (printData.collections.PAYMENT_LIST[0].P_CHANGE ? Number(printData.collections.PAYMENT_LIST[0].P_CHANGE).toFixed(2) : " ") + "</div>"
                    + "</div >"
                creditDataDiv.appendChild(cashBackDiv);
            }
        }

        return creditDataDiv

    }

    function createTotalsData(printData) {
        var tplOrderTotals = _doc.createElement('div');
        tplOrderTotals.id = 'tplOrderTotals';
        tplOrderTotals.hasChildNodes() ? tplOrderTotals.classList += ' tpl-body-div' : '';
        // let data = _billService.resolveItems(printData.variables, printData.collections);

        var taxDataDiv = $addTaxData.addTaxDataFunc(printData);
        if (taxDataDiv !== null) { tplOrderTotals.appendChild(taxDataDiv); }

        if (_docObj && (_docData.documentType ===
            ('invoice' || 'CreditCardPayment' || 'CreditCardRefund' || 'CashPayment' || 'GiftCard' || 'CashRefund' || 'ChequePayment' || 'ChequeRefund'))) {
            var vatTemplateDiv = $createVatTemplateService.createVatTemplate(printData, _doc);
            tplOrderTotals.appendChild(vatTemplateDiv);
        }
        else if (_docObj && (_docData.documentType === 'deliveryNote')) {
            return tplOrderTotals
        }
        else {
            var OrderTotalsDiv = _doc.createElement('div');
            OrderTotalsDiv.id = "OrderTotalsDiv";
            tplOrderTotals.appendChild(OrderTotalsDiv);
            OrderTotalsDiv.hasChildNodes() ? OrderTotalsDiv.classList += " tpl-body-div" : '';

            fillOrderTotals(OrderTotalsDiv, printData);
        }
        return tplOrderTotals
    }

    function fillOrderTotals(htmlElement, printData) {
        if (printData.data.totals.length > 0) {

            // if (!_isUS) {
            printData.data.totals.forEach(total => {
                var totalDiv = _doc.createElement('div');
                if (total.type === 'exclusive_tax') {
                    totalDiv.innerHTML = "<div class='itemDiv'>" +
                        "<div class='total-name'>" + "&nbsp;&nbsp;" + (total.name ? total.name : " ") + " " + (total.rate ? total.rate + " &nbsp;%" : " ") + "</div>" + " " +
                        "<div class='total-amount " + isNegative(total.amount) + "'>" + (total.amount ? total.amount : " ") +
                        "</div>" +
                        "</div>"
                }
                else if (total.type !== 'exclusive_tax') {
                    totalDiv.innerHTML = "<div class='itemDiv'>" +
                        "<div class='total-name'>" + (total.name ? total.name : " ") + "</div>" + " " +
                        "<div class='total-amount " + isNegative(total.amount) + "'>" + (total.amount ? total.amount : " ") + "</div>" +
                        "</div>"
                }

                htmlElement.appendChild(totalDiv);
            })
        }
    }
    
    function createPaymentsData(printData) {

        var tplOrderPaymentsDiv = _doc.createElement('div');
        tplOrderPaymentsDiv.id = 'tplOrderPayments';


        // let data = _billService.resolveItems(printData.variables, printData.collections);

        if (_docObj && _docData.documentType === "deliveryNote") {
            return tplOrderPaymentsDiv;
        }

        else if (_docObj && _docData.documentType === "invoice") {
            if (_docObj.docPaymentType === "CreditCardPayment" || _docObj.docPaymentType === "CreditCardRefund") {
                var creditPaymentDiv = createCreditTemplate(printData);
                tplOrderPaymentsDiv.appendChild(creditPaymentDiv);
            }
            else if (_docObj.docPaymentType === ("GiftCard")) {
                var giftCardPayment = createGiftCardDetails(printData);
                tplOrderPaymentsDiv.appendChild(giftCardPayment);
            }
            else if (_docObj.docPaymentType === "CashPayment" || _docObj.docPaymentType === "CashRefund") {
                var cashPayment = createCashPaymentFooter(printData);
                tplOrderPaymentsDiv.appendChild(cashPayment);
            }
            else if (_docObj.docPaymentType === "ChequePayment" || _docObj.docPaymentType === "ChequeRefund") {
                var chequePayment = createChequePaymentFooter(printData);
                tplOrderPaymentsDiv.appendChild(chequePayment);
            }

        }
        else {
            var OrderPaymentsDiv = fillPaymentsData(printData);
            OrderPaymentsDiv.id = "OrderPaymentsDiv";
            tplOrderPaymentsDiv.appendChild(OrderPaymentsDiv);
        }
        return tplOrderPaymentsDiv
    }

    function fillPaymentsData(printData) {
        var OrderPaymentsDiv = _doc.createElement('tplOrderPayments');
        OrderPaymentsDiv.id = 'OrderPaymentsDiv';

        if (printData.data.payments.length > 0) {
            printData.data.payments.forEach(payment => {
                var paymentDiv = _doc.createElement('div');
                if (payment) {
                    paymentDiv.innerHTML =
                        "<div class=" + (payment.type === 'change' ? 'changeDiv' : 'itemDiv') + ">" +
                        "<div class='total-name'>" + (payment.name ? payment.name : " ") + "</div>" + " " +
                        "<div class='total-amount " + isNegative(payment.amount) + "'>" + (payment.amount ? payment.amount : " ") + "</div>" +
                        "</div>"
                    OrderPaymentsDiv.appendChild(paymentDiv);
                }
                if (payment.holderName) {
                    var holderNameDiv = _doc.createElement('div');
                    holderNameDiv.innerHTML = "&nbsp;&nbsp;&nbsp;" + payment.holderName;
                    OrderPaymentsDiv.appendChild(holderNameDiv);
                }

            })
        }

        return OrderPaymentsDiv;
    }

    function createGiftCardDetails(printData) {

        var giftCardDiv = _doc.createElement('div');
        //giftCard Amount div
        var paidGiftCardText = $translate.getText('PAID_GIFTCARD');
        var pAmount = printData.collections.GIFT_CARD_PAYMENTS[0].P_AMOUNT ? Number(printData.collections.GIFT_CARD_PAYMENTS[0].P_AMOUNT).toFixed(2) : '';
        var giftCardPaidDiv = _doc.createElement('div')
        giftCardPaidDiv.innerHTML = "<div class='itemDiv'>" +
            "<div class='total-name'>" + (paidGiftCardText ? paidGiftCardText : " ") + "</div>" + "<div class='total-amount'>" + pAmount + "</div></div>"

        giftCardDiv.appendChild(giftCardPaidDiv);

        //giftcard Num div
        var giftCardNum = $translate.getText('CARD_NO');
        var cardNum = printData.collections.GIFT_CARD_PAYMENTS[0].CARD_NUMBER ? printData.collections.GIFT_CARD_PAYMENTS[0].CARD_NUMBER : '';
        var giftCardNumDiv = _doc.createElement('div')
        giftCardNumDiv.innerHTML = "<div class='itemDiv'>" +
            "<div class='total-name'>" + (giftCardNum ? giftCardNum : " ") + " " + cardNum + "</div>" +
            "</div>"

        giftCardDiv.appendChild(giftCardNumDiv);

        //transaction Num div
        var transactionNumText = $translate.getText('TRANSACTION_NO');
        var transactNum = printData.collections.GIFT_CARD_PAYMENTS[0].PROVIDER_TRANS_ID ? printData.collections.GIFT_CARD_PAYMENTS[0].PROVIDER_TRANS_ID : '';
        var transactNumDiv = _doc.createElement('div')
        transactNumDiv.innerHTML = "<div class='itemDiv'>" +
            "<div class='total-name'>" + (transactionNumText ? transactionNumText : " ") + " " + transactNum + "</div>" +
            "</div>"

        giftCardDiv.appendChild(transactNumDiv);

        return giftCardDiv;
    }

    function createCashPaymentFooter(printData) {
        var cashDiv = _doc.createElement('div');
        cashDiv.id = 'cashDiv'
        //cash paid or returned  div
        var cashPaidText = $translate.getText('PAID_CASH');

        var cashReturnedText = $translate.getText('RETURNED_CASH');

        var pAmount = printData.collections.PAYMENT_LIST[0].P_AMOUNT ? printData.collections.PAYMENT_LIST[0].P_AMOUNT : '';
        var cashPaidDiv = _doc.createElement('div')
        cashPaidDiv.innerHTML = "<div class='itemDiv'>" +
            "<div class='total-name'>" + (!printData.isRefund ? cashPaidText : cashReturnedText) + "</div>" +
            "<div class='total-amount " + isNegative(pAmount) + "'>" + (pAmount).toFixed(2) + "</div>" +
            "</div>"

        cashDiv.appendChild(cashPaidDiv);

        //Change div
        if (printData.collections.PAYMENT_LIST[0].P_CHANGE) {
            var changeText = $translate.getText('TOTAL_CASHBACK');
            var pChange = printData.collections.PAYMENT_LIST[0].P_CHANGE ? Number(printData.collections.PAYMENT_LIST[0].P_CHANGE).toFixed(2) : '';
            var transactNumDiv = _doc.createElement('div')
            transactNumDiv.innerHTML = "<div class='changeDiv'>" +
                "<div class='total-name'>" + (changeText ? changeText : '') + "</div>" +
                "<div class='total-amount " + isNegative(pChange) + "'>" + pChange + "</div>" +
                "</div>"

            cashDiv.appendChild(transactNumDiv);
        }

        return cashDiv;
    }

    function createChequePaymentFooter(printData) {
        var chequeDiv = _doc.createElement('div');
        chequeDiv.id = 'chequeDiv';

        var chequePaidText = $translate.getText('PAID_CHEQUE');
        var chequeReturnedText = $translate.getText('RETURNED_CHEQUE');


        var pAmount = printData.collections.PAYMENT_LIST[0].P_AMOUNT ? printData.collections.PAYMENT_LIST[0].P_AMOUNT : '';
        var chequePaidDiv = _doc.createElement('div')
        chequePaidDiv.innerHTML = "<div class='itemDiv'>" +
            "<div class='total-name'>" + (!printData.isRefund ? chequePaidText : chequeReturnedText) + "</div>" +
            "<div class='total-amount " + isNegative(pAmount) + "'>" + (pAmount).toFixed(2) + "</div>" +
            "</div>"

        chequeDiv.appendChild(chequePaidDiv);

        //Change div
        if (printData.collections.PAYMENT_LIST[0].P_CHANGE) {
            var changeText = $translate.getText('TOTAL_CASHBACK');
            var pChange = printData.collections.PAYMENT_LIST[0].P_CHANGE ? Number(printData.collections.PAYMENT_LIST[0].P_CHANGE).toFixed(2) : '';
            var transactNumDiv = _doc.createElement('div')
            transactNumDiv.innerHTML = "<div class='changeDiv'>" +
                "<div class='total-name'>" + (changeText ? changeText : '') + "</div>" +
                "<div class='total-amount " + isNegative(pChange) + "'>" + pChange + "</div>" +
                "</div>"

            chequeDiv.appendChild(transactNumDiv);
        }

        return chequeDiv;
    }

    //create svg function
    function makeSVG(tag, attrs) {
        var el = _doc.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs)
            el.setAttribute(k, attrs[k]);
        return el;
    }

    //function for appending multiple children
    function appendChildren(target, array) {
        var divForAppending = _doc.createElement('div');
        var length = array.length;
        if (length > 0) {
            array.forEach(element => {
                divForAppending.appendChild(element);
            })
        }
        return divForAppending;
    }

    function isNegative(amount) {
        var intAmount = parseInt(amount);
        return intAmount < 0 ? 'negative' : "";

    }

    function formatDateUS(stringDate) {
        var date = new Date(stringDate);
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + " " + date.getHours() + ":" +
            ((date.getMinutes() > 10) ? date.getMinutes() : "0" + date.getMinutes()) + " " + (date.getHours() > 12 ? "PM" : "AM");
    }

    function formatDateIL(stringDate) {
        var date = new Date(stringDate);
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + " " +
            ((date.getHours() > 10) ? date.getHours() : "0" + date.getHours()) + ":" + ((date.getMinutes() > 10) ? date.getMinutes() : "0" + date.getMinutes());
    }

    TemplateBuilderService.prototype.createHTMLFromPrintDATA = (docObj, printData) => createHTMLFromPrintDATA(docObj, printData);

    return TemplateBuilderService;

})();