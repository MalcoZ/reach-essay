// Dynamic Essay Box with SCORM 2004 Reporting for Articulate Reach
// Production Version with Shortcode Support

console.log("🎯 Dynamic Essay Box loaded from jsDelivr");

(function() {
    console.log('Rise Essay Box Script - Starting with dynamic shortcode support...');
    
    // Global SCORM API reference
    let scormAPI = null;
    
    // Track all essay instances for bulk operations
    const essayInstances = new Map();
    
    // Find SCORM API function
    function findSCORMAPI() {
        let win = window;
        for(let i = 0; i < 10; i++) {
            if (win.API_1484_11) return win.API_1484_11;
            if (win.API) return win.API;
            if (win === win.parent) break;
            win = win.parent;
        }
        return null;
    }
    
    // Initialize SCORM API
    scormAPI = findSCORMAPI();
    if (scormAPI) {
        console.log('✅ SCORM API found');
    } else {
        console.log('⚠️ SCORM API not found - responses will be saved locally only');
    }
    
    // Utility functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function parseAttributes(str) {
        const attrs = {};
        if (!str) return attrs;
        
        // More robust regex to handle various quote types and spacing
        const regex = /(\w+)\s*=\s*["']([^"']+)["']/g;
        let match;
        
        while ((match = regex.exec(str)) !== null) {
            attrs[match[1]] = match[2];
        }
        
        return attrs;
    }
    
    // Create the essay HTML with improved styling
    function createEssayHTML(id, config) {
        const label = config.label || 'Please share your thoughts:';
        const placeholder = config.placeholder || 'Type your response here... (minimum 10 characters)';
        const minLength = config.minlength || 10;
        
        return `
            <div id="essay-container-${id}" class="reach-essay-box" 
                 style="border: 2px solid #0078D4; padding: 20px; background: #f8f9fa; 
                        border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <label for="essay-input-${id}" style="display: block; color: #333; 
                       font-size: 16px; font-weight: 600; margin-bottom: 12px;">
                    ${escapeHtml(label)}
                </label>
                
                <textarea 
                    id="essay-input-${id}"
                    data-essay-id="${id}"
                    style="width: 100%; height: 150px; padding: 12px; 
                           border: 1px solid #ccc; border-radius: 4px; 
                           font-size: 14px; font-family: inherit; resize: vertical;
                           transition: border-color 0.3s;"
                    placeholder="${escapeHtml(placeholder)}"
                    data-min-length="${minLength}"></textarea>
                
                <div style="display: flex; justify-content: space-between; 
                            align-items: center; margin-top: 10px;">
                    <span id="essay-charcount-${id}" style="color: #666; font-size: 14px;">
                        0 characters (min: ${minLength})
                    </span>
                    <span id="essay-status-${id}" style="color: #666; font-size: 14px;"></span>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button 
                        id="essay-save-${id}"
                        type="button"
                        style="flex: 1; background: #0078D4; color: white; 
                               padding: 12px 24px; cursor: pointer; border: none; 
                               border-radius: 4px; font-size: 16px; font-weight: 600;
                               transition: background 0.3s, opacity 0.3s;"
                        disabled>
                        💾 Save Response
                    </button>
                    
                    <button 
                        id="essay-clear-${id}"
                        type="button"
                        style="padding: 12px 24px; background: #fff; color: #333; 
                               border: 1px solid #ccc; cursor: pointer; 
                               border-radius: 4px; font-size: 16px;
                               transition: background 0.3s;">
                        Clear
                    </button>
                </div>
                
                <div id="essay-result-${id}" style="margin-top: 12px;"></div>
            </div>
        `;
    }
    
    // Save to SCORM with Storyline format for Reach
    function saveToSCORM(id, text, config) {
        if (!scormAPI) {
            console.log('No SCORM API available');
            return { success: false, message: 'Not connected to LMS' };
        }
        
        try {
            const now = new Date();
            const essay = essayInstances.get(id);
            
            // Calculate time spent
            const timeSpent = essay.startTime ? 
                ((Date.now() - essay.startTime) / 1000).toFixed(2) : "0";
            const latency = `PT${timeSpent}S`;
            
            // Format timestamp for SCORM
            const offset = -now.getTimezoneOffset();
            const offsetHours = Math.floor(Math.abs(offset) / 60);
            const offsetSign = offset >= 0 ? '+' : '-';
            const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:00`;
            const timestamp = now.toISOString().slice(0, -1) + offsetString;
            
            // Get current interaction count
            const interactionCount = parseInt(scormAPI.GetValue("cmi.interactions._count") || "0");
            const index = interactionCount;
            
            // Set interaction data in Storyline format
            const questionId = config.questionid || `Essay_${id}`;
            const questionText = config.label || 'Essay Question';
            
            scormAPI.SetValue(`cmi.interactions.${index}.id`, questionId);
            scormAPI.SetValue(`cmi.interactions.${index}.type`, "fill-in");
            scormAPI.SetValue(`cmi.interactions.${index}.timestamp`, timestamp);
            scormAPI.SetValue(`cmi.interactions.${index}.description`, questionText);
            scormAPI.SetValue(`cmi.interactions.${index}.learner_response`, text);
            scormAPI.SetValue(`cmi.interactions.${index}.result`, "neutral");
            scormAPI.SetValue(`cmi.interactions.${index}.latency`, latency);
            
            // Update completion status
            scormAPI.SetValue("cmi.completion_status", "completed");
            scormAPI.SetValue("cmi.success_status", "passed");
            
            // Commit the data
            const commitResult = scormAPI.Commit("");
            
            if (commitResult === "true") {
                // Update saved state
                essay.savedText = text;
                essay.savedAt = Date.now();
                return { success: true, message: 'Saved to LMS successfully' };
            } else {
                return { success: false, message: 'Failed to commit to LMS' };
            }
            
        } catch(e) {
            console.error('SCORM save error:', e);
            return { success: false, message: e.message };
        }
    }
    
    // Attach event handlers to essay box
    function attachHandlers(id, config) {
        const textarea = document.getElementById(`essay-input-${id}`);
        const charCount = document.getElementById(`essay-charcount-${id}`);
        const saveBtn = document.getElementById(`essay-save-${id}`);
        const clearBtn = document.getElementById(`essay-clear-${id}`);
        const status = document.getElementById(`essay-status-${id}`);
        const result = document.getElementById(`essay-result-${id}`);
        
        if (!textarea) return;
        
        const minLength = parseInt(config.minlength || 10);
        
        // Initialize essay instance tracking
        if (!essayInstances.has(id)) {
            essayInstances.set(id, {
                startTime: Date.now(),
                savedText: '',
                savedAt: null,
                config: config
            });
        }
        
        // Character count and validation
        const updateCharCount = () => {
            const length = textarea.value.length;
            const isValid = length >= minLength;
            
            charCount.textContent = `${length} characters (min: ${minLength})`;
            charCount.style.color = isValid ? '#28a745' : '#666';
            
            // Enable/disable save button
            saveBtn.disabled = !isValid;
            saveBtn.style.opacity = isValid ? '1' : '0.5';
            saveBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
            
            // Check if content has changed since last save
            const essay = essayInstances.get(id);
            if (essay && essay.savedText && essay.savedText !== textarea.value) {
                status.textContent = '✏️ Modified';
                status.style.color = '#ff9800';
            }
        };
        
        textarea.addEventListener('input', updateCharCount);
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = '#0078D4';
        });
        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = '#ccc';
        });
        
        // Save button handler
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                
                if (text.length < minLength) {
                    result.innerHTML = `
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; 
                                    padding: 12px; border-radius: 4px; color: #721c24;">
                            Please enter at least ${minLength} characters.
                        </div>
                    `;
                    return;
                }
                
                status.textContent = '⏳ Saving...';
                
                // Save to SCORM or local storage
                const saveResult = scormAPI ? 
                    saveToSCORM(id, text, config) : 
                    { success: true, message: 'Saved locally (no LMS)' };
                
                if (saveResult.success) {
                    status.textContent = '✅ Saved';
                    status.style.color = '#28a745';
                    
                    result.innerHTML = `
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; 
                                    padding: 12px; border-radius: 4px;">
                            <strong style="color: #155724;">✅ Response saved!</strong><br>
                            <small style="color: #666;">${saveResult.message}</small>
                        </div>
                    `;
                    
                    // Temporarily change button appearance
                    saveBtn.textContent = '✅ Saved';
                    saveBtn.style.background = '#28a745';
                    setTimeout(() => {
                        saveBtn.textContent = '💾 Save Response';
                        saveBtn.style.background = '#0078D4';
                        result.innerHTML = '';
                    }, 3000);
                    
                } else {
                    status.textContent = '❌ Error';
                    status.style.color = '#dc3545';
                    
                    result.innerHTML = `
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; 
                                    padding: 12px; border-radius: 4px; color: #721c24;">
                            <strong>Save failed:</strong> ${saveResult.message}
                        </div>
                    `;
                }
                
                // Store locally as backup
                if (!scormAPI) {
                    window.EssayResponses = window.EssayResponses || {};
                    window.EssayResponses[id] = {
                        text: text,
                        timestamp: new Date().toISOString(),
                        config: config
                    };
                }
            });
        }
        
        // Clear button handler
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (textarea.value && !confirm('Clear your response?')) return;
                
                textarea.value = '';
                updateCharCount();
                status.textContent = 'Cleared';
                status.style.color = '#666';
                result.innerHTML = '';
                
                // Reset start time
                const essay = essayInstances.get(id);
                if (essay) {
                    essay.startTime = Date.now();
                }
            });
        }
        
        // Initial update
        updateCharCount();
    }
    
    // Scan for shortcodes and replace them
    function scanForShortcodes(root = document) {
        // Match [essay] with optional attributes
        const SHORTCODE_REGEX = /\[essay(?:\s+([^\]]+))?\]/gi;
        
        // Find all text nodes that might contain shortcodes
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement && 
                        node.parentElement.closest('[data-essay-processed="true"]')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return /\[essay/i.test(node.textContent) ? 
                        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const nodesToReplace = [];
        let node;
        while (node = walker.nextNode()) {
            nodesToReplace.push(node);
        }
        
        let replacedCount = 0;
        
        nodesToReplace.forEach(textNode => {
            const parent = textNode.parentElement;
            if (!parent) return;
            
            const text = textNode.textContent;
            const matches = [...text.matchAll(SHORTCODE_REGEX)];
            
            if (matches.length === 0) return;
            
            // For each match, create an essay box
            matches.forEach((match, idx) => {
                const fullMatch = match[0];
                const attributeString = match[1] || '';
                
                // Parse attributes
                const attrs = parseAttributes(attributeString);
                
                // Generate unique ID if not provided
                const id = attrs.id || `essay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Configuration from attributes
                const config = {
                    label: attrs.label || attrs.question || 'Please share your thoughts:',
                    placeholder: attrs.placeholder || 'Type your response here...',
                    minlength: attrs.minlength || attrs.min || '10',
                    questionid: attrs.questionid || `Essay_${id}`
                };
                
                // Create container
                const container = document.createElement('div');
                container.setAttribute('data-essay-processed', 'true');
                container.innerHTML = createEssayHTML(id, config);
                
                // Replace the text node with the container
                if (idx === 0) {
                    parent.replaceChild(container, textNode);
                } else {
                    parent.appendChild(container);
                }
                
                // Attach handlers after a brief delay to ensure DOM is ready
                setTimeout(() => attachHandlers(id, config), 10);
                
                replacedCount++;
                console.log(`Essay box created with ID: ${id}`);
            });
        });
        
        if (replacedCount > 0) {
            console.log(`✅ Replaced ${replacedCount} essay shortcode(s)`);
        }
        
        return replacedCount;
    }
    
    // Save all essays (useful for course completion)
    window.saveAllEssays = function() {
        let saved = 0;
        essayInstances.forEach((essay, id) => {
            const textarea = document.getElementById(`essay-input-${id}`);
            if (textarea && textarea.value.trim().length >= 10) {
                const result = saveToSCORM(id, textarea.value.trim(), essay.config);
                if (result.success) saved++;
            }
        });
        console.log(`Saved ${saved} essay responses`);
        return saved;
    };
    
    // Get all essay responses (for debugging/reporting)
    window.getAllEssayResponses = function() {
        const responses = {};
        essayInstances.forEach((essay, id) => {
            const textarea = document.getElementById(`essay-input-${id}`);
            if (textarea) {
                responses[id] = {
                    text: textarea.value,
                    config: essay.config,
                    saved: essay.savedText === textarea.value
                };
            }
        });
        return responses;
    };
    
    // Initialize the scanner
    function initialize() {
        console.log('Initializing essay scanner...');
        
        // Initial scan
        scanForShortcodes(document.body);
        
        // Watch for dynamic content
        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes might contain shortcodes
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            const text = node.textContent || '';
                            if (/\[essay/i.test(text)) {
                                shouldScan = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldScan) break;
            }
            
            if (shouldScan) {
                // Debounce the scan
                clearTimeout(initialize.scanTimeout);
                initialize.scanTimeout = setTimeout(() => {
                    scanForShortcodes(document.body);
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Essay scanner initialized and watching for changes');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose manual trigger for debugging
    window.forceEssayScan = () => scanForShortcodes(document.body);
    
    // Log instructions
    console.log(`
📝 Essay Box Instructions:
- Use shortcode: [essay] or [essay id="q1" label="Your question here"]
- Available attributes:
  - id: Unique identifier (auto-generated if not provided)
  - label/question: The prompt text
  - placeholder: Placeholder text for textarea
  - minlength/min: Minimum character count (default: 10)
  - questionid: SCORM question ID for reporting

Example: [essay id="reflection1" label="What did you learn today?" minlength="20"]

Debug commands:
- window.forceEssayScan() - Manually scan for shortcodes
- window.saveAllEssays() - Save all essay responses
- window.getAllEssayResponses() - Get all current responses
    `);
    
})();
