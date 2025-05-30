class SpeedController {
    constructor() {
        this.state = {
            speed: 1
        };
        
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleSpeedButtonClick = this.handleSpeedButtonClick.bind(this);
        this.handleResetClick = this.handleResetClick.bind(this);
        
        // Initialize UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initUI());
        } else {
            this.initUI();
        }
    }

    async handleKeyPress(event) {
        try {
            // Only handle if not in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            let newSpeed = this.state.speed;

            switch (event.key.toLowerCase()) {
                case 'a':
                    newSpeed = Math.max(0.1, this.state.speed - 0.1);
                    break;
                case 's':
                    newSpeed = Math.min(16, this.state.speed + 0.1);
                    break;
                case ',':
                    newSpeed = 1.0;
                    break;
                case '.':
                    newSpeed = 10.0;
                    break;
                default:
                    return;
            }

            // Round to 1 decimal place to avoid floating point issues
            newSpeed = Math.round(newSpeed * 10) / 10;
            await this.applySpeed(newSpeed);
        } catch (error) {
            console.error('Error in handleKeyPress:', error);
        }
    }

    async handleSpeedButtonClick(e) {
        try {
            if (e.target.classList.contains('speed-btn')) {
                const speed = parseFloat(e.target.getAttribute('data-speed'));
                if (!isNaN(speed)) {
                    await this.applySpeed(speed);
                } else {
                    console.error('Invalid speed value from button:', e.target.getAttribute('data-speed'));
                }
            }
        } catch (error) {
            console.error('Error in handleSpeedButtonClick:', error);
        }
    }

    async applySpeed(speed) {
        try {
            if (typeof speed !== 'number' || isNaN(speed)) {
                console.error('Invalid speed value:', speed);
                return;
            }

            // Ensure speed is within valid range
            speed = Math.max(0.1, Math.min(16, speed));
            this.state.speed = speed;
            
            // Send message to content script to change video speed
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (tab) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'setSpeed',
                        speed: speed
                    });
                } catch (messageError) {
                    console.error('Error sending message to content script:', messageError);
                }
            }
            // Send message to background to update badge
            chrome.runtime.sendMessage({ action: 'updateBadge', speed: speed });
            
            // Update UI immediately after speed change
            this.updateUI();
        } catch (error) {
            console.error('Error in applySpeed:', error);
            // Still update UI even if message sending fails
            this.updateUI();
        }
    }

    updateUI() {
        try {
            // Update the speed display
            const speedDisplay = document.getElementById('current-speed');
            if (speedDisplay) {
                speedDisplay.textContent = `${this.state.speed.toFixed(1)}x`;
            }

            // Update active state of speed buttons
            document.querySelectorAll('.speed-btn').forEach(btn => {
                try {
                    const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
                    if (!isNaN(btnSpeed)) {
                        const isActive = Math.abs(btnSpeed - this.state.speed) < 0.01;
                        btn.classList.toggle('active', isActive);
                    }
                } catch (btnError) {
                    console.error('Error updating button state:', btnError);
                }
            });
        } catch (error) {
            console.error('Error in updateUI:', error);
        }
    }

    async handleResetClick() {
        try {
            await this.applySpeed(1.0);
        } catch (error) {
            console.error('Error in handleResetClick:', error);
        }
    }

    initUI() {
        try {
            // Set up event listeners
            const speedGrid = document.querySelector('.speed-grid');
            const resetButton = document.getElementById('reset-speed');
            
            if (speedGrid) {
                speedGrid.addEventListener('click', this.handleSpeedButtonClick.bind(this));
            }
            
            if (resetButton) {
                resetButton.addEventListener('click', this.handleResetClick.bind(this));
            }
            
            document.addEventListener('keydown', this.handleKeyPress);
            
            // Initial UI update
            this.updateUI();
        } catch (error) {
            console.error('Error in initUI:', error);
        }
    }
}

// Initialize the controller
const controller = new SpeedController(); 