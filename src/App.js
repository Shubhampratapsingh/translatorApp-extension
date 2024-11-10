import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { SignedIn, SignedOut, SignIn } from "@clerk/chrome-extension";
import Translator from "./pages/Translator/Translator";
import SignedOutMessage from "./pages/SignedOutMessage";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Translator />
              </SignedIn>
              <SignedOut>
                <SignedOutMessage />
              </SignedOut>
            </>
          }
        />
        <Route path="/translator" element={<Translator />} />
      </Routes>
    </Router>
  );
}

export default App;
