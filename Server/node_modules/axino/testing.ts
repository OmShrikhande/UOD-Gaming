import { Button } from "./button";
import { log } from "./core";
import { Label } from "./label";
import { Div } from "./div";
import { TextArea } from "./textarea";
import { Olist } from "./olist";
import { Select } from "./select";
import { CheckBox } from "./checkbox";
import { RadioButton } from "./radio";
import { Form } from "./form";
import { Canvas } from "./canvas";
import { eventsMouse } from "./constants";
import { colors } from "./constants";
import { root } from "./core";
import { Table } from "./table";


function display() {
    
    let b1 = new Button("B1");
    b1.appendToApp();
    b1.onClick(() => {
        log("clicked");
        b1.setBackgroundColor("orange");
        log(tex.getText());
        //v1.setStyle("width", "200px");
        v1.Width("25%"); 
    });


    var v = new Div(null);
    v.appendToApp();
    //v.verticalReverse();
    v.horizontal();
    v.setBackgroundColor(colors.lightseagreen);
    v.alignCenter();

    var b = new Array(10);
    for (let i = 0; i < 10; i++) {
        let bt = new Button(`B${i}`, { parent: v });
        bt.setBackgroundColor("white");
        bt.setColor(colors.lightseagreen);
        bt.BorderRadius("0px");
        bt.BorderRight();
        bt.TipBottom("A simple hint");
        b.push(bt);
    };


    var v1 = new Div(null);
    v1.appendToApp();
    v1.setBackgroundColor(colors.lightcyan);
    v1.horizontal;
    v1.Border();
 
    var l = new Label("AAA");
    l.appendToApp();
    var tex = new TextArea({ parent: v1, hint: "This is a hint" });
    var li2 = new Olist({ parent: v1, items: ["item 1", "item 2", "item 3"] });
    //log({ li2: li2 });

    var can = new Canvas({ parent: root, width: "200", height: "200" });
    var ctx = can.context;
    ctx.beginPath();
    ctx.arc(95, 50, 40, 0, 2 * Math.PI);
    ctx.stroke();

    var l1 = new Label("BBB");
    l1.appendToApp();
    //log({ l1: l1 });

    var s2 = new Select({ items: ["one", "two"] });
    s2.appendTo(v1);

    var f = new Form({ parent: root });
    var cx = new CheckBox({ parent: f, text: "xxx" });
    var bx = new RadioButton({ parent: f, text: "yyy" });
    var bb = new Button("BB", { parent: root, tip: "BB tip" });
    var bb1 = new Button("BB1");

    bb1.appendToApp();
    bb1.onEvent(eventsMouse.mouseover, () => {
        //log("hovering");
        bb1.setBackgroundColor(colors.aquamarine);
    })

    bb1.onEvent(eventsMouse.mouseout, () => {
        bb1.setBackgroundColor(null);
    })
    

    var records = [{"name":"Bond", "surname": "James"},{"name": "Hari", "surname": "Mata"}];
    var t = new Table({parent: root, rows: records, header: true});
}

display();

exports = { display };


