const serverUrl = "https://allowlist-pcrp-application.onrender.com"
//const serverUrl = "http://localhost:3000"

const blacklist = ["fuck", "sex", "noob", "shit"]; // Add your blacklisted names here

const isBlacklisted = (value) => {
    const lowerValue = value.toLowerCase();
    return blacklist.some(word => lowerValue.includes(word.toLowerCase()));
}

document.getElementById('allowlistForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const characterName = document.getElementById('characterName').value.trim();
    const characterNationality = document.getElementById('characterNationality').value;
    const discordId = document.getElementById('discordId').value;
    const linked = document.querySelector('input[name="linked"]:checked');
    
    let valid = true;

    // Clear previous error messages
    document.getElementById('characterNameError').style.display = 'none';
    document.getElementById('characterNationalityError').style.display = 'none';
    document.getElementById('discordIdError').style.display = 'none';
    document.getElementById('linkedError').style.display = 'none';

    // Validate character name
    const nameParts = characterName.split(" ");
    if (nameParts.length < 2 || isBlacklisted(characterName)) {
        document.getElementById('characterNameError').style.display = 'block';
        valid = false;
    }

    // Validate character nationality
    if (!characterNationality) {
        document.getElementById('characterNationalityError').style.display = 'block';
        valid = false;
    }

    // Validate Discord ID (pattern check)
    const discordIdPattern = /^\d{18}$/;
    if (!discordIdPattern.test(discordId)) {
        document.getElementById('discordIdError').style.display = 'block';
        valid = false;
    }

    // Validate linked option
    if (!linked) {
        document.getElementById('linkedError').style.display = 'block';
        valid = false;
    }

    if (valid) {
        alert('Form submitted successfully!');
        // Perform further actions such as sending data to the server
        // Example: send data to your backend server using fetch or axios
        const formData = {
            characterName,
            characterNationality,
            discordId,
            linked: linked.value
        };

        fetch(`${serverUrl}/api/submit-form`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message !== 'Success') {
                console.log('Error submitting form.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});

// Disable Right Click
document.addEventListener('contextmenu', event => event.preventDefault());
// Disable F12 key and Ctrl+Shift+I combo
document.addEventListener('keydown', event => {
    if (event.keyCode === 123 || (event.ctrlKey && event.shiftKey && event.keyCode === 73)) {
      event.preventDefault();
    }
});