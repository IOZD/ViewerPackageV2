'use strict'

const TlogDocsService = (function () {

    var _options = {}


    var $translate;
    var $templateBuilder;
    var _utils;
    var _isUS;
    // var _tlog;
    // var _docData;


    const Enums = {
        DOC_TYPES: {
            INVOICE: "invoice",
            REFUND_INVOICE: "refundInvoice"
        },
        PaymentTypes: {
            OTH: 'OTH',
            CreditCardPayment: 'CreditCardPayment',
            ChargeAccountPayment: 'ChargeAccountPayment',
            CashPayment: 'CashPayment',
            ChequePayment: 'ChequePayment',
            GiftCardPayment: 'GiftCardPayment',
            ChargeAccountRefund: 'ChargeAccountRefund',
            CashRefund: 'CashRefund',
            ChequeRefund: 'ChequeRefund',
            CreditCardRefund: 'CreditCardRefund',
        }
    }

    function printTlog(_tlog) {
        // console.log('THIS IS TLOG:' + _tlog);
    }

    function TlogDocsService(options) {

        _configure(options);

        $translate = new TlogDocsTranslateService({
            local: options.local
        });
    }

    function _configure(options) {
        if (options.local) _options.local = options.local;
        if (options.isUS !== undefined) {
            _options.isUS = options.isUS;
            _isUS = options.isUS;
        };

        if (options.moment) {
            moment = options.moment;
        }
        else {
            moment = window.moment;
        }

        //utils = new OfficeDocsUtils();
    }

    //Create the Buttons
    function orderTypesListCreator(tlog, billData, isClosedOrder) {
        //the array of orders for use of the buttons or other needs
        var orderSelection = [];
        //the type tlog is made for the template builder service which returns regular bill
        if (!isClosedOrder) {
            orderSelection.push({
                tlogId: '',
                id: 'openOrder',
                type: 'tlog',
                title: $translate.getText('order') + ' ',
                ep: '',
                isRefund: false,
                isFullOrderBill: false,
            });
        }
        else {
            orderSelection.push({
                tlogId: tlog._id,
                id: tlog._id,
                type: tlog._type,
                title: $translate.getText('order') + ' ' + tlog.number,
                ep: `tlogs/${tlog._id}/bill`,
                isRefund: false,
                isFullOrderBill: true,
            });

            if (tlog.order[0].clubMembers && tlog.order[0].clubMembers.length) {
                orderSelection.push({
                    tlogId: tlog._id,
                    id: tlog._id,
                    type: tlog._type,
                    title: $translate.getText('clubMembers'),
                    ep: `documents/v2/${doc._id}/printdata`,
                    isRefund: false
                });
            }
            if (tlog.order[0].checks && tlog.order[0].checks.length > 1) {


                //set check in split check to 'orderOptions' (the option btns on the PopupBill)
                tlog.order[0].checks.forEach(check => {

                    let paymentId = check.payments[0].paymentId;
                    orderSelection.push({
                        tlogId: tlog._id,
                        id: check._id,
                        type: 'check',
                        title: $translate.getText('CHECK') + ` ${check.number}`, //$translate.getText('CHECK') + ` ${check.variables.CHECK_NO}`,
                        ep: `tlogs/${tlog._id}/checks`,
                        md: {
                            paymentId: paymentId,
                            checkNumber: check.number
                        }
                    });
                });
            }

            if (_isUS) {
                if (tlog.order) {
                    if (tlog.order[0].allDocuments && tlog.order[0].allDocuments.length > 0) {
                        var _tlog = tlog;
                        tlog.order[0].allDocuments.forEach(document => {
                            if (document.payments.length > 0 && document.payments[0]) {
                                var payment = document.payments[0];
                                var paymentForSignature;

                                var typeTitle = "";
                                if (payment.tenderType === 'creditCard') typeTitle = $translate.getText('CreditSlip');
                                if (payment.tenderType === 'giftCard') typeTitle = $translate.getText('GiftCardCreditSlip');

                                if (payment.tenderType === 'creditCard' || payment.tenderType === 'giftCard') {
                                    _tlog.order[0].allDocuments.forEach(doc => {
                                        doc.payments.forEach(p => {
                                            if (p._id === payment._id) {
                                                paymentForSignature = p;
                                            }
                                        })
                                    })
                                    payment.number = `${tlog.order[0].number}/${payment.number}`;
                                    orderSelection.push({
                                        tlogId: tlog._id,
                                        id: document.id,
                                        type: payment.tenderType,
                                        title: typeTitle + "-" + payment.number,
                                        ep: `documents/v2/${payment._id}/printdata`,
                                        md: {
                                            paymentId: payment._id,
                                            signature: paymentForSignature && paymentForSignature.customerSignature ? paymentForSignature.customerSignature.data : null
                                        },
                                        docPaymentType: (payment.tenderType ? payment.tenderType : ''),
                                        isRefund: payment.tenderType.toUpperCase().includes('REFUND')
                                    });
                                }
                            }
                        })
                        // billData.collections.PAYMENT_LIST.forEach(payment => {
                        //     var paymentForSignature;

                        //     var typeTitle = "";
                        //     if (payment.P_TENDER_TYPE === 'creditCard') typeTitle = $translate.getText('CreditSlip');
                        //     if (payment.P_TENDER_TYPE === 'giftCard') typeTitle = $translate.getText('GiftCardCreditSlip');

                        //     if (payment.P_TENDER_TYPE === 'creditCard' || payment.P_TENDER_TYPE === 'giftCard') {
                        //         _tlog.order[0].allDocuments.forEach(doc => {
                        //             doc.payments.forEach(p => {
                        //                 if (p._id === payment.P_ID) {
                        //                     paymentForSignature = p;
                        //                 }
                        //             }
                        //             )
                        //         })
                        //         payment.PAYMENT_NUMBER = `${tlog.order[0].number}/${payment.NUMBER}`;
                        //         orderSelection.push({
                        //             tlogId: tlog._id,
                        //             id: payment.P_ID,
                        //             type: payment.P_TENDER_TYPE,
                        //             title: typeTitle + "-" + payment.PAYMENT_NUMBER,
                        //             ep: `documents/v2/${payment._id}/printdata`,
                        //             md: {
                        //                 paymentId: payment.P_ID,
                        //                 signature: paymentForSignature.customerSignature ? paymentForSignature.customerSignature.data : null
                        //             },
                        //             docPaymentType: (payment.P_TENDER_TYPE ? payment.P_TENDER_TYPE : ''),
                        //             isRefund: payment.P_TENDER_TYPE.includes('Refund')
                        //         });
                        //     }
                        // })
                    }
                }
            }

            if (!_isUS) {
                if (tlog.order) {
                    if (tlog.order[0].allDocuments && tlog.order[0].allDocuments.length > 0) {

                        // filter payments by ommitted property removes cancelled and refund payments once the order goes shva offline
                        let filteredInvoices = filterOmittedPayments(tlog.order[0].allDocuments);
                        filteredInvoices.forEach(doc => {

                            switch (doc._type) {

                                case Enums.DOC_TYPES.INVOICE: {
                                    orderSelection.push({
                                        tlogId: tlog._id,
                                        id: doc._id,
                                        type: doc._type,
                                        title: $translate.getText('invoice_number') + doc.number,
                                        ep: `documents/v2/${doc._id}/printdata`,
                                        docPaymentType: (doc.payments[0]._type ? doc.payments[0]._type : ''),
                                        isRefund: false
                                    });
                                    break;
                                }

                                case Enums.DOC_TYPES.REFUND_INVOICE: {
                                    if (doc.payments[0]._type === 'ChequeRefund' ||
                                        doc.payments[0]._type === 'CashRefund' ||
                                        doc.payments[0]._type === 'CreditCardRefund') {
                                        orderSelection.push({
                                            tlogId: tlog._id,
                                            id: doc._id,
                                            type: doc._type,
                                            title: $translate.getText('credit_invoice_number') + doc.number,
                                            ep: `documents/v2/${doc._id}/printdata`,
                                            docPaymentType: doc.payments[0]._type,
                                            isRefund: true
                                        });

                                        break;
                                    }
                                }
                                case 'deliveryNote': {
                                    if (doc.payments[0]._type === 'ChargeAccountPayment') {
                                        orderSelection.push({
                                            tlogId: tlog._id,
                                            id: doc._id,
                                            type: doc._type,
                                            title: $translate.getText('delivery_note_number') + doc.number,
                                            ep: `documents/v2/${doc._id}/printdata`,
                                            docPaymentType: doc.payments[0]._type,
                                            isRefund: doc._type.toUpperCase().includes('REFUND')
                                        });


                                        break;
                                    }
                                }
                                case 'refundDeliveryNote': {
                                    if (doc.payments[0]._type === 'ChargeAccountRefund') {
                                        orderSelection.push({
                                            tlogId: tlog._id,
                                            id: doc._id,
                                            type: doc._type,
                                            title: $translate.getText('refund_note_number') + doc.number,
                                            ep: `documents/v2/${doc._id}/printdata`,
                                            docPaymentType: doc.payments[0]._type,
                                            isRefund: true
                                        });
                                        break;
                                    }
                                }
                            }


                        })

                    }


                }
            }
            console.log('orderSelection');
            console.log(orderSelection);
        }
        return orderSelection;

    }

    // let getPrintDocs = function (tlog) {
    //     _docsArray = printDocsCreator(tlog);
    //     docsArray = _docsArray;
    //     return docsArray;
    // }



    function filterOmittedPayments(payments) {

        let omittedOrders = [];

        let filteredItems = payments.forEach(p => {
            if (p.payments[0].providerTransactionStatus === 'omitted') {
                if (p.payments[0]._type === 'CreditCardPayment') {

                    let findRefundPayment = payments.find(r => {
                        return r.payments[0].refundedPaymentId === p.payments[0]._id;
                    })

                    if (findRefundPayment) {
                        omittedOrders.push(p)
                        omittedOrders.push(findRefundPayment)
                    }

                }
            }
        })

        if (omittedOrders.length > 0) {
            omittedOrders.forEach(i => {
                let findPayment = payments.findIndex(p => {
                    return p.id === i.id;
                })
                if (findPayment !== -1) {
                    payments.splice(findPayment, 1)
                }
            })
        }

        return payments;
    }

    //create the data for the documents list

    function getDocs(tlog, billData, isClosedOrder) {
        let docsArray;

        let _billService = new BillService(_options);
        let _enrichPrintData = _billService.resolvePrintData({
            collections: billData.printData.collections,
            variables: billData.printData.variables
        }, _options._isUS);

        docsArray = orderTypesListCreator(tlog, _enrichPrintData, isClosedOrder);

        printTlog(JSON.stringify(tlog));

        return docsArray;

    }

    function getTemplate(docObj, printData) {
        var template;

        //_printData = printData;

        // let documentType = printData.documentType;
        $templateBuilder = new TemplateBuilderService(_options)

        template = $templateBuilder.createHTMLFromPrintDATA(docObj, printData)

        return template;
    }

    function getHTMLDocument(document, options) {
        var template;
        $templateBuilder = new TemplateBuilderService(_options)
        var docObj = {};
        docObj.isRefund = document.docType.toUpperCase().indexOf('REFUND') > -1;
        docObj.docPaymentType;
        if (docObj.printData.collections.PAYMENT_LIST[0]) {
            switch (docObj.printData.collections.PAYMENT_LIST[0].P_TENDER_TYPE) {
                case 'cash':
                    docObj.docPaymentType = 'CashPayment'
                    break;
                case 'creditCard':
                    docObj.docPaymentType = 'CreditCardPayment'
                    break;
                case 'giftCard':
                    docObj.docPaymentType = 'GiftCardPayment'
                    break;
                case 'cheque':
                    docObj.docPaymentType = 'ChequePayment'
                    break;
                case 'chargeAccount':
                    docObj.docPaymentType = 'ChargeAccountPayment'
                    break;
            }
        }
        


        var printData = document;


        template = $templateBuilder.createHTMLFromPrintDATA(docObj, printData)


        return template;

    }

    TlogDocsService.prototype.getDocs = (tlog, billData, isClosedOrder) => getDocs(tlog, billData, isClosedOrder);
    TlogDocsService.prototype.getTemplate = (docObj, printData) => getTemplate(docObj, printData);
    TlogDocsService.prototype.getHTMLDocument = (document, options) => getHTMLDocument(document, options);


    return TlogDocsService;



})();

