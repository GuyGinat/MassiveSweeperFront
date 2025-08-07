import { GridCanvas } from "./canvas/GridCanvas";
import { useGridStore } from "./hooks/useGridStore";
import { useState, useEffect } from "react";
import TutorialModal from "./components/TutorialModal";
import HelpButton from "./components/HelpButton";
import StatsDebug from "./components/StatsDebug";

function App() {
  const revealCell = useGridStore((s) => s.revealCell);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    // Always show welcome modal on first load
    setShowWelcomeModal(true);
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  const handleOpenHelpModal = () => {
    setShowHelpModal(true);
  };

  const handleCloseHelpModal = () => {
    setShowHelpModal(false);
  };

  return (
    <>
      <GridCanvas />
      <TutorialModal 
        isOpen={showWelcomeModal} 
        onClose={handleCloseWelcomeModal}
        mode="welcome"
      />
      <HelpButton onClick={handleOpenHelpModal} />
      <TutorialModal 
        isOpen={showHelpModal} 
        onClose={handleCloseHelpModal}
        mode="help"
      />
      <StatsDebug />
      {/* <div style={{ position: "absolute", top: 10, left: 10 }}>
        <button onClick={() => revealCell(1, 0)}>Reveal (1,0)</button>
      </div> */}
    </>
  );
}

export default App;
