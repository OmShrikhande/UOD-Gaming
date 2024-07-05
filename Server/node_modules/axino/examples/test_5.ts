import { Button } from "axino/button";
import { log } from "axino/core";
import { Div } from "axino/div";
import { colors } from "axino/constants";
import { TextArea } from "axino/textarea";

var d1 = new Div(null);
d1.appendToApp();
d1.vertical();
d1.setBackgroundColor(colors.lightseagreen);
d1.Height("100%")

var d2 = new Div(null);
d2.appendTo(d1);
d2.horizontal();
d2.setBackgroundColor(colors.aqua);
d2.Width("98%");
d2.setStyle("margin", "10px");

var d3 = new Div(null);
d3.appendTo(d1);
d3.setBackgroundColor(colors.aqua);
d3.Width("98%");
d3.setStyle("margin", "10px");

let b1 = new Button("B1");
b1.appendTo(d2);

let b2 = new Button("B2");
b2.appendTo(d2);

let b3 = new Button("B3");
b3.appendTo(d2);

let t1 = new TextArea({ parent: d3, hint: "This is a hint" });

let b4 = new Button("B4");
b4.appendTo(d3);





