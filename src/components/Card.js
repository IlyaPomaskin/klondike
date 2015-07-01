var React = require('react');
var AppState = require('../flux/AppState');
var Immutable = require('immutable');
var ReactDND = require('react-dnd');

function cardCollect(connect) {
    return {
        connectDragSource: connect.dragSource()
    };
}

var cardSource = {
    beginDrag: function (props) {
        return {
            source: props.parent,
            card: props.card
        };
    },

    endDrag: function (props, monitor) {
        if (!monitor.didDrop()) {
            return;
        }

        var card = monitor.getItem();
        var stack = monitor.getDropResult();

        AppState.actions.moveCards(card.source, stack.destination, stack.stackNum, card.card);
    },

    canDrag: function (props) {
        var card = props.card;
        var source = props.parent;
        var consts = AppState.constants;
        var isVisibleOnTable = card.get('visible') && source == consts.table;
        var isLastOnReserved = Immutable.is(AppState.store.getLastReservedCard(), card) && source == consts.reserved;
        var isOneOfLastOnFoundations = AppState.store.getLastFoundationCards().some(fCard => Immutable.is(fCard, card)) && source == consts.foundations;
        return isVisibleOnTable || isLastOnReserved || isOneOfLastOnFoundations;
    }
};

var Card = React.createClass({
    render() {
        var isDragging = this.props.isDragging;
        var connectDragSource = this.props.connectDragSource;
        var cardSuit = this.props.card.get('suit');
        var suits = AppState.constants.suits;
        var isBlack = cardSuit == suits.get('spades') || cardSuit == suits.get('clubs');
        var textOpacity = this.props.card.get('visible') ? 1 : 0.1;

        var cardStyle = {
            color: `rgba(${isBlack ? 0 : 255}, 0, 0, ${textOpacity})`,
            opacity: isDragging ? 0.5 : 1
        };

        return connectDragSource(<div className="card" style={cardStyle}>
            {this.props.card.toString()}
        </div>);
    }
});

module.exports = ReactDND.DragSource('card', cardSource, cardCollect)(Card);