var React = require('react');
var AppState = require('../flux/AppState');

var Stack = require('./Stack');

var Foundations = React.createClass({
    render() {
        return <div className="panel foundations">
            <p>FoundationStacks</p>
            {this.props.foundations.map((f, fKey) =>
                    <Stack key={fKey}
                           group={AppState.constants.foundations}
                           stackNum={fKey}
                           cards={f.get('cards').take(1)}/>
            )}
        </div>;
    }
});

module.exports = Foundations;