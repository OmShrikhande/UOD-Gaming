import { Button } from "axino/button";
import { log } from "axino/core";

let b1 = new Button("B1");

b1.appendToApp();
b1.onClick(() => {
    log("clicked");
    b1.setBackgroundColor("orange");
    log("B1 clicked!");
});