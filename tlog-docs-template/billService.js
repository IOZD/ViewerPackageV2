'use strict'
let BillService = (function () {

    var $translate;
    const _options = {}
    var _isUS;
    var _utils;


    function BillService(options) {

        _configure(options);
        _utils = new TlogDocsUtils();
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
    const Enums = {
        PaymentTypes: {
            OTH: 'OTH',
            CreditCardPayment: 'CreditCardPayment',
            ChargeAccountPayment: 'ChargeAccountPayment',
            CashPayment: 'CashPayment',
            ChequePayment: 'ChequePayment',
            CreditCardPayment: 'CreditCardPayment',
            ChargeAccountRefund: 'ChargeAccountRefund',
            CashRefund: 'CashRefund',
            ChequeRefund: 'ChequeRefund',
            CreditCardRefund: 'CreditCardRefund',
        },
        OrderTypes: {
            Refund: "Refund",
            TA: "TA",
            Delivery: "Delivery",
            Seated: "Seated",
            OTC: "OTC"
        },
        ReturnTypes: {
            Cancellation: 'cancellation',
            TransactionBased: "TRANSACTION BASED"
        },
        DiscountTypes: {
            OTH: "OTH",
        },
        OfferTypes: {
            Simple: "Simple",
            Combo: 'Combo',
            ComplexOne: 'Complex-One'
        },
        TransTypes: {
            Reversal: "Reversal",
            Return: "Return"
        },
        Sources: {
            TabitPay: "tabitPay"
        }
    }

    function resolveItems(variables, collections) {

        let isReturnOrder = false;
        if (variables.RETURN_TYPE === Enums.ReturnTypes.TransactionBased) {
            isReturnOrder = true;
        }

        let offersList = collections.ORDERED_OFFERS_LIST;
        if (isReturnOrder) {
            offersList = collections.RETURNED_OFFERS_LIST;
        }

        let isTaxExempt = false;
        if ((collections.EXEMPTED_TAXES && collections.EXEMPTED_TAXES.length > 0 && _isUS)) {
            isTaxExempt = true;
        }

        let items = [];
        let oth = [];

        if (offersList && offersList.length > 0) {
            offersList.forEach(offer => {

                let offerQty = 0;
                if (offer.SPLIT_DENOMINATOR && offer.SPLIT_NUMERATOR && offer.SPLIT_DENOMINATOR !== 100 && offer.SPLIT_NUMERATOR !== 100) {
                    offerQty = `${offer.SPLIT_NUMERATOR}/${offer.SPLIT_DENOMINATOR}`;
                } else {
                    offerQty = offer.OFFER_QTY
                }
                if (offer.OFFER_TYPE == Enums.OfferTypes.Simple) {
                    let item = {
                        isOffer: true,
                        name: offer.OFFER_NAME,
                        qty: offerQty
                    };

                    if (offer.ON_THE_HOUSE) {
                        item.amount = $translate.getText('OTH');
                        oth.push(item)
                    } else {

                        if (offer.OFFER_PRICE && offer.OFFER_QTY === 1) { // if the offer amount is 0 not need to show 
                            item.amount = _utils.toFixedSafe(offer.OFFER_PRICE, 2)
                            items.push(item);
                        }

                        if (offer.OPEN_PRICE) {
                            item.amount = _utils.toFixedSafe(offer.OFFER_PRICE, 2)
                            items.push(item);
                        }
                    }

                    if (offer.ORDERED_OFFER_DISCOUNTS && offer.ORDERED_OFFER_DISCOUNTS.length > 0) {
                        offer.ORDERED_OFFER_DISCOUNTS.forEach(discount => {
                            items.push({
                                isOfferDiscount: true,
                                name: discount.DISCOUNT_NAME ? discount.DISCOUNT_NAME : $translate.getText('MANUAL_ITEM_DISCOUNT'),
                                qty: null,
                                amount: _utils.toFixedSafe(discount.DISCOUNT_AMOUNT * -1, 2)
                            })
                        });
                    }

                    if (offer.EXTRA_CHARGE_LIST && offer.EXTRA_CHARGE_LIST.length > 0) {
                        offer.EXTRA_CHARGE_LIST.forEach(extraCharge => {

                            if (extraCharge.EXTRA_CHARGE_MODIFIERS_LIST && extraCharge.EXTRA_CHARGE_MODIFIERS_LIST.length > 0) {
                                extraCharge.EXTRA_CHARGE_MODIFIERS_LIST.forEach(modifier => {
                                    items.push({
                                        isItem: true,
                                        name: modifier.MODIFIER_NAME,
                                        qty: null,
                                        amount: item.ON_THE_HOUSE ? $translate.getText('OTH') : _utils.toFixedSafe(modifier.MODIFIER_PRICE, 2)
                                    });

                                    if (modifier.MODIFIER_DISCOUNTS && modifier.MODIFIER_DISCOUNTS.length > 0) {
                                        modifier.MODIFIER_DISCOUNTS.forEach(discount => {
                                            items.push({
                                                isItem: true,
                                                name: discount.DISCOUNT_NAME,
                                                qty: null,
                                                amount: item.ON_THE_HOUSE ? $translate.getText('OTH') : _utils.toFixedSafe(discount.DISCOUNT_AMOUNT * -1, 2)
                                            });
                                        });
                                    }

                                })
                            }
                            if (extraCharge.ITEM_DISCOUNTS && extraCharge.ITEM_DISCOUNTS.length > 0) {
                                extraCharge.ITEM_DISCOUNTS.forEach(discount => {
                                    items.push({
                                        isItem: true,
                                        name: discount.DISCOUNT_NAME,
                                        qty: null,
                                        amount: _utils.toFixedSafe(discount.DISCOUNT_AMOUNT * -1, 2)
                                    })
                                })
                            }

                        });
                    }

                }

                if ([Enums.OfferTypes.ComplexOne, Enums.OfferTypes.Combo].indexOf(offer.OFFER_TYPE) > -1) {

                    items.push({
                        isOffer: true,
                        name: offer.OFFER_NAME,
                        qty: offerQty,
                        amount: offer.ON_THE_HOUSE ? $translate.getText('OTH') : _utils.toFixedSafe(isReturnOrder ? offer.OFFER_AMOUNT : offer.OFFER_CALC_AMT, 2)
                    });

                    if (!isReturnOrder) {
                        if (offer.ORDERED_ITEMS_LIST && offer.ORDERED_ITEMS_LIST.length > 0)
                            offer.ORDERED_ITEMS_LIST.forEach(item => {
                                items.push({
                                    isItem: true,
                                    name: item.ITEM_NAME,
                                    qty: null,
                                    amount: null
                                })
                            });
                    }

                    if (!isReturnOrder) {

                        if (offer.EXTRA_CHARGE_LIST && offer.EXTRA_CHARGE_LIST.length > 0) {
                            offer.EXTRA_CHARGE_LIST.forEach(item => {

                                if (item.EXTRA_CHARGE_MODIFIERS_LIST && item.EXTRA_CHARGE_MODIFIERS_LIST.length > 0) {
                                    item.EXTRA_CHARGE_MODIFIERS_LIST.forEach(modifier => {
                                        items.push({
                                            isItem: true,
                                            name: modifier.MODIFIER_NAME,
                                            qty: null,
                                            amount: item.ON_THE_HOUSE ? $translate.getText('OTH') : _utils.toFixedSafe(item.ITEM_AMOUNT, 2)
                                        })
                                    })
                                }
                                else if (item.ITEM_DISCOUNTS && item.ITEM_DISCOUNTS.length > 0) {

                                    items.push({
                                        isItem: true,
                                        name: item.ITEM_NAME,
                                        qty: null,
                                        amount: _utils.toFixedSafe(item.ITEM_AMOUNT, 2)
                                    })

                                    if (item.ITEM_DISCOUNTS && item.ITEM_DISCOUNTS.length > 0) {
                                        item.ITEM_DISCOUNTS.forEach(discount => {
                                            items.push({
                                                isItem: true,
                                                name: discount.DISCOUNT_NAME,
                                                qty: null,
                                                amount: _utils.toFixedSafe(discount.DISCOUNT_AMOUNT * -1, 2)
                                            })
                                        })
                                    }
                                }
                                else {
                                    items.push({
                                        isItem: true,
                                        name: item.ITEM_NAME,
                                        qty: null,
                                        amount: item.ON_THE_HOUSE ? $translate.getText('OTH') : _utils.toFixedSafe(item.ITEM_AMOUNT, 2)
                                    })
                                }

                            });
                        }
                    }

                    if (offer.ORDERED_OFFER_DISCOUNTS && offer.ORDERED_OFFER_DISCOUNTS.length > 0) {
                        offer.ORDERED_OFFER_DISCOUNTS.forEach(discount => {
                            items.push({
                                isOfferDiscount: true,
                                name: discount.DISCOUNT_NAME ? discount.DISCOUNT_NAME : $translate.getText('MANUAL_ITEM_DISCOUNT'),
                                qty: null,
                                amount: _utils.toFixedSafe(discount.DISCOUNT_AMOUNT * -1, 2)
                            })
                        })
                    }
                }
            });
        }

        return {
            items: items,
            oth: oth,
            isReturnOrder: isReturnOrder,
            isTaxExempt: isTaxExempt
        };

    }

    function resolveChecksData(printCheck) {

        let CheckBill = function (collections, variables, data, printByOrder, waiterDiners) {
            this.collections = collections;
            this.variables = variables;
            this.data = data;
            this.print_by_order = printByOrder;
            this.waiter_diners = waiterDiners;
        }

        let collections = printCheck.printData.collections;
        let variables = printCheck.printData.variables;

        if (collections.PAYMENT_LIST.length === 0) {
            return;
        }

        let data = {};

        let _details = billService.resolveItems(variables, collections);

        data.items = _details.items;
        data.oth = _details.oth;
        data.isReturnOrder = _details.isReturnOrder;
        data.isTaxExempt = _details.isTaxExempt;

        let _totals = billService.resolveTotals(variables, collections, true)
        data.totals = _totals;

        let _payments = billService.resolvePayments(variables, collections, true);
        data.payments = _payments;

        let _taxes = billService.resolveTaxes(variables, collections, true);
        data.taxes = _taxes;

        let printByOrder = billService.resolvePrintByOrder(variables);
        let waiterDiners = billService.resolveWaiterDiners(variables);

        let checkBill = new CheckBill(collections, variables, data, printByOrder, waiterDiners);
        return checkBill;
    }

    function resolveTotals(variables, collections) {
        let totals = [];

        if (variables.TOTAL_SALES_AMOUNT !== undefined && ((collections.ORDER_DISCOUNTS_LIST && collections.ORDER_DISCOUNTS_LIST.length > 0) ||
            variables.TOTAL_TIPS !== undefined ||
            (_isUS && collections.EXCLUSIVE_TAXES && collections.EXCLUSIVE_TAXES.length > 0))) {
            totals.push({
                name: $translate.getText('TOTAL_ORDER'),
                amount: _utils.toFixedSafe(variables.TOTAL_SALES_AMOUNT, 2)
            })
        }

        if (collections.ORDER_DISCOUNTS_LIST && collections.ORDER_DISCOUNTS_LIST.length > 0) {
            collections.ORDER_DISCOUNTS_LIST.forEach(discount => {
                totals.push({
                    name: discount.DISCOUNT_NAME ? discount.DISCOUNT_NAME : $translate.getText('ORDER_DISCOUNT'),
                    amount: _utils.toFixedSafe(discount.DISCOUNT_AMOUNT * -1, 2)
                })
            })
        }
        if (collections.EXCLUSIVE_TAXES && collections.EXCLUSIVE_TAXES.length > 0 && _isUS) {
            collections.EXCLUSIVE_TAXES.forEach(tax => {
                totals.push({
                    type: 'exclusive_tax',
                    name: tax.NAME ? tax.NAME : $translate.getText('ECVLUSIVE_TAX'),
                    amount: _utils.toFixedSafe(tax.AMOUNT, 2),
                    rate: tax.RATE
                })
            })
        }

        if (collections.TIPS) {

            let autoGratuityTips = collections.TIPS.filter(c => c.SCOPE === "order");
            if (autoGratuityTips && autoGratuityTips.length > 0) {

                //Service charge
                if (autoGratuityTips && autoGratuityTips.length > 0 && _isUS) {
                    autoGratuityTips.forEach(tip => {

                        let _name = tip.NAME ? tip.NAME : $translate.getText('SERVICE_CHARGE')
                        let _percent = tip.PERCENT;
                        if (_percent !== undefined) {
                            _name = tip.NAME ? `${tip.NAME} ${_percent}%` : `${$translate.getText('SERVICE_CHARGE')} ${_percent}%`;
                        }

                        if (tip.AMOUNT !== 0) {
                            totals.push({
                                type: 'service_charge',
                                name: _name,
                                amount: _utils.toFixedSafe(tip.AMOUNT, 2)
                            })

                        }

                    })
                }
            }

        }

        if (variables.TOTAL_TIPS_ON_PAYMENTS !== undefined || variables.TOTAL_TIPS !== undefined) {

            let tipAmount = 0;
            if (variables.TOTAL_TIPS_ON_PAYMENTS !== undefined && variables.TOTAL_TIPS_ON_PAYMENTS !== 0) { tipAmount = variables.TOTAL_TIPS_ON_PAYMENTS; }
            else if (variables.TOTAL_TIPS !== undefined && variables.TOTAL_TIPS !== 0) { tipAmount = variables.TOTAL_TIPS; }

            if (tipAmount > 0) {
                totals.push({
                    type: 'tips',
                    name: $translate.getText('TIP'),
                    amount: _utils.toFixedSafe(tipAmount, 2)
                })
            }
            //if it is a returned order, the tip is negative and needs to be presented
            if (collections.PAYMENT_LIST[0].TRANS_TYPE === Enums.TransTypes.Return) {
                if (collections.PAYMENT_LIST[0].TIP_AMOUNT !== 0) {
                    totals.push({
                        type: 'tips',
                        name: $translate.getText('TIP'),
                        amount: _utils.toFixedSafe(-1 * collections.PAYMENT_LIST[0].TIP_AMOUNT, 2)
                    })
                }
            }
        }

        if (!_isUS) {
            totals.push({
                name: $translate.getText('TOTAL_INC_VAT'),
                amount: _utils.toFixedSafe(variables.TOTAL_IN_VAT || 0, 2)
            })
        }

        if (_isUS) {
            totals.push({
                name: $translate.getText('TOTAL_INC_VAT'),
                amount: _utils.toFixedSafe(variables.TOTAL_AMOUNT || 0, 2)
            })
        }

        return totals;
    }


    function filterOmittedPayments(payments) {

        let omittedOrders = [];

        let filteredItems = payments.forEach(p => {
            if (p.PROVIDER_TRANS_STATUS === 'omitted') {
                if (p.CANCELED) {

                    let findRefundPayment = payments.find(r => {
                        return !r.CANCELED && r.PAYMENT_TYPE === "REFUND" && r.P_AMOUNT === p.P_AMOUNT && r.PROVIDER_TRANS_STATUS === 'omitted';
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
                    return p.P_ID === i.P_ID;
                })
                if (findPayment !== -1) {
                    payments.splice(findPayment, 1)
                }
            })
        }

        return payments;

    }


    function resolvePayments(variables, collections) {

        // filter payments by ommitted property removes cancelled and refund payments once the order goes shva offline

        let filteredPyaments = filterOmittedPayments(collections.PAYMENT_LIST);

        let payments = [];

        filteredPyaments.forEach(payment => {
            payments.push({
                name: resolvePaymentName(payment),
                amount: payment.PAYMENT_TYPE ? _utils.toFixedSafe(payment.P_AMOUNT * -1, 2) : _utils.toFixedSafe(payment.P_AMOUNT, 2),
                holderName: payment.CUSTOMER_NAME !== undefined ? payment.CUSTOMER_NAME : ''
            });
        });

        payments.push({
            type: 'change',
            name: $translate.getText('CHANGE'),
            amount: _utils.toFixedSafe(variables.CHANGE, 2)
        });

        return payments;
    }
    function resolveTaxes(variables, collections) {

        let taxes = {
            InclusiveTaxes: [],
            ExemptedTaxes: [],
            ExemptedTaxData: []
        };

        if (collections.INCLUSIVE_TAXES && collections.INCLUSIVE_TAXES.length > 0 && _isUS) {

            taxes.InclusiveTaxes.push({
                type: 'title',
                name: `${$translate.getText('INCLUSIVE_TAXES')}:`,
                amount: undefined
            })

            collections.INCLUSIVE_TAXES.forEach(tax => {
                taxes.InclusiveTaxes.push({
                    type: 'inclusive_tax',
                    name: tax.NAME ? tax.NAME : $translate.getText('INCLUSIVE_TAXES'),
                    amount: _utils.toFixedSafe(tax.AMOUNT, 2)
                })
            })
        }

        if (collections.EXEMPTED_TAXES && collections.EXEMPTED_TAXES.length > 0 && _isUS) {

            taxes.ExemptedTaxes.push({
                type: 'title',
                name: `${$translate.getText('EXEMPTED_TAXES')}:`,
                amount: undefined
            })

            collections.EXEMPTED_TAXES.forEach(tax => {
                taxes.ExemptedTaxes.push({
                    type: 'exempted_tax',
                    name: tax.NAME ? tax.NAME : $translate.getText('EXEMPTED_TAX'),
                    amount: _utils.toFixedSafe(tax.AMOUNT, 2)
                })
            });
        }

        return taxes;

    }
    function resolvePaymentName(payment) {
        let refund = '';
        let paymentName = '';

        if (payment.PAYMENT_TYPE === 'REFUND') {

            if (payment.TRANS_TYPE === Enums.TransTypes.Reversal) {
                refund = $translate.getText('REVERSAL');
            }
            else if (payment.TRANS_TYPE === Enums.TransTypes.Return) {
                refund = $translate.getText('RETURN');
            }
            else {
                refund = $translate.getText('REFUND');
            }

        }

        if (payment.P_TENDER_TYPE === 'creditCard' || payment.P_TENDER_TYPE === 'gidtCard') {
            paymentName = refund !== '' ? `${refund} (${payment.CARD_TYPE} ${payment.LAST_4})` : `${payment.CARD_TYPE} ${payment.LAST_4}`;
        } else {
            paymentName = `${refund} ${payment.P_NAME}`;
        }

        return paymentName;

    }
    function resolvePrintByOrder(variables) {

        return $translate.getText('PRINT_BY_ORDER',
            ["order_number", "order_date", "order_time"],
            [variables.ORDER_NO, moment(variables.CREATED_AT).format('DD/MM/YYYY'), moment(variables.CREATED_AT).format('HH:mm:ss')]
        );
    }
    function resolveWaiterDiners(variables) {

        let DISPLAY_NAME = "";
        if (variables.F_NAME !== undefined) {
            DISPLAY_NAME += variables.F_NAME;
        }

        if (variables.L_NAME !== undefined) {
            DISPLAY_NAME += ` ${variables.L_NAME[0]}`;
        }

        let TABLE_NO = "";
        if (variables.TABLE_NO !== undefined) {
            TABLE_NO = variables.TABLE_NO;
        }

        let RESULT_TEXT = "";

        let _TEXT_WAITER_N_DINERS = $translate.getText('WAITER_DINERS',
            ["waiter", "diners"],
            [`${DISPLAY_NAME}`, variables.NUMBER_OF_GUESTS]
        );

        RESULT_TEXT += _TEXT_WAITER_N_DINERS;

        // if (TABLE_NO !== "") {
        //     let _TEXT_TABLE = $translate.getText('TABLE_NUM',
        //         ["table"],
        //         [TABLE_NO]
        //     );

        //     RESULT_TEXT += ` ${_TEXT_TABLE}`;
        // }

        return RESULT_TEXT;

    }

    function resolvePrintData(printData, isUS) {

        let DataBill = function (collections, variables, data, printByOrder, waiterDiners) {
            this.collections = collections;
            this.variables = variables;
            this.data = data;
            this.print_by_order = printByOrder;
            this.waiter_diners = waiterDiners;
        }

        let collections = printData.collections;
        let variables = printData.variables;

        let data = {};

        let _details = resolveItems(variables, collections);

        data.items = _details.items;
        data.oth = _details.oth;
        data.isReturnOrder = _details.isReturnOrder;
        data.isTaxExempt = _details.isTaxExempt;

        let _totals = resolveTotals(variables, collections, true)
        data.totals = _totals;
        let _payments = resolvePayments(variables, collections, true);
        data.payments = _payments;

        let _taxes = resolveTaxes(variables, collections, true);
        data.taxes = _taxes;

        data.isUS = isUS;

        let printByOrder = resolvePrintByOrder(variables);
        let waiterDiners = resolveWaiterDiners(variables);


        return new DataBill(collections, variables, data, printByOrder, waiterDiners);
    }

    BillService.prototype.resolvePrintData = (printData, isUS) => resolvePrintData(printData, isUS);
    BillService.prototype.resolveChecksData = (printData, isUS) => resolveChecksData(printData, isUS);

    // resolve checks

    //** REMOVE */
    BillService.prototype.resolveItems = (variables, collections) => resolveItems(variables, collections);
    BillService.prototype.resolveTotals = (variables, collections) => resolveTotals(variables, collections);
    BillService.prototype.resolvePayments = (variables, collections) => resolvePayments(variables, collections);
    BillService.prototype.resolveTaxes = (variables, collections) => resolveTaxes(variables, collections);
    BillService.prototype.resolvePaymentName = (variables, collections) => resolvePaymentName(variables, collections);
    //** REMOVE * /

    return BillService;

}());