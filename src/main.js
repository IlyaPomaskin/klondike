var React = require('react');
var Application = require('./components/Application');

document.addEventListener('DOMContentLoaded', function()  {
    React.render(React.createElement(Application, null), document.body);
});