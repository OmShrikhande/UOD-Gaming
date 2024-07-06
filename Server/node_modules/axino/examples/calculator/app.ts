
var { root } = require("axino/core");
var { Div } = require("axino/div");
var { Button } = require("axino/button");
var { Input } = require("axino/input");


// Main Div 

var div0 = new Div();
div0.appendToApp();
div0.node.style.backgroundColor = "powderblue";

// Entry

var entry = new Input();
div0.node.append(entry.node);
entry.node.style.backgroundColor = "white";
entry.node.readOnly = true;

// Entry style:

entry.Height("35px");
entry.node.style.paddingLeft = "3px"; 


// Line 1

var div1 = new Div();
div1.node.classList.add("row");
div1.appendToApp();

var b_open = new Button("(");
b_open.appendTo(div1);
b_open.node.classList.add("btn");

var b_CE = new Button("CE");
b_CE.appendTo(div1);
b_CE.node.classList.add("btn");

var b_close = new Button(")");
b_close.appendTo(div1);
b_close.node.classList.add("btn");

var b_C = new Button("C");
b_C.appendTo(div1);
b_C.node.classList.add("btn");

div1.node.style.backgroundColor = "lightblue";
div1.horizontal();


// Line 2

var div2 = new Div();

div2.appendToApp();

var b_1 = new Button("1");
b_1.appendTo(div2);
b_1.node.classList.add("btn");

var b_2 = new Button("2");
b_2.appendTo(div2);
b_2.node.classList.add("btn");

var b_3 = new Button("3");
b_3.appendTo(div2);
b_3.node.classList.add("btn");

var b_plus = new Button("+");
b_plus  .appendTo(div2);
b_plus.node.classList.add("btn");

div2.node.style.backgroundColor = "lightblue";
div2.horizontal();


// Line 3

var div2 = new Div();
div2.appendToApp();

var b_4 = new Button("4");
b_4.appendTo(div2);
b_4.node.classList.add("btn");

var b_5 = new Button("5");
b_5.appendTo(div2);
b_5.node.classList.add("btn");

var b_6 = new Button("6");
b_6.appendTo(div2);
b_6.node.classList.add("btn");

var b_min = new Button("-");
b_min.appendTo(div2);
b_min.node.classList.add("btn");

div2.node.style.backgroundColor = "lightblue";
div2.horizontal();


// ligne 4

var div3 = new Div();
div3.appendToApp();

var b_7 = new Button("7");
b_7.appendTo(div3);
b_7.node.classList.add("btn");

var b_8 = new Button("8");
b_8.appendTo(div3);
b_8.node.classList.add("btn");

var b_9 = new Button("9");
b_9.appendTo(div3);
b_9.node.classList.add("btn");

var b_mult = new Button("x");
b_mult.appendTo(div3);
b_mult.node.classList.add("btn");

div3.node.style.backgroundColor = "lightblue";
div3.horizontal();


// ligne 5

var div4 = new Div();
div4.appendToApp();

var b_dot = new Button(".");
b_dot.appendTo(div4);
b_dot.node.classList.add("btn");

var b_0 = new Button("0");
b_0.appendTo(div4);
b_0.node.classList.add("btn");

var b_equ = new Button("=");
b_equ.appendTo(div4);
b_equ.node.classList.add("btn");

var b_div = new Button("/");
b_div.appendTo(div4);
b_div.node.classList.add("btn");

div4.node.style.backgroundColor = "lightblue";
div4.horizontal();


// Behaviour associated with the buttons:

var buffer = ""; 

b_open.onClick(() => {
    buffer = buffer.concat('(');
    console.log({buffer: buffer});
    entry.setText(buffer);
});

b_CE.onClick(() => {
    buffer = buffer.substring(0, buffer.length-1);
    entry.setText(buffer);
});

b_C.onClick(() => {
    buffer = "";
    entry.setText(buffer);
});

b_close.onClick(() => {
    buffer = buffer.concat(')');
    entry.setText(buffer);
});

b_1.onClick(() => {
    buffer = buffer.concat('1');
    entry.setText(buffer);
});

b_2.onClick(() => {
    buffer = buffer.concat('2');
    entry.setText(buffer);
});

b_3.onClick(() => {
    buffer = buffer.concat('3');
    entry.setText(buffer);
});

b_4.onClick(() => {
    buffer = buffer.concat('4');
    entry.setText(buffer);
});

b_5.onClick(() => {
    buffer = buffer.concat('5');
    entry.setText(buffer);
});

b_6.onClick(() => {
    buffer = buffer.concat('6');
    entry.setText(buffer);
});

b_7.onClick(() => {
    buffer = buffer.concat('7');
    entry.setText(buffer);
});

b_8.onClick(() => {
    buffer = buffer.concat('8');
    entry.setText(buffer);
});

b_9.onClick(() => {
    buffer = buffer.concat('9');
    entry.setText(buffer);
});

b_0.onClick(() => {
    buffer = buffer.concat('0');
    entry.setText(buffer);
});

b_plus.onClick(() => {
    buffer = buffer.concat('+');
    entry.setText(buffer);
});

b_min.onClick(() => {
    buffer = buffer.concat('-');
    entry.setText(buffer);
});

b_mult.onClick(() => {
    buffer = buffer.concat('*');
    entry.setText(buffer);
});

b_div.onClick(() => {
    buffer = buffer.concat('/');
    entry.setText(buffer);
});

b_dot.onClick(() => {
    buffer = buffer.concat('.');
    entry.setText(buffer);
});

b_equ.onClick(() => {
    buffer = eval(buffer);
    buffer = buffer.toString();
    entry.setText(buffer);
    console.log({buffer:buffer});
});

