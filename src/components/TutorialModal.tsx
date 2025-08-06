import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, API_ENDPOINTS } from '../constants/socket';
import { COLORS, FONTS, SPACING, DIMENSIONS } from '../constants/ui';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'welcome' | 'help'; // Determines behavior and content
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, mode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetch(`${getApiBaseUrl()}${API_ENDPOINTS.GRID_SIZE}`)
      .then(res => res.json())
      .then(data => setGridSize(data))
      .catch(err => console.error('Error fetching grid size:', err));
  }, []);

  const handleClose = () => {
    if (mode === 'welcome') {
      // For welcome mode, mark as seen in localStorage
      localStorage.setItem('massivesweeper-welcome-seen', 'true');
    }
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
            <li><strong>Chord click</strong> (left + right click) to reveal adjacent cells if correct flags are placed</li>
            <li><strong>Hold space and drag</strong> to pan around the grid</li>
            <li><strong>Mouse wheel</strong> to zoom in and out</li>
            <li><strong>Numbers</strong> show how many mines are adjacent to that cell</li>
            <li><strong>Avoid mines</strong> - that is the minesweeper part</li>            
          </ul>
        </div>
      )
    },
    // {
    //   title: "Advanced Features 🚀",
    //   content: (
    //     <div>
    //       <h3>Pro Tips & Features:</h3>
    //       <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
    //         <li><strong>Chord Click</strong>: When a revealed cell shows a number, if you've placed the correct number of flags around it, chord click to reveal all remaining adjacent cells</li>
    //         <li><strong>Preemptive Loading</strong>: The game loads adjacent chunks automatically for smooth scrolling</li>
    //         <li><strong>Real-time Collaboration</strong>: Play with others simultaneously on the same massive grid</li>
    //         <li><strong>Dynamic Zoom</strong>: Zoom levels from 0.35x to 4x for different viewing preferences</li>
    //         <li><strong>Grid Rulers</strong>: Use the ruler lines to navigate the massive grid</li>
    //       </ul>
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
            {currentStep === tutorialSteps.length - 1 
              ? (mode === 'welcome' ? 'Get Started!' : 'Got it!') 
              : 'Next'
            }
          </button>
        </div>

        {/* Close option */}
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
            {mode === 'welcome' ? 'Skip tutorial' : 'Close help'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal; 