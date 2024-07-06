import { Div } from "./div";
import { Component, log } from "./core";


class Widget extends Div {

    public static htmlString:string = `<div></div>`;

    constructor(text: string="", props:any=null) {
        super(props);
        this.createNode();
        ///
        if (props) {
            if (props.parent) {
                this.appendTo(props.parent);
            }
            if (props.tip) {
                this.Tip(props.tip)
            } 
        } 
    }

    children() : any {
        // Return array of children nodes.
        return this.node.childNodes;
    }

    appendChild(child:Component){
        // Delete a specific child node from the widget
        child.appendTo(this);
    }

    deleteChild(child:Component){
        // Delete a specific child node from the widget
        //this.node.removeChild(child.node);
        child.delete();
    }

    deleteChildren(list:Component[]) {
        // Delete all children from the current widget which are in a given list: 
        for (let item of list) {
            item.delete();
        }
    }

    appendChildren(list:Component[]) {
        // Append children from a givent "Component" list to the current "Widget".
        for (let item of list) {
            item.appendTo(this);
        }
    }


    show() {
        // Cancel hide(). Make current widget visible.
    }

    hide() {
        // Make current Widget invisible.
    }

}

export { Widget };