var React = require('react');
var AppState = require('../flux/AppState');

var Stack = require('./Stack');

var Reserved = React.createClass({
    openNextReserved() {
        AppState.actions.openNextReserved();
    },

    render() {
        return <div className="panel reserved">
            <p>
                <span>ReserveDeck</span>
                <br/>
                <button onClick={this.openNextReserved}>Open next</button>
            </p>
            <Stack className="reserved"
                   group={AppState.constants.reserved}
                   cards={this.props.cards.filter(card => card.get('visible'))}
                   horizontal={true}/>
        </div>;
    }
});

module.exports = Reserved;