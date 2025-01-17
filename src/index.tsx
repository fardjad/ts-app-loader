import { render } from "preact";
import { Counter } from "./counter.js";

export const App = () => {
	  return (
	<div>
	  <h1>Counter</h1>
	  <Counter />
	</div>
  );
}

render(<App />, document.getElementById("app") as HTMLElement);
