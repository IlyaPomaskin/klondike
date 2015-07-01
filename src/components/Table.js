var React = require('react');
var AppState = require('../flux/AppState');

var Stack = require('./Stack');

var Table = React.createClass({
    render() {
        return <div className="panel table-stacks">
            <p>TableStacks</p>
            {this.props.stacks.map((stack, key) =>
                    <Stack key={key}
                           group={AppState.constants.table}
                           stackNum={key}
                           cards={stack}/>
            )}
        </div>;
    }
});

module.exports = Table;