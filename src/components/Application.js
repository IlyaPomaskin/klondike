var React = require('react');
var Reflux = require('reflux');
var AppState = require('../flux/AppState');
var Immutable = require('immutable');
var ReactDND = require('react-dnd');
var HTML5Backend = require('react-dnd/modules/backends/HTML5');

var Reserved = require('./Reserved');
var Foundations = require('./Foundations');
var Table = require('./Table');
var HistoryList = require('./HistoryList');

var Application = React.createClass({
    mixins: [Reflux.connect(AppState.store, 'app')],

    autocomplete(e) {
        e.preventDefault();
        AppState.actions.autocomplete();
    },

    newGame() {
        AppState.actions.newGame();
    },

    render() {
        return <div className="container-fluid" onContextMenu={this.autocomplete}>
            <Reserved cards={this.state.app.reserved}/>
            <Foundations foundations={this.state.app.foundations}/>
            <Table stacks={this.state.app.table}/>

            <div className="panel buttons">
                <button onClick={this.newGame}>New game</button>
            </div>

            <HistoryList items={this.state.app.history}/>
        </div>;
    }
});

module.exports = ReactDND.DragDropContext(HTML5Backend)(Application);
