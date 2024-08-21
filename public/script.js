const serverUrl = "https://allowlist.pcrp.store"
// const serverUrl = "http://localhost:3000"

const blacklist = ["fuck", "sex", "noob", "shit", "chutiya", "gandu", "lavda", "none"];

const isBlacklisted = (value) => {
    const lowerValue = value.toLowerCase();
    return blacklist.some(word => lowerValue.includes(word.toLowerCase()));
}

document.getElementById('allowlistForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const characterName = document.getElementById('characterName').value.trim();
    const characterNationality = document.getElementById('characterNationality').value;
    const discordId = document.getElementById('discordId').value.trim();
    const linked = document.querySelector('input[name="linked"]:checked');
    const submitBtn = document.getElementById('submitBtn');
    const submitMessage = document.getElementById('submitMessage');
    
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

    const isValidDiscordId = await fetch(`${serverUrl}/api/validate-discord`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ discordId })
    }).then(response => response.json());

    if (!isValidDiscordId.valid) {
        document.getElementById('discordIdError').style.display = 'block';
        valid = false;
    }

    if (!linked) {
        document.getElementById('linkedError').style.display = 'block';
        valid = false;
    }

    if (valid) {
        submitBtn.disabled = true;
        submitMessage.style.display = 'block';
        submitMessage.innerHTML = 'Form Submitted Successfully!';

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

$('body').keydown(function(e) {
    if(e.which==123){
        e.preventDefault();
    }
    if(e.ctrlKey && e.shiftKey && e.which == 73){
        e.preventDefault();
    }
    if(e.ctrlKey && e.shiftKey && e.which == 75){
        e.preventDefault();
    }
    if(e.ctrlKey && e.shiftKey && e.which == 67){
        e.preventDefault();
    }
    if(e.ctrlKey && e.shiftKey && e.which == 74){
        e.preventDefault();
    }
});
!function() {
    function detectDevTool(allow) {
        if(isNaN(+allow)) allow = 100;
        var start = +new Date();
        debugger;
        var end = +new Date();
        if(isNaN(start) || isNaN(end) || end - start > allow) {
            console.log('DEVTOOLS detected '+allow);
        }
    }
    if(window.attachEvent) {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            detectDevTool();
          window.attachEvent('onresize', detectDevTool);
          window.attachEvent('onmousemove', detectDevTool);
          window.attachEvent('onfocus', detectDevTool);
          window.attachEvent('onblur', detectDevTool);
        } else {
            setTimeout(argument.callee, 0);
        }
    } else {
        window.addEventListener('load', detectDevTool);
        window.addEventListener('resize', detectDevTool);
        window.addEventListener('mousemove', detectDevTool);
        window.addEventListener('focus', detectDevTool);
        window.addEventListener('blur', detectDevTool);
    }
}();