/**
 * Vector : Convenience class Wrapper around Array()
 */

interface callback<U> {
    (item: U): void;
}

class Vector <T> {

    /**
     * Underlying Array
     */
    a: Array<T>;
    
    constructor() {
        this.a = new Array<T>();
    }
    
    /**
     * 
     * @param item : Item to be appended into current Vector
     */
    append(item:T){
        this.a.push(item);
    }

    /**
     * @param item : Item to be deleted from current Vector
     */
    delete(item:T) {        
        let pos = this.a.indexOf(item);
        if (pos > -1) {
            this.a.splice(pos, 1);
        } else {
            throw(`Item ${item} not found`);
        }
    }

    /**
     * @param index : Index of item to be deleted from current Vector
     */
    deleteAt(index: number){
        if (index < this.a.length) {
            this.a.splice(index, 1);
        } else {
            throw(`Index ${index} not in range`);          
        }
    }

    /**
     * 
     * @param index : Index of item to be inserted into current Vector
     * @param item : Item to be inserted
     */
    insertAt(index:number, item:T) {
        if (index < this.a.length) {
            this.a.splice(index, 0, item);
        } else {
            throw(`Index ${index} not in range`);        
        }
    }

    /**
     * Delete last item from current Vector
     */
    deleteAtEnd(){
        this.a.splice(this.a.length-1, 1);
    }

    /**
     * 
     * @param item : Item to be inserted at the end of current Vector
     */
    insertAtEnd(item: T) {
        this.a.splice(this.a.length, 0, item);
    }

    /**
     * Delete 1st Item of current Vector
     */
    deleteAtStart(){
        this.a.splice(0, 1);
    }

    /**
     * 
     * @param item : Item to be inserted at start of current Vector
     */
    insertAtStart(item:T) {
        this.a.splice(0, 0, item);
    }


    /**
     * 
     * @param index : Index of item to be substituted,
     * @param item : Substitute item.
     */
    substituteAt(index:number, item:T) {
        if (index < this.a.length) {
            this.a.splice(index, 1, item);
        } else {
            throw(`Index ${index} not in range`);          
        }
    }

    /**
     * 
     * @param item : Item to be prepended to Vector.
     */
    prepend(item:T){
        this.a.splice(0, 0, item);
    }

    /**
     * 
     * @param oldItem : item to be substituted.
     * @param newItem : Substitute 
     */
    substitute(oldItem:T, newItem: T) {
        let pos = this.a.indexOf(oldItem);
        if (pos > -1) {
            this.a.splice(pos, 1, newItem);
        } else {
            throw(`Item ${oldItem} not found`);
        }        
    }

    /**
     * 
     * @param v : Vector to be concatenated to current Vector.
     */
    concat(v: Vector<T>) : Vector<T>{
        let w = new Vector<T>();
        let temp = [...this.a];
        w.a = temp.concat([...v.a]);
        return w;
    }

    /**
     * Delete all elements from current Vector.
     */
    clear() {
        this.a.splice(0, this.a.length)
    }

    /**
     * Return the underlying array from current Vector.
     */
    toArray() : Array<T>{
        return this.a;
    }

    /**
     * 
     * @param v Build vector from Array v.
     */
    fromArray(v:Array<T>)  {
        this.a = [...v];
    }

    /**
     * 
     * @param item : item which is checked for inclusion.
     */
    includes(item: T) : boolean{
        return this.a.includes(item);
    }

    forEach(fn: callback<T>) {
        this.a.forEach(fn);
    }

    /**
     * @param fn: Sorting function 
     */
    sort(fn:any=undefined) {
        this.a.sort(fn);
    }

    /**
     * 
     * @param i fist position for swap.
     * @param j second position for swap.
     */
    swapAt(i:number, j:number){
        let tmp = this.a[i];
        this.substituteAt(i, this.a[j])
        this.substituteAt(j, tmp);
    }

    /**
     * 
     * @param i Index of item whose value is returned
     */
    getValue(i: number) : T {
        return this.a[i];
    }

    /**
     * 
     * @param i Index of value to be set
     * @param value value to be set
     */

    setValue(i: number, value:T) {
        if (i < this.a.length) {
            this.a[i] = value;
        } else {
            throw(`Index ${i} not in range`);
        }
    }

    /**
     * Returns vector length
     */
    length() : number {
        return this.a.length;
    }

}

function concatVectors <T> (v1: Vector<T>, v2: Vector<T>){
    let w = new Vector<T>();
    w.fromArray([...v1.a].concat([...v2.a]));
    return w;
}

export { Vector, concatVectors };

