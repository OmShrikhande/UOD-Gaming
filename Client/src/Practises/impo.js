import * as d from "./expo.js";

console.log(d.name);
console.log(d.demo);
console.log(d.clgname);
//this is the output of the function
console.log(d.a);


//Objects and Classes
const names = {
    noname: "demo",
    agees: 23,

    //function in object
     greet() {
        console.log("Hello, my name is " + this.noname);

        return "this is in the object."
    }
};


//printingn the objects values
console.log(names)
console.log(names.noname)
console.log(names.agees)
console.log(names.greet())


//this is the class in the js
class User{
    constructor(name,age){
        this.name = name;
        this.age = age;
    }
    greetss(){
        console.log("this is in the greetss");
    }
}

const user1 = new User("omshri",23);

console.log(user1)
user1.greetss()

//Arrays in javascript

const fruits = ["apple", "banana", "orange"];
console.log(fruits)
console.log(fruits[1])
    //arrays findIndex function
const arr = fruits.findIndex((item)=> item === "apple");
console.log(arr);

    // arrays map function
const arrmap = fruits.map((item)=> item + " is a fruite")
console.log(arrmap)

    //converting fruits into an obj
const objfru = fruits.map((item)=> ({fru : item}))
console.log(objfru);

//Destructuring
    //this is shortcut to use the array
    const [firstname, lastname] = ["om", "Shrikhande"];
    console.log(firstname + " " + lastname);

    // shortcut for the objects
    const {name:username, age} = {name : "om", age : 23};    // {} before the = is called as destructuring the array 
    console.log(username + " " + age);      //the username is the alias to the name

//Spread Operator
    // ... this is the spread operator

    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];
    const combinedArr = [...arr1,...arr2];
    console.log("the combined array is: ",combinedArr);
    // objects using spread operator
    const obj1 = {name : "om", age : 23};
    const obj2 = {job : "developer",
        ...obj1
    };
    console.log("the combined object is :",obj2);

//Control statement
    for(const objss of combinedArr){ //for of loop or for each loop
        if (objss=== 4){
            console.log("this is the right choice");
            break;
        }else if(objss > 6){
            console.log("this cant be happen");
            break ;
        }else{
            console.log("this is invalid");

            break;
        }
    }

//Passing function to another function
    function handeltimeout(){
        console.log("this is handel function");
    }
    function handeledtimeout(){
        console.log("this is handeled function");
    }

    //if we added the () then the function get executed imediately
    setTimeout(handeltimeout,2000);
    setTimeout(handeledtimeout,2000);
    setTimeout(()=>{
        console.log("this is arrow function handler");
    },2000);    //by using the arrow function we are not making it execute imediately

    //function to funciton
    function greeter(greetfn){
        greetfn();
    }
    greeter(()=>{console.log("this is greet passing the wole function and excuted after calling in greeter");})

//Function within function

    function omshri(){
        function omshriii(){
            console.log("this is function within function");
        }

        omshriii(); //we cant call this function out of the omshri as it is sculpted to the omshri function
    }