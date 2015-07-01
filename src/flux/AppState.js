var _ = require('lodash');
var Reflux = require('reflux');
var Immutable = require('immutable');

var diamonds = 'diamonds';
var hearts = 'hearts';
var spades = 'spades';
var clubs = 'clubs';

var Card = Immutable.Record({
    suit: undefined,
    value: undefined,
    visible: false
});

Card.prototype.toString = function () {
    var suitsStrings = {};
    suitsStrings[AppConstants.suits.get('diamonds')] = "\u2666";
    suitsStrings[AppConstants.suits.get('hearts')] = "\u2665";
    suitsStrings[AppConstants.suits.get('spades')] = "\u2660";
    suitsStrings[AppConstants.suits.get('clubs')] = "\u2663";
    return suitsStrings[this.suit] + this.value + (this.visible ? '+' : '-');
};

var Foundation = Immutable.Record({
    suit: undefined,
    cards: Immutable.Stack()
});

var HistoryItem = Immutable.Record({
    state: Immutable.Map(),
    name: "unknown"
});

var AppConstants = {
    cards: Immutable.List.of("A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"),
    suits: Immutable.Map({diamonds: diamonds, hearts: hearts, spades: spades, clubs: clubs}),
    foundations: 'foundations',
    table: 'table',
    reserved: 'reserved'
};

var AppActions = Reflux.createActions([
    'newGame',
    'moveCards',
    'autocomplete',
    'openNextReserved',
    'restoreState'
]);

function openTopStackCard(stack) {
    return stack.count() > 0 ? stack.update(stack.count() - 1, card => card.set('visible', true)) : stack;
}

function getNextFoundationCards(foundations) {
    return foundations.reduce(
        (accum, foundation) => {
            var topCard = foundation.cards.first();
            var suit = foundation.get('suit');
            if (foundation.cards.isEmpty()) {
                return accum.push(new Card({suit: suit, value: "A", visible: true}));
            } else if (topCard.get('value') === "K") {
                return accum;
            } else {
                var nextCardIndex = AppConstants.cards.findIndex(card => card === topCard.get('value'));
                nextCardIndex++;
                return accum.push(new Card({suit: suit, value: AppConstants.cards.get(nextCardIndex), visible: true}));
            }
        },
        Immutable.List()
    )
}

function getAccessibleCardsOnTable(table) {
    return table.reduce(
        (found, stack) => !!stack.last() ? found.push(stack.last()) : found,
        Immutable.List()
    );
}

function getAccessibleCardOnReserved(reserved) {
    return reserved.filter(card => card.get('visible')).last();
}

function openPrevReservedCard(card, key, list) {
    var nextCard = list.get(key + 1);
    return (nextCard && nextCard.get('visible') === true) ? card.set('visible', true) : card;
}

function shuffleList(array) {
    var length = array.size;

    while (length) {
        let index = Math.floor(Math.random() * length--);
        let tempItem = array.get(length);

        array = array
            .set(length, array.get(index))
            .set(index, tempItem);
    }

    return array;
}

var AppStore = Reflux.createStore({
    addStateToHistory(newState, name) {
        var onlyCardValues = (card, key) => ['reserved', 'foundations', 'table'].indexOf(key) !== -1;
        var filteredNewState = newState.filter(onlyCardValues);
        var filteredOldState = this.app.filter(onlyCardValues);
        if (!Immutable.is(filteredNewState, filteredOldState)) {
            return this.app.get('history').push(new HistoryItem({state: filteredNewState, name: name}));
        } else {
            return this.app.get('history');
        }
    },

    onRestoreState(stateId) {
        this.app = this.app.merge(this.app.getIn(['history', stateId, 'state']));
        this.trigger(this.getState());
    },

    init() {
        this.app = Immutable.Map({
            history: Immutable.List(),
            reserved: Immutable.List(),
            foundations: AppConstants.suits.map(suit => new Foundation({suit: suit})),
            table: Immutable.List()
        });
        this.listenToMany(AppActions);
    },

    onMoveCards(source, destination, toStackNum, movedCard) {
        this.app = this.app.withMutations(app => {
            if (movedCard.get('visible') === false) {
                return;
            }

            var isCardCanBeMovedToTableStack = (newCard, stack) => {
                if (stack.count() === 0) {
                    return newCard.get('value') === "K";
                } else {
                    var lastCard = stack.last();
                    var isBlack = (card) => card.get('suit') === spades || card.get('suit') === clubs;
                    var isColorOk = (isBlack(lastCard) && !isBlack(newCard)) || (!isBlack(lastCard) && isBlack(newCard));
                    var isValueOk = AppConstants.cards.indexOf(lastCard.get('value')) - 1 === AppConstants.cards.indexOf(newCard.get('value'));

                    return isColorOk && isValueOk;
                }
            };

            if (source === AppConstants.foundations) {
                if (destination === AppConstants.table) {
                    if (isCardCanBeMovedToTableStack(movedCard, app.getIn(['table', toStackNum]))) {
                        var isMoved = (stack, card) => Immutable.is(stack.first(), card) && Immutable.is(movedCard, card);
                        var sourceFoundationIndex = app.get('foundations').findKey(f => f.get('suit') === movedCard.get('suit'));
                        app
                            .updateIn(['foundations', sourceFoundationIndex, 'cards'], cards => cards.filterNot(isMoved.bind(cards, cards)))
                            .updateIn(['table', toStackNum], (stack) => stack.push(movedCard))
                    }
                }
            }

            if (destination === AppConstants.foundations) {
                var isSameSuitAsFoundation = movedCard.get('suit') === app.getIn(['foundations', toStackNum]).get('suit');
            }

            if (source === AppConstants.reserved) {
                var lastVisibleCard = app.get('reserved').filter(card => card.get('visible')).last();
                if (!Immutable.is(movedCard, lastVisibleCard)) {
                    return;
                }

                if (destination === AppConstants.foundations) {
                    var isCardAccessible = Immutable.is(getAccessibleCardOnReserved(app.get('reserved')), movedCard);
                    if (isSameSuitAsFoundation && isCardAccessible) {
                        app
                            .update('reserved', (reserved) => reserved
                                .filterNot(card => Immutable.is(card, movedCard))
                                .map(openPrevReservedCard))
                            .updateIn(['foundations', toStackNum], (f) => f.update('cards', cards => cards.push(movedCard)));
                    }
                }
                if (destination === AppConstants.table) {
                    if (isCardCanBeMovedToTableStack(movedCard, app.getIn(['table', toStackNum]))) {
                        app
                            .update('reserved', (reserved) => reserved
                                .filterNot(card => Immutable.is(card, movedCard))
                                .map((card, key, list) => {
                                    var nextCard = list.get(key + 1);
                                    return (nextCard && nextCard.get('visible') === true) ? card.set('visible', true) : card;
                                }))
                            .updateIn(['table', toStackNum], (stack) => stack.push(movedCard));
                    }
                }
            }

            if (source === AppConstants.table) {
                var sourceStackNum = app.get('table').findIndex(stack => stack.includes(movedCard));
                if (destination === AppConstants.foundations) {
                    if (isSameSuitAsFoundation) {
                        app
                            .removeIn(['table', sourceStackNum, app.get('table').indexOf(movedCard)])
                            .updateIn(['table', sourceStackNum], openTopStackCard)
                            .updateIn(['foundations', toStackNum], (f) => f.update('cards', cards => cards.push(movedCard)));
                    }
                }

                if (destination === AppConstants.table) {
                    if (isCardCanBeMovedToTableStack(movedCard, app.getIn(['table', toStackNum]))) {
                        var selectedSubStack = app
                            .getIn(['table', sourceStackNum])
                            .skipWhile((card, key, stack) => key !== stack.indexOf(movedCard));

                        app
                            .updateIn(['table', sourceStackNum], stack => stack.takeWhile((card, key) => key !== stack.indexOf(movedCard)))
                            .updateIn(['table', sourceStackNum], openTopStackCard)
                            .updateIn(['table', toStackNum], stack => stack.concat(selectedSubStack));
                    }
                }
            }

            app.set('history', this.addStateToHistory(app, `${selectedSubStack && selectedSubStack.join(', ') || movedCard.toString()} moved from ${source} to ${destination}`));
        });
        this.trigger(this.getState());
    },

    onOpenNextReserved() {
        this.app = this.app.withMutations(app => {
            var lastOpenCardIndex = app.get('reserved').findLastIndex(card => card.get('visible'));
            lastOpenCardIndex++;

            if (lastOpenCardIndex === app.get('reserved').count()) {
                lastOpenCardIndex = 0;
            }

            var openCards = app.get('reserved').slice(lastOpenCardIndex, lastOpenCardIndex + 3);

            app
                .update('reserved', reserved => reserved
                    .map(card => openCards.includes(card) ? card.set('visible', true) : card.set('visible', false)))
                .set('history', this.addStateToHistory(app, `Opened ${openCards.join(', ')} in reserved`));

        });
        this.trigger(this.getState());
    },

    onAutocomplete() {
        this.app = this.app.withMutations(app => {
            var isSameSuit = (firstCard, secondCard) => firstCard.get('suit') === secondCard.get('suit');
            var nextFoundationCards = getNextFoundationCards(app.get('foundations'));

            var reservedToFoundation = getAccessibleCardOnReserved(app.get('reserved'));
            if (nextFoundationCards.includes(reservedToFoundation)) {
                app
                    .update('reserved', reserved => reserved
                        .filterNot(card => Immutable.is(reservedToFoundation, card))
                        .map(openPrevReservedCard))
                    .update('foundations', foundations => foundations.map(f => {
                        if (isSameSuit(f, reservedToFoundation)) {
                            return f.update('cards', cards => cards.push(reservedToFoundation));
                        } else {
                            return f;
                        }
                    }));
                app.set('history', this.addStateToHistory(app, `${reservedToFoundation.toString()} moved from reserved to foundation`));
            }

            var tableToFoundation = getAccessibleCardsOnTable(app.get('table')).filter(card => nextFoundationCards.includes(card));
            if (!tableToFoundation.isEmpty()) {
                app
                    .update('table', stacks => stacks
                        .map(stack => stack.filterNot(card => nextFoundationCards.includes(card)))
                        .map(openTopStackCard))
                    .update('foundations', fs => fs.map(foundation => {
                        var cardForFoundation = tableToFoundation.find(isSameSuit.bind(null, foundation));
                        return cardForFoundation ? foundation.set('cards', foundation.get('cards').push(cardForFoundation)) : foundation;
                    }));
                app.set('history', this.addStateToHistory(app, `${tableToFoundation.join(', ')} moved from table to foundation`));
            }
        });
        this.trigger(this.getState());
    },

    onNewGame() {
        this.app = this.app.withMutations(app => {
            var deck = AppConstants.suits.toList()
                .flatMap(suit => AppConstants.cards.map(card => new Card({suit: suit, value: card})));
            var shuffledDeck = shuffleList(deck);

            var sumOfInt = (num) => num === 0 ? 0 : num + sumOfInt(num - 1);
            var tableStacksCount = 7;
            var table = Immutable.List(Immutable.Repeat(Immutable.List(), tableStacksCount))
                .map((list, key) => shuffledDeck.slice(sumOfInt(key), sumOfInt(key + 1)));
            app
                .set('table', table.map(openTopStackCard))
                .set('reserved', shuffledDeck.skip(sumOfInt(tableStacksCount)))
                .update('history', history => Immutable.List.of(new HistoryItem({name: 'New game'})))
                .update('foundations', foundations => foundations.map(f => f.remove('cards')));
        });
        this.trigger(this.getState());
    },

    getInitialState: function () {
        return this.getState();
    },

    getState() {
        return this.app.toObject();
    },

    getLastReservedCard() {
        return this.app.get('reserved').filter(card => card.get('visible')).last();
    },

    getLastFoundationCards() {
        return this.app.get('foundations').map(f => f.get('cards').first()).toList().filter(card => !!card);
    }
});

module.exports = {
    store: AppStore,
    actions: AppActions,
    constants: AppConstants
};
