// Ask Andraax - Lightweight Q&A Interface
// Calls the Nomikos API with Andraax persona (no chat history)

const API_BASE_URL = 'https://nomikos-api.vroomfogle.com';

// DOM Elements
const questionForm = document.getElementById('questionForm');
const questionInput = document.getElementById('question');
const submitButton = document.getElementById('submitButton');
const buttonText = document.getElementById('buttonText');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorContainer = document.getElementById('errorContainer');
const answerContainer = document.getElementById('answerContainer');
const answerText = document.getElementById('answerText');

// Handle form submission
questionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = questionInput.value.trim();
    if (!question) return;

    // Reset UI
    errorContainer.innerHTML = '';
    answerContainer.classList.remove('visible');
    submitButton.disabled = true;
    buttonText.textContent = '...';
    loadingIndicator.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: question
                    }
                ],
                persona: 'andraax',
            }),
        });

        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract answer from OpenAI-style response format
        const answer = data.choices?.[0]?.message?.content 
            || data.response 
            || data.answer 
            || 'The ancient elf remains silent...';
        
        // Convert markdown-style formatting to HTML
        const formattedAnswer = answer
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // Bold: **text**
            .replace(/\*(.+?)\*/g, '<em>$1</em>')              // Italic: *text*
            .replace(/\n\n/g, '</p><p style="margin-top: 1rem;">')  // Paragraphs with spacing
            .replace(/\n/g, '<br>');                            // Line breaks
        
        // Display answer
        answerText.innerHTML = `<p>${formattedAnswer}</p>`;
        answerContainer.classList.add('visible');

        // Scroll to answer
        setTimeout(() => {
            answerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

    } catch (error) {
        console.error('Error asking Andraax:', error);
        showError(`Failed to reach Andraax: ${error.message}. Please try again.`);
    } finally {
        // Reset form state
        submitButton.disabled = false;
        buttonText.textContent = '?';
        loadingIndicator.style.display = 'none';
    }
});

// Show error message
function showError(message) {
    errorContainer.innerHTML = `
        <div class="error-message">
            ⚠️ ${message}
        </div>
    `;
}

// Auto-resize textarea as user types
questionInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Allow Enter to submit (Shift+Enter for new line)
questionInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        questionForm.dispatchEvent(new Event('submit'));
    }
});

// Clear answer when user starts typing a new question
questionInput.addEventListener('focus', () => {
    if (answerContainer.classList.contains('visible')) {
        // Optional: could add a "Ask another question" flow here
    }
});

// Easter egg console message
console.log('%c🔮 Consulting Andraax... 🔮', 'font-size: 16px; color: #8B5CF6; font-weight: bold;');
console.log('%cAPI Endpoint: ' + API_BASE_URL, 'font-size: 12px; color: #FBBF24;');
console.log('%cPersona: andraax (cryptic ancient elf)', 'font-size: 12px; color: #8B5CF6;');
