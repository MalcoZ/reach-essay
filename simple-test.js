// Rise Essay Box with SCORM 2004 Reporting for Articulate Reach
// Streamlined Production Version

console.log("🎯 simple-test.js loaded from jsDelivr");


(function() {
    console.log('Rise Essay Box Script - Starting...');
    
    // Configuration
    const CONFIG = {
        searchText: 'TEST_REFLECTION_HERE',
        questionText: 'Essay',
        questionId: 'Scene1_Slide1_Essay_0_0'
    };
    
    let foundAndReplaced = false;
    let scormAPI = null;
    
    // Function to create our replacement HTML
    function createReflectionHTML() {
        return `
            <div id="reflection-container" style="border: 3px solid #28a745; padding: 20px; background: #f0fff4; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #28a745; margin-top: 0;">📝 Reflection Activity</h3>
                <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Please share your thoughts and reflections on this topic:</p>
                
                <textarea 
                    id="test-reflection" 
                    style="width:100%; height:150px; padding:12px; border:2px solid #28a745; border-radius: 4px; font-size: 14px; font-family: Arial, sans-serif; resize: vertical;" 
                    placeholder="Type your reflection here... (minimum 10 characters)"
                    onkeyup="updateCharCount()"></textarea>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span id="char-count" style="color: #666; font-size: 14px;">0 characters</span>
                    <span id="save-status" style="color: #666; font-size: 14px;"></span>
                </div>
                
                <button 
                    id="save-button"
                    onclick="saveReflectionToSCORM()" 
                    style="background:#28a745; color:white; padding:12px 24px; margin:12px 0; cursor:pointer; border:none; border-radius:4px; font-size:16px; font-weight:bold; width: 100%; transition: background 0.3s;">
                    💾 Save Reflection
                </button>
                
                <div id="save-result" style="margin-top: 12px;"></div>
            </div>
        `;
    }
    
    // Character count updater
    window.updateCharCount = function() {
        const text = document.getElementById('test-reflection').value;
        document.getElementById('char-count').textContent = `${text.length} characters`;
        
        // Enable/disable save button based on length
        const saveButton = document.getElementById('save-button');
        if (text.length >= 10) {
            saveButton.style.opacity = '1';
            saveButton.style.cursor = 'pointer';
        } else {
            saveButton.style.opacity = '0.5';
            saveButton.style.cursor = 'not-allowed';
        }
    };
    
    // Find SCORM API function
    function findSCORMAPI() {
        // Check window chain for SCORM API
        let win = window;
        for(let i = 0; i < 10; i++) {
            if (win.API_1484_11) {
                return win.API_1484_11;
            }
            if (win.API) {
                return win.API;
            }
            if (win === win.parent) break;
            win = win.parent;
        }
        return null;
    }
    
    // Main save function - Storyline format for Reach
    window.saveReflectionToSCORM = function() {
        const text = document.getElementById('test-reflection').value;
        const resultDiv = document.getElementById('save-result');
        const statusSpan = document.getElementById('save-status');
        
        // Validate input
        if (!text || text.length < 10) {
            resultDiv.innerHTML = `
                <div style="background:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px; color:#721c24;">
                    Please enter at least 10 characters.
                </div>
            `;
            return;
        }
        
        statusSpan.textContent = 'Saving...';
        
        // Find SCORM API if not already found
        if (!scormAPI) {
            scormAPI = findSCORMAPI();
        }
        
        if (scormAPI) {
            try {
                // Calculate time spent for latency
                const startTime = window.reflectionStartTime || Date.now();
                const timeSpent = ((Date.now() - startTime) / 1000).toFixed(2);
                const latency = `PT${timeSpent}S`;
                
                // Create timestamp in Storyline format
                const now = new Date();
                const offset = -now.getTimezoneOffset();
                const offsetHours = Math.floor(Math.abs(offset) / 60);
                const offsetSign = offset >= 0 ? '+' : '-';
                const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}`;
                const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.0${offsetString}`;
                
                // Get current interaction count
                let interactionCount = parseInt(scormAPI.GetValue("cmi.interactions._count") || "0");
                const index = interactionCount;
                
                // Save in Storyline format (what Reach expects for surveys)
                scormAPI.SetValue(`cmi.interactions.${index}.id`, CONFIG.questionId);
                scormAPI.SetValue(`cmi.interactions.${index}.type`, "fill-in");
                scormAPI.SetValue(`cmi.interactions.${index}.timestamp`, timestamp);
                scormAPI.SetValue(`cmi.interactions.${index}.description`, CONFIG.questionText);
                scormAPI.SetValue(`cmi.interactions.${index}.learner_response`, text);
                scormAPI.SetValue(`cmi.interactions.${index}.result`, "neutral");  // Critical for survey recognition
                scormAPI.SetValue(`cmi.interactions.${index}.latency`, latency);
                
                // Set completion status
                scormAPI.SetValue("cmi.completion_status", "completed");
                scormAPI.SetValue("cmi.success_status", "passed");
                
                // Commit the data
                const commitResult = scormAPI.Commit("");
                
                if (commitResult === "true") {
                    statusSpan.textContent = '✓ Saved';
                    resultDiv.innerHTML = `
                        <div style="background:#d4edda; border:1px solid #c3e6cb; padding:12px; border-radius:4px;">
                            <strong style="color:#155724;">✅ Reflection saved successfully!</strong><br>
                            <small style="color:#666;">Your response has been recorded.</small>
                        </div>
                    `;
                    
                    // Disable save button temporarily
                    const saveButton = document.getElementById('save-button');
                    saveButton.textContent = '✓ Saved';
                    saveButton.style.background = '#6c757d';
                    setTimeout(() => {
                        saveButton.textContent = '💾 Save Reflection';
                        saveButton.style.background = '#28a745';
                    }, 3000);
                } else {
                    statusSpan.textContent = 'Error';
                    resultDiv.innerHTML = `
                        <div style="background:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px; color:#721c24;">
                            <strong>Save failed.</strong> Please try again.
                        </div>
                    `;
                }
                
            } catch(e) {
                statusSpan.textContent = 'Error';
                resultDiv.innerHTML = `
                    <div style="background:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px; color:#721c24;">
                        <strong>Error:</strong> ${e.message}
                    </div>
                `;
            }
        } else {
            statusSpan.textContent = 'No API';
            resultDiv.innerHTML = `
                <div style="background:#fff3cd; border:1px solid #ffeaa7; padding:12px; border-radius:4px; color:#856404;">
                    <strong>⚠️ Cannot connect to LMS</strong><br>
                    Your reflection cannot be saved at this time.
                </div>
            `;
        }
    };
    
    // Function to check and replace text
    function checkAndReplaceInElement(element) {
        if (foundAndReplaced) return;
        
        const text = element.innerText || element.textContent || '';
        
        if (text.includes(CONFIG.searchText)) {
            // Replace the text with our HTML
            if (element.innerHTML && element.innerHTML.includes(CONFIG.searchText)) {
                element.innerHTML = element.innerHTML.replace(
                    CONFIG.searchText,
                    createReflectionHTML()
                );
                foundAndReplaced = true;
                console.log('Essay box injected successfully');
                
                // Set start time for latency tracking
                setTimeout(() => {
                    window.reflectionStartTime = Date.now();
                }, 1000);
                
                observer.disconnect();
            }
        }
    }
    
    // Set up MutationObserver
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        checkAndReplaceInElement(node);
                        const descendants = node.getElementsByTagName('*');
                        for (let i = 0; i < descendants.length; i++) {
                            checkAndReplaceInElement(descendants[i]);
                        }
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Check existing content
    setTimeout(function() {
        if (!foundAndReplaced) {
            const allElements = document.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
                checkAndReplaceInElement(allElements[i]);
                if (foundAndReplaced) break;
            }
        }
    }, 1000);
    

})();
