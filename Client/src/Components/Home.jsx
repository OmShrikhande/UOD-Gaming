import React,{useState} from "react";
import "../Css/Home.css"



const Home =() =>
{
    const[count, setCount]=useState(0);

    const increment=()=>{
        setCount(count+1);
    }

    const decrement=()=>{
        if(count===0){setCount(count)}else{setCount(count-1);}
        
    }
    return(
        <div>
            <h1>this is my Home</h1>
            <div>count is {count}</div>
            <button onClick={increment}>  Increment</button>
            <button onClick={decrement}>Decrement</button>
        </div>
    )
}

export default Home;