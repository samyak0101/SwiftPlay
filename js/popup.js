class SpeedController {
    constructor() {
        this.state = {
            speed: 1
        };
        
        this.defaultShortcuts = {
            slowDownKey: 'a',
            slowDownAmount: 0.1,
            speedUpKey: 's',
            speedUpAmount: 0.1,
            resetKey: ',',
            maxKey: '.',
            maxAmount: 10.0
        };
        
        this.shortcuts = {...this.defaultShortcuts};
        
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleSpeedButtonClick = this.handleSpeedButtonClick.bind(this);
        this.handleResetClick = this.handleResetClick.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.saveSettings = this.saveSettings.bind(this);
        this.resetDefaultSettings = this.resetDefaultSettings.bind(this);
        this.closeOnboarding = this.closeOnboarding.bind(this);
        
        // Initialize UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initUI());
        } else {
            this.initUI();
        }
    }

    async loadSettings() {
        try {
            // Load shortcuts
            const result = await chrome.storage.sync.get(['shortcuts', 'onboardingComplete']);
            
            if (result.shortcuts) {
                this.shortcuts = result.shortcuts;
                this.updateShortcutDisplay();
            } else {
                // If no saved shortcuts, use defaults and save them
                await chrome.storage.sync.set({ shortcuts: this.defaultShortcuts });
            }
            
            // Check if onboarding has been completed
            if (!result.onboardingComplete) {
                this.showOnboarding();
                await chrome.storage.sync.set({ onboardingComplete: true });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fall back to defaults if there's an error
            this.shortcuts = {...this.defaultShortcuts};
        }
    }

    showOnboarding() {
        const onboardingOverlay = document.getElementById('onboarding-overlay');
        if (onboardingOverlay) {
            onboardingOverlay.style.display = 'flex';
        }
    }

    closeOnboarding() {
        const onboardingOverlay = document.getElementById('onboarding-overlay');
        if (onboardingOverlay) {
            onboardingOverlay.style.display = 'none';
        }
    }

    updateShortcutDisplay() {
        // Update the shortcut display in the main view
        document.getElementById('slow-down-key').textContent = this.shortcuts.slowDownKey.toUpperCase();
        document.getElementById('slow-down-amount').textContent = `-${this.shortcuts.slowDownAmount}`;
        document.getElementById('speed-up-key').textContent = this.shortcuts.speedUpKey.toUpperCase();
        document.getElementById('speed-up-amount').textContent = `+${this.shortcuts.speedUpAmount}`;
        document.getElementById('reset-key').textContent = this.shortcuts.resetKey;
        document.getElementById('max-key').textContent = this.shortcuts.maxKey;
        document.getElementById('max-amount').textContent = this.shortcuts.maxAmount.toFixed(1);
    }

    populateSettingsForm() {
        // Populate the settings form with current values
        document.getElementById('slow-down-key-input').value = this.shortcuts.slowDownKey;
        document.getElementById('slow-down-amount-input').value = this.shortcuts.slowDownAmount;
        document.getElementById('speed-up-key-input').value = this.shortcuts.speedUpKey;
        document.getElementById('speed-up-amount-input').value = this.shortcuts.speedUpAmount;
        document.getElementById('reset-key-input').value = this.shortcuts.resetKey;
        document.getElementById('max-key-input').value = this.shortcuts.maxKey;
        document.getElementById('max-amount-input').value = this.shortcuts.maxAmount;
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel.style.display === 'none') {
            settingsPanel.style.display = 'block';
            this.populateSettingsForm();
        } else {
            settingsPanel.style.display = 'none';
        }
    }

    async saveSettings(e) {
        e.preventDefault();
        
        // Get values from form
        const newShortcuts = {
            slowDownKey: document.getElementById('slow-down-key-input').value.toLowerCase() || this.defaultShortcuts.slowDownKey,
            slowDownAmount: parseFloat(document.getElementById('slow-down-amount-input').value) || this.defaultShortcuts.slowDownAmount,
            speedUpKey: document.getElementById('speed-up-key-input').value.toLowerCase() || this.defaultShortcuts.speedUpKey,
            speedUpAmount: parseFloat(document.getElementById('speed-up-amount-input').value) || this.defaultShortcuts.speedUpAmount,
            resetKey: document.getElementById('reset-key-input').value.toLowerCase() || this.defaultShortcuts.resetKey,
            maxKey: document.getElementById('max-key-input').value.toLowerCase() || this.defaultShortcuts.maxKey,
            maxAmount: parseFloat(document.getElementById('max-amount-input').value) || this.defaultShortcuts.maxAmount
        };
        
        // Validate that all keys are single characters
        for (const keyProp of ['slowDownKey', 'speedUpKey', 'resetKey', 'maxKey']) {
            if (newShortcuts[keyProp].length !== 1) {
                alert(`Please enter a single character for each key. Invalid input for ${keyProp}`);
                return;
            }
        }
        
        // Save to storage
        try {
            await chrome.storage.sync.set({ shortcuts: newShortcuts });
            
            this.shortcuts = newShortcuts;
            this.updateShortcutDisplay();
            this.toggleSettings(); // Hide settings panel
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('There was an error saving your settings. Please try again.');
        }
    }

    async resetDefaultSettings() {
        try {
            await chrome.storage.sync.set({ shortcuts: this.defaultShortcuts });
            
            this.shortcuts = {...this.defaultShortcuts};
            this.updateShortcutDisplay();
            this.populateSettingsForm(); // Update form with default values
        } catch (error) {
            console.error('Error resetting settings:', error);
            alert('There was an error resetting your settings. Please try again.');
        }
    }

    async handleKeyPress(event) {
        try {
            // Only handle if not in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            let newSpeed = this.state.speed;
            const key = event.key.toLowerCase();

            if (key === this.shortcuts.slowDownKey) {
                newSpeed = Math.max(0.1, this.state.speed - this.shortcuts.slowDownAmount);
            } else if (key === this.shortcuts.speedUpKey) {
                newSpeed = Math.min(16, this.state.speed + this.shortcuts.speedUpAmount);
            } else if (key === this.shortcuts.resetKey) {
                newSpeed = 1.0;
            } else if (key === this.shortcuts.maxKey) {
                newSpeed = this.shortcuts.maxAmount;
            } else {
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
                
                // Add pulse animation
                speedDisplay.classList.add('speed-pulse');
                setTimeout(() => {
                    speedDisplay.classList.remove('speed-pulse');
                }, 300);
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

    async initUI() {
        try {
            // Signal to background script that popup has opened
            chrome.runtime.sendMessage({ action: 'popupOpened' });
            
            // Setup event listeners
            document.addEventListener('keydown', this.handleKeyPress);
            document.getElementById('speed-buttons').addEventListener('click', this.handleSpeedButtonClick);
            document.getElementById('reset-button').addEventListener('click', this.handleResetClick);
            document.getElementById('settings-toggle').addEventListener('click', this.toggleSettings);
            document.getElementById('settings-form').addEventListener('submit', this.saveSettings);
            document.getElementById('reset-defaults').addEventListener('click', this.resetDefaultSettings);
            document.getElementById('close-onboarding').addEventListener('click', this.closeOnboarding);
            
            // Hide settings panel initially
            document.getElementById('settings-panel').style.display = 'none';
            
            // Load settings
            await this.loadSettings();
            
            // Get current speed from active tab
            await this.getCurrentSpeed();
            
            // Update UI with current state
            this.updateUI();
        } catch (error) {
            console.error('Error initializing UI:', error);
        }
    }

    async getCurrentSpeed() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (tab) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: 'getCurrentSpeed'
                    });
                    
                    if (response && typeof response.speed === 'number') {
                        this.state.speed = response.speed;
                    }
                } catch (messageError) {
                    console.log('Content script not ready or not found:', messageError);
                }
            }
        } catch (error) {
            console.error('Error getting current speed:', error);
        }
    }
}

// Initialize the controller
const controller = new SpeedController(); 