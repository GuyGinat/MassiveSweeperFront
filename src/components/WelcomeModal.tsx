import React, { useState, useEffect } from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const seen = localStorage.getItem('massivesweeper-welcome-seen');
    if (seen === 'true') {
      setHasSeenWelcome(true);
    }

    const baseUrl = import.meta.env.DEV 
          ? "http://localhost:3001" 
          : "https://massivesweeperback.onrender.com";
    fetch(`${baseUrl}/grid-size`)
      .then(res => res.json())
      .then(data => setGridSize(data))
      .catch(err => console.error('Error fetching grid size:', err));
  }, []);

  const handleClose = () => {
    localStorage.setItem('massivesweeper-welcome-seen', 'true');
    setHasSeenWelcome(true);
    onClose();
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const tutorialSteps = [
    {
      title: "Welcome to MassiveSweeper 💣",
      content: (
        <div>          
          <p>This is a collaborative version of minesweeper where you can play with others in real-time on a {gridSize.width}x{gridSize.height} Minesweeper grid.</p>
          <p>The game does not end when you hit a mine, a counter on the top left corner shows how many mines have exploded by all players combined.</p>
          {/* <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '20px', 
            borderRadius: '10px', 
            margin: '20px 0',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3>🎯 Your Mission</h3>
            <p>Clear the entire grid without hitting any mines!</p>
          </div> */}
        </div>
      )
    },
    {
      title: "How to Play 🎯",
      content: (
        <div>
          <h3>Basic Rules:</h3>
          <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
            <li><strong>Left click</strong> on any cell to reveal it</li>
            <li><strong>Right click</strong> on any cell to flag it</li>
            <li><strong>Hold space and drag</strong> to pan around the grid</li>
            <li><strong>Mouse wheel</strong> to zoom in and out</li>
            <li><strong>Numbers</strong> show how many mines are adjacent to that cell</li>
            <li><strong>Avoid mines</strong> - that is the minesweeper part</li>            
          </ul>
          
          {/* <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            margin: '15px 0',
            border: '2px solid #e9ecef'
          }}>
            <h4>💡 Pro Tips:</h4>
            <ul style={{ textAlign: 'left', margin: '10px 0' }}>
              <li>Start with corners and edges - they have fewer adjacent cells</li>
              <li>If a cell shows "1", there's exactly one mine next to it</li>
              <li>Work together with other players to clear the grid faster!</li>
            </ul>
          </div> */}
        </div>
      )
    },    
    // {
    //   title: "Multiplayer Features 🌐",
    //   content: (
    //     <div>
    //       <h3>Play with others in real-time!</h3>
    //       <div style={{ 
    //         background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 
    //         padding: '20px', 
    //         borderRadius: '10px', 
    //         margin: '20px 0',
    //         color: 'white'
    //       }}>
    //         <h4>🎮 Multiplayer Features:</h4>
    //         <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
    //           <li><strong>Real-time collaboration</strong> - see other players' moves instantly</li>
    //           <li><strong>Shared progress</strong> - work together to clear the massive grid</li>
    //           <li><strong>Live updates</strong> - watch as the grid gets revealed by the community</li>
    //           <li><strong>No waiting</strong> - jump in and start playing immediately</li>
    //         </ul>
    //       </div>
          
    //       <div style={{ 
    //         background: '#f3e5f5', 
    //         padding: '15px', 
    //         borderRadius: '8px', 
    //         margin: '15px 0',
    //         border: '2px solid #9c27b0'
    //       }}>
    //         <h4>🚀 Ready to start?</h4>
    //         <p>Click "Get Started" to join the massive Minesweeper adventure!</p>
    //       </div>
    //     </div>
    //   )
    // }
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '2px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            margin: '0 0 20px 0', 
            color: '#333',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            {tutorialSteps[currentStep].title}
          </h1>
          
          <div style={{ 
            fontSize: '16px', 
            lineHeight: '1.6',
            color: '#555',
            textAlign: 'left'
          }}>
            {tutorialSteps[currentStep].content}
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '30px',
          gap: '8px'
        }}>
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: index === currentStep ? '#007bff' : '#e9ecef',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              padding: '12px 24px',
              border: '2px solid #007bff',
              background: 'white',
              color: '#007bff',
              borderRadius: '8px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: currentStep === 0 ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentStep !== 0) {
                e.currentTarget.style.background = '#007bff';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep !== 0) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#007bff';
              }
            }}
          >
            Previous
          </button>

          <button
            onClick={nextStep}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
          </button>
        </div>

        {/* Skip tutorial option */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px'
        }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
