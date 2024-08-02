const serverUrl = "https://allowlist-pcrp-application.onrender.com"
// const serverUrl = "http://localhost:3000"

const blacklist = ["fuck", "sex", "noob", "shit", "chutiya", "gandu", "lavda", "none"];

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

    document.getElementById('characterNameError').style.display = 'none';
    document.getElementById('characterNationalityError').style.display = 'none';
    document.getElementById('discordIdError').style.display = 'none';
    document.getElementById('linkedError').style.display = 'none';

    const nameParts = characterName.split(" ");
    if (nameParts.length < 2 || isBlacklisted(characterName)) {
        document.getElementById('characterNameError').style.display = 'block';
        valid = false;
    }

    if (!characterNationality) {
        document.getElementById('characterNationalityError').style.display = 'block';
        valid = false;
    }

    const discordIdPattern = /^\d{18}$/;
    if (!discordIdPattern.test(discordId)) {
        document.getElementById('discordIdError').style.display = 'block';
        valid = false;
    }

    if (!linked) {
        document.getElementById('linkedError').style.display = 'block';
        valid = false;
    }

    if (valid) {
        const submitMessage = document.getElementById('submitMessage')
        submitMessage.style.display = 'block';
        submitMessage.innerHTML = 'Form Submitted Successfully!';
        setTimeout(() => {
            submitMessage.style.display = 'none';
            submitMessage.innerHTML = '';
        }, 8000)

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

document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', event => {
    if (event.keyCode === 123 || (event.ctrlKey && event.shiftKey && event.keyCode === 73)) {
      event.preventDefault();
    }
});