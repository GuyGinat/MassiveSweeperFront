import { GridCanvas } from "./canvas/GridCanvas";
import { useGridStore } from "./hooks/useGridStore";
import { useState, useEffect } from "react";
import WelcomeModal from "./components/WelcomeModal";

function App() {
  const revealCell = useGridStore((s) => s.revealCell);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('massivesweeper-welcome-seen');
    if (hasSeenWelcome !== 'true' || import.meta.env.DEV) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  return (
    <>
      <GridCanvas />
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleCloseWelcomeModal} 
      />
      {/* <div style={{ position: "absolute", top: 10, left: 10 }}>
        <button onClick={() => revealCell(1, 0)}>Reveal (1,0)</button>
      </div> */}
    </>
  );
}

export default App;
