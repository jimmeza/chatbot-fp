import "./styles/main.css";
import { renderHome } from "./views/Home";

const app = document.getElementById("app") as HTMLElement;
renderHome(app);
