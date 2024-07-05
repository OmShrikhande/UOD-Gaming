import { Button } from "axino/button";
import { log } from "axino/core";
import { Div } from "axino/div";
import { colors } from "axino/constants";
import { TextArea } from "axino/textarea";


var d1 = new Div(null);
d1.appendToApp();
d1.horizontal();
d1.setBackgroundColor(colors.lightseagreen);
d1.Height("100%");
d1.setStyle("margin", "10px");
d1.alignCenter();


var d2 = new Div(null);
d2.appendTo(d1);
d2.vertical();
d2.setBackgroundColor(colors.aqua);
d2.Width("20%");
d2.setStyle("margin", "10px");

var d3 = new Div(null);
d3.appendTo(d1);
d3.setBackgroundColor(colors.aqua);
d3.Width("100%");
d3.setStyle("margin", "10px");

let t1 = new TextArea({ parent: d3, hint: "This is a hint" });

let b1 = new Button("B1");
b1.appendTo(d2);
b1.onClick(() => {
    log({ "B1" : "B1 clicked"});
    t1.setText("B1 clicked");
});








