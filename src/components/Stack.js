var React = require('react');
var ReactDND = require('react-dnd');

var Card = require('./Card');

function stackCollect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        canDrop: monitor.canDrop()
    };
}

var stackTarget = {
    drop: function (props, monitor, component) {
        return {
            stackNum: component.props.stackNum,
            destination: component.props.group
        };
    },

    canDrop: function () {
        return true;
    }
};

var Stack = React.createClass({
    render() {
        var connectDropTarget = this.props.connectDropTarget;

        var classString = 'stack';
        classString += this.props.horizontal ? ' stack-horizontal' : ' stack-vertical';

        return connectDropTarget(
            <div className={classString}>
                {this.props.cards.map((card, key) => <Card parent={this.props.group} card={card} key={key}/>)}
            </div>
        );
    }
});

module.exports = ReactDND.DropTarget('card', stackTarget, stackCollect)(Stack);