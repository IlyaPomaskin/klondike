var React = require('react');
var AppState = require('../flux/AppState');

var HistoryList = React.createClass({
    onClick(e) {
        AppState.actions.restoreState(e.currentTarget.dataset.stateId);
    },

    render() {
        return <div className="panel">
            <p>History</p>
            <ul>
                {this.props.items.map((item, key) =>
                        <li data-state-id={key} onClick={this.onClick} key={key}>{item.get('name')}</li>
                )}
            </ul>
        </div>;
    }
});

module.exports = HistoryList;